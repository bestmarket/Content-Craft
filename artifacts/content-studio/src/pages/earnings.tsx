import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, ArrowDownToLine, Clock,
  CheckCircle, Loader2, Wallet, ArrowUpRight, CreditCard,
  Crown, ShieldCheck, Zap, AlertTriangle, RefreshCw, Percent,
  Send, Lock, ShoppingBag, Users, Star, Bitcoin, Globe,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";
import { Link } from "wouter";

const TIER_META: Record<string, { label: string; icon: any; color: string; bg: string; border: string; creatorShare: number; payoutMin: number }> = {
  free:       { label: "Free",       icon: Zap,        color: "text-muted-foreground",  bg: "bg-muted/30",  border: "border",  creatorShare: 70, payoutMin: 50 },
  pro:        { label: "Pro",        icon: Crown,      color: "text-primary", bg: "bg-primary/5", border: "border-primary/30", creatorShare: 85, payoutMin: 25 },
  enterprise: { label: "Enterprise", icon: ShieldCheck, color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200",  creatorShare: 92, payoutMin: 10 },
};

function fmt(v: any) {
  return parseFloat(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TX_TYPE_STYLES: Record<string, string> = {
  credit:               "bg-green-100 text-green-700",
  debit:                "bg-red-100 text-red-700",
  withdrawal:           "bg-blue-100 text-blue-700",
  refund:               "bg-amber-100 text-amber-700",
  affiliate_commission: "bg-primary/10 text-primary",
};

const TX_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending:   "bg-amber-100 text-amber-700",
  failed:    "bg-red-100 text-red-700",
};

const PAYOUT_METHODS = [
  { value: "paypal",       label: "PayPal",         icon: "💙", placeholder: "your@paypal.email" },
  { value: "paddle",       label: "Paddle",         icon: "🏓", placeholder: "Your Paddle vendor ID or email" },
  { value: "lemonsqueezy", label: "Lemon Squeezy",  icon: "🍋", placeholder: "Your Lemon Squeezy store ID or email" },
  { value: "crypto",       label: "Crypto (USDT/BTC)", icon: "₿", placeholder: "Wallet address (e.g. TRC-20 USDT, BTC)" },
  { value: "bank_transfer", label: "Bank Transfer",  icon: "🏦", placeholder: "IBAN / account number / routing info" },
  { value: "payoneer",     label: "Payoneer",        icon: "🅿️", placeholder: "Your Payoneer email or account ID" },
  { value: "other",        label: "Other",           icon: "💳", placeholder: "Describe your preferred payment method" },
];

function IncomeSourceCard({ icon: Icon, label, value, sub, color, bgColor }: any) {
  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xl font-black text-foreground">${fmt(value)}</p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Earnings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: access } = useFeatureAccess();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount]   = useState("");
  const [wMethod, setWMethod]   = useState("paypal");
  const [wDetails, setWDetails] = useState("");
  const [activeHistoryTab, setActiveHistoryTab] = useState<"all" | "sales" | "affiliate" | "payouts">("all");

  const { data: wallet, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["my-wallet"],
    queryFn: () => apiClient.get("/wallet").then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: revenueHistory } = useQuery({
    queryKey: ["my-revenue-history"],
    queryFn: () => apiClient.get("/wallet/revenue-history").then(r => r.data),
  });

  const withdraw = useMutation({
    mutationFn: () => apiClient.post("/wallet/withdraw", { amount: parseFloat(wAmount), method: wMethod, details: wDetails }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-wallet"] });
      toast({ title: "Withdrawal request submitted — admin will review shortly." });
      setShowWithdraw(false);
      setWAmount(""); setWDetails("");
    },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Request failed", variant: "destructive" }),
  });

  const tier = access?.tier ?? "free";
  const isAdmin = access?.isAdmin ?? false;
  const tierMeta = TIER_META[tier] ?? TIER_META.free;
  const TierIcon = tierMeta.icon;

  const payoutFeature = access?.features?.wallet_payouts;
  const canPayout = isAdmin || (payoutFeature?.allowed !== false);

  const balance            = parseFloat(wallet?.balance ?? 0);
  const totalEarned        = parseFloat(wallet?.totalEarned ?? 0);
  const totalWithdrawn     = parseFloat(wallet?.totalWithdrawn ?? 0);
  const pendingWithdrawals = parseFloat(wallet?.pendingWithdrawals ?? 0);
  const txns: any[]        = wallet?.transactions ?? [];
  const splits: any[]      = revenueHistory ?? [];

  // ── Income breakdown by source ───────────────────────────────────────────
  const { salesIncome, affiliateIncome, otherIncome, filteredTxns } = useMemo(() => {
    let salesIncome = 0;
    let affiliateIncome = 0;
    let otherIncome = 0;
    txns.forEach((tx: any) => {
      if (tx.type === "credit" || tx.type === "affiliate_commission") {
        const amt = parseFloat(tx.amount ?? 0);
        if (tx.type === "affiliate_commission") {
          affiliateIncome += amt;
        } else if (tx.productId || tx.product_id) {
          salesIncome += amt;
        } else {
          otherIncome += amt;
        }
      }
    });

    let filteredTxns = txns;
    if (activeHistoryTab === "sales") {
      filteredTxns = txns.filter((tx: any) => tx.type === "credit" && (tx.productId || tx.product_id));
    } else if (activeHistoryTab === "affiliate") {
      filteredTxns = txns.filter((tx: any) => tx.type === "affiliate_commission");
    } else if (activeHistoryTab === "payouts") {
      filteredTxns = txns.filter((tx: any) => tx.type === "withdrawal" || tx.type === "debit");
    }

    return { salesIncome, affiliateIncome, otherIncome, filteredTxns };
  }, [txns, activeHistoryTab]);

  const wAmountNum = parseFloat(wAmount || "0");
  const withdrawOk = wAmountNum >= tierMeta.payoutMin && wAmountNum <= balance && !!wDetails;

  const selectedPayoutMethod = PAYOUT_METHODS.find(m => m.value === wMethod) ?? PAYOUT_METHODS[0];

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings & Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Your revenue splits, wallet balance, and payout history</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${tierMeta.bg} ${tierMeta.border} border`}>
          <TierIcon className={`w-4 h-4 ${tierMeta.color}`} />
          <span className={`text-sm font-bold ${tierMeta.color}`}>{tierMeta.label}</span>
          <span className="text-xs text-muted-foreground">· keeps {tierMeta.creatorShare}%</span>
          {tier !== "enterprise" && !isAdmin && (
            <Link href="/pricing">
              <span className="ml-1 text-xs underline text-primary cursor-pointer hover:text-primary">Upgrade</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available Balance", value: `$${fmt(balance)}`, icon: Wallet, color: "text-green-600 bg-green-50", big: true },
          { label: "Total Earned",      value: `$${fmt(totalEarned)}`,    icon: TrendingUp,     color: "text-blue-600 bg-blue-50" },
          { label: "Total Withdrawn",   value: `$${fmt(totalWithdrawn)}`, icon: ArrowDownToLine, color: "text-muted-foreground bg-muted/30" },
          { label: "Pending Payout",    value: `$${fmt(pendingWithdrawals)}`, icon: Clock,      color: "text-amber-600 bg-amber-50" },
        ].map(c => (
          <Card key={c.label} className="p-5 border">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className={`font-black text-foreground ${c.big ? "text-2xl" : "text-xl"}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Income Breakdown by Source ── */}
      <Card className="border p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" /> Income by Source
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <IncomeSourceCard
            icon={ShoppingBag}
            label="Product Sales"
            value={salesIncome}
            sub="Direct sales revenue"
            color="bg-gradient-to-br from-green-500 to-emerald-600"
            bgColor="bg-green-50 border-green-200"
          />
          <IncomeSourceCard
            icon={Users}
            label="Product Affiliate Commissions"
            value={affiliateIncome}
            sub="From products you promote"
            color="bg-gradient-to-br from-primary to-violet-600"
            bgColor="bg-primary/5 border-primary/30"
          />
          <IncomeSourceCard
            icon={Star}
            label="Platform Referrals"
            value={otherIncome}
            sub="Platform signup commissions"
            color="bg-gradient-to-br from-pink-500 to-rose-600"
            bgColor="bg-pink-50 border-pink-200"
          />
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <Link href="/affiliate-portal">
            <span className="text-xs text-primary hover:text-primary flex items-center gap-1 cursor-pointer">
              <ChevronRight className="w-3 h-3" /> View my affiliate programs
            </span>
          </Link>
          <Link href="/my-affiliate-program">
            <span className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 cursor-pointer">
              <ChevronRight className="w-3 h-3" /> Manage my affiliate programs
            </span>
          </Link>
          <Link href="/affiliate">
            <span className="text-xs text-pink-600 hover:text-pink-800 flex items-center gap-1 cursor-pointer">
              <ChevronRight className="w-3 h-3" /> Platform referral program
            </span>
          </Link>
        </div>
      </Card>

      {/* Revenue split card */}
      <Card className="border p-5">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Percent className="w-4 h-4 text-primary" />Your Revenue Split
        </h3>
        <div className="h-7 rounded-full overflow-hidden flex mb-2">
          <div className="bg-green-400 h-full flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{ width: `${tierMeta.creatorShare}%` }}>
            {tierMeta.creatorShare}%
          </div>
          <div className="bg-primary h-full flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{ width: `${100 - tierMeta.creatorShare}%` }}>
            {100 - tierMeta.creatorShare}%
          </div>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />You keep {tierMeta.creatorShare}%</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Platform fee {100 - tierMeta.creatorShare}%</span>
        </div>

        {tier === "free" && !isAdmin && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">Upgrade to Pro → keep 85% of every sale</p>
              <p className="text-xs text-primary mt-0.5">On $1,000 in sales: Free earns $700 · Pro earns $850 · Enterprise earns $920</p>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white border-0 shrink-0">Upgrade →</Button>
            </Link>
          </div>
        )}
        {tier === "pro" && !isAdmin && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 flex-1">Enterprise plan: keep <strong>92%</strong> + on-demand payouts from $10 + custom affiliate rates</p>
            <Link href="/pricing">
              <span className="text-xs font-semibold text-amber-700 underline cursor-pointer">Learn more</span>
            </Link>
          </div>
        )}
      </Card>

      {/* ── Payout section ── */}
      <Card className="border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-600" />Request Payout
          </h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1">
            {payoutFeature?.limit?.unit ?? `$${tierMeta.payoutMin} minimum`}
          </span>
        </div>

        {!canPayout ? (
          <UpgradeBanner featureKey="wallet_payouts" label="Wallet Payouts" />
        ) : !showWithdraw ? (
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-muted-foreground text-sm">Available: <strong className="text-green-700 text-lg">${fmt(balance)}</strong></p>
              <p className="text-xs text-muted-foreground mt-0.5">Minimum payout: ${tierMeta.payoutMin}</p>
            </div>
            <Button
              onClick={() => setShowWithdraw(true)}
              disabled={balance < tierMeta.payoutMin}
              className="ml-auto bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <Send className="w-4 h-4 mr-2" />Request Payout
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount */}
            <div>
              <Label className="text-xs mb-1.5 block">Amount ($) <span className="text-muted-foreground">min ${tierMeta.payoutMin} · max ${fmt(balance)} available</span></Label>
              <Input type="number" placeholder={String(tierMeta.payoutMin)} value={wAmount} onChange={e => setWAmount(e.target.value)} />
            </div>

            {/* Payout method selector */}
            <div>
              <Label className="text-xs mb-2 block">Payout Method</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYOUT_METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => { setWMethod(m.value); setWDetails(""); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      wMethod === m.value
                        ? "border-purple-500 bg-primary/5 text-primary shadow-sm"
                        : "border text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment details */}
            <div>
              <Label className="text-xs mb-1.5 block">{selectedPayoutMethod.label} Details</Label>
              <Input
                placeholder={selectedPayoutMethod.placeholder}
                value={wDetails}
                onChange={e => setWDetails(e.target.value)}
              />
              {wMethod === "crypto" && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Bitcoin className="w-3 h-3" />
                  Accepted: USDT (TRC-20 or ERC-20), BTC, or ETH — specify the network in your address
                </p>
              )}
              {wMethod === "paddle" && (
                <p className="text-xs text-muted-foreground mt-1.5">Your Paddle vendor ID — payouts are sent to your Paddle balance and then to your bank</p>
              )}
              {wMethod === "lemonsqueezy" && (
                <p className="text-xs text-muted-foreground mt-1.5">Your Lemon Squeezy store email — payouts are sent to your Lemon Squeezy payout account</p>
              )}
            </div>

            {/* Validation messages */}
            {wAmountNum > balance && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Exceeds available balance (${fmt(balance)})</p>
            )}
            {wAmountNum > 0 && wAmountNum < tierMeta.payoutMin && (
              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Minimum payout for your plan is ${tierMeta.payoutMin}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWithdraw(false)}>Cancel</Button>
              <Button
                size="sm" disabled={!withdrawOk || withdraw.isPending}
                onClick={() => withdraw.mutate()}
                className="bg-green-600 hover:bg-green-700 text-white border-0"
              >
                {withdraw.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Revenue split history */}
      {splits.length > 0 && (
        <Card className="border overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-bold text-foreground">Sale Revenue Breakdown</h3>
            <span className="text-xs text-muted-foreground ml-auto">{splits.length} sales</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {["Product", "Gross", "You Earned", "Platform Fee", "Affiliate", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {splits.slice(0, 20).map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">{s.product_title ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-foreground">${fmt(s.gross_amount)}</td>
                    <td className="px-4 py-3 font-bold text-green-700">${fmt(s.creator_amount)} <span className="text-xs font-normal text-muted-foreground">({s.creator_share_pct}%)</span></td>
                    <td className="px-4 py-3 text-primary">${fmt(s.platform_fee_amount)}</td>
                    <td className="px-4 py-3 text-blue-700">{parseFloat(s.affiliate_amount) > 0 ? `$${fmt(s.affiliate_amount)}` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Full transaction history with filter tabs */}
      <Card className="border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30 flex-wrap gap-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />Transaction History
          </h3>
          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex gap-1 p-0.5 bg-card border rounded-lg text-xs">
              {([
                { key: "all",       label: "All" },
                { key: "sales",     label: "Sales" },
                { key: "affiliate", label: "Affiliate" },
                { key: "payouts",   label: "Payouts" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveHistoryTab(key)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeHistoryTab === key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </div>
        {filteredTxns.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No transactions {activeHistoryTab !== "all" ? `in "${activeHistoryTab}"` : "yet"}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {activeHistoryTab === "all" ? "Earnings appear here after your first product sale." : "Try selecting a different filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {["Type", "Amount", "Description", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTxns.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Badge className={`text-xs ${TX_TYPE_STYLES[tx.type] ?? "bg-muted text-muted-foreground"}`}>
                        {tx.type === "affiliate_commission" ? "affiliate" : tx.type}
                      </Badge>
                    </td>
                    <td className={`px-5 py-3 font-bold ${(tx.type === "credit" || tx.type === "affiliate_commission") ? "text-green-700" : "text-foreground"}`}>
                      {(tx.type === "credit" || tx.type === "affiliate_commission") ? "+" : "−"}${fmt(tx.amount)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs max-w-[260px] truncate">{tx.description ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge className={`text-xs ${TX_STATUS_STYLES[tx.status] ?? "bg-muted text-muted-foreground"}`}>{tx.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(tx.created_at ?? tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
