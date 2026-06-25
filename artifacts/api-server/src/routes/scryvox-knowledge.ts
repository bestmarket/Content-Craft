import { Router } from "express";
import { db } from "@workspace/db";
import { scryvoxKnowledgeTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { addKnowledgeItem, deleteKnowledgeItem, seedSystemKnowledge, queryKnowledge } from "../lib/scryvox/engines/knowledge";

const router = Router();

router.get("/scryvox/knowledge", requireAuth, async (req: any, res) => {
  try {
    const { type, topic } = req.query as Record<string, string>;
    if (topic) {
      const result = await queryKnowledge(topic, type ? [type as any] : undefined, 30);
      res.json(result);
    } else {
      const items = await db.select().from(scryvoxKnowledgeTable).orderBy(scryvoxKnowledgeTable.createdAt).limit(100);
      res.json({ items });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load knowledge base" });
  }
});

router.post("/scryvox/knowledge", requireAdmin, async (req: any, res) => {
  try {
    const { type, title, description, content, tags, domain } = req.body;
    if (!type || !title || !description) {
      res.status(400).json({ error: "type, title, and description are required" });
      return;
    }
    const id = await addKnowledgeItem({
      type, title, description,
      content: content ?? {},
      tags: tags ?? [],
      domain,
      isSystem: false,
      createdBy: req.user?.id,
    });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add knowledge item" });
  }
});

router.delete("/scryvox/knowledge/:id", requireAdmin, async (req, res) => {
  try {
    await deleteKnowledgeItem(parseInt(req.params.id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

router.post("/scryvox/knowledge/seed", requireAdmin, async (_req, res) => {
  try {
    await seedSystemKnowledge();
    res.json({ success: true, message: "System knowledge seeded" });
  } catch (err: any) {
    res.status(500).json({ error: "Seed failed", details: err?.message });
  }
});

export default router;
