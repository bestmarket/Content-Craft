import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Percent, Users, TrendingUp, CheckCircle, XCircle,
  Loader2, Settings, BarChart2, ArrowUpRight, ArrowDownLeft,
  Award, Layers, AlertTriangle, RefreshCw, CreditCard, Wallet,
  Save, Crown, ShieldCheck, Zap, PieChart, Activity
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart2 },
  { id: "config", label: "Revenue Config", icon: Settings },
  { id: "transactions", label: "Transactions", icon: Activity },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "leaderboard", label: "Creator Leaderboard", icon: Award },
];

export default function AdminRevenue() {
  const [tab, setTab] = useState("overview");
  const { toast } = useToast();
  const qc = useQueryClient();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue Sharing Engine</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Intelligent revenue splits applied automatically to every sale · real-time wallet credits · affiliate payouts
        </p>
      </div>

      <div className="flex flex-wrap gap-1 bg-muted rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "config" && <ConfigTab toast={toast} qc={qc} />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "payouts" && <PayoutsTab toast={toast} qc={qc} />}
      {tab === "leaderboard" && <LeaderboardTab toast={toast} qc={qc} />}
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-revenue-stats"],
    queryFn: () => apiClient.get("/admin/revenue/stats").then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <Spinner />;

  const t = stats?.totals ?? {};
  const monthly: any[] = stats?.monthly ?? [];
  const maxGross = Math.max(...monthly.map((m: any) => m.gross ?? 0), 1);

  return (
    <div className="space-y-5">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Gross Revenue", value: `$${fmt(t.gross ?? 0)}`, icon: DollarSign, color: "text-muted-foreground bg-muted", big: true },
          { label: "Creator Payouts", value: `$${fmt(t.creator ?? 0)}`, icon: ArrowUpRight, color: "text-green-600 bg-green-50" },
          { label: "Platform Revenue", value: `$${fmt(t.platformNet ?? 0)}`, icon: ShieldCheck, color: "text-primary bg-primary/5" },
          { label: "Affiliate Commissions", value: `$${fmt(t.affiliate ?? 0)}`, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Pending Payouts", value: `$${fmt(stats?.pendingPayouts?.total ?? 0)}`, icon: Wallet, color: "text-amber-600 bg-amber-50" },
        ].map(c => (
          <Card key={c.label} className="p-5 border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className={`font-extrabold text-foreground ${c.big ? "text-2xl" : "text-xl"}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue distribution donut-style */}
      {t.gross > 0 && (
        <Card className="p-6 border">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-primary" />Revenue Distribution</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Goes to Creators", amount: t.creator ?? 0, pct: t.gross > 0 ? Math.round((t.creator / t.gross) * 100) : 0, color: "bg-green-500", textColor: "text-green-700" },
              { label: "Platform Revenue", amount: t.platformNet ?? 0, pct: t.gross > 0 ? Math.round((t.platformNet / t.gross) * 100) : 0, color: "bg-primary", textColor: "text-primary" },
              { label: "Affiliate Commissions", amount: t.affiliate ?? 0, pct: t.gross > 0 ? Math.round((t.affiliate / t.gross) * 100) : 0, color: "bg-blue-500", textColor: "text-blue-700" },
            ].map(d => (
              <div key={d.label} className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${d.color}`} />
                  <p className="text-xs font-semibold text-muted-foreground">{d.label}</p>
                </div>
                <p className={`text-2xl font-black ${d.textColor}`}>{d.pct}%</p>
                <p className="text-sm text-muted-foreground mt-1">${fmt(d.amount)} total</p>
                <div className="mt-3 h-2 bg-muted rounded-full">
                  <div className={`h-2 ${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Monthly revenue chart */}
      {monthly.length > 0 && (
        <Card className="p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Monthly Revenue (Last 6 Months)</h3>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthly.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "120px" }}>
                  <div className="w-full flex flex-col justify-end gap-0.5 h-full">
                    <div
                      className="w-full bg-green-400 rounded-t opacity-80"
                      style={{ height: `${Math.round(((m.creator ?? 0) / maxGross) * 100)}%` }}
                      title={`Creator: $${fmt(m.creator ?? 0)}`}
                    />
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${Math.round(((m.platform_fee ?? 0) / maxGross) * 100)}%` }}
                      title={`Platform: $${fmt(m.platform_fee ?? 0)}`}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{m.month?.slice(5)}</p>
                <p className="text-xs font-bold text-muted-foreground">${fmt(m.gross ?? 0)}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-400" /><span className="text-xs text-muted-foreground">Creator earnings</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary" /><span className="text-xs text-muted-foreground">Platform fee</span></div>
          </div>
        </Card>
      )}

      {/* By tier breakdown */}
      {(stats?.byTier?.length > 0) && (
        <Card className="p-6 border">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-600" />Revenue by Creator Tier</h3>
          <div className="space-y-3">
            {(stats.byTier as any[]).map((tier: any) => (
              <div key={tier.seller_tier} className="flex items-center gap-4 bg-muted/30 rounded-xl p-4">
                <TierBadge tier={tier.seller_tier} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground capitalize">{tier.seller_tier} tier</span>
                    <span className="text-sm font-bold text-foreground">${fmt(tier.gross ?? 0)} gross</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Creators: <strong className="text-green-700">${fmt(tier.creator ?? 0)}</strong></span>
                    <span>Platform: <strong className="text-primary">${fmt(tier.platform_fee ?? 0)}</strong></span>
                    <span>Affiliates: <strong className="text-blue-700">${fmt(tier.affiliate ?? 0)}</strong></span>
                    <span className="ml-auto">{tier.tx_count} sales</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {t.gross === 0 && (
        <Card className="p-12 text-center border">
          <DollarSign className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No revenue data yet</p>
          <p className="text-muted-foreground text-sm mt-1">Revenue splits are recorded automatically when products are sold through Paddle or Lemon Squeezy.</p>
        </Card>
      )}
    </div>
  );
}

/* ── Config ───────────────────────────────────────────────────────────────── */
function ConfigTab({ toast, qc }: { toast: any; qc: any }) {
  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-revenue-config"],
    queryFn: () => apiClient.get("/admin/revenue/config").then(r => r.data),
  });

  const [form, setForm] = useState<any>({});
  const merged = { ...config, ...form, tiers: { ...config?.tiers, ...form?.tiers } };

  const setTier = (tier: string, field: string, val: string) => {
    const num = parseFloat(val);
    const other = field === "creatorShare" ? "platformFee" : "creatorShare";
    const otherVal = (100 - num);
    setForm((f: any) => ({
      ...f,
      tiers: {
        ...(f.tiers ?? {}),
        [tier]: {
          ...(config?.tiers?.[tier] ?? {}),
          ...(f.tiers?.[tier] ?? {}),
          [field]: num,
          [other]: otherVal,
        },
      },
    }));
  };

  const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => apiClient.post("/admin/revenue/config", merged),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-revenue-config"] });
      qc.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
      setForm({});
      toast({ title: "Revenue config saved! All future sales will use these splits." });
    },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Save failed", variant: "destructive" }),
  });

  if (isLoading) return <Spinner />;

  const tiers = [
    { key: "free", label: "Free Tier", icon: Zap, color: "border", badgeColor: "bg-muted text-foreground" },
    { key: "pro", label: "Pro Tier", icon: Crown, color: "border-primary/30", badgeColor: "bg-primary/10 text-primary" },
    { key: "enterprise", label: "Enterprise Tier", icon: ShieldCheck, color: "border-amber-200", badgeColor: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Tier splits */}
      <Card className="border p-5">
        <div className="mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Creator/Platform Splits by Tier</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Applied automatically at checkout based on the seller's subscription tier. Creator share + Platform fee must always equal 100%.
          </p>
        </div>

        <div className="space-y-4">
          {tiers.map(t => {
            const tierCfg = merged?.tiers?.[t.key] ?? { creatorShare: 70, platformFee: 30 };
            const creator = tierCfg.creatorShare ?? 70;
            const platform = tierCfg.platformFee ?? 30;

            return (
              <div key={t.key} className={`border ${t.color} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <t.icon className="w-4 h-4" />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badgeColor}`}>{t.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    On a $100 sale: Creator <strong className="text-green-600">${creator}</strong> · Platform <strong className="text-primary">${platform}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs mb-1 block text-green-700">Creator Share %</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range" min="50" max="99" step="1"
                        value={creator}
                        onChange={e => setTier(t.key, "creatorShare", e.target.value)}
                        className="flex-1 accent-green-500"
                      />
                      <span className="text-lg font-black text-green-700 w-12 text-right">{creator}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block text-primary">Platform Fee %</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range" min="1" max="50" step="1"
                        value={platform}
                        onChange={e => setTier(t.key, "platformFee", e.target.value)}
                        className="flex-1 accent-purple-500"
                      />
                      <span className="text-lg font-black text-primary w-12 text-right">{platform}%</span>
                    </div>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-3 h-4 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-400 transition-all" style={{ width: `${creator}%` }} />
                  <div className="h-full bg-primary transition-all" style={{ width: `${platform}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Affiliate pool */}
      <Card className="border p-5">
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-600" />Affiliate Commission Pool</h3>
        <p className="text-xs text-muted-foreground mb-4">% of the platform fee that is automatically paid to affiliates (referrers). Only applies when the seller was referred by an affiliate.</p>
        <div className="flex gap-4 items-center">
          <input
            type="range" min="0" max="80" step="5"
            value={merged?.affiliatePoolPct ?? 30}
            onChange={e => setField("affiliatePoolPct", parseInt(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-xl font-black text-blue-700 w-14 text-right">{merged?.affiliatePoolPct ?? 30}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Example (pro tier, $100 sale): Platform fee = $15 → Affiliate gets {((15 * (merged?.affiliatePoolPct ?? 30)) / 100).toFixed(2)} → Platform net = ${(15 * (1 - (merged?.affiliatePoolPct ?? 30) / 100)).toFixed(2)}
        </p>
      </Card>

      {/* Subscription fee */}
      <Card className="border p-5">
        <h3 className="font-bold text-foreground flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-amber-600" />Subscription Revenue Fee</h3>
        <p className="text-xs text-muted-foreground mb-4">% the platform keeps from monthly subscription payments.</p>
        <div className="flex gap-4 items-center">
          <input
            type="range" min="5" max="50" step="5"
            value={merged?.subscriptionFeePct ?? 25}
            onChange={e => setField("subscriptionFeePct", parseInt(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="text-xl font-black text-amber-700 w-14 text-right">{merged?.subscriptionFeePct ?? 25}%</span>
        </div>
      </Card>

      {/* Payout settings */}
      <Card className="border p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Wallet className="w-4 h-4 text-green-600" />Payout Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1 block">Minimum Payout ($)</Label>
            <Input
              type="number"
              value={merged?.minimumPayout ?? 50}
              onChange={e => setField("minimumPayout", parseFloat(e.target.value))}
              placeholder="50"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Auto-approve Below ($) <span className="text-muted-foreground">(0 = manual only)</span></Label>
            <Input
              type="number"
              value={merged?.autoApproveBelow ?? 0}
              onChange={e => setField("autoApproveBelow", parseFloat(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Payout Schedule</Label>
          <select
            className="w-full h-9 border rounded-md px-3 text-sm bg-card"
            value={merged?.payoutSchedule ?? "on-demand"}
            onChange={e => setField("payoutSchedule", e.target.value)}
          >
            <option value="on-demand">On-demand (creator requests)</option>
            <option value="weekly">Weekly (auto)</option>
            <option value="monthly">Monthly (auto)</option>
          </select>
        </div>
      </Card>

      {/* Live preview */}
      <Card className="border p-5 bg-gradient-to-br from-purple-50 to-slate-50">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Percent className="w-4 h-4 text-primary" />Live Split Preview — $100 Sale</h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {tiers.map(t => {
            const tierCfg = merged?.tiers?.[t.key] ?? { creatorShare: 70, platformFee: 30 };
            const creator = tierCfg.creatorShare ?? 70;
            const platform = tierCfg.platformFee ?? 30;
            const affPool = merged?.affiliatePoolPct ?? 30;
            const affAmt = (platform * affPool) / 100;
            const platformNet = platform - affAmt;
            return (
              <div key={t.key} className="bg-card rounded-xl p-4 border">
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-3 ${t.badgeColor}`}>{t.label}</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross sale</span>
                    <span className="font-bold">$100.00</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>→ Creator ({creator}%)</span>
                    <strong>${creator.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>→ Affiliate ({affPool}% of fee)</span>
                    <strong>${affAmt.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>→ Platform net</span>
                    <strong>${platformNet.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="bg-primary hover:bg-primary/90 text-white border-0 w-full"
      >
        {save.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Revenue Config</>}
      </Button>
    </div>
  );
}

/* ── Transactions ─────────────────────────────────────────────────────────── */
function TransactionsTab() {
  const { data: txns, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-revenue-transactions"],
    queryFn: () => apiClient.get("/admin/revenue/transactions").then(r => r.data),
  });

  if (isLoading) return <Spinner />;
  const rows: any[] = txns ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} transactions</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Activity} title="No transactions yet" desc="Revenue splits are recorded automatically when products are sold." />
      ) : (
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {["Product", "Seller", "Tier", "Gross", "Creator", "Platform", "Affiliate", "Provider", "Date"].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-muted/30">
                    <td className="px-3 py-3 font-medium text-foreground max-w-[160px] truncate">{tx.product_title ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground max-w-[120px] truncate">{tx.seller_name ?? "—"}</td>
                    <td className="px-3 py-3"><TierBadge tier={tx.seller_tier} /></td>
                    <td className="px-3 py-3 font-bold text-foreground">${fmt(tx.gross_amount)}</td>
                    <td className="px-3 py-3 text-green-700 font-semibold">${fmt(tx.creator_amount)}</td>
                    <td className="px-3 py-3 text-primary font-semibold">${fmt(tx.platform_fee_amount)}</td>
                    <td className="px-3 py-3 text-blue-700">{tx.affiliate_amount > 0 ? `$${fmt(tx.affiliate_amount)}` : "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">{tx.payment_provider ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Payouts ──────────────────────────────────────────────────────────────── */
function PayoutsTab({ toast, qc }: { toast: any; qc: any }) {
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [manualUser, setManualUser] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-revenue-payouts"],
    queryFn: () => apiClient.get("/admin/revenue/payouts").then(r => r.data),
    refetchInterval: 30000,
  });

  const action = useMutation({
    mutationFn: ({ id, act, note }: { id: number; act: string; note?: string }) =>
      apiClient.patch(`/admin/revenue/payouts/${id}`, { action: act, adminNote: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-revenue-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
      toast({ title: "Payout updated" });
    },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Action failed", variant: "destructive" }),
  });

  const doManualCredit = async () => {
    if (!manualUser || !manualAmount) { toast({ title: "User ID and amount required", variant: "destructive" }); return; }
    setManualLoading(true);
    try {
      await apiClient.post("/admin/revenue/manual-credit", { userId: manualUser, amount: manualAmount, description: manualDesc });
      toast({ title: `$${manualAmount} credited to user ${manualUser}` });
      setManualUser(""); setManualAmount(""); setManualDesc("");
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Credit failed", variant: "destructive" });
    } finally { setManualLoading(false); }
  };

  if (isLoading) return <Spinner />;
  const rows: any[] = payouts ?? [];
  const pending = rows.filter(p => p.status === "pending");

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">{pending.length} pending payout request{pending.length !== 1 ? "s" : ""}</p>
            <p className="text-amber-700 text-sm">Total: ${fmt(pending.reduce((a, p) => a + parseFloat(p.amount ?? 0), 0))}</p>
          </div>
        </div>
      )}

      {/* Manual credit */}
      <Card className="border p-5">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" />Manual Wallet Credit</h3>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="User ID" value={manualUser} onChange={e => setManualUser(e.target.value)} className="w-24" />
          <Input type="number" placeholder="Amount $" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="w-28" />
          <Input placeholder="Description (optional)" value={manualDesc} onChange={e => setManualDesc(e.target.value)} className="flex-1 min-w-[160px]" />
          <Button onClick={doManualCredit} disabled={manualLoading} className="bg-green-600 hover:bg-green-700 text-white border-0">
            {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Credit Wallet"}
          </Button>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No payout requests" desc="Creators request payouts from their wallet page." />
      ) : (
        <Card className="border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                {["Creator", "Tier", "Amount", "Method", "Wallet Balance", "Status", "Requested", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </td>
                  <td className="px-4 py-3"><TierBadge tier={p.subscription_tier} /></td>
                  <td className="px-4 py-3 font-bold text-green-700">${fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{p.method}</td>
                  <td className="px-4 py-3 text-muted-foreground">${fmt(p.wallet_balance ?? 0)}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${statusColor[p.status] ?? "bg-muted text-muted-foreground"}`}>{p.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.status === "pending" ? (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Note"
                          value={adminNote[p.id] ?? ""}
                          onChange={e => setAdminNote(n => ({ ...n, [p.id]: e.target.value }))}
                          className="h-7 text-xs w-28"
                        />
                        <Button
                          size="sm"
                          onClick={() => action.mutate({ id: p.id, act: "approve", note: adminNote[p.id] })}
                          disabled={action.isPending}
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => action.mutate({ id: p.id, act: "reject", note: adminNote[p.id] })}
                          disabled={action.isPending}
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-3 h-3 mr-1" />Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{p.admin_note ?? "—"}</span>
                    )}
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

/* ── Leaderboard ─────────────────────────────────────────────────────────── */
function LeaderboardTab({ toast, qc }: { toast: any; qc: any }) {
  const { data: board, isLoading } = useQuery({
    queryKey: ["admin-revenue-leaderboard"],
    queryFn: () => apiClient.get("/admin/revenue/leaderboard").then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <Spinner />;
  const rows: any[] = board ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Top creators by earnings — live wallet balances and split history</p>
      {rows.length === 0 ? (
        <EmptyState icon={Award} title="No earnings yet" desc="Creator earnings appear here after their first product sale." />
      ) : (
        <Card className="border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                {["Rank", "Creator", "Tier", "Sales", "Total Earned", "Platform Fees", "Wallet Balance"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r: any, i: number) => (
                <tr key={r.id} className={`hover:bg-muted/30 ${i < 3 ? "bg-amber-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-muted-foreground">#{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="px-4 py-3"><TierBadge tier={r.subscription_tier} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.total_sales}</td>
                  <td className="px-4 py-3 font-bold text-green-700">${fmt(r.total_earned ?? 0)}</td>
                  <td className="px-4 py-3 text-primary">${fmt(r.total_platform_fees ?? 0)}</td>
                  <td className="px-4 py-3 font-bold text-foreground">${fmt(r.wallet_balance ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function TierBadge({ tier }: { tier: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    free: { label: "Free", cls: "bg-muted text-muted-foreground" },
    pro: { label: "Pro", cls: "bg-primary/10 text-primary" },
    enterprise: { label: "Enterprise", cls: "bg-amber-100 text-amber-700" },
  };
  const t = cfg[tier] ?? cfg.free;
  return <Badge className={`text-xs ${t.cls}`}>{t.label}</Badge>;
}

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

function fmt(v: any): string {
  const n = parseFloat(v ?? 0);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
