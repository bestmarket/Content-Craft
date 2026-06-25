import type { ContentOutput } from "./content";
import type { ArchitectOutput } from "./architect";
import type { ResearchOutput } from "./research";

export interface WeaknessItem {
  area: string;
  description: string;
  severity: "low" | "medium" | "high";
  specificFix: string;
}

export interface CriticOutput {
  overallScore: number;
  contentQualityScore: number;
  audienceAlignmentScore: number;
  sellabilityScore: number;
  structureScore: number;
  strengths: string[];
  weaknesses: WeaknessItem[];
  missingElements: string[];
  redundancies: string[];
  titleStrengthAssessment: string;
  recommendations: string[];
  critiqueSummary: string;
  readyForSale: boolean;
  blockingIssues: string[];
}

function scoreContent(content: ContentOutput, architect: ArchitectOutput, research: ResearchOutput): number {
  let score = 60;
  if (content.totalWordCount > 15000) score += 10;
  if (content.totalWordCount > 25000) score += 5;
  if (content.chapters.length >= 8) score += 8;
  const chaptersWithStories = content.chapters.filter(c => c.storyOrExample.length > 200).length;
  score += Math.min(chaptersWithStories * 2, 10);
  const chaptersWithActionSteps = content.chapters.filter(c => c.actionSteps.length >= 3).length;
  score += Math.min(chaptersWithActionSteps * 1, 7);
  return Math.min(score, 100);
}

function scoreAudienceAlignment(content: ContentOutput, research: ResearchOutput): number {
  let score = 55;
  const fullText = content.fullContent.toLowerCase();
  const painMatches = research.audienceProfile.painPoints.filter(p =>
    p.split(" ").slice(0, 3).some(word => fullText.includes(word.toLowerCase()))
  ).length;
  score += painMatches * 5;
  const desireMatches = research.audienceProfile.desires.filter(d =>
    d.split(" ").slice(0, 3).some(word => fullText.includes(word.toLowerCase()))
  ).length;
  score += desireMatches * 5;
  return Math.min(score, 100);
}

function scoreSellability(architect: ArchitectOutput, content: ContentOutput): number {
  let score = 50;
  if (architect.productTitle.length > 20) score += 5;
  if (architect.subtitle.length > 30) score += 5;
  if (architect.uniqueValueProposition.length > 50) score += 10;
  if (content.totalWordCount > 20000) score += 10;
  const hasActionableChapters = content.chapters.filter(c => c.actionSteps.length > 0).length;
  score += Math.min(hasActionableChapters * 2, 15);
  if (content.chapters.length >= 8) score += 5;
  return Math.min(score, 100);
}

function scoreStructure(content: ContentOutput, architect: ArchitectOutput): number {
  let score = 60;
  const wordCounts = content.chapters.map(c => c.wordCount);
  const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const evenlyDistributed = wordCounts.every(w => w > avgWords * 0.5 && w < avgWords * 1.8);
  if (evenlyDistributed) score += 15;
  if (content.chapters.length >= 7 && content.chapters.length <= 12) score += 10;
  const firstChapterLong = content.chapters[0]?.wordCount > 1500;
  if (firstChapterLong) score += 10;
  const lastChapterHasConclusion = content.chapters[content.chapters.length - 1]?.title.toLowerCase().includes("integrat") ||
    content.chapters[content.chapters.length - 1]?.title.toLowerCase().includes("long game") ||
    content.chapters[content.chapters.length - 1]?.title.toLowerCase().includes("living");
  if (lastChapterHasConclusion) score += 5;
  return Math.min(score, 100);
}

function findWeaknesses(content: ContentOutput, architect: ArchitectOutput, research: ResearchOutput): WeaknessItem[] {
  const weaknesses: WeaknessItem[] = [];

  const shortChapters = content.chapters.filter(c => c.wordCount < 1200);
  if (shortChapters.length > 0) {
    weaknesses.push({
      area: "Chapter Depth",
      description: `${shortChapters.length} chapter(s) fall below the 1,200-word depth threshold: ${shortChapters.map(c => `Chapter ${c.number}`).join(", ")}. Short chapters risk feeling underdeveloped and reduce perceived value.`,
      severity: shortChapters.length > 2 ? "high" : "medium",
      specificFix: "Expand each short chapter with an additional story/example section, deeper framework explanation, and more specific action steps. Target 1,800+ words per core chapter.",
    });
  }

  const chaptersWithoutStories = content.chapters.filter(c => !c.storyOrExample || c.storyOrExample.length < 100);
  if (chaptersWithoutStories.length > 1) {
    weaknesses.push({
      area: "Social Proof & Relatability",
      description: `${chaptersWithoutStories.length} chapters lack concrete stories or examples. Research consistently shows that abstract principle without concrete illustration loses reader trust.`,
      severity: "high",
      specificFix: "Add a specific story, case study, or detailed scenario to each chapter — either a client success story, a counter-intuitive research finding, or a before/after transformation that illustrates the chapter's core principle.",
    });
  }

  if (!architect.uniqueValueProposition || architect.uniqueValueProposition.length < 60) {
    weaknesses.push({
      area: "Unique Value Proposition",
      description: "The UVP is too generic or underdeveloped. Without a crisp, differentiated UVP, the product will struggle to stand out against existing resources on the topic.",
      severity: "high",
      specificFix: "Rewrite the UVP to specifically name: (1) who this is for, (2) what outcome it produces, (3) why the mechanism is different from what already exists. One sentence, maximum 30 words.",
    });
  }

  const missingFAQCoverage = research.faqs.filter(faq =>
    !content.fullContent.toLowerCase().includes(faq.question.split(" ").slice(2, 5).join(" ").toLowerCase())
  );
  if (missingFAQCoverage.length > 3) {
    weaknesses.push({
      area: "Audience Question Coverage",
      description: `${missingFAQCoverage.length} key audience questions identified in research are not explicitly addressed in the content. This creates an objection gap that reduces conversion.`,
      severity: "medium",
      specificFix: "Add an FAQ section to the conclusion, or integrate the top 3-5 unaddressed questions into the most relevant chapters.",
    });
  }

  if (content.totalWordCount < 15000) {
    weaknesses.push({
      area: "Content Volume",
      description: `Total word count of ${content.totalWordCount.toLocaleString()} is below the premium threshold. Products in this price range need 18,000-25,000 words to justify value perception.`,
      severity: "medium",
      specificFix: "Expand existing chapters, add one 'Advanced Application' chapter, and add a comprehensive resource section at the end.",
    });
  }

  const titlesWithoutNumbers = content.chapters.filter(c =>
    !c.title.match(/\d/) && c.title.split(" ").length < 4
  );
  if (titlesWithoutNumbers.length > 2) {
    weaknesses.push({
      area: "Chapter Title Magnetism",
      description: "Several chapter titles are functional but not magnetic. Strong titles increase the likelihood that readers actually start each chapter (table of contents browsing behavior).",
      severity: "low",
      specificFix: "Rewrite chapter titles using proven formats: The [X] Mistake, Why [Common Belief] Is Wrong, How To [Outcome] Without [Common Obstacle], or The [Surprising Truth] About [Topic].",
    });
  }

  return weaknesses;
}

function findMissingElements(content: ContentOutput, research: ResearchOutput): string[] {
  const missing: string[] = [];
  if (!content.fullContent.includes("worksheet") && !content.fullContent.includes("exercise") && !content.fullContent.includes("template")) {
    missing.push("Workbook exercises or fill-in templates — these dramatically increase perceived value and completion rates");
  }
  if (!content.fullContent.includes("bonus") && !content.fullContent.includes("resource")) {
    missing.push("Resource section or bonus materials list — even a curated reading list adds value at low production cost");
  }
  if (!content.fullContent.toLowerCase().includes("progress") && !content.fullContent.toLowerCase().includes("track")) {
    missing.push("Progress tracking mechanism — readers need a way to measure movement or the product feels incomplete");
  }
  if (content.chapters.length < 8) {
    missing.push("Additional depth chapter — ideally an 'Advanced Application' or 'Long Game' chapter for the reader who finishes and wants to go further");
  }
  if (!content.chapters.some(c => c.title.toLowerCase().includes("mistake") || c.title.toLowerCase().includes("wrong") || c.title.toLowerCase().includes("myth"))) {
    missing.push("A 'common mistakes' chapter — one of the highest-engagement chapter types in this category because readers instantly self-identify");
  }
  return missing;
}

export function runCriticEngine(
  content: ContentOutput,
  architect: ArchitectOutput,
  research: ResearchOutput
): CriticOutput {
  const contentQualityScore = scoreContent(content, architect, research);
  const audienceAlignmentScore = scoreAudienceAlignment(content, research);
  const sellabilityScore = scoreSellability(architect, content);
  const structureScore = scoreStructure(content, architect);
  const overallScore = Math.round((contentQualityScore + audienceAlignmentScore + sellabilityScore + structureScore) / 4);

  const weaknesses = findWeaknesses(content, architect, research);
  const missingElements = findMissingElements(content, research);

  const highSeverityCount = weaknesses.filter(w => w.severity === "high").length;
  const blockingIssues = weaknesses.filter(w => w.severity === "high").map(w => w.area);

  const strengths: string[] = [
    `Strong research foundation with ${research.coreFrameworks.length} distinct frameworks that add credibility`,
    `Clear audience profile targeting ${research.audienceProfile.demographicHint}`,
    `${content.chapters.length} chapters provide comprehensive coverage of the topic`,
    `Total word count of ${content.totalWordCount.toLocaleString()} words delivers genuine value depth`,
    architect.uniqueValueProposition.length > 50 ? "Differentiated positioning that separates this from generic resources" : "Foundational structure that can support strong positioning",
  ];

  const recommendations = [
    "Before sale: run the product through the Sellability Engine to optimize title, pricing, and conversion elements",
    "Add at minimum one case study per chapter — ideally a pattern that mirrors the target reader's situation",
    "Develop a standalone workbook or exercise companion to increase perceived value without rewriting content",
    `Address the ${highSeverityCount} high-severity weakness${highSeverityCount !== 1 ? "es" : ""} before any marketing begins`,
    "Test the first chapter with 3-5 target readers and record their feedback before finalizing",
  ];

  const critiqueSummary = `This product has a ${overallScore >= 70 ? "strong" : overallScore >= 55 ? "solid" : "developing"} foundation with ${overallScore}/100 overall readiness. The content quality (${contentQualityScore}/100) and structure (${structureScore}/100) form the backbone. ${highSeverityCount > 0 ? `There are ${highSeverityCount} high-priority issues that need addressing before this is market-ready — primarily around ${blockingIssues.join(" and ")}.` : "No critical blockers were identified."} The sellability score (${sellabilityScore}/100) indicates ${sellabilityScore >= 70 ? "strong commercial positioning" : "room to optimize the commercial packaging before launch"}.`;

  return {
    overallScore,
    contentQualityScore,
    audienceAlignmentScore,
    sellabilityScore,
    structureScore,
    strengths,
    weaknesses,
    missingElements,
    redundancies: [],
    titleStrengthAssessment: `"${architect.productTitle}" scores ${architect.productTitle.split(" ").length > 5 ? "well" : "acceptably"} for memorability. Consider A/B testing against: "${architect.titleAlternatives[0] ?? "alternative title needed"}"`,
    recommendations,
    critiqueSummary,
    readyForSale: overallScore >= 65 && highSeverityCount === 0,
    blockingIssues,
  };
}
