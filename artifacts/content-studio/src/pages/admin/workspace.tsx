import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Code2, Server, Trash2, Users, FileCode, Zap } from "lucide-react";

export default function AdminWorkspace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hostingEnabled, setHostingEnabled] = useState(false);
  const [workspaceEnabled, setWorkspaceEnabled] = useState(true);
  const [hostingMessage, setHostingMessage] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["admin-workspace-stats"],
    queryFn: () => apiClient("/admin/workspace/stats").then(r => r.json()),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["admin-workspace-projects"],
    queryFn: () => apiClient("/admin/workspace/projects").then(r => r.json()),
  });

  useQuery({
    queryKey: ["admin-workspace-settings"],
    queryFn: async () => {
      const r = await apiClient("/admin/workspace/settings");
      const d = await r.json();
      if (!settingsLoaded) {
        setHostingEnabled(d.settings?.workspace_hosting_enabled === "true");
        setWorkspaceEnabled(d.settings?.workspace_enabled !== "false");
        setHostingMessage(d.settings?.workspace_hosting_message ?? "");
        setSettingsLoaded(true);
      }
      return d;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/admin/workspace/settings", { method: "PUT", body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: ["admin-workspace-settings"] });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/admin/workspace/projects/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workspace-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-workspace-stats"] });
      toast({ title: "Project deleted" });
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    ready: "bg-emerald-500/20 text-emerald-400",
    generating: "bg-yellow-500/20 text-yellow-400",
    error: "bg-red-500/20 text-red-400",
    draft: "bg-slate-500/20 text-muted-foreground",
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Dev Studio — Admin</h1>
          <p className="text-muted-foreground text-sm">Manage workspace settings, hosting, and projects</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: stats?.total ?? "—", icon: Code2 },
          { label: "Ready", value: stats?.ready ?? "—", icon: Zap },
          { label: "Total Files", value: stats?.totalFiles ?? "—", icon: FileCode },
          { label: "Published", value: stats?.published ?? "—", icon: Users },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Settings Panel */}
      <div className="bg-card rounded-xl border border p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-violet-500" /> Feature Controls
        </h2>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="font-medium text-foreground">Enable AI Dev Studio</Label>
              <p className="text-xs text-muted-foreground mt-0.5">When off, users cannot access the workspace</p>
            </div>
            <Switch
              checked={workspaceEnabled}
              onCheckedChange={setWorkspaceEnabled}
            />
          </div>

          <div className="border-t border pt-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Label className="font-medium text-foreground">Enable Hosting</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allow users to deploy projects. When off, only download is available.</p>
              </div>
              <Switch
                checked={hostingEnabled}
                onCheckedChange={setHostingEnabled}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Hosting Disabled Message</Label>
              <Input
                value={hostingMessage}
                onChange={e => setHostingMessage(e.target.value)}
                placeholder="Hosting coming soon — download your project for now"
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate({ hostingEnabled, workspaceEnabled, hostingMessage })}
            disabled={saveMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-card rounded-xl border border p-6">
        <h2 className="font-semibold text-foreground mb-4">All Projects</h2>
        {projectsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border">
                  <th className="text-left py-2 pr-4">Project</th>
                  <th className="text-left py-2 pr-4">User</th>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Generations</th>
                  <th className="text-left py-2">Created</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(projects?.projects ?? []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-3 pr-4 font-medium text-foreground max-w-[180px] truncate">{p.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{p.userEmail ?? "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground capitalize text-xs">{p.projectType}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">{p.generationCount ?? 0}</td>
                    <td className="py-3 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pl-2">
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(projects?.projects ?? []).length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No projects yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
