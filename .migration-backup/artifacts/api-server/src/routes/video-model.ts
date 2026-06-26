import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAI } from "./content";

const router = Router();

router.post("/video-model/analyze", requireAuth, async (req: any, res) => {
  try {
    const { videoUrls, platform, topic, wordCount, stylePromptId } = req.body;

    let systemPrompt = `You are an expert viral content analyst and scriptwriter. You analyze successful viral videos and create improved, unique scripts using proven viral techniques. Always respond in valid JSON format.`;

    if (stylePromptId) {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, stylePromptId)).limit(1);
      if (p?.isActive) systemPrompt = p.systemPrompt;
    }

    const urlList = videoUrls.slice(0, 5).join("\n");
    const userPrompt = `Analyze these ${platform} video links and create a superior viral script:

Video Links:
${urlList}

Topic: "${topic}"
Target Platform: ${platform}
Target Word Count: ${wordCount ?? 1000} words

Note: Since direct video analysis requires special tools, create a highly optimized viral script based on the topic and platform best practices. Model the content structure, hooks, and engagement patterns of top-performing ${platform} videos.

Respond ONLY in this exact JSON format:
{
  "titles": [
    {"title": "Modeled viral title", "viralityScore": 91},
    {"title": "Alternative title", "viralityScore": 84},
    {"title": "Third option", "viralityScore": 88},
    {"title": "Fourth option", "viralityScore": 76},
    {"title": "Fifth option", "viralityScore": 93}
  ],
  "script": "Full modeled and improved script...",
  "description": "Platform description...",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#hashtag1", "#hashtag2"]
}`;

    const aiRaw = await callAI(userPrompt, systemPrompt);

    let parsed: any;
    try {
      const jsonMatch = aiRaw.match(/```json\n?([\s\S]*?)\n?```/) || aiRaw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? "{}");
    } catch {
      parsed = {
        titles: [{ title: `Viral ${topic} Guide`, viralityScore: 87 }],
        script: aiRaw,
        description: `Everything about ${topic}`,
        tags: [topic, platform],
        hashtags: [`#${topic.replace(/\s+/g, "")}`, `#${platform}`],
      };
    }

    const actualWordCount = parsed.script?.split(/\s+/).length ?? wordCount ?? 1000;
    res.json({
      id: null,
      titles: parsed.titles ?? [],
      script: parsed.script ?? "",
      description: parsed.description ?? "",
      tags: parsed.tags ?? [],
      hashtags: parsed.hashtags ?? [],
      thumbnailUrl: null,
      wordCount: actualWordCount,
      estimatedMinutes: Math.ceil(actualWordCount / 130),
    });
  } catch (err) {
    req.log.error({ err }, "AnalyzeVideos error");
    res.status(500).json({ error: "Video analysis failed" });
  }
});

export default router;
