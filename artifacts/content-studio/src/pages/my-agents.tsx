import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Bot, Copy, Trash2, Settings, MessageSquare, Users, Zap, Plus,
  Eye, Code, CheckCircle, Sparkles, Globe, Play, X, Send,
  TrendingUp, Shield, ExternalLink, Palette, Loader2,
  ArrowLeft, BarChart3, Activity, Clock, ChevronRight,
  Monitor, Wifi, WifiOff, Star, Download,
} from "lucide-react";

interface Agent {
  id: number; agentKey: string; name: string; agentType: string;
  systemPrompt: string; welcomeMessage: string; primaryColor: string;
  position: string; avatarEmoji: string; isActive: boolean;
  collectLeads: boolean; totalConversations: number; totalLeads: number;
  createdAt: string;
}
interface Message { role: "user" | "assistant"; content: string; }

const COLOR_PRESETS = [
  { color: "#7c3aed", label: "Purple" }, { color: "#2563eb", label: "Blue" },
  { color: "#059669", label: "Green" }, { color: "#dc2626", label: "Red" },
  { color: "#d97706", label: "Amber" }, { color: "#0891b2", label: "Cyan" },
  { color: "#db2777", label: "Pink" }, { color: "#111827", label: "Dark" },
];
const EMOJI_PRESETS = ["🤖", "💬", "⚡", "🎯", "🚀", "💡", "🧠", "✨", "🌟", "🔥", "💼", "🎓"];

function getEmbedCode(agentKey: string) {
  return `<script src="${window.location.origin}/api/ai-agents/embed/${agentKey}.js"></script>`;
}

// ─── Live Preview Widget ──────────────────────────────────────────────────────
function AgentChatWidget({ agent, compact = false }: { agent: Agent; compact?: boolean }) {
  const [msgs, setMsgs] = useState<Message[]>([{ role: "assistant", content: agent.welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sid, setSid] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMsgs(m => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await apiClient.post(`/ai-agents/public/${agent.agentKey}/chat`, {
        messages: [...msgs, userMsg].slice(-20), sessionId: sid, visitorName: "Preview",
      });
      const data = (res.data as any);
      if (data.sessionId) setSid(data.sessionId);
      setMsgs(m => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Error — check if agent is active." }]);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className={`flex flex-col bg-card border border rounded-2xl shadow-lg overflow-hidden ${compact ? "h-72" : "h-96"}`}>
      <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ backgroundColor: agent.primaryColor }}>
        <span className="text-lg">{agent.avatarEmoji}</span>
        <span className="text-white font-bold text-sm flex-1 truncate">{agent.name}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-xs">Online</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
            <div style={m.role === "user" ? { backgroundColor: agent.primaryColor } : {}}
              className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === "assistant" ? "bg-muted text-foreground" : "text-white"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2 flex gap-1">
              {[0,1,2].map(i => <div key={i} style={{ animationDelay: `${i*0.15}s` }} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border p-2 flex gap-1.5 flex-shrink-0">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message to test your bot…"
          className="flex-1 text-xs px-3 py-2 rounded-xl border border outline-none focus:border-violet-300 transition-colors" />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ backgroundColor: agent.primaryColor }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Agent Dashboard (full detail view) ──────────────────────────────────────
function AgentDashboard({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [embedTab, setEmbedTab] = useState<"html" | "wordpress" | "shopify" | "webflow">("html");
  const [copied, setCopied] = useState(false);
  const embedCode = getEmbedCode(agent.agentKey);

  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ["agent-conversations", agent.id],
    queryFn: () => apiClient.get(`/ai-agents/${agent.id}/conversations`).then((r: any) => r.data.conversations as any[]),
  });
  const conversations = convsData ?? [];

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => apiClient.put(`/ai-agents/${agent.id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-agents"] }),
  });

  const copy = (text: string, label = "Copied!") => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: label });
    setTimeout(() => setCopied(false), 2500);
  };

  const installInstructions: Record<string, string[]> = {
    html: ["Open your HTML file", "Find the closing </body> tag", "Paste the embed code just before it", "Save and upload — done!"],
    wordpress: ["Install the 'Insert Headers and Footers' plugin", "Go to Settings → Insert Headers and Footers", "Paste the code in the Footer Scripts box", "Save — widget appears on every page"],
    shopify: ["Go to Online Store → Themes → Edit Code", "Open layout/theme.liquid", "Find </body> near the bottom", "Paste the embed code just before it and Save"],
    webflow: ["Go to Project Settings → Custom Code", "Paste the code in the Footer Code box", "Publish your site"],
  };

  const conversionRate = agent.totalConversations > 0
    ? Math.round((agent.totalLeads / agent.totalConversations) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> All Agents
        </button>
        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: agent.primaryColor + "20" }}>
            {agent.avatarEmoji}
          </div>
          <span className="font-bold text-foreground">{agent.name}</span>
        </div>
        <div className={`ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${agent.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
          {agent.isActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {agent.isActive ? "Live" : "Offline"}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Agent {agent.isActive ? "active" : "paused"}</span>
          <Switch checked={agent.isActive} onCheckedChange={v => toggleMutation.mutate(v)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* Analytics Row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Chats", value: agent.totalConversations, icon: MessageSquare, color: "violet", sub: "All time" },
              { label: "Leads Captured", value: agent.totalLeads, icon: Users, color: "green", sub: "Emails collected" },
              { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "blue", sub: "Chat → Lead" },
              { label: "Agent Status", value: agent.isActive ? "Live" : "Offline", icon: Activity, color: agent.isActive ? "emerald" : "slate", sub: agent.isActive ? "Receiving chats" : "Paused" },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-card border border rounded-2xl p-4 shadow-sm">
                  <Icon className={`w-4 h-4 mb-2 text-${stat.color}-500`} />
                  <div className="text-2xl font-black text-foreground">{stat.value}</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">{stat.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Conversation Monitor */}
          <div className="bg-card border border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-foreground">Conversation Monitor</h3>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{conversations.length} total</span>
              </div>
              {conversations.length > 0 && (
                <button
                  onClick={() => {
                    const csv = ["Name,Email,Messages,Date", ...conversations.map((c: any) =>
                      `"${c.visitorName || "Anonymous"}","${c.visitorEmail || ""}","${(c.messages as any[]).length}","${new Date(c.createdAt).toLocaleDateString()}"`
                    )].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `${agent.name}-conversations.csv`; a.click();
                    URL.revokeObjectURL(url);
                    toast({ title: "Conversations exported!" });
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-600 transition-colors"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              )}
            </div>

            {convsLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading conversations…</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center">
                <MessageSquare className="w-10 h-10 text-white mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Install the embed code below — chats will appear here in real time</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {conversations.map((conv: any) => {
                  const msgs = conv.messages as any[];
                  const lastMsg = msgs[msgs.length - 1];
                  return (
                    <div key={conv.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: agent.primaryColor + "20" }}>
                          {(conv.visitorName || "A")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">{conv.visitorName || "Anonymous"}</span>
                            {conv.visitorEmail && (
                              <span className="text-xs text-muted-foreground truncate">{conv.visitorEmail}</span>
                            )}
                            {conv.visitorEmail && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Lead</span>}
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {lastMsg.role === "user" ? "👤 " : "🤖 "}{lastMsg.content}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">{new Date(conv.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{msgs.length} msgs</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Embed Code + Installation */}
          <div className="bg-card border border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border flex items-center gap-2">
              <Code className="w-4 h-4 text-violet-600" />
              <h3 className="font-bold text-foreground">Install on Your Website</h3>
            </div>
            <div className="p-5">
              {/* Platform tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(["html", "wordpress", "shopify", "webflow"] as const).map(t => (
                  <button key={t} onClick={() => setEmbedTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${embedTab === t ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted"}`}>
                    {t === "html" ? "🌐 HTML" : t === "wordpress" ? "📝 WordPress" : t === "shopify" ? "🛒 Shopify" : "⚡ Webflow"}
                  </button>
                ))}
              </div>

              {/* Steps */}
              <div className="space-y-2 mb-4">
                {installInstructions[embedTab].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>

              {/* Code box */}
              <div className="bg-slate-950 rounded-xl p-4 relative">
                <p className="text-xs text-muted-foreground mb-2 font-mono">Your embed code:</p>
                <code className="text-sm text-green-400 font-mono break-all">{embedCode}</code>
                <button onClick={() => copy(embedCode, "Embed code copied!")}
                  className="absolute top-3 right-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-colors">
                  {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Test link */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                Works on any website — no backend required. Conversations are logged above automatically.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Live Preview */}
        <div className="space-y-5">
          <div className="bg-card border border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border flex items-center gap-2">
              <Play className="w-4 h-4 text-violet-600" />
              <h3 className="font-bold text-foreground">Live Test Your Bot</h3>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">This is exactly what visitors see. Chat with it to test responses.</p>
              <AgentChatWidget agent={agent} />
            </div>
          </div>

          {/* Agent Info */}
          <div className="bg-card border border rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" /> Agent Config
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground capitalize">{agent.agentType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Widget position</span>
                <span className="font-medium text-foreground capitalize">{agent.position}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lead capture</span>
                <span className={`font-medium ${agent.collectLeads ? "text-green-600" : "text-muted-foreground"}`}>
                  {agent.collectLeads ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Brand Color</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border border" style={{ backgroundColor: agent.primaryColor }} />
                <span className="text-sm font-mono text-foreground">{agent.primaryColor}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card border border rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-foreground text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => copy(embedCode, "Embed code copied!")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Embed Code"}
              </button>
              <Link href="/automations/generators/ai_agent">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted text-foreground text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" /> Build Another Agent
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent, onEdit, onDelete, onView }: {
  agent: Agent; onEdit: (a: Agent) => void; onDelete: (id: number) => void; onView: (a: Agent) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => apiClient.put(`/ai-agents/${agent.id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-agents"] }),
  });

  const copy = () => {
    navigator.clipboard.writeText(getEmbedCode(agent.agentKey));
    setCopied(true);
    toast({ title: "Embed code copied!", description: "Paste before </body> on any website." });
    setTimeout(() => setCopied(false), 3000);
  };

  const conversionRate = agent.totalConversations > 0 ? Math.round((agent.totalLeads / agent.totalConversations) * 100) : 0;

  return (
    <div className={`bg-card rounded-2xl border-2 transition-all hover:shadow-xl ${agent.isActive ? "border hover:border-violet-100" : "border opacity-70"}`}>
      <div className="h-1.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${agent.primaryColor}, ${agent.primaryColor}88)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: agent.primaryColor + "18", border: `2px solid ${agent.primaryColor}30` }}>
                {agent.avatarEmoji}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${agent.isActive ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">{agent.name}</h3>
              <span className="text-xs text-muted-foreground capitalize">{agent.agentType.replace(/_/g, " ")}</span>
            </div>
          </div>
          <Switch checked={agent.isActive} onCheckedChange={v => toggleMutation.mutate(v)} className="scale-90" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-violet-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-foreground">{agent.totalConversations}</div>
            <div className="text-[10px] text-muted-foreground font-medium">Chats</div>
          </div>
          <div className="bg-green-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-foreground">{agent.totalLeads}</div>
            <div className="text-[10px] text-muted-foreground font-medium">Leads</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-foreground">{conversionRate}%</div>
            <div className="text-[10px] text-muted-foreground font-medium">Convert</div>
          </div>
        </div>

        {/* Embed snippet preview */}
        <button onClick={copy}
          className="w-full bg-slate-950 rounded-xl p-3 mb-4 text-left hover:bg-slate-800 transition-colors group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-mono">Embed code</span>
            {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-muted-foreground/60" />}
          </div>
          <code className="text-xs text-green-400 font-mono block truncate">
            {`<script src="…/${agent.agentKey}.js"></script>`}
          </code>
        </button>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={() => onView(agent)}
            className="col-span-3 h-9 bg-gradient-to-r from-violet-600 to-blue-700 hover:from-violet-700 hover:to-purple-800 text-white border-0 gap-2 font-semibold">
            <Monitor className="w-3.5 h-3.5" /> Open Dashboard
          </Button>
          <Button size="sm" variant="outline" onClick={copy} className="h-8 gap-1 text-xs">
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(agent)} className="h-8 gap-1 text-xs">
            <Settings className="w-3 h-3" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => { if (confirm(`Delete "${agent.name}"?`)) onDelete(agent.id); }}
            className="h-8 p-0 text-red-500 hover:text-red-600 hover:border-red-200">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function EditDialog({ agent, open, onClose }: { agent: Agent | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<Agent>>({});
  const current = { ...agent, ...form } as Agent;

  const update = useMutation({
    mutationFn: (data: Partial<Agent>) => apiClient.put(`/ai-agents/${agent?.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ai-agents"] }); toast({ title: "Agent saved!" }); onClose(); },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const f = (key: keyof Agent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  const fv = (key: keyof Agent) => (val: any) => setForm(prev => ({ ...prev, [key]: val }));

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: current.primaryColor + "20" }}>
              {current.avatarEmoji}
            </div>
            Edit — {agent.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent Name</Label>
              <Input value={current.name || ""} onChange={f("name")} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avatar Emoji</Label>
              <div className="mt-1.5 space-y-2">
                <Input value={current.avatarEmoji || ""} onChange={f("avatarEmoji")} maxLength={4} />
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_PRESETS.map(e => (
                    <button key={e} onClick={() => fv("avatarEmoji")(e)}
                      className={`w-8 h-8 rounded-lg text-base hover:scale-110 transition-transform border ${current.avatarEmoji === e ? "border-violet-500 bg-violet-50" : "border"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Welcome Message</Label>
            <Input value={current.welcomeMessage || ""} onChange={f("welcomeMessage")} className="mt-1.5" placeholder="Hi! How can I help you?" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Prompt (AI Instructions)</Label>
            <Textarea value={current.systemPrompt || ""} onChange={f("systemPrompt")} rows={7}
              className="mt-1.5 font-mono text-xs resize-none" placeholder="You are a helpful assistant..." />
            <p className="text-xs text-muted-foreground mt-1">Shapes how your agent behaves — be specific about personality, capabilities, and limitations.</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand Color</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COLOR_PRESETS.map(p => (
                <button key={p.color} onClick={() => fv("primaryColor")(p.color)} title={p.label}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${current.primaryColor === p.color ? "border-slate-900 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: p.color }} />
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <input type="color" value={current.primaryColor || "#7c3aed"} onChange={e => fv("primaryColor")(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border" />
                <Input value={current.primaryColor || ""} onChange={f("primaryColor")} className="w-28 h-8 text-xs" />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Widget Position</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {["bottom-right", "bottom-left"].map(p => (
                <button key={p} onClick={() => fv("position")(p)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${current.position === p ? "border-violet-500 bg-violet-50 text-violet-700" : "border text-muted-foreground hover:border"}`}>
                  {p === "bottom-right" ? "↘ Bottom Right" : "↙ Bottom Left"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="text-sm font-semibold text-foreground">Lead Capture</p>
              <p className="text-xs text-muted-foreground">Ask visitors for name & email before chatting</p>
            </div>
            <Switch checked={current.collectLeads ?? true} onCheckedChange={fv("collectLeads")} />
          </div>
          <Button onClick={() => update.mutate(form)} disabled={update.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 h-11 font-semibold">
            {update.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyAgents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [viewAgent, setViewAgent] = useState<Agent | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-agents"],
    queryFn: () => apiClient.get("/ai-agents").then((r: any) => r.data.agents as Agent[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/ai-agents/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ai-agents"] }); toast({ title: "Agent deleted" }); },
  });

  const agents = data || [];

  // ── Agent Dashboard view ──────────────────────────────────────────────────
  if (viewAgent) {
    const live = agents.find(a => a.id === viewAgent.id) ?? viewAgent;
    return <AgentDashboard agent={live} onBack={() => setViewAgent(null)} />;
  }

  const totalConvs = agents.reduce((s, a) => s + a.totalConversations, 0);
  const totalLeads = agents.reduce((s, a) => s + a.totalLeads, 0);
  const activeAgents = agents.filter(a => a.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            My AI Agents
          </h1>
          <p className="text-muted-foreground mt-1.5">Deploy, monitor and manage AI chatbots — each with one line of embed code</p>
        </div>
        <Link href="/automations/generators/ai_agent">
          <Button className="bg-gradient-to-r from-violet-600 to-blue-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-lg shadow-violet-500/30 gap-2 h-11">
            <Plus className="w-4 h-4" /> Build New Agent
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {agents.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Agents", value: agents.length, icon: Bot, color: "violet" },
            { label: "Active Now", value: activeAgents, icon: Zap, color: "green" },
            { label: "Total Chats", value: totalConvs.toLocaleString(), icon: MessageSquare, color: "blue" },
            { label: "Leads Captured", value: totalLeads.toLocaleString(), icon: TrendingUp, color: "amber" },
          ].map(stat => {
            const Icon = stat.icon;
            const colors: Record<string, string> = {
              violet: "from-violet-50 to-violet-100 border-violet-200 text-violet-700",
              green: "from-green-50 to-green-100 border-green-200 text-green-700",
              blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-700",
              amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
            };
            return (
              <div key={stat.label} className={`bg-gradient-to-br ${colors[stat.color]} rounded-2xl p-4 border`}>
                <Icon className="w-5 h-5 mb-2 opacity-70" />
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-sm font-medium opacity-80 mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-2xl border-2 border overflow-hidden animate-pulse">
              <div className="h-1.5 bg-muted" />
              <div className="p-5 space-y-4">
                <div className="flex gap-3"><div className="w-12 h-12 bg-muted rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded" /><div className="h-3 bg-muted rounded w-2/3" /></div></div>
                <div className="h-16 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && agents.length === 0 && (
        <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Bot className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">No AI Agents Yet</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            Build an AI agent — the platform deploys real, working chatbot code you can put on any website immediately.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/automations/generators/ai_agent">
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2 h-12 px-8 text-base font-bold">
                <Sparkles className="w-5 h-5" /> Build Your First AI Agent
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">Takes about 60 seconds · One line of code to deploy</p>
          </div>
        </div>
      )}

      {/* Agent grid */}
      {!isLoading && agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent}
              onEdit={setEditAgent}
              onDelete={id => deleteMutation.mutate(id)}
              onView={setViewAgent}
            />
          ))}
        </div>
      )}

      {/* How it works */}
      {agents.length > 0 && (
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { emoji: "⚡", step: "1", title: "Build with AI", desc: "Describe your agent — AI generates system prompt, conversation flows, and full configuration" },
            { emoji: "📋", step: "2", title: "Copy & Deploy", desc: "One-line script tag — paste before </body> on any website: HTML, WordPress, Shopify, Webflow" },
            { emoji: "📊", step: "3", title: "Monitor & Grow", desc: "Track every conversation in real time — chat logs, lead capture, and conversion analytics" },
          ].map(item => (
            <div key={item.step} className="bg-card rounded-2xl border border p-5 flex gap-4">
              <div className="text-2xl flex-shrink-0">{item.emoji}</div>
              <div>
                <div className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">Step {item.step}</div>
                <div className="font-bold text-foreground text-sm mb-1">{item.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EditDialog agent={editAgent} open={!!editAgent} onClose={() => setEditAgent(null)} />
    </div>
  );
}
