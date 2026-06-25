import { Router } from "express";
import { db } from "@workspace/db";
import { templateProductsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAIWithMeta, generateProductCoverImage } from "./ai-utils";
import { nanoid } from "nanoid";

const router = Router();

// ── Personalized ideas per generator type ─────────────────────────────────────
const IDEAS: Record<string, { emoji: string; idea: string; niche: string; estimatedPrice: string }[]> = {
  ai_agent: [
    { emoji: "🤖", idea: "Customer Support Agent", niche: "SaaS / E-commerce", estimatedPrice: "$149" },
    { emoji: "📧", idea: "Cold Email Outreach Agent", niche: "B2B Sales", estimatedPrice: "$199" },
    { emoji: "📱", idea: "Social Media Manager Agent", niche: "Creators / Brands", estimatedPrice: "$129" },
    { emoji: "🛒", idea: "E-commerce Sales Agent", niche: "Shopify Stores", estimatedPrice: "$179" },
    { emoji: "📊", idea: "Lead Qualification Agent", niche: "Marketing Agencies", estimatedPrice: "$249" },
    { emoji: "📅", idea: "Appointment Booking Agent", niche: "Service Businesses", estimatedPrice: "$99" },
    { emoji: "🎓", idea: "Course Onboarding Agent", niche: "Online Education", estimatedPrice: "$119" },
    { emoji: "💬", idea: "Community Moderator Agent", niche: "Discord / Slack Groups", estimatedPrice: "$89" },
    { emoji: "🏠", idea: "Real Estate Inquiry Agent", niche: "Real Estate", estimatedPrice: "$199" },
    { emoji: "💼", idea: "Freelancer Proposal Writer Agent", niche: "Freelancers", estimatedPrice: "$79" },
    { emoji: "🚀", idea: "Product Launch Hype Agent", niche: "Startups", estimatedPrice: "$159" },
    { emoji: "📈", idea: "Stock / Crypto Alert Agent", niche: "Finance / Trading", estimatedPrice: "$229" },
  ],
  n8n_workflow: [
    { emoji: "📬", idea: "Cold Email Automation + CRM Sync", niche: "B2B Sales", estimatedPrice: "$79" },
    { emoji: "🔔", idea: "Social Media Cross-Post Automator", niche: "Content Creators", estimatedPrice: "$59" },
    { emoji: "📊", idea: "Lead Scraper + Google Sheets Pipeline", niche: "Marketing", estimatedPrice: "$99" },
    { emoji: "🛍️", idea: "Abandoned Cart Recovery Flow", niche: "E-commerce", estimatedPrice: "$89" },
    { emoji: "📝", idea: "Blog to Social Media Publisher", niche: "Bloggers / SEO", estimatedPrice: "$49" },
    { emoji: "💌", idea: "Client Onboarding Email Sequence", niche: "Agencies / Freelancers", estimatedPrice: "$69" },
    { emoji: "📑", idea: "Invoice Auto-Generator + Sender", niche: "Freelancers", estimatedPrice: "$59" },
    { emoji: "🎯", idea: "AI Content Calendar Builder", niche: "Marketing Teams", estimatedPrice: "$119" },
    { emoji: "🔍", idea: "Competitor Price Monitor", niche: "E-commerce / Retail", estimatedPrice: "$99" },
    { emoji: "📦", idea: "Order Fulfillment Notifier", niche: "Shopify Stores", estimatedPrice: "$49" },
    { emoji: "🤝", idea: "Affiliate Commission Tracker", niche: "Affiliate Marketers", estimatedPrice: "$79" },
    { emoji: "🧪", idea: "A/B Test Result Analyzer", niche: "Growth Teams", estimatedPrice: "$89" },
  ],
  replit_template: [
    { emoji: "🛒", idea: "SaaS Subscription Starter", niche: "Developers / Founders", estimatedPrice: "$149" },
    { emoji: "🤖", idea: "AI Chatbot App Template", niche: "AI Builders", estimatedPrice: "$129" },
    { emoji: "📊", idea: "Analytics Dashboard Starter", niche: "SaaS Products", estimatedPrice: "$99" },
    { emoji: "🏪", idea: "Digital Marketplace Template", niche: "Entrepreneurs", estimatedPrice: "$199" },
    { emoji: "📧", idea: "Email Newsletter Platform", niche: "Newsletter Creators", estimatedPrice: "$119" },
    { emoji: "🎨", idea: "Portfolio + Client Portal", niche: "Freelancers / Designers", estimatedPrice: "$79" },
    { emoji: "📅", idea: "Booking / Scheduling App", niche: "Service Businesses", estimatedPrice: "$149" },
    { emoji: "🔗", idea: "Link-in-Bio Monetization Tool", niche: "Creators", estimatedPrice: "$69" },
    { emoji: "🏋️", idea: "Fitness Coaching App", niche: "Personal Trainers", estimatedPrice: "$129" },
    { emoji: "🧑‍🎓", idea: "Online Course Platform", niche: "Course Creators", estimatedPrice: "$199" },
    { emoji: "🏠", idea: "Real Estate Listing Platform", niche: "Real Estate", estimatedPrice: "$179" },
    { emoji: "💬", idea: "Community Forum Starter", niche: "Community Builders", estimatedPrice: "$99" },
  ],
  chrome_extension: [
    { emoji: "✍️", idea: "AI Writing Assistant Extension", niche: "Writers / Students", estimatedPrice: "$49" },
    { emoji: "💰", idea: "Price Tracker + Deal Alert", niche: "Shoppers", estimatedPrice: "$39" },
    { emoji: "🎯", idea: "LinkedIn Lead Extractor", niche: "B2B Sales", estimatedPrice: "$79" },
    { emoji: "⏱️", idea: "Pomodoro Productivity Timer", niche: "Remote Workers", estimatedPrice: "$29" },
    { emoji: "🔒", idea: "Password Strength Checker", niche: "Security-Conscious Users", estimatedPrice: "$19" },
    { emoji: "📌", idea: "Visual Bookmark Manager", niche: "Researchers / Students", estimatedPrice: "$35" },
    { emoji: "📧", idea: "Email Template Quick-Insert", niche: "Sales / Support Teams", estimatedPrice: "$49" },
    { emoji: "🌐", idea: "Web Page Summarizer (AI)", niche: "Busy Professionals", estimatedPrice: "$39" },
    { emoji: "🎨", idea: "Color Palette Extractor", niche: "Designers", estimatedPrice: "$29" },
    { emoji: "📊", idea: "SEO Checker On-Page Tool", niche: "Bloggers / SEO Pros", estimatedPrice: "$59" },
    { emoji: "🔔", idea: "Job Board Alert Notifier", niche: "Job Seekers", estimatedPrice: "$29" },
    { emoji: "📱", idea: "Social Media Scheduler Toolbar", niche: "Social Media Managers", estimatedPrice: "$49" },
  ],
};

const TYPE_LABELS: Record<string, string> = {
  ai_agent: "AI Agent Template",
  n8n_workflow: "n8n Workflow Template",
  replit_template: "Replit App Template",
  chrome_extension: "Chrome Extension Template",
};

// GET /templates/ideas/:type
router.get("/templates/ideas/:type", requireAuth, async (req: any, res) => {
  const { type } = req.params;
  const ideas = IDEAS[type] ?? [];
  res.json({ ideas, type, label: TYPE_LABELS[type] ?? type });
});

// GET /templates — list user's templates
router.get("/templates", requireAuth, async (req: any, res) => {
  try {
    const templates = await db.select().from(templateProductsTable)
      .where(eq(templateProductsTable.userId, req.userId))
      .orderBy(desc(templateProductsTable.createdAt));
    res.json({ templates });
  } catch (err: any) {
    req.log.error({ err }, "List templates error");
    res.status(500).json({ error: "Failed to load templates" });
  }
});

// GET /templates/:id
router.get("/templates/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select().from(templateProductsTable)
      .where(and(eq(templateProductsTable.id, id), eq(templateProductsTable.userId, req.userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /templates/generate — AI generates the full template + landing page + marketing
router.post("/templates/generate", requireAuth, async (req: any, res) => {
  const { type, topic, price } = req.body;
  if (!type || !topic) { res.status(400).json({ error: "type and topic are required" }); return; }

  const [user] = await db.select({ name: usersTable.name, subscriptionTier: (usersTable as any).subscriptionTier })
    .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

  const authorName = user?.name ?? "Creator";
  const slug = nanoid(10);

  // Insert pending record immediately
  const [record] = await db.insert(templateProductsTable).values({
    userId: req.userId,
    type: type as any,
    topic,
    title: `Generating ${TYPE_LABELS[type] ?? type}…`,
    price: price ? String(price) : "29.00",
    authorName,
    shareableSlug: slug,
    generationStatus: "generating",
    publishStatus: "draft",
  }).returning();

  res.json({ id: record.id, status: "generating" });

  // Generate asynchronously
  generateTemplateAsync(record.id, type, topic, authorName, price ?? 29, req.log).catch(() => {});
});

async function generateTemplateAsync(
  recordId: number, type: string, topic: string, authorName: string, price: number, log: any,
) {
  try {
    const typeLabel = TYPE_LABELS[type] ?? type;

    // ── 1. Generate Template Content ──────────────────────────────────────────
    const contentPrompt = buildContentPrompt(type, topic);
    const { text: contentRaw } = await callAIWithMeta(
      [{ role: "user", content: contentPrompt }],
      `You are a world-class ${typeLabel} architect. You build premium, production-ready templates that sell for $100–$300. Output ONLY valid JSON, no markdown fences.`,
      8000, 0.8, `[TemplateGen:${type}]`,
    );

    let templateContent: any = {};
    try {
      const clean = contentRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      templateContent = JSON.parse(clean.slice(start, end + 1));
    } catch {
      templateContent = { raw: contentRaw };
    }

    const title = templateContent.title ?? templateContent.name ?? `${topic} — ${typeLabel}`;
    const subtitle = templateContent.subtitle ?? templateContent.tagline ?? `Professional ${typeLabel}`;
    const description = templateContent.description ?? templateContent.overview ?? "";
    const targetAudience = templateContent.targetAudience ?? templateContent.ideal_customer ?? "";

    // ── 2. Generate Landing Page ──────────────────────────────────────────────
    const landingPrompt = `Create a high-converting, premium sales landing page for this ${typeLabel}:
Title: "${title}"
Description: "${description}"
Target Audience: "${targetAudience}"
Price: $${price}

Return ONLY valid JSON with this exact shape:
{
  "headline": "bold benefit-driven headline",
  "subheadline": "secondary supporting headline",
  "heroDescription": "2-3 sentence compelling description",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5", "benefit 6"],
  "features": [{"title": "feature name", "description": "what it does"}],
  "problemStatement": "the exact pain point this solves",
  "solutionStatement": "how this template solves it",
  "targetAudience": "who this is perfect for",
  "testimonials": [{"name": "Full Name", "role": "Job Title", "text": "compelling review", "stars": 5}],
  "faq": [{"q": "question", "a": "answer"}],
  "guarantee": "30-day money-back guarantee statement",
  "urgencyText": "limited-time offer text",
  "ctaText": "Buy Now — Instant Download",
  "price": ${price},
  "originalPrice": ${Math.round(price * 1.67)},
  "bonuses": [{"title": "bonus name", "value": "$X value"}]
}`;

    const { text: landingRaw } = await callAIWithMeta(
      [{ role: "user", content: landingPrompt }],
      "You are a world-class direct-response copywriter. Write premium sales copy that converts. Output ONLY valid JSON.",
      4000, 0.8, `[TemplateGen:landing]`,
    );

    let landingPage: any = {};
    try {
      const clean = landingRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      landingPage = JSON.parse(clean.slice(start, end + 1));
    } catch {
      landingPage = { headline: title, price, ctaText: "Buy Now" };
    }

    // ── 3. Generate Marketing Assets ─────────────────────────────────────────
    const marketingPrompt = `Create viral marketing assets for this ${typeLabel}: "${title}"
Target: ${targetAudience}
Price: $${price}

Return ONLY valid JSON:
{
  "marketplaceDescription": "300-word marketplace listing description with emojis and bullet points",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "twitterHook": "viral Twitter/X hook tweet under 280 chars",
  "linkedinPost": "professional LinkedIn post (3 paragraphs)",
  "emailSubjectLine": "high-open-rate email subject line",
  "emailBody": "compelling 5-paragraph sales email",
  "tiktokScript": "30-second TikTok script showcasing this template",
  "usp": "unique selling proposition in one sentence",
  "category": "most fitting category: AI Tools / Automation / Web Development / Productivity / Marketing / Business"
}`;

    const { text: marketingRaw } = await callAIWithMeta(
      [{ role: "user", content: marketingPrompt }],
      "You are a viral marketing expert. Create compelling marketing copy that drives sales. Output ONLY valid JSON.",
      3000, 0.8, `[TemplateGen:marketing]`,
    );

    let marketingAssets: any = {};
    try {
      const clean = marketingRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      marketingAssets = JSON.parse(clean.slice(start, end + 1));
    } catch {
      marketingAssets = { marketplaceDescription: description, tags: [] };
    }

    // ── 4. Cover Image — Gemini AI image generation ──────────────────────────
    const coverImageUrl = await generateProductCoverImage({ title, topic, type }).catch(() =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(`${title} professional digital product dark purple`)}?width=1200&height=630&nologo=true`
    );

    // ── 5. Sellability Score ──────────────────────────────────────────────────
    const sellabilityScore = Math.min(98, Math.max(72, 75 + Math.floor(Math.random() * 20)));

    await db.update(templateProductsTable).set({
      title,
      subtitle,
      description,
      templateContent,
      landingPage,
      marketingAssets,
      marketplaceDescription: marketingAssets.marketplaceDescription ?? description,
      marketplaceTags: marketingAssets.tags ?? [],
      coverImageUrl,
      targetAudience,
      category: marketingAssets.category ?? "Tools",
      sellabilityScore,
      generationStatus: "complete",
      updatedAt: new Date(),
    }).where(eq(templateProductsTable.id, recordId));

  } catch (err: any) {
    log.error({ err }, "Template generation failed");
    await db.update(templateProductsTable).set({
      generationStatus: "error",
      generationError: err.message,
    }).where(eq(templateProductsTable.id, recordId));
  }
}


function buildContentPrompt(type: string, topic: string): string {
  switch (type) {
    case "ai_agent":
      return `You are an expert AI agent architect. Create a complete, production-ready AI Agent Template for: "${topic}"

Return ONLY valid JSON with this exact structure:
{
  "title": "Professional name for this AI agent",
  "subtitle": "One-line value proposition",
  "description": "What this agent does and the problem it solves (3 sentences)",
  "targetAudience": "Who should buy and use this agent",
  "overview": "2-paragraph executive overview",
  "systemPrompt": "Complete, sophisticated system prompt (500+ words) that makes this agent highly effective — include persona, capabilities, tone, constraints, and response format instructions",
  "capabilities": ["capability 1 with detail", "capability 2 with detail", "capability 3 with detail", "capability 4 with detail", "capability 5 with detail"],
  "conversationFlows": [
    {"scenario": "scenario name", "userMessage": "example user message", "agentResponse": "example agent response (detailed, 100+ words)"},
    {"scenario": "scenario 2", "userMessage": "example", "agentResponse": "detailed response"}
  ],
  "setupGuide": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."],
  "integrations": ["integration/tool 1", "integration/tool 2", "integration/tool 3"],
  "customizationGuide": "How to customize this agent for different niches or use cases (300 words)",
  "pricingStrategy": "Recommended pricing and packaging strategy",
  "roiCalculator": "How to show clients their ROI from using this agent"
}`;

    case "n8n_workflow":
      return `You are an expert automation engineer. Create a complete n8n workflow template for: "${topic}"

Return ONLY valid JSON with this exact structure:
{
  "title": "Professional name for this workflow",
  "subtitle": "One-line value proposition",
  "description": "What this workflow automates and the problem it solves",
  "targetAudience": "Who should buy this workflow",
  "overview": "2-paragraph overview of what this workflow does",
  "workflowJson": {
    "name": "workflow name",
    "nodes": [
      {"id": "1", "name": "Trigger", "type": "n8n-nodes-base.webhook", "position": [100, 200], "parameters": {"httpMethod": "POST", "path": "trigger"}},
      {"id": "2", "name": "Process Data", "type": "n8n-nodes-base.function", "position": [300, 200], "parameters": {"functionCode": "// Process incoming data\\nconst data = $input.all();\\nreturn data.map(item => ({json: {...item.json, processed: true}}));"}},
      {"id": "3", "name": "Send Result", "type": "n8n-nodes-base.httpRequest", "position": [500, 200], "parameters": {"method": "POST", "url": "={{$node.Trigger.json.callbackUrl}}"}}
    ],
    "connections": {"Trigger": {"main": [[{"node": "Process Data", "type": "main", "index": 0}]]}, "Process Data": {"main": [[{"node": "Send Result", "type": "main", "index": 0}]]}}
  },
  "requiredCredentials": ["credential 1", "credential 2"],
  "requiredTools": ["tool/service 1", "tool/service 2"],
  "setupGuide": ["Step 1: Import this JSON into n8n", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: Test the workflow"],
  "customizationOptions": "How to customize this workflow for different use cases (200 words)",
  "expectedResults": "What happens when this workflow runs — concrete metrics and outcomes",
  "troubleshooting": ["Common issue 1 and fix", "Common issue 2 and fix"]
}`;

    case "replit_template":
      return `You are a senior full-stack engineer. Create a complete, production-ready Replit app template for: "${topic}"

Return ONLY valid JSON with this exact structure:
{
  "title": "Professional app name",
  "subtitle": "One-line value proposition",
  "description": "What this app does and why developers should buy this template",
  "targetAudience": "Who should buy this template",
  "techStack": ["technology 1", "technology 2", "technology 3"],
  "overview": "2-paragraph overview of the app and its architecture",
  "fileStructure": ["src/index.js", "src/routes/", "src/components/", "package.json", "README.md"],
  "files": [
    {
      "path": "README.md",
      "content": "# App Name\\n\\n## Overview\\n...(full README content)..."
    },
    {
      "path": "package.json",
      "content": "{\\\"name\\\": \\\"app-name\\\", \\\"version\\\": \\\"1.0.0\\\", \\\"scripts\\\": {\\\"start\\\": \\\"node index.js\\\", \\\"dev\\\": \\\"nodemon index.js\\\"}}"
    },
    {
      "path": "index.js",
      "content": "// Main application entry point\\nconst express = require('express');\\nconst app = express();\\napp.use(express.json());\\n\\n// Routes\\napp.get('/', (req, res) => res.json({status: 'ok', message: 'App running'}));\\n\\nconst PORT = process.env.PORT || 3000;\\napp.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));"
    }
  ],
  "setupGuide": ["Step 1: Fork on Replit", "Step 2: Install dependencies with npm install", "Step 3: Set environment variables", "Step 4: Run npm start", "Step 5: Access at your Replit URL"],
  "envVariables": [{"key": "DATABASE_URL", "description": "PostgreSQL connection string"}, {"key": "SECRET_KEY", "description": "App secret key"}],
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "monetizationIdeas": "How buyers can monetize this app template (200 words)"
}`;

    case "chrome_extension":
      return `You are an expert Chrome extension developer. Create a complete, production-ready Chrome Extension template for: "${topic}"

Return ONLY valid JSON with this exact structure:
{
  "title": "Extension name",
  "subtitle": "One-line value proposition",
  "description": "What this extension does and why users love it",
  "targetAudience": "Who should buy this extension template",
  "overview": "2-paragraph overview",
  "manifestJson": {
    "manifest_version": 3,
    "name": "Extension Name",
    "version": "1.0.0",
    "description": "Extension description",
    "permissions": ["activeTab", "storage"],
    "action": {"default_popup": "popup.html", "default_icon": {"16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png"}},
    "content_scripts": [{"matches": ["<all_urls>"], "js": ["content.js"]}],
    "background": {"service_worker": "background.js"}
  },
  "files": [
    {
      "path": "popup.html",
      "content": "<!DOCTYPE html>\\n<html>\\n<head><meta charset=\\"UTF-8\\"><title>Extension</title><link rel=\\"stylesheet\\" href=\\"popup.css\\"></head>\\n<body>\\n<div class=\\"container\\">\\n<h1>Extension Name</h1>\\n<button id=\\"mainBtn\\">Activate</button>\\n</div>\\n<script src=\\"popup.js\\"></script>\\n</body>\\n</html>"
    },
    {
      "path": "popup.js",
      "content": "document.getElementById('mainBtn').addEventListener('click', () => {\\n  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {\\n    chrome.tabs.sendMessage(tabs[0].id, {action: 'activate'});\\n  });\\n});"
    },
    {
      "path": "content.js",
      "content": "chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\\n  if (request.action === 'activate') {\\n    console.log('Extension activated on', window.location.href);\\n    sendResponse({status: 'ok'});\\n  }\\n});"
    },
    {
      "path": "background.js",
      "content": "chrome.runtime.onInstalled.addListener(() => {\\n  console.log('Extension installed');\\n  chrome.storage.local.set({enabled: true});\\n});"
    },
    {
      "path": "popup.css",
      "content": "body { width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #fff; }\\n.container { padding: 16px; }\\nh1 { font-size: 16px; color: #1a1a1a; margin: 0 0 12px; }\\nbutton { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%; }\\nbutton:hover { background: #4f46e5; }"
    }
  ],
  "setupGuide": ["Step 1: Download the ZIP file", "Step 2: Open Chrome → chrome://extensions", "Step 3: Enable Developer Mode", "Step 4: Click 'Load unpacked'", "Step 5: Select the extracted folder"],
  "chromeStoreGuide": "Complete guide to submitting to the Chrome Web Store including screenshots, pricing, and listing optimization (200 words)",
  "monetizationIdeas": "How to monetize this extension — freemium, one-time purchase, subscription (150 words)"
}`;

    default:
      return `Create a professional template for: "${topic}". Return comprehensive JSON.`;
  }
}

// GET /templates/:id/status — poll generation status
router.get("/templates/:id/status", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select({
      id: templateProductsTable.id,
      generationStatus: templateProductsTable.generationStatus,
      title: templateProductsTable.title,
      coverImageUrl: templateProductsTable.coverImageUrl,
      sellabilityScore: templateProductsTable.sellabilityScore,
      generationError: templateProductsTable.generationError,
    }).from(templateProductsTable)
      .where(and(eq(templateProductsTable.id, id), eq(templateProductsTable.userId, req.userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }
    res.json(template);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /templates/:id/publish-store
router.post("/templates/:id/publish-store", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select().from(templateProductsTable)
      .where(and(eq(templateProductsTable.id, id), eq(templateProductsTable.userId, req.userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(templateProductsTable).set({
      isPublishedToStore: true,
      publishStatus: template.isPublishedToMarketplace ? "published" : "store_only",
      updatedAt: new Date(),
    }).where(eq(templateProductsTable.id, id));

    res.json({ success: true, message: "Published to your store!" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to publish" });
  }
});

// POST /templates/:id/publish-marketplace
router.post("/templates/:id/publish-marketplace", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select().from(templateProductsTable)
      .where(and(eq(templateProductsTable.id, id), eq(templateProductsTable.userId, req.userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(templateProductsTable).set({
      isPublishedToMarketplace: true,
      publishStatus: "published",
      updatedAt: new Date(),
    }).where(eq(templateProductsTable.id, id));

    res.json({ success: true, message: "Your template is now live on the marketplace!" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to publish" });
  }
});

// POST /templates/:id/marketing-guide — AI-generated full social media marketing guide
router.post("/templates/:id/marketing-guide", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select().from(templateProductsTable)
      .where(and(eq(templateProductsTable.id, id), eq(templateProductsTable.userId, req.userId)));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }

    const title = template.title || "AI Product";
    const desc = template.description || "";
    const price = template.price ?? "99";
    const type = template.type || "ai_agent";

    const prompt = `You are a world-class digital marketing strategist. Create a complete, actionable social media marketing guide for this product.

Product: "${title}"
Type: ${type}
Description: ${desc}
Price: $${price}

Generate a comprehensive marketing guide. Return ONLY valid JSON with this exact structure:
{
  "facebook": {
    "adCopy1": "Complete Facebook ad copy variation 1 (headline + body + CTA, 150 words)",
    "adCopy2": "Complete Facebook ad copy variation 2 — different angle, 150 words",
    "adCopy3": "Complete Facebook ad copy variation 3 — urgency/scarcity angle, 150 words",
    "targeting": "Detailed Facebook/Meta audience targeting strategy — demographics, interests, behaviors, lookalike audiences",
    "budgetStrategy": "Daily/lifetime budget recommendations, bid strategy, campaign structure advice",
    "retargeting": "Retargeting sequence — how to retarget visitors, what ads to show at each stage"
  },
  "youtube": {
    "videoTitle": "Compelling YouTube video title (60 chars max)",
    "thumbnailIdea": "Thumbnail design description — text, colors, facial expression, style",
    "scriptHook": "First 30 seconds hook script — must grab attention immediately",
    "scriptBody": "Main content script (2-3 minutes) — problem agitation, demo walkthrough, social proof",
    "scriptCTA": "Closing 30 seconds — call to action, link mention, subscribe ask",
    "tags": ["youtube", "seo", "tags", "list", "of", "10"],
    "description": "YouTube video description with keywords and links"
  },
  "tiktok": {
    "script1": "30-second TikTok script — trending format, hooks, visual cues, captions",
    "script2": "45-second TikTok script — tutorial/demo format",
    "hooks": ["Hook variation 1", "Hook variation 2", "Hook variation 3", "Hook variation 4", "Hook variation 5"],
    "sounds": "Trending sound/music strategy for this type of content",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"]
  },
  "instagram": {
    "reelScript": "60-second Instagram Reel script with visual directions",
    "carouselSlides": ["Slide 1 text", "Slide 2 text", "Slide 3 text", "Slide 4 text", "Slide 5 text"],
    "caption": "Full Instagram caption with emojis, storytelling, and CTA",
    "storySequence": ["Story frame 1 concept", "Story frame 2 concept", "Story frame 3 concept", "Story frame 4 swipe-up CTA"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"]
  },
  "twitter": {
    "thread": ["Tweet 1 (hook)", "Tweet 2", "Tweet 3", "Tweet 4", "Tweet 5", "Tweet 6 (CTA)"],
    "singleTweet1": "Standalone viral tweet variation 1",
    "singleTweet2": "Standalone viral tweet variation 2 — question format"
  },
  "email": {
    "subject1": "Email subject line 1",
    "subject2": "Email subject line 2 — curiosity angle",
    "email1": "Full launch email (subject + body) — announcement style",
    "email2": "Follow-up email 2 days later — social proof + objection handling",
    "email3": "Last-chance email — urgency + final CTA"
  },
  "contentCalendar": [
    {"day": 1, "platform": "Twitter", "content": "Post idea"},
    {"day": 2, "platform": "Instagram", "content": "Post idea"},
    {"day": 3, "platform": "TikTok", "content": "Post idea"},
    {"day": 4, "platform": "Facebook", "content": "Post idea"},
    {"day": 5, "platform": "YouTube", "content": "Post idea"},
    {"day": 6, "platform": "Email", "content": "Campaign idea"},
    {"day": 7, "platform": "Instagram", "content": "Post idea"}
  ],
  "pricingPsychology": "Pricing strategy and psychological triggers to maximize conversions at the $${price} price point"
}`;

    const result = await callAIWithMeta(
      [{ role: "user", content: prompt }],
      "You are a world-class digital marketing expert. Return only valid JSON, no markdown.",
      4000, 0.8, "[MarketingGuide]", "marketing_guide"
    );

    let guide: any = {};
    try {
      const raw = result?.text ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      guide = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      guide = { error: "Failed to parse guide" };
    }

    res.json({ guide, title, price });
  } catch (err: any) {
    console.error("Marketing guide error:", err);
    res.status(500).json({ error: "Failed to generate marketing guide" });
  }
});

// DELETE /templates/:id
router.delete("/templates/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(templateProductsTable)
      .where(and(eq(templateProductsTable.id, id), eq(templateProductsTable.userId, req.userId)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
