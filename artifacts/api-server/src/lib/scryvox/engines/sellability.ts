import type { CriticOutput } from "./critic";
import type { ArchitectOutput } from "./architect";
import type { ResearchOutput } from "./research";
import { applyDeepIntelligence } from "../deep-intelligence";

export interface PricingRecommendation {
  recommendedPrice: number;
  priceRange: string;
  tierBreakdown: { name: string; price: number; includes: string[] }[];
  reasoning: string;
  psychologicalPricingNote: string;
}

export interface ChapterImprovement {
  chapterTitle: string;
  currentWeakness: string;
  specificImprovement: string;
  impactOnSales: string;
}

export interface SellabilityOutput {
  revisedTitle: string;
  revisedSubtitle: string;
  improvedUVP: string;
  pricingRecommendation: PricingRecommendation;
  bonusIdeas: { title: string; description: string; perceivedValue: string }[];
  urgencyElements: string[];
  socialProofOpportunities: string[];
  chapterImprovements: ChapterImprovement[];
  overallImprovements: string[];
  launchReadinessScore: number;
  competitivePositioning: string;
  targetPlatforms: string[];
  sellabilityNotes: string;
}

const PRICING_TIERS: Record<string, { base: number; range: string; tiers: { name: string; multiplier: number; extras: string[] }[] }> = {
  mindset: {
    base: 37,
    range: "$27 – $97",
    tiers: [
      { name: "Core Guide", multiplier: 1, extras: ["Main ebook/PDF", "Digital download"] },
      { name: "Complete System", multiplier: 2.5, extras: ["Core guide", "Workbook exercises", "Email support for 30 days"] },
      { name: "Premium Experience", multiplier: 4, extras: ["Complete system", "Implementation checklist", "Bonus case study library"] },
    ],
  },
  productivity: {
    base: 47,
    range: "$37 – $127",
    tiers: [
      { name: "Blueprint", multiplier: 1, extras: ["Main guide", "Quick-start template"] },
      { name: "Full System", multiplier: 2.5, extras: ["Blueprint", "Weekly planning templates", "30-day implementation calendar"] },
      { name: "Pro Bundle", multiplier: 5, extras: ["Full system", "Video walkthroughs", "Private community access"] },
    ],
  },
  finance: {
    base: 57,
    range: "$47 – $197",
    tiers: [
      { name: "Foundation Guide", multiplier: 1, extras: ["Main guide", "Calculation worksheets"] },
      { name: "Complete System", multiplier: 3, extras: ["Foundation guide", "Budget templates", "Investment tracker"] },
      { name: "Wealth Builder Bundle", multiplier: 6, extras: ["Complete system", "Advanced strategies module", "Q&A sessions"] },
    ],
  },
  business: {
    base: 97,
    range: "$67 – $297",
    tiers: [
      { name: "Strategy Guide", multiplier: 1, extras: ["Main guide", "Business model template"] },
      { name: "Implementation Pack", multiplier: 3, extras: ["Strategy guide", "Marketing templates", "Launch checklist"] },
      { name: "Full System", multiplier: 6, extras: ["Implementation pack", "Revenue calculator", "90-day action plan"] },
    ],
  },
};

function getDefaultPricing(domain: string) {
  return PRICING_TIERS[domain] ?? {
    base: 47,
    range: "$27 – $127",
    tiers: [
      { name: "Core Guide", multiplier: 1, extras: ["Main guide", "Quick-start checklist"] },
      { name: "Complete System", multiplier: 2.5, extras: ["Core guide", "Workbook", "Bonus templates"] },
      { name: "Premium Bundle", multiplier: 4.5, extras: ["Complete system", "Implementation calendar", "Community access"] },
    ],
  };
}

function generateBonuses(domain: string, topic: string): SellabilityOutput["bonusIdeas"] {
  return [
    {
      title: `The ${topic} Quick-Start Checklist`,
      description: "A one-page distillation of the most important actions to take in the first 30 days — reduces overwhelm and accelerates the first results",
      perceivedValue: "$17 perceived value",
    },
    {
      title: `The ${domain.charAt(0).toUpperCase() + domain.slice(1)} Workbook`,
      description: "Companion exercises for each chapter — transforms passive reading into active learning and dramatically increases completion and results rates",
      perceivedValue: "$27 perceived value",
    },
    {
      title: "The Implementation Calendar",
      description: "A 90-day week-by-week roadmap for applying everything in the guide — answers the 'what do I do on Monday?' question every reader has but doesn't ask",
      perceivedValue: "$19 perceived value",
    },
    {
      title: "The Case Study Library",
      description: "5-10 short case studies of people who applied the framework successfully — provides the social proof that skeptical buyers need to commit",
      perceivedValue: "$37 perceived value",
    },
    {
      title: "The Advanced Troubleshooting Guide",
      description: "Answers the 12 most common obstacles and sticking points readers encounter — reduces refund requests and increases satisfaction scores",
      perceivedValue: "$22 perceived value",
    },
  ];
}

function buildUrgencyElements(topic: string): string[] {
  return [
    `Launch pricing valid for the first 72 hours only — price increases to standard retail after the launch window closes`,
    `The first 100 buyers receive a personal implementation review — submit your 30-day results for direct feedback`,
    `Bonus: anyone who purchases before [launch date] also receives the physical shipping of the companion workbook at no extra cost`,
    `The price of not addressing ${topic} is measurable — every month without a clear system compounds the cost`,
    `Founding member pricing: this tier closes permanently once the product reaches [X] students — what's available now won't be available later`,
  ];
}

function buildSocialProof(research: ResearchOutput): string[] {
  return [
    "Beta reader testimonials: collect 5-10 during your early access period — even rough, unpolished quotes from real readers outperform polished marketing copy",
    `Outcome statistics: document specific, measurable results from early readers — e.g. "67% of beta readers reported [specific outcome] within 30 days"`,
    "Before/After stories: one detailed transformation story (2-3 paragraphs) is worth more than 10 short testimonials in terms of conversion impact",
    `Expert validation: if a recognized authority in ${research.audienceProfile.demographicHint} endorses the framework, feature it prominently in all marketing`,
    "Implementation photos/screenshots: evidence of real people working through the material — screenshots of workbook completion, notes taken, implementation calendars filled out",
    "Negative social proof: the story of what happens without this system — sometimes showing the cost of inaction converts faster than showing the benefit of action",
  ];
}

function buildChapterImprovements(criticOutput: CriticOutput): ChapterImprovement[] {
  return criticOutput.weaknesses.slice(0, 5).map(w => ({
    chapterTitle: `Chapters addressing "${w.area}"`,
    currentWeakness: w.description,
    specificImprovement: w.specificFix,
    impactOnSales: w.severity === "high" ? "High — this directly impacts perceived value and completion rates" : "Medium — addressing this improves reader experience and review quality",
  }));
}

function buildRevisedTitle(architect: ArchitectOutput, topic: string): string {
  const originalWords = architect.productTitle.split(" ");
  const powerWords = ["Complete", "Proven", "Definitive", "Strategic", "Masterclass"];
  const powerWord = powerWords[topic.length % powerWords.length];
  if (architect.productTitle.includes("Blueprint") || architect.productTitle.includes("Method")) {
    return architect.productTitle;
  }
  return `The ${powerWord} ${topic} System: ${architect.subtitle.split(":")[0] ?? "How to Get Results That Last"}`;
}

export function runSellabilityEngine(
  topic: string,
  architect: ArchitectOutput,
  critic: CriticOutput,
  research: ResearchOutput,
  variation: number = 1
): SellabilityOutput {
  const domain = research.audienceProfile.painPoints.join(" ").toLowerCase().includes("financial") ? "finance" :
    research.audienceProfile.painPoints.join(" ").toLowerCase().includes("business") ? "business" :
    research.audienceProfile.painPoints.join(" ").toLowerCase().includes("time") ? "productivity" : "mindset";

  // ── Deep Intelligence Layer: commercial depth from first principles ──
  const deepFrame = applyDeepIntelligence(topic, variation);

  const pricingBase = getDefaultPricing(domain);
  const scoreMultiplier = critic.overallScore >= 75 ? 1.3 : critic.overallScore >= 60 ? 1.0 : 0.8;

  const pricingRecommendation: PricingRecommendation = {
    recommendedPrice: Math.round(pricingBase.base * scoreMultiplier),
    priceRange: pricingBase.range,
    tierBreakdown: pricingBase.tiers.map(t => ({
      name: t.name,
      price: Math.round(pricingBase.base * t.multiplier * scoreMultiplier),
      includes: t.extras,
    })),
    reasoning: `Based on content depth (${critic.overallScore}/100 quality score), domain (${domain}), and target audience purchasing power (${research.audienceProfile.demographicHint}). The recommended price reflects premium positioning without exceeding the psychological ceiling for first-time buyers in this category.`,
    psychologicalPricingNote: "Prices ending in 7 ($47, $97, $197) consistently outperform round numbers and prices ending in 9 in the digital info product space — they signal value while avoiding the perception of discount pricing.",
  };

  const launchReadinessScore = Math.round(
    (critic.overallScore * 0.5) +
    (critic.sellabilityScore * 0.3) +
    (critic.blockingIssues.length === 0 ? 20 : Math.max(0, 20 - critic.blockingIssues.length * 7))
  );

  const deepUVP = `Unlike generic guides that cover ${topic} at the surface level, this system addresses what most resources never reach: ${deepFrame.rootCauseStatement.slice(0, 120)}. It's built for ${research.audienceProfile.demographicHint} who are ready to understand the mechanism, not just follow the checklist.`;

  const deepCompetitivePositioning = `${deepFrame.researchDepthLayer.marketGapStatement}\n\nThe core differentiator: ${deepFrame.researchDepthLayer.competitorWeakness}\n\nEmotional triggers to activate in all marketing: ${deepFrame.sellabilityDepthLayer.emotionalTriggers.slice(0, 2).join(", ")}.\n\nAuthority positioning: ${deepFrame.sellabilityDepthLayer.authorityAngle}\n\nPrice anchoring approach: ${deepFrame.sellabilityDepthLayer.priceAnchoring}`;

  return {
    revisedTitle: buildRevisedTitle(architect, topic),
    revisedSubtitle: `The complete, principled system for ${research.audienceProfile.desires[0]} — built on the mechanism most approaches miss`,
    improvedUVP: deepUVP,
    pricingRecommendation,
    bonusIdeas: generateBonuses(domain, topic),
    urgencyElements: [
      ...buildUrgencyElements(topic),
      deepFrame.sellabilityDepthLayer.urgencyTruth,
    ],
    socialProofOpportunities: [
      ...buildSocialProof(research),
      `Transformation story format: use "${deepFrame.sellabilityDepthLayer.socialProofType}" — specific before/after with measurable outcomes`,
    ],
    chapterImprovements: buildChapterImprovements(critic),
    overallImprovements: [
      `Address the root cause directly: "${deepFrame.rootCauseStatement.slice(0, 100)}"`,
      `Use the paradox as your hook: "${deepFrame.paradoxAtCore.slice(0, 100)}"`,
      `Lead with the systems view in your marketing: "${deepFrame.systemsThinkingLens.slice(0, 120)}"`,
      "Add a compelling author/creator bio that establishes credibility specifically in this topic area",
      "Create a product mockup visual — visual representation dramatically increases perceived value",
      "Write a risk reversal guarantee — a clear, no-questions refund policy removes purchase hesitation",
      "Develop a quick-win chapter that delivers immediate value in the first 10 minutes of reading",
      `Value perception shift: "${deepFrame.sellabilityDepthLayer.valuePerceptionShift}"`,
    ],
    launchReadinessScore,
    competitivePositioning: deepCompetitivePositioning,
    targetPlatforms: ["Gumroad", "Lemon Squeezy", "Teachable", "Your own store (highest margin)", "Amazon Kindle (for discoverability)"],
    sellabilityNotes: `Launch readiness: ${launchReadinessScore}/100. ${launchReadinessScore >= 70 ? "This product is ready to launch with the improvements noted above." : "Address the blocking issues from the Product Critic before launching."}\n\nDeep commercial intelligence: ${deepFrame.knowledgeSynthesis}`,
  };
}
