import type { StyleProfile, ToneProfile } from "./styles";

const CONTRACTIONS: [RegExp, string][] = [
  [/\bit is\b/g, "it's"],
  [/\bthey are\b/g, "they're"],
  [/\byou are\b/g, "you're"],
  [/\bwe are\b/g, "we're"],
  [/\bI am\b/g, "I'm"],
  [/\bdo not\b/g, "don't"],
  [/\bdoes not\b/g, "doesn't"],
  [/\bdid not\b/g, "didn't"],
  [/\bcannot\b/g, "can't"],
  [/\bwill not\b/g, "won't"],
  [/\bwould not\b/g, "wouldn't"],
  [/\bshould not\b/g, "shouldn't"],
  [/\bcould not\b/g, "couldn't"],
  [/\bhave not\b/g, "haven't"],
  [/\bhas not\b/g, "hasn't"],
  [/\bhad not\b/g, "hadn't"],
  [/\bthat is\b/g, "that's"],
  [/\bwhat is\b/g, "what's"],
  [/\bthere is\b/g, "there's"],
  [/\bhere is\b/g, "here's"],
  [/\bI have\b/g, "I've"],
  [/\bI would\b/g, "I'd"],
  [/\bI will\b/g, "I'll"],
  [/\byou will\b/g, "you'll"],
  [/\bthey will\b/g, "they'll"],
];

const AI_SOUNDING_PHRASES: [RegExp, string][] = [
  [/\bIn conclusion,?\b/gi, "So here's where all of this lands:"],
  [/\bIn summary,?\b/gi, "The bottom line:"],
  [/\bIt is important to note that\b/gi, "Worth noting:"],
  [/\bIt is worth mentioning that\b/gi, "One thing worth saying —"],
  [/\bFurthermore,?\b/gi, "And there's more."],
  [/\bMoreover,?\b/gi, "Here's the next layer."],
  [/\bHowever,?\b/gi, "But here's the thing."],
  [/\bNevertheless,?\b/gi, "Still —"],
  [/\bNotwithstanding,?\b/gi, "Even so,"],
  [/\bIn addition,?\b/gi, "And also —"],
  [/\bSubsequently,?\b/gi, "After that,"],
  [/\bConsequently,?\b/gi, "So naturally,"],
  [/\bTherefore,?\b/gi, "Which means:"],
  [/\bThus,?\b/gi, "And that means"],
  [/\bIn order to\b/gi, "To"],
  [/\bUtilize\b/gi, "use"],
  [/\bImplement\b/gi, "use"],
  [/\bLeverage\b/gi, "use"],
  [/\bFacilitate\b/gi, "help"],
  [/\bEnhance\b/gi, "improve"],
  [/\bOptimal\b/gi, "best"],
  [/\bIn terms of\b/gi, "when it comes to"],
  [/\bWith regards to\b/gi, "on"],
  [/\bAt the end of the day,?\b/gi, "Ultimately,"],
  [/\bIt goes without saying\b/gi, "And yes —"],
  [/\bWhat if everything you['']ve been told\b/gi, "What most people assume about this"],
  [/\bThe shift that matters\b/gi, "The actual variable"],
  [/\bThe part that changes everything\b/gi, "The critical mechanism"],
  [/\bThis changes everything\.?\b/gi, "This has real, measurable consequences."],
  [/\bgame.changer\b/gi, "meaningful advantage"],
  [/\btransformative\b/gi, "significant"],
  [/\bgroundbreaking\b/gi, "substantive"],
  [/\bpivotal\b/gi, "important"],
  [/\bparadigm shift\b/gi, "real shift in approach"],
  [/\bunlock(?:s|ed|ing)? (?:your|the)\b/gi, "develop"],
  [/\bleverage your\b/gi, "apply your"],
  [/\bsynergize\b/gi, "combine"],
  [/\bholistic(?:ally)?\b/gi, "comprehensive"],
  [/\bseamlessly?\b/gi, "smoothly"],
  [/\bempowering\b/gi, "useful"],
  [/\bjourney\b/gi, "process"],
  [/\bpassion(?:ate)?\b/gi, "focused"],
];

const EM_DASH_OPPORTUNITIES = [
  /(\w+)\. (And|But|So|Yet|Still) /g,
];

function applyContractions(text: string, rate: number, seed: number): string {
  let result = text;
  const r = seed % 1000 / 1000;
  if (r > 1 - rate) {
    for (const [pattern, replacement] of CONTRACTIONS) {
      result = result.replace(pattern, replacement);
    }
  } else {
    const halfContractions = CONTRACTIONS.slice(0, Math.floor(CONTRACTIONS.length * rate));
    for (const [pattern, replacement] of halfContractions) {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

function removeAISounding(text: string): string {
  let result = text;
  for (const [pattern, replacement] of AI_SOUNDING_PHRASES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function injectEmDashes(text: string, profile: StyleProfile, seed: number): string {
  if (!profile.useEmDashes) return text;
  let result = text;
  const sentences = result.split(". ");
  return sentences.map((s, i) => {
    if (i % 4 === seed % 4 && s.includes(",")) {
      return s.replace(",", " —").replace(" — ", " — ");
    }
    return s;
  }).join(". ");
}

function injectParentheticals(text: string, profile: StyleProfile, seed: number): string {
  if (!profile.useParentheticals) return text;
  const parentheticals = [
    "(and this matters more than it seems)",
    "(which most people skip entirely)",
    "(yes, really)",
    "(this is the part worth writing down)",
    "(which I know sounds counterintuitive)",
    "(and I don't say that lightly)",
    "(trust me on this one)",
    "(this took me embarrassingly long to learn)",
    "(not a small thing)",
    "(worth sitting with)",
  ];
  const paragraphs = text.split("\n\n");
  return paragraphs.map((p, i) => {
    if (i % 3 === seed % 3 && p.length > 100) {
      const target = parentheticals[seed % parentheticals.length];
      const midPoint = Math.floor(p.length / 2);
      const periodNear = p.indexOf(".", midPoint - 50);
      if (periodNear > 0 && periodNear < midPoint + 50) {
        return p.slice(0, periodNear) + " " + target + p.slice(periodNear);
      }
    }
    return p;
  }).join("\n\n");
}

function addFragments(text: string, profile: StyleProfile, seed: number): string {
  if (!profile.useFragments) return text;
  const fragments = [
    "Every. Single. Time.",
    "Just like that.",
    "Not even close.",
    "Full stop.",
    "That's it.",
    "Worth repeating.",
    "Always.",
    "Without exception.",
    "No exceptions.",
    "Consistently.",
    "Without fail.",
    "Period.",
  ];
  const paragraphs = text.split("\n\n");
  return paragraphs.map((p, i) => {
    if (i % 4 === (seed + 1) % 4 && p.length > 150) {
      return p + "\n\n" + fragments[(seed + i) % fragments.length];
    }
    return p;
  }).join("\n\n");
}

function varyRhythm(text: string, profile: StyleProfile): string {
  const paragraphs = text.split("\n\n");
  return paragraphs.map(p => {
    const sentences = p.split(/(?<=[.!?])\s+/);
    if (sentences.length <= 2) return p;

    const varied = sentences.map((s, i) => {
      if (i === 0 && profile.sentenceLengthMix.short > 0.3) {
        const words = s.split(" ");
        if (words.length > 20) {
          return words.slice(0, 12).join(" ") + ". " + words.slice(12).join(" ");
        }
      }
      return s;
    });
    return varied.join(" ");
  }).join("\n\n");
}

function cleanupFormatting(text: string): string {
  return text
    .replace(/\s+\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\.{4,}/g, "...")
    .replace(/\s{3,}/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/ — —/g, " —")
    .trim();
}

// ── Repeat Detection System ────────────────────────────────────────────────────
// Detects phrases of 5+ words that appear more than once and removes/rewrites
// the second+ occurrence so every sentence adds new value.

function removePhraseRepetition(text: string): string {
  // Split into paragraphs to preserve structure
  const paragraphs = text.split(/\n\n+/);
  const seenFiveGrams = new Set<string>();
  const seenSentences = new Set<string>();

  const processed = paragraphs.map(para => {
    const sentences = para.split(/(?<=[.!?])\s+/);

    const cleanedSentences = sentences.map(sentence => {
      const normalized = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
      if (normalized.length < 20) return sentence;

      // Exact sentence deduplication (normalized)
      if (seenSentences.has(normalized)) return null;
      seenSentences.add(normalized);

      // 5-gram repetition detection
      const words = normalized.split(/\s+/).filter(w => w.length > 2);
      if (words.length >= 5) {
        let repeatCount = 0;
        for (let i = 0; i <= words.length - 5; i++) {
          const gram = words.slice(i, i + 5).join(" ");
          if (seenFiveGrams.has(gram)) {
            repeatCount++;
            if (repeatCount >= 2) return null; // sentence is too repetitive
          }
        }
        // Register 5-grams from this sentence
        for (let i = 0; i <= words.length - 5; i++) {
          seenFiveGrams.add(words.slice(i, i + 5).join(" "));
        }
      }

      return sentence;
    }).filter(Boolean);

    return cleanedSentences.join(" ");
  });

  return processed.filter(p => p.trim().length > 0).join("\n\n");
}

// ── Generic Motivational Language Removal ─────────────────────────────────────
// Removes filler motivational language that sounds like AI output

const GENERIC_MOTIVATIONAL: [RegExp, string][] = [
  [/\bIn this (article|guide|piece|post),?\s*(we|I) (will|are going to|want to)\b/gi, "Here,"],
  [/\bWithout further ado,?\b/gi, ""],
  [/\bLet's dive (in|into this)(\.|\!|,)?\s*/gi, ""],
  [/\bLet's get started\.?\s*/gi, ""],
  [/\bNow, let's explore\b/gi, "Here's what matters:"],
  [/\bIn today's (world|day and age|fast-paced world),?\b/gi, "Right now,"],
  [/\bWhether you're a beginner or an expert,?\b/gi, "Regardless of where you're starting,"],
  [/\bare you ready\?/gi, ""],
  [/\bLet's begin\.?\s*/gi, ""],
];

function removeGenericMotivational(text: string): string {
  let result = text;
  for (const [pattern, replacement] of GENERIC_MOTIVATIONAL) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

export function humanize(
  text: string,
  style: StyleProfile,
  tone: ToneProfile,
  variation: number
): string {
  let result = text;
  const seed = variation * 137 + 42;

  result = removeGenericMotivational(result);
  result = removeAISounding(result);
  result = applyContractions(result, style.contractionRate, seed);
  result = injectEmDashes(result, style, seed);
  result = injectParentheticals(result, style, seed);
  if (style.emotionalIntensity > 0.6) {
    result = addFragments(result, style, seed);
  }
  result = varyRhythm(result, style);
  result = removePhraseRepetition(result);
  result = cleanupFormatting(result);

  return result;
}
