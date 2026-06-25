import { Router } from "express";
import { requireAuth, requireAdmin } from "./auth";
import { db } from "@workspace/db";
import { voiceClonesTable, voiceGenerationsTable, settingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const VOICE_ENGINE_URL = process.env.VOICE_ENGINE_URL ?? "http://localhost:8099";

const DEFAULT_VOICES = [
  { id: "af_sky",     name: "Sky",     gender: "Female", accent: "American", description: "Warm and expressive",       enabled: true },
  { id: "af_bella",   name: "Bella",   gender: "Female", accent: "American", description: "Smooth and professional",    enabled: true },
  { id: "af_sarah",   name: "Sarah",   gender: "Female", accent: "American", description: "Clear and energetic",        enabled: true },
  { id: "af_nicole",  name: "Nicole",  gender: "Female", accent: "American", description: "Soft and friendly",          enabled: true },
  { id: "am_adam",    name: "Adam",    gender: "Male",   accent: "American", description: "Deep and authoritative",     enabled: true },
  { id: "am_michael", name: "Michael", gender: "Male",   accent: "American", description: "Confident and natural",      enabled: true },
  { id: "bf_emma",    name: "Emma",    gender: "Female", accent: "British",  description: "Elegant and clear",          enabled: true },
  { id: "bf_isabella",name: "Isabella",gender: "Female", accent: "British",  description: "Refined and expressive",     enabled: true },
  { id: "bm_george",  name: "George",  gender: "Male",   accent: "British",  description: "Distinguished and warm",     enabled: true },
  { id: "bm_lewis",   name: "Lewis",   gender: "Male",   accent: "British",  description: "Calm and engaging",          enabled: true },
];

async function getVoiceCatalog() {
  try {
    const [row] = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "voice_catalog")).limit(1);
    if (row?.value) return JSON.parse(row.value as string);
  } catch {}
  return DEFAULT_VOICES;
}

// ── GET /api/voice/voices ─────────────────────────────────────────────────────
router.get("/voice/voices", requireAuth, async (_req, res) => {
  try {
    const catalog = await getVoiceCatalog();
    const enabled = catalog.filter((v: any) => v.enabled !== false);
    res.json({ voices: enabled });
  } catch {
    res.json({ voices: DEFAULT_VOICES });
  }
});

// ── GET /api/voice/preview/:voiceId ──────────────────────────────────────────
router.get("/voice/preview/:voiceId", requireAuth, async (req, res) => {
  const { voiceId } = req.params;
  try {
    const r = await fetch(`${VOICE_ENGINE_URL}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId }),
    });
    if (!r.ok) throw new Error("Engine error");
    const buf = await r.arrayBuffer();
    res.set("Content-Type", "audio/wav");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(buf));
  } catch (err) {
    logger.warn({ err, voiceId }, "Preview failed");
    res.status(503).json({ error: "Voice engine unavailable" });
  }
});

// ── POST /api/voice/speak ─────────────────────────────────────────────────────
router.post("/voice/speak", requireAuth, async (req: any, res) => {
  const { text, voiceId, cloneId, speed } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: "text is required" }); return; }

  try {
    let pitchFactor = 1.0;
    let effectiveVoiceId = voiceId ?? "af_sky";

    if (cloneId) {
      const [clone] = await db.select().from(voiceClonesTable)
        .where(eq(voiceClonesTable.id, cloneId)).limit(1);
      if (clone && clone.userId === req.userId) {
        effectiveVoiceId = clone.baseVoiceId;
        pitchFactor = clone.pitchFactor;
      }
    }

    const r = await fetch(`${VOICE_ENGINE_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId: effectiveVoiceId, speed: speed ?? 1.0, pitchFactor }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      res.status(r.status).json({ error: (err as any).detail ?? "Voice engine error" });
      return;
    }

    const audioBuffer = await r.arrayBuffer();
    const audioBuf = Buffer.from(audioBuffer);

    // Upload to R2 in background and record URL
    let audioUrl: string | null = null;
    try {
      const { tryUploadBufferToR2 } = await import("../lib/r2Storage");
      audioUrl = await tryUploadBufferToR2(audioBuf, "audio", "wav", "audio/wav");
    } catch {}

    await db.insert(voiceGenerationsTable).values({
      userId: req.userId,
      text: text.slice(0, 500),
      voiceId: effectiveVoiceId,
      cloneId: cloneId ?? null,
      characterCount: text.length,
      audioUrl: audioUrl ?? undefined,
    }).catch(() => {});

    if (audioUrl) res.set("X-Audio-Url", audioUrl);
    res.set("Content-Type", "audio/wav");
    res.send(audioBuf);
  } catch (err: any) {
    logger.error({ err }, "Voice speak error");
    res.status(503).json({ error: "Voice engine unavailable. Starting up — please try again in 30 seconds." });
  }
});

// ── POST /api/voice/speak/stream ─────────────────────────────────────────────
router.post("/voice/speak/stream", requireAuth, async (req: any, res) => {
  const { text, voiceId, cloneId, speed } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: "text is required" }); return; }

  try {
    let pitchFactor = 1.0;
    let effectiveVoiceId = voiceId ?? "af_sky";

    if (cloneId) {
      const [clone] = await db.select().from(voiceClonesTable)
        .where(eq(voiceClonesTable.id, cloneId)).limit(1);
      if (clone && clone.userId === req.userId) {
        effectiveVoiceId = clone.baseVoiceId;
        pitchFactor = clone.pitchFactor;
      }
    }

    const r = await fetch(`${VOICE_ENGINE_URL}/speak/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId: effectiveVoiceId, speed: speed ?? 1.0, pitchFactor }),
    });

    if (!r.ok || !r.body) {
      res.status(503).json({ error: "Voice engine unavailable" });
      return;
    }

    res.set("Content-Type", "application/x-ndjson");
    res.set("Transfer-Encoding", "chunked");
    res.set("X-Accel-Buffering", "no");

    const reader = (r.body as any).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();

    await db.insert(voiceGenerationsTable).values({
      userId: req.userId,
      text: text.slice(0, 500),
      voiceId: effectiveVoiceId,
      cloneId: cloneId ?? null,
      characterCount: text.length,
    }).catch(() => {});
  } catch (err: any) {
    logger.error({ err }, "Voice stream error");
    if (!res.headersSent) res.status(503).json({ error: "Voice engine unavailable" });
    else res.end();
  }
});

// ── POST /api/voice/clone ─────────────────────────────────────────────────────
router.post("/voice/clone", requireAuth, async (req: any, res) => {
  const { name, audioBase64, mimeType } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: "Clone name is required" }); return; }
  if (!audioBase64) { res.status(400).json({ error: "Audio sample is required" }); return; }

  try {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    if (audioBuffer.length < 1000) { res.status(400).json({ error: "Audio sample too short" }); return; }

    let pitchFactor = 1.0;
    let baseVoiceId = "af_sky";

    try {
      const r = await fetch(`${VOICE_ENGINE_URL}/clone/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType }),
      });
      if (r.ok) {
        const analysis = await r.json() as any;
        pitchFactor = analysis.pitchFactor ?? 1.0;
        baseVoiceId = analysis.baseVoiceId ?? "af_sky";
      }
    } catch (e) {
      logger.warn({ e }, "Voice analysis failed, using defaults");
    }

    const [clone] = await db.insert(voiceClonesTable).values({
      userId: req.userId,
      name: name.trim(),
      baseVoiceId,
      pitchFactor,
      speedFactor: 1.0,
    }).returning();

    res.json({ clone });
  } catch (err: any) {
    logger.error({ err }, "Voice clone error");
    res.status(500).json({ error: "Failed to create voice clone" });
  }
});

// ── GET /api/voice/clones ─────────────────────────────────────────────────────
router.get("/voice/clones", requireAuth, async (req: any, res) => {
  try {
    const clones = await db.select().from(voiceClonesTable)
      .where(eq(voiceClonesTable.userId, req.userId))
      .orderBy(desc(voiceClonesTable.createdAt));
    res.json({ clones });
  } catch { res.status(500).json({ error: "Failed to fetch clones" }); }
});

// ── DELETE /api/voice/clones/:id ──────────────────────────────────────────────
router.delete("/voice/clones/:id", requireAuth, async (req: any, res) => {
  try {
    await db.delete(voiceClonesTable).where(eq(voiceClonesTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete clone" }); }
});

// ── GET /api/voice/history ────────────────────────────────────────────────────
router.get("/voice/history", requireAuth, async (req: any, res) => {
  try {
    const history = await db.select().from(voiceGenerationsTable)
      .where(eq(voiceGenerationsTable.userId, req.userId))
      .orderBy(desc(voiceGenerationsTable.createdAt))
      .limit(50);
    res.json({ history });
  } catch { res.status(500).json({ error: "Failed to fetch history" }); }
});

// ── Admin: GET /api/admin/voice/catalog ───────────────────────────────────────
router.get("/admin/voice/catalog", requireAdmin, async (_req, res) => {
  try {
    const catalog = await getVoiceCatalog();
    res.json({ catalog });
  } catch { res.status(500).json({ error: "Failed to fetch catalog" }); }
});

// ── Admin: PUT /api/admin/voice/catalog ───────────────────────────────────────
router.put("/admin/voice/catalog", requireAdmin, async (req, res) => {
  const { catalog } = req.body;
  if (!Array.isArray(catalog)) { res.status(400).json({ error: "catalog must be an array" }); return; }
  try {
    const value = JSON.stringify(catalog);
    await db.insert(settingsTable).values({ key: "voice_catalog", value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
    res.json({ ok: true, count: catalog.length });
  } catch (err: any) {
    logger.error({ err }, "Save voice catalog error");
    res.status(500).json({ error: "Failed to save catalog" });
  }
});

export default router;
