import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, GraduationCap, Sparkles, ArrowRight, ArrowLeft,
  Loader2, Zap, CheckCircle, Target, Users, TrendingUp, Globe,
} from "lucide-react";

const CATEGORIES = [
  { value: "business", label: "Business & Entrepreneurship", icon: "💼" },
  { value: "marketing", label: "Marketing & Sales", icon: "📣" },
  { value: "finance", label: "Finance & Investing", icon: "💰" },
  { value: "health", label: "Health & Wellness", icon: "💪" },
  { value: "mindset", label: "Mindset & Productivity", icon: "🧠" },
  { value: "technology", label: "Technology & AI", icon: "⚡" },
  { value: "creative", label: "Creative Skills", icon: "🎨" },
  { value: "education", label: "Education & Teaching", icon: "📚" },
  { value: "relationships", label: "Relationships & Communication", icon: "❤️" },
  { value: "lifestyle", label: "Lifestyle & Self-Improvement", icon: "🌟" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", desc: "No prior knowledge needed", icon: "🌱" },
  { value: "intermediate", label: "Intermediate", desc: "Some experience helpful", icon: "🚀" },
  { value: "advanced", label: "Advanced", desc: "For experienced practitioners", icon: "🏆" },
];

const TOPIC_SUGGESTIONS = [
  "How to Start a Profitable Online Business in 30 Days",
  "The Complete Guide to Financial Freedom",
  "Mastering Social Media Marketing for Small Business",
  "Mindset Secrets of Top 1% Performers",
  "Freelancing: From Zero to $10K/Month",
  "AI Tools to 10x Your Productivity",
  "The Art of High-Ticket Sales",
  "Building Passive Income Streams",
];

const STAGES = [
  { id: "topic", label: "Topic" },
  { id: "details", label: "Details" },
  { id: "generating", label: "Generating" },
];

export default function CourseCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    topic: "",
    category: "business",
    difficulty: "beginner",
    targetAudience: "",
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/courses", form),
    onSuccess: (data: any) => {
      setStep(2);
      setTimeout(() => setLocation(`/courses/${data.data.course.id}`), 3500);
    },
    onError: () => {
      toast({ title: "Failed to start course generation", variant: "destructive" });
    },
  });

  const handleNext = () => {
    if (step === 0) {
      if (!form.topic.trim() || form.topic.trim().length < 5) {
        toast({ title: "Please enter a course topic (min 5 characters)", variant: "destructive" });
        return;
      }
      setStep(1);
    } else if (step === 1) {
      createMutation.mutate();
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo bar */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Course Builder</span>
          <span className="bg-violet-500/20 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-violet-500/30">AI-Powered</span>
        </div>

        {/* Step indicator */}
        {step < 2 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  i === step ? "bg-violet-600 text-white" :
                  i < step ? "bg-violet-600/20 text-violet-300" :
                  "bg-slate-800 text-slate-500"
                }`}>
                  {i < step ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {s.label}
                </div>
                {i < STAGES.length - 1 && <div className="w-8 h-px bg-slate-700" />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">

          {/* Step 0: Topic */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">What's your course about?</h2>
                <p className="text-slate-400 text-sm">Enter any topic — our AI will build a complete premium course with 15+ lessons, a landing page, and a full marketing kit.</p>
              </div>

              <div>
                <textarea
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. How to Make $5,000/Month as a Freelance Copywriter"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNext(); } }}
                />
                <p className="text-xs text-slate-500 mt-2">Be specific — a specific topic produces higher-value content</p>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">💡 Popular Course Ideas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TOPIC_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, topic: s }))}
                      className="text-left text-xs text-slate-300 bg-slate-800/60 hover:bg-violet-600/20 hover:text-violet-200 border border-slate-700 hover:border-violet-500/50 rounded-xl px-3 py-2.5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* What you get preview */}
              <div className="bg-violet-950/30 border border-violet-500/20 rounded-2xl p-4 space-y-2">
                <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3">✨ What AI will generate for you</p>
                {[
                  "5+ modules with 15+ premium lessons (500+ words each)",
                  "High-converting sales landing page",
                  "Facebook Ads (3 variants) + FB Group post",
                  "TikTok & YouTube Shorts scripts",
                  "YouTube Long-form video script",
                  "3-email launch sequence",
                  "Professional product cover image",
                  "Viral posting tips & launch checklist",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Course Details</h2>
                <p className="text-slate-400 text-sm">Help the AI target the right audience and difficulty level.</p>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        form.category === cat.value
                          ? "bg-violet-600/20 border-violet-500 text-violet-200"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="line-clamp-1">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setForm(f => ({ ...f, difficulty: d.value }))}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center text-xs font-medium transition-all ${
                        form.difficulty === d.value
                          ? "bg-violet-600/20 border-violet-500 text-violet-200"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span className="text-xl">{d.icon}</span>
                      <span className="font-semibold">{d.label}</span>
                      <span className="text-slate-500 text-xs leading-tight">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                  Target Audience <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  value={form.targetAudience}
                  onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                  placeholder="e.g. Side hustlers who want to leave their 9-5 job"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>

              {/* Summary */}
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Course Preview</p>
                <p className="text-white font-semibold text-sm">{form.topic}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-400">{selectedCategory?.icon} {selectedCategory?.label}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">{DIFFICULTIES.find(d => d.value === form.difficulty)?.icon} {DIFFICULTIES.find(d => d.value === form.difficulty)?.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 2 && (
            <div className="text-center space-y-6 py-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse opacity-30" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="w-8 h-8 text-white animate-bounce" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Building your premium course…</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">The AI is writing 15+ high-quality lessons, a landing page, and your full marketing kit. This takes 30–60 seconds.</p>
              </div>

              <div className="space-y-2 text-left max-w-xs mx-auto">
                {[
                  "✍️ Writing premium lesson content…",
                  "🎯 Building landing page copy…",
                  "📣 Crafting Facebook & TikTok scripts…",
                  "🖼️ Generating product image…",
                  "🚀 Packaging everything for you…",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400" style={{ animationDelay: `${i * 0.4}s` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                    {item}
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-600">You'll be redirected to your course automatically…</p>
            </div>
          )}

          {/* Navigation */}
          {step < 2 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : setLocation("/courses")}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 0 ? "My Courses" : "Back"}
              </button>

              <button
                onClick={handleNext}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/25"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Starting…</>
                ) : step === 0 ? (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Course</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tagline */}
        {step < 2 && (
          <p className="text-center text-xs text-slate-600 mt-4">
            🔒 Your course is private until you publish it to the marketplace
          </p>
        )}
      </div>
    </div>
  );
}
