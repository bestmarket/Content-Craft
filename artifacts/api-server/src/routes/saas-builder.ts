import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { saasAppsTable, saasSubscriptionsTable, walletTransactionsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { usersTable } from "@workspace/db";
import { callGeminiFallback, getRotatedKey, generateProductCoverImage } from "./ai-utils";

const router = Router();

// ─── Business Type Config ─────────────────────────────────────────────────────

const BUSINESS_TYPE_CONFIG: Record<string, {
  label: string;
  appRole: string;
  pricingStrategy: string;
  contentNote: string;
}> = {
  saas_tool: {
    label: "SaaS Web Tool",
    appRole: "Build a fully functional interactive web tool (HTML/CSS/JS in one file) with a beautiful UI. It must actually work — no placeholders.",
    pricingStrategy: "Free (limited), Starter $9/mo, Pro $29/mo with lifetime option",
    contentNote: "Focus on productivity, automation, and time-saving.",
  },
  coaching: {
    label: "Coaching / Consulting",
    appRole: "Build a beautiful subscriber portal page (HTML/CSS/JS) showing: welcome message, session booking calendar UI, curriculum outline, resource library section, and community access button. Make it feel premium.",
    pricingStrategy: "Basic $47/mo, Professional $97/mo, VIP $297/mo",
    contentNote: "Focus on transformation, accountability, and results.",
  },
  daily_plan: {
    label: "Daily Plan / Fitness / Wellness",
    appRole: "Build a beautiful subscriber portal (HTML/CSS/JS) showing: today's plan card with workout/meal/habit details, a 30-day progress tracker with clickable days, a motivational quote section, and a quick-log form. Make it mobile-friendly and motivating.",
    pricingStrategy: "Basic $19/mo, Premium $39/mo, Lifetime $149",
    contentNote: "Focus on accountability, daily wins, and visible transformation.",
  },
  course: {
    label: "Online Course / Education",
    appRole: "Build a beautiful course player portal (HTML/CSS/JS) with: module list sidebar (5 modules with lessons), video player placeholder area, lesson notes area, progress bar, and a quiz section. Make it feel like a real LMS.",
    pricingStrategy: "Basic $27/mo, All Access $67/mo, Lifetime $297",
    contentNote: "Focus on skills, career transformation, and step-by-step learning.",
  },
  community: {
    label: "Membership Community",
    appRole: "Build a beautiful community portal (HTML/CSS/JS) with: community feed with sample posts, member directory with avatars, upcoming events section, resource vault, and a welcome banner. Make it feel like an exclusive club.",
    pricingStrategy: "Member $17/mo, Pro $37/mo, Founder $97/mo lifetime",
    contentNote: "Focus on connection, exclusivity, and belonging.",
  },
  newsletter: {
    label: "Paid Newsletter",
    appRole: "Build a beautiful newsletter reader portal (HTML/CSS/JS) with: archive list of past issues with titles and dates, featured issue reader view, subscriber-only bonus section, and referral tracker. Make it feel premium like Substack Pro.",
    pricingStrategy: "Free (preview), Subscriber $9/mo, Founding $99/yr",
    contentNote: "Focus on insights, curation, and unique perspective.",
  },
};

const GENERATION_SYSTEM = `You are a world-class subscription business strategist, developer, and growth marketer with 20+ years of experience building 7-figure subscription businesses. You create complete, fully-functional web experiences and high-converting subscription pages. You never use placeholders or TODOs. Every output is 100% production-ready.`;

// ─── AI Generation ────────────────────────────────────────────────────────────

async function generateSaasApp(
  niche: string,
  description: string,
  businessType: string,
): Promise<{
  appName: string; tagline: string; appDescription: string;
  appHtml: string;
  tiers: Array<{ id: string; name: string; priceMonthly: number; priceAnnual: number; priceLifetime: number | null; perks: string[]; highlighted: boolean; color: string }>;
  landingPage: { headline: string; subheadline: string; features: Array<{ icon: string; title: string; desc: string }>; testimonials: Array<{ name: string; text: string; avatar: string }>; faq: Array<{ q: string; a: string }>; cta: string };
  marketingPlan: { youtubeIdeas: string[]; tiktokIdeas: string[]; instagramTheme: string; hooks: string[]; launchChecklist: string[]; targetAudience: string; painPoints: string[]; uniqueAngle: string };
} | null> {
  const typeConfig = BUSINESS_TYPE_CONFIG[businessType] || BUSINESS_TYPE_CONFIG.saas_tool;

  const prompt = `Create a complete, high-converting subscription business for:

Business Type: ${typeConfig.label}
Niche: "${niche}"
Description: "${description}"

APP/PORTAL INSTRUCTIONS: ${typeConfig.appRole}
PRICING STRATEGY: Use this as a guide: ${typeConfig.pricingStrategy}
CONTENT ANGLE: ${typeConfig.contentNote}

Return ONLY a valid JSON object (absolutely no markdown, no code fences):

{
  "appName": "Catchy brand name (2-4 words, memorable)",
  "tagline": "One powerful sentence that captures the transformation",
  "appDescription": "2-3 sentences describing what subscribers get",
  "appHtml": "COMPLETE single-file HTML with inline CSS and JS. Beautiful modern design. Dark header, clean cards, smooth animations. Must be a fully working, interactive experience appropriate for this business type. Use CSS variables for theming. Min 300 lines.",
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "priceMonthly": 0,
      "priceAnnual": 0,
      "priceLifetime": null,
      "perks": ["Limited access", "Sample content", "Community preview"],
      "highlighted": false,
      "color": "#6b7280"
    },
    {
      "id": "starter",
      "name": "Starter",
      "priceMonthly": 19,
      "priceAnnual": 179,
      "priceLifetime": null,
      "perks": ["Full access", "Core content", "Email support", "Monthly Q&A"],
      "highlighted": false,
      "color": "#3b82f6"
    },
    {
      "id": "pro",
      "name": "Pro",
      "priceMonthly": 47,
      "priceAnnual": 397,
      "priceLifetime": 297,
      "perks": ["Everything in Starter", "1:1 calls", "Private community", "Bonus resources", "Lifetime option available"],
      "highlighted": true,
      "color": "#7c3aed"
    }
  ],
  "landingPage": {
    "headline": "Bold headline targeting the core transformation/pain point",
    "subheadline": "Supporting sentence explaining HOW you deliver it",
    "features": [
      { "icon": "⚡", "title": "Feature/Benefit 1", "desc": "One sentence on what this delivers" },
      { "icon": "🎯", "title": "Feature/Benefit 2", "desc": "One sentence on what this delivers" },
      { "icon": "🚀", "title": "Feature/Benefit 3", "desc": "One sentence on what this delivers" },
      { "icon": "💡", "title": "Feature/Benefit 4", "desc": "One sentence on what this delivers" },
      { "icon": "🔥", "title": "Feature/Benefit 5", "desc": "One sentence on what this delivers" },
      { "icon": "💎", "title": "Feature/Benefit 6", "desc": "One sentence on what this delivers" }
    ],
    "testimonials": [
      { "name": "Sarah M.", "text": "Specific result-oriented testimonial with numbers if possible", "avatar": "SM" },
      { "name": "James K.", "text": "Testimonial about transformation and time/money saved", "avatar": "JK" },
      { "name": "Priya R.", "text": "Testimonial about lifestyle or career improvement", "avatar": "PR" }
    ],
    "faq": [
      { "q": "Niche-specific question 1?", "a": "Clear, trust-building answer" },
      { "q": "Niche-specific question 2?", "a": "Clear, trust-building answer" },
      { "q": "How fast will I see results?", "a": "Specific, honest timeline" },
      { "q": "Can I cancel anytime?", "a": "Yes — cancel anytime, no questions asked, keep access until period ends." }
    ],
    "cta": "Join Now"
  },
  "marketingPlan": {
    "targetAudience": "Precise psychographic + demographic description of ideal buyer",
    "painPoints": [
      "Specific pain point 1 (emotional)",
      "Specific pain point 2 (practical)",
      "Specific pain point 3 (financial or time)"
    ],
    "uniqueAngle": "What makes this different from everything else out there — the unfair advantage",
    "youtubeIdeas": [
      "Complete viral video title 1 (educational hook)",
      "Complete viral video title 2 (story-driven)",
      "Complete viral video title 3 (controversy or myth-busting)",
      "Complete viral video title 4 (results/case study)",
      "Complete viral video title 5 (beginner tutorial)"
    ],
    "tiktokIdeas": [
      "30-sec hook concept 1 — specific opening line + visual concept",
      "30-sec hook concept 2 — specific opening line + visual concept",
      "30-sec hook concept 3 — specific opening line + visual concept",
      "30-sec hook concept 4 — specific opening line + visual concept",
      "30-sec hook concept 5 — specific opening line + visual concept"
    ],
    "instagramTheme": "Detailed Instagram content strategy: visual aesthetic, caption style, posting frequency, story formats, reel concepts, and content pillars",
    "hooks": [
      "Pattern-interrupt ad hook 1 (starts with shocking stat or question)",
      "Pattern-interrupt ad hook 2 (starts with 'If you're X, then Y')",
      "Pattern-interrupt ad hook 3 (starts with transformation story)"
    ],
    "launchChecklist": [
      "Step 1: Action item with specific instruction",
      "Step 2: Action item with specific instruction",
      "Step 3: Action item with specific instruction",
      "Step 4: Action item with specific instruction",
      "Step 5: Action item with specific instruction",
      "Step 6: Action item with specific instruction",
      "Step 7: Action item with specific instruction"
    ]
  }
}`;

  const result = await callGeminiFallback(
    [{ role: "user", content: prompt }],
    GENERATION_SYSTEM,
    65536,
    "workspace",
  );
  if (!result?.text) return null;

  try {
    let raw = result.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(raw);
  } catch {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7);
}

// ─── Creator Routes ───────────────────────────────────────────────────────────

router.post("/saas/apps", requireAuth, async (req: any, res) => {
  try {
    const { niche, description, businessType = "saas_tool" } = req.body;
    if (!niche || !description) return res.status(400).json({ error: "niche and description are required" });

    const [draft] = await db.insert(saasAppsTable).values({
      creatorId: req.user.id,
      name: "Generating...",
      description,
      niche,
      businessType,
      generationStatus: "generating",
    }).returning();

    res.json({ id: draft.id, status: "generating" });

    (async () => {
      try {
        const generated = await generateSaasApp(niche, description, businessType);
        if (!generated) {
          await db.update(saasAppsTable).set({ generationStatus: "failed", updatedAt: new Date() }).where(eq(saasAppsTable.id, draft.id));
          return;
        }
        const slug = generateSlug(generated.appName);
        await db.update(saasAppsTable).set({
          name: generated.appName,
          tagline: generated.tagline,
          description: generated.appDescription,
          niche,
          businessType,
          deploySlug: slug,
          appHtml: generated.appHtml,
          tiers: generated.tiers,
          landingPage: generated.landingPage,
          marketingPlan: generated.marketingPlan,
          generationStatus: "complete",
          updatedAt: new Date(),
        }).where(eq(saasAppsTable.id, draft.id));
      } catch {
        await db.update(saasAppsTable).set({ generationStatus: "failed", updatedAt: new Date() }).where(eq(saasAppsTable.id, draft.id));
      }
    })();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/saas/apps", requireAuth, async (req: any, res) => {
  try {
    const apps = await db.select().from(saasAppsTable)
      .where(eq(saasAppsTable.creatorId, req.user.id))
      .orderBy(desc(saasAppsTable.createdAt));
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/saas/apps/:id", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    res.json(app);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/saas/apps/:id", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });

    const { name, tagline, brandColor, thankYouMessage, tiers, landingPage } = req.body;
    const [updated] = await db.update(saasAppsTable).set({
      ...(name !== undefined && { name }),
      ...(tagline !== undefined && { tagline }),
      ...(brandColor !== undefined && { brandColor }),
      ...(thankYouMessage !== undefined && { thankYouMessage }),
      ...(tiers !== undefined && { tiers }),
      ...(landingPage !== undefined && { landingPage }),
      updatedAt: new Date(),
    }).where(eq(saasAppsTable.id, app.id)).returning();
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/saas/apps/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    if (app.generationStatus !== "complete") return res.status(400).json({ error: "Generation not complete" });
    const [updated] = await db.update(saasAppsTable).set({ status: "live", updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id)).returning();
    res.json({ success: true, slug: updated.deploySlug, url: `/saas/${updated.deploySlug}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/saas/apps/:id/unpublish", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    await db.update(saasAppsTable).set({ status: "draft", updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/saas/apps/:id", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    await db.delete(saasAppsTable).where(eq(saasAppsTable.id, app.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/saas/apps/:id/subscribers", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    const subs = await db.select().from(saasSubscriptionsTable)
      .where(eq(saasSubscriptionsTable.appId, app.id))
      .orderBy(desc(saasSubscriptionsTable.createdAt));
    res.json(subs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/saas/apps/:id/regenerate", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    await db.update(saasAppsTable).set({ generationStatus: "generating", updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id));
    res.json({ status: "generating" });
    (async () => {
      try {
        const generated = await generateSaasApp(app.niche || app.description, app.description, app.businessType || "saas_tool");
        if (!generated) { await db.update(saasAppsTable).set({ generationStatus: "failed", updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id)); return; }
        await db.update(saasAppsTable).set({
          name: generated.appName, tagline: generated.tagline, description: generated.appDescription,
          appHtml: generated.appHtml, tiers: generated.tiers, landingPage: generated.landingPage,
          marketingPlan: generated.marketingPlan, generationStatus: "complete", updatedAt: new Date(),
        }).where(eq(saasAppsTable.id, app.id));
      } catch { await db.update(saasAppsTable).set({ generationStatus: "failed", updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id)); }
    })();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── YouTube Script Generation ────────────────────────────────────────────────

router.post("/saas/apps/:id/youtube-script", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });

    const { videoIdea } = req.body;
    const mp = app.marketingPlan as any;
    const topic = videoIdea || mp?.youtubeIdeas?.[0] || app.name;
    const typeConfig = BUSINESS_TYPE_CONFIG[app.businessType || "saas_tool"];

    const prompt = `Write a COMPLETE, human-sounding, viral long-form YouTube script for this video:

Title: "${topic}"
Product: ${app.name} — ${app.tagline}
Business Type: ${typeConfig.label}
Target Audience: ${(mp as any)?.targetAudience || "people interested in " + app.niche}
Unique Angle: ${(mp as any)?.uniqueAngle || ""}

SCRIPT REQUIREMENTS:
- Length: 4,000–5,000 words (this is a 20-25 minute video)
- Opening hook: First 30 seconds must be so compelling the viewer cannot stop watching
- Structure: Hook → Story → Problem Agitation → Solution Reveal → Deep Dive (5 chapters) → Objection Handling → CTA
- Tone: Conversational, passionate, human — like a top YouTuber talking to a friend
- Include: [B-ROLL SUGGESTION: ...] notes throughout
- Include: [PAUSE FOR EMPHASIS] markers
- Include: [ON SCREEN TEXT: ...] for key stats
- End with a soft CTA mentioning ${app.name} naturally
- Use pattern interrupts every 90 seconds to retain attention
- Include real-sounding examples and mini-stories
- Do NOT sound like AI — use contractions, imperfection, natural speech patterns

Format the script exactly like this:

[TITLE]: ${topic}
[HOOK - 0:00-0:30]:
...

[CHAPTER 1 - Title]:
...

(and so on through all chapters and CTA)`;

    const result = await callGeminiFallback(
      [{ role: "user", content: prompt }],
      `You are an elite YouTube scriptwriter with 10+ years experience writing scripts that have generated over 100 million views. You write in a completely human, engaging, non-AI voice. Your scripts retain viewers to the end and drive massive conversions.`,
      65536,
      "workspace",
    );

    if (!result?.text) return res.status(500).json({ error: "Script generation failed" });

    await db.update(saasAppsTable).set({ youtubeScript: result.text, updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id));
    res.json({ script: result.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Thumbnail Generation ─────────────────────────────────────────────────────

router.post("/saas/apps/:id/thumbnail", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });

    const { topic } = req.body;
    const thumbTopic = topic || `${app.name} — ${app.tagline}`;

    const imagePrompt = `Ultra high-quality YouTube thumbnail for a subscription business. Product: "${app.name}". Topic: "${thumbTopic}". Style: Bold, vibrant, high contrast. Include: large bold text overlay saying "${app.tagline?.slice(0, 40) || app.name}", human face showing excitement or transformation (if coaching/fitness type), vivid gradient background in ${app.brandColor || "#7c3aed"}. Make it impossible to scroll past. Professional, viral thumbnail design. 1792x1024 pixels.`;
    let imageUrl: string;

    const { uploadBase64ToR2, tryUploadBufferToR2 } = await import("../lib/r2Storage");

    // Try OpenAI DALL-E via shared key rotation
    const openaiKey = await getRotatedKey("openai");
    if (openaiKey) {
      const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "dall-e-3", prompt: imagePrompt, n: 1, size: "1792x1024", response_format: "b64_json" }),
      });
      const imgData = await imgRes.json() as any;
      if (imgData.data?.[0]?.b64_json) {
        const r2Url = await uploadBase64ToR2(`data:image/png;base64,${imgData.data[0].b64_json}`, "thumbnails", "png");
        imageUrl = r2Url ?? `data:image/png;base64,${imgData.data[0].b64_json}`;
      } else if (imgData.data?.[0]?.url) {
        try {
          const fetchedImg = await fetch(imgData.data[0].url);
          if (fetchedImg.ok) {
            const buf = Buffer.from(await fetchedImg.arrayBuffer());
            const r2Url = await tryUploadBufferToR2(buf, "thumbnails", "png", "image/png");
            imageUrl = r2Url ?? imgData.data[0].url;
          } else {
            imageUrl = await generateProductCoverImage({ title: app.name, topic: thumbTopic, type: "thumbnail" });
          }
        } catch {
          imageUrl = await generateProductCoverImage({ title: app.name, topic: thumbTopic, type: "thumbnail" });
        }
      } else {
        imageUrl = await generateProductCoverImage({ title: app.name, topic: thumbTopic, type: "thumbnail" });
      }
    } else {
      // No OpenAI key — go straight to Gemini pipeline (already uploads to R2 internally)
      imageUrl = await generateProductCoverImage({ title: app.name, topic: thumbTopic, type: "thumbnail" });
    }

    await db.update(saasAppsTable).set({ thumbnailUrl: imageUrl, updatedAt: new Date() }).where(eq(saasAppsTable.id, app.id));
    res.json({ thumbnailUrl: imageUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Voiceover Proxy ──────────────────────────────────────────────────────────

router.post("/saas/apps/:id/voiceover", requireAuth, async (req: any, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable)
      .where(and(eq(saasAppsTable.id, Number(req.params.id)), eq(saasAppsTable.creatorId, req.user.id))).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });

    const { text, voiceId = "am_adam", speed = 1.0 } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const voiceRes = await fetch(`${process.env.VOICE_ENGINE_URL ?? "http://localhost:8099"}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 3000), voiceId, speed }),
    });

    if (!voiceRes.ok) return res.status(502).json({ error: "Voice engine unavailable" });

    const audioBuffer = Buffer.from(await voiceRes.arrayBuffer());
    res.set("Content-Type", "audio/wav");
    res.set("Content-Length", String(audioBuffer.length));
    res.set("Content-Disposition", `attachment; filename="${app.deploySlug || "voiceover"}.wav"`);
    res.send(audioBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get("/saas/public/:slug", async (req, res) => {
  try {
    const [app] = await db.select({
      id: saasAppsTable.id, name: saasAppsTable.name, tagline: saasAppsTable.tagline,
      description: saasAppsTable.description, brandColor: saasAppsTable.brandColor,
      coverImageUrl: saasAppsTable.coverImageUrl, thumbnailUrl: saasAppsTable.thumbnailUrl,
      tiers: saasAppsTable.tiers, landingPage: saasAppsTable.landingPage,
      status: saasAppsTable.status, deploySlug: saasAppsTable.deploySlug,
      subscriberCount: saasAppsTable.subscriberCount, businessType: saasAppsTable.businessType,
    }).from(saasAppsTable).where(eq(saasAppsTable.deploySlug, req.params.slug)).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });
    if (app.status !== "live") return res.status(404).json({ error: "Not live yet" });
    res.json(app);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/saas/public/:slug/subscribe", async (req, res) => {
  try {
    const { tierId, billingPeriod = "monthly", email, name } = req.body;
    if (!email || !tierId) return res.status(400).json({ error: "email and tierId are required" });

    const [app] = await db.select().from(saasAppsTable).where(eq(saasAppsTable.deploySlug, req.params.slug)).limit(1);
    if (!app || app.status !== "live") return res.status(404).json({ error: "App not found" });

    const tiers = (app.tiers as any[]) || [];
    const tier = tiers.find((t: any) => t.id === tierId);
    if (!tier) return res.status(400).json({ error: "Invalid tier" });

    let price = billingPeriod === "annual" ? tier.priceAnnual
      : billingPeriod === "lifetime" ? (tier.priceLifetime ?? tier.priceMonthly * 12)
      : tier.priceMonthly;

    const accessToken = randomUUID();

    const [sub] = await db.insert(saasSubscriptionsTable).values({
      appId: app.id, subscriberEmail: email, subscriberName: name,
      tierId: tier.id, tierName: tier.name, billingPeriod,
      price: String(price), status: "active", accessToken,
    }).returning();

    await db.update(saasAppsTable).set({
      subscriberCount: sql`${saasAppsTable.subscriberCount} + 1`,
      ...(price > 0 && { totalRevenue: sql`${saasAppsTable.totalRevenue} + ${price}` }),
      updatedAt: new Date(),
    }).where(eq(saasAppsTable.id, app.id));

    if (price > 0) {
      try {
        const creatorCut = Math.floor(price * 0.8 * 100) / 100;
        await db.insert(walletTransactionsTable as any).values({
          userId: app.creatorId, type: "earning", amount: String(creatorCut),
          description: `SaaS subscription — ${tier.name} (${app.name})`, status: "completed",
        });
      } catch {}
    }

    res.json({ success: true, accessToken, accessUrl: `/saas/${app.deploySlug}/app?token=${accessToken}`, tier: tier.name, price });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/saas/public/:slug/access/:token", async (req, res) => {
  try {
    const [app] = await db.select().from(saasAppsTable).where(eq(saasAppsTable.deploySlug, req.params.slug)).limit(1);
    if (!app) return res.status(404).json({ error: "App not found" });

    const [sub] = await db.select().from(saasSubscriptionsTable)
      .where(and(eq(saasSubscriptionsTable.appId, app.id), eq(saasSubscriptionsTable.accessToken, req.params.token), eq(saasSubscriptionsTable.status, "active")))
      .limit(1);
    if (!sub) return res.status(403).json({ error: "Invalid or expired access token" });

    res.json({ valid: true, tier: sub.tierName, email: sub.subscriberEmail, appHtml: app.appHtml, appName: app.name, brandColor: app.brandColor, businessType: app.businessType });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

router.get("/admin/saas/stats", requireAdmin, async (_req, res) => {
  try {
    const [totalApps, liveApps, totalSubs, totalRev] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(saasAppsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(saasAppsTable).where(eq(saasAppsTable.status, "live")),
      db.select({ count: sql<number>`count(*)::int` }).from(saasSubscriptionsTable).where(eq(saasSubscriptionsTable.status, "active")),
      db.select({ total: sql<string>`coalesce(sum(total_revenue),0)::text` }).from(saasAppsTable),
    ]);
    res.json({
      totalApps: totalApps[0]?.count ?? 0,
      liveApps: liveApps[0]?.count ?? 0,
      totalSubscribers: totalSubs[0]?.count ?? 0,
      totalRevenue: totalRev[0]?.total ?? "0",
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/admin/saas/apps", requireAdmin, async (_req, res) => {
  try {
    const apps = await db
      .select({
        id: saasAppsTable.id, name: saasAppsTable.name, tagline: saasAppsTable.tagline,
        niche: saasAppsTable.niche, businessType: saasAppsTable.businessType,
        status: saasAppsTable.status, generationStatus: saasAppsTable.generationStatus,
        subscriberCount: saasAppsTable.subscriberCount, totalRevenue: saasAppsTable.totalRevenue,
        deploySlug: saasAppsTable.deploySlug, brandColor: saasAppsTable.brandColor,
        thumbnailUrl: saasAppsTable.thumbnailUrl, createdAt: saasAppsTable.createdAt,
        creatorId: saasAppsTable.creatorId,
        creatorEmail: usersTable.email, creatorName: usersTable.username,
      })
      .from(saasAppsTable)
      .leftJoin(usersTable, eq(saasAppsTable.creatorId, usersTable.id))
      .orderBy(desc(saasAppsTable.createdAt));
    res.json(apps);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/admin/saas/apps/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(saasAppsTable).where(eq(saasAppsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/saas/apps/:id/publish", requireAdmin, async (req, res) => {
  try {
    const [updated] = await db.update(saasAppsTable).set({ status: "live", updatedAt: new Date() })
      .where(eq(saasAppsTable.id, Number(req.params.id))).returning();
    res.json({ success: true, app: updated });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/admin/saas/apps/:id/unpublish", requireAdmin, async (req, res) => {
  try {
    await db.update(saasAppsTable).set({ status: "draft", updatedAt: new Date() })
      .where(eq(saasAppsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;

