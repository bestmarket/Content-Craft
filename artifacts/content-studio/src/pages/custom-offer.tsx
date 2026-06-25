import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Bot, Zap, Globe, Smartphone, Puzzle, Code2, Cpu, ArrowLeft,
  ArrowRight, Sparkles, CheckCircle, Loader2, DollarSign,
  Clock, Star, Shield, ChevronRight, MessageSquare,
} from "lucide-react";

const CATEGORIES = [
  { key: "ai_agent",        label: "AI Agent",         emoji: "🤖", desc: "Chatbot or AI-powered assistant",      icon: Bot,       color: "from-violet-500 to-primary" },
  { key: "n8n_workflow",    label: "n8n Workflow",      emoji: "⚡", desc: "Automation between your tools",        icon: Zap,       color: "from-orange-500 to-red-500" },
  { key: "website",         label: "Website",           emoji: "🌐", desc: "Landing page or business site",        icon: Globe,     color: "from-cyan-500 to-blue-600" },
  { key: "web_app",         label: "Web Application",   emoji: "💻", desc: "Full-stack SaaS or dashboard app",     icon: Code2,     color: "from-emerald-500 to-green-600" },
  { key: "mobile_app",      label: "Mobile App",        emoji: "📱", desc: "iOS/Android app (React Native/Expo)",  icon: Smartphone, color: "from-pink-500 to-rose-600" },
  { key: "chrome_extension",label: "Chrome Extension",  emoji: "🧩", desc: "Browser productivity tool",           icon: Puzzle,    color: "from-green-500 to-teal-600" },
  { key: "replit_template", label: "Replit Template",   emoji: "📦", desc: "Ready-to-deploy Replit starter",      icon: Cpu,       color: "from-indigo-500 to-blue-700" },
  { key: "custom",          label: "Something Else",    emoji: "✨", desc: "Describe your unique idea",            icon: Sparkles,  color: "from-amber-500 to-orange-600" },
];

const BUDGETS = ["< $100", "$100–$300", "$300–$700", "$700–$2,000", "$2,000–$5,000", "$5,000+", "Flexible"];
const TIMELINES = ["ASAP (1–3 days)", "1 week", "2 weeks", "1 month", "Flexible"];

const EXAMPLES: Record<string, string[]> = {
  ai_agent: [
    "A customer support chatbot for my e-commerce store that can answer FAQs, check order status, and escalate complex issues",
    "A lead qualification bot that asks visitors questions and books calls with my sales team when they're a good fit",
    "An onboarding assistant for my SaaS that guides new users through setup and answers product questions",
  ],
  n8n_workflow: [
    "Sync new Stripe payments to a Google Sheet and send a Slack notification to my team automatically",
    "Scrape leads from LinkedIn, enrich with Apollo, and add them to my CRM with a personalized email sequence",
    "When a customer cancels, trigger a win-back email sequence and notify my support team",
  ],
  website: [
    "A high-converting landing page for my consulting business with case studies, testimonials, and a booking form",
    "A portfolio site for my design agency with project galleries, about page, and contact form",
  ],
  web_app: [
    "A subscription SaaS dashboard with user auth, billing via Stripe, and usage analytics",
    "A marketplace where freelancers can post services and clients can book and pay online",
  ],
  mobile_app: [
    "A fitness tracking app where users log workouts, track progress, and share achievements",
    "A food ordering app for local restaurants with menu management and real-time order tracking",
  ],
  chrome_extension: [
    "An extension that summarizes any webpage with AI and lets me save notes with one click",
    "A LinkedIn helper that extracts contact info and adds leads to my CRM automatically",
  ],
  replit_template: [
    "A complete SaaS starter with auth, payments, dashboard, and API — ready to fork and customize",
    "A multi-tenant platform template with role-based access, billing tiers, and admin panel",
  ],
  custom: [
    "Describe your unique idea here — be as specific as possible about what you want built",
  ],
};

export default function CustomOffer() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.key === category);
  const examples = EXAMPLES[category] ?? EXAMPLES.custom;

  const handleAnalyze = async () => {
    if (!description.trim() || description.trim().length < 20) {
      toast({ title: "Tell us more", description: "Please describe your project in at least 20 characters.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      const res = await apiClient.post("/custom-offers/analyze", { title, description, category, budget, timeline });
      setAnalysis((res.data as any).analysis);
      setStep(3);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!guestEmail && !guestName) {
      toast({ title: "Contact info needed", description: "Please enter your name and email so we can reach you.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/custom-offers", {
        title, description, category, budget, timeline,
        guestEmail, guestName, aiAnalysis: analysis,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Request Submitted! 🎉</h1>
          <p className="text-muted-foreground/60 text-lg mb-2">
            We've received your custom project request.
          </p>
          <p className="text-muted-foreground mb-8">
            Our team will review your requirements and reach out to <strong className="text-white">{guestEmail}</strong> within <strong className="text-white">24 hours</strong> with a final quote and timeline.
          </p>
          <div className="bg-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground/60">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>AI estimated price: <strong className="text-white">${analysis?.suggestedPrice?.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground/60">
              <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Estimated delivery: <strong className="text-white">{analysis?.estimatedDays} days</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground/60">
              <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span>100% satisfaction guarantee — revisions included</span>
            </div>
          </div>
          <Link href="/marketplace">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/marketplace">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Marketplace
            </button>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex items-center gap-1 ${s < 4 ? "mr-1" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s ? "bg-green-500 text-white" :
                  step === s ? "bg-violet-500 text-white ring-2 ring-violet-400 ring-offset-1 ring-offset-slate-900" :
                  "bg-white/10 text-muted-foreground"
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-6 h-0.5 ${step > s ? "bg-green-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Step 1 — Category */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🛠️</div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">What do you need built?</h1>
              <p className="text-muted-foreground text-lg">Tell us the type of project and our AI will calculate a fair price instantly.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all group ${
                      category === cat.key
                        ? "border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-2">{cat.emoji}</div>
                    <div className="text-sm font-bold text-white">{cat.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cat.desc}</div>
                    {category === cat.key && (
                      <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => category && setStep(2)}
                disabled={!category}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 h-12 text-base gap-2 disabled:opacity-40"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Description */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-4xl mb-3">{selectedCat?.emoji}</div>
              <h1 className="text-3xl font-black text-white mb-2">Describe your {selectedCat?.label}</h1>
              <p className="text-muted-foreground">The more detail you give, the more accurate our AI price estimate will be.</p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-muted-foreground/60 mb-2 block">Project Title <span className="text-muted-foreground">(optional)</span></label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={`e.g. Customer Support ${selectedCat?.label} for my online store`}
                  className="bg-white/10 border-white/20 text-white placeholder:text-muted-foreground focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground/60 mb-2 block">
                  Describe exactly what you want built <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Be as specific as possible: what should it do? Who is it for? Any integrations needed? Special features?"
                  className="bg-white/10 border-white/20 text-white placeholder:text-muted-foreground resize-none focus:border-violet-400"
                />
                <p className="text-xs text-muted-foreground mt-1">{description.length} characters — aim for 100+</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Example requests — click to use</p>
                <div className="space-y-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setDescription(ex)}
                      className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/50 transition-all text-xs text-muted-foreground hover:text-white leading-relaxed"
                    >
                      <MessageSquare className="w-3 h-3 inline mr-1.5 opacity-60" />
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground/60 mb-2 block">Budget range</label>
                  <div className="flex flex-wrap gap-2">
                    {BUDGETS.map(b => (
                      <button
                        key={b}
                        onClick={() => setBudget(b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          budget === b
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground/60 mb-2 block">Timeline</label>
                  <div className="flex flex-wrap gap-2">
                    {TIMELINES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeline(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          timeline === t
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "border-white/20 text-muted-foreground hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(1)} className="border-white/20 text-muted-foreground/60 hover:bg-white/10 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || description.trim().length < 20}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 h-12 gap-2 disabled:opacity-40"
              >
                {analyzing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> AI is calculating price...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Get AI Price Estimate</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — AI Analysis / Price */}
        {step === 3 && analysis && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <h1 className="text-3xl font-black text-white mb-2">Your Custom Quote</h1>
              <p className="text-muted-foreground">AI analyzed your project requirements and generated this estimate.</p>
            </div>

            {/* Main price card */}
            <div className="bg-gradient-to-br from-violet-600/30 to-blue-700/30 border border-violet-500/40 rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="relative">
                <div className="text-sm font-semibold text-violet-300 mb-2 uppercase tracking-widest">AI Suggested Price</div>
                <div className="text-6xl font-black text-white mb-2">${analysis.suggestedPrice?.toLocaleString()}</div>
                <div className="text-muted-foreground text-sm mb-4">
                  Range: <span className="text-muted-foreground/60">${analysis.minPrice?.toLocaleString()} – ${analysis.maxPrice?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-blue-300">
                    <Clock className="w-4 h-4" />
                    <span>{analysis.estimatedDays} days delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Star className="w-4 h-4" />
                    <span className="capitalize">{analysis.complexity} complexity</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-green-300">
                    <Shield className="w-4 h-4" />
                    <span>Satisfaction guaranteed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Price breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" /> Price Breakdown
                </h3>
                <div className="space-y-2">
                  {(analysis.breakdown || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-muted-foreground/60">{item.item}</span>
                      <span className="text-sm font-bold text-white">${item.cost?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's included */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-400" /> What's Included
                </h3>
                <div className="space-y-2">
                  {(analysis.whatIsIncluded || []).map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground/60">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
                {analysis.scopeNotes && (
                  <p className="text-xs text-muted-foreground mt-4 italic">{analysis.scopeNotes}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(2)} className="border-white/20 text-muted-foreground/60 hover:bg-white/10 gap-2">
                <ArrowLeft className="w-4 h-4" /> Edit Request
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 h-12 gap-2"
              >
                Proceed to Submit <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Contact + Submit */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h1 className="text-3xl font-black text-white mb-2">Confirm & Submit</h1>
              <p className="text-muted-foreground">Enter your contact info and we'll confirm your quote within 24 hours.</p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-6 space-y-5">
              {/* Summary */}
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-violet-300 font-semibold uppercase tracking-wide">{selectedCat?.label}</div>
                  <div className="text-white font-bold mt-0.5">{title || "Custom Project"}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">${analysis?.suggestedPrice?.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{analysis?.estimatedDays} days</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground/60 mb-2 block">Your Name <span className="text-red-400">*</span></label>
                  <Input
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-white/10 border-white/20 text-white placeholder:text-muted-foreground focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground/60 mb-2 block">Email Address <span className="text-red-400">*</span></label>
                  <Input
                    type="email"
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-muted-foreground focus:border-violet-400"
                  />
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>We'll review your request and send a final quote to your email</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Payment is only processed after you approve the final quote</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Unlimited revisions until you're 100% satisfied</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Full refund if we can't deliver what you need</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(3)} className="border-white/20 text-muted-foreground/60 hover:bg-white/10 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !guestName || !guestEmail}
                className="bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-purple-500 text-white font-bold px-10 h-12 gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-40"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Submit Custom Request</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
