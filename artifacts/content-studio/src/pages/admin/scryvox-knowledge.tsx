import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Database, Sparkles } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  framework: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  template:  "bg-green-500/20 text-green-300 border-green-500/30",
  structure: "bg-primary/20 text-primary/70 border-purple-500/30",
  formula:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  pattern:   "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const TYPES = ["framework", "template", "structure", "formula", "pattern"] as const;
const FILTER_ALL = "__all__";

export default function AdminScryvoxKnowledge() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>(FILTER_ALL);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "framework",
    title: "",
    description: "",
    content: "",
    tags: "",
    domain: "",
  });

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const r = await apiClient.get("/scryvox/knowledge");
      setItems(r.data.items ?? []);
    } catch {}
    setLoading(false);
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await apiClient.post("/scryvox/knowledge/seed", {});
      toast({ title: "System knowledge seeded successfully!" });
      loadItems();
    } catch (e: any) {
      toast({ title: "Seed failed", description: e?.response?.data?.error, variant: "destructive" });
    }
    setSeeding(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this knowledge item?")) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/scryvox/knowledge/${id}`);
      setItems(prev => prev.filter(x => x.id !== id));
      toast({ title: "Deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
    setDeleting(null);
  }

  async function handleSave() {
    if (!form.title || !form.description || !form.type) {
      toast({ title: "Fill in type, title, and description", variant: "destructive" }); return;
    }
    setSaving(true);
    let content = {};
    try { content = JSON.parse(form.content || "{}"); } catch {
      content = { notes: form.content };
    }
    try {
      await apiClient.post("/scryvox/knowledge", {
        type: form.type,
        title: form.title,
        description: form.description,
        content,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        domain: form.domain || undefined,
      });
      toast({ title: "Knowledge item added!" });
      setForm({ type: "framework", title: "", description: "", content: "", tags: "", domain: "" });
      setShowForm(false);
      loadItems();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.response?.data?.error, variant: "destructive" });
    }
    setSaving(false);
  }

  const filtered = filterType === FILTER_ALL ? items : items.filter(i => i.type === filterType);
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Database className="w-7 h-7 text-indigo-400" />
              Scryvox Knowledge Base
            </h1>
            <p className="text-gray-400 mt-1">Frameworks, templates, structures, formulas, and patterns — reused across all product pipelines</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSeed} disabled={seeding} variant="outline" className="gap-2 border-gray-600">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Seed System Knowledge
            </Button>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {TYPES.map(type => (
            <div key={type} className={`rounded-xl p-3 border cursor-pointer transition-all ${filterType === type ? "border-indigo-500 bg-indigo-950/40" : "border-gray-700 bg-gray-800/50 hover:border-gray-600"}`}
              onClick={() => setFilterType(filterType === type ? FILTER_ALL : type)}>
              <p className="text-2xl font-bold text-white">{counts[type] ?? 0}</p>
              <Badge className={`text-xs border mt-1 ${TYPE_COLORS[type]}`}>{type}</Badge>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <Card className="bg-gray-800/60 border-gray-700 mb-6">
            <CardHeader><CardTitle className="text-white">Add Knowledge Item</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1 bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Domain (optional)</Label>
                  <Input className="mt-1 bg-gray-900 border-gray-600 text-white" placeholder="mindset, finance, business..." value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-gray-300">Tags (comma-separated)</Label>
                  <Input className="mt-1 bg-gray-900 border-gray-600 text-white" placeholder="persuasion, copy, launch..." value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Title</Label>
                <Input className="mt-1 bg-gray-900 border-gray-600 text-white" placeholder="The Problem-Pain-Solution Arc" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label className="text-gray-300">Description (one sentence hook)</Label>
                <Input className="mt-1 bg-gray-900 border-gray-600 text-white" placeholder="Core persuasion sequence for any product or service" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label className="text-gray-300">Content (JSON or plain text)</Label>
                <Textarea className="mt-1 bg-gray-900 border-gray-600 text-white font-mono text-sm" rows={5} placeholder={'{"principle": "...", "steps": [...], "application": "..."}'} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="border-gray-600" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Item
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={filterType === FILTER_ALL ? "default" : "outline"}
            className={filterType === FILTER_ALL ? "bg-indigo-600" : "border-gray-600 text-gray-300"}
            onClick={() => setFilterType(FILTER_ALL)}>All ({items.length})</Button>
          {TYPES.map(type => (
            <Button key={type} size="sm" variant={filterType === type ? "default" : "outline"}
              className={filterType === type ? "bg-indigo-600" : "border-gray-600 text-gray-300"}
              onClick={() => setFilterType(type)}>{type} ({counts[type] ?? 0})</Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : filtered.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="text-center py-16 text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-lg font-medium text-gray-300 mb-2">No items yet</p>
              <p className="text-sm mb-4">Seed the system knowledge base to get started with 8 proven frameworks, templates, and formulas.</p>
              <Button onClick={handleSeed} disabled={seeding} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Seed System Knowledge
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <Card key={item.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all">
                <CardContent className="py-4 flex gap-4 items-start">
                  <Badge className={`border text-xs shrink-0 mt-0.5 ${TYPE_COLORS[item.type]}`}>{item.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold">{item.title}</p>
                        <p className="text-gray-400 text-sm mt-0.5">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isSystem && <Badge className="bg-gray-700 text-gray-400 border-gray-600 text-xs">system</Badge>}
                        <span className="text-gray-600 text-xs">{item.usageCount} uses</span>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                          className="text-gray-600 hover:text-red-400 transition-colors">
                          {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags?.slice(0, 6).map((tag: string) => (
                        <span key={tag} className="text-xs bg-gray-700 text-gray-400 rounded px-1.5 py-0.5">{tag}</span>
                      ))}
                      {item.domain && <span className="text-xs bg-indigo-900/40 text-indigo-400 rounded px-1.5 py-0.5">{item.domain}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
