import { useState, useRef, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Download, BookOpen, Mail, Facebook, Youtube,
  Film, FileText, Star, Zap, CheckCircle2, Circle,
  ChevronRight, ChevronLeft, Sparkles, Package, LayoutTemplate,
  BarChart2, MessageSquare, Target, Megaphone, Gift, Clock,
  History, ArrowLeft, RefreshCw, Eye, Globe, PenTool,
  Copy, Check, ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioForm {
  title: string;
  description: string;
  targetAudience: string;
  problemSolved: string;
  category: string;
  writingStyle: string;
  directionAngle: string;
  tone: string;
  pageCount: number;
  visualTheme: string;
  imageSource: string;
  authorName: string;
}

interface AssetDef {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Business", "AI", "Marketing", "Finance", "Health",
  "Fitness", "Real Estate", "Crypto", "Education",
  "Relationships", "Parenting", "Self Improvement",
];

const WRITING_STYLES = [
  "Educational", "Professional", "Storytelling", "Actionable", "Premium Coaching",
];

const DIRECTION_ANGLES = [
  "Ultimate Guide", "Step-by-Step Blueprint", "Workbook",
  "Expert Handbook", "Masterclass", "Transformation Journey",
  "Checklist Style", "Challenge Format",
];

const TONES = ["Friendly", "Authority", "Luxury", "Motivational", "Corporate"];

const PAGE_COUNTS = [20, 50, 80, 120, 200];

const VISUAL_THEMES = [
  "Modern", "Luxury", "Dark", "Minimal", "Blue Corporate", "Elegant",
];

const IMAGE_SOURCES = ["Pollinations AI", "Unsplash", "Pexels", "Pixabay"];

const ASSETS: AssetDef[] = [
  { key: "ebook",           label: "Ebook (PDF)",         icon: BookOpen,       description: "Full premium ebook with chapters, examples, action steps", color: "text-violet-600 bg-violet-50 border-violet-200" },
  { key: "emailSequence",   label: "Email Sequence",      icon: Mail,           description: "30-day email sequence with welcome, value & promo emails", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "facebookGuide",   label: "Facebook Guide",      icon: Facebook,       description: "Organic Facebook strategy, post ideas, group tactics", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { key: "facebookAdsGuide",label: "Facebook Ads Guide",  icon: Megaphone,      description: "Ad copy variants, targeting strategy, budget guide", color: "text-pink-600 bg-pink-50 border-pink-200" },
  { key: "youtubeGuide",    label: "YouTube Guide",       icon: Youtube,        description: "Video ideas, SEO strategy, description templates", color: "text-red-600 bg-red-50 border-red-200" },
  { key: "tiktokGuide",     label: "TikTok Guide",        icon: Film,           description: "Content pillars, viral hooks, growth tactics", color: "text-slate-600 bg-slate-50 border-slate-200" },
  { key: "salesPage",       label: "Sales Page",          icon: Target,         description: "High-converting sales page copy with headlines & CTAs", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "leadMagnet",      label: "Lead Magnet",         icon: Gift,           description: "Free mini-product to grow your email list", color: "text-green-600 bg-green-50 border-green-200" },
  { key: "socialPosts",     label: "Social Posts",        icon: MessageSquare,  description: "Ready-to-post content for Instagram, Twitter & LinkedIn", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { key: "ctaLibrary",      label: "CTA Library",         icon: Zap,            description: "15+ powerful calls-to-action for every context", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { key: "worksheets",      label: "Worksheets",          icon: LayoutTemplate, description: "Interactive exercises tied to your ebook chapters", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { key: "bonuses",         label: "Bonus Materials",     icon: Star,           description: "Checklists, swipe files, and templates as bonuses", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
];

const DEFAULT_ASSETS = ["ebook", "emailSequence", "salesPage", "socialPosts", "facebookAdsGuide"];

const STAGES = [
  { id: 1, label: "Market Research",       tip: "People buy solutions, not information.",               icon: BarChart2,    color: "from-violet-500 to-purple-600" },
  { id: 2, label: "Building Blueprint",     tip: "Structure determines how much value readers extract.", icon: FileText,     color: "from-blue-500 to-indigo-600" },
  { id: 3, label: "Writing Premium Content",tip: "Expert writers make complex ideas feel simple.",       icon: PenTool,      color: "from-indigo-500 to-violet-600" },
  { id: 4, label: "Creating Visual Assets", tip: "First impressions are built in milliseconds.",        icon: Sparkles,     color: "from-pink-500 to-rose-600" },
  { id: 5, label: "Marketing Assets",       tip: "Distribution beats creation. Promote boldly.",        icon: Megaphone,    color: "from-orange-500 to-amber-600" },
  { id: 6, label: "Email Sequence",         tip: "Email subscribers are worth 40x social followers.",  icon: Mail,         color: "from-green-500 to-emerald-600" },
  { id: 7, label: "Finalizing Product",     tip: "Premium products command premium prices.",            icon: Package,      color: "from-teal-500 to-cyan-600" },
];

// ─── Visual Theme Palettes ────────────────────────────────────────────────────

type RGB = [number, number, number];

interface ThemePalette {
  primary: RGB; primaryLight: RGB; primaryDim: RGB;
  accent: RGB; dark: RGB; body: RGB; muted: RGB;
  bg: RGB; cardBg: RGB;
  name: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  Modern:          { primary:[124,58,237],  primaryLight:[245,243,255], primaryDim:[167,139,250], accent:[219,39,119],  dark:[15,23,42],   body:[55,65,81],   muted:[100,116,139], bg:[255,255,255], cardBg:[248,250,252], name:"Modern" },
  Luxury:          { primary:[212,175,55],  primaryLight:[255,252,235], primaryDim:[234,209,128], accent:[139,90,43],   dark:[10,10,10],   body:[40,35,30],   muted:[100,90,70],   bg:[18,15,10],   cardBg:[28,25,18],    name:"Luxury" },
  Dark:            { primary:[99,102,241],  primaryLight:[238,242,255], primaryDim:[165,180,252], accent:[244,114,182], dark:[241,245,249],body:[203,213,225], muted:[148,163,184], bg:[15,23,42],   cardBg:[30,41,59],    name:"Dark" },
  Minimal:         { primary:[17,24,39],    primaryLight:[249,250,251], primaryDim:[107,114,128], accent:[79,70,229],   dark:[17,24,39],   body:[55,65,81],   muted:[156,163,175], bg:[255,255,255], cardBg:[250,250,250], name:"Minimal" },
  "Blue Corporate":{ primary:[29,78,216],   primaryLight:[239,246,255], primaryDim:[147,197,253], accent:[37,99,235],   dark:[15,23,42],   body:[30,58,138],  muted:[100,116,139], bg:[255,255,255], cardBg:[239,246,255], name:"Blue Corporate" },
  Elegant:         { primary:[88,28,135],   primaryLight:[250,245,255], primaryDim:[196,181,253], accent:[234,179,8],   dark:[20,14,30],   body:[55,48,70],   muted:[100,90,120],  bg:[255,255,255], cardBg:[250,248,255], name:"Elegant" },
};

// ─── Image Utilities ──────────────────────────────────────────────────────────

async function fetchPollinationsImage(prompt: string, w: number, h: number, seed: number): Promise<string> {
  return new Promise(resolve => {
    const encoded = encodeURIComponent(prompt + ", no text, no words, no letters");
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&seed=${seed}&enhance=true&model=flux`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(""), 20000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(""); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch { resolve(""); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(""); };
    img.src = url;
  });
}

// ─── PDF Generators ───────────────────────────────────────────────────────────

async function buildEbookPdf(ebook: any, params: StudioForm): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const theme = THEME_PALETTES[params.visualTheme] ?? THEME_PALETTES.Modern;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 20; const CW = W - M * 2; const MAX_Y = H - 16;
  let pageNum = 0;
  let currentChapterTitle = "";
  const guideTitle = (ebook.title ?? params.title).slice(0, 50);

  const T = theme;
  const sf = (...rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const sd = (...rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const st = (...rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const isDarkTheme = params.visualTheme === "Dark" || params.visualTheme === "Luxury";

  function addPageFooter() {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    st(...T.muted);
    doc.text(String(pageNum), W / 2, H - 7, { align: "center" });
    sf(...T.primary); doc.rect(0, H - 2, W, 2, "F");
  }

  function addRunningHeader() {
    if (!currentChapterTitle || pageNum <= 2) return;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    st(...T.muted);
    const ch = currentChapterTitle.length > 52 ? currentChapterTitle.slice(0, 49) + "…" : currentChapterTitle;
    const gt = guideTitle.length > 38 ? guideTitle.slice(0, 35) + "…" : guideTitle;
    doc.text(ch.toUpperCase(), M, 9);
    doc.text(gt, W - M, 9, { align: "right" });
    sd(...T.muted); doc.setLineWidth(0.2); doc.line(M, 11, W - M, 11);
  }

  function newPage(): number {
    doc.addPage(); pageNum++;
    sf(...T.bg); doc.rect(0, 0, W, H, "F");
    sf(...T.primary); doc.rect(0, 0, W, 3, "F");
    addRunningHeader(); addPageFooter();
    return currentChapterTitle && pageNum > 2 ? 19 : 16;
  }

  function checkY(y: number, needed: number): number {
    return y + needed > MAX_Y ? newPage() : y;
  }

  function renderParagraph(y: number, text: string, opts: { size?: number; weight?: string; color?: RGB; maxW?: number; lineH?: number; indent?: number } = {}): number {
    if (!text?.trim()) return y;
    const { size = 10, weight = "normal", color = T.body, maxW = CW, lineH, indent = 0 } = opts;
    const lh = lineH ?? (size * 0.42 + 1.5);
    doc.setFont("helvetica", weight as any); doc.setFontSize(size); st(...color);
    const lines = doc.splitTextToSize(text.trim(), maxW - indent);
    for (const line of lines) {
      y = checkY(y, lh + 0.5);
      doc.text(line, M + indent, y); y += lh;
    }
    return y;
  }

  function renderCallout(y: number, label: string, text: string): number {
    if (!text?.trim()) return y;
    const lines = doc.splitTextToSize(text.trim(), CW - 14);
    const boxH = lines.length * 5.2 + 15;
    y = checkY(y, boxH + 4);
    sf(...T.primaryLight); doc.roundedRect(M, y, CW, boxH, 2, 2, "F");
    sf(...T.primary); doc.roundedRect(M, y, 3.5, boxH, 1, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); st(...T.primary);
    doc.text(label, M + 7, y + 6.5);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); st(...T.body);
    lines.forEach((line: string, i: number) => doc.text(line, M + 7, y + 12.5 + i * 5.2));
    return y + boxH + 5;
  }

  function renderTakeaways(y: number, points: string[]): number {
    if (!points?.length) return y;
    const allLines = points.map(p => doc.splitTextToSize(p.trim(), CW - 18));
    const totalH = 14 + allLines.reduce((s, ls) => s + ls.length * 5.5 + 2, 0);
    y = checkY(y, totalH + 4);
    sf(...T.primaryLight); doc.roundedRect(M, y, CW, totalH, 2, 2, "F");
    sf(...T.primary); doc.roundedRect(M, y, 3.5, totalH, 1, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); st(...T.primary);
    doc.text("KEY TAKEAWAYS", M + 7, y + 7);
    let ty = y + 13;
    points.forEach((p, i) => {
      if (!p?.trim()) return;
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); st(...T.primary);
      doc.text("✓", M + 7, ty);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); st(...T.body);
      allLines[i].forEach((line: string, li: number) => doc.text(line, M + 14, ty + li * 5.5));
      ty += allLines[i].length * 5.5 + 2;
    });
    return y + totalH + 6;
  }

  function renderSteps(y: number, steps: string[]): number {
    if (!steps?.length) return y;
    for (const step of steps) {
      if (!step?.trim()) continue;
      const numMatch = step.match(/^Step\s+(\d+)[:\-\s]/i);
      const num = numMatch ? numMatch[1] : "•";
      const cleanText = step.replace(/^Step\s+\d+[:\-\s]+/i, "").trim();
      const stepLines = doc.splitTextToSize(cleanText, CW - 15);
      const blockH = Math.max(9, stepLines.length * 5.5 + 2);
      y = checkY(y, blockH + 3);
      sf(...T.primary); doc.circle(M + 4.5, y + 1, 3.8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); st(...([255,255,255] as any));
      doc.text(String(num), M + 4.5, y + 2.5, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
      stepLines.forEach((line: string, i: number) => doc.text(line, M + 11, y + (i === 0 ? 2 : 2 + i * 5.5)));
      y += blockH + 2;
    }
    return y + 1;
  }

  function renderActionStep(y: number, text: string): number {
    if (!text?.trim()) return y;
    const lines = doc.splitTextToSize(text.trim(), CW - 14);
    const boxH = lines.length * 5.5 + 16;
    y = checkY(y, boxH + 4);
    sf(255, 251, 235); doc.roundedRect(M, y, CW, boxH, 2, 2, "F");
    sf(217, 119, 6); doc.roundedRect(M, y, 3.5, boxH, 1, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); st(217, 119, 6);
    doc.text("YOUR ACTION STEP", M + 7, y + 7);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); st(146, 64, 14);
    lines.forEach((line: string, i: number) => doc.text((i === 0 ? "→  " : "    ") + line, M + 7, y + 13.5 + i * 5.5));
    return y + boxH + 6;
  }

  // Fetch cover image
  const topic = params.title;
  const seed = Math.abs(topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 9999;
  const coverPrompt = `cinematic abstract ${params.visualTheme.toLowerCase()} style concept art representing ${topic}, professional, premium, ultra high detail, photorealistic`;
  const coverImg = await fetchPollinationsImage(coverPrompt, 600, 840, seed);

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  pageNum++;
  sf(...T.dark); doc.rect(0, 0, W, H, "F");
  sf(...T.primary); doc.rect(0, 0, W, 4, "F");
  sf(...T.accent); doc.rect(0, H - 4, W, 4, "F");

  if (coverImg) {
    const imgX = W / 2 + 2; const imgW = W / 2 - M / 2 + 2; const imgH = H - 16;
    try { doc.addImage(coverImg, "JPEG", imgX, 8, imgW, imgH); } catch {}
    sf(...T.dark); doc.setGState(doc.GState({ opacity: 0.6 }));
    doc.rect(imgX, 8, 14, imgH, "F"); doc.setGState(doc.GState({ opacity: 1 }));
  }

  const textW = coverImg ? W / 2 - M - 4 : CW;
  const centerX = coverImg ? M : W / 2;
  const txtAlign: "left" | "center" = coverImg ? "left" : "center";

  sf(...T.primary); doc.setGState(doc.GState({ opacity: 0.2 }));
  doc.roundedRect(M, 26, textW, 9, 2, 2, "F"); doc.setGState(doc.GState({ opacity: 1 }));
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); st(...T.primaryDim);
  doc.text(`✦  ${params.directionAngle.toUpperCase()}  ·  ${params.category.toUpperCase()}  ✦`, centerX, 32.5, { align: txtAlign });

  doc.setFont("helvetica", "bold"); doc.setFontSize(22); st(...([255,255,255] as any));
  const titleLines = doc.splitTextToSize(ebook.title ?? topic, textW);
  let ty = 52;
  titleLines.slice(0, 4).forEach((line: string) => { doc.text(line, centerX, ty, { align: txtAlign }); ty += 12; });

  if (ebook.subtitle) {
    ty += 2; doc.setFont("helvetica", "italic"); doc.setFontSize(10); st(...T.primaryDim);
    const subLines = doc.splitTextToSize(ebook.subtitle, textW);
    subLines.slice(0, 2).forEach((line: string) => { doc.text(line, centerX, ty, { align: txtAlign }); ty += 7; });
  }

  if (ebook.aboutSection) {
    ty += 4; doc.setFont("helvetica", "normal"); doc.setFontSize(9); st(148, 163, 184);
    const aLines = doc.splitTextToSize(ebook.aboutSection, textW);
    aLines.slice(0, 4).forEach((line: string) => { doc.text(line, centerX, ty, { align: txtAlign }); ty += 6; });
  }

  ty += 5; sd(...T.primary); doc.setLineWidth(1.2);
  if (coverImg) doc.line(M, ty, M + textW * 0.6, ty);
  else doc.line(M + 20, ty, W - M - 20, ty);
  ty += 9;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(148, 163, 184);
  doc.text(`By ${ebook.authorName ?? params.authorName}`, centerX, ty, { align: txtAlign });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); st(71, 85, 105);
  doc.text("Created with Selovox AI Product Studio  ·  selovox.com", W / 2, H - 9, { align: "center" });

  // ── TABLE OF CONTENTS ──────────────────────────────────────────────────────
  doc.addPage(); pageNum++;
  sf(...T.bg); doc.rect(0, 0, W, H, "F");
  sf(...T.primary); doc.rect(0, 0, W, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); st(...T.dark);
  doc.text("Table of Contents", M, 30);
  sf(...T.primary); doc.rect(M, 33.5, 50, 2, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); st(...T.muted);
  doc.text(`${params.writingStyle} · ${params.tone} · ${params.pageCount} pages`, M, 42);

  let tocY = 52;
  (ebook.tableOfContents ?? []).forEach((chapter: string, i: number) => {
    if (tocY > H - 22) { doc.addPage(); pageNum++; tocY = 28; }
    const rowBg: RGB = i % 2 === 0 ? T.cardBg : T.bg;
    sf(...rowBg); doc.roundedRect(M, tocY - 5, CW, 12, 2, 2, "F");
    sf(...T.primary); doc.circle(M + 6, tocY + 1.5, 4.5, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); st(...([255,255,255] as any));
    doc.text(String(i + 1), M + 6, tocY + 3, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
    const label = chapter.length > 78 ? chapter.slice(0, 75) + "…" : chapter;
    doc.text(label, M + 14, tocY + 2.5);
    tocY += 15;
  });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(...T.muted);
  doc.text(String(pageNum), W / 2, H - 7, { align: "center" });

  // ── CHAPTERS ───────────────────────────────────────────────────────────────
  const chapters = ebook.chapters ?? [];
  for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
    const chapter = chapters[chIdx];
    doc.addPage(); pageNum++;
    currentChapterTitle = chapter.title ?? `Chapter ${chapter.number}`;

    sf(...T.bg); doc.rect(0, 0, W, H, "F");
    sf(...T.primary); doc.rect(0, 0, 4.5, H, "F");
    sf(...T.primary); doc.rect(0, 0, W, 3, "F");

    // Ghost chapter number
    doc.setFont("helvetica", "bold"); doc.setFontSize(170); st(...T.primaryLight);
    doc.text(String(chapter.number ?? ""), W - M + 12, H / 2 + 55, { align: "right" });

    doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); st(...T.primaryDim);
    doc.text(`CHAPTER ${chapter.number ?? ""}`, M + 10, H / 2 - 35);

    doc.setFont("helvetica", "bold"); doc.setFontSize(23); st(...T.dark);
    const chTitleLines = doc.splitTextToSize(currentChapterTitle, CW - 25);
    let cty = H / 2 - 22;
    chTitleLines.slice(0, 3).forEach((line: string) => { doc.text(line, M + 10, cty); cty += 13; });

    if (chapter.hook?.trim()) {
      cty += 8;
      const hookLines = doc.splitTextToSize(chapter.hook.trim(), CW - 30);
      const hookH = hookLines.length * 6.5 + 12;
      sf(...T.primaryLight); doc.roundedRect(M + 10, cty - 6, CW - 15, hookH, 3, 3, "F");
      sd(...T.primary); doc.setLineWidth(2.5); doc.line(M + 10, cty - 6, M + 10, cty - 6 + hookH);
      doc.setFont("helvetica", "italic"); doc.setFontSize(11); st(...T.primary);
      hookLines.forEach((line: string, hi: number) => doc.text(line, M + 17, cty + hi * 6.5));
    }

    doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(...T.muted);
    doc.text(String(pageNum), W / 2, H - 7, { align: "center" });

    // ── CHAPTER CONTENT PAGE ─────────────────────────────────────────────────
    let y = newPage();

    if (chapter.body?.trim()) {
      const paragraphs = chapter.body.split(/\n{2,}/).filter(Boolean);
      for (const para of paragraphs) {
        y = renderParagraph(y, para, { size: 10.5, color: T.body, lineH: 6.2 });
        y += 3;
      }
    }

    if (chapter.callout?.trim()) {
      y += 2;
      y = renderCallout(y, "KEY INSIGHT", chapter.callout);
    }

    if (chapter.example?.trim()) {
      y += 2;
      y = renderCallout(y, "REAL STORY", chapter.example);
    }

    if (chapter.steps?.length) {
      y = checkY(y, 16);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); st(...T.dark);
      doc.text("Step-by-Step Action", M, y); y += 7;
      sd(...T.primary); doc.setLineWidth(0.6); doc.line(M, y, M + 50, y); y += 6;
      y = renderSteps(y, chapter.steps);
    }

    if (chapter.keyTakeaways?.length) {
      y += 4;
      y = renderTakeaways(y, chapter.keyTakeaways);
    }

    if (chapter.actionStep?.trim()) {
      y += 4;
      y = renderActionStep(y, chapter.actionStep);
    }
  }

  // ── CONCLUSION ──────────────────────────────────────────────────────────────
  if (ebook.conclusion) {
    let y = newPage();
    currentChapterTitle = "Conclusion";
    sf(...T.primaryLight); doc.roundedRect(M, y - 5, CW, 22, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); st(...T.primary);
    doc.text(ebook.conclusion.title ?? "Your 30-Day Action Plan", M + 4, y + 8); y += 26;
    if (ebook.conclusion.body) {
      const paras = ebook.conclusion.body.split(/\n{2,}/).filter(Boolean);
      for (const p of paras) { y = renderParagraph(y, p, { size: 10.5, color: T.body, lineH: 6.2 }); y += 4; }
    }
    if (ebook.conclusion.steps?.length) {
      y += 4; y = renderSteps(y, ebook.conclusion.steps);
    }
  }

  // ── BONUS ───────────────────────────────────────────────────────────────────
  if (ebook.bonus) {
    let y = newPage();
    currentChapterTitle = "Bonus";
    sf(...T.primary); doc.rect(0, y - 8, W, 28, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); st(...T.primaryDim);
    doc.text("✦ BONUS ✦", M, y + 2);
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); st(...([255,255,255] as any));
    const bonusTLines = doc.splitTextToSize(ebook.bonus.title ?? "The Insider Secret", CW);
    bonusTLines.slice(0, 2).forEach((line: string) => { doc.text(line, M, y + 10); y += 11; });
    y += 14;
    if (ebook.bonus.body) {
      const paras = ebook.bonus.body.split(/\n{2,}/).filter(Boolean);
      for (const p of paras) { y = renderParagraph(y, p, { size: 10.5, color: T.body, lineH: 6.2 }); y += 4; }
    }
  }

  // ── BACK COVER ──────────────────────────────────────────────────────────────
  doc.addPage(); pageNum++;
  sf(...T.dark); doc.rect(0, 0, W, H, "F");
  sf(...T.primary); doc.rect(0, 0, W, 4, "F");
  sf(...T.primary); doc.rect(0, H - 4, W, 4, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(24); st(...([255,255,255] as any));
  doc.text("You're Ready.", W / 2, H / 2 - 20, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); st(148, 163, 184);
  doc.text("Start with Chapter 1. Take it one step at a time.", W / 2, H / 2 - 8, { align: "center" });
  if (ebook.cta) {
    const ctaLines = doc.splitTextToSize(ebook.cta, CW - 20);
    ctaLines.forEach((line: string, i: number) => doc.text(line, W / 2, H / 2 + 8 + i * 7, { align: "center" }));
  }
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(71, 85, 105);
  doc.text("Created with Selovox AI Product Studio  ·  selovox.com", W / 2, H - 12, { align: "center" });

  doc.save(`${(ebook.title ?? params.title).replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}-ebook.pdf`);
}

async function buildEmailSequencePdf(data: any, params: StudioForm): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const theme = THEME_PALETTES[params.visualTheme] ?? THEME_PALETTES.Modern;
  const T = theme;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const M = 20; const CW = W - M * 2;
  let pageNum = 0;

  const sf = (...rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const sd = (...rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const st = (...rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  function newPage(): number {
    doc.addPage(); pageNum++;
    sf(...T.bg); doc.rect(0, 0, W, H, "F");
    sf(...T.primary); doc.rect(0, 0, W, 3, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(...T.muted);
    doc.text(String(pageNum), W / 2, H - 7, { align: "center" });
    sf(...T.primary); doc.rect(0, H - 2, W, 2, "F");
    return 18;
  }

  // Cover
  pageNum++;
  sf(...T.dark); doc.rect(0, 0, W, H, "F");
  sf(...T.primary); doc.rect(0, 0, W, 4, "F");
  sf(...T.accent); doc.rect(0, H - 4, W, 4, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); st(...T.primaryDim);
  doc.text("✦ 30-DAY EMAIL SEQUENCE ✦", W / 2, 50, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); st(...([255,255,255] as any));
  const tLines = doc.splitTextToSize(params.title, CW);
  tLines.slice(0, 3).forEach((line: string, i: number) => doc.text(line, W / 2, 68 + i * 14, { align: "center" }));
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); st(148, 163, 184);
  doc.text(`${data.emails?.length ?? 10} Emails · ${params.tone} Tone`, W / 2, 110, { align: "center" });
  sd(...T.primary); doc.setLineWidth(1); doc.line(M + 30, 118, W - M - 30, 118);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(148, 163, 184);
  doc.text(`By ${params.authorName}`, W / 2, 128, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); st(71, 85, 105);
  doc.text("Created with Selovox AI Product Studio  ·  selovox.com", W / 2, H - 9, { align: "center" });

  const emails = data.emails ?? [];
  for (const email of emails) {
    let y = newPage();

    // Day badge
    sf(...T.primary); doc.roundedRect(M, y, 22, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); st(...([255,255,255] as any));
    doc.text(`Day ${email.day}`, M + 11, y + 6.5, { align: "center" });

    // Type badge
    const typeColors: Record<string, RGB> = { welcome:[22,163,74], value:[59,130,246], proof:[139,92,246], promo:[234,88,12], closing:[239,68,68] };
    const typeName = (email.type ?? "value") as string;
    const tColor = typeColors[typeName] ?? T.primary;
    sf(...tColor); doc.roundedRect(M + 25, y, 30, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); st(...([255,255,255] as any));
    doc.text(typeName.toUpperCase(), M + 40, y + 6.5, { align: "center" });
    y += 16;

    // Subject
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); st(...T.dark);
    const subjectLines = doc.splitTextToSize(`Subject: ${email.subject ?? ""}`, CW);
    subjectLines.slice(0, 2).forEach((line: string) => { doc.text(line, M, y); y += 8; });

    // Preheader
    if (email.preheader) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(9); st(...T.muted);
      doc.text(`Preview: ${email.preheader}`, M, y); y += 8;
    }

    sd(229, 231, 235); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 6;

    // Headline
    if (email.headline) {
      sf(...T.primaryLight); doc.roundedRect(M, y, CW, 16, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); st(...T.primary);
      const hLines = doc.splitTextToSize(email.headline, CW - 8);
      hLines.slice(0, 2).forEach((line: string, i: number) => doc.text(line, M + 4, y + 6 + i * 7));
      y += hLines.length * 7 + 6 + 4;
    }

    // Body
    if (email.body) {
      const paras = email.body.split(/\n{2,}/).filter(Boolean);
      for (const para of paras) {
        const lines = doc.splitTextToSize(para.trim(), CW);
        const lh = 5.8;
        if (y + lines.length * lh + 2 > H - 20) { y = newPage(); }
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
        lines.forEach((line: string) => { doc.text(line, M, y); y += lh; });
        y += 3;
      }
    }

    // CTA
    if (email.cta) {
      if (y + 18 > H - 20) y = newPage();
      y += 4;
      sf(...T.primary); doc.roundedRect(M + CW / 2 - 35, y, 70, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); st(...([255,255,255] as any));
      doc.text(email.cta, M + CW / 2, y + 7.5, { align: "center" });
      y += 16;
    }

    if (email.ctaNote) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(8); st(...T.muted);
      doc.text(email.ctaNote, M, y); y += 8;
    }
  }

  doc.save(`${params.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}-email-sequence.pdf`);
}

async function buildMarketingPdf(data: any, assetKey: string, params: StudioForm): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const theme = THEME_PALETTES[params.visualTheme] ?? THEME_PALETTES.Modern;
  const T = theme;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const M = 20; const CW = W - M * 2;
  let pageNum = 0;

  const sf = (...rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const sd = (...rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const st = (...rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  const ASSET_META: Record<string, { label: string; fileName: string; color: RGB }> = {
    facebookGuide:    { label: "Facebook Strategy Guide",       fileName: "facebook-guide",      color: [66, 103, 178] },
    facebookAdsGuide: { label: "Facebook Ads Playbook",         fileName: "facebook-ads-guide",  color: [66, 103, 178] },
    youtubeGuide:     { label: "YouTube Growth Guide",          fileName: "youtube-guide",       color: [255, 0, 0] },
    tiktokGuide:      { label: "TikTok Strategy Guide",         fileName: "tiktok-guide",        color: [0, 0, 0] },
    salesPage:        { label: "Sales Page Copy",               fileName: "sales-page",          color: [234, 88, 12] },
    landingPage:      { label: "Landing Page Copy",             fileName: "landing-page",        color: [59, 130, 246] },
    leadMagnet:       { label: "Lead Magnet Blueprint",         fileName: "lead-magnet",         color: [22, 163, 74] },
    socialPosts:      { label: "Social Media Content Pack",     fileName: "social-posts",        color: [139, 92, 246] },
    ctaLibrary:       { label: "CTA Library",                   fileName: "cta-library",         color: [217, 119, 6] },
  };

  const meta = ASSET_META[assetKey] ?? { label: assetKey, fileName: assetKey, color: T.primary };

  function newPage(): number {
    doc.addPage(); pageNum++;
    sf(...T.bg); doc.rect(0, 0, W, H, "F");
    sf(...(meta.color as RGB)); doc.rect(0, 0, W, 3, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(...T.muted);
    doc.text(String(pageNum), W / 2, H - 7, { align: "center" });
    return 18;
  }

  function renderText(y: number, text: string, size = 10, weight = "normal", color = T.body): number {
    if (!text?.trim()) return y;
    doc.setFont("helvetica", weight as any); doc.setFontSize(size); st(...color);
    const lh = size * 0.44 + 1.5;
    const lines = doc.splitTextToSize(text.trim(), CW);
    for (const line of lines) {
      if (y + lh > H - 16) { y = newPage(); }
      doc.text(line, M, y); y += lh;
    }
    return y;
  }

  function renderSection(y: number, heading: string, content: string): number {
    y = renderText(y + 6, heading, 13, "bold", T.primary);
    sd(...(meta.color as RGB)); doc.setLineWidth(0.5); doc.line(M, y + 1, M + 40, y + 1); y += 6;
    return renderText(y, content, 10, "normal", T.body) + 4;
  }

  function renderBulletList(y: number, items: string[]): number {
    for (const item of (items ?? [])) {
      if (!item?.trim()) continue;
      const lines = doc.splitTextToSize(item.trim(), CW - 10);
      if (y + lines.length * 5.8 + 3 > H - 16) y = newPage();
      sf(...(meta.color as RGB)); doc.circle(M + 2.5, y - 1, 1.5, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
      lines.forEach((line: string, i: number) => doc.text(line, M + 7, y + i * 5.8));
      y += lines.length * 5.8 + 2;
    }
    return y + 2;
  }

  // Cover page
  pageNum++;
  sf(...T.dark); doc.rect(0, 0, W, H, "F");
  sf(...(meta.color as RGB)); doc.rect(0, 0, W, 5, "F");
  sf(...(meta.color as RGB)); doc.rect(0, H - 5, W, 5, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...(meta.color as RGB));
  doc.text(`✦ ${params.category.toUpperCase()} MARKETING ✦`, W / 2, 60, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(28); st(...([255,255,255] as any));
  doc.text(meta.label, W / 2, 80, { align: "center" });
  doc.setFont("helvetica", "italic"); doc.setFontSize(13); st(148, 163, 184);
  const tLines = doc.splitTextToSize(params.title, CW);
  tLines.slice(0, 2).forEach((line: string, i: number) => doc.text(line, W / 2, 96 + i * 9, { align: "center" }));
  sd(...(meta.color as RGB)); doc.setLineWidth(1); doc.line(M + 20, 120, W - M - 20, 120);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(148, 163, 184);
  doc.text(`By ${params.authorName}`, W / 2, 132, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); st(71, 85, 105);
  doc.text("Created with Selovox AI Product Studio  ·  selovox.com", W / 2, H - 9, { align: "center" });

  let y = newPage();

  if (assetKey === "facebookGuide" && data.facebookGuide) {
    const g = data.facebookGuide;
    y = renderSection(y, "Facebook Organic Strategy", g.strategy ?? "");
    y = renderText(y, "Content Post Ideas", 12, "bold", T.primary); y += 2;
    y = renderBulletList(y, g.postIdeas ?? []);
    if (g.groupStrategy) y = renderSection(y, "Facebook Group Strategy", g.groupStrategy);
    if (g.bestTimes) y = renderSection(y, "Best Times to Post", g.bestTimes);
  } else if (assetKey === "facebookAdsGuide" && data.facebookAds) {
    const a = data.facebookAds;
    if (a.headline) y = renderSection(y, "Ad Headline", a.headline);
    if (a.primaryText) y = renderSection(y, "Primary Ad Copy", a.primaryText);
    if (a.description) y = renderSection(y, "Ad Description", a.description);
    if (a.variants?.length) {
      y = renderText(y + 4, "Ad Variants", 12, "bold", T.primary); y += 2;
      for (const v of a.variants) {
        y = renderText(y + 4, v.type, 11, "bold", meta.color as RGB);
        if (v.hook) y = renderText(y + 2, `Hook: ${v.hook}`, 10, "italic", T.muted);
        if (v.body) y = renderText(y + 2, v.body, 10, "normal", T.body);
      }
    }
  } else if (assetKey === "youtubeGuide" && data.youtubeGuide) {
    const g = data.youtubeGuide;
    if (g.strategy) y = renderSection(y, "YouTube Channel Strategy", g.strategy);
    if (g.videoIdeas?.length) {
      y = renderText(y + 4, "Video Ideas", 12, "bold", T.primary); y += 4;
      for (const v of g.videoIdeas) {
        y = renderText(y + 2, v.title, 11, "bold", meta.color as RGB);
        if (v.description) y = renderText(y + 1, v.description, 10, "normal", T.body);
        if (v.hook) y = renderText(y + 1, `Hook: ${v.hook}`, 10, "italic", T.muted);
        y += 3;
      }
    }
    if (g.descriptionTemplate) y = renderSection(y, "Description Template", g.descriptionTemplate);
    if (g.seoTips) y = renderSection(y, "SEO Tips", g.seoTips);
  } else if (assetKey === "tiktokGuide" && data.tiktokGuide) {
    const g = data.tiktokGuide;
    if (g.strategy) y = renderSection(y, "TikTok Strategy", g.strategy);
    if (g.contentPillars?.length) {
      y = renderText(y + 4, "Content Pillars", 12, "bold", T.primary); y += 2;
      y = renderBulletList(y, g.contentPillars);
    }
    if (g.videoIdeas?.length) {
      y = renderText(y + 4, "Video Ideas", 12, "bold", T.primary); y += 4;
      for (const v of g.videoIdeas) {
        y = renderText(y + 2, `Hook: ${v.hook}`, 11, "bold", meta.color as RGB);
        if (v.concept) y = renderText(y + 1, v.concept, 10, "normal", T.body);
        if (v.cta) y = renderText(y + 1, `CTA: ${v.cta}`, 10, "italic", T.muted);
        y += 3;
      }
    }
    if (g.bestPractices) y = renderSection(y, "Best Practices", g.bestPractices);
  } else if (assetKey === "salesPage" && data.salesPage) {
    const s = data.salesPage;
    if (s.headline) { y = renderText(y, s.headline, 18, "bold", T.primary); y += 4; }
    if (s.subheadline) { y = renderText(y, s.subheadline, 13, "italic", T.muted); y += 6; }
    if (s.hook) y = renderSection(y, "Opening Hook", s.hook);
    if (s.bullets?.length) {
      y = renderText(y + 4, "What You'll Get:", 12, "bold", T.primary); y += 2;
      y = renderBulletList(y, s.bullets);
    }
    if (s.socialProof) y = renderSection(y, "Social Proof", s.socialProof);
    if (s.testimonials?.length) {
      y = renderText(y + 4, "Testimonials", 12, "bold", T.primary); y += 4;
      for (const t of s.testimonials) {
        sf(...T.primaryLight); doc.roundedRect(M, y, CW, 24, 2, 2, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); st(...T.dark);
        doc.text(`${t.name} · ${t.location}`, M + 4, y + 7);
        doc.setFont("helvetica", "italic"); doc.setFontSize(10); st(...T.body);
        const rLines = doc.splitTextToSize(`"${t.result}"`, CW - 8);
        rLines.forEach((line: string, i: number) => doc.text(line, M + 4, y + 14 + i * 6));
        y += Math.max(24, rLines.length * 6 + 10) + 4;
      }
    }
    if (s.guarantee) y = renderSection(y, "Guarantee", s.guarantee);
    if (s.closingCta) y = renderSection(y, "Call to Action", s.closingCta);
  } else if (assetKey === "leadMagnet" && data.leadMagnet) {
    const l = data.leadMagnet;
    if (l.title) { y = renderText(y, l.title, 18, "bold", T.primary); y += 4; }
    if (l.subtitle) { y = renderText(y, l.subtitle, 12, "italic", T.muted); y += 6; }
    if (l.description) y = renderSection(y, "About This Lead Magnet", l.description);
    if (l.structure?.length) {
      y = renderText(y + 4, "Content Structure", 12, "bold", T.primary); y += 2;
      y = renderBulletList(y, l.structure);
    }
    if (l.deliveryEmail) y = renderSection(y, "Delivery Email", l.deliveryEmail);
  } else if (assetKey === "socialPosts" && data.socialPosts) {
    const s = data.socialPosts;
    if (s.instagram?.length) {
      y = renderText(y, "Instagram Posts", 14, "bold", T.primary); y += 4;
      for (const p of s.instagram) { y = renderSection(y, "Post", p.caption ?? ""); }
    }
    if (s.twitter?.length) {
      y = renderText(y + 6, "Twitter / X Posts", 14, "bold", meta.color as RGB); y += 4;
      for (const t of s.twitter) { y = renderSection(y, "Tweet", t.tweet ?? ""); }
    }
    if (s.linkedin?.length) {
      y = renderText(y + 6, "LinkedIn Posts", 14, "bold", [14, 118, 168] as RGB); y += 4;
      for (const p of s.linkedin) { y = renderSection(y, "Post", p.post ?? ""); }
    }
    if (s.pinterest?.length) {
      y = renderText(y + 6, "Pinterest Pins", 14, "bold", [189, 8, 28] as RGB); y += 4;
      for (const p of s.pinterest) {
        y = renderText(y, p.title ?? "", 11, "bold", T.dark);
        if (p.description) y = renderText(y + 2, p.description, 10, "normal", T.body);
        y += 4;
      }
    }
  } else if (assetKey === "ctaLibrary" && data.ctaLibrary) {
    y = renderText(y, "CTA Library", 16, "bold", T.primary); y += 6;
    const ctas: string[] = Array.isArray(data.ctaLibrary) ? data.ctaLibrary : [];
    ctas.forEach((cta, i) => {
      if (y + 14 > H - 16) y = newPage();
      sf(...T.primaryLight); doc.roundedRect(M, y, CW, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); st(...T.primary);
      doc.text(`${i + 1}`, M + 5, y + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.dark);
      const ctaLines = doc.splitTextToSize(cta, CW - 14);
      ctaLines.slice(0, 2).forEach((line: string, li: number) => doc.text(line, M + 12, y + 4 + li * 5));
      y += 14;
    });
  }

  const slug = params.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40);
  doc.save(`${slug}-${meta.fileName}.pdf`);
}

async function buildWorksheetsPdf(data: any, params: StudioForm): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const T = THEME_PALETTES[params.visualTheme] ?? THEME_PALETTES.Modern;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const M = 20; const CW = W - M * 2;
  let pageNum = 0;

  const sf = (...rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const sd = (...rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const st = (...rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  function newPage(): number {
    doc.addPage(); pageNum++;
    sf(...T.bg); doc.rect(0, 0, W, H, "F");
    sf(...T.primary); doc.rect(0, 0, W, 3, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(...T.muted);
    doc.text(String(pageNum), W / 2, H - 7, { align: "center" });
    return 18;
  }

  // Cover
  pageNum++;
  sf(...T.dark); doc.rect(0, 0, W, H, "F");
  sf(...T.primary); doc.rect(0, 0, W, 4, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); st(...T.primaryDim);
  doc.text("✦ INTERACTIVE WORKSHEETS ✦", W / 2, 55, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); st(...([255,255,255] as any));
  doc.text(params.title, W / 2, 72, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); st(148, 163, 184);
  doc.text(`${data.worksheets?.length ?? 4} Interactive Worksheets`, W / 2, 86, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); st(71, 85, 105);
  doc.text("Created with Selovox AI Product Studio  ·  selovox.com", W / 2, H - 9, { align: "center" });

  for (const ws of (data.worksheets ?? [])) {
    let y = newPage();
    sf(...T.primary); doc.roundedRect(M, y, CW, 20, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(15); st(...([255,255,255] as any));
    const wsLines = doc.splitTextToSize(ws.title ?? "Worksheet", CW - 8);
    wsLines.slice(0, 2).forEach((line: string, i: number) => doc.text(line, M + 4, y + 7 + i * 8));
    if (ws.subtitle) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(10); st(...T.primaryDim);
      doc.text(ws.subtitle, M + 4, y + 17);
    }
    y += 28;

    if (ws.instructions) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); st(...T.muted);
      const instrLines = doc.splitTextToSize(ws.instructions, CW);
      instrLines.forEach((line: string) => { doc.text(line, M, y); y += 5.5; });
      y += 4;
    }

    for (const section of (ws.sections ?? [])) {
      if (y + 30 > H - 16) y = newPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); st(...T.primary);
      doc.text(section.heading ?? "", M, y); y += 6;
      sd(...T.primary); doc.setLineWidth(0.4); doc.line(M, y, M + 40, y); y += 5;

      if (section.prompt) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
        const pLines = doc.splitTextToSize(section.prompt, CW);
        pLines.forEach((line: string) => { doc.text(line, M, y); y += 5.8; });
        y += 4;
      }

      if (section.items?.length) {
        for (const item of section.items) {
          sf(...T.primaryLight); doc.roundedRect(M, y, CW, 10, 1, 1, "F");
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); st(...T.body);
          doc.text(`□  ${item}`, M + 4, y + 6.5); y += 12;
        }
        y += 2;
      }

      const lines = Math.max(3, section.lines ?? 4);
      for (let i = 0; i < lines; i++) {
        if (y + 10 > H - 16) break;
        sd(209, 213, 219); doc.setLineWidth(0.3); doc.line(M, y + 8, W - M, y + 8); y += 10;
      }
      y += 8;
    }
  }

  doc.save(`${params.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}-worksheets.pdf`);
}

async function buildBonusesPdf(data: any, params: StudioForm): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const T = THEME_PALETTES[params.visualTheme] ?? THEME_PALETTES.Modern;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const M = 20; const CW = W - M * 2;
  let pageNum = 0;

  const sf = (...rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const sd = (...rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const st = (...rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  function newPage(): number {
    doc.addPage(); pageNum++;
    sf(...T.bg); doc.rect(0, 0, W, H, "F");
    sf(...T.primary); doc.rect(0, 0, W, 3, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); st(...T.muted);
    doc.text(String(pageNum), W / 2, H - 7, { align: "center" });
    return 18;
  }

  pageNum++;
  sf(...T.dark); doc.rect(0, 0, W, H, "F");
  sf(...T.primary); doc.rect(0, 0, W, 4, "F");
  sf(...T.accent); doc.rect(0, H - 4, W, 4, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); st(...T.primaryDim);
  doc.text("✦ BONUS MATERIALS ✦", W / 2, 55, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); st(...([255,255,255] as any));
  doc.text(params.title, W / 2, 72, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); st(148, 163, 184);
  doc.text(`${data.bonuses?.length ?? 3} Premium Bonus Items`, W / 2, 86, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); st(71, 85, 105);
  doc.text("Created with Selovox AI Product Studio  ·  selovox.com", W / 2, H - 9, { align: "center" });

  for (const bonus of (data.bonuses ?? [])) {
    let y = newPage();

    // Bonus header
    sf(...T.primary); doc.rect(0, y - 5, W, 30, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); st(...T.primaryDim);
    doc.text(`✦ BONUS · ${(bonus.value ?? "")}`, M, y + 2);
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); st(...([255,255,255] as any));
    const bLines = doc.splitTextToSize(bonus.title ?? "Bonus", CW);
    bLines.slice(0, 2).forEach((line: string, i: number) => doc.text(line, M, y + 10 + i * 9));
    if (bonus.subtitle) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(10); st(...T.primaryDim);
      doc.text(bonus.subtitle, M, y + 22);
    }
    y += 36;

    if (bonus.description) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
      const dLines = doc.splitTextToSize(bonus.description, CW);
      dLines.forEach((line: string) => { doc.text(line, M, y); y += 6; });
      y += 6;
    }

    sd(229, 231, 235); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 8;

    if (bonus.items?.length) {
      for (const item of bonus.items) {
        if (!item?.trim()) continue;
        if (y + 10 > H - 16) y = newPage();
        sf(...T.primaryLight); doc.roundedRect(M, y, 7, 7, 1, 1, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); st(...T.primary);
        doc.text("✓", M + 3.5, y + 5, { align: "center" });
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
        const iLines = doc.splitTextToSize(item.trim(), CW - 12);
        iLines.forEach((line: string, i: number) => doc.text(line, M + 10, y + 4 + i * 5.8));
        y += Math.max(10, iLines.length * 5.8 + 3);
      }
    }

    if (bonus.sections?.length) {
      for (const sec of bonus.sections) {
        if (y + 20 > H - 16) y = newPage();
        doc.setFont("helvetica", "bold"); doc.setFontSize(12); st(...T.primary);
        doc.text(sec.heading ?? "", M, y); y += 7;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); st(...T.body);
        const cLines = doc.splitTextToSize(sec.content ?? "", CW);
        cLines.forEach((line: string) => { if (y + 6 > H - 16) { y = newPage(); } doc.text(line, M, y); y += 6; });
        y += 5;
      }
    }
  }

  doc.save(`${params.title.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}-bonuses.pdf`);
}

// ─── Wizard Components ────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-sm font-medium text-foreground mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              value === opt
                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-violet-400 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step1({ form, setForm, onNext }: { form: StudioForm; setForm: (f: StudioForm) => void; onNext: () => void }) {
  const set = (k: keyof StudioForm, v: any) => setForm({ ...form, [k]: v });
  const canProceed = form.title.trim().length > 3;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium border border-violet-200 dark:border-violet-800">
          <Sparkles className="w-4 h-4" />
          Step 1 of 2 — Product Setup
        </div>
        <h2 className="text-2xl font-bold text-foreground">Design Your Product</h2>
        <p className="text-muted-foreground text-sm">Tell us about what you're creating and we'll generate a premium digital product.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Label className="text-sm font-medium mb-1.5 block">Product Title <span className="text-red-500">*</span></Label>
          <Input
            placeholder="e.g. The Ultimate Dropshipping Blueprint"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm font-medium mb-1.5 block">Description</Label>
          <Textarea
            placeholder="What does this product help people achieve? What's the core promise?"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            className="resize-none h-20"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Target Audience</Label>
          <Input
            placeholder="e.g. Beginner entrepreneurs aged 25-40"
            value={form.targetAudience}
            onChange={e => set("targetAudience", e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Problem Solved</Label>
          <Input
            placeholder="e.g. Not knowing how to find winning products"
            value={form.problemSolved}
            onChange={e => set("problemSolved", e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Author Name</Label>
          <Input
            placeholder="Your name or pen name"
            value={form.authorName}
            onChange={e => set("authorName", e.target.value)}
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Page Count</Label>
          <div className="flex gap-2">
            {PAGE_COUNTS.map(n => (
              <button
                key={n}
                onClick={() => set("pageCount", n)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  form.pageCount === n ? "bg-violet-600 text-white border-violet-600" : "bg-background text-muted-foreground border-border hover:border-violet-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 pt-2">
        <SelectField label="Category" value={form.category} onChange={v => set("category", v)} options={CATEGORIES} />
        <SelectField label="Writing Style" value={form.writingStyle} onChange={v => set("writingStyle", v)} options={WRITING_STYLES} />
        <SelectField label="Direction / Format" value={form.directionAngle} onChange={v => set("directionAngle", v)} options={DIRECTION_ANGLES} />
        <SelectField label="Tone" value={form.tone} onChange={v => set("tone", v)} options={TONES} />
        <SelectField label="Visual Theme" value={form.visualTheme} onChange={v => set("visualTheme", v)} options={VISUAL_THEMES} />
        <SelectField label="Image Source" value={form.imageSource} onChange={v => set("imageSource", v)} options={IMAGE_SOURCES} />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-11 gap-2"
        >
          Choose Assets <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Step2({
  selectedAssets, setSelectedAssets, onBack, onGenerate, loading,
}: {
  selectedAssets: string[]; setSelectedAssets: (a: string[]) => void;
  onBack: () => void; onGenerate: () => void; loading: boolean;
}) {
  const toggle = (key: string) => {
    setSelectedAssets(
      selectedAssets.includes(key) ? selectedAssets.filter(k => k !== key) : [...selectedAssets, key]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium border border-violet-200 dark:border-violet-800">
          <Package className="w-4 h-4" />
          Step 2 of 2 — Select Assets
        </div>
        <h2 className="text-2xl font-bold text-foreground">What should we generate?</h2>
        <p className="text-muted-foreground text-sm">Select the assets you want. Each will be generated separately as its own downloadable file.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ASSETS.map(asset => {
          const Icon = asset.icon;
          const selected = selectedAssets.includes(asset.key);
          return (
            <button
              key={asset.key}
              onClick={() => toggle(asset.key)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all group ${
                selected
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 shadow-sm"
                  : "border-border bg-card hover:border-violet-300 hover:shadow-sm"
              }`}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {!selected && (
                <div className="absolute top-3 right-3 w-5 h-5 border-2 border-muted-foreground/30 rounded-full" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${asset.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-sm text-foreground mb-1">{asset.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{asset.description}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 bg-muted/50 rounded-xl p-4 border">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{selectedAssets.length}</span> assets selected
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAssets(ASSETS.map(a => a.key))}>Select All</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedAssets(["ebook"])}>Just Ebook</Button>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={onGenerate}
          disabled={loading || selectedAssets.length === 0}
          className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-8 h-11 gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate {selectedAssets.length} Asset{selectedAssets.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}

function GenerationView({ stage, title }: { stage: number; title: string }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Building Your Product</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">"{title}" is being crafted by our AI. This takes 2-4 minutes.</p>
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stage;
          const isDone = i < stage;
          const isPending = i > stage;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isActive ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 shadow-sm" :
                isDone ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 opacity-80" :
                "bg-muted/30 border-border opacity-40"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDone ? "bg-green-500" :
                isActive ? `bg-gradient-to-br ${s.color}` :
                "bg-muted"
              }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                 isActive ? <Icon className="w-5 h-5 text-white animate-pulse" /> :
                 <Icon className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm ${isActive ? "text-foreground" : isDone ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                  Stage {s.id}: {s.label}
                </div>
                {isActive && (
                  <div className="text-xs text-muted-foreground mt-0.5">{s.tip}</div>
                )}
              </div>
              {isActive && <Loader2 className="w-4 h-4 text-violet-600 animate-spin flex-shrink-0" />}
              {isDone && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="max-w-lg mx-auto">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Generation progress</span>
          <span>{Math.round((stage / STAGES.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${(stage / STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Asset Vault ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-muted transition-colors flex-shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function FacebookAdsReader({ data }: { data: any }) {
  const ads = data?.facebookAds;
  if (!ads) return <p className="text-xs text-muted-foreground italic">Facebook Ads data not found in generation result.</p>;

  const VARIANT_COLORS: Record<string, string> = {
    "Problem-aware": "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    "Testimonial":   "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    "Curiosity":     "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
  };

  return (
    <div className="space-y-5 text-sm">
      {/* Ad Preview Card */}
      <div className="border-2 border-[#1877F2]/30 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-[#1877F2] px-4 py-2.5 flex items-center gap-2">
          <Facebook className="w-4 h-4 text-white" />
          <span className="text-white text-xs font-semibold">Facebook Ad Preview</span>
        </div>
        <div className="p-4 space-y-3">
          {ads.primaryText && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Primary Text</span>
                <CopyBtn text={ads.primaryText} />
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ads.primaryText}</p>
            </div>
          )}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/60 h-12 flex items-center justify-center">
              <span className="text-xs text-muted-foreground italic">[ Your image / video here ]</span>
            </div>
            {ads.headline && (
              <div className="px-3 py-2 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-foreground leading-snug">{ads.headline}</div>
                  <CopyBtn text={ads.headline} />
                </div>
                {ads.description && (
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <p className="text-xs text-muted-foreground leading-snug">{ads.description}</p>
                    <CopyBtn text={ads.description} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ad Variants */}
      {(ads.variants ?? []).length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            Ad Copy Variants ({ads.variants.length})
          </h4>
          <div className="space-y-3">
            {ads.variants.map((v: any, i: number) => {
              const colorClass = VARIANT_COLORS[v.type] ?? "bg-muted/40 border-border text-muted-foreground";
              const fullText = `Hook: ${v.hook ?? ""}\n\n${v.body ?? ""}`;
              return (
                <div key={i} className="border rounded-xl overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${colorClass}`}>
                    <span className="text-xs font-bold uppercase tracking-wide">{v.type} Ad</span>
                    <CopyBtn text={fullText} label="Copy Variant" />
                  </div>
                  <div className="p-4 space-y-3 bg-card">
                    {v.hook && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">Hook (first 3 seconds)</span>
                          <CopyBtn text={v.hook} />
                        </div>
                        <p className="text-sm font-medium text-foreground leading-relaxed">{v.hook}</p>
                      </div>
                    )}
                    {v.body && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">Ad Body</span>
                          <CopyBtn text={v.body} />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{v.body}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Copy All Button */}
      <div className="flex justify-end">
        <CopyBtn
          text={[
            ads.headline && `HEADLINE: ${ads.headline}`,
            ads.description && `DESCRIPTION: ${ads.description}`,
            ads.primaryText && `PRIMARY TEXT:\n${ads.primaryText}`,
            ...(ads.variants ?? []).map((v: any) => `\n${v.type?.toUpperCase()} VARIANT:\nHook: ${v.hook}\n${v.body}`),
          ].filter(Boolean).join("\n\n")}
          label="Copy All Ad Copy"
        />
      </div>
    </div>
  );
}

function AssetCard({
  assetKey, result, params,
}: {
  assetKey: string; result: any; params: StudioForm;
}) {
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const def = ASSETS.find(a => a.key === assetKey);
  if (!def) return null;
  const Icon = def.icon;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (assetKey === "ebook") {
        await buildEbookPdf(result.ebook, params);
      } else if (assetKey === "emailSequence") {
        await buildEmailSequencePdf(result.emailSequence, params);
      } else if (assetKey === "worksheets") {
        await buildWorksheetsPdf(result.worksheets, params);
      } else if (assetKey === "bonuses") {
        await buildBonusesPdf(result.bonuses, params);
      } else {
        await buildMarketingPdf(result.marketing, assetKey, params);
      }
    } catch (e) {
      console.error("PDF build error:", e);
    } finally {
      setDownloading(false);
    }
  };

  // Check if this asset has data
  const hasData =
    (assetKey === "ebook" && result.ebook?.chapters?.length > 0) ||
    (assetKey === "emailSequence" && result.emailSequence?.emails?.length > 0) ||
    (assetKey === "worksheets" && result.worksheets?.worksheets?.length > 0) ||
    (assetKey === "bonuses" && result.bonuses?.bonuses?.length > 0) ||
    (["facebookGuide","facebookAdsGuide","youtubeGuide","tiktokGuide","salesPage","landingPage","leadMagnet","socialPosts","ctaLibrary"].includes(assetKey) && result.marketing);

  const canReadOnline = assetKey === "facebookAdsGuide" && hasData;

  return (
    <div className={`bg-card border rounded-xl transition-all ${hasData ? "shadow-sm hover:shadow-md" : "opacity-60"} ${viewing ? "col-span-full" : ""}`}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${def.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
              {def.label}
              {assetKey === "facebookAdsGuide" && hasData && (
                <span className="text-xs bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-medium border border-pink-200 dark:border-pink-800">New</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{def.description}</div>
            {hasData && (
              <div className="flex items-center gap-1 mt-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ready</span>
              </div>
            )}
            {!hasData && (
              <div className="flex items-center gap-1 mt-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-xs text-amber-600 font-medium">Not generated</span>
              </div>
            )}
          </div>
        </div>

        {assetKey === "ebook" && result.ebook && (
          <div className="space-y-1 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
            <div className="font-semibold text-foreground text-sm truncate">{result.ebook.title}</div>
            {result.ebook.subtitle && <div className="italic">{result.ebook.subtitle}</div>}
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className="font-medium text-violet-600">{result.ebook.chapters?.length ?? 0} chapters</span>
              <span className="font-medium text-blue-600">
                {result.ebook.chapters?.reduce((s: number, c: any) => s + (c.body?.split(/\s+/).filter(Boolean).length ?? 0), 0).toLocaleString()} words
              </span>
            </div>
          </div>
        )}

        {assetKey === "emailSequence" && result.emailSequence && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1">
            <div className="font-medium text-foreground">{result.emailSequence.emails?.length ?? 0} emails across 30 days</div>
            {result.emailSequence.emails?.slice(0, 3).map((e: any, i: number) => (
              <div key={i} className="truncate">Day {e.day}: {e.subject}</div>
            ))}
          </div>
        )}

        {assetKey === "facebookAdsGuide" && hasData && !viewing && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1.5">
            {result.marketing?.facebookAds?.headline && (
              <div className="font-semibold text-foreground">{result.marketing.facebookAds.headline}</div>
            )}
            {result.marketing?.facebookAds?.description && (
              <div className="italic">{result.marketing.facebookAds.description}</div>
            )}
            {result.marketing?.facebookAds?.variants && (
              <div className="flex gap-2 flex-wrap mt-1">
                {result.marketing.facebookAds.variants.map((v: any, i: number) => (
                  <span key={i} className="text-xs bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full border border-pink-200 dark:border-pink-800">
                    {v.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`flex gap-2 ${canReadOnline ? "" : ""}`}>
          {canReadOnline && (
            <Button
              onClick={() => setViewing(!viewing)}
              variant={viewing ? "default" : "outline"}
              className={`flex-1 gap-2 text-sm h-9 ${viewing ? "bg-pink-600 hover:bg-pink-700 text-white" : "border-pink-300 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/30"}`}
            >
              <Eye className="w-4 h-4" />
              {viewing ? "Close Reader" : "Read Online"}
            </Button>
          )}
          <Button
            onClick={handleDownload}
            disabled={downloading || !hasData}
            variant="outline"
            className={`gap-2 text-sm h-9 ${canReadOnline ? "flex-1" : "w-full"}`}
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Building PDF..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Inline Reader Panel */}
      {viewing && assetKey === "facebookAdsGuide" && (
        <div className="border-t bg-muted/20 p-5 rounded-b-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              Facebook Ads Playbook — Online Reader
            </h3>
            <button
              onClick={() => setViewing(false)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-muted"
            >
              ✕ Close
            </button>
          </div>
          <FacebookAdsReader data={result.marketing} />
        </div>
      )}
    </div>
  );
}

function ResultsView({
  result, params, onReset,
}: {
  result: any; params: StudioForm; onReset: () => void;
}) {
  const selectedAssets: string[] = result.params?.selectedAssets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Product Generated Successfully</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{result.ebook?.title ?? params.title}</h2>
          {result.ebook?.subtitle && <p className="text-muted-foreground text-sm mt-1 italic">{result.ebook.subtitle}</p>}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-xs bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800 font-medium">{params.category}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full border font-medium">{params.writingStyle}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full border font-medium">{params.tone}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full border font-medium">{params.visualTheme} theme</span>
          </div>
        </div>
        <Button variant="outline" onClick={onReset} className="gap-2 flex-shrink-0">
          <RefreshCw className="w-4 h-4" /> New Product
        </Button>
      </div>

      <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0" />
        <p className="text-sm text-violet-700 dark:text-violet-300">
          <strong>{selectedAssets.length} assets</strong> generated. Click "Download PDF" on any card to build and save it to your device.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedAssets.map(key => (
          <AssetCard key={key} assetKey={key} result={result} params={params} />
        ))}
      </div>

      {result.ebook?.authorBio && (
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Author Bio
          </h3>
          <p className="text-sm text-muted-foreground">{result.ebook.authorBio}</p>
        </div>
      )}

      {result.ebook?.chapters && result.ebook.chapters.length > 0 && (
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-600" /> Table of Contents
          </h3>
          <div className="space-y-2">
            {(result.ebook.tableOfContents ?? result.ebook.chapters.map((c: any, i: number) => `Chapter ${i+1}: ${c.title}`)).map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────

function HistoryView({ onSelectProduct }: { onSelectProduct: (id: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get("/pdfs/studio/history")
      .then(r => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!items.length) return (
    <div className="text-center py-20 text-muted-foreground">
      <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No products yet</p>
      <p className="text-sm mt-1">Switch to Studio to generate your first product</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-card border rounded-xl p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-all cursor-pointer group"
          onClick={() => onSelectProduct(item.id)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-950/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground text-sm truncate">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {item.params?.category && <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.params.category}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1 flex-wrap justify-end">
              {(item.selectedAssets ?? []).slice(0, 3).map((a: string) => {
                const def = ASSETS.find(d => d.key === a);
                return def ? (
                  <span key={a} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${def.color}`}>
                    {def.label}
                  </span>
                ) : null;
              })}
              {(item.selectedAssets?.length ?? 0) > 3 && (
                <span className="text-xs text-muted-foreground">+{item.selectedAssets.length - 3}</span>
              )}
            </div>
            <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: StudioForm = {
  title: "",
  description: "",
  targetAudience: "",
  problemSolved: "",
  category: "Business",
  writingStyle: "Educational",
  directionAngle: "Ultimate Guide",
  tone: "Authority",
  pageCount: 50,
  visualTheme: "Modern",
  imageSource: "Pollinations AI",
  authorName: "The Author",
};

type PageView = "studio" | "history";
type WizardStep = "step1" | "step2" | "generating" | "results";

export default function PdfStudioPage() {
  const { toast } = useToast();
  const [view, setView] = useState<PageView>("studio");
  const [wizardStep, setWizardStep] = useState<WizardStep>("step1");
  const [form, setForm] = useState<StudioForm>(DEFAULT_FORM);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(DEFAULT_ASSETS);
  const [generationStage, setGenerationStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const stageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advanceStages = () => {
    setGenerationStage(0);
    stageIntervalRef.current = setInterval(() => {
      setGenerationStage(prev => {
        if (prev >= STAGES.length - 1) {
          if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 18000);
  };

  const stopStages = () => {
    if (stageIntervalRef.current) {
      clearInterval(stageIntervalRef.current);
      stageIntervalRef.current = null;
    }
    setGenerationStage(STAGES.length);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setWizardStep("generating");
    advanceStages();

    try {
      const res = await apiClient.post("/pdfs/studio/generate", {
        ...form,
        selectedAssets,
      });
      stopStages();
      setResult(res.data);
      setWizardStep("results");
      toast({ title: "Product generated!", description: `${selectedAssets.length} assets are ready to download.` });
    } catch (err: any) {
      stopStages();
      setWizardStep("step2");
      setLoading(false);
      toast({
        title: "Generation failed",
        description: err?.response?.data?.error ?? err?.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return;
    }
    setLoading(false);
  };

  const handleReset = () => {
    setWizardStep("step1");
    setResult(null);
    setGenerationStage(0);
    setForm(DEFAULT_FORM);
    setSelectedAssets(DEFAULT_ASSETS);
  };

  const handleSelectHistoryProduct = async (id: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/pdfs/studio/${id}`);
      setResult(res.data);
      setForm(res.data.params ?? DEFAULT_FORM);
      setSelectedAssets(res.data.params?.selectedAssets ?? DEFAULT_ASSETS);
      setWizardStep("results");
      setView("studio");
    } catch {
      toast({ title: "Failed to load product", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            AI Product Studio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate premium digital products — ebooks, email sequences, marketing assets and more.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "studio" ? "default" : "outline"}
            size="sm"
            onClick={() => { setView("studio"); if (wizardStep === "results" && !result) setWizardStep("step1"); }}
            className={view === "studio" ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            <PenTool className="w-4 h-4 mr-2" /> Studio
          </Button>
          <Button
            variant={view === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("history")}
            className={view === "history" ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            <History className="w-4 h-4 mr-2" /> History
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="p-6 md:p-8">
        {view === "history" && (
          <HistoryView onSelectProduct={handleSelectHistoryProduct} />
        )}

        {view === "studio" && wizardStep === "step1" && (
          <Step1 form={form} setForm={setForm} onNext={() => setWizardStep("step2")} />
        )}

        {view === "studio" && wizardStep === "step2" && (
          <Step2
            selectedAssets={selectedAssets}
            setSelectedAssets={setSelectedAssets}
            onBack={() => setWizardStep("step1")}
            onGenerate={handleGenerate}
            loading={loading}
          />
        )}

        {view === "studio" && wizardStep === "generating" && (
          <GenerationView stage={generationStage} title={form.title} />
        )}

        {view === "studio" && wizardStep === "results" && result && (
          <ResultsView result={result} params={form} onReset={handleReset} />
        )}
      </Card>
    </div>
  );
}
