import type { SellabilityOutput } from "./sellability";
import type { ArchitectOutput } from "./architect";
import type { ResearchOutput } from "./research";
import { HOOKS, CLOSINGS, POWER_PHRASES } from "../vocabulary";

export interface SalesCopy {
  headline: string;
  subheadline: string;
  heroStatement: string;
  bulletPoints: string[];
  socialProofSection: string;
  guarantee: string;
  callToAction: string;
  fullSalesPage: string;
}

export interface EmailMessage {
  subject: string;
  previewText: string;
  body: string;
  purpose: string;
}

export interface SocialPost {
  platform: string;
  post: string;
  hashtags: string[];
  bestTimeToPost: string;
}

export interface AdCopy {
  variant: string;
  format: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  targetAudience: string;
}

export interface MarketingOutput {
  salesCopy: SalesCopy;
  emailSequence: { email1: EmailMessage; email2: EmailMessage; email3: EmailMessage };
  socialPosts: SocialPost[];
  adCopy: AdCopy[];
  youtubeVideo: { title: string; hook: string; outline: string; thumbnail: string };
  landingSections: { name: string; purpose: string; content: string }[];
  promoAssets: { type: string; content: string }[];
}

function buildBulletPoints(research: ResearchOutput, sellability: SellabilityOutput): string[] {
  const desires = research.audienceProfile.desires;
  const painPoints = research.audienceProfile.painPoints;
  const bonuses = sellability.bonusIdeas.slice(0, 3);

  return [
    `**Discover** the single most important shift that separates people who get results from people who stay stuck — and exactly how to make it (Chapter 2)`,
    `**Why** the standard approach to this keeps you exactly where you are — and the counterintuitive method that actually works (Chapter 1)`,
    `**The complete framework** for ${desires[0] ?? "getting real, lasting results"} — without willpower, motivation tricks, or starting over`,
    `**How to** ${desires[1] ?? "build a system that compounds"} — even if you've tried every other approach and failed`,
    `**The exact steps** to take in your first 7 days — no guesswork, no overwhelm, just a clear sequence that works`,
    `**Why** most people fail at this — and how to make sure you're not one of them (the answer will surprise you)`,
    `**BONUS:** ${bonuses[0]?.title ?? "Quick-Start Checklist"} — ${bonuses[0]?.description ?? "immediate action plan included"}`,
    `**BONUS:** ${bonuses[1]?.title ?? "Implementation Workbook"} — ${bonuses[1]?.description ?? "companion exercises included"}`,
    `**100% risk-free** — if this doesn't deliver everything it promises, get a full refund. No questions, no hassle.`,
  ];
}

function buildSalesPage(
  title: string,
  headline: string,
  subheadline: string,
  hero: string,
  bullets: string[],
  research: ResearchOutput,
  sellability: SellabilityOutput
): string {
  const price = sellability.pricingRecommendation.recommendedPrice;
  const audience = research.audienceProfile.primaryDescription;
  const painPoint = research.audienceProfile.painPoints[0];
  const desire = research.audienceProfile.desires[0];
  const uvp = sellability.improvedUVP;

  return `# ${headline}

## ${subheadline}

---

${hero}

---

### If you're ${audience}, you already know this feeling:

${painPoint.charAt(0).toUpperCase() + painPoint.slice(1)}.

You've tried the advice. You've watched the videos. You've read the articles. And something still isn't clicking.

**Here's the thing nobody tells you:** it's not your fault. The problem isn't effort. It's framework.

---

### Introducing: *${title}*

${uvp}

---

### Here's exactly what you get:

${bullets.map(b => `✓ ${b}`).join("\n\n")}

---

### The bottom line:

**${desire.charAt(0).toUpperCase() + desire.slice(1)}** is possible. This system is how.

---

### What happens if you don't?

The cost of staying where you are isn't zero. Every week without the right framework is a week further from ${desire}. The gap doesn't close on its own.

---

### Get instant access today: **$${price}**

*${sellability.urgencyElements[0]}*

[GET INSTANT ACCESS →]

---

### Guarantee:

${sellability.pricingRecommendation.reasoning.includes("quality") ? "This is built on a quality foundation." : "This is built on a proven framework."} But if you read it, apply it, and don't get results — get every dollar back. No questions, no explanations required.

[GET INSTANT ACCESS →]`;
}

function buildEmailSequence(
  title: string,
  research: ResearchOutput,
  sellability: SellabilityOutput
): MarketingOutput["emailSequence"] {
  const price = sellability.pricingRecommendation.recommendedPrice;
  const pain = research.audienceProfile.painPoints[0];
  const desire = research.audienceProfile.desires[0];
  const contrarianAngle = research.uniqueAngles[0] ?? "the conventional approach is actually the problem";

  return {
    email1: {
      subject: `The ${research.audienceProfile.demographicHint.split(",")[0]} problem nobody's talking about honestly`,
      previewText: `This one thing is probably why it hasn't worked yet`,
      body: `I want to be direct with you today.

The reason most people struggle with this topic isn't lack of effort, lack of information, or lack of motivation.

It's ${pain}.

And here's the uncomfortable truth: most of the advice out there is designed for people who don't have this problem.

${contrarianAngle.charAt(0).toUpperCase() + contrarianAngle.slice(1)}.

I've spent a lot of time thinking about this. The people who actually get results share one thing: they addressed the right layer of the problem.

Tomorrow, I'm going to share exactly what that looks like in practice.

— [Name]

P.S. I'm launching something specifically designed for this. More on that tomorrow.`,
      purpose: "Awareness email — surfaces the pain, builds anticipation, establishes the specific problem the product solves",
    },
    email2: {
      subject: `Here's what actually works (and why everything else doesn't)`,
      previewText: `The specific mechanism most resources miss`,
      body: `Yesterday I talked about why ${pain} is the core issue.

Today I want to show you what actually changes it.

It comes down to this: ${research.coreFrameworks[0]?.keyPrinciple ?? "sustainable results require addressing the right layer, not just adding more tactics"}.

Most resources skip this. They give you the tactics without the foundation. Which is like building a house starting with the roof.

The people who consistently get results approach it differently. They start with ${research.coreFrameworks[0]?.concept ?? "the underlying principle"} — and let the tactics follow from there.

That's exactly what I built into *${title}*.

It's a complete system that does exactly this — structured, practical, and designed for ${desire}.

Tomorrow, I'm going to share the full details (including the price, the bonuses, and the launch offer).

If you want to be first to know: [LINK]

— [Name]`,
      purpose: "Value email — delivers the core insight, builds desire, soft-launches the product",
    },
    email3: {
      subject: `[OPEN] ${title} is live — launch pricing ends soon`,
      previewText: `${sellability.urgencyElements[0].slice(0, 60)}`,
      body: `It's here.

*${title}* is now available — and I want to get this in front of you before the launch window closes.

Here's what you're getting:

${research.coreFrameworks.slice(0, 3).map(f => `→ ${f.name}: ${f.keyPrinciple}`).join("\n")}

Plus: ${sellability.bonusIdeas.slice(0, 2).map(b => b.title).join(", ")} — included at no extra cost for launch buyers.

The price right now is **$${price}**.

${sellability.urgencyElements[0]}

[GET INSTANT ACCESS → $${price}]

And if it doesn't deliver: full refund. No questions.

The framework is real. The results are real. The only question is whether you're ready to use it.

— [Name]

P.S. If you have any questions before buying, just reply to this email. I read every response.`,
      purpose: "Sales email — direct pitch with urgency, full offer details, and risk reversal",
    },
  };
}

function buildSocialPosts(title: string, research: ResearchOutput): SocialPost[] {
  const pain = research.audienceProfile.painPoints[0];
  const desire = research.audienceProfile.desires[0];
  const truth = research.keyStatements[0];
  const contrarian = research.uniqueAngles[0];

  return [
    {
      platform: "LinkedIn",
      post: `Hot take: ${contrarian ?? `the conventional advice about this topic is actively keeping people stuck`}.

I've spent time studying the people who actually get results vs. the ones who stay stuck — and the difference is almost never what people think it is.

It's not effort. It's not talent. It's not motivation.

It's ${truth?.slice(0, 100) ?? "a specific framework shift that most resources never address"}.

I wrote a full breakdown of exactly how this works — including the specific system I use — in *${title}*.

Link in comments if you want to see it.`,
      hashtags: ["#productivity", "#selfimprovement", "#mindset", "#results"],
      bestTimeToPost: "Tuesday or Wednesday, 8-10am or 12-1pm",
    },
    {
      platform: "Instagram / Facebook",
      post: `The reason you're ${pain.slice(0, 60)} isn't what you think.

It's not motivation. It's not information. It's not even effort.

It's the framework you're using — specifically, the layer it's operating on.

The people who get results in this area consistently start somewhere different. They address the foundation before the tactics. The identity before the behavior. The principle before the steps.

*${title}* is built on exactly this insight.

Read the caption for the link 👇`,
      hashtags: ["#selfimprovement", "#mindset", "#motivation", "#growth", "#success"],
      bestTimeToPost: "Wednesday-Friday, 11am-1pm or 7-9pm",
    },
    {
      platform: "Twitter / X",
      post: `Unpopular opinion: the reason most people can't ${desire.slice(0, 50)} isn't lack of effort.

It's that they're optimizing the wrong layer.

Thread on what actually works 🧵`,
      hashtags: [],
      bestTimeToPost: "Monday-Thursday, 9am-12pm",
    },
    {
      platform: "YouTube Community",
      post: `I just finished something I've been building for a while — *${title}*.

It's a complete system for ${desire} — structured as a guide you can work through at your own pace, with exercises and templates included.

Everything that normally gets skipped in the free content is in here.

Link in description. Let me know if you have questions.`,
      hashtags: [],
      bestTimeToPost: "Same time as channel video upload day",
    },
    {
      platform: "Email Newsletter Promo",
      post: `Quick note to my list:

*${title}* is now available.

If you've been following along, you already know what this is about. It's the complete system, not the highlights.

Launch price is $${47}. Goes up after [date].

[LINK]`,
      hashtags: [],
      bestTimeToPost: "Send Tuesday morning, 8-9am local time",
    },
  ];
}

function buildAdCopy(title: string, research: ResearchOutput, sellability: SellabilityOutput): AdCopy[] {
  const price = sellability.pricingRecommendation.recommendedPrice;
  const pain = research.audienceProfile.painPoints[0];
  const desire = research.audienceProfile.desires[0];

  return [
    {
      variant: "Problem-Aware",
      format: "Feed Ad",
      headline: `Why ${pain.slice(0, 50)} (and what to do instead)`,
      primaryText: `Most people trying to solve this problem are working on the wrong layer. The tactics aren't the issue — the framework is. *${title}* fixes that. Complete system, immediate download. $${price}.`,
      callToAction: "Learn More",
      targetAudience: research.audienceProfile.demographicHint,
    },
    {
      variant: "Desire-Led",
      format: "Feed Ad",
      headline: `How to ${desire.slice(0, 55)}`,
      primaryText: `This isn't another collection of tips. It's a complete, structured system for ${desire} — built on frameworks that compound over time. *${title}* — $${price}, instant access.`,
      callToAction: "Get Access",
      targetAudience: `${research.audienceProfile.demographicHint} interested in self-improvement`,
    },
    {
      variant: "Contrarian Hook",
      format: "Video / Story Ad",
      headline: `Stop doing this with ${title.split(":")[0].replace("The ", "").split(" ").slice(0, 3).join(" ")}`,
      primaryText: `${research.uniqueAngles[0] ?? "The conventional approach is actually the problem"}. Here's what the research shows actually works — and the complete system to apply it. $${price}.`,
      callToAction: "See Inside",
      targetAudience: `People who've tried multiple resources on this topic without lasting results`,
    },
  ];
}

export function runMarketingEngine(
  topic: string,
  architect: ArchitectOutput,
  research: ResearchOutput,
  sellability: SellabilityOutput
): MarketingOutput {
  const title = sellability.revisedTitle;
  const headline = `Finally: A Complete System for ${research.audienceProfile.desires[0].charAt(0).toUpperCase() + research.audienceProfile.desires[0].slice(1)}`;
  const subheadline = `Introducing *${title}* — the framework that addresses what every other resource skips`;
  const hero = `You already know ${topic} matters. What you might not have is a system that actually works, consistently, without requiring constant willpower and motivation. That changes today.`;
  const bullets = buildBulletPoints(research, sellability);
  const fullSalesPage = buildSalesPage(title, headline, subheadline, hero, bullets, research, sellability);

  const hook = HOOKS.youtube ? HOOKS.youtube[topic.length % HOOKS.youtube.length] : "";
  const youtubeOutline = [
    `[0:00-0:30] Hook: ${hook.replace("{TOPIC}", topic).slice(0, 100)}`,
    `[0:30-2:00] The problem: why ${research.audienceProfile.painPoints[0]} keeps happening`,
    `[2:00-4:00] The counterintuitive insight: ${research.uniqueAngles[0] ?? "what actually changes this"}`,
    `[4:00-7:00] The framework: ${research.coreFrameworks[0]?.name ?? "the core system"}`,
    `[7:00-9:00] How to apply it: the first three steps`,
    `[9:00-10:00] Where to go deeper: *${title}* — link in description`,
  ].join("\n");

  return {
    salesCopy: {
      headline,
      subheadline,
      heroStatement: hero,
      bulletPoints: bullets,
      socialProofSection: `"[Beta reader testimonial about specific result achieved]" — [Name, demographic]`,
      guarantee: "30-day complete satisfaction guarantee. If you read it and apply it and don't see a shift — every dollar back, no questions.",
      callToAction: `Get Instant Access to *${title}* →`,
      fullSalesPage,
    },
    emailSequence: buildEmailSequence(title, research, sellability),
    socialPosts: buildSocialPosts(title, research),
    adCopy: buildAdCopy(title, research, sellability),
    youtubeVideo: {
      title: `The Truth About ${topic} That Nobody Talks About Honestly`,
      hook: hook.replace("{TOPIC}", topic),
      outline: youtubeOutline,
      thumbnail: `Text: "The ${topic} Truth" — Split image showing struggle vs. result. High contrast, minimal text, faces if possible.`,
    },
    landingSections: [
      { name: "Hero Section", purpose: "Capture attention and communicate the promise", content: `${headline}\n\n${subheadline}` },
      { name: "Problem Section", purpose: "Create resonance by naming the pain precisely", content: `You've tried the advice. You've put in the effort. Something still isn't clicking.\n\nHere's what's actually happening: ${research.uniqueAngles[0]}` },
      { name: "Solution Introduction", purpose: "Bridge from problem to your product as the solution", content: `*${title}* is built specifically to address this — not with more information, but with the right framework applied to the right layer.` },
      { name: "What You Get", purpose: "Convert interest into desire with specific deliverables", content: bullets.join("\n") },
      { name: "Social Proof", purpose: "Build trust through evidence", content: sellability.socialProofOpportunities[0] },
      { name: "Pricing & CTA", purpose: "Convert desire into purchase decision", content: `$${sellability.pricingRecommendation.recommendedPrice} — instant access\n\n${sellability.urgencyElements[0]}\n\n[GET ACCESS →]` },
      { name: "FAQ / Objection Handling", purpose: "Remove final hesitation before purchase", content: `Q: ${research.faqs[1]?.question ?? "Is this right for me?"}\nA: ${research.faqs[1]?.answer?.slice(0, 200) ?? "If you're [demographic], yes."}` },
      { name: "Guarantee", purpose: "Eliminate purchase risk", content: "30-day full refund guarantee — no questions, no forms, no explanations required." },
    ],
    promoAssets: [
      { type: "Short promo email (100 words)", content: `Quick note — *${title}* is live. It's a complete system for ${research.audienceProfile.desires[0]}. If you've been waiting for the version that actually works — this is it. Launch price: $${sellability.pricingRecommendation.recommendedPrice}. [LINK]` },
      { type: "Social story script (15 sec)", content: `[Text on screen]: "Still stuck on ${topic}? The problem isn't effort — it's framework." [Swipe up] → *${title}* — complete system, $${sellability.pricingRecommendation.recommendedPrice}` },
      { type: "One-line pitch", content: `*${title}* — the complete system for ${research.audienceProfile.desires[0].slice(0, 60)}, built on frameworks that actually compound. $${sellability.pricingRecommendation.recommendedPrice}.` },
    ],
  };
}
