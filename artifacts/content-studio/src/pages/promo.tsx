import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  ArrowRight, CheckCircle, Star, Zap, FileText, Globe, Megaphone,
  TrendingUp, DollarSign, Shield, Play, ChevronDown, Sparkles,
  ShoppingBag, BarChart3, Users, Clock, Lock, BadgeCheck,
} from "lucide-react";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); } else { setVal(Math.floor(start)); }
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

const STEPS = [
  { icon: "1", title: "Enter a simple idea", desc: "Type any topic — AI tools, fitness, money, dropshipping, mindset…", color: "from-primary to-blue-700" },
  { icon: "2", title: "AI builds your product", desc: "A premium PDF guide is created with chapters, checklists & CTAs in seconds.", color: "from-pink-600 to-pink-700" },
  { icon: "3", title: "Landing page generated", desc: "A high-converting sales page with testimonials, pricing, and CTA is auto-built.", color: "from-orange-500 to-orange-600" },
  { icon: "4", title: "Viral content for every platform", desc: "TikTok scripts, YouTube videos, Twitter threads, Facebook posts — all ready.", color: "from-green-600 to-green-700" },
  { icon: "5", title: "Publish & share your store link", desc: "Your product goes live on your personal store. Share it. Start earning.", color: "from-blue-600 to-blue-700" },
];

const TESTIMONIALS = [
  { name: "Marcus T.", role: "Digital Creator, Lagos", text: "I made my first $300 in 3 days after creating my first AI product. I never thought it would be this fast.", rating: 5, flag: "🇳🇬" },
  { name: "Sarah K.", role: "Online Entrepreneur, UK", text: "The viral campaign generator alone is worth the subscription. My TikTok views went from 200 to 50,000 in a week.", rating: 5, flag: "🇬🇧" },
  { name: "James R.", role: "Content Creator, USA", text: "I've tried 10 different tools. This is the only one that actually connects everything — create, sell, promote.", rating: 5, flag: "🇺🇸" },
  { name: "Aisha M.", role: "Freelance Marketer, Ghana", text: "Published 3 products in one afternoon. My store is already getting traffic. This is insane.", rating: 5, flag: "🇬🇭" },
  { name: "David L.", role: "Side Hustler, Canada", text: "The 'How to Sell' guide inside blew my mind. Real, actionable steps. Not the usual fluff.", rating: 5, flag: "🇨🇦" },
  { name: "Priya S.", role: "Coach & Creator, India", text: "Finally a platform built for actually making money — not just creating content that goes nowhere.", rating: 5, flag: "🇮🇳" },
];

const FEATURES = [
  { icon: FileText, title: "AI PDF Product Builder", desc: "Generate complete, sellable PDF guides with chapters, checklists, and bonus sections — with a sellability score." },
  { icon: Globe, title: "Landing Page Generator", desc: "High-converting sales pages with hero, testimonials, pricing, and CTA — automatically written." },
  { icon: ShoppingBag, title: "Personal Online Store", desc: "Your own store at /store/yourusername. Publish products. Share the link. Start selling." },
  { icon: Megaphone, title: "Viral Campaign Engine", desc: "3 TikTok scripts, 2 YouTube Shorts, 1 full YouTube video, Twitter thread, Facebook & Instagram posts." },
  { icon: TrendingUp, title: "Trending Product Finder", desc: "Discover what's selling RIGHT NOW with AI-analyzed market trends and difficulty scores." },
  { icon: DollarSign, title: "Wallet & Payouts", desc: "Track every sale in real-time. Request payouts. Your money, your way." },
];

export default function Promo() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const FAQS = [
    { q: "Do I need writing or design skills?", a: "None. The AI does everything — writing, structuring, formatting, copywriting. You just enter an idea." },
    { q: "How quickly can I make my first sale?", a: "Some users make their first sale within 24-48 hours. Results depend on how actively you promote. The 'How to Sell' guide inside gives you exact steps." },
    { q: "What platforms can I sell on?", a: "You get your own hosted store. You can also share product links directly anywhere — TikTok, Facebook, Instagram, email, WhatsApp, anywhere." },
    { q: "Is there a free trial?", a: "Yes — 2 days free, no credit card required. You can create products, generate content, and set up your store during the trial." },
    { q: "Can I sell globally?", a: "Yes. Your store accepts buyers from any country. Paystack handles Nigeria payouts; other methods available globally." },
    { q: "What types of digital products can I create?", a: "PDF guides, ebooks, how-to manuals, checklists, playbooks — any knowledge-based digital product in any niche." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Selovox
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm" className="text-muted-foreground/60 hover:text-white">Sign In</Button></Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-purple-500/30 rounded-full px-4 py-1.5 text-primary/70 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" /> AI-Powered Digital Product Platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Turn Any Idea Into a<br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Sellable Digital Product
            </span>
            <br />
            <span className="text-white">And Start Making Money</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Online in Minutes</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            Create high-quality PDF products, publish them to your own store, and promote them with viral content automatically — <strong className="text-white">all in one system.</strong>
          </p>

          <p className="text-muted-foreground mb-10 text-lg">
            No writing skills. No design skills. No marketing experience needed.<br />
            <strong className="text-primary/80">Just enter an idea. The system builds everything else.</strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/register">
              <Button size="lg" className="h-16 px-12 text-xl bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-2xl shadow-purple-900/50 font-bold">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" /> No credit card required · 2-day free trial
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["✅ Free to start", "✅ Cancel anytime", "✅ Real payouts", "✅ Works globally"].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 12000, suffix: "+", label: "Creators Using It" },
            { value: 50000, suffix: "+", label: "Products Created" },
            { value: 2, suffix: " min", label: "Avg. Time to First Product" },
            { value: 29, suffix: "/mo", label: "Pro Plan Price" },
          ].map(({ value, suffix, label }) => (
            <div key={label}>
              <p className="text-3xl font-black text-white mb-1">
                <AnimatedNumber target={value} suffix={suffix} />
              </p>
              <p className="text-muted-foreground text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">Most people struggle to make money online because…</h2>
          <p className="text-muted-foreground text-center mb-10">Sound familiar?</p>
          <div className="space-y-3">
            {[
              "They don't know what to sell",
              "They can't create professional digital products",
              "They don't know how to write marketing copy",
              "They waste months learning tools that don't connect",
              "They give up before they even make their first dollar",
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-red-950/30 border border-red-900/30 rounded-xl px-5 py-4">
                <span className="text-red-400 text-xl flex-shrink-0">✗</span>
                <p className="text-muted-foreground/60">{p}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-xl text-muted-foreground font-medium">
            So they give up before they even start.
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-24 px-6 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4 text-white">This platform does everything for you.</h2>
          <p className="text-muted-foreground text-lg mb-12">It turns your idea into a complete money-making system:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left mb-12">
            {[
              { icon: "📄", label: "A complete digital product (PDF)" },
              { icon: "🌐", label: "A high-converting sales page" },
              { icon: "🏪", label: "A personal online store" },
              { icon: "🚀", label: "Viral content for all platforms" },
              { icon: "💰", label: "A ready-to-share money-making link" },
              { icon: "📊", label: "Real-time earnings dashboard" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-green-950/30 border border-green-900/30 rounded-xl px-4 py-3">
                <span className="text-2xl">{icon}</span>
                <span className="text-white font-medium">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-2xl font-bold text-white">All in minutes.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-3">Watch how it works in under 60 seconds</h2>
            <p className="text-muted-foreground">5 steps from idea to income:</p>
          </div>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-5 items-start bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center font-black text-white flex-shrink-0 text-sm shadow-lg`}>
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="py-16 px-6 bg-gradient-to-b from-purple-950/20 to-transparent border-y border-purple-900/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Why this is different from every other tool</h2>
          <p className="text-muted-foreground/60 text-lg mb-3">Most tools stop at creation.</p>
          <p className="text-muted-foreground mb-8">This one goes further — it helps you create, sell, and promote <strong className="text-white">automatically.</strong></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {[
              { bad: "Other tools give you templates", good: "We give you AI-written, sellable products" },
              { bad: "Other tools give you content", good: "We give you a full monetization system" },
              { bad: "Other tools stop at creating", good: "We go all the way to selling and paying you" },
              { bad: "Other tools require skills", good: "We work even if you're starting from zero" },
            ].map(({ bad, good }, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-muted-foreground text-sm line-through mb-1.5">{bad}</p>
                <p className="text-green-400 font-semibold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />{good}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Everything included in one platform</h2>
            <p className="text-muted-foreground">No extra tools. No integrations. Just one system that works.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-purple-800/50 hover:-translate-y-1 transition-all group">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-900/30">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white mb-1.5">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Real people. Real results.</h2>
            <p className="text-muted-foreground">From creators and entrepreneurs across the world</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex gap-1 mb-3">
                  {Array(t.rating).fill(null).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-muted-foreground/60 text-sm italic leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.flag}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-3">Start Free. Upgrade When You're Ready.</h2>
          <p className="text-muted-foreground mb-12">No credit card required for trial. Cancel anytime.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Free */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
              <p className="text-muted-foreground text-sm font-medium mb-1">FREE TRIAL</p>
              <p className="text-4xl font-black text-white mb-1">$0</p>
              <p className="text-muted-foreground text-sm mb-6">2 days, no card needed</p>
              <ul className="space-y-2 mb-6">
                {["AI Product Builder", "Landing Page Generator", "Viral Campaign Generator", "Public Store", "Basic Analytics"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" variant="outline">Start Free Trial</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-purple-900/50 to-slate-900 border-2 border-purple-500/60 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <p className="text-primary/70 text-sm font-medium mb-1">PRO PLAN</p>
              <p className="text-4xl font-black text-white mb-1">$29<span className="text-lg text-muted-foreground font-normal">/month</span></p>
              <p className="text-muted-foreground text-sm mb-6">Everything, unlimited</p>
              <ul className="space-y-2 mb-6">
                {[
                  "Unlimited digital products",
                  "Unlimited landing pages",
                  "Unlimited stores",
                  "Unlimited viral campaigns",
                  "Priority AI generation",
                  "Full analytics dashboard",
                  "Wallet & payout system",
                  "Priority support",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 font-bold h-12">
                  Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="font-semibold text-white pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed border-t border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-6">💰</div>
          <h2 className="text-5xl font-black mb-5 leading-tight">
            Stop just consuming content…<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              start creating income from it.
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Turn your ideas into digital products people actually buy.<br />
            Your first sale could be 24 hours away.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-16 px-14 text-xl bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-2xl shadow-purple-900/50 font-bold">
              Start Free Trial — No Card Needed
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-muted-foreground text-sm mt-4">2 days free · Cancel anytime · Join 12,000+ creators</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
