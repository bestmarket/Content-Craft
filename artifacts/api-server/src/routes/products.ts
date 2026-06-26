import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, promptsTable, usersTable, walletTransactionsTable, ordersTable, apiKeysTable } from "@workspace/db";
import { eq, desc, and, ne, gte, sql } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callAI } from "./content";
import { callGeminiFallback, callGroqRotated, callAnthropicFallback, generateProductCoverImage, generateLandingPageImages } from "./ai-utils";
import { sendEmail, buildPurchaseReceiptHtml } from "../services/email";

function stripMarkdown(text: string): string {
  if (!text || typeof text !== "string") return text ?? "";
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/_{2}([^_]+)_{2}/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .trim();
}

function sanitizeProductParsed(parsed: any): any {
  if (!parsed) return parsed;
  parsed.title = stripMarkdown(parsed.title);
  parsed.subtitle = stripMarkdown(parsed.subtitle);
  parsed.aboutSection = stripMarkdown(parsed.aboutSection);
  parsed.authorBio = stripMarkdown(parsed.authorBio);
  parsed.targetAudience = stripMarkdown(parsed.targetAudience);
  parsed.monetizationNotes = stripMarkdown(parsed.monetizationNotes);
  if (Array.isArray(parsed.tableOfContents)) {
    parsed.tableOfContents = parsed.tableOfContents.map(stripMarkdown);
  }
  if (Array.isArray(parsed.chapters)) {
    parsed.chapters = parsed.chapters.map((ch: any) => ({
      ...ch,
      title: stripMarkdown(ch.title),
      hook: stripMarkdown(ch.hook),
      body: stripMarkdown(ch.body),
      callout: stripMarkdown(ch.callout),
      example: stripMarkdown(ch.example),
      actionStep: stripMarkdown(ch.actionStep),
      steps: Array.isArray(ch.steps) ? ch.steps.map(stripMarkdown) : [],
      keyTakeaways: Array.isArray(ch.keyTakeaways) ? ch.keyTakeaways.map(stripMarkdown) : [],
    }));
  }
  if (parsed.conclusion) {
    parsed.conclusion.title = stripMarkdown(parsed.conclusion.title);
    parsed.conclusion.body = stripMarkdown(parsed.conclusion.body);
    if (Array.isArray(parsed.conclusion.steps)) {
      parsed.conclusion.steps = parsed.conclusion.steps.map(stripMarkdown);
    }
  }
  if (parsed.bonus) {
    parsed.bonus.title = stripMarkdown(parsed.bonus.title);
    parsed.bonus.body = stripMarkdown(parsed.bonus.body);
    if (Array.isArray(parsed.bonus.items)) {
      parsed.bonus.items = parsed.bonus.items.map(stripMarkdown);
    }
  }
  // New premium sections
  if (parsed.introduction) {
    parsed.introduction.title = stripMarkdown(parsed.introduction?.title ?? "");
    parsed.introduction.body = stripMarkdown(parsed.introduction?.body ?? "");
    parsed.introduction.promise = stripMarkdown(parsed.introduction?.promise ?? "");
  }
  if (parsed.quickStart) {
    parsed.quickStart.title = stripMarkdown(parsed.quickStart?.title ?? "");
    if (Array.isArray(parsed.quickStart.steps)) {
      parsed.quickStart.steps = parsed.quickStart.steps.map((s: any) =>
        typeof s === "string" ? stripMarkdown(s) : { ...s, step: stripMarkdown(s.step ?? ""), detail: stripMarkdown(s.detail ?? "") }
      );
    }
  }
  if (parsed.framework) {
    parsed.framework.name = stripMarkdown(parsed.framework?.name ?? "");
    parsed.framework.description = stripMarkdown(parsed.framework?.description ?? "");
    if (Array.isArray(parsed.framework.steps)) {
      parsed.framework.steps = parsed.framework.steps.map((s: any) =>
        typeof s === "string" ? stripMarkdown(s) : { ...s, label: stripMarkdown(s.label ?? ""), description: stripMarkdown(s.description ?? "") }
      );
    }
  }
  if (parsed.commonMistakes) {
    parsed.commonMistakes.title = stripMarkdown(parsed.commonMistakes?.title ?? "");
    if (Array.isArray(parsed.commonMistakes.mistakes)) {
      parsed.commonMistakes.mistakes = parsed.commonMistakes.mistakes.map((m: any) =>
        typeof m === "string" ? stripMarkdown(m) : { ...m, mistake: stripMarkdown(m.mistake ?? ""), fix: stripMarkdown(m.fix ?? "") }
      );
    }
  }
  if (parsed.checklist) {
    parsed.checklist.title = stripMarkdown(parsed.checklist?.title ?? "");
    if (Array.isArray(parsed.checklist.items)) {
      parsed.checklist.items = parsed.checklist.items.map(stripMarkdown);
    }
  }
  if (parsed.faq) {
    parsed.faq.title = stripMarkdown(parsed.faq?.title ?? "");
    if (Array.isArray(parsed.faq.questions)) {
      parsed.faq.questions = parsed.faq.questions.map((q: any) =>
        typeof q === "string" ? stripMarkdown(q) : { ...q, question: stripMarkdown(q.question ?? ""), answer: stripMarkdown(q.answer ?? "") }
      );
    }
  }
  if (parsed.resources) {
    parsed.resources.title = stripMarkdown(parsed.resources?.title ?? "");
    if (Array.isArray(parsed.resources.items)) {
      parsed.resources.items = parsed.resources.items.map((r: any) =>
        typeof r === "string" ? stripMarkdown(r) : { ...r, name: stripMarkdown(r.name ?? ""), description: stripMarkdown(r.description ?? ""), url: r.url ?? "" }
      );
    }
  }
  delete parsed.sellerBonus;
  return parsed;
}

// ── Corruption detection ─────────────────────────────────────────────────────
const GENERIC_CHAPTER_PHRASES = [
  "foundation and mindset", "the foundation", "core strategy", "the core strategy",
  "step-by-step system", "advanced techniques", "mindset and fundamentals",
  "understand the core principles", "apply the framework", "track your results",
  "iterate and improve", "the core principles", "building the foundation",
  "laying the foundation", "mastering the basics", "getting started with",
  "introduction to the basics", "understanding the fundamentals",
];

const JSON_KEY_PATTERN = /"(title|subtitle|chapters|tableOfContents|sellabilityScore|suggestedPrice|targetAudience|monetizationNotes|authorBio|quickStart|framework|checklist|faq|resources|introduction|commonMistakes|conclusion|bonus|category|aboutSection)"[\s]*:/;

function isBodyCorrupted(body: string): boolean {
  if (!body?.trim()) return true;
  const t = body.trim();
  // Starts with JSON object or array
  if (t.startsWith("{") || t.startsWith("[")) return true;
  // Contains product JSON keys anywhere in the body
  if (JSON_KEY_PATTERN.test(t)) return true;
  // Generic key-value JSON pattern
  if (/"[\w]+":\s*["{\[]/.test(t)) return true;
  // Code fences
  if (t.includes("```")) return true;
  // Generic placeholder chapter content
  const lower = t.toLowerCase();
  if (GENERIC_CHAPTER_PHRASES.some(p => lower.includes(p))) return true;
  // Too many quotes relative to length (JSON-heavy)
  const quoteCount = (t.match(/"/g) || []).length;
  if (quoteCount > t.length * 0.05 && t.length > 200) return true;
  // Too short to be a real chapter body
  if (t.length < 300) return true;
  return false;
}

// Remove any embedded JSON blocks or code fences from a body string
function cleanBodyText(text: string): string {
  if (!text || typeof text !== "string") return "";
  let t = text;
  // Remove code fences first
  t = t.replace(/```[\s\S]*?```/g, "");
  // Remove JSON objects that look like product data (contain our known keys)
  t = t.replace(/\{[\s\S]{20,}?\}/g, (match) => {
    if (JSON_KEY_PATTERN.test(match) || /"[\w]+":\s*["{\[]/.test(match)) return "";
    return match;
  });
  // Remove any remaining JSON-looking lines (e.g. "key": "value")
  t = t.split("\n").filter(line => {
    const stripped = line.trim();
    return !/"[\w]+":\s*["{\[0-9]/.test(stripped) && stripped !== "{" && stripped !== "}" && stripped !== "[" && stripped !== "]";
  }).join("\n");
  // Strip markdown
  t = stripMarkdown(t);
  // Normalize whitespace
  t = t.replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

// ── Dedicated chapter expansion ──────────────────────────────────────────────
const CHAPTER_WRITER_SYSTEM = `You are a master premium ebook writer. You write human, authoritative, emotionally resonant prose for digital guides sold on Gumroad and Amazon KDP.

ABSOLUTE RULES — VIOLATION MEANS FAILURE:
1. RETURN ONLY FLOWING PROSE PARAGRAPHS. Nothing else.
2. Zero JSON. Zero markdown. Zero code fences. Zero bullet points. Zero dashes. Zero asterisks.
3. Separate paragraphs with ONE blank line only.
4. No section labels, no titles, no chapter numbers at the top.
5. Start your response immediately with the first word of the first paragraph.
6. Use real-sounding names, ages, professions, and specific numbers (e.g. "142/88", "18 pounds", "$4,217").

BAD OUTPUT (never do this):
{"title": "Chapter 1", "body": "..."}
- Step 1: Do this
- Step 2: Do that
**Bold text** or *italic text*

GOOD OUTPUT (always do this):
You already know the feeling. You have tried everything your doctor suggested, cut out the salt, taken your medication faithfully, and still watched your numbers creep upward every three months. Marcus, a 54-year-old high school principal from Atlanta, sat in my office last spring and said exactly that...`;

async function expandProductChapterBody(
  topic: string,
  chapter: { number: number; title: string; hook: string; body: string },
  totalChapters: number,
  attempt = 1
): Promise<string> {
  const existingBody = cleanBodyText(chapter.body ?? "");
  const existingWordCount = existingBody.split(/\s+/).filter(Boolean).length;
  const corrupted = isBodyCorrupted(chapter.body);

  // If existing is already good enough (600+ words, clean), skip expansion
  if (!corrupted && existingWordCount >= 600) return existingBody;

  const hasDraft = !corrupted && existingWordCount > 120;

  const prompt = `Write Chapter ${chapter.number} of ${totalChapters} for a premium PDF guide on this topic: "${topic}"

Chapter title: "${chapter.title}"
Reader's pain this chapter addresses: "${chapter.hook}"
${hasDraft ? `\nYou have a draft below. Keep the best ideas but write it fuller, richer, and more specific (target 700-800 words):\n---\n${existingBody.slice(0, 1000)}\n---` : ""}

WRITE 700-800 WORDS of flowing prose. Requirements:
- 6-8 paragraphs, each 80-130 words
- Open paragraph: validate the exact emotion from the hook — make the reader feel seen
- Second paragraph: name the real root cause most people never hear about
- Third paragraph: a real client story (invent a believable one) — include: name, age, profession, what they tried before, exact measurable outcome, and precise timeline (e.g. "in 11 days", "by week 3", "after 21 days")
- Fourth paragraph: a second supporting story or statistic with context
- Middle paragraphs: move progressively toward the solution — each paragraph one step closer
- Final paragraph: one empowering insight that makes the reader feel capable and ready to act

START YOUR RESPONSE WITH THE FIRST SENTENCE OF PARAGRAPH ONE. Do not include a title, chapter number, label, introduction sentence, or any preamble.`;

  const attemptMessages = (attempt > 1)
    ? [
        { role: "system", content: "You write premium PDF ebook content. Return ONLY plain paragraphs separated by blank lines. No JSON. No markdown. No lists. No labels. Start with the first word of the first paragraph." },
        { role: "user", content: `Write 600-700 words of flowing prose for a chapter titled "${chapter.title}" in a guide about "${topic}". The reader's pain: "${chapter.hook}". Plain paragraphs only. Start immediately with paragraph one.` },
      ]
    : [
        { role: "system", content: CHAPTER_WRITER_SYSTEM },
        { role: "user", content: prompt },
      ];

  const tryClean = (raw: string | undefined): string | null => {
    if (!raw?.trim()) return null;
    const cleaned = cleanBodyText(raw.trim());
    if (!isBodyCorrupted(cleaned) && cleaned.length >= 400) return cleaned;
    return null;
  };

  const geminiResult = await callGeminiFallback(attemptMessages, CHAPTER_WRITER_SYSTEM, 3500, "pdf");
  const g = tryClean(geminiResult?.text);
  if (g) return g;

  const groqResult = await callGroqRotated(attemptMessages, 2500, 0.72);
  const gr = tryClean(groqResult?.text);
  if (gr) return gr;

  const anthropicResult = await callAnthropicFallback(attemptMessages, CHAPTER_WRITER_SYSTEM, 2500);
  const a = tryClean(anthropicResult?.text);
  if (a) return a;

  // Retry once with simpler prompt on first attempt
  if (attempt === 1) return expandProductChapterBody(topic, chapter, totalChapters, 2);

  // Last resort: use cleaned draft if it exists, otherwise minimal fallback
  if (hasDraft) return existingBody;
  return `This chapter explores how to achieve real results with ${topic} through the lens of "${chapter.title}". Most people who struggle with this topic do so because they have been given incomplete information — they know what to do in theory, but not the specific sequence that makes it work in practice. Over the next several pages, you will discover exactly what separates those who succeed from those who stay stuck, and precisely how to position yourself on the winning side.`;
}

// ── Structure-only AI call (higher token limit for main call) ─────────────────
async function callProductStructureAI(prompt: string, systemPrompt: string): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const geminiResult = await callGeminiFallback(messages, systemPrompt, 12000, "pdf");
  if (geminiResult?.text) return geminiResult.text;

  const groqResult = await callGroqRotated(messages, 6000, 0.75);
  if (groqResult?.text) return groqResult.text;

  const anthropicResult = await callAnthropicFallback(messages, systemPrompt, 6000);
  if (anthropicResult?.text) return anthropicResult.text;

  throw new Error("All AI providers failed. Add your Gemini key in Admin > API Keys.");
}

const PRODUCT_SYSTEM_PROMPT = `You are a world-class information product creator with 15 years of experience generating over $8M in revenue from PDF guides, ebooks, and digital courses sold on Gumroad, Etsy, Amazon KDP, TikTok Shop, and direct storefronts. You have written 600+ premium digital products.

CORE PHILOSOPHY:
Every product you create is a transformation, not information. Every sentence moves the reader closer to their desired result. You write transformations. Not summaries. Not outlines. Complete, publishable, sell-ready content.

DEEP RESEARCH APPROACH:
Before writing, you mentally simulate interviewing 100 people who have this exact problem. You know their frustrations word-for-word. You know what they've tried and why it failed. You know the exact transformation they want. Every chapter opens at their exact pain point before offering any solution.

WRITING STANDARDS:
- Write like a confident human expert who has lived this topic — not an AI assistant
- 7th-grade reading level, short sentences, conversational but authoritative tone
- Use contractions naturally: you're, it's, don't, they'll
- Be brutally specific: "$4,217 in 11 days" beats "significant income" every single time
- Use real examples with specific outcomes, timelines, and names
- Open every chapter with the reader's exact frustration or fear
- Include "Here's what nobody tells you:" at least once per guide

ABSOLUTE OUTPUT RULES — NON-NEGOTIABLE:
- ZERO markdown syntax in any text field. No #, no **, no *, no >, no ~, no backticks, no bullet dashes
- All text must be clean, plain prose ready for direct typesetting in a professional PDF
- Write COMPLETE, FULL content — never summaries, never outlines, never placeholders
- Every chapter body minimum 3 paragraphs of actual written content
- The JSON must be valid and directly parseable with JSON.parse()
- Return ONLY the JSON object — no text before, no text after, no code fences
- Chapter titles and tableOfContents MUST be SPECIFIC to the topic — NEVER use generic titles like "Foundation and Mindset", "Core Strategy", "Step-by-Step System", "Advanced Techniques", or "Common Mistakes"
- The tableOfContents array entries MUST exactly match the chapter titles in the chapters array`;

// ── Robust JSON extraction / repair ──────────────────────────────────────────
function extractAndRepairJSON(raw: string): any | null {
  if (!raw?.trim()) return null;

  // Try 1: plain parse
  try { return JSON.parse(raw.trim()); } catch {}

  // Try 2: code fence extraction
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch?.[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // Try 3: find outermost { ... }
  const start = raw.indexOf("{");
  if (start === -1) return null;
  const candidate = raw.slice(start);
  try { return JSON.parse(candidate); } catch {}

  // Try 4: brace-counting repair for truncated JSON
  // Find positions where brace depth returns to 1 (end of a top-level value)
  // and try closing the object there.
  const snapshots: number[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < candidate.length; i++) {
    const c = candidate[i];
    if (escape) { escape = false; continue; }
    if (c === "\\" && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 1) snapshots.push(i); // just closed a top-level value
    }
  }
  // Try each snapshot from last to first (prefer most complete)
  const closings = ["}", "}}", "]}}", '"}', '"]}'];
  for (let si = snapshots.length - 1; si >= 0; si--) {
    const pos = snapshots[si];
    const sub = candidate.slice(0, pos + 1).trimEnd().replace(/,\s*$/, "");
    for (const close of closings) {
      try { return JSON.parse(sub + close); } catch {}
    }
    try { return JSON.parse(sub + "}"); } catch {}
  }

  return null;
}

function buildProductPrompt(topic: string, authorName: string, description: string, targetPages: number, productStyle: string = "ebook"): string {
  const targetWords = targetPages * 250;
  const chapterCount = Math.max(4, Math.min(8, Math.floor(targetPages / 5)));

  const styleGuide: Record<string, string> = {
    ebook: "premium ebook with rich storytelling, case studies, and expert insights",
    blueprint: "step-by-step blueprint with numbered frameworks and precise implementation sequences",
    workbook: "interactive workbook with reflective exercises, fill-in sections, and practical worksheets",
    playbook: "tactical playbook with proven plays, decision trees, and real-world execution strategies",
    toolkit: "comprehensive toolkit with templates, checklists, frameworks, and ready-to-use resources",
    "course companion": "structured course companion with modules, quizzes, action labs, and progress milestones",
  };
  const styleDesc = styleGuide[productStyle] ?? styleGuide["ebook"];

  // NOTE: Premium sections (introduction, quickStart, framework, commonMistakes, checklist, faq, resources)
  // are fetched in a SEPARATE call (buildPremiumSectionsPrompt) to avoid token-limit truncation.
  return `You are creating a PREMIUM DIGITAL PRODUCT sold for $27–$97.

STYLE: ${styleDesc}
TOPIC: "${topic}"
AUTHOR: ${authorName}
${description ? `CONTEXT: ${description}` : ""}
TARGET: ${targetPages} pages | ${chapterCount} chapters

RULES:
- PLAIN TEXT ONLY. Zero markdown anywhere (#, **, *, >, -, backticks).
- Chapter titles MUST be topic-specific. NEVER use "Foundation", "Core Strategy", "Step-by-Step System", "Advanced Techniques".
- tableOfContents entries must match chapter titles exactly.
- Return ONLY the JSON object. No text before or after. No code fences.

Return this JSON:
{"title":"[Transformation title with number/timeframe — e.g. Lose 18 Pounds in 60 Days]","subtitle":"[Exact audience + exact pain + exact promise in one sentence]","tableOfContents":["Chapter 1: [specific title]","Chapter 2: [specific title]","Chapter 3: [specific title]","Chapter 4: [specific title]","Conclusion: Your 30-Day Action Plan","Exclusive Bonus"],"aboutSection":"[2-3 hook sentences — what readers achieve, the transformation, emotional payoff]","authorBio":"[2-3 sentences, 3rd person, specific results/credentials]","sellabilityScore":92,"suggestedPrice":27,"targetAudience":"[Age range, situation, what tried, what want, what fear — 3+ sentences]","monetizationNotes":"[Demand signal + buyer psychology + best channel + upsell — 4 sentences]","category":"[Niche category]","chapters":[{"number":1,"title":"[Specific title related to ${topic}]","hook":"[One sentence — reader's exact frustration this chapter addresses]","body":"[3-4 paragraphs, 200-300 words, plain prose. Open at pain, explain root cause, real example with name+numbers+timeline, move toward solution.]","steps":["Step 1: [specific action]","Step 2: [specific action]","Step 3: [specific action]","Step 4: [specific action]"],"callout":"[1-2 sentences of insider knowledge]","example":"[Named person, age, profession, before, approach, exact outcome with numbers and timeline]","keyTakeaways":["[Key lesson 1]","[Key lesson 2]","[Key lesson 3]"],"actionStep":"[One micro-action completable in 5 minutes]"}],"conclusion":{"title":"Your 30-Day Action Plan","body":"[2-3 motivating paragraphs plain prose]","steps":["Week 1: [specific actions]","Week 2: [specific actions]","Week 3: [specific actions]","Week 4: [specific actions]"]},"bonus":{"title":"[Insight nobody in this space shares]","body":"[2 paragraphs of genuine bonus insight]","items":["[Bonus 1]","[Bonus 2]","[Bonus 3]","[Bonus 4]"]}}`;
}

// ── Phase 1B: Premium sections (separate call to avoid token-limit truncation) ─
function buildPremiumSectionsPrompt(topic: string, productTitle: string, chapterTitles: string[]): string {
  return `You are writing premium bonus sections for a digital guide titled "${productTitle}" on the topic: "${topic}".

Chapter titles in the guide: ${chapterTitles.join(", ")}

Rules:
- PLAIN TEXT ONLY. No markdown. No code fences.
- Be specific to "${topic}" — no generic language.
- Return ONLY the JSON object below. No text before or after.

Return this JSON:
{"introduction":{"title":"[Why Everything You Have Tried Has Failed Until Now — specific to ${topic}]","promise":"[One bold specific promise sentence]","body":"[3 paragraphs, 250-350 words plain prose. Open at reader frustration → root cause nobody talks about → what they will walk away with.]"},"quickStart":{"title":"What to Do in the First 24 Hours","steps":[{"step":"[Action 1 — starts with verb, specific to ${topic}]","detail":"[2 sentences on how and why]"},{"step":"[Action 2]","detail":"[2 sentences]"},{"step":"[Action 3]","detail":"[2 sentences]"},{"step":"[Action 4]","detail":"[2 sentences]"},{"step":"[Action 5 — what to AVOID and what to do instead]","detail":"[2 sentences]"}]},"framework":{"name":"[The ${topic} Success Framework — branded name or acronym]","description":"[2 sentences: what it is, who it is for, transformation it produces]","steps":[{"label":"[Stage 1 name]","description":"[2-3 sentences]"},{"label":"[Stage 2 name]","description":"[2-3 sentences]"},{"label":"[Stage 3 name]","description":"[2-3 sentences]"},{"label":"[Stage 4 name]","description":"[2-3 sentences]"},{"label":"[Stage 5 name]","description":"[2-3 sentences]"}]},"commonMistakes":{"title":"The 5 Mistakes That Keep Most People Stuck","mistakes":[{"mistake":"[Mistake 1 specific to ${topic}]","fix":"[Exact correction, 2 sentences]"},{"mistake":"[Mistake 2]","fix":"[Fix, 2 sentences]"},{"mistake":"[Mistake 3]","fix":"[Fix, 2 sentences]"},{"mistake":"[Mistake 4]","fix":"[Fix, 2 sentences]"},{"mistake":"[Mistake 5]","fix":"[Fix, 2 sentences]"}]},"checklist":{"title":"Your Complete Implementation Checklist","items":["[Specific action 1]","[Specific action 2]","[Specific action 3]","[Specific action 4]","[Specific action 5]","[Specific action 6]","[Specific action 7]","[Specific action 8]","[Specific action 9]","[Specific action 10]","[Specific action 11]","[Specific action 12]"]},"faq":{"title":"Frequently Asked Questions","questions":[{"question":"[Most common beginner question about ${topic}]","answer":"[Clear 2-3 sentence answer]"},{"question":"[What if I have no experience?]","answer":"[Reassuring 2-3 sentence answer]"},{"question":"[How quickly will I see results?]","answer":"[Honest specific timeline]"},{"question":"[What is the single biggest factor for success?]","answer":"[Specific insight]"},{"question":"[What if I get stuck?]","answer":"[Actionable troubleshooting]"}]},"resources":{"title":"Your Resource Vault","items":[{"name":"[Tool or app name specific to ${topic}]","description":"[What it does and why useful, 1-2 sentences]","url":""},{"name":"[Book or course]","description":"[Why valuable, 1-2 sentences]","url":""},{"name":"[Resource 3]","description":"[Description]","url":""},{"name":"[Resource 4]","description":"[Description]","url":""},{"name":"[Resource 5]","description":"[Description]","url":""},{"name":"[Resource 6]","description":"[Description]","url":""}]}}`;
}

const router = Router();

async function getStockImageUrl(topic: string, _seed: number = 1): Promise<string> {
  return generateProductCoverImage({ title: topic, topic, type: "digital_product" });
}

const LANDING_PAGE_STYLES = [
  {
    heroStyle: "bold_transformation",
    socialProofStyle: "specific_results",
    ctaStyle: "urgency_scarcity",
  },
  {
    heroStyle: "story_driven",
    socialProofStyle: "community_proof",
    ctaStyle: "value_stack",
  },
  {
    heroStyle: "problem_agitate",
    socialProofStyle: "authority_proof",
    ctaStyle: "guarantee_first",
  },
  {
    heroStyle: "curiosity_gap",
    socialProofStyle: "peer_proof",
    ctaStyle: "limited_offer",
  },
];

router.post("/products/create", requireAuth, async (req: any, res) => {
  try {
    const { topic, authorName, description, promptId, pageCount, authorPhotoUrl, productStyle, angle, price: bodyPrice } = req.body;
    if (!topic || !authorName) {
      res.status(400).json({ error: "topic and authorName required" });
      return;
    }

    const effectiveTopic = angle?.trim() ? `${String(topic).trim()} — Direction: ${String(angle).trim()}` : String(topic).trim();
    const effectiveDescription = angle?.trim()
      ? `${description ? String(description).trim() + ". " : ""}Target angle: ${String(angle).trim()}`
      : (description ?? "");

    // ── Free-tier limit (3 products/day) ─────────────────────────────────────
    const [userRow] = await db.select({ subscriptionTier: usersTable.subscriptionTier })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    const isPro = userRow?.subscriptionTier != null && userRow.subscriptionTier !== "free";
    if (!isPro) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [{ count: todayCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(productsTable)
        .where(and(eq(productsTable.userId, req.userId), gte(productsTable.createdAt, todayStart)));
      if (Number(todayCount) >= 3) {
        res.status(429).json({ error: "Daily product limit reached (3/day on free plan). Upgrade to Pro for unlimited products." });
        return;
      }
    }

    const targetPages = Number(pageCount) || 20;
    const style = productStyle || "ebook";
    const chapterCount = Math.max(4, Math.min(7, Math.floor(targetPages / 5)));

    let systemPrompt = PRODUCT_SYSTEM_PROMPT;
    if (promptId) {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId)).limit(1);
      if (p?.isActive) {
        systemPrompt = p.systemPrompt + "\n\nCRITICAL: Output PLAIN TEXT ONLY in all text fields — zero markdown. Return only valid JSON.";
      }
    }

    // ── Single Gemini call — full product in one shot ─────────────────────────
    const styleGuide: Record<string, string> = {
      ebook: "premium ebook with storytelling, case studies, and expert insights",
      blueprint: "step-by-step blueprint with numbered frameworks and implementation sequences",
      workbook: "interactive workbook with exercises and practical worksheets",
      playbook: "tactical playbook with proven plays and real-world execution strategies",
      toolkit: "comprehensive toolkit with templates, checklists, and ready-to-use resources",
    };

    const singlePrompt = `You are creating a PREMIUM DIGITAL PRODUCT sold for $27–$97.

STYLE: ${styleGuide[style] ?? styleGuide["ebook"]}
TOPIC: "${effectiveTopic}"
AUTHOR: ${authorName}
${effectiveDescription ? `CONTEXT: ${effectiveDescription}` : ""}
TARGET: ${targetPages} pages | ${chapterCount} chapters

RULES:
- PLAIN TEXT ONLY. Zero markdown (#, **, *, >, -, backticks).
- Chapter titles MUST be topic-specific. NEVER use generic titles like "Foundation", "Core Strategy", "Step-by-Step", "Advanced Techniques".
- tableOfContents entries must match chapter titles exactly.
- Each chapter body: 4-6 paragraphs of flowing prose (300-500 words). Open at reader's pain, name root cause, include a real story with name/age/numbers/timeline, move toward solution.
- Return ONLY the JSON object. No text before or after. No code fences.

Return this exact JSON structure:
{
  "title": "[Transformation title with number/timeframe]",
  "subtitle": "[Exact audience + exact pain + exact promise in one sentence]",
  "category": "[Niche category]",
  "sellabilityScore": 92,
  "suggestedPrice": 27,
  "targetAudience": "[Age range, situation, what tried, what want — 2-3 sentences]",
  "monetizationNotes": "[Demand signal + buyer psychology + best channel + upsell — 3 sentences]",
  "aboutSection": "[2-3 hook sentences — what readers achieve, the transformation]",
  "authorBio": "[2-3 sentences, 3rd person, specific credentials]",
  "tableOfContents": ["Chapter 1: [specific title]", "Chapter 2: [specific title]"],
  "chapters": [
    {
      "number": 1,
      "title": "[Specific title related to ${effectiveTopic}]",
      "hook": "[One sentence — reader's exact frustration this chapter addresses]",
      "body": "[4-5 paragraphs, 350-450 words, plain prose. Open at pain → root cause → real story with name+numbers+timeline → solution steps]",
      "steps": ["Step 1: [specific action]", "Step 2: [specific action]", "Step 3: [specific action]"],
      "callout": "[1-2 sentences of insider knowledge most people never hear]",
      "example": "[Named person, age, profession, before, approach, exact outcome with numbers and timeline]",
      "keyTakeaways": ["[Key lesson 1]", "[Key lesson 2]", "[Key lesson 3]"],
      "actionStep": "[One micro-action completable in 5 minutes]"
    }
  ],
  "conclusion": {
    "title": "Your 30-Day Action Plan",
    "body": "[2-3 motivating paragraphs plain prose]",
    "steps": ["Week 1: [specific actions]", "Week 2: [specific actions]", "Week 3: [specific actions]", "Week 4: [specific actions]"]
  },
  "bonus": {
    "title": "[Insight nobody in this space shares]",
    "body": "[2 paragraphs of genuine bonus insight]",
    "items": ["[Bonus tip 1]", "[Bonus tip 2]", "[Bonus tip 3]"]
  },
  "checklist": {
    "title": "Your Complete Implementation Checklist",
    "items": ["[Action 1]", "[Action 2]", "[Action 3]", "[Action 4]", "[Action 5]", "[Action 6]", "[Action 7]", "[Action 8]"]
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "questions": [
      {"question": "[Common beginner question]", "answer": "[Direct helpful answer, 2-3 sentences]"},
      {"question": "[Common concern]", "answer": "[Reassuring answer with evidence]"},
      {"question": "[Implementation question]", "answer": "[Practical answer]"}
    ]
  }
}`;

    const aiRaw = await callProductStructureAI(singlePrompt, systemPrompt);

    let parsed: any = extractAndRepairJSON(aiRaw);
    if (!parsed) {
      req.log.warn({ rawPreview: aiRaw.slice(0, 400) }, "JSON parse failed — retrying with simpler prompt");
      const retryRaw = await callProductStructureAI(singlePrompt, "Return ONLY valid JSON. No text before or after. No code fences.");
      parsed = extractAndRepairJSON(retryRaw);
    }
    if (!parsed) {
      throw new Error("AI returned invalid JSON. Please try again — if this persists, check your API keys in Admin > API Keys.");
    }
    if (!parsed?.chapters || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
      throw new Error("AI did not return valid chapters. Please try again.");
    }

    parsed = sanitizeProductParsed(parsed);

    // Clean chapter bodies
    if (Array.isArray(parsed.chapters)) {
      parsed.chapters = parsed.chapters.map((ch: any) => ({
        ...ch,
        body: cleanBodyText(ch.body ?? ""),
        hook: cleanBodyText(ch.hook ?? ""),
      }));
    }

    const [imageUrl, user] = await Promise.all([
      getStockImageUrl(topic, Math.floor(Math.random() * 10) + 1),
      db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.userId)).limit(1).then(r => r[0]),
    ]);

    const [saved] = await db.insert(productsTable).values({
      userId: req.userId,
      topic,
      authorName: authorName || user?.name || "Author",
      title: parsed.title,
      subtitle: parsed.subtitle,
      content: JSON.stringify(parsed),
      tableOfContents: parsed.tableOfContents,
      aboutSection: parsed.aboutSection,
      authorBio: parsed.authorBio,
      authorPhotoUrl: authorPhotoUrl || null,
      sellabilityScore: parsed.sellabilityScore ?? 85,
      price: String(bodyPrice ?? parsed.suggestedPrice ?? 27),
      originalPrice: String((bodyPrice ?? parsed.suggestedPrice ?? 27) * 2),
      targetAudience: parsed.targetAudience,
      monetizationNotes: parsed.monetizationNotes,
      category: parsed.category ?? "General",
      pageCount: targetPages,
      isPublished: false,
      coverImageUrl: imageUrl,
    }).returning();

    res.json({
      ...saved,
      price: Number(saved.price),
      originalPrice: Number(saved.originalPrice),
      sellabilityScore: saved.sellabilityScore,
      coverImageUrl: saved.coverImageUrl ?? imageUrl,
      chaptersData: parsed,
    });
  } catch (err: any) {
    req.log.error({ err }, "CreateProduct error");
    res.status(500).json({ error: err?.message ?? "Product creation failed" });
  }
});

// ── Manual product edit ───────────────────────────────────────────────────────
router.patch("/products/:id", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const { title, subtitle, price, chapters, description, landingPage, authorPhotoUrl } = req.body as {
      title?: string; subtitle?: string; price?: number; chapters?: Array<{ number: number; title: string; body: string; hook?: string }>;
      description?: string; landingPage?: any; authorPhotoUrl?: string;
    };

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (title) updates.title = title;
    if (subtitle) updates.subtitle = subtitle;
    if (price) updates.price = String(price);
    if (description !== undefined) updates.description = description;
    if (landingPage !== undefined) updates.landingPage = landingPage;
    if (authorPhotoUrl !== undefined) updates.authorPhotoUrl = authorPhotoUrl;

    if (chapters?.length) {
      let parsed: any = {};
      try { parsed = JSON.parse(product.content ?? "{}"); } catch {}
      parsed.chapters = chapters;
      updates.content = JSON.stringify(parsed);
      updates.tableOfContents = chapters.map((c: any) => c.title);
    }

    await db.update(productsTable).set(updates).where(eq(productsTable.id, parseInt(req.params.id)));
    res.json({ success: true, ...updates });
  } catch (err: any) {
    req.log.error({ err }, "PatchProduct error");
    res.status(500).json({ error: err?.message ?? "Update failed" });
  }
});

// ── Improve product (single Gemini call to deepen all chapters) ───────────────
router.post("/products/:id/improve", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    let parsed: any = null;
    try { parsed = JSON.parse(product.content ?? "{}"); } catch {}
    if (!parsed?.chapters) { res.status(400).json({ error: "Product has no content to improve" }); return; }

    const topic = product.topic ?? parsed.title ?? "this topic";
    const chapterSummary = parsed.chapters.map((ch: any, i: number) =>
      `Chapter ${i + 1}: "${ch.title}" — current hook: "${(ch.hook ?? "").slice(0, 80)}"`
    ).join("\n");

    const improvePrompt = `You are improving an existing premium digital product on the topic: "${topic}".

Current chapters:
${chapterSummary}

Rewrite and DEEPEN each chapter body. For EACH chapter:
- Open at the reader's exact pain point (name the frustration, not the solution)
- Include a real story: named person, age, profession, specific numbers, exact timeline
- Give 3 concrete action steps
- Close with an insight most people never hear about this topic

RULES:
- PLAIN TEXT ONLY. Zero markdown (#, **, *, >, -, backticks).
- Each chapter body: 4-6 paragraphs, 350-500 words of flowing prose.
- Return ONLY valid JSON. No text before or after. No code fences.

Return this JSON:
{
  "chapters": [
    {
      "number": 1,
      "title": "${parsed.chapters[0]?.title ?? "Chapter 1"}",
      "hook": "[One sentence reader frustration]",
      "body": "[4-6 paragraphs, 400+ words, plain prose]",
      "steps": ["Step 1: [action]", "Step 2: [action]", "Step 3: [action]"],
      "callout": "[Insider insight most people never hear]",
      "example": "[Name, age, profession, before, approach, exact result with numbers]",
      "keyTakeaways": ["[Lesson 1]", "[Lesson 2]", "[Lesson 3]"],
      "actionStep": "[5-minute micro-action]"
    }
  ],
  "checklist": {
    "title": "Complete Implementation Checklist",
    "items": ["[Action 1]", "[Action 2]", "[Action 3]", "[Action 4]", "[Action 5]", "[Action 6]", "[Action 7]", "[Action 8]"]
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "questions": [
      {"question": "[Common question about ${topic}]", "answer": "[Direct helpful answer]"},
      {"question": "[Implementation concern]", "answer": "[Reassuring answer with evidence]"},
      {"question": "[Advanced question]", "answer": "[Practical detailed answer]"}
    ]
  }
}`;

    const improveRaw = await callProductStructureAI(improvePrompt, "Return ONLY valid JSON. No text before or after. No code fences. Be specific to the topic.");
    const improved = extractAndRepairJSON(improveRaw);

    if (improved?.chapters && Array.isArray(improved.chapters)) {
      // Merge improved chapters back, preserving any fields AI didn't rewrite
      parsed.chapters = improved.chapters.map((newCh: any, i: number) => ({
        ...(parsed.chapters[i] ?? {}),
        ...newCh,
        body: cleanBodyText(newCh.body ?? parsed.chapters[i]?.body ?? ""),
        hook: cleanBodyText(newCh.hook ?? parsed.chapters[i]?.hook ?? ""),
      }));
      if (improved.checklist) parsed.checklist = improved.checklist;
      if (improved.faq) parsed.faq = improved.faq;
    }

    const newScore = Math.min(99, (product.sellabilityScore ?? 75) + Math.floor(Math.random() * 8) + 7);
    parsed.sellabilityScore = newScore;
    parsed = sanitizeProductParsed(parsed);

    await db.update(productsTable).set({
      content: JSON.stringify(parsed),
      sellabilityScore: newScore,
      updatedAt: new Date(),
    }).where(eq(productsTable.id, parseInt(req.params.id)));

    res.json({ sellabilityScore: newScore, improved: true, chaptersData: parsed });
  } catch (err: any) {
    req.log.error({ err }, "ImproveProduct error");
    res.status(500).json({ error: err?.message ?? "Product improvement failed" });
  }
});

// ── Sellability Report ────────────────────────────────────────────────────────
router.post("/products/:id/sellability-report", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    let parsed: any = null;
    try { parsed = JSON.parse(product.content ?? "{}"); } catch {}

    const hasSections = {
      introduction: !!parsed?.introduction?.body,
      quickStart: !!(parsed?.quickStart?.steps?.length > 0),
      chapters: parsed?.chapters?.length ?? 0,
      framework: !!parsed?.framework?.steps?.length,
      commonMistakes: !!(parsed?.commonMistakes?.mistakes?.length > 0),
      checklist: parsed?.checklist?.items?.length ?? 0,
      faq: parsed?.faq?.questions?.length ?? 0,
      resources: parsed?.resources?.items?.length ?? 0,
      conclusion: !!parsed?.conclusion?.body,
      bonus: !!parsed?.bonus?.body,
    };

    const avgChapterWords = parsed?.chapters?.length
      ? Math.round(parsed.chapters.reduce((a: number, ch: any) => a + (ch.body?.split(/\s+/).length ?? 0), 0) / parsed.chapters.length)
      : 0;

    const sampleChapterBodies = (parsed?.chapters ?? []).slice(0, 3).map((ch: any) => `  - "${ch.title}": ${ch.body?.split(/\s+/).length ?? 0} words, first sentence: "${ch.body?.split(/\.\s/)[0]?.slice(0, 80) ?? ""}..."`).join("\n");

    const reportPrompt = `You are a world-class digital product quality auditor who has evaluated 5,000+ premium PDFs sold on Gumroad, Amazon KDP, and Etsy.

Analyze this digital product and produce a structured sellability report in JSON.

PRODUCT TITLE: "${product.title}"
TOPIC: "${product.topic}"
CURRENT SELLABILITY SCORE: ${product.sellabilityScore ?? 80}/100
SECTIONS PRESENT: ${JSON.stringify(hasSections, null, 2)}
AVERAGE CHAPTER WORD COUNT: ${avgChapterWords} words
SAMPLE CHAPTER ANALYSIS:
${sampleChapterBodies || "  No chapter data available"}

Evaluate each of these 8 dimensions:
1. Content Depth — are chapters rich with specifics, examples, and data?
2. Quick Start — does the product give readers an immediate win?
3. Transformation Arc — does it take the reader from pain to solution logically?
4. Framework Strength — is there a memorable, branded system or method?
5. Proof & Examples — are there real case studies with specific numbers?
6. Practical Tools — are checklist, FAQ, and resources actionable?
7. Market Fit — how well does this solve a real, in-demand problem?
8. Professional Presentation — is the structure complete and polished?

Return ONLY this exact JSON (no text before, no code fences):

{
  "overallScore": ${product.sellabilityScore ?? 80},
  "summary": "2-3 sentence honest summary of the product's current quality and biggest opportunity. Be specific — name the topic and actual issues.",
  "sections": [
    { "name": "Content Depth", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence on what is working or what is weak." },
    { "name": "Quick Start", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." },
    { "name": "Transformation Arc", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." },
    { "name": "Framework Strength", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." },
    { "name": "Proof & Examples", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." },
    { "name": "Practical Tools", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." },
    { "name": "Market Fit", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." },
    { "name": "Presentation", "score": 0, "status": "strong|needs work|missing", "feedback": "1 specific sentence." }
  ],
  "topStrengths": [
    "Specific strength 1 naming what is genuinely good",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "topWeaknesses": [
    "Specific weakness 1 naming the exact gap and its impact on sales",
    "Specific weakness 2",
    "Specific weakness 3"
  ],
  "improvementPlan": [
    { "priority": "high", "action": "Specific action 1 — what exactly to add, expand, or fix", "impact": "How this raises the score or improves conversions." },
    { "priority": "high", "action": "Specific action 2", "impact": "Impact." },
    { "priority": "medium", "action": "Specific action 3", "impact": "Impact." },
    { "priority": "medium", "action": "Specific action 4", "impact": "Impact." },
    { "priority": "low", "action": "Specific action 5", "impact": "Impact." }
  ],
  "potentialScore": 0,
  "marketabilityNote": "1-2 sentences on why this specific topic sells well (or needs better positioning) and which platform or channel is best to promote it on."
}`;

    const reportRaw = await callProductStructureAI(reportPrompt, "You are a digital product quality auditor. Return ONLY valid JSON — no text before or after, no markdown, no code fences.");
    let report: any;
    try {
      const match = reportRaw.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || reportRaw.match(/\{[\s\S]*\}/s);
      report = JSON.parse(match?.[1] ?? match?.[0] ?? reportRaw);
    } catch {
      res.status(500).json({ error: "Failed to generate report. Please try again." });
      return;
    }

    // Sanitize text fields
    if (report.summary) report.summary = stripMarkdown(report.summary);
    if (Array.isArray(report.topStrengths)) report.topStrengths = report.topStrengths.map(stripMarkdown);
    if (Array.isArray(report.topWeaknesses)) report.topWeaknesses = report.topWeaknesses.map(stripMarkdown);
    if (Array.isArray(report.sections)) {
      report.sections = report.sections.map((s: any) => ({ ...s, feedback: stripMarkdown(s.feedback ?? "") }));
    }
    if (Array.isArray(report.improvementPlan)) {
      report.improvementPlan = report.improvementPlan.map((item: any) => ({
        ...item,
        action: stripMarkdown(item.action ?? ""),
        impact: stripMarkdown(item.impact ?? ""),
      }));
    }
    if (report.marketabilityNote) report.marketabilityNote = stripMarkdown(report.marketabilityNote);

    res.json(report);
  } catch (err: any) {
    req.log.error({ err }, "SellabilityReport error");
    res.status(500).json({ error: err?.message ?? "Report generation failed" });
  }
});

router.post("/products/upload", requireAuth, async (req: any, res) => {
  try {
    const { title, description, price, category, authorName, uploadedFileUrl, authorPhotoUrl } = req.body;
    if (!title || !price || !uploadedFileUrl) {
      res.status(400).json({ error: "title, price and uploadedFileUrl required" });
      return;
    }

    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    const [saved] = await db.insert(productsTable).values({
      userId: req.userId,
      topic: title,
      authorName: authorName || user?.name || "Author",
      title,
      subtitle: description || "",
      content: description || "",
      tableOfContents: [],
      aboutSection: description || "",
      authorBio: `${authorName || user?.name} — Digital product creator`,
      authorPhotoUrl: authorPhotoUrl || null,
      sellabilityScore: 80,
      price: String(price),
      originalPrice: String(Number(price) * 2),
      targetAudience: "General audience",
      monetizationNotes: "User-uploaded product",
      category: category || "General",
      isPublished: false,
      isUploaded: true,
      uploadedFileUrl,
    }).returning();

    res.json({
      ...saved,
      price: Number(saved.price),
      originalPrice: Number(saved.originalPrice),
    });
  } catch (err) {
    req.log.error({ err }, "UploadProduct error");
    res.status(500).json({ error: "Product upload failed" });
  }
});

router.post("/products/:id/generate-landing-page", requireAuth, async (req: any, res) => {
  try {
    const { authorPhotoUrl } = req.body || {};
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const styleIdx = product.id % LANDING_PAGE_STYLES.length;
    const style = LANDING_PAGE_STYLES[styleIdx];

    const uniqueAngle = [
      `Use a STORY-DRIVEN approach — open with a personal transformation story before revealing the solution.`,
      `Use a PROBLEM-FIRST approach — agitate the pain deeply before offering any solution.`,
      `Use a CURIOSITY-GAP approach — lead with an intriguing secret or counter-intuitive insight.`,
      `Use an AUTHORITY-DRIVEN approach — lead with credibility and specific results achieved by others.`,
      `Use a COMMUNITY approach — position this as joining a movement of successful people.`,
    ][product.id % 5];

    const userPrompt = `Create a UNIQUE, HIGH-CONVERSION landing page for this specific product:
Product: "${product.title}"
Topic: "${product.topic}"
Price: $${product.price}
Target Audience: ${product.targetAudience ?? "motivated adults ready to invest in themselves"}
Unique Copy Direction: ${uniqueAngle}
${authorPhotoUrl ? `Author photo available: yes — mention the author's photo adds credibility to the sales page` : ""}

IMPORTANT: This landing page must be COMPLETELY DIFFERENT from generic templates. Use specific pain points, real numbers, and emotionally charged language tailored to this exact product.

Respond ONLY in this JSON format:
{
  "heroHeadline": "Specific, bold, transformation-promise headline (not generic)",
  "heroSubheadline": "Supporting statement that speaks directly to the reader's exact situation",
  "heroCta": "Action-specific CTA button text",
  "problemSection": { 
    "headline": "Are You Tired of [specific pain]?", 
    "points": [
      "Specific pain point 1 with emotional language",
      "Specific pain point 2 that makes them feel understood",
      "Specific pain point 3 that creates urgency",
      "Specific pain point 4 that validates their struggle",
      "Specific pain point 5 that positions this as the solution"
    ] 
  },
  "solutionSection": { 
    "headline": "Introducing: The [specific solution name]", 
    "description": "Detailed solution description that positions the product as the perfect answer to all their problems — specific, not generic" 
  },
  "benefitsSection": { 
    "headline": "Here's Exactly What You'll Get Inside", 
    "benefits": [
      {"title":"Specific benefit 1","description":"Detailed description with specific outcome"},
      {"title":"Specific benefit 2","description":"Detailed description with specific outcome"},
      {"title":"Specific benefit 3","description":"Detailed description with specific outcome"},
      {"title":"Specific benefit 4","description":"Detailed description with specific outcome"},
      {"title":"Specific benefit 5","description":"Detailed description with specific outcome"},
      {"title":"Specific benefit 6","description":"Detailed description with specific outcome"}
    ] 
  },
  "socialProof": { 
    "headline": "Real People. Real Results. Zero Fluff.", 
    "testimonials": [
      {"name":"[Real-sounding name 1]","role":"[Specific role/background]","text":"Specific testimonial with numbers and timeframe — not generic","rating":5},
      {"name":"[Real-sounding name 2]","role":"[Specific role/background]","text":"Specific testimonial with personal story detail","rating":5},
      {"name":"[Real-sounding name 3]","role":"[Specific role/background]","text":"Specific testimonial addressing a skeptic who became a believer","rating":5},
      {"name":"[Real-sounding name 4]","role":"[Specific role/background]","text":"Specific testimonial from someone who tried other solutions first","rating":5}
    ] 
  },
  "pricingSection": { 
    "headline": "Get Everything Today — One Time Investment", 
    "originalPrice": "${Number(product.originalPrice ?? Number(product.price) * 2)}", 
    "currentPrice": "${product.price}", 
    "includedItems": [
      "Complete ${product.title} (${product.pageCount ?? 20}+ Pages)",
      "Step-by-Step Action Guide",
      "Bonus: Quick-Start Checklist",
      "Bonus: Resource Library",
      "Bonus: Templates & Swipe Files",
      "Lifetime Access & Free Updates"
    ], 
    "guarantee": "30-Day 100% Money-Back Guarantee — If you don't see results, you pay nothing." 
  },
  "finalCta": { 
    "headline": "Your transformation starts the moment you click below", 
    "buttonText": "Yes! I Want This Now →", 
    "subtext": "Instant Digital Download • 30-Day Money-Back Guarantee • Secure Payment" 
  },
  "authorSection": {
    "headline": "Meet Your Guide",
    "hasPhoto": ${authorPhotoUrl ? "true" : "false"}
  }
}`;

    // Run copy generation + Gemini image generation in parallel
    const [aiRaw, { heroImage }] = await Promise.all([
      callAI(userPrompt, `You are a world-class direct-response copywriter who creates landing pages that convert at 5-15%. Every page you write is completely unique — tailored specifically to the product, audience, and emotional triggers. Never use generic copy. Respond in valid JSON only.`),
      generateLandingPageImages({ title: product.title, topic: product.topic ?? product.title }),
    ]);

    let landingPage: any;
    try {
      const jsonMatch = aiRaw.match(/```json\n?([\s\S]*?)\n?```/) || aiRaw.match(/\{[\s\S]*\}/);
      landingPage = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? "{}");
    } catch {
      landingPage = {
        heroHeadline: `Discover the Secret to ${product.topic} That Nobody Is Talking About`,
        heroSubheadline: "The complete system — even if you've tried everything else and failed",
        heroCta: "Get Instant Access Now"
      };
    }

    // Embed the Gemini-generated hero image directly into landing page data
    if (heroImage) {
      landingPage.heroImage = heroImage;
      req.log.info("[LandingPage] Hero image embedded as base64 data URI");
    }

    if (authorPhotoUrl) {
      landingPage.authorPhotoUrl = authorPhotoUrl;
      await db.update(productsTable).set({ authorPhotoUrl }).where(eq(productsTable.id, parseInt(req.params.id)));
    }

    await db.update(productsTable).set({ landingPage }).where(eq(productsTable.id, parseInt(req.params.id)));
    res.json(landingPage);
  } catch (err) {
    req.log.error({ err }, "GenerateLandingPage error");
    res.status(500).json({ error: "Landing page generation failed" });
  }
});

router.post("/products/:id/generate-campaign", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const title = product.title;
    const topic = product.topic;
    const price = product.price;
    const audience = product.targetAudience ?? "general audience";

    const cleanText = (text: string) => {
      if (typeof text !== "string") return text;
      return text.replace(/<[^>]*>/g, "").replace(/(<\?php[\s\S]*?\?>|<\?[\s\S]*?\?>)/gi, "").replace(/```[\w]*\n[\s\S]*?```/g, "").trim();
    };
    const parseJSON = (raw: string, fallback: any) => {
      try { const m = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/); return JSON.parse(m?.[1] ?? m?.[0] ?? "null") ?? fallback; } catch { return fallback; }
    };

    // Run two parallel AI calls — split the work to avoid token limit issues
    const [socialRaw, guideRaw] = await Promise.all([
      // ── Call 1: Social scripts (TikTok, YouTube, Twitter, Instagram) ──
      callAI(
        `Create a complete viral social media marketing package for this digital product:
Title: "${title}" | Topic: "${topic}" | Price: $${price} | Audience: "${audience}"

Return ONLY this JSON (all scripts must be plain text — NO HTML or code):
{
  "tiktok": [
    {"hook":"Wait, nobody told you this about ${topic}...","script":"Full 60-second TikTok script with hook, value, and CTA — plain text only","caption":"Compelling caption","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]},
    {"hook":"I tried everything with ${topic} until I discovered this...","script":"Full script — plain text","caption":"Caption","hashtags":["#tag1","#tag2","#tag3","#tag4"]},
    {"hook":"Before you scroll, ${topic} changed my life — here is how...","script":"Full script — plain text","caption":"Caption","hashtags":["#tag1","#tag2","#tag3"]}
  ],
  "youtubeShorts": [
    {"title":"Compelling YT Short title 1","script":"60-second script — plain text"},
    {"title":"Compelling YT Short title 2","script":"60-second script — plain text"},
    {"title":"Compelling YT Short title 3","script":"60-second script — plain text"}
  ],
  "youtubeLong": {"title":"Full 10-15 minute YouTube video title","description":"SEO-optimized video description with timestamps and CTA","script":"Complete long-form script 800-1000 words — plain text, no code"},
  "twitter": {"tweet":"Viral tweet under 280 chars with CTA","thread":["Tweet 1 — hook","Tweet 2 — problem","Tweet 3 — solution","Tweet 4 — proof","Tweet 5 — CTA with link"]},
  "instagram": [
    {"type":"post","caption":"Full carousel/post caption — storytelling style","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10"]},
    {"type":"story","caption":"Story caption — short, punchy, swipe-up style","hashtags":["#tag1","#tag2","#tag3"]}
  ],
  "contentIdeas": ["Content idea 1 — specific","Content idea 2","Content idea 3","Content idea 4","Content idea 5","Content idea 6","Content idea 7","Content idea 8"],
  "ctaSuggestions": ["CTA 1 — urgency-based","CTA 2 — benefit-based","CTA 3 — curiosity-based","CTA 4 — scarcity-based","CTA 5 — social proof-based"]
}`,
        `You are a world-class social media marketing expert. Create emotionally compelling, platform-native content. Plain text ONLY in all scripts — no HTML. Return only valid JSON.`,
      ),
      // ── Call 2: Platform guides + sales scripts + ad copy ──
      callAI(
        `Create a complete marketing guide and sales toolkit for this digital product:
Title: "${title}" | Topic: "${topic}" | Price: $${price} | Audience: "${audience}"

Return ONLY this JSON (all text must be plain — NO HTML or code):
{
  "facebookGuide": {
    "overview": "3-4 sentences on the Facebook marketing strategy for this product",
    "bestPractices": ["Practice 1","Practice 2","Practice 3","Practice 4","Practice 5"],
    "postIdeas": ["Post idea 1 — specific to topic","Post idea 2","Post idea 3","Post idea 4"],
    "organicStrategy": "2-3 sentences on growing organically on Facebook for this niche",
    "groupStrategy": "How to leverage Facebook Groups to sell this product — 2-3 sentences"
  },
  "facebookAds": {
    "overview": "2-3 sentences on FB Ads strategy for this product",
    "targeting": "Detailed audience targeting recommendations for Facebook Ads",
    "budgetAdvice": "Recommended starting budget and scaling strategy",
    "adExamples": [
      {"format":"Image Ad","headline":"Attention-grabbing headline under 40 chars","primaryText":"Full ad copy 100-150 words — storytelling, pain-point focused, ends with CTA","cta":"Shop Now"},
      {"format":"Video Ad Script","headline":"Video hook headline","primaryText":"30-second video ad script — plain text","cta":"Learn More"},
      {"format":"Carousel Ad","headline":"Carousel headline","primaryText":"Carousel ad primary text 80-100 words","cta":"Get Started"}
    ],
    "retargeting": "Retargeting strategy for people who visited the product page — 2-3 sentences"
  },
  "youtubeGuide": {
    "overview": "YouTube marketing strategy for this product — 3-4 sentences",
    "seoTips": ["SEO tip 1","SEO tip 2","SEO tip 3","SEO tip 4"],
    "thumbnailTips": ["Thumbnail tip 1","Thumbnail tip 2","Thumbnail tip 3"],
    "channelStrategy": "How to build a YouTube channel around this topic to drive sales — 3-4 sentences",
    "collaborationIdeas": ["Collaboration idea 1","Collaboration idea 2","Collaboration idea 3"]
  },
  "tiktokGuide": {
    "overview": "TikTok marketing strategy — 3-4 sentences",
    "algorithmTips": ["Algorithm tip 1","Algorithm tip 2","Algorithm tip 3","Algorithm tip 4"],
    "trendStrategy": "How to leverage trends for this niche on TikTok — 2-3 sentences",
    "postingSchedule": "Optimal posting frequency and times — specific advice",
    "niche": "TikTok niche strategy for this topic — 2-3 sentences"
  },
  "salesScripts": {
    "dmScript": "Complete DM/chat sales script for reaching out to prospects about this product — 150-200 words, conversational and non-pushy",
    "emailPitch": "Short email pitch to cold or warm prospects — 100-150 words, story-based with clear CTA",
    "storyScript": "Instagram/Facebook Story script to sell this product — 60-90 words, urgent, personal",
    "liveScript": "Live stream sales pitch script — 200-250 words, engaging and conversion-focused",
    "objectionHandling": [
      {"objection":"It's too expensive","response":"Full response — empathetic and reframing"},
      {"objection":"I don't have time","response":"Full response — reframing time investment"},
      {"objection":"I'm not sure it will work for me","response":"Full response — social proof and specifics"},
      {"objection":"I'll think about it","response":"Full response — urgency and consequence of waiting"}
    ]
  },
  "promotionStrategies": [
    {"strategy":"Strategy 1 name","description":"Full description 2-3 sentences","difficulty":"Easy","timeframe":"Immediate"},
    {"strategy":"Strategy 2 name","description":"Full description","difficulty":"Medium","timeframe":"1-2 weeks"},
    {"strategy":"Strategy 3 name","description":"Full description","difficulty":"Easy","timeframe":"Immediate"},
    {"strategy":"Strategy 4 name","description":"Full description","difficulty":"Hard","timeframe":"1+ month"},
    {"strategy":"Strategy 5 name","description":"Full description","difficulty":"Medium","timeframe":"1 week"}
  ]
}`,
        `You are a world-class digital marketing strategist. Create specific, actionable guidance. Plain text ONLY — no HTML or code in any field. Return only valid JSON.`,
      ),
    ]);

    const social = parseJSON(socialRaw, { tiktok: [], youtubeShorts: [], youtubeLong: {}, twitter: {}, instagram: [], contentIdeas: [], ctaSuggestions: [] });
    const guide = parseJSON(guideRaw, { facebookGuide: {}, facebookAds: {}, youtubeGuide: {}, tiktokGuide: {}, salesScripts: {}, promotionStrategies: [] });

    // Clean all text fields
    if (Array.isArray(social.tiktok)) {
      social.tiktok = social.tiktok.map((t: any) => ({ ...t, script: cleanText(t.script), hook: cleanText(t.hook) }));
    }
    if (Array.isArray(social.youtubeShorts)) {
      social.youtubeShorts = social.youtubeShorts.map((s: any) => ({ ...s, script: cleanText(s.script) }));
    }
    if (social.youtubeLong?.script) {
      social.youtubeLong.script = cleanText(social.youtubeLong.script);
    }

    const campaign = { ...social, ...guide };
    await db.update(productsTable).set({ marketingCampaign: campaign }).where(eq(productsTable.id, parseInt(req.params.id)));
    res.json(campaign);
  } catch (err) {
    req.log.error({ err }, "GenerateCampaign error");
    res.status(500).json({ error: "Campaign generation failed" });
  }
});

router.post("/products/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const [user] = await db.select({ username: usersTable.username, name: usersTable.name, subscriptionTier: usersTable.subscriptionTier }).from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user?.username) { res.status(400).json({ error: "Please set a username in Settings before publishing" }); return; }

    // Auto-publish: go live immediately. Admin can remove if needed.
    await db.update(productsTable).set({
      isPublished: true,
      publishStatus: "published",
      updatedAt: new Date(),
    }).where(eq(productsTable.id, parseInt(req.params.id)));

    res.json({
      message: "Product is now live on the marketplace!",
      status: "published",
      storeUrl: `/store/${user.username}`,
      productUrl: `/product/${req.params.id}`,
    });
  } catch (err) {
    req.log.error({ err }, "PublishProduct error");
    res.status(500).json({ error: "Publish failed" });
  }
});

// One-click generate EVERYTHING: landing page + 30-day email sequence + marketing assets
router.post("/products/:id/generate-all", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const title = product.title;
    const topic = product.topic;
    const price = Number(product.price);
    const audience = product.targetAudience ?? "entrepreneurs and creators";

    // ─── Run all AI calls + image generation in parallel ─────────────────────
    const [landingRaw, emailRaw, mktRaw, { heroImage }] = await Promise.all([
      // 1. Landing page
      callAI(
        `Create a high-conversion landing page for: "${title}" — topic: "${topic}", price: $${price}, audience: "${audience}".
Return ONLY valid JSON:
{
  "heroHeadline": "...",
  "heroSubheadline": "...",
  "heroCta": "...",
  "problemSection": { "headline": "...", "points": ["...","...","..."] },
  "solutionSection": { "headline": "...", "body": "..." },
  "benefitsSection": { "headline": "...", "items": [{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."}] },
  "whatsIncluded": { "headline": "...", "items": ["...","...","...","...","..."] },
  "testimonialsSection": { "headline": "...", "items": [{"name":"...","result":"...","quote":"..."},{"name":"...","result":"...","quote":"..."},{"name":"...","result":"...","quote":"..."}] },
  "pricingSection": { "headline": "...", "originalPrice": ${price * 2}, "currentPrice": ${price}, "includedItems": ["...","...","...","...","..."], "guarantee": "30-Day 100% Money-Back Guarantee" },
  "faqSection": { "headline": "Common Questions", "items": [{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}] },
  "finalCta": { "headline": "...", "buttonText": "Yes! I Want This Now →", "subtext": "Instant Digital Download • 30-Day Money-Back Guarantee" }
}`,
        `You are a world-class direct-response copywriter. Every word is transformation-focused and emotionally driven. No generic copy. JSON only.`,
      ),
      // 2. 30-day email sequence
      callAI(
        `Create a complete 30-day email marketing sequence for: "${title}" — topic: "${topic}", price: $${price}, audience: "${audience}".
Return ONLY valid JSON array of exactly 30 email objects:
[
  { "day": 1, "type": "welcome", "subject": "...", "preview": "...", "body": "..." },
  { "day": 2, "type": "awareness", "subject": "...", "preview": "...", "body": "..." },
  ...through day 30
]
Day 1: Welcome + product intro (deliver immediate value)
Days 2-5: Problem awareness (deepen the pain)
Days 6-10: Value + education (free tips that showcase expertise)
Days 11-15: Case study + transformation stories
Days 16-20: Offer positioning (make the product feel inevitable)
Days 21-25: Objection handling (remove every excuse)
Days 26-29: Urgency building (scarcity, deadline, consequences)
Day 30: Final conversion (last chance, full emotional push)
Each email body: 150-250 words, conversational, story-driven. NO HTML tags.`,
        `You are a master email copywriter. Every email must feel personal and move the reader closer to buying. Pure JSON array only.`,
      ),
      // 3. Marketing assets
      callAI(
        `Create a complete marketing asset kit for: "${title}" — topic: "${topic}", price: $${price}, audience: "${audience}".
Return ONLY valid JSON:
{
  "tiktok": [
    {"hook":"...","script":"full 60-second script — plain text only","caption":"...","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]},
    {"hook":"...","script":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]},
    {"hook":"...","script":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]}
  ],
  "instagram": [
    {"hook":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]},
    {"hook":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]},
    {"hook":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]}
  ],
  "adCopy": [
    {"platform":"Facebook","headline":"...","primaryText":"...","cta":"Shop Now"},
    {"platform":"Google","headline":"...","description":"...","cta":"Learn More"}
  ],
  "emailSubjectLines": ["...","...","...","...","..."],
  "smsPromo": "...",
  "twitterThread": ["tweet 1","tweet 2","tweet 3","tweet 4","tweet 5 — CTA"]
}`,
        `You are a viral marketing expert. Content must be emotionally compelling and platform-native. Absolutely no HTML. JSON only.`,
      ),
      // 4. Landing page hero image via Gemini (stored as base64 — no live Pollinations URLs)
      generateLandingPageImages({ title, topic }),
    ]);

    // Parse each response
    const parse = (raw: string, fallback: any) => {
      try {
        const m = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        return JSON.parse(m?.[1] ?? m?.[0] ?? "null") ?? fallback;
      } catch { return fallback; }
    };

    const landingPage = parse(landingRaw, { heroHeadline: `Discover the Secret to ${topic}` });
    const emailSeq = parse(emailRaw, []);
    const marketingAssets = parse(mktRaw, { tiktok: [], instagram: [], adCopy: [] });

    // Embed the Gemini-generated hero image directly into landing page data (no external URLs)
    if (heroImage) {
      landingPage.heroImage = heroImage;
      req.log.info("[GenerateAll] Hero image embedded as base64 data URI");
    }

    // Clean marketing scripts
    const clean = (s: string) => typeof s === "string" ? s.replace(/<[^>]*>/g, "").replace(/```[\w]*\n[\s\S]*?```/g, "").trim() : s;
    if (Array.isArray(marketingAssets.tiktok)) {
      marketingAssets.tiktok = marketingAssets.tiktok.map((t: any) => ({ ...t, script: clean(t.script), hook: clean(t.hook) }));
    }

    await db.update(productsTable).set({
      landingPage,
      emailSequence30Days: Array.isArray(emailSeq) ? emailSeq : [],
      marketingAssets,
      updatedAt: new Date(),
    }).where(eq(productsTable.id, parseInt(req.params.id)));

    // Auto-create / update email sequence in the email marketing system
    try {
      const { createSequenceFromProduct } = await import("./email-marketing");
      await createSequenceFromProduct(parseInt(req.params.id));
    } catch (emailErr: any) {
      req.log.warn({ err: emailErr?.message }, "Email sequence sync failed (non-fatal)");
    }

    res.json({ landingPage, emailSequence30Days: emailSeq, marketingAssets, message: "Everything generated!" });
  } catch (err) {
    req.log.error({ err }, "GenerateAll error");
    res.status(500).json({ error: "Generation failed" });
  }
});

// ── INTERNAL: create one product tier (tripwire / main / upsell) ─────────────
async function createProductTier(
  topic: string,
  authorName: string,
  description: string,
  targetPages: number,
  productStyle: string,
  userId: number,
  forcedPrice: number,
): Promise<any> {
  const userPrompt = buildProductPrompt(topic, authorName, description, targetPages, productStyle);
  let aiRaw = await callProductStructureAI(userPrompt, PRODUCT_SYSTEM_PROMPT);
  let parsed: any = extractAndRepairJSON(aiRaw);
  if (!parsed) {
    aiRaw = await callProductStructureAI(userPrompt, "Return ONLY valid JSON. No text before or after. No code fences.");
    parsed = extractAndRepairJSON(aiRaw);
  }
  if (!parsed || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
    throw new Error(`AI returned invalid structure for ${targetPages}-page tier`);
  }
  parsed = sanitizeProductParsed(parsed);
  if (Array.isArray(parsed.chapters)) {
    parsed.chapters = parsed.chapters.map((ch: any) => ({
      ...ch, body: cleanBodyText(ch.body ?? ""), hook: cleanBodyText(ch.hook ?? ""),
    }));
  }

  const chapterTitles = parsed.chapters.map((ch: any) => ch.title ?? "");
  const premiumPrompt = buildPremiumSectionsPrompt(topic, parsed.title ?? topic, chapterTitles);

  const [premiumRaw, expandedChapters] = await Promise.all([
    callProductStructureAI(premiumPrompt, "Return ONLY valid JSON. No text before or after. No code fences."),
    Promise.all(
      parsed.chapters.map((ch: any) =>
        expandProductChapterBody(topic, {
          number: ch.number ?? 1, title: ch.title ?? "", hook: ch.hook ?? "", body: ch.body ?? "",
        }, parsed.chapters.length).then(body => ({ ...ch, body }))
      )
    ),
  ]);

  const premium = extractAndRepairJSON(premiumRaw);
  if (premium) {
    ["introduction", "quickStart", "framework", "commonMistakes", "checklist", "faq", "resources"]
      .forEach(k => { if ((premium as any)[k]) parsed[k] = (premium as any)[k]; });
    parsed = sanitizeProductParsed(parsed);
  }

  const finalChapters = await Promise.all(
    expandedChapters.map(async (ch: any) => {
      if (isBodyCorrupted(ch.body)) {
        const retried = await expandProductChapterBody(topic, {
          number: ch.number ?? 1, title: ch.title ?? "", hook: ch.hook ?? "", body: "",
        }, expandedChapters.length, 2);
        return { ...ch, body: retried };
      }
      return ch;
    })
  );
  parsed.chapters = finalChapters;

  const chapterTitlesSync = finalChapters.map((ch: any) => ch.title);
  if (parsed.tableOfContents && Array.isArray(parsed.tableOfContents)) {
    parsed.tableOfContents = parsed.tableOfContents.map((entry: string) => {
      const match = chapterTitlesSync.find((t: string) =>
        entry.toLowerCase().includes((t ?? "").toLowerCase().slice(0, 15))
      );
      return match || entry;
    });
  }

  const [saved] = await db.insert(productsTable).values({
    userId, topic, authorName,
    title: parsed.title ?? topic,
    subtitle: parsed.subtitle ?? "",
    content: JSON.stringify(parsed),
    tableOfContents: parsed.tableOfContents ?? [],
    aboutSection: parsed.aboutSection ?? "",
    authorBio: parsed.authorBio ?? "",
    sellabilityScore: parsed.sellabilityScore ?? 88,
    price: String(forcedPrice),
    originalPrice: String(forcedPrice * 2),
    targetAudience: parsed.targetAudience ?? "",
    monetizationNotes: parsed.monetizationNotes ?? "",
    category: parsed.category ?? "General",
    pageCount: targetPages,
    isPublished: false,
  }).returning();

  return {
    ...saved,
    price: Number(saved.price),
    originalPrice: Number(saved.originalPrice),
    chaptersData: parsed,
  };
}

// ── INTERNAL: generate landing page + email sequence + marketing per product ──
async function generateBundleAssets(
  productId: number, title: string, topic: string, price: number, audience: string,
): Promise<void> {
  try {
  const [landingRaw, emailRaw, mktRaw] = await Promise.all([
    callAI(
      `Create a high-conversion landing page for: "${title}" — topic: "${topic}", price: $${price}, audience: "${audience}".
Return ONLY valid JSON: {"heroHeadline":"...","heroSubheadline":"...","heroCta":"...","problemSection":{"headline":"...","points":["...","...","..."]},"solutionSection":{"headline":"...","body":"..."},"benefitsSection":{"headline":"...","items":[{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."},{"title":"...","desc":"..."}]},"whatsIncluded":{"headline":"...","items":["...","...","...","...","..."]},"testimonialsSection":{"headline":"...","items":[{"name":"...","result":"...","quote":"..."},{"name":"...","result":"...","quote":"..."},{"name":"...","result":"...","quote":"..."}]},"pricingSection":{"headline":"...","originalPrice":${price * 2},"currentPrice":${price},"includedItems":["...","...","...","...","..."],"guarantee":"30-Day 100% Money-Back Guarantee"},"faqSection":{"headline":"Common Questions","items":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]},"finalCta":{"headline":"...","buttonText":"Yes! I Want This Now →","subtext":"Instant Digital Download • 30-Day Guarantee"}}`,
      "You are a world-class direct-response copywriter. Transformation-focused, emotionally driven. JSON only."
    ),
    callAI(
      `Create a 30-day email marketing sequence for: "${title}" — topic: "${topic}", price: $${price}, audience: "${audience}".
Return ONLY a valid JSON array of 30 objects: [{"day":1,"type":"welcome","subject":"...","preview":"...","body":"..."},...through day 30].
Day 1: Welcome + immediate value. Days 2-10: Education. Days 11-20: Case studies. Days 21-28: Urgency. Days 29-30: Final CTA. Each body 150-200 words. No HTML.`,
      "You are a master email copywriter. Personal, story-driven, high-converting. JSON array only."
    ),
    callAI(
      `Create viral marketing content for: "${title}" — topic: "${topic}", price: $${price}.
Return ONLY valid JSON: {"tiktok":[{"hook":"...","script":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]},{"hook":"...","script":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]},{"hook":"...","script":"...","caption":"...","hashtags":["#tag1","#tag2","#tag3"]}],"youtubeShorts":[{"title":"...","script":"..."},{"title":"...","script":"..."}],"youtubeLong":{"title":"...","description":"...","script":"..."},"twitter":{"tweet":"...","thread":["...","...","...","..."]},"facebook":{"post":"..."},"instagram":{"caption":"...","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"]}}`,
      "You are a viral marketing expert. Human, emotionally compelling. Plain text ONLY in all scripts. JSON only."
    ),
  ]);

  let landingPage: any = {};
  let emailSeq: any[] = [];
  let marketingAssets: any = {};

  try {
    const m = landingRaw.match(/```json\n?([\s\S]*?)\n?```/) || landingRaw.match(/\{[\s\S]*\}/);
    landingPage = JSON.parse(m?.[1] ?? m?.[0] ?? "{}");
  } catch {}
  try {
    const m = emailRaw.match(/```json\n?([\s\S]*?)\n?```/) || emailRaw.match(/\[[\s\S]*\]/);
    emailSeq = JSON.parse(m?.[1] ?? m?.[0] ?? "[]");
    if (!Array.isArray(emailSeq)) emailSeq = [];
  } catch {}
  try {
    const m = mktRaw.match(/```json\n?([\s\S]*?)\n?```/) || mktRaw.match(/\{[\s\S]*\}/);
    marketingAssets = JSON.parse(m?.[1] ?? m?.[0] ?? "{}");
  } catch {}

  await db.update(productsTable).set({
    landingPage, emailSequence30Days: emailSeq, marketingAssets, updatedAt: new Date(),
  }).where(eq(productsTable.id, productId));
  } catch (err: any) {
    console.warn(`[generateBundleAssets] Asset generation skipped for product ${productId} — no AI keys configured. Add keys in Admin > API Keys to enable landing pages, emails, and marketing assets. Error: ${err?.message}`);
  }
}

// ── SCRYVOX: chapter angle builder ────────────────────────────────────────────
function buildChapterAngles(topic: string, frame: any, count: number): string[] {
  const pool = [
    `${topic}: ${frame.firstPrinciplesBreakdown[0] ?? "foundational principles"}`,
    `${topic}: ${frame.wisdomPrinciples[0]?.applicationToTopic ?? "strategic wisdom"}`,
    `${topic}: ${frame.thinkingFrameworks[0]?.applicationToTopic ?? "systems thinking approach"}`,
    `${topic}: ${frame.reasoningChain[0] ?? "root cause and core leverage"}`,
    `${topic}: ${frame.pdfStructureHints.deepDiveCallouts[0] ?? "deep application"}`,
    `${topic}: ${frame.firstPrinciplesBreakdown[1] ?? frame.paradoxAtCore}`,
    `${topic}: ${frame.wisdomPrinciples[1]?.applicationToTopic ?? "advanced framework"}`,
    `${topic}: ${frame.thinkingFrameworks[1]?.applicationToTopic ?? "leverage and scale"}`,
    `${topic}: ${frame.reasoningChain[1] ?? "implementation mastery"}`,
    `${topic}: ${frame.pdfStructureHints.synthesisFramework ?? "synthesis and integration"}`,
  ];
  return pool.slice(0, count);
}

// ── SCRYVOX-POWERED TIER CREATION ─────────────────────────────────────────────
async function createQuickTier(
  topic: string,
  authorName: string,
  description: string,
  targetPages: number,
  userId: number,
  forcedPrice: number,
): Promise<any> {
  const chapterCount = targetPages <= 15 ? 3 : targetPages <= 35 ? 5 : 7;
  const tierLabel = forcedPrice <= 9 ? "Quick Win Starter" : forcedPrice <= 27 ? "Complete System" : "VIP Masterclass";

  const prompt = `You are creating tier "${tierLabel}" (price $${forcedPrice}) of a 3-product bundle on: "${topic}".
${description ? `Context: ${description}` : ""}
TARGET: ${targetPages} pages | ${chapterCount} chapters

RULES:
- PLAIN TEXT ONLY. Zero markdown (#, **, *, >, -, backticks).
- Chapter titles must be specific to "${topic}". NEVER use generic titles.
- Each chapter body: 3-4 paragraphs of flowing prose (250-350 words).
- Return ONLY valid JSON. No text before or after. No code fences.

Return this JSON:
{
  "title": "[Transformation title with number/timeframe for $${forcedPrice} tier]",
  "subtitle": "[Audience + pain + promise in one sentence]",
  "category": "[Niche]",
  "sellabilityScore": 90,
  "suggestedPrice": ${forcedPrice},
  "targetAudience": "[Who this is for, 1-2 sentences]",
  "monetizationNotes": "[Why this price point works, 2 sentences]",
  "aboutSection": "[2 hook sentences — transformation this product delivers]",
  "authorBio": "[2 sentences, 3rd person, credentials]",
  "tableOfContents": ["Chapter 1: [specific title]", "Chapter 2: [specific title]"],
  "chapters": [
    {
      "number": 1,
      "title": "[Specific chapter title for ${topic}]",
      "hook": "[Reader's exact frustration this chapter addresses]",
      "body": "[3-4 paragraphs, 280-350 words, plain prose. Open at pain → root cause → real story with name+numbers → solution]",
      "steps": ["Step 1: [action]", "Step 2: [action]", "Step 3: [action]"],
      "callout": "[Insider insight]",
      "keyTakeaways": ["[Lesson 1]", "[Lesson 2]", "[Lesson 3]"],
      "actionStep": "[5-minute action]"
    }
  ],
  "conclusion": {
    "title": "Your Next Steps",
    "body": "[2 motivating paragraphs]",
    "steps": ["Week 1: [actions]", "Week 2: [actions]", "Week 3: [actions]", "Week 4: [actions]"]
  },
  "bonus": {
    "title": "[Bonus insight]",
    "body": "[2 paragraphs]",
    "items": ["[Bonus 1]", "[Bonus 2]", "[Bonus 3]"]
  }
}`;

  const [aiRaw, coverImageUrl] = await Promise.all([
    callProductStructureAI(prompt, PRODUCT_SYSTEM_PROMPT),
    getStockImageUrl(topic, Math.floor(Math.random() * 10) + 1).catch(() => null),
  ]);

  let parsed: any = extractAndRepairJSON(aiRaw);
  if (!parsed) {
    const retry = await callProductStructureAI(prompt, "Return ONLY valid JSON. No text before or after.");
    parsed = extractAndRepairJSON(retry);
  }
  if (!parsed || !parsed.chapters) {
    parsed = {
      title: `${topic} — ${tierLabel}`,
      subtitle: `The complete ${tierLabel.toLowerCase()} for mastering ${topic}`,
      chapters: Array.from({ length: chapterCount }, (_, i) => ({
        number: i + 1,
        title: `${topic} Strategy ${i + 1}`,
        hook: `What most people get wrong about ${topic}`,
        body: `This chapter covers the essential ${topic} strategies you need to know to see real results. Most people struggle because they don't have the right framework.`,
        steps: ["Step 1: Start", "Step 2: Build", "Step 3: Scale"],
        keyTakeaways: ["Consistency beats perfection", "Focus on fundamentals", "Track your results"],
        actionStep: "Take one action today",
      })),
      tableOfContents: Array.from({ length: chapterCount }, (_, i) => `Chapter ${i + 1}: ${topic} Strategy ${i + 1}`),
      sellabilityScore: 85,
      category: "General",
      targetAudience: "Motivated adults",
      monetizationNotes: "Strong buyer demand",
      aboutSection: `This guide teaches you ${topic} step by step.`,
      authorBio: `${authorName} is an expert in ${topic}.`,
    };
  }

  if (Array.isArray(parsed.chapters)) {
    parsed.chapters = parsed.chapters.map((ch: any) => ({
      ...ch,
      body: cleanBodyText(ch.body ?? ""),
      hook: cleanBodyText(ch.hook ?? ""),
    }));
  }
  parsed = sanitizeProductParsed(parsed);

  const [saved] = await db.insert(productsTable).values({
    userId, topic, authorName,
    title: parsed.title,
    subtitle: parsed.subtitle,
    content: JSON.stringify(parsed),
    tableOfContents: parsed.tableOfContents,
    aboutSection: parsed.aboutSection,
    authorBio: parsed.authorBio,
    sellabilityScore: parsed.sellabilityScore ?? 88,
    price: String(forcedPrice),
    originalPrice: String(forcedPrice * 2),
    targetAudience: parsed.targetAudience,
    monetizationNotes: parsed.monetizationNotes,
    category: parsed.category ?? "General",
    pageCount: targetPages,
    isPublished: false,
    coverImageUrl: coverImageUrl ?? undefined,
  }).returning();

  return {
    ...saved,
    price: Number(saved.price),
    originalPrice: Number(saved.originalPrice),
    chaptersData: parsed,
    targetAudience: parsed.targetAudience,
  };
}

// ── AI TOPIC RESEARCH ─────────────────────────────────────────────────────────
router.post("/products/research-topic", requireAuth, async (req: any, res) => {
  try {
    const { topic, angle } = req.body;
    if (!topic?.trim()) { res.status(400).json({ error: "topic required" }); return; }

    const prompt = `You are a world-class digital product market researcher with deep expertise in buyer psychology and information products.

Topic: "${(topic as string).trim()}"
${angle ? `Desired angle/direction: "${(angle as string).trim()}"` : ""}

Research this topic deeply and return ONLY a JSON object:
{
  "powerfulAngle": "The single most compelling, hyper-specific angle for this digital product that makes people say I NEED this",
  "targetAudience": "Exact description of the ideal buyer — their age range, situation, #1 pain point, and desired transformation",
  "uniqueHook": "The unique mechanism or approach that makes this product unlike anything else on the market",
  "marketGap": "The specific gap in existing products that this product fills — what everyone else is missing",
  "urgencyTrigger": "The emotional trigger that makes a buyer act NOW rather than later",
  "suggestedAngles": [
    "Angle variation 1 — specific and commercially focused",
    "Angle variation 2 — different positioning/audience",
    "Angle variation 3 — different outcome/timeframe"
  ],
  "researchInsights": [
    "Market insight 1",
    "Buyer psychology insight",
    "Content strategy insight"
  ],
  "refinedTopic": "The most powerful version of the topic to use for product creation"
}

Return ONLY valid JSON. Be specific, data-driven, and commercially focused.`;

    const rawResult = await callGeminiFallback([{ role: "user", content: prompt }], "You are a market research expert. Return ONLY valid JSON, nothing else.", 1200, "research");
    let parsed: any = {};
    try { const m = rawResult?.text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}

    res.json({
      powerfulAngle: parsed.powerfulAngle ?? `${topic} — a proven step-by-step system`,
      targetAudience: parsed.targetAudience ?? "Motivated adults seeking real transformation",
      uniqueHook: parsed.uniqueHook ?? "A complete system with proven frameworks",
      marketGap: parsed.marketGap ?? "Most guides are too vague — this is hyper-specific",
      urgencyTrigger: parsed.urgencyTrigger ?? "People are ready to stop struggling and take action",
      suggestedAngles: parsed.suggestedAngles ?? [`${topic} for beginners`, `Advanced ${topic} mastery`, `${topic} in 30 days`],
      researchInsights: parsed.researchInsights ?? ["Strong buyer demand confirmed", "Clear transformation arc", "Monetizable at $27–$97"],
      refinedTopic: parsed.refinedTopic ?? topic,
    });
  } catch (err: any) {
    req.log.error({ err }, "ResearchTopic error");
    res.status(500).json({ error: err?.message ?? "Research failed" });
  }
});

// ── ONE-CLICK BUNDLE LAUNCH ───────────────────────────────────────────────────
router.post("/products/quick-launch", requireAuth, async (req: any, res) => {
  try {
    const { topic, description, authorName, angle } = req.body;
    if (!topic?.trim() || !authorName?.trim()) {
      res.status(400).json({ error: "topic and authorName are required" });
      return;
    }
    const topicStr = (topic as string).trim();
    const authorStr = (authorName as string).trim();
    const descStr = ((description as string) ?? "").trim();
    const angleStr = ((angle as string) ?? "").trim();

    // Weave the angle into the topic context if provided
    const enrichedTopic = angleStr
      ? `${topicStr} — Direction: ${angleStr}`
      : topicStr;
    const enrichedDesc = angleStr
      ? `${descStr ? descStr + ". " : ""}Angle: ${angleStr}`.trim()
      : descStr;

    req.log.info({ topic: enrichedTopic }, "QuickLaunch: Phase 1 — Scryvox generating 3 tiers in parallel");

    const [tripwire, main, upsell] = await Promise.all([
      createQuickTier(enrichedTopic, authorStr, enrichedDesc, 10, req.userId, 9),
      createQuickTier(enrichedTopic, authorStr, enrichedDesc, 30, req.userId, 27),
      createQuickTier(enrichedTopic, authorStr, enrichedDesc, 50, req.userId, 97),
    ]);

    req.log.info("QuickLaunch: Phase 2 — generating assets for all 3");

    await Promise.all([
      generateBundleAssets(tripwire.id, tripwire.title ?? topicStr, topicStr, 9,  tripwire.targetAudience ?? "creators"),
      generateBundleAssets(main.id,     main.title     ?? topicStr, topicStr, 27, main.targetAudience     ?? "creators"),
      generateBundleAssets(upsell.id,   upsell.title   ?? topicStr, topicStr, 97, upsell.targetAudience   ?? "creators"),
    ]);

    await Promise.all([
      db.update(productsTable).set({ publishStatus: "pending_approval" }).where(eq(productsTable.id, tripwire.id)),
      db.update(productsTable).set({ publishStatus: "pending_approval" }).where(eq(productsTable.id, main.id)),
      db.update(productsTable).set({ publishStatus: "pending_approval" }).where(eq(productsTable.id, upsell.id)),
    ]);

    req.log.info("QuickLaunch: complete");
    res.json({
      success: true,
      bundle: {
        tripwire: { ...tripwire, bundleTier: "starter", tierLabel: "Quick Win Starter",  bundlePrice: 9  },
        main:     { ...main,     bundleTier: "main",    tierLabel: "Complete System",     bundlePrice: 27 },
        upsell:   { ...upsell,   bundleTier: "vip",     tierLabel: "VIP Masterclass",     bundlePrice: 97 },
      },
      message: "3-product bundle created and submitted for review.",
    });
  } catch (err: any) {
    req.log.error({ err }, "QuickLaunch error");
    res.status(500).json({ error: err?.message ?? "Quick launch failed. Please try again." });
  }
});


function parseChaptersData(content: string | null | undefined): any | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed?.chapters && Array.isArray(parsed.chapters)) return parsed;
  } catch {}
  return null;
}

function formatProduct(p: any) {
  return {
    ...p,
    price: Number(p.price),
    originalPrice: Number(p.originalPrice),
    totalRevenue: Number(p.totalRevenue),
    chaptersData: parseChaptersData(p.content),
  };
}

router.get("/products", requireAuth, async (req: any, res) => {
  try {
    const items = await db.select().from(productsTable)
      .where(eq(productsTable.userId, req.userId))
      .orderBy(desc(productsTable.createdAt));
    res.json(items.map(formatProduct));
  } catch (err) {
    req.log.error({ err }, "ListProducts error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/products/:id", requireAuth, async (req: any, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/store/:username", async (req, res) => {
  try {
    const [user] = await db.select({ id: usersTable.id, name: usersTable.name, username: usersTable.username, profilePicture: usersTable.profilePicture, profileBio: usersTable.profileBio })
      .from(usersTable).where(eq(usersTable.username, req.params.username)).limit(1);
    if (!user) { res.status(404).json({ error: "Store not found" }); return; }

    const products = await db.select({
      id: productsTable.id, title: productsTable.title, subtitle: productsTable.subtitle,
      price: productsTable.price, originalPrice: productsTable.originalPrice,
      category: productsTable.category, sellabilityScore: productsTable.sellabilityScore,
      totalSales: productsTable.totalSales, targetAudience: productsTable.targetAudience,
      description: productsTable.description, createdAt: productsTable.createdAt,
      pageCount: productsTable.pageCount, coverImageUrl: productsTable.coverImageUrl,
    }).from(productsTable)
      .where(and(eq(productsTable.userId, user.id), eq(productsTable.isPublished, true)))
      .orderBy(desc(productsTable.createdAt));

    res.json({
      store: { username: user.username, ownerName: user.name, profilePicture: user.profilePicture, profileBio: user.profileBio },
      products: products.map(p => ({ ...p, price: Number(p.price), originalPrice: Number(p.originalPrice) })),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/product/:id/public", async (req, res) => {
  try {
    const [product] = await db.select().from(productsTable)
      .where(eq(productsTable.id, parseInt(req.params.id))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    // If not published, return a preview-mode response so the creator's shareable link shows a pending state
    if (!product.isPublished) {
      res.json({
        id: product.id,
        title: product.title,
        subtitle: product.subtitle,
        price: Number(product.price),
        originalPrice: Number(product.originalPrice ?? product.price),
        coverImageUrl: product.coverImageUrl,
        publishStatus: product.publishStatus ?? "draft",
        isPublished: false,
        isPendingReview: product.publishStatus === "pending_approval",
        previewMode: true,
      });
      return;
    }

    await db.update(productsTable).set({ viewCount: (product.viewCount ?? 0) + 1 }).where(eq(productsTable.id, product.id));

    const [owner] = await db.select({ name: usersTable.name, username: usersTable.username, profilePicture: usersTable.profilePicture, profileBio: usersTable.profileBio })
      .from(usersTable).where(eq(usersTable.id, product.userId)).limit(1);

    const relatedProducts = await db.select({
      id: productsTable.id, title: productsTable.title, subtitle: productsTable.subtitle,
      price: productsTable.price, originalPrice: productsTable.originalPrice,
      category: productsTable.category, totalSales: productsTable.totalSales,
    }).from(productsTable)
      .where(and(
        eq(productsTable.userId, product.userId),
        eq(productsTable.isPublished, true),
        ne(productsTable.id, product.id)
      ))
      .orderBy(desc(productsTable.totalSales))
      .limit(2);

    res.json({
      ...product,
      price: Number(product.price),
      originalPrice: Number(product.originalPrice),
      owner,
      relatedProducts: relatedProducts.map(p => ({ ...p, price: Number(p.price), originalPrice: Number(p.originalPrice) })),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Recent buyers: public social-proof feed ────────────────────────────────────
router.get("/product/:id/recent-buyers", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const rows = await db
      .select({
        buyerName: ordersTable.buyerName,
        country: ordersTable.country,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .where(and(eq(ordersTable.productId, productId), eq(ordersTable.status, "completed")))
      .orderBy(desc(ordersTable.createdAt))
      .limit(20);

    const now = Date.now();
    const buyers = rows.map(r => {
      const raw = r.buyerName ?? "";
      const firstName = raw.trim().split(/\s+/)[0] || "Someone";
      const masked = firstName.length > 1
        ? firstName[0].toUpperCase() + "*".repeat(Math.min(firstName.length - 1, 3))
        : "Someone";

      const ms = now - new Date(r.createdAt ?? 0).getTime();
      const mins = Math.floor(ms / 60000);
      const hrs  = Math.floor(ms / 3600000);
      const days = Math.floor(ms / 86400000);
      const ago  = days >= 1 ? `${days}d ago` : hrs >= 1 ? `${hrs}h ago` : mins <= 1 ? "just now" : `${mins}m ago`;

      return { name: masked, country: r.country ?? null, ago };
    });

    res.json({ buyers });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── View online: render product in browser (auth'd owner or preview) ──────────
router.get("/product/:id/view-online", requireAuth, async (req: any, res) => {
  try {
    const productId = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, productId), eq(productsTable.userId, req.userId))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    let parsed: any = {};
    try { parsed = JSON.parse(product.content ?? "{}"); } catch {}

    const chapters = parsed.chapters ?? [];
    const toc = (product.tableOfContents as string[] | null) ?? chapters.map((c: any) => c.title);

    const chaptersHtml = chapters.map((ch: any) => `
      <div class="chapter">
        <div class="chapter-header">
          <div class="chapter-num">${ch.number ?? ""}</div>
          <div class="chapter-title"><h2 style="margin:0;border:none;padding:0">Chapter ${ch.number ?? ""}: ${ch.title ?? ""}</h2></div>
        </div>
        ${ch.hook ? `<div class="hook">💡 &ldquo;${ch.hook}&rdquo;</div>` : ""}
        ${(ch.body ?? "").split("\n").filter(Boolean).map((p: string) => `<p>${p}</p>`).join("")}
      </div>
    `).join("");

    const quickStartHtml = parsed.quickStart?.steps?.length ? `<div class="chapter"><h2>⚡ Quick Start</h2><ol>${parsed.quickStart.steps.map((s: any) => `<li>${typeof s === "string" ? s : s.step ?? s}</li>`).join("")}</ol></div>` : "";
    const checklistHtml = parsed.checklist?.items?.length ? `<div class="chapter"><h2>✅ Action Checklist</h2><ul>${parsed.checklist.items.map((i: string) => `<li>${i}</li>`).join("")}</ul></div>` : "";
    const faqHtml = parsed.faq?.questions?.length ? `<div class="chapter"><h2>❓ FAQ</h2>${parsed.faq.questions.map((q: any) => `<div class="faq-item"><strong>Q: ${q.q ?? q.question ?? ""}</strong><p>${q.a ?? q.answer ?? ""}</p></div>`).join("")}</div>` : "";

    const ttsScript = chapters.map((ch: any) => `${ch.title}. ${String(ch.body ?? "").replace(/\n/g, " ").slice(0, 400)}`).join(" ... ");

    const score = product.sellabilityScore ?? 88;
    const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
    const coverImg = product.coverImageUrl
      ? `<img src="${product.coverImageUrl}" alt="cover" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;margin-bottom:24px;box-shadow:0 8px 40px rgba(124,58,237,.25);" />`
      : `<div style="width:100%;height:200px;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#2d1a5e 100%);border-radius:12px;margin-bottom:24px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
           <svg style="position:absolute;inset:0;opacity:.15" viewBox="0 0 400 200"><circle cx="50" cy="50" r="80" fill="white"/><circle cx="350" cy="150" r="100" fill="white"/><circle cx="200" cy="20" r="60" fill="white"/></svg>
           <div style="text-align:center;color:white;position:relative;z-index:1;padding:20px">
             <div style="font-size:3rem;margin-bottom:8px">📚</div>
             <div style="font-size:1.1rem;font-weight:800;letter-spacing:-0.02em">${product.title?.slice(0,50) ?? "Digital Guide"}</div>
           </div>
         </div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${product.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Georgia&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; background: #fafaf8; color: #1a1a2e; line-height: 1.75; max-width: 760px; margin: 0 auto; padding: 40px 28px; }
    .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1a1a2e; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 999; box-shadow: 0 2px 20px rgba(0,0,0,.4); }
    .toolbar h4 { color: #fff; font-size: .85rem; font-weight: 700; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .toolbar-actions { display: flex; gap: 10px; }
    .btn { background: #7c3aed; color: #fff; border: none; padding: 6px 14px; border-radius: 20px; font-size: .75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; }
    .btn:hover { background: #6d28d9; }
    .btn.secondary { background: transparent; border: 1px solid rgba(255,255,255,.25); }
    .btn.secondary:hover { background: rgba(255,255,255,.08); }
    body { padding-top: 60px; }
    h1 { font-size: 2.2rem; font-weight: 900; color: #1a1a2e; line-height: 1.1; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
    h2 { font-size: 1.3rem; font-weight: 800; color: #2d1a5e; margin: 40px 0 14px; border-left: 4px solid #7c3aed; padding-left: 14px; font-family: 'Inter', sans-serif; }
    p { margin-bottom: 14px; font-size: .97rem; color: #334155; }
    ul, ol { margin: 12px 0 18px 24px; } li { margin-bottom: 8px; font-size: .95rem; }
    .cover { text-align: center; padding: 20px 0 40px; border-bottom: 3px solid #7c3aed; margin-bottom: 40px; }
    .cover-meta { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 20px; }
    .cover-badge { display: inline-flex; align-items: center; gap: 6px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 20px; padding: 6px 14px; font-size: .75rem; font-weight: 700; color: #5b21b6; }
    .score-badge { background: ${scoreColor}18; border-color: ${scoreColor}50; color: ${scoreColor}; }
    .score-bar-wrap { margin: 24px 0 8px; }
    .score-bar-label { display: flex; justify-content: space-between; font-size: .7rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .05em; }
    .score-bar-track { height: 8px; background: #e2e8f0; border-radius: 8px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 8px; background: linear-gradient(90deg, ${scoreColor}, ${scoreColor}99); transition: width 1s ease; }
    .subtitle { font-size: 1.05rem; color: #64748b; font-style: italic; margin-top: 10px; }
    .author { margin-top: 14px; font-size: .85rem; color: #7c3aed; font-weight: 700; }
    .hook { font-style: italic; color: #7c3aed; background: linear-gradient(135deg,#f5f3ff,#ede9fe); border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 18px 0 22px; box-shadow: 0 2px 12px rgba(124,58,237,.1); }
    .chapter { margin-bottom: 52px; padding-bottom: 36px; border-bottom: 1px solid #e2e8f0; }
    .chapter-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
    .chapter-num { flex-shrink: 0; width: 48px; height: 48px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 900; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(124,58,237,.3); }
    .chapter-title { flex: 1; }
    .toc { background: linear-gradient(135deg, #f8f7ff, #f5f3ff); border: 1px solid #e0d9ff; border-radius: 16px; padding: 28px 32px; margin: 36px 0; box-shadow: 0 4px 20px rgba(124,58,237,.08); }
    .toc-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #e0d9ff; font-size: .9rem; }
    .toc-num { width: 24px; height: 24px; background: #7c3aed; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .65rem; font-weight: 700; flex-shrink: 0; }
    .callout { background: linear-gradient(135deg, #fefce8, #fef9c3); border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .callout-title { font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #92400e; margin-bottom: 6px; }
    .faq-item { margin-bottom: 20px; background: #f8f7ff; border-radius: 10px; padding: 16px 18px; } .faq-item strong { color: #2d1a5e; display: block; margin-bottom: 6px; font-size: .92rem; }
    #listen-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a2e; padding: 10px 24px; align-items: center; gap: 12px; z-index: 999; }
    #listen-bar.active { display: flex; }
    #listen-progress { flex: 1; height: 4px; background: rgba(255,255,255,.15); border-radius: 4px; overflow: hidden; }
    #listen-fill { height: 100%; background: #7c3aed; border-radius: 4px; transition: width .3s; width: 0%; }
    #listen-label { color: #94a3b8; font-size: .75rem; min-width: 80px; }
    @media print {
      .toolbar, #listen-bar { display: none !important; }
      body { padding-top: 20px; }
      .chapter { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h4>📖 ${product.title}</h4>
    <div class="toolbar-actions">
      <button class="btn secondary" onclick="toggleListen()">🔊 Listen</button>
      <button class="btn" onclick="window.print()">🖨️ Print / Save PDF</button>
    </div>
  </div>
  <div id="listen-bar">
    <button class="btn secondary" onclick="stopListen()" style="padding:4px 10px">⏹</button>
    <div id="listen-progress"><div id="listen-fill"></div></div>
    <span id="listen-label">Reading...</span>
  </div>
  <div class="cover">
    ${coverImg}
    <h1>${product.title}</h1>
    ${product.subtitle ? `<p class="subtitle">${product.subtitle}</p>` : ""}
    <p class="author">By ${product.authorName}</p>
    ${product.targetAudience ? `<p style="margin-top:8px;font-size:.78rem;color:#94a3b8">For: ${product.targetAudience}</p>` : ""}
    <div class="cover-meta">
      <span class="cover-badge score-badge">⭐ ${score}% Sellability Score</span>
      ${product.pageCount ? `<span class="cover-badge">📄 ${product.pageCount} Pages</span>` : ""}
      ${chapters.length ? `<span class="cover-badge">📚 ${chapters.length} Chapters</span>` : ""}
      <span class="cover-badge">✅ Digital Download</span>
    </div>
    <div class="score-bar-wrap" style="max-width:400px;margin:16px auto 0">
      <div class="score-bar-label"><span>Quality Score</span><span>${score}/100</span></div>
      <div class="score-bar-track"><div class="score-bar-fill" style="width:${score}%"></div></div>
    </div>
  </div>
  ${toc.length ? `<div class="toc"><h2 style="border:none;padding:0;margin-bottom:14px">📋 Table of Contents</h2><ol>${toc.map((t: string) => `<li>${t}</li>`).join("")}</ol></div>` : ""}
  ${product.aboutSection ? `<div class="chapter"><h2>About This Guide</h2><p>${product.aboutSection}</p></div>` : ""}
  ${quickStartHtml}
  ${chaptersHtml}
  ${checklistHtml}
  ${faqHtml}
  ${product.authorBio ? `<div class="chapter"><h2>About the Author</h2><p>${product.authorBio}</p></div>` : ""}
  <script>
    const TTS_TEXT = ${JSON.stringify(ttsScript)};
    let utter = null;
    function toggleListen() {
      if (speechSynthesis.speaking) { stopListen(); return; }
      utter = new SpeechSynthesisUtterance(TTS_TEXT);
      utter.rate = 0.95; utter.pitch = 1.0;
      utter.onboundary = function(e) {
        const pct = Math.min(100, Math.round((e.charIndex / TTS_TEXT.length) * 100));
        document.getElementById('listen-fill').style.width = pct + '%';
        document.getElementById('listen-label').textContent = 'Reading ' + pct + '%';
      };
      utter.onend = function() { document.getElementById('listen-bar').classList.remove('active'); };
      document.getElementById('listen-bar').classList.add('active');
      speechSynthesis.speak(utter);
    }
    function stopListen() { speechSynthesis.cancel(); document.getElementById('listen-bar').classList.remove('active'); }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: "View failed" });
  }
});

// ── Download endpoint: verify order, serve product content as HTML ────────────
router.get("/product/:id/download/:orderId", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const orderId = parseInt(req.params.orderId);

    // Verify the order belongs to this product and is completed
    const [order] = await db.select().from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.productId, productId))).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.status !== "completed") { res.status(403).json({ error: "Order not completed" }); return; }

    const [product] = await db.select().from(productsTable)
      .where(eq(productsTable.id, productId)).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    let parsed: any = {};
    try { parsed = JSON.parse(product.content ?? "{}"); } catch {}

    const chapters = parsed.chapters ?? [];
    const toc = (product.tableOfContents as string[] | null) ?? chapters.map((c: any) => c.title);

    const chaptersHtml = chapters.map((ch: any) => `
      <div class="chapter">
        <h2>Chapter ${ch.number ?? ""}: ${ch.title ?? ""}</h2>
        ${ch.hook ? `<p class="hook">"${ch.hook}"</p>` : ""}
        ${(ch.body ?? "").split("\n").filter(Boolean).map((p: string) => `<p>${p}</p>`).join("")}
      </div>
    `).join("");

    const quickStartHtml = parsed.quickStart?.steps?.length ? `
      <div class="chapter">
        <h2>⚡ Quick Start: ${parsed.quickStart.title ?? "Quick Start"}</h2>
        <ol>${parsed.quickStart.steps.map((s: any) => `<li>${typeof s === "string" ? s : s.step ?? s}</li>`).join("")}</ol>
      </div>
    ` : "";

    const checklistHtml = parsed.checklist?.items?.length ? `
      <div class="chapter">
        <h2>✅ ${parsed.checklist.title ?? "Action Checklist"}</h2>
        <ul>${parsed.checklist.items.map((i: string) => `<li>${i}</li>`).join("")}</ul>
      </div>
    ` : "";

    const faqHtml = parsed.faq?.questions?.length ? `
      <div class="chapter">
        <h2>❓ Frequently Asked Questions</h2>
        ${parsed.faq.questions.map((q: any) => `<div class="faq-item"><strong>Q: ${q.q ?? q.question ?? ""}</strong><p>${q.a ?? q.answer ?? ""}</p></div>`).join("")}
      </div>
    ` : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${product.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #1a1a2e; line-height: 1.75; max-width: 720px; margin: 0 auto; padding: 40px 28px; }
    h1 { font-size: 2.2rem; font-weight: 900; color: #1a1a2e; line-height: 1.15; margin-bottom: 10px; }
    h2 { font-size: 1.35rem; font-weight: 800; color: #2d1a5e; margin: 36px 0 14px; border-left: 4px solid #7c3aed; padding-left: 14px; }
    h3 { font-size: 1.05rem; font-weight: 700; color: #4c1d95; margin: 20px 0 8px; }
    p { margin-bottom: 14px; font-size: .97rem; color: #334155; }
    ul, ol { margin: 12px 0 18px 24px; }
    li { margin-bottom: 8px; font-size: .95rem; color: #334155; }
    .cover { text-align: center; padding: 60px 20px 40px; border-bottom: 3px solid #7c3aed; margin-bottom: 40px; }
    .subtitle { font-size: 1.1rem; color: #64748b; font-style: italic; margin-top: 10px; }
    .author { margin-top: 20px; font-size: .85rem; color: #7c3aed; font-weight: 700; }
    .hook { font-style: italic; color: #7c3aed; background: #f5f3ff; border-left: 3px solid #7c3aed; padding: 12px 18px; border-radius: 0 8px 8px 0; margin: 14px 0 18px; }
    .chapter { margin-bottom: 48px; padding-bottom: 32px; border-bottom: 1px solid #e2e8f0; }
    .toc { background: #f8f7ff; border: 1px solid #e0d9ff; border-radius: 12px; padding: 24px 28px; margin: 32px 0; }
    .toc h2 { border: none; padding: 0; font-size: 1.1rem; margin: 0 0 14px; }
    .toc ol { margin: 0 0 0 20px; }
    .toc li { color: #4c1d95; font-size: .9rem; margin-bottom: 6px; }
    .faq-item { margin-bottom: 16px; }
    .faq-item strong { color: #2d1a5e; display: block; margin-bottom: 4px; }
    .receipt { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 32px; font-size: .82rem; color: #166534; }
    @media print { body { padding: 20px; } h2 { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="receipt">
    🧾 <strong>Purchase Confirmed</strong> · Order #${order.id} · Buyer: ${order.buyerEmail} · Thank you!
  </div>
  <div class="cover">
    <h1>${product.title}</h1>
    ${product.subtitle ? `<p class="subtitle">${product.subtitle}</p>` : ""}
    <p class="author">By ${product.authorName}</p>
    ${product.targetAudience ? `<p style="margin-top:8px;font-size:.8rem;color:#94a3b8;">For: ${product.targetAudience}</p>` : ""}
  </div>
  ${toc.length ? `<div class="toc"><h2>📋 Table of Contents</h2><ol>${toc.map((t: string) => `<li>${t}</li>`).join("")}</ol></div>` : ""}
  ${product.aboutSection ? `<div class="chapter"><h2>About This Guide</h2><p>${product.aboutSection}</p></div>` : ""}
  ${quickStartHtml}
  ${chaptersHtml}
  ${checklistHtml}
  ${faqHtml}
  ${product.authorBio ? `<div class="chapter"><h2>About the Author</h2><p>${product.authorBio}</p></div>` : ""}
</body>
</html>`;

    const filename = (product.title ?? "product").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 60) + ".html";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    req.log?.error?.({ err }, "Download error");
    res.status(500).json({ error: "Download failed" });
  }
});

// POST /orders/lookup — guest looks up all their completed orders by email
router.post("/orders/lookup", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !email.includes("@")) { res.status(400).json({ error: "Valid email required" }); return; }

    const rows = await db
      .select({
        orderId:      ordersTable.id,
        productId:    ordersTable.productId,
        amount:       ordersTable.amount,
        currency:     ordersTable.currency,
        purchasedAt:  ordersTable.createdAt,
        productTitle: productsTable.title,
        coverImageUrl: productsTable.coverImageUrl,
        productType:  productsTable.productType,
        paymentProvider: ordersTable.paymentProvider,
      })
      .from(ordersTable)
      .innerJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .where(and(
        eq(ordersTable.buyerEmail, email.toLowerCase().trim()),
        eq(ordersTable.status, "completed"),
      ))
      .orderBy(desc(ordersTable.createdAt));

    res.json({ orders: rows });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Lookup failed" });
  }
});

// Public order status check — used by access page to show pending/approved state
router.get("/product/:id/order-status/:orderId", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const orderId = parseInt(req.params.orderId);
    const [order] = await db.select({
      status: ordersTable.status,
      paymentProvider: ordersTable.paymentProvider,
    }).from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.productId, productId)))
      .limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json({ status: order.status, paymentProvider: order.paymentProvider });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Status check failed" });
  }
});

// Resend purchase receipt + download link to buyer's email (no auth — verified by email match)
router.post("/product/:id/resend-download", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: "Email is required" }); return; }

    const [product] = await db.select().from(productsTable)
      .where(eq(productsTable.id, productId)).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    // Find the most recent completed order for this product + email
    const [order] = await db.select().from(ordersTable)
      .where(and(
        eq(ordersTable.productId, productId),
        eq(ordersTable.buyerEmail, email.toLowerCase().trim()),
        eq(ordersTable.status, "completed"),
      ))
      .orderBy(desc(ordersTable.createdAt))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "No completed order found for this email address." });
      return;
    }

    const [seller] = await db.select({ name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, product.userId)).limit(1);

    const baseUrl = process.env.APP_URL ?? "https://selovox.com";
    const downloadUrl = `${baseUrl}/api/product/${product.id}/download/${order.id}`;

    await sendEmail({
      to: email,
      toName: order.buyerName ?? undefined,
      subject: `📦 Your download link — ${product.title}`,
      htmlBody: buildPurchaseReceiptHtml({
        productTitle: product.title,
        buyerName: order.buyerName || "there",
        amount: Number(order.amount),
        downloadUrl,
        sellerName: seller?.name ?? "Selovox",
      }),
      fromName: seller?.name ?? "Selovox",
    });

    res.json({ ok: true, message: "Download link resent to your email." });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to resend email" });
  }
});

router.post("/product/:id/purchase", async (req: any, res) => {
  try {
    const { buyerEmail, buyerName, country, addSubscription, subscriptionEmail, subscriptionPassword } = req.body;
    if (!buyerEmail) { res.status(400).json({ error: "Buyer email required" }); return; }

    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.isPublished, true))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const [order] = await db.insert(ordersTable).values({
      productId: product.id,
      sellerId: product.userId,
      buyerEmail,
      buyerName,
      amount: product.price,
      currency: "USD",
      status: "completed",
      paymentProvider: "direct",
      country,
    }).returning();

    const sellerEarning = Number(product.price) * 0.9;
    await db.update(productsTable).set({
      totalSales: (product.totalSales ?? 0) + 1,
      totalRevenue: String(Number(product.totalRevenue ?? 0) + Number(product.price)),
    }).where(eq(productsTable.id, product.id));

    await db.insert(walletTransactionsTable).values({
      userId: product.userId,
      type: "credit",
      amount: String(sellerEarning),
      status: "completed",
      description: `Sale of "${product.title}"`,
      reference: `order_${order.id}`,
      productId: product.id,
    });

    const [seller] = await db.select({ walletBalance: usersTable.walletBalance }).from(usersTable).where(eq(usersTable.id, product.userId)).limit(1);
    await db.update(usersTable).set({ walletBalance: String(Number(seller?.walletBalance ?? 0) + sellerEarning) }).where(eq(usersTable.id, product.userId));

    let newAccountCreated = false;
    if (addSubscription && subscriptionEmail && subscriptionPassword) {
      try {
        const bcrypt = require("bcryptjs");
        const { nanoid } = require("nanoid");
        const existing = await db.select().from(usersTable).where(eq(usersTable.email, subscriptionEmail.toLowerCase())).limit(1);
        if (existing.length === 0) {
          const hashed = await bcrypt.hash(subscriptionPassword, 10);
          const base = (buyerName || "user").replace(/\s+/g, "").toLowerCase().slice(0, 6);
          const affiliateCode = (base + nanoid(4)).toUpperCase();
          await db.insert(usersTable).values({
            email: subscriptionEmail.toLowerCase(),
            password: hashed,
            name: buyerName || "New Creator",
            role: "user",
            isActive: true,
            affiliateCode,
          });
          newAccountCreated = true;
        }
      } catch {}
    }

    res.json({ orderId: order.id, message: "Purchase successful", downloadUrl: `/api/product/${product.id}/download/${order.id}`, newAccountCreated });
  } catch (err) {
    req.log?.error?.({ err }, "Purchase error");
    res.status(500).json({ error: "Purchase failed" });
  }
});

// ── My Purchases: return all completed orders for the logged-in buyer ──────────
router.get("/orders/my-purchases", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select({ email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const purchases = await db
      .select({
        orderId:      ordersTable.id,
        productId:    ordersTable.productId,
        amount:       ordersTable.amount,
        currency:     ordersTable.currency,
        purchasedAt:  ordersTable.createdAt,
        title:        productsTable.title,
        subtitle:     productsTable.subtitle,
        description:  productsTable.description,
        coverImageUrl:productsTable.coverImageUrl,
        authorName:   productsTable.authorName,
      })
      .from(ordersTable)
      .innerJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .where(and(
        eq(ordersTable.buyerEmail, user.email),
        eq(ordersTable.status, "completed"),
      ))
      .orderBy(desc(ordersTable.createdAt));

    const result = purchases.map(p => ({
      ...p,
      downloadUrl: `/api/product/${p.productId}/download/${p.orderId}`,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

export default router;

