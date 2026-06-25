import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Zap, Crown, ShieldCheck,
  ArrowRight, Star, Loader2, Sparkles, Lock, TrendingUp,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Finance Creator → $47K in 6 months",
    text: "Upgrading to Pro was the easiest ROI decision I've ever made. The extra 15% revenue share alone paid for 6 months of the plan. The unlimited AI generations changed everything.",
    rating: 5,
  },
  {
    name: "Priya K.",
    role: "Fitness Coach → $18K in 8 weeks",
    text: "The automation engine on Pro is what separates Selovox from everything else. My email sequences run themselves. I check in once a week and sales just happened.",
    rating: 5,
  },
  {
    name: "Amara O.",
    role: "Teacher → $31K Digital Creator",
    text: "I started on Free and made $4,200 before upgrading. When I moved to Pro I went from $4K/month to $11K/month in 6 weeks. The tools are just better — faster, smarter, more powerful.",
    rating: 5,
  },
];

const TIER_META = [
  {
    key: "free",
    label: "Starter",
    price: "$0",
    period: "/forever",
    tagline: "Build your first product today",
    icon: Zap,
    highlight: false,
    badge: null,
    cta: "Start Free",
    ctaHref: "/register",
    gradient: "from-slate-500 to-slate-600",
    border: "border-slate-700",
    accentColor: "text-muted-foreground",
    creatorShare: 70,
    highlights: [
      "5 AI product generations/month",
      "3 active products in store",
      "AI PDF & content creator",
      "Built-in storefront",
      "Basic analytics",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    price: "$29",
    period: "/month",
    tagline: "2-day free trial · Cancel anytime",
    icon: Crown,
    highlight: true,
    badge: "MOST POPULAR",
    cta: "Start Free Trial",
    ctaHref: null,
    gradient: "from-violet-600 to-indigo-600",
    border: "border-violet-500",
    accentColor: "text-violet-400",
    creatorShare: 85,
    highlights: [
      "Unlimited AI generations",
      "Unlimited products",
      "Full Automation Engine (25+ AI blocks)",
      "Advanced email marketing",
      "Priority payouts ($25 min)",
      "Affiliate program access",
      "Viral content engine",
      "Full analytics suite",
    ],
  },
  {
    key: "enterprise",
    label: "Enterprise",
    price: "$99",
    period: "/month",
    tagline: "For serious operators & agencies",
    icon: ShieldCheck,
    highlight: false,
    badge: "BEST VALUE",
    cta: "Contact Sales",
    ctaHref: "mailto:enterprise@selovox.com",
    gradient: "from-amber-500 to-orange-500",
    border: "border-amber-700",
    accentColor: "text-amber-400",
    creatorShare: 92,
    highlights: [
      "Everything in Pro",
      "92% revenue share",
      "On-demand payouts ($10 min)",
      "Custom branding & white-label",
      "Dedicated account manager",
      "API access",
      "Priority support (2hr response)",
      "Team seats",
    ],
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  "AI Tools": "🤖",
  "Products": "📦",
  "Marketing": "📣",
  "Email Marketing": "📧",
  "Automation": "⚡",
  "Monetization": "💰",
  "Analytics": "📊",
  "Developer": "🔧",
  "Platform": "🏛️",
};

function FeatureCell({ feature, tierKey, highlight }: { feature: any; tierKey: string; highlight: boolean }) {
  const tierData = feature.tiersAllowed?.[tierKey];
  const tierLimit = feature.limits?.[tierKey];

  if (!tierData || tierData === false) {
    return <XCircle className="w-4 h-4 text-foreground mx-auto" />;
  }
  if (tierLimit && tierLimit !== "unlimited" && tierLimit !== true) {
    return (
      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap ${highlight ? "bg-violet-900/40 text-violet-300" : "bg-slate-800 text-muted-foreground/60"}`}>
        {tierLimit}
      </span>
    );
  }
  if (tierLimit === "unlimited") {
    return <span className="text-xs font-bold text-emerald-400">Unlimited</span>;
  }
  return <CheckCircle className={`w-4 h-4 mx-auto ${highlight ? "text-violet-400" : "text-emerald-500"}`} />;
}

export default function Pricing() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const { data: userAccess } = useFeatureAccess();

  const { data: featuresRaw, isLoading: featuresLoading } = useQuery({
    queryKey: ["public-features"],
    queryFn: () => apiClient.get("/features/catalog").then(r => r.data),
    retry: false,
  });

  const features: any[] = featuresRaw ?? [];
  const categories = [...new Set(features.map((f: any) => f.category))].filter(Boolean);

  const handleUpgrade = async (tier = "pro") => {
    setLoading(true);
    try {
      const res = await apiClient.post("/checkout/subscription", {
        successUrl: `${window.location.origin}/dashboard?subscribed=1`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast({ title: "Redirecting to upgrade..." });
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Could not start checkout";
      if (msg.includes("No payment gateway") || msg.includes("not configured")) {
        toast({ title: "Coming soon", description: "Payment processing is being configured!", variant: "destructive" });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentTier = userAccess?.tier ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── NAV ── */}
      <header className="h-16 flex items-center justify-between px-6 md:px-16 border-b border-slate-800/60 sticky top-0 bg-slate-950/95 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">
            Selo<span className="text-violet-400">vox</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {userAccess ? (
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-sm font-semibold">
                ← Back to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">Sign In</Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 text-sm font-semibold">
                  Start Free →
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-20">

        {/* ── HERO ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wide">
            <TrendingUp className="w-3.5 h-3.5" />
            Transparent pricing · No hidden fees · Cancel anytime
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
            Invest in Your Business.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Keep Most of What You Earn.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Selovox pays out up to <strong className="text-white">92% of every sale</strong> directly to you. Most platforms keep 30–50%. We built pricing that actually rewards creators for growing.
          </p>
        </div>

        {/* ── Revenue comparison callout ── */}
        <div className="max-w-2xl mx-auto mb-14 bg-violet-950/40 border border-violet-800/40 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">On <strong className="text-white">$5,000/month in sales</strong>, here's what you take home:</p>
          <div className="flex justify-center gap-8 mt-3">
            <div>
              <p className="text-2xl font-black text-muted-foreground">$3,500</p>
              <p className="text-xs text-muted-foreground">Starter (70%)</p>
            </div>
            <div>
              <p className="text-2xl font-black text-violet-400">$4,250</p>
              <p className="text-xs text-violet-600">Pro (85%)</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400">$4,600</p>
              <p className="text-xs text-amber-700">Enterprise (92%)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Pro pays for itself after your very first sale.</p>
        </div>

        {/* ── TIER CARDS ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-20 items-start">
          {TIER_META.map((tier) => {
            const TierIcon = tier.icon;
            const isCurrent = currentTier === tier.key;
            return (
              <div
                key={tier.key}
                className={`relative rounded-2xl border-2 ${tier.border} overflow-hidden flex flex-col ${
                  tier.highlight
                    ? "shadow-2xl shadow-violet-900/30 md:-translate-y-2"
                    : "shadow-lg"
                }`}
                style={{
                  background: tier.highlight
                    ? "radial-gradient(ellipse 120% 80% at 50% -10%, rgba(124,58,237,0.2) 0%, transparent 60%), #0b0e1a"
                    : "#0f172a",
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-px left-0 right-0 flex justify-center">
                    <span className={`bg-gradient-to-r ${tier.gradient} text-white text-[10px] font-black px-5 py-1 rounded-b-xl tracking-widest`}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="p-7 pt-9 flex-1 flex flex-col">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg`}>
                      <TierIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg leading-none">{tier.label}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{tier.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-5xl font-black text-white">{tier.price}</span>
                    <span className="text-muted-foreground text-sm pb-2">{tier.period}</span>
                  </div>

                  {/* Revenue share */}
                  <div className={`mb-5 px-3 py-2.5 rounded-xl border flex items-center gap-3 ${
                    tier.highlight ? "bg-violet-900/20 border-violet-800/40" : "bg-white/4 border-white/8"
                  }`}>
                    <div className="flex-1">
                      <div className="flex gap-0.5 items-center mb-1.5">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${tier.gradient}`}
                          style={{ width: `${tier.creatorShare}%` }}
                        />
                        <div className="h-1.5 rounded-full bg-slate-700 flex-1" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You keep <strong className={tier.accentColor}>{tier.creatorShare}%</strong> of every sale
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-400 text-sm font-bold text-center mb-5">
                      ✓ Your current plan
                    </div>
                  ) : tier.ctaHref ? (
                    <Link href={tier.ctaHref}>
                      <Button variant="outline" className="w-full mb-5 border-slate-700 text-muted-foreground/60 hover:bg-slate-800/80 bg-transparent h-11">
                        {tier.cta} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(tier.key)}
                      disabled={loading}
                      className={`w-full mb-5 bg-gradient-to-r ${tier.gradient} hover:opacity-90 border-0 font-bold text-base h-11 shadow-lg`}
                    >
                      {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <>{tier.cta} <ArrowRight className="w-4 h-4 ml-2" /></>
                      }
                    </Button>
                  )}

                  {/* Feature list */}
                  <ul className="space-y-2.5">
                    {tier.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.accentColor}`} />
                        <span className="text-muted-foreground/60">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FULL FEATURE TABLE ── */}
        {features.length > 0 && (
          <div className="mb-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Full Feature Comparison</h2>
              <p className="text-muted-foreground text-sm">Every feature, every plan — nothing hidden</p>
            </div>
            {featuresLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="grid grid-cols-[1fr_100px_100px_100px] bg-slate-900 border-b border-slate-800">
                  <div className="p-4 text-sm font-semibold text-muted-foreground">Feature</div>
                  {TIER_META.map((t) => {
                    const TierIcon = t.icon;
                    return (
                      <div key={t.key} className={`p-4 text-center ${t.highlight ? "bg-violet-900/15" : ""}`}>
                        <TierIcon className={`w-4 h-4 mx-auto mb-1 ${t.accentColor}`} />
                        <p className="text-xs font-bold text-white">{t.label}</p>
                      </div>
                    );
                  })}
                </div>
                {categories.map((cat) => {
                  const catFeatures = features.filter((f: any) => f.category === cat);
                  return (
                    <div key={cat}>
                      <div className="grid grid-cols-[1fr_100px_100px_100px] bg-slate-800/50 border-b border-slate-800/60">
                        <div className="px-4 py-2.5 col-span-4 flex items-center gap-2">
                          <span>{CATEGORY_ICONS[cat] ?? "📋"}</span>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{cat}</span>
                        </div>
                      </div>
                      {catFeatures.map((f: any, idx: number) => (
                        <div
                          key={f.key}
                          className={`grid grid-cols-[1fr_100px_100px_100px] border-b border-slate-800/40 ${idx % 2 === 0 ? "" : "bg-slate-900/30"}`}
                        >
                          <div className="px-4 py-3">
                            <p className="text-sm text-muted-foreground/60">{f.label}</p>
                            {f.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.description}</p>}
                          </div>
                          {TIER_META.map((t) => (
                            <div key={t.key} className={`px-2 py-3 flex items-center justify-center ${t.highlight ? "bg-violet-900/8" : ""}`}>
                              <FeatureCell feature={f} tierKey={t.key} highlight={t.highlight} />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PRO STATS BAR ── */}
        <div className="bg-slate-900/60 border border-violet-800/30 rounded-2xl p-8 mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold">What Pro unlocks</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-6">
            {[
              { value: "∞", label: "AI generations", sub: "per month" },
              { value: "85%", label: "Revenue yours", sub: "every sale" },
              { value: "$25", label: "Min payout", sub: "vs $50 on free" },
              { value: "25+", label: "Automation blocks", sub: "AI-powered" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-3xl md:text-4xl font-black text-violet-400">{item.value}</p>
                <p className="text-sm text-muted-foreground/60 font-medium mt-1">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-violet-900/20 border border-violet-800/30 rounded-xl px-5 py-3 text-center">
            <p className="text-sm text-muted-foreground/60">
              💡 On <strong className="text-white">$2,000/month in sales</strong> — Pro earns you{" "}
              <strong className="text-violet-300">$300 more per month</strong> than Starter.{" "}
              Pro pays for itself <strong className="text-white">10x over</strong>.
            </p>
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-2">Creators Who Upgraded</h2>
            <p className="text-muted-foreground text-sm">What happens when you give serious creators serious tools</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-violet-800/40 transition-colors flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-violet-400 text-violet-400" />
                  ))}
                </div>
                <p className="text-muted-foreground/60 text-sm leading-relaxed mb-5 flex-1">"{t.text}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-violet-400 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: "Can I really cancel anytime?",
                a: "Yes — no lock-in, no cancellation fees. Cancel from your dashboard in 10 seconds. Your products and store stay live on the Starter plan.",
              },
              {
                q: "What happens to my products if I downgrade?",
                a: "Your products stay live and earning. You'll be limited to 3 active products on Starter. Revenue from existing sales always pays out to your wallet.",
              },
              {
                q: "Is the 2-day Pro trial really free?",
                a: "Yes. No credit card required to start the trial. You'll only be charged after 2 days if you choose to continue — and you can cancel before then with zero cost.",
              },
              {
                q: "How do payouts work?",
                a: "Starter: $50 minimum, monthly. Pro: $25 minimum, up to 4x/month. Enterprise: $10 minimum, on-demand withdrawal. All payouts go straight to your configured payment account.",
              },
              {
                q: "Does Pro include the Automation Engine?",
                a: "Yes — the full AI Automation Engine with 25+ blocks is Pro-only. This lets you build workflows that run your content, email sequences, and product updates automatically.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                <p className="font-semibold text-white mb-2 text-sm">{item.q}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div
          className="text-center rounded-3xl p-12 md:p-16 border border-violet-700/30"
          style={{ background: "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%), #0b0d1a" }}
        >
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Lock className="w-3 h-3" /> 2-day free trial · No credit card required
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Start Earning More Today
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            Pro pays for itself after your first sale. Try it free for 2 days — no card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleUpgrade("pro")}
              disabled={loading}
              size="lg"
              className="h-14 px-12 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 shadow-2xl shadow-violet-900/40 font-bold"
            >
              {loading
                ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                : <Sparkles className="w-5 h-5 mr-2" />
              }
              Start Pro Trial — Free
            </Button>
            <Link href="/register">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-10 text-base border-slate-700 text-muted-foreground/60 hover:bg-slate-800 bg-transparent"
              >
                Start with Starter Free →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-800/60 text-center">
        <p className="text-foreground text-sm">© {new Date().getFullYear()} Selovox. All rights reserved.</p>
      </footer>
    </div>
  );
}
