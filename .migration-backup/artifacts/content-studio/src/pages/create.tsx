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
import { Loader2, Copy, Download, ExternalLink, Sparkles, Check } from "lucide-react";

const PLATFORMS = [
  { value: "youtube", label: "YouTube", color: "bg-red-500" },
  { value: "tiktok", label: "TikTok", color: "bg-slate-900" },
  { value: "instagram", label: "Instagram", color: "bg-pink-500" },
  { value: "facebook", label: "Facebook", color: "bg-blue-600" },
  { value: "twitter", label: "Twitter/X", color: "bg-sky-500" },
];

const WORD_COUNTS = [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 6000];

export default function Create() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("youtube");
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [stylePromptId, setStylePromptId] = useState<string>("none");
  const [outputMode, setOutputMode] = useState<"plain" | "digest">("plain");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generate = useGenerateContent();
  const { data: prompts } = useListPrompts({ type: "content" }, { query: { queryKey: getListPromptsQueryKey({ type: "content" }) } });
  const { data: settings } = useListSettings({ query: { queryKey: getListSettingsQueryKey() } });

  const videoToolLink = settings?.find((s: any) => s.key === "video_tool_link")?.value ?? "#";

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
        },
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

  const activePrompts = prompts?.filter((p: any) => p.isActive) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Creator</h1>
        <p className="text-slate-500 text-sm mt-1">Generate viral content with AI for any platform</p>
      </div>

      <Card className="p-6 border">
        {/* Platform Selector */}
        <div className="mb-5">
          <Label className="text-sm font-medium text-slate-700 mb-2 block">Platform</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                data-testid={`platform-${p.value}`}
                onClick={() => setPlatform(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  platform === p.value
                    ? `${p.color} text-white border-transparent shadow`
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div className="mb-5">
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Topic / Description</Label>
          <Input
            data-testid="input-topic"
            placeholder="e.g. How to grow on YouTube in 2024 without showing your face"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Writing Style */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Writing Style</Label>
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
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Word Count
              {wordCount && <span className="text-slate-400 font-normal ml-1">≈ {Math.ceil(wordCount / 130)}min</span>}
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
            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Output Mode</Label>
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

        <Button
          data-testid="button-generate"
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700"
        >
          {generate.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating your viral content...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Viral Content</>
          )}
        </Button>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Viral Titles */}
          <Card className="p-6 border">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">5 Viral Titles — Pick the Best</h2>
            <div className="space-y-2">
              {result.titles?.map((t: any, i: number) => (
                <div key={i} data-testid={`viral-title-${i}`} className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors">
                  <span className="text-sm text-slate-800 leading-relaxed">{t.title}</span>
                  <Badge
                    className="flex-shrink-0 font-bold text-xs"
                    style={{
                      backgroundColor: t.viralityScore >= 85 ? "#16a34a20" : t.viralityScore >= 70 ? "#d97706200" : "#dc262620",
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
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Script
              <span className="ml-2 text-slate-400 font-normal">
                {result.wordCount} words · {result.estimatedMinutes} min
              </span>
            </h2>
            <Textarea
              data-testid="output-script"
              value={result.script ?? ""}
              readOnly
              className="min-h-64 text-sm font-mono resize-y bg-slate-50"
            />
          </Card>

          {/* Description, Tags, Hashtags */}
          <Card className="p-6 border space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</h3>
              <p data-testid="output-description" className="text-sm text-slate-700">{result.description}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.tags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Hashtags</h3>
              <p data-testid="output-hashtags" className="text-sm text-purple-600 font-medium">{result.hashtags?.join(" ")}</p>
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
            <a href={videoToolLink} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" data-testid="button-video-tool">
                <ExternalLink className="w-4 h-4 mr-2" />
                Click to Create Video or Audio with this Content
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
