import { expandTopic, type TopicExpansion } from "../expander";
import {
  AWARENESS_LEVELS,
  getRelevantLifeForces,
  generateUniqueMechanism,
  DEFAULT_SOPHISTICATION_LEVEL,
  MARKET_SOPHISTICATION_LEVELS,
} from "./guru-knowledge";
import { applyDeepIntelligence } from "../deep-intelligence";

export interface AudienceProfile {
  primaryDescription: string;
  painPoints: string[];
  desires: string[];
  currentSolutions: string[];
  whyCurrentSolutionsFail: string[];
  demographicHint: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Framework {
  name: string;
  concept: string;
  howItApplies: string;
  keyPrinciple: string;
}

export interface ResearchOutput {
  topicOverview: string;
  audienceProfile: AudienceProfile;
  faqs: FAQ[];
  coreFrameworks: Framework[];
  marketInsights: string[];
  uniqueAngles: string[];
  keyStatements: string[];
  researchSummary: string;
  recommendedDepth: string;
  estimatedMarketSize: string;
  // ── Guru-enriched fields ──────────────────────────────────────
  audienceAwarenessLevel: typeof AWARENESS_LEVELS[keyof typeof AWARENESS_LEVELS];
  lifeForcesTriggered: ReturnType<typeof getRelevantLifeForces>;
  uniqueMechanism: { name: string; description: string; howItWorks: string };
  marketSophistication: typeof MARKET_SOPHISTICATION_LEVELS[number];
  starvinCrowd: string;
  copyApproach: string;
}

const UNIVERSAL_FRAMEWORKS: Framework[] = [
  {
    name: "The Identity → Behavior → Results Loop",
    concept: "Who you believe you are determines how you act, and how you act determines what you get. Change the identity, and behavior follows automatically.",
    howItApplies: "Apply this by helping your audience identify the specific identity shift required — not just the tactics.",
    keyPrinciple: "Every sustainable change is an identity change first.",
  },
  {
    name: "The 80/20 Leverage Principle",
    concept: "In almost every system, 20% of inputs produce 80% of outputs. The skill is identifying which 20% matters most.",
    howItApplies: "Isolate the three to four actions that drive the majority of results — and build your entire framework around them.",
    keyPrinciple: "More effort on the wrong things produces the wrong results faster.",
  },
  {
    name: "The Compound Knowledge Stack",
    concept: "Knowledge compounds like interest — each layer of understanding makes the next layer easier to acquire. Most people never build the foundation correctly.",
    howItApplies: "Structure learning progressively: foundation → understanding → application → integration → mastery.",
    keyPrinciple: "Depth before breadth. One skill mastered compounds; ten skills surface-level cancel each other out.",
  },
  {
    name: "The Problem → Pain → Solution → Transformation Arc",
    concept: "People don't buy solutions — they buy relief from pain and the promise of transformation. The problem statement has to be accurate before the solution lands.",
    howItApplies: "Lead with the pain the audience feels, name it precisely, then position the solution as the direct bridge to transformation.",
    keyPrinciple: "The more specifically you can name someone's pain, the more trustworthy your solution appears.",
  },
  {
    name: "The Three Pillars Framework",
    concept: "Any durable result requires three elements working together: the right mindset, the right method, and the right momentum (consistency systems).",
    howItApplies: "Structure your product to address all three — insight alone without method produces frustration; method without mindset produces burnout.",
    keyPrinciple: "A system is only as strong as its weakest pillar.",
  },
  {
    name: "The Awareness Ladder",
    concept: "People sit at different levels of awareness about their problem: unaware → problem aware → solution aware → product aware → most aware. Each level needs different communication.",
    howItApplies: "Design entry points for the level where your target audience actually is — usually problem aware or solution aware.",
    keyPrinciple: "Meeting people where they are, not where you want them to be, is the fastest path to trust.",
  },
  {
    name: "The Before/After/Bridge Structure",
    concept: "All persuasive content has three movements: the world as it is (before), the world as it could be (after), and how to cross from one to the other (bridge).",
    howItApplies: "Every chapter, every section, every piece of your product should follow this structure at micro and macro levels.",
    keyPrinciple: "Vivid contrast between before and after is what creates desire. The bridge is what creates trust.",
  },
  {
    name: "The Depth over Breadth Principle",
    concept: "Specificity builds authority faster than comprehensiveness. A product that solves one problem completely outperforms a product that covers ten problems superficially.",
    howItApplies: "Narrow the focus ruthlessly. One promise, clearly kept, beats ten promises vaguely gestured at.",
    keyPrinciple: "The riches are in the niches — but the trust is in the depth.",
  },
];

const AUDIENCE_TEMPLATES: Record<string, AudienceProfile> = {
  mindset: {
    primaryDescription: "Ambitious individuals who sense there's a deeper layer preventing their results — people who've consumed the information but can't seem to close the gap between knowing and doing",
    painPoints: ["feeling perpetually stuck despite consuming all the right content", "inner critic that undermines every attempt at progress", "starting strong but losing momentum within weeks", "watching others succeed while applying the same strategies"],
    desires: ["to feel genuinely confident without needing external validation", "to break patterns they know are holding them back", "to show up as the best version of themselves consistently", "to close the gap between who they are and who they want to be"],
    currentSolutions: ["motivational podcasts and YouTube videos", "self-help books they've started but haven't finished", "therapy or coaching (sometimes)", "journaling or meditation apps"],
    whyCurrentSolutionsFail: ["they address symptoms not root identity patterns", "they require motivation to implement — which is what's already missing", "they're too generic to hit the specific belief architecture of any individual", "the high fades before the habit forms"],
    demographicHint: "25-45 years old, typically educated, career or business focused, has tried multiple self-improvement approaches",
  },
  productivity: {
    primaryDescription: "High-achievers drowning in their own ambition — people who are working hard but increasingly unsure whether they're working on the right things",
    painPoints: ["ending every day feeling busy but not accomplished", "decision fatigue from too many open loops and incomplete projects", "inability to protect focused time from reactive demands", "chronic feeling of being behind regardless of how much gets done"],
    desires: ["to feel in control of their time rather than managed by it", "to do the most important work at their best energy level, reliably", "to end the day with a genuine sense of meaningful progress", "to stop feeling like a high-functioning firefighter"],
    currentSolutions: ["time-blocking and task management apps (Notion, Todoist, etc.)", "the Pomodoro technique", "GTD and similar methodologies", "productivity books they've read but don't consistently apply"],
    whyCurrentSolutionsFail: ["they address time, not energy — which is the actual constraint", "they require maintenance overhead that compounds the problem", "they don't account for the psychology of resistance and procrastination", "optimization without elimination just makes you faster at the wrong things"],
    demographicHint: "28-50 years old, typically knowledge workers, entrepreneurs, or managers with significant responsibility",
  },
  finance: {
    primaryDescription: "Earning reasonable income but feeling financially behind their own expectations — people who know they should be doing more with their money but aren't sure exactly what",
    painPoints: ["making reasonable money but having nothing to show for it", "unclear on where to start with investing and afraid of making the wrong move", "income feels like it will never be enough no matter how it grows", "financial anxiety that doesn't match their actual income level"],
    desires: ["financial freedom that removes the anxiety of depending on a single income", "concrete understanding of how wealth actually gets built", "passive income streams that don't require trading more time", "the peace of knowing they'll be fine regardless of what happens"],
    currentSolutions: ["savings accounts they know aren't keeping up with inflation", "personal finance YouTube channels and subreddits", "a 401k they don't fully understand", "financial advisors they're not sure to trust"],
    whyCurrentSolutionsFail: ["they address tactics without changing the underlying money identity", "generic advice doesn't account for specific income levels and situations", "they focus on restriction (budgeting) rather than expansion (earning and investing)", "financial literacy is rarely taught in actionable, applicable ways"],
    demographicHint: "26-45 years old, earning $40k-$120k annually, typically has some debt and minimal investments",
  },
  business: {
    primaryDescription: "Entrepreneurs and early-stage business owners who have a product or service but struggle to get it consistently in front of buyers who actually purchase",
    painPoints: ["inconsistent revenue that makes planning impossible", "strong at the craft but weak at the selling and marketing side", "time split between delivery and growth — and always losing to delivery", "trying strategies that work for others but not replicating results"],
    desires: ["predictable revenue that grows month over month", "a business that doesn't entirely depend on their own daily presence", "clear understanding of which marketing activities actually drive customers", "confidence that the business model is fundamentally sound"],
    currentSolutions: ["social media content they post inconsistently", "word of mouth that's too slow to scale", "paid ads they've tried without consistent success", "networking events with mixed ROI"],
    whyCurrentSolutionsFail: ["tactics without positioning means effort without direction", "most business advice is designed for established businesses, not early-stage", "execution without a clear customer psychology framework creates random results", "the business owner's identity often limits their pricing, scope, and confidence"],
    demographicHint: "30-55 years old, typically service providers, consultants, or product creators with less than $500k annual revenue",
  },
};

function getAudienceProfile(domain: string): AudienceProfile {
  return AUDIENCE_TEMPLATES[domain] ?? {
    primaryDescription: `People who are serious about improving their relationship with and results from ${domain} — but who feel like they're missing something fundamental`,
    painPoints: ["knowing what to do but struggling to consistently do it", "information overload without clarity on what actually matters", "comparison to others who seem to get results more easily", "lack of a structured approach that fits their specific situation"],
    desires: ["clarity about exactly what steps to take and why", "consistency that compounds into visible results over time", "genuine understanding rather than surface-level tactics", "a system that works even when motivation fluctuates"],
    currentSolutions: ["YouTube videos and podcasts on the topic", "self-help books with general advice", "online courses they've partially completed", "advice from people in their network"],
    whyCurrentSolutionsFail: ["generic frameworks don't account for individual starting points", "they address knowledge without addressing application", "no accountability structure to maintain momentum", "they don't address the psychological component — only the tactical"],
    demographicHint: "Adult learners across a wide age range, motivated by personal or professional development",
  };
}

function generateFAQs(topic: string, expansion: TopicExpansion): FAQ[] {
  const { commonMistakes, surprisingTruths, contrarianAngles, actionInsights, powerQuestions } = expansion;

  const faqs: FAQ[] = [
    {
      question: `What is ${topic} and why does it matter more than most people realize?`,
      answer: `${topic} is one of those subjects where the surface understanding is almost universally wrong — or at least dramatically incomplete. At its core, it's about ${expansion.underlyingDesire}. Most people think of it as a skill or a strategy, but the people who get real results understand it as something closer to a fundamental shift in how they approach their lives. The reason it matters so much is that ${surprisingTruths[0] ?? `it compounds over time in ways that aren't visible at first but become undeniable over months and years`}.`,
    },
    {
      question: `Why do most people struggle with ${topic}?`,
      answer: `The most common reason is deceptively simple: they've been ${commonMistakes[0] ?? "approaching it from the wrong direction"}. When you optimize for the visible outcome without addressing the underlying drivers, you get short-term gains that don't hold. The second reason is ${expansion.biggestFear} — which creates a kind of self-protective avoidance that looks like procrastination but is actually much deeper than that.`,
    },
    {
      question: `What's the single most important thing to understand about ${topic}?`,
      answer: `That ${contrarianAngles[0] ?? `the conventional wisdom about it is optimized for average results, not exceptional ones`}. This sounds obvious once you see it, but it's genuinely counterintuitive when you're in the middle of it. The moment this clicked for me — and for most people who really get results — is when they stopped trying to do more and started trying to do the right thing more precisely.`,
    },
    {
      question: `What are the most common mistakes people make with ${topic}?`,
      answer: `The two that consistently produce the most damage are: first, ${commonMistakes[0] ?? "starting without a clear framework and improvising everything"}; and second, ${commonMistakes[1] ?? "measuring the wrong thing and optimizing for it relentlessly"}. Both feel productive in the moment, which is exactly why they persist. The fix for both is the same: clarity before action, every time.`,
    },
    {
      question: `How long does it actually take to see real results with ${topic}?`,
      answer: `The honest answer is that the timeline depends almost entirely on your starting point and the quality of your approach — but a practical benchmark is this: the right foundational shifts happen within weeks, visible external results typically manifest within three to six months of consistent application, and genuinely compounded results appear at the twelve-to-eighteen month mark. Most people quit in the first sixty days, which is why the minority who persist seem to get results "out of nowhere."`,
    },
    {
      question: `Is ${topic} something anyone can learn and improve at?`,
      answer: `Yes — with one important qualifier. It's learnable by anyone who's willing to address not just the tactical side but the identity component underneath it. ${surprisingTruths[1] ?? "Most people underestimate how much their self-concept is limiting their results — and overestimate how much more information they need"}. The people who consistently struggle with ${topic} are usually trying to change their behavior without changing the beliefs those behaviors are rooted in.`,
    },
    {
      question: `What does success with ${topic} actually look like?`,
      answer: `Success with ${topic} looks like ${expansion.underlyingDesire} — lived, not just described. Practically speaking, it shows up as: consistency that doesn't require willpower, results that compound rather than plateau, and a fundamental sense that you understand the subject at a level where you can troubleshoot your own challenges without needing constant external input. It's less dramatic-looking than most people expect, and more durable.`,
    },
    {
      question: `What's the first thing someone should do if they want to improve at ${topic}?`,
      answer: `${actionInsights[0] ?? "Start with an honest audit of where you currently stand — not where you feel you should be, but where you actually are"}. This sounds obvious but most people skip it, jumping straight to tactics before they have a clear picture of their actual starting point. The second step, taken within the same week, is ${actionInsights[1] ?? "identifying the one constraint that, if removed, would make everything else easier"}. Work backward from there, and your path becomes significantly clearer.`,
    },
    {
      question: powerQuestions[0] ?? `What separates people who master ${topic} from those who stay stuck?`,
      answer: `The single biggest differentiator is not talent, not access to information, and not natural ability. It's the willingness to stay specific when everything pushes toward vagueness. The people who get results name exactly what they're working on, measure it precisely, and adjust based on feedback rather than feelings. Everybody else uses approximations and wonders why the results are approximate. Specificity is the skill beneath the skill.`,
    },
    {
      question: `What's the biggest misconception about ${topic}?`,
      answer: `${contrarianAngles[1] ?? `That more effort is the answer to most ${topic} problems`}. This is deeply embedded in most conventional advice about the subject — and it's almost exactly backward. The people with the strongest results in ${topic} tend to do less, not more, but with significantly more precision and intentionality. They've stopped trying to win through volume and started winning through leverage. That shift is often what finally breaks the plateau most people get stuck at.`,
    },
  ];

  return faqs;
}

function pickFrameworks(domain: string, variation: number): Framework[] {
  const start = variation % UNIVERSAL_FRAMEWORKS.length;
  const result: Framework[] = [];
  for (let i = 0; i < 4; i++) {
    result.push(UNIVERSAL_FRAMEWORKS[(start + i) % UNIVERSAL_FRAMEWORKS.length]);
  }
  return result;
}

function generateMarketInsights(topic: string, expansion: TopicExpansion): string[] {
  return [
    `The market for ${topic} content is consistently growing because the pain it addresses is universal — nearly every adult feels the gap between where they are and where they want to be on this subject.`,
    `Most existing products in this space solve either the mindset layer OR the tactical layer — almost never both. This gap is where new products consistently win.`,
    `Audience research shows that the people most willing to invest in ${topic} content are those who've already tried multiple free or lower-cost solutions and failed — they're not looking for more information, they're looking for a system that actually works.`,
    `The format that consistently outperforms for this type of content is structured self-study combined with immediate application exercises — not passive reading or watching.`,
    `${expansion.contrarianAngles[0] ?? `The counterintuitive insight that drives sharing and word of mouth in this niche is the one that challenges the mainstream advice most people are following`}.`,
    `Products in this space that include a diagnostic component (helping readers understand exactly where they are) consistently rate higher and get more testimonials than those that jump straight to solutions.`,
  ];
}

export function runResearchEngine(topic: string, variation: number): ResearchOutput {
  const expansion = expandTopic(topic, variation);
  const domain = expansion.domain;
  const audienceProfile = getAudienceProfile(domain);
  const faqs = generateFAQs(topic, expansion);
  const coreFrameworks = pickFrameworks(domain, variation);
  const marketInsights = generateMarketInsights(topic, expansion);

  // ── Deep Intelligence Layer: refine raw topic into intellectually elevated understanding ──
  const deepFrame = applyDeepIntelligence(topic, variation);

  const isPractical = deepFrame.intentFrame.type === "practical_howto";

  const topicOverview = isPractical
    ? `${deepFrame.intentFrame.practicalFocus}.\n\nDesired outcome: ${deepFrame.intentFrame.desiredOutcome}. People who achieve this skip the theory and go straight to what works — then they understand why it works. That's the structure this guide follows.\n\nThe specific methods that produce results: ${deepFrame.intentFrame.specificMethods.slice(0, 3).join(", ")}.\n\n${deepFrame.rootCauseStatement}\n\nValidation standard: ${deepFrame.intentFrame.validationQuestion}`
    : `${deepFrame.intellectualReframe}.\n\n${deepFrame.systemsThinkingLens}\n\nAt the first-principles level: ${deepFrame.firstPrinciplesBreakdown[0]} ${deepFrame.firstPrinciplesBreakdown[1] ?? ""}\n\nThe philosophical root of this domain — ${deepFrame.philosophicalRoot} — matters because it tells us what is actually being sought beneath the surface-level question. The people who navigate ${topic} successfully share one trait: they understand it as the structural challenge it actually is, not the tactical one it appears to be. ${deepFrame.rootCauseStatement}`;

  const researchSummary = isPractical
    ? `Research on "${topic}" reveals an audience that is action-ready and frustrated with abstract advice. They've consumed enough theory — they want a working system with specific steps they can take this week. ${deepFrame.researchDepthLayer.marketGapStatement}\n\nBuyer profile: ${deepFrame.researchDepthLayer.buyerPsychologyDepth}\n\nJTBD: ${deepFrame.researchDepthLayer.jtbdStatement}\n\nContent ratio to hit: ${deepFrame.intentFrame.contentRatio.practical}% practical/actionable, ${deepFrame.intentFrame.contentRatio.mindset}% context/mindset.\n\nEvery section must answer: "${deepFrame.intentFrame.validationQuestion}"\n\nCompetitor gap: ${deepFrame.researchDepthLayer.competitorWeakness}`
    : `Deep research on "${topic}" (reframed as: "${deepFrame.intellectualReframe}") reveals a highly engaged audience who has typically already invested significant time and money trying to solve this — and is specifically looking for the understanding they've been missing. ${deepFrame.researchDepthLayer.marketGapStatement}\n\n${deepFrame.researchDepthLayer.buyerPsychologyDepth}\n\nThe JTBD (Job To Be Done) statement: ${deepFrame.researchDepthLayer.jtbdStatement}\n\nThe belief that must shift before any tactic lands: ${deepFrame.researchDepthLayer.beliefThatMustShift}\n\nThe hidden desire beneath the stated one: ${deepFrame.researchDepthLayer.hiddenDesire}\n\nCompetitor gap: ${deepFrame.researchDepthLayer.competitorWeakness}`;

  // ── Schwartz Awareness Level (most info product buyers are Solution Aware) ──
  const awarenessLevel = AWARENESS_LEVELS.solutionAware;

  // ── Whitman Life Force 8 — which biological desires this topic activates ──
  const lifeForcesTriggered = getRelevantLifeForces(topic, variation);

  // ── Unique Mechanism — the proprietary angle that separates this product ──
  const uniqueMechanism = generateUniqueMechanism(topic, variation);

  // ── Schwartz Market Sophistication — info product markets sit at level 3 ──
  const marketSophistication = DEFAULT_SOPHISTICATION_LEVEL;

  // ── Halbert's Starving Crowd — who wants this most desperately right now ──
  const starvinCrowd = `${audienceProfile.demographicHint} who have already tried ${audienceProfile.currentSolutions[0] ?? "the common solutions"} and are frustrated with inconsistent or absent results — they're not looking for more information, they're looking for a system that actually sticks. This is the most purchase-ready segment of the market.`;

  // ── Awareness-appropriate copy approach ──
  const copyApproach = `${awarenessLevel.copyApproach} Lead with: "${awarenessLevel.headline.replace(/\[.*?\]/g, `[${topic}]`)}". The audience is at the Solution Aware level — they know the problem and have tried other approaches. Lead with the Unique Mechanism (${uniqueMechanism.name}) as the differentiator — not another version of the same claim.`;

  return {
    topicOverview,
    audienceProfile,
    faqs,
    coreFrameworks,
    marketInsights,
    uniqueAngles: [
      ...expansion.contrarianAngles,
      deepFrame.paradoxAtCore,
      deepFrame.rootCauseStatement,
    ],
    keyStatements: isPractical
      ? [
          ...expansion.surprisingTruths,
          deepFrame.intentFrame.specificMethods[0],
          deepFrame.intentFrame.specificMethods[1],
          deepFrame.intentFrame.exampleScenario,
          deepFrame.firstPrinciplesBreakdown[0],
        ].filter(Boolean)
      : [
          ...expansion.surprisingTruths,
          deepFrame.firstPrinciplesBreakdown[0],
          deepFrame.firstPrinciplesBreakdown[1],
          deepFrame.wisdomLayer,
        ].filter(Boolean),
    researchSummary,
    recommendedDepth: `Long-form (8-12 chapters) structured around the ${deepFrame.thinkingFrameworks[0].name} and ${deepFrame.thinkingFrameworks[1].name} — progressing from diagnosis → mechanism → framework → application → integration`,
    estimatedMarketSize: `Large and growing — ${deepFrame.researchDepthLayer.marketGapStatement.slice(0, 120)}`,
    audienceAwarenessLevel: awarenessLevel,
    lifeForcesTriggered,
    uniqueMechanism,
    marketSophistication,
    starvinCrowd,
    copyApproach,
  };
}
