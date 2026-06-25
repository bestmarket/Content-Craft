import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mic, Play, Pause, Plus, Save, Loader2, AudioWaveform, Eye, EyeOff, Trash2 } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  description: string;
  enabled: boolean;
}

const GENDER_OPTIONS = ["Female", "Male"];
const ACCENT_OPTIONS = ["American", "British", "Australian", "Indian", "Irish"];

function PreviewButton({ voiceId }: { voiceId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`/api/voice/preview/${voiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handlePreview} disabled={isLoading} className="gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/5">
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      {isPlaying ? "Pause" : "Preview"}
    </Button>
  );
}

export default function AdminVoices() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [catalog, setCatalog] = useState<Voice[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newVoice, setNewVoice] = useState<Partial<Voice>>({
    gender: "Female", accent: "American", enabled: true
  });

  const { isLoading } = useQuery({
    queryKey: ["admin-voice-catalog"],
    queryFn: () => apiClient.get("/admin/voice/catalog").then(r => {
      setCatalog(r.data.catalog);
      return r.data;
    }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Voice[]) => apiClient.put("/admin/voice/catalog", { catalog: data }),
    onSuccess: () => {
      toast({ title: "✅ Voice catalog saved" });
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["voice-voices"] });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const update = (fn: (prev: Voice[]) => Voice[]) => {
    setCatalog(prev => {
      const next = fn(prev ?? []);
      setIsDirty(true);
      return next;
    });
  };

  const toggleEnabled = (id: string) =>
    update(c => c.map(v => v.id === id ? { ...v, enabled: !v.enabled } : v));

  const removeVoice = (id: string) =>
    update(c => c.filter(v => v.id !== id));

  const updateField = (id: string, field: keyof Voice, value: any) =>
    update(c => c.map(v => v.id === id ? { ...v, [field]: value } : v));

  const addVoice = () => {
    if (!newVoice.id?.trim() || !newVoice.name?.trim()) {
      toast({ title: "Voice ID and Name are required", variant: "destructive" });
      return;
    }
    if (catalog?.some(v => v.id === newVoice.id)) {
      toast({ title: "Voice ID already exists", variant: "destructive" });
      return;
    }
    update(c => [...c, {
      id: newVoice.id!.trim(),
      name: newVoice.name!.trim(),
      gender: newVoice.gender ?? "Female",
      accent: newVoice.accent ?? "American",
      description: newVoice.description ?? "",
      enabled: true,
    }]);
    setNewVoice({ gender: "Female", accent: "American", enabled: true });
    setShowAdd(false);
    toast({ title: `Voice "${newVoice.name}" added` });
  };

  const enabledCount = catalog?.filter(v => v.enabled).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AudioWaveform className="w-6 h-6 text-primary" />
            Voice Engine Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the voice catalog — enable/disable voices, add new ones, edit metadata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{enabledCount} enabled</Badge>
          <Button
            onClick={() => saveMutation.mutate(catalog ?? [])}
            disabled={!isDirty || saveMutation.isPending}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Voice ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Gender</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Accent</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Description</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Preview</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(catalog ?? []).map((voice) => (
                    <tr key={voice.id} className={`transition-colors ${voice.enabled ? "bg-card" : "bg-muted/30 opacity-60"}`}>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary font-mono">{voice.id}</code>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={voice.name}
                          onChange={e => updateField(voice.id, "name", e.target.value)}
                          className="h-7 text-sm w-28"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select value={voice.gender} onValueChange={v => updateField(voice.id, "gender", v)}>
                          <SelectTrigger className="h-7 text-sm w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select value={voice.accent} onValueChange={v => updateField(voice.id, "accent", v)}>
                          <SelectTrigger className="h-7 text-sm w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACCENT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={voice.description}
                          onChange={e => updateField(voice.id, "description", e.target.value)}
                          className="h-7 text-sm w-44"
                          placeholder="Short description..."
                        />
                      </td>
                      <td className="px-4 py-3">
                        <PreviewButton voiceId={voice.id} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleEnabled(voice.id)}
                          className={`h-7 gap-1.5 text-xs ${voice.enabled ? "text-green-600 hover:text-green-800 hover:bg-green-50" : "text-muted-foreground hover:text-muted-foreground"}`}
                        >
                          {voice.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {voice.enabled ? "Enabled" : "Disabled"}
                        </Button>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeVoice(voice.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {showAdd ? (
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add New Voice
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Kokoro Voice ID *</Label>
                  <Input placeholder="e.g. af_sky" value={newVoice.id ?? ""} onChange={e => setNewVoice(p => ({ ...p, id: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name *</Label>
                  <Input placeholder="e.g. Sky" value={newVoice.name ?? ""} onChange={e => setNewVoice(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Gender</Label>
                  <Select value={newVoice.gender ?? "Female"} onValueChange={v => setNewVoice(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Accent</Label>
                  <Select value={newVoice.accent ?? "American"} onValueChange={v => setNewVoice(p => ({ ...p, accent: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ACCENT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Description</Label>
                  <Input placeholder="Short description..." value={newVoice.description ?? ""} onChange={e => setNewVoice(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={addVoice} className="bg-primary hover:bg-primary/90 gap-2"><Plus className="w-4 h-4" /> Add Voice</Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 The Voice ID must match a valid kokoro-onnx voice. Check the{" "}
                <a href="https://github.com/thewh1teagle/kokoro-onnx" target="_blank" rel="noreferrer" className="text-primary underline">kokoro-onnx docs</a>
                {" "}for available voice IDs.
              </p>
            </Card>
          ) : (
            <Button variant="outline" onClick={() => setShowAdd(true)} className="gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5">
              <Plus className="w-4 h-4" /> Add Custom Voice
            </Button>
          )}

          {isDirty && (
            <div className="fixed bottom-6 right-6 z-50">
              <Card className="p-3 shadow-lg flex items-center gap-3 bg-card border-primary/30">
                <span className="text-sm font-medium text-foreground">Unsaved changes</span>
                <Button size="sm" onClick={() => saveMutation.mutate(catalog ?? [])} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90 gap-1.5">
                  {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </Button>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
