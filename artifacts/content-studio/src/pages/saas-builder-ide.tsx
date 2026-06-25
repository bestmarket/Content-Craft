import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, DollarSign, Users, Loader2, Copy, Eye, Rocket,
  BarChart3, Megaphone, Youtube, Pencil, RefreshCw, CheckCircle,
  X, ArrowLeft, Zap, AlertCircle, Mic, ImageIcon, Download,
  Play, Pause, FileText, Sparkles, Instagram, Camera,
  TrendingUp, List, Menu,
} from "lucide-react";

const VOICES = [
  { id: "am_adam", name: "Adam", desc: "Deep & authoritative" },
  { id: "am_michael", name: "Michael", desc: "Confident & natural" },
  { id: "af_sky", name: "Sky", desc: "Warm & expressive" },
  { id: "af_bella", name: "Bella", desc: "Smooth & professional" },
  { id: "af_sarah", name: "Sarah", desc: "Clear & energetic" },
  { id: "bm_george", name: "George", desc: "Distinguished British" },
  { id: "bm_lewis", name: "Lewis", desc: "Calm British" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  saas_tool: "⚡ SaaS Tool", coaching: "🎯 Coaching",
  daily_plan: "🔥 Daily Plan", course: "🎓 Course",
  community: "👥 Community", newsletter: "📩 Newsletter",
};

type Tab = "overview" | "marketing" | "content" | "subscribers" | "edit";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "content", label: "🎬 Content", icon: Youtube },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "edit", label: "Edit", icon: Pencil },
];

export default function SaasBuilderIDE() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["saas-app", id],
    queryFn: () => api.get(`/saas/apps/${id}`).then(r => r.data),
    refetchInterval: ({ state }: any) => state?.data?.generationStatus === "generating" ? 3000 : false,
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["saas-subscribers", id],
    queryFn: () => api.get(`/saas/apps/${id}/subscribers`).then(r => r.data),
    enabled: !!app && (app as any).generationStatus === "complete",
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/saas/apps/${id}/publish`, {}).then(r => r.data),
    onSuccess: (data: any) => { qc.invalidateQueries({ queryKey: ["saas-app", id] }); toast({ title: "🚀 Published!", description: `/saas/${data.slug}` }); },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => api.post(`/saas/apps/${id}/unpublish`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-app", id] }); toast({ title: "Unpublished" }); },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/saas/apps/${id}/regenerate`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-app", id] }); toast({ title: "Regenerating…" }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/saas/apps/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-app", id] }); toast({ title: "Saved!" }); setEditingName(false); },
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );
  if (!app) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
      <div><AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">App not found</p></div>
    </div>
  );

  const lp = app.landingPage as any;
  const mp = app.marketingPlan as any;
  const tiers = (app.tiers as any[]) || [];
  const publicUrl = `${window.location.origin}/saas/${app.deploySlug}`;
  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <button onClick={() => navigate("/saas-builder")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All Apps
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {editingName ? (
                  <>
                    <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 max-w-xs bg-card shadow-sm" />
                    <button onClick={() => updateMutation.mutate({ name: tempName })} className="text-green-600 hover:text-green-700"><CheckCircle className="w-5 h-5" /></button>
                    <button onClick={() => setEditingName(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{app.name}</h1>
                    <button onClick={() => { setEditingName(true); setTempName(app.name); }} className="text-gray-400 hover:text-violet-500 flex-shrink-0"><Pencil className="w-4 h-4" /></button>
                  </>
                )}
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  app.status === "live" ? "bg-green-100 text-green-700 border-green-200"
                  : app.generationStatus === "generating" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  {app.status === "live" ? "🟢 Live" : app.generationStatus === "generating" ? "⏳ Building…" : "Draft"}
                </span>
                <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-0.5 rounded-full font-medium">
                  {BUSINESS_TYPE_LABELS[app.businessType || "saas_tool"]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 truncate">{app.tagline}</p>
            </div>

            <div className="flex gap-2 flex-wrap flex-shrink-0">
              {app.generationStatus === "complete" && app.status !== "live" && (
                <button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
                  {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Publish
                </button>
              )}
              {app.status === "live" && (
                <>
                  <a href={`/saas/${app.deploySlug}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-card hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <Eye className="w-4 h-4" />
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "URL copied!" }); }}
                    className="flex items-center gap-1.5 bg-card hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => unpublishMutation.mutate()} disabled={unpublishMutation.isPending}
                    className="flex items-center gap-1.5 bg-card hover:bg-red-50 border border-gray-300 text-red-500 px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              <button onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending || app.generationStatus === "generating"}
                className="flex items-center gap-1.5 bg-card hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
                <RefreshCw className={`w-4 h-4 ${app.generationStatus === "generating" ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Building banner */}
        {app.generationStatus === "generating" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 text-sm">AI is building your subscription business…</p>
              <p className="text-xs text-amber-600">~45–90 seconds. Page auto-refreshes.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Subscribers", value: app.subscriberCount ?? 0, icon: Users, color: "bg-blue-100 text-blue-700" },
            { label: "Revenue", value: `$${parseFloat(app.totalRevenue ?? "0").toFixed(2)}`, icon: DollarSign, color: "bg-emerald-100 text-emerald-700" },
            { label: "Tiers", value: tiers.length, icon: Zap, color: "bg-violet-100 text-violet-700" },
            { label: "Status", value: app.status === "live" ? "Live" : "Draft", icon: Globe, color: "bg-gray-100 text-gray-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-gray-200 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-gray-900 text-lg leading-none mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="bg-card border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop tabs */}
          <div className="hidden sm:flex border-b border-gray-200 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-700 bg-violet-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          {/* Mobile tab picker */}
          <div className="sm:hidden border-b border-gray-200">
            <button onClick={() => setMobileTabOpen(!mobileTabOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-violet-700 bg-violet-50">
              <span className="flex items-center gap-2"><activeTabMeta.icon className="w-4 h-4" />{activeTabMeta.label}</span>
              <Menu className="w-4 h-4 text-gray-500" />
            </button>
            {mobileTabOpen && (
              <div className="border-t border-gray-100">
                {TABS.map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileTabOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${activeTab === tab.id ? "text-violet-700 bg-violet-50" : "text-gray-600 hover:bg-gray-50"}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "overview" && <OverviewTab app={app} lp={lp} tiers={tiers} publicUrl={publicUrl} appId={id!} qc={qc} toast={toast} />}
            {activeTab === "marketing" && <MarketingTab mp={mp} toast={toast} />}
            {activeTab === "content" && <ContentTab app={app} appId={id!} qc={qc} toast={toast} />}
            {activeTab === "subscribers" && <SubscribersTab subscribers={subscribers} app={app} />}
            {activeTab === "edit" && <EditForm app={app} onUpdate={(data: any) => updateMutation.mutate(data)} saving={updateMutation.isPending} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ app, lp, tiers, publicUrl, appId, qc, toast }: any) {
  const thumbnailMutation = useMutation({
    mutationFn: () => api.post(`/saas/apps/${appId}/thumbnail`, { topic: `${app.name} — ${app.tagline}` }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-app", appId] }); toast({ title: "Thumbnail generated! 🖼" }); },
    onError: () => toast({ title: "Thumbnail failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      {/* Thumbnail */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <ImageIcon className="w-4 h-4 text-violet-500" /> Marketing Thumbnail
          </h3>
          <button onClick={() => thumbnailMutation.mutate()} disabled={thumbnailMutation.isPending}
            className="flex items-center gap-1.5 bg-card hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm">
            {thumbnailMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {app.thumbnailUrl ? "Regenerate" : "Generate"}
          </button>
        </div>
        {app.thumbnailUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img src={app.thumbnailUrl} alt="Marketing thumbnail" className="w-full object-cover max-h-52" />
            <a href={app.thumbnailUrl} target="_blank" rel="noreferrer"
              className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 hover:bg-black/80">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        ) : (
          <div className="h-28 sm:h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-7 h-7 text-gray-300" />
            <p className="text-xs text-gray-400 text-center px-4">Click "Generate" to create a high-converting thumbnail</p>
          </div>
        )}
      </div>

      {/* Tiers */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
          <DollarSign className="w-4 h-4 text-violet-500" /> Subscription Tiers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tiers.map((tier: any) => (
            <div key={tier.id} className={`rounded-xl border p-4 ${tier.highlighted ? "border-violet-300 bg-violet-50 ring-2 ring-violet-200" : "border-gray-200 bg-card shadow-sm"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">{tier.name}</span>
                {tier.highlighted && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium">Popular</span>}
              </div>
              <p className="text-2xl font-black text-gray-900 mb-0.5">
                {tier.priceMonthly === 0 ? "Free" : `$${tier.priceMonthly}`}
                {tier.priceMonthly > 0 && <span className="text-sm font-normal text-gray-400">/mo</span>}
              </p>
              {tier.priceAnnual > 0 && <p className="text-xs text-gray-400 mb-3">${tier.priceAnnual}/yr{tier.priceLifetime ? ` · $${tier.priceLifetime} lifetime` : ""}</p>}
              <ul className="space-y-1.5">
                {(tier.perks || []).slice(0, 4).map((p: string) => (
                  <li key={p} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Landing page preview */}
      {lp && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Globe className="w-4 h-4 text-violet-500" /> Landing Page Preview
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div><p className="text-xs text-gray-400 mb-1">Headline</p><p className="font-semibold text-gray-900 text-sm">"{lp.headline}"</p></div>
            <div><p className="text-xs text-gray-400 mb-1">Sub-headline</p><p className="text-gray-600 text-sm">{lp.subheadline}</p></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(lp.features || []).slice(0, 6).map((f: any) => (
                <div key={f.title} className="bg-card border border-gray-200 rounded-lg p-2.5 text-xs shadow-sm">
                  <span className="text-base">{f.icon}</span>
                  <p className="font-medium text-gray-700 mt-1 truncate">{f.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Public URL */}
      {app.status === "live" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-1.5">🌐 Live Subscription Page</p>
          <div className="flex items-center gap-2">
            <code className="text-xs sm:text-sm text-green-700 flex-1 break-all">{publicUrl}</code>
            <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Copied!" }); }}
              className="p-1.5 hover:bg-green-100 rounded-lg flex-shrink-0">
              <Copy className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Marketing Tab ────────────────────────────────────────────────────────────
function MarketingTab({ mp, toast }: any) {
  if (!mp) return <div className="text-center py-12 text-gray-400">Marketing plan not available yet.</div>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1.5 text-sm"><TrendingUp className="w-4 h-4" /> Target Audience</h4>
          <p className="text-sm text-blue-700">{mp.targetAudience}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <h4 className="font-semibold text-violet-800 mb-2 flex items-center gap-1.5 text-sm"><Zap className="w-4 h-4" /> Unique Angle</h4>
          <p className="text-sm text-violet-700">{mp.uniqueAngle}</p>
        </div>
      </div>

      {(mp.painPoints || []).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 text-sm">😣 Pain Points to Address</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {mp.painPoints.map((p: string, i: number) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{p}</div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-700 mb-2 text-sm">🪝 High-Converting Ad Hooks</h4>
        <div className="space-y-2">
          {(mp.hooks || []).map((h: string, i: number) => (
            <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-amber-600 font-bold text-sm mt-0.5">{i + 1}</span>
              <p className="text-sm text-gray-700 flex-1">"{h}"</p>
              <button onClick={() => { navigator.clipboard.writeText(h); toast({ title: "Hook copied!" }); }}
                className="flex-shrink-0 p-1 hover:bg-amber-100 rounded">
                <Copy className="w-3.5 h-3.5 text-amber-600" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm"><Youtube className="w-4 h-4 text-red-500" /> YouTube Video Ideas</h4>
        <div className="space-y-1.5">
          {(mp.youtubeIdeas || []).map((idea: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <span className="text-xs font-bold text-red-500 w-4 flex-shrink-0">{i + 1}</span>
              <p className="text-sm text-gray-700 flex-1 leading-snug">{idea}</p>
              <button onClick={() => { navigator.clipboard.writeText(idea); toast({ title: "Copied!" }); }}
                className="p-1 hover:bg-red-100 rounded flex-shrink-0">
                <Copy className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm"><Camera className="w-4 h-4 text-pink-500" /> TikTok Ideas</h4>
        <div className="space-y-1.5">
          {(mp.tiktokIdeas || []).map((idea: string, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-pink-50 border border-pink-200 rounded-lg px-3 py-2.5">
              <span className="text-xs font-bold text-pink-500 w-4 flex-shrink-0">{i + 1}</span>
              <p className="text-sm text-gray-700 flex-1 leading-snug">{idea}</p>
              <button onClick={() => { navigator.clipboard.writeText(idea); toast({ title: "Copied!" }); }}
                className="p-1 hover:bg-pink-100 rounded flex-shrink-0">
                <Copy className="w-3.5 h-3.5 text-pink-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {mp.instagramTheme && (
        <div className="bg-primary/5 border border-primary/30 rounded-xl p-4">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2 text-sm"><Instagram className="w-4 h-4" /> Instagram Theme</h4>
          <p className="text-sm text-primary">{mp.instagramTheme}</p>
        </div>
      )}

      {(mp.launchChecklist || []).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm"><List className="w-4 h-4 text-green-500" /> Launch Checklist</h4>
          <div className="space-y-1.5">
            {mp.launchChecklist.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <div className="w-4 h-4 rounded border-2 border-green-400 flex-shrink-0" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Content Tab ──────────────────────────────────────────────────────────────
function ContentTab({ app, appId, qc, toast }: any) {
  const mp = app.marketingPlan as any;
  const [selectedVideoIdea, setSelectedVideoIdea] = useState(mp?.youtubeIdeas?.[0] || "");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("am_adam");
  const [voiceText, setVoiceText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scriptMutation = useMutation({
    mutationFn: () => api.post(`/saas/apps/${appId}/youtube-script`, { videoIdea: customTitle || selectedVideoIdea }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-app", appId] }); toast({ title: "🎬 Script generated!" }); },
    onError: () => toast({ title: "Script generation failed", variant: "destructive" }),
  });

  const voiceoverMutation = useMutation({
    mutationFn: async () => {
      const text = voiceText || mp?.hooks?.[0] || app.tagline || app.name;
      const res = await fetch(`/api/saas/apps/${appId}/voiceover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ text, voiceId: selectedVoice, speed: 1.0 }),
      });
      if (!res.ok) throw new Error("Voiceover failed");
      return URL.createObjectURL(await res.blob());
    },
    onSuccess: (url) => { setAudioUrl(url); toast({ title: "🎙 Voiceover ready!" }); },
    onError: () => toast({ title: "Voice engine unavailable. Start the Voice Engine workflow first.", variant: "destructive" }),
  });

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const script = app.youtubeScript as string | null;

  return (
    <div className="space-y-8">
      {/* YouTube Script */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><Youtube className="w-4 h-4 text-red-500" /></div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Viral Long-Form YouTube Script</h3>
            <p className="text-xs text-gray-400">AI writes a complete 4,000–5,000 word human-sounding script</p>
          </div>
        </div>

        {mp?.youtubeIdeas && mp.youtubeIdeas.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs font-medium text-gray-500 mb-2">Pick a video idea:</p>
            {mp.youtubeIdeas.map((idea: string, i: number) => (
              <button key={i} onClick={() => { setSelectedVideoIdea(idea); setCustomTitle(""); }}
                className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${selectedVideoIdea === idea && !customTitle ? "border-violet-300 bg-violet-50 text-violet-800" : "border-gray-200 bg-card text-gray-700 hover:border-gray-300 shadow-sm"}`}>
                <span className="font-bold text-violet-500 mr-2">{i + 1}.</span>{idea}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Or enter a custom title:</label>
          <input value={customTitle} onChange={(e) => { setCustomTitle(e.target.value); setSelectedVideoIdea(""); }}
            placeholder="e.g. I tried [product] for 30 days — here's what happened"
            className="w-full bg-card border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500 shadow-sm" />
        </div>

        <button onClick={() => scriptMutation.mutate()} disabled={scriptMutation.isPending || (!selectedVideoIdea && !customTitle)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 mb-4 shadow-sm">
          {scriptMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating script (~60s)…</> : <><FileText className="w-4 h-4" /> Generate Full Script</>}
        </button>

        {script && (
          <div className="bg-card border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> ~{Math.round(script.split(" ").length / 130)} min script</span>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(script); toast({ title: "Copied!" }); }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded bg-card border border-gray-200 hover:bg-gray-50">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(script)}`} download={`${app.deploySlug || "script"}.txt`}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded bg-card border border-gray-200 hover:bg-gray-50">
                  <Download className="w-3 h-3" /> .txt
                </a>
              </div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{script}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Voiceover */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0"><Mic className="w-4 h-4 text-violet-600" /></div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">AI Voiceover Generator</h3>
            <p className="text-xs text-gray-400">Generate real voiceover using the built-in Kokoro TTS engine</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Voice</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {VOICES.map((v) => (
                <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${selectedVoice === v.id ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200" : "border-gray-200 bg-card hover:border-gray-300 shadow-sm"}`}>
                  <p className="font-semibold text-sm text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Text to speak (max 3,000 chars)</label>
            <textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} rows={4} maxLength={3000}
              placeholder={`Leave blank to use your top hook:\n"${mp?.hooks?.[0] || app.tagline || app.name}"`}
              className="w-full bg-card border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500 resize-none shadow-sm" />
            <p className="text-xs text-gray-400 mt-1">{voiceText.length}/3000</p>
          </div>

          {mp?.hooks && mp.hooks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Quick-fill from your hooks:</p>
              <div className="flex flex-wrap gap-2">
                {mp.hooks.map((h: string, i: number) => (
                  <button key={i} onClick={() => setVoiceText(h)}
                    className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors max-w-[200px] truncate text-left">
                    Hook {i + 1}: {h.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => voiceoverMutation.mutate()} disabled={voiceoverMutation.isPending}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
              {voiceoverMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Mic className="w-4 h-4" /> Generate Voiceover</>}
            </button>
            {audioUrl && (
              <>
                <button onClick={togglePlay}
                  className="flex items-center gap-2 bg-card hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <a href={audioUrl} download="voiceover.wav"
                  className="flex items-center gap-2 bg-card hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  <Download className="w-4 h-4" /> WAV
                </a>
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subscribers Tab ──────────────────────────────────────────────────────────
function SubscribersTab({ subscribers, app }: any) {
  if (subscribers.length === 0) return (
    <div className="text-center py-12">
      <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-400">No subscribers yet</p>
      {app.status !== "live" && <p className="text-sm text-violet-500 mt-2">Publish your app to start getting subscribers</p>}
    </div>
  );

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {["Email", "Tier", "Billing", "Revenue", "Status", "Joined"].map(h => (
              <th key={h} className={`py-2.5 px-3 text-xs text-gray-500 font-semibold uppercase tracking-wide ${h === "Revenue" ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(subscribers as any[]).map((sub: any) => (
            <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-2.5 px-3 text-gray-800 font-medium text-xs sm:text-sm">{sub.subscriberEmail}</td>
              <td className="py-2.5 px-3"><span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-medium">{sub.tierName}</span></td>
              <td className="py-2.5 px-3 text-gray-500 text-xs capitalize">{sub.billingPeriod}</td>
              <td className="py-2.5 px-3 text-right font-semibold text-green-600 text-xs sm:text-sm">${parseFloat(sub.price ?? "0").toFixed(2)}</td>
              <td className="py-2.5 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{sub.status}</span></td>
              <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(sub.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────
function EditForm({ app, onUpdate, saving }: any) {
  const [name, setName] = useState(app.name || "");
  const [tagline, setTagline] = useState(app.tagline || "");
  const [brandColor, setBrandColor] = useState(app.brandColor || "#7c3aed");
  const [thankYou, setThankYou] = useState(app.thankYouMessage || "");

  return (
    <div className="space-y-5 max-w-lg">
      {[
        { label: "App Name", value: name, set: setName },
        { label: "Tagline", value: tagline, set: setTagline },
      ].map((f) => (
        <div key={f.label}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
          <input type="text" value={f.value} onChange={(e) => f.set(e.target.value)}
            className="w-full bg-card border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 shadow-sm" />
        </div>
      ))}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Color</label>
        <div className="flex items-center gap-3">
          <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-card shadow-sm" />
          <code className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{brandColor}</code>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thank You Message</label>
        <textarea value={thankYou} onChange={(e) => setThankYou(e.target.value)} rows={3}
          className="w-full bg-card border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 resize-none shadow-sm placeholder-gray-400"
          placeholder="Thanks for subscribing! Here's what to do next…" />
      </div>

      <button onClick={() => onUpdate({ name, tagline, brandColor, thankYouMessage: thankYou })} disabled={saving}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Changes
      </button>
    </div>
  );
}
