import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable, apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.post("/thumbnails/generate", requireAuth, async (req: any, res) => {
  try {
    const { topic, platform, promptId } = req.body;

    let systemPrompt = `Create a highly detailed, viral ${platform} thumbnail image prompt. The thumbnail should be eye-catching, bold, and clickable.`;

    if (promptId) {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId)).limit(1);
      if (p?.isActive) systemPrompt = p.systemPrompt;
    }

    const imagePrompt = `${systemPrompt}\n\nCreate a thumbnail for: "${topic}"\n\nMake it bold, colorful, and designed to maximize click-through rate on ${platform}.`;

    // Try to use OpenAI DALL-E
    const [openaiKey] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.provider, "openai")).limit(1);

    if (openaiKey?.isActive) {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey.encryptedKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1792x1024",
        }),
      });
      const data = await response.json() as any;
      if (data.data?.[0]?.url) {
        res.json({ imageUrl: data.data[0].url, prompt: imagePrompt });
        return;
      }
    }

    // Fallback placeholder thumbnail
    const fallbackUrl = `https://placehold.co/1280x720/6366f1/ffffff?text=${encodeURIComponent(topic.slice(0, 30))}`;
    res.json({ imageUrl: fallbackUrl, prompt: imagePrompt });
  } catch (err) {
    req.log.error({ err }, "GenerateThumbnail error");
    res.status(500).json({ error: "Thumbnail generation failed" });
  }
});

export default router;
