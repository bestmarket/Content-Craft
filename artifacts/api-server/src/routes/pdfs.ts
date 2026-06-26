import { Router } from "express";
import { db } from "@workspace/db";
import { pdfHistoryTable, promptsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { requireFeature } from "./features";
import { requireCredits } from "./credits";
import { callGroqRotated, callAnthropicFallback, callOpenAIFallback, callGeminiFallback, AICallResult } from "./ai-utils";
import { logger } from "../lib/logger";

const router = Router();

interface GenerationMeta {
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  responseLength: number;
  generationStatus: "success" | "failed";
  fallbackUsed: boolean;
  providersAttempted: string[];
  error?: string;
}

async function callPdfAI(
  prompt: string,
  systemPrompt: string,
): Promise<{ result: AICallResult; meta: GenerationMeta }> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const providersAttempted: string[] = [];
  let fallbackUsed = false;

  providersAttempted.push("gemini");
  logger.info({ provider: "gemini" }, "[PDF AI] Attempting Gemini (main structure)");
  const geminiResult = await callGeminiFallback(messages, systemPrompt, 12000, "pdf");
  if (geminiResult) {
    logger.info({ provider: geminiResult.provider, model: geminiResult.model, outputTokens: geminiResult.outputTokens, responseLength: geminiResult.text.length }, "[PDF AI] Structure generated via Gemini");
    return {
      result: geminiResult,
      meta: { provider: geminiResult.provider, model: geminiResult.model, inputTokens: geminiResult.inputTokens, outputTokens: geminiResult.outputTokens, responseLength: geminiResult.text.length, generationStatus: "success", fallbackUsed: false, providersAttempted },
    };
  }
  logger.warn({ provider: "gemini" }, "[PDF AI] Gemini failed — trying Groq");

  providersAttempted.push("groq");
  fallbackUsed = true;
  const groqResult = await callGroqRotated(messages, 6000, 0.75);
  if (groqResult) {
    logger.info({ provider: groqResult.provider, model: groqResult.model }, "[PDF AI] Structure generated via Groq");
    return {
      result: groqResult,
      meta: { provider: groqResult.provider, model: groqResult.model, inputTokens: groqResult.inputTokens, outputTokens: groqResult.outputTokens, responseLength: groqResult.text.length, generationStatus: "success", fallbackUsed: true, providersAttempted },
    };
  }
  logger.warn({ provider: "groq" }, "[PDF AI] Groq failed — trying Anthropic");

  providersAttempted.push("anthropic");
  const anthropicResult = await callAnthropicFallback(messages, systemPrompt, 6000);
  if (anthropicResult) {
    logger.info({ provider: anthropicResult.provider, model: anthropicResult.model }, "[PDF AI] Structure generated via Anthropic");
    return {
      result: anthropicResult,
      meta: { provider: anthropicResult.provider, model: anthropicResult.model, inputTokens: anthropicResult.inputTokens, outputTokens: anthropicResult.outputTokens, responseLength: anthropicResult.text.length, generationStatus: "success", fallbackUsed: true, providersAttempted },
    };
  }
  logger.warn({ provider: "anthropic" }, "[PDF AI] Anthropic failed — trying OpenAI");

  providersAttempted.push("openai");
  const openaiResult = await callOpenAIFallback(messages, 6000);
  if (openaiResult) {
    return {
      result: openaiResult,
      meta: { provider: openaiResult.provider, model: openaiResult.model, inputTokens: openaiResult.inputTokens, outputTokens: openaiResult.outputTokens, responseLength: openaiResult.text.length, generationStatus: "success", fallbackUsed: true, providersAttempted },
    };
  }

  const errorMsg = "All AI providers failed. No API keys configured or all keys are invalid/rate-limited. Add your Gemini key in Admin > API Keys.";
  logger.error({ generationStatus: "failed", fallbackUsed, providersAttempted }, `[PDF AI] ${errorMsg}`);
  throw new Error(errorMsg);
}

// ── Detect corrupted chapter bodies (JSON leaking into text fields) ──────────
function isBodyCorrupted(body: string): boolean {
  if (!body?.trim()) return true;
  const t = body.trim();
  if (t.startsWith("{") || t.startsWith("[")) return true;
  if (t.includes('"chapters":') || t.includes('"tableOfContents":')) return true;
  if (t.includes('"sellabilityScore"') || t.includes('"suggestedPrice"') || t.includes('"targetAudience"')) return true;
  if (t.includes('"monetizationNotes"') || t.includes('"authorBio":')) return true;
  // If more than 8% of characters are double-quotes it's likely JSON
  const quoteCount = (t.match(/"/g) || []).length;
  if (quoteCount > t.length * 0.08 && t.length > 200) return true;
  return false;
}

// ── Dedicated chapter expansion system prompt ─────────────────────────────────
const CHAPTER_WRITER_SYSTEM = `You are a master premium ebook writer creating content that sells on Gumroad, Amazon KDP, and Etsy. You have written 600+ bestselling guides.

YOUR WRITING RULES — NON-NEGOTIABLE:
- PLAIN TEXT ONLY. Zero markdown. No **, no *, no #, no >, no -, no backticks, no underscores for emphasis.
- Write in flowing paragraphs separated by a blank line (two newlines between paragraphs).
- Never use bullet lists or numbered lists in the body — write everything as rich prose.
- Speak directly to the reader as "you". Be warm, direct, and expert.
- Include REAL-sounding client stories with specific first names, exact numbers, timelines (e.g. "within 11 days", "after 3 weeks"), and outcomes.
- Write with brutal specificity: "$4,217 in 11 days" beats "significant income". "85% improvement" beats "major improvement".
- Return ONLY the chapter body text. No title. No chapter label. No JSON. Just flowing paragraphs.`;

// ── Expand a single chapter body with a dedicated AI call ────────────────────
async function expandChapterBody(
  topic: string,
  chapter: { number: number; title: string; hook: string; body: string },
  totalChapters: number
): Promise<string> {
  const existingWordCount = chapter.body?.split(/\s+/).filter(Boolean).length ?? 0;
  const corrupted = isBodyCorrupted(chapter.body);

  const prompt = `You are writing Chapter ${chapter.number} of ${totalChapters} in a premium PDF guide.

GUIDE TOPIC: "${topic}"
CHAPTER TITLE: "${chapter.title}"
OPENING HOOK (the reader's pain point): "${chapter.hook}"
${(!corrupted && existingWordCount > 80) ? `\nEXISTING DRAFT (expand, deepen, and enrich this — do not just repeat it):\n${chapter.body.slice(0, 800)}` : ""}

WRITE a complete, rich chapter body of 650 to 850 words. Requirements:
1. Open by validating the reader's exact pain point from the hook — make them feel deeply understood.
2. Explain WHY this problem is so common — the root cause most people miss.
3. Include 2 specific client transformation stories (invent realistic ones): name, age, profession, problem, what they tried before, what worked, exact outcome with numbers and timeline.
4. Include 1 research insight or statistic with context and implication (invent a plausible one if needed).
5. Build progressively toward the solution in this chapter — each paragraph should move the reader forward.
6. End with a clear, empowering insight that makes the reader feel capable and ready to act.
7. Write 5 to 7 paragraphs, each 80 to 150 words.
8. PLAIN TEXT PARAGRAPHS ONLY — no markdown, no JSON, no bullets, no numbered lists, no special characters.

Return ONLY the body text. Start directly with the first paragraph.`;

  const messages = [
    { role: "system", content: CHAPTER_WRITER_SYSTEM },
    { role: "user", content: prompt },
  ];

  // Try Gemini first
  const geminiResult = await callGeminiFallback(messages, CHAPTER_WRITER_SYSTEM, 3500, "pdf");
  if (geminiResult?.text?.trim()) {
    const cleaned = stripMarkdown(geminiResult.text.trim());
    if (!isBodyCorrupted(cleaned) && cleaned.length > 300) {
      logger.info({ chapterTitle: chapter.title, provider: "gemini", wordCount: cleaned.split(/\s+/).length }, "[PDF] Chapter expanded");
      return cleaned;
    }
  }

  // Fallback to Groq
  const groqResult = await callGroqRotated(messages, 2500, 0.72);
  if (groqResult?.text?.trim()) {
    const cleaned = stripMarkdown(groqResult.text.trim());
    if (!isBodyCorrupted(cleaned) && cleaned.length > 300) {
      logger.info({ chapterTitle: chapter.title, provider: "groq", wordCount: cleaned.split(/\s+/).length }, "[PDF] Chapter expanded via Groq fallback");
      return cleaned;
    }
  }

  // Fallback to Anthropic
  const anthropicResult = await callAnthropicFallback(messages, CHAPTER_WRITER_SYSTEM, 2500);
  if (anthropicResult?.text?.trim()) {
    const cleaned = stripMarkdown(anthropicResult.text.trim());
    if (!isBodyCorrupted(cleaned) && cleaned.length > 300) {
      logger.info({ chapterTitle: chapter.title, provider: "anthropic" }, "[PDF] Chapter expanded via Anthropic fallback");
      return cleaned;
    }
  }

  // If all expansion fails, return original (if not corrupted) or a placeholder
  if (!corrupted && existingWordCount > 100) {
    logger.warn({ chapterTitle: chapter.title }, "[PDF] Chapter expansion failed — keeping original body");
    return chapter.body;
  }

  logger.error({ chapterTitle: chapter.title }, "[PDF] Chapter expansion failed and original body was corrupted");
  return `This chapter covers ${chapter.title}. ${chapter.hook} In the pages that follow, you will discover exactly what it takes to transform this area of your life, step by step.`;
}

const PREMIUM_SYSTEM_PROMPT = `You are a world-class digital product creator with 15 years of experience generating over $8M in revenue from PDF guides, ebooks, and training manuals sold on Gumroad, Etsy, Amazon KDP, and direct storefronts. You have written 600 premium digital products.

CORE PHILOSOPHY:
Every product you create is a transformation, not information. Every sentence moves the reader closer to their desired result. You never write filler. You write transformations.

WRITING STANDARDS:
- Write like a confident human expert, not an AI assistant
- 7th-grade reading level, short sentences, conversational but authoritative tone
- Use contractions naturally: you're, it's, don't, they'll
- Be brutally specific: "$4,217 in 11 days" beats "significant income"
- Use real examples with specific outcomes, timelines, and numbers
- Open every chapter with the reader's exact pain point
- Use "Here's what nobody tells you:" at least once per guide

ABSOLUTE OUTPUT RULES — NON-NEGOTIABLE:
- ZERO markdown syntax in any text field. No #, no **, no *, no >, no ~, no backticks, no dashes as bullets, no underscores for emphasis
- All text must be clean plain prose ready for direct typesetting in a professional PDF
- Write COMPLETE FULL content — no summaries, no outlines, no "[insert here]" placeholders
- The JSON must be valid and directly parseable with JSON.parse()
- Return ONLY the JSON object — no text before it, no text after it, no code fences, no markdown
- The tableOfContents MUST use the exact chapter titles from the chapters array — no generic placeholders`;

function buildPrompt(topic: string, authorName: string, description: string, pageCount?: number): string {
  const chapterCount = pageCount ? Math.max(4, Math.floor(pageCount / 5)) : 5;
  const pageLengthHint = pageCount
    ? `Target approximately ${pageCount} pages total. Include exactly ${chapterCount} chapters.`
    : "Include exactly 5 chapters.";

  return `Create a PREMIUM, SELLABLE digital PDF guide about: "${topic}"
Author: ${authorName}
${description ? `Special requirements: ${description}` : ""}
${pageLengthHint}

CRITICAL RULES:
- Every text field must contain PLAIN TEXT ONLY. Zero markdown symbols. Write as if composing a professionally typeset book.
- The tableOfContents entries MUST match the actual chapter titles — no generic titles like "Foundation and Mindset" or "Core Strategy". Use specific, topic-relevant titles.
- Chapter body fields should be 3 to 4 paragraphs of actual written content (the chapters will be expanded to full length separately).

Return ONLY this exact JSON structure with NO text outside the JSON:

{
  "title": "Transformation-specific title with numbers or timeframe — specific to ${topic}",
  "subtitle": "One compelling sentence that makes the promise crystal clear",
  "tableOfContents": ["Introduction: Why Everything Changes Today", "Chapter 1: [SPECIFIC title about ${topic} — not generic]", "Chapter 2: [SPECIFIC title about ${topic}]", "Chapter 3: [SPECIFIC title about ${topic}]", "Chapter 4: [SPECIFIC title about ${topic}]", "Chapter 5: [SPECIFIC title about ${topic}]", "Conclusion: Your 30-Day Action Plan", "Bonus: The Secret Nobody Shares"],
  "aboutSection": "2 to 3 sentences describing exactly what readers will gain, who this is for, and the transformation they will experience.",
  "authorBio": "Credible 2 to 3 sentence bio in third person that establishes real expertise in this topic area.",
  "chapters": [
    {
      "number": 1,
      "title": "SPECIFIC chapter title relevant to ${topic} — no generic words like Foundation, Core, Strategy",
      "hook": "One powerful sentence naming the reader's exact frustration or fear. Makes them feel seen.",
      "body": "3 paragraphs of rich flowing prose about this specific chapter topic. Each paragraph 80 to 120 words. Use double newlines between paragraphs. PLAIN TEXT ONLY.",
      "steps": ["Step 1: Specific action with a clear outcome the reader can complete today", "Step 2: Next concrete action", "Step 3: Next concrete action", "Step 4: Final action in this sequence"],
      "callout": "One key insight or insider knowledge in 1 to 2 plain text sentences. The thing most people get wrong.",
      "example": "A specific client story with a real-sounding name, age, profession, exact numbers, and timeline. 3 to 4 sentences. Plain text only.",
      "keyTakeaways": ["First major lesson from this chapter", "Second major lesson", "Third major lesson"],
      "actionStep": "One specific action they can complete in the next 5 minutes. Start with an action verb."
    }
  ],
  "conclusion": {
    "title": "Your 30-Day Action Plan",
    "body": "2 to 3 substantial paragraphs. Motivating, specific, action-oriented. References key lessons. Plain text only.",
    "steps": ["Week 1: Specific focus area and primary actions to take for ${topic}", "Week 2: Next phase of actions", "Week 3: Building momentum actions", "Week 4: Consolidation and scaling actions"]
  },
  "bonus": {
    "title": "The One Secret Nobody Shares",
    "body": "2 substantial paragraphs of bonus insight that feels like an unexpected gift. The single most valuable piece of advice. Something they would pay extra for. Plain text only."
  },
  "cta": "2 compelling sentences that create urgency and excitement. A direct call to take action right now. Plain text only.",
  "graphics": [
    {
      "title": "Key Statistics for ${topic}",
      "description": "Core metrics and numbers that prove the opportunity",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 600 340\\"><rect width=\\"600\\" height=\\"340\\" fill=\\"#f8fafc\\"/><text x=\\"300\\" y=\\"170\\" text-anchor=\\"middle\\" font-family=\\"sans-serif\\" font-size=\\"18\\" fill=\\"#7c3aed\\">Key Statistics</text></svg>"
    },
    {
      "title": "Success Roadmap",
      "description": "The proven path from where they are to where they want to be",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 600 340\\"><rect width=\\"600\\" height=\\"340\\" fill=\\"#f8fafc\\"/><text x=\\"300\\" y=\\"170\\" text-anchor=\\"middle\\" font-family=\\"sans-serif\\" font-size=\\"18\\" fill=\\"#7c3aed\\">Success Roadmap</text></svg>"
    },
    {
      "title": "Results Comparison",
      "description": "Before vs After showing the transformation",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 600 340\\"><rect width=\\"600\\" height=\\"340\\" fill=\\"#f8fafc\\"/><text x=\\"300\\" y=\\"170\\" text-anchor=\\"middle\\" font-family=\\"sans-serif\\" font-size=\\"18\\" fill=\\"#7c3aed\\">Results</text></svg>"
    }
  ]
}`;
}

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

function sanitizeParsed(parsed: any): any {
  if (!parsed) return parsed;
  parsed.title = stripMarkdown(parsed.title);
  parsed.subtitle = stripMarkdown(parsed.subtitle);
  parsed.aboutSection = stripMarkdown(parsed.aboutSection);
  parsed.authorBio = stripMarkdown(parsed.authorBio);
  parsed.cta = stripMarkdown(parsed.cta);
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
  }
  return parsed;
}

router.post("/pdfs/generate", requireAuth, requireFeature("ai_pdf"), requireCredits("ai_pdf"), async (req: any, res) => {
  const { topic, authorName, description, promptId, pageCount } = req.body;

  let systemPrompt = PREMIUM_SYSTEM_PROMPT;
  if (promptId) {
    try {
      const [p] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId)).limit(1);
      if (p?.isActive) {
        systemPrompt = p.systemPrompt + "\n\nCRITICAL: Output PLAIN TEXT ONLY in all text fields — absolutely zero markdown symbols. Return only valid JSON, nothing else.";
        req.log.info({ promptId, promptName: p.name }, "[PDF] Using custom prompt from library");
      }
    } catch (err) {
      req.log.warn({ err, promptId }, "[PDF] Failed to load prompt — using default");
    }
  }

  const userPrompt = buildPrompt(topic, authorName, description || "", pageCount);

  // ── Phase 1: Generate book structure ──────────────────────────────────────
  let aiResult: { result: any; meta: GenerationMeta };
  try {
    aiResult = await callPdfAI(userPrompt, systemPrompt);
  } catch (err: any) {
    req.log.error({ err: err.message, topic, userId: req.userId }, "[PDF] AI generation failed — no providers available");
    res.status(503).json({
      error: err.message,
      generationMeta: { generationStatus: "failed", fallbackUsed: true, providersAttempted: ["gemini", "groq", "anthropic", "openai"], error: err.message },
    });
    return;
  }

  const { result: aiRaw, meta } = aiResult;

  // ── JSON parsing ──────────────────────────────────────────────────────────
  let parsed: any;
  let parseError: string | undefined;

  try {
    const jsonMatch = aiRaw.text.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || aiRaw.text.match(/\{[\s\S]*\}/s);
    const jsonStr = jsonMatch?.[1] ?? jsonMatch?.[0] ?? aiRaw.text;
    parsed = JSON.parse(jsonStr);
    req.log.info({ provider: meta.provider, model: meta.model, chapterCount: parsed.chapters?.length }, "[PDF] JSON parsed successfully");
  } catch (firstErr) {
    try {
      parsed = JSON.parse(aiRaw.text);
    } catch (secondErr: any) {
      parseError = secondErr.message;
      req.log.error({ provider: meta.provider, model: meta.model, responseLength: meta.responseLength, parseError, rawPreview: aiRaw.text.slice(0, 500) }, "[PDF] JSON parse failed");
      res.status(422).json({
        error: "AI returned a response that could not be parsed as JSON. The generation was real but the output format was invalid.",
        generationMeta: { ...meta, generationStatus: "failed", error: `JSON parse error: ${parseError}` },
        rawPreview: aiRaw.text.slice(0, 1000),
      });
      return;
    }
  }

  parsed = sanitizeParsed(parsed);

  // ── Phase 2: Expand each chapter body in parallel ─────────────────────────
  if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
    req.log.info({ chapterCount: parsed.chapters.length, topic }, "[PDF] Starting parallel chapter expansion");
    try {
      const expandedChapters = await Promise.all(
        parsed.chapters.map((ch: any) =>
          expandChapterBody(topic, {
            number: ch.number,
            title: ch.title ?? `Chapter ${ch.number}`,
            hook: ch.hook ?? "",
            body: ch.body ?? "",
          }, parsed.chapters.length).then(expandedBody => ({ ...ch, body: expandedBody }))
        )
      );
      parsed.chapters = expandedChapters;
      req.log.info({
        chapterCount: expandedChapters.length,
        totalWords: expandedChapters.reduce((sum: number, ch: any) => sum + (ch.body?.split(/\s+/).filter(Boolean).length ?? 0), 0),
      }, "[PDF] All chapters expanded successfully");
    } catch (expansionErr) {
      req.log.warn({ err: expansionErr }, "[PDF] Chapter expansion encountered errors — using available content");
    }
  }

  // ── Fix TOC to match actual chapter titles ─────────────────────────────────
  if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
    const chapterTitles = parsed.chapters.map((ch: any, i: number) => `Chapter ${i + 1}: ${ch.title}`);
    parsed.tableOfContents = [
      "Introduction: Why Everything Changes Today",
      ...chapterTitles,
      "Conclusion: Your 30-Day Action Plan",
      "Bonus: The Secret Nobody Shares",
    ];
  }

  const legacyContent = Array.isArray(parsed.chapters)
    ? parsed.chapters.map((ch: any) => `${ch.title}\n\n${ch.body}`).join("\n\n\n")
    : parsed.content ?? "";

  try {
    const [saved] = await db.insert(pdfHistoryTable).values({
      userId: req.userId,
      topic,
      authorName,
      title: parsed.title,
      content: JSON.stringify({ ...parsed, _v: 2, _generationMeta: meta }),
      tableOfContents: parsed.tableOfContents,
      aboutSection: parsed.aboutSection,
      authorBio: parsed.authorBio,
    }).returning();

    const totalWords = Array.isArray(parsed.chapters)
      ? parsed.chapters.reduce((sum: number, ch: any) => sum + (ch.body?.split(/\s+/).filter(Boolean).length ?? 0), 0)
      : 0;

    req.log.info({
      pdfId: saved.id,
      provider: meta.provider,
      model: meta.model,
      chapterCount: parsed.chapters?.length,
      totalWords,
      fallbackUsed: meta.fallbackUsed,
    }, "[PDF] Generation + expansion complete");

    res.json({
      id: saved.id,
      ...parsed,
      authorName,
      content: legacyContent,
      generationMeta: meta,
    });
  } catch (err) {
    req.log.error({ err }, "[PDF] DB save error after successful generation");
    res.status(500).json({ error: "PDF generated but failed to save. Please try again." });
  }
});

router.get("/pdfs/history", requireAuth, async (req: any, res) => {
  try {
    const items = await db.select({
      id: pdfHistoryTable.id,
      topic: pdfHistoryTable.topic,
      authorName: pdfHistoryTable.authorName,
      title: pdfHistoryTable.title,
      createdAt: pdfHistoryTable.createdAt,
    }).from(pdfHistoryTable)
      .where(eq(pdfHistoryTable.userId, req.userId))
      .orderBy(desc(pdfHistoryTable.createdAt));
    res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "ListPdfHistory error");
    res.status(500).json({ error: "Server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI PRODUCT STUDIO — V3
// ═══════════════════════════════════════════════════════════════════════════════

interface StudioParams {
  title: string;
  description: string;
  targetAudience: string;
  problemSolved: string;
  category: string;
  writingStyle: string;
  directionAngle: string;
  tone: string;
  pageCount: number;
  visualTheme: string;
  imageSource: string;
  selectedAssets: string[];
  authorName: string;
}

function buildStudioSystemPrompt(writingStyle: string, tone: string, directionAngle: string, category: string): string {
  const styleGuide: Record<string, string> = {
    Educational: "Teach systematically. Use clear explanations, real examples, data points, and analogies. Build from fundamentals up.",
    Professional: "Write with authority and precision. Use industry terminology, cite logical reasoning, maintain formal expertise throughout.",
    Storytelling: "Weave narratives throughout. Open with compelling stories, include case studies with named characters, make data human.",
    Actionable: "Every paragraph must contain something the reader can DO. Use imperatives. Include checklists, steps, and immediate actions.",
    "Premium Coaching": "Speak like a $10,000 coach. Challenge limiting beliefs, offer insider secrets, create emotional breakthroughs.",
  };
  const toneGuide: Record<string, string> = {
    Friendly: "Warm, conversational, encouraging. Use contractions, humor, and relatable phrases. Like a smart best friend.",
    Authority: "Confident, direct, expert. No hedging. State facts with certainty. Command respect through knowledge.",
    Luxury: "Elevated, refined, exclusive. Use aspirational language, suggest premium experiences, speak to high achievers.",
    Motivational: "Energizing, uplifting, empowering. Use exclamation points strategically, celebrate wins, inspire action.",
    Corporate: "Professional, structured, data-driven. Use precise language, reference ROI, appeal to business outcomes.",
  };
  const directionGuide: Record<string, string> = {
    "Ultimate Guide": "Comprehensive A-to-Z coverage. Include everything a beginner needs AND advanced strategies for experts.",
    "Step-by-Step Blueprint": "Numbered, sequential process. Each step builds on the last. Crystal clear sequence readers can follow exactly.",
    Workbook: "Interactive with exercises, fill-in sections, reflection prompts, and action plans throughout every chapter.",
    "Expert Handbook": "Reference-style. Dense with frameworks, models, and professional insights. Something experts keep on their desk.",
    Masterclass: "Premium educational journey. Reveal insider secrets, include advanced techniques, create an exclusive learning experience.",
    "Transformation Journey": "Story arc structure. Reader goes from problem → awareness → strategy → transformation → new identity.",
    "Checklist Style": "Everything in actionable checklist format. Quick-scan, high-value, immediately implementable.",
    "Challenge Format": "30/7/21-day challenge structure. Daily actions, milestones, accountability checkpoints, progress tracking.",
  };
  return `You are a world-class digital product creator who has generated over $12M selling premium guides, ebooks, and courses on Gumroad, Etsy, Amazon KDP, and direct storefronts. You have written 800+ bestselling digital products in the ${category} space.

WRITING STYLE: ${styleGuide[writingStyle] ?? writingStyle}
TONE: ${toneGuide[tone] ?? tone}
DIRECTION: ${directionGuide[directionAngle] ?? directionAngle}
CATEGORY EXPERTISE: You are a recognized authority in ${category}. You reference real statistics, cite established frameworks, and share insider knowledge that practitioners actually use.

ABSOLUTE QUALITY RULES:
- Write like a confident human expert, never like an AI assistant
- Use contractions naturally: you're, it's, don't, they'll, we've
- Be brutally specific: "$4,217 in 11 days" beats "significant income"
- Every paragraph must move the reader closer to their goal
- Never write filler, summaries of what you're about to say, or meta-commentary
- Use real-sounding client stories with specific names, ages, professions, numbers
- Open chapters with the reader's exact pain point — make them feel seen
- All text fields must be PLAIN TEXT ONLY — zero markdown, no **, no #, no bullets with dashes
- Return ONLY valid JSON — no text before or after, no code fences`;
}

function buildStudioEbookPrompt(p: StudioParams): string {
  const chapterCount = Math.max(5, Math.min(20, Math.floor(p.pageCount / 8)));
  return `Create a PREMIUM, SELLABLE ${p.directionAngle} in the ${p.category} space.

PRODUCT TITLE: "${p.title}"
DESCRIPTION: "${p.description}"
TARGET AUDIENCE: "${p.targetAudience}"
PROBLEM THIS SOLVES: "${p.problemSolved}"
AUTHOR: ${p.authorName}
TARGET PAGE COUNT: ${p.pageCount} pages
NUMBER OF CHAPTERS: ${chapterCount}
WRITING STYLE: ${p.writingStyle}
TONE: ${p.tone}

Return ONLY this exact JSON (no markdown, no code fences, just raw JSON):

{
  "title": "Compelling, specific title with transformation promise",
  "subtitle": "One powerful subtitle sentence that makes the reader desperate to read this",
  "aboutSection": "3 sentences: who this is for, what transformation they get, why right now.",
  "authorBio": "Credible 2-sentence author bio establishing real expertise in ${p.category}.",
  "tableOfContents": ["Introduction: ${p.problemSolved} Ends Today", ${Array.from({length: chapterCount}, (_, i) => `"Chapter ${i+1}: [Specific title for ${p.category}]"`).join(', ')}, "Conclusion: Your Next 30 Days", "Bonus: The Insider Secret"],
  "chapters": [
    {
      "number": 1,
      "title": "Specific, compelling chapter title for ${p.category}",
      "hook": "One devastating sentence naming the reader's exact frustration. Makes them feel completely understood.",
      "body": "4 rich paragraphs. Each 80-120 words. Pure prose. No bullets. No markdown. Build progressively toward the solution.",
      "steps": ["Step 1: Specific action with clear outcome", "Step 2: Next action", "Step 3: Next action", "Step 4: Final action"],
      "callout": "The one insider insight most people in ${p.category} get completely wrong. 2 sentences of plain text.",
      "example": "Client story with real-sounding name, age, specific problem, exactly what they tried, the turning point, specific outcome with numbers. 3-4 sentences.",
      "keyTakeaways": ["First major lesson", "Second major lesson", "Third major lesson"],
      "actionStep": "One specific action completing in under 5 minutes. Start with an action verb."
    }
  ],
  "conclusion": {
    "title": "Your 30-Day Action Plan",
    "body": "3 powerful paragraphs. Motivating, specific, references key lessons. Creates excitement about implementation.",
    "steps": ["Week 1: [Specific ${p.category} focus]", "Week 2: [Next phase]", "Week 3: [Building momentum]", "Week 4: [Scaling and sustaining]"]
  },
  "bonus": {
    "title": "The Insider Secret Nobody in ${p.category} Talks About",
    "body": "2 paragraphs of bonus insight. Something they'd pay extra for separately. A genuine surprise value-add."
  },
  "cta": "2 sentences creating urgency and excitement. A direct call to action right now."
}

CRITICAL: Include exactly ${chapterCount} chapters. Make every title specific to "${p.title}" — no generic words like Foundation or Strategy. Return raw JSON only.`;
}

async function generateEmailSequenceAsset(p: StudioParams): Promise<any> {
  const prompt = `Create a professional 30-day email sequence for a digital product.

PRODUCT: "${p.title}"
DESCRIPTION: "${p.description}"
TARGET AUDIENCE: "${p.targetAudience}"
TONE: ${p.tone}
PROBLEM SOLVED: "${p.problemSolved}"

Generate exactly 10 emails spread across 30 days. Return ONLY raw JSON (no markdown):

{
  "emails": [
    {
      "day": 1,
      "type": "welcome",
      "subject": "Compelling subject line (max 50 chars)",
      "preheader": "Preview text that teases the email (max 80 chars)",
      "headline": "Email headline that grabs attention",
      "body": "3-4 paragraphs of email body. Warm, conversational, valuable. Plain text only.",
      "cta": "Button text / call to action",
      "ctaNote": "What clicking the CTA does or where it leads"
    }
  ]
}

Email sequence schedule:
- Day 1: Welcome + deliver the product + quick win tip
- Day 3: Deep value lesson from the product  
- Day 5: Client success story (real-sounding)
- Day 7: Common mistake + how to avoid it
- Day 10: Advanced tip or insider secret
- Day 14: Case study / transformation story with numbers
- Day 18: FAQ answers + reassurance
- Day 21: Midpoint check-in + motivational push
- Day 25: Promotional (complementary product or upgrade)
- Day 30: Final value drop + long-term vision

Write each email with the ${p.tone} tone. Make them genuinely valuable — not spammy.`;

  const messages = [{ role: "user", content: prompt }];
  const result = await callGeminiFallback(messages, "You are an expert email copywriter. Return only valid JSON.", 6000, "pdf");
  if (!result?.text) return null;
  try {
    const jsonStr = result.text.match(/\{[\s\S]*\}/s)?.[0] ?? result.text;
    return JSON.parse(jsonStr);
  } catch { return null; }
}

async function generateMarketingBundleAsset(p: StudioParams): Promise<any> {
  const selected = p.selectedAssets;
  const prompt = `Create a complete marketing bundle for a digital product.

PRODUCT: "${p.title}"
DESCRIPTION: "${p.description}"
TARGET AUDIENCE: "${p.targetAudience}"
PROBLEM SOLVED: "${p.problemSolved}"
TONE: ${p.tone}
CATEGORY: ${p.category}

Return ONLY raw JSON (no markdown, no code fences):

{
  "facebookGuide": {
    "strategy": "3-paragraph organic Facebook strategy for this product",
    "postIdeas": ["Post idea 1 with hook + body + CTA", "Post idea 2", "Post idea 3", "Post idea 4", "Post idea 5"],
    "groupStrategy": "How to use Facebook groups to sell this product",
    "bestTimes": "Best times/days to post"
  },
  "facebookAds": {
    "primaryText": "Long-form ad copy (4-5 paragraphs, conversational, story-based)",
    "headline": "Short punchy ad headline",
    "description": "Ad description under the headline",
    "variants": [
      {"type": "Problem-aware", "hook": "...", "body": "..."},
      {"type": "Testimonial", "hook": "...", "body": "..."},
      {"type": "Curiosity", "hook": "...", "body": "..."}
    ]
  },
  "youtubeGuide": {
    "strategy": "YouTube channel strategy for promoting this product",
    "videoIdeas": [
      {"title": "Video title 1", "description": "What to cover", "hook": "Opening 30 seconds"},
      {"title": "Video title 2", "description": "...", "hook": "..."},
      {"title": "Video title 3", "description": "...", "hook": "..."}
    ],
    "descriptionTemplate": "YouTube video description template with timestamps and links",
    "seoTips": "3-4 SEO tips for YouTube in this niche"
  },
  "tiktokGuide": {
    "strategy": "TikTok strategy for ${p.category} creators",
    "contentPillars": ["Pillar 1: ...", "Pillar 2: ...", "Pillar 3: ..."],
    "videoIdeas": [
      {"hook": "First 3 seconds hook", "concept": "Video concept", "cta": "End CTA"},
      {"hook": "...", "concept": "...", "cta": "..."},
      {"hook": "...", "concept": "...", "cta": "..."},
      {"hook": "...", "concept": "...", "cta": "..."}
    ],
    "bestPractices": "5 TikTok best practices for this niche"
  },
  "salesPage": {
    "headline": "Main sales page headline (transformation-focused)",
    "subheadline": "Supporting headline",
    "hook": "Opening 2-3 paragraphs that hook the reader",
    "bullets": ["Benefit bullet 1", "Benefit bullet 2", "Benefit bullet 3", "Benefit bullet 4", "Benefit bullet 5", "Benefit bullet 6"],
    "socialProof": "Social proof section copy",
    "testimonials": [
      {"name": "Sarah M.", "location": "Texas", "result": "Specific outcome with numbers"},
      {"name": "David K.", "location": "London", "result": "Specific outcome"},
      {"name": "Lisa R.", "location": "Canada", "result": "Specific outcome"}
    ],
    "guarantee": "Money-back guarantee copy",
    "closingCta": "Strong closing CTA paragraph"
  },
  "leadMagnet": {
    "title": "Lead magnet title (free mini-product to capture emails)",
    "subtitle": "What they get",
    "description": "2-paragraph description of the lead magnet",
    "structure": ["Chapter/Section 1", "Chapter/Section 2", "Chapter/Section 3", "Chapter/Section 4"],
    "deliveryEmail": "Email to send when they opt in"
  },
  "socialPosts": {
    "instagram": [
      {"caption": "Full Instagram caption with hook + value + CTA + hashtags"},
      {"caption": "..."},
      {"caption": "..."}
    ],
    "twitter": [
      {"tweet": "Tweet 1 (max 280 chars with engagement hook)"},
      {"tweet": "..."},
      {"tweet": "..."},
      {"tweet": "..."},
      {"tweet": "..."}
    ],
    "linkedin": [
      {"post": "Professional LinkedIn post (3-4 paragraphs + CTA)"},
      {"post": "..."}
    ],
    "pinterest": [
      {"title": "Pin title", "description": "Pin description"},
      {"title": "...", "description": "..."}
    ]
  },
  "ctaLibrary": [
    "CTA phrase 1 (urgency-based)",
    "CTA phrase 2 (benefit-based)",
    "CTA phrase 3 (curiosity-based)",
    "CTA phrase 4 (social-proof-based)",
    "CTA phrase 5 (transformation-based)",
    "CTA phrase 6", "CTA phrase 7", "CTA phrase 8",
    "CTA phrase 9", "CTA phrase 10",
    "CTA phrase 11", "CTA phrase 12",
    "CTA phrase 13", "CTA phrase 14", "CTA phrase 15"
  ]
}`;

  const messages = [{ role: "user", content: prompt }];
  const result = await callGeminiFallback(messages, "You are an expert digital marketing strategist. Return only valid JSON.", 10000, "pdf");
  if (!result?.text) return null;
  try {
    const jsonStr = result.text.match(/\{[\s\S]*\}/s)?.[0] ?? result.text;
    return JSON.parse(jsonStr);
  } catch { return null; }
}

async function generateWorksheetsAsset(p: StudioParams): Promise<any> {
  const prompt = `Create 4 interactive worksheets for the digital product "${p.title}".

TARGET AUDIENCE: "${p.targetAudience}"
PROBLEM SOLVED: "${p.problemSolved}"
CATEGORY: ${p.category}

Return ONLY raw JSON:

{
  "worksheets": [
    {
      "title": "Worksheet title",
      "subtitle": "What this worksheet helps with",
      "instructions": "How to use this worksheet (2-3 sentences)",
      "sections": [
        {
          "type": "assessment",
          "heading": "Section heading",
          "prompt": "Question or prompt for the reader",
          "lines": 4
        },
        {
          "type": "exercise",
          "heading": "Section heading",
          "prompt": "Exercise instructions",
          "lines": 6
        },
        {
          "type": "reflection",
          "heading": "Reflection",
          "prompt": "Deep reflection question",
          "lines": 4
        },
        {
          "type": "action",
          "heading": "Your Action Plan",
          "items": ["Action item 1", "Action item 2", "Action item 3"],
          "lines": 2
        }
      ]
    }
  ]
}

Create 4 distinct worksheets, each covering a different aspect of "${p.title}". Make them genuinely useful and specific to ${p.category}.`;

  const messages = [{ role: "user", content: prompt }];
  const result = await callGeminiFallback(messages, "You are an expert instructional designer. Return only valid JSON.", 5000, "pdf");
  if (!result?.text) return null;
  try {
    const jsonStr = result.text.match(/\{[\s\S]*\}/s)?.[0] ?? result.text;
    return JSON.parse(jsonStr);
  } catch { return null; }
}

async function generateBonusesAsset(p: StudioParams): Promise<any> {
  const prompt = `Create 3 premium bonus materials for the digital product "${p.title}".

TARGET AUDIENCE: "${p.targetAudience}"
CATEGORY: ${p.category}

Return ONLY raw JSON:

{
  "bonuses": [
    {
      "title": "Bonus name (make it compelling)",
      "subtitle": "What it is and why it's valuable",
      "type": "checklist",
      "value": "$X value",
      "description": "2 paragraph description of this bonus",
      "items": ["Item 1", "Item 2", "Item 3", "...up to 20 items"]
    },
    {
      "title": "...",
      "subtitle": "...",
      "type": "swipeFile",
      "value": "$X value",
      "description": "...",
      "items": ["Swipe file item 1 (full text)", "Item 2", "..."]
    },
    {
      "title": "...",
      "subtitle": "...",
      "type": "template",
      "value": "$X value",
      "description": "...",
      "sections": [
        {"heading": "Section 1", "content": "Template content for this section"},
        {"heading": "Section 2", "content": "..."},
        {"heading": "Section 3", "content": "..."}
      ]
    }
  ]
}

Make each bonus feel like it has standalone value of at least $47. Be specific to ${p.category} and "${p.title}".`;

  const messages = [{ role: "user", content: prompt }];
  const result = await callGeminiFallback(messages, "You are an expert digital product creator. Return only valid JSON.", 5000, "pdf");
  if (!result?.text) return null;
  try {
    const jsonStr = result.text.match(/\{[\s\S]*\}/s)?.[0] ?? result.text;
    return JSON.parse(jsonStr);
  } catch { return null; }
}

router.post("/pdfs/studio/generate", requireAuth, requireFeature("ai_pdf"), async (req: any, res) => {
  const p: StudioParams = {
    title: req.body.title ?? "Untitled",
    description: req.body.description ?? "",
    targetAudience: req.body.targetAudience ?? "",
    problemSolved: req.body.problemSolved ?? "",
    category: req.body.category ?? "Business",
    writingStyle: req.body.writingStyle ?? "Educational",
    directionAngle: req.body.directionAngle ?? "Ultimate Guide",
    tone: req.body.tone ?? "Authority",
    pageCount: Number(req.body.pageCount) || 50,
    visualTheme: req.body.visualTheme ?? "Modern",
    imageSource: req.body.imageSource ?? "Unsplash",
    selectedAssets: Array.isArray(req.body.selectedAssets) ? req.body.selectedAssets : ["ebook"],
    authorName: req.body.authorName ?? "The Author",
  };

  req.log.info({ title: p.title, selectedAssets: p.selectedAssets, pageCount: p.pageCount }, "[Studio] Starting generation");

  const systemPrompt = buildStudioSystemPrompt(p.writingStyle, p.tone, p.directionAngle, p.category);
  const ebookPrompt = buildStudioEbookPrompt(p);

  const topic = `${p.title}: ${p.description}`;

  // Phase 1: Generate ebook structure
  let parsed: any;
  try {
    const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: ebookPrompt }];
    const aiResult = await callGeminiFallback(messages, systemPrompt, 14000, "pdf");
    if (!aiResult?.text) throw new Error("AI returned empty response");
    const jsonStr = aiResult.text.match(/```(?:json)?\n?([\s\S]*?)\n?```/)?.[1] ?? aiResult.text.match(/\{[\s\S]*\}/s)?.[0] ?? aiResult.text;
    parsed = JSON.parse(jsonStr);
    parsed = sanitizeParsed(parsed);
    req.log.info({ chapterCount: parsed.chapters?.length }, "[Studio] Ebook structure generated");
  } catch (err: any) {
    req.log.error({ err: err.message }, "[Studio] Ebook generation failed");
    res.status(503).json({ error: "AI generation failed. Please ensure your Gemini API key is configured in Admin > API Keys." });
    return;
  }

  // Phase 2: Expand chapters in parallel
  if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
    try {
      const expanded = await Promise.all(
        parsed.chapters.map((ch: any) =>
          expandChapterBody(topic, { number: ch.number, title: ch.title ?? `Chapter ${ch.number}`, hook: ch.hook ?? "", body: ch.body ?? "" }, parsed.chapters.length)
            .then(body => ({ ...ch, body }))
        )
      );
      parsed.chapters = expanded;
    } catch (err) {
      req.log.warn({ err }, "[Studio] Chapter expansion partial failure");
    }
  }

  // Fix TOC to match actual chapter titles
  if (Array.isArray(parsed.chapters)) {
    parsed.tableOfContents = [
      `Introduction: ${p.problemSolved || "Why Everything Changes Today"}`,
      ...parsed.chapters.map((ch: any, i: number) => `Chapter ${i + 1}: ${ch.title}`),
      "Conclusion: Your 30-Day Action Plan",
      "Bonus: The Insider Secret",
    ];
  }

  // Phase 3: Generate optional assets in parallel
  const optionalTasks: Record<string, Promise<any>> = {};
  if (p.selectedAssets.includes("emailSequence")) {
    optionalTasks.emailSequence = generateEmailSequenceAsset(p);
  }
  const needsMarketing = p.selectedAssets.some(a =>
    ["facebookGuide", "facebookAdsGuide", "youtubeGuide", "tiktokGuide", "salesPage", "landingPage", "leadMagnet", "socialPosts", "ctaLibrary"].includes(a)
  );
  if (needsMarketing) {
    optionalTasks.marketing = generateMarketingBundleAsset(p);
  }
  if (p.selectedAssets.includes("worksheets")) {
    optionalTasks.worksheets = generateWorksheetsAsset(p);
  }
  if (p.selectedAssets.includes("bonuses")) {
    optionalTasks.bonuses = generateBonusesAsset(p);
  }

  const optionalResults: Record<string, any> = {};
  if (Object.keys(optionalTasks).length > 0) {
    const settled = await Promise.allSettled(Object.entries(optionalTasks).map(async ([k, p]) => ({ k, v: await p })));
    for (const r of settled) {
      if (r.status === "fulfilled") optionalResults[r.value.k] = r.value.v;
    }
  }

  // Assemble studio product
  const studioProduct = {
    _studio: true,
    _v: 3,
    params: p,
    ebook: { ...parsed, authorName: p.authorName },
    emailSequence: optionalResults.emailSequence ?? null,
    marketing: optionalResults.marketing ?? null,
    worksheets: optionalResults.worksheets ?? null,
    bonuses: optionalResults.bonuses ?? null,
  };

  // Save to DB
  let savedId: number | undefined;
  try {
    const [saved] = await db.insert(pdfHistoryTable).values({
      userId: req.userId,
      topic,
      authorName: p.authorName,
      title: parsed.title,
      content: JSON.stringify(studioProduct),
      tableOfContents: parsed.tableOfContents,
      aboutSection: parsed.aboutSection,
      authorBio: parsed.authorBio,
    }).returning();
    savedId = saved.id;
    req.log.info({ savedId, selectedAssets: p.selectedAssets }, "[Studio] Product saved");
  } catch (err) {
    req.log.error({ err }, "[Studio] DB save failed");
  }

  res.json({ id: savedId, ...studioProduct });
});

router.get("/pdfs/studio/history", requireAuth, async (req: any, res) => {
  try {
    const items = await db.select({
      id: pdfHistoryTable.id,
      topic: pdfHistoryTable.topic,
      authorName: pdfHistoryTable.authorName,
      title: pdfHistoryTable.title,
      content: pdfHistoryTable.content,
      createdAt: pdfHistoryTable.createdAt,
    }).from(pdfHistoryTable)
      .where(eq(pdfHistoryTable.userId, req.userId))
      .orderBy(desc(pdfHistoryTable.createdAt));

    const studio = items
      .filter(i => { try { return JSON.parse(i.content ?? "")?._studio; } catch { return false; } })
      .map(i => {
        const c = JSON.parse(i.content ?? "{}");
        return {
          id: i.id,
          title: i.title,
          authorName: i.authorName,
          topic: i.topic,
          createdAt: i.createdAt.toISOString(),
          params: c.params,
          selectedAssets: c.params?.selectedAssets ?? [],
        };
      });

    res.json(studio);
  } catch (err) {
    req.log.error({ err }, "[Studio] History error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/pdfs/studio/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [item] = await db.select().from(pdfHistoryTable)
      .where(eq(pdfHistoryTable.id, id)).limit(1);
    if (!item || item.userId !== req.userId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const content = JSON.parse(item.content ?? "{}");
    res.json({ id: item.id, ...content });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
