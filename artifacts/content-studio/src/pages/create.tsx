import { useState } from "react";
import { useGenerateContent, useListPrompts, useListSettings } from "@workspace/api-client-react";
import { getListPromptsQueryKey, getListSettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download, ExternalLink, Sparkles, Check, Zap, Crown } from "lucide-react";
import { VoiceSpeakButton } from "@/components/VoiceSpeakButton";
import UsageBanner from "@/components/UsageBanner";
import { Link } from "wouter";
import { useUsage, isLimitReached } from "@/hooks/use-usage";

const NICHE_TEMPLATES: Record<string, { topic: string; platform: string; tone: string }[]> = {
  youtube: [
    { topic: "How I made $10,000 in 30 days from home with no experience", platform: "youtube", tone: "emotional" },
    { topic: "5 things I wish I knew before starting my business", platform: "youtube", tone: "conversational" },
    { topic: "The truth about getting rich that nobody tells you", platform: "youtube", tone: "viral_hook" },
    { topic: "How to lose 10 pounds in 30 days without the gym", platform: "youtube", tone: "motivational" },
  ],
  tiktok: [
    { topic: "POV: you discovered the app that pays you to watch videos", platform: "tiktok", tone: "viral_hook" },
    { topic: "Things broke people do vs rich people mindset", platform: "tiktok", tone: "comedic" },
    { topic: "This morning routine changed my life in 21 days", platform: "tiktok", tone: "emotional" },
    { topic: "AI tools that will replace your entire job in 2025", platform: "tiktok", tone: "suspenseful" },
  ],
  facebook: [
    { topic: "I quit my 9-to-5 and here's what actually happened", platform: "facebook", tone: "emotional" },
    { topic: "Why most people stay broke even when they work hard", platform: "facebook", tone: "conversational" },
    { topic: "The parenting mistake I almost made that changed everything", platform: "facebook", tone: "emotional" },
    { topic: "3 ways to make money online that actually work in 2025", platform: "facebook", tone: "friendly" },
  ],
  twitter: [
    { topic: "10 brutal truths about building wealth nobody wants to hear", platform: "twitter", tone: "viral_hook" },
    { topic: "The one mindset shift that 10x'd my income", platform: "twitter", tone: "motivational" },
    { topic: "Underrated skills that pay more than a degree", platform: "twitter", tone: "educational" },
    { topic: "Everything you think you know about productivity is wrong", platform: "twitter", tone: "suspenseful" },
  ],
  instagram: [
    { topic: "Morning routine of a 7-figure entrepreneur", platform: "instagram", tone: "motivational" },
    { topic: "Signs you're meant to be your own boss", platform: "instagram", tone: "friendly" },
    { topic: "What financial freedom actually looks like day to day", platform: "instagram", tone: "conversational" },
    { topic: "The glow-up nobody talks about — confidence before wealth", platform: "instagram", tone: "emotional" },
  ],
};

const PLATFORMS = [
  { value: "youtube", label: "YouTube", color: "bg-red-500", emoji: "🎬" },
  { value: "tiktok", label: "TikTok", color: "bg-slate-900", emoji: "🎵" },
  { value: "facebook", label: "Facebook", color: "bg-blue-600", emoji: "👥" },
  { value: "instagram", label: "Instagram", color: "bg-pink-500", emoji: "📸" },
  { value: "twitter", label: "Twitter/X", color: "bg-sky-500", emoji: "🐦" },
];

const WORD_COUNTS = [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 6000];

const TONES = [
  { value: "viral_hook", label: "🔥 Viral Hook" },
  { value: "emotional", label: "💙 Emotional Storytelling" },
  { value: "motivational", label: "⚡ Motivational" },
  { value: "comedic", label: "😂 Comedic" },
  { value: "conversational", label: "💬 Conversational" },
  { value: "friendly", label: "😊 Friendly" },
  { value: "educational", label: "📚 Educational" },
  { value: "suspenseful", label: "😮 Suspenseful" },
];

const PLATFORM_HOOKS: Record<string, string[]> = {
  youtube: ["Wait… do you know this?", "I wish someone told me this earlier…", "This is the video that changed everything for me…"],
  tiktok: ["POV: you finally figured this out 👀", "Before you scroll… this is important", "Tell me you didn't know this without telling me 😭"],
  facebook: ["I'm going to say something most people won't…", "Real talk — this changed my life:", "Stop. Read this. It matters."],
  instagram: ["nobody talks about this 👇", "swipe if you needed to see this today", "this is your sign to start."],
  twitter: ["Hot take:", "Unpopular opinion:", "Thread 🧵 (worth 5 minutes of your time):"],
};

export default function Create() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("youtube");
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [tone, setTone] = useState("viral_hook");
  const [stylePromptId, setStylePromptId] = useState<string>("none");
  const [outputMode, setOutputMode] = useState<"plain" | "digest">("plain");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generate = useGenerateContent();
  const { data: prompts } = useListPrompts({ type: "content" }, { query: { queryKey: getListPromptsQueryKey({ type: "content" }) } });
  const { data: settings } = useListSettings({ query: { queryKey: getListSettingsQueryKey() } });

  const videoToolLink = settings?.find((s: any) => s.key === "video_tool_link")?.value ?? "#";
  const hooks = PLATFORM_HOOKS[platform] ?? [];
  const activePrompts = prompts?.filter((p: any) => p.isActive) ?? [];

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }
    generate.mutate(
      {
        data: {
          platform: platform as any,
          topic,
          wordCount,
          stylePromptId: stylePromptId !== "none" ? parseInt(stylePromptId) : null,
          outputMode,
          generateThumbnail: false,
          tone,
        } as any,
      },
      {
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Generation failed. Check API keys in admin.", variant: "destructive" }),
      }
    );
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `TITLES:\n${result.titles?.map((t: any) => `${t.title} [Virality: ${t.viralityScore}]`).join("\n")}\n\nSCRIPT:\n${result.script}\n\nDESCRIPTION:\n${result.description}\n\nTAGS: ${result.tags?.join(", ")}\n\nHASHTAGS: ${result.hashtags?.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const text = `VIRAL TITLES:\n${result.titles?.map((t: any) => `• ${t.title} [Virality Score: ${t.viralityScore}/100]`).join("\n")}\n\nSCRIPT:\n${result.script}\n\nDESCRIPTION:\n${result.description}\n\nTAGS:\n${result.tags?.join(", ")}\n\nHASHTAGS:\n${result.hashtags?.join(" ")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 30).replace(/\s+/g, "-")}-content.txt`;
    a.click();
  };

  const { data: usage } = useUsage();
  const limitHit = isLimitReached(usage, "content");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Creator</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate viral content with AI — human-sounding, emotionally engaging, platform-optimized</p>
      </div>

      <UsageBanner />

      {/* Niche Templates */}
      {(NICHE_TEMPLATES[platform] ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Viral starter topics for {platform}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(NICHE_TEMPLATES[platform] ?? []).map((t) => (
              <button
                key={t.topic}
                onClick={() => { setTopic(t.topic); setTone(t.tone); }}
                className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-all hover:border-purple-400 hover:bg-primary/5 ${topic === t.topic ? "border-purple-500 bg-primary/5 text-primary font-medium" : "border text-muted-foreground"}`}
              >
                ✨ {t.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="p-6 border">
        {/* Platform Selector */}
        <div className="mb-5">
          <Label className="text-sm font-medium text-foreground mb-2 block">Platform</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                data-testid={`platform-${p.value}`}
                onClick={() => setPlatform(p.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  platform === p.value
                    ? `${p.color} text-white border-transparent shadow-md`
                    : "bg-card text-muted-foreground border hover:border"
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div className="mb-5">
          <Label className="text-sm font-medium text-foreground mb-1.5 block">Topic / Description</Label>
          <Input
            data-testid="input-topic"
            placeholder="e.g. How to grow on YouTube in 2024 without showing your face"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-11"
          />
          {/* Quick hooks */}
          {hooks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground self-center">Quick hooks:</span>
              {hooks.map((h) => (
                <button
                  key={h}
                  onClick={() => setTopic((prev) => prev ? `${h} ${prev}` : h)}
                  className="text-xs text-primary bg-primary/5 border border-primary/30 px-2.5 py-1 rounded-full hover:bg-primary/10 transition-colors"
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tone selector */}
        <div className="mb-5">
          <Label className="text-sm font-medium text-foreground mb-2 block">Content Tone</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  tone === t.value
                    ? "bg-primary text-white border-transparent shadow"
                    : "bg-card text-muted-foreground border hover:border-primary/40 hover:text-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Writing Style */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Prompt Style</Label>
            <Select value={stylePromptId} onValueChange={setStylePromptId}>
              <SelectTrigger data-testid="select-style">
                <SelectValue placeholder="Default style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default style</SelectItem>
                {activePrompts.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Word Count */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">
              Word Count
              {wordCount && <span className="text-muted-foreground font-normal ml-1">≈ {Math.ceil(wordCount / 130)}min</span>}
            </Label>
            <Select value={String(wordCount)} onValueChange={(v) => setWordCount(parseInt(v))}>
              <SelectTrigger data-testid="select-word-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORD_COUNTS.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w.toLocaleString()} words ({Math.ceil(w / 130)} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output Mode */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-1.5 block">Output Mode</Label>
            <Select value={outputMode} onValueChange={(v) => setOutputMode(v as any)}>
              <SelectTrigger data-testid="select-output-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain script only</SelectItem>
                <SelectItem value="digest">Digest (with production notes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {limitHit ? (
          <Link href="/pricing" className="block">
            <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-lg">
              <Crown className="w-4 h-4 mr-2" /> Upgrade to Pro — Daily Limit Reached
            </Button>
          </Link>
        ) : (
          <Button
            data-testid="button-generate"
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg"
          >
            {generate.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating your viral content...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Viral Content</>
            )}
          </Button>
        )}
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Viral Titles */}
          <Card className="p-6 border">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              5 Viral Titles — Pick the Best
            </h2>
            <div className="space-y-2">
              {result.titles?.map((t: any, i: number) => (
                <div
                  key={i}
                  data-testid={`viral-title-${i}`}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigator.clipboard.writeText(t.title)}
                >
                  <span className="text-sm text-foreground leading-relaxed">{t.title}</span>
                  <Badge
                    className="flex-shrink-0 font-bold text-xs"
                    style={{
                      backgroundColor: t.viralityScore >= 85 ? "#16a34a20" : t.viralityScore >= 70 ? "#d9770620" : "#dc262620",
                      color: t.viralityScore >= 85 ? "#16a34a" : t.viralityScore >= 70 ? "#d97706" : "#dc2626",
                    }}
                  >
                    {t.viralityScore}/100
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Script */}
          <Card className="p-6 border">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Script
              <span className="ml-2 text-muted-foreground font-normal">
                {result.wordCount} words · {result.estimatedMinutes} min
              </span>
            </h2>
            <Textarea
              data-testid="output-script"
              value={result.script ?? ""}
              readOnly
              className="min-h-64 text-sm font-mono resize-y bg-muted/30"
            />
          </Card>

          {/* Description, Tags, Hashtags */}
          <Card className="p-6 border space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
              <p data-testid="output-description" className="text-sm text-foreground">{result.description}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.tags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hashtags</h3>
              <p data-testid="output-hashtags" className="text-sm text-primary font-medium">{result.hashtags?.join(" ")}</p>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCopy} variant="outline" data-testid="button-copy">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy All"}
            </Button>
            <Button onClick={handleDownload} variant="outline" data-testid="button-download">
              <Download className="w-4 h-4 mr-2" />
              Download .txt
            </Button>
            <VoiceSpeakButton
              getText={() => result ? `${result.titles?.[0]?.title ?? ""}\n\n${result.script ?? ""}` : ""}
              compact
            />
            {videoToolLink !== "#" && (
              <a href={videoToolLink} target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-to-r from-primary to-pink-600 text-white border-0" data-testid="button-video-tool">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Create Video with This Content
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
