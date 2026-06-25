import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Globe, Users, DollarSign, Loader2, Eye, Trash2,
  Rocket, Zap, BarChart3, Sparkles,
} from "lucide-react";

const BUSINESS_TYPE_META: Record<string, { icon: string; label: string; bg: string; badge: string }> = {
  saas_tool: { icon: "⚡", label: "SaaS Tool", bg: "from-violet-500 to-indigo-600", badge: "bg-violet-100 text-violet-700" },
  coaching: { icon: "🎯", label: "Coaching", bg: "from-blue-500 to-cyan-600", badge: "bg-blue-100 text-blue-700" },
  daily_plan: { icon: "🔥", label: "Daily Plan", bg: "from-orange-500 to-red-600", badge: "bg-orange-100 text-orange-700" },
  course: { icon: "🎓", label: "Course", bg: "from-green-500 to-emerald-600", badge: "bg-green-100 text-green-700" },
  community: { icon: "👥", label: "Community", bg: "from-pink-500 to-rose-600", badge: "bg-pink-100 text-pink-700" },
  newsletter: { icon: "📩", label: "Newsletter", bg: "from-amber-500 to-yellow-600", badge: "bg-amber-100 text-amber-700" },
};

export default function SaasBuilder() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["saas-apps"],
    queryFn: () => api.get("/saas/apps").then(r => r.data),
    refetchInterval: ({ state }: any) =>
      Array.isArray(state?.data) && state.data.some((a: any) => a.generationStatus === "generating") ? 3000 : false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/saas/apps/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["saas-apps"] }); toast({ title: "Deleted" }); },
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => api.post(`/saas/apps/${id}/publish`, {}).then(r => r.data),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["saas-apps"] }); toast({ title: "🚀 Published!", description: `/saas/${(data as any).slug}` }); },
  });

  const stats = {
    total: (apps as any[]).length,
    live: (apps as any[]).filter((a: any) => a.status === "live").length,
    subs: (apps as any[]).reduce((s: number, a: any) => s + (a.subscriberCount ?? 0), 0),
    revenue: (apps as any[]).reduce((s: number, a: any) => s + parseFloat(a.totalRevenue ?? "0"), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Subscription Builder</h1>
            </div>
            <p className="text-gray-500 text-sm ml-11">Build any subscription business with AI — SaaS tools, coaching, courses, communities &amp; more</p>
          </div>
          <Link href="/saas-builder/new">
            <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm w-full sm:w-auto justify-center shadow-sm">
              <Plus className="w-4 h-4" /> Create New
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Apps", value: stats.total, icon: Zap, color: "bg-violet-100 text-violet-700" },
            { label: "Live Apps", value: stats.live, icon: Globe, color: "bg-green-100 text-green-700" },
            { label: "Subscribers", value: stats.subs, icon: Users, color: "bg-blue-100 text-blue-700" },
            { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "bg-emerald-100 text-emerald-700" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-gray-900 text-lg leading-none mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* App Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
        ) : (apps as any[]).length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {(apps as any[]).map((app: any) => {
              const meta = BUSINESS_TYPE_META[app.businessType || "saas_tool"] || BUSINESS_TYPE_META.saas_tool;
              const isGenerating = app.generationStatus === "generating";
              return (
                <div key={app.id} className="bg-card border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all group">
                  {/* Card top */}
                  <div className={`h-28 bg-gradient-to-br ${meta.bg} relative flex items-center justify-center`}>
                    {app.thumbnailUrl ? (
                      <img src={app.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : null}
                    <span className="text-5xl relative z-10 drop-shadow-lg">{meta.icon}</span>
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        app.status === "live" ? "bg-green-500 text-white"
                        : isGenerating ? "bg-amber-400 text-white"
                        : "bg-white/80 text-gray-600"
                      }`}>
                        {isGenerating ? "⏳ Building…" : app.status === "live" ? "🟢 Live" : "Draft"}
                      </span>
                    </div>
                    <span className={`absolute bottom-2 left-3 z-10 text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge} bg-white/90`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">{app.name || "Generating…"}</h3>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{app.tagline || app.niche || "Building your subscription business…"}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.subscriberCount ?? 0}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${parseFloat(app.totalRevenue ?? "0").toFixed(2)}</span>
                      {isGenerating && <span className="flex items-center gap-1 text-amber-500"><Loader2 className="w-3 h-3 animate-spin" /> Building</span>}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Link href={`/saas-builder/${app.id}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                          <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                        </button>
                      </Link>
                      {app.generationStatus === "complete" && app.status !== "live" && (
                        <button onClick={() => publishMutation.mutate(app.id)} disabled={publishMutation.isPending}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-semibold transition-colors">
                          <Rocket className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {app.status === "live" && (
                        <a href={`/saas/${app.deploySlug}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-semibold transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => { if (confirm(`Delete "${app.name}"?`)) deleteMutation.mutate(app.id); }}
                        className="flex items-center gap-1 bg-gray-100 hover:bg-red-50 text-red-500 py-2 px-3 rounded-lg text-xs font-semibold transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create card */}
            <Link href="/saas-builder/new">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-12 px-6 hover:border-violet-400 hover:bg-violet-50 transition-all cursor-pointer group min-h-[200px]">
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-violet-500" />
                </div>
                <p className="text-gray-500 group-hover:text-violet-600 font-medium text-sm text-center transition-colors">Create new subscription business</p>
                <p className="text-gray-400 text-xs mt-1 text-center">6 business types · AI-powered</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 sm:py-20">
      <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Rocket className="w-8 h-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No subscription businesses yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">Create your first AI-powered subscription business in under 90 seconds.</p>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {["⚡ SaaS Tool", "🎯 Coaching", "🔥 Daily Plan", "🎓 Course", "👥 Community", "📩 Newsletter"].map(t => (
          <span key={t} className="text-xs bg-card text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">{t}</span>
        ))}
      </div>
      <Link href="/saas-builder/new">
        <button className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm">
          <Sparkles className="w-4 h-4" /> Build Your First Subscription
        </button>
      </Link>
    </div>
  );
}
