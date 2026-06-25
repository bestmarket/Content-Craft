import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Loader2, Copy, Download, RefreshCw, Zap,
  ChevronRight, FileText, Youtube, MessageSquare,
  BookOpen, Newspaper, Mail, Mic, CheckCircle2, Sparkles,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const STYLES = [
  { value: "youtube", label: "YouTube Script", icon: Youtube, color: "bg-red-50 border-red-200 text-red-700" },
  { value: "blog", label: "Blog Post", icon: FileText, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "storytelling", label: "Storytelling", icon: BookOpen, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "persuasive", label: "Persuasive", icon: Zap, color: "bg-orange-50 border-orange-200 text-orange-700" },
  { value: "conversational", label: "Conversational", icon: MessageSquare, color: "bg-green-50 border-green-200 text-green-700" },
  { value: "professional", label: "Professional", icon: Newspaper, color: "bg-muted/30 border text-foreground" },
  { value: "email", label: "Email", icon: Mail, color: "bg-sky-50 border-sky-200 text-sky-700" },
  { value: "podcast", label: "Podcast Script", icon: Mic, color: "bg-primary/5 border-primary/30 text-primary" },
  { value: "linkedin", label: "LinkedIn Post", icon: Brain, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { value: "pdf_chapter", label: "PDF Chapter", icon: BookOpen, color: "bg-rose-50 border-rose-200 text-rose-700" },
  { value: "twitter_thread", label: "X Thread", icon: MessageSquare, color: "bg-muted/30 border-slate-300 text-foreground" },
  { value: "poetic", label: "Poetic", icon: Sparkles, color: "bg-violet-50 border-violet-200 text-violet-700" },
];

const TONES = [
  { value: "inspiring", label: "Inspiring", emoji: "🔥" },
  { value: "empathetic", label: "Empathetic", emoji: "💙" },
  { value: "fired_up", label: "Fired Up", emoji: "⚡" },
  { value: "wise", label: "Wise", emoji: "🧠" },
  { value: "raw", label: "Raw & Honest", emoji: "💎" },
  { value: "serious", label: "Serious", emoji: "🎯" },
  { value: "reflective", label: "Reflective", emoji: "🌊" },
  { value: "humorous", label: "Humorous", emoji: "😄" },
];

const LENGTHS = [
  { value: "micro", label: "Micro", words: "~150w" },
  { value: "short", label: "Short", words: "~350w" },
  { value: "medium", label: "Medium", words: "~700w" },
  { value: "long", label: "Long", words: "~1,200w" },
  { value: "epic", label: "Epic", words: "~2,000w" },
];

type OutputTab = "markdown" | "plain" | "script" | "thread" | "pdf";

export default function ScryvoxStudio() {
  const { toast } = useToast();
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("youtube");
  const [tone, setTone] = useState("inspiring");
  const [length, setLength] = useState("medium");
  const [variation, setVariation] = useState(1);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("markdown");

  const hasScript = output?.formattedOutput?.youtubeScript;
  const hasThread = output?.formattedOutput?.twitterThread;
  const hasPdf = output?.formattedOutput?.pdfMarkdown;

  const generate = async (v = variation) => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast({ title: "Enter a topic first (min 3 characters)", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/scryvox/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: topic.trim(), style, tone, length, variation: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutput(data.output);
      setActiveTab("markdown");
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRegenerate = () => {
    const next = variation >= 5 ? 1 : variation + 1;
    setVariation(next);
    generate(next);
  };

  const getActiveText = (): string => {
    if (!output) return "";
    if (activeTab === "markdown") return output.formattedOutput.markdown;
    if (activeTab === "plain") return output.formattedOutput.plainText;
    if (activeTab === "script") return output.formattedOutput.youtubeScript ?? "";
    if (activeTab === "thread") return output.formattedOutput.twitterThread ?? "";
    if (activeTab === "pdf") return output.formattedOutput.pdfMarkdown ?? "";
    return "";
  };

  const copyToClipboard = () => {
    const text = getActiveText();
    navigator.clipboard.writeText(text).then(() => toast({ title: "Copied to clipboard!" }));
  };

  const downloadFile = () => {
    const text = getActiveText();
    const ext = activeTab === "plain" ? "txt" : "md";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scryvox-${topic.slice(0, 30).replace(/\s/g, "-")}.${ext}`;
    a.click(); URL.revokeObjectURL(url);
  };

  const scoreColor = (score: number) => score >= 75 ? "text-emerald-600 bg-emerald-50" : score >= 50 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Scryvox <span className="text-violet-600">Writer Studio</span>
          </h1>
          <p className="text-sm text-muted-foreground">Human-grade writing engine · No AI keys · Unlimited · Built-in</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
            <Zap className="w-3 h-3 mr-1" /> Powered by Scryvox
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: Controls ── */}
        <div className="space-y-5">
          {/* Topic */}
          <Card className="p-5 border">
            <label className="text-sm font-semibold text-foreground block mb-2">Topic / Subject</label>
            <Textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. how to build confidence as a creator, why most productivity advice fails, the truth about passive income..."
              className="min-h-[90px] text-sm resize-none border focus:ring-violet-500"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1.5">{topic.length}/300 — Scryvox will expand and deepen beyond what you type</p>
          </Card>

          {/* Style */}
          <Card className="p-5 border">
            <label className="text-sm font-semibold text-foreground block mb-3">Writing Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(s => {
                const Icon = s.icon;
                const active = style === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${active ? "border-violet-500 bg-violet-50 text-violet-800 shadow-sm" : "border text-muted-foreground hover:border bg-card"}`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-violet-600" : "text-muted-foreground"}`} />
                    <span className="text-center leading-tight">{s.label}</span>
                    {active && <CheckCircle2 className="w-3 h-3 text-violet-500" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Tone */}
          <Card className="p-5 border">
            <label className="text-sm font-semibold text-foreground block mb-3">Emotional Tone</label>
            <div className="grid grid-cols-4 gap-2">
              {TONES.map(t => {
                const active = tone === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${active ? "border-violet-500 bg-violet-50 text-violet-800 shadow-sm" : "border text-muted-foreground hover:border bg-card"}`}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-center leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Length + Variation */}
          <Card className="p-5 border">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-3">Length</label>
                <div className="space-y-1.5">
                  {LENGTHS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLength(l.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${length === l.value ? "border-violet-500 bg-violet-50 text-violet-800 font-medium" : "border text-muted-foreground hover:border bg-card"}`}
                    >
                      <span>{l.label}</span>
                      <span className={`text-xs ${length === l.value ? "text-violet-500" : "text-muted-foreground"}`}>{l.words}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-3">Variation</label>
                <p className="text-xs text-muted-foreground mb-3">5 unique outputs for the same topic</p>
                <div className="space-y-1.5">
                  {[1,2,3,4,5].map(v => (
                    <button
                      key={v}
                      onClick={() => setVariation(v)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${variation === v ? "border-violet-500 bg-violet-50 text-violet-800 font-medium" : "border text-muted-foreground hover:border bg-card"}`}
                    >
                      <span>Version {v}</span>
                      {variation === v && <ChevronRight className="w-3.5 h-3.5 text-violet-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Generate */}
          <Button
            onClick={() => generate()}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-base font-semibold shadow-lg shadow-violet-200"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating with Scryvox...</>
            ) : (
              <><Brain className="w-4 h-4 mr-2" />Generate with Scryvox</>
            )}
          </Button>
        </div>

        {/* ── RIGHT: Output ── */}
        <div className="space-y-4">
          {output ? (
            <>
              {/* Metadata */}
              <Card className="p-4 border">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-bold text-foreground text-base leading-snug">{output.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {output.metadata.style} · {output.metadata.tone} · {output.metadata.length}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">{output.metadata.wordCount} words</Badge>
                  <Badge variant="outline" className="text-xs">{output.metadata.estimatedReadTime}</Badge>
                  <Badge variant="outline" className={`text-xs font-semibold ${scoreColor(output.metadata.viralScore)}`}>
                    🔥 Viral Score: {output.metadata.viralScore}/100
                  </Badge>
                  <Badge variant="outline" className={`text-xs font-semibold ${scoreColor(output.metadata.humanScore)}`}>
                    👤 Human Score: {output.metadata.humanScore}/100
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    ⚡ {output.metadata.generationMs}ms
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    Topic: {output.metadata.domain}
                  </Badge>
                </div>
              </Card>

              {/* Tabs */}
              <div className="flex gap-1 bg-muted p-1 rounded-xl">
                {[
                  { key: "markdown", label: "Markdown" },
                  { key: "plain", label: "Plain Text" },
                  ...(hasScript ? [{ key: "script", label: "Script" }] : []),
                  ...(hasThread ? [{ key: "thread", label: "Thread" }] : []),
                  ...(hasPdf ? [{ key: "pdf", label: "PDF Ready" }] : []),
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as OutputTab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Output text */}
              <Card className="p-0 border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Output · Version {variation}</span>
                  <div className="flex gap-2">
                    <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button onClick={downloadFile} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
                <textarea
                  ref={outputRef}
                  readOnly
                  value={getActiveText()}
                  className="w-full h-[480px] p-4 text-sm text-foreground leading-relaxed font-mono resize-none focus:outline-none bg-card"
                />
              </Card>

              {/* Regenerate */}
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={loading}
                className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Regenerate as Version {variation >= 5 ? 1 : variation + 1}
              </Button>
            </>
          ) : (
            <Card className="h-full min-h-[600px] border-dashed border-2 border flex flex-col items-center justify-center text-center p-8 bg-muted/30/50">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-violet-500" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Ready to Write</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Enter your topic, choose a style and tone, then let Scryvox build premium human-grade content — no API keys needed.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {["12 writing styles", "8 emotional tones", "5 unique variations", "Viral + human scoring", "YouTube-ready scripts", "PDF-ready chapters"].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-violet-400 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
