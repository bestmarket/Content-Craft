import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Rocket, Zap, CheckCircle2, Circle, ArrowRight, Sparkles,
  Clock, Package, Star, Crown, FileText, Mail, Megaphone,
  BookOpen, Target, ListChecks, Users, TrendingUp, BarChart3,
  ExternalLink, ChevronDown, ChevronUp, AlertCircle, Eye, Volume2,
  Edit2, Save, X, Wand2, Send, Shield, RefreshCw,
} from "lucide-react";

const API_TOKEN = () => localStorage.getItem("token") ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_TOKEN()}`,
});

// ── Stage definitions ──────────────────────────────────────────────────────────
const STAGES = [
  { icon: "🧠", label: "Analyzing niche & audience psychology" },
  { icon: "📖", label: "Structuring premium content framework" },
  { icon: "✍️", label: "Writing expert-level chapters" },
  { icon: "📚", label: "Adding premium bonus sections" },
  { icon: "🎯", label: "Engineering high-converting sales page" },
  { icon: "📧", label: "Creating 30-day email sequence" },
  { icon: "📱", label: "Generating viral marketing content" },
  { icon: "✅", label: "Quality review & bundle packaging" },
];

// ── Tier configs ───────────────────────────────────────────────────────────────
const TIERS = [
  {
    key: "tripwire",
    badge: "STARTER",
    label: "Quick Win Guide",
    price: "$9",
    pages: "10",
    stageDelay: 11000,
    accent: "amber",
    borderClass: "border-amber-400/40",
    glowClass: "shadow-amber-500/10",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    priceBg: "bg-amber-500/10",
    priceText: "text-amber-300",
    progressBar: "bg-amber-400",
    includes: [
      { icon: FileText, text: "10-page action guide" },
      { icon: ListChecks, text: "Complete implementation checklist" },
      { icon: Target, text: "Quick-win framework" },
      { icon: BookOpen, text: "Resource vault" },
      { icon: Megaphone, text: "Sales landing page" },
      { icon: Mail, text: "5-email welcome sequence" },
    ],
  },
  {
    key: "main",
    badge: "BEST VALUE",
    label: "Complete System",
    price: "$27",
    pages: "30",
    stageDelay: 18000,
    featured: true,
    accent: "violet",
    borderClass: "border-violet-400/60",
    glowClass: "shadow-violet-500/20",
    badgeBg: "bg-violet-500/20 text-violet-200 border-violet-400/40",
    priceBg: "bg-violet-500/10",
    priceText: "text-violet-300",
    progressBar: "bg-violet-400",
    includes: [
      { icon: FileText, text: "30-page premium guide (6 chapters)" },
      { icon: Target, text: "Proprietary success framework" },
      { icon: AlertCircle, text: "Common mistakes deep-dive" },
      { icon: ListChecks, text: "20-question FAQ section" },
      { icon: BarChart3, text: "30-day action plan" },
      { icon: BookOpen, text: "Workbook & exercises" },
      { icon: Package, text: "Complete implementation checklist" },
      { icon: Megaphone, text: "High-converting sales page" },
      { icon: Mail, text: "30-day email sequence" },
      { icon: TrendingUp, text: "Full social media marketing kit" },
    ],
  },
  {
    key: "upsell",
    badge: "VIP",
    label: "VIP Masterclass",
    price: "$97",
    pages: "50",
    stageDelay: 26000,
    accent: "yellow",
    borderClass: "border-yellow-400/40",
    glowClass: "shadow-yellow-500/10",
    badgeBg: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    priceBg: "bg-yellow-500/10",
    priceText: "text-yellow-300",
    progressBar: "bg-yellow-400",
    includes: [
      { icon: FileText, text: "50-page VIP masterclass (8 chapters)" },
      { icon: Star, text: "Advanced proprietary frameworks" },
      { icon: Package, text: "5 exclusive bonus sections" },
      { icon: BookOpen, text: "Templates & swipe file package" },
      { icon: Users, text: "Case study collection" },
      { icon: BarChart3, text: "Success roadmap visualization" },
      { icon: ListChecks, text: "50-question FAQ encyclopedia" },
      { icon: Target, text: "60/90-day action plan" },
      { icon: CheckCircle2, text: "Premium checklists (3 levels)" },
      { icon: Megaphone, text: "Premium sales page" },
      { icon: Mail, text: "30-day email sequence" },
      { icon: TrendingUp, text: "Complete marketing content kit" },
    ],
  },
];

const NICHES = [
  { emoji: "💪", label: "Fitness & Health" },
  { emoji: "💰", label: "Finance & Wealth" },
  { emoji: "👶", label: "Parenting & Family" },
  { emoji: "💻", label: "Tech & AI" },
  { emoji: "🍕", label: "Food & Nutrition" },
  { emoji: "💑", label: "Relationships" },
  { emoji: "🎨", label: "Creative & Art" },
  { emoji: "📈", label: "Business & Marketing" },
  { emoji: "🧠", label: "Personal Development" },
  { emoji: "🌿", label: "Wellness & Mindfulness" },
  { emoji: "🏠", label: "Home & Lifestyle" },
  { emoji: "🎓", label: "Education & Skills" },
];

type Phase = "setup" | "researching" | "generating" | "results";

interface TierResult {
  id: number;
  title: string;
  subtitle: string;
  price: number;
  pageCount: number;
  sellabilityScore: number;
  bundleTier: string;
  tierLabel: string;
  bundlePrice: number;
  chaptersData: any;
  targetAudience?: string;
}

interface BundleResult {
  tripwire: TierResult;
  main: TierResult;
  upsell: TierResult;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Animated stage card ────────────────────────────────────────────────────────
function TierGeneratingCard({
  tier,
  stageIndex,
  done,
}: {
  tier: typeof TIERS[0];
  stageIndex: number;
  done: boolean;
}) {
  const currentStage = done ? STAGES.length : Math.min(stageIndex, STAGES.length - 1);
  const progress = done ? 100 : Math.round((currentStage / STAGES.length) * 100);

  return (
    <div
      className={`relative rounded-2xl border ${tier.borderClass} bg-slate-900/80 backdrop-blur-sm p-5 flex flex-col gap-4 shadow-xl ${tier.glowClass} ${tier.featured ? "ring-1 ring-violet-400/30 scale-[1.02]" : ""} transition-all duration-500`}
    >
      {tier.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ★ FEATURED
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-widest border rounded px-2 py-0.5 ${tier.badgeBg}`}>
            {tier.badge}
          </span>
          <p className="text-white font-semibold mt-1">{tier.label}</p>
        </div>
        <div className={`text-right rounded-lg px-3 py-1 ${tier.priceBg}`}>
          <p className={`text-2xl font-black ${tier.priceText}`}>{tier.price}</p>
          <p className="text-muted-foreground text-[10px]">{tier.pages} pages</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-muted-foreground text-xs">{done ? "Complete" : `Stage ${currentStage + 1} of ${STAGES.length}`}</span>
          <span className="text-muted-foreground text-xs font-mono">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${tier.progressBar} rounded-full transition-all duration-1000`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {STAGES.map((stage, idx) => {
          const completed = done || idx < currentStage;
          const active = !done && idx === currentStage;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                completed ? "opacity-100" : active ? "opacity-100" : "opacity-30"
              }`}
            >
              {completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : active ? (
                <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-t-transparent border-slate-300 animate-spin" />
                </span>
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={completed ? "text-muted-foreground/60" : active ? "text-white font-medium" : "text-muted-foreground"}>
                {active && <span className="mr-1">{stage.icon}</span>}
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {done && (
        <div className="mt-1 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 text-sm font-semibold">Ready to publish</span>
        </div>
      )}
    </div>
  );
}

// ── Score Badge component ──────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : score >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-red-400 bg-red-500/10 border-red-500/30";
  const label = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Low";
  return (
    <div className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>
      <BarChart3 className="w-3 h-3" />
      {score}% · {label}
    </div>
  );
}

// ── Result tier card ───────────────────────────────────────────────────────────
function TierResultCard({ tier, result: initialResult }: { tier: typeof TIERS[0]; result: TierResult }) {
  const [result, setResult] = useState<TierResult>(initialResult);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialResult.title);
  const [editSubtitle, setEditSubtitle] = useState(initialResult.subtitle ?? "");
  const [editPrice, setEditPrice] = useState(String(initialResult.price ?? ""));
  const [editChapters, setEditChapters] = useState<any[]>(initialResult.chaptersData?.chapters ?? []);
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "done" | "error">("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [improveMsg, setImproveMsg] = useState("");

  const chapters = result.chaptersData?.chapters ?? [];
  const score = result.sellabilityScore ?? 88;
  const canPublish = score >= 60;

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const body: any = {};
      if (editTitle.trim()) body.title = editTitle.trim();
      if (editSubtitle.trim()) body.subtitle = editSubtitle.trim();
      if (editPrice && !isNaN(Number(editPrice))) body.price = Number(editPrice);
      if (editChapters.length) body.chapters = editChapters;
      const res = await fetch(`/api/products/${result.id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) {
        setResult(prev => ({
          ...prev,
          title: editTitle.trim() || prev.title,
          subtitle: editSubtitle.trim() || prev.subtitle,
          price: Number(editPrice) || prev.price,
          chaptersData: { ...prev.chaptersData, chapters: editChapters },
        }));
        setSaveMsg("✅ Saved!");
        setEditing(false);
      } else {
        setSaveMsg("❌ Save failed.");
      }
    } catch {
      setSaveMsg("❌ Network error.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const handleAIImprove = async () => {
    setImproving(true);
    setImproveMsg("🤖 AI is upgrading your content...");
    try {
      const res = await fetch(`/api/products/${result.id}/improve`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(prev => ({
          ...prev,
          sellabilityScore: data.sellabilityScore ?? prev.sellabilityScore,
          chaptersData: data.chaptersData ?? prev.chaptersData,
        }));
        setEditChapters(data.chaptersData?.chapters ?? editChapters);
        setImproveMsg(`✅ Content upgraded! Score: ${data.sellabilityScore}%`);
      } else {
        setImproveMsg("❌ Improve failed — try again.");
      }
    } catch {
      setImproveMsg("❌ Network error.");
    } finally {
      setImproving(false);
      setTimeout(() => setImproveMsg(""), 6000);
    }
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setPublishMsg("");
    try {
      const res = await fetch(`/api/products/${result.id}/publish`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setPublishStatus("done");
        setPublishMsg(data.message ?? "Submitted for review!");
      } else {
        setPublishStatus("error");
        setPublishMsg(data.error ?? "Publish failed.");
      }
    } catch {
      setPublishStatus("error");
      setPublishMsg("Network error.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border ${tier.borderClass} bg-slate-900/90 backdrop-blur-sm overflow-hidden shadow-2xl ${tier.glowClass} ${tier.featured ? "ring-1 ring-violet-400/30" : ""}`}
    >
      {tier.featured && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
      )}

      <div className={`p-5 border-b ${tier.borderClass}`}>
        <div className="flex items-start justify-between mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest border rounded px-2 py-0.5 ${tier.badgeBg}`}>
            {tier.badge}
          </span>
          <div className="text-right">
            {editing ? (
              <Input
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-20 h-7 text-right text-sm bg-slate-800 border-slate-600 text-white"
                placeholder="Price"
              />
            ) : (
              <>
                <span className={`text-3xl font-black ${tier.priceText}`}>${result.price}</span>
                <span className="text-muted-foreground text-xs ml-1">/ one-time</span>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-white font-bold bg-slate-800 border-slate-600 focus:border-violet-500 text-sm"
              placeholder="Product title"
            />
            <Textarea
              value={editSubtitle}
              onChange={e => setEditSubtitle(e.target.value)}
              className="text-muted-foreground/60 bg-slate-800 border-slate-600 focus:border-violet-500 text-xs resize-none"
              rows={2}
              placeholder="Subtitle"
            />
          </div>
        ) : (
          <>
            <h3 className="text-white font-bold text-lg leading-tight mb-1">{result.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{result.subtitle}</p>
          </>
        )}

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <ScoreBadge score={score} />
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{result.pageCount} pages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">{chapters.length} chapters</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Score gate */}
        {!canPublish && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-xs font-bold">Score too low to publish ({score}%)</p>
                <p className="text-amber-400/70 text-[10px] mt-0.5">Use AI Improve to boost your score above 60% before submitting to marketplace.</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">What's included</p>
        <div className="space-y-2">
          {tier.includes.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-muted-foreground/60 text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        {chapters.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-2 text-muted-foreground hover:text-white text-xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {editing ? "Edit" : "View"} {chapters.length} chapters
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {expanded && (
              <div className="mt-2 space-y-1.5 pl-2 border-l border-slate-700">
                {(editing ? editChapters : chapters).map((ch: any, idx: number) => (
                  editing ? (
                    <Input
                      key={idx}
                      value={ch.title ?? ""}
                      onChange={e => {
                        const next = [...editChapters];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setEditChapters(next);
                      }}
                      className="text-xs h-7 bg-slate-800 border-slate-700 text-white"
                      placeholder={`Chapter ${idx + 1} title`}
                    />
                  ) : (
                    <p key={idx} className="text-muted-foreground text-xs py-0.5">
                      {idx + 1}. {ch.title}
                    </p>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI improve status */}
        {improveMsg && (
          <p className="mt-3 text-xs text-muted-foreground/60 bg-slate-800 rounded-lg px-3 py-2">{improveMsg}</p>
        )}
        {saveMsg && (
          <p className="mt-2 text-xs text-muted-foreground/60 bg-slate-800 rounded-lg px-3 py-2">{saveMsg}</p>
        )}
      </div>

      <div className={`px-5 pb-5 flex flex-col gap-2`}>
        {/* Editing controls */}
        {editing ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setEditing(false); setEditTitle(result.title); setEditSubtitle(result.subtitle ?? ""); setEditPrice(String(result.price)); setEditChapters(result.chaptersData?.chapters ?? []); }}
              className="h-9 px-3 text-muted-foreground hover:text-white border border-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => { setEditing(true); setExpanded(true); }}
            className="w-full gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 h-9 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Click to Edit Title, Chapters & Price
          </Button>
        )}

        {/* AI Improve */}
        <Button
          onClick={handleAIImprove}
          disabled={improving}
          className="w-full gap-2 bg-violet-900/50 hover:bg-violet-800/60 text-violet-200 border border-violet-500/40 h-9 text-xs"
        >
          {improving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {improving ? "AI Upgrading Content..." : "⚡ AI Improve (Boost Score)"}
        </Button>

        {/* Publish with score gate */}
        {publishStatus === "done" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-xs">{publishMsg}</p>
          </div>
        ) : (
          <Button
            onClick={handlePublish}
            disabled={!canPublish || publishing}
            className={`w-full gap-2 h-9 text-xs font-bold ${
              canPublish
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                : "bg-slate-800 text-muted-foreground border border-slate-700 cursor-not-allowed"
            }`}
          >
            {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {canPublish ? "Submit to Marketplace" : `Score too low (${score}% < 60%)`}
          </Button>
        )}
        {publishStatus === "error" && publishMsg && (
          <p className="text-red-400 text-[10px] text-center">{publishMsg}</p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-1">
          <a
            href={`/api/product/${result.id}/view-online`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-white text-xs gap-1.5 border border-slate-700 hover:border-slate-500">
              <Eye className="w-3.5 h-3.5" />
              Read Online
            </Button>
          </a>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-white text-xs gap-1.5 border border-slate-700 hover:border-slate-500"
            onClick={() => {
              const text = [result.title, result.chaptersData?.chapters?.map((ch: any) => `${ch.title}. ${String(ch.body ?? "").slice(0, 300)}`).join(". ")].filter(Boolean).join(". ");
              if (!text) return;
              const utter = new SpeechSynthesisUtterance(text);
              utter.rate = 0.95;
              speechSynthesis.cancel();
              speechSynthesis.speak(utter);
            }}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Listen
          </Button>
        </div>
        <Link href="/my-store">
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-white text-xs gap-1">
            <Package className="w-3.5 h-3.5" />
            View in My Store
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Research results display ───────────────────────────────────────────────────
function ResearchCard({ data }: { data: any }) {
  return (
    <div className="bg-slate-900/80 border border-violet-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🧠</span>
        <span className="text-violet-300 text-sm font-bold uppercase tracking-widest">Gemini Research Complete</span>
      </div>
      {data.powerfulAngle && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">💡 Most Powerful Angle</p>
          <p className="text-white text-sm font-semibold leading-relaxed">{data.powerfulAngle}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {data.targetAudience && (
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">🎯 Target Buyer</p>
            <p className="text-muted-foreground/60 text-xs leading-relaxed">{data.targetAudience}</p>
          </div>
        )}
        {data.uniqueHook && (
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">🔥 Unique Hook</p>
            <p className="text-muted-foreground/60 text-xs leading-relaxed">{data.uniqueHook}</p>
          </div>
        )}
      </div>
      {data.marketGap && (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">📊 Market Gap</p>
          <p className="text-emerald-300 text-xs leading-relaxed">{data.marketGap}</p>
        </div>
      )}
      {data.researchInsights?.length > 0 && (
        <div className="space-y-1">
          {data.researchInsights.map((ins: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-xs">{ins}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function QuickLaunch() {
  const { data: user } = useGetMe();
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");
  const [description, setDescription] = useState("");
  const [angle, setAngle] = useState("");
  const [bundle, setBundle] = useState<BundleResult | null>(null);
  const [error, setError] = useState("");
  const [researchData, setResearchData] = useState<any>(null);
  const [researchStatus, setResearchStatus] = useState("");

  const [stageIdx, setStageIdx] = useState([0, 0, 0]);
  const [elapsed, setElapsed] = useState(0);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if ((user as any)?.name) setAuthorName((user as any).name);
  }, [user]);

  const startStageAnimation = useCallback(() => {
    const delays = [TIERS[0].stageDelay, TIERS[1].stageDelay, TIERS[2].stageDelay];
    const intervals = delays.map((delay, tierIdx) =>
      setInterval(() => {
        setStageIdx(prev => {
          const next = [...prev];
          next[tierIdx] = Math.min(next[tierIdx] + 1, STAGES.length - 1);
          return next;
        });
      }, delay)
    );

    const timerInterval = setInterval(() => setElapsed(e => e + 1), 1000);

    return () => {
      intervals.forEach(clearInterval);
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    if (phase !== "generating") return;
    const cleanup = startStageAnimation();
    return cleanup;
  }, [phase, startStageAnimation]);

  const handleLaunch = async () => {
    if (!topic.trim() || !authorName.trim()) return;
    setError("");
    setResearchData(null);

    const topicWithNiche = selectedNiche
      ? `${topic.trim()} (${selectedNiche} niche)`
      : topic.trim();

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // ── Phase 1: Research ─────────────────────────────────────────────────────
    setPhase("researching");
    setResearchStatus("Gemini is analyzing your topic and market...");

    try {
      const researchRes = await fetch("/api/products/research-topic", {
        method: "POST", headers,
        body: JSON.stringify({ topic: topicWithNiche, angle: angle.trim() || undefined }),
      });
      if (researchRes.ok) {
        const rd = await researchRes.json();
        setResearchData(rd);
        setResearchStatus("Research complete — launching product generation!");
        await new Promise(r => setTimeout(r, 2200));
      }
    } catch {}

    // ── Phase 2: Generate ─────────────────────────────────────────────────────
    setPhase("generating");
    setStageIdx([0, 0, 0]);
    setElapsed(0);
    setAllDone(false);

    try {
      const res = await fetch("/api/products/quick-launch", {
        method: "POST", headers,
        body: JSON.stringify({
          topic: topicWithNiche,
          authorName: authorName.trim(),
          description: description.trim() || selectedNiche || "",
          angle: angle.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as any)?.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setBundle(data.bundle);
      setAllDone(true);
      setStageIdx([STAGES.length, STAGES.length, STAGES.length]);
      setTimeout(() => setPhase("results"), 1200);
    } catch (err: any) {
      setError(err?.message ?? "Launch failed. Please try again.");
      setPhase("setup");
    }
  };

  // ── RESEARCHING PHASE ────────────────────────────────────────────────────────
  if (phase === "researching") {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -m-4 md:-m-8 p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-xl w-full mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-full px-5 py-2 mb-6 animate-pulse">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-ping" />
                <span className="text-violet-300 text-sm font-semibold">GEMINI RESEARCHING</span>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-900/40">
                <span className="text-4xl animate-bounce">🧠</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                Analyzing Your <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Market</span>
              </h2>
              <p className="text-muted-foreground text-base mb-2">
                <strong className="text-white">"{topic}{selectedNiche ? ` · ${selectedNiche}` : ""}"</strong>
              </p>
              <p className="text-muted-foreground text-sm">{researchStatus}</p>
            </div>

            <div className="space-y-3">
              {[
                { icon: "🔍", label: "Scanning market demand & competitor landscape" },
                { icon: "🎯", label: "Identifying your ideal buyer's exact pain points" },
                { icon: "💡", label: "Picking the most powerful product angle" },
                { icon: "📊", label: "Finding the gap other products miss" },
                { icon: "🚀", label: "Preparing generation instructions for all 3 tiers" },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-4 py-3">
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-muted-foreground/60 text-sm">{step.label}</span>
                  <div className="ml-auto w-4 h-4 border-2 border-t-transparent border-violet-400 rounded-full animate-spin flex-shrink-0" />
                </div>
              ))}
            </div>

            {researchData && (
              <div className="mt-6">
                <ResearchCard data={researchData} />
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── SETUP PHASE ─────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -m-4 md:-m-8 p-4 md:p-8">
          <div className="max-w-2xl mx-auto pt-8 pb-16">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-5">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 text-xs font-semibold tracking-wide">ONE-CLICK LAUNCH SYSTEM</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                Launch{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  3 Products
                </span>
                {" "}at Once
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Type your topic. We generate a complete tripwire, core product, and premium upsell — with landing pages, emails, and marketing content — simultaneously.
              </p>
            </div>

            {/* What you get */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {TIERS.map(t => (
                <div
                  key={t.key}
                  className={`rounded-xl border ${t.borderClass} bg-slate-900/60 p-3 text-center`}
                >
                  <p className={`text-lg font-black ${t.priceText}`}>{t.price}</p>
                  <p className="text-white text-xs font-semibold mt-0.5">{t.label}</p>
                  <p className="text-muted-foreground text-[10px] mt-1">{t.pages} pages</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              {error && (
                <div className="mb-4 flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="text-muted-foreground/60 text-sm font-medium block mb-2">
                    What's your product topic? <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Lose 20 pounds in 60 days without the gym"
                    className="bg-slate-800/80 border-slate-600 text-white placeholder:text-muted-foreground focus:border-violet-500 h-11"
                  />
                  <p className="text-muted-foreground text-xs mt-1">Be specific — include outcome, timeframe, or transformation.</p>
                </div>

                <div>
                  <label className="text-muted-foreground/60 text-sm font-medium block mb-2">
                    Author name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="Your name or brand name"
                    className="bg-slate-800/80 border-slate-600 text-white placeholder:text-muted-foreground focus:border-violet-500 h-11"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground/60 text-sm font-medium block mb-2">
                    Select your niche <span className="text-muted-foreground text-xs font-normal">(optional — improves AI accuracy)</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {NICHES.map(n => (
                      <button
                        key={n.label}
                        onClick={() => setSelectedNiche(prev => prev === n.label ? "" : n.label)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all ${
                          selectedNiche === n.label
                            ? "border-violet-500 bg-violet-500/15 text-white"
                            : "border-slate-700 bg-slate-800/50 text-muted-foreground hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        <span className="text-lg leading-none">{n.emoji}</span>
                        <span className="leading-tight text-center">{n.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground/60 text-sm font-medium block mb-2">
                    Additional context <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </label>
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Target audience, specific angle, pain points…"
                    className="bg-slate-800/80 border-slate-600 text-white placeholder:text-muted-foreground focus:border-violet-500 h-11"
                  />
                </div>

                <div className="rounded-xl border-2 border-dashed border-violet-500/40 bg-violet-500/5 p-4">
                  <label className="text-violet-300 text-sm font-bold block mb-1.5 flex items-center gap-2">
                    <Target className="w-4 h-4" /> AI Angle / Direction
                    <span className="text-violet-500 text-xs font-normal">(optional — makes products far more targeted)</span>
                  </label>
                  <Textarea
                    value={angle}
                    onChange={e => setAngle(e.target.value)}
                    placeholder={`Tell Gemini exactly what direction to take. Examples:\n• "I want to teach how to make money with YouTube Shorts"\n• "Show beginners how to start a blog and earn with affiliate marketing"\n• "Teach the 16:8 fasting method for people who've tried everything"`}
                    className="bg-slate-900/60 border-slate-700 text-white placeholder:text-muted-foreground focus:border-violet-500 text-sm resize-none"
                    rows={4}
                  />
                  <p className="text-violet-400/70 text-xs mt-1.5">💡 Gemini will use this to research and pick the most powerful angle before generating.</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleLaunch}
                  disabled={!topic.trim() || !authorName.trim()}
                  className="w-full h-13 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-base gap-2.5 rounded-xl shadow-lg shadow-violet-900/40 disabled:opacity-50"
                >
                  <Rocket className="w-5 h-5" />
                  Launch My 3-Product Bundle
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-muted-foreground text-xs text-center mt-3">
                  Takes 3–5 minutes. Generates 3 full products + landing pages + email sequences + marketing kits simultaneously.
                </p>
              </div>
            </div>

            {/* Feature list */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: Sparkles, label: "3 complete products generated in parallel" },
                { icon: Target, label: "High-converting landing pages for each" },
                { icon: Mail, label: "30-day email sequences included" },
                { icon: TrendingUp, label: "Viral social media content kit" },
                { icon: CheckCircle2, label: "All products submitted for review" },
                { icon: Crown, label: "Tripwire → Core → Premium upsell funnel" },
              ].map((f, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-slate-900/40 rounded-xl p-3 border border-slate-800">
                  <f.icon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span className="text-muted-foreground/60 text-xs">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── GENERATING PHASE ─────────────────────────────────────────────────────────
  if (phase === "generating") {
    const overallProgress = Math.round(
      ((stageIdx[0] + stageIdx[1] + stageIdx[2]) / (STAGES.length * 3)) * 100
    );

    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -m-4 md:-m-8 p-4 md:p-8">
          <div className="max-w-5xl mx-auto pt-8 pb-16">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-full px-5 py-2 mb-4 animate-pulse">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-ping" />
                <span className="text-violet-300 text-sm font-semibold">BUILDING YOUR BUNDLE</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                Generating{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  3 Products
                </span>
                {" "}Simultaneously
              </h2>
              <p className="text-muted-foreground text-base">
                <strong className="text-white">"{topic}{selectedNiche ? ` · ${selectedNiche}` : ""}"</strong>
                {" "}— stay on this page while we build your empire.
              </p>

              <div className="flex items-center justify-center gap-6 mt-5">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{formatTime(elapsed)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span>Overall: <span className="text-white font-bold">{overallProgress}%</span></span>
                </div>
              </div>

              <div className="w-full max-w-md mx-auto mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* 3 tier cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TIERS.map((tier, idx) => (
                <TierGeneratingCard
                  key={tier.key}
                  tier={tier}
                  stageIndex={stageIdx[idx]}
                  done={allDone}
                />
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-sm">Don't close this tab — generation in progress (3–5 min)</span>
              </div>
            </div>

            {/* What's being built */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: "3 premium guides", sub: "10, 30 & 50 pages" },
                { icon: Target, label: "3 landing pages", sub: "Conversion-optimised" },
                { icon: Mail, label: "90 emails total", sub: "30-day sequences × 3" },
                { icon: Megaphone, label: "Marketing kits", sub: "TikTok, YouTube, IG" },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-3 text-center">
                  <item.icon className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                  <p className="text-white text-xs font-semibold">{item.label}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Research insights panel (if available) */}
            {researchData && (
              <div className="mt-6">
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-3 text-center">Gemini Research — Used to guide all 3 products</p>
                <ResearchCard data={researchData} />
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── RESULTS PHASE ────────────────────────────────────────────────────────────
  if (phase === "results" && bundle) {
    const tiers: Array<{ key: keyof BundleResult; tier: typeof TIERS[0] }> = [
      { key: "tripwire", tier: TIERS[0] },
      { key: "main",     tier: TIERS[1] },
      { key: "upsell",   tier: TIERS[2] },
    ];

    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -m-4 md:-m-8 p-4 md:p-8">
          <div className="max-w-5xl mx-auto pt-8 pb-16">
            {/* Success header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-5 py-2 mb-5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm font-semibold">BUNDLE COMPLETE</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                🎉 Your{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  3-Product Bundle
                </span>
                {" "}is Ready
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                All 3 products are created, landing pages built, emails written, and marketing content generated. They've been submitted for review.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
                {[
                  { icon: FileText, label: "3 full products", color: "text-violet-400" },
                  { icon: Target, label: "3 landing pages", color: "text-indigo-400" },
                  { icon: Mail, label: "90 emails ready", color: "text-blue-400" },
                  { icon: Megaphone, label: "Marketing kits", color: "text-emerald-400" },
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-muted-foreground/60 text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel label */}
            <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-1">
              {["$9 Tripwire", "→", "$27 Core Offer", "→", "$97 Premium Upsell"].map((item, idx) => (
                <div
                  key={idx}
                  className={idx % 2 === 0
                    ? "flex-1 min-w-[80px] bg-slate-800/60 border border-slate-700 rounded-lg py-2 text-center text-muted-foreground/60 text-sm font-semibold whitespace-nowrap"
                    : "text-muted-foreground text-sm font-bold flex-shrink-0"
                  }
                >
                  {item}
                </div>
              ))}
            </div>

            {/* 3 result cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tiers.map(({ key, tier }) => (
                <TierResultCard key={key} tier={tier} result={bundle[key]} />
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/my-store">
                <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-2.5">
                  <Package className="w-4 h-4" />
                  View All in My Store
                </Button>
              </Link>
              <Button
                variant="outline"
                className="gap-2 border-slate-600 text-muted-foreground/60 hover:text-white hover:bg-slate-800 px-8 py-2.5"
                onClick={() => {
                  setPhase("setup");
                  setBundle(null);
                  setTopic("");
                  setSelectedNiche("");
                  setDescription("");
                }}
              >
                <Rocket className="w-4 h-4" />
                Launch Another Bundle
              </Button>
            </div>

            <p className="text-center text-muted-foreground text-xs mt-4">
              Products are in <strong className="text-muted-foreground">pending review</strong> — our team approves them before they go live on the marketplace.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return null;
}
