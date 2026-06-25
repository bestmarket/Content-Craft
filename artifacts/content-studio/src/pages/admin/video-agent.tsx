import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Clapperboard, CheckCircle2, XCircle, Loader2,
  Film, Users, TrendingUp, Settings2, Save,
} from "lucide-react";

interface AdminJob {
  id: number; title: string; niche: string; platform: string;
  style: string; status: string; createdAt: string;
  userName?: string; userEmail?: string;
}
interface Stats { total: number; done: number; failed: number; generating: number; byPlatform: Record<string, number> }

const PLATFORM_LABELS: Record<string, string> = { tiktok: "📱 TikTok", youtube: "▶️ YouTube", instagram: "📷 Instagram", facebook: "👥 Facebook" };

function StatusBadge({ status }: { status: string }) {
  if (status === "done")       return <Badge className="bg-green-700 text-white text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Ready</Badge>;
  if (status === "failed")     return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
  if (status === "generating") return <Badge className="bg-violet-700 text-white text-xs gap-1 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" />Rendering</Badge>;
  return <Badge variant="outline" className="text-xs">Draft</Badge>;
}

export default function AdminVideoAgent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery<AdminJob[]>({
    queryKey: ["admin-video-agent-jobs"],
    queryFn: () => api("/admin/video-agent/jobs"),
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["admin-video-agent-stats"],
    queryFn: () => api("/admin/video-agent/stats"),
    refetchInterval: 30000,
  });

  const [enabled,    setEnabled]    = useState<boolean | null>(null);
  const [freeLimit,  setFreeLimit]  = useState("3");
  const [proLimit,   setProLimit]   = useState("20");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const saveMut = useMutation({
    mutationFn: () => api("/admin/video-agent/settings", {
      method: "PATCH",
      body: { enabled: enabled ?? true, freeLimit: parseInt(freeLimit), proLimit: parseInt(proLimit) },
    }),
    onSuccess: () => {
      toast({ title: "Settings saved" });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || (j.userEmail ?? "").toLowerCase().includes(q) || j.niche.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <Clapperboard className="w-7 h-7 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Video Agent</h1>
            <p className="text-muted-foreground text-sm">Manage AI video generation — settings, usage, and job history.</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Videos",  value: stats.total,      icon: Film },
              { label: "Completed",     value: stats.done,       icon: CheckCircle2 },
              { label: "Rendering Now", value: stats.generating, icon: Loader2 },
              { label: "Failed",        value: stats.failed,     icon: XCircle },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="bg-slate-900 border-slate-700 p-4 text-center">
                <Icon className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </Card>
            ))}
          </div>
        )}

        {/* Settings Card */}
        <Card className="bg-slate-900 border-slate-700 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-5 h-5 text-violet-400" />
            <h2 className="font-semibold text-white">Video Agent Settings</h2>
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground/60 text-sm w-40">Global Status</Label>
            <div className="flex gap-2">
              <button onClick={() => setEnabled(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                  ${enabled === true || enabled === null ? "border-green-500 bg-green-950/40 text-green-400" : "border-slate-600 text-muted-foreground"}`}>
                ✅ Enabled
              </button>
              <button onClick={() => setEnabled(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                  ${enabled === false ? "border-red-500 bg-red-950/40 text-red-400" : "border-slate-600 text-muted-foreground"}`}>
                🚫 Disabled
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground/60 text-sm mb-1.5 block">Free tier — videos/month</Label>
              <Input type="number" min={0} max={100} value={freeLimit}
                onChange={e => setFreeLimit(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white w-32" />
            </div>
            <div>
              <Label className="text-muted-foreground/60 text-sm mb-1.5 block">Pro tier — videos/month</Label>
              <Input type="number" min={0} max={10000} value={proLimit}
                onChange={e => setProLimit(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white w-32" />
              <p className="text-xs text-muted-foreground mt-1">Set 9999 for unlimited</p>
            </div>
          </div>

          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
            className="gap-2 bg-violet-600 hover:bg-violet-700">
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {settingsSaved ? "Saved!" : "Save Settings"}
          </Button>
        </Card>

        {/* Platform breakdown */}
        {stats?.byPlatform && Object.keys(stats.byPlatform).length > 0 && (
          <Card className="bg-slate-900 border-slate-700 p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" /> By Platform
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byPlatform).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                  <span className="text-sm">{PLATFORM_LABELS[platform] || platform}</span>
                  <Badge className="bg-violet-700 text-white text-xs">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Jobs table */}
        <Card className="bg-slate-900 border-slate-700 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-violet-400" /> All Video Jobs ({jobs.length})
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Input placeholder="Search title / email / niche…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white w-48 text-sm" />
              <div className="flex gap-1">
                {["all", "done", "generating", "failed"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all
                      ${filterStatus === s ? "bg-violet-600 text-white" : "border border-slate-600 text-muted-foreground hover:border-slate-400"}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs match the current filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Platform</th>
                    <th className="pb-2 pr-4">Style</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(job => (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-white max-w-[200px] truncate">{job.title}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        <div className="text-xs">{job.userName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{job.userEmail || ""}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground/60 text-xs">{PLATFORM_LABELS[job.platform] || job.platform}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground text-xs capitalize">{job.style.replace(/_/g, " ")}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={job.status} /></td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
