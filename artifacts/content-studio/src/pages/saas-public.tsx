import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Zap, Users, Star, ChevronDown, Lock } from "lucide-react";

export default function SaasPublic() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual" | "lifetime">("monthly");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribed, setSubscribed] = useState<{ accessToken: string; accessUrl: string; tier: string } | null>(null);

  const { data: app, isLoading, error } = useQuery({
    queryKey: ["saas-public", slug],
    queryFn: async () => {
      const res = await fetch(`/api/saas/public/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: { tierId: string; billingPeriod: string; email: string; name: string }) => {
      const res = await fetch(`/api/saas/public/${slug}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Subscription failed");
      return res.json();
    },
    onSuccess: (data) => {
      setSubscribed(data);
      setShowSubscribeModal(false);
      toast({ title: "🎉 You're subscribed!", description: `Welcome to ${app?.name}` });
    },
    onError: () => toast({ title: "Error", description: "Subscription failed. Try again.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <p className="text-6xl mb-4">🔒</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This app doesn't exist or isn't live yet.</p>
        </div>
      </div>
    );
  }

  const lp = app.landingPage || {};
  const tiers = (app.tiers || []) as any[];
  const primaryColor = app.brandColor || "#7c3aed";

  if (subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: primaryColor }}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">You're in! 🎉</h1>
            <p className="text-muted-foreground">You subscribed to the {subscribed.tier} plan of {app.name}.</p>
          </div>
          <a
            href={subscribed.accessUrl}
            className="block w-full text-white font-semibold py-3 px-6 rounded-xl text-center transition-opacity hover:opacity-90"
            style={{ background: primaryColor }}
          >
            Access {app.name} →
          </a>
          <p className="text-xs text-muted-foreground">Save your access link — you'll need it to log back in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Hero */}
      <div className="text-white py-20 px-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
            <Zap className="w-3.5 h-3.5" /> Powered by AI
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            {lp.headline || app.name}
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
            {lp.subheadline || app.tagline || app.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setSelectedTier(tiers.find((t: any) => t.priceMonthly === 0)?.id || tiers[0]?.id); setShowSubscribeModal(true); }}
              className="bg-card font-bold py-3.5 px-8 rounded-xl transition-opacity hover:opacity-90 text-base"
              style={{ color: primaryColor }}
            >
              {lp.cta || "Get Started Free"}
            </button>
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="border-2 border-white/50 text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              See Pricing
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> No credit card for free</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Features */}
      {lp.features && lp.features.length > 0 && (
        <div className="py-20 px-6 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-center text-foreground mb-12">Everything you need</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lp.features.map((f: any, i: number) => (
                <div key={i} className="bg-card rounded-2xl p-6 border hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Proof */}
      {lp.testimonials && lp.testimonials.length > 0 && (
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-center text-foreground mb-12">Loved by thousands</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lp.testimonials.map((t: any, i: number) => (
                <div key={i} className="border rounded-2xl p-5 space-y-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-foreground text-sm italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: primaryColor }}>
                      {t.avatar || t.name?.slice(0, 2)}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center text-foreground mb-4">Simple, transparent pricing</h2>
          <p className="text-center text-muted-foreground mb-8">Start free, upgrade when you're ready.</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {(["monthly", "annual", "lifetime"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  billingPeriod === period
                    ? "text-white shadow-sm"
                    : "bg-card border text-muted-foreground hover:bg-muted/30"
                }`}
                style={billingPeriod === period ? { background: primaryColor } : {}}
              >
                {period}
                {period === "annual" && <span className="ml-1 text-xs opacity-75">Save 30%</span>}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier: any) => {
              const price = billingPeriod === "monthly" ? tier.priceMonthly
                : billingPeriod === "annual" ? tier.priceAnnual
                : (tier.priceLifetime ?? tier.priceMonthly * 12);

              return (
                <div key={tier.id} className={`rounded-2xl p-6 flex flex-col ${
                  tier.highlighted ? "ring-2 ring-offset-2 shadow-xl scale-105" : "bg-card border"
                }`} style={tier.highlighted ? { background: "white", ringColor: primaryColor } : {}}>
                  {tier.highlighted && (
                    <div className="text-center mb-3">
                      <span className="text-xs font-bold text-white px-3 py-1 rounded-full" style={{ background: primaryColor }}>
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-black text-foreground">{tier.name}</h3>
                  <div className="my-4">
                    <span className="text-4xl font-black text-foreground">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground text-sm ml-1">
                        {billingPeriod === "lifetime" ? " one-time" : `/${billingPeriod === "annual" ? "yr" : "mo"}`}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {(tier.perks || []).map((perk: string) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => { setSelectedTier(tier.id); setShowSubscribeModal(true); }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                    style={tier.highlighted ? { background: primaryColor, color: "white" } : { background: "#f1f5f9", color: "#1e293b" }}
                  >
                    {price === 0 ? "Start Free" : "Subscribe Now"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      {lp.faq && lp.faq.length > 0 && (
        <div className="py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-center text-foreground mb-10">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {lp.faq.map((item: any, i: number) => (
                <div key={i} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-medium text-foreground pr-4">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-muted-foreground text-sm">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <div className="py-20 px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
        <h2 className="text-2xl md:text-3xl font-black mb-4">Ready to get started?</h2>
        <p className="text-white/80 mb-8">Join {app.subscriberCount ?? 0}+ subscribers using {app.name}</p>
        <button
          onClick={() => { setSelectedTier(tiers.find((t: any) => t.priceMonthly === 0)?.id || tiers[0]?.id); setShowSubscribeModal(true); }}
          className="bg-card font-bold py-3.5 px-10 rounded-xl transition-opacity hover:opacity-90 text-base"
          style={{ color: primaryColor }}
        >
          {lp.cta || "Get Started Free"}
        </button>
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && selectedTier && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-lg">Subscribe to {app.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tiers.find((t: any) => t.id === selectedTier)?.name} plan
                </p>
              </div>
              <button onClick={() => setShowSubscribeModal(false)} className="p-2 hover:bg-muted rounded-lg">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Billing period selector */}
              {(() => {
                const tier = tiers.find((t: any) => t.id === selectedTier);
                const hasLifetime = tier?.priceLifetime != null && tier?.priceLifetime > 0;
                const price = billingPeriod === "monthly" ? tier?.priceMonthly
                  : billingPeriod === "annual" ? tier?.priceAnnual
                  : (tier?.priceLifetime ?? 0);
                return (
                  <>
                    {tier?.priceMonthly > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Billing Period</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["monthly", "annual", ...(hasLifetime ? ["lifetime"] : [])] as const).map((p) => (
                            <button key={p} onClick={() => setBillingPeriod(p as any)}
                              className={`py-2 rounded-lg text-sm font-medium border transition-all capitalize ${billingPeriod === p ? "border-violet-600 bg-violet-50 text-violet-700" : "border text-muted-foreground hover:bg-muted/30"}`}
                            >{p}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-bold text-foreground text-lg">
                        {price === 0 ? "Free" : `$${price}`}
                        {price > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">/{billingPeriod === "lifetime" ? "once" : billingPeriod === "annual" ? "yr" : "mo"}</span>}
                      </span>
                    </div>
                  </>
                );
              })()}

              <button
                onClick={() => {
                  if (!email.trim()) return;
                  subscribeMutation.mutate({ tierId: selectedTier, billingPeriod, email, name });
                }}
                disabled={subscribeMutation.isPending || !email.trim()}
                className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: primaryColor }}
              >
                {subscribeMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Subscribe & Get Access</>
                )}
              </button>
              <p className="text-xs text-center text-muted-foreground">Secure checkout · Cancel anytime</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>{app.name} · Powered by <a href="/" className="text-violet-600 hover:underline">Selovox</a></p>
      </div>
    </div>
  );
}
