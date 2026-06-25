import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

export const ALL_TOOLS = [
  { key: "product_generator",  label: "Product Generator",    description: "AI product creation, Scryvox pipeline, landing pages, quick launch",  category: "Core" },
  { key: "prompt_generator",   label: "Prompt Studio",        description: "AI prompt package builder and prompt marketplace",                       category: "Core" },
  { key: "content_generator",  label: "Content Generator",    description: "Viral content, blog posts, social media content writer",                 category: "Core" },
  { key: "course_generator",   label: "Course Generator",     description: "AI text course builder with lessons, quizzes and progress tracking",     category: "Core" },
  { key: "pdf_studio",         label: "PDF Studio",           description: "AI-generated PDF documents and ebooks",                                  category: "AI Tools" },
  { key: "thumbnails",         label: "Thumbnail Creator",    description: "AI viral thumbnail generator for YouTube and social media",               category: "AI Tools" },
  { key: "scripts",            label: "Script Studio",        description: "Video scripts, podcast scripts, sales scripts",                          category: "AI Tools" },
  { key: "landing_page",       label: "Landing Page Builder", description: "AI landing page generator for products",                                  category: "AI Tools" },
  { key: "video_agent",        label: "Video Marketing Agent",description: "AI video script + render pipeline (requires Voice Engine)",               category: "Video & Voice" },
  { key: "voice",              label: "Voice Generator",      description: "Text-to-speech and voice cloning (requires Voice Engine on port 8099)",   category: "Video & Voice" },
  { key: "video_modeler",      label: "Video Modeler",        description: "Video model builder and generator",                                       category: "Video & Voice" },
  { key: "automation",         label: "Automation Engine",    description: "No-code automation builder, tool marketplace, run history",               category: "Automation" },
  { key: "dev_studio",         label: "AI Dev Studio",        description: "Code builder IDE, SaaS builder, AI agents",                               category: "Developer" },
  { key: "marketplace",        label: "Marketplace",          description: "Global product marketplace, template generators, my purchases",           category: "Store" },
  { key: "store",              label: "My Store",             description: "Creator storefront and product listings",                                  category: "Store" },
  { key: "affiliate",          label: "Affiliate & Earnings", description: "Affiliate program, referral tracking, earnings dashboard",                category: "Growth" },
  { key: "trending",           label: "Trending Ideas",       description: "Trending topics and viral idea generator",                                category: "Growth" },
];

// Default state — money-making tools ON, voice/video/dev OFF until stable hosting
const MONEY_TOOLS = [
  "product_generator", "prompt_generator", "content_generator",
  "store", "affiliate", "trending", "marketplace",
  "landing_page", "thumbnails", "scripts", "pdf_studio",
];
const DEFAULT_FLAGS: Record<string, boolean> = Object.fromEntries(
  ALL_TOOLS.map(t => [t.key, MONEY_TOOLS.includes(t.key)])
);

async function getToolFlags(): Promise<Record<string, boolean>> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "tool_flags")).limit(1);
    if (!row?.value) return DEFAULT_FLAGS;
    const saved = JSON.parse(row.value);
    // Merge with defaults so new tools appear as disabled automatically
    return { ...DEFAULT_FLAGS, ...saved };
  } catch {
    return DEFAULT_FLAGS;
  }
}

async function saveToolFlags(flags: Record<string, boolean>) {
  const existing = await db.select({ key: settingsTable.key }).from(settingsTable).where(eq(settingsTable.key, "tool_flags")).limit(1);
  const value = JSON.stringify(flags);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, "tool_flags"));
  } else {
    await db.insert(settingsTable).values({ key: "tool_flags", value });
  }
}

// Public — frontend reads this to know what to show
router.get("/tool-flags", async (_req, res) => {
  try {
    const flags = await getToolFlags();
    res.json({ flags, tools: ALL_TOOLS });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin — update a single flag
router.patch("/admin/tool-flags/:key", requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;
    if (!ALL_TOOLS.find(t => t.key === key)) {
      res.status(400).json({ error: "Unknown tool key" }); return;
    }
    const flags = await getToolFlags();
    flags[key] = Boolean(enabled);
    await saveToolFlags(flags);
    res.json({ ok: true, key, enabled: flags[key], flags });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin — bulk update all flags
router.put("/admin/tool-flags", requireAdmin, async (req, res) => {
  try {
    const { flags } = req.body;
    const current = await getToolFlags();
    const merged = { ...current, ...flags };
    await saveToolFlags(merged);
    res.json({ ok: true, flags: merged });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin — reset to defaults
router.post("/admin/tool-flags/reset", requireAdmin, async (_req, res) => {
  try {
    await saveToolFlags(DEFAULT_FLAGS);
    res.json({ ok: true, flags: DEFAULT_FLAGS });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
