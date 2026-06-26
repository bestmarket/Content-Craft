import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

const router = Router();

router.get("/settings", requireAuth, async (req: any, res) => {
  try {
    const results = await db.select().from(settingsTable);
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "ListSettings error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/settings", requireAdmin, async (req: any, res) => {
  try {
    const { updates } = req.body;
    const results = [];
    for (const { key, value } of updates) {
      const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
      if (existing.length > 0) {
        const [s] = await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, key)).returning();
        results.push(s);
      } else {
        const [s] = await db.insert(settingsTable).values({ key, value, updatedAt: new Date() }).returning();
        results.push(s);
      }
    }
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "UpdateSetting error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
