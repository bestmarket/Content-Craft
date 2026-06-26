import { Router } from "express";
import { db } from "@workspace/db";
import { featuresTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

const router = Router();

router.get("/features", requireAuth, async (req: any, res) => {
  try {
    const features = await db.select().from(featuresTable);
    res.json(features);
  } catch (err) {
    req.log.error({ err }, "ListFeatures error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/features/:id/toggle", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    const [updated] = await db.update(featuresTable).set({ isActive }).where(eq(featuresTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "ToggleFeature error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
