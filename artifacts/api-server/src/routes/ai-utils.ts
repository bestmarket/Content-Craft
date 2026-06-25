import { db } from "@workspace/db";
import { apiKeysTable, settingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generate } from "../lib/scryvox/index";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-preview-05-20";

async function getGeminiModelForFeature(feature?: string): Promise<string> {
  try {
    if (feature) {
      const [featureRow] = await db.select({ value: settingsTable.value })
        .from(settingsTable).where(eq(settingsTable.key, `gemini_model_${feature}`)).limit(1);
      if (featureRow?.value && featureRow.value !== "default") return featureRow.value;
    }
    const [globalRow] = await db.select({ value: settingsTable.value })
      .from(settingsTable).where(eq(settingsTable.key, "gemini_model")).limit(1);
    return globalRow?.value || DEFAULT_GEMINI_MODEL;
  } catch {
    return DEFAULT_GEMINI_MODEL;
  }
}

export interface AICallResult {
  text: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  keyIndex?: number;
}

export const roundRobinCounters: Record<string, number> = {};

// Env var names for each provider (checked as fallback when no DB keys exist)
// Replit AI integrations may expose the key under various names — list all candidates
const PROVIDER_ENV_VARS: Record<string, string[]> = {
  gemini:    ["GEMINI_API_KEY", "GOOGLE_AI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY"],
  openai:    ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"],
  claude:    ["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"],
  groq:      ["GROQ_API_KEY"],
};

// Short-lived in-memory cache to avoid hammering the DB on every single AI call.
// Keys are re-fetched at most every 30 s (or immediately on cache miss).
const _keyCache: Record<string, { keys: string[]; ts: number }> = {};
const KEY_CACHE_TTL_MS = 30_000;

// Invalidate cache for a provider (call after admin adds/removes a key)
export function invalidateKeyCache(provider?: string) {
  if (provider) {
    delete _keyCache[provider];
  } else {
    for (const k of Object.keys(_keyCache)) delete _keyCache[k];
  }
}

async function getAllActiveKeys(provider: string): Promise<string[]> {
  const now = Date.now();
  const cached = _keyCache[provider];
  if (cached && now - cached.ts < KEY_CACHE_TTL_MS) {
    return cached.keys;
  }

  // Try DB first
  try {
    const rows = await db
      .select({ encryptedKey: apiKeysTable.encryptedKey })
      .from(apiKeysTable)
      .where(and(eq(apiKeysTable.provider, provider), eq(apiKeysTable.isActive, true)));
    const dbKeys = rows.map(r => r.encryptedKey).filter(Boolean);
    if (dbKeys.length) {
      _keyCache[provider] = { keys: dbKeys, ts: now };
      return dbKeys;
    }
  } catch (err) {
    // DB unavailable (e.g. during startup) — fall through to env vars without caching
    console.warn(`[AI Keys] DB query failed for provider "${provider}" — using env var fallback`, (err as Error)?.message ?? err);
  }

  // Fall back to environment variables (e.g. from Replit AI integrations)
  const envVarNames = PROVIDER_ENV_VARS[provider] ?? [];
  const envKeys = envVarNames
    .map(name => process.env[name])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 10);

  if (envKeys.length) {
    // Cache env-var hits so we don't log warnings repeatedly
    _keyCache[provider] = { keys: envKeys, ts: now };
  } else {
    console.warn(`[AI Keys] No active keys found for provider "${provider}" — checked DB and env vars: ${envVarNames.join(", ")}`);
  }
  return envKeys;
}

export async function getRotatedKey(provider: string): Promise<string | null> {
  const keys = await getAllActiveKeys(provider);
  if (!keys.length) return null;
  const counter = roundRobinCounters[provider] ?? 0;
  roundRobinCounters[provider] = (counter + 1) % keys.length;
  return keys[counter % keys.length];
}

/**
 * Call Groq with automatic round-robin rotation across ALL active Groq keys.
 * Returns structured result with provider metadata, or null if all keys fail.
 */
export async function callGroqRotated(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature = 0.75,
): Promise<AICallResult | null> {
  const keys = await getAllActiveKeys("groq");
  if (!keys.length) return null;

  const model = "llama-3.3-70b-versatile";
  const start = roundRobinCounters["groq"] ?? 0;
  roundRobinCounters["groq"] = (start + 1) % keys.length;

  for (let i = 0; i < keys.length; i++) {
    const idx = (start + i) % keys.length;
    const key = keys[idx];
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      });
      const d = await r.json() as any;
      if (d.error) {
        console.warn(`[Groq key ${idx + 1}/${keys.length}] ${d.error?.message ?? JSON.stringify(d.error)} — trying next key`);
        continue;
      }
      if (d.choices?.[0]?.message?.content) {
        return {
          text: d.choices[0].message.content,
          provider: "groq",
          model,
          inputTokens: d.usage?.prompt_tokens,
          outputTokens: d.usage?.completion_tokens,
          keyIndex: idx + 1,
        };
      }
    } catch (e) {
      console.error(`[Groq key ${idx + 1}/${keys.length}] Fetch error:`, e);
    }
  }
  return null;
}

/**
 * Try Anthropic Claude as a fallback provider.
 */
export async function callAnthropicFallback(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  maxTokens: number,
): Promise<AICallResult | null> {
  const key = await getRotatedKey("claude") ?? await getRotatedKey("anthropic");
  if (!key) return null;
  const model = "claude-opus-4-5";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages }),
    });
    const d = await r.json() as any;
    if (d.error) {
      console.error("[Anthropic] Error:", d.error?.message ?? d.error);
      return null;
    }
    if (d.content?.[0]?.text) {
      return {
        text: d.content[0].text,
        provider: "anthropic",
        model,
        inputTokens: d.usage?.input_tokens,
        outputTokens: d.usage?.output_tokens,
      };
    }
  } catch (e) {
    console.error("[Anthropic] Fetch failed:", e);
  }
  return null;
}

/**
 * Try OpenAI as a fallback provider.
 */
export async function callOpenAIFallback(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<AICallResult | null> {
  const key = await getRotatedKey("openai");
  if (!key) return null;
  const model = "gpt-4o";
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    });
    const d = await r.json() as any;
    if (d.error) {
      console.error("[OpenAI] Error:", d.error?.message ?? d.error);
      return null;
    }
    if (d.choices?.[0]?.message?.content) {
      return {
        text: d.choices[0].message.content,
        provider: "openai",
        model,
        inputTokens: d.usage?.prompt_tokens,
        outputTokens: d.usage?.completion_tokens,
      };
    }
  } catch (e) {
    console.error("[OpenAI] Fetch failed:", e);
  }
  return null;
}

/**
 * Try Google Gemini as a fallback provider (free tier available).
 * Key stored under provider name "gemini".
 */
export async function callGeminiFallback(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  maxTokens: number,
  feature?: string,
): Promise<AICallResult | null> {
  const key = await getRotatedKey("gemini");
  if (!key) return null;
  const preferredModel = await getGeminiModelForFeature(feature);
  const ALL_MODELS = [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
  ];
  // Put preferred model first, then the rest as fallbacks
  const MODELS_TO_TRY = [preferredModel, ...ALL_MODELS.filter(m => m !== preferredModel)];
  // Convert OpenAI-style messages to Gemini contents format (shared across attempts)
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  for (const model of MODELS_TO_TRY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            contents,
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
          }),
        }
      );
      const d = await r.json() as any;
      if (d.error) {
        console.warn(`[Gemini] Model ${model} error: ${d.error?.message ?? JSON.stringify(d.error)}`);
        continue;
      }
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.info(`[Gemini] Success with model ${model}`);
        return {
          text,
          provider: "gemini",
          model,
          inputTokens: d.usageMetadata?.promptTokenCount,
          outputTokens: d.usageMetadata?.candidatesTokenCount,
        };
      }
    } catch (e) {
      console.error(`[Gemini] Fetch failed for model ${model}:`, e);
    }
  }
  console.error("[Gemini] All models failed");
  return null;
}

// ── Type-specific master visual prompts for product cover images ──────────────
const TYPE_VISUAL_STYLES: Record<string, string> = {
  ai_agent:
    "hyper-realistic AI neural network visualization, luminous violet-purple synaptic nodes connected by electric blue data streams, deep space dark background, quantum computing aesthetics, glowing circuitry, holographic interface layers, photorealistic 8K render, cinematic lighting, no text",
  n8n_workflow:
    "dynamic automation flow diagram, interconnected glowing orange-gold nodes on deep charcoal black, data pipelines as luminous rivers of light, abstract digital automation architecture, 3D depth, volumetric light rays, no text",
  replit_template:
    "futuristic code editor interface, teal and cyan neon glow on dark navy, holographic terminal windows floating in space, matrix-style cascading code particles, premium tech product aesthetic, 8K photorealistic, no text",
  chrome_extension:
    "sleek browser extension concept, emerald green and white glowing interface elements on dark background, geometric precision, digital productivity tool aesthetic, glass morphism design, premium lighting, no text",
  ebook:
    "premium digital book concept, floating pages with golden light radiating from within, deep midnight blue background with subtle starfield, knowledge and wisdom symbolism, luxurious leather and gold accents, cinematic macro photography style, no text",
  digital_product:
    "premium digital product showcase, floating holographic display screens, violet purple gradient light beams on dark background, abstract luxury tech aesthetic, depth and dimension, cinematic product photography, no text",
  prompt_package:
    "AI language model visualization, glowing text generation streams, electric violet lightning between neural nodes on deep black, prompt engineering concept art, particles forming words in space, no text",
  course:
    "premium online learning platform concept, glowing graduation cap floating above digital knowledge streams, rich purple and gold on midnight background, educational transformation visual, cinematic inspiration lighting, no text",
  software:
    "cutting-edge software product visualization, floating UI elements and code fragments in electric blue and purple on dark background, digital innovation aesthetics, abstract tech product art, no text",
  video:
    "cinematic video production concept, film reel light beams in amber and violet on deep black, camera lens flare elements, professional broadcast quality aesthetic, no text",
  template:
    "precision design template concept, geometric grid lines glowing in violet and white on charcoal, professional document floating in light, premium productivity tool aesthetic, no text",
  automation:
    "robotic automation visualization, mechanical gears transforming into digital light streams, copper and electric blue on dark industrial background, industry 4.0 aesthetics, no text",
};

/**
 * Craft a highly detailed, AI-powered visual prompt specific to the product title, topic, and type.
 */
async function craftImagePrompt(title: string, topic: string, type: string, key: string | null): Promise<string> {
  const typeStyle = TYPE_VISUAL_STYLES[type] ?? TYPE_VISUAL_STYLES.digital_product;
  const basePrompt = `${typeStyle}, representing the concept of "${topic || title}", ultra-high definition, award-winning digital art, 16:9 landscape format`;

  if (!key) return basePrompt;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Write a 70-word Stable Diffusion / Midjourney image generation prompt for a stunning professional digital product cover image.

Product: "${title}"
Topic/Niche: "${topic || title}"
Visual style base: ${typeStyle}

Rules:
- Deeply specific to the topic — NOT generic
- Dark premium background (deep navy, charcoal, or midnight black)
- Violet, purple, or neon accent colors as primary highlights
- Photorealistic, cinematic, 8K quality language
- NO text, NO words, NO letters, NO numbers in the image
- 16:9 landscape format

Return ONLY the prompt. No explanation, no markdown.` }]
          }],
          generationConfig: { maxOutputTokens: 200, temperature: 1.1 },
        }),
      }
    );
    const d = await r.json() as any;
    const crafted = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (crafted && crafted.length > 30) {
      console.info(`[ImageGen] AI-crafted prompt for "${title}": ${crafted.slice(0, 100)}…`);
      return crafted;
    }
  } catch (e) {
    console.warn("[ImageGen] Prompt crafting failed, using type-style base:", e);
  }
  return basePrompt;
}

/**
 * Try Gemini Imagen 3 — Google's highest-quality image model.
 * Uses the predict endpoint with 16:9 aspect ratio.
 */
async function tryImagen3(prompt: string, key: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            safetyFilterLevel: "block_few",
            personGeneration: "dont_allow",
          },
        }),
      }
    );
    const d = await r.json() as any;
    if (d.error) {
      console.warn(`[ImageGen] Imagen 3 API error: ${d.error?.message ?? JSON.stringify(d.error)}`);
      return null;
    }
    const prediction = d.predictions?.[0];
    if (prediction?.bytesBase64Encoded) {
      const mime = prediction.mimeType ?? "image/png";
      console.info("[ImageGen] ✅ Imagen 3 SUCCESS — high-quality image generated");
      return `data:${mime};base64,${prediction.bytesBase64Encoded}`;
    }
    console.warn("[ImageGen] Imagen 3 returned no predictions");
    return null;
  } catch (e) {
    console.warn("[ImageGen] Imagen 3 fetch failed:", e);
    return null;
  }
}

/**
 * Try Gemini 2.0 Flash multimodal image generation (backup to Imagen 3).
 */
async function tryGeminiFlashImage(prompt: string, key: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );
    const d = await r.json() as any;
    if (d.error) {
      console.warn(`[ImageGen] Gemini Flash image error: ${d.error?.message ?? JSON.stringify(d.error)}`);
      return null;
    }
    const parts = d.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? "image/png";
        console.info("[ImageGen] ✅ Gemini Flash image SUCCESS");
        return `data:${mime};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.warn("[ImageGen] Gemini Flash image fetch failed:", e);
    return null;
  }
}

/**
 * Build a high-quality Pollinations.ai URL using the Flux Pro model.
 * This is a reliable URL-based fallback — no storage needed.
 */
function buildPollinationsUrl(prompt: string, seed: number): string {
  // Use the best available model: flux (most realistic, sharpest quality)
  const safePrompt = prompt.slice(0, 400);
  const encoded = encodeURIComponent(safePrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&seed=${seed}&model=flux&enhance=true`;
}

/**
 * Generate a professional, unique AI product cover image.
 *
 * Pipeline (highest quality first):
 *   1. AI-crafts a highly specific visual prompt using Gemini text
 *   2. Gemini Imagen 3 (imagen-3.0-generate-002) — Google's best image model → base64 → R2
 *   3. Gemini 2.0 Flash preview image generation → base64 → R2
 *   4. Pollinations.ai Flux with enhanced prompts → URL (no storage needed)
 *   5. Last resort: basic Pollinations URL
 */
export async function generateProductCoverImage(params: {
  title: string;
  topic?: string;
  type?: string;
}): Promise<string> {
  const { title, topic = "", type = "digital_product" } = params;
  const seed = Math.floor(Math.random() * 999999);
  const key = await getRotatedKey("gemini");

  // ── 1. AI-craft a type-specific, topic-aware visual prompt ──────────────────
  const imagePrompt = await craftImagePrompt(title, topic, type, key);

  if (key) {
    // ── 2. Try Gemini Imagen 3 — highest quality ─────────────────────────────
    const imagen3Result = await tryImagen3(imagePrompt, key);
    if (imagen3Result) {
      const { uploadBase64ToR2 } = await import("../lib/r2Storage");
      const r2Url = await uploadBase64ToR2(imagen3Result, "images", "png");
      return r2Url ?? imagen3Result;
    }

    // ── 3. Try Gemini 2.0 Flash image generation ─────────────────────────────
    const flashResult = await tryGeminiFlashImage(imagePrompt, key);
    if (flashResult) {
      const { uploadBase64ToR2 } = await import("../lib/r2Storage");
      const r2Url = await uploadBase64ToR2(flashResult, "images", "png");
      return r2Url ?? flashResult;
    }
  }

  // ── 4. Pollinations.ai with Flux model + enhanced prompt ────────────────────
  console.info(`[ImageGen] Using Pollinations Flux for "${title}"`);
  return buildPollinationsUrl(imagePrompt, seed);
}

/**
 * Generate a hero image for a product landing page using Gemini.
 * Pipeline: Imagen 3 → Gemini 2.0 Flash.
 * NO Pollinations fallback — images must be stored as base64 in the DB,
 * not loaded live from an external URL.
 * Returns null if Gemini is unavailable or both engines fail.
 */
export async function generateLandingPageImages(params: {
  title: string;
  topic?: string;
}): Promise<{ heroImage: string | null }> {
  const { title, topic = "" } = params;
  const key = await getRotatedKey("gemini");
  if (!key) {
    console.warn("[LandingImages] No Gemini key available — skipping image generation");
    return { heroImage: null };
  }

  // Craft a hero-specific prompt: aspirational, lifestyle, transformation-focused
  const basePrompt = `cinematic lifestyle photography, ${topic || title} success transformation, aspirational, professional, warm golden hour light, premium high quality, no text, no words, no logos, no faces, 16:9 landscape`;
  let heroPrompt = basePrompt;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Write a 60-word Stable Diffusion prompt for a hero section background image.

Product: "${title}"
Topic: "${topic || title}"

Requirements:
- Aspirational lifestyle scene related to the topic — shows achievement, success, transformation
- Photorealistic, cinematic lighting, premium production value
- NO text, NO words, NO letters, NO visible faces — image will have copy overlaid
- Dark-toned or moody to allow white text overlay to read clearly
- 16:9 landscape format

Return ONLY the prompt. No explanation.` }],
          }],
          generationConfig: { maxOutputTokens: 150, temperature: 1.0 },
        }),
      }
    );
    const d = await r.json() as any;
    const crafted = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (crafted && crafted.length > 20) {
      heroPrompt = crafted;
      console.info(`[LandingImages] AI-crafted hero prompt: ${crafted.slice(0, 100)}…`);
    }
  } catch {
    // use base prompt
  }

  const { uploadBase64ToR2 } = await import("../lib/r2Storage");

  // Try Imagen 3 — highest quality
  const imagen3 = await tryImagen3(heroPrompt, key);
  if (imagen3) {
    console.info(`[LandingImages] ✅ Hero image via Imagen 3 for "${title}"`);
    const r2Url = await uploadBase64ToR2(imagen3, "hero-images", "png");
    return { heroImage: r2Url ?? imagen3 };
  }

  // Try Gemini 2.0 Flash image generation
  const flash = await tryGeminiFlashImage(heroPrompt, key);
  if (flash) {
    console.info(`[LandingImages] ✅ Hero image via Gemini Flash for "${title}"`);
    const r2Url = await uploadBase64ToR2(flash, "hero-images", "png");
    return { heroImage: r2Url ?? flash };
  }

  console.warn(`[LandingImages] Both Gemini engines failed for "${title}" — no hero image stored`);
  return { heroImage: null };
}

export interface GenerationMeta {
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

/**
 * Try all AI providers in order (Groq → Anthropic → OpenAI).
 * Logs every attempt with structured metadata.
 * Throws — never silently falls back to demo content.
 */
export async function callAIWithMeta(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  maxTokens = 4096,
  temperature = 0.8,
  logPrefix = "[AI]",
  feature?: string,
): Promise<{ text: string; meta: GenerationMeta }> {
  const providersAttempted: string[] = [];
  let fallbackUsed = false;

  // ── 1. Google Gemini (primary — fastest, highest limits) ──
  providersAttempted.push("gemini");
  console.info(`${logPrefix} Attempting Gemini (gemini-2.5-flash) [feature=${feature ?? "default"}]`);
  const geminiResult = await callGeminiFallback(messages, systemPrompt, maxTokens, feature);
  if (geminiResult) {
    const meta: GenerationMeta = {
      provider: geminiResult.provider,
      model: geminiResult.model,
      inputTokens: geminiResult.inputTokens,
      outputTokens: geminiResult.outputTokens,
      responseLength: geminiResult.text.length,
      generationStatus: "success",
      fallbackUsed: false,
      providersAttempted,
    };
    console.info(`${logPrefix} Success via Gemini | model=${geminiResult.model} in=${geminiResult.inputTokens ?? "?"} out=${geminiResult.outputTokens ?? "?"} len=${geminiResult.text.length}`);
    return { text: geminiResult.text, meta };
  }
  console.warn(`${logPrefix} Gemini failed — trying Groq`);

  // ── 2. Groq (fallback) ──
  providersAttempted.push("groq");
  fallbackUsed = true;
  console.info(`${logPrefix} Attempting Groq (llama-3.3-70b-versatile)`);
  const groqResult = await callGroqRotated(messages, maxTokens, temperature);
  if (groqResult) {
    const meta: GenerationMeta = {
      provider: groqResult.provider,
      model: groqResult.model,
      inputTokens: groqResult.inputTokens,
      outputTokens: groqResult.outputTokens,
      responseLength: groqResult.text.length,
      generationStatus: "success",
      fallbackUsed: true,
      providersAttempted,
    };
    console.info(`${logPrefix} Success via Groq | model=${groqResult.model} in=${groqResult.inputTokens ?? "?"} out=${groqResult.outputTokens ?? "?"} len=${groqResult.text.length}`);
    return { text: groqResult.text, meta };
  }
  console.warn(`${logPrefix} Groq failed — trying Anthropic`);

  // ── 3. Anthropic Claude (fallback) ──
  providersAttempted.push("anthropic");
  console.info(`${logPrefix} Attempting Anthropic (claude-opus-4-5)`);
  const anthropicResult = await callAnthropicFallback(messages, systemPrompt, maxTokens);
  if (anthropicResult) {
    const meta: GenerationMeta = {
      provider: anthropicResult.provider,
      model: anthropicResult.model,
      inputTokens: anthropicResult.inputTokens,
      outputTokens: anthropicResult.outputTokens,
      responseLength: anthropicResult.text.length,
      generationStatus: "success",
      fallbackUsed: true,
      providersAttempted,
    };
    console.info(`${logPrefix} Success via Anthropic | model=${anthropicResult.model} in=${anthropicResult.inputTokens ?? "?"} out=${anthropicResult.outputTokens ?? "?"} len=${anthropicResult.text.length}`);
    return { text: anthropicResult.text, meta };
  }
  console.warn(`${logPrefix} Anthropic failed — trying OpenAI`);

  // ── 4. OpenAI GPT-4o (final fallback) ──
  providersAttempted.push("openai");
  console.info(`${logPrefix} Attempting OpenAI (gpt-4o)`);
  const openaiResult = await callOpenAIFallback(messages, maxTokens);
  if (openaiResult) {
    const meta: GenerationMeta = {
      provider: openaiResult.provider,
      model: openaiResult.model,
      inputTokens: openaiResult.inputTokens,
      outputTokens: openaiResult.outputTokens,
      responseLength: openaiResult.text.length,
      generationStatus: "success",
      fallbackUsed: true,
      providersAttempted,
    };
    console.info(`${logPrefix} Success via OpenAI | model=${openaiResult.model} in=${openaiResult.inputTokens ?? "?"} out=${openaiResult.outputTokens ?? "?"} len=${openaiResult.text.length}`);
    return { text: openaiResult.text, meta };
  }

  // ── 5. Scryvox (built-in engine — activates when scryvox_mode = "all_system") ──
  try {
    const [modeSetting] = await db.select({ value: settingsTable.value })
      .from(settingsTable).where(eq(settingsTable.key, "scryvox_mode")).limit(1);
    const mode = modeSetting?.value ?? "studio_only";

    if (mode === "all_system") {
      providersAttempted.push("scryvox");
      console.info(`${logPrefix} Falling back to built-in Scryvox engine (mode=all_system)`);

      // Extract topic from the last user message in the conversation
      const lastUser = [...messages].reverse().find(m => m.role === "user");
      const rawTopic = lastUser?.content ?? "general topic";
      // Use first 120 chars as topic so Scryvox has a clean seed
      const topic = rawTopic.slice(0, 120).replace(/[\n\r]+/g, " ").trim();

      const scryvoxOut = generate({
        topic,
        style: "blog",
        tone: "serious",
        length: "long",
        audience: "professional",
        variation: Date.now() % 100,
      });

      const body = scryvoxOut.formattedOutput.markdown
        ?? scryvoxOut.formattedOutput.plainText;

      const text = [scryvoxOut.title, scryvoxOut.hook, body].filter(Boolean).join("\n\n");

      const meta: GenerationMeta = {
        provider: "scryvox",
        model: "scryvox-v1",
        responseLength: text.length,
        generationStatus: "success",
        fallbackUsed: true,
        providersAttempted,
      };
      console.info(`${logPrefix} Success via Scryvox | len=${text.length}`);
      return { text, meta };
    }
  } catch (scryvoxErr) {
    console.error(`${logPrefix} Scryvox fallback failed:`, scryvoxErr);
  }

  // ── All providers failed — throw ──
  const errMsg =
    "All AI providers failed. No keys configured or all keys are invalid/rate-limited. " +
    "Add a Gemini key in Admin > API Keys, or set Scryvox mode to \"All System\" in Admin > Scryvox.";
  console.error(`${logPrefix} ${errMsg} | tried=${providersAttempted.join(",")}`);
  throw new Error(errMsg);
}
