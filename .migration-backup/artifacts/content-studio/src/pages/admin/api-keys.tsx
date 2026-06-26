import { useState } from "react";
import { useListApiKeys, useUpsertApiKey, useDeleteApiKey } from "@workspace/api-client-react";
import { getListApiKeysQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Eye, EyeOff, Key, AlertCircle } from "lucide-react";

const PROVIDERS = [
  { value: "claude", label: "Claude (Anthropic)", placeholder: "sk-ant-api03-..." },
  { value: "openai", label: "OpenAI (GPT-4 + DALL-E)", placeholder: "sk-proj-..." },
  { value: "gemini", label: "Google Gemini", placeholder: "AIzaSy..." },
  { value: "stabilityai", label: "Stability AI", placeholder: "sk-..." },
];

export default function AdminApiKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ provider: "claude", key: "", purpose: "" });

  const { data: keys } = useListApiKeys({ query: { queryKey: getListApiKeysQueryKey() } });
  const upsert = useUpsertApiKey();
  const deleteKey = useDeleteApiKey();

  const handleSave = () => {
    if (!form.key.trim()) {
      toast({ title: "Enter an API key", variant: "destructive" });
      return;
    }
    upsert.mutate({ data: { provider: form.provider, key: form.key, purpose: form.purpose } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
        setShowAdd(false);
        setForm({ provider: "claude", key: "", purpose: "" });
        toast({ title: "API key saved" });
      },
      onError: () => toast({ title: "Failed to save key", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteKey.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
        toast({ title: "API key deleted" });
      },
    });
  };

  const savedProviders = new Set(keys?.map((k: any) => k.provider));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
          <p className="text-slate-500 text-sm">Manage AI provider keys for content generation</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1" /> Add Key
        </Button>
      </div>

      <Card className="p-4 border border-amber-200 bg-amber-50 flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">API keys are stored in the database. For production, use environment variables. Keys are masked when displayed.</p>
      </Card>

      {showAdd && (
        <Card className="p-5 border border-purple-200 bg-purple-50/30">
          <h3 className="font-semibold text-slate-800 mb-4">Add or Update API Key</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Provider</Label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    data-testid={`provider-${p.value}`}
                    onClick={() => setForm({ ...form, provider: p.value })}
                    className={`px-3 py-2 text-sm border rounded-lg text-left transition-all ${
                      form.provider === p.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {p.label}
                    {savedProviders.has(p.value) && <span className="ml-1 text-xs text-green-600">(saved)</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">API Key</Label>
              <Input
                data-testid="input-api-key"
                type="password"
                placeholder={PROVIDERS.find(p => p.value === form.provider)?.placeholder ?? "Enter key..."}
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Purpose (optional)</Label>
              <Input placeholder="e.g. content generation, thumbnails" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" disabled={upsert.isPending}>Save Key</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {!keys?.length ? (
          <Card className="p-8 text-center text-slate-400">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No API keys configured
          </Card>
        ) : keys.map((key: any) => {
          const provider = PROVIDERS.find(p => p.value === key.provider);
          return (
            <Card key={key.id} data-testid={`api-key-${key.id}`} className="p-4 border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Key className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-slate-800">{provider?.label ?? key.provider}</p>
                    <Badge className={`text-xs ${key.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {key.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{key.maskedKey}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
