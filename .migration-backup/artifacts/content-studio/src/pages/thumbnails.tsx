import { useState } from "react";
import { useGenerateThumbnail, useListPrompts } from "@workspace/api-client-react";
import { getListPromptsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Download } from "lucide-react";

export default function Thumbnails() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("youtube");
  const [topic, setTopic] = useState("");
  const [promptId, setPromptId] = useState<string>("none");
  const [result, setResult] = useState<any>(null);

  const generate = useGenerateThumbnail();
  const { data: prompts } = useListPrompts({ type: "thumbnail" }, { query: { queryKey: getListPromptsQueryKey({ type: "thumbnail" }) } });
  const activePrompts = prompts?.filter((p: any) => p.isActive) ?? [];

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }
    generate.mutate(
      {
        data: {
          topic,
          platform: platform as any,
          promptId: promptId !== "none" ? parseInt(promptId) : null,
        },
      },
      {
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Thumbnail generation failed", variant: "destructive" }),
      }
    );
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `thumbnail-${topic.slice(0, 20).replace(/\s+/g, "-")}.jpg`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thumbnail Generator</h1>
        <p className="text-slate-500 text-sm mt-1">Create viral, click-worthy thumbnails with AI</p>
      </div>

      <Card className="p-6 border space-y-5">
        <div>
          <Label className="text-sm font-medium mb-2 block">Platform</Label>
          <div className="flex gap-2">
            {["youtube", "tiktok"].map((p) => (
              <button
                key={p}
                data-testid={`platform-${p}`}
                onClick={() => setPlatform(p)}
                className={`px-5 py-2 rounded-lg text-sm font-medium border capitalize transition-all ${
                  platform === p ? "bg-slate-900 text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">Video Topic</Label>
          <Input
            data-testid="input-topic"
            placeholder="e.g. 5 Morning Habits of Millionaires"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {activePrompts.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Thumbnail Style</Label>
            <Select value={promptId} onValueChange={setPromptId}>
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
        )}

        <Button
          data-testid="button-generate"
          onClick={handleGenerate}
          disabled={generate.isPending}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700"
        >
          {generate.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><Image className="w-4 h-4 mr-2" /> Generate Thumbnail</>}
        </Button>
      </Card>

      {result && (
        <Card className="p-6 border animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Generated Thumbnail</h2>
          <div className="rounded-xl overflow-hidden border mb-4 bg-slate-100">
            <img
              data-testid="output-thumbnail"
              src={result.imageUrl}
              alt="Generated thumbnail"
              className="w-full object-cover"
            />
          </div>
          <Button onClick={handleDownload} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Thumbnail
          </Button>
        </Card>
      )}
    </div>
  );
}
