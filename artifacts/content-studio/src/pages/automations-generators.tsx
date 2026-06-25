import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";
import {
  Bot, Zap, Code2, Puzzle, ArrowRight, Crown, TrendingUp,
  DollarSign, Star, Sparkles, ShoppingBag,
} from "lucide-react";

const GENERATORS = [
  {
    type: "ai_agent",
    emoji: "🤖",
    icon: Bot,
    label: "AI Agent Builder",
    description: "Build real, deployable AI chatbots — not just templates. Generates actual working code, one-line embed, conversation monitoring, and lead capture. Sell the agent or deploy it on your own site.",
    color: "from-violet-600 to-blue-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200 hover:border-violet-400",
    textColor: "text-violet-700",
    badgeColor: "bg-violet-100 text-violet-700",
    priceRange: "$99 – $299",
    demand: "🔥🔥🔥🔥🔥",
    demandLabel: "Extremely High",
    marketSize: "$2.1B market",
    exampleIdeas: ["Customer Support Agent", "Lead Qualification Agent", "Social Media Manager Agent"],
  },
  {
    type: "n8n_workflow",
    emoji: "⚡",
    icon: Zap,
    label: "n8n Workflow Templates",
    description: "Generate complete n8n/Make.com automation workflows as JSON files. Businesses pay top dollar for plug-and-play workflows.",
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200 hover:border-orange-400",
    textColor: "text-orange-700",
    badgeColor: "bg-orange-100 text-orange-700",
    priceRange: "$49 – $199",
    demand: "🔥🔥🔥🔥",
    demandLabel: "Very High",
    marketSize: "$890M market",
    exampleIdeas: ["Cold Email Automation", "Lead Scraper + CRM Sync", "Social Media Auto-Poster"],
  },
  {
    type: "replit_template",
    emoji: "💻",
    icon: Code2,
    label: "Replit App Templates",
    description: "Create complete, deployable web application templates. Developers and founders pay premium for production-ready starters.",
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200 hover:border-cyan-400",
    textColor: "text-cyan-700",
    badgeColor: "bg-cyan-100 text-cyan-700",
    priceRange: "$79 – $199",
    demand: "🔥🔥🔥🔥",
    demandLabel: "Very High",
    marketSize: "$1.4B market",
    exampleIdeas: ["SaaS Subscription Starter", "AI Chatbot App", "Marketplace Platform"],
  },
  {
    type: "chrome_extension",
    emoji: "🧩",
    icon: Puzzle,
    label: "Chrome Extension Templates",
    description: "Generate rebrandable Chrome extensions with complete code, manifest, and Chrome Store submission guide.",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200 hover:border-green-400",
    textColor: "text-green-700",
    badgeColor: "bg-green-100 text-green-700",
    priceRange: "$29 – $149",
    demand: "🔥🔥🔥",
    demandLabel: "High",
    marketSize: "$420M market",
    exampleIdeas: ["AI Writing Assistant", "LinkedIn Lead Extractor", "Price Tracker"],
  },
];

export default function AutomationsGenerators() {
  const { data: access } = useFeatureAccess();
  const isAdmin = access?.isAdmin ?? false;
  const isPremium = isAdmin || (access?.tier === "pro" || access?.tier === "enterprise");

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <UpgradeBanner featureKey="template_generators" label="Template Generator Suite" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 rounded-3xl p-8 md:p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full -translate-y-48 translate-x-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-y-32 -translate-x-32 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
              <Crown className="w-3 h-3" /> Pro Feature
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
              <Sparkles className="w-3 h-3" /> AI-Powered
            </Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Premium Template<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              Generator Suite
            </span>
          </h1>
          <p className="text-muted-foreground/60 text-lg mb-6 max-w-2xl">
            Generate high-quality, sellable templates in minutes. Each generator produces a complete product — template, landing page, cover image, marketing assets — all at once.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Sparkles, label: "AI-Generated", desc: "Full product in minutes" },
              { icon: TrendingUp, label: "Landing Page", desc: "Auto-generated sales page" },
              { icon: ShoppingBag, label: "Marketplace Ready", desc: "Publish with one click" },
              { icon: DollarSign, label: "$49–$299/sale", desc: "Premium price points" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <Icon className="w-4 h-4 text-violet-400 mb-2" />
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-muted-foreground text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GENERATORS.map((gen) => {
          const Icon = gen.icon;
          return (
            <Link key={gen.type} href={`/automations/generators/${gen.type}`}>
              <Card className={`group p-6 border-2 ${gen.borderColor} transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${gen.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                      {gen.emoji}
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-base group-hover:text-violet-700 transition-colors">
                        {gen.label}
                      </h2>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-muted-foreground">{gen.demand}</span>
                        <span className="text-xs text-muted-foreground">{gen.demandLabel}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${gen.badgeColor} border-current`}>
                    {gen.priceRange}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{gen.description}</p>

                {/* Market size */}
                <div className="flex items-center gap-1 mb-4">
                  <TrendingUp className={`w-3.5 h-3.5 ${gen.textColor}`} />
                  <span className={`text-xs font-semibold ${gen.textColor}`}>{gen.marketSize}</span>
                </div>

                {/* Example ideas */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {gen.exampleIdeas.map(idea => (
                    <span key={idea} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                      {idea}
                    </span>
                  ))}
                  <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">+ more ideas inside</span>
                </div>

                <Button className={`w-full bg-gradient-to-r ${gen.color} text-white border-0 gap-2 group-hover:shadow-lg transition-shadow`}>
                  <Icon className="w-4 h-4" />
                  Open Generator
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Marketplace CTA */}
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900">Ready to sell? The Marketplace is live</h3>
            <p className="text-sm text-amber-700">Browse what's already selling — and get inspired for your next template.</p>
          </div>
          <Link href="/marketplace">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2 flex-shrink-0">
              <ShoppingBag className="w-4 h-4" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
