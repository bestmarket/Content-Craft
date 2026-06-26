import { Router } from "express";
import { db } from "@workspace/db";
import { contentHistoryTable, promptsTable, apiKeysTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

async function getActiveApiKey(provider: string): Promise<string | null> {
  const [key] = await db.select().from(apiKeysTable)
    .where(eq(apiKeysTable.provider, provider))
    .limit(1);
  return key?.isActive ? key.encryptedKey : null;
}

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const anthropicKey = await getActiveApiKey("claude") || await getActiveApiKey("anthropic");
  const openaiKey = await getActiveApiKey("openai");

  if (anthropicKey) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json() as any;
    return data.content?.[0]?.text ?? "";
  }

  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 4096,
      }),
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Fallback: generate placeholder content
  return generateFallbackContent(prompt);
}

function generateFallbackContent(prompt: string): string {
  return `[Demo content - configure an API key in Admin > API Keys to enable AI generation]\n\n${prompt.slice(0, 100)}...`;
}

function parseContentFromAI(raw: string, platform: string, topic: string): any {
  try {
    const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      return parsed;
    }
  } catch {}

  // Parse fallback format
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

router.post("/content/generate", requireAuth, async (req: any, res) => {
  try {
    const { platform, topic, wordCount, stylePromptId, outputMode, generateThumbnail } = req.body;

    let systemPrompt = `You are an expert viral content creator specializing in ${platform} content. Create highly engaging, unique content that can go viral. Always respond in valid JSON format.`;

    if (stylePromptId) {
      const [prompt] = await db.select().from(promptsTable).where(eq(promptsTable.id, stylePromptId)).limit(1);
      if (prompt?.isActive) {
        systemPrompt = prompt.systemPrompt;
      }
    }

    const digestInstruction = outputMode === "digest"
      ? "Include detailed video action descriptions, image/video style prompts, scene descriptions, and b-roll suggestions between script sections."
      : "Provide only the clean script text without production notes.";

    const userPrompt = `Create viral ${platform} content about: "${topic}"

Target word count: ${wordCount} words (estimated ${Math.ceil(wordCount / 130)} minutes for video)
${digestInstruction}

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

    const aiRaw = await callAI(userPrompt, systemPrompt);
    const parsed = parseContentFromAI(aiRaw, platform, topic);

    const actualWordCount = parsed.script?.split(/\s+/).length ?? wordCount;
    const estimatedMinutes = Math.ceil(actualWordCount / 130);

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
    });
  } catch (err) {
    req.log.error({ err }, "GenerateContent error");
    res.status(500).json({ error: "Content generation failed" });
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
    await db.delete(contentHistoryTable).where(eq(contentHistoryTable.id, id));
    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error({ err }, "DeleteContentHistory error");
    res.status(500).json({ error: "Server error" });
  }
});

export { callAI };
export default router;
