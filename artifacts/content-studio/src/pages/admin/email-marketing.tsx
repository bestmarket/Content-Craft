import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Send, Users, CheckCircle, XCircle, Pause, Play,
  Settings, BarChart2, Eye, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Loader2, MousePointerClick, TrendingUp, Megaphone,
  Edit3, Save, X, Zap, Target, Clock, Globe, Palette, Link2,
  RotateCcw, Filter, ArrowRight, Award, Activity
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "sequences", label: "Sequences", icon: Mail },
  { id: "broadcast", label: "Broadcast", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "smtp", label: "SMTP", icon: Globe },
];

export default function AdminEmailMarketing() {
  const [tab, setTab] = useState("overview");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-email-stats"],
    queryFn: () => apiClient.get("/admin/email/stats").then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Full-stack automated email engine · open & click tracking · broadcast · analytics
          </p>
        </div>
        {stats && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Pill color="green" label={`${stats.openRate ?? 0}% open rate`} />
            <Pill color="purple" label={`${stats.clickRate ?? 0}% click rate`} />
            <Pill color={stats.smtpConfigured ? "green" : "red"} label={stats.smtpConfigured ? "SMTP ✓" : "SMTP needed"} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab stats={stats} loading={statsLoading} />}
      {tab === "sequences" && <SequencesTab toast={toast} qc={qc} />}
      {tab === "broadcast" && <BroadcastTab toast={toast} />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "subscribers" && <SubscribersTab />}
      {tab === "settings" && <SettingsTab toast={toast} qc={qc} />}
      {tab === "smtp" && <SmtpTab toast={toast} qc={qc} />}
    </div>
  );
}

function Pill({ color, label }: { color: string; label: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-primary/5 text-primary border-primary/30",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-bold ${colors[color] ?? colors.purple}`}>
      {label}
    </span>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────────── */
function OverviewTab({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) return <Spinner />;

  const s = stats ?? {};
  const sent = s.totalSent ?? 0;
  const opened = s.totalOpened ?? 0;
  const clicked = s.totalClicked ?? 0;
  const unsub = s.totalUnsubscribed ?? 0;

  return (
    <div className="space-y-5">
      {!s.smtpConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">SMTP Not Configured</p>
            <p className="text-amber-700 text-sm mt-0.5">
              No emails will be sent until you configure SMTP. Click the <strong>SMTP</strong> tab to set it up — it takes 2 minutes.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sequences", value: s.totalSequences ?? 0, icon: Mail, color: "text-primary bg-primary/5" },
          { label: "Subscribers", value: s.totalSubscribers ?? 0, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Emails Sent", value: sent, icon: Send, color: "text-green-600 bg-green-50" },
          { label: "Delivery Failures", value: s.totalFailed ?? 0, icon: XCircle, color: "text-red-600 bg-red-50" },
        ].map(c => (
          <Card key={c.label} className="p-5 border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{c.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      {/* Engagement funnel */}
      <Card className="p-6 border">
        <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Engagement Funnel
        </h3>
        <div className="flex items-end gap-2 flex-wrap">
          {[
            { label: "Sent", value: sent, pct: 100, color: "bg-slate-500" },
            { label: "Opened", value: opened, pct: sent > 0 ? Math.round((opened / sent) * 100) : 0, color: "bg-blue-500" },
            { label: "Clicked", value: clicked, pct: sent > 0 ? Math.round((clicked / sent) * 100) : 0, color: "bg-primary" },
            { label: "Unsubscribed", value: unsub, pct: sent > 0 ? Math.round((unsub / sent) * 100) : 0, color: "bg-red-400" },
          ].map((f, i) => (
            <div key={f.label} className="flex-1 min-w-[80px]">
              <div className="text-center mb-2">
                <p className="text-lg font-extrabold text-foreground">{f.pct}%</p>
                <p className="text-xs text-muted-foreground">{f.value.toLocaleString()}</p>
              </div>
              <div className="h-32 bg-muted rounded-lg overflow-hidden flex items-end">
                <div
                  className={`w-full ${f.color} rounded-lg transition-all duration-700`}
                  style={{ height: `${Math.max(f.pct, 2)}%` }}
                />
              </div>
              <p className="text-center text-xs font-semibold text-muted-foreground mt-2">{f.label}</p>
              {i < 3 && (
                <div className="flex justify-end pr-0 mt-1">
                  <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Performance benchmarks */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 border">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-foreground">Open Rate</h4>
          </div>
          <p className="text-3xl font-black text-blue-600">{s.openRate ?? 0}%</p>
          <div className="mt-2 text-xs text-muted-foreground">
            Industry avg: <strong>21%</strong> — {(s.openRate ?? 0) >= 21 ? "✅ You're beating it!" : "📈 Room to grow"}
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full">
            <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(s.openRate ?? 0, 100)}%` }} />
          </div>
        </Card>
        <Card className="p-5 border">
          <div className="flex items-center gap-2 mb-3">
            <MousePointerClick className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-foreground">Click Rate</h4>
          </div>
          <p className="text-3xl font-black text-primary">{s.clickRate ?? 0}%</p>
          <div className="mt-2 text-xs text-muted-foreground">
            Industry avg: <strong>2.5%</strong> — {(s.clickRate ?? 0) >= 2.5 ? "✅ Crushing it!" : "💡 Add stronger CTAs"}
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full">
            <div className="h-2 bg-primary rounded-full" style={{ width: `${Math.min((s.clickRate ?? 0) * 10, 100)}%` }} />
          </div>
        </Card>
        <Card className="p-5 border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-green-600" />
            <h4 className="font-bold text-foreground">Active Subscribers</h4>
          </div>
          <p className="text-3xl font-black text-green-600">{s.activeSubscribers ?? 0}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            {s.totalSubscribers > 0
              ? `${Math.round(((s.activeSubscribers ?? 0) / s.totalSubscribers) * 100)}% of total list still active`
              : "No subscribers yet"}
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full">
            <div className="h-2 bg-green-500 rounded-full" style={{ width: `${s.totalSubscribers > 0 ? Math.round(((s.activeSubscribers ?? 0) / s.totalSubscribers) * 100) : 0}%` }} />
          </div>
        </Card>
      </div>

      {/* How it works */}
      <Card className="p-6 border bg-gradient-to-br from-purple-50 to-slate-50">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Automated Pipeline
        </h3>
        <div className="grid md:grid-cols-5 gap-3">
          {[
            { step: "1", icon: "🛍️", title: "Product Created", desc: "Creator builds product, hits Generate All" },
            { step: "2", icon: "🤖", title: "AI Writes Sequence", desc: "30 emails auto-generated by AI in seconds" },
            { step: "3", icon: "💳", title: "Buyer Purchases", desc: "Payment processed via Paddle or Lemon Squeezy" },
            { step: "4", icon: "📬", title: "Auto-Enrolled", desc: "Buyer receives receipt + is added to sequence" },
            { step: "5", icon: "⏰", title: "Scheduler Sends", desc: "Emails go out on schedule, every 15 minutes" },
          ].map((s, i) => (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
              <p className="font-semibold text-foreground text-xs">{s.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Sequences ──────────────────────────────────────────────────────────────── */
function SequencesTab({ toast, qc }: { toast: any; qc: any }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingEmail, setEditingEmail] = useState<{ seqId: number; idx: number } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [previewIdx, setPreviewIdx] = useState<Record<number, number>>({});
  const [previewEmail, setPreviewEmail] = useState<Record<number, string>>({});
  const [resendIdx, setResendIdx] = useState<Record<number, number>>({});
  const [altSubject, setAltSubject] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const { data: sequences, isLoading } = useQuery({
    queryKey: ["admin-email-sequences"],
    queryFn: () => apiClient.get("/admin/email/sequences").then(r => r.data),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/admin/email/sequences/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-sequences"] });
      qc.invalidateQueries({ queryKey: ["admin-email-stats"] });
      toast({ title: "Sequence status updated" });
    },
  });

  const saveEmail = useMutation({
    mutationFn: ({ seqId, idx, data }: { seqId: number; idx: number; data: any }) =>
      apiClient.patch(`/admin/email/sequences/${seqId}/emails/${idx}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-sequences"] });
      setEditingEmail(null);
      toast({ title: "Email updated!" });
    },
  });

  if (isLoading) return <Spinner />;
  const seqs = sequences ?? [];

  const sendPreview = async (seqId: number, idx: number) => {
    const email = previewEmail[seqId];
    if (!email) { toast({ title: "Enter preview email address", variant: "destructive" }); return; }
    setSending(s => ({ ...s, [`preview_${seqId}`]: true }));
    try {
      await apiClient.post(`/admin/email/sequences/${seqId}/preview`, { emailIndex: idx, sendTo: email });
      toast({ title: `Preview sent to ${email}!` });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Preview failed", variant: "destructive" });
    } finally {
      setSending(s => ({ ...s, [`preview_${seqId}`]: false }));
    }
  };

  const doResend = async (seqId: number, idx: number) => {
    setSending(s => ({ ...s, [`resend_${seqId}`]: true }));
    try {
      const r = await apiClient.post(`/admin/email/sequences/${seqId}/resend-unopened`, {
        emailIndex: idx,
        altSubject: altSubject[seqId] || undefined,
      });
      toast({ title: `Re-sent to ${r.data.sent} non-openers!` });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Resend failed", variant: "destructive" });
    } finally {
      setSending(s => ({ ...s, [`resend_${seqId}`]: false }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{seqs.length} sequence{seqs.length !== 1 ? "s" : ""}</p>
      </div>

      {seqs.length === 0 ? (
        <EmptyState icon={Mail} title="No sequences yet" desc="Sequences are created automatically when creators run 'Generate All' on any product." />
      ) : seqs.map((seq: any) => (
        <Card key={seq.id} className="border overflow-hidden">
          {/* Header row */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${seq.status === "active" ? "bg-green-500" : seq.status === "paused" ? "bg-amber-500" : "bg-slate-300"}`} />
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{seq.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge className={`text-xs ${seq.source === "product" ? "bg-primary/5 text-primary" : seq.source === "automation" ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                    {seq.source}
                  </Badge>
                  {seq.productTitle && <span className="text-xs text-muted-foreground">→ {seq.productTitle}</span>}
                  {seq.owner && <span className="text-xs text-muted-foreground">by {seq.owner.name}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatBox label="sent" value={seq.totalSent ?? 0} />
              <StatBox label="open%" value={`${seq.openRate ?? 0}%`} highlight={seq.openRate >= 20} />
              <StatBox label="click%" value={`${seq.clickRate ?? 0}%`} highlight={seq.clickRate >= 3} />
              <StatBox label="subs" value={seq.totalSubscribers ?? 0} />
              <Button
                size="sm" variant="outline"
                onClick={() => toggleStatus.mutate({ id: seq.id, status: seq.status === "active" ? "paused" : "active" })}
                disabled={toggleStatus.isPending}
                className={seq.status === "active" ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-700 border-green-200 hover:bg-green-50"}
              >
                {seq.status === "active" ? <><Pause className="w-3 h-3 mr-1" />Pause</> : <><Play className="w-3 h-3 mr-1" />Activate</>}
              </Button>
              <button onClick={() => setExpanded(expanded === seq.id ? null : seq.id)} className="text-muted-foreground hover:text-muted-foreground">
                {expanded === seq.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded panel */}
          {expanded === seq.id && (
            <div className="border-t bg-muted/30">
              {/* Toolbar */}
              <div className="p-4 border-b bg-card flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Preview to: admin@example.com"
                    value={previewEmail[seq.id] ?? ""}
                    onChange={e => setPreviewEmail(p => ({ ...p, [seq.id]: e.target.value }))}
                    className="h-8 text-xs w-52"
                  />
                  <select
                    className="h-8 text-xs border rounded px-2 bg-card"
                    value={previewIdx[seq.id] ?? 0}
                    onChange={e => setPreviewIdx(p => ({ ...p, [seq.id]: parseInt(e.target.value) }))}
                  >
                    {(Array.isArray(seq.emails) ? seq.emails : []).map((_: any, i: number) => (
                      <option key={i} value={i}>Email #{i + 1}</option>
                    ))}
                  </select>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => sendPreview(seq.id, previewIdx[seq.id] ?? 0)}
                    disabled={sending[`preview_${seq.id}`]}
                    className="h-8 text-xs"
                  >
                    {sending[`preview_${seq.id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                    Preview
                  </Button>
                </div>
                <div className="flex items-center gap-2 border-l pl-3">
                  <select
                    className="h-8 text-xs border rounded px-2 bg-card"
                    value={resendIdx[seq.id] ?? 0}
                    onChange={e => setResendIdx(p => ({ ...p, [seq.id]: parseInt(e.target.value) }))}
                  >
                    {(Array.isArray(seq.emails) ? seq.emails : []).map((_: any, i: number) => (
                      <option key={i} value={i}>Email #{i + 1}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Alt subject (optional)"
                    value={altSubject[seq.id] ?? ""}
                    onChange={e => setAltSubject(s => ({ ...s, [seq.id]: e.target.value }))}
                    className="h-8 text-xs w-44"
                  />
                  <Button
                    size="sm" variant="outline"
                    onClick={() => doResend(seq.id, resendIdx[seq.id] ?? 0)}
                    disabled={sending[`resend_${seq.id}`]}
                    className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    {sending[`resend_${seq.id}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                    Resend Non-Openers
                  </Button>
                </div>
              </div>

              {/* Email list */}
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {(Array.isArray(seq.emails) ? seq.emails : []).map((email: any, i: number) => {
                  const isEditing = editingEmail?.seqId === seq.id && editingEmail?.idx === i;
                  return (
                    <div key={i} className="bg-card rounded-lg border text-sm">
                      {isEditing ? (
                        <div className="p-3 space-y-2">
                          <div className="flex gap-2">
                            <div className="w-16">
                              <Label className="text-xs">Day</Label>
                              <Input
                                type="number"
                                value={editForm.day ?? String(email.day ?? i + 1)}
                                onChange={e => setEditForm(f => ({ ...f, day: e.target.value }))}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs">Subject</Label>
                              <Input
                                value={editForm.subject ?? email.subject ?? ""}
                                onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Preview Text</Label>
                            <Input
                              value={editForm.preview ?? email.preview ?? ""}
                              onChange={e => setEditForm(f => ({ ...f, preview: e.target.value }))}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Email Body</Label>
                            <Textarea
                              value={editForm.body ?? email.body ?? ""}
                              onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))}
                              className="text-xs min-h-[100px] resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveEmail.mutate({ seqId: seq.id, idx: i, data: { ...editForm, day: parseInt(editForm.day ?? String(email.day ?? i + 1)) } })}
                              disabled={saveEmail.isPending}
                              className="bg-primary hover:bg-primary/90 text-white h-7 text-xs border-0"
                            >
                              {saveEmail.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingEmail(null)}>
                              <X className="w-3 h-3 mr-1" />Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 flex items-start gap-3">
                          <span className="text-xs font-bold text-primary bg-primary/5 rounded px-1.5 py-0.5 shrink-0">
                            Day {email.day ?? i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{email.subject ?? "No subject"}</p>
                            <p className="text-muted-foreground text-xs truncate mt-0.5">{email.preview ?? email.body?.slice(0, 80) ?? ""}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="text-xs bg-muted text-muted-foreground">{email.type ?? "email"}</Badge>
                            <button
                              onClick={() => {
                                setEditingEmail({ seqId: seq.id, idx: i });
                                setEditForm({});
                              }}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="text-right hidden sm:block">
      <p className={`text-sm font-bold ${highlight ? "text-green-600" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ── Broadcast ─────────────────────────────────────────────────────────────── */
function BroadcastTab({ toast }: { toast: any }) {
  const [form, setForm] = useState({ subject: "", body: "", fromName: "", sequenceId: "", segment: "active" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: sequences } = useQuery({
    queryKey: ["admin-email-sequences"],
    queryFn: () => apiClient.get("/admin/email/sequences").then(r => r.data),
  });

  const send = async () => {
    if (!form.subject || !form.body) {
      toast({ title: "Subject and body are required", variant: "destructive" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const r = await apiClient.post("/admin/email/broadcast", {
        subject: form.subject,
        body: form.body,
        fromName: form.fromName || "ViralCraft Studio",
        sequenceId: form.sequenceId || undefined,
        segment: form.segment,
      });
      setResult(r.data);
      toast({ title: `Broadcast sent to ${r.data.sent} subscribers!` });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Broadcast failed", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid md:grid-cols-5 gap-5">
      {/* Compose */}
      <div className="md:col-span-3 space-y-4">
        <Card className="border p-5 space-y-4">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> Compose Broadcast</h3>
            <p className="text-xs text-muted-foreground mt-1">Send a one-off email to all matching subscribers. Tracked for opens and clicks automatically.</p>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Audience</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Sequence (optional)</Label>
                <select
                  className="w-full h-9 border rounded-md px-3 text-sm bg-card"
                  value={form.sequenceId}
                  onChange={e => set("sequenceId", e.target.value)}
                >
                  <option value="">All sequences</option>
                  {(sequences ?? []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Subscriber status</Label>
                <select
                  className="w-full h-9 border rounded-md px-3 text-sm bg-card"
                  value={form.segment}
                  onChange={e => set("segment", e.target.value)}
                >
                  <option value="active">Active only</option>
                  <option value="completed">Completed sequence</option>
                  <option value="all">All (including completed)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">From Name</Label>
            <Input
              placeholder="ViralCraft Studio"
              value={form.fromName}
              onChange={e => set("fromName", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">Subject Line <span className="text-red-500">*</span></Label>
            <Input
              placeholder="🔥 Exclusive offer inside — don't miss this"
              value={form.subject}
              onChange={e => set("subject", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {form.subject.length} chars · {form.subject.length < 50 ? "✅ Good length" : "⚠️ Might get cut off on mobile"}
            </p>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Email Body <span className="text-red-500">*</span> (supports **bold**, *italic*, [links](url), ## headings)</Label>
            <Textarea
              placeholder={`Hi {{first_name}}! 👋\n\nI wanted to reach out personally with something special...\n\n**Here's what's happening:**\n\nWrite your message here. Be conversational. Tell a story. Add value.\n\n[Click here to learn more](https://yoursite.com)\n\nTo your success,\nYour Name`}
              value={form.body}
              onChange={e => set("body", e.target.value)}
              className="min-h-[240px] resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.body.split(/\s+/).filter(Boolean).length} words</p>
          </div>

          <Button
            onClick={send}
            disabled={sending || !form.subject || !form.body}
            className="bg-primary hover:bg-primary/90 text-white border-0 w-full"
          >
            {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Broadcast</>}
          </Button>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <p className="font-bold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Broadcast Sent!</p>
              <p className="text-green-700 mt-1">✅ {result.sent} delivered · ❌ {result.failed} failed · Total: {result.total}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Tips */}
      <div className="md:col-span-2 space-y-4">
        <Card className="border p-5">
          <h4 className="font-bold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" />High-Converting Email Tips</h4>
          <div className="space-y-3 text-xs text-muted-foreground">
            {[
              { emoji: "🎯", tip: "Open rate win: Use the recipient's name in subject line. \"Hey [Name], quick question...\" gets 26% more opens." },
              { emoji: "⚡", tip: "First 50 chars matter most. Put the hook first, benefit second, name last." },
              { emoji: "📱", tip: "70% read on mobile. Keep paragraphs short (2-3 lines max)." },
              { emoji: "🔥", tip: "One CTA only. Emails with a single call-to-action get 371% more clicks." },
              { emoji: "⏰", tip: "Best times: Tuesday–Thursday, 10am or 2pm in your audience's timezone." },
              { emoji: "🔁", tip: "Re-send with different subject to non-openers 48hrs later. Adds 30% more opens." },
            ].map((t, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-lg shrink-0">{t.emoji}</span>
                <p>{t.tip}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border p-5">
          <h4 className="font-bold text-foreground mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" />Subject Line Formulas</h4>
          <div className="space-y-2 text-xs">
            {[
              "\"You won't believe what [result] in [timeframe]\"",
              "\"[Number] things I wish I knew before [topic]\"",
              "\"Last chance: [offer] expires tonight\"",
              "\"Your [product] is waiting — here's how to use it\"",
              "\"The #1 mistake [audience] make with [topic]\"",
              "\"I made $X doing this — and so can you\"",
            ].map((s, i) => (
              <div key={i} className="bg-muted/30 rounded p-2 text-muted-foreground font-mono text-xs">{s}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Analytics ─────────────────────────────────────────────────────────────── */
function AnalyticsTab() {
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);

  const { data: sequences, isLoading } = useQuery({
    queryKey: ["admin-email-sequences"],
    queryFn: () => apiClient.get("/admin/email/sequences").then(r => r.data),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-email-analytics", selectedSeq],
    queryFn: () => apiClient.get(`/admin/email/sequences/${selectedSeq}/analytics`).then(r => r.data),
    enabled: !!selectedSeq,
  });

  if (isLoading) return <Spinner />;

  const seqs = sequences ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs mb-1 block">Select Sequence to Analyze</Label>
        <select
          className="h-9 border rounded-md px-3 text-sm bg-card w-full max-w-md"
          value={selectedSeq ?? ""}
          onChange={e => setSelectedSeq(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">— Choose a sequence —</option>
          {seqs.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name} ({s.totalSent} sent)</option>
          ))}
        </select>
      </div>

      {!selectedSeq && (
        <EmptyState icon={BarChart2} title="Select a sequence" desc="Choose a sequence above to see per-email performance analytics." />
      )}

      {selectedSeq && analyticsLoading && <Spinner />}

      {selectedSeq && analytics && !analyticsLoading && (
        <>
          {/* Sequence summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Sent", value: analytics.sequence.totalSent ?? 0 },
              { label: "Opened", value: analytics.sequence.totalOpened ?? 0 },
              { label: "Clicked", value: analytics.sequence.totalClicked ?? 0 },
              { label: "Unsubscribed", value: analytics.sequence.totalUnsubscribed ?? 0 },
              { label: "Subscribers", value: analytics.sequence.totalSubscribers ?? 0 },
            ].map(c => (
              <Card key={c.label} className="p-4 border text-center">
                <p className="text-2xl font-black text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              </Card>
            ))}
          </div>

          {/* Per-email table */}
          <Card className="border overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-bold text-foreground">Per-Email Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{analytics.perEmail.length} emails in sequence</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    {["Day", "Subject", "Type", "Sent", "Opens", "Open %", "Clicks", "Click %"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.perEmail.map((email: any) => (
                    <tr key={email.index} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-primary bg-primary/5 rounded px-1.5 py-0.5">Day {email.day}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{email.subject}</td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs bg-muted text-muted-foreground">{email.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{email.sent}</td>
                      <td className="px-4 py-3 text-muted-foreground">{email.opened}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${email.openRate}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${email.openRate >= 20 ? "text-green-600" : "text-muted-foreground"}`}>{email.openRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{email.clicked}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full">
                            <div className="h-1.5 bg-primary rounded-full" style={{ width: `${email.clickRate * 5}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${email.clickRate >= 3 ? "text-green-600" : "text-muted-foreground"}`}>{email.clickRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Best/worst performers */}
          {analytics.perEmail.length > 0 && (() => {
            const withData = analytics.perEmail.filter((e: any) => e.sent > 0);
            if (withData.length === 0) return null;
            const best = [...withData].sort((a: any, b: any) => b.openRate - a.openRate)[0];
            const worst = [...withData].sort((a: any, b: any) => a.openRate - b.openRate)[0];
            return (
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border p-5 bg-green-50 border-green-200">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Best Performer</h4>
                  <p className="text-sm font-semibold text-green-900">Day {best.day}: "{best.subject}"</p>
                  <p className="text-sm text-green-700 mt-1">{best.openRate}% open rate · {best.clickRate}% click rate</p>
                  <p className="text-xs text-green-600 mt-2">💡 Use this subject line style for future emails</p>
                </Card>
                <Card className="border p-5 bg-amber-50 border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Needs Improvement</h4>
                  <p className="text-sm font-semibold text-amber-900">Day {worst.day}: "{worst.subject}"</p>
                  <p className="text-sm text-amber-700 mt-1">{worst.openRate}% open rate · {worst.clickRate}% click rate</p>
                  <p className="text-xs text-amber-600 mt-2">💡 Edit this email's subject or resend to non-openers</p>
                </Card>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

/* ── Subscribers ──────────────────────────────────────────────────────────── */
function SubscribersTab() {
  const { data: subs, isLoading } = useQuery({
    queryKey: ["admin-email-subscribers"],
    queryFn: () => apiClient.get("/admin/email/subscribers").then(r => r.data),
    refetchInterval: 30000,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading) return <Spinner />;

  const allSubs: any[] = subs ?? [];
  let filtered = search
    ? allSubs.filter(s => s.email.includes(search) || (s.name ?? "").toLowerCase().includes(search.toLowerCase()))
    : allSubs;
  if (statusFilter !== "all") filtered = filtered.filter(s => s.status === statusFilter);

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    unsubscribed: "bg-muted text-muted-foreground",
    bounced: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-9 border rounded-md px-3 text-sm bg-card"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
        </select>
        <p className="text-sm text-muted-foreground">{filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}</p>
        <a
          href="/api/admin/email/subscribers/export.csv"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </a>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No subscribers found" desc="Buyers auto-enroll when they purchase a product with an active sequence." />
      ) : (
        <Card className="border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                {["Email", "Name", "Status", "Email #", "Next Send", "Subscribed"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.slice(0, 200).map((sub: any) => (
                <tr key={sub.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{sub.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${statusColor[sub.status] ?? "bg-muted text-muted-foreground"}`}>{sub.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">#{sub.currentEmailIndex + 1}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {sub.nextSendAt ? new Date(sub.nextSendAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(sub.subscribedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ── Global Settings ─────────────────────────────────────────────────────── */
function SettingsTab({ toast, qc }: { toast: any; qc: any }) {
  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin-email-settings"],
    queryFn: () => apiClient.get("/admin/email/settings").then(r => r.data),
  });

  const [form, setForm] = useState<Record<string, any>>({});
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const merged = { ...existing, ...form };

  const save = useMutation({
    mutationFn: () => apiClient.post("/admin/email/settings", merged),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-settings"] });
      toast({ title: "Settings saved!" });
    },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Save failed", variant: "destructive" }),
  });

  if (isLoading) return <Spinner />;

  const [socialUrl, setSocialUrl] = useState("");
  const [socialLabel, setSocialLabel] = useState("");
  const socialLinks: Array<{ label: string; url: string }> = merged.socialLinks ?? [];

  const addSocial = () => {
    if (!socialUrl || !socialLabel) return;
    set("socialLinks", [...socialLinks, { label: socialLabel, url: socialUrl }]);
    setSocialUrl(""); setSocialLabel("");
  };

  const removeSocial = (i: number) => {
    set("socialLinks", socialLinks.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Branding */}
      <Card className="border p-5 space-y-4">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />Email Branding</h3>
          <p className="text-xs text-muted-foreground mt-1">Applied to all outgoing emails globally</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1 block">Brand Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={merged.brandColor ?? "#7c3aed"}
                onChange={e => set("brandColor", e.target.value)}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <Input
                value={merged.brandColor ?? "#7c3aed"}
                onChange={e => set("brandColor", e.target.value)}
                className="flex-1"
                placeholder="#7c3aed"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Logo Text (header)</Label>
            <Input
              value={merged.logoText ?? ""}
              onChange={e => set("logoText", e.target.value)}
              placeholder="⚡ ViralCraft Studio"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Footer Text (supports HTML)</Label>
          <Textarea
            value={merged.footerText ?? ""}
            onChange={e => set("footerText", e.target.value)}
            placeholder="You're receiving this because you purchased from ViralCraft Studio"
            className="text-sm min-h-[60px] resize-none"
          />
        </div>
      </Card>

      {/* Send window */}
      <Card className="border p-5 space-y-4">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" />Sending Window</h3>
          <p className="text-xs text-muted-foreground mt-1">Emails will only be sent during this UTC hour range (avoids late-night sends)</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1 block">Start Hour (UTC)</Label>
            <select
              className="w-full h-9 border rounded-md px-3 text-sm bg-card"
              value={merged.sendHourStart ?? 6}
              onChange={e => set("sendHourStart", parseInt(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, "0")}:00 UTC</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">End Hour (UTC)</Label>
            <select
              className="w-full h-9 border rounded-md px-3 text-sm bg-card"
              value={merged.sendHourEnd ?? 22}
              onChange={e => set("sendHourEnd", parseInt(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i.toString().padStart(2, "0")}:00 UTC</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Tip: 06:00–22:00 UTC covers most US/Europe business hours effectively.</p>
      </Card>

      {/* Social Links */}
      <Card className="border p-5 space-y-4">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2"><Link2 className="w-4 h-4 text-green-600" />Footer Social Links</h3>
          <p className="text-xs text-muted-foreground mt-1">Shown at the bottom of every email</p>
        </div>
        <div className="space-y-2">
          {socialLinks.map((s, i) => (
            <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
              <span className="font-semibold text-sm text-foreground w-20 truncate">{s.label}</span>
              <span className="text-sm text-muted-foreground flex-1 truncate">{s.url}</span>
              <button onClick={() => removeSocial(i)} className="text-red-400 hover:text-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={socialLabel} onChange={e => setSocialLabel(e.target.value)} placeholder="Twitter" className="w-28" />
            <Input value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="https://twitter.com/..." className="flex-1" />
            <Button variant="outline" size="sm" onClick={addSocial}>Add</Button>
          </div>
        </div>
      </Card>

      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="bg-primary hover:bg-primary/90 text-white border-0 w-full"
      >
        {save.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save All Settings</>}
      </Button>
    </div>
  );
}

/* ── SMTP ────────────────────────────────────────────────────────────────── */
function SmtpTab({ toast, qc }: { toast: any; qc: any }) {
  const { data: smtp, isLoading } = useQuery({
    queryKey: ["admin-smtp"],
    queryFn: () => apiClient.get("/admin/email/smtp").then(r => r.data),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => apiClient.post("/admin/email/smtp", { ...smtp, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-smtp"] });
      qc.invalidateQueries({ queryKey: ["admin-email-stats"] });
      setForm({});
      toast({ title: "SMTP settings saved!" });
    },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Save failed", variant: "destructive" }),
  });

  const sendTest = async () => {
    if (!testEmail) { toast({ title: "Enter a test email address", variant: "destructive" }); return; }
    setTesting(true);
    try {
      await apiClient.post("/admin/email/smtp/test", { testEmail });
      toast({ title: "Test email sent! Check your inbox." });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Test failed", variant: "destructive" });
    } finally { setTesting(false); }
  };

  if (isLoading) return <Spinner />;
  const merged = { ...smtp, ...form };

  const fields = [
    { key: "host", label: "SMTP Host", placeholder: "smtp.gmail.com", type: "text" },
    { key: "port", label: "SMTP Port", placeholder: "587", type: "number" },
    { key: "user", label: "SMTP Username / Email", placeholder: "you@gmail.com", type: "text" },
    { key: "pass", label: "SMTP Password / App Password", placeholder: "••••••••", type: "password" },
    { key: "fromName", label: "From Name", placeholder: "ViralCraft Studio", type: "text" },
    { key: "fromEmail", label: "From Email", placeholder: "hello@yourdomain.com", type: "text" },
  ];

  return (
    <div className="space-y-5 max-w-xl">
      <Card className="border p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">SMTP Configuration</h3>
          <p className="text-xs text-muted-foreground mt-1">All outgoing emails — sequences, receipts, and broadcasts</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p><strong>Resend (recommended):</strong> Host: <code className="bg-blue-100 rounded px-1">smtp.resend.com</code>, Port: 587, User: <code className="bg-blue-100 rounded px-1">resend</code>, Pass: API key. Free 3k/mo.</p>
          <p><strong>Gmail:</strong> Enable 2FA → <a href="https://myaccount.google.com/apppasswords" className="underline" target="_blank" rel="noreferrer">App Passwords</a>. Host: <code className="bg-blue-100 rounded px-1">smtp.gmail.com</code>, Port: 587.</p>
          <p><strong>Mailgun:</strong> Host: <code className="bg-blue-100 rounded px-1">smtp.mailgun.org</code>, Port: 587. Free 1k/mo.</p>
        </div>

        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs mb-1 block">{f.label}</Label>
            <Input
              type={f.type}
              placeholder={f.placeholder}
              value={merged[f.key] ?? ""}
              onChange={e => setField(f.key, e.target.value)}
            />
          </div>
        ))}

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-primary hover:bg-primary/90 text-white border-0 w-full">
          {save.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save SMTP Settings"}
        </Button>
      </Card>

      <Card className="border p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Send Test Email</h3>
          <p className="text-xs text-muted-foreground mt-1">Verify your config is working before going live.</p>
        </div>
        <div className="flex gap-2">
          <Input type="email" placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          <Button onClick={sendTest} disabled={testing} variant="outline">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            {testing ? "" : "Test"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="p-12 text-center border">
      <Icon className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
      <p className="font-semibold text-muted-foreground">{title}</p>
      <p className="text-muted-foreground text-sm mt-1">{desc}</p>
    </Card>
  );
}
