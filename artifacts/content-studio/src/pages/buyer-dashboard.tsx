import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, ShoppingBag, Sparkles, Users, DollarSign, ArrowRight,
  ExternalLink, Calendar, Package, Gift, TrendingUp, Zap, Star,
  BookOpen, Crown, ChevronRight, Copy, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  digital_product: "Ebook / Guide",
  prompt_package:  "Prompt Pack",
  ai_agent:        "AI Tool",
  course:          "Course",
  template:        "Template",
  n8n_workflow:    "Automation",
  web_app:         "Web App",
  mobile_app:      "Mobile App",
};

const TYPE_COLORS: Record<string, string> = {
  digital_product: "bg-blue-100 text-blue-700",
  prompt_package:  "bg-violet-100 text-violet-700",
  ai_agent:        "bg-fuchsia-100 text-fuchsia-700",
  course:          "bg-emerald-100 text-emerald-700",
  template:        "bg-cyan-100 text-cyan-700",
  n8n_workflow:    "bg-orange-100 text-orange-700",
};

const COVER_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

const TYPE_EMOJIS: Record<string, string> = {
  digital_product: "📖",
  prompt_package: "✨",
  ai_agent: "🤖",
  course: "🎓",
  template: "📋",
  n8n_workflow: "⚡",
  web_app: "🌐",
};

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function PurchaseCard({ item }: { item: any }) {
  const typeLabel = TYPE_LABELS[item.type] ?? "Digital Product";
  const typeColor = TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-700";
  const typeEmoji = TYPE_EMOJIS[item.type] ?? "📦";
  const gradIdx = ((item.productId ?? 0) + (item.title?.charCodeAt(0) ?? 0)) % COVER_GRADIENTS.length;
  const grad = COVER_GRADIENTS[gradIdx];

  return (
    <Card className="overflow-hidden border hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Cover */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {item.coverImageUrl ? (
          <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
            <div className="text-center">
              <div className="text-4xl mb-1 drop-shadow">{typeEmoji}</div>
              <p className="text-white/90 text-xs font-semibold px-4 line-clamp-2">{item.title}</p>
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={`text-xs border-0 ${typeColor}`}>{typeEmoji} {typeLabel}</Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge className="bg-emerald-500 text-white border-0 text-xs">✓ Owned</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">{item.title}</h3>
        {item.subtitle && (
          <p className="text-xs text-violet-600 mb-1 line-clamp-1">{item.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {item.description || "Premium digital product — ready to access"}
        </p>

        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {timeAgo(item.purchasedAt)}
          </span>
          <span className="font-semibold text-foreground">${parseFloat(item.amount).toFixed(2)}</span>
        </div>

        <a
          href={item.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Access Product
        </a>
      </div>
    </Card>
  );
}

function ReferEarnSection({ affiliateCode }: { affiliateCode: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const BASE = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${BASE}/register?ref=${affiliateCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const EARNINGS = [
    { icon: "🎯", event: "Someone signs up with your link", earn: "$1.00", color: "text-blue-600 bg-blue-50" },
    { icon: "⭐", event: "Your referral upgrades to Pro ($29/mo)", earn: "$8.70", color: "text-violet-600 bg-violet-50" },
    { icon: "💰", event: "Your referral makes a product sale", earn: "30%", color: "text-emerald-600 bg-emerald-50" },
  ];

  const SHARE_SCRIPTS = [
    {
      platform: "TikTok / Instagram",
      icon: "🎵",
      text: `POV: I just found this AI that builds entire digital products in 60 seconds 🤯\n\nI bought a course on it and the content is actually incredible. Now I'm also creating on the platform.\n\nYou get your own store, AI writes everything, and you keep 90% of sales.\n\nFree to start — link in bio 👇`,
    },
    {
      platform: "WhatsApp / DM",
      icon: "💬",
      text: `Hey! Wanted to share something I discovered — it's called Selovox. You can literally create an ebook, course, or prompt pack with AI in under a minute and sell it. I already bought a product from the marketplace and the content quality is impressive. Thought you'd find it interesting:`,
    },
    {
      platform: "Twitter / X",
      icon: "🐦",
      text: `Just discovered @Selovox — create digital products with AI and sell them instantly.\n\nBought a product, loved it. Now thinking about creating my own.\n\nFree to start, no credit card:`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Your link */}
      <Card className="p-5 border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <Gift className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your Referral Link</p>
            <p className="text-xs text-muted-foreground">Share this everywhere — it never expires</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
            {referralLink}
          </div>
          <Button onClick={copyLink} size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-0 flex-shrink-0">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Card>

      {/* What you earn */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">What you earn</p>
        <div className="grid gap-2">
          {EARNINGS.map(e => (
            <div key={e.event} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${e.color}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{e.icon}</span>
                <span className="text-xs font-medium">{e.event}</span>
              </div>
              <span className="text-base font-black flex-shrink-0">{e.earn}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Copy-paste scripts */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Ready-to-post scripts</p>
        <div className="space-y-3">
          {SHARE_SCRIPTS.map(s => (
            <ScriptCard key={s.platform} {...s} link={referralLink} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScriptCard({ platform, icon, text, link }: { platform: string; icon: string; text: string; link: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text + "\n\n" + link);
    setCopied(true);
    toast({ title: `${platform} script copied!` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-xs font-bold text-foreground">{platform}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy script"}
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{text}</p>
        <p className="text-xs text-violet-600 font-mono mt-2 break-all">{link}</p>
      </div>
    </div>
  );
}

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState<"purchases" | "refer">("purchases");
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => apiClient.get("/orders/my-purchases").then(r => r.data as any[]),
  });

  const { data: affiliateData } = useQuery({
    queryKey: ["affiliate-stats"],
    queryFn: () => apiClient.get("/affiliate/stats").then(r => r.data as any),
  });

  const affiliateCode = affiliateData?.affiliateCode ?? "";

  const firstName = (user as any)?.name?.split(" ")[0] ?? "there";

  const TABS = [
    { key: "purchases", label: "My Products", icon: ShoppingBag, count: purchases.length },
    { key: "refer",     label: "Refer & Earn", icon: Gift },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Welcome header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hey, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {purchases.length > 0
              ? `You own ${purchases.length} product${purchases.length !== 1 ? "s" : ""} — access them anytime below.`
              : "Browse the marketplace and your purchases will appear here."}
          </p>
        </div>
        <Link href="/marketplace">
          <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0 hidden sm:flex">
            <ShoppingBag className="w-4 h-4" /> Browse Marketplace
          </Button>
        </Link>
      </div>

      {/* ── Action banners ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Start Selling */}
        <Link href="/create-product">
          <div className="group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5" style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)"
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/15 border border-white/25 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-bold text-base">Start Selling</p>
                  <Badge className="bg-white/20 text-white border-0 text-xs">Free to start</Badge>
                </div>
                <p className="text-blue-100 text-xs leading-relaxed mb-3">
                  Turn your knowledge into an ebook, course, or prompt pack with AI — in 60 seconds. Keep 90% of every sale.
                </p>
                <div className="flex items-center gap-1 text-white text-xs font-semibold group-hover:gap-2 transition-all">
                  Create your first product <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Refer & Earn */}
        <button
          onClick={() => setActiveTab("refer")}
          className="group relative overflow-hidden rounded-2xl p-5 cursor-pointer text-left transition-all hover:shadow-xl hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #a78bfa 100%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/15 border border-white/25 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white font-bold text-base">Refer & Earn</p>
                <Badge className="bg-white/20 text-white border-0 text-xs">Up to 30%</Badge>
              </div>
              <p className="text-violet-100 text-xs leading-relaxed mb-3">
                Share your unique link. Earn $1 per signup, $8.70 per Pro upgrade, 30% on every sale your referrals make.
              </p>
              <div className="flex items-center gap-1 text-white text-xs font-semibold group-hover:gap-2 transition-all">
                Get my referral link <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {TABS.map(({ key, label, icon: Icon, count }: any) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-lg transition-all ${
              activeTab === key ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-violet-100 text-violet-700" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── My Purchases tab ── */}
      {activeTab === "purchases" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-[16/9] bg-muted animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-8 bg-muted rounded animate-pulse mt-3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No purchases yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Explore ebooks, courses, prompt packs, and templates from expert creators. Everything is instant download.
              </p>
              <Link href="/marketplace">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <ShoppingBag className="w-4 h-4" /> Browse Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {purchases.map((item: any) => (
                <PurchaseCard key={item.orderId} item={item} />
              ))}
            </div>
          )}

          {/* Upsell — browse more */}
          {purchases.length > 0 && (
            <Card className="p-5 border bg-muted/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Find more products you'll love</p>
                  <p className="text-xs text-muted-foreground">New ebooks, courses, and prompt packs added daily</p>
                </div>
              </div>
              <Link href="/marketplace">
                <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                  Browse <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </Card>
          )}
        </>
      )}

      {/* ── Refer & Earn tab ── */}
      {activeTab === "refer" && (
        <div>
          {/* Stats if they have referrals */}
          {affiliateData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: Users,      label: "Referrals",     value: affiliateData.stats.totalReferrals ?? 0,                color: "from-blue-500 to-blue-600" },
                { icon: TrendingUp, label: "Conversions",   value: affiliateData.stats.conversions ?? 0,                   color: "from-violet-500 to-violet-600" },
                { icon: DollarSign, label: "Total Earned",  value: `$${Number(affiliateData.stats.totalEarned ?? 0).toFixed(2)}`, color: "from-emerald-500 to-emerald-600" },
                { icon: Zap,        label: "Pending",       value: `$${Number(affiliateData.stats.pendingEarnings ?? 0).toFixed(2)}`, color: "from-amber-500 to-amber-600" },
              ].map(({ icon: Icon, label, value, color }) => (
                <Card key={label} className="p-4 border">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-black text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </Card>
              ))}
            </div>
          )}

          <ReferEarnSection affiliateCode={affiliateCode} />

          {/* Full affiliate page link */}
          <Card className="mt-5 p-4 border bg-muted/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">Full Affiliate Dashboard</p>
                <p className="text-xs text-muted-foreground">Leaderboard, earnings history, advanced stats</p>
              </div>
            </div>
            <Link href="/affiliate">
              <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                Open <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* ── Bottom upgrade CTA (only if not yet selling) ── */}
      <div className="rounded-2xl p-6 text-center" style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)"
      }}>
        <BookOpen className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h3 className="text-white font-bold text-lg mb-2">Ready to create instead of just buying?</h3>
        <p className="text-violet-200 text-sm mb-5 max-w-md mx-auto">
          Use the same AI that created the products you love. Write your own ebook, course, or prompt pack in 60 seconds — and sell it here. Free forever plan. No credit card.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/create-product">
            <Button className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 px-6">
              <Sparkles className="w-4 h-4" /> Create My First Product — Free
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 px-6">
              <Crown className="w-4 h-4" /> View Pro Plans
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
