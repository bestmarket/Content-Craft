import { db } from "@workspace/db";
import { automationToolsTable, automationRunsTable, automationBlocksTable } from "@workspace/db";
import { eq, and, or, isNull, lte, sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import { callGeminiFallback, callGroqRotated, callAnthropicFallback } from "./routes/ai-utils";
import { processAllDueEmails } from "./routes/email-marketing";

// ─── How often the scheduler checks for due automations ───────────────────
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes
const MAX_CONCURRENT = 3; // max tools running at the same time

// ─── Frequency definitions ─────────────────────────────────────────────────
const FREQUENCY_HOURS: Record<string, number> = {
  every_hour:    1,
  every_6_hours: 6,
  twice_daily:   12,
  daily:         24,
  weekdays:      24,
  weekly:        168,
};

function isDue(tool: any): boolean {
  if (!tool.isScheduled || !tool.scheduleFrequency) return false;
  const hours = FREQUENCY_HOURS[tool.scheduleFrequency];
  if (!hours) return false;

  // weekdays: skip Sat (6) and Sun (0)
  if (tool.scheduleFrequency === "weekdays") {
    const day = new Date().getDay();
    if (day === 0 || day === 6) return false;
  }

  if (!tool.lastRunAt) return true; // never run before → run now

  const lastRun = new Date(tool.lastRunAt).getTime();
  const now = Date.now();
  const msRequired = hours * 60 * 60 * 1000;
  return now - lastRun >= msRequired;
}

// ─── AI execution for one block step ──────────────────────────────────────
async function executeBlock(block: any, config: Record<string, string>, previousOutput: string): Promise<string> {
  let prompt = block.aiPrompt as string;
  const inputs: Record<string, string> = { ...config };
  if (previousOutput && !prompt.includes("{content}") && !prompt.includes("{previous_output}")) {
    prompt += `\n\nContext from previous step:\n${previousOutput}`;
  }
  if (previousOutput) inputs["previous_output"] = previousOutput;
  for (const [key, value] of Object.entries(inputs)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  }
  prompt = prompt.replace(/\{[^}]+\}/g, "");

  const msgs = [{ role: "user", content: prompt }];
  try {
    const r = await callGroqRotated(msgs, 800);
    if (r?.text) return r.text;
  } catch { /* fall through */ }
  try {
    const r = await callGeminiFallback(msgs, "", 800);
    if (r?.text) return r.text;
  } catch { /* fall through */ }
  const r = await callAnthropicFallback(msgs, "", 800);
  return r?.text ?? "";
}

// ─── Run a single scheduled tool ──────────────────────────────────────────
async function runScheduledTool(tool: any, allBlocks: Map<number, any>): Promise<void> {
  const startTime = Date.now();
  let runId: number | null = null;

  try {
    const [run] = await db.insert(automationRunsTable).values({
      toolId: tool.id,
      userId: tool.userId,
      status: "running",
      inputs: {},
    }).returning();
    runId = run.id;

    const steps: any[] = Array.isArray(tool.steps) ? tool.steps : [];
    const stepOutputs: any[] = [];
    let previousOutput = "";
    let finalOutput = "";

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const block = allBlocks.get(step.blockId);
      if (!block) continue;
      const config = step.config || {};
      const output = await executeBlock(block, config, previousOutput);
      stepOutputs.push({ stepIndex: i, blockId: step.blockId, blockName: block.name, output, config });
      previousOutput = output;
      finalOutput = output;
    }

    const duration = Date.now() - startTime;
    await db.update(automationRunsTable).set({
      status: "success", stepOutputs, finalOutput, duration, completedAt: new Date(),
    }).where(eq(automationRunsTable.id, runId!));

    await db.update(automationToolsTable).set({
      runCount: sql`${automationToolsTable.runCount} + 1`,
      lastRunAt: new Date(),
    }).where(eq(automationToolsTable.id, tool.id));

    logger.info({ toolId: tool.id, toolName: tool.name, duration }, "✅ Scheduled automation completed");
  } catch (err: any) {
    if (runId) {
      await db.update(automationRunsTable).set({
        status: "failed", error: err.message, completedAt: new Date(),
      }).where(eq(automationRunsTable.id, runId));
    }
    // Still update lastRunAt so we don't retry immediately on failure
    await db.update(automationToolsTable).set({ lastRunAt: new Date() })
      .where(eq(automationToolsTable.id, tool.id));

    logger.error({ toolId: tool.id, err: err.message }, "❌ Scheduled automation failed");
  }
}

// ─── Main scheduler tick ───────────────────────────────────────────────────
async function schedulerTick(): Promise<void> {
  // Process due email sequences first (lightweight, runs every tick)
  await processAllDueEmails();

  try {
    const scheduledTools = await db.select().from(automationToolsTable)
      .where(eq(automationToolsTable.isScheduled, true));

    if (scheduledTools.length === 0) return;

    const dueTools = scheduledTools.filter(isDue);
    if (dueTools.length === 0) return;

    logger.info({ dueCount: dueTools.length }, "⏰ Scheduler: found due automations");

    const allBlocks = await db.select().from(automationBlocksTable)
      .where(eq(automationBlocksTable.isActive, true));
    const blockMap = new Map(allBlocks.map((b) => [b.id, b]));

    // Run in batches of MAX_CONCURRENT
    for (let i = 0; i < dueTools.length; i += MAX_CONCURRENT) {
      const batch = dueTools.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(batch.map((tool) => runScheduledTool(tool, blockMap)));
      // Brief pause between batches
      if (i + MAX_CONCURRENT < dueTools.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "Scheduler tick error");
  }
}

// ─── Public: single tick (used by the Vercel cron HTTP endpoint) ──────────
export async function runSchedulerTick(): Promise<void> {
  return schedulerTick();
}

// ─── Public: start the scheduler ──────────────────────────────────────────
export function startScheduler(): void {
  logger.info({ intervalMinutes: CHECK_INTERVAL_MS / 60000 }, "⏰ Automation scheduler started");

  // Run first tick after 2 minutes (let server warm up)
  setTimeout(() => {
    schedulerTick();
    setInterval(schedulerTick, CHECK_INTERVAL_MS);
  }, 2 * 60 * 1000);
}
