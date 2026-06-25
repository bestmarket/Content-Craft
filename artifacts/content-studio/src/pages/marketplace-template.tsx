import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Star, Users, ShoppingCart, CheckCircle, Globe,
  Loader2, Crown, Zap, ExternalLink, Share2, ShieldCheck,
} from "lucide-react";

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  ai_agent:        { label: "AI Agent Template",      emoji: "🤖", color: "bg-violet-100 text-violet-700 border-violet-200" },
  n8n_workflow:    { label: "n8n Workflow Template",   emoji: "⚡", color: "bg-orange-100 text-orange-700 border-orange-200" },
  replit_template: { label: "Replit App Template",     emoji: "💻", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  chrome_extension:{ label: "Chrome Extension",        emoji: "🧩", color: "bg-green-100 text-green-700 border-green-200" },
};

export default function MarketplaceTemplate() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/marketplace/template/${id}`)
      .then(r => setTemplate(r.data))
      .catch(err => setError(err.message ?? "Template not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Template not found</h2>
          <p className="text-muted-foreground mb-6">{error ?? "This template may have been removed or is no longer available."}</p>
          <Link href="/marketplace">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[template.type] ?? { label: template.type, emoji: "📦", color: "bg-muted text-foreground" };
  const price = parseFloat(template.price ?? "0");
  const originalPrice = parseFloat(template.originalPrice ?? "0");
  const hasDiscount = originalPrice > price && originalPrice > 0;
  const rating = parseFloat(template.rating ?? "4.5");
  const lp: any = (() => {
    if (!template.landingPage && !template.landingPageData) return {};
    try {
      const raw = template.landingPage ?? template.landingPageData;
      return typeof raw === "string" ? JSON.parse(raw) : raw ?? {};
    } catch {
      return {};
    }
  })();

  const benefits: string[] = lp.benefits ?? (lp.keyBenefits ?? []);
  const testimonials: any[] = lp.testimonials ?? [];
  const faq: any[] = lp.faq ?? [];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Nav */}
      <header className="h-14 border-b bg-card flex items-center px-6 gap-4 sticky top-0 z-40 shadow-sm">
        <Link href="/marketplace">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Button>
        </Link>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className={`${meta.color} border`}>
                  {meta.emoji} {meta.label}
                </Badge>
                {template.isFeatured && (
                  <Badge className="bg-amber-500 text-white border-0 gap-1">
                    <Crown className="w-3 h-3" /> Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-black text-foreground mb-3 leading-tight">{template.title}</h1>
              {template.subtitle && (
                <p className="text-lg text-muted-foreground mb-4">{template.subtitle}</p>
              )}

              {/* Creator + Rating */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {template.authorName && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center">
                      <span className="text-violet-700 text-xs font-bold">{template.authorName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{template.authorName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-white text-white"}`} />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                  {template.reviewCount > 0 && (
                    <span className="text-sm text-muted-foreground">({template.reviewCount} reviews)</span>
                  )}
                </div>
                {(template.totalSales ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" /> {template.totalSales} sold
                  </div>
                )}
              </div>

              {/* Cover image */}
              {template.coverImageUrl && (
                <div className="rounded-2xl overflow-hidden border border mb-6">
                  <img
                    src={template.coverImageUrl}
                    alt={template.title}
                    className="w-full object-cover max-h-64"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            {(template.description || lp.heroDescription) && (
              <Card className="p-6">
                <h2 className="font-bold text-foreground text-lg mb-3">About This Template</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {template.description ?? lp.heroDescription}
                </p>
              </Card>
            )}

            {/* Problem & Solution */}
            {(lp.problemStatement || lp.solutionStatement) && (
              <div className="grid md:grid-cols-2 gap-4">
                {lp.problemStatement && (
                  <Card className="p-5 border-red-100 bg-red-50/50">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">The Problem</p>
                    <p className="text-sm text-foreground leading-relaxed">{lp.problemStatement}</p>
                  </Card>
                )}
                {lp.solutionStatement && (
                  <Card className="p-5 border-green-100 bg-green-50/50">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">The Solution</p>
                    <p className="text-sm text-foreground leading-relaxed">{lp.solutionStatement}</p>
                  </Card>
                )}
              </div>
            )}

            {/* Benefits */}
            {benefits.length > 0 && (
              <Card className="p-6">
                <h2 className="font-bold text-foreground text-lg mb-4">What You Get</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {benefits.map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{b}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div>
                <h2 className="font-bold text-foreground text-lg mb-4">What Buyers Say</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {testimonials.map((t: any, i: number) => (
                    <Card key={i} className="p-5">
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: t.stars ?? 5 }).map((_, s) => (
                          <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-foreground italic mb-3">"{t.text}"</p>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {faq.length > 0 && (
              <div>
                <h2 className="font-bold text-foreground text-lg mb-4">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {faq.map((f: any, i: number) => (
                    <Card key={i} className="p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">Q: {f.q}</p>
                      <p className="text-sm text-muted-foreground">A: {f.a}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="overflow-hidden border-2 border-violet-200 shadow-xl">
                <div className="p-6">
                  {/* Price */}
                  <div className="mb-5">
                    {hasDiscount && (
                      <p className="text-sm text-muted-foreground line-through mb-0.5">${originalPrice.toFixed(2)}</p>
                    )}
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-foreground">${price.toFixed(2)}</span>
                      {hasDiscount && (
                        <Badge className="bg-red-100 text-red-700 border-0 mb-1">
                          {Math.round((1 - price / originalPrice) * 100)}% off
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">One-time payment · Instant access</p>
                  </div>

                  {/* CTA */}
                  <Link href="/register">
                    <Button className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 font-bold text-base gap-2 mb-3">
                      <ShoppingCart className="w-5 h-5" /> Get Instant Access
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full h-10 text-sm mb-4">
                      Sign in to purchase
                    </Button>
                  </Link>

                  {/* Trust badges */}
                  <div className="space-y-2 text-xs text-muted-foreground border-t pt-4">
                    {[
                      { icon: ShieldCheck, text: "30-day money-back guarantee" },
                      { icon: Zap,         text: "Instant digital delivery" },
                      { icon: Globe,       text: "Lifetime access" },
                      { icon: ExternalLink,text: "Full documentation included" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sellability score */}
                {template.sellabilityScore && (
                  <div className="bg-muted/30 border-t px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Quality Score</span>
                      <span className={`text-sm font-black ${template.sellabilityScore >= 80 ? "text-green-600" : "text-amber-600"}`}>
                        {template.sellabilityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${template.sellabilityScore >= 80 ? "bg-green-500" : "bg-amber-500"}`}
                        style={{ width: `${template.sellabilityScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Back to marketplace */}
              <Link href="/marketplace">
                <Button variant="ghost" className="w-full mt-3 text-muted-foreground text-sm gap-2">
                  <ArrowLeft className="w-4 h-4" /> Browse More Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
