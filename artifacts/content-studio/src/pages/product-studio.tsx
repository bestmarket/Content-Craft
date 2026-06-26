import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, ChevronRight, CheckCircle2, Loader2, AlertCircle, Upload, X,
  BookOpen, Star, Download, Eye, DollarSign, BarChart3, Zap, Users, Target,
  ArrowRight, Trophy, TrendingUp, FileText, Clock,
} from "lucide-react";

const STAGES = [
  { key: "researching",  label: "Researching Niche Matrix & Audience Insights",     icon: "🔬" },
  { key: "architecting", label: "Architecting Product Structure & Chapter Framework", icon: "🏗️" },
  { key: "writing",      label: "Generating Full Chapter Content",                   icon: "✍️" },
  { key: "marketing",    label: "Compiling Marketing Assets & Sales Copy",           icon: "📢" },
  { key: "scoring",      label: "Evaluating Product Quality Score",                  icon: "⭐" },
  { key: "compiling",    label: "Compiling PDF Layout & Publishing",                 icon: "📦" },
];

const NICHE_OPTIONS = [
  "Business & Entrepreneurship", "Personal Finance", "Health & Fitness",
  "Self Development", "Digital Marketing", "Productivity & Focus",
  "Relationships & Dating", "Online Income", "Investing & Wealth",
  "Parenting & Family", "Mental Health & Wellness", "Technology & AI",
  "Creative Writing", "Food & Nutrition", "Travel & Lifestyle",
];

interface JobStatus {
  status: "generating" | "published" | "error";
  stage?: string;
  stageIndex?: number;
  totalStages?: number;
  label?: string;
  elapsedSeconds?: number;
  error?: string;
  product?: {
    id: number;
    title: string;
    subtitle?: string;
    description?: string;
    coverImageUrl?: string;
    sellabilityScore?: number;
    price?: string;
    tableOfContents?: string[];
    marketingAssets?: any;
    landingPageData?: any;
    downloadUrl?: string;
  };
}

function ScoreBadge({ score }: { score: number }) {
  const badge = score >= 85 ? { label: "Elite", color: "bg-yellow-500", emoji: "🏆" }
    : score >= 70 ? { label: "Premium", color: "bg-purple-600", emoji: "⭐" }
    : score >= 55 ? { label: "Good", color: "bg-green-600", emoji: "✅" }
    : { label: "Standard", color: "bg-slate-500", emoji: "📋" };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-20 h-20 rounded-full ${badge.color} flex flex-col items-center justify-center shadow-lg`}>
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-white/80">/ 100</span>
      </div>
      <span className="text-sm font-semibold text-slate-700">{badge.emoji} {badge.label}</span>
    </div>
  );
}

function StageTracker({ jobStatus, productId }: { jobStatus: JobStatus | null; productId: number | null }) {
  if (!productId || !jobStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <Zap className="w-10 h-10 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to Generate</h3>
          <p className="text-sm text-slate-500 max-w-xs">Fill in the details on the left and click <strong>Generate Product</strong> to start your AI pipeline.</p>
        </div>
        <div className="w-full max-w-sm space-y-2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-lg">{s.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-xs font-medium text-slate-600">Step {i + 1}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobStatus.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <div>
          <h3 className="text-lg font-semibold text-red-700">Pipeline Error</h3>
          <p className="text-sm text-red-500 mt-1">{jobStatus.error ?? "An error occurred during generation"}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const currentIdx = (jobStatus.stageIndex ?? 1) - 1;

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">AI Pipeline Running</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Building Your Product</h3>
        {jobStatus.elapsedSeconds != null && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {jobStatus.elapsedSeconds}s elapsed
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Step {jobStatus.stageIndex ?? 1} of {jobStatus.totalStages ?? STAGES.length}</span>
          <span>{Math.round(((jobStatus.stageIndex ?? 1) / (jobStatus.totalStages ?? STAGES.length)) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${((jobStatus.stageIndex ?? 1) / (jobStatus.totalStages ?? STAGES.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-3 flex-1">
        {STAGES.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          const isPending = i > currentIdx;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                isActive ? "bg-indigo-50 border-indigo-200 shadow-sm" :
                isDone ? "bg-green-50 border-green-100" :
                "bg-slate-50 border-slate-100 opacity-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDone ? "bg-green-500" : isActive ? "bg-indigo-500" : "bg-slate-200"
              }`}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <span className="text-xs text-slate-400 font-medium">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold ${isActive ? "text-indigo-700" : isDone ? "text-green-700" : "text-slate-400"}`}>
                  {isActive ? "In progress..." : isDone ? "Complete" : `Step ${i + 1}`}
                </div>
                <div className={`text-sm truncate ${isActive ? "text-indigo-600" : isDone ? "text-green-600" : "text-slate-400"}`}>
                  {s.icon} {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductPreview({ product }: { product: NonNullable<JobStatus["product"]> }) {
  const assets = product.marketingAssets as any;
  const landing = product.landingPageData as any;
  const toc = Array.isArray(product.tableOfContents) ? product.tableOfContents : [];
  const score = product.sellabilityScore ?? 0;
  const bullets: string[] = assets?.bulletBenefits ?? landing?.bulletBenefits ?? [];

  return (
    <div className="h-full overflow-y-auto">
      {/* Cover card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-center">
        {product.coverImageUrl && (
          <img
            src={product.coverImageUrl}
            alt="Cover"
            className="w-32 h-40 object-cover rounded-xl shadow-2xl mx-auto mb-5 border-2 border-white/20"
          />
        )}
        {!product.coverImageUrl && (
          <div className="w-32 h-40 rounded-xl shadow-2xl mx-auto mb-5 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
        )}
        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-3">✨ Published</Badge>
        <h2 className="text-xl font-bold text-white leading-tight mb-2">{product.title}</h2>
        {product.subtitle && <p className="text-sm text-indigo-200">{product.subtitle}</p>}
        <div className="flex items-center justify-center gap-4 mt-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${product.price ?? "27"}</div>
            <div className="text-xs text-slate-400">Suggested Price</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <ScoreBadge score={score} />
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Benefits */}
      {bullets.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Benefits</h4>
          <ul className="space-y-2">
            {bullets.slice(0, 5).map((b: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table of Contents */}
      {toc.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Table of Contents</h4>
          <ol className="space-y-1">
            {toc.slice(0, 8).map((item: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Score breakdown */}
      {assets?.productScore && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quality Breakdown</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(assets.productScore.breakdown ?? {}).map(([key, val]: [string, any]) => (
              <div key={key} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                <div className="text-lg font-bold text-indigo-600">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-5 space-y-3">
        {product.downloadUrl && (
          <a href={`/api${product.downloadUrl.replace("/api", "")}`} download>
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Download Product
            </Button>
          </a>
        )}
        <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full">
            <Eye className="w-4 h-4 mr-2" /> View Landing Page
          </Button>
        </a>
        <a href="/marketplace">
          <Button variant="ghost" className="w-full text-slate-500">
            <TrendingUp className="w-4 h-4 mr-2" /> View in Marketplace
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function ProductStudio() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const [productId, setProductId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(null);
  const [authorImageFile, setAuthorImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    topic: "",
    subtitle: "",
    angle: "",
    targetAudience: "",
    niche: "",
    authorName: "",
  });

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setAuthorImageFile(file);
      setAuthorImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAuthorImageFile(file);
      setAuthorImagePreview(URL.createObjectURL(file));
    }
  };

  const startPolling = useCallback((id: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await apiClient<JobStatus>(`/studio/job/${id}`);
        setJobStatus(data);
        if (data.status === "published" || data.status === "error") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch (_) {}
    }, 2500);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleGenerate = async () => {
    if (!form.topic.trim()) { toast({ title: "Product name required", variant: "destructive" }); return; }
    setIsStarting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (authorImageFile) fd.append("authorImage", authorImageFile);

      const data = await apiClient<{ productId: number }>("/studio/generate", { method: "POST", body: fd });
      setProductId(data.productId);
      setJobStatus({ status: "generating", stage: "researching", stageIndex: 1, totalStages: 6, label: STAGES[0].label });
      startPolling(data.productId);
      toast({ title: "Pipeline started!", description: "Your product is being generated. This takes 2–4 minutes." });
    } catch (err: any) {
      toast({ title: "Failed to start", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setIsStarting(false);
    }
  };

  const isGenerating = jobStatus?.status === "generating";
  const isPublished = jobStatus?.status === "published";

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">Product Studio</span>
        </div>
        <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200 bg-indigo-50">AI-Powered PDF Creator</Badge>
        <div className="flex-1" />
        {isPublished && jobStatus?.product && (
          <Badge className="bg-green-100 text-green-700 border-green-200">✅ Published</Badge>
        )}
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Step {jobStatus.stageIndex}/{jobStatus.totalStages}
          </div>
        )}
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Input Configuration */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Product Configuration</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in all fields for best results</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                Product Name / Topic <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Passive Income with AI Tools"
                value={form.topic}
                onChange={field("topic")}
                disabled={isGenerating}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subtitle</Label>
              <Input
                placeholder="e.g. The 30-Day Blueprint to $5K/Month"
                value={form.subtitle}
                onChange={field("subtitle")}
                disabled={isGenerating}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Angle / Direction</Label>
              <Input
                placeholder="e.g. Practical systems for beginners"
                value={form.angle}
                onChange={field("angle")}
                disabled={isGenerating}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Audience</Label>
              <Input
                placeholder="e.g. Millennials working 9-5 jobs"
                value={form.targetAudience}
                onChange={field("targetAudience")}
                disabled={isGenerating}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Niche</Label>
              <select
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                value={form.niche}
                onChange={field("niche")}
                disabled={isGenerating}
              >
                <option value="">Select a niche...</option>
                {NICHE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Author Name</Label>
              <Input
                placeholder="e.g. Alex Morgan"
                value={form.authorName}
                onChange={field("authorName")}
                disabled={isGenerating}
                className="text-sm"
              />
            </div>

            {/* Author image upload */}
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Author Image (optional)</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isGenerating ? "opacity-50 cursor-not-allowed" :
                  "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
                onDragOver={e => e.preventDefault()}
                onDrop={isGenerating ? undefined : handleImageDrop}
                onClick={isGenerating ? undefined : () => fileInputRef.current?.click()}
              >
                {authorImagePreview ? (
                  <div className="relative inline-block">
                    <img src={authorImagePreview} alt="Author" className="w-16 h-16 rounded-full object-cover mx-auto" />
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      onClick={e => { e.stopPropagation(); setAuthorImagePreview(null); setAuthorImageFile(null); }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Drop image or click to upload</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div className="px-5 py-4 border-t border-slate-100">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isStarting || !form.topic.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
            >
              {isStarting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
              ) : isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Product</>
              )}
            </Button>
            <p className="text-xs text-slate-400 text-center mt-2">Takes 2–4 minutes · Powered by Gemini AI</p>
          </div>
        </div>

        {/* CENTER: Stage Tracker */}
        <div className="flex-1 bg-white border-r border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Live Generation Tracker</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time pipeline status</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <StageTracker jobStatus={jobStatus} productId={productId} />
          </div>
        </div>

        {/* RIGHT: Preview Canvas */}
        <div className="w-96 flex-shrink-0 bg-white flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Product Preview</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isPublished ? "Your published product" : "Preview appears once published"}</p>
          </div>
          <div className="flex-1 overflow-hidden">
            {isPublished && jobStatus?.product ? (
              <ProductPreview product={jobStatus.product} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-slate-100 to-indigo-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-1">No product yet</h3>
                  <p className="text-xs text-slate-400">Your 3D cover, chapter samples, and quality badge will appear here after generation.</p>
                </div>
                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating your product...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
