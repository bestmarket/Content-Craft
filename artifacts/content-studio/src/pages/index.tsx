import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowRight, Sparkles, Zap, Globe, FileText, DollarSign,
  CheckCircle, TrendingUp, Users, Star, Shield, BarChart3, Layers, Lock,
} from "lucide-react";

const TYPING_WORDS = [
  "a $10K/Month Business",
  "Your First Digital Product",
  "Passive Income on Autopilot",
  "a 6-Figure Creator Brand",
  "Revenue While You Sleep",
];

function TypingEffect() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = TYPING_WORDS[wordIdx];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 75);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % TYPING_WORDS.length);
    }
    return undefined;
  }, [displayed, deleting, wordIdx]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500">
      {displayed}
      <span className="animate-pulse text-sky-500">|</span>
    </span>
  );
}

const SOCIAL_PROOF = [
  { name: "Amara O.", result: "$31,200 in 4 months", detail: "Health & Wellness eBooks", avatar: "A" },
  { name: "Marcus T.", result: "$47,000 in 6 months", detail: "Finance PDF series", avatar: "M" },
  { name: "Priya K.", result: "$18,900 in 8 weeks", detail: "Fitness guide bundle", avatar: "P" },
  { name: "James R.", result: "$22,400 in 90 days", detail: "Self-improvement niche", avatar: "J" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose Your Market",
    desc: "Browse 200+ validated, high-demand niches — health, finance, fitness, self-improvement. Every idea is backed by real buyer demand data and suggested price points.",
    icon: TrendingUp,
    color: "from-sky-500 to-blue-600",
  },
  {
    step: "02",
    title: "AI Builds Your Product",
    desc: "Our AI engine researches, writes, and formats a complete professional PDF guide in 60 seconds — chapters, cover, bonuses, and a high-conversion sales page included.",
    icon: Sparkles,
    color: "from-blue-500 to-indigo-600",
  },
  {
    step: "03",
    title: "Launch & Get Paid",
    desc: "Your product goes live with a dedicated storefront. Share your link anywhere — social, email, DMs. Every sale lands directly in your Selovox wallet, ready to withdraw.",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-600",
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "AI Product Studio",
    desc: "Generate polished, high-value PDF guides, courses, and eBooks in any niche. Research-grade depth, professional design, ready to sell at $27–$197.",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: Globe,
    title: "High-Converting Sales Pages",
    desc: "Every product ships with a dedicated landing page — persuasive copy, social proof blocks, urgency triggers, and mobile-optimized layouts that convert cold traffic.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Zap,
    title: "Viral Content Engine",
    desc: "Generate TikTok hooks, YouTube scripts, email sequences, and Instagram carousels purpose-built to drive buyers to your product. One click, every platform.",
    color: "from-indigo-500 to-violet-600",
  },
  {
    icon: BarChart3,
    title: "200+ Trending Product Ideas",
    desc: "Real-time intelligence on the most profitable digital product opportunities. Updated daily. Every idea comes with buyer persona insights and a proven price range.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: DollarSign,
    title: "Built-In Store & Payouts",
    desc: "Your own professional storefront, zero setup. Keep 90% of every sale. Track revenue, manage orders, and withdraw earnings — all from one clean dashboard.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Layers,
    title: "Automation Engine",
    desc: "Build AI-powered workflows that run your content schedule, follow-up sequences, and product updates on autopilot — while you focus on growth.",
    color: "from-rose-500 to-pink-600",
  },
];

const TESTIMONIALS = [
  {
    name: "Amara O.",
    role: "Teacher → $31K Digital Creator",
    text: "I spent 3 years saying I'd 'start eventually.' Selovox changed that. I uploaded my knowledge about home remedies, the AI wrote a complete guide, and my store was live in under an hour. $31,200 later, I work for myself.",
    rating: 5,
  },
  {
    name: "Marcus T.",
    role: "Banker → 6-Figure Product Creator",
    text: "The platform is sophisticated in a way I didn't expect. The AI understands market positioning. My finance literacy guide has an 8.3% conversion rate on cold traffic. That's not an accident — the sales page structure is exceptional.",
    rating: 5,
  },
  {
    name: "Priya K.",
    role: "Fitness Coach → $18K in 8 Weeks",
    text: "I had an audience but no product. Selovox turned my expertise into three tiered PDF guides in an afternoon. The affiliate system brought in creators promoting me automatically. It's a real business machine.",
    rating: 5,
  },
];

const STATS = [
  { value: "$4.2M+", label: "Paid to creators" },
  { value: "120K+", label: "Products sold" },
  { value: "60s", label: "Avg. product creation time" },
  { value: "90%", label: "Revenue you keep" },
];

const TRUST_LOGOS = ["Trusted by creators in 47 countries", "SOC 2 compliant infrastructure", "256-bit SSL encryption", "Instant payouts"];

export default function Landing() {
  const [visible, setVisible] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background text-foreground">

      {/* ── NAV ── */}
      <header className="h-16 flex items-center justify-between px-4 md:px-16 border-b border-border sticky top-0 z-50 backdrop-blur-md bg-background/95">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-300/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Selo<span className="text-sky-500">vox</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold border-0 shadow-md shadow-blue-300/30">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className={`pt-20 pb-24 md:pt-28 md:pb-36 px-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(14,165,233,0.10) 0%, transparent 65%)" }}
      >
        <div className="inline-flex items-center gap-2 bg-accent border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Digital Product Platform — Join 120,000+ Creators
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05] text-foreground">
          AI Builds Your Product.<br />
          You Build&nbsp;
          <TypingEffect />
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-xl text-muted-foreground leading-relaxed mb-10">
          Selovox turns any skill, knowledge, or niche into a professional digital product and high-converting storefront — in 60 seconds, for free.{" "}
          <span className="text-foreground font-medium">No design skills. No tech knowledge. No upfront cost.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/register">
            <Button
              size="lg"
              className="h-14 px-10 text-base md:text-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold border-0 shadow-xl shadow-blue-500/20 w-full sm:w-auto"
            >
              Start Building Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base w-full sm:w-auto"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Buyer path */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="text-sm text-muted-foreground">Looking to buy instead?</span>
          <Link href="/marketplace">
            <Button variant="link" className="text-sm font-semibold text-sky-600 hover:text-sky-700 p-0 gap-1 h-auto">
              Browse the Marketplace <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
          {["✓ Free forever plan", "✓ No credit card needed", "✓ First product live in 60s", "✓ Keep 90% of revenue"].map((f) => (
            <span key={f} className="text-xs md:text-sm text-muted-foreground font-medium">{f}</span>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-5 border-y border-border bg-card/60">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {TRUST_LOGOS.map((t) => (
            <div key={t} className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-sky-500" />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent mb-1">
                {s.value}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF TICKER ── */}
      <section className="py-10 px-4 bg-accent/40 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
            🟢 &nbsp;Recent Creator Wins
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOCIAL_PROOF.map((s) => (
              <div
                key={s.name}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 hover:border-sky-400/50 hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  {s.avatar}
                </div>
                <div>
                  <p className="font-semibold text-card-foreground text-sm">{s.name}</p>
                  <p className="text-sky-500 font-black text-base leading-tight">{s.result}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">Launch in 3 Steps</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Most creators spend months building products. Selovox compresses that into an afternoon.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="relative bg-card border border-border rounded-2xl p-8 hover:border-sky-400/50 hover:shadow-lg transition-all group"
                >
                  <div className="text-6xl font-black text-border mb-5 group-hover:text-sky-200/30 transition-colors leading-none select-none dark:text-white/5">
                    {step.step}
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-card-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE QUOTE BREAK ── */}
      <section className="py-14 px-4 bg-accent/50 border-y border-border">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-3xl font-bold text-foreground mb-4 leading-snug">
            "I had the expertise but not the infrastructure. Selovox gave me a complete business — product, store, marketing — in one afternoon. $31,000 in 4 months."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">A</div>
            <div className="text-left">
              <p className="font-bold text-sky-500">Amara O.</p>
              <p className="text-xs text-muted-foreground">Teacher → Digital Creator</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-3">Full platform</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4 text-foreground">
              Every Tool You Need.<br />Nothing You Don't.
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Selovox replaces a $3,000/month tech stack — product creation, sales pages, email marketing, analytics, and payments — in one clean platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-sky-400/50 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-card-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 bg-accent/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sky-500 text-sm font-semibold uppercase tracking-widest mb-3">Creator results</p>
            <h2 className="text-3xl md:text-5xl font-black mb-3 text-foreground">Built for Serious Creators.</h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Not side-hustle dreamers. Not overnight millionaires. Real professionals building real businesses.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-card border border-border rounded-2xl p-7 hover:border-sky-400/50 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-sky-400 text-sky-400" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">"{t.text}"</p>
                <div>
                  <p className="font-bold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12 md:p-16 border border-border bg-accent/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 rounded-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-card border border-border text-sky-500 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wide shadow-sm">
              <Lock className="w-3 h-3" />
              No credit card · Cancel anytime · Free forever plan
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight text-foreground">
              Your Digital Product<br />Business Starts Now
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Amara had no product. Marcus had no audience. Priya had no tech skills. They all started with Selovox — and now they run six-figure digital businesses.{" "}
              <span className="text-foreground font-medium">The only difference is they started.</span>
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 px-12 text-base md:text-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold border-0 shadow-xl shadow-blue-500/20 w-full sm:w-auto mb-8"
              >
                Create Your Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-sky-500" /> Free to start</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-sky-500" /> First product in 60 seconds</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-sky-500" /> Secure payments</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-sky-500" /> 120,000+ creators</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
