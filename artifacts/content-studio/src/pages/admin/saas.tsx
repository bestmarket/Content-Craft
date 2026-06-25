import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Rocket, Users, DollarSign, Globe, Loader2, Trash2,
  Eye, EyeOff, BarChart3, Zap, RefreshCw, ExternalLink,
} from "lucide-react";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  saas_tool: "⚡ SaaS Tool",
  coaching: "🎯 Coaching",
  daily_plan: "🔥 Daily Plan",
  course: "🎓 Course",
  community: "👥 Community",
  newsletter: "📩 Newsletter",
};

export default function AdminSaas() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: stats } = useQuery({
    queryKey: ["admin-saas-stats"],
    queryFn: () => apiClient("/admin/saas/stats").then(r => r.json()),
  });

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin-saas-apps"],
    queryFn: () => apiClient("/admin/saas/apps").then(r => r.json()),
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient(`/admin/saas/apps/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-saas-apps"] }); qc.invalidateQueries({ queryKey: ["admin-saas-stats"] }); toast({ title: "App deleted" }); },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, live }: { id: number; live: boolean }) =>
      apiClient(`/admin/saas/apps/${id}/${live ? "publish" : "unpublish"}`, { method: "POST" }).then(r => r.json()),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["admin-saas-apps"] }); qc.invalidateQueries({ queryKey: ["admin-saas-stats"] }); toast({ title: vars.live ? "Published!" : "Unpublished" }); },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const filtered = (apps as any[]).filter((a: any) => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.niche?.toLowerCase().includes(search.toLowerCase()) || a.creatorEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const STATUS_COLORS: Record<string, string> = {
    live: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    draft: "bg-slate-600/30 text-muted-foreground border-slate-600/50",
    generating: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">SaaS Builder — Admin</h1>
          <p className="text-muted-foreground text-sm">Manage all subscription businesses on the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { qc.invalidateQueries({ queryKey: ["admin-saas-apps"] }); qc.invalidateQueries({ queryKey: ["admin-saas-stats"] }); }} className="ml-auto gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Apps", value: stats?.totalApps ?? 0, icon: Zap, color: "bg-violet-100 text-violet-700" },
          { label: "Live Apps", value: stats?.liveApps ?? 0, icon: Globe, color: "bg-green-100 text-green-700" },
          { label: "Active Subscribers", value: stats?.totalSubscribers ?? 0, icon: Users, color: "bg-blue-100 text-blue-700" },
          { label: "Platform Revenue", value: `$${parseFloat(stats?.totalRevenue ?? "0").toFixed(2)}`, icon: DollarSign, color: "bg-emerald-100 text-emerald-700" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, niche, or creator email…"
          className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex gap-2">
          {["all", "live", "draft", "generating"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize border ${filterStatus === s ? "bg-violet-600 text-white border-violet-600" : "bg-card text-muted-foreground border hover:bg-muted/30"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border">
          <Rocket className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-muted-foreground">No apps found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {["App", "Type", "Creator", "Subscribers", "Revenue", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app: any) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {app.thumbnailUrl ? (
                          <img src={app.thumbnailUrl} alt="" className="w-10 h-7 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-7 rounded flex-shrink-0 flex items-center justify-center text-xs text-white font-bold"
                            style={{ background: app.brandColor || "#7c3aed" }}>
                            {app.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[140px]">{app.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{app.niche || app.tagline}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">{BUSINESS_TYPE_LABELS[app.businessType] || app.businessType || "—"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-foreground text-xs font-medium">{app.creatorName || "—"}</p>
                        <p className="text-muted-foreground text-xs">{app.creatorEmail || "—"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{app.subscriberCount ?? 0}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">${parseFloat(app.totalRevenue ?? "0").toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_COLORS[app.generationStatus === "generating" ? "generating" : app.status] || STATUS_COLORS.draft}`}>
                        {app.generationStatus === "generating" ? "Generating…" : app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {app.status === "live" ? (
                          <>
                            <a href={`/saas/${app.deploySlug}`} target="_blank" rel="noreferrer"
                              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground" title="View live page">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => publishMutation.mutate({ id: app.id, live: false })}
                              disabled={publishMutation.isPending}
                              className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 hover:text-amber-700" title="Unpublish">
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : app.generationStatus === "complete" ? (
                          <button onClick={() => publishMutation.mutate({ id: app.id, live: true })}
                            disabled={publishMutation.isPending}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700" title="Publish">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                        <button onClick={() => { if (confirm(`Delete "${app.name}"?`)) deleteMutation.mutate(app.id); }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-muted/30 border-t text-xs text-muted-foreground">
            Showing {filtered.length} of {(apps as any[]).length} apps
          </div>
        </div>
      )}
    </div>
  );
}
