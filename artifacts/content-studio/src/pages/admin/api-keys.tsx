import { useState } from "react";
import { getListApiKeysQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Key, AlertCircle, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, Cpu, CheckCircle2, XCircle, Loader2, FlaskConical, FileText, Zap, MessageSquare, Video, ClipboardList, RefreshCw, Activity } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";

const PROVIDERS = [
  {
    value: "groq",
    label: "Groq (Free Tier ✓)",
    placeholder: "gsk_...",
    badge: "FREE",
    badgeColor: "bg-green-100 text-green-700",
    info: "Llama 3.3 70B — ultra-fast, free tier available at console.groq.com",
  },
  {
    value: "gemini",
    label: "Google Gemini (AI Studio)",
    placeholder: "AIzaSy... or AQ...",
    badge: "PRIMARY",
    badgeColor: "bg-primary/10 text-primary",
    info: "Primary AI provider. Supports AIzaSy... and new AQ... key formats. Get free keys at aistudio.google.com/app/apikey",
  },
  {
    value: "openai",
    label: "OpenAI (GPT-4o + DALL-E)",
    placeholder: "sk-proj-...",
    info: "GPT-4o for text, DALL-E 3 for thumbnails",
  },
  {
    value: "claude",
    label: "Claude (Anthropic)",
    placeholder: "sk-ant-api03-...",
    info: "Claude Opus — best for long-form creative writing",
  },
  {
    value: "stabilityai",
    label: "Stability AI",
    placeholder: "sk-...",
    info: "Stable Diffusion — alternative image generation",
  },
  {
    value: "unsplash",
    label: "Unsplash (Stock Images)",
    placeholder: "your_unsplash_access_key",
    badge: "FREE",
    badgeColor: "bg-green-100 text-green-700",
    info: "Free stock photos for product covers and landing pages — get key at unsplash.com/developers",
  },
  {
    value: "pexels",
    label: "Pexels (Stock Photos & Videos)",
    placeholder: "your_pexels_api_key",
    badge: "FREE",
    badgeColor: "bg-blue-100 text-blue-700",
    info: "Free high-res photos and videos — get key at pexels.com/api",
  },
  {
    value: "pixabay",
    label: "Pixabay (Stock Images & Videos)",
    placeholder: "your_pixabay_api_key",
    badge: "FREE",
    badgeColor: "bg-yellow-100 text-yellow-700",
    info: "Free stock images, illustrations, and videos — get key at pixabay.com/api/docs",
  },
];

const GEMINI_MODELS = [
  {
    value: "gemini-2.5-flash-preview-05-20",
    label: "Gemini 2.5 Flash Preview",
    badge: "LATEST",
    badgeColor: "bg-primary/10 text-primary",
    description: "Best balance of speed and quality. Recommended for all content types.",
  },
  {
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    badge: "FAST",
    badgeColor: "bg-blue-100 text-blue-700",
    description: "Ultra-fast responses with high quality output. Great for scripts and short content.",
  },
  {
    value: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    badge: "POWERFUL",
    badgeColor: "bg-indigo-100 text-indigo-700",
    description: "Highest capability model. Best for complex PDFs and long-form content.",
  },
  {
    value: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    badge: "STABLE",
    badgeColor: "bg-green-100 text-green-700",
    description: "Proven stable model with consistent output. Good fallback option.",
  },
  {
    value: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash Lite",
    badge: "LITE",
    badgeColor: "bg-muted text-muted-foreground",
    description: "Lightweight and fast. Best for quick generations with lower token usage.",
  },
  {
    value: "gemini-1.5-flash-latest",
    label: "Gemini 1.5 Flash",
    badge: "LEGACY",
    badgeColor: "bg-amber-100 text-amber-700",
    description: "Previous generation. Reliable fallback if newer models are unavailable.",
  },
];

export default function AdminApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ provider: "gemini", key: "", label: "", purpose: "" });
  const [bulk, setBulk] = useState({ provider: "gemini", text: "" });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; error?: string } | "loading">>({});

  const { data: keys = [] } = useQuery({
    queryKey: getListApiKeysQueryKey(),
    queryFn: async () => {
      const res = await apiClient.get("/api-keys");
      return res.data;
    },
  });

  const { data: rotationStatus, refetch: refetchRotation, isFetching: rotationFetching } = useQuery({
    queryKey: ["rotation-status"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/api-keys/rotation-status");
      return res.data as Record<string, { total: number; active: number; currentIndex: number; nextKey: string | null; nextLabel: string | null }>;
    },
    refetchInterval: 15000,
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await apiClient.get("/settings");
      return res.data;
    },
  });

  const currentGeminiModel = (settings as any[]).find((s: any) => s.key === "gemini_model")?.value
    ?? "gemini-2.5-flash-preview-05-20";

  const getFeatureModel = (feature: string) =>
    (settings as any[]).find((s: any) => s.key === `gemini_model_${feature}`)?.value ?? "default";

  const saveModelSetting = useMutation({
    mutationFn: async (model: string) => {
      const res = await apiClient.patch("/settings", { updates: [{ key: "gemini_model", value: model }] });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Global Gemini model updated" });
    },
    onError: () => toast({ title: "Failed to update model", variant: "destructive" }),
  });

  const saveFeatureModel = useMutation({
    mutationFn: async ({ feature, model }: { feature: string; model: string }) => {
      const res = await apiClient.patch("/settings", { updates: [{ key: `gemini_model_${feature}`, value: model }] });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: `${vars.feature} model updated` });
    },
    onError: () => toast({ title: "Failed to update model", variant: "destructive" }),
  });

  const addKey = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post("/api-keys", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
      setShowAdd(false);
      setForm({ provider: "gemini", key: "", label: "", purpose: "" });
      toast({ title: "API key added" });
    },
    onError: () => toast({ title: "Failed to add key", variant: "destructive" }),
  });

  const toggleKey = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiClient.patch(`/api-keys/${id}/toggle`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/api-keys/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
      toast({ title: "API key deleted" });
    },
  });

  const bulkImport = useMutation({
    mutationFn: async (data: { provider: string; keys: string[] }) => {
      const res = await apiClient.post("/api-keys/bulk", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
      setShowBulk(false);
      setBulk({ provider: "gemini", text: "" });
      toast({
        title: `${data.added} key${data.added !== 1 ? "s" : ""} imported`,
        description: data.skipped > 0 ? `${data.skipped} duplicate${data.skipped !== 1 ? "s" : ""} skipped` : undefined,
      });
    },
    onError: () => toast({ title: "Bulk import failed", variant: "destructive" }),
  });

  const handleTestKey = async (id: number) => {
    setTestResults(prev => ({ ...prev, [id]: "loading" }));
    try {
      const res = await apiClient.post(`/api-keys/${id}/test`, {});
      setTestResults(prev => ({ ...prev, [id]: res.data }));
    } catch {
      setTestResults(prev => ({ ...prev, [id]: { ok: false, error: "Request failed" } }));
    }
  };

  const handleBulkImport = () => {
    const keys = bulk.text.split("\n").map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
      toast({ title: "Paste at least one key", variant: "destructive" });
      return;
    }
    bulkImport.mutate({ provider: bulk.provider, keys });
  };

  const handleSave = () => {
    if (!form.key.trim()) {
      toast({ title: "Enter an API key", variant: "destructive" });
      return;
    }
    addKey.mutate({ provider: form.provider, key: form.key, label: form.label || null, purpose: form.purpose || null });
  };

  const grouped = (keys as any[]).reduce((acc: Record<string, any[]>, key: any) => {
    if (!acc[key.provider]) acc[key.provider] = [];
    acc[key.provider].push(key);
    return acc;
  }, {});

  const toggleCollapse = (provider: string) => {
    setCollapsed(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground text-sm">Add multiple keys per provider — the system rotates them automatically</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowBulk(!showBulk); setShowAdd(false); }}>
            <ClipboardList className="w-4 h-4 mr-1" /> Bulk Import
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowBulk(false); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Key
          </Button>
        </div>
      </div>

      {/* Live Rotation Status */}
      {rotationStatus && Object.keys(rotationStatus).length > 0 && (
        <Card className="p-5 border border-green-200 bg-green-50/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-foreground">Live Rotation Status</h2>
              <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">AUTO-REFRESHES</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetchRotation()}
              disabled={rotationFetching}
              className="h-7 px-2 text-xs text-green-700 hover:bg-green-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${rotationFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(rotationStatus).map(([provider, info]) => {
              const providerMeta = PROVIDERS.find(p => p.value === provider);
              const healthPct = info.total > 0 ? Math.round((info.active / info.total) * 100) : 0;
              const isHealthy = info.active > 0;
              return (
                <div key={provider} className="flex items-center justify-between bg-card border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isHealthy ? "bg-green-500" : "bg-red-400"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{providerMeta?.label ?? provider}</p>
                      <p className="text-xs text-muted-foreground">
                        {info.active} of {info.total} key{info.total !== 1 ? "s" : ""} active
                        {info.active > 1 && " · round-robin rotating"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {info.active > 1 && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-foreground">Next up: #{info.currentIndex} of {info.active}</p>
                        <p className="text-xs text-muted-foreground font-mono">{info.nextKey ?? "—"}{info.nextLabel ? ` · ${info.nextLabel}` : ""}</p>
                      </div>
                    )}
                    {info.active === 1 && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-foreground">Single key</p>
                        <p className="text-xs text-muted-foreground font-mono">{info.nextKey ?? "—"}</p>
                      </div>
                    )}
                    <Badge className={`text-xs ${isHealthy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {isHealthy ? `${healthPct}% healthy` : "No active keys"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Rotation position resets when the server restarts. Refreshes every 15 seconds.</p>
        </Card>
      )}

      {/* Gemini Model Selector */}
      <Card className="p-5 border border-primary/30 bg-primary/5/40">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Gemini Model</h2>
          <Badge className="bg-primary/10 text-primary text-xs">PRIMARY PROVIDER</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Global default — used by all features unless overridden below.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {GEMINI_MODELS.map((model) => {
            const isSelected = currentGeminiModel === model.value;
            return (
              <button
                key={model.value}
                onClick={() => saveModelSetting.mutate(model.value)}
                disabled={saveModelSetting.isPending}
                className={`w-full px-4 py-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-purple-500 bg-card shadow-sm"
                    : "border bg-card hover:border-primary/40 hover:bg-primary/5/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {model.label}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">{model.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Per-Feature Model Overrides */}
      <Card className="p-5 border border">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Per-Feature Model Overrides</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Assign a specific Gemini model to each feature. "Use Global Default" means it follows the setting above.
        </p>
        <div className="space-y-4">
          {[
            { feature: "pdf", label: "PDF Generator", icon: <FileText className="w-4 h-4 text-orange-500" />, hint: "Longer, richer output — consider 2.5 Pro" },
            { feature: "scripts", label: "Scripts", icon: <Video className="w-4 h-4 text-blue-500" />, hint: "Fast generations — 2.5 Flash works great" },
            { feature: "content", label: "Viral Content & Landing Pages", icon: <Zap className="w-4 h-4 text-yellow-500" />, hint: "Balanced quality and speed" },
            { feature: "chat", label: "Chat / Support Bot", icon: <MessageSquare className="w-4 h-4 text-green-500" />, hint: "Fastest response — 2.5 Flash Lite is ideal" },
          ].map(({ feature, label, icon, hint }) => {
            const currentValue = getFeatureModel(feature);
            const effectiveModel = currentValue === "default"
              ? GEMINI_MODELS.find(m => m.value === currentGeminiModel)?.label ?? currentGeminiModel
              : GEMINI_MODELS.find(m => m.value === currentValue)?.label ?? currentValue;
            return (
              <div key={feature} className="border border rounded-lg p-4 bg-muted/30/50">
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{hint}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Currently using: <span className="font-medium text-muted-foreground">{effectiveModel}{currentValue === "default" ? " (global)" : ""}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => saveFeatureModel.mutate({ feature, model: "default" })}
                    disabled={saveFeatureModel.isPending}
                    className={`px-3 py-2 rounded-md border text-xs text-left transition-all ${
                      currentValue === "default"
                        ? "border-slate-400 bg-card text-foreground font-semibold shadow-sm"
                        : "border bg-card text-muted-foreground hover:border"
                    }`}
                  >
                    {currentValue === "default" && <CheckCircle2 className="w-3 h-3 inline mr-1 text-muted-foreground" />}
                    Use Global Default
                  </button>
                  {GEMINI_MODELS.map((model) => {
                    const isSel = currentValue === model.value;
                    return (
                      <button
                        key={model.value}
                        onClick={() => saveFeatureModel.mutate({ feature, model: model.value })}
                        disabled={saveFeatureModel.isPending}
                        className={`px-3 py-2 rounded-md border text-xs text-left transition-all ${
                          isSel
                            ? "border-purple-500 bg-primary/5 text-primary font-semibold shadow-sm"
                            : "border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5/30"
                        }`}
                      >
                        {isSel && <CheckCircle2 className="w-3 h-3 inline mr-1 text-primary" />}
                        {model.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 border border-primary/30 bg-primary/5 flex gap-3">
        <div className="text-xl flex-shrink-0">✨</div>
        <div>
          <p className="text-sm font-semibold text-primary">Gemini is your primary AI — set it up first</p>
          <p className="text-xs text-primary mt-0.5">
            Get a free Gemini API key at{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-primary">
              aistudio.google.com/app/apikey →
            </a>
            {" "}Supports both <strong>AIzaSy...</strong> and new <strong>AQ...</strong> key formats.
          </p>
        </div>
      </Card>

      <Card className="p-4 border border-green-200 bg-green-50 flex gap-3">
        <div className="text-xl flex-shrink-0">⚡</div>
        <div>
          <p className="text-sm font-semibold text-green-800">Add Groq as a fallback (free)</p>
          <p className="text-xs text-green-700 mt-0.5">
            Groq runs <strong>Llama 3.3 70B</strong> for free — used when Gemini is unavailable.{" "}
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-green-900">
              Get your free key at console.groq.com →
            </a>
          </p>
        </div>
      </Card>

      <Card className="p-4 border border-blue-200 bg-blue-50 flex gap-2">
        <Key className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          <strong>Round-robin rotation:</strong> When you add multiple keys for the same provider, the system distributes requests evenly across all active keys — preventing rate limits from blocking generation.
        </p>
      </Card>

      <Card className="p-4 border border-amber-200 bg-amber-50 flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">API keys are stored in the database. For production, use environment variables. Keys are masked when displayed.</p>
      </Card>

      {showBulk && (
        <Card className="p-5 border border-blue-200 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-foreground">Bulk Import Keys</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Paste one key per line — duplicates are skipped automatically. All keys go to the same provider.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Provider</Label>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.filter(p => ["gemini","groq","openai","claude"].includes(p.value)).map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setBulk(b => ({ ...b, provider: p.value }))}
                    className={`px-3 py-1.5 text-xs border rounded-lg font-medium transition-all ${
                      bulk.provider === p.value
                        ? "border-blue-500 bg-blue-100 text-blue-700"
                        : "border text-muted-foreground hover:border-blue-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">
                Keys — one per line
                {bulk.text.trim() && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    {bulk.text.split("\n").map(k => k.trim()).filter(Boolean).length} detected
                  </span>
                )}
              </Label>
              <textarea
                value={bulk.text}
                onChange={(e) => setBulk(b => ({ ...b, text: e.target.value }))}
                placeholder={`${PROVIDERS.find(p => p.value === bulk.provider)?.placeholder ?? "AIzaSy..."}\n${PROVIDERS.find(p => p.value === bulk.provider)?.placeholder ?? "AIzaSy..."}\n...`}
                rows={6}
                className="w-full border border rounded-lg px-3 py-2 text-sm font-mono bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkImport}
                size="sm"
                disabled={bulkImport.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {bulkImport.isPending ? "Importing..." : `Import ${bulk.text.split("\n").map(k => k.trim()).filter(Boolean).length || ""} Keys`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowBulk(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {showAdd && (
        <Card className="p-5 border border-primary/30 bg-primary/5/30">
          <h3 className="font-semibold text-foreground mb-4">Add API Key</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Provider</Label>
              <div className="grid grid-cols-1 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setForm({ ...form, provider: p.value })}
                    className={`px-3 py-2.5 text-sm border rounded-lg text-left transition-all ${
                      form.provider === p.value
                        ? "border-purple-500 bg-primary/5 text-primary"
                        : "border text-muted-foreground hover:border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.label}</span>
                      {(p as any).badge && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${(p as any).badgeColor}`}>{(p as any).badge}</span>
                      )}
                      {grouped[p.value]?.length > 0 && (
                        <span className="text-xs text-primary font-medium">({grouped[p.value].length} key{grouped[p.value].length > 1 ? "s" : ""} saved)</span>
                      )}
                    </div>
                    {(p as any).info && <p className="text-xs text-muted-foreground mt-0.5">{(p as any).info}</p>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Label (optional)</Label>
              <Input
                placeholder="e.g. Key #2, Personal, Production..."
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">API Key</Label>
              <Input
                type="password"
                placeholder={PROVIDERS.find(p => p.value === form.provider)?.placeholder ?? "Enter key..."}
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Purpose (optional)</Label>
              <Input
                placeholder="e.g. content generation, thumbnails"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" disabled={addKey.isPending}>Add Key</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {Object.keys(grouped).length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No API keys configured
          </Card>
        ) : (
          Object.entries(grouped).map(([providerValue, providerKeys]) => {
            const provider = PROVIDERS.find(p => p.value === providerValue);
            const isCollapsed = collapsed[providerValue];
            const activeCount = (providerKeys as any[]).filter((k: any) => k.isActive).length;

            return (
              <Card key={providerValue} className="border overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => toggleCollapse(providerValue)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Key className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground">{provider?.label ?? providerValue}</p>
                        {(provider as any)?.badge && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${(provider as any).badgeColor}`}>{(provider as any).badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(providerKeys as any[]).length} key{(providerKeys as any[]).length > 1 ? "s" : ""} · {activeCount} active
                        {(providerKeys as any[]).length > 1 && (
                          <span className="ml-1 text-blue-600 font-medium">· rotating</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${activeCount > 0 ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {activeCount > 0 ? `${activeCount} Active` : "All Inactive"}
                    </Badge>
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="border-t divide-y">
                    {(providerKeys as any[]).map((key: any, idx: number) => (
                      <div key={key.id} className="px-4 py-3 flex items-center justify-between bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {key.label || `Key ${idx + 1}`}
                              {key.purpose && <span className="ml-1 text-muted-foreground">· {key.purpose}</span>}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{key.maskedKey}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Test result badge */}
                          {testResults[key.id] === "loading" && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                              <Loader2 className="w-3 h-3 animate-spin" /> Testing…
                            </span>
                          )}
                          {testResults[key.id] && testResults[key.id] !== "loading" && (
                            (testResults[key.id] as any).ok ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-700 px-2 py-0.5 rounded-full bg-green-100">
                                <CheckCircle2 className="w-3 h-3" /> Working
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-red-700 px-2 py-0.5 rounded-full bg-red-100" title={(testResults[key.id] as any).error}>
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                            )
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestKey(key.id)}
                            disabled={testResults[key.id] === "loading"}
                            className="h-7 px-2 text-xs text-violet-600 hover:text-violet-800 hover:bg-violet-50"
                            title="Test this key"
                          >
                            <FlaskConical className="w-3.5 h-3.5 mr-1" /> Test
                          </Button>
                          <button
                            onClick={() => toggleKey.mutate({ id: key.id, isActive: !key.isActive })}
                            title={key.isActive ? "Deactivate" : "Activate"}
                          >
                            {key.isActive
                              ? <ToggleRight className="w-7 h-7 text-green-500" />
                              : <ToggleLeft className="w-7 h-7 text-muted-foreground/60" />}
                          </button>
                          <Button variant="ghost" size="icon" onClick={() => deleteKey.mutate(key.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
