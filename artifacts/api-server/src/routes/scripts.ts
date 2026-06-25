import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAI } from "./content";

const router = Router();

router.post("/scripts/movie", requireAuth, async (req: any, res) => {
  try {
    const { title, genre, premise, tone, duration, mode } = req.body;
    if (!premise) {
      res.status(400).json({ error: "premise is required" });
      return;
    }

    const systemPrompt = `You are an award-winning Hollywood screenwriter. Your scripts have emotional depth, stunning visual storytelling, gripping dialogue, and unforgettable characters. ${
      mode === "multimillion"
        ? "Write like the top 0.1% of creators — think Christopher Nolan meets Tyler Perry in terms of emotional depth and cinematic scope."
        : "Write with professional screenplay structure, vivid scene descriptions, and compelling character arcs."
    }`;

    const userPrompt = `Write a ${mode === "multimillion" ? "high-end multimillion-dollar style" : "cinematic"} ${genre ?? "drama"} script with this premise:

Title: "${title ?? "Untitled"}"
Premise: "${premise}"
Tone: ${tone ?? "Dramatic and emotional"}
${duration ? `Duration: ${duration} minutes (adjust scene count accordingly)` : "Duration: ~10 minutes short film"}
Mode: ${mode ?? "short_film"}

Respond ONLY in this exact JSON format:
{
  "title": "Script title",
  "logline": "One-sentence story summary",
  "genre": "${genre ?? "Drama"}",
  "estimatedDuration": "X minutes",
  "characters": [
    {"name": "Character name", "description": "Who they are and what they want"}
  ],
  "synopsis": "3-paragraph synopsis",
  "acts": [
    {
      "act": "ACT ONE — SETUP",
      "scenes": [
        {
          "sceneNumber": 1,
          "heading": "INT. LOCATION - DAY/NIGHT",
          "action": "Scene description / action lines",
          "dialogue": [
            {"character": "NAME", "line": "Dialogue here", "parenthetical": "(optional tone note)"}
          ]
        }
      ]
    }
  ],
  "productionNotes": "Visual style, mood, and cinematography notes",
  "emotionalCore": "The central emotional theme"
}`;

    const aiRaw = await callAI(userPrompt, systemPrompt, "scripts");

    let parsed: any;
    try {
      const jsonMatch = aiRaw.match(/```json\n?([\s\S]*?)\n?```/) || aiRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      parsed = {
        title: title ?? "Untitled Script",
        logline: `A story about ${premise.slice(0, 80)}`,
        genre: genre ?? "Drama",
        estimatedDuration: duration ?? "10 minutes",
        characters: [{ name: "PROTAGONIST", description: "The main character" }],
        synopsis: aiRaw.slice(0, 500),
        acts: [{ act: "ACT ONE — SETUP", scenes: [{ sceneNumber: 1, heading: "INT. UNKNOWN - DAY", action: aiRaw.slice(0, 300), dialogue: [] }] }],
        productionNotes: "Configure an AI API key in Admin settings to get full cinematic scripts.",
        emotionalCore: "Discovery and transformation",
      };
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "MovieScript error");
    res.status(500).json({ error: "Script generation failed" });
  }
});

router.post("/scripts/video-ideas", requireAuth, async (req: any, res) => {
  try {
    const { niche, platform, format } = req.body;
    if (!niche) {
      res.status(400).json({ error: "niche is required" });
      return;
    }

    const systemPrompt = `You are a viral content strategist who has helped hundreds of creators hit millions of views. You understand platform algorithms, audience psychology, and the exact formula for content that spreads. Every idea you suggest has a specific viral angle, not a generic one.`;

    const userPrompt = `Generate 10 viral video ideas for the ${niche} niche on ${platform ?? "YouTube/TikTok"}.

Format preference: ${format ?? "Mix of short-form and long-form"}

For each idea, provide a specific viral angle, not generic titles.

Respond ONLY in this exact JSON format:
{
  "niche": "${niche}",
  "ideas": [
    {
      "title": "Specific viral title with hook",
      "viralAngle": "Why this will go viral (specific mechanism)",
      "hook": "Opening line or visual hook for first 3 seconds",
      "format": "short_form | long_form",
      "estimatedViews": "Range like 100K-500K",
      "difficulty": "Easy | Medium | Hard",
      "trendingScore": 88,
      "outline": ["Point 1", "Point 2", "Point 3"],
      "cta": "Call to action for end of video",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ],
  "trendingTopics": ["Current trending topic 1", "Topic 2", "Topic 3"],
  "bestPostingTime": "When to post for maximum reach"
}`;

    const aiRaw = await callAI(userPrompt, systemPrompt, "scripts");

    let parsed: any;
    try {
      const jsonMatch = aiRaw.match(/```json\n?([\s\S]*?)\n?```/) || aiRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      } else {
        throw new Error("No JSON");
      }
    } catch {
      parsed = {
        niche,
        ideas: Array.from({ length: 5 }, (_, i) => ({
          title: `${["Shocking Truth About", "Why Most People Fail At", "The Secret To", "How I Made $10K With", "Stop Doing This With"][i]} ${niche}`,
          viralAngle: "Curiosity gap + relatable struggle",
          hook: "Wait… do you know this?",
          format: i % 2 === 0 ? "short_form" : "long_form",
          estimatedViews: "50K-200K",
          difficulty: "Medium",
          trendingScore: 75 + i * 3,
          outline: ["Hook", "Main content", "CTA"],
          cta: "Subscribe for more",
          tags: [niche.toLowerCase(), "viral", "trending"],
        })),
        trendingTopics: [`${niche} tips`, `${niche} for beginners`, `${niche} secrets`],
        bestPostingTime: "Tuesday-Thursday, 12pm-3pm or 7pm-9pm",
      };
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "VideoIdeas error");
    res.status(500).json({ error: "Video idea generation failed" });
  }
});

export default router;
