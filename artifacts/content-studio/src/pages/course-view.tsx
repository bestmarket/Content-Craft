import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, ChevronDown, ChevronRight, Copy, Check, Globe, Lock,
  Loader2, GraduationCap, Zap, Star, Download, ExternalLink,
  FileText, Megaphone, Image as ImageIcon, ArrowLeft, Award,
  Play, CheckCircle, AlertCircle, TrendingUp, Users, Clock,
  Sparkles, Target, Heart, Shield,
} from "lucide-react";

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-violet-400 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function LessonCard({ lesson, moduleNum }: { lesson: any; moduleNum: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {lesson.number}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{lesson.title}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{lesson.duration}</p>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-5">
          {/* Main content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {lesson.content?.split("\n\n").map((para: string, i: number) => (
              <p key={i} className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{para}</p>
            ))}
          </div>

          {/* Key Takeaways */}
          {lesson.keyTakeaways?.length > 0 && (
            <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4">
              <p className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Key Takeaways
              </p>
              <ul className="space-y-2">
                {lesson.keyTakeaways.map((t: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-violet-800 dark:text-violet-200">
                    <CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Step */}
          {lesson.actionStep && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Action Step
              </p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{lesson.actionStep}</p>
            </div>
          )}

          {/* Pro Tip */}
          {lesson.proTip && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Pro Tip
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{lesson.proTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ module: mod, defaultOpen = false }: { module: any; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-violet-500/20">
            {mod.number}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{mod.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{mod.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400 hidden sm:block">{mod.lessons?.length ?? 0} lessons</span>
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-slate-800 p-4 space-y-3">
          {/* Module goal */}
          {mod.moduleGoal && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3 flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300"><strong>Module Goal:</strong> {mod.moduleGoal}</p>
            </div>
          )}

          {/* Lessons */}
          <div className="space-y-2">
            {(mod.lessons ?? []).map((lesson: any) => (
              <LessonCard key={lesson.id} lesson={lesson} moduleNum={mod.number} />
            ))}
          </div>

          {/* Quiz */}
          {mod.quiz?.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setQuizOpen(o => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
              >
                <Award className="w-4 h-4" />
                Module Quiz ({mod.quiz.length} question{mod.quiz.length !== 1 ? "s" : ""})
                {quizOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {quizOpen && (
                <div className="mt-3 space-y-4">
                  {mod.quiz.map((q: any, qi: number) => (
                    <div key={qi} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white mb-3">{qi + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => {
                          const chosen = selectedAnswers[qi] === oi;
                          const correct = q.correctIndex === oi;
                          const revealed = selectedAnswers[qi] !== undefined;
                          return (
                            <button
                              key={oi}
                              onClick={() => setSelectedAnswers(a => ({ ...a, [qi]: oi }))}
                              className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-all ${
                                !revealed ? "border-slate-200 dark:border-slate-700 hover:border-violet-400 text-gray-700 dark:text-slate-300" :
                                correct ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" :
                                chosen ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" :
                                "border-slate-200 dark:border-slate-700 text-gray-400 dark:text-slate-500"
                              }`}
                            >
                              <span className="font-medium mr-2">{["A","B","C","D"][oi]}.</span>{opt}
                            </button>
                          );
                        })}
                      </div>
                      {selectedAnswers[qi] !== undefined && q.explanation && (
                        <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">💡 Explanation</p>
                          <p className="text-xs text-gray-600 dark:text-slate-300">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LandingPageTab({ data, price, originalPrice }: { data: any; price: string; originalPrice: string }) {
  if (!data) return <div className="text-center py-12 text-gray-400">No landing page data</div>;
  return (
    <div className="space-y-6">
      {/* Copy all button */}
      <div className="flex justify-end">
        <CopyBtn
          text={JSON.stringify(data, null, 2)}
          label="Copy All Landing Page Data"
        />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">{data.headline}</h1>
          <p className="text-violet-100 text-base mb-4 leading-relaxed">{data.subheadline}</p>
          <p className="text-violet-200 text-sm leading-relaxed mb-6">{data.heroStatement}</p>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
              <span className="text-white/60 line-through text-sm">${parseFloat(originalPrice ?? "197").toFixed(0)}</span>
              <span className="text-white font-black text-2xl ml-2">${parseFloat(price ?? "97").toFixed(0)}</span>
            </div>
            <button className="bg-white text-violet-700 font-black px-5 py-2 rounded-xl text-sm">{data.cta}</button>
          </div>
        </div>
        <div className="mt-4 flex justify-end"><CopyBtn text={data.headline + "\n" + data.subheadline} label="Copy Hero" /></div>
      </div>

      {/* Pain points */}
      {data.painPoints?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-5">
          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">😤 Are You Struggling With…</p>
          <ul className="space-y-2">
            {data.painPoints.map((p: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
                <span className="text-red-500 flex-shrink-0 mt-0.5">✗</span>{p}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end"><CopyBtn text={data.painPoints.join("\n")} label="Copy" /></div>
        </div>
      )}

      {/* What you get */}
      {data.whatYouGet?.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">✅ What You'll Get</p>
          <ul className="space-y-2">
            {data.whatYouGet.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{item}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end"><CopyBtn text={data.whatYouGet.join("\n")} label="Copy" /></div>
        </div>
      )}

      {/* Testimonials */}
      {data.testimonials?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">⭐ Student Results</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.testimonials.map((t: any, i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                <div className="flex text-amber-400 mb-2">{[...Array(t.rating ?? 5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                <p className="text-sm text-gray-700 dark:text-slate-300 italic mb-3">"{t.text}"</p>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end"><CopyBtn text={data.testimonials.map((t: any) => `"${t.text}" — ${t.name}, ${t.role}`).join("\n\n")} label="Copy All Testimonials" /></div>
        </div>
      )}

      {/* Value stack */}
      {data.valueStack?.length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 rounded-2xl p-5">
          <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-3">💎 Total Value Stack</p>
          {data.valueStack.map((v: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-violet-100 dark:border-violet-900/30 last:border-0">
              <span className="text-violet-800 dark:text-violet-200">{v.item}</span>
              <span className="font-bold text-violet-700 dark:text-violet-300 line-through">{v.value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black py-2 mt-1">
            <span className="text-gray-900 dark:text-white">Your Price Today</span>
            <span className="text-emerald-600 text-lg">${parseFloat(price ?? "97").toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Guarantee */}
      {data.guarantee && (
        <div className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
          <Shield className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">Money-Back Guarantee</p>
            <p className="text-sm text-gray-600 dark:text-slate-400">{data.guarantee}</p>
          </div>
        </div>
      )}

      {/* FAQ */}
      {data.faq?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">❓ FAQ</p>
          <div className="space-y-2">
            {data.faq.map((item: any, i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{item.q}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end"><CopyBtn text={data.faq.map((f: any) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")} label="Copy All FAQs" /></div>
        </div>
      )}
    </div>
  );
}

function AdCard({ ad }: { ad: any }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">{ad.variant}</span>
        <CopyBtn text={`${ad.headline}\n\n${ad.primaryText}\n\nCTA: ${ad.cta}`} />
      </div>
      <p className="font-black text-gray-900 dark:text-white text-sm">{ad.headline}</p>
      <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{ad.primaryText}</p>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800">
        <span className="text-xs text-gray-400">CTA Button</span>
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg">{ad.cta}</span>
      </div>
    </div>
  );
}

function ScriptCard({ title, emoji, content }: { title: string; emoji: string; content: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <span className="text-xl">{emoji}</span>{title}
        </p>
        <CopyBtn text={content} />
      </div>
      <div className="bg-gray-50 dark:bg-slate-950/50 rounded-xl p-4 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
        {content}
      </div>
    </div>
  );
}

function MarketingTab({ data }: { data: any }) {
  if (!data) return <div className="text-center py-12 text-gray-400">No marketing data</div>;

  return (
    <div className="space-y-8">

      {/* Viral Tip */}
      {data.viralTip && (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed font-medium">{data.viralTip}</p>
            <CopyBtn text={data.viralTip} label="Copy" />
          </div>
        </div>
      )}

      {/* Facebook Ads */}
      {data.facebookAds?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">📘 Facebook Ads (3 Variants)</p>
          <div className="space-y-4">
            {data.facebookAds.map((ad: any, i: number) => <AdCard key={i} ad={ad} />)}
          </div>
        </div>
      )}

      {/* FB Group Post */}
      {data.facebookGroupPost && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">👥 Facebook Group Post</p>
          <ScriptCard title="Facebook Group Post" emoji="📢" content={data.facebookGroupPost} />
        </div>
      )}

      {/* Video Scripts */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">🎬 Video Scripts</p>
        <div className="space-y-4">
          {data.tiktokScript && <ScriptCard title="TikTok Script (60–90 sec)" emoji="🎵" content={data.tiktokScript} />}
          {data.youtubeShortScript && <ScriptCard title="YouTube Shorts Script (under 60 sec)" emoji="▶️" content={data.youtubeShortScript} />}
          {data.youtubeLongScript && <ScriptCard title="YouTube Long-form Script (full video)" emoji="📹" content={data.youtubeLongScript} />}
          {data.instagramCaption && <ScriptCard title="Instagram Caption" emoji="📸" content={data.instagramCaption} />}
        </div>
      </div>

      {/* Email Sequence */}
      {data.emailSequence?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">📧 3-Email Launch Sequence</p>
          <div className="space-y-4">
            {data.emailSequence.map((email: any, i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase">Email {i + 1}</span>
                    <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">Subject: {email.subject}</p>
                    {email.preview && <p className="text-xs text-gray-400 mt-0.5">Preview: {email.preview}</p>}
                  </div>
                  <CopyBtn text={`Subject: ${email.subject}\n\n${email.body}`} />
                </div>
                <div className="bg-gray-50 dark:bg-slate-950/50 rounded-xl p-4 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                  {email.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launch Checklist */}
      {data.launchChecklist?.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">🚀 Launch Checklist</p>
          <ul className="space-y-2">
            {data.launchChecklist.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                <span className="font-bold text-emerald-500 flex-shrink-0">{i + 1}.</span>{item}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end"><CopyBtn text={data.launchChecklist.map((item: string, i: number) => `${i + 1}. ${item}`).join("\n")} label="Copy Checklist" /></div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "content", label: "Course Content", icon: BookOpen },
  { id: "landing", label: "Landing Page", icon: Globe },
  { id: "marketing", label: "Marketing Kit", icon: Megaphone },
  { id: "image", label: "Product Image", icon: ImageIcon },
];

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("content");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["course", id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data),
    refetchInterval: (q: any) => q.state?.data?.course?.stage === "building" ? 4000 : false,
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/courses/${id}/publish`, {}),
    onSuccess: (data: any) => {
      qc.setQueryData(["course", id], data.data);
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: data.data.course.isPublished ? "🌍 Course published!" : "Course unpublished" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const course = data?.course;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Course not found</p>
        <Link href="/courses"><a className="text-violet-500 text-sm mt-2 block">← Back to Courses</a></Link>
      </div>
    );
  }

  if (course.stage === "building") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
        <div className="text-center space-y-5 max-w-sm mx-auto p-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse opacity-30" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-bounce" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">Building your course…</h2>
          <p className="text-slate-400 text-sm">The AI is writing premium lesson content, your landing page, and marketing scripts. This takes 30–60 seconds.</p>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" style={{ width: "65%" }} />
          </div>
          <p className="text-xs text-slate-600">Page auto-refreshes until complete…</p>
        </div>
      </div>
    );
  }

  if (course.stage === "failed") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generation Failed</h2>
          <p className="text-gray-500 text-sm">{course.errorMessage ?? "Something went wrong during generation."}</p>
          <Link href="/courses/create">
            <button className="bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-semibold">Try Again</button>
          </Link>
        </div>
      </div>
    );
  }

  const cd = course.courseData ?? {};
  const lp = course.landingPageData ?? {};
  const mk = course.marketingData ?? {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-violet-700 via-indigo-700 to-purple-800 overflow-hidden">
        {course.coverImageUrl && (
          <img src={course.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
        )}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link href="/courses">
            <button className="flex items-center gap-1.5 text-violet-200 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> My Courses
            </button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">{course.category}</span>
                <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">{course.difficulty}</span>
                {course.isPublished && (
                  <span className="bg-emerald-400/20 backdrop-blur text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Published
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">{course.title}</h1>
              {course.subtitle && <p className="text-violet-200 text-base leading-relaxed max-w-2xl">{course.subtitle}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-violet-200">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{course.moduleCount} modules</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{course.lessonCount} lessons</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />{course.totalWordCount?.toLocaleString()} words</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                  ${parseFloat(course.price ?? "97").toFixed(0)} <span className="line-through text-violet-300/60 font-normal">${parseFloat(course.originalPrice ?? "197").toFixed(0)}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm flex-shrink-0 transition-all shadow-lg ${
                course.isPublished
                  ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  : "bg-white text-violet-700 hover:bg-violet-50"
              }`}
            >
              {publishMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
               course.isPublished ? <><Lock className="w-4 h-4" /> Unpublish</> : <><Globe className="w-4 h-4" /> Publish</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Tab nav */}
        <div className="flex items-center gap-1 overflow-x-auto py-4 border-b border-gray-200 dark:border-slate-800 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-6">

          {/* ── CONTENT TAB ─────────────────────────────────────── */}
          {tab === "content" && (
            <div className="space-y-6 max-w-4xl">
              {/* Welcome */}
              {cd.welcomeMessage && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/40 rounded-2xl p-6">
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Welcome Message
                  </p>
                  <div className="text-sm text-violet-900 dark:text-violet-200 leading-relaxed whitespace-pre-line">{cd.welcomeMessage}</div>
                </div>
              )}

              {/* What you'll learn */}
              {cd.whatYouWillLearn?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5">
                  <p className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> What You'll Learn</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {cd.whatYouWillLearn.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">📚 Course Curriculum</p>
                <div className="space-y-3">
                  {(cd.modules ?? []).map((mod: any, i: number) => (
                    <ModuleCard key={mod.id ?? i} module={mod} defaultOpen={i === 0} />
                  ))}
                </div>
              </div>

              {/* Bonuses */}
              {cd.bonusResources?.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">🎁 Bonus Resources</p>
                  <ul className="space-y-2">
                    {cd.bonusResources.map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5 fill-current" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Final message */}
              {cd.finalMessage && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-6">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Closing Message
                  </p>
                  <div className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed whitespace-pre-line">{cd.finalMessage}</div>
                </div>
              )}

              {/* Certificate */}
              {cd.certificateText && (
                <div className="border-4 border-double border-amber-300 dark:border-amber-700 rounded-2xl p-6 text-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                  <Award className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Certificate of Completion</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 italic leading-relaxed">{cd.certificateText}</p>
                </div>
              )}
            </div>
          )}

          {/* ── LANDING PAGE TAB ─────────────────────────────────── */}
          {tab === "landing" && (
            <div className="max-w-3xl">
              <LandingPageTab data={lp} price={course.price} originalPrice={course.originalPrice} />
            </div>
          )}

          {/* ── MARKETING TAB ─────────────────────────────────────── */}
          {tab === "marketing" && (
            <div className="max-w-3xl">
              <MarketingTab data={mk} />
            </div>
          )}

          {/* ── IMAGE TAB ─────────────────────────────────────── */}
          {tab === "image" && (
            <div className="max-w-lg space-y-6">
              {course.coverImageUrl ? (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700">
                    <img src={course.coverImageUrl} alt={course.title} className="w-full object-cover" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Image</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Use this image for your marketplace listing, store page, social media posts, and ads.</p>
                    <a
                      href={course.coverImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700"
                    >
                      <ExternalLink className="w-4 h-4" /> Open Full Size
                    </a>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-2xl p-4">
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-2">💡 How to Use This Image</p>
                    <ul className="space-y-1.5 text-sm text-violet-800 dark:text-violet-200">
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />Upload to your store product listing</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />Use as background in your TikTok/Reels video</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />Add to Facebook ad creative</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />Feature on your landing page hero section</li>
                      <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />Post as your Instagram product reveal</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No product image generated</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
