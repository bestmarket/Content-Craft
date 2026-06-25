import type { ResearchOutput } from "./research";
import { expandTopic } from "../expander";

export interface ChapterBlueprint {
  number: number;
  title: string;
  subtitle: string;
  keyTopics: string[];
  coreArgument: string;
  learningOutcome: string;
  wordCountTarget: number;
  hook: string;
  uniqueInsight: string;
}

export interface ArchitectOutput {
  productTitle: string;
  titleAlternatives: string[];
  subtitle: string;
  positioningStatement: string;
  uniqueValueProposition: string;
  targetReaderProfile: string;
  promiseSentence: string;
  tableOfContents: ChapterBlueprint[];
  introduction: { hook: string; problemStatement: string; promiseStatement: string; roadmap: string };
  conclusion: { synthesis: string; callToAction: string; lastThought: string };
  totalWordCountTarget: number;
}

const CHAPTER_ARCHETYPES = [
  "The Problem Diagnosis",       // Chapter 1: What's actually wrong
  "The Myth Buster",            // Chapter 2: Why common advice fails
  "The Foundation",             // Chapter 3: What actually works at root level
  "The Core Method",            // Chapter 4: The central framework
  "The Step-by-Step System",    // Chapter 5: How to execute it
  "The Application System",     // Chapter 6: Real-world application
  "The Advanced Layer",         // Chapter 7: Going deeper
  "The Obstacle Navigator",     // Chapter 8: Handling the hardest parts
  "The Compounding System",     // Chapter 9: Making it stick long-term
  "The Integration",            // Chapter 10: Putting it all together
];

const DOMAIN_CHAPTER_CLUSTERS: Record<string, string[][]> = {
  income: [
    ["Why Most People Never Reach $2,000/Month — The Real Reason", "The gap between wanting more income and actually generating it consistently"],
    ["The 5 Fastest Income Methods Ranked by Speed and Skill Required", "Which approach fits your situation, timeline, and existing abilities"],
    ["Freelancing: Land Your First Paying Client Within 7 Days", "The exact outreach process, pricing strategy, and proposal template that works"],
    ["Digital Products: Create Once, Sell While You Sleep", "How to build a $47–$197 digital product and get your first 10 sales"],
    ["Content Monetization: Building an Audience That Pays You", "YouTube, newsletters, and social content as sustainable income engines"],
    ["The Income Stack: Combining Streams for $2K/Month Reliability", "Why one stream is fragile and how to build a stable income combination"],
    ["The 90-Day Ramp Plan: Week-by-Week to Your First $2K Month", "A concrete calendar — what to do each week, in what order, and why"],
    ["Common Income Mistakes That Delay Results by Months", "The specific errors beginners make and exactly how to avoid them"],
    ["Scaling Past $2K: What Changes When You Want $5K or $10K/Month", "The different skillset, systems, and mindset required at each level"],
    ["Your First 30 Days: The Exact Action Plan to Start This Week", "A daily checklist for the first 30 days, with decision trees for each scenario"],
  ],
  mindset: [
    ["The Mindset Lie — Why Most Advice Keeps You Stuck", "The internal operating system most people never examine"],
    ["Identity Before Tactics — The Root Level of Change", "Why who you are determines what you can do"],
    ["The Belief Architecture — Mapping Your Internal Limits", "How to identify and dismantle the ceiling you've built"],
    ["The Comfort Zone Redefined — What Growth Actually Feels Like", "Why discomfort is data, not danger"],
    ["The Inner Critic Decoded — Understanding the Voice That Won't Quit", "Redirecting self-criticism into constructive fuel"],
    ["Emotional Agility — Feeling Without Being Controlled", "Processing emotion as information, not identity"],
    ["Decision Quality — How Your Mental State Shapes Every Choice", "Making the right calls when it matters most"],
    ["The Consistency Code — Building a Mindset Practice That Lasts", "Systems that work even when willpower doesn't"],
    ["The Compound Effect of Small Shifts", "Why tiny changes in mindset produce outsized results over time"],
    ["Living It — Integrating the New Identity", "Making the shift permanent, not just theoretical"],
  ],
  productivity: [
    ["The Productivity Myth — Why Doing More Is the Wrong Goal", "Separating output that matters from busyness that feels productive"],
    ["Energy Architecture — Your Most Valuable Resource Isn't Time", "Designing your day around your peak performance windows"],
    ["The Deep Work Protocol — Protecting What Actually Matters", "Creating uninterrupted time for high-leverage work"],
    ["Decision Fatigue and the Hidden Tax on Performance", "How too many choices quietly destroy your best work"],
    ["The Elimination Audit — Doing Less to Achieve More", "Removing the things that consume energy without producing results"],
    ["The Priority Matrix — What Actually Deserves Your Attention", "Distinguishing urgent, important, and neither"],
    ["Systems Over Willpower — Why Your Environment Is Doing Most of the Work", "Designing the conditions that make your behavior automatic"],
    ["Recovery as a Performance Variable — The Science of Strategic Rest", "Why rest is not the opposite of productivity"],
    ["The Long Game — Building a Compounding Productivity System", "Habits that get more powerful as time goes on"],
    ["Integration — Living a Productive Life Without Living for Productivity", "Keeping results in perspective alongside everything else that matters"],
  ],
  finance: [
    ["The Money Story — Uncovering the Beliefs Running Your Financial Life", "Your financial identity is running the show whether you know it or not"],
    ["Income vs Wealth — Why Earning More Isn't the Answer (Alone)", "The crucial distinction most high earners never make"],
    ["The Asset Architecture — Building Things That Work While You Sleep", "Understanding the difference between trading time and building equity"],
    ["Compound Growth Decoded — The Math That Changes Everything", "Why starting early matters exponentially more than starting big"],
    ["The Investment Psychology — Overcoming the Emotions That Destroy Returns", "Fear, greed, and the predictable ways they cost you money"],
    ["Debt as a Tool, Not a Trap — A Strategic Perspective", "When debt works for you and when it works against you"],
    ["Income Diversification — Building Multiple Financial Streams", "The architecture of financial resilience"],
    ["The Protection Layer — Insurance, Emergency Funds, and Thinking About Risk", "Building the financial foundation before building wealth"],
    ["Tax Strategy for Regular People — Keeping More of What You Earn", "Legally minimizing the biggest recurring expense in your life"],
    ["The Wealth Plan — Your Personalized Financial Roadmap", "Pulling it all together into a coherent, actionable strategy"],
  ],
  business: [
    ["The Positioning Problem — Why Most Businesses Sound Like Everyone Else", "Finding your specific corner of the market and owning it"],
    ["Customer Psychology — Understanding Why People Actually Buy", "The emotional and rational drivers of purchase decisions"],
    ["The Offer Architecture — Building Something People Genuinely Want", "What makes an offer irresistible vs forgettable"],
    ["Marketing as Communication — Reaching the Right People with the Right Message", "Strategy over tactics: how to think about marketing correctly"],
    ["Sales Without Feeling Salesy — Converting Conversations into Customers", "Building trust-based selling that doesn't require pressure"],
    ["Revenue Architecture — Designing for Predictable, Growing Income", "How to structure your business for compounding returns"],
    ["Systems Before Scale — Building the Operational Foundation", "What needs to be in place before you grow"],
    ["The Team Layer — Hiring, Leading, and Building Culture", "Multiplying yourself through the right people"],
    ["Metrics That Matter — What to Measure and What to Ignore", "Data-driven decisions without data overwhelm"],
    ["The Long Game — Building a Business That Outlasts You", "Vision, legacy, and strategic positioning for the future"],
  ],
};

function getChapterClusters(domain: string, topic?: string): string[][] {
  // Intent-based routing: detect practical how-to topics and route to action-focused chapters
  if (topic) {
    const t = topic.toLowerCase();
    // Income/earning intent — most commonly misrouted
    const incomeSignals = ["make money", "earn money", "per month", "per week", "side hustle", "passive income", "extra income", "online income"];
    if (incomeSignals.some(s => t.includes(s)) || /make \$|earn \$|\$\d+/.test(t) || /\bearn(ing)?\b.*(month|week|year)/.test(t)) {
      return DOMAIN_CHAPTER_CLUSTERS.income;
    }
    // Health action intent
    if (/\b(lose|gain|build muscle|get fit|weight loss|fat loss)\b/.test(t)) {
      return DOMAIN_CHAPTER_CLUSTERS.health_action ?? DOMAIN_CHAPTER_CLUSTERS.health;
    }
    // Business launch/growth intent
    if (/\b(start a business|launch|get clients|grow my|scale my|sell more)\b/.test(t)) {
      return DOMAIN_CHAPTER_CLUSTERS.business_action ?? DOMAIN_CHAPTER_CLUSTERS.business;
    }
  }

  return DOMAIN_CHAPTER_CLUSTERS[domain] ?? [
    ["Why Most People Fail at This — The Root Cause", "What's actually blocking results and how to remove it"],
    ["The Core Method — What Actually Produces Results", "The principles that consistently work, and why"],
    ["Step-by-Step Implementation — How to Apply This Starting Today", "Moving from understanding to consistent, measurable action"],
    ["Real-World Application — Examples and Scenarios", "Concrete cases showing exactly how this works in practice"],
    ["Common Obstacles and How to Beat Them", "The specific challenges that derail people and how to navigate each one"],
    ["The System — Building Habits That Don't Require Willpower", "How to make consistent results automatic rather than effortful"],
    ["Advanced Strategies — Going Further Than Most People Do", "What separates good results from exceptional ones"],
    ["Your Action Plan — The First 30 Days", "A week-by-week implementation guide to get results fast"],
  ];
}

function buildTitles(topic: string, variation: number): string[] {
  const titleTemplates = [
    `The ${topic} Blueprint: A Complete System for [Transformation]`,
    `${topic} Mastery: What Nobody Teaches and Everybody Needs`,
    `The Truth About ${topic}: A Practical Guide to Real Results`,
    `Beyond ${topic}: The Framework That Changes Everything`,
    `${topic} Unlocked: The Complete Guide to Finally Getting Results`,
    `The ${topic} Method: A Step-by-Step System That Actually Works`,
    `Everything Wrong With ${topic} (And How to Do It Right)`,
    `The ${topic} Advantage: How Top Performers Think and Act Differently`,
  ];
  const v = variation % titleTemplates.length;
  return [
    titleTemplates[v],
    titleTemplates[(v + 1) % titleTemplates.length],
    titleTemplates[(v + 2) % titleTemplates.length],
  ];
}

export function runArchitectEngine(
  topic: string,
  research: ResearchOutput,
  variation: number
): ArchitectOutput {
  const expansion = expandTopic(topic, variation);
  const domain = expansion.domain;
  const clusterData = getChapterClusters(domain, topic);
  const titles = buildTitles(topic, variation);
  const chapterCount = Math.min(clusterData.length, 9);

  const tableOfContents: ChapterBlueprint[] = clusterData.slice(0, chapterCount).map((cluster, i) => {
    const archetype = CHAPTER_ARCHETYPES[i % CHAPTER_ARCHETYPES.length];
    const mistakeRef = research.audienceProfile.painPoints[i % research.audienceProfile.painPoints.length];
    const desireRef = research.audienceProfile.desires[i % research.audienceProfile.desires.length];

    return {
      number: i + 1,
      title: cluster[0],
      subtitle: cluster[1] ?? `The essential understanding for ${topic}`,
      keyTopics: [
        `Why most people get this step wrong`,
        `The core principle at work here`,
        `How to apply this immediately`,
        `What to watch out for`,
      ],
      coreArgument: `Addresses the specific challenge of ${mistakeRef} by showing readers ${desireRef} is achievable through a different approach.`,
      learningOutcome: `By the end of this chapter, readers will understand ${cluster[1]?.toLowerCase() ?? "the core principle"} and have a clear first action to take.`,
      wordCountTarget: i < 2 ? 1800 : i < 7 ? 2200 : 1600,
      hook: research.faqs[i % research.faqs.length]?.question ?? `What if everything you thought about this was wrong?`,
      uniqueInsight: expansion.surprisingTruths[i % expansion.surprisingTruths.length] ?? expansion.contrarianAngles[0],
    };
  });

  const totalWordCountTarget = tableOfContents.reduce((sum, ch) => sum + ch.wordCountTarget, 0) + 3000;

  return {
    productTitle: titles[0],
    titleAlternatives: titles.slice(1),
    subtitle: `A Complete, No-Compromise System for ${research.audienceProfile.desires[0]}`,
    positioningStatement: `For ${research.audienceProfile.demographicHint} who are ${research.audienceProfile.painPoints[0]} and want ${research.audienceProfile.desires[0]} — this is the framework nobody else is teaching clearly.`,
    uniqueValueProposition: `Unlike most ${topic} resources that address either mindset OR tactics, this system integrates both — built on ${research.coreFrameworks[0]?.name ?? "proven principles"} and designed for consistent application, not one-time inspiration.`,
    targetReaderProfile: research.audienceProfile.primaryDescription,
    promiseSentence: `By the end of this, you will have a complete, personally applicable system for ${topic} — one that works consistently, compounds over time, and doesn't require constant willpower or motivation to maintain.`,
    tableOfContents,
    introduction: {
      hook: research.faqs[0]?.question ?? `What if the reason ${topic} hasn't worked isn't about you at all?`,
      problemStatement: `The standard approach to ${topic} has a fundamental flaw: ${research.uniqueAngles[0] ?? "it optimizes for the visible problem while ignoring the invisible one"}. This book exists because that gap is costing people real results.`,
      promiseStatement: `By the end of this book, you won't just understand ${topic} better — you'll have a working system that you can apply immediately and that compounds in value the longer you use it.`,
      roadmap: `We'll move through ${chapterCount} chapters that build on each other deliberately: starting with what's actually happening, then building the right foundation, then constructing the method, and finally integrating it into a system that lasts.`,
    },
    conclusion: {
      synthesis: `Everything in this book points to one central truth: ${expansion.surprisingTruths[0] ?? "sustainable results require a foundation, not just tactics"}. The chapters you've worked through aren't a collection of tips — they're a system designed to compound.`,
      callToAction: `The work begins with the next decision you make. Not tomorrow, not when conditions are better. The system is only as real as the first action you take with it.`,
      lastThought: `The version of you who needed this book already knew something was possible. This book is proof that instinct was right.`,
    },
    totalWordCountTarget,
  };
}
