import { useState, useEffect } from "react";
import { useListSettings, useUpdateSetting } from "@workspace/api-client-react";
import { getListSettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Mail, ToggleLeft, ToggleRight, Chrome, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Cloud, HardDrive, Image, Film, Music, ArrowUpRight, Wifi, WifiOff, LayoutDashboard, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

const SETTING_KEYS = [
  { key: "affiliate_link", label: "Affiliate / CTA Link", placeholder: "https://...", description: "Main affiliate or call-to-action URL on dashboard banner", textarea: false },
  { key: "ad_text", label: "Banner Ad Text", placeholder: "Click Here To Create your Digital Product in Minutes with AI", description: "Text displayed in the dashboard promotional banner", textarea: true },
  { key: "video_tool_link", label: "Video Tool Link", placeholder: "https://...", description: "Link for 'Create Video/Audio with this Content' button", textarea: false },
  { key: "support_email", label: "Support Email", placeholder: "support@example.com", description: "Email shown in support pages", textarea: false },
  { key: "platform_name", label: "Platform Name", placeholder: "ViralCraft Studio", description: "Name shown across the platform", textarea: false },
  { key: "pro_price", label: "Pro Subscription Price ($)", placeholder: "29", description: "Monthly Pro subscription price shown on upgrade prompts", textarea: false },
  { key: "min_withdrawal", label: "Minimum Withdrawal ($)", placeholder: "50", description: "Minimum amount users can withdraw from wallet", textarea: false },
  { key: "revenue_split", label: "Seller Revenue Split (%)", placeholder: "90", description: "Percentage of each sale that goes to the seller (default 90%)", textarea: false },
];

function GoogleOAuthCard({ settings, onSaved }: { settings: Record<string, string>; onSaved: () => void }) {
  const { toast } = useToast();
  const updateSetting = useMutation({
    mutationFn: (updates: { key: string; value: string }[]) =>
      apiClient.patch("/settings", { updates }),
    onSuccess: onSaved,
  });
  const [clientId, setClientId] = useState(settings["google_client_id"] ?? "");
  const [showId, setShowId] = useState(false);

  const isConfigured = !!(settings["google_client_id"] ?? "").trim();
  const isDirty = clientId !== (settings["google_client_id"] ?? "");

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync([{ key: "google_client_id", value: clientId.trim() }]);
      toast({ title: clientId.trim() ? "Google sign-in enabled" : "Google sign-in disabled" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  return (
    <Card className="p-5 border space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Chrome className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Google Sign-In</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Let users log in with their Google account</p>
          </div>
        </div>
        {isConfigured ? (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5 flex-shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Enabled
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground gap-1.5 flex-shrink-0">
            <XCircle className="w-3 h-3" /> Disabled
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="google-client-id" className="text-sm font-medium">Google OAuth Client ID</Label>
        <div className="relative">
          <Input
            id="google-client-id"
            type={showId ? "text" : "password"}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="123456789-abcde.apps.googleusercontent.com"
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowId((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
          >
            {showId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Get this from{" "}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Google Cloud Console
          </a>{" "}
          → APIs &amp; Services → Credentials → OAuth 2.0 Client ID (Web application). Add{" "}
          <code className="bg-muted px-1 rounded text-xs">{window.location.origin}</code> to <strong>Authorized JavaScript origins</strong>.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={!isDirty || updateSetting.isPending} size="sm" className="gap-1.5">
          {updateSetting.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
        {isConfigured && (
          <Button
            variant="outline" size="sm"
            disabled={updateSetting.isPending}
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { setClientId(""); updateSetting.mutate([{ key: "google_client_id", value: "" }]); }}
          >
            Disable
          </Button>
        )}
      </div>
    </Card>
  );
}

const TOOL_CATEGORY_COLORS: Record<string, string> = {
  "Core":          "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  "AI Tools":      "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
  "Video & Voice": "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
  "Automation":    "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  "Developer":     "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800",
  "Store":         "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  "Growth":        "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
};

const WORKS_WITHOUT_VOICE = ["product_generator", "prompt_generator", "content_generator", "store", "affiliate", "trending", "marketplace", "landing_page", "thumbnails", "scripts", "pdf_studio", "course_generator"];
const NEEDS_VOICE = ["video_agent", "voice", "video_modeler"];

function DashboardToolsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ flags: Record<string, boolean>; tools: any[] }>({
    queryKey: ["tool-flags-admin"],
    queryFn: () => apiClient.get("/tool-flags").then(r => r.data),
    staleTime: 10_000,
  });

  const toggleMut = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiClient.patch(`/admin/tool-flags/${key}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tool-flags-admin"] });
      queryClient.invalidateQueries({ queryKey: ["tool-flags"] });
    },
    onError: () => toast({ title: "Failed to update tool", variant: "destructive" }),
  });

  const resetMut = useMutation({
    mutationFn: () => apiClient.post("/admin/tool-flags/reset", {}),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tool-flags"] });
      toast({ title: "Reset to defaults" });
    },
  });

  const enableAllMoney = useMutation({
    mutationFn: () => apiClient.put("/admin/tool-flags", {
      flags: Object.fromEntries(
        (data?.tools ?? []).map(t => [t.key, WORKS_WITHOUT_VOICE.includes(t.key)])
      ),
    }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tool-flags"] });
      toast({ title: "Enabled all money-making tools (no voice engine required)" });
    },
  });

  const flags = data?.flags ?? {};
  const tools = data?.tools ?? [];

  const categories = [...new Set(tools.map(t => t.category))];

  return (
    <Card className="p-5 border space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Dashboard Tools</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Control which tools appear in the sidebar and dashboard. Hiding a tool removes it everywhere — sidebar, dashboard cards, and nav links.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm" variant="outline"
            onClick={() => enableAllMoney.mutate()}
            disabled={enableAllMoney.isPending || isLoading}
            className="text-xs gap-1.5"
          >
            {enableAllMoney.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            Money Tools Only
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={() => resetMut.mutate()}
            disabled={resetMut.isPending || isLoading}
            className="text-xs gap-1.5"
          >
            {resetMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Reset
          </Button>
        </div>
      </div>

      {/* Voice engine notice */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>⚡ Currently on free hosting:</strong> Tools marked "Needs voice engine" require a separate Python server running on port 8099. Keep them OFF until you have stable hosting.
          Tools with no badge work fully on Vercel free tier.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map(cat => {
            const catTools = tools.filter(t => t.category === cat);
            const colorClass = TOOL_CATEGORY_COLORS[cat] ?? "bg-muted/50 border-border";
            return (
              <div key={cat}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
                <div className={`border rounded-xl overflow-hidden divide-y divide-border ${colorClass.includes("bg-") ? "" : ""}`}>
                  {catTools.map(tool => {
                    const enabled = flags[tool.key] !== false;
                    const needsVoice = NEEDS_VOICE.includes(tool.key);
                    const pending = toggleMut.isPending && (toggleMut.variables as any)?.key === tool.key;
                    return (
                      <div key={tool.key} className="flex items-center justify-between gap-4 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{tool.label}</span>
                            {needsVoice && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                Needs voice engine
                              </span>
                            )}
                            {!needsVoice && !WORKS_WITHOUT_VOICE.includes(tool.key) && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                Complex
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{tool.description}</p>
                        </div>
                        <button
                          onClick={() => toggleMut.mutate({ key: tool.key, enabled: !enabled })}
                          disabled={pending}
                          className={`flex-shrink-0 transition-all ${enabled ? "text-primary" : "text-muted-foreground/40"} disabled:opacity-50`}
                          title={enabled ? "Click to disable" : "Click to enable"}
                        >
                          {pending
                            ? <Loader2 className="w-8 h-8 animate-spin" />
                            : enabled
                            ? <ToggleRight className="w-10 h-10" />
                            : <ToggleLeft className="w-10 h-10" />
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Changes apply immediately — no page reload needed. Users already logged in will see changes on their next page navigation.
      </p>
    </Card>
  );
}

function fmtBytesR2(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function CloudflareR2Card() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const statusQ = useQuery<any>({
    queryKey: ["r2-status"],
    queryFn: () => apiClient.get("/admin/r2/status").then(r => r.data),
    staleTime: 30_000,
  });

  const statsQ = useQuery<any>({
    queryKey: ["r2-stats"],
    queryFn: () => apiClient.get("/admin/r2/stats").then(r => r.data),
    staleTime: 60_000,
    enabled: statusQ.data?.connected === true,
  });

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const { data } = await apiClient.get("/admin/r2/status");
      const ok = data?.connected === true;
      setTestResult(ok ? "ok" : "fail");
      toast({
        title: ok ? "✅ R2 connected!" : `❌ ${data?.error ?? "Connection failed"}`,
        variant: ok ? "default" : "destructive",
      });
    } catch {
      setTestResult("fail");
      toast({ title: "Connection test failed", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const status = statusQ.data;
  const stats = status?.connected ? statsQ.data : null;
  const connected = status?.connected;
  const configured = status?.configured;

  return (
    <Card className="border overflow-hidden">
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-5 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='white'/%3E%3C/svg%3E\")" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cloudflare R2 Storage</h3>
              <p className="text-white/75 text-sm mt-0.5">Zero-egress CDN for images, videos, audio & PDFs</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            connected === true
              ? "bg-emerald-400/30 text-white border-emerald-300/40"
              : connected === false
              ? "bg-red-400/30 text-white border-red-300/40"
              : "bg-white/20 text-white/80 border-white/20"
          }`}>
            {statusQ.isLoading
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Checking…</>
              : connected === true
              ? <><Wifi className="w-3 h-3" /> Connected</>
              : connected === false
              ? <><WifiOff className="w-3 h-3" /> Error</>
              : <><XCircle className="w-3 h-3" /> Not configured</>
            }
          </div>
        </div>

        {connected && stats && (
          <div className="relative mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: HardDrive, label: "Total Size", value: fmtBytesR2(stats.totalBytes ?? 0) },
              { icon: Image,     label: "Images",     value: ((stats.byFolder?.images?.count ?? 0) + (stats.byFolder?.thumbnails?.count ?? 0) + (stats.byFolder?.["hero-images"]?.count ?? 0)).toLocaleString() },
              { icon: Film,      label: "Videos",     value: (stats.byFolder?.videos?.count ?? 0).toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-white/70" />
                  <span className="text-white/70 text-[10px] font-medium uppercase tracking-wide">{label}</span>
                </div>
                <p className="text-white font-bold text-lg leading-none">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {connected === false && status?.error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <p className="text-xs text-red-700 dark:text-red-400 font-mono">{status.error}</p>
          </div>
        )}

        {!configured && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-xs text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">R2 credentials not found in environment</p>
            <p>Set these environment variables on your server/hosting platform:</p>
            <ul className="list-disc list-inside space-y-0.5 font-mono mt-1">
              <li>CLOUDFLARE_R2_ACCOUNT_ID</li>
              <li>CLOUDFLARE_R2_ACCESS_KEY_ID</li>
              <li>CLOUDFLARE_R2_SECRET_ACCESS_KEY</li>
              <li>CLOUDFLARE_R2_BUCKET_NAME</li>
              <li>CLOUDFLARE_R2_PUBLIC_DOMAIN</li>
            </ul>
          </div>
        )}

        {configured && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 space-y-0.5">
            {status?.bucketName && <p><span className="font-medium">Bucket:</span> {status.bucketName}</p>}
            {status?.accountId && <p><span className="font-medium">Account:</span> {status.accountId}</p>}
            {status?.publicDomain && <p><span className="font-medium">Domain:</span> {status.publicDomain}</p>}
            <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">✓ Credentials loaded from environment variables</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { statusQ.refetch(); statsQ.refetch(); }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
          >
            <Loader2 className={`w-3 h-3 ${statusQ.isFetching ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
          <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || !configured} className="gap-1.5 text-xs">
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : testResult === "ok" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : testResult === "fail" ? <XCircle className="w-3 h-3 text-red-500" /> : <Wifi className="w-3 h-3" />}
            Test Connection
          </Button>
          <a href="/admin/media" target="_self">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <ArrowUpRight className="w-3 h-3" /> Open Media Library
            </Button>
          </a>
        </div>

        {connected && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {[
              { icon: Image,     label: "AI cover images", desc: "Auto-uploaded to R2" },
              { icon: Image,     label: "Hero images",     desc: "Landing page assets" },
              { icon: Image,     label: "Thumbnails",      desc: "Product & video thumbnails" },
              { icon: Film,      label: "Videos (MP4)",    desc: "Rendered videos on CDN" },
              { icon: Music,     label: "Audio (WAV)",     desc: "Generated voice audio" },
              { icon: HardDrive, label: "User uploads",    desc: "All file uploads" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [changed, setChanged] = useState(false);
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);
  const [emailVerifChanged, setEmailVerifChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: settings } = useListSettings({ query: { queryKey: getListSettingsQueryKey() } });
  const updateSettings = useUpdateSetting();

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      settings.forEach((s: any) => { vals[s.key] = s.value; });
      setValues(vals);
      const emailVerif = settings.find((s: any) => s.key === "email_verification_required");
      setEmailVerificationEnabled(emailVerif?.value === "true");
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setChanged(true);
  };

  const handleSave = () => {
    const updates = SETTING_KEYS
      .filter(({ key }) => values[key] !== undefined)
      .map(({ key }) => ({ key, value: values[key] }));

    if (emailVerifChanged) {
      updates.push({ key: "email_verification_required", value: emailVerificationEnabled ? "true" : "false" });
    }

    updateSettings.mutate({ data: { updates } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
        toast({ title: "Settings saved" });
        setChanged(false);
        setEmailVerifChanged(false);
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  const toggleEmailVerification = () => {
    setEmailVerificationEnabled(prev => !prev);
    setEmailVerifChanged(true);
    setChanged(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground text-sm">Global configuration and links</p>
        </div>
        <Button onClick={handleSave} disabled={!changed || updateSettings.isPending} size="sm">
          <Save className="w-4 h-4 mr-1" />
          Save Changes
        </Button>
      </div>

      {/* Email Verification */}
      <Card className="p-5 border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Email Verification Requirement</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                When enabled, new users must verify their email before logging in. Existing unverified users are blocked from login until verified.
              </p>
              <p className={`text-xs font-medium mt-2 ${emailVerificationEnabled ? "text-green-600" : "text-muted-foreground"}`}>
                Status: {emailVerificationEnabled ? "🔒 Required — users must verify email" : "🔓 Not required — users can log in without verification"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleEmailVerification}
            className={`flex-shrink-0 transition-all ${emailVerificationEnabled ? "text-blue-600" : "text-muted-foreground/60"}`}
          >
            {emailVerificationEnabled
              ? <ToggleRight className="w-10 h-10" />
              : <ToggleLeft className="w-10 h-10" />}
          </button>
        </div>
      </Card>

      {/* Dashboard Tools */}
      <DashboardToolsCard />

      {/* Google OAuth */}
      <GoogleOAuthCard
        settings={values}
        onSaved={() => queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() })}
      />

      {/* Cloudflare R2 Storage */}
      <CloudflareR2Card />

      {/* General Settings */}
      <Card className="p-6 border space-y-5">
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">General Settings</h3>
        {SETTING_KEYS.map(({ key, label, placeholder, description, textarea }) => (
          <div key={key}>
            <Label className="text-sm font-medium text-foreground mb-1 block">{label}</Label>
            {textarea ? (
              <Textarea
                placeholder={placeholder}
                value={values[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                rows={2}
              />
            ) : (
              <Input
                placeholder={placeholder}
                value={values[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
