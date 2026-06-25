import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Bot, ShoppingBag, Play, Clock, CheckCircle, XCircle,
  Loader2, TrendingUp, DollarSign, Users, AlertTriangle,
  Ban, RotateCcw, Trash2, RefreshCw, Bell,
} from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <Card className="p-5 border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminAutomations() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockingId, setBlockingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"tools" | "runs">("tools");

  const load = async () => {
    setLoading(true);
    try {
      const [ov, tl, rl] = await Promise.all([
        apiClient.get("/admin/automations/overview"),
        apiClient.get("/admin/automations/tools"),
        apiClient.get("/admin/automations/runs"),
      ]);
      setOverview((ov.data as any));
      setTools((tl.data as any).tools || []);
      setRuns((rl.data as any).runs || []);
    } catch {
      toast({ title: "Failed to load admin automations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleBlock = async (tool: any) => {
    setBlockingId(tool.id);
    const willBlock = tool.isPublished;
    try {
      const res = await apiClient.post(`/admin/automations/tools/${tool.id}/block`, { blocked: willBlock });
      setTools(prev => prev.map(t => t.id === tool.id
        ? { ...t, isPublished: !willBlock }
        : t
      ));
      toast({ title: (res.data as any).message });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setBlockingId(null);
    }
  };

  const handleDelete = async (tool: any) => {
    if (!confirm(`Delete "${tool.name}" and all its runs? This cannot be undone.`)) return;
    setDeletingId(tool.id);
    try {
      await apiClient.delete(`/admin/automations/tools/${tool.id}`);
      setTools(prev => prev.filter(t => t.id !== tool.id));
      toast({ title: `"${tool.name}" deleted` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const successRate = overview?.runs > 0
    ? Math.round((overview.successRuns / overview.runs) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" /> Automation Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor all tools, runs, and marketplace revenue across users</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tools" value={overview?.tools ?? 0}
          sub={`${overview?.published ?? 0} in marketplace`}
          icon={Bot} color="text-primary" />
        <StatCard label="Total Runs" value={overview?.runs ?? 0}
          sub={`${successRate}% success rate`}
          icon={Play} color="text-green-600" />
        <StatCard label="Installs" value={overview?.installs ?? 0}
          sub="across all marketplace tools"
          icon={Users} color="text-blue-600" />
        <StatCard label="Revenue" value={`$${(overview?.totalRevenue ?? 0).toFixed(2)}`}
          sub="total marketplace earnings"
          icon={DollarSign} color="text-amber-600" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 border">
          <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{overview?.successRuns ?? 0}</p>
            <p className="text-xs text-muted-foreground">Successful runs</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 border">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{overview?.failedRuns ?? 0}</p>
            <p className="text-xs text-muted-foreground">Failed runs</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 border">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{overview?.scheduled ?? 0}</p>
            <p className="text-xs text-muted-foreground">Scheduled tools</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["tools", "runs"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-purple-600 text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t === "tools" ? `All Tools (${tools.length})` : `Recent Runs (${runs.length})`}
          </button>
        ))}
      </div>

      {/* Tools Table */}
      {tab === "tools" && (
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tool</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Creator</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Runs</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Installs</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Schedule</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tools.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No tools created yet
                    </td>
                  </tr>
                )}
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{tool.emoji || "⚡"}</span>
                        <div>
                          <p className="font-medium text-foreground leading-tight">{tool.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{tool.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{tool.creatorName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{tool.creatorEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-foreground">{tool.runCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-foreground">{tool.installCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tool.isPublished ? (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          <ShoppingBag className="w-3 h-3 mr-1" /> Listed
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-0 text-xs">
                          Private
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tool.isScheduled ? (
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          {tool.scheduleFrequency?.replace(/_/g, " ") || "daily"}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm"
                          className={`h-7 px-2 text-xs gap-1 ${!tool.isPublished ? "text-green-600 border-green-200 hover:bg-green-50" : "text-orange-600 border-orange-200 hover:bg-orange-50"}`}
                          onClick={() => handleBlock(tool)}
                          disabled={blockingId === tool.id}
                        >
                          {blockingId === tool.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : tool.isPublished ? (
                            <><Ban className="w-3 h-3" /> Block</>
                          ) : (
                            <><RotateCcw className="w-3 h-3" /> Restore</>
                          )}
                        </Button>
                        <Button variant="outline" size="sm"
                          className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(tool)}
                          disabled={deletingId === tool.id}
                        >
                          {deletingId === tool.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Runs Table */}
      {tab === "runs" && (
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tool</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No runs yet
                    </td>
                  </tr>
                )}
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{run.toolEmoji || "⚡"}</span>
                        <span className="font-medium text-foreground">{run.toolName || `Tool #${run.toolId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{run.userName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{run.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {run.status === "success" ? (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Success
                        </Badge>
                      ) : run.status === "failed" ? (
                        <Badge className="bg-red-100 text-red-600 border-0 text-xs">
                          <XCircle className="w-3 h-3 mr-1" /> Failed
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-600 border-0 text-xs">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {timeAgo(run.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Error details for failed runs */}
      {tab === "runs" && runs.filter(r => r.status === "failed" && r.error).length > 0 && (
        <Card className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Recent Errors
          </p>
          <div className="space-y-2">
            {runs.filter(r => r.status === "failed" && r.error).slice(0, 5).map(run => (
              <div key={run.id} className="bg-card rounded-lg px-3 py-2 border border-red-100">
                <p className="text-xs font-medium text-foreground">{run.toolEmoji} {run.toolName}</p>
                <p className="text-xs text-red-600 font-mono mt-0.5 break-all">{run.error}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
