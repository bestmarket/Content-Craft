import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket, Loader2, ChevronRight, Sparkles, Zap, BarChart3,
  Code2, DollarSign, Globe, TrendingUp, CheckCircle, ArrowLeft,
} from "lucide-react";

const BUSINESS_TYPES = [
  { id: "saas_tool", icon: "⚡", label: "SaaS Web Tool", desc: "Interactive tool subscribers use daily", examples: "SEO analyzer, invoice gen, AI caption writer", ring: "ring-violet-400 bg-violet-50 border-violet-300" },
  { id: "coaching", icon: "🎯", label: "Coaching / Consulting", desc: "1:1 or group coaching subscription", examples: "Executive coaching, fitness, business consulting", ring: "ring-blue-400 bg-blue-50 border-blue-300" },
  { id: "daily_plan", icon: "🔥", label: "Daily Plan / Wellness", desc: "Day-by-day program with structured content", examples: "Weight loss, meal plans, 30-day habits", ring: "ring-orange-400 bg-orange-50 border-orange-300" },
  { id: "course", icon: "🎓", label: "Online Course", desc: "Video-based learning with modules", examples: "Marketing, coding bootcamp, language learning", ring: "ring-green-400 bg-green-50 border-green-300" },
  { id: "community", icon: "👥", label: "Membership Community", desc: "Exclusive paid community with resources", examples: "Entrepreneur mastermind, creator collective", ring: "ring-pink-400 bg-pink-50 border-pink-300" },
  { id: "newsletter", icon: "📩", label: "Paid Newsletter", desc: "Premium newsletter with subscriber insights", examples: "Finance, marketing, tech briefing", ring: "ring-amber-400 bg-amber-50 border-amber-300" },
];

const NICHE_EXAMPLES: Record<string, string[]> = {
  saas_tool: ["AI tweet thread generator for content creators", "SEO keyword research tool for bloggers", "Invoice & time tracker for freelancers"],
  coaching: ["High-performance executive productivity coaching", "Weight loss and mindset coaching for busy moms", "Business scaling coaching for 6-figure founders"],
  daily_plan: ["30-day weight loss plan for busy professionals", "Daily meal prep and nutrition tracker", "Morning routine and habit building program"],
  course: ["YouTube growth mastery from 0 to 100k", "Copywriting for SaaS founders", "Passive income with digital products"],
  community: ["7-figure entrepreneur mastermind community", "Freelancer collective for designers", "Crypto & DeFi investors club"],
  newsletter: ["Weekly growth hacks for SaaS founders", "AI tools and automation weekly briefing", "Real estate investing insights"],
};

const WHAT_YOU_GET = [
  { icon: Code2, text: "Subscriber portal" },
  { icon: DollarSign, text: "3 pricing tiers" },
  { icon: Globe, text: "Landing page" },
  { icon: TrendingUp, text: "Marketing plan" },
  { icon: Sparkles, text: "YouTube script gen" },
  { icon: Zap, text: "Voice + thumbnail" },
];

export default function SaasBuilderNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("saas_tool");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post("/saas/apps", { niche, description, businessType }).then(r => r.data),
    onSuccess: (data: any) => { setCreatedId(data.id); setStep(4); },
    onError: () => toast({ title: "Error", description: "Failed to start generation", variant: "destructive" }),
  });

  const handleNext = () => {
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      if (!niche.trim()) return toast({ title: "Add a niche", variant: "destructive" });
      if (!description.trim()) return toast({ title: "Add a description", variant: "destructive" });
      setStep(3);
      createMutation.mutate();
    }
  };

  const selected = BUSINESS_TYPES.find(t => t.id === businessType)!;
  const examples = NICHE_EXAMPLES[businessType] || [];
  const STEPS = ["Business Type", "Describe", "Generate", "Launch"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Back */}
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/saas-builder")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Back" : "All Apps"}
        </button>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
                step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>{step > i + 1 ? "✓" : i + 1}</div>
              <span className={`text-xs sm:text-sm font-medium whitespace-nowrap hidden xs:block ${step === i + 1 ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-4 sm:w-6 h-0.5 ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Business Type */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">What type of subscription business?</h2>
              <p className="text-gray-500 text-sm mt-1">AI customizes everything — portal, pricing, landing page, and marketing — for your specific type.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((bt) => (
                <button key={bt.id} onClick={() => setBusinessType(bt.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all bg-card ${
                    businessType === bt.id ? `${bt.ring} ring-2` : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{bt.icon}</span>
                    <p className="font-semibold text-gray-900 text-sm">{bt.label}</p>
                    {businessType === bt.id && <CheckCircle className="w-4 h-4 text-violet-500 ml-auto flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500">{bt.desc}</p>
                  <p className="text-xs text-gray-400 mt-1 italic">{bt.examples}</p>
                </button>
              ))}
            </div>
            <button onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-sm">
              Continue with {selected.label} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2 — Describe */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-2xl flex-shrink-0">
                {selected.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.label}</h2>
                <p className="text-gray-500 text-sm mt-0.5">Describe your niche and what subscribers get</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {WHAT_YOU_GET.map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-xs text-gray-600 bg-card border border-gray-200 rounded-lg p-2.5 shadow-sm">
                  <f.icon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" /><span>{f.text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Niche <span className="text-red-500">*</span></label>
                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder={`e.g. ${examples[0] || "describe your niche"}`}
                  className="w-full bg-card border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {examples.slice(0, 3).map((ex) => (
                    <button key={ex} onClick={() => setNiche(ex)}
                      className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors text-left">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe in Detail <span className="text-red-500">*</span></label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
                  placeholder={`Who is this for? What transformation does it deliver? What makes it unique?\n\nBe specific — the more detail, the better the AI output.`}
                  className="w-full bg-card border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-500 resize-none shadow-sm" />
              </div>
            </div>

            <button onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-sm">
              <Sparkles className="w-5 h-5" /> Generate My {selected.label}
            </button>
          </div>
        )}

        {/* Step 3 — Generating */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto text-4xl animate-pulse">
              {selected.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">AI is Building Your {selected.label}</h2>
              <p className="text-gray-500 text-sm">Building everything at once — takes about 45–90 seconds.</p>
            </div>
            <div className="space-y-2.5 text-left">
              {[
                { icon: Code2, label: `Building ${selected.label} subscriber portal` },
                { icon: DollarSign, label: "Setting up subscription tiers with smart pricing" },
                { icon: Globe, label: "Writing high-converting landing page copy" },
                { icon: TrendingUp, label: "Creating full marketing playbook" },
                { icon: BarChart3, label: "Preparing YouTube ideas & TikTok hooks" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card border border-gray-200 rounded-xl shadow-sm">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500 flex-shrink-0" />
                </div>
              ))}
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-violet-700 mb-1">✨ Generating for:</p>
              <p className="text-sm text-gray-900 font-medium">"{niche}"</p>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your {selected.label} is Being Built! 🎉</h2>
              <p className="text-gray-500 text-sm">AI is generating everything in the background. Dashboard auto-updates when ready.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { icon: selected.icon, text: "Subscriber portal" },
                { icon: "💳", text: "3 pricing tiers" },
                { icon: "📣", text: "Marketing playbook" },
                { icon: "🎬", text: "YouTube script gen" },
                { icon: "🎙", text: "Voice engine" },
                { icon: "🖼", text: "Thumbnail gen" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 bg-card border border-gray-200 rounded-xl p-3 shadow-sm">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-gray-700 font-medium text-xs">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigate(`/saas-builder/${createdId}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-sm">
                <BarChart3 className="w-4 h-4" /> Open Dashboard
              </button>
              <button onClick={() => navigate("/saas-builder")}
                className="flex-1 flex items-center justify-center gap-2 bg-card border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold transition-colors shadow-sm">
                <Zap className="w-4 h-4" /> All My Apps
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
