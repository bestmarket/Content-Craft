import { Router } from "express";
import { requireAuth } from "./auth";
import { db } from "@workspace/db";
import { videoJobsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";
import { callAI } from "./content";

const router = Router();
const VIDEO_ENGINE = process.env.VOICE_ENGINE_URL ?? "http://localhost:8099";

// ── POST /api/video-generator/write-script ───────────────────────────────────
router.post("/video-generator/write-script", requireAuth, async (req: any, res) => {
  const {
    topic,
    tone = "promotional",
    targetAudience = "general audience",
    durationSeconds = 60,
  } = req.body;

  if (!topic?.trim()) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  const sceneCount = durationSeconds <= 30 ? 3 : durationSeconds <= 60 ? 5 : durationSeconds <= 90 ? 6 : 7;
  const wordsPerScene = Math.round((durationSeconds * 2.5) / sceneCount);

  const toneInstructions: Record<string, string> = {
    promotional:  "persuasive and benefit-focused, using power words and urgency",
    educational:  "clear and informative, breaking down concepts step-by-step",
    storytelling: "narrative and emotional, using a personal journey arc",
    motivational: "energetic and inspiring, using strong calls-to-action and empowerment language",
  };

  const systemPrompt = `You are an expert animated video scriptwriter for Selovox, an AI content platform.
You write structured scene scripts for a high-quality animation engine that renders human character animations,
material design cards, kinetic typography, stats counters, product showcases, and confetti effects.

Scene types available:
- "title"     → cinematic opening with animated title and floating orbs
- "character" → animated stick figure character with speech bubble (pose: "presenting"|"celebrating"|"thinking"|"walking")
- "feature"   → animated checkmark list revealing one by one (provide "items" array with up to 5 bullet points)
- "stats"     → animated number counters (provide "stats" array: [{value:"10,000+", label:"Happy Customers"}, ...])
- "product"   → product showcase card with glowing reveal (include "headline", optionally "price", "features" array)
- "body"      → kinetic text scene with word-by-word animation
- "cta"       → call-to-action with confetti burst and pulsing button

Write in a ${toneInstructions[tone] ?? toneInstructions.promotional} tone for ${targetAudience}.`;

  const userPrompt = `Write a ${durationSeconds}-second animated video script about: "${topic.trim()}"
Tone: ${tone} | Target audience: ${targetAudience}
Total scenes: ${sceneCount}

Return ONLY valid JSON with this exact structure:
{
  "title": "Catchy Video Title (max 10 words)",
  "script": [
    { "type": "title", "headline": "Main Title Here", "subtitle": "Tagline here" },
    { "type": "character", "body": "What the character says (${wordsPerScene}–${wordsPerScene+5} words)", "pose": "presenting" },
    { "type": "feature", "headline": "Why Choose Us", "items": ["Benefit one", "Benefit two", "Benefit three"] },
    { "type": "stats", "headline": "Our Results", "stats": [{"value": "10,000+", "label": "Customers"}, {"value": "98%", "label": "Satisfaction"}] },
    { "type": "body", "body": "Key insight or message here (${wordsPerScene}–${wordsPerScene+5} words)" },
    { "type": "cta", "headline": "Start Today", "body": "Join thousands of creators transforming their content game." }
  ]
}

Rules:
- Always start with a "title" scene
- Always end with a "cta" scene
- Include at least one "character" scene and one "feature" or "stats" scene
- Body text for narration: ${wordsPerScene}–${wordsPerScene+5} words per scene
- No markdown, no asterisks
- Return ONLY valid JSON, nothing else`;

  try {
    const raw = await callAI(userPrompt, systemPrompt, "video_script");

    let title = topic.trim();
    let script = "";
    let wordCount = 0;

    // Try to parse as structured JSON scene array
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        title = parsed.title || title;

        if (Array.isArray(parsed.script)) {
          // New structured format — serialize as JSON string for the engine
          script = JSON.stringify(parsed.script);
          // Word count from all narration fields
          wordCount = parsed.script.reduce((acc: number, s: any) => {
            const text = [s.body, s.headline, ...(s.items || [])].filter(Boolean).join(" ");
            return acc + text.split(/\s+/).filter(Boolean).length;
          }, 0);
        } else if (typeof parsed.script === "string") {
          // Fallback: old format with plain text paragraphs
          script = parsed.script.replace(/\*\*?([^*]+)\*\*?/g, "$1").replace(/#+\s*/g, "").trim();
          wordCount = script.split(/\s+/).filter(Boolean).length;
        } else {
          script = raw;
          wordCount = raw.split(/\s+/).filter(Boolean).length;
        }
      } catch {
        script = raw.replace(/\*\*?([^*]+)\*\*?/g, "$1").replace(/#+\s*/g, "").trim();
        wordCount = script.split(/\s+/).filter(Boolean).length;
      }
    } else {
      script = raw.replace(/\*\*?([^*]+)\*\*?/g, "$1").replace(/#+\s*/g, "").trim();
      wordCount = script.split(/\s+/).filter(Boolean).length;
    }

    res.json({ title, script, wordCount, isStructured: script.startsWith("[") });
  } catch (err: any) {
    logger.error({ err }, "Script generation failed");
    res.status(500).json({ error: err.message ?? "Script generation failed" });
  }
});

// ── POST /api/video-generator/jobs ────────────────────────────────────────────
router.post("/video-generator/jobs", requireAuth, async (req: any, res) => {
  const {
    title,
    script,
    voiceId = "af_sky",
    style = "dark_pro",
    captionStyle = "subtitle",
    aspectRatio  = "landscape",
  } = req.body;

  if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
  if (!script?.trim()) { res.status(400).json({ error: "script is required" }); return; }

  const jobKey = nanoid(21);

  try {
    const [job] = await db
      .insert(videoJobsTable)
      .values({
        userId:        req.userId,
        jobKey,
        title:         title.trim(),
        script:        script.trim(),
        voiceId,
        style,
        captionStyle,
        aspectRatio,
        status:        "pending",
        progress:      0,
        statusMessage: "Queued…",
      })
      .returning();

    // Fire-and-forget to Python engine
    fetch(`${VIDEO_ENGINE}/video/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        job_id:        jobKey,
        title:         job.title,
        script:        job.script,
        voice_id:      job.voiceId,
        style:         job.style,
        caption_style: job.captionStyle,
        aspect_ratio:  job.aspectRatio,
      }),
    }).catch((err) => logger.warn({ err }, "Failed to reach video engine"));

    res.status(201).json(job);
  } catch (err) {
    logger.error({ err }, "Failed to create video job");
    res.status(500).json({ error: "Failed to create video job" });
  }
});

// ── GET /api/video-generator/jobs ────────────────────────────────────────────
router.get("/video-generator/jobs", requireAuth, async (req: any, res) => {
  try {
    const jobs = await db
      .select()
      .from(videoJobsTable)
      .where(eq(videoJobsTable.userId, req.userId))
      .orderBy(desc(videoJobsTable.createdAt))
      .limit(50);
    res.json({ jobs });
  } catch (err) {
    logger.error({ err }, "Failed to list video jobs");
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// ── GET /api/video-generator/jobs/:id ────────────────────────────────────────
router.get("/video-generator/jobs/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .select()
      .from(videoJobsTable)
      .where(and(eq(videoJobsTable.id, id), eq(videoJobsTable.userId, req.userId)))
      .limit(1);

    if (!job) { res.status(404).json({ error: "Not found" }); return; }

    if (job.status === "pending" || job.status === "processing") {
      try {
        const r = await fetch(`${VIDEO_ENGINE}/video/status/${job.jobKey}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (r.ok) {
          const py = await r.json() as any;

          if (py.status === "done") {
            await db.update(videoJobsTable).set({
              status: "done", progress: 100,
              statusMessage: "Video ready!",
              durationSeconds: py.duration ?? null,
              updatedAt: new Date(),
            }).where(eq(videoJobsTable.id, id));

            // Upload to R2 in background
            if (!job.videoUrl) {
              (async () => {
                try {
                  const { tryUploadBufferToR2 } = await import("../lib/r2Storage");
                  const fileRes = await fetch(`${VIDEO_ENGINE}/video/file/${job.jobKey}`);
                  if (fileRes.ok) {
                    const buf = Buffer.from(await fileRes.arrayBuffer());
                    const r2Url = await tryUploadBufferToR2(buf, "videos", "mp4", "video/mp4");
                    if (r2Url) {
                      await db.update(videoJobsTable)
                        .set({ videoUrl: r2Url, updatedAt: new Date() })
                        .where(eq(videoJobsTable.id, id));
                      logger.info({ jobId: id, r2Url }, "[R2] Video generator job uploaded");
                    }
                  }
                } catch (e) { logger.error({ e }, "[R2] Video upload failed"); }
              })();
            }

            res.json({ ...job, status: "done", progress: 100, durationSeconds: py.duration ?? null }); return;
          }
          if (py.status === "failed") {
            await db.update(videoJobsTable).set({
              status: "failed",
              statusMessage: py.message ?? "Render failed",
              errorMessage:  py.message ?? "Render failed",
              updatedAt: new Date(),
            }).where(eq(videoJobsTable.id, id));
            res.json({ ...job, status: "failed", errorMessage: py.message }); return;
          }
          res.json({
            ...job,
            status:        py.status   ?? job.status,
            progress:      py.progress ?? job.progress,
            statusMessage: py.message  ?? job.statusMessage,
          }); return;
        }
      } catch { /* engine unreachable — return DB state */ }
    }

    res.json(job);
  } catch (err) {
    logger.error({ err }, "Failed to get video job");
    res.status(500).json({ error: "Failed to get job" });
  }
});

// ── GET /api/video-generator/stream/:jobKey  (NO auth — UUID is capability) ──
// Supports HTTP Range requests so the <video> element can seek.
router.get("/video-generator/stream/:jobKey", async (req, res) => {
  const { jobKey } = req.params;
  if (!jobKey || jobKey.length < 8) { res.status(400).json({ error: "Invalid key" }); return; }

  try {
    const [job] = await db
      .select({ id: videoJobsTable.id, status: videoJobsTable.status })
      .from(videoJobsTable)
      .where(eq(videoJobsTable.jobKey, jobKey))
      .limit(1);

    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.status !== "done") { res.status(400).json({ error: "Video not ready" }); return; }

    // Forward Range header (critical for seek + Chrome/Safari)
    const upstreamHeaders: Record<string, string> = {
      "Accept": "video/mp4,video/*",
    };
    const rangeHeader = req.headers["range"];
    if (rangeHeader) upstreamHeaders["Range"] = rangeHeader;

    const upstream = await fetch(`${VIDEO_ENGINE}/video/file/${jobKey}`, {
      headers: upstreamHeaders,
    });

    if (!upstream.ok && upstream.status !== 206) {
      res.status(upstream.status).json({ error: "Video file unavailable" }); return;
    }

    // Forward status (200 or 206 Partial Content)
    res.status(upstream.status);

    // Forward all relevant headers from Python
    const SKIP = new Set(["transfer-encoding", "connection", "keep-alive"]);
    upstream.headers.forEach((val, key) => {
      if (!SKIP.has(key.toLowerCase())) res.setHeader(key, val);
    });

    // Ensure correct content type
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");

    // Stream body
    if (!upstream.body) { res.end(); return; }
    const reader = upstream.body.getReader();
    const pump = async () => {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const ok = res.write(Buffer.from(value));
        if (!ok) await new Promise(r => res.once("drain", r));
      }
      res.end();
    };
    await pump();
  } catch (err) {
    logger.error({ err }, "Stream error");
    if (!res.headersSent) res.status(500).json({ error: "Stream failed" });
  }
});

// ── GET /api/video-generator/jobs/:id/download (auth, returns blob) ──────────
router.get("/video-generator/jobs/:id/download", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .select()
      .from(videoJobsTable)
      .where(and(eq(videoJobsTable.id, id), eq(videoJobsTable.userId, req.userId)))
      .limit(1);

    if (!job)                { res.status(404).json({ error: "Not found" }); return; }
    if (job.status !== "done") { res.status(400).json({ error: "Not ready" }); return; }

    // Prefer R2 CDN URL if already uploaded
    if (job.videoUrl) {
      res.redirect(302, job.videoUrl);
      return;
    }

    const upstream = await fetch(`${VIDEO_ENGINE}/video/file/${job.jobKey}`);
    if (!upstream.ok) { res.status(502).json({ error: "File unavailable" }); return; }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition",
      `attachment; filename="viralcraft-${job.title.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}.mp4"`);
    if (upstream.headers.get("content-length"))
      res.setHeader("Content-Length", upstream.headers.get("content-length")!);
    res.setHeader("Cache-Control", "no-store");

    const buf = Buffer.from(await upstream.arrayBuffer());

    // Upload to R2 opportunistically for next time
    (async () => {
      try {
        const { tryUploadBufferToR2 } = await import("../lib/r2Storage");
        const r2Url = await tryUploadBufferToR2(buf, "videos", "mp4", "video/mp4");
        if (r2Url) {
          await db.update(videoJobsTable)
            .set({ videoUrl: r2Url, updatedAt: new Date() })
            .where(eq(videoJobsTable.id, id));
        }
      } catch {}
    })();

    res.send(buf);
  } catch (err) {
    logger.error({ err }, "Download error");
    if (!res.headersSent) res.status(500).json({ error: "Download failed" });
  }
});

// ── GET /api/video-generator/preview/:style ──────────────────────────────────
router.get("/video-generator/preview/:style", requireAuth, async (req: any, res) => {
  const style   = req.params.style;
  const caption = (req.query.caption as string) || "subtitle";

  try {
    const r = await fetch(
      `${VIDEO_ENGINE}/video/preview/${encodeURIComponent(style)}?caption_style=${encodeURIComponent(caption)}`,
    );
    if (!r.ok) {
      const msg = await r.text().catch(() => "Preview failed");
      res.status(r.status).json({ error: msg });
      return;
    }
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=1800");
    res.setHeader("Content-Disposition", `inline; filename="preview-${style}.mp4"`);
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (err) {
    logger.error({ err }, "Preview proxy error");
    res.status(500).json({ error: "Preview generation failed" });
  }
});

// ── GET /api/video-generator/thumbnail/:style ────────────────────────────────
router.get("/video-generator/thumbnail/:style", requireAuth, async (req: any, res) => {
  const style    = req.params.style;
  const caption  = (req.query.caption as string) || "subtitle";
  const title    = (req.query.title as string) || "";
  const subtitle = (req.query.subtitle as string) || "";

  try {
    const params = new URLSearchParams({ caption_style: caption });
    if (title)    params.set("title", title);
    if (subtitle) params.set("subtitle", subtitle);
    const r = await fetch(
      `${VIDEO_ENGINE}/video/thumbnail/${encodeURIComponent(style)}?${params}`,
    );
    if (!r.ok) {
      res.status(r.status).json({ error: "Thumbnail failed" });
      return;
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (err) {
    logger.error({ err }, "Thumbnail proxy error");
    res.status(500).json({ error: "Thumbnail generation failed" });
  }
});

// ── DELETE /api/video-generator/jobs/:id ─────────────────────────────────────
router.delete("/video-generator/jobs/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [job] = await db
      .select({ id: videoJobsTable.id, jobKey: videoJobsTable.jobKey })
      .from(videoJobsTable)
      .where(and(eq(videoJobsTable.id, id), eq(videoJobsTable.userId, req.userId)))
      .limit(1);

    if (!job) { res.status(404).json({ error: "Not found" }); return; }

    fetch(`${VIDEO_ENGINE}/video/job/${job.jobKey}`, { method: "DELETE" }).catch(() => {});
    await db.delete(videoJobsTable).where(eq(videoJobsTable.id, id));
    res.json({ deleted: true });
  } catch (err) {
    logger.error({ err }, "Delete error");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
