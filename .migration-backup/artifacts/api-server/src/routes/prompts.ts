import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

const router = Router();

router.get("/prompts", requireAuth, async (req: any, res) => {
  try {
    const type = req.query.type as string | undefined;
    const query = db.select().from(promptsTable).orderBy(desc(promptsTable.createdAt));
    const results = type
      ? await db.select().from(promptsTable).where(eq(promptsTable.type, type as any)).orderBy(desc(promptsTable.createdAt))
      : await query;
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "ListPrompts error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/prompts", requireAdmin, async (req: any, res) => {
  try {
    const { name, type, systemPrompt, description, isActive } = req.body;
    const [prompt] = await db.insert(promptsTable).values({
      name,
      type,
      systemPrompt,
      description,
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(prompt);
  } catch (err) {
    req.log.error({ err }, "CreatePrompt error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/prompts/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, systemPrompt, description, isActive } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;
    const [prompt] = await db.update(promptsTable).set(updates).where(eq(promptsTable.id, id)).returning();
    if (!prompt) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(prompt);
  } catch (err) {
    req.log.error({ err }, "UpdatePrompt error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/prompts/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(promptsTable).where(eq(promptsTable.id, id));
    res.json({ message: "Prompt deleted" });
  } catch (err) {
    req.log.error({ err }, "DeletePrompt error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
