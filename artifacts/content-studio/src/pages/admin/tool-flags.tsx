import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Power, PowerOff, RotateCcw, Save, Zap, Package,
  PenTool, BookOpen, FileText, Image, Film, Mic,
  Bot, Code2, Store, Gift, TrendingUp, Lightbulb,
  Globe, ShoppingBag, CheckCircle, XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const TOOL_ICONS: Record<string, any> = {
  product_generator:  Package,
  prompt_generator:   Lightbulb,
  content_generator:  PenTool,
  course_generator:   BookOpen,
  pdf_studio:         FileText,
  thumbnails:         Image,
  scripts:            Film,
  landing_page:       Globe,
  video_agent:        Film,
  voice:              Mic,
  video_modeler:      Film,
  automation:         Bot,
  dev_studio:         Code2,
  marketplace:        ShoppingBag,
  store:              Store,
  affiliate:          Gift,
  trending:           TrendingUp,
};

const CAT_COLORS: Record<string, string> = {
  Core:            "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
  "AI Tools":      "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
  "Video & Voice": "border-rose-400 bg-rose-50 dark:bg-rose-950/30",
  Automation:      "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
  Developer:       "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30",
  Store:           "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  Growth:          "border-green-400 bg-green-50 dark:bg-green-950/30",
};

export default function AdminToolFlagsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [localFlags, setLocalFlags] = useState<Record<string, boolean> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tool-flags"],
    queryFn: () => api.get("/tool-flags").then(r => r.data),
    onSuccess: (d: any) => { if (!localFlags) setLocalFlags(d.flags); },
  });

  const saveMutation = useMutation({
    mutationFn: (flags: Record<string, boolean>) =>
      api.put("/admin/tool-flags", { flags }).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Tool flags saved!", description: "Changes are live immediately." });
      qc.invalidateQueries({ queryKey: ["tool-flags"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post("/admin/tool-flags/reset").then(r => r.data),
    onSuccess: (d: any) => {
      setLocalFlags(d.flags);
      toast({ title: "Reset to launch defaults", description: "Only core 4 tools enabled." });
      qc.invalidateQueries({ queryKey: ["tool-flags"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tools: any[] = data?.tools ?? [];
  const flags = localFlags ?? data?.flags ?? {};

  const grouped = tools.reduce((acc: Record<string, any[]>, t: any) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = tools.length;

  function toggle(key: string) {
    setLocalFlags(prev => ({ ...(prev ?? flags), [key]: !(prev ?? flags)[key] }));
  }

  function enableAll() {
    const all = Object.fromEntries(tools.map(t => [t.key, true]));
    setLocalFlags(all);
  }

  function disableAll() {
    const none = Object.fromEntries(tools.map(t => [t.key, false]));
    // Always keep core 4 on
    none.product_generator = true;
    none.prompt_generator   = true;
    none.content_generator  = true;
    none.course_generator   = true;
    setLocalFlags(none);
  }

  const hasChanges = localFlags !== null && JSON.stringify(localFlags) !== JSON.stringify(data?.flags ?? {});

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-violet-500" /> Tool Manager
          </h1>
          <p className="text-slate-500 mt-1">
            Enable or disable tools site-wide. Disabled tools are hidden from the navigation and blocked for all users.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 font-semibold px-3 py-1">
            {enabledCount} / {totalCount} active
          </Badge>
          <Button size="sm" variant="outline" onClick={enableAll}>
            <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Enable All
          </Button>
          <Button size="sm" variant="outline" onClick={disableAll}>
            <XCircle className="h-3.5 w-3.5 mr-1 text-red-500" /> Launch Mode
          </Button>
          <Button size="sm" variant="outline" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Save bar */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-violet-600 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
          <p className="text-sm font-semibold">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-violet-700"
              onClick={() => setLocalFlags(data?.flags ?? {})}>
              Cancel
            </Button>
            <Button size="sm" className="bg-white text-violet-700 hover:bg-violet-50"
              onClick={() => saveMutation.mutate(localFlags!)} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Tool groups */}
      {Object.entries(grouped).map(([category, catTools]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${CAT_COLORS[category] ?? "bg-muted border-muted-foreground/30 text-muted-foreground"} text-slate-700 dark:text-slate-300`}>
              {category}
            </span>
            <span className="text-xs text-slate-400">
              {catTools.filter(t => flags[t.key]).length}/{catTools.length} active
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catTools.map((tool: any) => {
              const Icon = TOOL_ICONS[tool.key] ?? Zap;
              const enabled = flags[tool.key] ?? false;
              const isCore = ["product_generator","prompt_generator","content_generator","course_generator"].includes(tool.key);
              return (
                <Card
                  key={tool.key}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all border-2 ${
                    enabled
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 opacity-70"
                  }`}
                  onClick={() => toggle(tool.key)}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    enabled ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-slate-100 dark:bg-slate-800"
                  }`}>
                    <Icon className={`w-4 h-4 ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${enabled ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                        {tool.label}
                      </p>
                      {isCore && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-medium">
                          Core
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tool.description}</p>
                  </div>
                  <div className={`flex-shrink-0 w-11 h-6 rounded-full flex items-center transition-all ${
                    enabled ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-slate-600 justify-start"
                  } px-0.5`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Launch mode info */}
      <Card className="p-4 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Launch Mode</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
              Click <strong>Launch Mode</strong> to instantly switch to your 4 core tools only:
              Product Generator, Prompt Studio, Content Generator, and Course Generator.
              Perfect for a focused launch before expanding.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
