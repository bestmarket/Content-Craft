import { Router } from "express";
import { db } from "@workspace/db";
import { contentHistoryTable, promptsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth } from "./auth";
import { requireFeature } from "./features";
import { requireCredits } from "./credits";
import { callAIWithMeta, GenerationMeta } from "./ai-utils";

const router = Router();

/**
 * Convenience wrapper — returns just the text string.
 * Throws when all providers fail (no silent demo-content fallback).
 * Used by scripts, landing-page, chat, video-model, products callers.
 */
export async function callAI(prompt: string, systemPrompt: string, feature?: string): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];
  const { text } = await callAIWithMeta(messages, systemPrompt, 4096, 0.8, "[AI]", feature);
  return text;
}

export { callAIWithMeta };

function parseContentFromAI(raw: string, platform: string, topic: string): any {
  try {
    const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      return parsed;
    }
  } catch {}

  const titles = [];
  const titleMatches = raw.match(/Title \d+[:\-]\s*(.+?)(?:\s*\[Virality[:\s]*(\d+)\])?$/gim) ?? [];
  for (let i = 0; i < 5; i++) {
    const match = titleMatches[i];
    if (match) {
      const titleText = match.replace(/Title \d+[:\-]\s*/i, "").replace(/\[Virality[:\s]*\d+\]/i, "").trim();
      const scoreMatch = match.match(/(\d+)/g);
      const score = scoreMatch ? parseInt(scoreMatch[scoreMatch.length - 1]) : Math.floor(Math.random() * 30 + 60);
      titles.push({ title: titleText, viralityScore: score });
    } else {
      titles.push({ title: `${topic}: ${["The Ultimate Guide", "Complete Tutorial", "Pro Tips", "Secrets Revealed", "Step by Step"][i]}`, viralityScore: Math.floor(Math.random() * 30 + 60) });
    }
  }

  const scriptMatch = raw.match(/(?:Script|Content)[:\n]([\s\S]*?)(?:Description:|Tags:|$)/i);
  const descMatch = raw.match(/Description[:\n]([\s\S]*?)(?:Tags:|Hashtags:|$)/i);
  const tagsMatch = raw.match(/Tags[:\n]([\s\S]*?)(?:Hashtags:|$)/i);
  const hashtagsMatch = raw.match(/Hashtags[:\n]([\s\S]*?)$/i);

  return {
    titles,
    script: scriptMatch?.[1]?.trim() ?? raw,
    description: descMatch?.[1]?.trim() ?? `Discover everything about ${topic} in this comprehensive guide.`,
    tags: (tagsMatch?.[1]?.split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean) ?? [topic, platform]),
    hashtags: (hashtagsMatch?.[1]?.match(/#\w+/g) ?? [`#${topic.replace(/\s+/g, "")}`, `#${platform}`]),
  };
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  viral_hook: "Use powerful curiosity gaps and pattern-interrupting hooks. Open with something that stops the scroll immediately. Every line must make them want to read the next one.",
  emotional: "Lead with deep human emotion — vulnerability, struggle, breakthrough. Tell a story that makes the audience feel something real. Use specific details that create vivid mental images.",
  motivational: "Inspire action. Use energetic, empowering language. Build momentum from line one. Create a sense of urgency and possibility. Make the reader believe in themselves.",
  comedic: "Be genuinely funny with relatable situations, unexpected twists, and dry wit. Use timing, contrast, and self-awareness. Avoid forced humor — aim for natural laughs.",
  conversational: "Write exactly how a trusted friend would talk. Use casual language, contractions, direct address. Short punchy sentences. Like a real person, not a robot.",
  friendly: "Warm, approachable, and encouraging. Like talking to your most supportive mentor. Positive energy without being fake. Make the reader feel seen and supported.",
  educational: "Teach clearly and memorably. Use the 'explain it like I'm new' approach. Include analogies, examples, and practical takeaways. Make complex things simple.",
  suspenseful: "Build tension from the very first line. Use cliffhangers between sections. Create a sense that something important is about to be revealed. Keep them guessing.",
};

const PLATFORM_SYSTEM_PROMPTS: Record<string, string> = {
  youtube: "You specialize in YouTube video scripts. You understand long-form retention psychology — strong hook in first 30 seconds, pattern interrupts every 90 seconds, satisfying payoff. Chapters feel natural. CTAs are not pushy.",
  tiktok: "You specialize in TikTok/short-form content. You write for maximum first-3-second hooks. Scripts are fast, punchy, visual. Every line must earn the next swipe. Text overlays and transitions are implied in the structure.",
  facebook: "You specialize in Facebook content that sparks conversation and shares. Write for emotional resonance and relatability. Facebook audiences respond to personal stories, bold opinions, and community-building posts.",
  instagram: "You specialize in Instagram content — both captions and Reels scripts. Use aesthetic language, aspirational tone, and strategic line breaks. Captions must stop the scroll and drive saves.",
  twitter: "You specialize in Twitter/X threads and posts. Write with intellectual punch, contrarian angles, and quotable one-liners. Threads should have a strong opener and a satisfying final tweet.",
};

router.post("/content/generate", requireAuth, requireFeature("ai_content"), requireCredits("ai_content"), async (req: any, res) => {
  const { platform, topic, wordCount, stylePromptId, outputMode, tone } = req.body;

  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.viral_hook;
  const platformExpertise = PLATFORM_SYSTEM_PROMPTS[platform] ?? PLATFORM_SYSTEM_PROMPTS.youtube;

  let systemPrompt = `You are a world-class viral content creator — the kind of person brands pay $50,000 for a single script. ${platformExpertise}

TONE: ${toneInstruction}

CRITICAL RULES:
- NEVER use generic AI phrases like "In today's video", "Hey guys", "Don't forget to like and subscribe" as openers
- NEVER sound robotic or corporate
- ALWAYS write like a real human creator with personality
- Hooks must be specific, not generic — avoid "In this video I'll show you..."
- Use emotional triggers, curiosity gaps, and relatable moments
- Every sentence must earn its place — no filler
- Always respond in valid JSON format`;

  if (stylePromptId) {
    try {
      const [prompt] = await db.select().from(promptsTable).where(eq(promptsTable.id, stylePromptId)).limit(1);
      if (prompt?.isActive) {
        systemPrompt = prompt.systemPrompt;
        req.log.info({ promptId: stylePromptId, promptName: prompt.name }, "[Content] Using custom style prompt");
      }
    } catch (err) {
      req.log.warn({ err, stylePromptId }, "[Content] Failed to load style prompt — using default");
    }
  }

  const digestInstruction = outputMode === "digest"
    ? "Include detailed video action descriptions, image/video style prompts, scene descriptions, and b-roll suggestions between script sections [in brackets like this]."
    : "Provide only the clean script text without production notes.";

  const userPrompt = `Create viral ${platform} content about: "${topic}"

Target word count: ${wordCount} words (estimated ${Math.ceil(wordCount / 130)} minutes for video)
Content tone: ${tone ?? "viral_hook"}
${digestInstruction}

The titles MUST include strong emotional triggers, curiosity gaps, or bold promises. Rate each honestly.
The script must feel 100% human-written, not AI. Use the tone specified above throughout.

Respond ONLY in this exact JSON format:
{
  "titles": [
    {"title": "Title here", "viralityScore": 85},
    {"title": "Title here", "viralityScore": 78},
    {"title": "Title here", "viralityScore": 92},
    {"title": "Title here", "viralityScore": 71},
    {"title": "Title here", "viralityScore": 88}
  ],
  "script": "Full script/content text here...",
  "description": "Platform description here...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // ── AI generation — throws on total failure, no demo content ──
  let aiText: string;
  let generationMeta: GenerationMeta;
  try {
    const result = await callAIWithMeta(messages, systemPrompt, 4096, 0.8, "[Content]");
    aiText = result.text;
    generationMeta = result.meta;
  } catch (err: any) {
    req.log.error({ err: err.message, platform, topic, userId: req.userId }, "[Content] AI generation failed — no providers available");
    res.status(503).json({
      error: err.message,
      generationMeta: {
        generationStatus: "failed",
        fallbackUsed: true,
        providersAttempted: ["groq", "anthropic", "openai"],
        error: err.message,
      },
    });
    return;
  }

  const parsed = parseContentFromAI(aiText, platform, topic);

  const cleanScript = (parsed.script ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const actualWordCount = cleanScript ? cleanScript.split(/\s+/).filter(Boolean).length : (wordCount as number);
  const estimatedMinutes = Math.ceil(actualWordCount / 130);

  try {
    const [saved] = await db.insert(contentHistoryTable).values({
      userId: req.userId,
      platform: platform as any,
      topic,
      wordCount: actualWordCount,
      titles: parsed.titles,
      script: parsed.script,
      description: parsed.description,
      tags: parsed.tags,
      hashtags: parsed.hashtags,
      thumbnailUrl: null,
    }).returning();

    req.log.info({
      contentId: saved.id,
      provider: generationMeta.provider,
      model: generationMeta.model,
      inputTokens: generationMeta.inputTokens,
      outputTokens: generationMeta.outputTokens,
      responseLength: generationMeta.responseLength,
      fallbackUsed: generationMeta.fallbackUsed,
      platform,
      wordCount: actualWordCount,
    }, "[Content] Generation complete and saved");

    res.json({
      id: saved.id,
      titles: parsed.titles,
      script: parsed.script,
      description: parsed.description,
      tags: parsed.tags,
      hashtags: parsed.hashtags,
      thumbnailUrl: null,
      wordCount: actualWordCount,
      estimatedMinutes,
      generationMeta,
    });
  } catch (err) {
    req.log.error({ err }, "[Content] DB save error after successful generation");
    res.status(500).json({ error: "Content generated but failed to save. Please try again." });
  }
});

router.get("/content/history", requireAuth, async (req: any, res) => {
  try {
    const platform = req.query.platform as string | undefined;
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "20");
    const offset = (page - 1) * limit;

    const conditions = [eq(contentHistoryTable.userId, req.userId)];
    if (platform) conditions.push(eq(contentHistoryTable.platform, platform as any));

    const { and } = await import("drizzle-orm");
    const items = await db.select().from(contentHistoryTable)
      .where(and(...conditions))
      .orderBy(desc(contentHistoryTable.createdAt))
      .limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(contentHistoryTable)
      .where(and(...conditions));

    res.json({
      items: items.map(item => ({
        ...item,
        titles: (item.titles as any[]) ?? [],
        tags: (item.tags as string[]) ?? [],
        hashtags: (item.hashtags as string[]) ?? [],
        createdAt: item.createdAt.toISOString(),
      })),
      total: Number(total),
    });
  } catch (err) {
    req.log.error({ err }, "ListContentHistory error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/content/history/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(contentHistoryTable)
      .where(eq(contentHistoryTable.id, id)).limit(1);
    if (!item || item.userId !== req.userId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      ...item,
      titles: (item.titles as any[]) ?? [],
      tags: (item.tags as string[]) ?? [],
      hashtags: (item.hashtags as string[]) ?? [],
      createdAt: item.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "GetContentHistory error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/content/history/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdmin = req.userRole === "admin";
    const [item] = await db.select().from(contentHistoryTable)
      .where(eq(contentHistoryTable.id, id)).limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    if (!isAdmin && item.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    await db.delete(contentHistoryTable).where(eq(contentHistoryTable.id, id));
    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error({ err }, "DeleteContentHistory error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
