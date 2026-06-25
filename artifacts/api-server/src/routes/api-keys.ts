import { Router } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "./auth";
import { roundRobinCounters, invalidateKeyCache } from "./ai-utils";

const router = Router();

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

router.get("/api-keys", requireAdmin, async (req: any, res) => {
  try {
    const keys = await db.select({
      id: apiKeysTable.id,
      provider: apiKeysTable.provider,
      label: apiKeysTable.label,
      maskedKey: apiKeysTable.maskedKey,
      isActive: apiKeysTable.isActive,
      purpose: apiKeysTable.purpose,
      createdAt: apiKeysTable.createdAt,
    }).from(apiKeysTable);
    res.json(keys);
  } catch (err) {
    req.log.error({ err }, "ListApiKeys error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api-keys", requireAdmin, async (req: any, res) => {
  try {
    const { provider, key, label, purpose, isActive } = req.body;
    const masked = maskKey(key);
    const [created] = await db.insert(apiKeysTable).values({
      provider,
      label: label ?? null,
      encryptedKey: key,
      maskedKey: masked,
      purpose,
      isActive: isActive ?? true,
    }).returning({
      id: apiKeysTable.id,
      provider: apiKeysTable.provider,
      label: apiKeysTable.label,
      maskedKey: apiKeysTable.maskedKey,
      isActive: apiKeysTable.isActive,
      purpose: apiKeysTable.purpose,
    });
    invalidateKeyCache(provider);
    res.json(created);
  } catch (err) {
    req.log.error({ err }, "CreateApiKey error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api-keys/bulk", requireAdmin, async (req: any, res) => {
  try {
    const { provider, keys } = req.body;
    if (!provider || !Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({ error: "provider and keys[] are required" });
      return;
    }
    const results: any[] = [];
    let added = 0;
    let skipped = 0;
    for (const rawKey of keys) {
      const trimmed = typeof rawKey === "string" ? rawKey.trim() : "";
      if (!trimmed) continue;
      const existing = await db.select({ id: apiKeysTable.id })
        .from(apiKeysTable)
        .where(and(eq(apiKeysTable.provider, provider), eq(apiKeysTable.encryptedKey, trimmed)))
        .limit(1);
      if (existing.length > 0) { skipped++; continue; }
      const masked = maskKey(trimmed);
      const [created] = await db.insert(apiKeysTable).values({
        provider,
        label: null,
        encryptedKey: trimmed,
        maskedKey: masked,
        purpose: null,
        isActive: true,
      }).returning({
        id: apiKeysTable.id,
        provider: apiKeysTable.provider,
        maskedKey: apiKeysTable.maskedKey,
        isActive: apiKeysTable.isActive,
      });
      results.push(created);
      added++;
    }
    if (added > 0) invalidateKeyCache(provider);
    res.json({ added, skipped, keys: results });
  } catch (err) {
    req.log.error({ err }, "BulkAddApiKeys error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/api-keys/:id/toggle", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    const [updated] = await db.update(apiKeysTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(apiKeysTable.id, id))
      .returning({
        id: apiKeysTable.id,
        provider: apiKeysTable.provider,
        label: apiKeysTable.label,
        maskedKey: apiKeysTable.maskedKey,
        isActive: apiKeysTable.isActive,
        purpose: apiKeysTable.purpose,
      });
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    invalidateKeyCache(updated.provider);
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "ToggleApiKey error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api-keys/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.select({ provider: apiKeysTable.provider })
      .from(apiKeysTable).where(eq(apiKeysTable.id, id)).limit(1);
    await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    if (deleted) invalidateKeyCache(deleted.provider);
    res.json({ message: "API key deleted" });
  } catch (err) {
    req.log.error({ err }, "DeleteApiKey error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api-keys/:id/test", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db.select({ encryptedKey: apiKeysTable.encryptedKey, provider: apiKeysTable.provider })
      .from(apiKeysTable).where(eq(apiKeysTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ ok: false, error: "Key not found" }); return; }

    const { encryptedKey, provider } = row;

    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encryptedKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with just the word: ok" }] }] }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const msg = (body as any)?.error?.message ?? `HTTP ${r.status}`;
        res.json({ ok: false, error: msg });
        return;
      }
      res.json({ ok: true, provider: "gemini" });
      return;
    }

    if (provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${encryptedKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Reply with just the word: ok" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        res.json({ ok: false, error: (body as any)?.error?.message ?? `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "groq" });
      return;
    }

    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${encryptedKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Reply with just the word: ok" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        res.json({ ok: false, error: (body as any)?.error?.message ?? `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "openai" });
      return;
    }

    if (provider === "claude" || provider === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": encryptedKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 5,
          messages: [{ role: "user", content: "Reply with just the word: ok" }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        res.json({ ok: false, error: (body as any)?.error?.message ?? `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "claude" });
      return;
    }

    if (provider === "stabilityai") {
      const r = await fetch("https://api.stability.ai/v1/user/account", {
        headers: { Authorization: `Bearer ${encryptedKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        res.json({ ok: false, error: (body as any)?.message ?? `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "stabilityai" });
      return;
    }

    if (provider === "unsplash") {
      const r = await fetch(`https://api.unsplash.com/photos/random?count=1&client_id=${encryptedKey}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        res.json({ ok: false, error: (body as any)?.errors?.[0] ?? `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "unsplash" });
      return;
    }

    if (provider === "pexels") {
      const r = await fetch("https://api.pexels.com/v1/curated?per_page=1", {
        headers: { Authorization: encryptedKey },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        res.json({ ok: false, error: `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "pexels" });
      return;
    }

    if (provider === "pixabay") {
      const r = await fetch(`https://pixabay.com/api/?key=${encryptedKey}&q=test&per_page=3`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        res.json({ ok: false, error: `HTTP ${r.status}` });
        return;
      }
      res.json({ ok: true, provider: "pixabay" });
      return;
    }

    res.json({ ok: true, provider, note: "Key saved — live test not available for this provider" });
  } catch (err: any) {
    req.log.error({ err }, "TestApiKey error");
    res.json({ ok: false, error: err?.message ?? "Test failed" });
  }
});

// GET /admin/api-keys/rotation-status — live rotation state per provider
router.get("/admin/api-keys/rotation-status", requireAdmin, async (req: any, res) => {
  try {
    const allKeys = await db.select({
      id: apiKeysTable.id,
      provider: apiKeysTable.provider,
      label: apiKeysTable.label,
      maskedKey: apiKeysTable.maskedKey,
      isActive: apiKeysTable.isActive,
    }).from(apiKeysTable);

    const providerMap: Record<string, { total: number; active: number; currentIndex: number; nextKey: string | null; nextLabel: string | null }> = {};

    for (const key of allKeys) {
      if (!providerMap[key.provider]) {
        providerMap[key.provider] = { total: 0, active: 0, currentIndex: 0, nextKey: null, nextLabel: null };
      }
      providerMap[key.provider].total++;
      if (key.isActive) providerMap[key.provider].active++;
    }

    for (const [provider, info] of Object.entries(providerMap)) {
      const activeKeys = allKeys.filter(k => k.provider === provider && k.isActive);
      const counter = roundRobinCounters[provider] ?? 0;
      info.currentIndex = activeKeys.length > 0 ? (counter % activeKeys.length) + 1 : 0;
      const nextKey = activeKeys.length > 0 ? activeKeys[counter % activeKeys.length] : null;
      info.nextKey = nextKey?.maskedKey ?? null;
      info.nextLabel = nextKey?.label ?? null;
    }

    res.json(providerMap);
  } catch (err) {
    req.log.error({ err }, "RotationStatus error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api-keys/next/:provider", async (req: any, res) => {
  try {
    const { provider } = req.params;
    const keys = await db.select({
      id: apiKeysTable.id,
      encryptedKey: apiKeysTable.encryptedKey,
      label: apiKeysTable.label,
    })
      .from(apiKeysTable)
      .where(and(eq(apiKeysTable.provider, provider), eq(apiKeysTable.isActive, true)));

    if (!keys.length) {
      res.status(404).json({ error: `No active keys for provider: ${provider}` });
      return;
    }

    const counter = roundRobinCounters[provider] ?? 0;
    const key = keys[counter % keys.length];
    roundRobinCounters[provider] = (counter + 1) % keys.length;

    res.json({ id: key.id, key: key.encryptedKey, label: key.label });
  } catch (err) {
    req.log.error({ err }, "NextApiKey error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
