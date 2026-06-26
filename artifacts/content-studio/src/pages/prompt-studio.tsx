import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Package, ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  Download, RefreshCw, Clock, Eye, Copy, Check, Mail, Target, BookOpen,
  BarChart2, FileText, Share2, Star, Zap, Layers, TrendingUp, Hash,
  ArrowRight, Play, Globe, Users, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Constants ────────────────────────────────────────────────────────────────

const ANGLES = [
  "Professional", "Beginner-Friendly", "Advanced Expert", "Side Hustler",
  "Agency Owner", "Content Creator", "Solopreneur", "Student",
];
const PLATFORMS = ["ChatGPT", "Claude", "Gemini", "Midjourney", "DALL-E", "Perplexity", "Any AI"];
const INDUSTRIES = [
  "Business", "Marketing", "Copywriting", "E-Commerce", "Finance",
  "Health & Wellness", "Education", "Technology", "Real Estate",
  "Creative Arts", "Personal Development", "Social Media",
];
const BUNDLE_SIZES = [
  { value: 25,  label: "Starter",   sub: "25 prompts",  best: false },
  { value: 50,  label: "Standard",  sub: "50 prompts",  best: true  },
  { value: 100, label: "Pro",       sub: "100 prompts", best: false },
  { value: 150, label: "Ultimate",  sub: "150 prompts", best: false },
];
const ASSETS = [
  {
    key: "prompts", label: "Prompt Pack", icon: Sparkles, required: true,
    description: "Categorized, ready-to-use AI prompts",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-700",
    text: "text-violet-700 dark:text-violet-300",
    badge: "Included",
  },
  {
    key: "salesPage", label: "Sales Page Copy", icon: Target, required: false,
    description: "High-converting headline, bullets & CTA",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-700",
    text: "text-orange-700 dark:text-orange-300",
    badge: null,
  },
  {
    key: "emailSequence", label: "Email Sequence", icon: Mail, required: false,
    description: "5-email welcome series for new buyers",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
    badge: null,
  },
  {
    key: "socialPosts", label: "Social Posts", icon: Share2, required: false,
    description: "Twitter, Instagram & LinkedIn posts",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-700",
    text: "text-pink-700 dark:text-pink-300",
    badge: null,
  },
];
const STAGES = [
  { id: 1, label: "Niche Research",     icon: BarChart2, tip: "Analyzing topic, angle, and market positioning…"    },
  { id: 2, label: "Category Structure", icon: Layers,    tip: "Building your prompt categories and framework…"     },
  { id: 3, label: "Writing Prompts",    icon: Sparkles,  tip: "AI is crafting each prompt from scratch…"           },
  { id: 4, label: "Marketing Assets",   icon: Target,    tip: "Generating sales copy, emails, and social posts…"   },
  { id: 5, label: "Finalizing Bundle",  icon: Zap,       tip: "Packaging and assembling your complete bundle…"     },
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
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
        active
          ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200 dark:shadow-none"
          : "bg-white dark:bg-slate-900 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border hover:bg-muted flex-shrink-0 ${size === "xs" ? "text-[11px]" : "text-xs"}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {[1, 2].map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          {i > 0 && (
            <div className={`h-px flex-1 w-12 transition-colors duration-300 ${step >= n ? "bg-violet-500" : "bg-border"}`} />
          )}
          <div className={`flex items-center gap-2 transition-all duration-300 ${step === n ? "opacity-100" : step > n ? "opacity-70" : "opacity-40"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
              step > n ? "bg-violet-600 border-violet-600 text-white" :
              step === n ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none" :
              "bg-muted border-border text-muted-foreground"
            }`}>
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
        {/* Left: Inputs */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-0.5">Design Your Prompt Pack</h2>
            <p className="text-sm text-muted-foreground">Tell the AI what to build — every prompt is written from scratch.</p>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Topic / Niche <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Freelance Writing, Shopify Descriptions, LinkedIn Outreach…"
              value={form.topic}
              onChange={e => set("topic", e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Be specific — "Shopify Product Descriptions" beats "e-commerce"</p>
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Author / Brand Name</Label>
            <Input
              placeholder="Your name or brand (optional)"
              value={form.authorName}
              onChange={e => set("authorName", e.target.value)}
              className="h-10"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Industry</Label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(opt => (
                <Chip key={opt} label={opt} active={form.industry === opt} onClick={() => set("industry", opt)} />
              ))}
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">AI Platform</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(opt => (
                <Chip key={opt} label={opt} active={form.platform === opt} onClick={() => set("platform", opt)} />
              ))}
            </div>
          </div>

          {/* Angle */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Target Audience Angle</Label>
            <div className="flex flex-wrap gap-2">
              {ANGLES.map(opt => (
                <Chip key={opt} label={opt} active={form.angle === opt} onClick={() => set("angle", opt)} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Bundle size + preview */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bundle size */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Bundle Size</Label>
            <div className="grid grid-cols-2 gap-2">
              {BUNDLE_SIZES.map(({ value, label, sub, best }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("bundleSize", value)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.bundleSize === value
                      ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30 shadow-sm"
                      : "border-border bg-card hover:border-violet-300"
                  }`}
                >
                  {best && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      POPULAR
                    </span>
                  )}
                  <div className={`text-base font-bold leading-none mb-0.5 ${form.bundleSize === value ? "text-violet-700 dark:text-violet-300" : "text-foreground"}`}>{label}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
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
              {form.topic ? `${form.topic} — ${form.platform}` : "Enter a topic above…"}
            </div>
            {form.authorName && <p className="text-violet-200 text-xs mb-3">by {form.authorName}</p>}

            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { icon: Hash,        label: "Prompts",    value: `${chosen.value}` },
                { icon: Layers,      label: "Categories", value: `${chosen.value <= 25 ? 5 : 10}` },
                { icon: Globe,       label: "Platform",   value: form.platform },
                { icon: Users,       label: "Audience",   value: form.angle.split(" ")[0] },
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

          {/* CTA */}
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white gap-2 text-base font-semibold shadow-lg shadow-violet-200 dark:shadow-none disabled:opacity-40 disabled:shadow-none"
          >
            Choose Assets <ChevronRight className="w-5 h-5" />
          </Button>
          {!canProceed && (
            <p className="text-center text-xs text-muted-foreground">Enter a topic to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  selectedAssets, setSelectedAssets, form, onBack, onGenerate,
}: {
  selectedAssets: string[]; setSelectedAssets: (a: string[]) => void;
  form: StudioForm; onBack: () => void; onGenerate: () => void;
}) {
  const toggle = (key: string) => {
    if (key === "prompts") return;
    setSelectedAssets(
      selectedAssets.includes(key) ? selectedAssets.filter(k => k !== key) : [...selectedAssets, key]
    );
  };
  const chosen = BUNDLE_SIZES.find(b => b.value === form.bundleSize)!;
  const estimatedTime = selectedAssets.length <= 1 ? "2–3 min" : selectedAssets.length <= 2 ? "3–4 min" : "4–6 min";

  return (
    <div>
      <StepIndicator step={2} />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-0.5">What should we generate?</h2>
        <p className="text-sm text-muted-foreground">Prompt Pack is always included. Add marketing assets to sell faster.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {ASSETS.map(asset => {
          const Icon = asset.icon;
          const selected = selectedAssets.includes(asset.key);
          return (
            <button
              key={asset.key}
              type="button"
              onClick={() => toggle(asset.key)}
              disabled={asset.required}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 group focus:outline-none ${
                asset.required
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 cursor-default"
                  : selected
                    ? `${asset.border} ${asset.bg} shadow-sm cursor-pointer`
                    : "border-border bg-card hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
              }`}
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
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    selected ? "bg-violet-600 border-violet-600" : "border-muted-foreground/30"
                  }`}>
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

      {/* Summary strip */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: "Topic",       value: form.topic.length > 18 ? form.topic.slice(0, 18) + "…" : form.topic },
            { label: "Prompts",     value: `${chosen.value}` },
            { label: "Platform",    value: form.platform },
            { label: "Est. Time",   value: estimatedTime },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
              <div className="text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground sm:text-right">
          {selectedAssets.length} asset{selectedAssets.length !== 1 ? "s" : ""} selected
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 h-10">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={onGenerate}
          className="h-12 px-8 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white gap-2 font-semibold shadow-lg shadow-violet-200 dark:shadow-none"
        >
          <Sparkles className="w-4 h-4" />
          Generate {selectedAssets.length} Asset{selectedAssets.length !== 1 ? "s" : ""}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Generation View ──────────────────────────────────────────────────────────

function GenerationView({ stage, topic }: { stage: number; topic: string }) {
  const pct = Math.round((stage / STAGES.length) * 100);

  return (
    <div className="py-4">
      {/* Animated orb */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute w-36 h-36 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: "2.4s" }} />
        <div className="absolute w-28 h-28 rounded-full bg-violet-500/15 animate-ping" style={{ animationDuration: "1.8s" }} />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-300 dark:shadow-violet-900">
          <Sparkles className="w-9 h-9 text-white" style={{ animation: "spin 3s linear infinite" }} />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Building Your Prompt Pack</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          "<span className="font-medium text-foreground">{topic}</span>" is being crafted by AI. Sit tight.
        </p>
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Generation progress</span>
          <span className="font-semibold text-violet-600">{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="max-w-md mx-auto space-y-2.5">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stage;
          const isDone = i < stage;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                isActive ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 shadow-sm" :
                isDone   ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-80" :
                           "bg-muted/20 border-border opacity-35"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isDone   ? "bg-emerald-500" :
                isActive ? "bg-gradient-to-br from-violet-500 to-purple-600" :
                           "bg-muted"
              }`}>
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : isActive
                    ? <Icon className="w-4 h-4 text-white" />
                    : <Icon className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold leading-tight ${
                  isActive ? "text-foreground" : isDone ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                }`}>
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

// ─── Asset Cards ──────────────────────────────────────────────────────────────

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
      a.href = url;
      a.download = `${(bundle?.packageTitle ?? "prompts").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.html`;
      a.click();
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

      <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white h-11">
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {downloading ? "Building file…" : "Download Prompt Pack (.html)"}
      </Button>
    </div>
  );
}

function SalesPageCard({ data }: { data: any }) {
  const [expanded, setExpanded] = useState(false);
  if (!data) return (
    <div className="text-center py-10 text-muted-foreground">
      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Not generated — go back and select this asset</p>
    </div>
  );

  const fullText = [
    data.headline, data.subheadline, "", data.hook, "",
    "WHAT YOU GET:", ...(data.bullets ?? []).map((b: string) => `• ${b}`), "",
    data.socialProof, "", data.guarantee, "", data.closingCta,
  ].filter(l => l !== undefined).join("\n");

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-foreground text-base leading-tight">{data.headline}</div>
          {data.subheadline && <p className="text-muted-foreground text-sm italic mt-0.5">{data.subheadline}</p>}
        </div>
        <CopyButton text={fullText} />
      </div>

      {data.hook && (
        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-3 line-clamp-4">{data.hook}</p>
      )}

      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1">
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
          {data.socialProof && (
            <blockquote className="border-l-2 border-violet-400 pl-3 text-xs text-muted-foreground italic">{data.socialProof}</blockquote>
          )}
          {data.guarantee && <p className="text-emerald-700 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">{data.guarantee}</p>}
          {data.closingCta && <p className="font-bold text-foreground">{data.closingCta}</p>}
          <button type="button" onClick={() => setExpanded(false)} className="text-violet-600 text-sm font-medium">Show less ↑</button>
        </div>
      )}
    </div>
  );
}

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
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
            >
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
                {email.cta && (
                  <div className="inline-flex bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">{email.cta}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SocialPostsCard({ data }: { data: any }) {
  const [tab, setTab] = useState<"twitter" | "instagram" | "linkedin">("twitter");
  if (!data) return (
    <div className="text-center py-10 text-muted-foreground">
      <Share2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Not generated — go back and select this asset</p>
    </div>
  );

  const tabs = [
    { key: "twitter" as const,   label: "𝕏 Twitter",   items: data.twitter    ?? [] },
    { key: "instagram" as const, label: "📷 Instagram", items: data.instagram  ?? [] },
    { key: "linkedin" as const,  label: "💼 LinkedIn",  items: data.linkedin   ?? [] },
  ];
  const current = tabs.find(t => t.key === tab)!;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              tab === t.key ? "bg-white dark:bg-slate-900 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
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

// ─── Landing Page Snippets ────────────────────────────────────────────────────

function LandingSnippetsCard({ bundle }: { bundle: any }) {
  if (!bundle?.landingPageHook) return null;
  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-xl p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hero Hook</span>
          <CopyButton text={bundle.landingPageHook} size="xs" />
        </div>
        <p className="text-sm text-muted-foreground italic leading-relaxed">"{bundle.landingPageHook}"</p>
      </div>
      {bundle.landingPageBenefits?.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-3 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Benefits</div>
          {bundle.landingPageBenefits.map((b: string, i: number) => (
            <div key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-emerald-500 flex-shrink-0">✓</span><span>{b}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({ result, form, onReset }: { result: any; form: StudioForm; onReset: () => void }) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(result.publishStatus === "published");
  const [publishMsg, setPublishMsg] = useState("");
  const bundle = result.bundle;
  const assetList: string[] = result.params?.selectedAssets ?? ["prompts"];

  const assetTabs = [
    { key: "prompts",       label: "Prompt Pack",   icon: Sparkles, available: assetList.includes("prompts"),       color: "text-violet-600" },
    { key: "salesPage",     label: "Sales Page",    icon: Target,   available: assetList.includes("salesPage"),     color: "text-orange-600" },
    { key: "emailSequence", label: "Email Series",  icon: Mail,     available: assetList.includes("emailSequence"), color: "text-blue-600"   },
    { key: "socialPosts",   label: "Social Posts",  icon: Share2,   available: assetList.includes("socialPosts"),   color: "text-pink-600"   },
    { key: "landing",       label: "Landing Hooks", icon: FileText, available: !!(bundle?.landingPageHook),         color: "text-amber-600"  },
  ].filter(t => t.available);

  const [activeTab, setActiveTab] = useState(assetTabs[0]?.key ?? "prompts");

  const handlePublish = async () => {
    setPublishing(true); setPublishMsg("");
    try {
      const r = await apiFetch(`/prompt-packages/${result.id}/publish`, {
        method: "POST", body: JSON.stringify({ target: "store" }),
      });
      const data = await r.json();
      if (!r.ok) { setPublishMsg(data.error ?? "Publish failed"); setPublishing(false); return; }
      setPublished(true);
      setPublishMsg("Published to your store!");
    } catch { setPublishMsg("Publish failed. Please try again."); }
    finally { setPublishing(false); }
  };

  return (
    <div className="space-y-5">
      {/* Success banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-foreground">{bundle?.packageTitle ?? form.topic}</div>
            {bundle?.tagline && <p className="text-muted-foreground text-xs italic mt-0.5">{bundle.tagline}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              {bundle?.totalPrompts > 0 && (
                <span className="text-[11px] bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-700 font-medium">
                  {bundle.totalPrompts} Prompts
                </span>
              )}
              {[bundle?.platform, bundle?.industry, bundle?.angle].filter(Boolean).map((v: string) => (
                <span key={v} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border font-medium">{v}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!published ? (
            <Button onClick={handlePublish} disabled={publishing} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
              Publish to Store
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 font-medium px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live in Store
            </span>
          )}
          <Button variant="outline" onClick={onReset} size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> New Pack
          </Button>
        </div>
      </div>

      {publishMsg && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${published ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-400" : "bg-red-50 border-red-200 text-red-700"}`}>
          {publishMsg}
        </div>
      )}

      {/* Asset tabs + content */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tab sidebar */}
        <div className="lg:w-44 flex-shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {assetTabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full ${
                    activeTab === t.key
                      ? "bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === t.key ? t.color : ""}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 bg-card border rounded-2xl p-5 min-h-[300px]">
          {activeTab === "prompts" && <PromptPackCard result={result} productId={result.id} />}
          {activeTab === "salesPage" && <SalesPageCard data={result.salesPage} />}
          {activeTab === "emailSequence" && <EmailSequenceCard data={result.emailSequence} />}
          {activeTab === "socialPosts" && <SocialPostsCard data={result.socialPosts} />}
          {activeTab === "landing" && <LandingSnippetsCard bundle={bundle} />}
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
    apiFetch("/prompt-packages")
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
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
        <div
          key={item.id}
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
              {item.platform && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">{item.platform}</span>
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
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["prompts"]);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleGenerate = useCallback(async () => {
    setError(""); setStage(0); setView("generating");
    const stageTimer = (async () => {
      await sleep(800); setStage(1);
      await sleep(2200); setStage(2);
      await sleep(1800); setStage(3);
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
      if (selectedAssets.length > 1) { await sleep(500); setStage(4); }
      await sleep(600); setStage(5);
      await sleep(400);
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
    setForm(DEFAULT_FORM); setSelectedAssets(["prompts"]);
    setStage(0); setResult(null); setError(""); setView("step1");
  };

  const showTabs = view === "step1" || view === "step2";
  const isGenOrResult = view === "generating" || view === "results";

  return (
    <div className="min-h-screen bg-background">

      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(109, 40, 217, 0.2) 0%, transparent 50%)"
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-900/40 flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Prompt Pack Studio</h1>
                <p className="text-violet-300 text-sm mt-0.5">AI-generated prompt bundles — real content, ready to sell</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-6 flex-shrink-0">
              {[
                { icon: TrendingUp, label: "Sell-ready",   value: "100%"   },
                { icon: Zap,        label: "AI-written",    value: "Every ✦" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-0.5">
                    <Icon className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-white text-sm font-bold">{value}</span>
                  </div>
                  <div className="text-violet-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs — only shown in step1/step2 */}
          {showTabs && (
            <div className="flex gap-1 mt-7 bg-white/5 backdrop-blur-sm p-1 rounded-xl w-fit border border-white/10">
              {[
                { key: "studio",  label: "Studio",   icon: Play   },
                { key: "history", label: "My Packs",  icon: Clock  },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key as "studio" | "history")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-violet-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
            <span className="font-semibold flex-shrink-0">Error:</span> {error}
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
          </div>
        )}

        {/* Card */}
        <div className={`bg-card border rounded-3xl shadow-sm ${isGenOrResult ? "p-6 sm:p-8" : "p-6 sm:p-8"}`}>
          {showTabs && tab === "history" ? (
            <HistoryView onSelectProduct={loadProduct} />
          ) : view === "step1" ? (
            <Step1 form={form} setForm={setForm} onNext={() => setView("step2")} />
          ) : view === "step2" ? (
            <Step2
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              form={form}
              onBack={() => setView("step1")}
              onGenerate={handleGenerate}
            />
          ) : view === "generating" ? (
            <GenerationView stage={stage} topic={form.topic} />
          ) : view === "results" && result ? (
            <ResultsView result={result} form={form} onReset={reset} />
          ) : null}
        </div>

        {showTabs && tab === "studio" && (
          <p className="text-center text-xs text-muted-foreground mt-5">
            Powered by Selovox AI · Every prompt is written by AI from scratch — never templates
          </p>
        )}
      </div>
    </div>
  );
}
