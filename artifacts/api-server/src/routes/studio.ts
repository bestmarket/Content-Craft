import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callGeminiFallback, callGroqRotated, generateProductCoverImage } from "./ai-utils";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── In-memory job stage registry ─────────────────────────────────────────────
interface JobState {
  stage: string;
  stageIndex: number;
  totalStages: number;
  label: string;
  error?: string;
  startedAt: number;
}
const jobRegistry = new Map<number, JobState>();

const STAGES = [
  { key: "researching",   label: "Researching Niche Matrix & Audience Insights" },
  { key: "architecting",  label: "Architecting Product Structure & Chapter Framework" },
  { key: "writing",       label: "Generating Full Chapter Content" },
  { key: "marketing",     label: "Compiling Marketing Assets & Sales Copy" },
  { key: "scoring",       label: "Evaluating Product Quality Score" },
  { key: "compiling",     label: "Compiling PDF Layout & Publishing" },
];

function setStage(productId: number, idx: number) {
  jobRegistry.set(productId, {
    stage: STAGES[idx].key,
    stageIndex: idx + 1,
    totalStages: STAGES.length,
    label: STAGES[idx].label,
    startedAt: Date.now(),
  });
}

function setError(productId: number, error: string) {
  const existing = jobRegistry.get(productId) ?? { stage: "error", stageIndex: 0, totalStages: STAGES.length, label: "Error", startedAt: Date.now() };
  jobRegistry.set(productId, { ...existing, error });
}

// ── AI call wrapper ───────────────────────────────────────────────────────────
async function askAI(systemPrompt: string, userPrompt: string, maxTokens = 4000): Promise<string> {
  const messages = [{ role: "user", content: userPrompt }];
  const result =
    (await callGeminiFallback(messages, systemPrompt, maxTokens, "studio")) ??
    (await callGroqRotated(messages, maxTokens));
  return result?.text ?? "";
}

function parseJSON(text: string): any {
  const clean = text.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
  try { return JSON.parse(clean); } catch { return null; }
}

// ── Stage A: Research ─────────────────────────────────────────────────────────
async function stageResearch(topic: string, targetAudience: string, niche: string, angle: string) {
  const sys = `You are an elite market research analyst and niche expert. Produce structured JSON only.`;
  const prompt = `Research this digital product concept deeply.
Topic: "${topic}"
Target Audience: "${targetAudience}"
Niche: "${niche}"
Angle/Direction: "${angle}"

Return ONLY valid JSON:
{
  "marketOverview": "2-3 sentence market summary",
  "audiencePainPoints": ["pain1", "pain2", "pain3", "pain4", "pain5"],
  "desiredOutcomes": ["outcome1", "outcome2", "outcome3"],
  "competitorGap": "what the market is missing",
  "uniquePositioning": "how to stand out",
  "keyFrameworks": ["framework1", "framework2", "framework3"],
  "searchTerms": ["term1", "term2", "term3"]
}`;
  const raw = await askAI(sys, prompt, 2000);
  return parseJSON(raw) ?? { marketOverview: topic, audiencePainPoints: [], desiredOutcomes: [], competitorGap: "", uniquePositioning: "", keyFrameworks: [], searchTerms: [] };
}

// ── Stage B: Architecture ─────────────────────────────────────────────────────
async function stageArchitecture(topic: string, subtitle: string, research: any, authorName: string) {
  const sys = `You are a world-class digital product architect. Create premium ebook structures that sell. Produce structured JSON only.`;
  const prompt = `Design a premium ebook product architecture.
Topic: "${topic}"
Subtitle: "${subtitle}"
Author: "${authorName}"
Market Pain Points: ${JSON.stringify(research.audiencePainPoints)}
Unique Positioning: "${research.uniquePositioning}"
Key Frameworks: ${JSON.stringify(research.keyFrameworks)}

Return ONLY valid JSON:
{
  "title": "compelling book title (not just the topic)",
  "subtitle": "powerful benefit-driven subtitle",
  "tagline": "one powerful line",
  "chapters": [
    { "number": 1, "title": "Chapter Title", "hook": "opening hook sentence", "keyPoints": ["point1","point2","point3"], "wordTarget": 700 },
    { "number": 2, "title": "Chapter Title", "hook": "opening hook sentence", "keyPoints": ["point1","point2","point3"], "wordTarget": 700 },
    { "number": 3, "title": "Chapter Title", "hook": "opening hook sentence", "keyPoints": ["point1","point2","point3"], "wordTarget": 700 },
    { "number": 4, "title": "Chapter Title", "hook": "opening hook sentence", "keyPoints": ["point1","point2","point3"], "wordTarget": 700 },
    { "number": 5, "title": "Chapter Title", "hook": "opening hook sentence", "keyPoints": ["point1","point2","point3"], "wordTarget": 700 },
    { "number": 6, "title": "Chapter Title", "hook": "opening hook sentence", "keyPoints": ["point1","point2","point3"], "wordTarget": 700 }
  ],
  "introduction": { "title": "Introduction Title", "promise": "The transformation promise" },
  "conclusion": { "title": "Conclusion Title", "cta": "What to do next" },
  "bonus": { "title": "Bonus Section Title", "description": "What the bonus contains" },
  "tableOfContents": ["Introduction", "Chapter 1...", "Chapter 2...", "Chapter 3...", "Chapter 4...", "Chapter 5...", "Chapter 6...", "Conclusion", "Bonus"]
}`;
  const raw = await askAI(sys, prompt, 3000);
  return parseJSON(raw);
}

// ── Stage C: Content ──────────────────────────────────────────────────────────
async function stageContent(topic: string, arch: any, research: any) {
  const sys = `You are a master premium ebook writer. You write authoritative, actionable, human prose — no filler, no clichés. Each chapter must be substantive with real insight, examples, and action steps.`;

  const chapterPromises = (arch.chapters ?? []).slice(0, 6).map(async (ch: any) => {
    const prompt = `Write Chapter ${ch.number}: "${ch.title}" for the ebook "${arch.title}".
Hook: ${ch.hook}
Key points to cover: ${ch.keyPoints?.join(", ")}
Target audience pain: ${research.audiencePainPoints?.[0] ?? topic}
Target: ~${ch.wordTarget ?? 700} words of substantive prose.

Write the full chapter content as rich paragraphs. Include:
- Opening with the hook
- 3 substantive body sections (each ~150 words) with concrete examples
- Actionable takeaway at the end
- NO markdown headers, just flowing prose sections separated by blank lines

Write ONLY the chapter text, no JSON.`;
    const text = await askAI(sys, prompt, 1500);
    return { ...ch, body: text.trim() };
  });

  const chapters = await Promise.all(chapterPromises);

  const introPrompt = `Write the Introduction for "${arch.title}".
Promise: ${arch.introduction?.promise ?? "Transform your approach"}
Make it 250-350 words. Compelling, personal, establishes credibility and promise. No markdown headers.`;
  const introBody = await askAI(sys, introPrompt, 800);

  const conclusionPrompt = `Write the Conclusion for "${arch.title}".
CTA: ${arch.conclusion?.cta ?? "Take action now"}
200-300 words. Inspiring, action-oriented, reinforces transformation. No markdown headers.`;
  const conclusionBody = await askAI(sys, conclusionPrompt, 600);

  return { chapters, introBody: introBody.trim(), conclusionBody: conclusionBody.trim() };
}

// ── Stage D: Marketing ────────────────────────────────────────────────────────
async function stageMarketing(product: any, research: any, arch: any) {
  const sys = `You are a world-class direct-response copywriter. Create high-converting sales copy and landing page content. Return structured JSON only.`;
  const prompt = `Create full marketing assets for this digital product.
Title: "${arch.title}"
Subtitle: "${arch.subtitle}"
Topic: "${product.topic}"
Target Audience: "${product.targetAudience}"
Pain Points: ${JSON.stringify(research.audiencePainPoints)}
Desired Outcomes: ${JSON.stringify(research.desiredOutcomes)}
Chapters: ${arch.chapters?.map((c: any) => c.title).join(", ")}

Return ONLY valid JSON:
{
  "headline": "Power headline (benefit-first, specific)",
  "subheadline": "Supporting statement",
  "heroStatement": "2-3 sentence emotional hook for above-the-fold",
  "problemBlock": "3-4 sentences describing the pain vividly",
  "solutionBlock": "3-4 sentences positioning the product as the solution",
  "bulletBenefits": ["benefit1", "benefit2", "benefit3", "benefit4", "benefit5", "benefit6"],
  "testimonials": [
    { "name": "Sarah K.", "role": "Freelance Designer", "text": "Authentic-sounding testimonial about transformation" },
    { "name": "Marcus T.", "role": "Entrepreneur", "text": "Authentic-sounding testimonial about specific result" },
    { "name": "Jessica L.", "role": "Content Creator", "text": "Authentic-sounding testimonial about ease of use" }
  ],
  "bonusItems": ["Bonus 1 description", "Bonus 2 description", "Bonus 3 description"],
  "urgencyStatement": "Scarcity/urgency line",
  "ctaButton": "Call-to-action button text",
  "priceJustification": "Why this price is a steal",
  "faqItems": [
    { "q": "Who is this for?", "a": "Specific answer" },
    { "q": "How long until I see results?", "a": "Specific answer" },
    { "q": "Is there a guarantee?", "a": "Specific answer" }
  ],
  "suggestedPrice": 27,
  "authorBio": "2-3 sentence professional author bio",
  "metaDescription": "SEO meta description 150 chars"
}`;
  const raw = await askAI(sys, prompt, 3000);
  return parseJSON(raw);
}

// ── Stage E: Product Score ────────────────────────────────────────────────────
function stageScore(arch: any, content: any, marketing: any): { score: number; breakdown: Record<string, number>; badge: string } {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // Content depth (max 30 pts)
  const totalWords = (content.chapters ?? []).reduce((acc: number, ch: any) => acc + (ch.body?.split(/\s+/).length ?? 0), 0);
  const wordScore = Math.min(30, Math.round((totalWords / 4000) * 30));
  breakdown.contentDepth = wordScore;
  score += wordScore;

  // Structure quality (max 25 pts)
  const hasIntro = content.introBody?.length > 200;
  const hasConclusion = content.conclusionBody?.length > 100;
  const chapterCount = (arch.chapters ?? []).length;
  const structureScore = Math.round(
    (hasIntro ? 8 : 0) + (hasConclusion ? 7 : 0) + Math.min(10, chapterCount * 1.5)
  );
  breakdown.structureQuality = structureScore;
  score += structureScore;

  // Marketing density (max 25 pts)
  const hasBullets = (marketing?.bulletBenefits ?? []).length >= 4;
  const hasTestimonials = (marketing?.testimonials ?? []).length >= 2;
  const hasFaq = (marketing?.faqItems ?? []).length >= 2;
  const hasUrgency = !!marketing?.urgencyStatement;
  const marketingScore = (hasBullets ? 7 : 0) + (hasTestimonials ? 8 : 0) + (hasFaq ? 5 : 0) + (hasUrgency ? 5 : 0);
  breakdown.marketingDensity = marketingScore;
  score += marketingScore;

  // Formatting density (max 20 pts)
  const avgChapterLen = totalWords / Math.max(1, (content.chapters ?? []).length);
  const formattingScore = Math.min(20, Math.round((avgChapterLen / 650) * 20));
  breakdown.formattingDensity = formattingScore;
  score += formattingScore;

  const badge = score >= 85 ? "🏆 Elite" : score >= 70 ? "⭐ Premium" : score >= 55 ? "✅ Good" : "📋 Standard";
  return { score: Math.min(100, score), breakdown, badge };
}

// ── Stage F: Compile PDF HTML ─────────────────────────────────────────────────
function buildStyledHTML(
  arch: any,
  content: any,
  marketing: any,
  productScore: any,
  authorName: string,
  coverImageUrl: string | null,
): string {
  const title = arch.title ?? "Untitled";
  const subtitle = arch.subtitle ?? "";
  const accent = "#6366f1";
  const accentDark = "#4f46e5";
  const chapters = content.chapters ?? [];
  const intro = content.introBody ?? "";
  const conclusion = content.conclusionBody ?? "";

  const chapterHTML = chapters.map((ch: any) => `
    <div class="chapter">
      <div class="chapter-number">Chapter ${ch.number}</div>
      <h2 class="chapter-title">${ch.title ?? ""}</h2>
      <div class="chapter-body">${(ch.body ?? "").replace(/\n\n/g, "</p><p>").replace(/\n/g, " ")}</div>
    </div>`).join("\n");

  const tocHTML = (arch.tableOfContents ?? chapters.map((c: any) => `Chapter ${c.number}: ${c.title}`))
    .map((item: string, i: number) => `<li><span class="toc-num">${String(i + 1).padStart(2, "0")}</span> ${item}</li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --accent: ${accent}; --accent-dark: ${accentDark}; --text: #1a1a2e; --muted: #6b7280; --bg: #ffffff; --bg-soft: #f8f9ff; }
  body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg); line-height: 1.75; }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page-break { page-break-before: always; }
    .no-print { display: none; }
  }

  /* Cover Page */
  .cover { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px 40px; position: relative; overflow: hidden; }
  .cover::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(139,92,246,0.2) 0%, transparent 50%); }
  .cover-badge { background: linear-gradient(135deg, var(--accent), #8b5cf6); color: white; padding: 6px 20px; border-radius: 50px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; position: relative; z-index: 1; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: clamp(36px, 5vw, 64px); font-weight: 700; color: white; line-height: 1.15; margin-bottom: 20px; position: relative; z-index: 1; }
  .cover-subtitle { font-size: clamp(16px, 2vw, 22px); color: rgba(255,255,255,0.75); font-weight: 300; max-width: 600px; margin-bottom: 40px; position: relative; z-index: 1; }
  .cover-author { font-size: 14px; color: rgba(255,255,255,0.5); letter-spacing: 1px; position: relative; z-index: 1; }
  .cover-score { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 12px 24px; margin-top: 32px; position: relative; z-index: 1; }
  .cover-score span { color: white; font-size: 13px; }
  .cover-img { width: 180px; height: 220px; object-fit: cover; border-radius: 12px; box-shadow: 0 30px 80px rgba(0,0,0,0.5); margin-bottom: 40px; position: relative; z-index: 1; border: 3px solid rgba(255,255,255,0.2); }

  /* Content wrapper */
  .content-wrap { max-width: 800px; margin: 0 auto; padding: 60px 40px; }

  /* TOC */
  .toc-section { padding: 60px 40px; background: var(--bg-soft); }
  .toc-section h2 { font-family: 'Playfair Display', serif; font-size: 32px; color: var(--text); margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid var(--accent); }
  .toc-list { list-style: none; }
  .toc-list li { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
  .toc-num { background: var(--accent); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

  /* Introduction */
  .intro-section { background: linear-gradient(135deg, var(--bg-soft), white); padding: 60px 40px; }
  .intro-section .section-label { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
  .intro-section h2 { font-family: 'Playfair Display', serif; font-size: 36px; color: var(--text); margin-bottom: 24px; }
  .intro-section p { font-size: 16px; color: #374151; margin-bottom: 16px; }

  /* Chapter */
  .chapter { padding: 60px 40px; border-bottom: 1px solid #e5e7eb; }
  .chapter:nth-child(even) { background: var(--bg-soft); }
  .chapter-number { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
  .chapter-title { font-family: 'Playfair Display', serif; font-size: clamp(24px, 3vw, 36px); color: var(--text); margin-bottom: 28px; line-height: 1.3; }
  .chapter-title::after { content: ''; display: block; width: 60px; height: 4px; background: linear-gradient(90deg, var(--accent), #8b5cf6); border-radius: 2px; margin-top: 16px; }
  .chapter-body p { font-size: 16px; color: #374151; margin-bottom: 20px; }
  .chapter-body { font-size: 16px; color: #374151; }

  /* Conclusion */
  .conclusion-section { padding: 60px 40px; background: linear-gradient(135deg, #1a1a2e, #0f3460); color: white; }
  .conclusion-section .section-label { color: rgba(99,102,241,0.9); font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
  .conclusion-section h2 { font-family: 'Playfair Display', serif; font-size: 36px; margin-bottom: 24px; }
  .conclusion-section p { font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 16px; }

  /* Score page */
  .score-section { padding: 60px 40px; background: var(--bg-soft); text-align: center; }
  .score-section h3 { font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 32px; }
  .score-circle { width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #8b5cf6); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 32px; box-shadow: 0 20px 60px rgba(99,102,241,0.3); }
  .score-number { font-size: 48px; font-weight: 700; color: white; line-height: 1; }
  .score-label { font-size: 12px; color: rgba(255,255,255,0.8); }
  .score-badge { font-size: 22px; margin-bottom: 16px; }
  .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 500px; margin: 0 auto; }
  .score-item { background: white; border-radius: 12px; padding: 16px; text-align: left; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .score-item-label { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .score-item-value { font-size: 20px; font-weight: 700; color: var(--accent); }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover page-break">
  ${coverImageUrl ? `<img src="${coverImageUrl}" alt="Cover" class="cover-img">` : ""}
  <div class="cover-badge">Digital Product</div>
  <h1 class="cover-title">${title}</h1>
  <p class="cover-subtitle">${subtitle}</p>
  <div class="cover-author">By ${authorName}</div>
  <div class="cover-score">
    <span>${productScore.badge} &nbsp;|&nbsp; Quality Score: ${productScore.score}/100</span>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc-section page-break">
  <div class="content-wrap" style="padding-top:0;">
    <h2>Table of Contents</h2>
    <ul class="toc-list">${tocHTML}</ul>
  </div>
</div>

<!-- INTRODUCTION -->
<div class="intro-section page-break">
  <div class="content-wrap" style="padding-top:0;">
    <div class="section-label">Introduction</div>
    <h2>${arch.introduction?.title ?? "Welcome"}</h2>
    <p>${intro.replace(/\n\n/g, "</p><p>").replace(/\n/g, " ")}</p>
  </div>
</div>

<!-- CHAPTERS -->
<div class="chapters-wrap">
  ${chapterHTML}
</div>

<!-- CONCLUSION -->
<div class="conclusion-section page-break">
  <div class="content-wrap" style="padding-top:0;">
    <div class="section-label">Conclusion</div>
    <h2>${arch.conclusion?.title ?? "Your Next Steps"}</h2>
    <p>${conclusion.replace(/\n\n/g, "</p><p>").replace(/\n/g, " ")}</p>
  </div>
</div>

<!-- PRODUCT QUALITY SCORE -->
<div class="score-section page-break">
  <h3>Product Quality Certificate</h3>
  <div class="score-badge">${productScore.badge}</div>
  <div class="score-circle">
    <div class="score-number">${productScore.score}</div>
    <div class="score-label">/ 100</div>
  </div>
  <div class="score-grid">
    <div class="score-item">
      <div class="score-item-label">Content Depth</div>
      <div class="score-item-value">${productScore.breakdown.contentDepth ?? 0}/30</div>
    </div>
    <div class="score-item">
      <div class="score-item-label">Structure Quality</div>
      <div class="score-item-value">${productScore.breakdown.structureQuality ?? 0}/25</div>
    </div>
    <div class="score-item">
      <div class="score-item-label">Marketing Density</div>
      <div class="score-item-value">${productScore.breakdown.marketingDensity ?? 0}/25</div>
    </div>
    <div class="score-item">
      <div class="score-item-label">Formatting Density</div>
      <div class="score-item-value">${productScore.breakdown.formattingDensity ?? 0}/20</div>
    </div>
  </div>
</div>

</body>
</html>`;
}

// ── Main pipeline runner (async — runs in background) ────────────────────────
async function runPipeline(productId: number, inputs: {
  topic: string; subtitle: string; angle: string;
  targetAudience: string; niche: string; authorName: string;
  authorPhotoUrl?: string;
}) {
  try {
    // Stage A: Research
    setStage(productId, 0);
    await db.update(productsTable).set({ publishStatus: "generating:researching" }).where(eq(productsTable.id, productId));
    const research = await stageResearch(inputs.topic, inputs.targetAudience, inputs.niche, inputs.angle);

    // Stage B: Architecture
    setStage(productId, 1);
    await db.update(productsTable).set({ publishStatus: "generating:architecting" }).where(eq(productsTable.id, productId));
    const arch = await stageArchitecture(inputs.topic, inputs.subtitle, research, inputs.authorName);
    if (!arch) throw new Error("Architecture stage failed — no valid response from AI");

    // Stage C: Content
    setStage(productId, 2);
    await db.update(productsTable).set({
      publishStatus: "generating:writing",
      title: arch.title ?? inputs.topic,
      subtitle: arch.subtitle ?? inputs.subtitle,
      tableOfContents: arch.tableOfContents ?? [],
    }).where(eq(productsTable.id, productId));
    const content = await stageContent(inputs.topic, arch, research);

    // Stage D: Marketing
    setStage(productId, 3);
    await db.update(productsTable).set({ publishStatus: "generating:marketing" }).where(eq(productsTable.id, productId));
    const marketing = await stageMarketing({ topic: inputs.topic, targetAudience: inputs.targetAudience }, research, arch);

    // Stage E: Score
    setStage(productId, 4);
    await db.update(productsTable).set({ publishStatus: "generating:scoring" }).where(eq(productsTable.id, productId));
    const productScore = stageScore(arch, content, marketing);

    // Generate cover image (parallel with scoring)
    let coverImageUrl: string | null = inputs.authorPhotoUrl ?? null;
    try {
      const coverUrl = await generateProductCoverImage({ title: arch.title ?? inputs.topic, topic: inputs.topic, type: "digital_product" });
      if (coverUrl) coverImageUrl = coverUrl;
    } catch (_) { /* non-fatal */ }

    // Stage F: Compile & Publish
    setStage(productId, 5);
    await db.update(productsTable).set({ publishStatus: "generating:compiling" }).where(eq(productsTable.id, productId));

    const htmlContent = buildStyledHTML(arch, content, marketing, productScore, inputs.authorName, coverImageUrl);
    const base64Html = Buffer.from(htmlContent).toString("base64");
    const dataUrl = `data:text/html;base64,${base64Html}`;

    const fullContent = JSON.stringify({
      type: "studio_product",
      arch,
      research,
      content,
      marketing,
      productScore,
      htmlContent,
    });

    const suggestedPrice = marketing?.suggestedPrice ?? 27;

    await db.update(productsTable).set({
      title: arch.title ?? inputs.topic,
      subtitle: arch.subtitle ?? inputs.subtitle,
      description: marketing?.heroStatement ?? arch.tagline ?? "",
      content: fullContent,
      tableOfContents: arch.tableOfContents ?? [],
      targetAudience: inputs.targetAudience,
      authorBio: marketing?.authorBio ?? "",
      coverImageUrl: coverImageUrl ?? undefined,
      uploadedFileUrl: dataUrl,
      sellabilityScore: productScore.score,
      price: String(suggestedPrice),
      landingPageData: marketing,
      deepIntelligenceData: research,
      marketingAssets: {
        headline: marketing?.headline,
        bulletBenefits: marketing?.bulletBenefits,
        testimonials: marketing?.testimonials,
        productScore,
      },
      isPublished: true,
      publishStatus: "published",
      updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));

    // Clear job state (published)
    jobRegistry.delete(productId);
    console.info(`[Studio] Product ${productId} pipeline complete. Score: ${productScore.score}`);
  } catch (err: any) {
    console.error(`[Studio] Pipeline error for product ${productId}:`, err?.message ?? err);
    setError(productId, err?.message ?? "Pipeline failed");
    await db.update(productsTable).set({ publishStatus: "error" }).where(eq(productsTable.id, productId));
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /studio/generate — start the pipeline
router.post("/studio/generate", requireAuth, upload.single("authorImage"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      topic, subtitle = "", angle = "", targetAudience = "", niche = "", authorName = "The Author",
    } = req.body;

    if (!topic?.trim()) {
      res.status(400).json({ error: "Product topic/name is required" });
      return;
    }

    let authorPhotoUrl: string | undefined;
    if (req.file) {
      const b64 = req.file.buffer.toString("base64");
      authorPhotoUrl = `data:${req.file.mimetype};base64,${b64}`;
    }

    const [product] = await db.insert(productsTable).values({
      userId,
      title: topic,
      subtitle,
      topic,
      authorName,
      targetAudience,
      publishStatus: "generating:researching",
      isPublished: false,
      productType: "pdf",
    }).returning();

    // Start pipeline async
    runPipeline(product.id, { topic, subtitle, angle, targetAudience, niche, authorName, authorPhotoUrl });

    res.json({ productId: product.id, message: "Pipeline started" });
  } catch (err: any) {
    console.error("[Studio] Generate error:", err);
    res.status(500).json({ error: err?.message ?? "Failed to start generation" });
  }
});

// GET /studio/job/:id — poll job status
router.get("/studio/job/:id", requireAuth, async (req: any, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) { res.status(404).json({ error: "Job not found" }); return; }

    const jobState = jobRegistry.get(productId);

    if (product.publishStatus === "published" || product.isPublished) {
      res.json({
        status: "published",
        stage: "published",
        stageIndex: STAGES.length,
        totalStages: STAGES.length,
        label: "Product Published!",
        product: {
          id: product.id,
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          coverImageUrl: product.coverImageUrl,
          sellabilityScore: product.sellabilityScore,
          price: product.price,
          tableOfContents: product.tableOfContents,
          marketingAssets: product.marketingAssets,
          landingPageData: product.landingPageData,
          downloadUrl: `/api/studio/download/${product.id}`,
        },
      });
      return;
    }

    if (product.publishStatus === "error") {
      res.json({ status: "error", error: jobState?.error ?? "Pipeline failed", stage: "error" });
      return;
    }

    if (jobState) {
      res.json({
        status: "generating",
        stage: jobState.stage,
        stageIndex: jobState.stageIndex,
        totalStages: jobState.totalStages,
        label: jobState.label,
        elapsedSeconds: Math.round((Date.now() - jobState.startedAt) / 1000),
      });
      return;
    }

    // Fallback — parse from DB status
    const stageKey = product.publishStatus?.replace("generating:", "") ?? "queued";
    const idx = STAGES.findIndex(s => s.key === stageKey);
    res.json({
      status: "generating",
      stage: stageKey,
      stageIndex: idx + 1,
      totalStages: STAGES.length,
      label: STAGES[idx]?.label ?? "Processing...",
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// GET /studio/download/:id — download the generated HTML/PDF
router.get("/studio/download/:id", async (req: any, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product || !product.uploadedFileUrl) {
      res.status(404).json({ error: "Product not found or not generated" });
      return;
    }

    // Parse data URL
    if (product.uploadedFileUrl.startsWith("data:")) {
      const [meta, b64] = product.uploadedFileUrl.split(",");
      const mimeMatch = meta.match(/data:([^;]+)/);
      const mime = mimeMatch?.[1] ?? "text/html";
      const buf = Buffer.from(b64, "base64");
      const safeName = (product.title ?? "product").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.html"`);
      res.send(buf);
      return;
    }

    res.redirect(product.uploadedFileUrl);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// GET /studio/my-products — list user's studio products
router.get("/studio/my-products", requireAuth, async (req: any, res) => {
  try {
    const products = await db.select({
      id: productsTable.id,
      title: productsTable.title,
      subtitle: productsTable.subtitle,
      coverImageUrl: productsTable.coverImageUrl,
      sellabilityScore: productsTable.sellabilityScore,
      price: productsTable.price,
      publishStatus: productsTable.publishStatus,
      isPublished: productsTable.isPublished,
      createdAt: productsTable.createdAt,
    }).from(productsTable)
      .where(eq(productsTable.userId, req.user.id))
      .orderBy(sql`${productsTable.createdAt} DESC`)
      .limit(20);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

export default router;
