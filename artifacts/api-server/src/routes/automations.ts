import { Router } from "express";
import { db } from "@workspace/db";
import {
  automationBlocksTable,
  automationToolsTable,
  automationRunsTable,
  automationInstallsTable,
  walletTransactionsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "./auth";
import { requireFeature } from "./features";
import { callAIWithMeta } from "./ai-utils";

const router = Router();

// ─── Block Library — 50 High-Value Profit Machines ──────────────────────────
const BUILTIN_BLOCKS = [
  // ══════════════════════════════════════════════════════════════
  // 💰 PROFIT MACHINES — Complete money-making systems in one block
  // ══════════════════════════════════════════════════════════════
  {
    id: 1, name: "Full Sales Funnel Builder", description: "Build a complete money-making funnel: landing page + email sequence + ad copy + objection handlers",
    category: "Profit Machines", icon: "DollarSign", color: "emerald",
    inputs: [
      { name: "product", type: "text", label: "Product / Offer Name", placeholder: "e.g. 6-Week Fitness Transformation Course", required: true },
      { name: "price", type: "text", label: "Price Point", placeholder: "e.g. $297", required: true },
      { name: "audience", type: "text", label: "Target Audience", placeholder: "e.g. busy moms wanting to lose 20lbs", required: true },
      { name: "main_benefit", type: "text", label: "Main Transformation / Result", placeholder: "e.g. lose 20lbs in 6 weeks without gym", required: true },
    ],
    outputLabel: "Complete Sales Funnel", outputFormat: "markdown",
    aiPrompt: `You are a world-class direct-response copywriter. Build a COMPLETE sales funnel for: {product} at {price} targeting {audience} who want {main_benefit}.

OUTPUT ALL OF THE FOLLOWING:

## 1. LANDING PAGE COPY
- Headline (make it specific and benefit-driven, include the result)
- Subheadline (expand on the promise)
- 3 bullet points (each starting with a power word)
- Story section (50 words — relatable problem + turning point)
- What they get (5 bullet points with bold feature + italic benefit each)
- Social proof block (write 2 realistic testimonials with full names and results)
- Guarantee statement (bold and reassuring)
- CTA button text + urgency line below it

## 2. EMAIL SEQUENCE (5 emails — subject line + full body each)
- Email 1: Welcome + Quick Win (deliver immediate value, set expectations)
- Email 2: Story email (connect pain → transformation, soft pitch)
- Email 3: Objection crusher (tackle top 3 objections head-on)
- Email 4: Case study / social proof (paint the after-picture)
- Email 5: Last chance (urgency + scarcity + final CTA)

## 3. AD COPY (3 platform variations)
- Facebook/Instagram ad (hook + body + CTA, 125 chars body)
- TikTok/Reels hook script (first 3 seconds + 15-second script)
- Google responsive ad (3 headlines + 2 descriptions)

## 4. TOP 5 OBJECTIONS + KILLER RESPONSES
For each objection: the exact phrase a prospect says + a 2-3 sentence response that turns doubt into desire.`,
    sortOrder: 1,
  },
  {
    id: 2, name: "Digital Product Empire Creator", description: "Generate a complete sellable digital product: outline + chapter content + sales page + pricing strategy",
    category: "Profit Machines", icon: "Package", color: "violet",
    inputs: [
      { name: "topic", type: "text", label: "Product Topic / Niche", placeholder: "e.g. freelance copywriting for beginners", required: true },
      { name: "format", type: "select", label: "Product Format", required: true, options: ["eBook (PDF)", "Online Course", "Template Pack", "Swipe File", "Mini-Course", "Masterclass"] },
      { name: "audience", type: "text", label: "Target Buyer", placeholder: "e.g. new freelancers earning under $2k/month", required: true },
      { name: "price_range", type: "select", label: "Target Price Range", required: false, options: ["$7-$27 (impulse buy)", "$27-$97 (mid-ticket)", "$97-$297 (premium)", "$297-$997 (high-ticket)"] },
    ],
    outputLabel: "Complete Digital Product", outputFormat: "markdown",
    aiPrompt: `Create a COMPLETE, ready-to-sell {format} about {topic} for {audience} in the {price_range} price range.

## PRODUCT POSITIONING
- Killer product title (include a number or specific result)
- Subtitle (what they'll achieve and how fast)
- Unique mechanism (what makes this different from everything else out there)
- Positioning statement (who it's for, what it does, why now)

## COMPLETE TABLE OF CONTENTS
Write a full, detailed table of contents with chapter titles and 3-4 sub-topics per chapter. Aim for 7-10 chapters/modules.

## CHAPTER 1 — FULL CONTENT (write the complete first chapter/module)
Write 600-800 words of actual, high-value content for chapter 1. Include a hook, core teaching, examples, and a chapter exercise or action step.

## SALES PAGE COPY
- Headline + subheadline
- The problem section (agitate the pain — 100 words)
- The solution intro (introduce the product as the bridge — 75 words)
- What's inside (every chapter/module with a one-line benefit)
- Pricing breakdown (justify the value, then reveal the price)
- Guarantee (30-day money back, make it feel risk-free)
- FAQ (5 questions that kill the last objections)
- P.S. line (re-state the transformation + urgency)

## LAUNCH STRATEGY
- Recommended launch price + future price
- 3 traffic sources best suited for this product
- Ideal platform to sell it on (Gumroad, Stan Store, Teachable, etc.)
- Suggested upsell offer`,
    sortOrder: 2,
  },
  {
    id: 3, name: "High-Ticket Offer Designer", description: "Package your expertise into a $2k-$10k premium offer with full positioning, pricing, and sales script",
    category: "Profit Machines", icon: "Crown", color: "amber",
    inputs: [
      { name: "expertise", type: "text", label: "Your Expertise / Skill", placeholder: "e.g. helping coaches build their first online course", required: true },
      { name: "outcome", type: "text", label: "Main Client Outcome", placeholder: "e.g. $10k revenue in 90 days", required: true },
      { name: "delivery", type: "select", label: "Delivery Format", required: false, options: ["1:1 Coaching (calls)", "Done-For-You Service", "Group Mastermind", "Intensive (VIP day)", "Retainer / Monthly"] },
    ],
    outputLabel: "High-Ticket Offer Package", outputFormat: "markdown",
    aiPrompt: `Design a premium high-ticket offer around: {expertise} that delivers {outcome} via {delivery}.

## OFFER POSITIONING
- Premium offer name (make it sound exclusive and results-focused)
- Tagline (outcome + timeframe + mechanism)
- Who it's PERFECT for (3 bullet points)
- Who it's NOT for (2 bullet points — builds exclusivity and pre-qualifies)
- The unique mechanism (your proprietary method/framework — give it a name)

## OFFER STACK (everything included, with perceived value)
List every component with:
- Component name
- What it is (1 sentence)
- Standalone value ($XXX)
Do this for 6-8 components. Then total the value and show the actual price.

## PRICING TIERS (3 options)
- Starter tier: what's included + price
- Core tier: what's included + price (position this as best value)
- VIP tier: what's included + price (all-in, white-glove)

## DISCOVERY CALL SCRIPT (word-for-word)
- Opening question to build rapport
- 5 qualifying questions (dig into pain + desire + urgency)
- The pitch (transition into presenting the offer)
- Handling "I need to think about it" objection
- Handling "I can't afford it" objection
- The close (how to ask for the payment without awkwardness)

## APPLICATION / WAITLIST PAGE COPY
Headline, 3-paragraph description, who should apply, the 5-question application form, and CTA button text.`,
    sortOrder: 3,
  },
  {
    id: 4, name: "Affiliate Marketing Machine", description: "Build a complete affiliate income system: niche selection + content plan + email sequence + link placement strategy",
    category: "Profit Machines", icon: "Link", color: "blue",
    inputs: [
      { name: "niche", type: "text", label: "Your Niche or Audience", placeholder: "e.g. beginner investors, fitness enthusiasts", required: true },
      { name: "platform", type: "select", label: "Main Traffic Platform", required: true, options: ["YouTube", "Blog / SEO", "Instagram", "TikTok", "Email List", "Pinterest"] },
      { name: "monthly_goal", type: "select", label: "Monthly Income Goal", required: false, options: ["$500/month", "$1,000/month", "$5,000/month", "$10,000/month"] },
    ],
    outputLabel: "Affiliate Marketing Blueprint", outputFormat: "markdown",
    aiPrompt: `Build a COMPLETE affiliate marketing income system for the {niche} niche on {platform} targeting {monthly_goal}.

## TOP 10 AFFILIATE PRODUCTS TO PROMOTE
For each product:
- Product name + affiliate network (Amazon, ShareASale, ClickBank, Impact, etc.)
- Estimated commission per sale
- Why this audience will buy it
- Content angle to promote it naturally

## 30-DAY CONTENT PLAN
Week by week breakdown:
- Week 1: Trust-building content (no pitching)
- Week 2: Educational content that pre-sells your affiliate products
- Week 3: Review / comparison content
- Week 4: Direct promotion + email blast
Specific post/video title for each day.

## 5-EMAIL NURTURE SEQUENCE (subject line + full body)
Designed to warm up subscribers and get them clicking affiliate links organically.

## SEO / CONTENT STRATEGY
- 5 high-intent keywords to target with reviews
- Ideal article format for ranking (comparison, best-of, vs, review)
- Link placement guide (where to put links for highest CTR)

## SCALE-UP ROADMAP
How to go from $0 to {monthly_goal} step by step, with milestones and timeline.`,
    sortOrder: 4,
  },
  {
    id: 5, name: "7-Figure Course Launch System", description: "Complete course launch: pre-launch sequence + webinar script + cart open emails + urgency sequence",
    category: "Profit Machines", icon: "Rocket", color: "rose",
    inputs: [
      { name: "course", type: "text", label: "Course Name & Topic", placeholder: "e.g. The YouTube Growth Accelerator", required: true },
      { name: "price", type: "text", label: "Course Price", placeholder: "e.g. $497", required: true },
      { name: "audience", type: "text", label: "Target Student", placeholder: "e.g. content creators with under 1k subscribers", required: true },
      { name: "launch_duration", type: "select", label: "Cart Open Duration", required: false, options: ["48 hours", "5 days", "7 days", "10 days"] },
    ],
    outputLabel: "Course Launch Campaign", outputFormat: "markdown",
    aiPrompt: `Design a COMPLETE course launch campaign for {course} at {price} targeting {audience} with a {launch_duration} cart.

## PRE-LAUNCH SEQUENCE (7 days before cart opens)
- Day -7: Teaser email (hint at what's coming, create curiosity)
- Day -5: Free value email (give your best tip related to the course topic)
- Day -3: Waitlist email (early bird pricing + bonuses for waitlist only)
- Day -1: "Tomorrow we open" email (build excitement + countdown)

## WEBINAR / LIVE TRAINING SCRIPT (60-minute outline)
- Title + hook for sign-up page
- Opening story (your transformation — 5 minutes)
- The 3 core teaching points (20 minutes — teach, don't tease)
- The pivot (transition to the offer — 5 minutes)
- Offer presentation (stack the value — 15 minutes)
- Q&A objection handling (10 minutes)
- Urgency close (5 minutes)

## CART OPEN EMAIL SEQUENCE (full {launch_duration} sequence)
Write a complete email for every day with subject line + full body, building urgency and addressing different objections each day.

## CART CLOSE SEQUENCE (last 48 hours)
- 48h warning email
- 24h "last day" email  
- 4h final warning email
- 1h "closing in 1 hour" email (short, punchy, urgent)

## BONUS STACK STRATEGY
5 bonus ideas that massively increase perceived value without requiring much of your time.`,
    sortOrder: 5,
  },
  {
    id: 6, name: "SaaS / App Monetization Blueprint", description: "Turn any software idea into a revenue machine with pricing, onboarding, and viral growth tactics",
    category: "Profit Machines", icon: "Code", color: "cyan",
    inputs: [
      { name: "product", type: "text", label: "SaaS / App Idea or Name", placeholder: "e.g. AI social media scheduler for Realtors", required: true },
      { name: "target_market", type: "text", label: "Target Market", placeholder: "e.g. real estate agents, freelancers", required: true },
    ],
    outputLabel: "SaaS Monetization Blueprint", outputFormat: "markdown",
    aiPrompt: `Create a complete monetization blueprint for: {product} targeting {target_market}.

## MARKET VALIDATION
- Market size estimate + TAM/SAM/SOM breakdown
- Top 5 existing competitors + what each is missing
- Your unique differentiation (position this as 10x better in ONE specific way)
- Ideal first 100 customers and exactly where to find them

## PRICING ARCHITECTURE
Design 3 pricing tiers with:
- Tier name (use emotional/aspirational names)
- Exact features included
- Monthly price + annual price (with % savings)
- Who it's designed for
- Expected conversion rate per tier
Include psychological pricing tactics used.

## VIRAL GROWTH LOOPS
3 built-in viral mechanics (e.g. referral program, shareable outputs, team features).

## 90-DAY LAUNCH ROADMAP
Week by week: pre-launch, beta, public launch, growth sprint.

## RETENTION & UPSELL STRATEGY
- Onboarding sequence (days 1, 3, 7, 14, 30)
- Feature triggers for upgrade prompts
- Churn recovery email sequence (3 emails)`,
    sortOrder: 6,
  },

  // ══════════════════════════════════════════════════════════════
  // 📈 TRAFFIC & GROWTH MACHINES
  // ══════════════════════════════════════════════════════════════
  {
    id: 7, name: "SEO Content Empire Builder", description: "Build a topical authority site with pillar page + 8 cluster posts + meta data + internal linking map",
    category: "Traffic & Growth", icon: "TrendingUp", color: "green",
    inputs: [
      { name: "main_topic", type: "text", label: "Main Topic / Niche", placeholder: "e.g. passive income online, keto diet", required: true },
      { name: "audience", type: "text", label: "Target Reader", placeholder: "e.g. beginner investors, busy parents", required: false },
    ],
    outputLabel: "SEO Content Empire", outputFormat: "markdown",
    aiPrompt: `Build a complete SEO topical authority strategy for: {main_topic} targeting {audience}.

## PILLAR PAGE
- Title (include primary keyword naturally)
- Meta description (155 chars, includes CTA)
- Full H1, H2, H3 structure (outline only, 15+ sections)
- Introduction paragraph (hook + what they'll learn)
- 3 featured snippet-optimized FAQ answers

## 8 CLUSTER ARTICLES (supporting posts)
For each article:
- Title (long-tail keyword focused)
- Target keyword + monthly search volume estimate
- Search intent (informational/commercial/transactional)
- 5-point content outline
- Internal link anchor text back to pillar page

## INTERNAL LINKING MAP
Show how all 9 pieces link to each other for maximum SEO juice flow.

## KEYWORD GOLDMINE
30 additional long-tail keywords in this niche, sorted by:
- Low competition (< 1k monthly searches) — 10 keywords
- Medium competition (1k-10k) — 10 keywords
- High-value money keywords (commercial/transactional) — 10 keywords

## CONTENT CALENDAR
Publish schedule to build topical authority in 90 days.`,
    sortOrder: 7,
  },
  {
    id: 8, name: "YouTube Channel Launch System", description: "Launch a monetizable YouTube channel with full strategy, 30 video ideas, and viral title formulas",
    category: "Traffic & Growth", icon: "Video", color: "red",
    inputs: [
      { name: "niche", type: "text", label: "Channel Niche / Topic", placeholder: "e.g. personal finance, AI tools, fitness over 40", required: true },
      { name: "monetization", type: "select", label: "Primary Monetization Goal", required: false, options: ["AdSense revenue", "Affiliate commissions", "Sell own products", "Brand sponsorships", "All of the above"] },
    ],
    outputLabel: "YouTube Channel Blueprint", outputFormat: "markdown",
    aiPrompt: `Create a complete YouTube channel launch strategy for a {niche} channel monetized through {monetization}.

## CHANNEL POSITIONING
- Channel name ideas (5 options — catchy, searchable, memorable)
- Channel description (optimized, 500 chars)
- Niche within niche (go narrow to grow faster)
- Content pillars (3-4 recurring series ideas)

## 30 VIDEO IDEAS (with viral potential score)
For each video:
- Title (A/B test variation included)
- Why it will rank or go viral
- Estimated monetization potential ($low/$mid/$high)
- Thumbnail concept (describe exactly what it should look like)

## FIRST 5 VIDEOS — FULL SCRIPTS
Write complete word-for-word scripts for the first 5 videos. Each script: hook (first 30 seconds), main content, CTA, and end screen pitch.

## SEO & DISCOVERY STRATEGY
- 20 high-volume tags per video category
- Thumbnail formula that beats competitors
- Best upload times and frequency

## 90-DAY GROWTH ROADMAP
Subscriber milestones: 100, 500, 1000 (monetization threshold) and exact tactics for each phase.`,
    sortOrder: 8,
  },
  {
    id: 9, name: "LinkedIn Authority & Lead Gen Machine", description: "Build B2B authority on LinkedIn with profile optimization, 30-day content plan, and automated DM sequences",
    category: "Traffic & Growth", icon: "Briefcase", color: "blue",
    inputs: [
      { name: "expertise", type: "text", label: "Your Expertise / Service", placeholder: "e.g. B2B SaaS marketing consultant", required: true },
      { name: "target_client", type: "text", label: "Ideal Client", placeholder: "e.g. SaaS founders with $1M+ ARR", required: true },
    ],
    outputLabel: "LinkedIn Growth System", outputFormat: "markdown",
    aiPrompt: `Build a complete LinkedIn authority and lead generation machine for: {expertise} targeting {target_client}.

## PROFILE OPTIMIZATION (complete rewrite)
- Headline formula (keyword + ICP + specific result)
- Full "About" section (700 chars — hook, credibility, ICP call-out, CTA)
- Featured section strategy (what to pin + copy)
- Experience section (rewrite current role to focus on client results)
- Skills (top 10 most searchable)

## 30-DAY CONTENT PLAN (post every weekday)
For each of the 30 posts:
- Full post text (ready to copy-paste, under 1,300 chars)
- Post type (story, list, insight, controversy, case study)
- Expected engagement type (comments, reposts, profile views)

## CONNECTION & OUTREACH STRATEGY
- Ideal connection request note template (personalized, non-spammy)
- 5-step DM sequence to book discovery calls (full word-for-word scripts)
- How to use LinkedIn's search to find 50 ideal clients per week

## CONTENT VIRALITY FORMULA
The 4 post formats that consistently hit 10k+ impressions on LinkedIn.`,
    sortOrder: 9,
  },
  {
    id: 10, name: "Cold Outreach Revenue Engine", description: "Build a cold email + LinkedIn DM system that books 10+ calls per week",
    category: "Traffic & Growth", icon: "Mail", color: "orange",
    inputs: [
      { name: "service", type: "text", label: "Your Service / Offer", placeholder: "e.g. Facebook ads management for ecommerce brands", required: true },
      { name: "prospect", type: "text", label: "Ideal Prospect", placeholder: "e.g. Shopify stores doing $50k-$500k/month", required: true },
      { name: "result", type: "text", label: "Result You Deliver", placeholder: "e.g. 3x ROAS in 60 days", required: true },
    ],
    outputLabel: "Cold Outreach System", outputFormat: "markdown",
    aiPrompt: `Build a complete cold outreach system for {service} targeting {prospect} with the promise of {result}.

## ICP RESEARCH GUIDE
- Exactly where to find your prospects (LinkedIn filters, Apollo.io, etc.)
- 5 qualifying criteria before reaching out
- Red flags to skip (save time)

## COLD EMAIL SEQUENCE (5 emails)
Write complete emails for: Day 1, Day 3, Day 5, Day 8, Day 11.
Each email: subject line (A + B test), full body under 150 words, P.S. line.
Use pattern interrupt, relevance, and social proof.

## LINKEDIN DM SEQUENCE (5 touchpoints)
Connection request note → first DM → value DM → case study DM → breakup message.
All word-for-word, under 300 chars each.

## PERSONALIZATION AT SCALE
- 3 research triggers to mention (recent funding, job post, content they shared)
- Template variables for mass personalization
- Time-saving tool stack to send 50 personalized outreaches per day

## OBJECTION HANDLING
Top 7 objections + exact email/DM responses that re-open conversations.

## METRICS & OPTIMIZATION
Target benchmarks (open rate, reply rate, book rate) and what to A/B test first.`,
    sortOrder: 10,
  },
  {
    id: 11, name: "Viral Content Formula Engine", description: "Generate 5 platform-specific viral content pieces from one idea, with hooks and engagement triggers",
    category: "Traffic & Growth", icon: "Zap", color: "yellow",
    inputs: [
      { name: "topic", type: "text", label: "Core Topic or Story", placeholder: "e.g. how I went from $0 to $10k/month with AI", required: true },
      { name: "niche", type: "text", label: "Your Niche", placeholder: "e.g. online business, fitness, finance", required: true },
    ],
    outputLabel: "Viral Content Suite", outputFormat: "markdown",
    aiPrompt: `Turn this topic into 5 platform-native viral pieces: {topic} in the {niche} niche.

For EACH platform, write fully complete, ready-to-post content:

## 1. TWITTER/X VIRAL THREAD (12 tweets)
Tweet 1 = jaw-drop hook. Each tweet flows naturally. Tweet 12 = strong CTA + engagement question. Under 280 chars each.

## 2. INSTAGRAM CAROUSEL (10 slides)
Slide 1: hook image + bold text. Slides 2-9: one insight per slide (short, punchy, swipe-worthy). Slide 10: CTA.

## 3. TIKTOK/REELS SCRIPT (60 seconds)
First 3 seconds hook, story arc with tension, resolution, CTA. Scene-by-scene directions included.

## 4. LINKEDIN POST (thought leadership)
1,000-1,300 char post. Start with a counter-intuitive statement. Use white space. End with a question.

## 5. EMAIL NEWSLETTER EDITION
Subject line + preview text + full 400-word email with a story hook, core insight, and 1 CTA.

## ENGAGEMENT AMPLIFICATION STRATEGY
How to seed each piece of content for maximum initial engagement (comments to make, communities to share in, optimal post times).`,
    sortOrder: 11,
  },

  // ══════════════════════════════════════════════════════════════
  // ✍️ WRITING EMPIRE — Long-form content that builds authority
  // ══════════════════════════════════════════════════════════════
  {
    id: 12, name: "Deep-Dive Blog Article (2500 words)", description: "Write a complete 2500-word SEO authority article with full H2/H3 structure, data, and internal CTAs",
    category: "Writing Empire", icon: "FileText", color: "indigo",
    inputs: [
      { name: "topic", type: "text", label: "Article Topic + Target Keyword", placeholder: "e.g. how to make money with AI tools in 2025", required: true },
      { name: "audience", type: "text", label: "Target Reader", placeholder: "e.g. solopreneurs, beginners, marketers", required: false },
    ],
    outputLabel: "Full Blog Article", outputFormat: "markdown",
    aiPrompt: `Write a COMPLETE 2,500-word SEO authority article about: {topic} for {audience}.

Requirements:
- Start with a compelling hook story (not a generic intro)
- Include: H1, at least 4 H2 sections, 2-3 H3s per H2
- Naturally use the target keyword 8-12 times
- Include a data/stat in each H2 section (cite realistic sources)
- Add a "pro tip" callout box in at least 2 sections
- Include a comparison table somewhere in the article
- Write a FAQ section (5 Q&As targeting featured snippets)
- End with a strong conclusion + CTA
- Meta description (155 chars) and SEO title at the top
- Estimated reading time and word count at the top

Write the FULL article — do not truncate or summarize. Every section fully written.`,
    sortOrder: 12,
  },
  {
    id: 13, name: "Viral YouTube Video Script", description: "Write a complete YouTube script with hook, retention loops, B-roll notes, and monetization CTAs",
    category: "Writing Empire", icon: "Play", color: "red",
    inputs: [
      { name: "title", type: "text", label: "Video Title / Topic", placeholder: "e.g. I tried 30 AI tools so you don't have to", required: true },
      { name: "duration", type: "select", label: "Target Video Length", required: false, options: ["5-8 minutes", "10-15 minutes", "15-20 minutes", "20+ minutes"] },
      { name: "monetization", type: "select", label: "Primary Monetization CTA", required: false, options: ["Affiliate links", "Own product/course", "Coaching/services", "Channel membership", "Email list"] },
    ],
    outputLabel: "Full YouTube Script", outputFormat: "markdown",
    aiPrompt: `Write a COMPLETE word-for-word YouTube script for: {title}, targeting {duration} length.

FORMAT REQUIREMENTS:
- Include [HOOK] [B-ROLL] [TALKING HEAD] [SCREEN SHARE] [TEXT ON SCREEN] labels throughout
- Mark retention loops: [OPEN LOOP] and [CLOSE LOOP] — keep viewers watching

## SCRIPT STRUCTURE:
**[00:00 - 00:30] THE HOOK** (write 3 alternative hooks — pick the best)
Make a bold claim, tease the payoff, tell them exactly what they'll learn.

**[00:30 - 02:00] INTRO & SETUP**
Build credibility briefly. Set context. Create anticipation.

**[02:00 onwards] MAIN CONTENT**
Write the FULL script with timestamps. Every section fully scripted word-for-word.

**[LAST 90 SECONDS] CTA SEQUENCE**
Subscribe ask → {monetization} pitch → end screen plug → comment engagement hook

## THUMBNAIL BRIEF
Describe exactly what the thumbnail should look like (face expression, text overlay, colors, props).

## TITLE A/B TEST
5 alternative titles optimized for different search intents.

## DESCRIPTION (optimized for search)
Full video description with keywords, timestamps, links placeholder, and hashtags.`,
    sortOrder: 13,
  },
  {
    id: 14, name: "Complete Newsletter Issue Builder", description: "Write a full newsletter issue: subject lines, preview text, HTML-structured content, and revenue CTA",
    category: "Writing Empire", icon: "Newspaper", color: "amber",
    inputs: [
      { name: "topic", type: "text", label: "Newsletter Issue Topic", placeholder: "e.g. 5 AI tools that saved me 10 hours this week", required: true },
      { name: "niche", type: "text", label: "Newsletter Niche", placeholder: "e.g. marketing, finance, productivity", required: true },
      { name: "monetization", type: "text", label: "What to Promote This Issue", placeholder: "e.g. my affiliate link for Notion, my $47 course", required: false },
    ],
    outputLabel: "Full Newsletter Issue", outputFormat: "markdown",
    aiPrompt: `Write a COMPLETE newsletter issue about {topic} for a {niche} newsletter that promotes {monetization}.

## EMAIL METADATA
- Subject line (primary + 2 A/B test variations)
- Preview text (90 chars — completes the subject line thought)
- From name recommendation

## NEWSLETTER BODY (full content)

### Opening hook (100 words)
Start with a personal anecdote or surprising stat. Make them glad they opened.

### Section 1: Main Story / Insight (250 words)
Deep, valuable content. Teach something actionable. Reference real data.

### Section 2: Quick Hits (5 bullet items)
5 short, punchy insights, links, or tools related to {niche}. Each 1-2 sentences.

### Section 3: Sponsor / Promotion slot
Naturally weave in {monetization}. 80 words max. Make it feel like a genuine recommendation.

### Closing (75 words)
Personality-driven wrap-up. Ask a question to drive reply/engagement.

### P.S.
One final punch — a teaser for next issue or a high-urgency CTA.

## DELIVERABILITY CHECKLIST
5 checks before sending (spam trigger words, link ratio, plain text version note, unsubscribe, etc.)`,
    sortOrder: 14,
  },
  {
    id: 15, name: "Webinar Script & Slide Deck Creator", description: "Write a complete 60-minute webinar script with slide-by-slide breakdown and pitch sequence",
    category: "Writing Empire", icon: "Monitor", color: "purple",
    inputs: [
      { name: "topic", type: "text", label: "Webinar Topic", placeholder: "e.g. How to build a $5k/month freelance business", required: true },
      { name: "offer", type: "text", label: "Offer to Pitch at the End", placeholder: "e.g. my 8-week coaching program at $1,497", required: true },
      { name: "audience", type: "text", label: "Attendee Profile", placeholder: "e.g. freelancers stuck under $2k/month", required: true },
    ],
    outputLabel: "Webinar Script & Slides", outputFormat: "markdown",
    aiPrompt: `Write a complete 60-minute webinar script + slide outline for: {topic} pitching {offer} to {audience}.

## REGISTRATION PAGE
- Webinar title (specific outcome + timeframe)
- Subtitle (what they'll learn, 2-3 bullets)
- Host bio (third-person, authority-building, 100 words)

## SLIDE-BY-SLIDE BREAKDOWN (with full script)
Format each slide as:
**SLIDE [N]: [Title]**
*Visual:* [what's on the slide]
*Script:* [full word-for-word narration]

Cover these segments:
- Slides 1-3: Opening hook + your story (10 min)
- Slides 4-8: The Big Promise + why they've failed before (10 min)
- Slides 9-15: Core Teaching (3 secrets/steps — real value) (20 min)
- Slides 16-18: The Pivot — introduce your offer (5 min)
- Slides 19-24: Full Offer Presentation + stack (10 min)
- Slides 25-27: Close, guarantee, FAQ (5 min)

## POST-WEBINAR EMAIL SEQUENCE
- Replay email (same day, for those who missed it)
- "Here's what you missed" email (next day)
- Final push email (last 24h of offer)`,
    sortOrder: 15,
  },
  {
    id: 16, name: "Podcast Empire Builder", description: "Launch and monetize a podcast with episode scripts, show notes, distribution plan, and sponsorship pitch",
    category: "Writing Empire", icon: "Mic", color: "pink",
    inputs: [
      { name: "show_topic", type: "text", label: "Podcast Show Topic", placeholder: "e.g. scaling a 6-figure service business", required: true },
      { name: "episode_topic", type: "text", label: "First Episode Topic", placeholder: "e.g. the 3 mistakes that kept me stuck at $5k/month", required: true },
    ],
    outputLabel: "Podcast Launch Kit", outputFormat: "markdown",
    aiPrompt: `Create a complete podcast launch kit for: {show_topic}, starting with an episode on {episode_topic}.

## SHOW BRANDING
- Show name (3 options — memorable, searchable, niche-specific)
- Tagline (who it's for + what they'll get)
- Show description (Apple Podcasts optimized, 500-900 chars)
- Episode naming convention

## FIRST EPISODE — FULL SCRIPT
Write the complete word-for-word script including:
- Intro hook (first 60 seconds — do NOT start with "Welcome to the show")
- Host bio segment (brief, results-focused)
- Main content (fully scripted, 15-20 min worth of content)
- Outro with CTA

## SHOW NOTES TEMPLATE (SEO-optimized)
- Episode title with keyword
- Full summary (200 words)
- Key takeaways (5 bullet points)
- Resources / links mentioned
- Transcript excerpt (first 300 words)

## SPONSORSHIP PITCH DECK
- Media kit stats to target (downloads, demographics)
- Ideal sponsor categories for this niche
- Rate card template ($CPM for different ad placements)
- Sample sponsor pitch email

## 90-DAY GROWTH STRATEGY
Launch plan, guest outreach email template, cross-promotion tactics, and milestone targets.`,
    sortOrder: 16,
  },

  // ══════════════════════════════════════════════════════════════
  // 🎯 SALES & CONVERSION MACHINES
  // ══════════════════════════════════════════════════════════════
  {
    id: 17, name: "7-Email Automation Sequence Builder", description: "Write a complete 7-email nurture/sell sequence with full copy, subject lines, and send timing",
    category: "Sales & Conversion", icon: "Send", color: "blue",
    inputs: [
      { name: "product", type: "text", label: "Product / Offer", placeholder: "e.g. my online copywriting course at $297", required: true },
      { name: "audience", type: "text", label: "Subscriber Profile", placeholder: "e.g. new subscribers who downloaded my free checklist", required: true },
      { name: "sequence_type", type: "select", label: "Sequence Type", required: false, options: ["Welcome + Sell sequence", "Nurture + Launch sequence", "Abandoned cart recovery", "Post-purchase upsell", "Re-engagement sequence"] },
    ],
    outputLabel: "7-Email Sequence", outputFormat: "markdown",
    aiPrompt: `Write a COMPLETE 7-email {sequence_type} for {product} targeting {audience}.

For EVERY email write:
- Send timing (day X, time suggestion)
- Subject line + 1 A/B test variant
- Preview text
- FULL email body (no truncating — write every word)
- CTA text + what it links to
- P.S. line

EMAIL 1 (Day 0): Welcome + Quick Win — immediately deliver value, set expectations
EMAIL 2 (Day 1): Your story — build connection and credibility through vulnerability
EMAIL 3 (Day 3): The problem they don't know they have — deepen awareness
EMAIL 4 (Day 5): Social proof / transformation story — make the desired outcome real
EMAIL 5 (Day 7): Objection crusher — tackle the top 3 objections before they arise
EMAIL 6 (Day 9): The offer — pitch confidently with full value stack
EMAIL 7 (Day 11): Last chance — urgency + scarcity + "what if you don't act?" angle

## SEQUENCE OPTIMIZATION NOTES
When to send, how to segment, what to do with non-openers after email 3.`,
    sortOrder: 17,
  },
  {
    id: 18, name: "Sales Page Copywriter", description: "Write a complete long-form sales page that converts cold traffic to buyers",
    category: "Sales & Conversion", icon: "FileEdit", color: "rose",
    inputs: [
      { name: "product", type: "text", label: "Product / Offer", placeholder: "e.g. The Content Creation Masterclass", required: true },
      { name: "price", type: "text", label: "Price", placeholder: "e.g. $197", required: true },
      { name: "audience", type: "text", label: "Ideal Buyer", placeholder: "e.g. aspiring content creators making under $1k/month", required: true },
      { name: "transformation", type: "text", label: "The Transformation You Deliver", placeholder: "e.g. go from 0 to 10k followers and $5k/month in 90 days", required: true },
    ],
    outputLabel: "Full Sales Page", outputFormat: "markdown",
    aiPrompt: `Write a COMPLETE long-form sales page for {product} at {price} targeting {audience} who want {transformation}.

Write every section in full — no placeholders, no "add your testimonial here."

## ABOVE THE FOLD
- Pre-headline (call out the audience)
- Main headline (transformation + timeframe + mechanism)
- Subheadline (backup the promise)
- Hero image description
- CTA button text

## LEAD-IN SECTION
The "If you're [audience] who [problem], then this is the most important page you'll read" section. 150 words.

## PROBLEM AGITATION
Paint the painful status quo in vivid detail. Make them say "that's exactly me." 200 words.

## THE SOLUTION INTRO
Introduce the product as the breakthrough. Name the unique mechanism. 150 words.

## WHAT'S INSIDE
Every module/feature with bold name + italicized benefit sentence. Assigned value prices.

## WHO THIS IS FOR / NOT FOR
2 columns — be specific on both sides.

## SOCIAL PROOF
Write 4 realistic, specific testimonials with names, photos description, and concrete results.

## PRICING & BONUSES
Price reveal + bonus stack with individual values + "you pay only" CTA.

## GUARANTEE
Risk-reversal statement. Make it feel like they have nothing to lose.

## FAQ (8 questions)
Answer the real objections behind each question honestly and persuasively.

## CLOSING CTA
Final pitch, urgency element, and a P.S. that re-sells the whole offer in 3 sentences.`,
    sortOrder: 18,
  },
  {
    id: 19, name: "VSL (Video Sales Letter) Script", description: "Write a complete 10-15 minute VSL script with pattern interrupts, emotional triggers, and a killer close",
    category: "Sales & Conversion", icon: "Film", color: "purple",
    inputs: [
      { name: "product", type: "text", label: "Product / Offer", placeholder: "e.g. my $997 coaching program", required: true },
      { name: "target", type: "text", label: "Target Viewer", placeholder: "e.g. real estate agents wanting passive income", required: true },
      { name: "mechanism", type: "text", label: "Unique Mechanism / Method Name", placeholder: "e.g. The 3-Step Passive Income Protocol", required: false },
    ],
    outputLabel: "VSL Script", outputFormat: "markdown",
    aiPrompt: `Write a complete, word-for-word 10-15 minute VSL script for {product} targeting {target}.

[Mark each section with timing in brackets]

[0:00-0:45] PATTERN INTERRUPT HOOK
Start with a shocking statement, controversial opinion, or counterintuitive claim.

[0:45-2:00] ESTABLISH CREDIBILITY + EMPATHY
Your story — not your success story, your STRUGGLE story first. Then the breakthrough.

[2:00-4:00] IDENTIFY THE REAL PROBLEM
The surface problem they think they have vs. the root cause you've identified. 

[4:00-7:00] INTRODUCE {mechanism}
Present the unique mechanism. This is NOT your product yet — it's the principle/idea.
Prove it works with 3 examples or mini case studies.

[7:00-9:00] REVEAL THE OFFER
Introduce the product as the vehicle to use the mechanism. Stack the components with value.

[9:00-11:00] SOCIAL PROOF MONTAGE SCRIPT
3 mini case studies — write what testimonial-givers should say on camera.

[11:00-12:30] HANDLE OBJECTIONS
Price, time, "it won't work for me" — pre-empt them in conversational tone.

[12:30-14:00] CLOSE + GUARANTEE + URGENCY
The guarantee, scarcity element, what happens if they don't act now.

[14:00-15:00] FINAL CTA
Click the button, what happens next, re-state the transformation.`,
    sortOrder: 19,
  },
  {
    id: 20, name: "Objection Crusher System", description: "Identify and destroy every sales objection with word-for-word scripts for email, phone, and DM",
    category: "Sales & Conversion", icon: "Shield", color: "orange",
    inputs: [
      { name: "offer", type: "text", label: "Your Offer / Product", placeholder: "e.g. $2,000 social media management service", required: true },
      { name: "audience", type: "text", label: "Your Prospect", placeholder: "e.g. small business owners, coaches", required: true },
    ],
    outputLabel: "Objection Crusher Scripts", outputFormat: "markdown",
    aiPrompt: `Build a complete objection-crushing arsenal for {offer} targeting {audience}.

For each of the 10 most common objections, provide:
- The EXACT words/phrase prospects say
- The psychology behind WHY they're really saying it
- Email response (full, ready to send, 100-150 words)
- Phone/call response (word-for-word script, conversational)
- DM/chat response (short, under 280 chars)
- The one reframe that flips this objection into a reason TO buy

The 10 objections to address:
1. "It's too expensive / I can't afford it"
2. "I need to think about it"
3. "I need to talk to my partner/boss"
4. "I'm not ready yet"
5. "I've tried things like this before and it didn't work"
6. "Can you guarantee results?"
7. "I don't have time right now"
8. "I can find this for free online"
9. "I'm not sure if this will work for my specific situation"
10. "I want to wait until [next month/after the holidays/etc.]"

## FOLLOW-UP SEQUENCE AFTER OBJECTION
What to do 24h, 48h, and 7 days after someone says "I'll think about it."`,
    sortOrder: 20,
  },

  // ══════════════════════════════════════════════════════════════
  // 🔍 INTELLIGENCE & RESEARCH MACHINES
  // ══════════════════════════════════════════════════════════════
  {
    id: 21, name: "Competitor Deep Intel Report", description: "Generate a complete competitive intelligence report with gaps, weaknesses, and a counter-strategy",
    category: "Intelligence", icon: "BarChart2", color: "violet",
    inputs: [
      { name: "competitor", type: "text", label: "Competitor / Brand", placeholder: "e.g. Jasper.ai, Gary Vee, MindValley", required: true },
      { name: "niche", type: "text", label: "Niche / Market", placeholder: "e.g. AI writing tools, personal development", required: true },
    ],
    outputLabel: "Competitor Intel Report", outputFormat: "markdown",
    aiPrompt: `Write a comprehensive competitive intelligence report on {competitor} in the {niche} market.

## BRAND OVERVIEW
- Business model (how they make money)
- Estimated revenue range and team size
- Core audience segments
- Geographic markets

## CONTENT STRATEGY BREAKDOWN
- Primary content pillars (what they talk about most)
- Content formats that perform best for them
- Posting cadence and platforms
- Estimated engagement rates

## PRODUCT / OFFER ANALYSIS
- Full product ecosystem (free → paid → premium)
- Pricing strategy
- Positioning statements they use
- Unique selling propositions

## IDENTIFIED WEAKNESSES & GAPS
- 5 specific content gaps they're NOT addressing
- Audience complaints or frustrations (what negative reviews say)
- Positioning blind spots
- Underserved customer segments

## YOUR COUNTER-STRATEGY
- 5 specific content angles to outmaneuver them
- Positioning statement that makes you the obvious alternative
- Price anchoring strategy relative to their prices
- The one niche you can own that they can't

## SWIPE FILE
5 of their best-performing content hooks or headlines that you can legally model (not copy).`,
    sortOrder: 21,
  },
  {
    id: 22, name: "Niche Profit Analyzer", description: "Deeply analyze any niche for monetization potential, competition level, and fastest path to $10k/month",
    category: "Intelligence", icon: "Target", color: "green",
    inputs: [
      { name: "niche", type: "text", label: "Niche to Analyze", placeholder: "e.g. plant-based nutrition for athletes", required: true },
    ],
    outputLabel: "Niche Profit Analysis", outputFormat: "markdown",
    aiPrompt: `Perform a deep profitability analysis of the {niche} niche.

## MARKET SIZE & OPPORTUNITY
- Estimated market size and growth trajectory
- Who is spending money in this niche (demographics + psychographics)
- Average customer LTV
- Seasonality factors

## MONETIZATION PATHWAYS (ranked by profit potential)
Rate each on: profit potential ($), difficulty (1-10), time to first dollar
1. Digital products (ebooks, courses, templates)
2. Coaching / consulting
3. Affiliate marketing
4. Physical products
5. Memberships / communities
6. Agency/service business
7. SaaS / software
8. Brand sponsorships / ads

## COMPETITION ANALYSIS
- Saturation level (too crowded / healthy / blue ocean)
- Top 5 players and what they're doing
- The gaps no one is filling

## FASTEST PATH TO $10K/MONTH
Step-by-step roadmap from zero to $10k/month in this niche:
- Month 1: [specific actions]
- Month 2-3: [specific actions]
- Month 4-6: [scale phase]
- What to build first, what to build later

## CONTENT ANGLES THAT BUILD TRUST FASTEST
Top 5 content types that position you as an expert in this niche with minimal credentials.

## RED FLAGS
Reasons this niche could be harder than it looks.`,
    sortOrder: 22,
  },
  {
    id: 23, name: "Customer Avatar Architect", description: "Build a hyper-detailed ideal customer profile with psychographics, buying triggers, and messaging guide",
    category: "Intelligence", icon: "Users", color: "cyan",
    inputs: [
      { name: "product", type: "text", label: "Product / Service", placeholder: "e.g. my social media coaching program", required: true },
      { name: "audience_hint", type: "text", label: "Who You Think Your Audience Is", placeholder: "e.g. entrepreneurs, stay-at-home moms", required: false },
    ],
    outputLabel: "Customer Avatar Profile", outputFormat: "markdown",
    aiPrompt: `Build a hyper-detailed customer avatar for {product} targeting {audience_hint}.

## DEMOGRAPHIC PROFILE
Age range, gender split, income level, location, education, relationship status, job title, industry.

## PSYCHOGRAPHIC DEEP DIVE
- Core values (what they believe in)
- Identity (how they see themselves vs. how they want to be seen)
- Daily emotional experience (morning to night — the internal monologue)
- Aspirations (their 1-year, 5-year dream)

## THE PAIN STACK (3 levels)
- Surface pain: what they complain about openly
- Underlying pain: the real problem underneath
- Identity pain: how this problem makes them feel about themselves

## BUYING BEHAVIOR
- What makes them buy (triggers)
- What stops them from buying (fears)
- Their decision-making process (impulse vs. research)
- What media they trust (social, books, podcasts, YouTube)
- Influencers, brands, and communities they follow

## THE EXACT WORDS THEY USE
20 specific phrases they say about their problem (for use in copy).

## MESSAGING GUIDE
- Headline formula that speaks to them
- Tone of voice that resonates
- Words to use / words to avoid
- The one core desire your messaging must always come back to`,
    sortOrder: 23,
  },
  {
    id: 24, name: "Trend Hunter & First-Mover System", description: "Identify 10 emerging trends before they peak, with content angles and monetization per trend",
    category: "Intelligence", icon: "Compass", color: "teal",
    inputs: [
      { name: "niche", type: "text", label: "Your Niche / Industry", placeholder: "e.g. AI tools, fitness tech, online education", required: true },
    ],
    outputLabel: "Trend Intelligence Report", outputFormat: "markdown",
    aiPrompt: `Identify 10 emerging trends in {niche} that haven't peaked yet (as of mid-2025).

For EACH trend:

**TREND NAME**: [catchy, memorable name]
**Status**: Early adopter / Rising / About to peak
**Why it's emerging**: (2-3 sentences on the driving forces)
**Timeline**: When it will hit mainstream
**Audience pain it solves**: (specific)
**Content angles** (3 specific angles to create first-mover content):
  1. Controversial take
  2. Educational deep-dive
  3. Personal experiment/review
**Monetization angle**: How to make money from this trend specifically (product, service, affiliate)
**First-mover advantage**: What to do in the next 30 days to own this trend
**Platform to lead with**: (which platform to hit first and why)

---

## TREND PRIORITIZATION MATRIX
Rank all 10 trends by: (1) profit potential, (2) speed to monetize, (3) longevity.

## 30-DAY ACTION PLAN
Pick the top 2 trends. Create a specific 30-day content and monetization plan for each.`,
    sortOrder: 24,
  },

  // ══════════════════════════════════════════════════════════════
  // 🤖 AUTOMATION & SYSTEM BUILDERS
  // ══════════════════════════════════════════════════════════════
  {
    id: 25, name: "90-Day Content Empire Planner", description: "Generate a full 90-day multi-platform content strategy with daily posts, themes, and monetization triggers",
    category: "Productivity", icon: "Calendar", color: "indigo",
    inputs: [
      { name: "niche", type: "text", label: "Your Niche", placeholder: "e.g. personal finance, digital marketing", required: true },
      { name: "platforms", type: "text", label: "Platforms to Post On", placeholder: "e.g. Instagram, TikTok, LinkedIn", required: true },
      { name: "goal", type: "select", label: "Primary 90-Day Goal", required: false, options: ["Grow to 10k followers", "Build email list", "Launch a product", "Land brand deals", "Generate $5k+/month"] },
    ],
    outputLabel: "90-Day Content Plan", outputFormat: "markdown",
    aiPrompt: `Build a complete 90-day content empire plan for {niche} across {platforms} with the goal to {goal}.

## PHASE 1: FOUNDATION (Days 1-30) — Build Trust
- Monthly content theme
- 4 weekly sub-themes
- 5 content pillars to rotate through
- 30 specific post ideas with hooks (one per day)
- Monetization trigger: [what to promote this month]

## PHASE 2: MOMENTUM (Days 31-60) — Build Authority
- Monthly content theme
- 4 weekly sub-themes
- 30 specific post ideas with hooks (one per day)  
- Viral content strategy for this month
- Monetization trigger: [what to promote this month]

## PHASE 3: SCALE (Days 61-90) — Build Revenue
- Monthly content theme
- 4 weekly sub-themes
- 30 specific post ideas with hooks (one per day)
- Launch/promotion calendar
- Monetization trigger: [what to promote this month]

## REPURPOSING MATRIX
How to turn each piece of long-form content into 5 short-form pieces.

## KPI TRACKING DASHBOARD
What metrics to track weekly and what they mean.`,
    sortOrder: 25,
  },
  {
    id: 26, name: "Brand Voice & Identity System", description: "Create a complete brand identity: voice, tone, messaging pillars, and a 50-word writing style guide",
    category: "Productivity", icon: "Palette", color: "fuchsia",
    inputs: [
      { name: "brand", type: "text", label: "Brand / Creator Name", placeholder: "e.g. Alex's Financial Freedom Brand", required: true },
      { name: "mission", type: "text", label: "What You're On a Mission to Do", placeholder: "e.g. help 1M people escape the 9-5 through investing", required: true },
      { name: "audience", type: "text", label: "Your Core Audience", placeholder: "e.g. millennials stuck in corporate jobs", required: true },
    ],
    outputLabel: "Brand Identity System", outputFormat: "markdown",
    aiPrompt: `Create a complete brand identity system for {brand} on a mission to {mission} serving {audience}.

## BRAND ESSENCE
- Mission statement (one powerful sentence)
- Vision statement (the world if you fully succeed)
- Core values (5 values with 1-paragraph explanation each)
- Brand personality (pick 4 archetypes and explain how they blend)

## VOICE & TONE GUIDE
- Voice (consistent, like a personality trait — never changes)
- Tone (shifts by context — write 5 different context examples)
- Writing style: Sentence length, vocabulary level, use of humor, data vs. story balance
- Words/phrases to ALWAYS use
- Words/phrases to NEVER use
- How to handle controversial topics

## MESSAGING ARCHITECTURE
- Primary message (the one thing you want known)
- 3 supporting pillars (proof points for the primary message)
- Tagline (5 options — pick your favorite)
- Elevator pitch (30-second spoken version)

## SAMPLE CONTENT IN YOUR BRAND VOICE
Write these in your brand voice:
- An Instagram caption
- A tweet
- An email opening paragraph
- A LinkedIn post
- A product description
Each should sound distinctly like {brand}.`,
    sortOrder: 26,
  },
  {
    id: 27, name: "Passive Income Stack Builder", description: "Design 5 stacked passive income streams for your niche with implementation roadmap and realistic income projections",
    category: "Profit Machines", icon: "Layers", color: "amber",
    inputs: [
      { name: "niche", type: "text", label: "Your Niche / Expertise", placeholder: "e.g. graphic design, personal finance, fitness coaching", required: true },
      { name: "current_monthly", type: "text", label: "Current Monthly Income from This Niche", placeholder: "e.g. $0, $500, $2000", required: false },
    ],
    outputLabel: "Passive Income Blueprint", outputFormat: "markdown",
    aiPrompt: `Design a complete passive income ecosystem for someone in the {niche} niche currently earning {current_monthly}.

## INCOME STREAM ANALYSIS
For each of the 5 recommended income streams, provide:

**Stream Name**: [Specific product/service type]
**Passive Score**: 1-10 (10 = completely passive once built)
**Startup Effort**: Low / Medium / High
**Time to First Dollar**: [realistic estimate]
**Monthly Income Potential**: $low - $high range
**Platform to Use**: [specific platform recommendation]
**What You Need to Build It**: [specific assets/content/systems]
**Sample product/offer idea for YOUR specific niche**

## THE STACKING STRATEGY
How to build these 5 streams in sequence (not all at once):
- Month 1-2: Build Stream 1 (why this first)
- Month 3-4: Add Stream 2 (how it compounds on Stream 1)
- Month 5-6: Add Stream 3
- Month 7-9: Add Streams 4-5
- Month 12: Projected total monthly passive income

## AUTOMATION CHECKLIST
For each stream: what to automate, what tools to use, and how much time it takes per week once built.

## REALISTIC INCOME PROJECTIONS
Month 3, 6, 9, 12 projections with assumptions stated clearly.`,
    sortOrder: 27,
  },
  {
    id: 28, name: "Community & Membership Builder", description: "Launch a paid community or membership with full pricing, onboarding, and monthly content system",
    category: "Profit Machines", icon: "Users", color: "blue",
    inputs: [
      { name: "topic", type: "text", label: "Community Topic / Niche", placeholder: "e.g. female entrepreneurs building online businesses", required: true },
      { name: "price", type: "select", label: "Monthly Price Target", required: false, options: ["$9-$29/month (volume play)", "$49-$97/month (value play)", "$97-$297/month (premium)", "$297+/month (mastermind)"] },
    ],
    outputLabel: "Community Launch Kit", outputFormat: "markdown",
    aiPrompt: `Design a complete paid community/membership for {topic} at {price}.

## COMMUNITY POSITIONING
- Name (3 options — exclusive-sounding, results-focused)
- Tagline and positioning statement
- The transformation members get in 90 days
- Why paid > free (unique benefits of paying)

## PRICING ARCHITECTURE
- Monthly plan (price + what's included)
- Annual plan (price + savings + bonus incentive)
- Founding member offer (first 100 members — price + perks)

## PLATFORM DECISION
Compare Circle, Skool, Discord, Facebook Groups, Kajabi — recommend the best fit with pros/cons.

## ONBOARDING SEQUENCE
Day 1, 3, 7, 14 onboarding emails/messages for new members (full copy).

## MONTHLY CONTENT CALENDAR TEMPLATE
What to deliver every month to keep retention high:
- Weekly live calls (agenda template)
- Monthly challenge structure
- Resource drops (what type, how often)
- Community events (AMAs, hot seats, etc.)

## LAUNCH STRATEGY
Founding member waitlist → launch week → first month milestones.
Full launch email sequence (5 emails — full copy).

## RETENTION PLAYBOOK
What to do at day 30, 60, 90 to prevent churn.`,
    sortOrder: 28,
  },
  {
    id: 29, name: "Facebook & Instagram Ads Swipe File", description: "Generate a complete paid ads system: 5 ad creative concepts, full copy for each, audience targeting, and budget strategy",
    category: "Sales & Conversion", icon: "Target", color: "indigo",
    inputs: [
      { name: "product", type: "text", label: "Product / Offer", placeholder: "e.g. my $47 content creation guide", required: true },
      { name: "audience", type: "text", label: "Target Audience", placeholder: "e.g. women 25-45 interested in online business", required: true },
      { name: "budget", type: "select", label: "Monthly Ad Budget", required: false, options: ["$100-$500/month (testing)", "$500-$2k/month (scaling)", "$2k-$10k/month (full scale)"] },
    ],
    outputLabel: "Complete Ads System", outputFormat: "markdown",
    aiPrompt: `Build a complete Facebook & Instagram ads system for {product} targeting {audience} with {budget}.

## AD CREATIVE CONCEPTS (5 complete ads)

For each ad write:
**AD [N]: [Type — e.g. Story Ad, Testimonial, Direct Response]**
- Primary text (3 variations — short, medium, long)
- Headline (3 variations)
- Description text
- CTA button: [best choice]
- Visual brief (exactly what image/video should look like)
- Why this angle works for this audience

## AUDIENCE TARGETING GUIDE
- Core audience: demographics + interests + behaviors (ready to input into Ads Manager)
- Lookalike audience strategy (what to base it on)
- Retargeting audiences (5 custom audiences to create)
- Audiences to EXCLUDE

## CAMPAIGN STRUCTURE
- Campaign objective choice + why
- Ad set strategy (how many, how to structure)
- Budget allocation between cold/warm/hot traffic

## TESTING FRAMEWORK
Week 1-2: What to test first (creative vs. audience vs. offer)
Week 3-4: How to read results and kill losers
Week 5+: Scaling checklist

## KPI TARGETS
What CPM, CTR, CPC, CPL, ROAS to aim for at each stage.`,
    sortOrder: 29,
  },
  {
    id: 30, name: "Agency / Freelance Business Builder", description: "Build a complete service business: offer design, pricing, client acquisition, delivery system, and scale roadmap",
    category: "Profit Machines", icon: "Briefcase", color: "slate",
    inputs: [
      { name: "skill", type: "text", label: "Your Skill / Service", placeholder: "e.g. video editing, copywriting, web design, ads", required: true },
      { name: "target_market", type: "text", label: "Target Client Market", placeholder: "e.g. real estate agents, SaaS startups, coaches", required: true },
    ],
    outputLabel: "Agency/Freelance Blueprint", outputFormat: "markdown",
    aiPrompt: `Build a complete service business blueprint for: {skill} services targeting {target_market}.

## OFFER DESIGN
- Service name (productized, outcome-focused)
- The exact deliverables (what they get, in what format, by when)
- The unique mechanism (your process/framework — give it a name)
- Positioning: why you over a cheaper freelancer or bigger agency

## PRICING STRUCTURE
- Starter package: [deliverables + price + timeline]
- Growth package: [deliverables + price + timeline]
- Premium/Retainer package: [deliverables + price/month]
- Pricing psychology rationale

## CLIENT ACQUISITION SYSTEM
- Top 3 channels to find {target_market} clients
- Outreach sequence (full cold email + DM scripts — ready to use)
- Referral program structure
- Content marketing angle to attract inbound clients

## SALES PROCESS
- Discovery call script (word-for-word, 30 minutes)
- Proposal template structure
- Contract essentials
- How to close without discounting

## DELIVERY SYSTEM
- Onboarding checklist
- Project management workflow
- Client communication cadence
- How to deliver exceptional results consistently

## SCALE ROADMAP
Solo → $10k/month → hire first contractor → $50k/month agency model.`,
    sortOrder: 30,
  },

  // ══════════════════════════════════════════════════════════════
  // Quick-fire high-value blocks (31-50)
  // ══════════════════════════════════════════════════════════════
  {
    id: 31, name: "Viral Hook Generator (Advanced)", description: "Generate 10 scientifically-crafted viral hooks using proven psychological triggers",
    category: "Content AI", icon: "Zap", color: "purple",
    inputs: [
      { name: "topic", type: "text", label: "Topic / Story / Offer", placeholder: "e.g. how I made $5k in one week using AI", required: true },
      { name: "platform", type: "select", label: "Platform", required: true, options: ["TikTok", "Instagram Reels", "YouTube Shorts", "Twitter/X", "LinkedIn"] },
      { name: "trigger", type: "select", label: "Psychological Trigger", required: false, options: ["Curiosity gap", "Controversy", "Social proof", "Fear of missing out", "Shock & awe", "Transformation story", "Mix of all"] },
    ],
    outputLabel: "Viral Hooks", outputFormat: "list",
    aiPrompt: `Generate 10 advanced viral hooks for {platform} about: {topic} using {trigger} triggers.

For each hook:
- The hook itself (under 12 words, punchy)
- Why it works (which psychological principle)
- Best visual pairing (what to show on screen)

Hooks must: create an open loop, make skipping feel costly, and speak directly to the viewer's identity or desire.
Format as numbered list. Only write the hooks and brief explanations — no filler.`,
    sortOrder: 31,
  },
  {
    id: 32, name: "Product Launch Email Sequence", description: "Complete 14-day product launch email sequence with pre-launch, cart open, and close phases",
    category: "Sales & Conversion", icon: "Mail", color: "orange",
    inputs: [
      { name: "product", type: "text", label: "Product Name", placeholder: "e.g. The AI Entrepreneur Bootcamp", required: true },
      { name: "price", type: "text", label: "Launch Price", placeholder: "e.g. $297", required: true },
      { name: "open_days", type: "select", label: "Cart Open Duration", required: false, options: ["3 days", "5 days", "7 days"] },
    ],
    outputLabel: "Launch Email Sequence", outputFormat: "markdown",
    aiPrompt: `Write a complete 14-day product launch email sequence for {product} at {price} with {open_days} cart open.

PRE-LAUNCH (7 days of build-up):
Day -7, -5, -3, -1: Full emails with subject lines, bodies, and CTAs.

CART OPEN (full sequence):
Day 1, 2, 3 (and daily through {open_days}): Full emails.

CART CLOSE (last 48 hours):
48h warning, 24h final, 4h last call, 1h closing.

Each email: subject line + A/B test + full body (no truncating) + CTA.`,
    sortOrder: 32,
  },
  {
    id: 33, name: "Keyword Goldmine Researcher", description: "Find 50 money-keywords with intent, competition level, and content angle for each",
    category: "Intelligence", icon: "Search", color: "teal",
    inputs: [
      { name: "seed", type: "text", label: "Seed Topic / Keyword", placeholder: "e.g. make money online, weight loss, crypto", required: true },
      { name: "intent", type: "select", label: "Focus Intent", required: false, options: ["Buyer intent (transactional)", "Research intent (informational)", "Comparison intent (commercial)", "All intents"] },
    ],
    outputLabel: "Keyword Research Report", outputFormat: "markdown",
    aiPrompt: `Generate 50 valuable keywords related to: {seed} with {intent}.

Organize into 3 groups:
## QUICK WINS (low competition, 500-5k searches/month) — 20 keywords
## GROWTH TARGETS (medium competition, 5k-50k searches/month) — 20 keywords  
## MONEY KEYWORDS (high commercial intent, any volume) — 10 keywords

For each keyword: keyword phrase | estimated monthly searches | competition (L/M/H) | content type that ranks best | monetization angle.

Format as a table.`,
    sortOrder: 33,
  },
  {
    id: 34, name: "Testimonial & Social Proof Machine", description: "Design a complete social proof system: collection strategy, templates, formatting, and placement guide",
    category: "Sales & Conversion", icon: "Star", color: "yellow",
    inputs: [
      { name: "product", type: "text", label: "Product / Service", placeholder: "e.g. my copywriting course", required: true },
      { name: "result", type: "text", label: "Main Result Customers Get", placeholder: "e.g. land their first $2k copywriting client", required: true },
    ],
    outputLabel: "Social Proof System", outputFormat: "markdown",
    aiPrompt: `Build a complete social proof collection and display system for {product} that delivers {result}.

## COLLECTION TEMPLATES
- Email request (sent day 7 after purchase) — full copy
- Email request (sent day 30) — full copy
- DM/chat follow-up — full copy
- Video testimonial request guide (exactly what to ask on camera)

## THE TESTIMONIAL FORMULA
What makes a testimonial convert: before → trigger → after + specific results.
Provide 3 example templates for customers to fill in.

## SOCIAL PROOF FORMATS
How to display testimonials on: landing page, emails, social media posts, stories.
Template for each format (ready to design).

## CASE STUDY BUILDER
Turn one testimonial into a full case study: the interview questions to ask + the narrative structure + how to present numbers.

## OBJECTION-SPECIFIC PROOF
Match each top objection with the type of social proof that kills it.`,
    sortOrder: 34,
  },
  {
    id: 35, name: "Dropshipping / Print-on-Demand Product Finder", description: "Research winning products with supplier options, ad angles, and a 30-day store launch plan",
    category: "Profit Machines", icon: "ShoppingCart", color: "green",
    inputs: [
      { name: "niche", type: "text", label: "Product Niche", placeholder: "e.g. pet accessories, home office, outdoor gear", required: true },
      { name: "model", type: "select", label: "Business Model", required: false, options: ["Dropshipping (AliExpress/CJ)", "Print-on-demand (Printful)", "Private label", "Wholesale"] },
      { name: "budget", type: "select", label: "Starting Budget", required: false, options: ["Under $200", "$200-$500", "$500-$2000"] },
    ],
    outputLabel: "Ecommerce Launch Blueprint", outputFormat: "markdown",
    aiPrompt: `Find winning {model} products in the {niche} niche with a {budget} starting budget.

## TOP 5 WINNING PRODUCTS
For each product:
- Product name + description
- Why it wins (demand signals, problem it solves)
- Selling price vs. cost = profit margin
- Supplier recommendation + search terms
- Estimated monthly revenue potential
- Main risks / competition level

## STORE SETUP CHECKLIST
Platform choice (Shopify/Etsy/TikTok Shop) with reasoning.
Essential pages, apps, and tools list.

## AD CREATIVE STRATEGY
For your #1 product pick: 3 TikTok/Reels ad angles + scripts.

## 30-DAY LAUNCH ROADMAP
Days 1-7: Store setup. Days 8-14: First products + SEO. Days 15-21: First ads. Days 22-30: Optimize.

## SCALE TRIGGERS
When to know a product is worth scaling, and how much to spend.`,
    sortOrder: 35,
  },
  {
    id: 36, name: "Ghostwriter Content Package", description: "Generate a month of ghostwritten content for any personal brand: posts, threads, emails, and articles",
    category: "Writing Empire", icon: "Ghost", color: "slate",
    inputs: [
      { name: "person", type: "text", label: "Person / Brand to Write For", placeholder: "e.g. a fitness coach who helps people over 40", required: true },
      { name: "voice", type: "text", label: "Their Voice / Personality", placeholder: "e.g. direct, swears occasionally, no-nonsense, ex-Marine", required: false },
      { name: "goal", type: "text", label: "Content Goal This Month", placeholder: "e.g. promote new $97 training program", required: false },
    ],
    outputLabel: "Ghostwriter Content Pack", outputFormat: "markdown",
    aiPrompt: `Create a complete month of ghostwritten content for: {person} with {voice} voice, goal: {goal}.

Write all of the following IN THEIR VOICE:

## 8 TWITTER/X POSTS (varied formats)
## 4 LONG LINKEDIN POSTS (1000+ chars each)
## 2 INSTAGRAM CAROUSELS (10 slides each — slide-by-slide text)
## 2 EMAIL NEWSLETTERS (subject + full body)
## 1 THOUGHT LEADERSHIP ARTICLE (800 words, publishable)
## 5 SHORT INSTAGRAM/TIKTOK CAPTIONS WITH HOOKS

All content should sound authentically like {person} — no generic tone allowed.
Naturally weave in promotion of {goal} where appropriate (aim for 20% promotional).`,
    sortOrder: 36,
  },
  {
    id: 37, name: "Influencer & Brand Deal Pitcher", description: "Research ideal brand partners, write pitch emails, and create a media kit for sponsorships",
    category: "Profit Machines", icon: "Award", color: "pink",
    inputs: [
      { name: "creator", type: "text", label: "Your Platform & Niche", placeholder: "e.g. lifestyle blogger with 15k Instagram followers", required: true },
      { name: "audience", type: "text", label: "Your Audience Demographics", placeholder: "e.g. women 25-35, interested in wellness and travel", required: false },
    ],
    outputLabel: "Brand Deal Package", outputFormat: "markdown",
    aiPrompt: `Build a complete brand deal and influencer sponsorship system for: {creator} with audience: {audience}.

## MEDIA KIT CONTENT
- Bio (results-focused, third person, 100 words)
- Audience demographics section (how to write it even with no analytics access)
- Platform stats presentation format
- Content samples description
- Previous brand partnership section (template)

## TOP 15 IDEAL BRAND PARTNERS
For each: brand name, why they're a fit, estimated rate for a post, contact approach.

## PITCH EMAIL TEMPLATE
Full cold pitch email for an ideal brand (500 words, persuasive, not desperate).
Customize variables for any brand.

## RATE CARD
Pricing formula for your follower count: story, post, reel, newsletter, YouTube integration.

## NEGOTIATION SCRIPTS
How to counter a lowball offer. How to ask for usage rights. How to close faster.`,
    sortOrder: 37,
  },
  {
    id: 38, name: "Daily Revenue Report Generator", description: "Build a complete revenue tracking + analysis system with daily tasks to hit monthly income goals",
    category: "Productivity", icon: "BarChart", color: "green",
    inputs: [
      { name: "monthly_goal", type: "text", label: "Monthly Revenue Goal", placeholder: "e.g. $5,000, $10,000, $50,000", required: true },
      { name: "business_type", type: "text", label: "Business Type", placeholder: "e.g. digital products + coaching, agency, affiliate", required: true },
    ],
    outputLabel: "Revenue Growth System", outputFormat: "markdown",
    aiPrompt: `Build a complete revenue growth system for a {business_type} business targeting {monthly_goal}/month.

## REVENUE BREAKDOWN MATH
How to hit {monthly_goal} across different income streams with specific unit economics:
- If selling $X product: need Y sales = Z per week = A per day
- If selling $XX service: need B clients
- Build the math for 3 different product/price combinations

## DAILY REVENUE-GENERATING TASKS
The exact 90-minute daily routine to focus on revenue:
- 30 minutes: outreach / lead generation
- 30 minutes: content creation / audience building
- 30 minutes: follow-up / sales conversations
Specific tasks for each block.

## WEEKLY REVIEW DASHBOARD
5 KPIs to track every week + what to do if each is below target.

## BOTTLENECK DIAGNOSTIC
"If I'm not hitting goal, it's because of:" — decision tree to find the exact weak link.

## SCALE TRIGGERS
When and how to add the next income stream.`,
    sortOrder: 38,
  },
  {
    id: 39, name: "Press Release & PR Machine", description: "Write a professional press release and full PR distribution strategy to get media coverage",
    category: "Writing Empire", icon: "Newspaper", color: "blue",
    inputs: [
      { name: "announcement", type: "text", label: "What You're Announcing", placeholder: "e.g. launching a new app, hitting $1M revenue, new course", required: true },
      { name: "company", type: "text", label: "Company / Brand Name", placeholder: "e.g. ViralCraft Studio", required: true },
    ],
    outputLabel: "PR Package", outputFormat: "markdown",
    aiPrompt: `Write a complete PR package for: {company} announcing {announcement}.

## PRESS RELEASE (AP Style, full)
- Headline (news-worthy, specific, no hype)
- Dateline
- Lead paragraph (who, what, when, where, why)
- Body (3-4 paragraphs with supporting details and quotes)
- Quote from founder (compelling, printable)
- Boilerplate (company description, 100 words)
- Contact information section

## PITCH EMAIL (to journalists/bloggers)
Subject line + personalized pitch email (200 words, hook them in paragraph 1).

## TOP 25 MEDIA TARGETS
Publications, podcasts, and journalists to pitch for this announcement, organized by tier (Tier 1 national, Tier 2 industry, Tier 3 niche blogs).

## DISTRIBUTION STRATEGY
Free and paid PR distribution services. Optimal timing. Follow-up schedule.`,
    sortOrder: 39,
  },
  {
    id: 40, name: "Rapid Idea Validator", description: "Validate any business idea in under 5 minutes with market analysis, risk score, and a 48-hour validation test",
    category: "Intelligence", icon: "Lightbulb", color: "amber",
    inputs: [
      { name: "idea", type: "text", label: "Business Idea to Validate", placeholder: "e.g. AI tool that writes Airbnb listing descriptions", required: true },
    ],
    outputLabel: "Idea Validation Report", outputFormat: "markdown",
    aiPrompt: `Rapidly validate this business idea: {idea}

## VIABILITY SCORE: [X/10]
Break down: market demand (X/10), competition (X/10), monetization ease (X/10), founder-market fit (X/10).

## MARKET REALITY CHECK
- Who is already doing this? (top 3 competitors)
- Is the market growing or shrinking?
- What does the customer currently use instead?
- Will they pay for this? How much?

## THE BIGGEST RISKS (ranked)
Top 5 risks that could kill this idea, with mitigation strategies.

## GREEN LIGHTS
What's genuinely promising about this idea (specific, not vague).

## 48-HOUR VALIDATION TEST
Exact steps to validate in 48 hours with $0 spent:
1. [specific action]
2. [specific action]
3. [specific action]
What "success" looks like at the end of 48 hours.

## GO / NO-GO VERDICT
Clear recommendation with reasoning.`,
    sortOrder: 40,
  },
  {
    id: 41, name: "Lead Magnet Factory (Complete)", description: "Design 3 lead magnet concepts + fully write the best one + landing page copy + welcome email",
    category: "Sales & Conversion", icon: "Gift", color: "pink",
    inputs: [
      { name: "audience", type: "text", label: "Your Target Audience", placeholder: "e.g. beginner online coaches", required: true },
      { name: "main_product", type: "text", label: "Paid Offer You Want to Sell After", placeholder: "e.g. my $497 coaching program", required: true },
    ],
    outputLabel: "Lead Magnet System", outputFormat: "markdown",
    aiPrompt: `Build a complete lead magnet system for {audience} designed to pre-sell {main_product}.

## 3 LEAD MAGNET CONCEPTS
For each: title + format + what it teaches + why it qualifies buyers for {main_product}.

## FULL CONTENT — BEST LEAD MAGNET
Write the complete lead magnet (checklist, swipe file, or mini-guide — pick the fastest format).
Fully written, ready to design and deliver.

## LANDING PAGE COPY
Headline, subheadline, 3 bullets, social proof line, form CTA.

## THANK YOU PAGE
What to show immediately after opt-in (bridge to {main_product}).

## WELCOME EMAIL
Subject + full email that delivers the lead magnet, builds trust, and plants the seed for {main_product}.

## 3-DAY NURTURE SEQUENCE
After the welcome email: Day 2 and Day 3 emails that move subscribers closer to buying.`,
    sortOrder: 41,
  },
  {
    id: 42, name: "Upsell & Revenue Maximizer", description: "Design a complete upsell/downsell/cross-sell system that doubles average order value",
    category: "Sales & Conversion", icon: "ArrowUp", color: "green",
    inputs: [
      { name: "core_product", type: "text", label: "Core Product Being Sold", placeholder: "e.g. my $47 Instagram Growth Guide", required: true },
      { name: "price", type: "text", label: "Core Product Price", placeholder: "e.g. $47", required: true },
    ],
    outputLabel: "Upsell Revenue System", outputFormat: "markdown",
    aiPrompt: `Design a complete post-purchase revenue maximization system for {core_product} at {price}.

## ORDER BUMP (shown on checkout page)
- Product idea (complements the main offer)
- Price (15-40% of main price)
- Headline + 3-bullet description + CTA
- Expected conversion rate: [%]

## UPSELL 1 (shown immediately after purchase — OTO)
- Product idea (the "next logical step")
- Price (2-5x the main product)
- Full VSL script (2-minute verbal pitch)
- Headline + subheadline for the page

## DOWNSELL (shown if they decline the upsell)
- Reduced version of the upsell OR payment plan
- Price and pitch (100 words, no pressure)

## UPSELL 2 (premium / mastermind offer)
- The high-ticket extension
- Price and what's included
- Who to show this to and when

## EMAIL-BASED CROSS-SELLS
3 emails sent 7, 14, and 30 days post-purchase to naturally introduce related products.

## EXPECTED AOV LIFT
Conservative vs. optimistic projection for average order value with this system.`,
    sortOrder: 42,
  },
  {
    id: 43, name: "Crisis & Reputation Manager", description: "Handle PR crises, negative reviews, and viral controversy with professional response scripts",
    category: "Productivity", icon: "Shield", color: "red",
    inputs: [
      { name: "situation", type: "text", label: "Describe the Crisis / Issue", placeholder: "e.g. viral negative review, public criticism, mistake I made", required: true },
      { name: "platform", type: "select", label: "Where It Happened", required: false, options: ["Twitter/X", "Instagram comments", "YouTube comments", "Reddit", "Google Reviews", "News / Blog", "Multiple platforms"] },
    ],
    outputLabel: "Crisis Response Kit", outputFormat: "markdown",
    aiPrompt: `Create a complete crisis response kit for: {situation} on {platform}.

## IMMEDIATE RESPONSE (post within 2 hours)
Word-for-word response script. Acknowledge → Empathize → Action → Timeline.
Keep under 280 chars for social, up to 500 words for email/blog.

## FULL STATEMENT (if needed)
A more comprehensive response for serious situations (500 words).

## INTERNAL TEAM BRIEF
What to tell your team right now (2 paragraphs — facts, tone, what NOT to say).

## FOLLOW-UP ACTIONS (24-72 hours)
Specific steps to take: who to contact, what to change, what to publish.

## RECOVERY CONTENT PLAN (7-day)
Specific posts/actions each day to shift narrative without being defensive.

## WHAT NOT TO DO
5 common crisis response mistakes that make things worse.

## LONG-TERM REPUTATION REPAIR
30-day strategy to rebuild trust and goodwill.`,
    sortOrder: 43,
  },
  {
    id: 44, name: "Podcast Guest Pitch Machine", description: "Land podcast guest spots to build authority with personalized pitches and talking points",
    category: "Traffic & Growth", icon: "Radio", color: "purple",
    inputs: [
      { name: "expertise", type: "text", label: "Your Expertise / Story", placeholder: "e.g. how I built a 6-figure freelance business", required: true },
      { name: "target_shows", type: "text", label: "Type of Podcasts to Target", placeholder: "e.g. business podcasts for entrepreneurs, marketing shows", required: true },
    ],
    outputLabel: "Podcast Pitch Package", outputFormat: "markdown",
    aiPrompt: `Build a complete podcast guest outreach system for: {expertise} targeting {target_shows}.

## GUEST PITCH EMAIL TEMPLATE
Subject line, personalized opening formula, 3-line bio (what makes you interesting), 5 episode topic pitches with 1-paragraph description each, CTA, and social proof links.

## ONE-PAGE SPEAKER SHEET
All the info a host needs: photo description, bio, topics, past appearances, what audiences learn.

## 5 EPISODE CONCEPTS
For each: working title, 3 key talking points, unique angle, why their audience will love it.

## 30 PODCAST TARGETS
Specific show names in {target_shows} space that interview guests like you (organized by audience size).

## POST-EPISODE LEVERAGE
How to repurpose one podcast episode into: 5 clips, 2 blog posts, 10 tweets, 3 LinkedIn posts, and 1 email newsletter.`,
    sortOrder: 44,
  },
  {
    id: 45, name: "Pricing Psychology Optimizer", description: "Redesign your pricing strategy using behavioral economics to increase revenue without changing your product",
    category: "Sales & Conversion", icon: "DollarSign", color: "amber",
    inputs: [
      { name: "product", type: "text", label: "Product / Service to Optimize", placeholder: "e.g. my web design services / my online course", required: true },
      { name: "current_price", type: "text", label: "Current Price", placeholder: "e.g. $99, $500/month", required: true },
      { name: "goal", type: "select", label: "Pricing Goal", required: false, options: ["Maximize conversions", "Maximize revenue per customer", "Position as premium", "Grow volume", "Reduce price sensitivity"] },
    ],
    outputLabel: "Pricing Optimization Strategy", outputFormat: "markdown",
    aiPrompt: `Optimize the pricing strategy for {product} currently at {current_price} to {goal}.

## PSYCHOLOGICAL PRICING AUDIT
Evaluate current price against 8 pricing psychology principles:
1. Anchoring, 2. Charm pricing, 3. Decoy effect, 4. Price bundling, 5. Payment frequency, 6. Value framing, 7. Social proof pricing, 8. Scarcity/urgency.

## RECOMMENDED PRICE POINT
Optimal price + the reasoning (specific to your market and goal).

## 3-TIER PRICING STRATEGY
Design Good/Better/Best tiers that make the middle option irresistible.

## COPY CHANGES TO REDUCE PRICE RESISTANCE
Specific phrases to add to your sales page, checkout, and pitch that make the price feel smaller.

## A/B TEST PLAN
Exactly what to test, sample size needed, and how to measure.

## PROJECTED REVENUE IMPACT
Conservative and optimistic revenue change from implementing these changes.`,
    sortOrder: 45,
  },
  {
    id: 46, name: "Viral Giveaway & Contest Architect", description: "Design a high-converting viral giveaway campaign that grows your audience and email list fast",
    category: "Traffic & Growth", icon: "Gift", color: "rose",
    inputs: [
      { name: "prize", type: "text", label: "Giveaway Prize", placeholder: "e.g. $500 cash, my full course, 1-hour coaching call", required: true },
      { name: "platform", type: "select", label: "Platform to Run It On", required: false, options: ["Instagram", "Twitter/X", "TikTok", "Facebook", "Email + Social combo"] },
      { name: "goal", type: "select", label: "Primary Goal", required: false, options: ["Grow followers", "Build email list", "Get UGC/testimonials", "Launch a product", "Go viral"] },
    ],
    outputLabel: "Viral Giveaway Campaign", outputFormat: "markdown",
    aiPrompt: `Design a complete viral giveaway campaign for {prize} on {platform} to {goal}.

## CAMPAIGN CONCEPT
- Giveaway name + headline
- Entry mechanics designed for virality (follow + tag + share + email)
- Legal requirements (essential disclaimers)

## ANNOUNCEMENT POST COPY
Full caption with hook, prize reveal, entry instructions, deadline, and urgency. Platform-native.

## 5-DAY HYPE SCHEDULE
Day-by-day content to keep momentum (posts, stories, emails).

## EMAIL COLLECTION STRATEGY
How to funnel entrants to your email list even on social platforms.

## FOLLOW-UP SEQUENCE
Post-giveaway emails to convert entrants into buyers (3-email sequence, full copy).

## PARTNER COLLAB VERSION
How to run a joint giveaway with 3-5 partners to 10x reach.

## WINNER ANNOUNCEMENT
Post copy + DM to winner + follow-up to non-winners (turn losers into buyers with a consolation offer).`,
    sortOrder: 46,
  },
  {
    id: 47, name: "Retargeting & Abandoned Cart Recover", description: "Write complete retargeting ad copy and abandoned cart email sequences to recover lost revenue",
    category: "Sales & Conversion", icon: "RotateCcw", color: "orange",
    inputs: [
      { name: "product", type: "text", label: "Product / Offer", placeholder: "e.g. my $197 online course", required: true },
      { name: "price", type: "text", label: "Price", placeholder: "e.g. $197", required: true },
    ],
    outputLabel: "Recovery Campaign", outputFormat: "markdown",
    aiPrompt: `Create a complete abandoned cart and retargeting recovery system for {product} at {price}.

## ABANDONED CART EMAIL SEQUENCE (3 emails)
- Email 1 (1 hour after abandon): Soft reminder + overcome hesitation. Full copy.
- Email 2 (24 hours): Social proof + address top objection. Full copy.
- Email 3 (72 hours): Last chance + small incentive (bonus or urgency). Full copy.

## RETARGETING AD COPY (Facebook/Instagram)
- Website visitor ad (hasn't seen cart)
- Cart abandoner ad (saw cart, didn't buy)
- Buyer lookalike ad (new cold audience)
For each: 3 creative angles + full primary text + headline.

## SMS RECOVERY (if applicable)
2 SMS messages (under 160 chars each) for cart abandoners who gave phone number.

## RECOVERY INCENTIVE STRATEGY
When to offer a discount vs. a bonus vs. nothing (psychology of each).

## EXPECTED RECOVERY RATE
Industry benchmarks and what to aim for.`,
    sortOrder: 47,
  },
  {
    id: 48, name: "Joint Venture & Partnership Architect", description: "Find ideal JV partners, write partnership proposals, and structure profit-sharing deals",
    category: "Profit Machines", icon: "Handshake", color: "teal",
    inputs: [
      { name: "your_offer", type: "text", label: "Your Product / Service / Audience", placeholder: "e.g. 5k email list of fitness enthusiasts + $97 course", required: true },
      { name: "goal", type: "text", label: "JV Goal", placeholder: "e.g. launch to a bigger audience, grow email list, add revenue stream", required: true },
    ],
    outputLabel: "JV Partnership System", outputFormat: "markdown",
    aiPrompt: `Build a complete joint venture partnership strategy for: {your_offer} to {goal}.

## IDEAL JV PARTNER PROFILE
- Audience size range to target
- Complementary (not competitive) niches to approach
- The mutual value exchange (what you offer them, what they offer you)

## TOP 20 POTENTIAL PARTNER TYPES
Specific categories of partners with examples and why they'd say yes.

## JV OUTREACH EMAIL (full)
Subject + personalized pitch that leads with value to them first.

## PARTNERSHIP STRUCTURES
4 different deal structures (affiliate, revenue share, list swap, bundle) with pros/cons and suggested split percentages.

## JV AGREEMENT ESSENTIALS
What to cover in a partnership agreement (without legal jargon).

## JOINT WEBINAR PITCH DECK
Structure for a co-hosted webinar that sells both partners' offers.`,
    sortOrder: 48,
  },
  {
    id: 49, name: "Personal Brand Audit & Accelerator", description: "Audit your entire personal brand across platforms and get a step-by-step upgrade plan",
    category: "Intelligence", icon: "User", color: "violet",
    inputs: [
      { name: "name", type: "text", label: "Your Name / Brand Name", placeholder: "e.g. Sarah Johnson — Business Coach", required: true },
      { name: "platforms", type: "text", label: "Platforms You're Active On", placeholder: "e.g. Instagram, LinkedIn, YouTube", required: true },
      { name: "goal", type: "text", label: "Brand Goal", placeholder: "e.g. become a recognized expert in my industry, land speaking gigs", required: true },
    ],
    outputLabel: "Brand Audit & Upgrade Plan", outputFormat: "markdown",
    aiPrompt: `Perform a complete personal brand audit and upgrade plan for {name} on {platforms} with goal: {goal}.

## BRAND AUDIT SCORECARD
Rate these 8 elements (1-10 each) with specific actionable notes:
1. Niche clarity, 2. Visual identity, 3. Bio/About copy, 4. Content consistency, 5. Engagement quality, 6. Monetization positioning, 7. SEO/discoverability, 8. Social proof presence.

## TOP 5 QUICK WINS (under 60 minutes each)
Specific changes to make today that will immediately improve brand perception.

## COMPLETE PROFILE REWRITES
Write new optimized versions of:
- Instagram bio
- Twitter/X bio
- LinkedIn headline + about section
- YouTube channel description

## CONTENT DIFFERENTIATION STRATEGY
The one thing {name} should be known for that no one else in their space is owning.

## 90-DAY BRAND ACCELERATION PLAN
Month 1: Foundations. Month 2: Visibility. Month 3: Authority.
Specific weekly actions.`,
    sortOrder: 49,
  },
  {
    id: 50, name: "AI Business Consultant", description: "Get a custom AI-powered business strategy session: diagnose problems, identify opportunities, and get a priority action plan",
    category: "Intelligence", icon: "Brain", color: "indigo",
    inputs: [
      { name: "business", type: "text", label: "Describe Your Business", placeholder: "e.g. I run a Shopify store selling fitness gear, $3k/month, struggling with traffic", required: true },
      { name: "biggest_problem", type: "text", label: "Your Biggest Problem Right Now", placeholder: "e.g. not enough sales, can't scale ads, churn is high", required: true },
      { name: "goal", type: "text", label: "Your 90-Day Goal", placeholder: "e.g. reach $10k/month, get 100 customers, quit my job", required: true },
    ],
    outputLabel: "Business Strategy Report", outputFormat: "markdown",
    aiPrompt: `Act as a $10,000/hour business strategy consultant. Your client says:

Business: {business}
Biggest Problem: {biggest_problem}
90-Day Goal: {goal}

## DIAGNOSIS
What's REALLY causing {biggest_problem} (often it's not what they think). Root cause analysis.

## OPPORTUNITY MAP
Top 3 highest-leverage opportunities you see in their business that they're likely ignoring.

## BRUTAL HONEST ASSESSMENT
What they're doing RIGHT. What they're doing WRONG. What they need to STOP doing immediately.

## PRIORITY ACTION PLAN (30/60/90 days)
**Days 1-30**: The 3 highest-impact actions (specific, not vague)
**Days 31-60**: The next level of growth activities
**Days 61-90**: Scale and systematize

## RESOURCE RECOMMENDATIONS
Specific tools, books, courses, or hires that would have the biggest impact right now.

## THE ONE QUESTION
The most important question they should be asking that they haven't asked yet.`,
    sortOrder: 50,
  },
];

// ─── Seed / Update blocks — idempotent, keyed on sortOrder ──────────────────
async function ensureBlocksSeeded() {
  const existing = await db.select({ sortOrder: automationBlocksTable.sortOrder })
    .from(automationBlocksTable);
  const existingSortOrders = new Set(existing.map((r) => r.sortOrder ?? -1));
  const missing = BUILTIN_BLOCKS.filter((b) => !existingSortOrders.has(b.sortOrder));
  if (missing.length === 0) return;
  for (const block of missing) {
    await db.insert(automationBlocksTable).values({
      name: block.name, description: block.description, category: block.category,
      icon: block.icon, color: block.color, inputs: block.inputs as any,
      outputLabel: block.outputLabel, aiPrompt: block.aiPrompt,
      outputFormat: block.outputFormat, sortOrder: block.sortOrder, isActive: true,
    }).onConflictDoNothing();
  }
}

// ─── AI Execution for a single block step ─────────────────────────────────
async function executeBlock(block: any, config: Record<string, string>, previousOutput: string): Promise<string> {
  let prompt = block.aiPrompt;
  const inputs: Record<string, string> = { ...config };
  if (previousOutput) {
    inputs["previous_output"] = previousOutput;
    if (!prompt.includes("{content}") && !prompt.includes("{previous_output}")) {
      prompt = prompt + `\n\nContext from previous step:\n${previousOutput}`;
    }
  }
  for (const [key, value] of Object.entries(inputs)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  }
  prompt = prompt.replace(/\{[^}]+\}/g, "");

  const messages = [{ role: "user", content: prompt }];
  const { text } = await callAIWithMeta(messages, "", 1200, 0.8, `[Block:${block.name}]`);
  return text;
}

// ─── GET /automations/blocks ───────────────────────────────────────────────
router.get("/automations/blocks", requireAuth, async (req, res) => {
  try {
    await ensureBlocksSeeded();
    const blocks = await db.select().from(automationBlocksTable)
      .where(eq(automationBlocksTable.isActive, true))
      .orderBy(automationBlocksTable.sortOrder);
    const grouped: Record<string, any[]> = {};
    for (const b of blocks) {
      if (!grouped[b.category]) grouped[b.category] = [];
      grouped[b.category].push(b);
    }
    res.json({ blocks, grouped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /automations/tools ────────────────────────────────────────────────
router.get("/automations/tools", requireAuth, async (req: any, res) => {
  try {
    const tools = await db.select().from(automationToolsTable)
      .where(eq(automationToolsTable.userId, req.user.id))
      .orderBy(desc(automationToolsTable.updatedAt));
    res.json({ tools });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /automations/tools ───────────────────────────────────────────────
router.post("/automations/tools", requireAuth, requireFeature("automations"), async (req: any, res) => {
  try {
    const { name, description, category, emoji, steps } = req.body;
    if (!name) res.status(400).json({ error: "Name is required" }); return;
    const [tool] = await db.insert(automationToolsTable).values({
      userId: req.user.id, name, description: description || "", category: category || "content",
      emoji: emoji || "⚡", steps: steps || [],
    }).returning();
    res.json({ tool });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /automations/tools/:id ───────────────────────────────────────────
router.put("/automations/tools/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, category, emoji, steps } = req.body;
    const [tool] = await db.update(automationToolsTable)
      .set({ name, description, category, emoji, steps: steps || [], updatedAt: new Date() })
      .where(and(eq(automationToolsTable.id, id), eq(automationToolsTable.userId, req.user.id)))
      .returning();
    if (!tool) res.status(404).json({ error: "Tool not found" }); return;
    res.json({ tool });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /automations/tools/:id ────────────────────────────────────────
router.delete("/automations/tools/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(automationToolsTable)
      .where(and(eq(automationToolsTable.id, id), eq(automationToolsTable.userId, req.user.id)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /automations/tools/:id/run ──────────────────────────────────────
router.post("/automations/tools/:id/run", requireAuth, requireFeature("automations"), async (req: any, res) => {
  const toolId = parseInt(req.params.id);
  const startTime = Date.now();
  let runId: number | null = null;
  try {
    const [tool] = await db.select().from(automationToolsTable).where(eq(automationToolsTable.id, toolId)).limit(1);
    if (!tool) res.status(404).json({ error: "Tool not found" }); return;

    const isOwner = tool.userId === req.user.id;
    if (!isOwner) {
      const [install] = await db.select().from(automationInstallsTable)
        .where(and(eq(automationInstallsTable.toolId, toolId), eq(automationInstallsTable.userId, req.user.id))).limit(1);
      if (!install) res.status(403).json({ error: "You don't own or have installed this tool" }); return;
    }

    const [run] = await db.insert(automationRunsTable).values({
      toolId, userId: req.user.id, status: "running", inputs: req.body.inputs || {},
    }).returning();
    runId = run.id;

    await ensureBlocksSeeded();
    const allBlocks = await db.select().from(automationBlocksTable);
    const blockMap = Object.fromEntries(allBlocks.map((b) => [b.id, b]));

    const steps: any[] = Array.isArray(tool.steps) ? (tool.steps as any[]) : [];
    const stepOutputs: any[] = [];
    let previousOutput = "";
    let finalOutput = "";

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const block = blockMap[step.blockId];
      if (!block) continue;
      const config = { ...(step.config || {}), ...(req.body.inputs?.[step.id] || {}) };
      const output = await executeBlock(block, config, previousOutput);
      stepOutputs.push({ stepIndex: i, blockId: step.blockId, blockName: block.name, output, config });
      previousOutput = output;
      finalOutput = output;
    }

    const duration = Date.now() - startTime;
    await db.update(automationRunsTable).set({
      status: "success", stepOutputs, finalOutput, duration, completedAt: new Date(),
    }).where(eq(automationRunsTable.id, runId!));

    await db.update(automationToolsTable)
      .set({ runCount: sql`${automationToolsTable.runCount} + 1`, lastRunAt: new Date() })
      .where(eq(automationToolsTable.id, toolId));

    res.json({ run: { ...run, status: "success", stepOutputs, finalOutput, duration } });
  } catch (err: any) {
    if (runId) {
      await db.update(automationRunsTable).set({
        status: "failed", error: err.message, completedAt: new Date(),
      }).where(eq(automationRunsTable.id, runId));
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /automations/runs ────────────────────────────────────────────────
router.get("/automations/runs", requireAuth, async (req: any, res) => {
  try {
    const toolId = req.query.toolId ? parseInt(req.query.toolId as string) : undefined;
    let query = db.select({
      run: automationRunsTable,
      toolName: automationToolsTable.name,
      toolEmoji: automationToolsTable.emoji,
    }).from(automationRunsTable)
      .leftJoin(automationToolsTable, eq(automationRunsTable.toolId, automationToolsTable.id))
      .where(eq(automationRunsTable.userId, req.user.id))
      .orderBy(desc(automationRunsTable.startedAt))
      .limit(50);
    const runs = await query;
    res.json({ runs: runs.map(r => ({ ...r.run, toolName: r.toolName, toolEmoji: r.toolEmoji })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /automations/tools/:id/publish ──────────────────────────────────
router.post("/automations/tools/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { marketplaceTitle, marketplaceDescription, marketplaceTags, price } = req.body;
    if (!marketplaceTitle || !marketplaceDescription) {
      res.status(400).json({ error: "Title and description required for marketplace listing" }); return;
    }
    const [tool] = await db.update(automationToolsTable).set({
      isPublished: true, marketplaceTitle, marketplaceDescription,
      marketplaceTags: marketplaceTags || [], price: price || "0", updatedAt: new Date(),
    }).where(and(eq(automationToolsTable.id, id), eq(automationToolsTable.userId, req.user.id))).returning();
    if (!tool) res.status(404).json({ error: "Tool not found" }); return;
    res.json({ tool, message: "Your tool is now live in the marketplace!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /automations/tools/:id/unpublish ─────────────────────────────────
router.post("/automations/tools/:id/unpublish", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(automationToolsTable).set({ isPublished: false, updatedAt: new Date() })
      .where(and(eq(automationToolsTable.id, id), eq(automationToolsTable.userId, req.user.id)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /automations/marketplace ─────────────────────────────────────────
router.get("/automations/marketplace", requireAuth, requireFeature("automation_marketplace"), async (req: any, res) => {
  try {
    const tools = await db.select({
      tool: automationToolsTable,
      creatorName: usersTable.name,
    }).from(automationToolsTable)
      .leftJoin(usersTable, eq(automationToolsTable.userId, usersTable.id))
      .where(eq(automationToolsTable.isPublished, true))
      .orderBy(desc(automationToolsTable.installCount))
      .limit(50);

    const installs = await db.select({ toolId: automationInstallsTable.toolId })
      .from(automationInstallsTable).where(eq(automationInstallsTable.userId, req.user.id));
    const installedIds = new Set(installs.map(i => i.toolId));

    const result = tools.map(t => ({
      ...t.tool, creatorName: t.creatorName,
      isInstalled: installedIds.has(t.tool.id) || t.tool.userId === req.user.id,
      isOwn: t.tool.userId === req.user.id,
    }));
    res.json({ tools: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /automations/marketplace/:id/install ────────────────────────────
router.post("/automations/marketplace/:id/install", requireAuth, requireFeature("automations"), async (req: any, res) => {
  try {
    const toolId = parseInt(req.params.id);
    const [tool] = await db.select().from(automationToolsTable).where(eq(automationToolsTable.id, toolId)).limit(1);
    if (!tool || !tool.isPublished) res.status(404).json({ error: "Tool not found" }); return;
    if (tool.userId === req.user.id) res.status(400).json({ error: "You cannot install your own tool" }); return;

    const existing = await db.select().from(automationInstallsTable)
      .where(and(eq(automationInstallsTable.toolId, toolId), eq(automationInstallsTable.userId, req.user.id))).limit(1);
    if (existing.length > 0) res.status(400).json({ error: "Already installed" }); return;

    const price = parseFloat(tool.price as string) || 0;
    if (price > 0) {
      const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
      const balance = parseFloat((buyer as any).walletBalance ?? "0");
      if (balance < price) res.status(400).json({ error: "Insufficient wallet balance" }); return;

      await db.update(usersTable).set({ walletBalance: (balance - price).toFixed(2) } as any).where(eq(usersTable.id, req.user.id));
      const creatorBalance = parseFloat(((await db.select().from(usersTable).where(eq(usersTable.id, tool.userId)).limit(1))[0] as any)?.walletBalance ?? "0");
      const platformFee = price * 0.2;
      const creatorEarning = price - platformFee;
      await db.update(usersTable).set({ walletBalance: (creatorBalance + creatorEarning).toFixed(2) } as any).where(eq(usersTable.id, tool.userId));
      await db.insert(walletTransactionsTable).values({ userId: req.user.id, amount: (-price).toFixed(2) as any, type: "purchase", description: `Purchased automation tool: ${tool.marketplaceTitle || tool.name}` } as any);
      await db.insert(walletTransactionsTable).values({ userId: tool.userId, amount: creatorEarning.toFixed(2) as any, type: "sale", description: `Tool sale: ${tool.marketplaceTitle || tool.name}` } as any);
      await db.update(automationToolsTable).set({ totalRevenue: sql`${automationToolsTable.totalRevenue} + ${creatorEarning}` }).where(eq(automationToolsTable.id, toolId));
    }

    await db.insert(automationInstallsTable).values({ userId: req.user.id, toolId, pricePaid: price.toFixed(2) as any });
    await db.update(automationToolsTable).set({ installCount: sql`${automationToolsTable.installCount} + 1` }).where(eq(automationToolsTable.id, toolId));

    res.json({ success: true, message: price > 0 ? `Tool purchased for $${price.toFixed(2)}!` : "Tool installed for free!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /automations/installed ───────────────────────────────────────────
router.get("/automations/installed", requireAuth, async (req: any, res) => {
  try {
    const installs = await db.select({
      install: automationInstallsTable,
      tool: automationToolsTable,
      creatorName: usersTable.name,
    }).from(automationInstallsTable)
      .leftJoin(automationToolsTable, eq(automationInstallsTable.toolId, automationToolsTable.id))
      .leftJoin(usersTable, eq(automationToolsTable.userId, usersTable.id))
      .where(eq(automationInstallsTable.userId, req.user.id));
    res.json({ installs: installs.map(i => ({ ...i.tool, installDate: i.install.installedAt, pricePaid: i.install.pricePaid, creatorName: i.creatorName })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /automations/tools/:id/schedule ─────────────────────────────────
router.post("/automations/tools/:id/schedule", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isScheduled, scheduleFrequency } = req.body;
    const [tool] = await db.update(automationToolsTable).set({
      isScheduled: !!isScheduled,
      scheduleFrequency: isScheduled ? (scheduleFrequency || "daily") : null,
      updatedAt: new Date(),
    }).where(and(eq(automationToolsTable.id, id), eq(automationToolsTable.userId, req.user.id))).returning();
    if (!tool) res.status(404).json({ error: "Tool not found" }); return;
    res.json({ tool, message: isScheduled ? `Automation scheduled to run ${scheduleFrequency || "daily"}!` : "Automation schedule removed." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /automations/scheduled ────────────────────────────────────────────
router.get("/automations/scheduled", requireAuth, async (req: any, res) => {
  try {
    const tools = await db.select().from(automationToolsTable)
      .where(and(eq(automationToolsTable.userId, req.user.id), eq(automationToolsTable.isScheduled, true)));
    res.json({ tools });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /automations/stats ───────────────────────────────────────────────
router.get("/automations/stats", requireAuth, async (req: any, res) => {
  try {
    const tools = await db.select().from(automationToolsTable).where(eq(automationToolsTable.userId, req.user.id));
    const runs = await db.select().from(automationRunsTable).where(eq(automationRunsTable.userId, req.user.id));
    const published = tools.filter(t => t.isPublished);
    const totalRevenue = tools.reduce((sum, t) => sum + parseFloat(t.totalRevenue as string || "0"), 0);
    const successRuns = runs.filter(r => r.status === "success").length;
    res.json({
      totalTools: tools.length, publishedTools: published.length,
      totalRuns: runs.length, successRuns, totalRevenue: totalRevenue.toFixed(2),
      totalInstalls: published.reduce((sum, t) => sum + t.installCount, 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
