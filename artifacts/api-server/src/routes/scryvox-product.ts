import { Router } from "express";
import { db } from "@workspace/db";
import { scryvoxProductsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { runResearchEngine } from "../lib/scryvox/engines/research";
import { runArchitectEngine } from "../lib/scryvox/engines/architect";
import { runContentEngine } from "../lib/scryvox/engines/content";
import { runCriticEngine } from "../lib/scryvox/engines/critic";
import { runSellabilityEngine } from "../lib/scryvox/engines/sellability";
import { runMarketingEngine } from "../lib/scryvox/engines/marketing";
import { runLandingPageEngine } from "../lib/scryvox/engines/landing-page";
import { seedSystemKnowledge } from "../lib/scryvox/engines/knowledge";
import { applyDeepIntelligence } from "../lib/scryvox/deep-intelligence";

const router = Router();

const STAGES = ["research", "architect", "content", "critic", "sellability", "marketing", "complete"] as const;
type Stage = (typeof STAGES)[number];

function nextStage(current: string): Stage {
  const idx = STAGES.indexOf(current as Stage);
  return STAGES[Math.min(idx + 1, STAGES.length - 1)];
}

router.get("/scryvox/products", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const products = await db.select().from(scryvoxProductsTable)
      .where(eq(scryvoxProductsTable.userId, userId))
      .orderBy(desc(scryvoxProductsTable.updatedAt))
      .limit(50);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

router.post("/scryvox/products", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { topic, style = "pdf_chapter", tone = "wise", variation = 1 } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      res.status(400).json({ error: "Topic is required (min 3 characters)" });
      return;
    }

    await seedSystemKnowledge().catch(() => {});

    const researchData = runResearchEngine(topic.trim(), Number(variation) || 1);

    const [product] = await db.insert(scryvoxProductsTable).values({
      userId,
      title: topic.trim(),
      topic: topic.trim(),
      stage: "architect",
      style,
      tone,
      variation: Number(variation) || 1,
      researchData: researchData as any,
    }).returning();

    res.json({ success: true, product, researchData });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to start product pipeline", details: err?.message });
  }
});

router.get("/scryvox/products/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(scryvoxProductsTable)
      .where(and(eq(scryvoxProductsTable.id, id), eq(scryvoxProductsTable.userId, userId))).limit(1);

    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json({ product });
  } catch {
    res.status(500).json({ error: "Failed to load product" });
  }
});

router.post("/scryvox/products/:id/next", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);

    const [product] = await db.select().from(scryvoxProductsTable)
      .where(and(eq(scryvoxProductsTable.id, id), eq(scryvoxProductsTable.userId, userId))).limit(1);

    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    if (product.stage === "complete") { res.status(400).json({ error: "Product pipeline already complete" }); return; }

    const topic = product.topic;
    const variation = product.variation;
    const research = product.researchData as any;

    let stageData: any = {};
    let newStage: Stage;

    switch (product.stage) {
      case "research": {
        const researchData = runResearchEngine(topic, variation);
        stageData = { researchData };
        newStage = "architect";
        break;
      }
      case "architect": {
        if (!research) { res.status(400).json({ error: "Research data missing — run research first" }); return; }
        const architectData = runArchitectEngine(topic, research, variation);
        stageData = { architectData };
        newStage = "content";
        break;
      }
      case "content": {
        const architect = product.architectData as any;
        if (!architect?.tableOfContents) { res.status(400).json({ error: "Architecture data missing" }); return; }
        const contentData = await runContentEngine(topic, architect.tableOfContents, research, product.style as any, product.tone as any, variation);
        stageData = { contentData };
        newStage = "critic";
        break;
      }
      case "critic": {
        const architect = product.architectData as any;
        const content = product.contentData as any;
        if (!architect || !content) { res.status(400).json({ error: "Missing architect or content data" }); return; }
        const criticData = runCriticEngine(content, architect, research);
        stageData = { criticData };
        newStage = "sellability";
        break;
      }
      case "sellability": {
        const architect = product.architectData as any;
        const critic = product.criticData as any;
        if (!architect || !critic) { res.status(400).json({ error: "Missing required data" }); return; }
        const sellabilityData = runSellabilityEngine(topic, architect, critic, research, variation);
        stageData = { sellabilityData };
        newStage = "marketing";
        break;
      }
      case "marketing": {
        const architect = product.architectData as any;
        const sellability = product.sellabilityData as any;
        if (!architect || !sellability) { res.status(400).json({ error: "Missing required data" }); return; }
        const marketingData = runMarketingEngine(topic, architect, research, sellability);
        // Landing page + deep intelligence run silently here — invisible to the UI.
        // No separate stage is exposed; everything generates in the background.
        const landingPageData = runLandingPageEngine(
          topic, research, architect, sellability, marketingData, variation
        );
        const deepIntelligenceData = applyDeepIntelligence(topic, variation);
        stageData = { marketingData, landingPageData, deepIntelligenceData };
        newStage = "complete";
        break;
      }
      default:
        res.status(400).json({ error: `Unknown stage: ${product.stage}` });
        return;
    }

    const [updated] = await db.update(scryvoxProductsTable)
      .set({ ...stageData, stage: newStage, updatedAt: new Date() })
      .where(eq(scryvoxProductsTable.id, id))
      .returning();

    res.json({ success: true, product: updated, stageData, completedStage: product.stage, nextStage: newStage });
  } catch (err: any) {
    res.status(500).json({ error: "Stage failed", details: err?.message });
  }
});

router.delete("/scryvox/products/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);
    await db.delete(scryvoxProductsTable)
      .where(and(eq(scryvoxProductsTable.id, id), eq(scryvoxProductsTable.userId, userId)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
