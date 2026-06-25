import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, ShoppingCart, Star, Check, AlertCircle, RefreshCw,
  TrendingUp, Gift, Coins, ChevronRight, Sparkles, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const PACKS = [
  { id: "starter", name: "Starter Pack", credits: 100, price: 4.99, popular: false, color: "from-slate-600 to-slate-700", savings: null },
  { id: "creator", name: "Creator Pack", credits: 500, price: 19.99, popular: true, color: "from-violet-600 to-purple-700", savings: "Save 20%" },
  { id: "pro", name: "Pro Pack", credits: 1500, price: 49.99, popular: false, color: "from-blue-600 to-blue-700", savings: "Save 34%" },
  { id: "agency", name: "Agency Pack", credits: 5000, price: 149.99, popular: false, color: "from-emerald-600 to-green-700", savings: "Save 40%" },
];

const ACTION_COSTS: Record<string, { label: string; cost: number; icon: string }> = {
  ai_content:    { label: "Content Generation", cost: 1,  icon: "✍️" },
  ai_thumbnails: { label: "Thumbnail Creation", cost: 2,  icon: "🖼️" },
  ai_pdf:        { label: "PDF Guide Builder",  cost: 5,  icon: "📄" },
  ai_video:      { label: "Video Marketing",    cost: 10, icon: "🎬" },
  ai_scripts:    { label: "Script Writer",      cost: 1,  icon: "📝" },
  automations:   { label: "AI Automation Run",  cost: 3,  icon: "⚡" },
  scryvox_product: { label: "Scryvox Product",  cost: 8,  icon: "🧠" },
  prompt_package:  { label: "Prompt Package",   cost: 4,  icon: "💡" },
  landing_page:    { label: "Landing Page",     cost: 3,  icon: "🚀" },
};

export default function CreditsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const { data: balance, isLoading } = useQuery({
    queryKey: ["credits-balance"],
    queryFn: () => api.get("/credits/balance").then(r => r.data),
    refetchInterval: 30000,
  });

  const purchaseMutation = useMutation({
    mutationFn: (body: { packId: string; txHash?: string }) =>
      api.post("/credits/purchase", body).then(r => r.data),
    onSuccess: (data) => {
      toast({ title: "Purchase submitted!", description: data.message });
      setShowPurchaseForm(false);
      setSelectedPack(null);
      setTxHash("");
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const credits = balance?.credits ?? 0;
  const unlimited = balance?.unlimited ?? false;
  const tier = balance?.tier ?? "free";
  const dailyRefill = balance?.dailyRefill ?? 20;
  const dailyMax = tier === "pro" ? 200 : 20;
  const pct = unlimited ? 100 : Math.min(100, (credits / dailyMax) * 100);

  function handleBuyClick(packId: string) {
    setSelectedPack(packId);
    setShowPurchaseForm(true);
  }

  function handleSubmitPurchase() {
    if (!selectedPack) return;
    purchaseMutation.mutate({ packId: selectedPack, txHash: txHash || undefined });
  }

  const pack = PACKS.find(p => p.id === selectedPack);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-6 w-6 text-violet-500" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Credits</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Credits power every AI generation — content, PDFs, videos, thumbnails, and more.
        </p>
      </div>

      {/* Balance card */}
      <Card className="p-6 bg-gradient-to-br from-violet-600 to-purple-700 border-0 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-violet-200 text-sm font-medium mb-1">Your Balance</p>
            {isLoading ? (
              <div className="h-10 w-24 bg-white/20 rounded animate-pulse" />
            ) : unlimited ? (
              <p className="text-4xl font-bold">Unlimited</p>
            ) : (
              <p className="text-4xl font-bold">{credits.toLocaleString()} <span className="text-xl font-normal text-violet-200">credits</span></p>
            )}
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-0 capitalize">{tier} plan</Badge>
            {!unlimited && (
              <div className="flex items-center gap-1 mt-2 text-violet-200 text-sm">
                <RefreshCw className="h-3 w-3" />
                <span>+{dailyRefill} free/day</span>
              </div>
            )}
          </div>
        </div>
        {!unlimited && (
          <>
            <Progress value={pct} className="h-2 bg-white/20 [&>div]:bg-white mb-2" />
            <p className="text-violet-200 text-xs">{credits} of {dailyMax} daily credits used</p>
          </>
        )}
      </Card>

      {/* Credit packs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Buy Credit Packs</h2>
        <p className="text-sm text-slate-500 mb-5">Credits never expire. Use them whenever you need more generations beyond your daily free allowance.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PACKS.map(p => (
            <Card
              key={p.id}
              className={`relative overflow-hidden border-2 transition-all cursor-pointer ${
                p.popular ? "border-violet-500 shadow-lg shadow-violet-100 dark:shadow-violet-900/20" : "border-slate-200 dark:border-slate-700 hover:border-violet-300"
              }`}
              onClick={() => handleBuyClick(p.id)}
            >
              {p.popular && (
                <div className="absolute top-0 right-0 bg-violet-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              {p.savings && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-br-lg">
                  {p.savings}
                </div>
              )}
              <div className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-3`}>
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {p.credits.toLocaleString()} <span className="text-sm font-normal text-slate-500">credits</span>
                </p>
                <p className="text-violet-600 dark:text-violet-400 font-bold text-lg mt-1">${p.price}</p>
                <p className="text-xs text-slate-400 mt-1">${(p.price / p.credits).toFixed(3)} per credit</p>
                <Button
                  className={`w-full mt-4 bg-gradient-to-r ${p.color} text-white border-0 hover:opacity-90`}
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleBuyClick(p.id); }}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" /> Buy Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Purchase form */}
      {showPurchaseForm && pack && (
        <Card className="p-6 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Complete your purchase</h3>
          <p className="text-sm text-slate-500 mb-4">
            You're buying <strong>{pack.credits.toLocaleString()} credits</strong> for <strong>${pack.price}</strong>.
            Send payment to our crypto wallet, then submit your transaction ID below.
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-4 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Payment Instructions</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-slate-500">Amount:</span> <strong className="text-slate-900 dark:text-white">${pack.price} USD</strong></p>
              <p><span className="text-slate-500">BTC:</span> <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Configure in Admin → Payments → Crypto</code></p>
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Credits are added within 1 hour after payment is confirmed by admin.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Transaction ID / Hash (optional but speeds up confirmation)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="e.g. 0x4f3a2b..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitPurchase} disabled={purchaseMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                {purchaseMutation.isPending ? "Submitting..." : "Submit Purchase Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowPurchaseForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* What each credit costs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Credit Costs</h2>
        <p className="text-sm text-slate-500 mb-4">Each AI action deducts credits from your balance.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ACTION_COSTS).map(([key, item]) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.label}</p>
              </div>
              <Badge variant="outline" className="text-violet-600 border-violet-200 dark:border-violet-700 font-bold whitespace-nowrap">
                {item.cost} cr
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Daily refill info */}
      <Card className="p-5 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Daily Free Credits</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Every day your balance automatically refills to your plan's minimum:
              <strong className="text-emerald-700 dark:text-emerald-400"> 20 credits (Free)</strong> or
              <strong className="text-emerald-700 dark:text-emerald-400"> 200 credits (Pro)</strong>.
              Any extra credits you purchased are kept on top of this — they never reset.
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" /> Refills happen automatically at midnight UTC
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
