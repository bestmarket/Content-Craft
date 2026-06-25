import { useState, useEffect } from "react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Plus, Play, ShoppingBag, BarChart2, TrendingUp, Clock,
  CheckCircle, XCircle, Loader2, Sparkles, BookOpen, ArrowRight,
  Rocket, Star, Users, DollarSign, ChevronRight, Settings, Bell, BellOff,
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";

const CATEGORY_COLORS: Record<string, string> = {
  content: "bg-primary/10 text-primary",
  business: "bg-blue-100 text-blue-700",
  research: "bg-green-100 text-green-700",
  productivity: "bg-amber-100 text-amber-700",
};

const QUICK_START_STEPS = [
  { icon: "🧱", title: "Pick your blocks", desc: "Choose from 25+ pre-built AI blocks in the builder" },
  { icon: "⚙️", title: "Configure each step", desc: "Set inputs for each block — topic, tone, platform and more" },
  { icon: "▶️", title: "Run & see results", desc: "Hit Run and watch your automation produce results instantly" },
  { icon: "🚀", title: "Publish & earn", desc: "List your tool in the marketplace and earn from every install" },
];

export default function Automations() {
  const { toast } = useToast();
  const { data: access } = useFeatureAccess();
  const [tools, setTools] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [schedulingId, setSchedulingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get("/automations/tools"),
      apiClient.get("/automations/stats"),
      apiClient.get("/automations/runs"),
    ]).then(([t, s, r]) => {
      setTools((t.data as any).tools || []);
      setStats((s.data as any));
      setRecentRuns(((r.data as any).runs || []).slice(0, 5));
    }).catch(() => {
      toast({ title: "Error loading automations", variant: "destructive" });
    }).finally(() => setLoading(false));
  }, []);

  const handleToggleSchedule = async (tool: any) => {
    setSchedulingId(tool.id);
    const newVal = !tool.isScheduled;
    try {
      await apiClient.post(`/automations/tools/${tool.id}/schedule`, {
        isScheduled: newVal,
        scheduleFrequency: tool.scheduleFrequency || "daily",
      });
      setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isScheduled: newVal } : t));
      toast({ title: newVal ? `⏰ Scheduled to run ${tool.scheduleFrequency || "daily"}` : "Schedule removed" });
    } catch (err: any) {
      toast({ title: "Failed to update schedule", variant: "destructive" });
    } finally {
      setSchedulingId(null);
    }
  };

  const handleQuickRun = async (tool: any) => {
    setRunningId(tool.id);
    try {
      const res = await apiClient.post(`/automations/tools/${tool.id}/run`, { inputs: {} });
      const run = (res.data as any).run;
      toast({ title: `✅ "${tool.name}" completed!`, description: "Check run history for full output." });
      setRecentRuns((prev) => [{ ...run, toolName: tool.name, toolEmoji: tool.emoji }, ...prev.slice(0, 4)]);
    } catch (err: any) {
      toast({ title: "Run failed", description: err.message, variant: "destructive" });
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading your automation engine...</p>
        </div>
      </div>
    );
  }

  const isAdmin = access?.isAdmin ?? false;
  const canUseAutomations = isAdmin || (access?.features?.automations?.allowed !== false);

  if (!canUseAutomations) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <UpgradeBanner featureKey="automations" label="Automation Engine" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Automation Engine</h1>
            <Badge className="bg-gradient-to-r from-primary to-pink-500 text-white border-0 text-xs">BETA</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Build AI-powered tools. Run them on demand. Sell them in the marketplace.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/automations/marketplace">
            <Button variant="outline" className="gap-2 text-sm">
              <ShoppingBag className="w-4 h-4" /> Marketplace
            </Button>
          </Link>
          <Link href="/automations/builder">
            <Button className="gap-2 text-sm bg-gradient-to-r from-primary to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0">
              <Plus className="w-4 h-4" /> Build New Tool
            </Button>
          </Link>
        </div>
      </div>

      {/* Template Generators Banner */}
      <Link href="/automations/generators">
        <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 rounded-2xl p-5 flex items-center justify-between gap-4 hover:opacity-95 transition-opacity cursor-pointer shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-bold text-base">✨ Template Generator Suite</span>
                <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-xs">Pro</Badge>
              </div>
              <p className="text-violet-200 text-sm">Generate AI agents, n8n workflows, Replit apps &amp; Chrome extensions — sell instantly on the marketplace</p>
              <div className="flex items-center gap-3 mt-1.5">
                {["🤖 AI Agents", "⚡ n8n Workflows", "💻 Replit Templates", "🧩 Chrome Extensions"].map(l => (
                  <span key={l} className="text-xs text-violet-300">{l}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-xl px-4 py-2 flex-shrink-0">
            <span className="text-sm font-semibold text-white">Open</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </Link>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "My Tools", value: stats.totalTools, icon: Zap, color: "purple" },
            { label: "Total Runs", value: stats.totalRuns, icon: Play, color: "blue" },
            { label: "Marketplace Sales", value: stats.totalInstalls, icon: Users, color: "green" },
            { label: "Earnings", value: `$${stats.totalRevenue}`, icon: DollarSign, color: "amber" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${s.color}-100`}>
                  <s.icon className={`w-4 h-4 text-${s.color}-600`} />
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

      {tools.length === 0 ? (
        /* Empty state — onboarding */
        <div className="space-y-6">
          {/* Hero banner */}
          <div className="bg-gradient-to-br from-primary via-purple-700 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-6 h-6 text-yellow-300" />
                <span className="text-yellow-300 font-semibold text-sm">Welcome to the Automation Engine</span>
              </div>
              <h2 className="text-3xl font-bold mb-3">Build tools. Run them. <br />Sell them for passive income.</h2>
              <p className="text-blue-200 text-sm mb-6 max-w-lg">
                Chain together 25+ AI blocks to create powerful automation tools. Run them with one click,
                then publish them to the marketplace so others can buy and use them — while you earn.
              </p>
              <Link href="/automations/builder">
                <Button className="bg-card text-primary hover:bg-primary/5 font-semibold gap-2">
                  <Sparkles className="w-4 h-4" /> Create Your First Tool
                </Button>
              </Link>
            </div>
          </div>

          {/* How it works */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-4">How it works — 4 steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_START_STEPS.map((step, i) => (
                <Card key={i} className="p-4 border-2 border hover:border-primary/30 transition-colors">
                  <div className="text-2xl mb-3">{step.icon}</div>
                  <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mb-2">{i + 1}</div>
                  <p className="font-semibold text-foreground text-sm mb-1">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Block preview */}
          <Card className="p-6 bg-muted/30 border-dashed border-2">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">25+ AI Blocks Available</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Viral Hook Generator", "AI Caption Writer", "Hashtag Generator", "Blog Post Writer",
                "Email Subject Lines", "Trending Topics Finder", "Ad Copy Generator", "Content Rewriter",
                "Sales Email Writer", "FAQ Generator", "Content Calendar", "Story Script", "SEO Titles", "Lead Magnet"].map((b) => (
                <Badge key={b} variant="outline" className="text-xs text-muted-foreground bg-card">{b}</Badge>
              ))}
              <Badge className="text-xs bg-primary/10 text-primary border-primary/30">+ 11 more</Badge>
            </div>
          </Card>
        </div>
      ) : (
        /* Tools list */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Tools */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">My Tools ({tools.length})</h2>
              <Link href="/automations/runs">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" /> Run History
                </Button>
              </Link>
            </div>
            {tools.map((tool) => (
              <Card key={tool.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {tool.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">{tool.name}</p>
                        {tool.isPublished && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1 px-1.5">
                            <Star className="w-2.5 h-2.5" /> Live
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tool.description || "No description"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Play className="w-3 h-3" /> {tool.runCount} runs
                        </span>
                        {tool.isPublished && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {tool.installCount} installs
                          </span>
                        )}
                        {Array.isArray(tool.steps) && (
                          <span className="text-xs text-muted-foreground">{tool.steps.length} steps</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline" size="sm"
                      className={`text-xs h-8 px-2 gap-1 ${tool.isScheduled ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" : "text-muted-foreground"}`}
                      onClick={() => handleToggleSchedule(tool)}
                      disabled={schedulingId === tool.id}
                      title={tool.isScheduled ? `Scheduled: ${tool.scheduleFrequency || "daily"}` : "Enable auto-schedule"}
                    >
                      {schedulingId === tool.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : tool.isScheduled ? (
                        <Bell className="w-3 h-3" />
                      ) : (
                        <BellOff className="w-3 h-3" />
                      )}
                    </Button>
                    <Link href={`/automations/builder?edit=${tool.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8 px-2">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="text-xs h-8 px-3 bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handleQuickRun(tool)}
                      disabled={runningId === tool.id || !Array.isArray(tool.steps) || tool.steps.length === 0}
                    >
                      {runningId === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Link href="/automations/builder">
              <Card className="p-4 border-2 border-dashed border-primary/30 hover:border-purple-400 transition-colors cursor-pointer group">
                <div className="flex items-center justify-center gap-2 text-primary group-hover:text-primary">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Build another tool</span>
                </div>
              </Card>
            </Link>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Recent Runs */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">Recent Runs</h3>
                <Link href="/automations/runs">
                  <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-6 px-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              {recentRuns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No runs yet. Hit ▶ on a tool to start.</p>
              ) : (
                <div className="space-y-2">
                  {recentRuns.map((run, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                      <span className="text-base">{run.toolEmoji || "⚡"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{run.toolName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(run.startedAt).toLocaleTimeString()}</p>
                      </div>
                      {run.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : run.status === "failed" ? (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* CTA to marketplace */}
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Sell in the Marketplace</span>
              </div>
              <p className="text-xs text-amber-700 mb-3">Publish any tool and earn every time someone installs it.</p>
              <Link href="/automations/marketplace">
                <Button size="sm" className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1">
                  <ShoppingBag className="w-3 h-3" /> Browse Marketplace <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </Card>

            {/* Tips */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Pro Tips
              </h3>
              <ul className="space-y-2">
                {[
                  "Chain 3–5 blocks for the most powerful tools",
                  "Use 'Trending Topics' as the first block for research",
                  "Price tools at $5–$25 for fastest marketplace sales",
                  "Add a clear description to get more installs",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{tip}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
