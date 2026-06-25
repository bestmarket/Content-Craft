import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { requireFeature } from "./features";
import { requireCredits } from "./credits";
import { getRotatedKey, generateProductCoverImage } from "./ai-utils";

const router = Router();

router.post("/thumbnails/generate", requireAuth, requireFeature("ai_thumbnails"), requireCredits("ai_thumbnails"), async (req: any, res) => {
  try {
    const { topic, platform, promptId } = req.body;

    let systemPrompt = `Create a highly detailed, viral ${platform} thumbnail image prompt. The thumbnail should be eye-catching, bold, and clickable.`;

    if (promptId) {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId)).limit(1);
      if (p?.isActive) systemPrompt = p.systemPrompt;
    }

    const imagePrompt = `${systemPrompt}\n\nCreate a thumbnail for: "${topic}"\n\nMake it bold, colorful, and designed to maximize click-through rate on ${platform}.`;

    const { uploadBase64ToR2, tryUploadBufferToR2 } = await import("../lib/r2Storage");

    // Try OpenAI DALL-E via shared key rotation
    const openaiKey = await getRotatedKey("openai");
    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ model: "dall-e-3", prompt: imagePrompt, n: 1, size: "1792x1024", response_format: "b64_json" }),
      });
      const data = await response.json() as any;
      if (data.data?.[0]?.b64_json) {
        const r2Url = await uploadBase64ToR2(`data:image/png;base64,${data.data[0].b64_json}`, "thumbnails", "png");
        res.json({ imageUrl: r2Url ?? `data:image/png;base64,${data.data[0].b64_json}`, prompt: imagePrompt });
        return;
      }
      if (data.data?.[0]?.url) {
        // Fetch external URL and upload to R2
        try {
          const imgRes = await fetch(data.data[0].url);
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const r2Url = await tryUploadBufferToR2(buf, "thumbnails", "png", "image/png");
            res.json({ imageUrl: r2Url ?? data.data[0].url, prompt: imagePrompt });
            return;
          }
        } catch {}
        res.json({ imageUrl: data.data[0].url, prompt: imagePrompt });
        return;
      }
    }

    // Fallback: Gemini image generation pipeline (already uploads to R2 internally)
    const geminiUrl = await generateProductCoverImage({ title: topic, topic, type: "thumbnail" });
    res.json({ imageUrl: geminiUrl, prompt: imagePrompt });
  } catch (err) {
    req.log.error({ err }, "GenerateThumbnail error");
    res.status(500).json({ error: "Thumbnail generation failed" });
  }
});

export default router;
