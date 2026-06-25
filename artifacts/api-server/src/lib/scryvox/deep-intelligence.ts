/**
 * Scryvox Deep Intelligence Layer
 *
 * This module is the cognitive core of Scryvox. It does NOT call external APIs.
 * It applies deep thinking, deep reasoning, deep wisdom, and deep knowledge
 * internally — refining raw user input into intellectually elevated framings
 * that power every downstream engine.
 *
 * Nothing that enters Scryvox exits the same way it arrived.
 */

export interface IntentFrame {
  type: "practical_howto" | "conceptual_understanding" | "philosophical_exploration";
  userQuestion: string;
  desiredOutcome: string;
  practicalFocus: string;
  actionableScope: string;
  contentRatio: { practical: number; mindset: number };
  validationQuestion: string;
  specificMethods: string[];
  exampleScenario: string;
}

export interface DeepFrame {
  refinedTopic: string;
  philosophicalRoot: string;
  firstPrinciplesBreakdown: string[];
  systemsThinkingLens: string;
  wisdomLayer: string;
  cognitiveDepthLevel: "surface" | "structural" | "philosophical" | "transcendent";
  intellectualReframe: string;
  rootCauseStatement: string;
  paradoxAtCore: string;
  deepQuestion: string;
  knowledgeDomains: string[];
  thinkingFrameworks: ThinkingFramework[];
  reasoningChain: string[];
  wisdomPrinciples: WisdomPrinciple[];
  knowledgeSynthesis: string;
  pdfStructureHints: PDFStructureHint;
  landingPageIntelligence: LandingPageIntelligence;
  researchDepthLayer: ResearchDepthLayer;
  sellabilityDepthLayer: SellabilityDepthLayer;
  intentFrame: IntentFrame;
}

export interface ThinkingFramework {
  name: string;
  lens: string;
  applicationToTopic: string;
  deeperQuestion: string;
}

export interface WisdomPrinciple {
  principle: string;
  source: string;
  applicationToTopic: string;
  counterintuitiveDimension: string;
}

export interface PDFStructureHint {
  executiveSummaryAngle: string;
  coreThesisStatement: string;
  chapterProgressionLogic: string;
  deepDiveCallouts: string[];
  synthesisFramework: string;
  readerTransformation: string;
}

export interface LandingPageIntelligence {
  desireAtRoot: string;
  fearAtRoot: string;
  heroPromise: string;
  emotionalEntry: string;
  intellectualEntry: string;
  painAmplification: string;
  transformationArc: string;
  trustArchitecture: string;
  ctaPhilosophy: string;
  objections: { objection: string; reframe: string }[];
}

export interface ResearchDepthLayer {
  marketGapStatement: string;
  buyerPsychologyDepth: string;
  competitorWeakness: string;
  hiddenDesire: string;
  beliefThatMustShift: string;
  jtbdStatement: string;
  statusQuoBias: string;
}

export interface SellabilityDepthLayer {
  emotionalTriggers: string[];
  objectionMatrix: { objection: string; dissolveWith: string }[];
  authorityAngle: string;
  socialProofType: string;
  urgencyTruth: string;
  valuePerceptionShift: string;
  priceAnchoring: string;
}

const FIRST_PRINCIPLES_MAP: Record<string, string[]> = {
  mindset: [
    "Identity precedes behavior — who you are determines what you do, automatically",
    "The brain is a prediction machine, not a truth machine — it confirms what it already believes",
    "Neuroplasticity means the mind is perpetually editable, but only under specific conditions",
    "Resistance to change is not weakness — it is the nervous system performing its job correctly",
    "The gap between knowing and doing is not informational — it is neurological and identity-based",
  ],
  productivity: [
    "Energy is the fundamental resource — time is infinite, energy is finite and cyclical",
    "Attention is the rarest and most valuable currency in the modern economy",
    "Systems produce behavior; willpower merely delays behavior — only one scales",
    "Elimination is always more powerful than optimization at the wrong level",
    "The Pareto principle applies recursively — 4% of actions produce 64% of results",
  ],
  finance: [
    "Compound interest is the most powerful force known to wealth accumulation — time amplifies it",
    "Assets generate income; liabilities consume it — everything reduces to this distinction",
    "Risk and return are inseparable — the question is never 'how to avoid risk' but 'which risk to take'",
    "Behavior determines financial outcomes more than knowledge — psychology is the actual variable",
    "Inflation is a hidden tax that punishes inaction — doing nothing is a financial decision",
  ],
  business: [
    "Value creation precedes value capture — all sustainable business reverses from customer outcome",
    "Positioning determines price ceiling more than quality does — perception is the market",
    "Systems thinking: every business problem is a symptom of a structural flaw, not a people flaw",
    "The unit economics must work before scale — scaling a broken model accelerates failure",
    "Distribution is the moat — the best product rarely wins; the best-distributed one does",
  ],
  health: [
    "The body is a self-regulating system — interference often disrupts more than it helps",
    "Sleep is the master performance variable — everything else runs downstream of it",
    "Inflammation is the common mechanism of virtually all chronic disease",
    "The gut microbiome is a second brain — its health determines mood, cognition, and immunity",
    "Recovery is not the absence of training — it is when adaptation actually occurs",
  ],
  default: [
    "First principles thinking requires asking 'why' five times to reach the actual root",
    "Every surface problem has a structural cause — tactics address symptoms, principles address roots",
    "The map is not the territory — our mental model of a problem is always incomplete",
    "Feedback loops determine whether a system improves or degrades over time",
    "Complexity emerges from simple rules — deep understanding simplifies, it does not complicate",
  ],
};

const THINKING_FRAMEWORKS: ThinkingFramework[] = [
  {
    name: "Systems Thinking",
    lens: "Everything is a system with feedback loops, emergence, and leverage points",
    applicationToTopic: "Identify the reinforcing and balancing loops that maintain the current state",
    deeperQuestion: "What is the feedback loop that keeps this problem stable despite efforts to change it?",
  },
  {
    name: "Inversion",
    lens: "Instead of asking how to succeed, ask how to reliably fail — then don't do that",
    applicationToTopic: "What are all the ways this goes wrong consistently? Avoid those precisely.",
    deeperQuestion: "What guaranteed path to failure, if understood clearly, reveals the true path to success?",
  },
  {
    name: "Second-Order Thinking",
    lens: "Every action has first-order effects (obvious) and second-order effects (consequential)",
    applicationToTopic: "The visible solution often creates invisible second-order problems — trace the chain",
    deeperQuestion: "If everyone followed the conventional advice on this, what would actually happen at scale?",
  },
  {
    name: "Mental Models Stack",
    lens: "The most useful thinkers carry a diverse toolkit of mental models from multiple disciplines",
    applicationToTopic: "Borrow frameworks from unrelated domains — physics, biology, economics, psychology",
    deeperQuestion: "What would a biologist, an economist, and a philosopher each say about this problem?",
  },
  {
    name: "Socratic Inquiry",
    lens: "Knowledge is revealed through rigorous questioning, not assertion",
    applicationToTopic: "Every assumption embedded in the topic must be examined and challenged",
    deeperQuestion: "What do we assume to be true about this that we have never actually tested?",
  },
  {
    name: "Dialectical Synthesis",
    lens: "Truth emerges from the tension between opposing ideas — thesis, antithesis, synthesis",
    applicationToTopic: "What is the conventional view (thesis) and its opposite (antithesis)? What synthesis emerges?",
    deeperQuestion: "What truth do both sides of the debate about this contain that the other side refuses to admit?",
  },
  {
    name: "First Principles Decomposition",
    lens: "Strip away assumptions until you reach bedrock truths, then reason upward from there",
    applicationToTopic: "What cannot be further reduced about this topic? Build from that foundation.",
    deeperQuestion: "If you could know only one thing about this with certainty, what would it be — and why?",
  },
  {
    name: "Emergence and Complexity",
    lens: "Complex outcomes emerge from simple, consistent rules — understanding the rules changes everything",
    applicationToTopic: "What simple rule, consistently followed, produces the complex outcome we seek?",
    deeperQuestion: "What is the smallest, most consistent action that compounds into the largest long-term result?",
  },
];

const WISDOM_PRINCIPLES: WisdomPrinciple[] = [
  {
    principle: "The obstacle is the way — resistance reveals the path",
    source: "Stoic philosophy (Marcus Aurelius, Epictetus)",
    applicationToTopic: "What appears to block progress in this domain is often the exact thing to move through, not around",
    counterintuitiveDimension: "The difficulty itself contains the instruction — avoiding it guarantees stagnation",
  },
  {
    principle: "Know thyself — self-knowledge is the precondition of all mastery",
    source: "Socratic philosophy, Delphic maxim",
    applicationToTopic: "Understanding your own patterns, blindspots, and defaults is the leverage point beneath all others",
    counterintuitiveDimension: "External knowledge without internal knowledge creates sophistication without wisdom",
  },
  {
    principle: "The Tao that can be named is not the eternal Tao — reality exceeds all models",
    source: "Laozi, Taoism",
    applicationToTopic: "Every framework for understanding this topic is a useful approximation, not the truth itself",
    counterintuitiveDimension: "Certainty is a warning sign — the most sophisticated understanding holds complexity without resolving it prematurely",
  },
  {
    principle: "Begin with the end in mind — structure precedes execution",
    source: "Stephen Covey, synthesizing Aristotle's teleological ethics",
    applicationToTopic: "The outcome must be clearly defined before any tactical decision makes sense",
    counterintuitiveDimension: "Most failure comes not from wrong action but from right action in the wrong direction",
  },
  {
    principle: "Amor fati — love what is, as the ground from which transformation grows",
    source: "Nietzsche, synthesizing Stoic acceptance",
    applicationToTopic: "Deep acceptance of current reality, without resignation, is the precondition of genuine change",
    counterintuitiveDimension: "Fighting reality consumes the energy needed to change it",
  },
  {
    principle: "Wu wei — effortless action aligned with the nature of the situation",
    source: "Taoist philosophy",
    applicationToTopic: "The highest-leverage action in this domain is often the one with the least visible effort — because it aligns with the grain rather than against it",
    counterintuitiveDimension: "Forcing produces resistance; aligning produces movement",
  },
  {
    principle: "Episteme over doxa — knowledge over mere opinion requires systematic inquiry",
    source: "Plato, Aristotle",
    applicationToTopic: "Most conventional wisdom in this domain is doxa — believed without examination. True understanding requires episteme.",
    counterintuitiveDimension: "Confident ignorance is more dangerous than acknowledged uncertainty",
  },
  {
    principle: "The map is not the territory — all representations are partial",
    source: "Alfred Korzybski, general semantics",
    applicationToTopic: "Every framework, model, and framework offered in this space is useful but incomplete",
    counterintuitiveDimension: "Attachment to any single model limits what can be seen",
  },
];

const PHILOSOPHICAL_ROOTS: Record<string, string> = {
  mindset: "The examined life — Socrates' assertion that unexamined assumptions run most lives without consent",
  productivity: "The ethics of time — Seneca's assertion that life is not short, only poorly used",
  finance: "The nature of value — what humans genuinely seek is security and optionality, not money itself",
  business: "Exchange theory — value creation as the fundamental act that sustains human cooperation",
  health: "Wholeness — the ancient understanding that body, mind, and environment are a single system",
  relationships: "The nature of the self — you cannot give what you do not have; the self precedes the connection",
  career: "Contribution and identity — work as the primary arena in which character is built or eroded",
  creativity: "The drive to make — creative expression as one of the few acts that makes humans feel genuinely alive",
  technology: "Tool vs. master — the technology that was meant to serve often becomes the architecture of constraint",
  education: "The transformation of mind — Aristotle: 'The roots of education are bitter, but the fruit is sweet'",
  default: "The gap between being and becoming — the universal human experience of knowing what is possible and not yet living it",
};

const PARADOXES: Record<string, string> = {
  mindset: "The harder you try to change yourself, the more you reinforce the self that needs changing",
  productivity: "The more you try to optimize time, the more time the optimization consumes",
  finance: "Money pursued directly tends to flee; money that follows from value creation accumulates",
  business: "The businesses that focus least on profit often generate the most of it",
  health: "Optimizing health obsessively can become its own source of stress — the very thing health was meant to resolve",
  relationships: "The more you try to make someone love you, the less authentic the love that follows",
  career: "The pursuit of career success through safe choices often produces the very stagnation it was meant to avoid",
  creativity: "Trying to be original produces imitation; releasing the need for originality often produces it",
  technology: "The tools designed to give us more time consistently consume more of it than they save",
  education: "The harder we try to teach, the less students learn; discovery produces deeper learning than instruction",
  default: "The solution to most problems cannot be reached by direct assault — it requires an oblique approach",
};

const SYSTEMS_LENSES: Record<string, string> = {
  mindset: "The identity system: beliefs → emotions → behaviors → results → reinforced beliefs. The loop runs automatically until the identity component is addressed directly.",
  productivity: "The energy system: recovery → capacity → output → depletion → recovery. Time management without energy management is attempting to run a machine without fuel.",
  finance: "The compound system: small consistent inputs × time × rate of return = disproportionate outputs. The leverage is in time, not amount.",
  business: "The value system: customer problem → unique solution → delivery → outcome → proof → customer problem (for the next buyer). Every break in this chain is a leak.",
  health: "The homeostatic system: the body is always moving toward equilibrium. Change requires consistently overriding equilibrium until a new set point is established.",
  relationships: "The attachment system: early experiences wire neural pathways for connection. Adult relationships run largely on these early templates unless consciously examined.",
  career: "The reputation system: skills build slowly, reputation builds on reputation, opportunities compound on opportunities. The input is invisible; the output seems sudden.",
  creativity: "The iteration system: volume produces variance, variance contains quality, quality compounds into mastery. The creative block is a failure of volume, not talent.",
  technology: "The attention economy system: platforms are engineered to maximize engagement through dopamine loops. Individual resistance requires structural design, not willpower.",
  education: "The encoding system: information → understanding → application → reflection → integration. Most learning fails at the application stage and never achieves integration.",
  default: "The feedback loop: current state → action → outcome → measurement → adjusted action → improved outcome. The system improves only when feedback is clear, honest, and acted upon.",
};

const ROOT_CAUSE_TEMPLATES: Record<string, string> = {
  mindset: "The root cause is almost never a lack of knowledge or motivation. It is an identity structure that predicts the current outcome and protects itself against change.",
  productivity: "The root cause is not poor time management — it is poor energy architecture and a failure to identify the 20% of work that produces 80% of meaningful results.",
  finance: "The root cause is a broken money identity formed in early life and never consciously updated — the behaviors are symptoms of a self-concept, not failures of discipline.",
  business: "The root cause is unclear positioning — the market cannot clearly understand why this exists for exactly them. Everything downstream of unclear positioning produces random results.",
  health: "The root cause is the failure to treat health as a system rather than a collection of isolated behaviors — which means optimizing one variable while degrading another.",
  default: "The root cause sits two or three levels below the visible symptom. What presents as a tactics problem is almost always an identity, framework, or systems-thinking problem.",
};

function hashTopic(topic: string, variation: number): number {
  let h = variation * 9973;
  for (let i = 0; i < topic.length; i++) h = (h * 31 + topic.charCodeAt(i)) & 0xffffffff;
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function pickN<T>(arr: T[], seed: number, n: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) result.push(arr[(seed + i * 7) % arr.length]);
  return result;
}

// ── Intent Detection ──────────────────────────────────────────────────────────
// Determines what the user is actually asking for so the engine serves
// the right content type: practical how-to vs conceptual vs philosophical.

const HOWTO_SIGNALS = [
  /\bhow (to|do|can|should)\b/i,
  /\bways? to\b/i,
  /\bmethods? (for|to)\b/i,
  /\bsteps? (to|for)\b/i,
  /\btips? (to|for|on)\b/i,
  /\bstrategies? (to|for)\b/i,
  /\bguide (to|for|on)\b/i,
  /\bstart(ing)?\b/i,
  /\bearn(ing)?\b/i,
  /\bmake (\$|money|income)\b/i,
  /\$\d/,
  /\bper (month|week|day|year)\b/i,
  /\bside hustle\b/i,
  /\bpassive income\b/i,
  /\blose weight\b/i,
  /\bbuild (muscle|a business|an audience)\b/i,
  /\bget (clients|customers|subscribers|followers|hired|promoted)\b/i,
  /\blaunch\b/i,
  /\bsell(ing)?\b/i,
  /\bincrease (sales|revenue|income|traffic)\b/i,
  /\bgrow (my|a|an|your)\b/i,
];

const INCOME_METHOD_MAP: Record<string, string[]> = {
  freelancing: ["freelancing", "consulting", "client work", "service-based income", "retainer work"],
  digital_products: ["digital products", "ebooks", "online courses", "templates", "Notion templates", "printables"],
  content: ["content creation", "YouTube channel", "newsletter", "blogging", "podcasting"],
  ecommerce: ["e-commerce", "dropshipping", "print-on-demand", "Etsy shop", "online store"],
  affiliate: ["affiliate marketing", "referral commissions", "sponsored content"],
  tutoring: ["tutoring", "coaching", "online lessons", "teaching skills"],
  gig: ["gig work", "task-based income", "Fiverr", "Upwork", "platform work"],
};

function detectIntent(topic: string): IntentFrame {
  const t = topic.toLowerCase();
  const isHowTo = HOWTO_SIGNALS.some(signal => signal.test(topic));

  // Extract dollar amount if present
  const dollarMatch = topic.match(/\$?([\d,]+)\s*(k|K)?(?:\s*(?:per|\/)\s*(?:month|week|day|year))?/);
  const targetAmount = dollarMatch ? dollarMatch[0] : "";

  // Detect income-specific intent
  const isIncome = /\b(earn|make|income|revenue|money|per month|per week|side hustle|passive income)\b/i.test(topic);

  const isHealthAction = /\b(lose|gain|build|get fit|workout|diet|eat)\b/i.test(topic);
  const isBusinessAction = /\b(start|launch|grow|scale|build|get clients|sell)\b/i.test(topic);

  if (isHowTo || isIncome || isHealthAction || isBusinessAction) {
    // Practical how-to intent
    const desiredOutcome = isIncome && targetAmount
      ? `earn ${targetAmount} consistently`
      : isIncome
        ? "generate reliable extra income"
        : `achieve the specific result: "${topic}"`;

    const methods = isIncome
      ? [
          INCOME_METHOD_MAP.freelancing[0],
          INCOME_METHOD_MAP.digital_products[0],
          INCOME_METHOD_MAP.content[0],
          INCOME_METHOD_MAP.ecommerce[0],
          INCOME_METHOD_MAP.affiliate[0],
        ]
      : isHealthAction
        ? ["caloric deficit protocol", "strength training program", "habit stacking system", "meal prep strategy", "progressive overload plan"]
        : isBusinessAction
          ? ["positioning strategy", "client acquisition system", "offer validation method", "outreach framework", "content marketing engine"]
          : ["step-by-step implementation plan", "skills audit", "quick-win method", "system building approach", "feedback loop setup"];

    const scenario = isIncome
      ? `Someone currently earning nothing online builds to ${targetAmount || "$2,000"}/month in 90 days by starting with one income stream, validating it, and scaling.`
      : `Someone starting from scratch uses this step-by-step framework to achieve "${topic}" within 60–90 days by focusing only on proven methods.`;

    return {
      type: "practical_howto",
      userQuestion: topic,
      desiredOutcome,
      practicalFocus: `Practical, step-by-step guide to ${topic} — focused on specific methods, real examples, and actions you can take this week`,
      actionableScope: `${topic}: proven methods, implementation steps, real-world examples, and a clear action plan`,
      contentRatio: { practical: 75, mindset: 25 },
      validationQuestion: `Does every section directly help the reader achieve "${desiredOutcome}"? If not, rewrite it.`,
      specificMethods: methods,
      exampleScenario: scenario,
    };
  }

  if (/\bwhy\b|\bwhat is\b|\bunderstand\b|\bexplain\b|\bmeaning of\b/i.test(topic)) {
    return {
      type: "conceptual_understanding",
      userQuestion: topic,
      desiredOutcome: `clearly understand ${topic}`,
      practicalFocus: `Clear explanation of ${topic} with practical context`,
      actionableScope: topic,
      contentRatio: { practical: 55, mindset: 45 },
      validationQuestion: `Does this article leave the reader with a clear, complete understanding of ${topic}?`,
      specificMethods: ["concept breakdown", "real-world analogy", "example-based explanation"],
      exampleScenario: `A curious reader goes from confused about ${topic} to able to explain it clearly and apply it.`,
    };
  }

  // Default: philosophical/conceptual exploration
  return {
    type: "philosophical_exploration",
    userQuestion: topic,
    desiredOutcome: `develop a deep, nuanced understanding of ${topic}`,
    practicalFocus: `Deep exploration of ${topic} — principles, frameworks, and transformative insights`,
    actionableScope: topic,
    contentRatio: { practical: 40, mindset: 60 },
    validationQuestion: `Does this article shift how the reader thinks about ${topic} in a lasting, meaningful way?`,
    specificMethods: ["framework analysis", "principle extraction", "case study synthesis"],
    exampleScenario: `A thoughtful reader fundamentally changes how they approach ${topic} after reading this.`,
  };
}

function detectDomain(topic: string): string {
  const t = topic.toLowerCase();
  // Check income/earning first — it's the most commonly misclassified intent
  const incomeSignals = ["make money", "earn money", "per month", "per week", "side hustle", "passive income", "extra income", "online income"];
  if (incomeSignals.some(s => t.includes(s)) || /make \$|earn \$|\$\d+/.test(t)) return "income";

  const checks: [string, string[]][] = [
    ["mindset", ["mindset", "belief", "confidence", "mental", "psychology", "habit", "anxiety", "fear", "discipline", "willpower", "self"]],
    ["productivity", ["productivity", "time", "efficiency", "focus", "procrastination", "organize", "schedule", "task", "output", "deep work"]],
    ["finance", ["money", "finance", "wealth", "invest", "income", "budget", "financial", "rich", "debt", "savings", "asset", "passive"]],
    ["business", ["business", "startup", "entrepreneur", "marketing", "sales", "customer", "brand", "strategy", "market", "revenue", "launch"]],
    ["health", ["health", "fitness", "exercise", "nutrition", "diet", "wellness", "body", "weight", "sleep", "energy", "stress", "recovery"]],
    ["relationships", ["relationship", "love", "partner", "dating", "marriage", "family", "friend", "communication", "trust", "connection"]],
    ["career", ["career", "job", "work", "professional", "success", "leadership", "promotion", "salary", "skill", "network", "opportunity"]],
    ["creativity", ["creative", "art", "write", "design", "idea", "innovation", "content", "storytelling", "music", "imagination", "craft"]],
    ["technology", ["technology", "ai", "digital", "software", "app", "automation", "data", "code", "tech", "algorithm", "machine"]],
    ["education", ["learn", "education", "study", "knowledge", "skill", "teach", "training", "course", "understand", "memory", "mastery"]],
  ];
  for (const [domain, keywords] of checks) {
    if (keywords.some(k => t.includes(k))) return domain;
  }
  return "default";
}

function refineTopicIntellectually(topic: string, domain: string, seed: number, intentType: string): string {
  // For practical how-to topics, produce an action-focused refinement — not philosophical
  if (intentType === "practical_howto") {
    const practicalPatterns: Record<string, string[]> = {
      income: [
        `Step-by-step income generation: the proven methods for reaching ${topic} consistently`,
        `${topic}: specific income streams, implementation timelines, and what actually works`,
        `From zero to ${topic}: the practical roadmap based on what real people have done`,
        `How to actually achieve ${topic}: the methods, the timeline, and the common mistakes to skip`,
        `${topic} — a practical system: which income streams to start, how to validate them, and how to scale`,
      ],
      finance: [
        `${topic}: the specific financial moves that produce results, step by step`,
        `A practical framework for ${topic}: what to do first, second, and third`,
        `${topic} — the action plan: specific steps, real timelines, and measurable milestones`,
        `How people actually achieve ${topic}: the methods that work, ranked by speed`,
        `The ${topic} blueprint: concrete actions over abstract principles`,
      ],
      business: [
        `How to actually execute ${topic}: a step-by-step system that produces clients and revenue`,
        `${topic} in practice: the exact moves that generate results, not just the theory`,
        `A working system for ${topic}: validation, execution, and iteration`,
        `${topic} — the practitioner's guide: what works, what doesn't, and why`,
        `The ${topic} method: specific actions, real timelines, measurable outcomes`,
      ],
      health: [
        `How to achieve ${topic}: the specific protocols that produce results`,
        `${topic} — a practical system: nutrition, training, recovery in the right order`,
        `The ${topic} action plan: week-by-week implementation for real results`,
        `What actually works for ${topic}: evidence-based methods, not trends`,
        `${topic} in 90 days: the specific program structure that gets people there`,
      ],
      default: [
        `How to actually achieve ${topic}: specific methods, real examples, clear steps`,
        `${topic} in practice: what works, what doesn't, and how to get started this week`,
        `The practical guide to ${topic}: step-by-step implementation for real results`,
        `${topic} — the action plan: specific, measurable, immediately applicable`,
        `What it actually takes to achieve ${topic}: the honest, practical breakdown`,
      ],
    };
    const patterns = practicalPatterns[domain] ?? practicalPatterns.default;
    return pick(patterns, seed);
  }

  // For conceptual/philosophical topics, keep the intellectual depth
  const refinementPatterns: Record<string, string[]> = {
    mindset: [
      `The architecture of belief: why ${topic} is not a motivation problem but an identity problem`,
      `${topic} as a neurological challenge: rewiring the operating system beneath the behavior`,
      `The identity-behavior gap in ${topic}: what actually changes when people finally change`,
      `Beneath ${topic}: the self-concept structures that determine every outcome before any action is taken`,
      `${topic} and the examined life: the assumptions you've never questioned that run everything`,
    ],
    productivity: [
      `${topic} reframed: the energy architecture beneath the time management illusion`,
      `Why ${topic} is a systems problem, not a discipline problem`,
      `The attention economics of ${topic}: what deserves your focus and why most things don't`,
      `${topic} and the 80/20 principle applied recursively: finding the 4% that produces 64% of results`,
      `Deep work and ${topic}: how the cognitive elite think about output differently`,
    ],
    finance: [
      `${topic} and the psychology of wealth: why behavior determines outcomes more than knowledge`,
      `The compound architecture of ${topic}: how time transforms small consistent actions into disproportionate outcomes`,
      `${topic} beyond tactics: the identity shift that precedes every sustainable financial change`,
      `The hidden variables in ${topic}: what the conventional financial advice consistently misses`,
      `${topic} as a systems problem: why most financial advice fails to address the root mechanism`,
    ],
    business: [
      `${topic} and the positioning imperative: why most businesses solve the wrong problem at scale`,
      `The customer psychology beneath ${topic}: what people actually buy and why`,
      `${topic} and value creation: the systems thinking approach to sustainable growth`,
      `Why ${topic} is a clarity problem before it is a tactics problem`,
      `The unit economics of ${topic}: what must be true at small scale before anything else matters`,
    ],
    default: [
      `${topic} examined at the root level: what first principles reveal that conventional approaches miss`,
      `The systems view of ${topic}: feedback loops, leverage points, and the architecture of change`,
      `${topic} and the depth layer: what separates surface understanding from genuine mastery`,
      `Why most approaches to ${topic} fail: a first principles analysis`,
      `${topic} reframed: the philosophical and practical dimensions most people never reach`,
    ],
  };

  const patterns = refinementPatterns[domain] ?? refinementPatterns.default;
  return pick(patterns, seed);
}

function buildLandingPageIntelligence(topic: string, domain: string, seed: number): LandingPageIntelligence {
  const desires: Record<string, string> = {
    mindset: "to feel genuinely free — from the inner critic, from self-sabotage, from the ceiling they've built",
    productivity: "to feel like time is theirs — to end each day knowing they did what actually mattered",
    finance: "to feel financially free — not anxious, not dependent, genuinely safe and in control",
    business: "to build something real — that generates income without requiring their constant presence",
    health: "to feel fully alive — energetic, clear, capable, and present for the life around them",
    default: "to close the gap — between who they are now and who they know they could be",
  };
  const fears: Record<string, string> = {
    mindset: "that this is as good as it gets — that real change is possible for others but not for them",
    productivity: "that they'll reach the end of their life having been perpetually busy but never truly productive",
    finance: "that they'll always be financially anxious — always dependent, always one crisis away from disaster",
    business: "that they'll spend years building something that never becomes what they imagined",
    health: "that they'll lose their vitality before they've lived the life they intended",
    default: "that the version of themselves they've imagined will remain perpetually out of reach",
  };

  return {
    desireAtRoot: desires[domain] ?? desires.default,
    fearAtRoot: fears[domain] ?? fears.default,
    heroPromise: `Finally understand ${topic} at the level that actually changes things — not more information, but the right framework applied to the right problem`,
    emotionalEntry: `You've tried. You've invested time, energy, and attention. Something still isn't clicking. That's not a failure of effort — it's a signal that the approach needs to change, not the person.`,
    intellectualEntry: `Every conventional solution to ${topic} addresses the visible problem. The invisible problem — the one that actually determines outcomes — is almost never discussed. This changes that.`,
    painAmplification: `The cost of staying where you are isn't zero. It compounds. Every week without the right framework is a week further from where you want to be — and closer to the version of your life you're trying to avoid.`,
    transformationArc: `From confusion and inconsistent results → to a clear, working system that compounds over time → to the outcome that has always been possible, finally lived`,
    trustArchitecture: `Specific frameworks, not general advice. Applied principles, not motivational content. A system built on first principles — not copied from the last bestseller.`,
    ctaPhilosophy: `The decision to understand this at depth is the decision. Everything else follows from that.`,
    objections: [
      {
        objection: "I've tried things like this before and they didn't work",
        reframe: "The previous attempts failed because they addressed symptoms, not the root. This addresses the root.",
      },
      {
        objection: "I don't have time for this right now",
        reframe: "The absence of the right framework is what creates the time scarcity. The solution is the investment.",
      },
      {
        objection: "Is this really different from everything else out there?",
        reframe: "Most resources in this space tell you what to do. This addresses why you haven't done it — and why that changes with the right framework.",
      },
      {
        objection: "What if it doesn't work for me?",
        reframe: "First principles don't fail. They may require adaptation — and this gives you the understanding to adapt, not just the instructions to follow.",
      },
    ],
  };
}

function buildResearchDepthLayer(topic: string, domain: string, seed: number): ResearchDepthLayer {
  const gaps: Record<string, string> = {
    mindset: `The market is saturated with motivational content and completely underserved on identity-level change mechanisms — the one thing that actually produces lasting results`,
    productivity: `Productivity tools and systems are abundant; what is almost entirely absent is energy architecture guidance — the foundation that makes all systems work`,
    finance: `Financial tactics are everywhere; financial psychology — the actual driver of every financial decision — is addressed only superficially by almost everything in the space`,
    business: `Business strategy content is plentiful; positioning clarity — the lever that determines whether any strategy lands — is almost universally underdeveloped`,
    default: `The market is full of what-to-do content and almost entirely empty of why-it-works-at-depth content — the gap is structural, not informational`,
  };
  const jtbd: Record<string, string> = {
    mindset: `When I feel stuck despite trying, I want to understand what's actually holding me in place — so I can change at the level that actually matters`,
    productivity: `When I end every day feeling busy but not accomplished, I want to understand the real constraint — so I can address it instead of adding more to an already broken system`,
    finance: `When I earn reasonable money but feel financially behind, I want to understand what I'm actually missing — so I can build real security, not just work harder`,
    business: `When my business feels like it's running on randomness, I want to understand the principle beneath the tactics — so I can build something predictable`,
    default: `When conventional approaches keep failing me, I want to understand the root mechanism — so the next effort actually produces a different result`,
  };

  return {
    marketGapStatement: gaps[domain] ?? gaps.default,
    buyerPsychologyDepth: `This buyer has already tried multiple solutions. They are not looking for more information — they are looking for a framework that finally works. They purchase with hope and judge with skepticism. Trust is built through specificity and depth, not promises.`,
    competitorWeakness: `Most competing resources in this space are comprehensive but shallow — they cover the topic wide without going deep. The winning position is the opposite: narrow the scope, go deep, produce a real result.`,
    hiddenDesire: `Beneath the stated desire (more productivity, more money, better mindset) is an identity desire: to be the kind of person who has this handled. The product that addresses identity wins.`,
    beliefThatMustShift: `The buyer currently believes that more information or a better tactic will solve the problem. This belief must be gently, respectfully challenged before the real solution can land.`,
    jtbdStatement: jtbd[domain] ?? jtbd.default,
    statusQuoBias: `The buyer's default is inaction protected by rationalization. The product must make the cost of inaction more vivid than the friction of action.`,
  };
}

function buildSellabilityDepthLayer(topic: string, domain: string, seed: number): SellabilityDepthLayer {
  const triggers: Record<string, string[]> = {
    mindset: [
      "Freedom — the desire to no longer be controlled by patterns they didn't consciously choose",
      "Pride — the desire to respect themselves, to feel worthy of the results they want",
      "Relief — the desire to finally stop fighting the same internal battles",
      "Belonging — the identity shift into being 'the kind of person who has this together'",
    ],
    productivity: [
      "Control — the desire to feel like the author of their time, not a victim of it",
      "Achievement — the specific satisfaction of meaningful accomplishment",
      "Relief from guilt — the chronic guilt of knowing you're not working on what matters",
      "Identity — becoming the person who is genuinely productive, not performing productivity",
    ],
    finance: [
      "Security — the deep cellular-level desire to stop feeling financially vulnerable",
      "Freedom — independence from trading time for survival indefinitely",
      "Status — financial success as self-respect, not ostentation",
      "Legacy — building something that outlasts and protects the people they love",
    ],
    default: [
      "Transformation — the desire to be a different version of themselves in this domain",
      "Relief — finally understanding what has been missing",
      "Pride — the self-respect that comes from handling something well",
      "Control — the feeling of being in command of this area of their life",
    ],
  };

  return {
    emotionalTriggers: triggers[domain] ?? triggers.default,
    objectionMatrix: [
      {
        objection: "Too expensive",
        dissolveWith: "Reframe against the cost of the problem: how much is the current situation costing in time, money, opportunity, and quality of life?",
      },
      {
        objection: "Not sure it'll work for me",
        dissolveWith: "Lead with first principles — these aren't tactics that might not apply, they're mechanisms that underlie the domain itself",
      },
      {
        objection: "I already know this stuff",
        dissolveWith: "The gap is not knowing — it's applying. This is about closing the implementation gap, not adding to the information stack",
      },
      {
        objection: "I'll try the free version first",
        dissolveWith: "The free version is tactics. This is systems — a fundamentally different level of understanding that produces fundamentally different results",
      },
    ],
    authorityAngle: `Authority in this space is built through specificity and depth — not credentials. The creator who speaks most precisely about the exact experience of the buyer earns the most trust.`,
    socialProofType: `Transformation stories — not testimonials. The before/after narrative with specific, measurable details outperforms any credential or endorsement.`,
    urgencyTruth: `The genuine urgency is the cost of the current situation compounding — not artificial scarcity. State it honestly: every day without the right framework is a day of the wrong trajectory.`,
    valuePerceptionShift: `Price becomes irrelevant when value is vivid. Make the transformation concrete, specific, and personal — not abstract and general.`,
    priceAnchoring: `Anchor against the cost of the problem (therapy, courses, time lost, opportunities missed) rather than competing products. The frame determines the math.`,
  };
}

export function applyDeepIntelligence(topic: string, variation: number): DeepFrame {
  const domain = detectDomain(topic);
  const seed = hashTopic(topic, variation);
  const intentFrame = detectIntent(topic);

  const firstPrinciples = FIRST_PRINCIPLES_MAP[domain] ?? FIRST_PRINCIPLES_MAP.default;
  const frameworks = pickN(THINKING_FRAMEWORKS, seed, 4);
  const wisdomPrinciples = pickN(WISDOM_PRINCIPLES, seed, 3);

  const intellectualReframe = refineTopicIntellectually(topic, domain, seed, intentFrame.type);
  const philosophicalRoot = PHILOSOPHICAL_ROOTS[domain] ?? PHILOSOPHICAL_ROOTS.default;
  const paradox = PARADOXES[domain] ?? PARADOXES.default;
  const systemsLens = SYSTEMS_LENSES[domain] ?? SYSTEMS_LENSES.default;
  const rootCause = ROOT_CAUSE_TEMPLATES[domain] ?? ROOT_CAUSE_TEMPLATES.default;

  const cognitiveDepthLevel = variation >= 4 ? "transcendent" :
    variation === 3 ? "philosophical" :
    variation === 2 ? "structural" : "surface";

  const reasoningChain = [
    `Step 1 — Surface: What does ${topic} appear to be about?`,
    `Step 2 — Structural: What underlying mechanisms actually determine outcomes in ${topic}?`,
    `Step 3 — Root cause: ${rootCause}`,
    `Step 4 — Paradox: ${paradox}`,
    `Step 5 — Synthesis: The person who understands this at depth sees ${topic} as a systems challenge, not a tactics challenge — and that reframe changes everything.`,
  ];

  const pdfStructureHints: PDFStructureHint = {
    executiveSummaryAngle: `${intellectualReframe} — and why understanding this changes the approach entirely`,
    coreThesisStatement: `${topic} is not the problem people think it is. The surface challenge masks a structural one. ${rootCause}`,
    chapterProgressionLogic: `The reader must move through: diagnosis (what's actually happening) → mechanism (why it happens) → framework (the operating principle) → application (how to use it) → integration (how to sustain it). Each layer must build on the previous.`,
    deepDiveCallouts: [
      `🔍 Deep Dive: ${pick(firstPrinciples, seed)}`,
      `💡 Core Insight: ${paradox}`,
      `⚡ Systems View: ${systemsLens.slice(0, 120)}`,
      `🧠 First Principle: ${pick(firstPrinciples, seed, 2)}`,
      `📐 Framework: ${frameworks[0].name} — ${frameworks[0].applicationToTopic}`,
    ],
    synthesisFramework: `${frameworks[0].name} + ${frameworks[1].name} + ${wisdomPrinciples[0].principle.split("—")[0].trim()}`,
    readerTransformation: `From confused practitioner → to principled thinker who understands ${topic} at the level that makes tactics obvious rather than overwhelming`,
  };

  return {
    refinedTopic: intellectualReframe,
    philosophicalRoot,
    firstPrinciplesBreakdown: firstPrinciples,
    systemsThinkingLens: systemsLens,
    wisdomLayer: wisdomPrinciples.map(w => w.principle).join(" | "),
    cognitiveDepthLevel,
    intellectualReframe,
    rootCauseStatement: rootCause,
    paradoxAtCore: paradox,
    deepQuestion: pick(frameworks, seed).deeperQuestion,
    knowledgeDomains: [domain, "philosophy", "cognitive-science", "systems-thinking", "behavioral-economics"],
    thinkingFrameworks: frameworks,
    reasoningChain,
    wisdomPrinciples,
    knowledgeSynthesis: `${topic} understood through ${frameworks[0].name} and ${frameworks[1].name}, grounded in the principle that ${wisdomPrinciples[0].principle.toLowerCase()} — produces a fundamentally different approach than conventional advice offers.`,
    pdfStructureHints,
    landingPageIntelligence: buildLandingPageIntelligence(topic, domain, seed),
    researchDepthLayer: buildResearchDepthLayer(topic, domain, seed),
    sellabilityDepthLayer: buildSellabilityDepthLayer(topic, domain, seed),
    intentFrame,
  };
}
