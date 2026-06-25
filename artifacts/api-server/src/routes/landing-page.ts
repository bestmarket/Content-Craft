import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAI } from "./content";

const router = Router();

router.post("/landing-page/generate", requireAuth, async (req: any, res) => {
  try {
    const { topic, productTitle, price, targetAudience, benefits, promptId } = req.body;
    if (!topic || !productTitle) {
      res.status(400).json({ error: "topic and productTitle required" });
      return;
    }

    let systemPrompt = `You are a world-class direct-response copywriter who creates high-conversion landing pages. Your copy is emotionally compelling, trust-building, and drives action. Every headline must create curiosity or urgency. Use proven conversion psychology: problem-agitation-solution, social proof signals, and irresistible CTAs.`;

    if (promptId) {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, parseInt(promptId))).limit(1);
      if (p?.isActive) systemPrompt = p.systemPrompt;
    }

    const userPrompt = `Create a complete, high-conversion landing page copy for:

Product: "${productTitle}"
Topic/Niche: "${topic}"
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
${price ? `Price: ${price}` : ""}
${benefits ? `Key Benefits: ${benefits}` : ""}

Respond ONLY in this exact JSON format:
{
  "heroHeadline": "Bold viral headline with curiosity gap",
  "heroSubheadline": "Supporting line that explains the transformation",
  "heroCta": "Button text",
  "problemSection": {
    "headline": "The problem headline",
    "points": ["Pain point 1", "Pain point 2", "Pain point 3"]
  },
  "solutionSection": {
    "headline": "Solution headline",
    "description": "How your product solves the problem"
  },
  "benefitsSection": {
    "headline": "Benefits headline",
    "benefits": [
      {"title": "Benefit 1", "description": "Detailed benefit description"},
      {"title": "Benefit 2", "description": "Detailed benefit description"},
      {"title": "Benefit 3", "description": "Detailed benefit description"},
      {"title": "Benefit 4", "description": "Detailed benefit description"},
      {"title": "Benefit 5", "description": "Detailed benefit description"}
    ]
  },
  "socialProof": {
    "headline": "Social proof headline",
    "testimonials": [
      {"name": "Sarah M.", "role": "Entrepreneur", "text": "Testimonial text here", "rating": 5},
      {"name": "James T.", "role": "Content Creator", "text": "Testimonial text here", "rating": 5},
      {"name": "Aisha K.", "role": "Digital Marketer", "text": "Testimonial text here", "rating": 5}
    ]
  },
  "pricingSection": {
    "headline": "Pricing headline",
    "originalPrice": "${price ? price : "97"}",
    "currentPrice": "${price ? price : "47"}",
    "includedItems": ["Item 1", "Item 2", "Item 3", "Bonus item"],
    "guarantee": "30-day money-back guarantee statement"
  },
  "finalCta": {
    "headline": "Final urgency headline",
    "buttonText": "CTA button text",
    "subtext": "Risk reversal text"
  }
}`;

    const aiRaw = await callAI(userPrompt, systemPrompt, "content");

    let parsed: any;
    try {
      const jsonMatch = aiRaw.match(/```json\n?([\s\S]*?)\n?```/) || aiRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      parsed = {
        heroHeadline: `Discover How ${productTitle} Will Transform Your Life`,
        heroSubheadline: `The complete system for ${topic} — even if you're starting from zero`,
        heroCta: "Get Instant Access",
        problemSection: { headline: "Are you tired of...", points: ["Wasting time on ineffective methods", "Struggling without a clear system", "Watching others succeed while you're stuck"] },
        solutionSection: { headline: `Introducing ${productTitle}`, description: `A proven, step-by-step system that takes you from where you are to where you want to be with ${topic}.` },
        benefitsSection: { headline: "What You'll Get Inside", benefits: [{ title: "Proven System", description: "A step-by-step blueprint that works" }, { title: "Instant Results", description: "See results from day one" }, { title: "Expert Guidance", description: "Learn from the best in the industry" }] },
        socialProof: { headline: "Join Thousands of Success Stories", testimonials: [{ name: "Sarah M.", role: "Entrepreneur", text: "This changed everything for me!", rating: 5 }] },
        pricingSection: { headline: "Get Everything For Just...", originalPrice: "97", currentPrice: price ?? "47", includedItems: [`${productTitle} Complete Guide`, "Bonus Templates", "Lifetime Access"], guarantee: "100% Money-Back Guarantee for 30 Days" },
        finalCta: { headline: "Don't Miss This Opportunity", buttonText: "Yes, I Want This!", subtext: "30-Day Money-Back Guarantee • Instant Access" },
      };
    }

    res.json({ ...parsed, productTitle, topic });
  } catch (err) {
    req.log.error({ err }, "LandingPage generate error");
    res.status(500).json({ error: "Landing page generation failed" });
  }
});

export default router;
