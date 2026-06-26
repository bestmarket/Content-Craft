import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Key, Plus, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff,
  CheckCircle2, XCircle, Loader2, Shield, Zap, Bot, Image,
  RefreshCw, AlertCircle, ExternalLink,
} from "lucide-react";

const PROVIDERS = [
  {
    value: "gemini",
    label: "Google Gemini",
    badge: "PRIMARY",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: "✦",
    iconBg: "bg-blue-50",
    placeholder: "AIzaSy... or AQ...",
    info: "Primary AI provider powering the Studio pipeline.",
    docsUrl: "https://aistudio.google.com/app/apikey",
    docsLabel: "Get free key →",
  },
  {
    value: "groq",
    label: "Groq (Llama 3.3)",
    badge: "FREE",
    badgeColor: "bg-green-100 text-green-700",
    icon: "⚡",
    iconBg: "bg-green-50",
    placeholder: "gsk_...",
    info: "Ultra-fast inference. Free tier at console.groq.com.",
    docsUrl: "https://console.groq.com/keys",
    docsLabel: "Get free key →",
  },
  {
    value: "openai",
    label: "OpenAI (GPT-4o)",
    badge: "PAID",
    badgeColor: "bg-slate-100 text-slate-600",
    icon: "◎",
    iconBg: "bg-slate-50",
    placeholder: "sk-proj-...",
    info: "GPT-4o text + DALL-E 3 image generation.",
    docsUrl: "https://platform.openai.com/api-keys",
    docsLabel: "Get key →",
  },
  {
    value: "claude",
    label: "Anthropic Claude",
    badge: "PAID",
    badgeColor: "bg-orange-100 text-orange-700",
    icon: "◈",
    iconBg: "bg-orange-50",
    placeholder: "sk-ant-api03-...",
    info: "Claude Opus — best for long-form creative writing.",
    docsUrl: "https://console.anthropic.com/settings/keys",
    docsLabel: "Get key →",
  },
  {
    value: "stabilityai",
    label: "Stability AI",
    badge: "IMAGE",
    badgeColor: "bg-purple-100 text-purple-700",
    icon: "🎨",
    iconBg: "bg-purple-50",
    placeholder: "sk-...",
    info: "Stable Diffusion for cover image generation.",
    docsUrl: "https://platform.stability.ai/account/keys",
    docsLabel: "Get key →",
  },
];

interface ApiKey {
  id: number;
  provider: string;
  label?: string;
  maskedKey: string;
  isActive: boolean;
  purpose?: string;
  createdAt: string;
}

function ProviderIcon({ provider }: { provider: string }) {
  const p = PROVIDERS.find(x => x.value === provider);
  return (
    <div className={`w-9 h-9 rounded-xl ${p?.iconBg ?? "bg-slate-50"} flex items-center justify-center text-lg flex-shrink-0`}>
      {p?.icon ?? "🔑"}
    </div>
  );
}

export default function AdminKeys() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [keyValue, setKeyValue] = useState("");
  const [keyLabel, setKeyLabel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const { data: keys = [], isLoading, error } = useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: () => apiClient<ApiKey[]>("/api-keys"),
    refetchInterval: 30000,
  });

  const addMutation = useMutation({
    mutationFn: (payload: { provider: string; encryptedKey: string; maskedKey: string; label?: string }) =>
      apiClient("/api-keys", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setShowAdd(false);
      setKeyValue("");
      setKeyLabel("");
      toast({ title: "API key added", description: `${PROVIDERS.find(p => p.value === selectedProvider)?.label} key is now active.` });
    },
    onError: (err: any) => toast({ title: "Failed to add key", description: err?.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiClient(`/api-keys/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
    onError: () => toast({ title: "Failed to update key", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient(`/api-keys/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Key deleted" });
    },
    onError: () => toast({ title: "Failed to delete key", variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => apiClient<{ ok: boolean; provider: string; model?: string; error?: string }>(`/api-keys/${id}/test`, { method: "POST" }),
    onSuccess: (data, id) => {
      setTestingId(null);
      if (data.ok) {
        toast({ title: `✅ Key working`, description: `Connected to ${data.model ?? data.provider} successfully.` });
      } else {
        toast({ title: "Key test failed", description: data.error ?? "Could not connect", variant: "destructive" });
      }
    },
    onError: () => { setTestingId(null); toast({ title: "Test failed", variant: "destructive" }); },
  });

  const handleAdd = () => {
    if (!keyValue.trim()) { toast({ title: "API key is required", variant: "destructive" }); return; }
    const masked = keyValue.length > 8
      ? `${keyValue.slice(0, 6)}${"•".repeat(Math.min(16, keyValue.length - 8))}${keyValue.slice(-4)}`
      : "••••••••";
    addMutation.mutate({ provider: selectedProvider, encryptedKey: keyValue.trim(), maskedKey: masked, label: keyLabel.trim() || undefined });
  };

  const handleTest = (id: number) => {
    setTestingId(id);
    testMutation.mutate(id);
  };

  // Group keys by provider
  const keysByProvider: Record<string, ApiKey[]> = {};
  for (const k of keys) {
    if (!keysByProvider[k.provider]) keysByProvider[k.provider] = [];
    keysByProvider[k.provider].push(k);
  }

  const providerInfo = (provider: string) => PROVIDERS.find(p => p.value === provider);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
            </div>
            <p className="text-sm text-slate-500 ml-12">Manage AI provider credentials — keys are encrypted at rest</p>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Key
          </Button>
        </div>

        {/* Add Key Form */}
        {showAdd && (
          <Card className="border border-indigo-200 bg-white shadow-md">
            <div className="p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" /> Add New API Key
              </h2>

              {/* Provider selector */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {PROVIDERS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setSelectedProvider(p.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selectedProvider === p.value
                        ? "border-indigo-400 bg-indigo-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg ${p.iconBg} flex items-center justify-center text-sm flex-shrink-0`}>{p.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{p.label}</div>
                      <Badge className={`text-[10px] px-1 py-0 ${p.badgeColor} border-0`}>{p.badge}</Badge>
                    </div>
                  </button>
                ))}
              </div>

              {/* Provider info */}
              {providerInfo(selectedProvider) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-700">{providerInfo(selectedProvider)!.info}</p>
                    <a href={providerInfo(selectedProvider)!.docsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mt-1">
                      {providerInfo(selectedProvider)!.docsLabel} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-600 mb-1 block">
                    API Key <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder={providerInfo(selectedProvider)?.placeholder ?? "Enter API key..."}
                      value={keyValue}
                      onChange={e => setKeyValue(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 mb-1 block">Label (optional)</Label>
                  <Input
                    placeholder="e.g. Production key, Personal quota"
                    value={keyLabel}
                    onChange={e => setKeyLabel(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <Button
                  onClick={handleAdd}
                  disabled={addMutation.isPending || !keyValue.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {addMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Key"}
                </Button>
                <Button variant="outline" onClick={() => { setShowAdd(false); setKeyValue(""); setKeyLabel(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Keys list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
            <span className="text-slate-500 text-sm">Loading keys...</span>
          </div>
        ) : error ? (
          <Card className="p-8 text-center border-red-100">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 text-sm">Failed to load API keys</p>
          </Card>
        ) : keys.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <Key className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-600 mb-1">No API keys yet</h3>
            <p className="text-sm text-slate-400 mb-4">Add your first AI provider key to enable content generation.</p>
            <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add First Key
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Group by provider */}
            {Object.entries(keysByProvider).map(([provider, provKeys]) => {
              const pInfo = providerInfo(provider);
              const activeCount = provKeys.filter(k => k.isActive).length;
              return (
                <Card key={provider} className="bg-white border border-slate-200 overflow-hidden">
                  {/* Provider header */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <ProviderIcon provider={provider} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{pInfo?.label ?? provider}</span>
                        {pInfo && <Badge className={`text-[10px] px-1.5 py-0 ${pInfo.badgeColor} border-0`}>{pInfo.badge}</Badge>}
                      </div>
                      <p className="text-xs text-slate-400">{activeCount}/{provKeys.length} key{provKeys.length !== 1 ? "s" : ""} active</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? "bg-green-400" : "bg-slate-300"}`} />
                  </div>

                  {/* Keys */}
                  <div className="divide-y divide-slate-50">
                    {provKeys.map(key => (
                      <div key={key.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${key.isActive ? "bg-green-400" : "bg-slate-300"}`} />
                        <div className="flex-1 min-w-0">
                          {key.label && <div className="text-xs font-medium text-slate-700">{key.label}</div>}
                          <code className="text-xs text-slate-400 font-mono">{key.maskedKey}</code>
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            Added {new Date(key.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTest(key.id)}
                            disabled={testingId === key.id}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Test key"
                          >
                            {testingId === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })}
                            className={`p-1.5 rounded-lg transition-colors ${
                              key.isActive
                                ? "hover:bg-orange-50 text-orange-400 hover:text-orange-600"
                                : "hover:bg-green-50 text-slate-300 hover:text-green-600"
                            }`}
                            title={key.isActive ? "Deactivate" : "Activate"}
                          >
                            {key.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this API key?")) deleteMutation.mutate(key.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info card */}
        <Card className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-indigo-800 mb-1">Security & Round-Robin Rotation</h4>
              <p className="text-xs text-indigo-600 leading-relaxed">
                Keys are encrypted at rest and never exposed in API responses. Multiple keys for the same provider
                are automatically rotated in round-robin fashion to maximize quota and avoid rate limits.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
