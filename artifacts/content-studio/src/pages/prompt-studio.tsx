import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles, Package, ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  Download, RefreshCw, Clock, Eye, Copy, Check, Mail, Target,
  BarChart2, FileText, Share2, Zap, Layers, TrendingUp, Hash,
  ArrowRight, Play, Globe, Users, BadgeCheck, DollarSign,
  Rocket, Video, MessageSquare, ExternalLink, ListChecks,
  Image as ImageIcon, Star, ShoppingBag, Flame, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Constants ────────────────────────────────────────────────────────────────

const ANGLES = [
  "Professional", "Beginner-Friendly", "Advanced Expert", "Side Hustler",
  "Agency Owner", "Content Creator", "Solopreneur", "Student",
];
const PLATFORMS = [
  { id: "ChatGPT",    label: "ChatGPT",    emoji: "🤖" },
  { id: "Claude",     label: "Claude",     emoji: "⚡" },
  { id: "Gemini",     label: "Gemini",     emoji: "🌟" },
  { id: "Midjourney", label: "Midjourney", emoji: "🎨" },
  { id: "Perplexity", label: "Perplexity", emoji: "🔍" },
  { id: "Any AI",     label: "Any AI",     emoji: "🌐" },
];
const INDUSTRIES = [
  "Business", "Marketing", "Copywriting", "E-Commerce", "Finance",
  "Health & Wellness", "Education", "Technology", "Real Estate",
  "Creative Arts", "Personal Development", "Social Media",
];
const BUNDLE_SIZES = [
  { value: 25,  label: "Starter",  sub: "25 prompts",  price: "$17", best: false },
  { value: 50,  label: "Standard", sub: "50 prompts",  price: "$27", best: true  },
  { value: 100, label: "Pro",      sub: "100 prompts", price: "$47", best: false },
  { value: 150, label: "Ultimate", sub: "150 prompts", price: "$67", best: false },
];
const STAGES = [
  { id: 1, label: "Market Research",      icon: BarChart2,  tip: "Analyzing demand, best-seller positioning & competition…"     },
  { id: 2, label: "Prompt Architecture",  icon: Layers,     tip: "Building your category framework and prompt structure…"        },
  { id: 3, label: "Writing Prompts",      icon: Sparkles,   tip: "AI crafting each prompt to be powerful and ready-to-sell…"    },
  { id: 4, label: "Marketing Kit",        icon: Target,     tip: "Writing Facebook ads, TikTok scripts & YouTube video…"        },
  { id: 5, label: "Selling Strategy",     icon: DollarSign, tip: "Building your monetization guide & first-sale playbook…"      },
  { id: 6, label: "Cover Design",         icon: ImageIcon,  tip: "Generating your AI cover image for the marketplace…"          },
  { id: 7, label: "Packaging Bundle",     icon: Zap,        tip: "Assembling and finalizing your complete product…"             },
];
// Simulated quality/sellability as stages progress (index = stage index)
const STAGE_QUALITY     = [0, 18, 38, 62, 76, 85, 91, 96];
const STAGE_SELLABILITY = [0, 14, 32, 56, 70, 80, 87, 93];

const ASSETS = [
  { key: "prompts",       label: "Prompt Pack",   icon: Sparkles, required: true,
    description: "Professional, categorized AI prompts",
    color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-700", text: "text-violet-700 dark:text-violet-300" },
  { key: "salesPage",     label: "Sales Page",    icon: Target,   required: false,
    description: "High-converting headline, bullets & CTA",
    color: "from-orange-500 to-red-500", bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300" },
  { key: "emailSequence", label: "Email Series",  icon: Mail,     required: false,
    description: "5-email welcome & nurture sequence",
    color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300" },
  { key: "socialPosts",   label: "Social Posts",  icon: Share2,   required: false,
    description: "Twitter, Instagram & LinkedIn posts",
    color: "from-pink-500 to-rose-500", bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-700", text: "text-pink-700 dark:text-pink-300" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioForm {
  topic: string; industry: string; platform: string;
  angle: string; bundleSize: number; authorName: string;
}
const DEFAULT_FORM: StudioForm = {
  topic: "", industry: "Business", platform: "ChatGPT",
  angle: "Professional", bundleSize: 50, authorName: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("token");
  return fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts?.headers },
  });
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
        active
          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
          : "bg-white dark:bg-slate-900 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground"
      }`}
    >{label}</button>
  );
}

function PlatformChip({ platform, active, onClick }: { platform: typeof PLATFORMS[0]; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
        active
          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
          : "bg-white dark:bg-slate-900 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground"
      }`}
    >
      <span>{platform.emoji}</span> {platform.label}
    </button>
  );
}

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className={`flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border hover:bg-muted flex-shrink-0 ${size === "xs" ? "text-[11px]" : "text-xs"}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ScoreBar({ label, score, color, icon: Icon }: { label: string; score: number; color: string; icon: any }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className={`ml-auto text-sm font-bold ${color}`}>{score}/100</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            score >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
            score >= 65 ? "bg-gradient-to-r from-violet-400 to-violet-500" :
            "bg-gradient-to-r from-amber-400 to-amber-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {score >= 80 ? "Excellent — marketplace ready" : score >= 65 ? "Good — store ready" : "Developing — add more detail"}
      </div>
    </div>
  );
}

// ─── Trending Section ─────────────────────────────────────────────────────────

const DEMAND_CONFIG = {
  hot:    { label: "🔥 Hot",    bg: "bg-red-100 dark:bg-red-900/40",    text: "text-red-700 dark:text-red-300"    },
  rising: { label: "↗ Rising",  bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  steady: { label: "✦ Steady",  bg: "bg-slate-100 dark:bg-slate-800",    text: "text-slate-600 dark:text-slate-400" },
} as const;

function TrendingSection({ onSelect }: { onSelect: (niche: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    apiFetch("/prompt-packages/trending")
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d.trending) ? d.trending : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const displayed = showAll ? items : items.slice(0, 8);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            <h2 className="text-base font-bold text-foreground">Trending Right Now — Your Picks</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Updated daily — personalized for your account</p>
        </div>
        {items.length > 8 && (
          <button onClick={() => setShowAll(s => !s)}
            className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
          >
            {showAll ? "Show less" : "View all"} <ChevronDown className={`w-3 h-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayed.map((niche: any) => {
            const demand = DEMAND_CONFIG[niche.demandLevel as keyof typeof DEMAND_CONFIG] ?? DEMAND_CONFIG.steady;
            return (
              <div key={niche.id}
                className="group relative rounded-2xl overflow-hidden border border-border hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg transition-all duration-200 cursor-pointer bg-card"
                onClick={() => onSelect(niche)}
              >
                {/* Gradient header bar */}
                <div className={`h-1.5 bg-gradient-to-r ${niche.color ?? "from-violet-500 to-purple-600"}`} />
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${demand.bg} ${demand.text}`}>
                      {demand.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-md">
                      {niche.promptCount ?? 50} prompts
                    </span>
                  </div>
                  <div className="font-semibold text-foreground text-xs leading-tight mb-1.5 line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    {niche.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {niche.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {niche.estimatedRevenue}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{niche.platform ?? "ChatGPT"}</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/5 transition-all duration-200 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {[1, 2].map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          {i > 0 && <div className={`h-px flex-1 w-12 transition-colors duration-300 ${step >= n ? "bg-violet-500" : "bg-border"}`} />}
          <div className={`flex items-center gap-2 transition-all duration-300 ${step === n ? "opacity-100" : step > n ? "opacity-70" : "opacity-40"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
              step > n ? "bg-violet-600 border-violet-600 text-white" :
              step === n ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none" :
              "bg-muted border-border text-muted-foreground"}`}
            >
              {step > n ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${step === n ? "text-foreground" : "text-muted-foreground"}`}>
              {n === 1 ? "Product Setup" : "Select Assets"}
            </span>
          </div>
        </div>
      ))}
      <div className={`h-px flex-1 transition-colors duration-300 ${step > 1 ? "bg-violet-500" : "bg-border"}`} />
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ form, setForm, onNext }: { form: StudioForm; setForm: (f: StudioForm) => void; onNext: () => void }) {
  const set = (k: keyof StudioForm, v: any) => setForm({ ...form, [k]: v });
  const canProceed = form.topic.trim().length > 3;
  const chosen = BUNDLE_SIZES.find(b => b.value === form.bundleSize)!;

  return (
    <div>
      <StepIndicator step={1} />
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-0.5">Design Your Prompt Pack</h2>
            <p className="text-sm text-muted-foreground">Tell the AI what to build — every prompt is crafted from scratch.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Topic / Niche <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Freelance Writing, Shopify Descriptions, LinkedIn Outreach…"
              value={form.topic} onChange={e => set("topic", e.target.value)}
              className="h-12 text-base" autoFocus
            />
            <p className="text-xs text-muted-foreground">Be specific — "Shopify Product Descriptions" beats "e-commerce"</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Author / Brand Name</Label>
            <Input placeholder="Your name or brand (optional)" value={form.authorName}
              onChange={e => set("authorName", e.target.value)} className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">AI Platform</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <PlatformChip key={p.id} platform={p} active={form.platform === p.id} onClick={() => set("platform", p.id)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Industry</Label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(opt => <Chip key={opt} label={opt} active={form.industry === opt} onClick={() => set("industry", opt)} />)}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Target Audience Angle</Label>
            <div className="flex flex-wrap gap-2">
              {ANGLES.map(opt => <Chip key={opt} label={opt} active={form.angle === opt} onClick={() => set("angle", opt)} />)}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Bundle Size</Label>
            <div className="grid grid-cols-2 gap-2">
              {BUNDLE_SIZES.map(({ value, label, sub, price, best }) => (
                <button key={value} type="button" onClick={() => set("bundleSize", value)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.bundleSize === value
                      ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30 shadow-sm"
                      : "border-border bg-card hover:border-violet-300"}`}
                >
                  {best && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      POPULAR
                    </span>
                  )}
                  <div className={`text-base font-bold leading-none mb-0.5 ${form.bundleSize === value ? "text-violet-700 dark:text-violet-300" : "text-foreground"}`}>{label}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                  <div className={`text-sm font-bold mt-1 ${form.bundleSize === value ? "text-violet-600" : "text-emerald-600"}`}>{price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview card */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-violet-200 dark:shadow-none">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span className="text-xs font-semibold text-violet-200 uppercase tracking-wide">Your Pack Preview</span>
            </div>
            <div className="text-lg font-bold leading-tight mb-1 min-h-[2.5rem]">
              {form.topic ? `${form.topic}` : "Enter a topic above…"}
            </div>
            {form.authorName && <p className="text-violet-200 text-xs mb-2">by {form.authorName}</p>}
            {form.topic && (
              <p className="text-violet-200 text-xs mb-3">for {form.platform} users</p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                { icon: Hash,   label: "Prompts",    value: `${chosen.value}` },
                { icon: Layers, label: "Categories", value: `${chosen.value <= 25 ? 5 : 10}` },
                { icon: Globe,  label: "Platform",   value: form.platform.split(" ")[0] },
                { icon: Users,  label: "Audience",   value: form.angle.split(" ")[0] },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3 h-3 text-violet-300" />
                    <span className="text-[10px] text-violet-300 font-medium uppercase tracking-wide">{label}</span>
                  </div>
                  <div className="text-sm font-bold text-white truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onNext} disabled={!canProceed}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white gap-2 text-base font-semibold shadow-lg shadow-violet-200 dark:shadow-none disabled:opacity-40"
          >
            Choose Assets <ChevronRight className="w-5 h-5" />
          </Button>
          {!canProceed && <p className="text-center text-xs text-muted-foreground">Enter a topic to continue</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ selectedAssets, setSelectedAssets, form, onBack, onGenerate }: {
  selectedAssets: string[]; setSelectedAssets: (a: string[]) => void;
  form: StudioForm; onBack: () => void; onGenerate: () => void;
}) {
  const toggle = (key: string) => {
    if (key === "prompts") return;
    setSelectedAssets(selectedAssets.includes(key) ? selectedAssets.filter(k => k !== key) : [...selectedAssets, key]);
  };
  const chosen = BUNDLE_SIZES.find(b => b.value === form.bundleSize)!;

  return (
    <div>
      <StepIndicator step={2} />
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-0.5">What should we generate?</h2>
        <p className="text-sm text-muted-foreground">Prompt Pack always included. Add marketing assets to sell faster.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {ASSETS.map(asset => {
          const Icon = asset.icon;
          const selected = selectedAssets.includes(asset.key);
          return (
            <button key={asset.key} type="button" onClick={() => toggle(asset.key)} disabled={asset.required}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                asset.required
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 cursor-default"
                  : selected
                    ? `${asset.border} ${asset.bg} shadow-sm cursor-pointer`
                    : "border-border bg-card hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {asset.required ? (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${asset.bg} ${asset.text} ${asset.border} border`}>
                    Included
                  </span>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected ? "bg-violet-600 border-violet-600" : "border-muted-foreground/30"}`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}
              </div>
              <div className="font-semibold text-foreground text-sm mb-1">{asset.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{asset.description}</div>
            </button>
          );
        })}
      </div>

      {/* Always-included marketing kit notice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 mb-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Star className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground">Marketing Kit — Always Included Free</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Facebook ads (3 creatives), TikTok script, YouTube video script, Twitter posts, and a full monetization guide.
          </div>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 flex-shrink-0">
          Auto
        </span>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: "Topic",     value: form.topic.length > 18 ? form.topic.slice(0, 18) + "…" : form.topic },
            { label: "Prompts",   value: `${chosen.value}` },
            { label: "Platform",  value: form.platform },
            { label: "Assets",    value: `${selectedAssets.length} + Kit` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
              <div className="text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 h-10">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onGenerate}
          className="h-12 px-8 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white gap-2 font-semibold shadow-lg shadow-violet-200 dark:shadow-none"
        >
          <Sparkles className="w-4 h-4" />
          Generate Complete Bundle
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Generation View ──────────────────────────────────────────────────────────

function GenerationView({ stage, topic }: { stage: number; topic: string }) {
  const pct = Math.round((stage / STAGES.length) * 100);
  const qualityNow  = STAGE_QUALITY[Math.min(stage, STAGE_QUALITY.length - 1)];
  const sellNow     = STAGE_SELLABILITY[Math.min(stage, STAGE_SELLABILITY.length - 1)];

  return (
    <div className="py-4">
      {/* Animated orb */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-40 h-40 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: "2.4s" }} />
        <div className="absolute w-28 h-28 rounded-full bg-violet-500/15 animate-ping" style={{ animationDuration: "1.8s" }} />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-300 dark:shadow-violet-900">
          <Sparkles className="w-9 h-9 text-white" style={{ animation: "spin 3s linear infinite" }} />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-1.5">Building Your Complete Bundle</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          "<span className="font-medium text-foreground">{topic}</span>" — AI is crafting prompts + marketing kit.
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Generation progress</span>
          <span className="font-semibold text-violet-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      </div>

      {/* Quality meters */}
      <div className="max-w-sm mx-auto mb-8 grid grid-cols-2 gap-3">
        <div className="bg-card border rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Quality</span>
            <span className="text-sm font-bold text-violet-600">{qualityNow}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${qualityNow}%` }} />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Sellability</span>
            <span className="text-sm font-bold text-emerald-600">{sellNow}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${sellNow}%` }} />
          </div>
        </div>
      </div>

      {/* Stage list */}
      <div className="max-w-md mx-auto space-y-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stage;
          const isDone = i < stage;
          return (
            <div key={s.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isActive ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 shadow-sm" :
                isDone   ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-80" :
                           "bg-muted/20 border-border opacity-30"}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isDone ? "bg-emerald-500" : isActive ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-muted"}`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  : isActive ? <Icon className="w-3.5 h-3.5 text-white" />
                  : <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold leading-tight ${
                  isActive ? "text-foreground" : isDone ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {s.label}
                </div>
                {isActive && <div className="text-xs text-muted-foreground mt-0.5">{s.tip}</div>}
              </div>
              <div className="flex-shrink-0">
                {isActive && <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />}
                {isDone    && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cover Image Component ─────────────────────────────────────────────────────

function CoverImage({ productId, initialUrl }: { productId: number; initialUrl: string | null }) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (url) return;
    const poll = setInterval(async () => {
      attemptsRef.current++;
      if (attemptsRef.current > 12) { clearInterval(poll); return; }
      try {
        const r = await apiFetch(`/prompt-packages/${productId}`);
        const d = await r.json();
        if (d.coverImageUrl) { setUrl(d.coverImageUrl); clearInterval(poll); }
      } catch {}
    }, 4000);
    return () => clearInterval(poll);
  }, [productId, url]);

  if (!url) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/30 rounded-xl flex items-center justify-center border border-violet-200 dark:border-violet-800">
        <div className="text-center">
          <div className="w-8 h-8 rounded-xl bg-violet-200 dark:bg-violet-800 flex items-center justify-center mx-auto mb-2">
            <ImageIcon className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-xs text-muted-foreground">Generating cover…</p>
          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin mx-auto mt-1.5" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
      <img src={url} alt="Product cover" className="w-full h-full object-cover" />
    </div>
  );
}

// ─── Marketing Kit Card ────────────────────────────────────────────────────────

function MarketingKitCard({ kit }: { kit: any }) {
  const [subTab, setSubTab] = useState<"facebook" | "tiktok" | "youtube" | "twitter">("facebook");

  if (!kit) return (
    <div className="text-center py-12 text-muted-foreground">
      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">Marketing kit not available</p>
      <p className="text-xs mt-1">Regenerate with marketing kit selected</p>
    </div>
  );

  const subTabs = [
    { key: "facebook" as const, label: "Facebook Ads",    icon: "📘" },
    { key: "tiktok"  as const, label: "TikTok Script",   icon: "🎵" },
    { key: "youtube" as const, label: "YouTube Script",  icon: "🎬" },
    { key: "twitter" as const, label: "Twitter/X Posts", icon: "𝕏" },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
        {subTabs.map(t => (
          <button key={t.key} type="button" onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === t.key ? "bg-white dark:bg-slate-900 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Facebook Ads */}
      {subTab === "facebook" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">3 ready-to-run ad creatives — different angles for maximum testing</p>
          {(kit.facebookAds ?? []).map((ad: any, i: number) => (
            <div key={i} className="border rounded-xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                    {ad.angle?.replace(/_/g, " ").toUpperCase() ?? `AD ${i + 1}`}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{ad.headline}</span>
                </div>
                <CopyButton text={`Headline: ${ad.headline}\n\n${ad.primaryText}\n\n${ad.description}\n\nCTA: ${ad.cta}`} size="xs" />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{ad.primaryText}</p>
                {ad.description && <p className="text-xs text-blue-600 dark:text-blue-400 italic">{ad.description}</p>}
                <div className="inline-flex bg-blue-600 text-white text-xs px-3 py-1 rounded-lg font-medium">{ad.cta}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TikTok Script */}
      {subTab === "tiktok" && kit.tiktokScript && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Complete TikTok video script — hook, body, CTA + bonus video ideas</p>
          {[
            { label: "🎬 Hook (0–3 sec)", color: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800", text: kit.tiktokScript.hook },
            { label: "📹 Main Content (3–35 sec)", color: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800", text: kit.tiktokScript.body },
            { label: "📣 CTA (final 5 sec)", color: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800", text: kit.tiktokScript.cta },
          ].map(section => (
            <div key={section.label} className={`rounded-xl border p-3 ${section.color}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-foreground">{section.label}</span>
                <CopyButton text={section.text} size="xs" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{section.text}</p>
            </div>
          ))}
          {kit.tiktokScript.caption && (
            <div className="bg-muted/40 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-foreground">📝 Caption</span>
                <CopyButton text={kit.tiktokScript.caption} size="xs" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{kit.tiktokScript.caption}</p>
            </div>
          )}
          {(kit.tiktokScript.hashtags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {kit.tiktokScript.hashtags.map((h: string) => (
                <span key={h} className="text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                  #{h.replace(/^#/, "")}
                </span>
              ))}
            </div>
          )}
          {(kit.tiktokScript.videoIdeas ?? []).length > 0 && (
            <div className="bg-card border rounded-xl p-3 space-y-1.5">
              <span className="text-[11px] font-bold text-foreground">💡 Bonus Video Ideas</span>
              {kit.tiktokScript.videoIdeas.map((idea: string, i: number) => (
                <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-violet-500 flex-shrink-0">{i + 1}.</span><span>{idea}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* YouTube Script */}
      {subTab === "youtube" && kit.youtubeScript && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Full YouTube video script to sell your prompt pack organically</p>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-foreground">📺 Video Title</span>
              <CopyButton text={kit.youtubeScript.title} size="xs" />
            </div>
            <p className="text-sm font-semibold text-foreground">{kit.youtubeScript.title}</p>
          </div>
          {kit.youtubeScript.thumbnailConcept && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <span className="text-[11px] font-bold text-foreground block mb-1">🖼 Thumbnail Concept</span>
              <p className="text-xs text-muted-foreground">{kit.youtubeScript.thumbnailConcept}</p>
            </div>
          )}
          {[
            { key: "intro",       label: "🎬 Intro (0–45s)",       text: kit.youtubeScript.intro },
            { key: "mainContent", label: "📹 Main Content (45s–4m)", text: kit.youtubeScript.mainContent },
            { key: "cta",         label: "📣 CTA (final 30s)",     text: kit.youtubeScript.cta },
          ].filter(s => s.text).map(section => (
            <div key={section.key} className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-foreground">{section.label}</span>
                <CopyButton text={section.text} size="xs" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{section.text}</p>
            </div>
          ))}
          {kit.youtubeScript.description && (
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-foreground">📋 Video Description</span>
                <CopyButton text={kit.youtubeScript.description} size="xs" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-6">{kit.youtubeScript.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Twitter/X Posts */}
      {subTab === "twitter" && (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground font-medium">5 ready-to-post tweets — launch, value, proof, offer, story</p>
          {(kit.twitterPosts ?? []).map((post: any, i: number) => (
            <div key={i} className="bg-muted/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                  {post.label ?? `Tweet ${i + 1}`}
                </span>
                <CopyButton text={post.tweet} size="xs" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{post.tweet}</p>
              <div className="text-[10px] text-muted-foreground/60">{(post.tweet ?? "").length} chars</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Selling Guide Card ────────────────────────────────────────────────────────

function SellingGuideCard({ kit }: { kit: any }) {
  if (!kit?.monetizationGuide) return (
    <div className="text-center py-12 text-muted-foreground">
      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">Selling guide not available</p>
    </div>
  );

  const guide = kit.monetizationGuide;
  const checklist = kit.quickStartChecklist ?? [];
  const priorityConfig = {
    critical: { bg: "bg-red-100 dark:bg-red-900/40",    text: "text-red-700 dark:text-red-300",    dot: "bg-red-500"    },
    high:     { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500"  },
    medium:   { bg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500"   },
  } as const;

  return (
    <div className="space-y-5">
      {/* Revenue target */}
      {guide.monthlyRevenueTarget && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-foreground">Revenue Potential</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{guide.monthlyRevenueTarget}</p>
        </div>
      )}

      {/* Pricing strategy */}
      {guide.pricingStrategy && (
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-foreground">Pricing Strategy</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{guide.pricingStrategy}</p>
        </div>
      )}

      {/* Where to sell */}
      {(guide.whereToSell ?? []).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-bold text-foreground">Where to Sell</span>
          </div>
          {guide.whereToSell.map((platform: any, i: number) => (
            <div key={i} className="border rounded-xl p-3.5">
              <div className="font-semibold text-foreground text-sm mb-1">{platform.platform}</div>
              <p className="text-xs text-muted-foreground mb-2">{platform.why}</p>
              <div className="text-[11px] text-violet-600 dark:text-violet-400 font-medium whitespace-pre-wrap leading-relaxed">{platform.steps}</div>
            </div>
          ))}
        </div>
      )}

      {/* First 24 hours */}
      {(guide.first24Hours ?? []).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-bold text-foreground">First 24 Hours Action Plan</span>
          </div>
          {guide.first24Hours.map((action: string, i: number) => (
            <div key={i} className="flex gap-2.5 text-xs text-muted-foreground py-1.5 border-b border-border last:border-0">
              <span className="font-bold text-violet-600 flex-shrink-0 w-4">{i + 1}.</span>
              <span className="leading-relaxed">{action}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scaling tips */}
      {(guide.scalingStrategy ?? []).length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-bold text-foreground">Scale to $1K+/Month</span>
          </div>
          {guide.scalingStrategy.map((tip: string, i: number) => (
            <div key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-violet-500 flex-shrink-0">✦</span><span className="leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick-start checklist */}
      {checklist.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-foreground">Quick-Start Checklist</span>
          </div>
          {checklist.map((item: any) => {
            const cfg = priorityConfig[item.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
            return (
              <div key={item.step} className="flex items-start gap-3 p-3 bg-card border rounded-xl">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground leading-relaxed">{item.task}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{item.time}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Prompt Pack Card ──────────────────────────────────────────────────────────

function PromptPackCard({ result, productId }: { result: any; productId: number }) {
  const [downloading, setDownloading] = useState(false);
  const bundle = result.bundle;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`/api/prompt-packages/${productId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Download failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${(bundle?.packageTitle ?? "prompts").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.html`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); } finally { setDownloading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Prompts", value: bundle?.totalPrompts ?? "—", icon: Hash },
          { label: "Categories",   value: (bundle?.categories ?? []).length || "—", icon: Layers },
          { label: "Platform",     value: bundle?.platform ?? "—", icon: Globe },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-3 text-center">
            <Icon className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {bundle?.packageTitle && (
        <div className="bg-muted/40 rounded-xl p-3 space-y-1">
          <div className="font-semibold text-foreground text-sm">{bundle.packageTitle}</div>
          {bundle.tagline && <div className="text-xs text-muted-foreground italic">{bundle.tagline}</div>}
          {bundle?.pricingRecommended && (
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Recommended price: ${bundle.pricingRecommended}
            </div>
          )}
        </div>
      )}

      {bundle?.categories && bundle.categories.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categories</div>
          <div className="grid grid-cols-2 gap-2">
            {bundle.categories.map((cat: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 text-xs">
                <span className="text-base leading-none">{cat.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{cat.name}</div>
                  <div className="text-muted-foreground">{cat.prompts?.length ?? 0} prompts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bundle?.landingPageHook && (
        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sales Hook</span>
            <CopyButton text={bundle.landingPageHook} size="xs" />
          </div>
          <p className="text-sm text-muted-foreground italic">"{bundle.landingPageHook}"</p>
        </div>
      )}

      <Button onClick={handleDownload} disabled={downloading}
        className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white h-11">
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {downloading ? "Building file…" : "Download Prompt Pack (.html)"}
      </Button>
    </div>
  );
}

// ─── Sales Page Card ───────────────────────────────────────────────────────────

function SalesPageCard({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return (
    <div className="text-center py-10 text-muted-foreground">
      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Not generated — go back and select this asset</p>
    </div>
  );

  const fullText = [data.headline, data.subheadline, "", data.hook, "",
    "WHAT YOU GET:", ...(data.bullets ?? []).map((b: string) => `• ${b}`), "",
    data.socialProof, "", data.guarantee, "", data.closingCta,
  ].filter(Boolean).join("\n");

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-foreground text-base leading-tight">{data.headline}</div>
          {data.subheadline && <p className="text-muted-foreground text-sm italic mt-0.5">{data.subheadline}</p>}
        </div>
        <CopyButton text={fullText} />
      </div>
      {data.hook && <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-3 line-clamp-4">{data.hook}</p>}
      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)}
          className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1">
          Show full copy <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="space-y-3 text-sm">
          {(data.bullets ?? []).length > 0 && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-1">
              <div className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2">What You Get</div>
              {(data.bullets ?? []).map((b: string, i: number) => (
                <div key={i} className="flex gap-2 text-muted-foreground text-xs">
                  <span className="text-violet-500 flex-shrink-0">•</span><span>{b}</span>
                </div>
              ))}
            </div>
          )}
          {data.socialProof && <blockquote className="border-l-2 border-violet-400 pl-3 text-xs text-muted-foreground italic">{data.socialProof}</blockquote>}
          {data.guarantee && <p className="text-emerald-700 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">{data.guarantee}</p>}
          {data.closingCta && <p className="font-bold text-foreground">{data.closingCta}</p>}
          <button type="button" onClick={() => setExpanded(false)} className="text-violet-600 text-sm font-medium">Show less ↑</button>
        </div>
      )}
    </div>
  );
}

// ─── Email Sequence Card ───────────────────────────────────────────────────────

function EmailSequenceCard({ data }: { data: any }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  if (!data?.emails) return (
    <div className="text-center py-10 text-muted-foreground">
      <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Not generated — go back and select this asset</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {(data.emails ?? []).map((email: any, i: number) => {
        const isOpen = openIdx === i;
        const emailText = `Subject: ${email.subject}\n\n${email.headline ?? ""}\n\n${email.body ?? ""}\n\n${email.cta ?? ""}`;
        return (
          <div key={i} className="border rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors">
              <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg flex-shrink-0">
                Day {email.day}
              </span>
              <span className="text-sm text-foreground font-medium truncate flex-1">{email.subject}</span>
              <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-3 pb-3 border-t bg-muted/20 space-y-2">
                <div className="flex justify-end pt-2"><CopyButton text={emailText} size="xs" /></div>
                {email.headline && <div className="font-semibold text-sm text-foreground">{email.headline}</div>}
                {email.body && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{email.body}</p>}
                {email.cta && <div className="inline-flex bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">{email.cta}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Social Posts Card ─────────────────────────────────────────────────────────

function SocialPostsCard({ data }: { data: any }) {
  const [tab, setTab] = useState<"twitter" | "instagram" | "linkedin">("twitter");
  if (!data) return (
    <div className="text-center py-10 text-muted-foreground">
      <Share2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Not generated — go back and select this asset</p>
    </div>
  );
  const tabs = [
    { key: "twitter" as const, label: "𝕏 Twitter", items: data.twitter ?? [] },
    { key: "instagram" as const, label: "📷 Instagram", items: data.instagram ?? [] },
    { key: "linkedin" as const, label: "💼 LinkedIn", items: data.linkedin ?? [] },
  ];
  const current = tabs.find(t => t.key === tab)!;
  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              tab === t.key ? "bg-white dark:bg-slate-900 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {current.items.map((item: any, i: number) => {
          const text = item.tweet ?? item.caption ?? item.post ?? "";
          const hashtags = item.hashtags ? item.hashtags.map((h: string) => `#${h}`).join(" ") : "";
          return (
            <div key={i} className="bg-muted/30 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground leading-relaxed flex-1 whitespace-pre-line">{text}</p>
                <CopyButton text={hashtags ? `${text}\n\n${hashtags}` : text} size="xs" />
              </div>
              {hashtags && <p className="text-blue-500 text-xs font-medium">{hashtags}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({ result, form, onReset }: { result: any; form: StudioForm; onReset: () => void }) {
  const [publishingTarget, setPublishingTarget] = useState<"store" | "marketplace" | null>(null);
  const [publishedTargets, setPublishedTargets] = useState<Set<string>>(new Set(result.publishStatus === "published" ? ["store"] : []));
  const [publishMsg, setPublishMsg] = useState("");
  const bundle = result.bundle;
  const kit = result.marketingKit ?? null;

  const assetList: string[] = result.params?.selectedAssets ?? ["prompts"];

  const assetTabs = [
    { key: "prompts",       label: "Prompt Pack",    icon: Sparkles,  available: true,                                color: "text-violet-600"  },
    { key: "salesPage",     label: "Sales Page",     icon: Target,    available: assetList.includes("salesPage"),     color: "text-orange-600"  },
    { key: "emailSequence", label: "Email Series",   icon: Mail,      available: assetList.includes("emailSequence"), color: "text-blue-600"    },
    { key: "socialPosts",   label: "Social Posts",   icon: Share2,    available: assetList.includes("socialPosts"),   color: "text-pink-600"    },
    { key: "marketingKit",  label: "Marketing Kit",  icon: Target,    available: true,                                color: "text-amber-600"   },
    { key: "sellingGuide",  label: "Selling Guide",  icon: DollarSign, available: true,                              color: "text-emerald-600" },
  ].filter(t => t.available);

  const [activeTab, setActiveTab] = useState(assetTabs[0]?.key ?? "prompts");

  const handlePublish = async (target: "store" | "marketplace") => {
    setPublishingTarget(target); setPublishMsg("");
    try {
      const r = await apiFetch(`/prompt-packages/${result.id}/publish`, {
        method: "POST", body: JSON.stringify({ target }),
      });
      const data = await r.json();
      if (!r.ok) { setPublishMsg(data.message ?? data.error ?? "Publish failed"); setPublishingTarget(null); return; }
      setPublishedTargets(prev => new Set([...prev, target]));
      setPublishMsg(data.message ?? (target === "marketplace" ? "Submitted to marketplace!" : "Published to your store!"));
    } catch { setPublishMsg("Network error — please try again."); }
    finally { setPublishingTarget(null); }
  };

  const handlePreview = () => {
    const token = localStorage.getItem("token");
    window.open(`/api/prompt-packages/${result.id}/preview?token=${token}`, "_blank");
  };

  const qualityScore    = bundle?.qualityScore    ?? 0;
  const sellabilityScore = bundle?.sellabilityScore ?? 0;

  return (
    <div className="space-y-5">
      {/* Success banner with scores */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground leading-tight">{bundle?.packageTitle ?? form.topic}</div>
            {bundle?.tagline && <p className="text-muted-foreground text-xs italic mt-0.5">{bundle.tagline}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              {bundle?.totalPrompts > 0 && (
                <span className="text-[11px] bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-700 font-medium">
                  {bundle.totalPrompts} Prompts
                </span>
              )}
              {bundle?.pricingRecommended && (
                <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700 font-bold">
                  ${bundle.pricingRecommended} recommended
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreBar label="Quality Score" score={qualityScore} color="text-violet-600" icon={Star} />
          <ScoreBar label="Sellability" score={sellabilityScore} color="text-emerald-600" icon={TrendingUp} />
        </div>
      </div>

      {publishMsg && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${
          publishedTargets.size > 0 ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-400" :
          "bg-red-50 border-red-200 text-red-700"}`}>
          {publishMsg}
        </div>
      )}

      {/* Main results area: cover + tabs */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: cover image + action buttons */}
        <div className="lg:w-56 flex-shrink-0 space-y-4">
          <CoverImage productId={result.id} initialUrl={result.coverImageUrl ?? null} />

          {/* Action buttons */}
          <div className="space-y-2">
            <Button onClick={handlePreview} variant="outline" size="sm"
              className="w-full gap-2 h-10 font-medium">
              <Eye className="w-4 h-4" /> Preview HTML
            </Button>

            {/* Publish to Store */}
            {publishedTargets.has("store") ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-medium px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live in Store
              </div>
            ) : (
              <Button onClick={() => handlePublish("store")} disabled={publishingTarget !== null}
                size="sm" className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white gap-2 font-medium">
                {publishingTarget === "store" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                Publish to Store
              </Button>
            )}

            {/* Submit to Marketplace */}
            {publishedTargets.has("marketplace") ? (
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 font-medium px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Marketplace
              </div>
            ) : (
              <Button onClick={() => handlePublish("marketplace")} disabled={publishingTarget !== null}
                variant="outline" size="sm" className="w-full h-10 gap-2 font-medium border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                {publishingTarget === "marketplace" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                Submit to Marketplace
              </Button>
            )}

            <Button variant="ghost" onClick={onReset} size="sm" className="w-full gap-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5" /> New Pack
            </Button>
          </div>

          {/* Quality gate info */}
          {qualityScore < 75 && (
            <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5 leading-relaxed">
              💡 Score 75+ to submit to the marketplace. Use a more specific topic or larger bundle.
            </div>
          )}
        </div>

        {/* Right: tabs */}
        <div className="flex-1 min-w-0">
          {/* Tab pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
            {assetTabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                    activeTab === t.key
                      ? "bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
                  <Icon className={`w-3.5 h-3.5 ${activeTab === t.key ? t.color : ""}`} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-card border rounded-2xl p-5 min-h-[350px]">
            {activeTab === "prompts"       && <PromptPackCard result={result} productId={result.id} />}
            {activeTab === "salesPage"     && <SalesPageCard data={result.salesPage} />}
            {activeTab === "emailSequence" && <EmailSequenceCard data={result.emailSequence} />}
            {activeTab === "socialPosts"   && <SocialPostsCard data={result.socialPosts} />}
            {activeTab === "marketingKit"  && <MarketingKitCard kit={kit} />}
            {activeTab === "sellingGuide"  && <SellingGuideCard kit={kit} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────

function HistoryView({ onSelectProduct }: { onSelectProduct: (id: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch("/prompt-packages").then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  );

  if (!items.length) return (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 flex items-center justify-center mx-auto">
        <Package className="w-7 h-7 text-violet-400" />
      </div>
      <p className="font-semibold text-foreground">No prompt packs yet</p>
      <p className="text-sm text-muted-foreground">Switch to Studio to generate your first pack</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id}
          className="flex items-center gap-4 p-4 rounded-2xl border hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all cursor-pointer group bg-card"
          onClick={() => onSelectProduct(item.id)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/60 dark:to-purple-950/40 rounded-xl flex items-center justify-center flex-shrink-0 border border-violet-200 dark:border-violet-800">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground text-sm truncate">{item.title}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {item.totalPrompts > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">{item.totalPrompts} prompts</span>
              )}
              {item.qualityScore > 0 && (
                <span className="text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-md font-medium">
                  Q: {item.qualityScore}
                </span>
              )}
              {item.sellabilityScore > 0 && (
                <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-medium">
                  S: {item.sellabilityScore}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.publishStatus === "published" ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium">
                Published
              </span>
            ) : (
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border font-medium">Draft</span>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewState = "step1" | "step2" | "generating" | "results";

export default function PromptStudio() {
  const [view, setView] = useState<ViewState>("step1");
  const [tab, setTab] = useState<"studio" | "history">("studio");
  const [form, setForm] = useState<StudioForm>(DEFAULT_FORM);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["prompts", "salesPage", "emailSequence", "socialPosts"]);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Trending niche pre-fill
  const handleTrendingSelect = (niche: any) => {
    setForm({
      topic: niche.title,
      industry: niche.industry ?? "Business",
      platform: (niche.platform ?? "chatgpt").charAt(0).toUpperCase() + (niche.platform ?? "chatgpt").slice(1).replace("chatgpt", "ChatGPT"),
      angle: niche.angle ?? "Professional",
      bundleSize: niche.bundleSize ?? 50,
      authorName: form.authorName,
    });
    // Scroll to build card
    document.getElementById("build-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGenerate = useCallback(async () => {
    setError(""); setStage(0); setView("generating");
    // Animate stages while waiting for API
    const stageTimer = (async () => {
      for (let s = 1; s <= 5; s++) {
        await sleep(s === 1 ? 600 : s === 2 ? 1800 : s === 3 ? 2400 : s === 4 ? 1600 : 1000);
        setStage(s);
      }
    })();
    try {
      const r = await apiFetch("/prompt-packages/generate", {
        method: "POST",
        body: JSON.stringify({
          topic: form.topic, angle: form.angle, platform: form.platform,
          industry: form.industry, bundleSize: form.bundleSize,
          authorName: form.authorName, selectedAssets,
        }),
      });
      await stageTimer;
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Generation failed. Please try again."); setView("step2"); return; }
      setStage(6); await sleep(600);
      setStage(7); await sleep(400);
      setResult(data);
      setView("results");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setView("step2");
    }
  }, [form, selectedAssets]);

  const loadProduct = async (id: number) => {
    try {
      const r = await apiFetch(`/prompt-packages/${id}`);
      if (!r.ok) return;
      const data = await r.json();
      setResult(data); setView("results"); setTab("studio");
    } catch {}
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    setSelectedAssets(["prompts", "salesPage", "emailSequence", "socialPosts"]);
    setStage(0); setResult(null); setError(""); setView("step1");
  };

  const showTabs = view === "step1" || view === "step2";
  const isGenOrResult = view === "generating" || view === "results";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(109,40,217,0.2) 0%, transparent 50%)"
        }} />
        <div className="relative max-w-5xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-900/40 flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Prompt Pack Studio</h1>
                <p className="text-violet-300 text-sm mt-0.5">AI-generated bundles with marketing kit — ready to sell today</p>
              </div>
            </div>
            <div className="flex gap-5 flex-shrink-0">
              {[
                { label: "Quality Prompts", value: "100%" },
                { label: "Marketing Kit",   value: "Included" },
                { label: "Sell-Ready",      value: "Always" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-white text-sm font-bold">{value}</div>
                  <div className="text-violet-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {showTabs && (
            <div className="flex gap-1 mt-7 bg-white/5 backdrop-blur-sm p-1 rounded-xl w-fit border border-white/10">
              {[{ key: "studio", label: "Studio", icon: Play }, { key: "history", label: "My Packs", icon: Clock }].map(({ key, label, icon: Icon }) => (
                <button key={key} type="button" onClick={() => setTab(key as "studio" | "history")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === key ? "bg-white text-slate-900 shadow-sm" : "text-violet-300 hover:text-white"}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
            <span className="font-semibold flex-shrink-0">Error:</span> {error}
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
          </div>
        )}

        {/* Trending section — only in studio/step1 */}
        {showTabs && tab === "studio" && view === "step1" && (
          <TrendingSection onSelect={handleTrendingSelect} />
        )}

        {/* Build card */}
        <div id="build-card" className={`bg-card border rounded-3xl shadow-sm p-6 sm:p-8 ${isGenOrResult ? "" : ""}`}>
          {showTabs && tab === "history" ? (
            <HistoryView onSelectProduct={loadProduct} />
          ) : view === "step1" ? (
            <Step1 form={form} setForm={setForm} onNext={() => setView("step2")} />
          ) : view === "step2" ? (
            <Step2 selectedAssets={selectedAssets} setSelectedAssets={setSelectedAssets}
              form={form} onBack={() => setView("step1")} onGenerate={handleGenerate} />
          ) : view === "generating" ? (
            <GenerationView stage={stage} topic={form.topic} />
          ) : view === "results" && result ? (
            <ResultsView result={result} form={form} onReset={reset} />
          ) : null}
        </div>

        {showTabs && tab === "studio" && (
          <p className="text-center text-xs text-muted-foreground mt-5">
            Powered by Selovox AI · Prompts + full marketing kit generated from scratch — never templates
          </p>
        )}
      </div>
    </div>
  );
}
