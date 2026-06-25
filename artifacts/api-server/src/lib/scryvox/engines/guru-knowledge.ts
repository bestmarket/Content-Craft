/**
 * SCRYVOX GURU KNOWLEDGE ENGINE
 * Distilled wisdom from: Eugene Schwartz, Russell Brunson, Dan Kennedy, Gary Halbert,
 * David Ogilvy, Frank Kern, Todd Brown, Jeff Walker, Clayton Makepeace, Gary Bencivenga,
 * John Carlton, Joe Polish, Drew Eric Whitman, Robert Cialdini, Stefan Georgi (RMBC)
 *
 * These are NOT references to gurus. They ARE the principles, baked into outputs directly.
 */

// ─── EUGENE SCHWARTZ: 5 LEVELS OF MARKET AWARENESS ──────────────────────────
export const AWARENESS_LEVELS = {
  unaware: {
    name: "Unaware",
    description: "Doesn't know they have the problem — or that a solution exists",
    copyApproach: "Lead with the STORY. Open with a relatable scenario that reveals the problem they didn't realize they had. Never lead with the product.",
    headline: "What [common relatable situation] is secretly costing you [desirable outcome]",
    emailLead: "I want to tell you something most people in your position never hear — and it changes everything.",
    salesLead: "Most people going through what you're going through right now have no idea what's actually causing it. That's not a criticism — it's just that nobody tells you. Until now.",
    adApproach: "Pattern interrupt. Story hook. Lead with the relatable situation, not the solution.",
  },
  problemAware: {
    name: "Problem Aware",
    description: "Knows the problem, doesn't yet know solutions exist",
    copyApproach: "Agitate the problem first, then introduce the solution category. Be specific about the pain — make them feel completely understood before pivoting to hope.",
    headline: "Finally: A solution to [specific problem] that actually works",
    emailLead: "If you've been dealing with [problem], here's what nobody's been honest with you about.",
    salesLead: "You already know [problem] is real. What you might not know is exactly what's causing it — and why every attempt to fix it so far has hit the same wall.",
    adApproach: "Lead with the pain. Use words like 'finally', 'at last', 'the answer to'. Solve the problem they're already searching about.",
  },
  solutionAware: {
    name: "Solution Aware",
    description: "Knows solutions exist, hasn't found the right one",
    copyApproach: "Lead with your UNIQUE MECHANISM — the specific reason your approach works when others don't. Don't sell the solution category; sell why yours is different.",
    headline: "Unlike every [solution category] you've tried — this one works because it [unique mechanism]",
    emailLead: "The reason [common solutions] don't work isn't what you think — and the fix is simpler than anyone's admitting.",
    salesLead: "By now you've tried [common solutions]. Some of them even worked — for a while. Here's why they didn't stick, and why what you're about to read is genuinely different.",
    adApproach: "Acknowledge they've tried things. Validate the frustration. Then introduce the unique mechanism as the missing piece.",
  },
  productAware: {
    name: "Product Aware",
    description: "Knows you specifically, hasn't bought yet",
    copyApproach: "Address the objections directly. Lead with proof, specificity, and the exact thing that's stopping them. De-risk the purchase aggressively.",
    headline: "Here's exactly what you get — and why it works even if [primary objection]",
    emailLead: "I know you've been sitting on this. Let me address exactly what's holding you back.",
    salesLead: "You've seen this before. Maybe you've been close to acting a few times. Here's what I want to address directly before you read another word.",
    adApproach: "Retargeting-style. Specificity. Proof. Risk reversal. Limited time offer if appropriate.",
  },
  mostAware: {
    name: "Most Aware",
    description: "Ready to buy, just needs the deal",
    copyApproach: "Be direct and fast. Lead with the offer, the price, the deal. Don't bury them in story. They're sold — just give them the mechanism to buy.",
    headline: "Get [Product] Today — [Price] — [Best Bonus / Guarantee]",
    emailLead: "Quick note — [product] is available now. Here's the link.",
    salesLead: "You know what this is. You know what it does. Here's what you get and how to get it.",
    adApproach: "Direct. Offer-led. Price. CTA. Deadline if available.",
  },
};

// ─── DREW ERIC WHITMAN: LIFE FORCE 8 ─────────────────────────────────────────
export const LIFE_FORCE_8 = [
  { id: "survival", desire: "Survival, enjoyment of life, life extension", hook: "More years of doing what you love — without the constant weight of [problem]" },
  { id: "food", desire: "Enjoyment of food and beverages", hook: null },
  { id: "freedom_from_fear", desire: "Freedom from fear, pain, and danger", hook: "Finally eliminate the anxiety of [fear] — for good" },
  { id: "sex", desire: "Sexual companionship", hook: null },
  { id: "comfortable_living", desire: "Comfortable living conditions", hook: "Wake up every day knowing [outcome] is handled — not something you're still fighting" },
  { id: "superiority", desire: "To be superior, winning, keeping up with others", hook: "The approach the highest performers use — that most people never learn" },
  { id: "care_for_loved_ones", desire: "Care and protection of loved ones", hook: "Do this for yourself — and watch what it does for the people around you" },
  { id: "social_approval", desire: "Social approval and belonging", hook: "The kind of [outcome] that others notice — and ask you about" },
];

export function getRelevantLifeForces(topic: string, variation: number): typeof LIFE_FORCE_8[number][] {
  const t = topic.toLowerCase();
  const relevant: typeof LIFE_FORCE_8[number][] = [];
  if (t.includes("money") || t.includes("financ") || t.includes("wealth") || t.includes("income"))
    relevant.push(LIFE_FORCE_8[4], LIFE_FORCE_8[5]);
  if (t.includes("health") || t.includes("fitness") || t.includes("weight"))
    relevant.push(LIFE_FORCE_8[0], LIFE_FORCE_8[2]);
  if (t.includes("mindset") || t.includes("confidence") || t.includes("habit"))
    relevant.push(LIFE_FORCE_8[5], LIFE_FORCE_8[7]);
  if (t.includes("relationship") || t.includes("social") || t.includes("connect"))
    relevant.push(LIFE_FORCE_8[7], LIFE_FORCE_8[6]);
  if (t.includes("business") || t.includes("marketing") || t.includes("sales") || t.includes("product"))
    relevant.push(LIFE_FORCE_8[5], LIFE_FORCE_8[4]);
  if (t.includes("productiv") || t.includes("time") || t.includes("focus"))
    relevant.push(LIFE_FORCE_8[4], LIFE_FORCE_8[0]);
  if (relevant.length < 2) {
    relevant.push(LIFE_FORCE_8[variation % LIFE_FORCE_8.length]);
    relevant.push(LIFE_FORCE_8[(variation + 2) % LIFE_FORCE_8.length]);
  }
  return relevant.filter(r => r.hook !== null).slice(0, 3);
}

// ─── SCHWARTZ: MARKET SOPHISTICATION ─────────────────────────────────────────
export const MARKET_SOPHISTICATION_LEVELS = [
  {
    level: 1,
    name: "Primitive Market",
    description: "First or early solution in the category. Simple bold claims work.",
    headline: "Introduces the [simple claim] for the first time",
    approach: "Lead with the simple promise. No comparison needed. The idea itself is the hook.",
  },
  {
    level: 2,
    name: "Competitive Market",
    description: "Several solutions exist. Must amplify and extend claims.",
    headline: "[Same claim] — but BIGGER, FASTER, STRONGER than before",
    approach: "Outspend or outclaim the competition. More of everything.",
  },
  {
    level: 3,
    name: "Sophisticated Market",
    description: "Claims have been made and broken. Must introduce a new mechanism.",
    headline: "At last — a new way to [achieve outcome] that [mechanism]",
    approach: "The mechanism is the headline. Not the claim — the HOW.",
  },
  {
    level: 4,
    name: "Cynical Market",
    description: "Even mechanisms have been oversold. Must enlarge or improve the mechanism.",
    headline: "New [amplified mechanism] achieves [outcome] — without [drawback of old mechanism]",
    approach: "Identify the existing mechanism the audience knows. Improve or expand it.",
  },
  {
    level: 5,
    name: "Exhausted Market",
    description: "Maximum cynicism. Identification with the customer is the only path.",
    headline: "For the [type of person] who's tried everything and still wants [outcome]",
    approach: "Lead with identity. Make them feel completely understood. The product is secondary.",
  },
];

// Most info product markets are at level 3-4
export const DEFAULT_SOPHISTICATION_LEVEL = MARKET_SOPHISTICATION_LEVELS[2]; // Level 3

// ─── RUSSELL BRUNSON: EPIPHANY BRIDGE ────────────────────────────────────────
export const EPIPHANY_BRIDGE_STRUCTURE = {
  description: "The story format that creates the same 'aha moment' in the reader that the author had — making the belief shift feel earned rather than sold.",
  steps: [
    { step: 1, name: "The Backstory", instruction: "Establish the character (you or someone relatable) and the desire they had before the insight" },
    { step: 2, name: "The Journey", instruction: "The attempts that didn't work — and the specific wall they kept hitting" },
    { step: 3, name: "The New Opportunity", instruction: "The moment of discovery — what they found that was different" },
    { step: 4, name: "The Epiphany", instruction: "The specific insight — the exact moment the framework clicked" },
    { step: 5, name: "The Transformation", instruction: "What changed as a result — and why it's now possible for the reader" },
    { step: 6, name: "The Achievement", instruction: "The result — concrete and specific, not abstract" },
  ],
  template: `I used to [struggle with X] — and I'd tried [common attempts]. Nothing stuck.\n\nThen one [moment/day], I [specific discovery or observation].\n\nWhat I realized was this: [core insight — the epiphany itself].\n\nThe moment I applied that — [specific result]. And that's why this works:\n\n[Bridge to the principle or framework being taught].`,
};

// ─── JOE POLISH: PPPP (PROBLEM-PROMISE-PROOF-PROPOSAL) ───────────────────────
export const PPPP_STRUCTURE = {
  description: "The four-part structure for any chapter opening or persuasive section that converts skeptics",
  problem: "Name the specific problem with emotional precision — not generically, but in the exact language the reader uses internally",
  promise: "State the specific outcome this chapter/section delivers — not vague benefit, but concrete transformation",
  proof: "Give one piece of evidence before you've delivered the content — a fact, a principle, a mini-story that proves the promise is achievable",
  proposal: "Tell them exactly what you're about to show them and why it works — make the structure feel like a gift, not a lesson",
  template: `[PROBLEM]: If you've ever [specific frustration], you already know the cost of [not having this].\n\n[PROMISE]: By the end of this [chapter/section], you'll have [specific concrete outcome].\n\n[PROOF]: Here's why this is possible: [one convincing piece of evidence or insight].\n\n[PROPOSAL]: What I'm going to walk you through is [specific framework or method] — and the reason it works where [common alternative] fails is [unique mechanism].`,
};

// ─── FRANK KERN: RESULTS IN ADVANCE ──────────────────────────────────────────
export const RESULTS_IN_ADVANCE = {
  description: "Give real, actionable value BEFORE asking for anything. The reader should get a win from the first chapter that proves the system works.",
  principle: "Don't tease value — deliver it. The first chapter should contain the single most impactful insight in the book, not a warm-up.",
  pdfApplication: "Chapter 1 delivers a complete, usable insight that works standalone. Subsequent chapters deepen and systematize it.",
  template: `Before we go any further, here's something you can use right now:\n\n[Specific, actionable insight that stands alone and works immediately]\n\nThat's not a teaser — that's the real thing. The reason I'm giving you this upfront is that everything else in this [book/guide] is built on top of it. Once you see it working, the framework we build from here will make complete sense.`,
};

// ─── CLAYTON MAKEPEACE: FASCINATIONS ─────────────────────────────────────────
export const FASCINATION_TEMPLATES = [
  "Why [common belief] is completely wrong — and what actually drives [outcome] (page [X])",
  "The [specific number]-second test that reveals whether your [approach] will work or fail",
  "What [category of successful people] do differently with [topic] — that almost nobody else does",
  "The [surprising thing] that [specific group] discovered about [topic] decades ago — buried in [obscure source]",
  "Why doing [counterintuitive action] produces [desired result] faster than [conventional approach]",
  "The single question that separates people who get [result] from those who don't — most never think to ask it",
  "How to [achieve result] in [surprisingly short time] — even if [common obstacle] applies to you",
  "The [specific name] method: why [counterintuitive approach] consistently outperforms [obvious approach]",
  "What happens in the first [timeframe] that determines whether [effort] succeeds or fails",
  "The [hidden cost / secret / truth] about [topic] that [specific authority type] won't tell you",
  "How [specific type of person] achieves [result] with [surprisingly little effort] — the exact process",
  "Why [conventional advice] actually makes [problem] worse — and the fix that took [timeframe] to discover",
];

export function buildFascinations(topic: string, chapterTitle: string, count: number, variation: number): string[] {
  const results: string[] = [];
  const start = variation % FASCINATION_TEMPLATES.length;
  for (let i = 0; i < Math.min(count, FASCINATION_TEMPLATES.length); i++) {
    const template = FASCINATION_TEMPLATES[(start + i) % FASCINATION_TEMPLATES.length];
    results.push(
      template
        .replace(/\[topic\]/gi, topic)
        .replace(/\[outcome\]/gi, "real results")
        .replace(/\[result\]/gi, "lasting change")
        .replace(/\[approach\]/gi, chapterTitle.split("—")[0].trim())
        .replace(/\[effort\]/gi, `working on ${topic}`)
        .replace(/\[problem\]/gi, `getting stuck with ${topic}`)
        .replace(/\[X\]/g, `${10 + i * 3}`)
    );
  }
  return results;
}

// ─── GARY HALBERT: HEADLINE FORMULAS ─────────────────────────────────────────
export const HEADLINE_FORMULAS = {
  howTo: [
    "How to [achieve desired outcome] — even if [common obstacle]",
    "How to [achieve result] in [short timeframe] without [common sacrifice]",
    "How to finally [achieve result] — the [adjective] approach that actually works",
  ],
  secret: [
    "The [adjective] secret to [outcome] that [specific group] doesn't want you to know",
    "The secret [specific group] uses to [achieve outcome] — now available to anyone",
    "What [category of successful people] know about [topic] that most people never learn",
  ],
  warning: [
    "Warning: If you're [doing common thing], read this before you go any further",
    "Stop [common action] until you've read this",
    "Before you [common action] — there's something you need to know",
  ],
  number: [
    "[Number] [specific things] that [category of people] use to [achieve outcome]",
    "[Number] reasons why [common approach] keeps failing — and the [number] things that actually work",
    "The [number] [topic] mistakes that are costing you [result] — and how to fix each one",
  ],
  story: [
    "How I [achieved result] after [timeframe] of [struggle] — and what I learned",
    "From [before state] to [after state] in [timeframe]: the exact system I used",
    "I [tried common approach] for [timeframe] and got nowhere. Here's what changed everything.",
  ],
  ogilvy: [
    "At [age/timeframe], [person] discovered something about [topic] that [counterintuitive result]",
    "The [specific claim] — and the reason it works even when [common obstacle]",
    "They laughed when I [took unconventional approach] — until they saw [specific result]",
  ],
};

export function buildHeadline(topic: string, variation: number, format: keyof typeof HEADLINE_FORMULAS = "howTo"): string {
  const formulas = HEADLINE_FORMULAS[format] ?? HEADLINE_FORMULAS.howTo;
  const template = formulas[variation % formulas.length];
  return template
    .replace(/\[topic\]/gi, topic)
    .replace(/\[outcome\]/gi, `genuine mastery of ${topic}`)
    .replace(/\[result\]/gi, "the results you've been after")
    .replace(/\[adjective\]/g, ["counterintuitive", "proven", "overlooked", "powerful"][variation % 4])
    .replace(/\[number\]/gi, `${[5, 7, 9, 3, 11][variation % 5]}`)
    .replace(/\[specific group\]/gi, "top performers")
    .replace(/\[category of (successful )?people\]/gi, "people who get real results with this")
    .replace(/\[short timeframe\]/gi, ["30 days", "6 weeks", "one quarter"][variation % 3])
    .replace(/\[timeframe\]/gi, ["years", "months", "a long time"][variation % 3])
    .replace(/\[common obstacle\]/gi, `even if you've tried before and it hasn't worked`)
    .replace(/\[common approach\]/gi, "the conventional approach")
    .replace(/\[common action\]/gi, `working on ${topic}`)
    .replace(/\[common sacrifice\]/gi, "giving up what you love")
    .replace(/\[before state\]/gi, "stuck")
    .replace(/\[after state\]/gi, "consistent results")
    .replace(/\[took unconventional approach\]/gi, `tried this approach to ${topic}`)
    .replace(/\[tried common approach\]/gi, `followed the standard advice on ${topic}`)
    .replace(/\[struggle\]/gi, `struggling with ${topic}`)
    .replace(/\[counterintuitive result\]/gi, "changed everything about how they approach it");
}

// ─── DAN KENNEDY: VALUE STACK ─────────────────────────────────────────────────
export const VALUE_STACK_STRUCTURE = {
  description: "Every product component is presented as a standalone valuable item with its own price — total stack value dwarfs actual price, making purchase feel irrational NOT to make",
  levels: [
    { name: "Core Product", description: "The main guide/system — given a specific value based on the outcome it produces, not the hours it takes to read" },
    { name: "Fast-Start Component", description: "Something that delivers a win in the first 24-48 hours — increases stick rate and reduces refunds" },
    { name: "Implementation Tool", description: "A workbook, checklist, or template — makes the system executable, not just readable" },
    { name: "Reference Guide", description: "Something they'll return to repeatedly — increases ongoing perceived value" },
    { name: "Accelerator", description: "An advanced element that shortens the timeline — for those who want faster results" },
  ],
  pricingPrinciple: "Price the stack based on the value of the outcome, then discount to your real price. Never price based on the hours it took to produce.",
  kennedyRule: "The offer must make your prospect feel that refusing it would be the irrational choice.",
};

export function buildValueStack(
  title: string,
  components: string[],
  basePrice: number,
  variation: number
): { items: { name: string; value: number; description: string }[]; totalValue: number; yourPrice: number } {
  const items = components.slice(0, 5).map((comp, i) => ({
    name: comp,
    value: [97, 47, 37, 27, 67][i % 5] + (variation % 20),
    description: VALUE_STACK_STRUCTURE.levels[i % VALUE_STACK_STRUCTURE.levels.length].description,
  }));
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  return { items, totalValue, yourPrice: basePrice };
}

// ─── TODD BROWN / STEFAN GEORGI: UNIQUE MECHANISM ────────────────────────────
export const UNIQUE_MECHANISM = {
  description: "The specific, named 'vehicle' of transformation. Not WHAT you achieve — the HOW that makes your product uniquely capable of producing it.",
  formula: "The [Proprietary Name] [System/Method/Protocol/Formula/Approach]",
  examples: [
    "The Compound Identity Loop — the reason behavior change sticks when every other approach fails",
    "The Awareness Ladder Protocol — the 5-step process that takes readers from stuck to executing",
    "The Layered Framework Method — building results from the foundation up, not the output down",
    "The Reverse-Engineer Approach — starting from the desired outcome and working backward to daily action",
    "The Evidence Accumulation System — building the identity through small daily proof-points",
  ],
  rmbcApplication: "In Stefan Georgi's RMBC method (Research → Mechanism → Brief → Copy), the mechanism is the single most important element — it's what makes the copy different from everything else saying the same thing.",
};

export function generateUniqueMechanism(topic: string, variation: number): { name: string; description: string; howItWorks: string } {
  const mechanisms = [
    {
      name: `The ${topic.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ")} Blueprint System`,
      description: `A structured, step-by-step protocol that builds ${topic} results from the foundation level — not from tactics down`,
      howItWorks: `Instead of layering tactics on top of an unstable foundation, this system starts with the underlying principle that makes ${topic} results possible, then builds upward systematically`,
    },
    {
      name: `The Compound ${topic.split(" ")[0].charAt(0).toUpperCase() + topic.split(" ")[0].slice(1)} Protocol`,
      description: `A sequenced approach to ${topic} that creates compounding momentum rather than linear effort`,
      howItWorks: `Each stage of the protocol builds on the last — so results don't plateau, they accelerate. This is why users see slow early results that suddenly compound`,
    },
    {
      name: `The Reverse-Build Method for ${topic.split(" ").slice(0, 2).join(" ")}`,
      description: `Working backward from the specific outcome to the daily inputs required — eliminating everything that doesn't directly contribute`,
      howItWorks: `Most systems add complexity. This removes it — by starting from the exact result and engineering backward to the minimum required actions`,
    },
    {
      name: `The Identity-First ${topic.split(" ").slice(-1)[0].charAt(0).toUpperCase() + topic.split(" ").slice(-1)[0].slice(1)} Framework`,
      description: `Addresses the identity layer that makes behavior change sustainable — instead of trying to modify behavior directly`,
      howItWorks: `Behavior is downstream of identity. This framework changes the identity pattern first — making the right behaviors feel natural rather than forced`,
    },
  ];
  return mechanisms[variation % mechanisms.length];
}

// ─── DAN KENNEDY: DIRECT RESPONSE LETTER STRUCTURE ────────────────────────────
export const DIRECT_RESPONSE_STRUCTURE = {
  description: "Dan Kennedy's classic direct response sales letter structure — every element has a job, nothing is decorative",
  elements: [
    { name: "Headline", job: "Stop them cold. The headline's only job is to get the first line read. Contains the biggest benefit or most powerful curiosity gap." },
    { name: "Lead / Opening", job: "Qualify and agitate. Confirm this is for them, name the problem with precision, establish stakes." },
    { name: "Credibility", job: "Why should they believe you? Short, specific, proof-oriented. Not a resume — a reason to trust." },
    { name: "The Story", job: "The Epiphany Bridge or before/after narrative. Creates emotional investment and makes the solution feel inevitable." },
    { name: "The Offer (Value Stack)", job: "Everything they get, presented with individual values. Make refusing feel irrational." },
    { name: "Price Reveal with Anchor", job: "Anchor to a high comparison, reveal the real price as a relief. Never the first thing." },
    { name: "Bonuses", job: "Tip the scales. Add elements that make the decision easy. Should exceed the price in perceived value." },
    { name: "Guarantee", job: "Remove all risk. Specific, strong, easy to invoke. Makes buying feel like a no-lose proposition." },
    { name: "Urgency / Scarcity", job: "Real reason to act now. Fake scarcity destroys trust. Real scarcity converts." },
    { name: "Call to Action", job: "Tell them exactly what to do next. Specific. No ambiguity. Repeated at least 3 times." },
    { name: "P.S.", job: "Most-read element after the headline. Summarize the offer, reinforce urgency, restate guarantee." },
  ],
  kennedyPrinciple: "Every element of a letter has a single, specific job. When an element fails to do its job, the next element never gets read.",
};

// ─── JEFF WALKER: SOAP OPERA SEQUENCE ────────────────────────────────────────
export const SOAP_OPERA_SEQUENCE_STRUCTURE = {
  description: "Jeff Walker's email sequence designed to create emotional investment before the sale — each email ends with a cliffhanger that demands the next email be opened",
  emails: [
    {
      position: 1,
      name: "The Setting",
      purpose: "Introduce the character (you) at a dramatic moment — drop them into the middle of the story, not the beginning",
      structure: "Open in the middle of the drama. Establish the stakes. End with a cliffhanger that promises the next email reveals everything.",
      subjectFormula: "Something happened to me [timeframe] ago that changed everything about [topic]",
    },
    {
      position: 2,
      name: "The Backstory and High Drama",
      purpose: "Tell the backstory — what led to the dramatic moment, and then the wall-hitting low point",
      structure: "The before picture. The journey. The lowest point. The decision to find a different way. End with: 'And then I found something...'",
      subjectFormula: "The [timeframe] that changed how I think about [topic] forever",
    },
    {
      position: 3,
      name: "The Epiphany",
      purpose: "The 'aha moment' — the discovery that changed everything. This is where the mechanism is introduced.",
      structure: "The discovery. The experiment. The unexpected result. The realization of WHY it worked. End with bridge to the product.",
      subjectFormula: "I discovered this by accident — and it's been working ever since",
    },
    {
      position: 4,
      name: "The Hidden Benefits",
      purpose: "Surface unexpected secondary benefits — things the prospect didn't know to want that make the outcome richer",
      structure: "What I expected. What I got instead (better). The knock-on effects I didn't anticipate. Bridge to product.",
      subjectFormula: "The [unexpected thing] that happened when I [applied approach] — I didn't see this coming",
    },
    {
      position: 5,
      name: "The Offer",
      purpose: "The ask — positioned as the logical conclusion of the story, not a pivot",
      structure: "Callback to the story. Here's how to get all of this. The offer. The price. The guarantee. The urgency. The CTA.",
      subjectFormula: "Here's how to get this for yourself (everything included)",
    },
  ],
};

// ─── DAVID OGILVY: COPY PRINCIPLES ───────────────────────────────────────────
export const OGILVY_PRINCIPLES = [
  "On average, five times as many people read the headline as read the body copy. When you have written your headline, you have spent eighty cents out of your dollar.",
  "The consumer isn't a moron; she is your wife. You insult her intelligence if you assume that a mere slogan and a few vapid adjectives will persuade her to buy anything.",
  "Never use tricky or irrelevant headlines. People read too fast to stop and figure out what you mean. Say what you mean, mean what you say, and get out of the way.",
  "Long copy sells more than short copy — but only if every word earns its place.",
  "What you say is more important than how you say it. The most brilliant writing in the service of a wrong strategy is wasted.",
  "Never write an advertisement you would not be proud to show your family.",
  "If it doesn't sell, it isn't creative.",
];

// ─── GARY BENCIVENGA: PROOF ELEMENTS ─────────────────────────────────────────
export const PROOF_ELEMENTS = [
  { type: "Mechanism Proof", description: "Explain WHY it works — not just that it works. The mechanism of action is more convincing than the claim." },
  { type: "Specific Results", description: "Specific numbers (lost 17 lbs, went from $2,700 to $11,400 in 90 days) are exponentially more convincing than vague claims." },
  { type: "Third-Party Validation", description: "Research, studies, expert quotes — borrowed credibility from recognized authorities." },
  { type: "Case Studies", description: "Before/after stories with specific details, timeline, and measurable outcomes." },
  { type: "Demonstration", description: "Show the thing working — screenshots, examples, samples, excerpts. Seeing is believing." },
  { type: "Specificity as Proof", description: "Specific details make claims feel true. '23 minutes' is more believable than 'a few minutes'. '14 of 17 clients' is more believable than 'most clients'." },
];

// ─── PDF STRUCTURE WISDOM (applies to content.ts) ────────────────────────────
export const PDF_STRUCTURE_PRINCIPLES = {
  openingChapter: {
    rule: "The first chapter must do three things: make them feel completely understood, deliver one immediately usable insight, and make them desperate to continue.",
    resultInAdvance: "Give the single best insight in chapter one — not a teaser. This is the 'Results in Advance' principle that builds massive trust.",
    fascinations: "End the first chapter with 3-5 fascinations (teases of what's coming) that create irresistible forward momentum.",
  },
  chapterStructure: {
    opening: "PPPP: Problem → Promise → Proof → Proposal. Never open with 'In this chapter, we will discuss...'",
    insight: "Use the Epiphany Bridge format for the core insight — make the 'aha' feel earned, not lectured",
    application: "Give a concrete application before the chapter ends — theory without application loses readers",
    closing: "End with 2-3 fascinations about the next chapter — the reader should not be able to NOT continue",
  },
  titleFormulas: [
    "The [Specific Method] That [Result] — Without [Common Obstacle]",
    "Why [Common Belief] Is Keeping You Stuck (And What Actually Works)",
    "The [Number]-[Timeframe] [Noun] That Changes Everything",
    "How to [Outcome] — Even If [Most Common Objection]",
    "The [Adjective] Truth About [Topic] That Nobody Teaches",
    "What [Successful Group] Know That [Average Group] Never Learn",
  ],
  bulletFormulas: [
    "The [number] [nouns] that determine whether [effort] succeeds or fails",
    "Why [common approach] works against you — and the [adjective] fix",
    "How to [outcome] in [short time] — the exact sequence",
    "The one thing that [specific group] never skip — most people don't even know it exists",
    "What to do when [common obstacle] appears — the response that keeps everything on track",
  ],
};

// ─── LANDING PAGE WISDOM (applies to marketing.ts) ──────────────────────────
export const LANDING_PAGE_PRINCIPLES = {
  aboveFold: {
    mustHave: ["Headline (benefit + mechanism)", "Subheadline (who it's for and what it produces)", "Hero shot or relevant visual", "Immediate CTA"],
    ogilvyRule: "The above-the-fold content determines whether anyone reads what follows. It has one job: make them scroll.",
  },
  leadOptions: {
    story: "For solution-aware and above — start with the Epiphany Bridge. High engagement, builds trust fast.",
    problem: "For problem-aware audiences — agitate the pain with precision before pivoting to the solution.",
    secret: "For cynical audiences — lead with 'the thing nobody's told you' angle. Interrupts pattern.",
    news: "For unaware audiences — use news/discovery format: 'Recent discovery reveals...'",
    direct: "For most-aware audiences — headline is the offer, body is the details.",
  },
  bulletPsychology: "Fascinations create 'curiosity gaps' that MUST be closed. The reader feels incomplete until they buy and read. Never resolve a fascination bullet in the copy — let the product be the resolution.",
  guaranteeWisdom: "The guarantee doesn't just reduce risk — it signals confidence. A strong, specific guarantee increases trust MORE than it increases refunds in the digital product space.",
  urgencyTypes: {
    real: "Deadline pricing, limited seats, limited bonuses — real scarcity converts without destroying trust",
    logical: "Price will increase, this offer changes — logical reason to act now",
    emotional: "The cost of delay — what another [week/month/year] of [problem] actually costs",
  },
  psFormula: "PS: Summarize the offer in 2 sentences. Restate the single strongest reason to buy. Restate the guarantee. End with the CTA link.",
};

// ─── ROBERT CIALDINI: INFLUENCE TRIGGERS ─────────────────────────────────────
export const CIALDINI_TRIGGERS = {
  reciprocity: { name: "Reciprocity", copy: "Give before you ask. Give something genuinely valuable — not a stripped-down teaser — before the pitch." },
  commitment: { name: "Commitment", copy: "Get micro-commitments early: 'Does this resonate with you?' 'Have you experienced this?' Small yeses lead to big yeses." },
  socialProof: { name: "Social Proof", copy: "Specific numbers ('14 of 17 clients') > vague claims ('most clients'). Testimonials from the target audience > experts. Video > text." },
  authority: { name: "Authority", copy: "Specific credentials, published works, media mentions, recognized methodologies. Relevance matters more than fame." },
  liking: { name: "Liking", copy: "Share vulnerability. Be specific about failures. Show the human, not just the expert." },
  scarcity: { name: "Scarcity", copy: "Real scarcity converts AND builds trust. Fake scarcity destroys trust long-term. Always make scarcity real." },
  unity: { name: "Unity (added 2016)", copy: "We. Us. Our people. Creating a shared identity between buyer and seller. 'People like us do things like this.'" },
};
