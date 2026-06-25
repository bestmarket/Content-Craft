import { Router, IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable } from "@workspace/db";
import { eq, and, desc, ne, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { logger } from "../lib/logger";
import { generateProductCoverImage, callGeminiFallback } from "./ai-utils";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface PromptItem {
  id: number;
  title: string;
  category: string;
  platforms: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  prompt: string;
  useCase: string;
  tags: string[];
}

interface PromptCategory {
  name: string;
  icon: string;
  description: string;
  prompts: PromptItem[];
}

interface PromptBundle {
  packageTitle: string;
  tagline: string;
  packageDescription: string;
  topic: string;
  angle: string;
  platform: string;
  industry: string;
  bundleSize: number;
  totalPrompts: number;
  qualityScore: number;
  sellabilityScore: number;
  categories: PromptCategory[];
  samplePrompts: PromptItem[];
  pricingRecommended: number;
  landingPageHook: string;
  landingPageBenefits: string[];
  landingPageWhoFor: string[];
  generatedAt: string;
}

interface TrendingNiche {
  id: string;
  title: string;
  description: string;
  industry: string;
  estimatedRevenue: string;
  demandLevel: "hot" | "rising" | "steady";
  platform: string;
  angle: string;
  bundleSize: number;
  promptCount: number;
  color: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRENDING NICHES — 32 hot markets (updated for 2025)
// ─────────────────────────────────────────────────────────────────────────────
const TRENDING_NICHES: TrendingNiche[] = [
  {
    id: "biz-automation",
    title: "ChatGPT Business Automation Pack",
    description: "50 prompts to automate ops, emails, proposals & reporting using ChatGPT",
    industry: "business",
    estimatedRevenue: "$500–$2,000/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "agency",
    bundleSize: 50,
    promptCount: 50,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "linkedin-authority",
    title: "LinkedIn Authority Builder",
    description: "50 prompts to grow a 10K+ LinkedIn following and generate inbound leads",
    industry: "social_media",
    estimatedRevenue: "$800–$3,000/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "professional",
    bundleSize: 50,
    promptCount: 50,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "midjourney-product",
    title: "Midjourney Product Photography",
    description: "100 advanced Midjourney prompts for stunning e-commerce product visuals",
    industry: "ecommerce",
    estimatedRevenue: "$600–$2,500/mo",
    demandLevel: "hot",
    platform: "midjourney",
    angle: "ecommerce",
    bundleSize: 100,
    promptCount: 100,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "sales-copy",
    title: "High-Converting Sales Copy Engine",
    description: "50 proven prompts for VSLs, landing pages, and email sequences that convert",
    industry: "marketing",
    estimatedRevenue: "$1,000–$4,000/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "copywriter",
    bundleSize: 50,
    promptCount: 50,
    color: "from-orange-500 to-red-600",
  },
  {
    id: "youtube-growth",
    title: "YouTube Channel Growth Pack",
    description: "50 prompts to generate viral titles, scripts, descriptions & thumbnails",
    industry: "content",
    estimatedRevenue: "$400–$1,800/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "creator",
    bundleSize: 50,
    promptCount: 50,
    color: "from-red-500 to-rose-600",
  },
  {
    id: "coaching-client",
    title: "Life & Business Coach Client Acquisition",
    description: "50 prompts for discovery calls, proposals, and client breakthrough sessions",
    industry: "coaching",
    estimatedRevenue: "$700–$2,500/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "coach",
    bundleSize: 50,
    promptCount: 50,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "ecom-product",
    title: "E-Commerce Product Description Machine",
    description: "100 Shopify & Amazon listing prompts that turn browsers into buyers",
    industry: "ecommerce",
    estimatedRevenue: "$500–$2,000/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "ecommerce",
    bundleSize: 100,
    promptCount: 100,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "real-estate",
    title: "Real Estate Lead Generation Pack",
    description: "50 prompts for property listings, buyer outreach, and agent marketing",
    industry: "realestate",
    estimatedRevenue: "$600–$2,200/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "realestate",
    bundleSize: 50,
    promptCount: 50,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "tiktok-viral",
    title: "TikTok Viral Content Factory",
    description: "50 scroll-stopping hook prompts and script generators for TikTok creators",
    industry: "social_media",
    estimatedRevenue: "$400–$1,500/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "creator",
    bundleSize: 50,
    promptCount: 50,
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "freelance-agency",
    title: "Freelancer & Agency Proposal Pack",
    description: "50 prompts to write winning proposals, client reports, and retainer pitches",
    industry: "business",
    estimatedRevenue: "$800–$3,000/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "freelancer",
    bundleSize: 50,
    promptCount: 50,
    color: "from-teal-500 to-green-600",
  },
  {
    id: "course-creator",
    title: "Online Course Creation Masterpack",
    description: "50 prompts to build, script, and market a complete online course from scratch",
    industry: "education",
    estimatedRevenue: "$700–$2,800/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "educator",
    bundleSize: 50,
    promptCount: 50,
    color: "from-indigo-500 to-violet-600",
  },
  {
    id: "seo-content",
    title: "SEO Content Marketing Engine",
    description: "50 prompts to create Google-ranking blog posts, briefs, and link-building emails",
    industry: "marketing",
    estimatedRevenue: "$500–$2,000/mo",
    demandLevel: "steady",
    platform: "chatgpt",
    angle: "marketer",
    bundleSize: 50,
    promptCount: 50,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "fitness-coach",
    title: "Fitness Coach Client Conversion Pack",
    description: "50 prompts to write personalized plans, gym content, and client nurture emails",
    industry: "health",
    estimatedRevenue: "$400–$1,500/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "coach",
    bundleSize: 50,
    promptCount: 50,
    color: "from-lime-500 to-green-600",
  },
  {
    id: "ai-art-styles",
    title: "AI Art Midjourney Mega Pack",
    description: "100 cinematic, portrait, and fantasy Midjourney prompts with style modifiers",
    industry: "creative",
    estimatedRevenue: "$300–$1,200/mo",
    demandLevel: "hot",
    platform: "midjourney",
    angle: "artist",
    bundleSize: 100,
    promptCount: 100,
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "email-marketing",
    title: "Email Marketing Revenue Machine",
    description: "50 prompts for welcome sequences, broadcasts, and re-engagement campaigns",
    industry: "marketing",
    estimatedRevenue: "$600–$2,500/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "marketer",
    bundleSize: 50,
    promptCount: 50,
    color: "from-yellow-500 to-amber-600",
  },
  {
    id: "claude-research",
    title: "Claude Research & Analysis Pro Pack",
    description: "50 deep research prompts for competitive analysis, reports & strategy memos",
    industry: "business",
    estimatedRevenue: "$700–$2,500/mo",
    demandLevel: "rising",
    platform: "claude",
    angle: "analyst",
    bundleSize: 50,
    promptCount: 50,
    color: "from-slate-500 to-gray-700",
  },
  {
    id: "restaurant-marketing",
    title: "Restaurant & Food Marketing Pack",
    description: "50 prompts for menu copy, social media, review responses & local SEO",
    industry: "food",
    estimatedRevenue: "$300–$1,000/mo",
    demandLevel: "steady",
    platform: "chatgpt",
    angle: "owner",
    bundleSize: 50,
    promptCount: 50,
    color: "from-orange-400 to-red-500",
  },
  {
    id: "personal-brand",
    title: "Personal Brand Authority Builder",
    description: "50 prompts to position yourself as the go-to expert in your niche",
    industry: "marketing",
    estimatedRevenue: "$500–$2,000/mo",
    demandLevel: "rising",
    platform: "chatgpt",
    angle: "creator",
    bundleSize: 50,
    promptCount: 50,
    color: "from-violet-500 to-indigo-600",
  },
  {
    id: "gemini-multimodal",
    title: "Gemini Multimodal Creative Pack",
    description: "50 Gemini prompts that combine image + text analysis for content creation",
    industry: "creative",
    estimatedRevenue: "$400–$1,500/mo",
    demandLevel: "rising",
    platform: "gemini",
    angle: "creator",
    bundleSize: 50,
    promptCount: 50,
    color: "from-blue-400 to-cyan-600",
  },
  {
    id: "hr-recruitment",
    title: "HR & Talent Acquisition Prompts",
    description: "50 prompts for job descriptions, interview questions, and offer letters",
    industry: "business",
    estimatedRevenue: "$500–$2,000/mo",
    demandLevel: "steady",
    platform: "chatgpt",
    angle: "professional",
    bundleSize: 50,
    promptCount: 50,
    color: "from-emerald-400 to-teal-600",
  },
  {
    id: "cold-outreach",
    title: "Cold DM & Outreach Closer Pack",
    description: "50 personalized cold outreach prompts for Instagram, LinkedIn, and email",
    industry: "sales",
    estimatedRevenue: "$600–$2,500/mo",
    demandLevel: "hot",
    platform: "chatgpt",
    angle: "salesperson",
    bundleSize: 50,
    promptCount: 50,
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "music-production",
    title: "Music & Producer Content Pack",
    description: "50 prompts for beat descriptions, Suno/Udio, artist bios, and promo copy",
    industry: "creative",
    estimatedRevenue: "$300–$1,000/mo",
    demandLevel: "rising",
    platform: "universal",
    angle: "artist",
    bundleSize: 50,
    promptCount: 50,
    color: "from-purple-400 to-fuchsia-600",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TEMPLATE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const ANGLES: Record<string, string> = {
  agency: "digital agency owners and marketing professionals",
  professional: "business professionals and executives",
  creator: "content creators and influencers",
  coach: "coaches, consultants, and service providers",
  ecommerce: "e-commerce store owners and product sellers",
  freelancer: "freelancers and independent contractors",
  marketer: "marketers and growth specialists",
  educator: "online course creators and educators",
  analyst: "business analysts and researchers",
  artist: "digital artists and creatives",
  owner: "small business owners",
  realestate: "real estate agents and investors",
  salesperson: "sales professionals and business development reps",
};

const PLATFORM_NOTES: Record<string, string> = {
  chatgpt: "Optimized for ChatGPT-4 and GPT-4o. Use in the main chat or Custom GPT builder.",
  claude: "Optimized for Claude 3.5 Sonnet. Best used in Claude.ai or via the API.",
  gemini: "Optimized for Gemini 1.5 Pro and Gemini Advanced. Supports multimodal inputs.",
  midjourney: "Optimized for Midjourney v6.1. Use in Discord or Midjourney.com.",
  universal: "Platform-agnostic. Works with ChatGPT, Claude, Gemini, and Perplexity.",
};

// Core prompt template builder
function buildPrompt(
  template: string,
  topic: string,
  angle: string,
  audience: string,
  platform: string
): string {
  return template
    .replace(/\{topic\}/g, topic)
    .replace(/\{angle\}/g, angle)
    .replace(/\{audience\}/g, audience)
    .replace(/\{platform\}/g, PLATFORM_NOTES[platform] ?? "any AI platform");
}

// 10 prompt categories × 5 prompts each = 50 per package
function buildCategories(
  topic: string,
  angle: string,
  audience: string,
  platform: string,
  industry: string
): PromptCategory[] {
  const fill = (t: string) => buildPrompt(t, topic, angle, audience, platform);
  const audienceDesc = ANGLES[angle] ?? audience;

  const ALL_CATEGORIES: PromptCategory[] = [
    {
      name: "Sales & Conversion Copy",
      icon: "💰",
      description: "High-converting prompts to turn readers into buyers",
      prompts: [
        {
          id: 1,
          title: "VSL Script Master",
          category: "Sales & Conversion Copy",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Write a complete video sales letter script in minutes",
          tags: ["sales", "video", "copywriting"],
          prompt: fill(
            `You are an elite direct-response copywriter with 20 years of experience writing video sales letters (VSLs) that have generated over $50M in revenue across multiple industries.

Your task: Write a complete, emotionally compelling VSL script about {topic} for {audience} that turns skeptical viewers into eager buyers.

PROVEN VSL STRUCTURE (follow this exactly):
1. PATTERN INTERRUPT [0:00–0:20] — Start with a shocking statistic, counterintuitive truth, or provocative question specific to {topic}. Make them lean in.

2. PAIN AMPLIFICATION [0:20–1:30] — Describe the exact painful situation your viewer is in right now. Use sensory language. Name the emotions. Make them feel seen and understood.

3. AGITATION [1:30–2:30] — Show what happens if they keep doing what they're doing. Paint the future they fear. Be specific, not abstract.

4. CREDIBILITY BRIDGE [2:30–3:00] — Briefly establish why you/your product is the solution. Not a bio — a positioning statement.

5. SOLUTION REVEAL [3:00–4:00] — Introduce {topic} as the bridge from their current pain to their desired outcome. Focus on outcomes, not features.

6. PROOF STACK [4:00–5:30] — Present 3 different types of proof: (a) a transformational story, (b) a specific result metric, (c) a logical argument that makes the claim undeniable.

7. OFFER PRESENTATION [5:30–6:30] — State the full value stack. Price anchor. Present the real price as a logical no-brainer.

8. URGENCY + CTA [6:30–7:00] — One specific call to action. Real scarcity if possible. Make clicking feel like the obvious next step.

Requirements:
— Conversational 7th-grade reading level throughout
— Use "you" language (never "people" or "they")
— Include at least 2 rhetorical questions to keep viewers engaged
— Every section ends with a hook into the next
— Time markers included for production

Deliver the full script with stage directions.`
          ),
        },
        {
          id: 2,
          title: "Sales Page Conversion Copy",
          category: "Sales & Conversion Copy",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Generate a full sales page for any {topic} offer",
          tags: ["sales page", "landing page", "copywriting"],
          prompt: fill(
            `You are a world-class direct response copywriter who has written sales pages responsible for 7-figure product launches.

Write a complete, high-converting sales page for {topic} targeting {audience}.

Use the PASTOR framework (Problem, Amplify, Story, Testimony, Offer, Response):

HEADLINE SECTION:
— Primary headline that leads with the biggest outcome/transformation
— Subheadline that clarifies who it's for and what it does
— Hero image description (describe the ideal visual)

BODY COPY STRUCTURE:
1. Open Loop — Start with a question or statement that creates curiosity
2. Problem Statement — Articulate the exact pain in the reader's own words
3. Empathy Bridge — Show you understand their struggle personally
4. Solution Introduction — Reveal {topic} as the answer
5. Feature-Benefit Stack — List 5 features, each explained with a specific benefit and a micro-story
6. Proof Section — 2 testimonial templates + 1 case study framework
7. About Section — Authority statement (fill-in-the-blank format)
8. FAQ Section — Answer the top 5 objections buyers have about {topic}
9. Guarantee — Write a bold, confidence-building guarantee
10. CTA Section — Primary button text + urgency statement

FORMAT: Write in actual copy (not bullet points about what to write). This should be ready to paste onto a page.`
          ),
        },
        {
          id: 3,
          title: "Cold Email Sequence (5-Part)",
          category: "Sales & Conversion Copy",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Generate a 5-email outreach sequence to close deals on {topic}",
          tags: ["email", "cold outreach", "sales sequence"],
          prompt: fill(
            `You are a B2B cold email expert who has written outreach campaigns achieving 40–60% open rates and 15–25% reply rates for {topic}.

Write a 5-email cold outreach sequence targeting {audience} to generate qualified leads for {topic}.

EMAIL 1 — THE OPENER (Day 1):
Subject: [Pattern interrupt — no clickbait, purely curiosity]
Body: Ultra-short (4 sentences max). One specific pain point. One question. No pitch.

EMAIL 2 — THE VALUE BOMB (Day 3):
Subject: [Something specific and useful]
Body: Share one insight, tool, or resource directly valuable to {audience} — no strings attached. Soft CTA.

EMAIL 3 — THE SOCIAL PROOF DROP (Day 6):
Subject: [Name-drop or result-focused]
Body: Brief case study or transformation story. Make the reader see themselves in it. Soft CTA.

EMAIL 4 — THE DIRECT OFFER (Day 10):
Subject: [Clear, direct — what's in it for them]
Body: Clear offer. Clear benefit. Clear CTA. Under 100 words.

EMAIL 5 — THE BREAKUP (Day 15):
Subject: "Should I close your file?"
Body: Permission-based final follow-up. Creates FOMO. Leaves door open.

For each email include:
— Subject line (+ 2 A/B variants)
— Preview text
— Full body copy
— P.S. line (increases reply rate significantly)

Tone: Conversational, peer-to-peer, never salesy. Write like a real human.`
          ),
        },
        {
          id: 4,
          title: "High-Ticket Proposal Generator",
          category: "Sales & Conversion Copy",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Write a premium proposal for {topic} services worth $5K–$50K",
          tags: ["proposal", "agency", "high-ticket"],
          prompt: fill(
            `You are a senior business development consultant who has closed over $10M in high-ticket service contracts for {topic}.

Create a complete, premium business proposal for {topic} targeting {audience}.

PROPOSAL STRUCTURE:

EXECUTIVE SUMMARY (1 page):
— Client situation in their words (fill template)
— Proposed solution overview
— Expected outcomes with specific metrics
— Investment range

SECTION 1 — SITUATION ANALYSIS:
— Current state (their pain, using fill-in prompts)
— Root cause analysis
— Cost of inaction (financial + opportunity)

SECTION 2 — RECOMMENDED SOLUTION:
— Methodology overview for {topic}
— 3-phase implementation roadmap with timelines
— Deliverables list (be specific and valuable)
— What is NOT included (prevents scope creep)

SECTION 3 — PROOF OF CAPABILITY:
— Relevant case study framework (anonymized)
— Team expertise statement
— Relevant tools and processes

SECTION 4 — INVESTMENT & ROI:
— Investment table (fill-in structure)
— ROI calculation framework
— Payment terms options

SECTION 5 — NEXT STEPS:
— Decision timeline
— Kickoff process
— Client commitment required

APPENDIX: Terms & Conditions framework

Make this feel premium, thorough, and worth the investment.`
          ),
        },
        {
          id: 5,
          title: "Objection Eliminator Script",
          category: "Sales & Conversion Copy",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Handle every objection buyers have about {topic}",
          tags: ["objections", "sales", "persuasion"],
          prompt: fill(
            `You are a world-class sales trainer and negotiation expert specializing in {topic} for {audience}.

Generate a comprehensive objection-handling script for {topic} that addresses every reason a qualified prospect might say no.

FORMAT for each objection:

OBJECTION: [The exact words they say]
WHAT THEY MEAN: [The real underlying concern]
ACKNOWLEDGE: [Show you heard and validate the concern]
REFRAME: [Shift their perspective without dismissing them]
PROOF RESPONSE: [Data point, story, or example that dissolves the objection]
BRIDGE TO YES: [Transition statement that moves them toward a decision]
FOLLOW-UP QUESTION: [A question that opens a new path forward]

Cover these objection categories for {topic}:
1. PRICE OBJECTIONS ("It's too expensive", "I can't afford it right now")
2. TIME OBJECTIONS ("I'm too busy", "It's not a good time")
3. TRUST OBJECTIONS ("I don't know you", "I've been burned before")
4. AUTHORITY OBJECTIONS ("I need to talk to my partner/boss")
5. URGENCY OBJECTIONS ("Let me think about it")
6. NEED OBJECTIONS ("I can figure this out myself")
7. COMPETITOR OBJECTIONS ("I'm already using [alternative]")

For each objection provide 3 different response variations (confident, empathetic, logical).`
          ),
        },
      ],
    },
    {
      name: "Content & Social Media",
      icon: "📱",
      description: "Viral content creation prompts for maximum reach and engagement",
      prompts: [
        {
          id: 6,
          title: "LinkedIn Viral Post System",
          category: "Content & Social Media",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Generate 10 LinkedIn posts that attract {audience} clients",
          tags: ["linkedin", "social media", "thought leadership"],
          prompt: fill(
            `You are a LinkedIn growth expert who has built 50K+ audiences for {audience} and generated thousands of qualified leads using organic content about {topic}.

Create 10 LinkedIn posts about {topic} designed to maximize reach, engagement, and inbound leads from {audience}.

For each post, use a different viral post format:
1. CONTROVERSIAL TAKE — Challenge a widely-held belief in {topic}
2. PERSONAL STORY — A vulnerable moment that led to a {topic} breakthrough
3. NUMBERED LIST — "5 things I wish I knew about {topic}"
4. BEFORE/AFTER — Client transformation story
5. INDUSTRY INSIGHT — A non-obvious trend in {topic} most people miss
6. MISTAKE POST — "I made a $X mistake so you don't have to"
7. FRAMEWORK REVEAL — Share a proprietary method for {topic}
8. HOT TAKE — Disagree with a popular guru about {topic}
9. BEHIND THE SCENES — Day-in-the-life showing {topic} in action
10. QUESTION POST — A thought-provoking question that sparks debate

For each post:
— HOOK (first 2 lines that show without being cut off — under 200 chars)
— BODY (storytelling or list structure)
— CTA (one specific action — comment, DM, follow)
— HASHTAG STRATEGY (3–5 niche-relevant tags)
— BEST DAY/TIME to post

Tone: Direct, confident, human. No corporate speak. No emojis overload.`
          ),
        },
        {
          id: 7,
          title: "TikTok Hook Architecture System",
          category: "Content & Social Media",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Create 20 scroll-stopping TikTok hooks for {topic}",
          tags: ["tiktok", "hooks", "video content"],
          prompt: fill(
            `You are a TikTok viral content strategist who has helped creators grow from 0 to 100K+ followers in under 90 days using {topic} content.

Generate 20 proven TikTok hooks for {topic} content targeting {audience}.

HOOK TYPES TO INCLUDE (2 of each):

CURIOSITY HOOKS: Create an information gap that forces viewers to watch
Example structure: "Most people who [do thing in {topic}] don't know about [surprising fact]..."

BOLD CLAIM HOOKS: Make a statement so surprising viewers can't scroll
Example structure: "I [achieved X outcome] in {topic} by doing the opposite of what everyone teaches..."

STORY HOOKS: Drop into the middle of a compelling moment
Example structure: "The day I [crisis moment related to {topic}] changed everything..."

CONTROVERSY HOOKS: Take a position that polarizes the audience
Example structure: "Unpopular opinion: everything you've been told about {topic} is wrong..."

LISTICLE HOOKS: Promise specific, numbered value
Example structure: "3 {topic} mistakes that cost me $[X] — and how to avoid them..."

PATTERN INTERRUPT HOOKS: Start with something unexpected
Example structure: "Stop. Before you try {topic}, watch this first..."

RESULT HOOKS: Lead with an impossible-sounding outcome
Example structure: "I used {topic} to [impressive outcome] in [surprisingly short time]..."

QUESTION HOOKS: Ask something they've wondered but never said
Example structure: "Have you ever wondered why [obvious {topic} problem] happens to you?"

For each hook:
— The hook text (under 10 seconds when spoken)
— Why it works psychologically
— Ideal video concept to follow it
— Target emotion triggered`
          ),
        },
        {
          id: 8,
          title: "Email Newsletter Growth Engine",
          category: "Content & Social Media",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Build and monetize a newsletter audience around {topic}",
          tags: ["newsletter", "email list", "content marketing"],
          prompt: fill(
            `You are an expert newsletter operator who has grown and monetized email lists about {topic} to 10K+ subscribers with 45%+ open rates.

Create a complete 4-week newsletter content strategy for {topic} targeting {audience}.

WEEK-BY-WEEK BREAKDOWN:

For each of 4 weeks, provide:
— Newsletter name & positioning statement
— Week theme and why it serves {audience}
— Issue #1 (Monday send): Full newsletter outline with headline, lead story, main content block, curated section, CTA
— Issue #2 (Thursday send): Full newsletter outline

GROWTH MECHANISMS TO INCLUDE:
— Subject line formula that achieves 45%+ open rates
— Preview text strategy
— Referral incentive idea specific to {topic}
— Re-engagement sequence for cold subscribers
— Upgrade/monetization angle for paid tier

NEWSLETTER FORMATS (rotate these weekly):
1. The Deep Dive — One topic explored thoroughly
2. The Roundup — Best of week in {topic}
3. The Case Study — One success story deconstructed
4. The Contrarian — Push back on a popular {topic} belief

Write actual newsletter content (not instructions). Ready to send.`
          ),
        },
        {
          id: 9,
          title: "Instagram Carousel Creator",
          category: "Content & Social Media",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Generate 5 swipe-worthy Instagram carousels about {topic}",
          tags: ["instagram", "carousel", "visual content"],
          prompt: fill(
            `You are an Instagram content strategist who creates viral carousels in the {topic} niche that regularly get saved 1,000+ times.

Create 5 complete Instagram carousel posts about {topic} for {audience}.

For each carousel (10 slides each):

SLIDE 1 — COVER:
— Attention-grabbing headline (under 7 words)
— Visual description (what should the graphic look like)
— Why someone would stop scrolling here

SLIDES 2–9 — CONTENT BODY:
— Slide headline (short, punchy)
— Body text (under 50 words per slide)
— Visual element description
— Transition hook to next slide

SLIDE 10 — CTA:
— What action to take
— What they'll get from doing it
— Follow/Save/Share prompt

CAROUSEL TOPICS TO COVER:
1. "5 things beginners get wrong about {topic}"
2. "The {topic} framework that changed my results"
3. "Before vs After: how {topic} transforms [outcome]"
4. "The uncomfortable truth about {topic} nobody talks about"
5. "[Number] {topic} mistakes that are costing you [thing]"

For each: suggest caption (300 words), 5 hashtags, best posting time.`
          ),
        },
        {
          id: 10,
          title: "Viral Twitter/X Thread Creator",
          category: "Content & Social Media",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Write 5 viral Twitter threads about {topic} that get reshared",
          tags: ["twitter", "x", "threads", "viral"],
          prompt: fill(
            `You are a Twitter/X growth expert who has written viral threads in the {topic} space that have been retweeted by industry leaders and generated thousands of followers.

Write 5 complete Twitter/X threads about {topic} for {audience}.

For each thread (15–20 tweets each):

TWEET 1 — THE HOOK:
— Must create immediate curiosity or make a bold claim
— Under 220 characters
— End with "Thread 🧵👇" or "Here's what I learned:"

TWEETS 2–14 — THE PAYLOAD:
— Each tweet stands alone but creates curiosity for the next
— Mix of: numbered insights, mini-stories, data points, frameworks
— End most tweets with "—" or "..." to pull readers forward
— Include at least one tweet that challenges a mainstream belief about {topic}

TWEET 15 — THE SUMMARY:
— "If you got value from this thread:"
— List 3 key takeaways
— Ask a question to drive replies

TWEET 16 — THE CTA:
— Follow prompt + what they'll get by following
— Retweet request (give them a reason to share)

THREAD TOPICS:
1. The definitive {topic} playbook (step-by-step)
2. {Number} {topic} lessons from [impressive source/experience]
3. The counterintuitive truth about {topic}
4. How I used {topic} to achieve [specific outcome]
5. Why everything you know about {topic} is probably wrong

Write all 5 threads in full. No placeholders.`
          ),
        },
      ],
    },
    {
      name: "Email Marketing & Automation",
      icon: "📧",
      description: "Revenue-generating email sequences and automation prompts",
      prompts: [
        {
          id: 11,
          title: "Welcome Sequence Builder (7-Part)",
          category: "Email Marketing & Automation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Convert new subscribers into buyers with a proven 7-email welcome sequence",
          tags: ["email", "welcome sequence", "automation"],
          prompt: fill(
            `You are a top email marketing strategist who has built welcome sequences for {topic} that consistently achieve 60%+ open rates and 15%+ purchase conversion rates.

Create a complete 7-email welcome sequence for a {topic} brand targeting {audience}.

EMAIL SEQUENCE MAP:

EMAIL 1 — THE WARM WELCOME (Immediate):
Goal: Deliver what was promised, establish brand voice, set expectations
Subject: [First-name personalization] + immediate value signal
Content: Thank them, deliver the lead magnet/freebie, tell them what's coming next, preview Email 2

EMAIL 2 — YOUR STORY (Day 2):
Goal: Build deep connection through the founder/brand origin story
Subject: [Curiosity hook about a transformation]
Content: The full origin story — the struggle, the turning point, the realization. Connect it to {topic}.

EMAIL 3 — THE BIG PROBLEM (Day 3):
Goal: Articulate their pain better than they can
Subject: [Name the problem they have]
Content: Deep dive into the #1 problem {audience} faces with {topic}. Make them feel understood.

EMAIL 4 — THE QUICK WIN (Day 5):
Goal: Give a fast, implementable tip that creates a result and proves your value
Subject: "Try this today:" + specific tip related to {topic}
Content: One actionable framework they can use in the next 30 minutes.

EMAIL 5 — SOCIAL PROOF (Day 7):
Goal: Show transformation is real for people just like them
Subject: [Name] went from [before] to [after] with {topic}
Content: Case study story + testimonial collection ask

EMAIL 6 — THE INVITATION (Day 9):
Goal: Soft introduction of your paid offer
Subject: [Are you ready for the next level with {topic}?]
Content: Transition from free to paid naturally. Present offer as the logical next step.

EMAIL 7 — THE CLOSE (Day 12):
Goal: Create urgency, capture buyers who haven't decided yet
Subject: [Last call / direct offer]
Content: Summarize transformation, address final objections, clear CTA with deadline.

For each email provide: Subject (+ 2 A/B variants), Preview text, Full body copy, P.S. line, Mobile reading time estimate.`
          ),
        },
        {
          id: 12,
          title: "Re-Engagement Campaign (5-Part)",
          category: "Email Marketing & Automation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Win back cold subscribers who haven't opened in 60+ days",
          tags: ["email", "re-engagement", "win-back"],
          prompt: fill(
            `You are a retention email specialist who has reactivated 35–50% of dead email lists for {topic} businesses.

Create a 5-email re-engagement campaign for {topic} subscribers who haven't opened in 60+ days.

CAMPAIGN GOAL: Re-engage or clean your list — either way you win.

EMAIL 1 — THE BREAKUP DRAFT (Send Day 1):
Subject: "I think I need to say goodbye, [First Name]"
Tone: Genuinely curious, slightly sad. Ask if they're still interested in {topic}. Give them a reason to click.

EMAIL 2 — THE PERSONAL REACH-OUT (Send Day 3):
Subject: "A quick question for you..."
Tone: Conversational, personal. One simple question about where they are with {topic} right now.

EMAIL 3 — THE VALUE BOMB (Send Day 6):
Subject: "[Free] The {topic} resource you didn't know you needed"
Tone: Giving, no-strings-attached. Send them your best piece of {topic} content unexpectedly.

EMAIL 4 — THE SOCIAL PROOF (Send Day 9):
Subject: "What [Name] did with {topic} in [timeframe] — incredible"
Tone: Storytelling. Share a transformation story. Make them feel like they're missing out.

EMAIL 5 — THE FINAL NOTICE (Send Day 14):
Subject: "Removing you tomorrow — unless..."
Tone: Clear, honest, respectful. Tell them you're cleaning the list. Give them one last chance to stay (with a specific reason).

For each: Write full email copy. Include a "preference center" link note. Segment strategy (who sees which email). Expected re-engagement rate benchmark.`
          ),
        },
        {
          id: 13,
          title: "Product Launch Email Campaign",
          category: "Email Marketing & Automation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Launch any {topic} product with a proven email sequence",
          tags: ["email", "product launch", "campaign"],
          prompt: fill(
            `You are a product launch specialist who has used email to generate 6-figure launches for {topic} offers.

Write a complete product launch email campaign for {topic} targeting {audience}. The launch opens on Day 7 and closes on Day 14 (7-day cart).

PRE-LAUNCH PHASE (Days 1–6):
— Day 1: Tease email — hint at something big coming for {topic} lovers
— Day 3: Indoctrination email — share the problem {topic} solves (no mention of product)
— Day 5: Social proof email — gather excitement with testimonials and interest

LAUNCH PHASE (Days 7–14):
— Day 7 (Cart Open): Full launch email with offer details, early bird pricing
— Day 8: "Did you see this?" FAQ and objection-handling email
— Day 10: Case study / success story email
— Day 12: Urgency email — "Only X spots/copies left"
— Day 13: Last chance warning email
— Day 14 (9am): Final hours reminder
— Day 14 (5pm): "Closing tonight" — last email

For each email:
— Subject line + 3 A/B variants
— Full body copy
— Optimal send time
— Segment conditions (who gets it)
— Expected open rate benchmark

BONUS: Write 2 "post-launch" emails — one for buyers (welcome/delivery), one for non-buyers (wait list or downsell).`
          ),
        },
        {
          id: 14,
          title: "Abandoned Cart Recovery System",
          category: "Email Marketing & Automation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Recover 15–30% of abandoned purchases for {topic} offers",
          tags: ["email", "cart abandonment", "recovery"],
          prompt: fill(
            `You are an e-commerce conversion specialist who has recovered millions in abandoned revenue for {topic} businesses.

Create a 3-email abandoned cart recovery sequence for {topic} products purchased by {audience}.

EMAIL 1 — THE GENTLE REMINDER (1 hour after abandonment):
Goal: Non-intrusive, helpful tone. They might have just gotten distracted.
Subject: "You left something behind..."
Content: Product reminder, cart preserved message, easy return link. No pressure.

EMAIL 2 — THE OBJECTION HANDLER (24 hours):
Goal: Address the real reason they didn't buy.
Subject: "Quick question about your {topic} order..."
Content: Ask if they have a question. Pre-answer top 3 objections about {topic} (price, timing, results). Offer support.

EMAIL 3 — THE FINAL OFFER (48 hours):
Goal: Create genuine urgency and sweeten the deal.
Subject: "Last chance + a little something extra"
Content: Final reminder. Add an unexpected bonus. Set a real expiration on the cart.

For each email:
— Subject line (+ 2 variants)
— Full copy ready to send
— Personalization tokens to use
— Recommended timing
— A/B test idea

BONUS: Write follow-up survey email for those who still didn't buy (why they didn't — this data is gold).`
          ),
        },
        {
          id: 15,
          title: "Broadcast Email Template System",
          category: "Email Marketing & Automation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Write high-converting broadcast emails for any {topic} occasion",
          tags: ["email", "broadcast", "template"],
          prompt: fill(
            `You are an email copywriter specializing in {topic} who writes broadcast emails that consistently achieve 45%+ open rates and 5–10% click rates.

Create a library of 8 plug-and-play broadcast email templates for {topic} businesses targeting {audience}.

TEMPLATE TYPES:

1. WEEKLY VALUE EMAIL — The workhorse. Deliver one insight about {topic} that makes them think.
2. STORY EMAIL — A personal story that demonstrates a {topic} principle and subtly promotes your offer.
3. CURATED CONTENT EMAIL — Share the best {topic} resources from the week with commentary.
4. OFFER EMAIL — Promote a {topic} product or service directly with no apology.
5. SOCIAL PROOF EMAIL — Feature a client win related to {topic}.
6. QUESTION EMAIL — Ask for feedback or opinions about their {topic} journey.
7. LESSON EMAIL — Teach one specific, actionable {topic} technique.
8. CELEBRATION EMAIL — Share a milestone (yours or theirs) related to {topic}.

For each template:
— Subject line formula (fill-in structure + 3 examples for {topic})
— Opening hook (first 2 sentences)
— Body structure (paragraph-by-paragraph guide)
— CTA (what to click and why)
— P.S. line (always include one)
— Best day and time to send
— Expected performance benchmarks

Make these templates battle-tested and ready to customize for any campaign.`
          ),
        },
      ],
    },
    {
      name: "Research & Business Intelligence",
      icon: "🔍",
      description: "Deep-analysis prompts to uncover insights and drive strategy",
      prompts: [
        {
          id: 16,
          title: "Competitor Intelligence Report",
          category: "Research & Business Intelligence",
          platforms: ["chatgpt", "claude", "gemini"],
          difficulty: "advanced",
          useCase: "Conduct a full competitive analysis for any {topic} market",
          tags: ["research", "competitive analysis", "strategy"],
          prompt: fill(
            `You are a senior market intelligence analyst with deep expertise in the {topic} industry who has conducted competitive analyses for Fortune 500 companies.

Conduct a complete competitive intelligence report for a business operating in {topic} targeting {audience}.

REPORT SECTIONS:

1. MARKET LANDSCAPE OVERVIEW
— Define the {topic} market boundaries
— Total addressable market estimate
— Current growth trajectory and key drivers
— Macro trends affecting {topic} in the next 3 years

2. COMPETITOR MAPPING
For the top 5 competitors in {topic}, analyze:
— Business model and revenue streams
— Target audience positioning
— Key value propositions
— Pricing strategy
— Distribution channels
— Marketing approach and messaging
— Estimated market share
— Known weaknesses (from public data, reviews, forums)

3. COMPETITIVE ADVANTAGE FRAMEWORK
— Feature-by-feature comparison table (template)
— Price positioning map
— Messaging differentiation analysis
— Blue ocean opportunities (underserved angles in {topic})

4. CUSTOMER SENTIMENT ANALYSIS
— Framework for mining reviews and social proof
— Top 5 complaints about existing {topic} solutions
— Top 5 desires that no current solution fully addresses
— Voice of customer quotes to use in your own marketing

5. STRATEGIC IMPLICATIONS
— Where to attack (competitor blind spots)
— Where to defend (your sustainable advantages)
— 90-day quick wins based on gaps found
— 12-month strategic positioning recommendations

Format as a professional report with executive summary.`
          ),
        },
        {
          id: 17,
          title: "Customer Avatar Deep Builder",
          category: "Research & Business Intelligence",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Build a hyper-detailed customer avatar for your {topic} business",
          tags: ["research", "customer avatar", "audience"],
          prompt: fill(
            `You are a consumer psychology expert and audience strategist specializing in the {topic} market who has helped brands achieve 3x conversion rates through precise audience understanding.

Build a comprehensive customer avatar for a {topic} business targeting {audience}.

SECTION 1: DEMOGRAPHIC & PSYCHOGRAPHIC PROFILE
— Age range, gender distribution, location clusters
— Income range and spending behavior
— Education and professional background
— Primary social media platforms and content consumption habits
— Technology comfort level

SECTION 2: THE INTERNAL WORLD
— Core identity and how they see themselves
— What they desperately want (surface desire)
— What they really want underneath (deep desire)
— Their biggest daily frustration related to {topic}
— The emotion they feel when thinking about their problem
— What they believe is blocking them (even if wrong)
— Who or what they blame for their situation

SECTION 3: BUYING BEHAVIOR
— How they research before buying {topic} solutions
— Trust signals that matter most to them
— Red flags that make them flee
— Decision-making process (fast impulse vs slow deliberate)
— Price sensitivity and value anchors
— Who influences their decisions

SECTION 4: LANGUAGE MAP
— Exact phrases they use to describe their problem
— Words that repel them (feel too salesy or corporate)
— Their internal dialogue at 2am when they can't sleep
— The transformation they would describe if {topic} worked perfectly

SECTION 5: MARKETING IMPLICATIONS
— Where to find them (channels)
— What angle to lead with
— What offers they respond to
— What content keeps them engaged
— How to talk about {topic} in a way that feels personal

Deliver as a named avatar (give them a character name).`
          ),
        },
        {
          id: 18,
          title: "Market Opportunity Analyst",
          category: "Research & Business Intelligence",
          platforms: ["chatgpt", "claude", "gemini"],
          difficulty: "advanced",
          useCase: "Identify untapped opportunities in the {topic} market",
          tags: ["research", "market analysis", "opportunity"],
          prompt: fill(
            `You are a startup advisor and market opportunity analyst who has helped identify billion-dollar market gaps in industries related to {topic}.

Conduct a thorough market opportunity analysis for {topic} targeting {audience}.

FRAMEWORK: Jobs-To-Be-Done + Blue Ocean Strategy

PART 1: DEMAND MAPPING
— What are the top 10 "jobs" {audience} are hiring {topic} solutions to do?
— Rank by urgency, frequency, and willingness to pay
— Identify which jobs are over-served (overcrowded market)
— Identify which jobs are under-served (opportunity gaps)

PART 2: PAIN INTENSITY ANALYSIS
— For the top 3 underserved jobs: rate pain intensity (1–10) and current satisfaction with solutions (1–10)
— Calculate opportunity score: (pain × (10 – satisfaction)) / 10
— Opportunities scoring above 7 represent your best bets

PART 3: MONETIZATION PATHS
For {topic} opportunities identified:
— Direct product/service models
— Productized service angles
— SaaS or recurring revenue potential
— Content + community models
— Affiliate or marketplace angles

PART 4: BARRIER TO ENTRY ASSESSMENT
— Capital required to enter each opportunity
— Time to first revenue estimate
— Key risks and how to mitigate them
— Unfair advantages that make YOU the right person to pursue this

PART 5: GO-TO-MARKET SKETCH
— Channel strategy for fastest traction
— First 100 customer acquisition plan
— Pricing model recommendation
— 90-day validation plan

Conclude with a ranked list of top 3 opportunities with recommended starting point.`
          ),
        },
        {
          id: 19,
          title: "Business Strategy Advisor",
          category: "Research & Business Intelligence",
          platforms: ["chatgpt", "claude", "gemini"],
          difficulty: "advanced",
          useCase: "Get strategic advice for growing a {topic} business",
          tags: ["strategy", "business growth", "consulting"],
          prompt: fill(
            `You are a seasoned business strategy consultant with 20 years of experience advising {topic} businesses and their leadership teams.

You will serve as a strategic advisor for a {topic} business targeting {audience}. Respond as a thoughtful, direct advisor who gives actionable recommendations — not generic advice.

ADVISORY FRAMEWORKS TO APPLY:

1. CORE BUSINESS AUDIT
— Business model clarity: How exactly does this {topic} business make money?
— Revenue streams and their relative contribution
— Unit economics (CAC, LTV, churn, margins)
— Key constraints holding back growth

2. COMPETITIVE POSITION ASSESSMENT
Using Porter's 5 Forces for {topic}:
— Rivalry intensity
— Supplier power
— Buyer power
— Threat of substitutes
— Threat of new entrants
→ Conclude with: Where is this business most defensible?

3. GROWTH LEVER IDENTIFICATION
For a {topic} business, rank these growth levers by impact:
— Acquisition (more customers)
— Activation (better onboarding)
— Retention (reduce churn)
— Revenue (better monetization)
— Referral (word of mouth)
→ Which lever should they pull first and why?

4. 90-DAY PRIORITY PLAN
— Top 3 strategic initiatives with clear owners and success metrics
— What to stop doing (brutal prioritization)
— Resource allocation recommendation

5. 12-MONTH VISION
— Where should this {topic} business be in 12 months?
— What milestones indicate they're on track?

Close with the single most important question this business should be asking itself right now.`
          ),
        },
        {
          id: 20,
          title: "Customer Survey & Feedback Designer",
          category: "Research & Business Intelligence",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Design surveys that uncover what {audience} actually want from {topic}",
          tags: ["research", "survey", "customer feedback"],
          prompt: fill(
            `You are a consumer research expert who specializes in designing surveys for {topic} businesses that generate rich, actionable insights from {audience}.

Create 3 complete survey frameworks for a {topic} business:

SURVEY 1: PRE-PURCHASE RESEARCH SURVEY
Goal: Understand why prospects consider and ultimately choose {topic} solutions
Length: 10 questions max
Distribution: Cold audience, lead magnet gate

Questions should uncover:
— Primary problem they're trying to solve related to {topic}
— What they've already tried (and why it failed)
— Their #1 desire if {topic} worked perfectly
— Their biggest hesitation before buying a {topic} solution
— Budget expectation
— Decision-making timeline

SURVEY 2: POST-PURCHASE SATISFACTION SURVEY (30 days in)
Goal: Measure results, identify testimonial candidates, find improvement areas
Length: 8 questions max
Distribution: Existing customers at 30-day mark

SURVEY 3: WIN/LOSS ANALYSIS SURVEY
Goal: Understand why prospects chose or didn't choose your {topic} offer
Length: 6 questions
Distribution: Post-decision (both buyers and non-buyers)

For each survey:
— Write all questions verbatim (not categories)
— Specify question type (multiple choice, scale, open-ended)
— Explain what each question reveals and how to use the data
— Recommended incentive to increase completion rate
— How to analyze and act on results

Bonus: Write the email invitation for each survey (subject + body).`
          ),
        },
      ],
    },
    {
      name: "Business Operations & Productivity",
      icon: "⚙️",
      description: "Automate operations, build systems, and scale efficiently",
      prompts: [
        {
          id: 21,
          title: "SOP Generator (Standard Operating Procedures)",
          category: "Business Operations & Productivity",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Document any {topic} business process so it runs without you",
          tags: ["SOP", "operations", "automation"],
          prompt: fill(
            `You are a business systems consultant who specializes in documenting and operationalizing {topic} business processes for {audience}.

Create a complete Standard Operating Procedure (SOP) template system for a {topic} business.

GENERATE SOPs FOR THESE CORE BUSINESS FUNCTIONS:

SOP #1: CLIENT ONBOARDING
— Trigger: New client signs contract / makes purchase
— Owner: [Role name]
— Step-by-step process with decision trees
— Tools and templates required
— Quality check points
— Expected completion time
— Common mistakes and how to avoid them

SOP #2: CONTENT CREATION WORKFLOW
— Topic ideation → creation → review → publishing → repurposing
— Roles and responsibilities at each stage
— Quality standards for {topic} content
— Approval process

SOP #3: CUSTOMER COMPLAINT RESOLUTION
— Escalation levels and decision authority
— Response time standards
— Resolution scripts for common {topic} issues
— When to offer refunds vs. alternatives
— Documentation requirements

SOP #4: WEEKLY REPORTING & METRICS
— Key metrics to track for a {topic} business
— Data collection process
— Reporting format and frequency
— Who reviews and what actions get triggered by different results

SOP #5: HIRING & ONBOARDING NEW TEAM MEMBERS
— Role definition process
— Interview scoring rubric
— First 30/60/90 day onboarding checklist for {topic} business

For each SOP:
— Use numbered steps
— Include decision points ("If X, then Y, else Z")
— Note which steps can be automated
— Assign a "who does this" role
— Include a quality control checkpoint`
          ),
        },
        {
          id: 22,
          title: "Team Meeting Agenda Builder",
          category: "Business Operations & Productivity",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Run effective, time-efficient team meetings for your {topic} business",
          tags: ["meetings", "productivity", "management"],
          prompt: fill(
            `You are a meeting effectiveness consultant who has helped {topic} companies reduce meeting time by 40% while improving decision quality.

Create a complete meeting system for a {topic} business team serving {audience}.

MEETING TEMPLATES:

1. WEEKLY TEAM STANDUP (15 minutes):
Agenda structure for the 3 core questions + {topic}-specific KPIs to review
Who speaks, in what order, for how long
How to keep it under 15 minutes every time
The one question that prevents recurring problems

2. MONTHLY STRATEGY REVIEW (90 minutes):
Agenda: Numbers review → wins → issues → priorities → decisions
How to structure the {topic}-specific metric dashboard
Decision-making protocol when team disagrees
Meeting output: always end with a "who does what by when" list

3. CLIENT KICKOFF MEETING (60 minutes):
Agenda structure for setting clear expectations with new {topic} clients
Questions to ask that prevent 80% of future problems
How to document outcomes in real time
The "alignment moment" that ends all kickoffs

4. QUARTERLY PLANNING SESSION (3 hours):
Big rocks for the quarter based on {topic} goals
OKR setting process (simplified)
Blocker identification and removal
Team commitment ritual

5. ONE-ON-ONE MANAGER CHECK-IN (30 minutes weekly):
Structured framework for manager + team member
How to surface problems before they become crises
Career development conversation thread
Accountability system

For each: Printable agenda template, facilitator notes, common pitfalls to avoid.`
          ),
        },
        {
          id: 23,
          title: "Business Proposal Writer",
          category: "Business Operations & Productivity",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Write winning client proposals for {topic} services in minutes",
          tags: ["proposal", "client", "business development"],
          prompt: fill(
            `You are a senior business development professional who has written {topic} proposals that have a 65%+ close rate with {audience}.

Create a comprehensive proposal writing system for {topic} services.

PROPOSAL FRAMEWORK: SCOPE/APPROACH/INVESTMENT

TEMPLATE 1: SHORT-FORM PROPOSAL (for deals under $5K)
— 1-page format
— Problem statement → solution → investment → next steps
— When to use this vs. full proposal

TEMPLATE 2: STANDARD PROPOSAL (for $5K–$25K deals)
— Executive summary (half page)
— Understanding of their situation (show you listened)
— Proposed {topic} solution and approach
— Timeline and milestones
— Team and credentials
— Investment and terms
— Next steps

TEMPLATE 3: ENTERPRISE PROPOSAL (for $25K+ deals)
— Full document with all sections
— Risk mitigation section
— Governance model
— References and case studies section
— Technical appendix option

PROPOSAL BEST PRACTICES FOR {topic}:
— The 3 pricing options structure (always include)
— How to present price so it doesn't create sticker shock
— The "investment" vs. "cost" language shift
— Why you should always follow up with a video Loom
— How to create urgency without being pushy

BONUS: Write a follow-up email template for proposals that haven't been responded to in 5 days, 10 days, and 20 days.`
          ),
        },
        {
          id: 24,
          title: "Job Description & Hiring Script",
          category: "Business Operations & Productivity",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Hire the right people for your {topic} business — the first time",
          tags: ["hiring", "HR", "recruitment"],
          prompt: fill(
            `You are a hiring expert who helps {topic} businesses build high-performing teams without expensive recruiters.

Create a complete hiring toolkit for a {topic} business targeting {audience}.

ROLE-SPECIFIC JOB DESCRIPTION TEMPLATE:
— Compelling title (that attracts A-players, not just anyone)
— Opening paragraph (why this is a career-defining opportunity)
— Impact statement (what a great hire will achieve in 90 days)
— Responsibilities (outcomes-focused, not task lists)
— Must-have qualifications vs. nice-to-haves (clear distinction)
— What we offer (compensation, growth, culture)
— Application instructions with a small filter task

SCREENING CALL SCRIPT (15 minutes):
Questions to ask in the first call that reveal:
— Communication style
— Motivation for the specific {topic} role
— Red flags immediately
— Cultural fit signals

STRUCTURED INTERVIEW GUIDE (60 minutes):
— 5 role-specific behavioral questions with scoring rubric (1–5)
— 3 situational prompts relevant to {topic}
— 2 culture questions
— Candidate questions to answer (signals enthusiasm)
— Scoring sheet template

REFERENCE CHECK SCRIPT:
— The one question that reveals more than any other
— How to read between the lines of what references say (and don't say)

OFFER LETTER FRAMEWORK:
— Components to include
— How to present the offer verbally before sending in writing
— How to handle negotiation without losing great candidates`
          ),
        },
        {
          id: 25,
          title: "AI Automation Workflow Designer",
          category: "Business Operations & Productivity",
          platforms: ["chatgpt", "claude", "gemini"],
          difficulty: "advanced",
          useCase: "Design AI-powered automations to run {topic} business tasks on autopilot",
          tags: ["automation", "AI workflow", "productivity"],
          prompt: fill(
            `You are an AI automation architect who helps {topic} businesses eliminate repetitive tasks and scale operations using AI tools.

Design a complete AI automation system for a {topic} business serving {audience}.

AUTOMATION OPPORTUNITY AUDIT:
Identify the top 10 most time-consuming, repetitive tasks in a typical {topic} business and rank them by:
— Hours wasted per week
— Ease of automation (1–10)
— Impact on revenue if automated
— Recommended AI tool for each

AUTOMATION BLUEPRINT (for top 5 tasks):

For each task:
TASK: [Specific {topic} business task]
CURRENT STATE: How it's done manually now
AUTOMATION SOLUTION:
— Trigger: What starts the automation
— Tool stack: Which AI tools to use (specific names)
— Prompt template: The exact prompt to use in each tool
— Output: What gets produced automatically
— Human checkpoint: Where a human still needs to review
— Time saved: Hours per week estimate

TOOL RECOMMENDATIONS FOR {topic}:
— AI writing: [Specific use cases for {topic}]
— AI research: [How to use for {topic} intelligence]
— AI outreach: [Cold email and DM automation]
— AI scheduling: [Calendar and workflow]
— AI analytics: [Reporting and insight generation]

IMPLEMENTATION ROADMAP:
— Week 1: Quick wins (automations that take < 2 hours to set up)
— Month 1: Core workflows automated
— Month 3: Fully systematized {topic} operations

Conclude with a "done-for-you" prompt library: 10 ready-to-use prompts for the most common {topic} AI tasks.`
          ),
        },
      ],
    },
    {
      name: "Coaching & Consulting Delivery",
      icon: "🎯",
      description: "Premium service delivery prompts for coaches and consultants",
      prompts: [
        {
          id: 26,
          title: "Client Discovery Call Framework",
          category: "Coaching & Consulting Delivery",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Run discovery calls that close high-ticket {topic} clients",
          tags: ["coaching", "discovery call", "sales"],
          prompt: fill(
            `You are a master sales and coaching consultant who has conducted 500+ discovery calls for {topic} programs, consistently closing at 60–75% rates.

Create a complete discovery call framework for selling high-ticket {topic} coaching/consulting to {audience}.

CALL STRUCTURE (60 minutes):

PHASE 1: OPEN & RAPPORT (5 minutes)
— How to start the call in a way that immediately builds trust
— The question to ask that shifts them from "guard up" to "open"
— How to set the agenda so they feel in control

PHASE 2: THEIR WORLD (20 minutes)
Deep diagnostic questions about {topic}:
— Current situation (where are they now)
— Core challenge (what's the real problem)
— Impact questions (what is this costing them — financially, emotionally, in their relationships)
— Dream outcome (where do they want to be in 12 months)
— Previous attempts (what have they tried and why it didn't work)

PHASE 3: THE PIVOT (5 minutes)
— Summarize their situation back in a way that makes them feel completely understood
— Ask: "If I could show you how to [specific outcome], would you be open to hearing about it?"

PHASE 4: PRESENT YOUR SOLUTION (15 minutes)
— How to present your {topic} program as the obvious bridge from where they are to where they want to be
— The "delivery overview" without overwhelming with details
— How to anchor price BEFORE revealing it

PHASE 5: CLOSE & HANDLE OBJECTIONS (15 minutes)
— The close question that creates a natural yes/no
— Full objection handling for {topic} consulting (price, time, trust, authority)
— The payment option conversation
— What to send immediately after the call

Include: A one-page discovery call cheat sheet to print.`
          ),
        },
        {
          id: 27,
          title: "90-Day Transformation Program Builder",
          category: "Coaching & Consulting Delivery",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Build a complete {topic} coaching program that gets clients results",
          tags: ["coaching", "program design", "curriculum"],
          prompt: fill(
            `You are an expert program designer who builds {topic} coaching and consulting programs that achieve a 90%+ client success rate with {audience}.

Design a complete 90-day {topic} transformation program.

PROGRAM ARCHITECTURE:

PROGRAM FOUNDATIONS:
— Program name (bold, outcome-focused)
— Core promise and transformation statement
— Who this is specifically for (ideal client)
— Who this is NOT for (be honest)
— Core methodology name and philosophy
— Success metrics and how results are measured

MONTH 1 — FOUNDATION (Days 1–30):
Week-by-week breakdown:
— Week 1 theme and sessions
— Week 2 theme and sessions
— Week 3 theme and sessions
— Week 4 theme and sessions
For each week: learning objectives, session outline, homework/implementation tasks, accountability check-in format

MONTH 2 — MOMENTUM (Days 31–60):
— Theme: Building on foundations, removing obstacles
— Week-by-week sessions with increasing complexity
— Milestone celebration at Day 45 (midpoint)
— Troubleshooting common sticking points in {topic}

MONTH 3 — MASTERY (Days 61–90):
— Theme: Independent implementation and scaling
— Advanced {topic} sessions
— Client graduation framework
— Renewal/continuation conversation

SUPPORTING MATERIALS TO CREATE:
— Client welcome packet (outline)
— Session call agenda template
— Progress tracking worksheet
— Community/accountability structure

RESULTS DOCUMENTATION:
— How to capture and share client wins
— Testimonial elicitation system
— Case study framework

Price point recommendation and packaging strategy.`
          ),
        },
        {
          id: 28,
          title: "Group Coaching Program Curriculum",
          category: "Coaching & Consulting Delivery",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Run a premium group {topic} program with 10–100 clients at once",
          tags: ["group coaching", "program", "curriculum"],
          prompt: fill(
            `You are a group program expert who has run multiple 6-figure group coaching programs in {topic} for {audience}.

Design a complete 8-week group {topic} coaching program that can run live or asynchronously.

PROGRAM STRUCTURE:

WEEK 1: ORIENTATION & FOUNDATION
— Module title and core promise
— Training content outline (60-90 minute module)
— Implementation exercise
— Group discussion prompt
— Q&A session focus area
— Weekly challenge for accountability

[REPEAT FOR WEEKS 2–8 — each week builds on the last]

SUGGESTED WEEKLY THEMES FOR {topic}:
Week 1: Clarity (where you are vs. where you want to be)
Week 2: Strategy (the {topic} roadmap)
Week 3: Foundations (core skills and systems)
Week 4: Implementation (doing the work)
Week 5: Troubleshooting (removing blocks)
Week 6: Optimization (refining what's working)
Week 7: Scaling (amplifying results)
Week 8: Mastery (independence and graduation)

COMMUNITY STRUCTURE:
— Platform recommendation for {topic} group programs
— Community rules and culture guidelines
— Engagement prompts (weekly wins, sharing framework)
— Peer accountability partner matching system

LIVE CALL FORMAT (biweekly):
— Agenda for hot seat sessions
— Q&A management system
— Recording and replay policy

BONUS MODULES:
— Design 3 bonus mini-modules that address common {topic} obstacles

PRICING MODEL:
— Founding member pricing vs. full price
— Payment plans (what to offer)
— Upgrade path to VIP/1:1`
          ),
        },
        {
          id: 29,
          title: "Client Breakthrough Session Script",
          category: "Coaching & Consulting Delivery",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Facilitate breakthrough sessions that get {topic} clients real results fast",
          tags: ["coaching", "breakthrough", "session"],
          prompt: fill(
            `You are a master coach and facilitator who specializes in helping {audience} break through their deepest blocks around {topic} in a single session.

Design a complete 60-minute breakthrough session guide for {topic} clients.

SESSION PURPOSE: Create a transformational shift in how the client sees and approaches {topic} — leaving with clarity, a new belief, and a concrete first action.

PRE-SESSION (5 minutes):
— Centering ritual to get the client present
— The one question to ask that reveals the REAL issue they want to work on
— Setting the session intention together

PHASE 1: EXCAVATION (15 minutes)
Deep-dive questions to uncover the root block around {topic}:
— "What's the thought you keep having about {topic} that you haven't said out loud?"
— "If this problem with {topic} never gets solved, what does that mean about you?"
— "What would you have to believe to have already solved this?"
— Follow-up probes for each answer

PHASE 2: REFRAME (15 minutes)
Coaching moves to shift perspective on {topic}:
— Identify the limiting belief in one sentence
— Challenge its factual accuracy
— Offer an alternative belief that is equally or more true
— Get buy-in on the new frame
— Anchor with a metaphor or story

PHASE 3: COMMITMENT (15 minutes)
Action planning for {topic}:
— What is the smallest possible first step (that feels scary but doable)?
— What would need to be true for them to take that step today?
— Accountability agreement
— How to celebrate completion

SESSION CLOSE (10 minutes):
— Integration moment: what shifted?
— Assignment for next 48 hours
— How to reach you if they need support

BONUS: The follow-up email to send within 2 hours of the session.`
          ),
        },
        {
          id: 30,
          title: "High-Ticket Sales Conversation Mastery",
          category: "Coaching & Consulting Delivery",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Close $5K–$50K {topic} clients in natural conversations",
          tags: ["sales", "high-ticket", "coaching"],
          prompt: fill(
            `You are a high-ticket sales coach who has personally closed over $5M in coaching and consulting contracts for {topic} and has trained hundreds of coaches to do the same with {audience}.

Create a complete high-ticket sales conversation system for {topic} programs.

SECTION 1: SALES MINDSET FOR {topic}
— The one belief shift that makes high-ticket selling feel natural
— Why "selling" IS coaching for {topic}
— How to detach from the outcome while caring deeply about the person

SECTION 2: THE CONVERSATION FRAMEWORK
This is NOT a script — it's a conversation GPS:

STEP 1: UNDERSTAND (not pitch)
— Questions that reveal their true cost of NOT solving their {topic} problem
— How to listen for buying signals
— What NOT to say in the first 20 minutes

STEP 2: QUALIFY (not manipulate)
— How to determine if they're the right fit for your {topic} offer
— The "dream client" filter questions
— How to gracefully disqualify someone who's not right (and why it builds trust)

STEP 3: PRESENT (not dump features)
— The 3-sentence offer summary that creates desire
— How to anchor the investment before revealing the price
— The stack presentation that makes price feel inevitable

STEP 4: CLOSE (not pressure)
— The close that feels like a caring question, not a push
— How to handle "let me think about it" (3 specific responses)
— The payment conversation that removes the final barrier
— What to say when someone says yes (and when they say no)

SECTION 3: AFTER THE SALE
— Buyer's remorse prevention (what to send in the first 24 hours)
— How to ask for referrals in a way that feels natural
— The follow-up sequence for prospects who said "not now"`
          ),
        },
      ],
    },
    {
      name: "SEO & Digital Marketing",
      icon: "🚀",
      description: "Traffic generation and digital growth prompts",
      prompts: [
        {
          id: 31,
          title: "SEO Content Brief Generator",
          category: "SEO & Digital Marketing",
          platforms: ["chatgpt", "claude", "gemini"],
          difficulty: "intermediate",
          useCase: "Create Google-ranking content briefs for any {topic} keyword",
          tags: ["SEO", "content brief", "keyword"],
          prompt: fill(
            `You are an expert SEO strategist who has helped {topic} websites reach the first page of Google for competitive keywords and generate 100K+ monthly organic visitors.

Create a comprehensive SEO content brief for a {topic} blog targeting {audience}.

KEYWORD STRATEGY:
— Primary keyword for this piece (highly specific to {topic})
— 5 secondary keywords with natural integration points
— 5 LSI (Latent Semantic Indexing) keywords to include
— Featured snippet opportunity analysis

CONTENT ARCHITECTURE:
— Article type (ultimate guide / listicle / comparison / case study / how-to)
— Recommended word count range (with reasoning)
— URL slug recommendation
— Meta title (under 60 chars, keyword front-loaded)
— Meta description (under 155 chars, includes CTA)

OUTLINE:
— H1 headline (the one that makes someone click)
— Introduction framework (hook, problem, solution preview, what they'll get)
— H2 sections with H3 sub-sections
— For each H2: key points to cover, search intent to satisfy, internal link opportunity
— FAQ section (5 questions based on People Also Ask for {topic})
— Conclusion and CTA

ON-PAGE SEO CHECKLIST:
— Where to use primary keyword (H1, first 100 words, meta, image alt, URL)
— Content upgrades/lead magnets to embed for email capture
— Internal linking opportunities
— Schema markup recommendation

COMPETITIVE ADVANTAGE:
— What the top 3 ranking articles are missing
— The unique angle that will make this piece outrank them
— Expert quote opportunities to add E-E-A-T signals`
          ),
        },
        {
          id: 32,
          title: "Google Ads Copy Matrix",
          category: "SEO & Digital Marketing",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Generate 30 Google Ads headline and description combinations for {topic}",
          tags: ["Google Ads", "PPC", "ad copy"],
          prompt: fill(
            `You are a Google Ads specialist with a track record of managing over $10M in ad spend for {topic} businesses, consistently achieving 4:1+ ROAS.

Create a complete Google Ads copy matrix for a {topic} business targeting {audience}.

RESPONSIVE SEARCH AD ASSETS:

15 HEADLINES (30 chars max each):
— 3 featuring the core {topic} outcome/benefit
— 3 featuring social proof/numbers
— 3 featuring urgency/scarcity
— 3 featuring specific features of the {topic} offer
— 3 featuring the target audience identity

4 DESCRIPTIONS (90 chars max each):
— Description 1: Lead with biggest outcome for {audience}, end with CTA
— Description 2: Address the main objection, build trust, CTA
— Description 3: Feature the unique mechanism of {topic}, benefit, CTA
— Description 4: Social proof + offer clarity + urgency CTA

AD EXTENSION RECOMMENDATIONS:
— 6 Sitelink extensions (with descriptions) for {topic} pages
— 4 Callout extensions (short punchy phrases about {topic})
— 3 Structured snippet headers with values
— Call extension recommendation

CAMPAIGN STRUCTURE:
— Recommended campaign type for {topic}
— Ad group themes (3–5)
— Match type strategy
— Negative keyword list (20 most important for {topic})

BIDDING STRATEGY:
— Recommended bid strategy for this {topic} offer
— Target CPA or ROAS benchmarks for this industry
— Budget allocation recommendation`
          ),
        },
        {
          id: 33,
          title: "Local SEO Domination Pack",
          category: "SEO & Digital Marketing",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Dominate local search results for {topic} in any city or region",
          tags: ["local SEO", "Google Business", "location"],
          prompt: fill(
            `You are a local SEO expert who has helped {topic} businesses rank #1 in Google Maps and local search for competitive keywords in their city.

Create a complete local SEO strategy for a {topic} business targeting {audience} in a specific geographic market.

GOOGLE BUSINESS PROFILE OPTIMIZATION:
— Business name format recommendation
— Category strategy (primary + additional)
— Business description (750 chars, keyword-rich, compelling)
— Service list with optimized descriptions for {topic}
— Q&A section: 10 pre-answered questions relevant to {topic}
— Photo strategy (types of images and how many)
— Post schedule (what to post weekly for ranking signals)

LOCAL PAGE CONTENT:
— City-specific landing page outline for {topic}
— Hyper-local content angles (neighborhood mentions, landmarks, events)
— NAP (Name, Address, Phone) consistency checklist

REVIEW GENERATION SYSTEM:
— Email script to request Google reviews from {topic} customers
— SMS script for review requests
— QR code placement strategy
— How to respond to reviews (positive and negative) — template responses for {topic}

LOCAL CITATION BUILDING:
— Top 15 citation directories for {topic} businesses
— Citation audit checklist
— How to handle duplicate listings

LOCAL LINK BUILDING:
— 10 local link opportunities specific to {topic} businesses
— Partnership outreach email for local links
— Sponsorship strategies for local authority`
          ),
        },
        {
          id: 34,
          title: "Backlink Outreach System",
          category: "SEO & Digital Marketing",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Build high-quality backlinks to your {topic} site with personalized outreach",
          tags: ["SEO", "link building", "outreach"],
          prompt: fill(
            `You are an authority link building specialist who has secured over 10,000 high-quality backlinks for {topic} websites from DR50+ domains.

Create a complete backlink outreach system for a {topic} website targeting {audience}.

LINK BUILDING STRATEGIES (ranked by ROI):

STRATEGY 1: SKYSCRAPER TECHNIQUE
— How to identify top-linked {topic} content (step-by-step)
— How to create a 10x better version
— Outreach email sequence (3-email series)

STRATEGY 2: DIGITAL PR / DATA STUDY
— {topic} data study ideas that earn press mentions
— PR pitch email template
— Target publication list for {topic} industry

STRATEGY 3: RESOURCE PAGE LINK BUILDING
— How to find resource pages in the {topic} niche
— Pitching email that gets a "yes" consistently
— Follow-up sequence

STRATEGY 4: PODCAST GUESTING FOR LINKS
— How to identify {topic} podcasts that link to guests
— Pitch email for podcast appearances
— How to leverage the appearance for maximum links

STRATEGY 5: BROKEN LINK BUILDING
— How to find broken link opportunities in {topic}
— Email template for broken link replacement
— Success rate optimization tips

OUTREACH EMAIL TEMPLATES (for each strategy):
— Subject line options (A/B tested)
— Opening that proves you actually read their content
— Value proposition for linking to you
— CTA that makes it easy to say yes

TRACKING SYSTEM:
— Spreadsheet template for tracking outreach
— Follow-up timeline
— Success rate benchmarks for {topic}`
          ),
        },
        {
          id: 35,
          title: "Facebook & Instagram Ad Funnel",
          category: "SEO & Digital Marketing",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Build a complete paid social funnel for {topic} that generates leads and sales",
          tags: ["Facebook Ads", "Instagram", "paid social"],
          prompt: fill(
            `You are a paid social advertising expert who has managed $20M+ in Facebook and Instagram ad spend for {topic} businesses, consistently achieving 3–6x ROAS.

Build a complete Facebook/Instagram advertising funnel for a {topic} business targeting {audience}.

FUNNEL ARCHITECTURE:

STAGE 1: AWARENESS (Cold Traffic — TOF)
Objective: Interrupting the scroll and creating curiosity about {topic}
— 3 video ad scripts (15-sec, 30-sec, 60-sec versions)
— 3 static image ad concepts with copy (headline + primary text + CTA)
— Targeting strategy: Interests and behaviors for {topic} audience
— Budget allocation recommendation

STAGE 2: CONSIDERATION (Warm Traffic — MOF)
Objective: Retarget engagers and build desire for {topic}
— 2 video testimonial ad scripts
— 2 carousel ad concepts for {topic} benefits
— 1 educational lead magnet ad
— Custom audience setup guide

STAGE 3: CONVERSION (Hot Traffic — BOF)
Objective: Convert warm audience into {topic} buyers
— Direct offer ad copy (3 variations)
— Abandoned page/cart retargeting sequence
— Limited time offer ad
— Lookalike audience strategy

CREATIVE SPECIFICATIONS:
— Winning hook formula for {topic} ads
— Color and visual style recommendations for {audience}
— Caption length testing framework
— CTA button recommendations

PIXEL AND TRACKING SETUP:
— Events to track for {topic} funnel
— Attribution model recommendation
— A/B testing framework for {topic} offers

SCALING PLAYBOOK:
— When and how to scale winners
— Budge scaling triggers (specific metrics)
— Creative refresh frequency for {topic}`
          ),
        },
      ],
    },
    {
      name: "Product & Offer Creation",
      icon: "📦",
      description: "Design and package offers that sell at premium prices",
      prompts: [
        {
          id: 36,
          title: "Online Course Curriculum Architect",
          category: "Product & Offer Creation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Design a complete {topic} online course curriculum that gets results",
          tags: ["course creation", "curriculum", "education"],
          prompt: fill(
            `You are a world-class instructional designer and online course expert who has helped creators build {topic} courses that achieve 90%+ completion rates and 5-star reviews from {audience}.

Design a complete online course curriculum for {topic}.

COURSE BLUEPRINT:

COURSE POSITIONING:
— Course name (transformation-focused, not generic)
— One-sentence course promise
— Who it's specifically for (ideal student profile)
— Prerequisites and who should NOT take it
— Learning modalities: video / workbook / community / live Q&A recommendation

COURSE STRUCTURE (10-module curriculum):
For each module (10 total):
— Module title (outcome-focused)
— Core learning objective
— Lesson breakdown:
  * Lesson 1: Concept introduction + Why it matters
  * Lesson 2: The framework or method
  * Lesson 3: Step-by-step implementation
  * Lesson 4: Common mistakes and how to avoid them
  * Lesson 5: Real examples and case studies
— Module exercise (the one action that creates a result)
— Module quiz framework (3 questions)
— Resources to include

STUDENT EXPERIENCE DESIGN:
— Quick win to deliver in Module 1 (to prevent early dropout)
— Milestone celebrations (what to celebrate at Module 3, 5, 8, 10)
— Community engagement prompts for each module
— Accountability check-in system

RESULTS DOCUMENTATION:
— Student progress tracking framework
— Success story elicitation system
— Transformation measurement tool

LAUNCH STRATEGY:
— Beta cohort pricing recommendation
— Course recording schedule (how long to create)
— Platform recommendation for {topic} type content`
          ),
        },
        {
          id: 37,
          title: "Digital Product Pricing Optimizer",
          category: "Product & Offer Creation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Find the perfect price for any {topic} digital product or service",
          tags: ["pricing", "offer design", "monetization"],
          prompt: fill(
            `You are a pricing strategy consultant who has helped over 200 {topic} businesses find their optimal price point and 2–3x their revenue without increasing traffic.

Create a comprehensive pricing strategy for a {topic} offer targeting {audience}.

PRICING PSYCHOLOGY PRINCIPLES FOR {topic}:
— Anchoring strategy (what to present first)
— The power of specificity in price ($97 vs $100)
— Why round numbers kill conversions
— Price/value perception for {topic} in this market

PRICING RESEARCH:
— How to survey your market to find their budget range (exact questions)
— How to analyze what competitors charge for {topic}
— The Van Westendorp Price Sensitivity framework applied to {topic}

PRICING MODEL OPTIONS:
1. ONE-TIME PAYMENT: Best use case for {topic}, pros/cons, recommended range
2. PAYMENT PLAN: How to structure for {topic} offers, markup strategy
3. SUBSCRIPTION: Is recurring right for this {topic} business? How to price it
4. TIERED PRICING: The 3-tier structure that maximizes revenue per customer
5. PAY WHAT YOU WANT: When this works for {topic} and how to implement

VALUE STACKING:
— Core offer value calculation for {topic}
— How to add bonuses that cost you nothing but feel like $X,XXX
— The value stack presentation formula
— Price anchoring sequence

THE PRICE INCREASE STRATEGY:
— When and how to raise prices without losing customers
— Founding member / beta pricing exit plan
— Grandfathering existing customers

DECISION FRAMEWORK:
— Recommended starting price for {topic} at different business stages
— How to test your price
— When to offer discounts (and when never to)`
          ),
        },
        {
          id: 38,
          title: "Product Launch Strategy Planner",
          category: "Product & Offer Creation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Plan and execute a high-revenue launch for any {topic} product",
          tags: ["product launch", "launch strategy", "campaign"],
          prompt: fill(
            `You are a product launch strategist who has engineered 6- and 7-figure launches for {topic} products targeting {audience}.

Create a complete product launch strategy for a new {topic} offer.

LAUNCH TYPE SELECTION:
Recommend the best launch type for this {topic} offer:
— Seed Launch (small audience, live delivery)
— Internal Launch (warm list, limited offer)
— JV/Affiliate Launch (partner promotion)
— Evergreen Launch (automated always-on)
Explain WHY this type fits {topic} best.

PRE-LAUNCH PHASE (4 weeks before):
— Week 4: Audience seeding content (organic, not promotional)
— Week 3: Problem awareness content
— Week 2: Solution introduction content
— Week 1: Social proof and anticipation building

LAUNCH WEEK BLUEPRINT:
Day 1 (Cart Open): Full execution plan — email, social, live event
Day 2: FAQ and objection handling day
Day 3: Social proof amplification day
Day 4: Content value day (give something unexpectedly valuable)
Day 5: Urgency and scarcity day
Day 6: Final push preparation
Day 7 (Cart Close): Multiple-touchpoint close strategy

LAUNCH ASSETS CHECKLIST:
— Sales page requirements
— Email sequence (covered separately)
— Social media posts (5 per platform for launch week)
— Affiliate resources (if applicable)
— Customer support FAQ document

POST-LAUNCH:
— New buyer onboarding sequence
— Launch debrief framework (what to measure)
— Evergreen transition plan

REVENUE PROJECTION:
— Formula for estimating launch revenue based on audience size
— Conversion rate benchmarks for {topic} launches
— How to increase launch revenue by 30% with one upsell`
          ),
        },
        {
          id: 39,
          title: "Signature Offer Creator",
          category: "Product & Offer Creation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Build your signature {topic} offer that sells at $2K–$10K without hard selling",
          tags: ["offer design", "signature program", "premium"],
          prompt: fill(
            `You are a premium offer design consultant who has helped {audience} build signature {topic} offers that command premium prices and sell easily.

Design a complete signature offer for a {topic} business.

THE SIGNATURE OFFER FRAMEWORK:

STEP 1: THE PROMISE
— The transformation your {topic} offer delivers in one sentence
— The timeframe promise (specific, believable)
— The unique mechanism (why YOUR way of teaching/delivering {topic} is different)

STEP 2: THE OFFER ARCHITECTURE
Core components (what's included):
— Main delivery method (live calls, course, done-for-you, hybrid)
— Support structure (how they get help between sessions)
— Community element (optional but powerful)
— Duration and format

Bonus components (what makes it irresistible):
— 3 bonus ideas that directly support the main transformation
— How to describe the value of each bonus
— Physical product addition if relevant to {topic}

STEP 3: THE DELIVERY SYSTEM
— Exactly how each week/month is structured
— Client touchpoints and how often
— How to create amazing results without burning out

STEP 4: THE PRICING AND POSITIONING
— Recommended price range for this {topic} offer at this level
— How to present the offer verbally (the pitch in 3 sentences)
— The guarantee that removes risk without devaluing your work

STEP 5: THE SALES CONVERSATION
— How to naturally lead to this offer in conversation
— The 3 questions to ask that make them close themselves

STEP 6: SCALE READINESS
— When to convert this to group format
— Delegation opportunities as you grow
— How to increase price as results accumulate`
          ),
        },
        {
          id: 40,
          title: "Membership & Community Site Builder",
          category: "Product & Offer Creation",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "advanced",
          useCase: "Build a recurring-revenue {topic} membership community that members love",
          tags: ["membership", "community", "recurring revenue"],
          prompt: fill(
            `You are a membership site and community expert who has built thriving {topic} membership communities with 80%+ annual retention rates for {audience}.

Design a complete {topic} membership community from scratch.

MEMBERSHIP CONCEPT:
— Community name and tagline
— Core promise (why members join and stay)
— Membership levels (2–3 tiers recommended) with clear value differentiation
— Ideal member profile and onboarding qualification

CONTENT AND VALUE DELIVERY:
Monthly content cadence:
— Week 1: Main training/masterclass (60–90 mins on {topic})
— Week 2: Live Q&A / hot seat coaching
— Week 3: Guest expert or case study
— Week 4: Implementation / accountability session

Evergreen content library:
— Core curriculum modules (what to create first)
— Resource vault organization
— Tool and template library for {topic}

COMMUNITY ENGAGEMENT SYSTEM:
— Welcome experience for new members (first 48 hours)
— Daily/weekly community prompts
— Gamification elements (badges, leaderboards, recognition)
— Member spotlight program
— Challenge format (4-week sprints for {topic})

RETENTION STRATEGIES:
— The "aha moment" framework (getting members results fast)
— At-risk member identification and intervention
— Annual vs monthly pricing recommendation
— Exit survey for churned members (what to learn)

MONETIZATION BEYOND DUES:
— Upsell opportunities within the community
— Affiliate and partner revenue ideas
— Event and live experience monetization
— Premium tier creation

TECHNICAL SETUP:
— Platform comparison for {topic} communities
— Launch strategy for first 100 members
— Pricing strategy at different member counts`
          ),
        },
      ],
    },
    {
      name: "AI Creative Direction",
      icon: "🎨",
      description: "Visual AI prompts for Midjourney, DALL·E, and creative work",
      prompts: [
        {
          id: 41,
          title: "Midjourney Product Photography Master",
          category: "AI Creative Direction",
          platforms: ["midjourney"],
          difficulty: "intermediate",
          useCase: "Create stunning product photography for {topic} using Midjourney",
          tags: ["midjourney", "product photography", "AI art"],
          prompt: fill(
            `You are a professional AI photography director who creates award-winning product visuals for {topic} brands using Midjourney v6.1.

Create 20 professional Midjourney prompts for {topic} product photography targeting {audience}.

PROMPT STRUCTURE GUIDE:
[Subject] + [Environment/Setting] + [Lighting] + [Angle] + [Style] + [Camera] + [Technical parameters]

PROMPT CATEGORIES:

HERO SHOTS (5 prompts):
— Clean white/gradient background studio shots
— Natural lifestyle contexts for {topic}
— Dramatic shadow and light play
— Overhead flat-lay compositions
— Close-up detail/texture shots

LIFESTYLE SHOTS (5 prompts):
— In-use contextual shots with {audience} personas
— Environmental storytelling (where {topic} lives in real life)
— Action/movement shots
— Aspirational setting shots
— Seasonal/mood variations

SOCIAL MEDIA OPTIMIZED (5 prompts):
— Instagram-ratio vertical shots
— Carousel-ready horizontal layouts
— Story-format bold compositions
— Minimal text-space compositions
— High-contrast dark mode versions

BRAND STORYTELLING (5 prompts):
— Behind-the-scenes aesthetic
— Ingredient/component macro shots
— Process and craftsmanship angles
— Packaging and unboxing scenes
— Team/human element without faces

TECHNICAL PARAMETERS TO INCLUDE:
— Aspect ratios (--ar 16:9, 1:1, 4:5, 9:16)
— Style references (--style raw, --v 6.1)
— Quality settings (--q 2)
— Lighting: golden hour, studio soft box, neon, etc.
— Camera: Hasselblad 500cm, Sony A7RV, Canon 5D Mark IV simulation

For each prompt: write the full Midjourney prompt + a "remix tip" for variations.`
          ),
        },
        {
          id: 42,
          title: "Brand Identity Visual System",
          category: "AI Creative Direction",
          platforms: ["midjourney", "gemini"],
          difficulty: "advanced",
          useCase: "Create a complete AI-generated brand visual identity for {topic} brands",
          tags: ["branding", "visual identity", "AI art"],
          prompt: fill(
            `You are a senior brand identity designer who creates complete visual systems for {topic} brands using AI tools.

Design a complete AI-generated brand identity system for a {topic} brand targeting {audience}.

BRAND VISUAL DIRECTION:

BRAND PERSONALITY DEFINITION:
— Choose 5 brand personality archetypes for {topic}
— Visual personality statement (what the brand looks like)
— What the brand absolutely does NOT look like
— Visual references from existing brands (that are NOT in {topic})

LOGO CONCEPT PROMPTS (10 Midjourney prompts):
For each style:
— Wordmark (text-based)
— Lettermark (initials)
— Pictorial mark (icon)
— Abstract mark
— Emblem
— Combination mark (2 variations each)

Each prompt should specify: style, color palette, mood, complexity level

COLOR PALETTE SYSTEM:
— Primary color: the exact emotion it should evoke for {topic}
— Secondary color(s): supporting palette
— Accent color: for CTAs and highlights
— Neutral colors: backgrounds and text
— Color psychology explanation for {audience}
— Hex code generation prompts

TYPOGRAPHY DIRECTION:
— Primary font personality (serif/sans/display)
— Secondary font for body copy
— How to source and pair fonts using AI
— Type scale for digital use

PATTERN AND TEXTURE PROMPTS:
— 5 background texture/pattern prompts for {topic} brand
— Brand illustration style direction

APPLICATION MOCKUP PROMPTS:
— Business card
— Social media template
— Email header
— Website hero background
— Packaging (if applicable to {topic})`
          ),
        },
        {
          id: 43,
          title: "Social Media Visual Content Suite",
          category: "AI Creative Direction",
          platforms: ["midjourney", "gemini"],
          difficulty: "beginner",
          useCase: "Generate a month of AI visual content for {topic} brands social media",
          tags: ["social media", "visual content", "AI art"],
          prompt: fill(
            `You are a social media creative director who produces scroll-stopping AI visuals for {topic} brands targeting {audience}.

Create 30 social media visual content prompts for a {topic} brand — one for each day of the month.

CONTENT CALENDAR STRUCTURE:

WEEK 1 — BRAND AWARENESS (7 prompts):
Days 1–7: Prompts focused on communicating {topic} brand value and personality
Include: mood boards, inspirational backgrounds, brand story visuals

WEEK 2 — EDUCATIONAL CONTENT (7 prompts):
Days 8–14: Visuals for infographic-style content about {topic}
Include: data visualization backgrounds, step-by-step visual frameworks, illustration styles

WEEK 3 — SOCIAL PROOF & COMMUNITY (7 prompts):
Days 15–21: Testimonial design backgrounds, community celebration visuals, before/after frameworks
Include: typography-forward designs, celebration graphics

WEEK 4 — PROMOTIONAL (9 prompts):
Days 22–30: Offer announcement visuals, sale graphics, product focus shots for {topic}
Include: urgency-creating visual elements, bold promotional styles

FOR EACH PROMPT:
— Full Midjourney/DALL-E 3 prompt (ready to paste)
— Platform optimization (IG feed vs Stories vs LinkedIn vs TikTok thumbnail)
— Color palette to use
— Text overlay recommendations (where and what to write on the image)
— Caption angle to pair with this visual

BONUS: Write 5 "evergreen" visual prompts that can be reused for {topic} any month.`
          ),
        },
        {
          id: 44,
          title: "YouTube Thumbnail Designer",
          category: "AI Creative Direction",
          platforms: ["midjourney", "gemini"],
          difficulty: "intermediate",
          useCase: "Create click-through-rate-crushing YouTube thumbnails for {topic} videos",
          tags: ["YouTube", "thumbnail", "AI art"],
          prompt: fill(
            `You are a YouTube thumbnail specialist who has designed thumbnails that consistently achieve 8–15% click-through rates for {topic} channels targeting {audience}.

Create 15 YouTube thumbnail concept prompts for a {topic} channel.

THUMBNAIL PSYCHOLOGY FOR {topic}:
— The 3-element rule (face + text + element)
— Color contrast principles for {topic} niche
— Emotion mapping (what emotion makes {audience} click in this niche)
— The "thumbnail test" — can you understand it in 2 seconds?

THUMBNAIL CATEGORIES (3 prompts each):

CURIOSITY THUMBNAILS (3):
Design prompts for thumbnails that create an information gap about {topic}
— Include: face with exaggerated expression, arrow pointing to something hidden, dramatic contrast

PROOF/RESULT THUMBNAILS (3):
Design prompts showing a transformation or impressive result for {topic}
— Include: before/after split, numbers prominently displayed, authentic excitement

AUTHORITY THUMBNAILS (3):
Design prompts that position the creator as the expert in {topic}
— Include: professional setting, clean branded elements, confident pose

CONTROVERSY/HOT TAKE THUMBNAILS (3):
Design prompts for bold opinion pieces about {topic}
— Include: bold text, dramatic background, confrontational visual style

LISTICLE/HOW-TO THUMBNAILS (3):
Design prompts for educational {topic} content
— Include: numbered graphics, step indicators, clear subject matter

FOR EACH PROMPT:
— Full Midjourney prompt
— Text overlay recommendation (font color, size, placement)
— Why this will make {audience} click
— A/B test variant suggestion`
          ),
        },
        {
          id: 45,
          title: "AI Avatar & Presenter Creator",
          category: "AI Creative Direction",
          platforms: ["midjourney", "gemini"],
          difficulty: "intermediate",
          useCase: "Create professional AI-generated presenter and character visuals for {topic}",
          tags: ["AI avatar", "presenter", "character design"],
          prompt: fill(
            `You are an AI character design and brand avatar expert who creates professional presenter visuals for {topic} brands targeting {audience}.

Create 15 AI character and presenter prompts for a {topic} brand.

IMPORTANT: These prompts create diverse, professional character CONCEPTS only — not specific real people.

BRAND AVATAR CONCEPTS (5 prompts):
Create a consistent "face of the brand" character concept for {topic}:
— Professional expert avatar (smart, trustworthy, relatable for {audience})
— Casual lifestyle presenter (approachable, energetic)
— Premium authority figure (sophisticated, high-end)
— Young innovator persona (fresh, forward-thinking)
— Mentor archetype (wise, warm, experienced)

For each: full Midjourney prompt including clothing style, background, expression, lighting

PRESENTATION BACKGROUNDS (5 prompts):
Professional environments for {topic} content:
— Home office setup (clean, minimal, branded)
— Premium studio look (gradient backdrop, dramatic lighting)
— Outdoor/location-based context relevant to {topic}
— Virtual background (branded, professional)
— Whiteboard/teaching environment

AI VIDEO PRESENTER INTEGRATION:
For each character concept:
— How to use with AI video tools (HeyGen, Synthesia direction)
— Script format that works with AI presenters
— How to maintain visual consistency across content

STYLE GUIDE:
— The do's and don'ts for {topic} brand avatar usage
— How to brief a human illustrator if upgrading
— Consistency checklist for multiple images`
          ),
        },
      ],
    },
    {
      name: "Personal Development & Mindset",
      icon: "🧠",
      description: "Transformational prompts for growth, mindset, and productivity",
      prompts: [
        {
          id: 46,
          title: "Goal Setting & Life Architecture System",
          category: "Personal Development & Mindset",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Design a complete {topic} goal system that actually gets results",
          tags: ["goals", "productivity", "life design"],
          prompt: fill(
            `You are a peak performance coach and life design expert who has helped hundreds of {audience} achieve breakthrough results in {topic} through strategic goal setting.

Create a complete goal setting and life architecture system for {topic}.

THE 12-MONTH LIFE ARCHITECTURE:

VISION CREATION:
— The "Future Self" visualization exercise for {topic} (detailed script)
— "Obituary Writing" framework — what do they want their legacy to be related to {topic}?
— The 10-year letter (write a letter from your future self to current self about {topic})

GOAL HIERARCHY:
— 1 Major Definite Purpose (MDP) for the year related to {topic}
— 4 Quarterly Milestones that ladder up to the MDP
— 12 Monthly Projects (one per month) that achieve each milestone
— Weekly Big 3 priorities framework
— Daily Power Hour structure for {topic} progress

THE ANTI-GOAL SYSTEM:
— Identify the 3 behaviors that most sabotage progress in {topic}
— Design specific "anti-goals" (what you will NOT do)
— Accountability structure for anti-goals

TRACKING AND REVIEW:
— Daily review question set (5 questions, 5 minutes)
— Weekly review ritual (30-minute guided process)
— Monthly review framework
— Quarterly recalibration process

MINDSET TOOLS FOR {topic}:
— The belief audit (identifying limiting beliefs holding you back)
— Identity statement creation ("I am the type of person who...")
— Morning ritual design for {topic} achievement
— Evening ritual for consolidation and recovery

ACCOUNTABILITY DESIGN:
— How to choose an accountability partner for {topic}
— What to share and how often
— Consequence structure that actually motivates`
          ),
        },
        {
          id: 47,
          title: "Habit Architecture & Behavior Design",
          category: "Personal Development & Mindset",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Design a sustainable habit system for {topic} mastery",
          tags: ["habits", "behavior design", "discipline"],
          prompt: fill(
            `You are a behavioral science expert and habit design coach who has helped {audience} build lasting habits in {topic} using evidence-based psychology.

Create a complete habit architecture system for mastering {topic}.

THE HABIT SCIENCE FOUNDATION:
— The habit loop (cue-routine-reward) applied specifically to {topic}
— Identity-based habit formation (James Clear framework applied to {topic})
— Why most {audience} fail at building {topic} habits (the real reasons)
— The "implementation intention" formula for {topic} habits

HABIT DESIGN FOR {topic}:

CORE HABITS TO BUILD (6 habits):
For each habit:
— Habit name and exact behavior (specific, measurable)
— Implementation intention: "When X happens, I will do Y in Z location"
— Habit stack (attach to existing routine)
— Minimum viable habit (for low-energy days)
— Tracking method
— 30-day progressive loading plan

HABIT ENVIRONMENT DESIGN:
— How to make {topic} habits obvious (cue design)
— How to make them attractive (craving design)
— How to make them easy (friction reduction)
— How to make them satisfying (reward design)

THE 66-DAY HABIT CHALLENGE:
— Days 1–21: Installation phase
— Days 22–44: Strengthening phase
— Days 45–66: Automation phase
— What to expect at each phase and how to handle resistance

HABIT TRACKING SYSTEM:
— Daily habit scorecard template
— Weekly review questions
— How to handle missed days (the "never miss twice" rule)
— Progress celebration checkpoints

HABIT STACKING SEQUENCES:
— Morning stack for {topic} practitioners
— Evening stack for consolidation
— Weekend ritual for deeper work on {topic}`
          ),
        },
        {
          id: 48,
          title: "Mental Performance & Focus Optimizer",
          category: "Personal Development & Mindset",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Maximize cognitive performance for {topic} mastery and deep work",
          tags: ["focus", "productivity", "performance"],
          prompt: fill(
            `You are a high-performance neuroscience coach who helps {audience} optimize their mental performance for deep work in {topic}.

Create a complete mental performance system for {topic} practitioners.

THE FOCUS ARCHITECTURE:

ENERGY MANAGEMENT PROTOCOL:
— The 4 types of energy (physical/mental/emotional/spiritual) and how each affects {topic} performance
— Your "peak performance window" — how to identify and protect your best mental hours for {topic}
— Energy audit (what drains vs. restores your capacity for {topic} work)
— Ultradian rhythm optimization (90-minute focus cycles)

DEEP WORK SYSTEM FOR {topic}:
— Environment design: 5 specific changes to your workspace that increase focus by 40%
— Digital minimalism protocol: phone, notifications, apps to remove
— The "shutdown ritual" — how to end work sessions to prevent mental carry-over
— Deep work scheduling templates (for different schedule types)
— How to reach flow state in {topic} within 15 minutes

COGNITIVE ENHANCEMENT TOOLS:
— Pre-work activation ritual (3–5 minute protocol)
— The Pomodoro variant that works for {topic} deep work
— Music/sound environments for different {topic} tasks
— The power nap protocol (20 vs 90 minutes — when to use which)

COGNITIVE LOAD MANAGEMENT:
— Decision batching for {topic} (reduce daily decisions)
— The "brain dump" practice to clear working memory
— Weekly planning ritual that prevents cognitive overload
— How to process information from {topic} learning more effectively

RECOVERY AND RESTORATION:
— The 7 types of rest (beyond sleep)
— Active recovery activities that prime creativity for {topic}
— The "creative walk" protocol
— How to prevent and recover from {topic} burnout`
          ),
        },
        {
          id: 49,
          title: "Confidence & Mindset Reprogramming",
          category: "Personal Development & Mindset",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "intermediate",
          useCase: "Build unshakeable confidence in {topic} and eliminate self-doubt",
          tags: ["confidence", "mindset", "self-belief"],
          prompt: fill(
            `You are a mindset coach and performance psychologist who has helped hundreds of {audience} transform their confidence and relationship with {topic}.

Create a complete confidence and mindset reprogramming system for {topic}.

THE CONFIDENCE AUDIT:
— Identify the 5 most common {topic}-specific confidence blocks
— The "confidence inventory" — rating current confidence across {topic} sub-skills (1–10)
— Root cause analysis: where did this confidence gap come from?
— The cost of low confidence in {topic} (financial, relational, professional)

CORE BELIEF REPROGRAMMING:
For {topic} practitioners:
— Identify the top 5 limiting beliefs that hold back {audience}
— For each belief: identify the origin story, challenge the evidence, create an empowering alternative
— The "belief adoption" process: how to install new beliefs
— Daily affirmation design (specific to {topic}, not generic)
— The "evidence journal" practice

CONFIDENCE-BUILDING ACTIONS:
— The "confidence ladder" for {topic}: 10 progressively challenging actions from easy to scary
— Micro-victories protocol: how to use small wins to build real confidence
— The "act as if" framework: how to behave confidently before you feel it
— Public commitment strategies specific to {topic}

SELF-TALK REPROGRAMMING:
— The 3 types of self-talk and how to identify yours
— Specific {topic} self-talk patterns to catch and replace
— The "inner coach" vs "inner critic" dialogue
— Mantras that resonate for {topic} practitioners (not generic)

RESILIENCE & SETBACK RECOVERY:
— The failure reframe: how to process {topic} setbacks as data
— The 24-hour rule for emotional processing
— How to learn from failure without over-analyzing
— Building post-traumatic growth from {topic} struggles`
          ),
        },
        {
          id: 50,
          title: "Daily Journaling & Reflection System",
          category: "Personal Development & Mindset",
          platforms: ["chatgpt", "claude", "universal"],
          difficulty: "beginner",
          useCase: "Build a high-performance journaling practice to accelerate {topic} growth",
          tags: ["journaling", "reflection", "self-awareness"],
          prompt: fill(
            `You are a journaling expert and mindfulness coach who has designed science-backed reflection practices for {audience} pursuing mastery in {topic}.

Create a complete daily journaling system for {topic} growth and mastery.

THE SCIENCE OF JOURNALING FOR {topic}:
— How journaling specifically accelerates skill development in {topic}
— The link between reflection and performance (research findings)
— Why most people quit journaling and how to prevent it
— The minimum effective dose (how much writing actually matters)

MORNING JOURNAL (10 minutes):
Full script with specific prompts:
— Gratitude (3 items — with the {topic}-specific twist that makes it powerful)
— Today's intention for {topic} (not a task list — a state of being)
— The one {topic} action that would make today a win
— Potential obstacle and pre-made response
— Energy and mindset rating (1–10) with what will move it up

EVENING JOURNAL (7 minutes):
— What happened in {topic} today (facts only)
— What I learned (the lesson, not the story)
— What I'm proud of (celebrating micro-victories)
— What I'd do differently (no self-judgment — just data)
— Tomorrow's prime opportunity for {topic}

WEEKLY DEEP REFLECTION (30 minutes):
— Progress toward {topic} goals this week
— Patterns I'm noticing in my {topic} work
— Who I need to reach out to or learn from
— Energy and motivation trend (where am I headed?)
— The 3 things I will commit to differently next week

{topic}-SPECIFIC JOURNAL PROMPTS:
30 unique journal prompts designed specifically for {audience} working on {topic}:
— 10 prompts for when you feel stuck or blocked
— 10 prompts for when you're in momentum
— 10 prompts for strategic planning and decision-making

BONUS: The 5-minute crisis journal for overwhelming moments.`
          ),
        },
      ],
    },
  ];

  // Industry-based category prioritization
  const INDUSTRY_CATEGORY_MAP: Record<string, number[]> = {
    business: [0, 3, 4, 5, 6],
    marketing: [0, 1, 6, 5, 7],
    ecommerce: [0, 1, 2, 6, 7],
    social_media: [1, 0, 2, 6, 7],
    coaching: [4, 0, 1, 5, 9],
    education: [6, 4, 0, 3, 9],
    health: [9, 4, 1, 0, 7],
    creative: [7, 1, 0, 8, 2],
    realestate: [0, 6, 1, 3, 4],
    food: [1, 6, 0, 7, 9],
    sales: [0, 1, 2, 4, 5],
    content: [1, 0, 2, 6, 7],
    default: [0, 1, 2, 3, 4],
  };

  const categoryIndices = INDUSTRY_CATEGORY_MAP[industry] ?? INDUSTRY_CATEGORY_MAP.default;
  return categoryIndices.slice(0, 5).map((idx) => ALL_CATEGORIES[idx]).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY SCORING
// ─────────────────────────────────────────────────────────────────────────────
function scorePromptBundle(bundle: PromptBundle): { quality: number; sellability: number } {
  let quality = 0;
  let sellability = 0;

  const allPrompts = bundle.categories.flatMap((c) => c.prompts);
  const totalPrompts = allPrompts.length;

  // Quality scoring
  const avgPromptLength =
    allPrompts.reduce((sum, p) => sum + p.prompt.length, 0) / Math.max(totalPrompts, 1);
  quality += Math.min(30, Math.floor(avgPromptLength / 50)); // Up to 30 pts for prompt depth

  const topicMentions = allPrompts.filter((p) =>
    p.prompt.toLowerCase().includes(bundle.topic.toLowerCase().split(" ")[0])
  ).length;
  quality += Math.min(25, Math.floor((topicMentions / totalPrompts) * 25)); // Topic specificity

  const hasAllStructures = allPrompts.every(
    (p) =>
      p.prompt.includes("You are") || p.prompt.includes("your task") || p.prompt.includes("STEP")
  );
  quality += hasAllStructures ? 20 : 10; // Structure quality

  quality += Math.min(15, bundle.categories.length * 3); // Category variety
  quality += totalPrompts >= 50 ? 10 : totalPrompts >= 25 ? 5 : 2; // Bundle size

  quality = Math.min(100, quality);

  // Sellability scoring (commercial viability)
  const HOT_INDUSTRIES = ["business", "marketing", "ecommerce", "social_media", "coaching", "sales"];
  sellability += HOT_INDUSTRIES.includes(bundle.industry) ? 30 : 20;

  const PLATFORM_SCORES: Record<string, number> = {
    chatgpt: 35,
    claude: 30,
    universal: 35,
    midjourney: 30,
    gemini: 25,
  };
  sellability += PLATFORM_SCORES[bundle.platform] ?? 20;

  sellability += totalPrompts >= 50 ? 20 : totalPrompts >= 25 ? 15 : 10;
  sellability += bundle.pricingRecommended <= 47 ? 15 : 10; // Accessible price = more sales

  sellability = Math.min(100, sellability);

  return { quality, sellability };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNDLE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function generateBundle(params: {
  topic: string;
  angle: string;
  platform: string;
  industry: string;
  bundleSize: number;
}): PromptBundle {
  const { topic, angle, platform, industry, bundleSize } = params;
  const audience = ANGLES[angle] ?? "business professionals";

  const categories = buildCategories(topic, angle, audience, platform, industry);

  // Limit to bundleSize (25 = 5 categories × 5, 50 = 10 categories × 5, 100 = 10 categories × 10)
  const selectedCategories = bundleSize >= 100 ? categories : categories.slice(0, Math.min(5, categories.length));

  const allPrompts = selectedCategories.flatMap((c) => c.prompts);
  const samplePrompts = allPrompts.slice(0, 3);

  const topicTitle = topic.trim().replace(/\b\w/g, (l) => l.toUpperCase());
  const packageTitle = `${topicTitle} Ultimate Prompt Pack — ${bundleSize} Professional AI Prompts`;
  const tagline = `The definitive prompt collection for ${audience} in the ${topic} space`;

  const bundle: PromptBundle = {
    packageTitle,
    tagline,
    packageDescription: `This comprehensive prompt bundle gives you ${allPrompts.length} ready-to-use, professional AI prompts specifically designed for ${topic}. Each prompt is optimized for ${PLATFORM_NOTES[platform] ?? platform} and built for ${audience}. Stop writing prompts from scratch — these are battle-tested templates that deliver results immediately.`,
    topic,
    angle,
    platform,
    industry,
    bundleSize,
    totalPrompts: allPrompts.length,
    qualityScore: 0,
    sellabilityScore: 0,
    categories: selectedCategories,
    samplePrompts,
    pricingRecommended: allPrompts.length >= 100 ? 47 : allPrompts.length >= 50 ? 27 : 17,
    landingPageHook: `Stop wasting hours trying to get AI to do what you need. These ${allPrompts.length} ${topic} prompts are engineered to get you professional results — immediately.`,
    landingPageBenefits: [
      `${allPrompts.length} done-for-you professional prompts — ready to copy and paste`,
      `Optimized for ${platform} — no guessing what works on which platform`,
      `Covers every major ${topic} use case from beginner to advanced`,
      `Built specifically for ${audience} — not generic "anyone" prompts`,
      `Instant download — start using in the next 5 minutes`,
    ],
    landingPageWhoFor: [
      `${audience.charAt(0).toUpperCase() + audience.slice(1)} who want to use AI more effectively for ${topic}`,
      `Beginners who don't know how to write effective prompts for ${topic}`,
      `Experienced practitioners who want to save hours of prompt engineering`,
      `Agency owners who need a repeatable ${topic} AI workflow`,
      `Anyone building a business around ${topic} who wants professional AI output`,
    ],
    generatedAt: new Date().toISOString(),
  };

  const scores = scorePromptBundle(bundle);
  bundle.qualityScore = scores.quality;
  bundle.sellabilityScore = scores.sellability;

  return bundle;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRENDING GENERATOR (personalized per user + day)
// ─────────────────────────────────────────────────────────────────────────────
function getTrendingForUser(userId: number): TrendingNiche[] {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const seed = (userId * 7919 + dayOfYear * 31) % TRENDING_NICHES.length;
  const shuffled = [...TRENDING_NICHES];

  // Seeded shuffle — different per user + day
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 1009) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF DOWNLOAD GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
function generatePDFHTML(bundle: PromptBundle): string {
  const qScore = bundle.qualityScore ?? 88;
  const qColor = qScore >= 80 ? "#10b981" : qScore >= 60 ? "#f59e0b" : "#ef4444";
  const totalByDiff = { beginner: 0, intermediate: 0, advanced: 0 };
  bundle.categories.forEach(cat => cat.prompts.forEach(p => { totalByDiff[p.difficulty as keyof typeof totalByDiff] = (totalByDiff[p.difficulty as keyof typeof totalByDiff] ?? 0) + 1; }));

  const promptsHTML = bundle.categories
    .flatMap((cat, catIdx) =>
      cat.prompts.map(
        (p, i) => `
      <div class="prompt-card">
        <div class="prompt-header">
          <span class="prompt-number">${catIdx * 100 + i + 1}</span>
          <span class="prompt-category">${cat.icon} ${cat.name}</span>
          <span class="prompt-difficulty ${p.difficulty}">${p.difficulty.toUpperCase()}</span>
        </div>
        <h3 class="prompt-title">${p.title}</h3>
        <p class="prompt-usecase">✦ ${p.useCase}</p>
        <div class="prompt-platforms">${p.platforms.map((pl) => `<span class="platform-badge">${pl}</span>`).join("")}</div>
        <div class="prompt-body">${p.prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>
        <div class="prompt-tags">${p.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</div>
      </div>
    `
      )
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${bundle.packageTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Georgia, serif; background: #f8f7ff; color: #1a1a1a; line-height: 1.7; }

  /* ── COVER ─────────────────────────────────────────── */
  .cover {
    background: linear-gradient(135deg, #2d1a5e 0%, #6d28d9 55%, #4f46e5 100%);
    color: white; padding: 0; min-height: 420px; position: relative; overflow: hidden;
  }
  .cover-bg-circles {
    position: absolute; inset: 0; pointer-events: none;
  }
  .cover-content { position: relative; z-index: 1; padding: 60px 56px 52px; }
  .cover-brand { font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; opacity: .6; margin-bottom: 32px; }
  .cover h1 { font-size: 34px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; letter-spacing: -.02em; }
  .cover .tagline { font-size: 16px; opacity: .88; max-width: 580px; line-height: 1.6; margin-bottom: 36px; }
  .cover-stats { display: flex; gap: 16px; flex-wrap: wrap; }
  .cover-stat {
    background: rgba(255,255,255,.12); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,255,255,.2); padding: 14px 20px; border-radius: 14px;
    text-align: center; min-width: 100px;
  }
  .cover-stat-num { font-size: 26px; font-weight: 900; line-height: 1; }
  .cover-stat-label { font-size: 10px; opacity: .7; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; margin-top: 4px; }
  .cover-score-bar { margin-top: 36px; max-width: 420px; }
  .cover-score-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; opacity: .75; margin-bottom: 7px; letter-spacing: .04em; text-transform: uppercase; }
  .cover-score-track { height: 8px; background: rgba(255,255,255,.15); border-radius: 8px; overflow: hidden; }
  .cover-score-fill { height: 100%; border-radius: 8px; background: ${qColor}; width: ${qScore}%; }

  /* ── STATS INFOGRAPHIC ─────────────────────────────── */
  .stats-section { background: white; padding: 40px 56px; border-bottom: 2px solid #e5e7eb; }
  .stats-section h2 { font-size: 14px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 28px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
  .stat-card { background: #f5f3ff; border: 1px solid #e0d9ff; border-radius: 14px; padding: 20px; text-align: center; }
  .stat-card-icon { font-size: 28px; margin-bottom: 8px; }
  .stat-card-num { font-size: 32px; font-weight: 900; color: #6d28d9; }
  .stat-card-label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 4px; }
  .diff-bars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .diff-bar-wrap { background: #f9fafb; border-radius: 10px; padding: 14px 16px; }
  .diff-bar-top { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
  .diff-bar-track { height: 6px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
  .diff-bar-fill-b { height: 100%; border-radius: 6px; background: #10b981; }
  .diff-bar-fill-i { height: 100%; border-radius: 6px; background: #f59e0b; }
  .diff-bar-fill-a { height: 100%; border-radius: 6px; background: #ef4444; }

  /* ── TOC ───────────────────────────────────────────── */
  .toc { padding: 40px 56px; background: white; border-bottom: 1px solid #e5e7eb; }
  .toc h2 { font-size: 20px; font-weight: 800; margin-bottom: 24px; color: #2d1a5e; }
  .toc-item { padding: 12px 0; border-bottom: 1px dashed #e5e7eb; display: flex; align-items: center; gap: 14px; }
  .toc-num { width: 28px; height: 28px; background: linear-gradient(135deg, #6d28d9, #4f46e5); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .toc-name { flex: 1; font-size: 14px; font-weight: 600; color: #1a1a1a; }
  .toc-count { font-size: 12px; color: #9ca3af; }

  /* ── CATEGORY HEADER ───────────────────────────────── */
  .category-header { background: linear-gradient(135deg, #f5f3ff, #ede9fe); padding: 28px 56px; border-left: 6px solid #6d28d9; margin: 48px 0 0; }
  .category-header h2 { font-size: 22px; font-weight: 800; color: #2d1a5e; }
  .category-header p { color: #6b7280; font-size: 14px; margin-top: 6px; }

  /* ── PROMPT CARD ───────────────────────────────────── */
  .prompt-card { padding: 32px 56px; border-bottom: 1px solid #e5e7eb; background: white; page-break-inside: avoid; }
  .prompt-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .prompt-number { font-size: 11px; background: linear-gradient(135deg,#6d28d9,#4f46e5); color: white; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; flex-shrink: 0; }
  .prompt-category { font-size: 12px; color: #6b7280; }
  .prompt-difficulty { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-left: auto; }
  .prompt-difficulty.beginner { background: #dcfce7; color: #166534; }
  .prompt-difficulty.intermediate { background: #fef3c7; color: #92400e; }
  .prompt-difficulty.advanced { background: #fee2e2; color: #991b1b; }
  .prompt-title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 8px; }
  .prompt-usecase { font-size: 13px; color: #6d28d9; margin-bottom: 14px; font-style: italic; }
  .prompt-platforms { margin-bottom: 18px; display: flex; flex-wrap: wrap; gap: 6px; }
  .platform-badge { font-size: 11px; background: #ede9fe; color: #6d28d9; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
  .prompt-body { font-size: 13px; color: #374151; background: #f9fafb; padding: 22px 24px; border-radius: 12px; border-left: 4px solid #6d28d9; white-space: pre-wrap; font-family: 'Courier New', monospace; line-height: 1.85; box-shadow: 0 2px 8px rgba(109,40,217,.08); }
  .prompt-tags { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { font-size: 11px; color: #9ca3af; background: #f3f4f6; padding: 3px 10px; border-radius: 20px; }

  /* ── FOOTER ────────────────────────────────────────── */
  .footer { text-align: center; padding: 48px 40px; color: #9ca3af; font-size: 13px; background: #f5f3ff; border-top: 2px solid #e0d9ff; }
  .footer strong { color: #6d28d9; }

  @media print {
    .prompt-card { page-break-inside: avoid; }
    .category-header { page-break-before: always; }
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <svg class="cover-bg-circles" viewBox="0 0 900 420" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <circle cx="820" cy="-40" r="220" fill="rgba(255,255,255,0.06)"/>
    <circle cx="100" cy="380" r="160" fill="rgba(255,255,255,0.04)"/>
    <circle cx="500" cy="210" r="300" fill="rgba(255,255,255,0.03)"/>
    <circle cx="750" cy="350" r="120" fill="rgba(255,255,255,0.05)"/>
  </svg>
  <div class="cover-content">
    <div class="cover-brand">Selovox Prompt Studio • Professional AI Prompts</div>
    <h1>${bundle.packageTitle}</h1>
    <div class="tagline">${bundle.tagline}</div>
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-num">${bundle.totalPrompts}</div>
        <div class="cover-stat-label">Prompts</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${bundle.categories.length}</div>
        <div class="cover-stat-label">Categories</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${bundle.platform.charAt(0).toUpperCase() + bundle.platform.slice(1)}</div>
        <div class="cover-stat-label">Platform</div>
      </div>
      <div class="cover-stat" style="background:rgba(${qScore>=80?"16,185,129":qScore>=60?"245,158,11":"239,68,68"},.25);border-color:rgba(${qScore>=80?"16,185,129":qScore>=60?"245,158,11":"239,68,68"},.4)">
        <div class="cover-stat-num">${qScore}</div>
        <div class="cover-stat-label">Quality Score</div>
      </div>
    </div>
    <div class="cover-score-bar">
      <div class="cover-score-label"><span>Package Quality</span><span>${qScore}/100</span></div>
      <div class="cover-score-track"><div class="cover-score-fill"></div></div>
    </div>
  </div>
</div>

<!-- STATS INFOGRAPHIC -->
<div class="stats-section">
  <h2>📊 Package Overview</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-card-icon">📝</div>
      <div class="stat-card-num">${bundle.totalPrompts}</div>
      <div class="stat-card-label">Total Prompts</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">📂</div>
      <div class="stat-card-num">${bundle.categories.length}</div>
      <div class="stat-card-label">Categories</div>
    </div>
    <div class="stat-card" style="background:${qColor}18;border-color:${qColor}50">
      <div class="stat-card-icon">⭐</div>
      <div class="stat-card-num" style="color:${qColor}">${qScore}</div>
      <div class="stat-card-label">Quality Score</div>
    </div>
  </div>
  <div class="diff-bars">
    <div class="diff-bar-wrap">
      <div class="diff-bar-top"><span style="color:#166534">🟢 Beginner</span><span style="color:#166534">${totalByDiff.beginner}</span></div>
      <div class="diff-bar-track"><div class="diff-bar-fill-b" style="width:${bundle.totalPrompts ? Math.round(totalByDiff.beginner/bundle.totalPrompts*100) : 0}%"></div></div>
    </div>
    <div class="diff-bar-wrap">
      <div class="diff-bar-top"><span style="color:#92400e">🟡 Intermediate</span><span style="color:#92400e">${totalByDiff.intermediate}</span></div>
      <div class="diff-bar-track"><div class="diff-bar-fill-i" style="width:${bundle.totalPrompts ? Math.round(totalByDiff.intermediate/bundle.totalPrompts*100) : 0}%"></div></div>
    </div>
    <div class="diff-bar-wrap">
      <div class="diff-bar-top"><span style="color:#991b1b">🔴 Advanced</span><span style="color:#991b1b">${totalByDiff.advanced}</span></div>
      <div class="diff-bar-track"><div class="diff-bar-fill-a" style="width:${bundle.totalPrompts ? Math.round(totalByDiff.advanced/bundle.totalPrompts*100) : 0}%"></div></div>
    </div>
  </div>
</div>

<div class="toc">
  <h2>📋 Table of Contents</h2>
  ${bundle.categories.map((cat, i) => `
    <div class="toc-item">
      <span>${cat.icon} ${cat.name}</span>
      <span>${cat.prompts.length} prompts</span>
    </div>
  `).join("")}
</div>

${bundle.categories
  .map(
    (cat) => `
  <div class="category-header">
    <h2>${cat.icon} ${cat.name}</h2>
    <p>${cat.description}</p>
  </div>
  ${cat.prompts
    .map(
      (p, i) => `
    <div class="prompt-card">
      <div class="prompt-header">
        <span class="prompt-number">${i + 1}</span>
        <span class="prompt-category">${cat.icon} ${cat.name}</span>
        <span class="prompt-difficulty ${p.difficulty}">${p.difficulty.toUpperCase()}</span>
      </div>
      <h3 class="prompt-title">${p.title}</h3>
      <p class="prompt-usecase">✦ ${p.useCase}</p>
      <div class="prompt-platforms">${p.platforms.map((pl) => `<span class="platform-badge">${pl}</span>`).join("")}</div>
      <div class="prompt-body">${p.prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>
      <div class="prompt-tags">${p.tags.map((t) => `<span class="tag">#${t}</span>`).join(" ")}</div>
    </div>
  `
    )
    .join("")}
`
  )
  .join("")}

<div class="footer">
  <p>Generated by Selovox Prompt Studio • ${bundle.totalPrompts} Professional AI Prompts</p>
  <p style="margin-top: 8px;">Platform: ${bundle.platform} • Industry: ${bundle.industry} • Quality Score: ${bundle.qualityScore}/100</p>
</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI GENERATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function generatePromptStructure(params: {
  topic: string; angle: string; platform: string; industry: string; bundleSize: number;
}): Promise<any | null> {
  const catCount = params.bundleSize <= 25 ? 5 : 10;
  const prompt = `You are a premium digital product designer. Create a prompt bundle structure for: "${params.topic}"

Target audience angle: ${params.angle}
AI platform focus: ${params.platform}
Industry: ${params.industry}
Bundle size: ${params.bundleSize} prompts across ${catCount} categories

Return ONLY valid JSON (no markdown fences):
{
  "packageTitle": "compelling product title e.g. 'The ${params.topic} Prompt Vault'",
  "tagline": "one-line benefit statement",
  "packageDescription": "2-3 sentence product description",
  "categories": [exactly ${catCount} objects: {"name": "category name", "icon": "single emoji", "description": "one sentence describing what prompts in this category do"}],
  "landingPageHook": "compelling 2-sentence opening hook for a sales page",
  "landingPageBenefits": ["specific benefit 1", "specific benefit 2", "specific benefit 3", "specific benefit 4", "specific benefit 5"],
  "landingPageWhoFor": ["who this is for 1", "who this is for 2", "who this is for 3", "who this is for 4"],
  "pricingRecommended": ${params.bundleSize <= 25 ? 17 : params.bundleSize <= 50 ? 27 : 47}
}`;

  try {
    const result = await callGeminiFallback([{ role: "user", content: prompt }], "You are a digital product designer. Return ONLY valid JSON, no markdown.", 4000, "prompt");
    if (!result?.text) return null;
    const jsonStr = result.text.match(/\{[\s\S]*\}/s)?.[0] ?? result.text;
    return JSON.parse(jsonStr);
  } catch (err) {
    logger.warn({ err }, "[PromptPkg] Structure parse failed");
    return null;
  }
}

async function expandPromptCategory(params: {
  topic: string; categoryName: string; categoryIcon: string; categoryDescription: string;
  angle: string; platform: string; promptCount: number;
}): Promise<PromptItem[]> {
  const prompt = `Write ${params.promptCount} professional, ready-to-use AI prompts for the "${params.categoryName}" category related to "${params.topic}".

Platform: ${params.platform}
Audience: ${params.angle}
Category purpose: ${params.categoryDescription}

Rules:
- Each prompt must be complete and usable as-is
- Include [VARIABLE] placeholders for customization
- Mix difficulty levels (beginner/intermediate/advanced)
- Make prompts specific to ${params.topic}, not generic

Return ONLY a JSON array (no markdown):
[{
  "title": "short descriptive title (4-8 words)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "useCase": "one sentence: when and why to use this prompt",
  "prompt": "the full ready-to-use prompt text (3-8 sentences with [VARIABLE] placeholders)",
  "tags": ["tag1", "tag2", "tag3"]
}]`;

  try {
    const result = await callGeminiFallback([{ role: "user", content: prompt }], "You are an expert AI prompt engineer. Return ONLY a valid JSON array.", 3000, "prompt");
    if (!result?.text) return [];
    const jsonStr = result.text.match(/\[[\s\S]*\]/s)?.[0] ?? "[]";
    const items = JSON.parse(jsonStr);
    const difficulties = ["beginner", "intermediate", "advanced"];
    return items.slice(0, params.promptCount).map((item: any, idx: number) => ({
      id: idx + 1,
      title: String(item.title ?? `Prompt ${idx + 1}`),
      category: params.categoryName,
      platforms: [params.platform],
      difficulty: difficulties.includes(item.difficulty) ? item.difficulty : "intermediate",
      prompt: String(item.prompt ?? ""),
      useCase: String(item.useCase ?? ""),
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [],
    }));
  } catch (err) {
    logger.warn({ err, cat: params.categoryName }, "[PromptPkg] Category expand failed");
    return [];
  }
}

async function generatePromptSalesPage(topic: string, bundle: PromptBundle): Promise<any | null> {
  const prompt = `Write a high-converting sales page for this AI prompt pack:
Title: "${bundle.packageTitle}"
Topic: ${topic}
Hook: ${bundle.landingPageHook}
Benefits: ${bundle.landingPageBenefits.join(", ")}

Return ONLY valid JSON:
{
  "headline": "bold main headline",
  "subheadline": "supporting subheadline",
  "hook": "2-3 sentence opening that hooks the reader",
  "bullets": ["what you get 1", "what you get 2", "what you get 3", "what you get 4", "what you get 5", "what you get 6"],
  "socialProof": "2 sentence social proof statement",
  "guarantee": "satisfaction guarantee statement",
  "closingCta": "strong call to action closing paragraph"
}`;
  try {
    const r = await callGeminiFallback([{ role: "user", content: prompt }], "You are an expert direct-response copywriter. Return ONLY valid JSON.", 2500, "prompt");
    if (!r?.text) return null;
    const jsonStr = r.text.match(/\{[\s\S]*\}/s)?.[0];
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch { return null; }
}

async function generatePromptEmailSequence(topic: string, bundle: PromptBundle): Promise<any | null> {
  const prompt = `Write a 5-email welcome sequence for buyers of: "${bundle.packageTitle}"
Topic: ${topic}
Tagline: ${bundle.tagline}

Return ONLY valid JSON:
{
  "emails": [
    {"day": 1, "type": "welcome", "subject": "string", "headline": "string", "body": "3-4 paragraph email body", "cta": "button text"},
    {"day": 2, "type": "value", "subject": "string", "headline": "string", "body": "3-4 paragraph email body", "cta": "button text"},
    {"day": 4, "type": "value", "subject": "string", "headline": "string", "body": "3-4 paragraph email body", "cta": "button text"},
    {"day": 7, "type": "proof", "subject": "string", "headline": "string", "body": "3-4 paragraph email body", "cta": "button text"},
    {"day": 14, "type": "promo", "subject": "string", "headline": "string", "body": "3-4 paragraph email body", "cta": "button text"}
  ]
}`;
  try {
    const r = await callGeminiFallback([{ role: "user", content: prompt }], "You are an expert email copywriter. Return ONLY valid JSON.", 3500, "prompt");
    if (!r?.text) return null;
    const jsonStr = r.text.match(/\{[\s\S]*\}/s)?.[0];
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch { return null; }
}

async function generatePromptSocialPosts(topic: string, bundle: PromptBundle): Promise<any | null> {
  const prompt = `Write social media posts to promote: "${bundle.packageTitle}"
Topic: ${topic}
Hook: ${bundle.landingPageHook}

Return ONLY valid JSON:
{
  "twitter": [
    {"tweet": "tweet 1 under 280 chars with hashtags"},
    {"tweet": "tweet 2"},
    {"tweet": "tweet 3"},
    {"tweet": "tweet 4"},
    {"tweet": "tweet 5"}
  ],
  "instagram": [
    {"caption": "longer instagram caption with line breaks and emojis", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]},
    {"caption": "instagram caption 2", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]},
    {"caption": "instagram caption 3", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}
  ],
  "linkedin": [
    {"post": "professional linkedin post 150-250 words"},
    {"post": "professional linkedin post 2"}
  ]
}`;
  try {
    const r = await callGeminiFallback([{ role: "user", content: prompt }], "You are a social media marketing expert. Return ONLY valid JSON.", 3000, "prompt");
    if (!r?.text) return null;
    const jsonStr = r.text.match(/\{[\s\S]*\}/s)?.[0];
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/prompt-packages/trending — personalized trending ideas
router.get("/prompt-packages/trending", requireAuth, async (req: any, res) => {
  try {
    const trending = getTrendingForUser(req.userId);
    res.json({ trending });
  } catch (error) {
    logger.error({ err: error }, "Error fetching trending prompt niches:");
    res.status(500).json({ error: "Failed to load trending ideas" });
  }
});

// GET /api/prompt-packages/meta — platform/angle/industry options
router.get("/prompt-packages/meta", requireAuth, async (_req, res) => {
  res.json({
    platforms: [
      { value: "chatgpt", label: "ChatGPT / GPT-4o", icon: "🤖", note: "Most versatile, largest user base" },
      { value: "claude", label: "Claude 3.5 Sonnet", icon: "⚡", note: "Best for long-form and analysis" },
      { value: "gemini", label: "Gemini 1.5 Pro", icon: "🌟", note: "Best for multimodal content" },
      { value: "midjourney", label: "Midjourney v6.1", icon: "🎨", note: "AI image generation" },
      { value: "universal", label: "Universal (All Platforms)", icon: "🌐", note: "Works everywhere" },
    ],
    angles: Object.entries(ANGLES).map(([value, desc]) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " "),
      description: `For ${desc}`,
    })),
    industries: [
      { value: "business", label: "Business & Entrepreneurship" },
      { value: "marketing", label: "Marketing & Advertising" },
      { value: "ecommerce", label: "E-Commerce & Retail" },
      { value: "social_media", label: "Social Media & Content" },
      { value: "coaching", label: "Coaching & Consulting" },
      { value: "education", label: "Education & E-Learning" },
      { value: "health", label: "Health & Wellness" },
      { value: "creative", label: "Creative & Design" },
      { value: "realestate", label: "Real Estate" },
      { value: "sales", label: "Sales & Business Development" },
      { value: "content", label: "Content Creation & Media" },
      { value: "food", label: "Food & Restaurant" },
    ],
    bundleSizes: [
      { value: 25, label: "Starter Pack", description: "25 prompts — 5 categories × 5 prompts", price: 17 },
      { value: 50, label: "Pro Bundle", description: "50 prompts — 10 categories × 5 prompts", price: 27 },
      { value: 100, label: "Elite Vault", description: "100 prompts — 10 categories × 10 prompts", price: 47 },
    ],
  });
});

// POST /api/prompt-packages/generate — generate a prompt bundle
router.post("/prompt-packages/generate", requireAuth, async (req: any, res) => {
  try {
    const {
      topic, angle = "professional", platform = "ChatGPT", industry = "Business",
      bundleSize = 50, authorName = "Prompt Studio",
      selectedAssets = ["prompts"],
    } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      res.status(400).json({ error: "Topic is required (min 3 characters)" }); return;
    }

    const params = {
      topic: topic.trim(), angle, platform, industry,
      bundleSize: Math.max(10, Math.min(200, parseInt(bundleSize) || 50)),
    };

    // ── Phase 1: Generate bundle structure ──────────────────────────────────
    const structure = await generatePromptStructure(params);
    if (!structure) {
      res.status(503).json({ error: "AI generation failed. Please ensure your Gemini API key is configured in Admin > Settings." });
      return;
    }

    // ── Phase 2: Expand each category in parallel ───────────────────────────
    const catCount = (structure.categories ?? []).length;
    const promptsPerCat = Math.max(3, Math.round(params.bundleSize / (catCount || 5)));

    const expandedCategories = await Promise.all(
      (structure.categories ?? []).map(async (cat: any) => {
        const prompts = await expandPromptCategory({
          topic: params.topic, categoryName: cat.name, categoryIcon: cat.icon ?? "✨",
          categoryDescription: cat.description ?? "", angle: params.angle,
          platform: params.platform, promptCount: promptsPerCat,
        });
        return { name: cat.name, icon: cat.icon ?? "✨", description: cat.description ?? "", prompts };
      })
    );

    const totalPrompts = expandedCategories.reduce((s, c) => s + c.prompts.length, 0);
    const qualityScore = Math.min(95, 60 + Math.floor(totalPrompts / 4) + (params.topic.split(" ").length >= 2 ? 8 : 0));
    const sellabilityScore = Math.min(95, 55 + Math.floor(totalPrompts / 3));

    const bundle: PromptBundle = {
      packageTitle: structure.packageTitle ?? `${params.topic} Prompt Pack`,
      tagline: structure.tagline ?? "",
      packageDescription: structure.packageDescription ?? "",
      topic: params.topic,
      angle: params.angle,
      platform: params.platform,
      industry: params.industry,
      bundleSize: params.bundleSize,
      totalPrompts,
      qualityScore,
      sellabilityScore,
      categories: expandedCategories,
      samplePrompts: expandedCategories[0]?.prompts?.slice(0, 3) ?? [],
      pricingRecommended: structure.pricingRecommended ?? (params.bundleSize <= 25 ? 17 : params.bundleSize <= 50 ? 27 : 47),
      landingPageHook: structure.landingPageHook ?? "",
      landingPageBenefits: structure.landingPageBenefits ?? [],
      landingPageWhoFor: structure.landingPageWhoFor ?? [],
      generatedAt: new Date().toISOString(),
    };

    // ── Phase 3: Generate optional assets in parallel ───────────────────────
    const assetList: string[] = Array.isArray(selectedAssets) ? selectedAssets : ["prompts"];
    const assetTasks: Record<string, Promise<any>> = {};
    if (assetList.includes("salesPage")) assetTasks.salesPage = generatePromptSalesPage(params.topic, bundle);
    if (assetList.includes("emailSequence")) assetTasks.emailSequence = generatePromptEmailSequence(params.topic, bundle);
    if (assetList.includes("socialPosts")) assetTasks.socialPosts = generatePromptSocialPosts(params.topic, bundle);

    const assetResults: Record<string, any> = {};
    if (Object.keys(assetTasks).length > 0) {
      const settled = await Promise.allSettled(
        Object.entries(assetTasks).map(async ([k, p]) => ({ k, v: await p }))
      );
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value.v) assetResults[r.value.k] = r.value.v;
      }
    }

    const studioBundle = {
      _studio: true,
      _v: 2,
      params: { topic: params.topic, angle: params.angle, platform: params.platform, industry: params.industry, bundleSize: params.bundleSize, authorName, selectedAssets: assetList },
      bundle,
      salesPage: assetResults.salesPage ?? null,
      emailSequence: assetResults.emailSequence ?? null,
      socialPosts: assetResults.socialPosts ?? null,
    };

    // Save to DB
    const [saved] = await db.insert(productsTable).values({
      userId: req.userId,
      title: bundle.packageTitle,
      topic: bundle.topic,
      authorName: authorName || "Prompt Studio",
      description: JSON.stringify(studioBundle),
      price: bundle.pricingRecommended.toFixed(2),
      productType: "prompt_package",
      publishStatus: "draft",
      coverImageUrl: null,
      isPublished: false,
    } as any).returning();

    // Generate AI cover image async (non-blocking)
    generateProductCoverImage({ title: bundle.packageTitle, topic: bundle.topic, type: "prompt_package" })
      .then(async (coverImageUrl) => {
        try { await db.update(productsTable).set({ coverImageUrl } as any).where(eq(productsTable.id, saved.id)); } catch {}
      }).catch(() => {});

    res.json({ id: saved.id, ...studioBundle });
  } catch (error) {
    logger.error({ err: error }, "Error generating prompt bundle:");
    res.status(500).json({ error: "Failed to generate prompt bundle" });
  }
});

// GET /api/prompt-packages — list user's prompt packages
router.get("/prompt-packages", requireAuth, async (req: any, res) => {
  try {
    const packages = await db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.userId, req.userId),
          eq(productsTable.productType as any, "prompt_package")
        )
      )
      .orderBy(desc(productsTable.createdAt));

    const parsed = packages.map((p) => {
      try {
        const bundle = JSON.parse(p.description ?? "{}") as PromptBundle;
        return {
          id: p.id,
          title: p.title,
          publishStatus: p.publishStatus,
          price: p.price,
          createdAt: p.createdAt,
          totalPrompts: bundle.totalPrompts ?? 0,
          qualityScore: bundle.qualityScore ?? 0,
          sellabilityScore: bundle.sellabilityScore ?? 0,
          platform: bundle.platform ?? "unknown",
          industry: bundle.industry ?? "unknown",
        };
      } catch {
        return {
          id: p.id,
          title: p.title,
          publishStatus: p.publishStatus,
          price: p.price,
          createdAt: p.createdAt,
          totalPrompts: 0,
          qualityScore: 0,
          sellabilityScore: 0,
        };
      }
    });

    res.json(parsed);
  } catch (error) {
    logger.error({ err: error }, "Error listing prompt packages:");
    res.status(500).json({ error: "Failed to load prompt packages" });
  }
});

// GET /api/prompt-packages/:id — get a single prompt package
router.get("/prompt-packages/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.userId)))
      .limit(1);

    if (!product) { res.status(404).json({ error: "Not found" }); return; }

    const parsed = JSON.parse(product.description ?? "{}");
    if (parsed._studio) {
      res.json({ id: product.id, publishStatus: product.publishStatus, price: product.price, ...parsed });
    } else {
      res.json({ id: product.id, publishStatus: product.publishStatus, price: product.price, bundle: parsed });
    }
  } catch (error) {
    logger.error({ err: error }, "Error fetching prompt package:");
    res.status(500).json({ error: "Failed to load prompt package" });
  }
});

// POST /api/prompt-packages/:id/publish — publish with quality gate
router.post("/prompt-packages/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { target } = req.body; // "marketplace" | "store"

    const [product] = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.userId)))
      .limit(1);

    if (!product) { res.status(404).json({ error: "Not found" }); return; }

    let bundle: PromptBundle;
    try {
      bundle = JSON.parse(product.description ?? "{}") as PromptBundle;
    } catch {
      res.status(400).json({ error: "Invalid bundle data" }); return;
    }

    const qualityScore = bundle.qualityScore ?? 0;

    // QUALITY GATE
    if (target === "marketplace") {
      if (qualityScore < 75) {
        res.status(400).json({
          error: "Quality gate failed",
          message: `Your prompt pack scored ${qualityScore}/100. Marketplace requires a minimum score of 75. Improve your prompts by adding more specific niche detail and expanding your bundle size.`,
          qualityScore,
          threshold: 75,
          tips: [
            "Use a more specific topic (e.g., 'Real Estate Lead Generation' not just 'Real Estate')",
            "Choose a larger bundle size (50+ prompts score higher)",
            "Select the most relevant industry for your niche",
          ],
        }); return;
      }
    } else if (target === "store") {
      if (qualityScore < 60) {
        res.status(400).json({
          error: "Quality gate failed",
          message: `Your prompt pack scored ${qualityScore}/100. Store requires a minimum score of 60. Please refine your bundle.`,
          qualityScore,
          threshold: 60,
        }); return;
      }
    }

    const newStatus = "published";

    await db
      .update(productsTable)
      .set({ publishStatus: newStatus, isPublished: true } as any)
      .where(eq(productsTable.id, id));

    res.json({
      success: true,
      publishStatus: newStatus,
      message: target === "marketplace"
        ? "Your prompt pack is now live on the marketplace!"
        : "Your prompt pack is now live in your store!",
      shareUrl: `/product/${id}`,
    });
  } catch (error) {
    logger.error({ err: error }, "Error publishing prompt package");
    res.status(500).json({ error: "Failed to publish" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — prompt package marketplace moderation
// ─────────────────────────────────────────────────────────────────────────────

// GET /admin/prompt-packages
router.get("/admin/prompt-packages", requireAdmin, async (req: any, res) => {
  try {
    const status = (req.query.status as string) || "pending_approval";

    const whereCondition = status === "all"
      ? ne(productsTable.productType as any, "non_prompt")
      : eq(productsTable.publishStatus as any, status);

    const rows = await db
      .select({
        id: productsTable.id,
        title: productsTable.title,
        topic: productsTable.topic,
        publishStatus: productsTable.publishStatus,
        price: productsTable.price,
        createdAt: productsTable.createdAt,
        description: productsTable.description,
        marketingAssets: productsTable.marketingAssets,
        userId: productsTable.userId,
      })
      .from(productsTable)
      .where(
        status === "all"
          ? inArray(productsTable.publishStatus as any, ["pending_approval", "live", "rejected", "draft"])
          : eq(productsTable.publishStatus as any, status)
      )
      .orderBy(desc(productsTable.createdAt))
      .limit(200);

    const userIds = [...new Set(rows.map(r => r.userId))];
    const users = userIds.length
      ? await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, userIds))
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const packages = rows.map(row => {
      let bundle: any = {};
      try { bundle = JSON.parse(row.description ?? "{}"); } catch {}
      let marketing: any = {};
      try { marketing = JSON.parse(String(row.marketingAssets ?? "{}")); } catch {}

      const user = userMap.get(row.userId);
      return {
        id: row.id,
        title: row.title,
        topic: row.topic ?? "",
        authorName: user?.name ?? "Unknown",
        authorEmail: user?.email ?? "",
        publishStatus: row.publishStatus ?? "draft",
        price: row.price,
        createdAt: row.createdAt,
        qualityScore: bundle.qualityScore ?? 0,
        sellabilityScore: bundle.sellabilityScore ?? 0,
        totalPrompts: bundle.totalPrompts ?? 0,
        platform: bundle.platform ?? "",
        industry: bundle.industry ?? "",
        tagline: bundle.tagline ?? "",
        rejectionReason: marketing.rejectionReason ?? null,
      };
    });

    // Compute stats across ALL statuses for the dashboard
    const allRows = await db
      .select({ publishStatus: productsTable.publishStatus, description: productsTable.description })
      .from(productsTable)
      .where(inArray(productsTable.publishStatus as any, ["pending_approval", "live", "rejected"]));

    let totalQuality = 0, totalSellability = 0, count = 0;
    const statusCounts = { pending: 0, live: 0, rejected: 0 };
    for (const r of allRows) {
      if (r.publishStatus === "pending_approval") statusCounts.pending++;
      if (r.publishStatus === "live") statusCounts.live++;
      if (r.publishStatus === "rejected") statusCounts.rejected++;
      try {
        const b = JSON.parse(r.description ?? "{}");
        if (b.qualityScore) { totalQuality += b.qualityScore; totalSellability += b.sellabilityScore ?? 0; count++; }
      } catch {}
    }

    const stats = {
      total: allRows.length,
      pending: statusCounts.pending,
      live: statusCounts.live,
      rejected: statusCounts.rejected,
      avgQuality: count ? Math.round(totalQuality / count) : 0,
      avgSellability: count ? Math.round(totalSellability / count) : 0,
    };

    res.json({ packages, stats });
  } catch (error) {
    logger.error({ err: error }, "Error loading admin prompt packages");
    res.status(500).json({ error: "Failed to load prompt packages" });
  }
});

// POST /admin/prompt-packages/:id/approve
router.post("/admin/prompt-packages/:id/approve", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .update(productsTable)
      .set({ publishStatus: "live", isPublished: true } as any)
      .where(eq(productsTable.id, id));
    res.json({ success: true, publishStatus: "live" });
  } catch (error) {
    logger.error({ err: error }, "Error approving prompt package");
    res.status(500).json({ error: "Failed to approve" });
  }
});

// POST /admin/prompt-packages/:id/reject
router.post("/admin/prompt-packages/:id/reject", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body as { reason?: string };

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) { res.status(404).json({ error: "Not found" }); return; }

    let marketing: any = {};
    try { marketing = JSON.parse(String(product.marketingAssets ?? "{}")); } catch {}
    marketing.rejectionReason = reason ?? "Did not meet marketplace quality standards.";

    await db
      .update(productsTable)
      .set({ publishStatus: "rejected", isPublished: false, marketingAssets: JSON.stringify(marketing) } as any)
      .where(eq(productsTable.id, id));

    res.json({ success: true, publishStatus: "rejected" });
  } catch (error) {
    logger.error({ err: error }, "Error rejecting prompt package");
    res.status(500).json({ error: "Failed to reject" });
  }
});

// GET /api/prompt-packages/:id/download — download as HTML/PDF
router.get("/prompt-packages/:id/download", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.userId)))
      .limit(1);

    if (!product) { res.status(404).json({ error: "Not found" }); return; }

    const bundle = JSON.parse(product.description ?? "{}") as PromptBundle;
    const html = generatePDFHTML(bundle);
    const filename = bundle.packageTitle.replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, "-").slice(0, 60);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.html"`);
    res.send(html);
  } catch (error) {
    logger.error({ err: error }, "Error downloading prompt package");
    res.status(500).json({ error: "Failed to generate download" });
  }
});

// DELETE /api/prompt-packages/:id
router.delete("/prompt-packages/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .delete(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.userId)));
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error deleting prompt package");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export { router as promptPackagesRouter };
