import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { videoMarketingJobsTable, settingsTable, productsTable, usersTable } from "@workspace/db";
import { eq, desc, and, gte, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { callGeminiFallback } from "./ai-utils";
import { requireCredits } from "./credits";

const router = Router();

const VOICE_ENGINE = process.env.VOICE_ENGINE_URL ?? "http://localhost:8099";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getSetting(key: string, def = ""): Promise<string> {
  try {
    const [row] = await db.select({ value: settingsTable.value })
      .from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    return row?.value ?? def;
  } catch { return def; }
}

async function getMonthlyJobCount(userId: number): Promise<number> {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const [row] = await db.select({ c: count() })
    .from(videoMarketingJobsTable)
    .where(and(
      eq(videoMarketingJobsTable.userId, userId),
      gte(videoMarketingJobsTable.createdAt, start)
    ));
  return Number(row?.c ?? 0);
}

function platformToAspect(platform: string): string {
  const map: Record<string, string> = {
    tiktok: "portrait", youtube: "landscape",
    instagram: "square", facebook: "facebook",
  };
  return map[platform] ?? "portrait";
}

async function generateMarketingScript(
  niche: string, productName: string, productDesc: string, platform: string
): Promise<{ hook: string; problem: string; solution: string; cta: string; fullScript: string }> {
  const platformNote: Record<string, string> = {
    tiktok: "TikTok (fast-paced, trendy, 30-60 seconds, use emojis sparingly)",
    youtube: "YouTube Shorts (energetic, educational, 60 seconds)",
    instagram: "Instagram Reels (aspirational, visually compelling, 30 seconds)",
    facebook: "Facebook video (slightly longer, trust-building, 60 seconds)",
  };

  const prompt = `You are an elite viral video marketing scriptwriter. Create a high-converting marketing video script for ${platformNote[platform] || platform}.

Product/Topic: ${productName}
Niche: ${niche}
Description: ${productDesc || "A digital product that solves problems and creates results"}

Write a 4-part viral video script. Return ONLY valid JSON, no markdown, no explanation.

{
  "hook": "First 3 seconds — pattern interrupt that stops the scroll. Start with a bold statement or question. Max 15 words.",
  "problem": "The pain point. Speak directly to the viewer's frustration. 2-3 punchy sentences.",
  "solution": "Position the product as the answer. Focus on transformation, not features. 2-3 sentences.",
  "cta": "Strong call to action. Create urgency. Max 20 words.",
  "fullScript": "Complete script as one flowing narrative (all 4 parts combined, natural spoken language, 80-120 words total)"
}`;

  const result = await callGeminiFallback([{ role: "user", content: prompt }], "You are an elite viral video marketing scriptwriter.", 2048, "video_agent");
  const text = (result?.text ?? "").trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    const parsed = JSON.parse(text);
    return {
      hook: parsed.hook || "",
      problem: parsed.problem || "",
      solution: parsed.solution || "",
      cta: parsed.cta || "",
      fullScript: parsed.fullScript || `${parsed.hook} ${parsed.problem} ${parsed.solution} ${parsed.cta}`,
    };
  } catch {
    return {
      hook: "Stop scrolling — this changes everything.",
      problem: `Struggling with ${niche}? You're not alone.`,
      solution: `${productName} is the fastest way to get real results.`,
      cta: "Get yours now — link below!",
      fullScript: `Stop scrolling — this changes everything. Struggling with ${niche}? You're not alone. ${productName} is the fastest way to get real results. Get yours now — link below!`,
    };
  }
}

function buildVideoScript(
  title: string, hook: string, problem: string, solution: string, cta: string
): string {
  return [
    `[TITLE] ${title}`,
    `[HOOK] ${hook}`,
    `[PROBLEM] ${problem}`,
    `[SOLUTION] ${solution}`,
    `[CTA] ${cta}`,
  ].join("\n\n");
}

async function startVideoRender(jobKey: string, title: string, script: string, voiceId: string, style: string, captionStyle: string, aspectRatio: string): Promise<void> {
  const res = await fetch(`${VOICE_ENGINE}/video/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobKey, title, script, voice_id: voiceId, style, caption_style: captionStyle, aspect_ratio: aspectRatio }),
  });
  if (!res.ok) throw new Error(`Voice engine error: ${res.status}`);
}

async function getVoiceEngineStatus(jobKey: string): Promise<{ status: string; progress: number; message: string } | null> {
  try {
    const res = await fetch(`${VOICE_ENGINE}/video/status/${jobKey}`);
    if (!res.ok) return null;
    return await res.json() as { status: string; progress: number; message: string };
  } catch { return null; }
}

// ─── User routes ──────────────────────────────────────────────────────────────

// POST /video-agent/generate
router.post("/video-agent/generate", requireAuth, requireCredits("ai_video"), async (req: any, res) => {
  try {
    const enabled = await getSetting("video_agent_enabled", "true");
    if (enabled === "false") return res.status(403).json({ error: "Video Agent is currently disabled." });

    const { niche, platform = "tiktok", voiceId = "af_sky", style = "dark_pro", captionStyle = "subtitle", productId } = req.body;
    if (!niche) return res.status(400).json({ error: "niche is required" });

    // Credit check
    const [userRow] = await db.select({ tier: usersTable.subscriptionTier })
      .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    const tier = userRow?.tier ?? "free";

    const freeLimit  = parseInt(await getSetting("video_agent_free_limit", "3"));
    const proLimit   = parseInt(await getSetting("video_agent_pro_limit", "20"));
    const limit = tier === "free" ? freeLimit : (tier === "pro" ? proLimit : 999999);

    const used = await getMonthlyJobCount(req.user.id);
    if (used >= limit) {
      return res.status(402).json({ error: `Monthly video limit reached (${limit}). ${tier === "free" ? "Upgrade to Pro for more." : ""}` });
    }

    // Get product data if productId provided
    let productName = niche;
    let productDesc = "";
    if (productId) {
      const [prod] = await db.select({ title: productsTable.title, description: productsTable.description })
        .from(productsTable).where(eq(productsTable.id, Number(productId))).limit(1);
      if (prod) { productName = prod.title; productDesc = prod.description ?? ""; }
    }

    // Generate AI script
    const script = await generateMarketingScript(niche, productName, productDesc, platform);
    const title = `${productName} — ${platform.charAt(0).toUpperCase() + platform.slice(1)} Ad`;
    const aspectRatio = platformToAspect(platform);
    const jobKey = randomUUID();
    const videoScript = buildVideoScript(title, script.hook, script.problem, script.solution, script.cta);

    // Save to DB
    const [job] = await db.insert(videoMarketingJobsTable).values({
      userId: req.user.id,
      productId: productId ? Number(productId) : null,
      title, niche, platform,
      hook: script.hook, problem: script.problem, solution: script.solution,
      cta: script.cta, fullScript: script.fullScript,
      voiceId, style, captionStyle, aspectRatio,
      jobKey, status: "generating",
    }).returning();

    // Start render (async — don't await)
    startVideoRender(jobKey, title, videoScript, voiceId, style, captionStyle, aspectRatio)
      .catch(async (err) => {
        await db.update(videoMarketingJobsTable)
          .set({ status: "failed", errorMessage: String(err), updatedAt: new Date() })
          .where(eq(videoMarketingJobsTable.id, job.id));
      });

    return res.json({ job, script });
  } catch (err: any) {
    console.error("video-agent generate error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
});

// GET /video-agent/jobs — list user's jobs
router.get("/video-agent/jobs", requireAuth, async (req: any, res) => {
  const jobs = await db.select().from(videoMarketingJobsTable)
    .where(eq(videoMarketingJobsTable.userId, req.user.id))
    .orderBy(desc(videoMarketingJobsTable.createdAt))
    .limit(50);
  return res.json(jobs);
});

// GET /video-agent/job/:id — job status with live voice-engine sync
router.get("/video-agent/job/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [job] = await db.select().from(videoMarketingJobsTable)
    .where(and(eq(videoMarketingJobsTable.id, id), eq(videoMarketingJobsTable.userId, req.user.id)))
    .limit(1);
  if (!job) return res.status(404).json({ error: "Job not found" });

  // Sync status from voice engine if still rendering
  if (job.jobKey && job.status === "generating") {
    const live = await getVoiceEngineStatus(job.jobKey);
    if (live) {
      let newStatus = job.status;
      if (live.status === "done")   newStatus = "done";
      if (live.status === "failed") newStatus = "failed";
      if (newStatus !== job.status) {
        const updateFields: Record<string, any> = { status: newStatus, updatedAt: new Date() };

        // When video completes, upload to R2 in background
        if (newStatus === "done" && !job.videoUrl) {
          (async () => {
            try {
              const { tryUploadBufferToR2 } = await import("../lib/r2Storage");
              const fileRes = await fetch(`${VOICE_ENGINE}/video/file/${job.jobKey}`);
              if (fileRes.ok) {
                const buf = Buffer.from(await fileRes.arrayBuffer());
                const r2Url = await tryUploadBufferToR2(buf, "videos", "mp4", "video/mp4");
                if (r2Url) {
                  await db.update(videoMarketingJobsTable)
                    .set({ videoUrl: r2Url, updatedAt: new Date() })
                    .where(eq(videoMarketingJobsTable.id, id));
                  console.info(`[R2] Video marketing job ${id} uploaded: ${r2Url}`);
                }
              }
            } catch (e) { console.error("[R2] Video upload failed:", e); }
          })();
        }

        await db.update(videoMarketingJobsTable)
          .set(updateFields)
          .where(eq(videoMarketingJobsTable.id, id));
      }
      return res.json({ ...job, status: newStatus, liveProgress: live.progress, liveMessage: live.message });
    }
  }
  return res.json(job);
});

// GET /video-agent/download/:id — stream video file (R2 redirect if available)
router.get("/video-agent/download/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [job] = await db.select().from(videoMarketingJobsTable)
    .where(and(eq(videoMarketingJobsTable.id, id), eq(videoMarketingJobsTable.userId, req.user.id)))
    .limit(1);
  if (!job || !job.jobKey) return res.status(404).json({ error: "Job not found" });
  if (job.status !== "done") return res.status(400).json({ error: "Video not ready" });

  // Prefer R2 URL — redirect the browser directly to the CDN
  if ((job as any).videoUrl) {
    return res.redirect(302, (job as any).videoUrl);
  }

  try {
    const upstream = await fetch(`${VOICE_ENGINE}/video/file/${job.jobKey}`);
    if (!upstream.ok) return res.status(404).json({ error: "File not available" });
    const safeTitle = job.title.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}-${job.id}.mp4"`);
    const buffer = await upstream.arrayBuffer();

    // Upload to R2 opportunistically for next time
    const buf = Buffer.from(buffer);
    (async () => {
      try {
        const { tryUploadBufferToR2 } = await import("../lib/r2Storage");
        const r2Url = await tryUploadBufferToR2(buf, "videos", "mp4", "video/mp4");
        if (r2Url) {
          await db.update(videoMarketingJobsTable)
            .set({ videoUrl: r2Url, updatedAt: new Date() })
            .where(eq(videoMarketingJobsTable.id, id));
        }
      } catch {}
    })();

    return res.send(buf);
  } catch (err: any) {
    return res.status(500).json({ error: "Download failed" });
  }
});

// DELETE /video-agent/job/:id
router.delete("/video-agent/job/:id", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [job] = await db.select().from(videoMarketingJobsTable)
    .where(and(eq(videoMarketingJobsTable.id, id), eq(videoMarketingJobsTable.userId, req.user.id)))
    .limit(1);
  if (!job) return res.status(404).json({ error: "Not found" });
  if (job.jobKey) fetch(`${VOICE_ENGINE}/video/job/${job.jobKey}`, { method: "DELETE" }).catch(() => {});
  await db.delete(videoMarketingJobsTable).where(eq(videoMarketingJobsTable.id, id));
  return res.json({ deleted: true });
});

// GET /video-agent/config — voices + styles (public-ish)
router.get("/video-agent/config", requireAuth, async (_req, res) => {
  const enabled = await getSetting("video_agent_enabled", "true");
  return res.json({
    enabled: enabled !== "false",
    platforms: [
      { id: "tiktok",    label: "TikTok",           aspect: "9:16", icon: "📱" },
      { id: "youtube",   label: "YouTube Shorts",   aspect: "16:9", icon: "▶️" },
      { id: "instagram", label: "Instagram Reels",  aspect: "1:1",  icon: "📷" },
      { id: "facebook",  label: "Facebook Video",   aspect: "4:3",  icon: "👥" },
    ],
    styles: [
      { id: "dark_pro",      label: "Dark Pro",      preview: "#6d28d9" },
      { id: "neon",          label: "Neon City",     preview: "#00d282" },
      { id: "product_launch",label: "Product Launch",preview: "#ff3c78" },
      { id: "retro_wave",    label: "Retro Wave",    preview: "#ff2daa" },
      { id: "cinematic",     label: "Cinematic",     preview: "#d4af37" },
      { id: "luxury_gold",   label: "Luxury Gold",   preview: "#d4af37" },
      { id: "clean_light",   label: "Clean Light",   preview: "#4f46e5" },
      { id: "corporate",     label: "Corporate",     preview: "#2563eb" },
      { id: "neon_urban",    label: "Neon Urban",    preview: "#ffdc00" },
      { id: "minimal_pro",   label: "Minimal Pro",   preview: "#1e1e28" },
    ],
    voices: [
      { id: "af_sky",     label: "Sky (F)",     accent: "American" },
      { id: "af_bella",   label: "Bella (F)",   accent: "American" },
      { id: "af_sarah",   label: "Sarah (F)",   accent: "American" },
      { id: "am_adam",    label: "Adam (M)",    accent: "American" },
      { id: "am_michael", label: "Michael (M)", accent: "American" },
      { id: "bf_emma",    label: "Emma (F)",    accent: "British"  },
      { id: "bm_george",  label: "George (M)",  accent: "British"  },
    ],
    captions: [
      { id: "subtitle", label: "Subtitle Bar" },
      { id: "bold",     label: "Bold Captions" },
      { id: "neon",     label: "Neon Glow" },
      { id: "minimal",  label: "Minimal" },
      { id: "none",     label: "No Captions" },
    ],
  });
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /admin/video-agent/jobs
router.get("/admin/video-agent/jobs", requireAdmin, async (_req, res) => {
  const jobs = await db
    .select({
      id: videoMarketingJobsTable.id,
      title: videoMarketingJobsTable.title,
      niche: videoMarketingJobsTable.niche,
      platform: videoMarketingJobsTable.platform,
      status: videoMarketingJobsTable.status,
      style: videoMarketingJobsTable.style,
      createdAt: videoMarketingJobsTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(videoMarketingJobsTable)
    .leftJoin(usersTable, eq(videoMarketingJobsTable.userId, usersTable.id))
    .orderBy(desc(videoMarketingJobsTable.createdAt))
    .limit(200);
  return res.json(jobs);
});

// GET /admin/video-agent/stats
router.get("/admin/video-agent/stats", requireAdmin, async (_req, res) => {
  const all = await db.select({
    status: videoMarketingJobsTable.status,
    platform: videoMarketingJobsTable.platform,
  }).from(videoMarketingJobsTable);

  const total = all.length;
  const done = all.filter(j => j.status === "done").length;
  const failed = all.filter(j => j.status === "failed").length;
  const generating = all.filter(j => j.status === "generating").length;

  const byPlatform: Record<string, number> = {};
  for (const j of all) { byPlatform[j.platform] = (byPlatform[j.platform] ?? 0) + 1; }

  return res.json({ total, done, failed, generating, byPlatform });
});

// PATCH /admin/video-agent/settings
router.patch("/admin/video-agent/settings", requireAdmin, async (req, res) => {
  const { enabled, freeLimit, proLimit } = req.body;
  const updates: { key: string; value: string }[] = [];
  if (enabled !== undefined) updates.push({ key: "video_agent_enabled", value: String(enabled) });
  if (freeLimit !== undefined) updates.push({ key: "video_agent_free_limit", value: String(freeLimit) });
  if (proLimit !== undefined) updates.push({ key: "video_agent_pro_limit", value: String(proLimit) });

  for (const u of updates) {
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, u.key)).limit(1);
    if (existing.length) {
      await db.update(settingsTable).set({ value: u.value, updatedAt: new Date() }).where(eq(settingsTable.key, u.key));
    } else {
      await db.insert(settingsTable).values({ key: u.key, value: u.value });
    }
  }
  return res.json({ ok: true });
});

export default router;
