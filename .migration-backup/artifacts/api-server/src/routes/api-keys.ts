import { Router } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";

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
      maskedKey: apiKeysTable.maskedKey,
      isActive: apiKeysTable.isActive,
      purpose: apiKeysTable.purpose,
    }).from(apiKeysTable);
    res.json(keys);
  } catch (err) {
    req.log.error({ err }, "ListApiKeys error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api-keys", requireAdmin, async (req: any, res) => {
  try {
    const { provider, key, purpose, isActive } = req.body;
    const masked = maskKey(key);
    const existing = await db.select().from(apiKeysTable).where(eq(apiKeysTable.provider, provider)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(apiKeysTable).set({
        encryptedKey: key,
        maskedKey: masked,
        purpose,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      }).where(eq(apiKeysTable.provider, provider)).returning({
        id: apiKeysTable.id,
        provider: apiKeysTable.provider,
        maskedKey: apiKeysTable.maskedKey,
        isActive: apiKeysTable.isActive,
        purpose: apiKeysTable.purpose,
      });
      res.json(updated);
    } else {
      const [created] = await db.insert(apiKeysTable).values({
        provider,
        encryptedKey: key,
        maskedKey: masked,
        purpose,
        isActive: isActive ?? true,
      }).returning({
        id: apiKeysTable.id,
        provider: apiKeysTable.provider,
        maskedKey: apiKeysTable.maskedKey,
        isActive: apiKeysTable.isActive,
        purpose: apiKeysTable.purpose,
      });
      res.json(created);
    }
  } catch (err) {
    req.log.error({ err }, "UpsertApiKey error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api-keys/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    res.json({ message: "API key deleted" });
  } catch (err) {
    req.log.error({ err }, "DeleteApiKey error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
