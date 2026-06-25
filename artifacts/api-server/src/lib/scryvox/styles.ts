export type WritingStyle =
  | "youtube"
  | "storytelling"
  | "persuasive"
  | "conversational"
  | "professional"
  | "blog"
  | "email"
  | "podcast"
  | "linkedin"
  | "pdf_chapter"
  | "twitter_thread"
  | "poetic";

export type WritingTone =
  | "empathetic"
  | "fired_up"
  | "serious"
  | "reflective"
  | "humorous"
  | "inspiring"
  | "raw"
  | "wise";

export type ContentLength = "micro" | "short" | "medium" | "long" | "epic";
export type AudienceType = "general" | "expert" | "beginner" | "youth" | "professional";

export interface StyleProfile {
  name: string;
  description: string;
  sentenceLengthMix: { short: number; medium: number; long: number };
  avgWordsPerParagraph: number;
  useRhetoricalQuestions: boolean;
  useFragments: boolean;
  useEmDashes: boolean;
  useParentheticals: boolean;
  hookStyle: string;
  closingStyle: string;
  structureType: "narrative" | "listicle" | "argument" | "chapter" | "thread" | "script";
  useSubheadlines: boolean;
  usePullQuotes: boolean;
  useBulletPoints: boolean;
  vocabularyTier: "casual" | "professional" | "literary" | "technical";
  contractionRate: number;
  emotionalIntensity: number;
}

export const STYLE_PROFILES: Record<WritingStyle, StyleProfile> = {
  youtube: {
    name: "YouTube Script",
    description: "Hook-driven, retention-optimized for video",
    sentenceLengthMix: { short: 0.45, medium: 0.40, long: 0.15 },
    avgWordsPerParagraph: 60,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "youtube",
    closingStyle: "youtube",
    structureType: "script",
    useSubheadlines: true,
    usePullQuotes: false,
    useBulletPoints: false,
    vocabularyTier: "casual",
    contractionRate: 0.85,
    emotionalIntensity: 0.8,
  },
  storytelling: {
    name: "Storytelling",
    description: "Narrative arc with emotional resonance",
    sentenceLengthMix: { short: 0.35, medium: 0.40, long: 0.25 },
    avgWordsPerParagraph: 80,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "storytelling",
    closingStyle: "reflective",
    structureType: "narrative",
    useSubheadlines: false,
    usePullQuotes: true,
    useBulletPoints: false,
    vocabularyTier: "literary",
    contractionRate: 0.75,
    emotionalIntensity: 0.9,
  },
  persuasive: {
    name: "Persuasive / Sales",
    description: "Logic + emotion driving decision and action",
    sentenceLengthMix: { short: 0.50, medium: 0.35, long: 0.15 },
    avgWordsPerParagraph: 55,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: false,
    hookStyle: "persuasive",
    closingStyle: "actionable",
    structureType: "argument",
    useSubheadlines: true,
    usePullQuotes: true,
    useBulletPoints: true,
    vocabularyTier: "casual",
    contractionRate: 0.70,
    emotionalIntensity: 0.75,
  },
  conversational: {
    name: "Conversational",
    description: "Like talking to a brilliant friend over coffee",
    sentenceLengthMix: { short: 0.40, medium: 0.45, long: 0.15 },
    avgWordsPerParagraph: 65,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "conversational",
    closingStyle: "inspiring",
    structureType: "narrative",
    useSubheadlines: false,
    usePullQuotes: false,
    useBulletPoints: false,
    vocabularyTier: "casual",
    contractionRate: 0.90,
    emotionalIntensity: 0.65,
  },
  professional: {
    name: "Professional",
    description: "Authoritative, structured, evidence-based",
    sentenceLengthMix: { short: 0.25, medium: 0.50, long: 0.25 },
    avgWordsPerParagraph: 90,
    useRhetoricalQuestions: false,
    useFragments: false,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "professional",
    closingStyle: "reflective",
    structureType: "argument",
    useSubheadlines: true,
    usePullQuotes: true,
    useBulletPoints: true,
    vocabularyTier: "professional",
    contractionRate: 0.40,
    emotionalIntensity: 0.40,
  },
  blog: {
    name: "Blog Post",
    description: "Informative and engaging, built for the web",
    sentenceLengthMix: { short: 0.35, medium: 0.45, long: 0.20 },
    avgWordsPerParagraph: 70,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "blog",
    closingStyle: "actionable",
    structureType: "argument",
    useSubheadlines: true,
    usePullQuotes: true,
    useBulletPoints: true,
    vocabularyTier: "casual",
    contractionRate: 0.65,
    emotionalIntensity: 0.60,
  },
  email: {
    name: "Email",
    description: "Direct, personal, built to be read and acted on",
    sentenceLengthMix: { short: 0.45, medium: 0.40, long: 0.15 },
    avgWordsPerParagraph: 50,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "email",
    closingStyle: "actionable",
    structureType: "argument",
    useSubheadlines: false,
    usePullQuotes: false,
    useBulletPoints: true,
    vocabularyTier: "casual",
    contractionRate: 0.80,
    emotionalIntensity: 0.70,
  },
  podcast: {
    name: "Podcast Script",
    description: "Conversational, natural-sounding spoken content",
    sentenceLengthMix: { short: 0.40, medium: 0.45, long: 0.15 },
    avgWordsPerParagraph: 75,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "conversational",
    closingStyle: "inspiring",
    structureType: "script",
    useSubheadlines: true,
    usePullQuotes: false,
    useBulletPoints: false,
    vocabularyTier: "casual",
    contractionRate: 0.90,
    emotionalIntensity: 0.70,
  },
  linkedin: {
    name: "LinkedIn Post",
    description: "Professional storytelling that builds authority",
    sentenceLengthMix: { short: 0.55, medium: 0.35, long: 0.10 },
    avgWordsPerParagraph: 40,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: false,
    hookStyle: "persuasive",
    closingStyle: "provocative",
    structureType: "listicle",
    useSubheadlines: false,
    usePullQuotes: false,
    useBulletPoints: true,
    vocabularyTier: "professional",
    contractionRate: 0.55,
    emotionalIntensity: 0.65,
  },
  pdf_chapter: {
    name: "PDF / Ebook Chapter",
    description: "Structured, deep, designed for long-form reading",
    sentenceLengthMix: { short: 0.25, medium: 0.50, long: 0.25 },
    avgWordsPerParagraph: 100,
    useRhetoricalQuestions: true,
    useFragments: false,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "blog",
    closingStyle: "reflective",
    structureType: "chapter",
    useSubheadlines: true,
    usePullQuotes: true,
    useBulletPoints: true,
    vocabularyTier: "professional",
    contractionRate: 0.50,
    emotionalIntensity: 0.55,
  },
  twitter_thread: {
    name: "Twitter / X Thread",
    description: "High-density insight in thread format",
    sentenceLengthMix: { short: 0.60, medium: 0.35, long: 0.05 },
    avgWordsPerParagraph: 35,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: false,
    hookStyle: "persuasive",
    closingStyle: "provocative",
    structureType: "thread",
    useSubheadlines: false,
    usePullQuotes: false,
    useBulletPoints: false,
    vocabularyTier: "casual",
    contractionRate: 0.70,
    emotionalIntensity: 0.75,
  },
  poetic: {
    name: "Poetic / Literary",
    description: "Imagery, rhythm, and metaphor-driven prose",
    sentenceLengthMix: { short: 0.35, medium: 0.35, long: 0.30 },
    avgWordsPerParagraph: 75,
    useRhetoricalQuestions: true,
    useFragments: true,
    useEmDashes: true,
    useParentheticals: true,
    hookStyle: "poetic",
    closingStyle: "reflective",
    structureType: "narrative",
    useSubheadlines: false,
    usePullQuotes: true,
    useBulletPoints: false,
    vocabularyTier: "literary",
    contractionRate: 0.60,
    emotionalIntensity: 0.95,
  },
};

export interface ToneProfile {
  name: string;
  description: string;
  emotionCategory: keyof typeof import("./vocabulary").EMOTIONAL_WORDS;
  voiceMarkers: string[];
  avoidPatterns: string[];
  intensityMultiplier: number;
}

export const TONE_PROFILES: Record<WritingTone, ToneProfile> = {
  empathetic: {
    name: "Empathetic",
    description: "Warm, understanding, speaks to shared experience",
    emotionCategory: "tender",
    voiceMarkers: ["I understand", "you're not alone in this", "it makes sense that", "most people feel exactly the same", "and that's completely valid"],
    avoidPatterns: ["just do it", "simple", "easy", "obvious"],
    intensityMultiplier: 0.8,
  },
  fired_up: {
    name: "Fired Up",
    description: "High energy, urgent, activating",
    emotionCategory: "powerful",
    voiceMarkers: ["Listen", "Pay attention", "This matters", "Right now", "Do not wait on this"],
    avoidPatterns: ["maybe", "perhaps", "might", "could consider", "at some point"],
    intensityMultiplier: 1.0,
  },
  serious: {
    name: "Serious",
    description: "Grounded, direct, no fluff",
    emotionCategory: "certain",
    voiceMarkers: ["Let's be direct", "The reality is", "Without question", "Make no mistake", "This deserves honest attention"],
    avoidPatterns: ["fun", "exciting", "amazing", "incredible", "awesome"],
    intensityMultiplier: 0.85,
  },
  reflective: {
    name: "Reflective",
    description: "Thoughtful, nuanced, inviting deep thinking",
    emotionCategory: "wise",
    voiceMarkers: ["I keep coming back to this", "It's worth sitting with", "The more I think about", "There's something worth noticing here", "I've been sitting with this idea"],
    avoidPatterns: ["definitely", "always", "never", "absolute", "certain"],
    intensityMultiplier: 0.70,
  },
  humorous: {
    name: "Humorous",
    description: "Wit, irony, and light touch without losing substance",
    emotionCategory: "surprising",
    voiceMarkers: ["(Yes, really)", "which — fair", "I know, I know", "Shocking, right?", "(I'm only half joking)", "You'd think, but no"],
    avoidPatterns: ["urgent", "critical", "immediately", "essential"],
    intensityMultiplier: 0.75,
  },
  inspiring: {
    name: "Inspiring",
    description: "Elevating, possibility-focused, forward-moving",
    emotionCategory: "hopeful",
    voiceMarkers: ["This is possible", "You're capable of this", "The path is real", "It's already in motion", "And you're closer than you think"],
    avoidPatterns: ["hard", "difficult", "impossible", "overwhelming", "exhausting"],
    intensityMultiplier: 0.90,
  },
  raw: {
    name: "Raw & Honest",
    description: "Unfiltered, vulnerable, uncomfortable-but-true",
    emotionCategory: "honest",
    voiceMarkers: ["I won't pretend", "This is uncomfortable to say", "Nobody wants to hear this", "The honest answer is", "And I say this having been exactly where you are"],
    avoidPatterns: ["polished", "refined", "perfect", "smooth", "ideal"],
    intensityMultiplier: 0.95,
  },
  wise: {
    name: "Wise",
    description: "Depth, timeless perspective, earned authority",
    emotionCategory: "wise",
    voiceMarkers: ["At its core", "When you strip everything away", "The deeper truth here", "History consistently shows", "Every durable thing is built on"],
    avoidPatterns: ["trending", "viral", "hot take", "controversial", "clickbait"],
    intensityMultiplier: 0.80,
  },
};

export const LENGTH_CONFIG: Record<ContentLength, { targetWords: number; sectionCount: number; label: string }> = {
  micro: { targetWords: 150, sectionCount: 1, label: "Micro (~150 words)" },
  short: { targetWords: 350, sectionCount: 2, label: "Short (~350 words)" },
  medium: { targetWords: 700, sectionCount: 3, label: "Medium (~700 words)" },
  long: { targetWords: 1200, sectionCount: 5, label: "Long (~1,200 words)" },
  epic: { targetWords: 2000, sectionCount: 7, label: "Epic (~2,000 words)" },
};
