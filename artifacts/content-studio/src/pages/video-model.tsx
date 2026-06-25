import { useState } from "react";
import { useAnalyzeVideos, useListPrompts } from "@workspace/api-client-react";
import { getListPromptsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Video, Copy } from "lucide-react";

const PLATFORMS = ["youtube", "tiktok"];
const WORD_COUNTS = [500, 1000, 1500, 2000, 2500, 3000];

export default function VideoModel() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("youtube");
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState(1000);
  const [stylePromptId, setStylePromptId] = useState<string>("none");
  const [videoUrls, setVideoUrls] = useState<string[]>(["", ""]);
  const [result, setResult] = useState<any>(null);

  const analyze = useAnalyzeVideos();
  const { data: prompts } = useListPrompts({ type: "content" }, { query: { queryKey: getListPromptsQueryKey({ type: "content" }) } });
  const activePrompts = prompts?.filter((p: any) => p.isActive) ?? [];

  const addUrl = () => {
    if (videoUrls.length < 5) setVideoUrls([...videoUrls, ""]);
  };

  const removeUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...videoUrls];
    updated[index] = value;
    setVideoUrls(updated);
  };

  const handleAnalyze = () => {
    const validUrls = videoUrls.filter((u) => u.trim());
    if (validUrls.length === 0) {
      toast({ title: "Add at least one video URL", variant: "destructive" });
      return;
    }
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }
    analyze.mutate(
      {
        data: {
          videoUrls: validUrls,
          platform: platform as any,
          topic,
          wordCount,
          stylePromptId: stylePromptId !== "none" ? parseInt(stylePromptId) : null,
        },
      },
      {
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Video Modeler</h1>
        <p className="text-muted-foreground text-sm mt-1">Paste up to 5 viral video links and model a superior script</p>
      </div>

      <Card className="p-6 border space-y-5">
        {/* Platform */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Platform</Label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                data-testid={`platform-${p}`}
                onClick={() => setPlatform(p)}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                  platform === p ? "bg-slate-900 text-white border-transparent" : "bg-card text-muted-foreground border"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Video URLs */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Video Links ({videoUrls.length}/5)</Label>
          <div className="space-y-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  data-testid={`input-video-url-${i}`}
                  placeholder={`Paste ${platform} video URL #${i + 1}`}
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                />
                {videoUrls.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeUrl(i)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {videoUrls.length < 5 && (
            <Button variant="ghost" size="sm" onClick={addUrl} className="mt-2 text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add Another URL
            </Button>
          )}
        </div>

        {/* Topic + settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Label className="text-sm font-medium mb-1.5 block">Your Topic</Label>
            <Input
              data-testid="input-topic"
              placeholder="What is your content about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Word Count</Label>
            <Select value={String(wordCount)} onValueChange={(v) => setWordCount(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORD_COUNTS.map((w) => (
                  <SelectItem key={w} value={String(w)}>{w.toLocaleString()} words</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-medium mb-1.5 block">Writing Style</Label>
            <Select value={stylePromptId} onValueChange={setStylePromptId}>
              <SelectTrigger>
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
        </div>

        <Button
          data-testid="button-analyze"
          onClick={handleAnalyze}
          disabled={analyze.isPending}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
        >
          {analyze.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Modeling...</> : <><Video className="w-4 h-4 mr-2" /> Model These Videos</>}
        </Button>
      </Card>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6 border">
            <h2 className="text-sm font-semibold text-foreground mb-3">Modeled Viral Titles</h2>
            <div className="space-y-2">
              {result.titles?.map((t: any, i: number) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <span className="text-sm text-foreground">{t.title}</span>
                  <Badge className="flex-shrink-0 bg-green-50 text-green-700 font-bold text-xs">{t.viralityScore}/100</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Modeled Script</h2>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result.script ?? ""); }}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>
            <Textarea value={result.script ?? ""} readOnly className="min-h-64 text-sm font-mono bg-muted/30" />
            <div className="mt-3 flex flex-wrap gap-2">
              {result.hashtags?.map((h: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs text-primary">{h}</Badge>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
