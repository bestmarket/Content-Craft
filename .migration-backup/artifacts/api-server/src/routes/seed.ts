import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  usersTable,
  featuresTable,
  settingsTable,
  promptsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.post("/seed", async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    res.status(403).json({ error: "SEED_SECRET env var is not configured" });
    return;
  }
  if (req.headers["x-seed-secret"] !== secret) {
    res.status(403).json({ error: "Invalid seed secret" });
    return;
  }

  try {
    const hashed = await bcrypt.hash("admin123", 10);

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "admin@viralcraft.com"))
      .limit(1);

    let adminUser;
    if (existing.length > 0) {
      [adminUser] = await db
        .update(usersTable)
        .set({ role: "admin", password: hashed })
        .where(eq(usersTable.email, "admin@viralcraft.com"))
        .returning();
    } else {
      [adminUser] = await db
        .insert(usersTable)
        .values({
          email: "admin@viralcraft.com",
          password: hashed,
          name: "ViralCraft Admin",
          role: "admin",
          isActive: true,
        })
        .returning();
    }

    const features = [
      { key: "content_generation", label: "Content Generation", description: "AI script and title generation for all platforms", isActive: true },
      { key: "thumbnail_generation", label: "Thumbnail Generation", description: "AI-powered thumbnail creation", isActive: true },
      { key: "pdf_studio", label: "PDF Studio", description: "Premium digital guide creation", isActive: true },
      { key: "video_modeler", label: "Video Modeler", description: "Analyze and model viral videos", isActive: true },
      { key: "support_chat", label: "Support Chat", description: "Real-time user support chat", isActive: true },
      { key: "ai_chatbot", label: "AI Chatbot", description: "ViralCraft AI assistant widget", isActive: true },
    ];

    for (const f of features) {
      await db.insert(featuresTable).values(f).onConflictDoNothing();
    }

    const settings = [
      { key: "affiliate_link", value: "https://www.invideo.io", label: "Affiliate Link" },
      { key: "ad_text", value: "Click Here To Create your Digital Product in Minutes with AI", label: "Ad Banner Text" },
      { key: "video_tool_link", value: "https://www.invideo.io", label: "Video Tool Link" },
      { key: "support_email", value: "support@viralcraft.com", label: "Support Email" },
      { key: "platform_name", value: "ViralCraft Studio", label: "Platform Name" },
    ];

    for (const s of settings) {
      await db
        .insert(settingsTable)
        .values({ ...s, updatedAt: new Date() })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: s.value } });
    }

    type PromptType = "content" | "thumbnail" | "pdf" | "chatbot";
    const prompts: { name: string; type: PromptType; description: string; systemPrompt: string; isActive: boolean }[] = [
      {
        name: "MrBeast Style",
        type: "content",
        description: "High energy challenge-based content",
        systemPrompt: `You are an expert viral content creator in the style of MrBeast. Create high-energy, challenge-based scripts with big hooks, simple language, massive numbers, and surprising twists. Always include a strong call-to-action. Respond ONLY in valid JSON: {"titles":[{"title":"...","viralityScore":90}],"script":"...","description":"...","tags":["..."],"hashtags":["#..."]}`,
        isActive: true,
      },
      {
        name: "Educational Tutorial",
        type: "content",
        description: "Clear informative step-by-step content",
        systemPrompt: `You are an expert educational content creator. Create clear, well-structured tutorial scripts using hook-teach-close format. Respond ONLY in valid JSON: {"titles":[{"title":"...","viralityScore":85}],"script":"...","description":"...","tags":["..."],"hashtags":["#..."]}`,
        isActive: true,
      },
      {
        name: "Motivational Speaker",
        type: "content",
        description: "Inspiring story-driven motivational content",
        systemPrompt: `You are an expert motivational content creator. Create inspiring story-driven content with personal stories and triumphant conclusions. Respond ONLY in valid JSON: {"titles":[{"title":"...","viralityScore":88}],"script":"...","description":"...","tags":["..."],"hashtags":["#..."]}`,
        isActive: true,
      },
      {
        name: "Viral Thumbnail",
        type: "thumbnail",
        description: "Click-bait optimized thumbnail prompts",
        systemPrompt: "You are an expert viral thumbnail designer. Create detailed DALL-E 3 image generation prompts for maximum click-through rate. Include bold text overlays, high-contrast colors, strong emotions, and clear visual hierarchy.",
        isActive: true,
      },
      {
        name: "Premium Digital Guide",
        type: "pdf",
        description: "Professional value-packed digital products",
        systemPrompt: `You are an expert digital product creator. Create premium comprehensive guides worth $47-97. Respond ONLY in valid JSON: {"title":"...","tableOfContents":["Chapter 1: ..."],"content":"...","aboutSection":"...","authorBio":"..."}`,
        isActive: true,
      },
    ];

    for (const p of prompts) {
      await db.insert(promptsTable).values(p).onConflictDoNothing();
    }

    logger.info("Database seeded successfully");
    res.json({
      success: true,
      admin: { email: adminUser.email, role: adminUser.role },
      features: features.length,
      settings: settings.length,
      prompts: prompts.length,
    });
  } catch (err) {
    logger.error({ err }, "Seed failed");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

export default router;
