import { Router } from "express";
import { db } from "@workspace/db";
import {
  automationToolsTable,
  automationRunsTable,
  automationInstallsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

// ─── GET /admin/automations/overview ──────────────────────────────────────
router.get("/admin/automations/overview", requireAdmin, async (_req, res) => {
  try {
    const [toolCount] = await db.select({ count: count() }).from(automationToolsTable);
    const [publishedCount] = await db.select({ count: count() }).from(automationToolsTable)
      .where(eq(automationToolsTable.isPublished, true));
    const [scheduledCount] = await db.select({ count: count() }).from(automationToolsTable)
      .where(eq(automationToolsTable.isScheduled, true));
    const [runCount] = await db.select({ count: count() }).from(automationRunsTable);
    const [installCount] = await db.select({ count: count() }).from(automationInstallsTable);
    const [successCount] = await db.select({ count: count() }).from(automationRunsTable)
      .where(eq(automationRunsTable.status, "success"));
    const [failedCount] = await db.select({ count: count() }).from(automationRunsTable)
      .where(eq(automationRunsTable.status, "failed"));
    const [revenue] = await db.select({
      total: sum(automationToolsTable.totalRevenue),
    }).from(automationToolsTable);

    res.json({
      tools: toolCount.count,
      published: publishedCount.count,
      scheduled: scheduledCount.count,
      runs: runCount.count,
      installs: installCount.count,
      successRuns: successCount.count,
      failedRuns: failedCount.count,
      totalRevenue: parseFloat(revenue.total as string || "0"),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /admin/automations/tools ─────────────────────────────────────────
router.get("/admin/automations/tools", requireAdmin, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string || "1");
    const limit = 30;
    const offset = (page - 1) * limit;

    const tools = await db.select({
      tool: automationToolsTable,
      creatorName: usersTable.name,
      creatorEmail: usersTable.email,
    }).from(automationToolsTable)
      .leftJoin(usersTable, eq(automationToolsTable.userId, usersTable.id))
      .orderBy(desc(automationToolsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() }).from(automationToolsTable);

    res.json({
      tools: tools.map(t => ({
        ...t.tool,
        creatorName: t.creatorName,
        creatorEmail: t.creatorEmail,
      })),
      total: total.count,
      page,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /admin/automations/runs ──────────────────────────────────────────
router.get("/admin/automations/runs", requireAdmin, async (req: any, res) => {
  try {
    const limit = 40;
    const runs = await db.select({
      run: automationRunsTable,
      toolName: automationToolsTable.name,
      toolEmoji: automationToolsTable.emoji,
      userName: usersTable.name,
      userEmail: usersTable.email,
    }).from(automationRunsTable)
      .leftJoin(automationToolsTable, eq(automationRunsTable.toolId, automationToolsTable.id))
      .leftJoin(usersTable, eq(automationRunsTable.userId, usersTable.id))
      .orderBy(desc(automationRunsTable.startedAt))
      .limit(limit);

    res.json({
      runs: runs.map(r => ({
        ...r.run,
        toolName: r.toolName,
        toolEmoji: r.toolEmoji,
        userName: r.userName,
        userEmail: r.userEmail,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /admin/automations/tools/:id/block ──────────────────────────────
router.post("/admin/automations/tools/:id/block", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { blocked } = req.body;
    const [tool] = await db.update(automationToolsTable)
      .set({ isPublished: !blocked, updatedAt: new Date() })
      .where(eq(automationToolsTable.id, id))
      .returning();
    if (!tool) res.status(404).json({ error: "Tool not found" }); return;
    res.json({ tool, message: blocked ? "Tool removed from marketplace" : "Tool restored to marketplace" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /admin/automations/tools/:id ──────────────────────────────────
router.delete("/admin/automations/tools/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(automationRunsTable).where(eq(automationRunsTable.toolId, id));
    await db.delete(automationInstallsTable).where(eq(automationInstallsTable.toolId, id));
    await db.delete(automationToolsTable).where(eq(automationToolsTable.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
