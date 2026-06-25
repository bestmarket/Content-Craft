/**
 * Scryvox Landing Page Engine
 *
 * Modeled after high-converting direct response VSL-style sales pages.
 * Formula: Hero → Feature Bullets → Urgency → Problem Agitation →
 *          From/To Shift → INTRODUCING → Old vs New → How It Works →
 *          Income Opportunities → Value Stack → Price Reveal → Guarantee → CTA
 *
 * Internal to Scryvox. Never a standalone tool.
 * Powered by the Deep Intelligence Layer for intellectual depth.
 */

import type { ResearchOutput } from "./research";
import type { ArchitectOutput } from "./architect";
import type { SellabilityOutput } from "./sellability";
import type { MarketingOutput } from "./marketing";
import { applyDeepIntelligence } from "../deep-intelligence";

export interface LandingPageSection {
  sectionId: string;
  name: string;
  headline: string;
  content: string;
  copywritingNote: string;
}

export interface ValueStackItem {
  title: string;
  description: string;
  value: string;
}

export interface FeatureBullet {
  name: string;
  line1: string;
  line2: string;
  benefit: string;
}

export interface HowItWorksStep {
  number: number;
  title: string;
  lines: string[];
  closingLine: string;
}

export interface IncomeStream {
  title: string;
  description: string;
  deliverable: string;
  priceRange: string;
}

export interface LandingPageOutput {
  pageTitle: string;
  metaDescription: string;

  heroSection: {
    headline: string;
    subheadline: string;
    powerLine: string;
    noObjestions: string;
    featureBullets: FeatureBullet[];
    urgencyBanner: string;
    priceAnchor: string;
    ctaButton: string;
  };

  problemAgitationSection: {
    headline: string;
    openingNarrative: string;
    painItems: string[];
    bridgeLine: string;
    fromToShift: { from: string[]; to: string[] };
    problemStatement: string;
    deeperProblemItems: string[];
    soBigQuestion: string;
  };

  introducingSection: {
    dramaticReveal: string;
    tagline: string;
    oldWayLabel: string;
    oldWayItems: string[];
    newWayLabel: string;
    newWayItems: string[];
  };

  featuresSection: {
    headline: string;
    bullets: FeatureBullet[];
    bestPartStatement: string;
    noMoreItems: string[];
  };

  howItWorksSection: {
    headline: string;
    steps: HowItWorksStep[];
    closingLine: string;
  };

  incomeStreamsSection: {
    headline: string;
    subheadline: string;
    streams: IncomeStream[];
    whyItWorksStatement: string;
  };

  valueStackSection: {
    headline: string;
    items: ValueStackItem[];
    totalRealWorldValue: string;
    todaysPrice: string;
    priceNote: string;
    ctaButton: string;
  };

  guaranteeSection: {
    headline: string;
    body: string;
    bulletPoints: string[];
    closingLine: string;
    refundNote: string;
  };

  finalCtaSection: {
    headline: string;
    bulletPoints: string[];
    ctaButton: string;
    guaranteeReminder: string;
  };

  comparisonSection: {
    headline: string;
    otherToolsLabel: string;
    otherToolsItems: string[];
    productLabel: string;
    productItems: string[];
  };

  faqSection: {
    headline: string;
    faqs: { question: string; answer: string }[];
  };

  fullPageMarkdown: string;
  sections: LandingPageSection[];
  abTestIdeas: string[];
  copywritingNotes: string[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function h(s: string): number {
  let v = 0;
  for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) & 0xffffffff;
  return v >>> 0;
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function detectDomain(topic: string): string {
  const t = topic.toLowerCase();
  if (["mindset","belief","confidence","mental","habit","anxiety","fear","discipline","self"].some(k => t.includes(k))) return "mindset";
  if (["productivity","time","focus","procrastination","organize","deep work","output"].some(k => t.includes(k))) return "productivity";
  if (["money","finance","wealth","invest","income","budget","rich","debt","savings"].some(k => t.includes(k))) return "finance";
  if (["business","startup","entrepreneur","marketing","sales","customer","brand","revenue"].some(k => t.includes(k))) return "business";
  if (["health","fitness","exercise","nutrition","diet","wellness","body","weight","sleep"].some(k => t.includes(k))) return "health";
  if (["relationship","love","partner","dating","marriage","family","friend","trust"].some(k => t.includes(k))) return "relationships";
  if (["career","job","work","professional","leadership","promotion","skill","network"].some(k => t.includes(k))) return "career";
  if (["creative","art","write","design","idea","innovation","content","storytelling"].some(k => t.includes(k))) return "creativity";
  return "default";
}

function formatPrice(price: number): string {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`;
}

// ─── Section builders ────────────────────────────────────────────────────────

function buildHeroSection(
  topic: string,
  productTitle: string,
  research: ResearchOutput,
  sellability: SellabilityOutput,
  intelligence: ReturnType<typeof applyDeepIntelligence>,
  domain: string,
  seed: number
): LandingPageOutput["heroSection"] {
  const desire = research.audienceProfile.desires[0] ?? "get real results";
  const price = sellability.pricingRecommendation.recommendedPrice;

  const headlines: Record<string, string[]> = {
    mindset: [
      `A Breakthrough System Lets You Finally ${desire.charAt(0).toUpperCase() + desire.slice(1)}`,
      `The Framework That Rewires How You Think About ${topic} — For Good`,
      `Discover The System That Makes ${topic} Click — Even If You've Tried Everything`,
    ],
    productivity: [
      `A Proven System Lets You ${desire.charAt(0).toUpperCase() + desire.slice(1)} On Autopilot`,
      `The Framework That Makes ${topic} Simple, Repeatable & Automatic`,
      `How To Finally ${desire} — Without Burning Out`,
    ],
    finance: [
      `The System That Lets You ${desire.charAt(0).toUpperCase() + desire.slice(1)} — Starting Now`,
      `A Proven Framework For ${topic} That Actually Works`,
      `Discover The Path To ${desire} — Even If You're Starting From Zero`,
    ],
    business: [
      `A Complete System Lets You Build ${desire} — On Autopilot`,
      `The Framework That Makes ${topic} Predictable, Scalable & Profitable`,
      `How Smart Entrepreneurs Are Using ${topic} To ${desire}`,
    ],
    default: [
      `A Proven System Lets You Finally Master ${topic}`,
      `The Framework That Makes ${topic} Click — Even If Nothing Has Worked Before`,
      `Discover The System Behind ${topic} That Top Performers Use`,
    ],
  };

  const headlineOptions = headlines[domain] ?? headlines.default;
  const headline = pick(headlineOptions, seed);

  const featureBullets: FeatureBullet[] = [
    {
      name: `${intelligence.thinkingFrameworks[0].name} Engine`,
      line1: `Powered by ${intelligence.thinkingFrameworks[0].name}`,
      line2: `Deep understanding — not surface-level tips`,
      benefit: `Smarter approach with better outcomes`,
    },
    {
      name: `First Principles Framework`,
      line1: `Built on the first principles of ${topic}`,
      line2: `The foundation most resources never touch`,
      benefit: `Results that hold up — not just in theory`,
    },
    {
      name: `Root Cause System`,
      line1: `Addresses the actual cause — not the symptom`,
      line2: `${intelligence.rootCauseStatement.slice(0, 80)}`,
      benefit: `Solve it once. Done.`,
    },
    {
      name: `Complete Application Guide`,
      line1: `Step-by-step from understanding to execution`,
      line2: `No gaps. No vague advice.`,
      benefit: `Immediate results, not inspiration`,
    },
    {
      name: `Lifetime Access — No Subscriptions`,
      line1: `Pay once… use forever`,
      line2: `No monthly fees. No hidden costs.`,
      benefit: `One investment. Unlimited value.`,
    },
  ];

  return {
    headline: `Breakthrough: ${headline}`,
    subheadline: sellability.revisedTitle,
    powerLine: `On Full Application, Creating Real Results & Delivering Transformation — 24/7`,
    noObjestions: `No Fluff. No Recycled Advice. No Wasted Time.`,
    featureBullets,
    urgencyBanner: sellability.urgencyElements[0] ?? `Limited Launch Pricing — Price Increases Soon`,
    priceAnchor: `Real Value: ${formatPrice(price * 8)}/Year. Today Only — One Time: ${formatPrice(price)}`,
    ctaButton: `👉 Click Here To Get ${productTitle.split(":")[0]} Now`,
  };
}

function buildProblemAgitationSection(
  topic: string,
  research: ResearchOutput,
  intelligence: ReturnType<typeof applyDeepIntelligence>,
  domain: string,
  seed: number
): LandingPageOutput["problemAgitationSection"] {
  const pain1 = research.audienceProfile.painPoints[0] ?? "feeling stuck despite effort";
  const pain2 = research.audienceProfile.painPoints[1] ?? "inconsistent results";
  const currentSolution = research.audienceProfile.currentSolutions[0] ?? "conventional approaches";

  const openings: Record<string, string> = {
    mindset: `Over the past few years… Something became obvious.\n\n${topic} became a massive topic. But something else became clear…\n\nKnowing about ${topic} is easy.\n\nActually changing because of it? That's the hard part.\n\nSo while everyone is reading about ${topic}…\n\nVery few are actually transforming because of it.`,
    productivity: `Over the past few years… Something unexpected happened.\n\n${topic} became everyone's obsession. But something else became obvious…\n\nKnowing the systems is easy.\n\nActually executing them consistently? That's where everyone falls apart.\n\nSo while everyone has a ${topic} system…\n\nVery few are getting the results those systems promise.`,
    finance: `Over the past few years… Something became painfully clear.\n\n${topic} content is everywhere. But something else became obvious…\n\nKnowing what to do is easy.\n\nActually doing it — and sticking with it — that's the real problem.\n\nSo while everyone knows the rules of ${topic}…\n\nVery few are actually building financial security.`,
    default: `Over the past few years… Something became obvious.\n\n${topic} became a massive conversation. More content. More advice. More systems.\n\nBut something else became clear…\n\nMore information wasn't solving the problem.\n\nSo while everyone is consuming ${topic} content…\n\nVery few are actually getting the results they want.`,
  };

  return {
    headline: `Why Everyone Is Struggling With ${topic}\n(And Why The Common Advice Is Already Outdated)`,
    openingNarrative: openings[domain] ?? openings.default,
    painItems: [
      `Reading about ${topic} but still not seeing results`,
      `Trying ${currentSolution} and getting inconsistent outcomes`,
      `Knowing what to do — but not being able to do it consistently`,
      `Feeling like you're working hard without getting anywhere real`,
      `${pain1}`,
      `${pain2}`,
    ],
    bridgeLine: `That's NOT progress.\n\nThat's still just information without transformation.`,
    fromToShift: {
      from: [
        `Consuming more content about ${topic}`,
        `Following generic advice that doesn't fit`,
        `Trying harder with the same broken approach`,
        `Hoping motivation shows up and stays`,
      ],
      to: [
        `Understanding ${topic} at the root level`,
        `Applying a framework built for your specific situation`,
        `Working with the actual mechanism — not against it`,
        `Building a system that runs without willpower`,
      ],
    },
    problemStatement: `But Here's The Real Problem…`,
    deeperProblemItems: [
      `Generic ${topic} advice addresses the visible symptom`,
      `It ignores the actual mechanism underneath`,
      `Which means you keep getting the same results`,
      `No matter how much effort you put in`,
      `${intelligence.researchDepthLayer.statusQuoBias}`,
    ],
    soBigQuestion: `So The Real Question Is…\n\nWhat If You Finally Understood ${topic} At The Level That Actually Changes Things?`,
  };
}

function buildIntroducingSection(
  topic: string,
  productTitle: string,
  sellability: SellabilityOutput,
  intelligence: ReturnType<typeof applyDeepIntelligence>,
  domain: string
): LandingPageOutput["introducingSection"] {
  const oldWayItems: Record<string, string[]> = {
    mindset: [
      `Generic motivational content = Limited real change`,
      `You only shift when you feel inspired`,
      `👉 No inspiration = no progress`,
    ],
    productivity: [
      `Generic productivity systems = Limited real output`,
      `You only execute when you have energy`,
      `👉 No energy = no results`,
    ],
    finance: [
      `Generic financial advice = Limited real change`,
      `You only act when you feel financially confident`,
      `👉 No confidence = no action`,
    ],
    default: [
      `Generic ${topic} content = Limited real change`,
      `You only improve when conditions are perfect`,
      `👉 No perfect conditions = no progress`,
    ],
  };

  const newWayItems: Record<string, string[]> = {
    mindset: [
      `Root-level understanding = Permanent real change`,
      `Once you understand the mechanism, it runs automatically`,
      `👉 Even when motivation is low`,
    ],
    productivity: [
      `Systems-level understanding = Consistent real output`,
      `Once the framework is in place, execution becomes automatic`,
      `👉 Even when energy is low`,
    ],
    finance: [
      `First-principles understanding = Consistent real action`,
      `Once you see the mechanism, the right moves become obvious`,
      `👉 Even without financial confidence`,
    ],
    default: [
      `Deep-level understanding = Permanent real change`,
      `Once the framework is clear, the right actions become obvious`,
      `👉 Even under difficult conditions`,
    ],
  };

  return {
    dramaticReveal: `I  N  T  R  O  D  U  C  I  N  G`,
    tagline: `A Breakthrough System That Finally Addresses ${topic} At The Level That Produces Real, Lasting Results`,
    oldWayLabel: `= Conventional ${topic} Approach`,
    oldWayItems: oldWayItems[domain] ?? oldWayItems.default,
    newWayLabel: `= ${productTitle.split(":")[0]}`,
    newWayItems: newWayItems[domain] ?? newWayItems.default,
  };
}

function buildFeaturesSection(
  topic: string,
  architect: ArchitectOutput,
  sellability: SellabilityOutput,
  intelligence: ReturnType<typeof applyDeepIntelligence>
): LandingPageOutput["featuresSection"] {
  const bullets: FeatureBullet[] = [
    {
      name: `The Root Cause Breakdown`,
      line1: `Understand what's actually driving results (or lack of them) in ${topic}`,
      line2: `Most resources never go here — this is where everything changes`,
      benefit: `This alone is worth the entire investment`,
    },
    {
      name: `${intelligence.thinkingFrameworks[0].name} Framework`,
      line1: intelligence.thinkingFrameworks[0].applicationToTopic,
      line2: `Applied directly to ${topic} — not abstract theory`,
      benefit: `See ${topic} differently, permanently`,
    },
    {
      name: `First Principles Map`,
      line1: intelligence.firstPrinciplesBreakdown[0],
      line2: intelligence.firstPrinciplesBreakdown[1] ?? `The bedrock knowledge most people never reach`,
      benefit: `Understanding that compounds over time`,
    },
    {
      name: `The Paradox Resolved`,
      line1: `${intelligence.paradoxAtCore.slice(0, 90)}`,
      line2: `…and exactly what to do with that truth`,
      benefit: `The counterintuitive insight that unlocks everything`,
    },
    {
      name: `${architect.tableOfContents.length} Deep-Dive Chapters`,
      line1: `Every dimension of ${topic} covered at depth`,
      line2: `From foundation to advanced application`,
      benefit: `Complete mastery — not just awareness`,
    },
    {
      name: `Wisdom Layer`,
      line1: `Timeless principles applied to ${topic}`,
      line2: `${intelligence.wisdomPrinciples[0].principle.split("—")[0].trim()}`,
      benefit: `Depth that makes tactics obvious`,
    },
    {
      name: `Immediate Action Framework`,
      line1: `Specific moves after every chapter`,
      line2: `Not vague advice — exact steps for where you are`,
      benefit: `Progress from page one`,
    },
    {
      name: `Lifetime Access — No Subscriptions`,
      line1: `Pay once… use forever`,
      line2: `No monthly fees. No hidden costs.`,
      benefit: `One investment. Unlimited access.`,
    },
  ];

  const noMoreItems = [
    `No more consuming content without change`,
    `No more following advice that doesn't stick`,
    `No more knowing what to do but not doing it`,
    `No more starting over every time`,
    `No more working hard without getting results`,
    `No more guessing — just a clear system that works`,
  ];

  return {
    headline: `Here's Everything You're Getting Inside`,
    bullets,
    bestPartStatement: `And The Best Part?\n\nIt's built on the first principles of ${topic}. You don't just learn what to do — you understand WHY it works. Which means you can adapt it, apply it anywhere, and never need another resource on ${topic} again.`,
    noMoreItems,
  };
}

function buildHowItWorksSection(
  topic: string,
  productTitle: string,
  intelligence: ReturnType<typeof applyDeepIntelligence>
): LandingPageOutput["howItWorksSection"] {
  return {
    headline: `How ${productTitle.split(":")[0]} Works In 3 Simple Steps`,
    steps: [
      {
        number: 1,
        title: `Read The Root Cause Breakdown`,
        lines: [
          `Start with the first chapter`,
          `Understand what's actually happening in ${topic}`,
          `See the mechanism beneath the surface`,
        ],
        closingLine: `This single shift changes how you approach everything else.`,
      },
      {
        number: 2,
        title: `Apply The Framework`,
        lines: [
          `Use the step-by-step application chapters`,
          `Work through the specific actions at the end of each section`,
          `Build the understanding into actual behavior`,
        ],
        closingLine: `Not theory — real application with real checkpoints.`,
      },
      {
        number: 3,
        title: `Integrate & Let It Compound`,
        lines: [
          `The framework becomes automatic`,
          `Results compound as understanding deepens`,
          `${topic} stops being something you struggle with`,
        ],
        closingLine: `That's it. No complicated system. No daily willpower required.`,
      },
    ],
    closingLine: `Just understand the mechanism deeply… apply it once correctly… and let it compound forever.`,
  };
}

function buildIncomeStreamsSection(
  topic: string,
  domain: string,
  sellability: SellabilityOutput,
  seed: number
): LandingPageOutput["incomeStreamsSection"] {
  const streamsByDomain: Record<string, IncomeStream[]> = {
    business: [
      { title: `Start A High-Ticket Consulting Service`, description: `Apply the ${topic} framework to help clients`, deliverable: `Deliver results with proven methodology`, priceRange: `$500 – $5,000+ per engagement` },
      { title: `Launch Your Own Digital Product Line`, description: `Turn your mastery into a product suite`, deliverable: `Create once → system keeps producing → sell forever`, priceRange: `$47 – $497 per product` },
      { title: `Run A Group Coaching Program`, description: `Guide others through the framework in cohorts`, deliverable: `Set it up once → deliver to many → recurring income`, priceRange: `$200 – $2,000 per participant` },
    ],
    finance: [
      { title: `Financial Coaching Services`, description: `Help others apply the ${topic} framework`, deliverable: `Charge for clarity and system — not just information`, priceRange: `$200 – $2,000 per client` },
      { title: `Create A Financial Education Product`, description: `Turn the framework into a course or guide`, deliverable: `Create once → sell forever → passive income`, priceRange: `$97 – $497 per sale` },
      { title: `Affiliate & Referral Revenue`, description: `Recommend tools that complement the framework`, deliverable: `Passive income from your trusted recommendations`, priceRange: `$50 – $500 per referral` },
    ],
    default: [
      { title: `Teach The Framework To Others`, description: `Become a practitioner who helps others apply it`, deliverable: `Workshops, coaching, consulting — paid for your depth`, priceRange: `$100 – $1,000+ per engagement` },
      { title: `Create A Derivative Digital Product`, description: `Build a product based on your applied mastery`, deliverable: `Create once → sell forever`, priceRange: `$27 – $297 per sale` },
      { title: `Build An Authority Platform`, description: `Share the depth — build an audience that trusts you`, deliverable: `Long-term brand equity → multiple revenue streams`, priceRange: `Unlimited upside` },
    ],
  };

  const streams = streamsByDomain[domain] ?? streamsByDomain.default;

  return {
    headline: `Turn Your Mastery Into Multiple Income Streams`,
    subheadline: `Once you understand ${topic} at depth — this isn't just personal value. It becomes professional leverage.`,
    streams,
    whyItWorksStatement: `Why This Works So Well\n\nBecause depth is rare. Most people in ${topic} are operating at the surface level — following advice, not understanding mechanisms. The person who understands the root level becomes the trusted resource. And trusted resources get paid.`,
  };
}

function buildValueStackSection(
  topic: string,
  productTitle: string,
  architect: ArchitectOutput,
  sellability: SellabilityOutput,
  intelligence: ReturnType<typeof applyDeepIntelligence>
): LandingPageOutput["valueStackSection"] {
  const basePrice = sellability.pricingRecommendation.recommendedPrice;

  const items: ValueStackItem[] = [
    {
      title: `Lifetime Access to ${productTitle.split(":")[0]}`,
      description: `Full access to the complete system — including all future updates. This is the foundation everything else builds on.`,
      value: `$${basePrice * 3}`,
    },
    {
      title: `The Root Cause Breakdown`,
      description: `The first-principles analysis of ${topic} that most resources never reach. This single chapter is worth more than most entire books on the subject.`,
      value: `$${Math.round(basePrice * 1.5)}`,
    },
    {
      title: `${intelligence.thinkingFrameworks[0].name} Applied to ${topic}`,
      description: `${intelligence.thinkingFrameworks[0].applicationToTopic}. Structured as a complete framework with specific application steps.`,
      value: `$${Math.round(basePrice * 1.2)}`,
    },
    {
      title: `Complete ${architect.tableOfContents.length}-Chapter Deep Dive`,
      description: `Every dimension of ${topic} covered at the depth it deserves — from foundation to advanced integration.`,
      value: `$${Math.round(basePrice * 2)}`,
    },
    {
      title: `Wisdom Layer Integration`,
      description: `Timeless principles applied to ${topic} — the layer that separates knowledge from lasting transformation.`,
      value: `$${Math.round(basePrice * 0.8)}`,
    },
    ...sellability.bonusIdeas.slice(0, 3).map(b => ({
      title: `BONUS: ${b.title}`,
      description: b.description,
      value: b.perceivedValue.replace("perceived value", "").trim(),
    })),
    {
      title: `Future Updates — Included Free`,
      description: `As the understanding of ${topic} evolves, so does this resource. All updates delivered automatically.`,
      value: `PRICELESS`,
    },
    {
      title: `30-Day Risk-Free Guarantee`,
      description: `Read it. Apply it. If it doesn't shift how you understand and approach ${topic} — full refund. No questions.`,
      value: `Peace of Mind`,
    },
  ];

  const totalNominal = items
    .map(i => parseInt(i.value.replace(/\D/g, "")) || 0)
    .reduce((a, b) => a + b, 0);

  return {
    headline: `Everything You're Getting Today`,
    items,
    totalRealWorldValue: `Total Real-World Value: $${totalNominal.toLocaleString()}+`,
    todaysPrice: `Your Price Today?\n\nJust A Small One-Time Investment…\n\nToday Only — ${formatPrice(basePrice)}`,
    priceNote: `One-time. No subscriptions. No renewals. No hidden fees.\nPay once… own it forever.`,
    ctaButton: `👉 Click Here To Unlock ${productTitle.split(":")[0]} Now — ${formatPrice(basePrice)}`,
  };
}

function buildGuaranteeSection(
  topic: string,
  productTitle: string,
  sellability: SellabilityOutput
): LandingPageOutput["guaranteeSection"] {
  return {
    headline: `Your Purchase Is 100% Risk-Free\nWith Our 30-Day Guarantee`,
    body: `Here's the deal:\n\nIf you get ${productTitle.split(":")[0]} today and don't feel it delivers real understanding, a working framework, and actual results in your approach to ${topic}…\n\nWe don't want your money.`,
    bulletPoints: [
      `Our goal is simple: help you finally understand ${topic} at the level that changes things`,
      `Eliminate confusion, wasted effort, and recycled advice`,
      `Deliver results that make you say: "Why was I doing this the old way before?"`,
    ],
    closingLine: `If For Any Reason You're Not Completely Satisfied…\n\nJust let us know within 30 days.\n\nFull refund. No forms. No explanations. No hard feelings.`,
    refundNote: `You risk nothing. You gain everything.\n\nTest drive ${productTitle.split(":")[0]} today — fully protected.`,
  };
}

function buildComparisonSection(
  topic: string,
  productTitle: string,
  intelligence: ReturnType<typeof applyDeepIntelligence>
): LandingPageOutput["comparisonSection"] {
  return {
    headline: `Other ${topic} Resources vs ${productTitle.split(":")[0]}`,
    otherToolsLabel: `Most ${topic} Resources`,
    otherToolsItems: [
      `Address symptoms — not root causes`,
      `Generic advice that applies to everyone equally (meaning deeply to no one)`,
      `Tactical tips that require daily motivation to execute`,
      `Results that fade when momentum fades`,
      `Information you already have — repackaged`,
      `Written for everyone — built for no one specifically`,
      `Even the bestsellers in this category still require willpower-based execution`,
    ],
    productLabel: `${productTitle.split(":")[0]}`,
    productItems: [
      `${intelligence.rootCauseStatement.slice(0, 80)} — addressed at the root`,
      `Built on ${intelligence.thinkingFrameworks[0].name} — not recycled conventional advice`,
      `Framework-based — understanding that makes execution automatic`,
      `Results that compound because the mechanism is understood`,
      `First-principles depth — the understanding most resources never reach`,
      `Positioned for the specific person who has already tried the generic approaches`,
      `Built for understanding — which eliminates the willpower requirement`,
    ],
  };
}

function buildFAQSection(
  topic: string,
  research: ResearchOutput,
  intelligence: ReturnType<typeof applyDeepIntelligence>
): LandingPageOutput["faqSection"] {
  return {
    headline: `Questions Worth Answering Honestly`,
    faqs: [
      {
        question: `I've tried other resources on ${topic} and they didn't work. Why is this different?`,
        answer: `Most resources address ${topic} at the symptom level. This addresses it at the root. ${intelligence.rootCauseStatement} That's the specific thing most resources never touch — which is why the results from those resources don't hold up.`,
      },
      {
        question: `How long does it take to see results?`,
        answer: `The first shift happens in the first chapter — when you understand the root cause, your entire approach changes. Behavioral results typically follow within weeks of applying the framework. The deeper the understanding, the more automatic the right actions become.`,
      },
      {
        question: `Is this for beginners or advanced?`,
        answer: `Both. Beginners get a foundation most advanced practitioners never actually built. Advanced practitioners will finally understand why their results have plateaued — and what to do about it. The framework meets you at your current level.`,
      },
      {
        question: `What if I don't have time to read a full system?`,
        answer: `The absence of a clear framework is what creates the time problem. The chapters are structured to deliver value in short reading sessions — and each chapter has immediate action steps, so you get results as you read, not just after you finish.`,
      },
      {
        question: `Do I need any prior knowledge of ${topic}?`,
        answer: `No. The system starts from first principles — the bedrock of what actually makes ${topic} work. Whether you're starting fresh or restarting after previous attempts, the foundation is built for you.`,
      },
      {
        question: `What does the 30-day guarantee cover?`,
        answer: `Everything. Read the entire system. Apply the framework. If you don't feel it delivered a fundamentally different understanding of ${topic} — email us and you get a full refund. No forms. No explanations required.`,
      },
    ],
  };
}

// ─── Full page markdown builder ───────────────────────────────────────────────

function buildFullPageMarkdown(page: Omit<LandingPageOutput, "fullPageMarkdown" | "sections" | "abTestIdeas" | "copywritingNotes">): string {
  const { heroSection: hero, problemAgitationSection: prob, introducingSection: intro,
    featuresSection: feat, howItWorksSection: hiw, incomeStreamsSection: income,
    valueStackSection: vs, guaranteeSection: guar, finalCtaSection: cta,
    comparisonSection: comp, faqSection: faq } = page;

  const lines: string[] = [];

  // ── HERO ──────────────────────────────────────────────────────────────────
  lines.push(`# ${hero.headline}`);
  lines.push(`\n## ${hero.subheadline}`);
  lines.push(`\n**${hero.powerLine}**`);
  lines.push(`\n> ${hero.noObjestions}`);
  lines.push(`\n---\n`);
  hero.featureBullets.slice(0, 5).forEach(b => {
    lines.push(`**${b.name}**`);
    lines.push(`${b.line1}`);
    lines.push(`${b.line2}`);
    lines.push(`👉${b.benefit}\n`);
  });
  lines.push(`\n⚡ **${hero.urgencyBanner}**`);
  lines.push(`\n> *${hero.priceAnchor}*`);
  lines.push(`\n## ${hero.ctaButton}`);

  // ── PROBLEM ───────────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${prob.headline}`);
  lines.push(`\n${prob.openingNarrative}`);
  lines.push(`\n**From:**`);
  prob.fromToShift.from.forEach(i => lines.push(`- ${i}`));
  lines.push(`\n**To:**`);
  prob.fromToShift.to.forEach(i => lines.push(`- ${i}`));
  lines.push(`\n${prob.bridgeLine}`);
  lines.push(`\n### ${prob.problemStatement}`);
  prob.deeperProblemItems.forEach(i => lines.push(`- ${i}`));
  lines.push(`\n---`);
  lines.push(`\n## ${prob.soBigQuestion}`);

  // ── INTRODUCING ───────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`# ${intro.dramaticReveal}`);
  lines.push(`\n### ${intro.tagline}`);
  lines.push(`\n**${intro.oldWayLabel}**`);
  intro.oldWayItems.forEach(i => lines.push(`${i}`));
  lines.push(`\n**${intro.newWayLabel}**`);
  intro.newWayItems.forEach(i => lines.push(`${i}`));

  // ── FEATURES ──────────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${feat.headline}`);
  feat.bullets.forEach(b => {
    lines.push(`\n**✅ ${b.name}**`);
    lines.push(`${b.line1}`);
    lines.push(`${b.line2}`);
    lines.push(`👉${b.benefit}`);
  });
  lines.push(`\n---`);
  lines.push(`\n${feat.bestPartStatement}`);
  lines.push(`\n${feat.noMoreItems.map(i => `- ${i}`).join("\n")}`);

  // ── HOW IT WORKS ──────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${hiw.headline}`);
  hiw.steps.forEach(step => {
    lines.push(`\n### Step ${step.number}: ${step.title}`);
    step.lines.forEach(l => lines.push(`${l}`));
    lines.push(`\n*${step.closingLine}*`);
  });
  lines.push(`\n> **${hiw.closingLine}**`);

  // ── INCOME STREAMS ────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${income.headline}`);
  lines.push(`\n*${income.subheadline}*`);
  income.streams.forEach(s => {
    lines.push(`\n**${s.title}**`);
    lines.push(`${s.description}`);
    lines.push(`${s.deliverable}`);
    lines.push(`👉 Charge: ${s.priceRange}`);
  });
  lines.push(`\n---`);
  lines.push(`\n${income.whyItWorksStatement}`);

  // ── COMPARISON ────────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${comp.headline}`);
  lines.push(`\n**${comp.otherToolsLabel}**`);
  comp.otherToolsItems.forEach(i => lines.push(`❌ ${i}`));
  lines.push(`\n**${comp.productLabel}**`);
  comp.productItems.forEach(i => lines.push(`✅ ${i}`));

  // ── VALUE STACK ───────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${vs.headline}`);
  vs.items.forEach(item => {
    lines.push(`\n**${item.title}** *(Value: ${item.value})*`);
    lines.push(`${item.description}`);
  });
  lines.push(`\n---`);
  lines.push(`\n## ${vs.totalRealWorldValue}`);
  lines.push(`\n## ${vs.todaysPrice}`);
  lines.push(`\n*${vs.priceNote}*`);
  lines.push(`\n## ${vs.ctaButton}`);

  // ── FAQ ───────────────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${faq.headline}`);
  faq.faqs.forEach(f => {
    lines.push(`\n**Q: ${f.question}**`);
    lines.push(`\n${f.answer}`);
  });

  // ── GUARANTEE ─────────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${guar.headline}`);
  lines.push(`\n${guar.body}`);
  guar.bulletPoints.forEach(b => lines.push(`✅ ${b}`));
  lines.push(`\n${guar.closingLine}`);
  lines.push(`\n> **${guar.refundNote}**`);

  // ── FINAL CTA ─────────────────────────────────────────────────────────────
  lines.push(`\n---\n`);
  lines.push(`## ${cta.headline}`);
  cta.bulletPoints.forEach(b => lines.push(`✅ ${b}`));
  lines.push(`\n## ${cta.ctaButton}`);
  lines.push(`\n*${cta.guaranteeReminder}*`);

  return lines.join("\n");
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function runLandingPageEngine(
  topic: string,
  research: ResearchOutput,
  architect: ArchitectOutput,
  sellability: SellabilityOutput,
  marketing: MarketingOutput,
  variation: number = 1
): LandingPageOutput {
  const domain = detectDomain(topic);
  const seed = h(topic + variation);
  const intelligence = applyDeepIntelligence(topic, variation);
  const productTitle = sellability.revisedTitle;

  const heroSection = buildHeroSection(topic, productTitle, research, sellability, intelligence, domain, seed);
  const problemAgitationSection = buildProblemAgitationSection(topic, research, intelligence, domain, seed);
  const introducingSection = buildIntroducingSection(topic, productTitle, sellability, intelligence, domain);
  const featuresSection = buildFeaturesSection(topic, architect, sellability, intelligence);
  const howItWorksSection = buildHowItWorksSection(topic, productTitle, intelligence);
  const incomeStreamsSection = buildIncomeStreamsSection(topic, domain, sellability, seed);
  const valueStackSection = buildValueStackSection(topic, productTitle, architect, sellability, intelligence);
  const comparisonSection = buildComparisonSection(topic, productTitle, intelligence);
  const faqSection = buildFAQSection(topic, research, intelligence);

  const guaranteeSection = buildGuaranteeSection(topic, productTitle, sellability);

  const finalCtaSection: LandingPageOutput["finalCtaSection"] = {
    headline: `Ready To Finally Understand ${topic} At The Level That Changes Things?`,
    bulletPoints: [
      `Instant digital delivery — start within minutes`,
      `Complete ${architect.tableOfContents.length}-chapter deep-dive system`,
      `First-principles framework — not recycled advice`,
      `Root cause addressed — not just the symptoms`,
      `Lifetime access — no subscriptions, ever`,
      `Future updates included automatically`,
      `Fully protected by the 30-day guarantee`,
    ],
    ctaButton: heroSection.ctaButton,
    guaranteeReminder: `Fully Protected By Our 30-Day Risk-Free Guarantee`,
  };

  const pageData = {
    pageTitle: `${productTitle} — ${heroSection.headline.slice(0, 50)}`,
    metaDescription: sellability.improvedUVP.slice(0, 155),
    heroSection,
    problemAgitationSection,
    introducingSection,
    featuresSection,
    howItWorksSection,
    incomeStreamsSection,
    valueStackSection,
    guaranteeSection,
    finalCtaSection,
    comparisonSection,
    faqSection,
  };

  const fullPageMarkdown = buildFullPageMarkdown(pageData);

  const sections: LandingPageSection[] = [
    { sectionId: "hero", name: "Hero", headline: heroSection.headline, content: heroSection.noObjestions, copywritingNote: "Lead with the bold promise — then immediately crush the top 3 objections with 'No X. No Y. No Z.'" },
    { sectionId: "problem", name: "Problem Agitation", headline: problemAgitationSection.headline, content: problemAgitationSection.openingNarrative.slice(0, 120), copywritingNote: "Short sentences. One idea per line. Build the pain before offering any solution." },
    { sectionId: "introducing", name: "Introducing", headline: introducingSection.dramaticReveal, content: introducingSection.tagline, copywritingNote: "INTRODUCING with spaced letters creates a dramatic pause. Old Way vs New Way is the most powerful contrast frame in direct response." },
    { sectionId: "features", name: "Features", headline: featuresSection.headline, content: featuresSection.bullets[0].name, copywritingNote: "Name → 2 benefit lines → 👉 single bottom-line benefit. Never more than 3 lines per bullet." },
    { sectionId: "how-it-works", name: "How It Works", headline: howItWorksSection.headline, content: "3-step system", copywritingNote: "3 steps maximum. Each step should feel simple. End with 'That's it.' — it removes anxiety about complexity." },
    { sectionId: "income", name: "Income Streams", headline: incomeStreamsSection.headline, content: incomeStreamsSection.subheadline, copywritingNote: "Show them how to make money WITH the product — this converts desire into urgency by showing ROI." },
    { sectionId: "value-stack", name: "Value Stack", headline: valueStackSection.headline, content: valueStackSection.totalRealWorldValue, copywritingNote: "List every component with a dollar value. Make the total outrageous. Then reveal a tiny price. The contrast does the work." },
    { sectionId: "comparison", name: "Comparison", headline: comparisonSection.headline, content: "❌ vs ✅", copywritingNote: "❌ for competitor items, ✅ for your product. Never attack by name — attack by behavior." },
    { sectionId: "guarantee", name: "Guarantee", headline: guaranteeSection.headline, content: guaranteeSection.body.slice(0, 80), copywritingNote: "Personal, direct language. 'We don't want your money.' is more powerful than any legal guarantee phrasing." },
    { sectionId: "cta", name: "Final CTA", headline: finalCtaSection.headline, content: finalCtaSection.ctaButton, copywritingNote: "Last thing they read before deciding = the transformation + risk reversal. Never end on price." },
  ];

  return {
    ...pageData,
    fullPageMarkdown,
    sections,
    abTestIdeas: [
      `Hero A: Lead with desire ("Finally ${research.audienceProfile.desires[0]}") vs Hero B: Lead with pain ("Still struggling with ${research.audienceProfile.painPoints[0]}?")`,
      `CTA button copy: "👉 Click Here To Get Access Now" vs "👉 Yes — I Want The Framework" vs "👉 Get Instant Access — ${formatPrice(sellability.pricingRecommendation.recommendedPrice)}"`,
      `Comparison section: Above value stack vs below value stack — skeptics need it first; believers need the price first`,
      `Guarantee placement: After features vs after pricing — test which removes more objection friction`,
      `Income streams section: Include vs remove — converts differently for B2B vs B2C audiences`,
    ],
    copywritingNotes: [
      `Short sentences. One idea per line. This is the #1 rhythm lesson from direct response copy.`,
      `Ellipsis (…) creates dramatic pause and builds anticipation — use before reveals and transitions.`,
      `👉 emoji arrows as visual bullet points — they draw the eye and signal a benefit, not a feature.`,
      `"No X. No Y. No Z." triples — three objection crushers in one line, works in hero and feature bullets.`,
      `The INTRODUCING reveal (I N T R O D U C I N G with spaces) creates a dramatic pause in the scroll.`,
      `Value stack psychology: the total value should be 8-15x the actual price for maximum contrast effect.`,
      `Guarantee language: "We don't want your money" is more disarming than any formal guarantee phrasing.`,
      intelligence.sellabilityDepthLayer.authorityAngle,
      intelligence.sellabilityDepthLayer.urgencyTruth,
    ],
  };
}
