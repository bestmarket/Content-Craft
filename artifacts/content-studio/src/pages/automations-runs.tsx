import { useState, useEffect } from "react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, Clock, Play,
  ChevronDown, ChevronUp, Copy, Zap, BarChart2, TrendingUp,
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return (
    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
      <CheckCircle className="w-3 h-3" /> Success
    </Badge>
  );
  if (status === "failed") return (
    <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs">
      <XCircle className="w-3 h-3" /> Failed
    </Badge>
  );
  return (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 text-xs">
      <Loader2 className="w-3 h-3 animate-spin" /> Running
    </Badge>
  );
}

function RunCard({ run }: { run: any }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const stepOutputs: any[] = Array.isArray(run.stepOutputs) ? run.stepOutputs : [];
  const duration = run.duration ? `${(run.duration / 1000).toFixed(1)}s` : null;

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          {run.toolEmoji || "⚡"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{run.toolName || "Unknown Tool"}</p>
            <StatusBadge status={run.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(run.startedAt).toLocaleString()}
            </span>
            {duration && (
              <span className="text-xs text-muted-foreground">{duration}</span>
            )}
            {stepOutputs.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> {stepOutputs.length} step{stepOutputs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 p-4 space-y-4">
          {run.status === "failed" && run.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
              <p className="text-xs text-red-600">{run.error}</p>
            </div>
          )}

          {stepOutputs.length > 0 ? (
            <div className="space-y-3">
              {stepOutputs.map((step, i) => (
                <div key={i} className="bg-card rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-xs font-semibold text-foreground">{step.blockName}</p>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground gap-1"
                      onClick={() => copyOutput(step.output)}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                    {step.output}
                  </pre>
                </div>
              ))}
            </div>
          ) : run.finalOutput ? (
            <div className="bg-card rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">Output</p>
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground gap-1"
                  onClick={() => copyOutput(run.finalOutput)}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {run.finalOutput}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No output available.</p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function AutomationsRuns() {
  const { toast } = useToast();
  const { data: access } = useFeatureAccess();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    apiClient.get("/automations/runs").then((res) => {
      setRuns((res.data as any).runs || []);
    }).catch(() => {
      toast({ title: "Error loading runs", variant: "destructive" });
    }).finally(() => setLoading(false));
  }, []);

  const filtered = runs.filter((r) =>
    filter === "All" ? true : r.status === filter.toLowerCase()
  );

  const successCount = runs.filter((r) => r.status === "success").length;
  const failCount = runs.filter((r) => r.status === "failed").length;

  const isAdmin = access?.isAdmin ?? false;
  const canUse = isAdmin || (access?.features?.automations?.allowed !== false);

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <UpgradeBanner featureKey="automations" label="Automation Engine" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/automations">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs h-7 px-2">
                <ArrowLeft className="w-3 h-3" /> Back
              </Button>
            </Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Run History</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm ml-8">See every automation run — outputs, errors, and timing.</p>
        </div>
        <Link href="/automations">
          <Button className="gap-2 text-sm bg-gradient-to-r from-primary to-pink-500 text-white border-0">
            <Play className="w-4 h-4" /> Run a Tool
          </Button>
        </Link>
      </div>

      {/* Summary stats */}
      {runs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Runs", value: runs.length, color: "purple", icon: Play },
            { label: "Successful", value: successCount, color: "green", icon: CheckCircle },
            { label: "Failed", value: failCount, color: "red", icon: XCircle },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["All", "Success", "Failed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className={`text-xs ${filter === f ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f} {f !== "All" && `(${runs.filter(r => r.status === f.toLowerCase()).length})`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Loading run history...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No runs yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Run a tool from the Automation Engine to see results here.</p>
          </div>
          <Link href="/automations">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Zap className="w-4 h-4" /> Go to Automation Engine
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((run, i) => <RunCard key={run.id || i} run={run} />)}
        </div>
      )}
    </div>
  );
}
