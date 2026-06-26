import { useState } from "react";
import { useListPrompts, useCreatePrompt, useUpdatePrompt, useDeletePrompt, ListPromptsType } from "@workspace/api-client-react";
import { getListPromptsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

const PROMPT_TYPES = ["content", "thumbnail", "pdf", "chatbot"] as const;

export default function AdminPrompts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", type: "content", systemPrompt: "", description: "", isActive: true });
  const [editForm, setEditForm] = useState({ name: "", systemPrompt: "", description: "", isActive: true });

  const params = filterType !== "all" ? { type: filterType as ListPromptsType } : {};
  const { data: prompts } = useListPrompts(params, { query: { queryKey: getListPromptsQueryKey(params) } });
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const deletePrompt = useDeletePrompt();

  const handleCreate = () => {
    if (!form.name || !form.systemPrompt) {
      toast({ title: "Name and system prompt are required", variant: "destructive" });
      return;
    }
    createPrompt.mutate(
      { data: { ...form, type: form.type as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          setShowAdd(false);
          setForm({ name: "", type: "content", systemPrompt: "", description: "", isActive: true });
          toast({ title: "Prompt created" });
        },
      }
    );
  };

  const handleEdit = (prompt: any) => {
    setEditId(prompt.id);
    setEditForm({ name: prompt.name, systemPrompt: prompt.systemPrompt, description: prompt.description ?? "", isActive: prompt.isActive });
  };

  const handleSaveEdit = (id: number) => {
    updatePrompt.mutate({ id, data: editForm }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
        setEditId(null);
        toast({ title: "Prompt updated" });
      },
    });
  };

  const handleToggle = (id: number, isActive: boolean) => {
    updatePrompt.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() }),
    });
  };

  const handleDelete = (id: number) => {
    deletePrompt.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPromptsQueryKey() });
        toast({ title: "Prompt deleted" });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prompt Library</h1>
          <p className="text-slate-500 text-sm">Manage AI writing style prompts</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PROMPT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Prompt
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="p-5 border border-purple-200 bg-purple-50/30">
          <h3 className="font-semibold text-slate-800 mb-4">New Prompt</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs mb-1 block">Name</Label>
              <Input data-testid="input-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prompt name" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMPT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-3">
            <Label className="text-xs mb-1 block">Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          </div>
          <div className="mb-4">
            <Label className="text-xs mb-1 block">System Prompt</Label>
            <Textarea data-testid="input-system-prompt" value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} placeholder="You are an expert..." rows={4} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm" disabled={createPrompt.isPending}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {!prompts?.length ? (
          <Card className="p-8 text-center text-slate-400">No prompts found</Card>
        ) : prompts.map((prompt: any) => (
          <Card key={prompt.id} data-testid={`prompt-${prompt.id}`} className="p-4 border">
            {editId === prompt.id ? (
              <div className="space-y-3">
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Textarea value={editForm.systemPrompt} onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })} rows={4} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit(prompt.id)}><Check className="w-4 h-4 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800 text-sm">{prompt.name}</span>
                    <Badge variant="secondary" className="text-xs capitalize">{prompt.type}</Badge>
                    <Badge className={`text-xs ${prompt.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {prompt.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {prompt.description && <p className="text-xs text-slate-500 mb-1">{prompt.description}</p>}
                  <p className="text-xs text-slate-600 line-clamp-2 font-mono bg-slate-50 px-2 py-1 rounded">{prompt.systemPrompt}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(prompt.id, prompt.isActive)}>
                    {prompt.isActive ? <X className="w-3.5 h-3.5 text-amber-500" /> : <Check className="w-3.5 h-3.5 text-green-500" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(prompt)}>
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(prompt.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
