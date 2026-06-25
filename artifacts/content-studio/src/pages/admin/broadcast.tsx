import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Send, Users, Crown, UserX, Globe,
  AlertTriangle, CheckCircle2, Loader2, Mail,
} from "lucide-react";

type Segment = "all" | "free" | "pro" | "inactive";

const SEGMENTS: { value: Segment; label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: "all", label: "All Users", description: "Every non-admin account", icon: Globe, color: "text-blue-600" },
  { value: "free", label: "Free Users", description: "Active accounts on the free plan", icon: Users, color: "text-muted-foreground" },
  { value: "pro", label: "Pro Users", description: "Active accounts with a Pro subscription", icon: Crown, color: "text-amber-600" },
  { value: "inactive", label: "Inactive Users", description: "Deactivated / churned accounts", icon: UserX, color: "text-red-600" },
];

const TEMPLATES = [
  {
    label: "New Feature",
    subject: "🚀 New Feature: [Feature Name] is Live!",
    body: "We just shipped something we think you're going to love.\n\n[Describe the feature and its benefit to the user in 2-3 sentences.]\n\nLog in now to try it out — it's available to all users starting today.\n\nLet us know what you think by replying to this email.",
  },
  {
    label: "Pro Upgrade",
    subject: "⚡ Unlock More With ViralCraft Pro",
    body: "You've been creating content with ViralCraft Studio — and we want to help you do even more.\n\nWith Pro you get:\n- Unlimited AI content generation\n- PDF product creation & your own store\n- Advanced viral campaign tools\n- Priority support\n\nUpgrade today for $29/month. Cancel anytime.",
  },
  {
    label: "Re-engagement",
    subject: "We miss you — here's what's new at ViralCraft",
    body: "It's been a while since we've seen you, and a lot has changed.\n\nWe've added [list 2-3 recent updates] since you last logged in.\n\nCome back and give it a try — your account is still active and ready to go.",
  },
  {
    label: "Maintenance",
    subject: "📢 Scheduled Maintenance — [Date]",
    body: "We'll be performing scheduled maintenance on [date] from [time] to [time] UTC.\n\nDuring this window, ViralCraft Studio may be briefly unavailable.\n\nWe apologize for any inconvenience. All your data is safe and will be fully accessible after maintenance is complete.",
  },
];

export default function AdminBroadcast() {
  const { toast } = useToast();
  const [segment, setSegment] = useState<Segment>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [smtpMissing, setSmtpMissing] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCountLoading(true);
    apiClient.get(`/broadcast/preview-count?segment=${segment}`)
      .then((r) => { if (!cancelled) setRecipientCount(r.data.count); })
      .catch(() => { if (!cancelled) setRecipientCount(null); })
      .finally(() => { if (!cancelled) setCountLoading(false); });
    return () => { cancelled = true; };
  }, [segment]);

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setSubject(t.subject);
    setBody(t.body);
    setResult(null);
    setSmtpMissing(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and body are required", variant: "destructive" });
      return;
    }
    if (!confirm(`Send this email to ${recipientCount ?? "?"} recipients? This cannot be undone.`)) return;

    setSending(true);
    setResult(null);
    setSmtpMissing(false);

    try {
      const r = await apiClient.post("/broadcast", { subject, body, segment });
      setResult(r.data);
      toast({ title: `Sent to ${r.data.sent} users${r.data.failed ? ` (${r.data.failed} failed)` : ""}` });
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.error === "smtp_not_configured") {
        setSmtpMissing(true);
      } else {
        toast({ title: errData?.error ?? "Send failed", variant: "destructive" });
      }
    } finally {
      setSending(false);
    }
  };

  const charCount = body.length;
  const selectedSeg = SEGMENTS.find((s) => s.value === segment)!;
  const SegIcon = selectedSeg.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Broadcast Email</h1>
        <p className="text-muted-foreground text-sm mt-1">Send an announcement to a segment of your users</p>
      </div>

      {/* SMTP warning */}
      {smtpMissing && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">SMTP not configured</p>
              <p className="text-xs text-amber-700 leading-relaxed mb-2">
                To send emails, add these environment variables to your project:
              </p>
              <div className="font-mono text-xs bg-card border border-amber-200 rounded p-2 space-y-0.5 text-foreground">
                <p>SMTP_HOST=smtp.yourdomain.com</p>
                <p>SMTP_PORT=587</p>
                <p>SMTP_USER=your@email.com</p>
                <p>SMTP_PASS=yourpassword</p>
                <p>SMTP_FROM=noreply@yourdomain.com</p>
              </div>
              <p className="text-xs text-amber-600 mt-2">Works with Gmail, Mailgun, SendGrid, Resend, and any SMTP provider.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Success result */}
      {result && (
        <Card className={`p-4 border ${result.failed === 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex gap-3">
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${result.failed === 0 ? "text-green-600" : "text-amber-600"}`} />
            <div>
              <p className="text-sm font-semibold text-foreground">Broadcast sent</p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-green-700 font-medium">✓ {result.sent} delivered</span>
                {result.failed > 0 && <span className="text-xs text-red-600 font-medium">✗ {result.failed} failed</span>}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Compose */}
        <div className="lg:col-span-2 space-y-5">
          {/* Segment */}
          <Card className="p-4 border space-y-3">
            <p className="text-sm font-semibold text-foreground">Recipient Segment</p>
            <div className="grid grid-cols-2 gap-2">
              {SEGMENTS.map((seg) => {
                const Icon = seg.icon;
                const active = segment === seg.value;
                return (
                  <button
                    key={seg.value}
                    onClick={() => setSegment(seg.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      active
                        ? "border-purple-500 bg-primary/5 ring-1 ring-purple-400"
                        : "border bg-card hover:border"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${active ? "text-primary" : seg.color}`} />
                      <span className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{seg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{seg.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <SegIcon className={`w-4 h-4 ${selectedSeg.color}`} />
              {countLoading ? (
                <span className="text-xs text-muted-foreground">Counting…</span>
              ) : recipientCount !== null ? (
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold">{recipientCount}</span> recipient{recipientCount !== 1 ? "s" : ""} will receive this email
                </span>
              ) : null}
            </div>
          </Card>

          {/* Compose */}
          <Card className="p-4 border space-y-4">
            <p className="text-sm font-semibold text-foreground">Compose Email</p>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject line</Label>
              <Input
                id="subject"
                placeholder="e.g. New feature alert 🚀"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground">{subject.length}/150</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message body</Label>
              <Textarea
                id="body"
                placeholder="Write your message here. Use plain text — we'll style it automatically. Each line becomes a paragraph."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[220px] font-mono text-sm leading-relaxed resize-y"
              />
              <p className="text-xs text-muted-foreground">{charCount} characters</p>
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || recipientCount === 0}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send to {recipientCount ?? "…"} {selectedSeg.label}</>
              )}
            </Button>
          </Card>
        </div>

        {/* Right — Templates + Preview */}
        <div className="space-y-5">
          <Card className="p-4 border space-y-3">
            <p className="text-sm font-semibold text-foreground">Quick Templates</p>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left px-3 py-2.5 rounded-md border border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">{t.label}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 border space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Email Preview</p>
            </div>
            {subject || body ? (
              <div className="rounded-lg border border bg-muted/30 overflow-hidden text-xs">
                <div className="bg-purple-700 px-3 py-2">
                  <p className="text-white font-bold text-sm">⚡ ViralCraft Studio</p>
                </div>
                <div className="p-3 space-y-2">
                  {subject && <p className="font-bold text-foreground text-sm">{subject}</p>}
                  <p className="text-muted-foreground">Hi [Name],</p>
                  {body.split("\n").slice(0, 6).map((line, i) => (
                    <p key={i} className="text-muted-foreground leading-relaxed">{line || <>&nbsp;</>}</p>
                  ))}
                  {body.split("\n").length > 6 && (
                    <p className="text-muted-foreground italic">…and {body.split("\n").length - 6} more lines</p>
                  )}
                  <div className="mt-2">
                    <span className="bg-primary text-white rounded px-2 py-1 text-xs font-medium">Open ViralCraft Studio →</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Fill in the subject and body to see a preview</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
