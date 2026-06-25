import type { ChapterBlueprint } from "./architect";
import type { ResearchOutput } from "./research";
import { generate } from "../index";
import type { WritingStyle, WritingTone } from "../styles";

export interface ChapterContent {
  number: number;
  title: string;
  subtitle: string;
  wordCount: number;
  hook: string;
  overview: string;
  sections: { sectionTitle: string; body: string }[];
  storyOrExample: string;
  practicalApplication: string;
  actionSteps: string[];
  keyInsight: string;
  chapterSummary: string;
  fullText: string;
}

export interface ContentOutput {
  chapters: ChapterContent[];
  totalWordCount: number;
  fullContent: string;
  fullMarkdown: string;
}

const ACTION_STEP_TEMPLATES = [
  [
    "This week, spend 15 uninterrupted minutes doing a written audit of where you currently stand on this specific area. Not where you want to be — where you actually are. Brutal honesty at this stage is protective, not punishing.",
    "Identify the one thing from this chapter that you've known intellectually but haven't applied. Write it down. Commit to one concrete action around it within 48 hours.",
    "Share the central insight from this chapter with one person in your life. Teaching it cements it — and the conversation it creates often reveals something you didn't realize you'd learned.",
  ],
  [
    "Create a simple tracking system for the key behavior discussed in this chapter. It doesn't need to be complicated — a note on your phone updated daily is enough. What gets measured gets managed.",
    "Design your environment to support the change this chapter calls for. Move one thing, remove one friction point, or add one trigger that makes the right behavior the easier behavior.",
    "Before moving to the next chapter, write down the single most important principle you're taking from this one. One sentence. This is now part of your operating framework.",
  ],
  [
    "Run a 7-day experiment with the core method from this chapter. Commit to consistency for one week before evaluating results — too many people abandon strategies before they've had time to demonstrate their value.",
    "Identify the version of the common mistake from this chapter that you've been making. Name it specifically. Awareness of a pattern is the first condition of changing it.",
    "Find one mentor, peer, or resource that embodies the principle this chapter discusses at a high level. Study them — not to copy, but to extract the transferable principles.",
  ],
];

function buildOverview(blueprint: ChapterBlueprint, research: ResearchOutput): string {
  const isPractical = research.topicOverview.includes("Desired outcome:");
  const painRef = research.audienceProfile.painPoints[blueprint.number % research.audienceProfile.painPoints.length];
  const desireRef = research.audienceProfile.desires[(blueprint.number + 1) % research.audienceProfile.desires.length];

  if (isPractical) {
    return `This chapter gives you the specific, actionable steps for ${blueprint.title.toLowerCase().replace(/\s*—.*/, "")}. No abstract theory — just what works, why it works, and exactly how to do it starting this week.\n\nThe people who get results here share one trait: they start before they feel ready, then refine based on what they learn. By the end of this chapter, you'll have a concrete method you can put into action within 24 hours — not someday, today.`;
  }

  return `This chapter addresses one of the most consistent patterns in ${research.audienceProfile.primaryDescription}: ${painRef}. What looks like a willpower or motivation problem is almost always a framework problem — specifically, the absence of the right framework at the right time. By the end of this chapter, you'll have exactly that: a clear understanding of what's actually happening and a direct path toward ${desireRef}.`;
}

function buildStoryExample(blueprint: ChapterBlueprint, research: ResearchOutput, variation: number): string {
  const v = variation % 3;
  const framework = research.coreFrameworks[blueprint.number % research.coreFrameworks.length];
  const faq = research.faqs[(blueprint.number + 2) % research.faqs.length];
  const isPractical = research.topicOverview.includes("Desired outcome:");

  if (isPractical) {
    const practicalStories = [
      `Take Marcus, a 31-year-old graphic designer who wanted to earn an extra $2,000/month without quitting his agency job. He spent 3 weeks researching "best side hustles" without starting any of them.\n\nThe shift came when he stopped researching and started doing. He listed his design services on Upwork with a specialized niche (SaaS landing pages), sent 8 personalized proposals in his first week, and landed a $450 project by day 9. By month 3, he was consistently earning $2,100–$2,400/month on the side.\n\nThe insight Marcus kept repeating: "I wasted 3 weeks optimizing my approach instead of testing it. The market told me more in 9 days than 3 weeks of YouTube research."\n\nHis first client came from proposal #6. That's the whole story. Start, iterate, don't quit before the data arrives.`,

      `Priya was a high school teacher who wanted to monetize her chemistry expertise. She didn't quit teaching — she spent one Saturday afternoon building a 15-page "AP Chemistry Formula Sheet + Exam Prep Guide" and listed it on Etsy for $7.99.\n\nIn the first month: 43 sales. $344. She raised the price to $12.99 and created a second study guide. By month 4, her Etsy shop was generating $2,100/month — completely on autopilot.\n\nTotal time to build both guides: 11 hours. Total investment: $0 (used Canva free tier).\n\nPriya's lesson: "I kept waiting to build something big. A $8 study guide felt embarrassingly small. That 'small' thing now pays more than two weeks of teaching."`,

      `James spent 14 months trying to build a $500/month YouTube channel. It wasn't working. One conversation with a fellow creator changed his approach entirely: "You're building an audience to sell to later. What if you sold something now and built around that instead?"\n\nJames created a $37 Notion template for freelancers to manage their client pipeline. He posted about it twice on Twitter with a link. In the first 48 hours: 11 sales, $407. In month 1: 68 sales, $2,516.\n\nThe same audience he'd been trying to build for YouTube was already on Twitter, buying solutions to the exact problem he'd already solved for himself.\n\nThe lesson: proximity to a problem you've personally solved is the fastest path to your first income. You don't need an audience — you need one offer and the right 10 people to see it.`,
    ];
    return practicalStories[v];
  }

  const templates = [
    `Consider someone who had everything right on paper: the knowledge, the intention, the initial motivation. They'd read the books, watched the videos, taken the courses. And yet — six months later, not much had changed. Sound familiar?\n\nThe reason this happens so consistently isn't lack of effort or lack of intelligence. It's that they were operating from a framework that couldn't carry the weight they were putting on it. ${framework?.concept ?? "The insight they were missing was structural, not tactical."}\n\nThe shift came when they stopped trying to do more and started asking a different question: not "what should I be doing differently?" but "what am I currently assuming that might not be true?" That question — and the honest answer it required — is where real change begins.`,

    `Here's a pattern that shows up across almost every domain of high performance: the people who make the fastest progress are rarely the most talented or the most motivated at the start. They're the ones who built the right foundation early.\n\n${faq?.question ?? "The question most people never ask is what they're actually optimizing for."} ${faq?.answer?.slice(0, 150) ?? "The answer is almost never what they think it is."}\n\nThis distinction — between surface effort and structural leverage — is what separates people who plateau from people who compound. It's not about working harder. It's about working on the right level.`,

    `The research on this is surprisingly consistent: people who achieve genuine, lasting results in this area almost always describe a specific moment of realization — not a gradual improvement but a sudden, clarifying shift in how they understood the problem.\n\nWhat changed wasn't the information they had access to. It was the framework they were using to interpret that information. ${framework?.keyPrinciple ?? "The right framework doesn't just help you do things better — it helps you see things differently."}\n\nThat's the level this chapter is working at. Not tips. Not hacks. A genuinely different way of seeing the problem — which automatically produces a different approach to solving it.`,
  ];

  return templates[v];
}

function buildPracticalApplication(blueprint: ChapterBlueprint, research: ResearchOutput): string {
  const isPractical = research.topicOverview.includes("Desired outcome:");
  const actionRef = research.faqs.find(f => f.question.toLowerCase().includes("first"))?.answer ??
    "Start with the smallest version of this that you can execute today — and build from there.";
  const framework = research.coreFrameworks[blueprint.number % research.coreFrameworks.length];

  if (isPractical) {
    return `Here's exactly how to apply this chapter — not someday, this week:\n\n**Step 1 — Decide your starting method.** Pick the one approach from this chapter that fits your current skills and time availability. Don't pick the most exciting option — pick the one with the shortest path from "zero" to "first dollar."\n\n**Step 2 — Set up in under 2 hours.** Whether it's a Fiverr profile, an Etsy listing, a simple landing page, or a Twitter thread — your first version should take less than 2 hours to launch. Perfect is the enemy of paid.\n\n**Step 3 — Get it in front of 10 people.** Post it, message it, or share it with 10 specific people who might buy or refer buyers. The market always tells you more than your internal debate.\n\n**Step 4 — Measure after 7 days.** Did anyone express interest? Pay? Ask questions? That feedback loop is your data. Iterate based on real signals, not assumed ones.\n\n${actionRef}\n\nThe rule here: one action today beats ten plans tomorrow. Start imperfect, improve with real feedback.`;
  }

  return `Putting this into practice requires moving from understanding to application — which is always where the gap lives. Here's how to do it with this specific material:\n\n${framework?.howItApplies ?? "Apply the core principle from this chapter directly to your current situation."} The application isn't theoretical. Take the central framework from this chapter and run it against a real, current challenge you're facing. Not a hypothetical. Not a past situation. What's actually in front of you right now?\n\n${actionRef}\n\nThe specific mechanics of the application matter less than the consistency of returning to it. One imperfect application, repeated, beats a perfect plan that stays in the notebook.`;
}

function buildKeyInsight(blueprint: ChapterBlueprint, research: ResearchOutput): string {
  const truth = research.keyStatements[blueprint.number % research.keyStatements.length];
  return truth ?? `The central insight of this chapter isn't the tactics — it's the principle that makes the tactics unnecessary to think about. When the principle is internalized, the right actions become obvious.`;
}

function buildChapterSummary(blueprint: ChapterBlueprint): string {
  return `This chapter covered ${blueprint.coreArgument.toLowerCase()}. The learning outcome — ${blueprint.learningOutcome.toLowerCase()} — is the foundation for what comes next. Before moving forward, make sure the action steps are scheduled, not just noted. The gap between reading and doing is exactly where results either happen or don't.`;
}

async function buildChapter(
  blueprint: ChapterBlueprint,
  research: ResearchOutput,
  style: WritingStyle,
  tone: WritingTone,
  variation: number
): Promise<ChapterContent> {
  const topic = `${blueprint.title}: ${blueprint.subtitle}`;
  const scryvoxOutput = generate({
    topic,
    style,
    tone,
    length: "long",
    audience: "general",
    variation,
  });

  const overviewText = buildOverview(blueprint, research);
  const storyText = buildStoryExample(blueprint, research, variation);
  const practicalText = buildPracticalApplication(blueprint, research);
  const keyInsightText = buildKeyInsight(blueprint, research);
  const summaryText = buildChapterSummary(blueprint);
  const actionSet = ACTION_STEP_TEMPLATES[(blueprint.number - 1) % ACTION_STEP_TEMPLATES.length];

  const sections = scryvoxOutput.sections.map((s, i) => ({
    sectionTitle: s.headline ?? blueprint.keyTopics[i % blueprint.keyTopics.length],
    body: s.body,
  }));

  const fullText = [
    `# Chapter ${blueprint.number}: ${blueprint.title}`,
    `### ${blueprint.subtitle}`,
    ``,
    `---`,
    ``,
    `## Opening`,
    scryvoxOutput.hook,
    ``,
    `## Overview`,
    overviewText,
    ``,
    ...sections.flatMap(s => [`## ${s.sectionTitle}`, s.body, ``]),
    `## A Story Worth Understanding`,
    storyText,
    ``,
    `## Putting It Into Practice`,
    practicalText,
    ``,
    `> 💡 **Key Insight:** ${keyInsightText}`,
    ``,
    `## Your Action Steps`,
    ...actionSet.map((step, i) => `**Step ${i + 1}:** ${step}`),
    ``,
    `## Chapter Summary`,
    summaryText,
    ``,
    `---`,
  ].join("\n");

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    number: blueprint.number,
    title: blueprint.title,
    subtitle: blueprint.subtitle,
    wordCount,
    hook: scryvoxOutput.hook,
    overview: overviewText,
    sections,
    storyOrExample: storyText,
    practicalApplication: practicalText,
    actionSteps: actionSet,
    keyInsight: keyInsightText,
    chapterSummary: summaryText,
    fullText,
  };
}

export async function runContentEngine(
  topic: string,
  blueprints: ChapterBlueprint[],
  research: ResearchOutput,
  style: WritingStyle = "pdf_chapter",
  tone: WritingTone = "wise",
  variation: number = 1
): Promise<ContentOutput> {
  const chapters = await Promise.all(
    blueprints.map((bp, i) => buildChapter(bp, research, style, tone, variation + i))
  );

  const fullContent = chapters.map(c => c.fullText).join("\n\n");
  const totalWordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);

  const fullMarkdown = [
    `# ${topic}`,
    ``,
    `*A complete guide built by Scryvox — ${totalWordCount.toLocaleString()} words across ${chapters.length} chapters*`,
    ``,
    `---`,
    ``,
    `## Table of Contents`,
    ...blueprints.map(bp => `${bp.number}. **${bp.title}** — ${bp.subtitle}`),
    ``,
    `---`,
    ``,
    fullContent,
  ].join("\n");

  return { chapters, totalWordCount, fullContent, fullMarkdown };
}
