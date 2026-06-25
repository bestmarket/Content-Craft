import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { generate, getStyleOptions, getToneOptions, getLengthOptions } from "../lib/scryvox/index";
import type { WritingStyle, WritingTone, ContentLength, AudienceType } from "../lib/scryvox/index";
import { applyDeepIntelligence } from "../lib/scryvox/deep-intelligence";

const router = Router();

const VALID_STYLES: WritingStyle[] = ["youtube","storytelling","persuasive","conversational","professional","blog","email","podcast","linkedin","pdf_chapter","twitter_thread","poetic"];
const VALID_TONES: WritingTone[] = ["empathetic","fired_up","serious","reflective","humorous","inspiring","raw","wise"];
const VALID_LENGTHS: ContentLength[] = ["micro","short","medium","long","epic"];
const VALID_AUDIENCES: AudienceType[] = ["general","expert","beginner","youth","professional"];

async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    return row?.value ?? fallback;
  } catch { return fallback; }
}

async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select({ key: settingsTable.key }).from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value });
  }
}

router.get("/scryvox/options", requireAuth, (_req, res) => {
  res.json({
    styles: getStyleOptions(),
    tones: getToneOptions(),
    lengths: getLengthOptions(),
    audiences: [
      { value: "general", label: "General Audience" },
      { value: "expert", label: "Expert / Advanced" },
      { value: "beginner", label: "Beginner / Newcomer" },
      { value: "youth", label: "Youth / Gen Z" },
      { value: "professional", label: "Professional / Corporate" },
    ],
  });
});

router.post("/scryvox/generate", requireAuth, async (req: any, res) => {
  try {
    const { topic, style, tone, length, audience, variation, keyPoints } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      res.status(400).json({ error: "Topic is required (min 3 characters)" });
      return;
    }

    const resolvedStyle: WritingStyle = VALID_STYLES.includes(style) ? style : "blog";
    const resolvedTone: WritingTone = VALID_TONES.includes(tone) ? tone : "inspiring";
    const resolvedLength: ContentLength = VALID_LENGTHS.includes(length) ? length : "medium";
    const resolvedAudience: AudienceType = VALID_AUDIENCES.includes(audience) ? audience : "general";
    const resolvedVariation = Math.max(1, Math.min(5, Number(variation) || 1));

    const rawTopic = topic.trim().slice(0, 300);

    // ── Deep Intelligence: refine the topic intellectually before generating.
    // Scryvox never echoes input word-for-word — the deep intelligence layer
    // reframes it as an elevated question before content is built.
    const deepFrame = applyDeepIntelligence(rawTopic, resolvedVariation);

    const output = generate({
      topic: rawTopic,
      style: resolvedStyle,
      tone: resolvedTone,
      length: resolvedLength,
      audience: resolvedAudience,
      variation: resolvedVariation,
      keyPoints: Array.isArray(keyPoints) ? keyPoints.slice(0, 5) : [],
    });

    res.json({
      success: true,
      output,
      intelligence: {
        refinedTopic: deepFrame.intellectualReframe,
        philosophicalRoot: deepFrame.philosophicalRoot,
        coreParadox: deepFrame.paradoxAtCore,
        deepQuestion: deepFrame.deepQuestion,
        firstPrinciple: deepFrame.firstPrinciplesBreakdown[0],
        wisdomLayer: deepFrame.wisdomLayer,
        systemsView: deepFrame.systemsThinkingLens.slice(0, 200),
        reasoningChain: deepFrame.reasoningChain,
        cognitiveDepth: deepFrame.cognitiveDepthLevel,
      },
    });
  } catch (err: any) {
    req.log?.error({ err }, "Scryvox generate error");
    res.status(500).json({ error: "Generation failed", details: err?.message });
  }
});

// ── Variation Audit ──────────────────────────────────────────────────────────
// Generates 3 variations of the same topic and scores vocabulary diversity.
// Returns side-by-side comparison: titles, hooks, word sets, Jaccard overlap.
router.get("/scryvox/audit", requireAuth, (req: any, res) => {
  try {
    const topic = typeof req.query.topic === "string" ? req.query.topic.trim() : "";
    const style = typeof req.query.style === "string" && VALID_STYLES.includes(req.query.style as any) ? req.query.style as WritingStyle : "blog";
    const tone = typeof req.query.tone === "string" && VALID_TONES.includes(req.query.tone as any) ? req.query.tone as WritingTone : "inspiring";
    const length = typeof req.query.length === "string" && VALID_LENGTHS.includes(req.query.length as any) ? req.query.length as ContentLength : "short";

    if (!topic || topic.length < 3) {
      res.status(400).json({ error: "topic query param required (min 3 chars)" });
      return;
    }

    // Generate 3 variations (0, 1, 2 are seed offsets; API uses 1-indexed so we pass 1,2,3)
    const variations = [1, 2, 3].map(v =>
      generate({ topic, style, tone, length, audience: "general", variation: v, keyPoints: [] })
    );

    // Vocabulary scoring — tokenise to lowercase words, compute Jaccard pairwise
    function wordSet(text: string): Set<string> {
      return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3));
    }
    function jaccard(a: Set<string>, b: Set<string>): number {
      const intersection = [...a].filter(w => b.has(w)).length;
      const union = new Set([...a, ...b]).size;
      return union === 0 ? 0 : Math.round((intersection / union) * 100) / 100;
    }

    const texts = variations.map(v => v.formattedOutput.plainText);
    const wordSets = texts.map(wordSet);
    const overlap_01 = jaccard(wordSets[0], wordSets[1]);
    const overlap_02 = jaccard(wordSets[0], wordSets[2]);
    const overlap_12 = jaccard(wordSets[1], wordSets[2]);
    const avgOverlap = Math.round(((overlap_01 + overlap_02 + overlap_12) / 3) * 100) / 100;
    const diversityScore = Math.round((1 - avgOverlap) * 100);

    const summaries = variations.map((v, i) => ({
      variation: i + 1,
      title: v.title,
      hook: v.hook.slice(0, 200) + (v.hook.length > 200 ? "…" : ""),
      wordCount: v.metadata.wordCount,
      uniqueWords: wordSets[i].size,
      domain: v.metadata.domain,
      viralScore: v.metadata.viralScore,
      humanScore: v.metadata.humanScore,
    }));

    res.json({
      topic,
      style,
      tone,
      diversityScore,
      interpretation: diversityScore >= 70 ? "Excellent variation" : diversityScore >= 50 ? "Good variation" : diversityScore >= 30 ? "Moderate variation — consider adjusting style/tone" : "Low variation — consider changing the topic framing",
      pairwiseOverlap: {
        "v1-v2": overlap_01,
        "v1-v3": overlap_02,
        "v2-v3": overlap_12,
        avgOverlap,
      },
      variations: summaries,
    });
  } catch (err: any) {
    req.log?.error({ err }, "Scryvox audit error");
    res.status(500).json({ error: "Audit failed", details: err?.message });
  }
});

router.get("/scryvox/settings", requireAdmin, async (_req, res) => {
  try {
    const [enabled, mode, defaultStyle, defaultTone, defaultLength] = await Promise.all([
      getSetting("scryvox_enabled", "true"),
      getSetting("scryvox_mode", "studio_only"),
      getSetting("scryvox_default_style", "blog"),
      getSetting("scryvox_default_tone", "inspiring"),
      getSetting("scryvox_default_length", "medium"),
    ]);
    res.json({ enabled: enabled === "true", mode, defaultStyle, defaultTone, defaultLength });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.put("/scryvox/settings", requireAdmin, async (req, res) => {
  try {
    const { enabled, mode, defaultStyle, defaultTone, defaultLength } = req.body;
    const updates: Promise<void>[] = [];

    if (typeof enabled === "boolean") updates.push(setSetting("scryvox_enabled", enabled ? "true" : "false"));
    if (["studio_only", "all_system", "none"].includes(mode)) updates.push(setSetting("scryvox_mode", mode));
    if (VALID_STYLES.includes(defaultStyle)) updates.push(setSetting("scryvox_default_style", defaultStyle));
    if (VALID_TONES.includes(defaultTone)) updates.push(setSetting("scryvox_default_tone", defaultTone));
    if (VALID_LENGTHS.includes(defaultLength)) updates.push(setSetting("scryvox_default_length", defaultLength));

    await Promise.all(updates);
    res.json({ success: true, message: "Scryvox settings saved" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
