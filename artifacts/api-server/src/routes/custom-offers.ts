import { Router } from "express";
import { db } from "@workspace/db";
import { customOffersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAIWithMeta } from "./ai-utils";

const router = Router();

const CATEGORY_BASE_PRICES: Record<string, { min: number; mid: number; max: number; unit: string }> = {
  ai_agent:        { min: 149,  mid: 499,  max: 1499, unit: "AI Agent" },
  n8n_workflow:    { min: 79,   mid: 249,  max: 799,  unit: "n8n Workflow" },
  replit_template: { min: 199,  mid: 599,  max: 1999, unit: "Replit App" },
  chrome_extension:{ min: 99,   mid: 349,  max: 999,  unit: "Chrome Extension" },
  website:         { min: 299,  mid: 999,  max: 4999, unit: "Website" },
  mobile_app:      { min: 799,  mid: 2499, max: 9999, unit: "Mobile App" },
  web_app:         { min: 499,  mid: 1499, max: 5999, unit: "Web App" },
  automation:      { min: 99,   mid: 349,  max: 1199, unit: "Automation" },
  custom:          { min: 99,   mid: 499,  max: 4999, unit: "Custom Project" },
};

// POST /custom-offers/analyze — AI pricing analysis (no auth needed)
router.post("/custom-offers/analyze", async (req: any, res) => {
  try {
    const { title, description, category, budget, timeline } = req.body;
    if (!description || description.length < 20) {
      res.status(400).json({ error: "Please describe your project in more detail (at least 20 characters)" }); return;
    }

    const base = CATEGORY_BASE_PRICES[category] ?? CATEGORY_BASE_PRICES.custom;
    const systemPrompt = `You are an expert project pricing analyst for a digital products marketplace. 
Analyze the project request and return precise pricing in JSON format.
Always be fair and realistic — consider scope, complexity, and market rates.`;

    const messages = [{
      role: "user",
      content: `Analyze this project request and provide pricing:

Category: ${category}
Title: ${title || "Custom Project"}
Description: ${description}
Budget preference: ${budget || "Flexible"}
Timeline: ${timeline || "Standard"}

Base price range for ${base.unit}: $${base.min} – $${base.max}

Return ONLY valid JSON:
{
  "suggestedPrice": <number — recommended price>,
  "minPrice": <number — minimum for basic scope>,
  "maxPrice": <number — maximum for full scope>,
  "complexity": "simple" | "moderate" | "complex" | "enterprise",
  "estimatedDays": <number>,
  "breakdown": [
    {"item": "description", "cost": <number>}
  ],
  "whatIsIncluded": ["item 1", "item 2", "item 3", "item 4"],
  "scopeNotes": "brief explanation of scope assumptions",
  "aiConfidence": <0-100>
}`
    }];

    const result = await callAIWithMeta(messages, systemPrompt, 800, 0.3, "[CustomOffer]", "custom_offer");
    
    let analysis: any = {};
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
    } catch {
      analysis = {
        suggestedPrice: base.mid,
        minPrice: base.min,
        maxPrice: base.max,
        complexity: "moderate",
        estimatedDays: 7,
        breakdown: [{ item: base.unit + " development", cost: base.mid }],
        whatIsIncluded: ["Project setup", "Core functionality", "Testing", "Delivery"],
        scopeNotes: "Based on standard project scope",
        aiConfidence: 70,
      };
    }

    res.json({ analysis, category, base });
  } catch (err: any) {
    console.error("Custom offer analyze error:", err);
    res.status(500).json({ error: "Failed to analyze project" });
  }
});

// POST /custom-offers — submit a custom offer
router.post("/custom-offers", async (req: any, res) => {
  try {
    const {
      title, description, category, budget, timeline,
      guestEmail, guestName, aiAnalysis,
    } = req.body;

    if (!description) { res.status(400).json({ error: "Description required" }); return; }

    const analysis = aiAnalysis ?? {};
    const userId = req.userId ?? null;

    const [offer] = await db.insert(customOffersTable).values({
      buyerId: userId,
      guestEmail: guestEmail || null,
      guestName: guestName || null,
      title: title || "Custom Project Request",
      description,
      category: category || "custom",
      budget: budget || null,
      timeline: timeline || null,
      aiAnalysis: analysis,
      aiSuggestedPrice: analysis.suggestedPrice?.toString() ?? null,
      aiMinPrice: analysis.minPrice?.toString() ?? null,
      aiMaxPrice: analysis.maxPrice?.toString() ?? null,
      finalPrice: analysis.suggestedPrice?.toString() ?? null,
      status: "pending",
      paymentStatus: "unpaid",
    }).returning();

    res.json({ offer });
  } catch (err: any) {
    console.error("Custom offer submit error:", err);
    res.status(500).json({ error: "Failed to submit offer" });
  }
});

// GET /custom-offers — list offers for the logged-in buyer
router.get("/custom-offers", requireAuth, async (req: any, res) => {
  try {
    const offers = await db
      .select()
      .from(customOffersTable)
      .where(eq(customOffersTable.buyerId, req.userId))
      .orderBy(desc(customOffersTable.createdAt));
    res.json({ offers });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load offers" });
  }
});

// GET /custom-offers/admin — admin: list all offers
router.get("/custom-offers/admin", requireAuth, async (req: any, res) => {
  try {
    const offers = await db
      .select()
      .from(customOffersTable)
      .orderBy(desc(customOffersTable.createdAt))
      .limit(200);
    res.json({ offers });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load offers" });
  }
});

// PUT /custom-offers/:id/status — admin update status
router.put("/custom-offers/:id/status", requireAuth, async (req: any, res) => {
  try {
    const { status, finalPrice, deliveryNotes } = req.body;
    const [offer] = await db
      .update(customOffersTable)
      .set({
        status,
        ...(finalPrice && { finalPrice: finalPrice.toString() }),
        ...(deliveryNotes && { deliveryNotes }),
        updatedAt: new Date(),
      })
      .where(eq(customOffersTable.id, parseInt(req.params.id)))
      .returning();
    res.json({ offer });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update offer" });
  }
});

export default router;
