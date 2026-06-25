import {
  HOOKS, TRANSITIONS, EMOTIONAL_WORDS, POWER_PHRASES,
  HUMAN_MARKERS, SENTENCE_STARTERS, RHETORICAL_QUESTIONS,
  SPECIFICITY_INJECTORS, CLOSINGS, PARAGRAPH_BRIDGES,
  VIRAL_TRIGGERS, PDF_CALLOUT_PHRASES,
} from "./vocabulary";
import { STYLE_PROFILES, TONE_PROFILES, LENGTH_CONFIG } from "./styles";
import type { WritingStyle, WritingTone, ContentLength, AudienceType, StyleProfile, ToneProfile } from "./styles";
import { parseTopicComponents, type TopicExpansion, type TopicComponents } from "./expander";
import { humanize } from "./humanizer";
import { applyDeepIntelligence, type DeepFrame } from "./deep-intelligence";
import { pickResearch, pickBeliefReality, getResearchForDomain } from "./research-library";
import { pickVoice, pickVoiceBlend } from "./voice";

export interface ScryvoxInput {
  topic: string;
  style: WritingStyle;
  tone: WritingTone;
  length: ContentLength;
  audience: AudienceType;
  variation: number;
  keyPoints?: string[];
}

export interface ScryvoxSection {
  headline?: string;
  subheadline?: string;
  body: string;
  pullQuote?: string;
  callout?: string;
}

export interface ScryvoxOutput {
  title: string;
  hook: string;
  sections: ScryvoxSection[];
  conclusion: string;
  cta: string;
  formattedOutput: {
    plainText: string;
    markdown: string;
    youtubeScript?: string;
    twitterThread?: string;
    pdfMarkdown?: string;
  };
  metadata: {
    wordCount: number;
    estimatedReadTime: string;
    style: string;
    tone: string;
    length: string;
    variation: number;
    domain: string;
    viralScore: number;
    humanScore: number;
    generationMs: number;
  };
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0xffffffff;
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, n);
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// ── Semantic helpers ────────────────────────────────────────────────────────────
// These replace raw topic injection with domain-aware semantic variants.
// The engine never echoes user input verbatim — it expresses the concept naturally.

function getSemantic(components: TopicComponents, index: number): string {
  const pool = [
    components.mainSubject,
    ...components.semanticAliases,
    components.coreConcepts[0] ?? components.mainSubject,
    components.coreConcepts[1] ?? components.mainSubject,
  ].filter(Boolean);
  return pool[Math.abs(index) % pool.length] ?? components.mainSubject;
}

function insertSemantic(template: string, components: TopicComponents, seedOffset: number): string {
  const pool = [
    components.mainSubject,
    ...components.semanticAliases.slice(0, 5),
  ].filter(Boolean);
  let idx = seedOffset;
  return template.replace(/\{TOPIC\}/gi, () => pool[idx++ % pool.length] ?? components.mainSubject);
}

function insertTopic(template: string, topic: string): string {
  return template.replace(/\{TOPIC\}/gi, topic).replace(/\{topic\}/gi, topic);
}

function buildTitle(topic: string, style: WritingStyle, tone: WritingTone, expansion: TopicExpansion, rng: SeededRandom, components?: TopicComponents): string {
  // Derive a concise, natural title phrase — never inject the raw user-input string verbatim
  // if it's long and keyword-stuffed. Use the semantic main subject + a short qualifier instead.
  const titleTopic = (() => {
    if (topic.length <= 38) return topic;
    // Long topic: use domain + most specific semantic alias (first alias that sounds like a subject)
    if (components) {
      const alias = components.semanticAliases.find(a => a.length > 8 && a.length < 35 && !a.startsWith("this "));
      if (alias) {
        const domain = components.mainSubject.charAt(0).toUpperCase() + components.mainSubject.slice(1);
        return alias.charAt(0).toUpperCase() + alias.slice(1);
      }
      return components.mainSubject.charAt(0).toUpperCase() + components.mainSubject.slice(1) + " Mastery";
    }
    // Fallback: truncate at word boundary
    const truncated = topic.slice(0, 35).replace(/\s+\S*$/, "");
    return truncated + "...";
  })();
  const titleFormulas: Record<string, string[]> = {
    youtube: [
      `The Truth About ${titleTopic} Nobody Wants To Say`,
      `Why Everything You Know About ${titleTopic} Is Wrong`,
      `I Spent Years Getting ${titleTopic} Wrong — Here's What Changed`,
      `What The Top 1% Know About ${titleTopic} That You Don't`,
      `${titleTopic}: The Uncomfortable Truth`,
      `Stop Doing This With ${titleTopic} (Do This Instead)`,
      `The ${titleTopic} Mistake That's Costing You Everything`,
      `How To Actually Master ${titleTopic} (Not The Watered-Down Version)`,
    ],
    storytelling: [
      `What ${titleTopic} Actually Feels Like — And What To Do With That`,
      `The Moment Everything Shifted On ${titleTopic}`,
      `A Story About ${titleTopic} That Stays With You`,
      `What I Learned About ${titleTopic} The Hard Way`,
      `${titleTopic}: A Real Accounting`,
    ],
    persuasive: [
      `The Case For Taking ${titleTopic} Seriously`,
      `Why ${titleTopic} Is The Decision You Keep Avoiding`,
      `${titleTopic}: The Argument You Need To Hear`,
      `The One ${titleTopic} Move That Consistently Works`,
      `Why Waiting On ${titleTopic} Is Costing You`,
    ],
    conversational: [
      `Let's Actually Talk About ${titleTopic}`,
      `Okay, Real Talk: ${titleTopic}`,
      `What Nobody Tells You About ${titleTopic}`,
      `My Honest Take On ${titleTopic}`,
      `The ${titleTopic} Conversation We're Not Having`,
    ],
    professional: [
      `A Strategic Framework for ${titleTopic}`,
      `Rethinking ${titleTopic}: What the Evidence Shows`,
      `${titleTopic}: The Practitioner's Perspective`,
      `The ${titleTopic} Approach That Consistently Outperforms`,
      `What High-Performing Leaders Know About ${titleTopic}`,
    ],
    blog: [
      `${titleTopic}: What Works, What Doesn't, and Why`,
      `The Complete Honest Guide To ${titleTopic}`,
      `Everything I Wish I Knew About ${titleTopic} Earlier`,
      `Why Most Advice On ${titleTopic} Is Wrong`,
      `The ${titleTopic} Breakdown You Actually Need`,
    ],
    email: [
      `One thing about ${titleTopic} worth your time`,
      `What I've been meaning to tell you about ${titleTopic}`,
      `The ${titleTopic} message I've been sitting on`,
      `This week: ${titleTopic} (the honest version)`,
    ],
    podcast: [
      `${titleTopic} — The Real Conversation`,
      `What We Get Wrong About ${titleTopic}`,
      `Deep Dive: ${titleTopic}`,
      `${titleTopic}: The Full Picture`,
    ],
    linkedin: [
      `The ${titleTopic} truth nobody posts about:`,
      `After years of ${titleTopic}, here's what I know:`,
      `Hot take: ${titleTopic} is misunderstood by almost everyone.`,
      `The ${titleTopic} lesson that took me too long to learn:`,
    ],
    pdf_chapter: [
      `Chapter: Mastering ${titleTopic}`,
      `${titleTopic}: The Complete Foundation`,
      `Understanding ${titleTopic} at the Deepest Level`,
      `The ${titleTopic} Principle`,
    ],
    twitter_thread: [
      `A thread on ${titleTopic} 🧵`,
      `Everything you need to know about ${titleTopic} (thread):`,
      `${titleTopic}: The honest breakdown 👇`,
      `Hot take on ${titleTopic} — a thread`,
    ],
    poetic: [
      `On ${titleTopic}`,
      `${titleTopic}, and What It Asks of Us`,
      `The Weight of ${titleTopic}`,
      `What ${titleTopic} Teaches`,
    ],
  };

  const formulas = titleFormulas[style] ?? titleFormulas.blog;
  return rng.pick(formulas);
}

function buildHook(topic: string, style: WritingStyle, expansion: TopicExpansion, components: TopicComponents, rng: SeededRandom): string {
  const styleHooks = HOOKS[style] ?? HOOKS.blog;
  const raw = rng.pick(styleHooks);
  return insertSemantic(raw, components, rng.int(0, 3));
}

function buildProblemSection(topic: string, components: TopicComponents, expansion: TopicExpansion, style: StyleProfile, tone: ToneProfile, rng: SeededRandom): string {
  const mistake = rng.pick(expansion.commonMistakes);
  const emotionalNeed = rng.pick(expansion.emotionalNeeds);
  const marker = rng.pick(HUMAN_MARKERS);
  const starter = rng.pick(SENTENCE_STARTERS);
  const powerPhrase = rng.pick(POWER_PHRASES);
  const intensifier = rng.pick(EMOTIONAL_WORDS.honest);
  const concept0 = getSemantic(components, 0);
  const concept1 = getSemantic(components, 2);
  const audience = components.audienceLabel;

  // Voice + Research injection
  const domain = expansion.domain;
  const voiceOpener = pickVoiceBlend("vulnerability", "frustration", rng.int(0, 7));
  const voiceAside = pickVoice("asides", rng.int(0, 7));
  const domainStat = pickResearch(domain, "statistics", rng.int(0, 5));
  const beliefReality = pickBeliefReality(domain, rng.int(0, 2));

  const beliefBlock = beliefReality
    ? `\n\nHere's the belief most people are operating from: "${beliefReality.belief}" The reality: ${beliefReality.reality}`
    : "";

  const templates = [
    `${voiceOpener}\n\n${starter} ${concept0} — the real problem isn't what most ${audience} think. The most common approach centers around ${mistake}. ${marker} this is exactly why so many people feel stuck. When you optimize for the wrong thing, you get the wrong results — regardless of how much effort you put in. ${powerPhrase}\n\n${domainStat}\n\nWhat's actually at stake here is ${emotionalNeed}. And that's where ${concept1} stops being abstract and becomes something you can act on directly. ${voiceAside}`,

    `${marker} most ${audience} get this backward from the start. They focus on ${mistake}. It sounds reasonable. It feels productive. But it quietly guarantees a specific kind of frustration — the kind where you're working hard without getting anywhere real.\n\n${voiceOpener}\n\n${domainStat}\n\nThe root cause is almost always the same: people solve for the visible problem when the real leverage is ${emotionalNeed}. ${intensifier}, that's the entire difference.${beliefBlock}`,

    `The pattern that keeps showing up in ${concept0} is this: intelligent, motivated people consistently do ${mistake} — and then wonder why results aren't following.\n\n${voiceOpener}\n\n${domainStat}\n\nHere's what's actually happening. ${starter} the visible approach addresses the symptom. What the best outcomes require is more fundamental: addressing ${emotionalNeed} directly, not working around it. ${powerPhrase}`,
  ];

  return rng.pick(templates);
}

function buildInsightSection(topic: string, components: TopicComponents, expansion: TopicExpansion, style: StyleProfile, tone: ToneProfile, rng: SeededRandom): string {
  const truth = rng.pick(expansion.surprisingTruths);
  const subtopic = rng.pick(expansion.subtopics);
  const bridge = rng.pick(PARAGRAPH_BRIDGES);
  const specifier = rng.pick(SPECIFICITY_INJECTORS);
  const question = rng.pick(RHETORICAL_QUESTIONS);
  const concept = getSemantic(components, 1);

  // Voice + Research injection
  const domain = expansion.domain;
  const voiceSkeptic = pickVoice("skepticism", rng.int(0, 6));
  const voiceEnthuse = pickVoice("enthusiasm", rng.int(0, 6));
  const expertFramework = pickResearch(domain, "expertFrameworks", rng.int(0, 4));
  const counterIntuitive = pickResearch(domain, "counterIntuitives", rng.int(0, 3));
  const specificExample = pickResearch(domain, "specificExamples", rng.int(0, 2));

  const templates = [
    `${bridge}\n\n${truth}.\n\n${voiceSkeptic}\n\n${counterIntuitive}\n\nBut when you bring ${subtopic} into the picture — ${specifier} — it changes how you think about ${concept} entirely. ${question}`,

    `Here's the insight worth sitting with: ${truth}. This isn't theoretical. ${specifier}, this is what consistently shows up when you look at the people who get results here.\n\n${voiceEnthuse}\n\n${expertFramework}\n\nThe specific angle most people miss is ${subtopic}. Once you see it, you can't unsee it. And more importantly — you can start applying it.\n\n${specificExample}`,

    `What actually moves the needle is understanding this: ${truth}.\n\n${voiceSkeptic}\n\n${counterIntuitive}\n\n${bridge} That's why the framing matters. When you approach ${subtopic} as the core variable — not a side consideration — the path forward gets significantly clearer. The complexity doesn't disappear, but you stop moving in random directions.\n\n${expertFramework}`,
  ];

  return rng.pick(templates);
}

function buildContrarianSection(topic: string, components: TopicComponents, expansion: TopicExpansion, style: StyleProfile, tone: ToneProfile, rng: SeededRandom): string {
  const angle = rng.pick(expansion.contrarianAngles);
  const amplifier = rng.pick(expansion.relatedAmplifiers);
  const transition = rng.pick(TRANSITIONS.contrasting);
  const powerPhrase = rng.pick(POWER_PHRASES);
  const emotionalWord = rng.pick(EMOTIONAL_WORDS.surprising);
  const concept = getSemantic(components, 2);

  // Voice + Research injection
  const domain = expansion.domain;
  const voiceConviction = pickVoice("conviction", rng.int(0, 7));
  const voiceFrustration = pickVoice("frustration", rng.int(0, 6));
  const beliefReality = pickBeliefReality(domain, rng.int(1, 2));
  const counterIntuitive = pickResearch(domain, "counterIntuitives", rng.int(1, 3));
  const groundingFact = pickResearch(domain, "groundingFacts", rng.int(0, 1));

  const beliefBlock = beliefReality
    ? `\n\nThe standard belief: "${beliefReality.belief}"\n\nThe reality: ${beliefReality.reality}`
    : `\n\n${counterIntuitive}`;

  return `${transition}\n\nHere's what the standard playbook gets wrong: ${angle}.\n\n${voiceFrustration}\n\nThis is ${emotionalWord} to most people — because it runs directly counter to the conventional advice. But look at the evidence. Look at the people who've actually made ${concept} work for them long-term. The pattern is consistent, even if it's uncomfortable to say.${beliefBlock}\n\n${voiceConviction}\n\n${groundingFact}\n\n${powerPhrase} What shifts is ${amplifier}. That reframe alone is worth more than most tactical advice combined.`;
}

function buildActionSection(topic: string, components: TopicComponents, expansion: TopicExpansion, style: StyleProfile, tone: ToneProfile, rng: SeededRandom): string {
  const actions = rng.pickN(expansion.actionInsights, 3);
  const desire = expansion.underlyingDesire;
  const marker = rng.pick(HUMAN_MARKERS);
  const specifier = rng.pick(SPECIFICITY_INJECTORS);
  const subtopic = rng.pick(expansion.subtopics);

  // Voice + Research injection
  const domain = expansion.domain;
  const voiceEmpathy = pickVoice("empathy", rng.int(0, 6));
  const voiceAside = pickVoice("asides", rng.int(1, 7));
  const practitionerInsight = pickResearch(domain, "practitionerInsights", rng.int(0, 3));
  const specificExample = pickResearch(domain, "specificExamples", rng.int(1, 2));

  if (style.useBulletPoints) {
    const bulletList = actions.map(a => `- ${a}`).join("\n");
    return `${voiceEmpathy}\n\n${marker} this is where theory meets practice.\n\n${bulletList}\n\nNone of these are complicated — ${specifier}. The underlying principle is consistent across all of them: everything here points toward ${desire}. Strip away everything else and that's what remains.\n\n${practitionerInsight} ${voiceAside}`;
  }

  return `${voiceEmpathy}\n\n${marker} let's get specific.\n\n${actions[0]}. This alone changes more than most people expect. The reason it works is because it targets ${expansion.relatedAmplifiers[0] ?? subtopic} directly — not as an afterthought, but as the central strategy.\n\nFrom there: ${actions[1]}. Then ${actions[2]}. Done consistently — ${specifier} — this is how ${subtopic} becomes something you actually own rather than something you're always chasing.\n\n${practitionerInsight}\n\n${specificExample}`;
}

function buildDepthSection(topic: string, components: TopicComponents, expansion: TopicExpansion, style: StyleProfile, tone: ToneProfile, rng: SeededRandom): string {
  const question = rng.pick(expansion.powerQuestions);
  const desire = expansion.underlyingDesire;
  const fear = expansion.biggestFear;
  const emotionalWord = rng.pick(EMOTIONAL_WORDS[tone.emotionCategory] ?? EMOTIONAL_WORDS.wise);
  const transition = rng.pick(TRANSITIONS.emotional);
  const concept = getSemantic(components, 0);

  // Voice + Research injection
  const domain = expansion.domain;
  const voiceVulnerable = pickVoice("vulnerability", rng.int(1, 7));
  const voiceSelfCorrect = pickVoice("selfCorrection", rng.int(0, 5));
  const voiceInterrupt = pickVoice("selfInterruption", rng.int(0, 5));
  const groundingFact = pickResearch(domain, "groundingFacts", rng.int(1, 1));
  const practitionerInsight = pickResearch(domain, "practitionerInsights", rng.int(2, 3));

  return `${transition}\n\n${voiceInterrupt}\n\n${question}\n\nThat question isn't rhetorical. At the core of every serious conversation about ${concept} is a ${emotionalWord} tension between two things: ${desire} — and the very real fear of ${fear}.\n\n${voiceVulnerable}\n\n${groundingFact}\n\n${voiceSelfCorrect} Most advice on this stays on the surface, giving you tactics when what you actually need is clarity about what you're really optimizing for. Tactics without that clarity are just expensive ways to move in circles.\n\n${practitionerInsight}`;
}

function buildYouTubeSection(topic: string, components: TopicComponents, expansion: TopicExpansion, rng: SeededRandom, sectionNumber: number): string {
  const subtopic = expansion.subtopics[sectionNumber % expansion.subtopics.length];
  const truth = expansion.surprisingTruths[sectionNumber % expansion.surprisingTruths.length];
  const transition = rng.pick(TRANSITIONS.escalating);
  const concept = getSemantic(components, sectionNumber + 1);

  return `${transition}\n\n${truth}. Stay with me here — this is where most people's mental model has a gap, even after years in this space.\n\nThe specific thing worth focusing on is ${subtopic}. Because ${concept} only fully clicks when you understand how ${subtopic} connects to everything else.\n\nAnd when that connection becomes clear? The rest of the picture follows.`;
}

function buildConclusion(topic: string, components: TopicComponents, style: WritingStyle, tone: WritingTone, expansion: TopicExpansion, rng: SeededRandom): string {
  const styleProfile = STYLE_PROFILES[style];
  const closingStyle = styleProfile.closingStyle as keyof typeof CLOSINGS;
  const closings = CLOSINGS[closingStyle] ?? CLOSINGS.inspiring;
  const closingRaw = insertSemantic(rng.pick(closings), components, rng.int(0, 2));
  const transition = rng.pick(TRANSITIONS.concluding);

  return `${transition}\n\n${closingRaw}`;
}

function buildCTA(style: WritingStyle, topic: string, components: TopicComponents, rng: SeededRandom): string {
  const concept = getSemantic(components, 3);
  const ctas: Record<string, string[]> = {
    youtube: [
      `If this reframed how you approach ${concept} — drop a comment below. I read every one. And if someone in your life needs to hear this, you already know what to do.`,
      `That's the framework. Now the only question is what you do with it. Comment below with the one thing you're taking from this — it helps more than you know.`,
      `Subscribe if you're serious about this kind of thinking. Not for the numbers — because this is the work I'll keep making for the people who want to go deeper.`,
    ],
    persuasive: [
      `Either you take this seriously or you don't. The decision is straightforward. The follow-through is where it gets real.`,
      `The next step is yours. Everything here is useless without action. Pick the one thing that resonated and apply it before the day is over.`,
    ],
    blog: [
      `What would you add? What part of this hit differently for you? Share it in the comments — the best conversations happen there.`,
      `Save this for the next time you're stuck. And share it with someone who's been sitting with the same question.`,
    ],
    email: [
      `Hit reply and tell me: what's the one thing from this you're actually going to do? I read every response.`,
      `That's it for this one. Next week, we go deeper. Talk soon.`,
    ],
    linkedin: [
      `What's your take? Agree or disagree — I want to hear it. Drop a comment. And if this resonated, share it with someone who's been thinking about this.`,
      `Save this for later. And if you want more of this kind of thinking, follow along — I post every week.`,
    ],
    twitter_thread: [
      `That's the thread.\n\nIf it helped — RT the first tweet so others find it.\n\nFollow me for more threads like this every week.`,
      `End of thread.\n\nLike + RT if this was worth your time 🙏`,
    ],
    default: [
      `The work continues. What's your next move?`,
      `Take one thing from this. Apply it. The rest follows.`,
    ],
  };

  const options = ctas[style] ?? ctas.default;
  return rng.pick(options);
}

function generateSectionHeadlines(topic: string, components: TopicComponents, expansion: TopicExpansion, sectionCount: number, style: WritingStyle, rng: SeededRandom): string[] {
  const domain = expansion.domain.charAt(0).toUpperCase() + expansion.domain.slice(1);
  const subtopic0 = expansion.subtopics[0] ? `${expansion.subtopics[0].charAt(0).toUpperCase() + expansion.subtopics[0].slice(1)}` : "The Core Principle";
  const headlineFormulas = [
    `The Real Problem`,
    `What Actually Works`,
    `The Insight Nobody Explains Clearly`,
    `Why The Standard Approach Falls Short`,
    `The ${domain} Reality`,
    `The Practical Framework`,
    `Going Deeper`,
    `The Application`,
    `What This Really Means`,
    `The Critical Mechanism`,
    `The Foundation`,
    `Where Most People Stall`,
    `The Distinguishing Factor`,
    `The Evidence`,
    `The Long Game`,
    subtopic0,
    `The Underlying System`,
    `What Consistent Results Actually Require`,
  ];

  const shuffled = [...headlineFormulas].sort(() => rng.next() - 0.5);
  return shuffled.slice(0, sectionCount);
}

function selectPullQuote(body: string): string {
  const sentences = body.split(/(?<=[.!?])\s+/);
  const candidates = sentences.filter(s => s.length > 40 && s.length < 140 && !s.startsWith("•") && !s.startsWith("-"));
  if (candidates.length === 0) return "";
  const mid = Math.floor(candidates.length / 2);
  return candidates[mid] ?? "";
}

function buildTwitterThread(title: string, hook: string, sections: ScryvoxSection[], conclusion: string): string {
  const tweets: string[] = [];
  tweets.push(`${title}\n\n${hook}\n\n🧵 (thread)`);

  sections.forEach((s, i) => {
    const body = s.body.replace(/\n\n/g, " ").slice(0, 250);
    tweets.push(`${i + 2}/ ${body}${body.length >= 250 ? "..." : ""}`);
  });

  tweets.push(`${sections.length + 2}/ ${conclusion.replace(/\n\n/g, " ").slice(0, 240)}`);
  tweets.push(`${sections.length + 3}/ That's the thread. Like + RT the first tweet if this was valuable 🙏\n\nFollow @[handle] for more like this.`);

  return tweets.join("\n\n---\n\n");
}

function buildYouTubeScript(title: string, hook: string, sections: ScryvoxSection[], conclusion: string, cta: string): string {
  const lines: string[] = [];
  lines.push(`[TITLE]: ${title}`);
  lines.push(`\n[HOOK]\n${hook}`);
  lines.push(`\n[INTRO]\n[Introduce yourself / channel context here]`);

  sections.forEach((s, i) => {
    if (s.headline) lines.push(`\n[SEGMENT ${i + 1}: ${s.headline.toUpperCase()}]`);
    lines.push(s.body);
    if (i === 0) lines.push(`\n[PATTERN INTERRUPT — change camera angle or cut here]`);
  });

  lines.push(`\n[CONCLUSION]\n${conclusion}`);
  lines.push(`\n[OUTRO / CTA]\n${cta}`);
  lines.push(`\n[END CARD: Subscribe prompt + related video]`);
  return lines.join("\n\n");
}

function buildPDFMarkdown(title: string, hook: string, sections: ScryvoxSection[], conclusion: string): string {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push(`\n---\n`);
  lines.push(hook);

  sections.forEach((s, i) => {
    if (s.headline) lines.push(`\n## ${s.headline}`);
    if (s.subheadline) lines.push(`### ${s.subheadline}`);
    lines.push(`\n${s.body}`);
    if (s.pullQuote) lines.push(`\n> **"${s.pullQuote}"**`);
    if (s.callout) lines.push(`\n> 📌 **${PDF_CALLOUT_PHRASES[i % PDF_CALLOUT_PHRASES.length]}** ${s.callout}`);
  });

  lines.push(`\n---\n`);
  lines.push(`## Summary\n`);
  lines.push(conclusion);
  return lines.join("\n");
}

function buildMarkdown(title: string, hook: string, sections: ScryvoxSection[], conclusion: string, cta: string, style: StyleProfile): string {
  const lines: string[] = [];
  lines.push(`# ${title}\n`);
  lines.push(hook);

  sections.forEach(s => {
    if (s.headline && style.useSubheadlines) lines.push(`\n## ${s.headline}`);
    if (s.subheadline) lines.push(`### ${s.subheadline}`);
    lines.push(`\n${s.body}`);
    if (s.pullQuote && style.usePullQuotes) lines.push(`\n> *"${s.pullQuote}"*`);
  });

  lines.push(`\n---`);
  lines.push(`\n${conclusion}`);
  lines.push(`\n\n${cta}`);
  return lines.join("\n");
}

function computeViralScore(sections: ScryvoxSection[], style: WritingStyle, tone: WritingTone): number {
  let score = 50;
  if (["youtube", "twitter_thread", "linkedin"].includes(style)) score += 15;
  if (["fired_up", "raw", "inspiring"].includes(tone)) score += 10;
  const bodyText = sections.map(s => s.body).join(" ");
  const questionCount = (bodyText.match(/\?/g) || []).length;
  score += Math.min(questionCount * 3, 15);
  if (bodyText.includes(" — ")) score += 5;
  if (sections.some(s => s.pullQuote)) score += 5;
  return Math.min(score, 100);
}

function computeHumanScore(text: string): number {
  let score = 60;
  const contractionCount = (text.match(/[''](?:s|t|re|ve|ll|d|m)\b/g) || []).length;
  score += Math.min(contractionCount * 1.5, 15);
  const emDashCount = (text.match(/—/g) || []).length;
  score += Math.min(emDashCount * 2, 10);
  const fragmentIndicators = (text.match(/\b(?:Full stop\.|Period\.|Always\.|Never\.|Ever\.)\b/g) || []).length;
  score += fragmentIndicators * 3;
  const aiPatterns = (text.match(/\b(?:Furthermore|Moreover|Additionally|In conclusion|It is important)\b/gi) || []).length;
  score -= aiPatterns * 5;
  return Math.max(0, Math.min(score, 100));
}

export function buildContent(
  input: ScryvoxInput,
  expansion: TopicExpansion
): ScryvoxOutput {
  const startTime = Date.now();
  const { topic, style, tone, length, variation } = input;
  const styleProfile = STYLE_PROFILES[style] ?? STYLE_PROFILES.blog;
  const toneProfile = TONE_PROFILES[tone] ?? TONE_PROFILES.serious;
  const lengthConfig = LENGTH_CONFIG[length] ?? LENGTH_CONFIG.medium;
  const rng = new SeededRandom(variation * 9973 + topic.length * 31 + style.length * 7);

  // ── Deep Intelligence Layer: applied internally to every piece Scryvox generates ──
  // The raw topic is intellectually refined before any content is built.
  // This ensures Scryvox never echoes input word-for-word — it thinks first.
  const deepFrame = applyDeepIntelligence(topic, variation);

  // For pdf_chapter style, use the intellectually refined topic as the title foundation
  const refinedTitleBase = style === "pdf_chapter"
    ? deepFrame.intellectualReframe
    : topic;

  // Parse topic components — converts raw user input into semantic understanding
  // so the engine writes about concepts, not keyword phrases
  const components = parseTopicComponents(topic, expansion);

  const title = buildTitle(refinedTitleBase, style, tone, expansion, rng, components);
  const hookRaw = buildHook(topic, style, expansion, components, rng);
  const hook = humanize(hookRaw, styleProfile, toneProfile, variation);

  const { sectionCount } = lengthConfig;
  const headlines = generateSectionHeadlines(topic, components, expansion, sectionCount, style, rng);

  // Deep intelligence enhancers injected per-section type
  const deepEnhancers: Record<number, string> = {
    1: `\n\n${deepFrame.firstPrinciplesBreakdown[0]}\n\n${deepFrame.paradoxAtCore}`,
    3: `\n\n${deepFrame.wisdomPrinciples[0].principle} — ${deepFrame.wisdomPrinciples[0].applicationToTopic}`,
    4: `\n\n${deepFrame.deepQuestion}\n\n${deepFrame.reasoningChain[2]}`,
  };

  const sectionBuilders = [
    (t: string, exp: TopicExpansion, sp: StyleProfile, tp: ToneProfile, r: SeededRandom) => buildProblemSection(t, components, exp, sp, tp, r),
    (t: string, exp: TopicExpansion, sp: StyleProfile, tp: ToneProfile, r: SeededRandom) => buildInsightSection(t, components, exp, sp, tp, r),
    (t: string, exp: TopicExpansion, sp: StyleProfile, tp: ToneProfile, r: SeededRandom) => buildContrarianSection(t, components, exp, sp, tp, r),
    (t: string, exp: TopicExpansion, sp: StyleProfile, tp: ToneProfile, r: SeededRandom) => buildActionSection(t, components, exp, sp, tp, r),
    (t: string, exp: TopicExpansion, sp: StyleProfile, tp: ToneProfile, r: SeededRandom) => buildDepthSection(t, components, exp, sp, tp, r),
  ];

  const sections: ScryvoxSection[] = [];

  for (let i = 0; i < sectionCount; i++) {
    let bodyRaw: string;

    if (style === "youtube") {
      bodyRaw = i < sectionBuilders.length
        ? sectionBuilders[i](topic, expansion, styleProfile, toneProfile, rng)
        : buildYouTubeSection(topic, components, expansion, rng, i);
    } else {
      const builderFn = sectionBuilders[i % sectionBuilders.length];
      bodyRaw = builderFn(topic, expansion, styleProfile, toneProfile, rng);
    }

    // Inject deep intelligence into specific section slots
    const deepEnhancement = deepEnhancers[i % sectionBuilders.length] ?? "";
    const body = humanize(bodyRaw + deepEnhancement, styleProfile, toneProfile, variation + i);

    const section: ScryvoxSection = { body };

    if (styleProfile.useSubheadlines && headlines[i]) {
      section.headline = headlines[i];
    }

    if (styleProfile.usePullQuotes) {
      const quote = selectPullQuote(body);
      if (quote) section.pullQuote = quote;
    }

    // PDF chapters get deep intelligence callouts instead of generic ones
    if (style === "pdf_chapter") {
      const calloutSource = deepFrame.pdfStructureHints.deepDiveCallouts;
      section.callout = calloutSource[i % calloutSource.length]
        ?? expansion.actionInsights[i];
    }

    sections.push(section);
  }

  const conclusionRaw = buildConclusion(topic, components, style, tone, expansion, rng);
  const conclusion = humanize(conclusionRaw, styleProfile, toneProfile, variation + 99);
  const cta = buildCTA(style, topic, components, rng);

  const markdown = buildMarkdown(title, hook, sections, conclusion, cta, styleProfile);
  const plainText = markdown.replace(/#{1,6}\s/g, "").replace(/[>*`_~]/g, "").replace(/---+/g, "---");

  const formattedOutput: ScryvoxOutput["formattedOutput"] = { plainText, markdown };

  if (style === "youtube" || style === "podcast") {
    formattedOutput.youtubeScript = buildYouTubeScript(title, hook, sections, conclusion, cta);
  }
  if (style === "twitter_thread") {
    formattedOutput.twitterThread = buildTwitterThread(title, hook, sections, conclusion);
  }
  if (style === "pdf_chapter") {
    formattedOutput.pdfMarkdown = buildPDFMarkdown(title, hook, sections, conclusion);
  }

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.ceil(wordCount / 238);

  return {
    title,
    hook,
    sections,
    conclusion,
    cta,
    formattedOutput,
    metadata: {
      wordCount,
      estimatedReadTime: `${readMinutes} min read`,
      style: styleProfile.name,
      tone: toneProfile.name,
      length: lengthConfig.label,
      variation,
      domain: expansion.domain,
      viralScore: computeViralScore(sections, style, tone),
      humanScore: computeHumanScore(plainText),
      generationMs: Date.now() - startTime,
    },
  };
}
