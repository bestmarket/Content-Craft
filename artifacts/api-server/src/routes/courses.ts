import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, productsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callGeminiFallback, generateProductCoverImage } from "./ai-utils";
import { logger } from "../lib/logger";

const router = Router();

const COURSE_SYSTEM = `You are a world-class online course creator, educator, and digital product strategist with 20+ years of experience creating 7-figure online courses. You create deeply valuable, premium-quality course content that genuinely transforms students' lives.

Your courses are:
- Packed with real, actionable, high-value information (not fluff)
- Written in an engaging, clear, mentor-like voice
- Structured for maximum comprehension and retention
- Priced at premium levels because they deliver premium results

You never write filler content. Every sentence earns its place.`;

async function generateFullCourse(topic: string, category: string, difficulty: string, targetAudience: string): Promise<any> {
  const audienceNote = targetAudience ? `Target audience: ${targetAudience}` : "";
  const difficultyNote = difficulty === "beginner" ? "absolute beginners with no prior knowledge" : difficulty === "intermediate" ? "people with some foundational knowledge" : "advanced practitioners looking to master the subject";

  const prompt = `Create a COMPLETE, premium-quality online text course on: "${topic}"

Category: ${category}
Difficulty level: ${difficulty} (designed for ${difficultyNote})
${audienceNote}

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):

{
  "title": "compelling course title",
  "subtitle": "powerful one-line value proposition",
  "sellabilityScore": 92,
  "price": 97,
  "originalPrice": 197,
  "category": "${category}",
  "targetAudience": "clear description of who this is for",
  "courseData": {
    "welcomeMessage": "2-3 paragraph warm, personal welcome from the instructor setting expectations and building excitement",
    "courseOverview": "3-4 paragraph compelling overview of what this course covers and the transformation it creates",
    "whoIsThisFor": ["specific person 1", "specific person 2", "specific person 3", "specific person 4"],
    "whatYouWillLearn": ["specific skill/outcome 1", "specific skill/outcome 2", "specific skill/outcome 3", "specific skill/outcome 4", "specific skill/outcome 5", "specific skill/outcome 6"],
    "modules": [
      {
        "id": "m1",
        "number": 1,
        "title": "Module 1: [Compelling Title]",
        "description": "2-3 sentence module overview",
        "moduleGoal": "clear, specific goal students achieve by completing this module",
        "lessons": [
          {
            "id": "m1l1",
            "number": 1,
            "title": "Lesson 1: [Engaging Title]",
            "duration": "12 min read",
            "content": "FULL lesson content — minimum 500 words of rich, valuable, actionable content. Write like a top expert teaching their best student. Include real examples, frameworks, and insights. Use paragraphs, not bullet points for the main content.",
            "keyTakeaways": ["specific takeaway 1", "specific takeaway 2", "specific takeaway 3"],
            "actionStep": "One specific action the student takes immediately after this lesson",
            "proTip": "An advanced insight or shortcut that separates experts from beginners"
          }
        ],
        "quiz": [
          {
            "question": "Quiz question testing real understanding",
            "options": ["Wrong answer A", "Wrong answer B", "Correct answer C", "Wrong answer D"],
            "correctIndex": 2,
            "explanation": "Why this is correct and what it means for practice"
          }
        ]
      }
    ],
    "bonusResources": ["Bonus resource 1 description", "Bonus resource 2 description", "Bonus resource 3 description"],
    "finalMessage": "2-3 paragraph inspirational closing message encouraging students to take action and apply what they've learned",
    "certificateText": "This certifies that [Student Name] has successfully completed [Course Title] and demonstrated mastery of [key skills]"
  },
  "landingPageData": {
    "headline": "Bold, benefit-driven headline (8-12 words)",
    "subheadline": "Compelling subheadline expanding on the promise",
    "heroStatement": "2-3 sentence powerful opening that speaks directly to the reader's pain and desire",
    "painPoints": ["frustration 1 the reader faces", "frustration 2", "frustration 3"],
    "transformation": "The specific before → after transformation this course creates",
    "whatYouGet": ["specific deliverable 1", "specific deliverable 2", "specific deliverable 3", "specific deliverable 4", "specific deliverable 5"],
    "whoBenefits": ["person type 1", "person type 2", "person type 3"],
    "testimonials": [
      {"name": "Sarah M.", "role": "Marketing Manager", "text": "Specific, detailed testimonial about real results. Quote should be 2-3 sentences with specific outcomes.", "rating": 5},
      {"name": "James T.", "role": "Entrepreneur", "text": "Another specific testimonial with real outcomes and emotional impact.", "rating": 5},
      {"name": "Lisa R.", "role": "Freelancer", "text": "Third testimonial showing different type of result or use case.", "rating": 5}
    ],
    "valueStack": [
      {"item": "Main course access", "value": "$197"},
      {"item": "Bonus resource 1", "value": "$97"},
      {"item": "Bonus resource 2", "value": "$47"},
      {"item": "Lifetime updates", "value": "$97"}
    ],
    "guarantee": "30-day money-back guarantee statement",
    "faq": [
      {"q": "Common objection 1", "a": "Persuasive answer that overcomes the objection"},
      {"q": "Common objection 2", "a": "Persuasive answer"},
      {"q": "Common objection 3", "a": "Persuasive answer"},
      {"q": "Common objection 4", "a": "Persuasive answer"}
    ],
    "cta": "Enroll Now — Get Instant Access",
    "urgencyText": "Enrollment closes soon — secure your spot now"
  },
  "marketingData": {
    "facebookAds": [
      {
        "variant": "Curiosity Hook",
        "headline": "Short punchy headline",
        "primaryText": "Full FB ad copy (3-4 paragraphs) that stops the scroll, agitates the pain, presents the solution, and drives clicks. Write like a top copywriter.",
        "cta": "Learn More"
      },
      {
        "variant": "Problem-Solution",
        "headline": "Problem-focused headline",
        "primaryText": "Alternative FB ad copy with different angle",
        "cta": "Get Instant Access"
      },
      {
        "variant": "Social Proof",
        "headline": "Results-focused headline",
        "primaryText": "Social proof heavy ad copy",
        "cta": "Join Now"
      }
    ],
    "facebookGroupPost": "Full Facebook group post (not ad) that provides genuine value, builds authority, and naturally leads to the course. Include the viral tip format: 💡 'Want to [achieve result] today? [Specific action]. [Link placeholder]'",
    "tiktokScript": "Complete TikTok script (60-90 seconds when read aloud). Format: HOOK (first 3 seconds to stop scroll) | PROBLEM (10 sec) | SOLUTION TEASE (10 sec) | VALUE BOMB (20 sec of actual useful info) | CTA (10 sec). Include on-screen text suggestions in [brackets].",
    "youtubeShortScript": "Complete YouTube Shorts script (under 60 seconds). Hook-heavy, fast-paced, ends with strong CTA to course link.",
    "youtubeLongScript": "Complete YouTube long-form video script (1500-2000 words). Intro hook, context, 3-5 main teaching points with real depth, examples, outro CTA. This is a full educational video that drives course sales.",
    "instagramCaption": "Instagram caption with strong hook, value, and CTA. Include relevant hashtags at the end.",
    "emailSequence": [
      {
        "subject": "Compelling email subject line",
        "preview": "Preview text",
        "body": "Full email body (400-600 words). Engaging story-based opening, value delivery, soft pitch to course."
      },
      {
        "subject": "Follow-up email subject",
        "preview": "Preview text",
        "body": "Second email — more direct pitch, handle objections, testimonials, CTA."
      },
      {
        "subject": "Final urgency email subject",
        "preview": "Preview text",
        "body": "Final email — urgency, last chance, strong CTA."
      }
    ],
    "viralTip": "💡 [Specific actionable tip related to the course topic that someone can use RIGHT NOW — 2-3 sentences of genuine value]. Copy this, post it on TikTok/Shorts with a background video, and paste your course checkout link in bio!",
    "launchChecklist": [
      "Set up your product page with the generated landing page copy",
      "Post the Facebook Group post in 3-5 relevant groups",
      "Record the TikTok script with a simple background video",
      "Email your list with the 3-email sequence",
      "Post the Instagram caption with the product image",
      "Reply to every comment in the first 24 hours",
      "Go live on Facebook/Instagram for 15 minutes sharing one lesson from the course",
      "Create a Pinterest pin linking to the landing page",
      "Add course link to your social media bios"
    ]
  }
}

REQUIREMENTS:
- Minimum 5 modules, minimum 3 lessons per module (15+ lessons total)
- Each lesson MUST have minimum 400 words of real, valuable content
- All content must be specific to "${topic}" — no generic filler
- Marketing copy must be compelling, emotional, and conversion-focused
- Write as a genuine expert who knows this topic deeply`;

  const result = await callGeminiFallback(
    [{ role: "user", content: prompt }],
    COURSE_SYSTEM,
    65536,
    "course_generator",
  );

  if (!result?.text) return null;

  let raw = result.text.trim();
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) raw = jsonMatch[1].trim();
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) raw = raw.slice(firstBrace, lastBrace + 1);

  return JSON.parse(raw);
}

router.get("/courses", requireAuth, async (req: any, res) => {
  try {
    const courses = await db.select().from(coursesTable)
      .where(eq(coursesTable.userId, req.userId))
      .orderBy(desc(coursesTable.createdAt))
      .limit(50);
    res.json({ courses });
  } catch (err: any) {
    logger.error({ err }, "List courses error");
    res.status(500).json({ error: "Failed to load courses" });
  }
});

router.post("/courses", requireAuth, async (req: any, res) => {
  try {
    const { topic, category = "education", difficulty = "beginner", targetAudience = "" } = req.body;
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      res.status(400).json({ error: "Topic is required (min 3 characters)" });
      return;
    }

    const [course] = await db.insert(coursesTable).values({
      userId: req.userId,
      title: topic.trim(),
      topic: topic.trim(),
      category,
      difficulty,
      targetAudience,
      stage: "building",
      price: "97.00",
    }).returning();

    res.json({ success: true, course });

    setImmediate(async () => {
      try {
        const generated = await generateFullCourse(topic.trim(), category, difficulty, targetAudience);

        if (!generated) {
          await db.update(coursesTable).set({
            stage: "failed",
            errorMessage: "AI generation returned no content",
            updatedAt: new Date(),
          }).where(eq(coursesTable.id, course.id));
          return;
        }

        const modules: any[] = generated.courseData?.modules ?? [];
        const lessonCount = modules.reduce((s: number, m: any) => s + (m.lessons?.length ?? 0), 0);
        const wordCount = modules.reduce((s: number, m: any) =>
          s + (m.lessons ?? []).reduce((ls: number, l: any) => ls + (l.content?.split(" ").length ?? 0), 0), 0);

        const imagePrompt = `Premium online course cover for "${generated.title ?? topic}", professional educational design, dark gradient background with gold/purple accents, bold typography, modern and high-value aesthetic, no text overlay`;
        const coverImageUrl = await generateProductCoverImage({ title: generated.title ?? topic, topic, type: "course" }).catch(() =>
          `https://image.pollinations.ai/prompt/${encodeURIComponent(`premium course cover art ${topic} education professional dark gradient gold purple modern`)}`
        );

        await db.update(coursesTable).set({
          title: generated.title ?? topic,
          subtitle: generated.subtitle,
          category: generated.category ?? category,
          targetAudience: generated.targetAudience ?? targetAudience,
          stage: "complete",
          courseData: generated.courseData,
          landingPageData: generated.landingPageData,
          marketingData: generated.marketingData,
          coverImageUrl,
          price: String(generated.price ?? 97),
          originalPrice: String(generated.originalPrice ?? 197),
          sellabilityScore: generated.sellabilityScore ?? 85,
          moduleCount: modules.length,
          lessonCount,
          totalWordCount: wordCount,
          updatedAt: new Date(),
        }).where(eq(coursesTable.id, course.id));

        logger.info({ courseId: course.id, topic }, "Course generation complete");
      } catch (err: any) {
        logger.error({ err, courseId: course.id }, "Course generation failed");
        await db.update(coursesTable).set({
          stage: "failed",
          errorMessage: err?.message ?? "Generation failed",
          updatedAt: new Date(),
        }).where(eq(coursesTable.id, course.id)).catch(() => {});
      }
    });
  } catch (err: any) {
    logger.error({ err }, "Create course error");
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.get("/courses/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [course] = await db.select().from(coursesTable)
      .where(and(eq(coursesTable.id, id), eq(coursesTable.userId, req.userId))).limit(1);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    res.json({ course });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load course" });
  }
});

router.delete("/courses/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(coursesTable).where(and(eq(coursesTable.id, id), eq(coursesTable.userId, req.userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

router.post("/courses/:id/sell", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [course] = await db.select().from(coursesTable)
      .where(and(eq(coursesTable.id, id), eq(coursesTable.userId, req.userId))).limit(1);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    if (course.stage !== "complete") { res.status(400).json({ error: "Course must be fully generated first" }); return; }

    const { price, description, paymentStructure = "one_time", installments = 3, installmentPrice } = req.body;
    const finalPrice = parseFloat(price ?? course.price ?? "97");
    if (isNaN(finalPrice) || finalPrice <= 0) { res.status(400).json({ error: "Invalid price" }); return; }

    const [user] = await db.select({ name: usersTable.name, email: usersTable.email, username: usersTable.username })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    const authorName = user?.name ?? user?.email ?? "Course Creator";

    const paymentPlanData = paymentStructure === "payment_plan"
      ? { type: "payment_plan", installments: parseInt(installments) || 3, installmentPrice: parseFloat(installmentPrice) || Math.ceil(finalPrice / 3), totalPrice: finalPrice }
      : { type: "one_time", totalPrice: finalPrice };

    const lp = (course.landingPageData ?? {}) as any;
    const courseDesc = description?.trim()
      || lp?.heroStatement
      || lp?.subheadline
      || course.subtitle
      || `Complete ${course.lessonCount ?? 15}+ lesson course on ${course.topic}`;

    const aboutSection = [
      `This premium course covers ${course.topic} with ${course.moduleCount ?? 5} in-depth modules and ${course.lessonCount ?? 15}+ lessons of expert-level content.`,
      lp?.transformation ? `\n\n${lp.transformation}` : "",
      lp?.guarantee ? `\n\n✅ ${lp.guarantee}` : "\n\n✅ 30-Day Money-Back Guarantee",
      paymentStructure === "payment_plan"
        ? `\n\n💳 Payment Plan Available: ${paymentPlanData.installments} payments of $${paymentPlanData.installmentPrice}`
        : "\n\n💳 One-Time Payment — Lifetime Access",
    ].join("");

    let productId: number;

    if (course.storeProductId) {
      await db.update(productsTable).set({
        title: course.title,
        subtitle: course.subtitle ?? undefined,
        description: courseDesc,
        price: finalPrice.toFixed(2),
        originalPrice: course.originalPrice ? String(course.originalPrice) : String((finalPrice * 2).toFixed(0)),
        coverImageUrl: course.coverImageUrl ?? undefined,
        landingPageData: course.landingPageData as any,
        marketingAssets: course.marketingData as any,
        category: course.category ?? "education",
        targetAudience: course.targetAudience ?? undefined,
        sellabilityScore: course.sellabilityScore ?? 85,
        isPublished: true,
        publishStatus: "published",
        aboutSection,
        updatedAt: new Date(),
      }).where(eq(productsTable.id, course.storeProductId));
      productId = course.storeProductId;
    } else {
      const [product] = await db.insert(productsTable).values({
        userId: req.userId,
        title: course.title,
        subtitle: course.subtitle ?? undefined,
        topic: course.topic,
        authorName,
        description: courseDesc,
        price: finalPrice.toFixed(2),
        originalPrice: course.originalPrice ? String(course.originalPrice) : String((finalPrice * 2).toFixed(0)),
        coverImageUrl: course.coverImageUrl ?? undefined,
        landingPageData: course.landingPageData as any,
        marketingAssets: course.marketingData as any,
        category: course.category ?? "education",
        targetAudience: course.targetAudience ?? undefined,
        sellabilityScore: course.sellabilityScore ?? 85,
        isPublished: true,
        publishStatus: "published",
        productType: "course",
        aboutSection,
      }).returning();
      productId = product.id;
    }

    await db.update(coursesTable).set({
      storeProductId: productId,
      paymentPlanData,
      isPublished: true,
      publishStatus: "published",
      price: finalPrice.toFixed(2),
      updatedAt: new Date(),
    }).where(eq(coursesTable.id, id));

    const [updated] = await db.select().from(coursesTable).where(eq(coursesTable.id, id)).limit(1);
    res.json({ success: true, course: updated, productId });
    logger.info({ courseId: id, productId, paymentStructure }, "Course listed for sale");
  } catch (err: any) {
    logger.error({ err }, "Sell course error");
    res.status(500).json({ error: err?.message ?? "Failed to list course for sale" });
  }
});

router.post("/courses/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [course] = await db.select().from(coursesTable)
      .where(and(eq(coursesTable.id, id), eq(coursesTable.userId, req.userId))).limit(1);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    if (course.stage !== "complete") { res.status(400).json({ error: "Course must be fully generated before publishing" }); return; }

    const [updated] = await db.update(coursesTable).set({
      isPublished: !course.isPublished,
      publishStatus: course.isPublished ? "draft" : "published",
      updatedAt: new Date(),
    }).where(eq(coursesTable.id, id)).returning();

    res.json({ success: true, course: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update publish status" });
  }
});

export default router;
