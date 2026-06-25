import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package, TrendingUp, DollarSign, CheckCircle, XCircle,
  Star, Trash2, Loader2, Globe, Search, Eye,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  ai_agent: "🤖 AI Agent",
  n8n_workflow: "⚡ n8n Workflow",
  replit_template: "💻 Replit Template",
  chrome_extension: "🧩 Chrome Extension",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  store_only: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    apiClient.get("/admin/templates")
      .then(r => {
        const d = r.data as any;
        setTemplates(d.templates ?? []);
        setStats(d.stats);
      })
      .catch(() => toast({ title: "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (id: number, endpoint: string, label: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(`/admin/templates/${id}/${endpoint}`, {});
      toast({ title: `✅ ${label}` });
      load();
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this template permanently?")) return;
    setProcessingId(id);
    try {
      await apiClient.delete(`/admin/templates/${id}`);
      toast({ title: "Deleted" });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = templates.filter(t =>
    !search ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.userName?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Template Marketplace</h1>
        <p className="text-muted-foreground text-sm">Manage all generated templates — approve, feature, or remove.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Templates", value: stats.total, icon: Package, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Published", value: stats.published, icon: Globe, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pending Review", value: stats.pending, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Revenue", value: `$${parseFloat(stats.totalRevenue ?? "0").toFixed(2)}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, creator, or type..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Template</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Creator</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Sales</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Score</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground line-clamp-1 max-w-xs">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{TYPE_LABELS[t.type] ?? t.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.userName}</p>
                        <p className="text-xs text-muted-foreground">{t.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ${parseFloat(t.price ?? "0").toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[t.publishStatus ?? "draft"]}`}>
                        {t.publishStatus ?? "draft"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground">{t.totalSales ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${(t.sellabilityScore ?? 0) >= 80 ? "text-green-600" : "text-amber-600"}`}>
                        {t.sellabilityScore ?? 0}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        {t.publishStatus === "pending_approval" && (
                          <>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => act(t.id, "approve", "Approved")}
                              disabled={processingId === t.id}
                            >
                              {processingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => act(t.id, "reject", "Rejected")}
                              disabled={processingId === t.id}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm" variant="outline"
                          className={`h-7 text-xs ${t.isFeatured ? "text-amber-700 border-amber-300 bg-amber-50" : "text-muted-foreground"}`}
                          onClick={() => act(t.id, "feature", t.isFeatured ? "Unfeatured" : "Featured")}
                          disabled={processingId === t.id}
                          title={t.isFeatured ? "Unfeature" : "Feature"}
                        >
                          <Star className={`w-3 h-3 ${t.isFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
                        </Button>
                        {!t.isPublishedToMarketplace && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-blue-700 border-blue-300"
                            onClick={() => act(t.id, "toggle-marketplace", "Published to marketplace")}
                            disabled={processingId === t.id}
                            title="Force publish to marketplace"
                          >
                            <Globe className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => remove(t.id)}
                          disabled={processingId === t.id}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No templates found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
