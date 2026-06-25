import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Plus, Trash2, Play, Loader2, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Search, Zap, Sparkles, Globe, DollarSign,
  Save, Rocket, Copy, Settings, ArrowDown, BookOpen, Info,
  TrendingUp, Star, ShoppingBag, X, RefreshCw, Eye, Clock, Bell,
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";

const ICON_MAP: Record<string, any> = {
  Zap, Sparkles, Globe, TrendingUp, Star, BookOpen, Settings, Play,
  Search, Copy, Plus, RefreshCw, Eye, Info, DollarSign, ShoppingBag,
};

const COLOR_MAP: Record<string, string> = {
  purple: "from-primary to-primary",
  pink: "from-pink-500 to-pink-600",
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  indigo: "from-indigo-500 to-indigo-600",
  orange: "from-orange-500 to-orange-600",
  rose: "from-rose-500 to-rose-600",
  cyan: "from-cyan-500 to-cyan-600",
  sky: "from-sky-500 to-sky-600",
  amber: "from-amber-500 to-amber-600",
  teal: "from-teal-500 to-teal-600",
  lime: "from-lime-500 to-lime-600",
  yellow: "from-yellow-500 to-yellow-600",
  violet: "from-violet-500 to-violet-600",
  red: "from-red-500 to-red-600",
  fuchsia: "from-fuchsia-500 to-fuchsia-600",
  emerald: "from-emerald-500 to-emerald-600",
  slate: "from-slate-500 to-slate-600",
};

type Step = { id: string; blockId: number; blockName: string; blockColor: string; blockIcon: string; config: Record<string, string>; outputLabel: string };
type Block = { id: number; name: string; description: string; category: string; icon: string; color: string; inputs: any[]; outputLabel: string; aiPrompt: string };

function guid() { return Math.random().toString(36).slice(2, 9); }

function BlockCard({ block, onAdd }: { block: Block; onAdd: (b: Block) => void }) {
  const gradient = COLOR_MAP[block.color] || "from-primary to-primary";
  return (
    <div
      className="group p-3 rounded-lg border border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onAdd(block)}
    >
      <div className="flex items-start gap-2">
        <div className={`w-7 h-7 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight">{block.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2">{block.description}</p>
        </div>
        <Plus className="w-4 h-4 text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

function StepCard({
  step, index, total, block, onRemove, onMoveUp, onMoveDown, onConfigChange, stepOutput, isRunning,
}: {
  step: Step; index: number; total: number; block: Block | undefined;
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
  onConfigChange: (key: string, val: string) => void;
  stepOutput: string | null; isRunning: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const gradient = COLOR_MAP[step.blockColor] || "from-primary to-primary";
  const inputs: any[] = block?.inputs || [];

  return (
    <div className="relative">
      {/* Connector line above (not for first) */}
      {index > 0 && (
        <div className="flex justify-center mb-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-0.5 h-4 bg-gradient-to-b from-purple-300 to-purple-400" />
            <ArrowDown className="w-3.5 h-3.5 text-primary/80" />
          </div>
        </div>
      )}

      <Card className={`border-2 transition-all ${isRunning ? "border-purple-400 shadow-md shadow-purple-100" : "border hover:border-primary/30"}`}>
        {/* Step header */}
        <div
          className="flex items-center gap-3 p-3 cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{step.blockName}</p>
            {collapsed && <p className="text-xs text-muted-foreground">Click to configure</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isRunning && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            {stepOutput && !isRunning && <CheckCircle className="w-4 h-4 text-green-500" />}
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded text-muted-foreground hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground ml-1" />}
          </div>
        </div>

        {/* Config fields */}
        {!collapsed && (
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {inputs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">This block needs no configuration.</p>
            ) : (
              inputs.map((inp: any) => (
                <div key={inp.name} className="space-y-1">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1">
                    {inp.label}
                    {inp.required && <span className="text-red-400 text-xs">*</span>}
                  </Label>
                  {inp.type === "select" ? (
                    <select
                      value={step.config[inp.name] || ""}
                      onChange={(e) => onConfigChange(inp.name, e.target.value)}
                      className="w-full text-xs border border rounded-md px-2 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                      <option value="">Select {inp.label}...</option>
                      {(inp.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : inp.type === "textarea" ? (
                    <Textarea
                      value={step.config[inp.name] || ""}
                      onChange={(e) => onConfigChange(inp.name, e.target.value)}
                      placeholder={inp.placeholder}
                      className="text-xs min-h-[70px] resize-none"
                    />
                  ) : (
                    <Input
                      value={step.config[inp.name] || ""}
                      onChange={(e) => onConfigChange(inp.name, e.target.value)}
                      placeholder={inp.placeholder}
                      className="text-xs h-8"
                    />
                  )}
                  {inp.name === "topic" && index > 0 && (
                    <p className="text-xs text-primary italic flex items-center gap-1">
                      <Info className="w-3 h-3" /> Leave blank to use output from previous step
                    </p>
                  )}
                </div>
              ))
            )}

            {/* Output preview */}
            {stepOutput && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {step.outputLabel} — Output
                </p>
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto">
                  {stepOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AutomationsBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: access } = useFeatureAccess();
  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get("edit") ? parseInt(searchParams.get("edit")!) : null;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Block[]>>({});
  const [steps, setSteps] = useState<Step[]>([]);
  const [toolName, setToolName] = useState("My AI Tool");
  const [toolDesc, setToolDesc] = useState("");
  const [toolEmoji, setToolEmoji] = useState("⚡");
  const [toolCategory, setToolCategory] = useState("content");
  const [blockSearch, setBlockSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [stepOutputs, setStepOutputs] = useState<Record<string, string>>({});
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [pubDesc, setPubDesc] = useState("");
  const [pubTags, setPubTags] = useState("");
  const [pubPrice, setPubPrice] = useState("0");
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toolId, setToolId] = useState<number | null>(editId);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    apiClient.get("/automations/blocks").then((res) => {
      const data = res.data as any;
      setBlocks(data.blocks || []);
      setGrouped(data.grouped || {});
    }).catch(() => toast({ title: "Error loading blocks", variant: "destructive" }));

    if (editId) {
      apiClient.get("/automations/tools").then((res) => {
        const tool = ((res.data as any).tools || []).find((t: any) => t.id === editId);
        if (tool) {
          setToolName(tool.name); setToolDesc(tool.description);
          setToolEmoji(tool.emoji); setToolCategory(tool.category || "content");
          setSteps(Array.isArray(tool.steps) ? tool.steps : []);
          setPubTitle(tool.marketplaceTitle || ""); setPubDesc(tool.marketplaceDescription || "");
          setPubPrice(tool.price || "0");
          setPubTags(Array.isArray(tool.marketplaceTags) ? tool.marketplaceTags.join(", ") : "");
          setIsScheduled(tool.isScheduled || false);
          setScheduleFrequency(tool.scheduleFrequency || "daily");
        }
      }).finally(() => setLoadingEdit(false));
    }
  }, []);

  const addBlock = (block: Block) => {
    const step: Step = {
      id: guid(), blockId: block.id, blockName: block.name,
      blockColor: block.color, blockIcon: block.icon, config: {}, outputLabel: block.outputLabel,
    };
    setSteps((prev) => [...prev, step]);
    setFinalOutput(null); setStepOutputs({});
    toast({ title: `"${block.name}" added`, description: "Configure it in the workflow canvas." });
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setStepOutputs((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const moveStep = (id: string, dir: "up" | "down") => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (dir === "up" && idx === 0) return prev;
      if (dir === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const updateConfig = (stepId: string, key: string, val: string) => {
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, config: { ...s.config, [key]: val } } : s));
  };

  const saveSchedule = async (id: number, scheduled: boolean, freq: string) => {
    setSavingSchedule(true);
    try {
      const res = await apiClient.post(`/automations/tools/${id}/schedule`, { isScheduled: scheduled, scheduleFrequency: freq });
      toast({ title: (res.data as any).message || "Schedule saved!" });
    } catch (err: any) {
      toast({ title: "Schedule save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingSchedule(false);
    }
  };

  const saveTool = async (): Promise<number | null> => {
    if (!toolName.trim()) { toast({ title: "Please enter a tool name", variant: "destructive" }); return null; }
    if (steps.length === 0) { toast({ title: "Add at least one block to your tool", variant: "destructive" }); return null; }
    setSaving(true);
    try {
      let res;
      const payload = { name: toolName, description: toolDesc, category: toolCategory, emoji: toolEmoji, steps };
      if (toolId) {
        res = await apiClient.put(`/automations/tools/${toolId}`, payload);
      } else {
        res = await apiClient.post("/automations/tools", payload);
        setToolId((res.data as any).tool.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: "✅ Tool saved!" });
      return (res.data as any).tool.id;
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runTool = async () => {
    const id = await saveTool();
    if (!id) return;
    setRunning(true); setStepOutputs({}); setFinalOutput(null);
    try {
      const res = await apiClient.post(`/automations/tools/${id}/run`, { inputs: {} });
      const run = (res.data as any).run;
      const outputs: Record<string, string> = {};
      const stepOuts: any[] = Array.isArray(run.stepOutputs) ? run.stepOutputs : [];
      steps.forEach((s, i) => { if (stepOuts[i]) outputs[s.id] = stepOuts[i].output; });
      setStepOutputs(outputs);
      setFinalOutput(run.finalOutput || "");
      toast({ title: "🎉 Run complete!", description: `${stepOuts.length} step${stepOuts.length !== 1 ? "s" : ""} executed successfully.` });
    } catch (err: any) {
      toast({ title: "Run failed", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false); setRunningStep(null);
    }
  };

  const publishTool = async () => {
    if (!pubTitle || !pubDesc) { toast({ title: "Please fill in title and description", variant: "destructive" }); return; }
    const id = await saveTool();
    if (!id) return;
    setPublishing(true);
    try {
      await apiClient.post(`/automations/tools/${id}/publish`, {
        marketplaceTitle: pubTitle, marketplaceDescription: pubDesc,
        marketplaceTags: pubTags.split(",").map((t) => t.trim()).filter(Boolean),
        price: pubPrice,
      });
      toast({ title: "🚀 Tool is live in the marketplace!", description: "Buyers can now find and install it." });
      setShowPublish(false);
      navigate("/automations/marketplace");
    } catch (err: any) {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    const matchSearch = !blockSearch || b.name.toLowerCase().includes(blockSearch.toLowerCase()) || b.description.toLowerCase().includes(blockSearch.toLowerCase());
    const matchCat = activeCategory === "All" || b.category === activeCategory;
    return matchSearch && matchCat;
  });

  const categories = ["All", ...Object.keys(grouped)];

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading tool...</p>
        </div>
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/automations">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs h-7 px-2">
              <ArrowLeft className="w-3 h-3" /> Back
            </Button>
          </Link>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <button
            onClick={() => { const e = document.getElementById("emoji-input"); e?.focus(); }}
            className="text-xl hover:scale-110 transition-transform"
          >{toolEmoji}</button>
          <input
            id="emoji-input"
            type="text"
            value={toolEmoji}
            onChange={(e) => setToolEmoji(e.target.value.slice(-2) || "⚡")}
            className="w-8 opacity-0 absolute"
          />
          <input
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className="font-bold text-lg text-foreground bg-transparent border-0 border-b-2 border-transparent focus:border-purple-400 focus:outline-none w-48 md:w-64 truncate"
            placeholder="Tool name..."
          />
          {saved && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={saveTool} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-green-500 hover:bg-green-600 text-white" onClick={runTool} disabled={running || steps.length === 0}>
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Running..." : "Test Run"}
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-gradient-to-r from-primary to-pink-500 text-white border-0 hover:from-purple-700 hover:to-pink-600"
            onClick={() => setShowPublish(true)} disabled={steps.length === 0}>
            <Rocket className="w-3.5 h-3.5" /> Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
        {/* ── Left: Block Library ── */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-card rounded-xl border shadow-sm sticky top-4">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Block Library</h2>
                <Badge variant="outline" className="text-xs ml-auto">{blocks.length} blocks</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={blockSearch}
                  onChange={(e) => setBlockSearch(e.target.value)}
                  placeholder="Search blocks..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-muted/30"
                />
              </div>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1 mt-2">
                {categories.slice(0, 5).map((c) => (
                  <button key={c} onClick={() => setActiveCategory(c)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${activeCategory === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredBlocks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No blocks found.</p>
              ) : (
                filteredBlocks.map((block) => (
                  <BlockCard key={block.id} block={block} onAdd={addBlock} />
                ))
              )}
            </div>
            <div className="p-3 border-t bg-primary/5 rounded-b-xl">
              <p className="text-xs text-primary flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Click a block to add it to your workflow. Each block's output feeds into the next step.
              </p>
            </div>
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="lg:col-span-5 xl:col-span-6">
          <div className="bg-muted/30 rounded-xl border-2 border-dashed border min-h-[500px] p-4 relative">
            {/* Canvas header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Workflow Canvas</h2>
                {steps.length > 0 && (
                  <Badge variant="outline" className="text-xs">{steps.length} step{steps.length !== 1 ? "s" : ""}</Badge>
                )}
              </div>
              {running && (
                <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running automation...
                </div>
              )}
            </div>

            {steps.length === 0 ? (
              /* Empty canvas */
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-primary/80" />
                </div>
                <h3 className="font-semibold text-muted-foreground mb-2">Your canvas is empty</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Click any block from the library on the left to add it here. Chain blocks together to build a powerful automation.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {[
                    { emoji: "💡", title: "Research first", desc: "Start with Trending Topics or Pain Points" },
                    { emoji: "✍️", title: "Generate content", desc: "Add a Caption, Hook, or Blog Writer" },
                    { emoji: "📋", title: "Format it", desc: "Add Hashtags or Repurpose at the end" },
                    { emoji: "🚀", title: "Publish & earn", desc: "Hit Publish to sell in the marketplace" },
                  ].map((tip) => (
                    <div key={tip.title} className="bg-card rounded-lg p-3 border text-left">
                      <div className="text-base mb-1">{tip.emoji}</div>
                      <p className="text-xs font-medium text-foreground">{tip.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Steps */
              <div className="space-y-0 pb-4">
                {steps.map((step, i) => {
                  const block = blocks.find((b) => b.id === step.blockId);
                  return (
                    <StepCard key={step.id} step={step} index={i} total={steps.length} block={block}
                      onRemove={() => removeStep(step.id)}
                      onMoveUp={() => moveStep(step.id, "up")}
                      onMoveDown={() => moveStep(step.id, "down")}
                      onConfigChange={(k, v) => updateConfig(step.id, k, v)}
                      stepOutput={stepOutputs[step.id] || null}
                      isRunning={running && runningStep === i}
                    />
                  );
                })}

                {/* Final output */}
                {finalOutput && (
                  <div className="mt-4">
                    <div className="flex justify-center mb-1">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-0.5 h-4 bg-gradient-to-b from-purple-400 to-green-400" />
                        <ArrowDown className="w-3.5 h-3.5 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-bold text-green-800">Final Output — Ready!</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-green-700"
                          onClick={() => { navigator.clipboard.writeText(finalOutput); toast({ title: "Copied!" }); }}>
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                        {finalOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Tool Settings ── */}
        <div className="lg:col-span-3 xl:col-span-3">
          <div className="bg-card rounded-xl border shadow-sm sticky top-4">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground text-sm">Tool Settings</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Tool Description</Label>
                <Textarea
                  value={toolDesc}
                  onChange={(e) => setToolDesc(e.target.value)}
                  placeholder="What does this tool do? (shown in marketplace)"
                  className="text-xs min-h-[70px] resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Category</Label>
                <select
                  value={toolCategory}
                  onChange={(e) => setToolCategory(e.target.value)}
                  className="w-full text-xs border border rounded-md px-2 py-1.5 bg-card focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="content">Content AI</option>
                  <option value="business">Business</option>
                  <option value="research">Research</option>
                  <option value="productivity">Productivity</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Emoji Icon</Label>
                <div className="flex gap-2">
                  {["⚡", "🚀", "🎯", "🔥", "💡", "✨", "🛠️", "📈", "🤖", "🎨"].map((e) => (
                    <button key={e} onClick={() => setToolEmoji(e)}
                      className={`text-base p-1 rounded-lg transition-all ${toolEmoji === e ? "bg-primary/10 ring-2 ring-purple-400 scale-110" : "hover:bg-muted"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduling */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">Auto-Schedule</span>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !isScheduled;
                        setIsScheduled(newVal);
                        if (toolId) await saveSchedule(toolId, newVal, scheduleFrequency);
                        else toast({ title: "Save your tool first, then enable scheduling." });
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isScheduled ? "bg-amber-500" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition-transform ${isScheduled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">Runs automatically on a timer — no clicking needed</p>
                </div>
                {isScheduled && (
                  <div className="p-3 space-y-2 bg-card">
                    <Label className="text-xs font-medium text-foreground">Run Frequency</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: "every_hour", label: "Every Hour" },
                        { value: "every_6_hours", label: "Every 6 Hrs" },
                        { value: "twice_daily", label: "Twice Daily" },
                        { value: "daily", label: "Daily" },
                        { value: "weekdays", label: "Weekdays" },
                        { value: "weekly", label: "Weekly" },
                      ].map((opt) => (
                        <button key={opt.value}
                          onClick={async () => {
                            setScheduleFrequency(opt.value);
                            if (toolId) await saveSchedule(toolId, true, opt.value);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-lg border font-medium transition-all ${scheduleFrequency === opt.value ? "bg-amber-500 text-white border-amber-500" : "border text-muted-foreground hover:border-amber-300"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-start gap-1.5 bg-green-50 rounded p-2 mt-1">
                      <Bell className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-700">
                        Outputs saved automatically to Run History every time it executes.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guide */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Builder Guide
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Add blocks from the library — each one does a specific AI task",
                    "Configure inputs on each block (topic, tone, platform, etc.)",
                    "Outputs from one block flow automatically to the next",
                    "Click 'Test Run' to see real results instantly",
                    "Hit 'Publish' to sell your tool in the marketplace",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <div className="w-4 h-4 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-xs text-blue-700">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                <Button onClick={saveTool} disabled={saving} variant="outline" className="w-full text-xs gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Tool
                </Button>
                <Button onClick={runTool} disabled={running || steps.length === 0}
                  className="w-full text-xs gap-1.5 bg-green-500 hover:bg-green-600 text-white">
                  {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {running ? "Running..." : "Test Run"}
                </Button>
                <Button onClick={() => setShowPublish(true)} disabled={steps.length === 0}
                  className="w-full text-xs gap-1.5 bg-gradient-to-r from-primary to-pink-500 text-white border-0 hover:from-purple-700 hover:to-pink-600">
                  <Rocket className="w-3.5 h-3.5" /> Publish to Marketplace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Publish Modal ── */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-primary to-pink-500 rounded-t-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-5 h-5" />
                    <h2 className="text-lg font-bold">Publish to Marketplace</h2>
                  </div>
                  <p className="text-blue-200 text-sm">List your tool so others can buy and use it</p>
                </div>
                <button onClick={() => setShowPublish(false)} className="p-1 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Checklist */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-2">Before publishing, make sure:</p>
                <ul className="space-y-1">
                  {[
                    { done: steps.length > 0, text: `Tool has ${steps.length} step(s)` },
                    { done: !!toolName, text: "Tool has a name" },
                    { done: !!toolDesc, text: "Tool has a description" },
                  ].map((c, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs ${c.done ? "text-green-700" : "text-muted-foreground"}`}>
                      {c.done ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground/60" />}
                      {c.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Marketplace Title *</Label>
                <Input value={pubTitle} onChange={(e) => setPubTitle(e.target.value)}
                  placeholder="e.g. Viral Content Pipeline for Coaches" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Marketplace Description *</Label>
                <Textarea value={pubDesc} onChange={(e) => setPubDesc(e.target.value)}
                  placeholder="Describe what buyers get, what problems it solves, and what results they can expect..."
                  className="text-sm min-h-[80px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Tags (comma separated)</Label>
                <Input value={pubTags} onChange={(e) => setPubTags(e.target.value)}
                  placeholder="e.g. content, instagram, viral, AI" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Price (USD)</Label>
                <div className="flex gap-2">
                  {["0", "5", "9", "15", "25", "49"].map((p) => (
                    <button key={p} onClick={() => setPubPrice(p)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${pubPrice === p ? "bg-primary text-white border-purple-600" : "border text-muted-foreground hover:border-primary/40"}`}>
                      {p === "0" ? "Free" : `$${p}`}
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input type="number" value={pubPrice} onChange={(e) => setPubPrice(e.target.value)}
                      className="pl-6 text-sm h-8" placeholder="Custom" />
                  </div>
                </div>
                {parseFloat(pubPrice) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    You earn <span className="font-semibold text-green-600">${(parseFloat(pubPrice) * 0.8).toFixed(2)}</span> per install (80% — 20% platform fee)
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPublish(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-white border-0 hover:from-purple-700 hover:to-pink-600 gap-2"
                onClick={publishTool} disabled={publishing}>
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {publishing ? "Publishing..." : "Publish Now 🚀"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
