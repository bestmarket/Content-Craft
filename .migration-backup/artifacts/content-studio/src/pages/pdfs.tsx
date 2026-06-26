import { useState } from "react";
import { useGeneratePdf, useListPdfHistory, useListPrompts } from "@workspace/api-client-react";
import { getListPdfHistoryQueryKey, getListPromptsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, Copy, BookOpen, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Pdfs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [promptId, setPromptId] = useState<string>("none");
  const [result, setResult] = useState<any>(null);
  const [tab, setTab] = useState<"create" | "history">("create");

  const generate = useGeneratePdf();
  const { data: history } = useListPdfHistory({ query: { queryKey: getListPdfHistoryQueryKey() } });
  const { data: prompts } = useListPrompts({ type: "pdf" }, { query: { queryKey: getListPromptsQueryKey({ type: "pdf" }) } });
  const activePrompts = prompts?.filter((p: any) => p.isActive) ?? [];

  const handleGenerate = () => {
    if (!topic.trim() || !authorName.trim()) {
      toast({ title: "Topic and author name are required", variant: "destructive" });
      return;
    }
    generate.mutate(
      {
        data: {
          topic,
          authorName,
          description: description || undefined,
          promptId: promptId !== "none" ? parseInt(promptId) : null,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
          queryClient.invalidateQueries({ queryKey: getListPdfHistoryQueryKey() });
        },
        onError: () => toast({ title: "PDF generation failed", variant: "destructive" }),
      }
    );
  };

  const handleDownload = () => {
    if (!result) return;
    const text = `${result.title}\n${"=".repeat(result.title?.length ?? 20)}\n\nTABLE OF CONTENTS\n${result.tableOfContents?.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}\n\n---\n\n${result.content}\n\n---\n\nABOUT THIS GUIDE\n${result.aboutSection}\n\nABOUT THE AUTHOR\n${result.authorBio}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 30).replace(/\s+/g, "-")}-guide.txt`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">PDF Studio</h1>
        <p className="text-slate-500 text-sm mt-1">Create premium, downloadable digital guides with AI</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "create" ? "default" : "outline"} size="sm" onClick={() => setTab("create")}>Create PDF</Button>
        <Button variant={tab === "history" ? "default" : "outline"} size="sm" onClick={() => setTab("history")}>
          History ({history?.length ?? 0})
        </Button>
      </div>

      {tab === "create" && (
        <div className="space-y-5">
          <Card className="p-6 border space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Topic / Subject</Label>
              <Input
                data-testid="input-topic"
                placeholder="e.g. The Complete Guide to Dropshipping in 2024"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Author Name</Label>
                <Input
                  data-testid="input-author"
                  placeholder="Your full name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
              {activePrompts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Content Style</Label>
                  <Select value={promptId} onValueChange={setPromptId}>
                    <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Default</SelectItem>
                      {activePrompts.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Additional Description (optional)</Label>
              <Textarea
                data-testid="input-description"
                placeholder="Describe your target audience, key topics to cover, or special requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              data-testid="button-generate"
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700"
            >
              {generate.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating PDF Content...</> : <><FileText className="w-4 h-4 mr-2" /> Generate Premium PDF</>}
            </Button>
          </Card>

          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-6 border">
                <h2 className="text-xl font-bold text-slate-900 mb-1">{result.title}</h2>
                <p className="text-sm text-slate-500 mb-5">Generated digital guide</p>

                {result.tableOfContents?.length > 0 && (
                  <div className="mb-5 bg-slate-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Table of Contents
                    </h3>
                    <ol className="space-y-1">
                      {result.tableOfContents.map((chapter: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600">{i + 1}. {chapter}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Full Content</h3>
                  <Textarea
                    data-testid="output-content"
                    value={result.content ?? ""}
                    readOnly
                    className="min-h-64 text-sm bg-slate-50 font-mono"
                  />
                </div>

                {result.aboutSection && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">About This Guide</h3>
                    <p className="text-sm text-slate-600">{result.aboutSection}</p>
                  </div>
                )}
                {result.authorBio && (
                  <div className="mt-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">About the Author</h3>
                    <p className="text-sm text-slate-600">{result.authorBio}</p>
                  </div>
                )}
              </Card>

              <div className="flex gap-3">
                <Button onClick={() => navigator.clipboard.writeText(result.content ?? "")} variant="outline">
                  <Copy className="w-4 h-4 mr-2" /> Copy Content
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" /> Download .txt
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <Card className="border divide-y">
          {!history || history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No PDFs generated yet
            </div>
          ) : (
            history.map((item: any) => (
              <div key={item.id} data-testid={`pdf-item-${item.id}`} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title ?? item.topic}</p>
                  <p className="text-xs text-slate-500 mt-0.5">By {item.authorName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}
