import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Film, Lightbulb, Copy, Download, TrendingUp, Clock, Zap } from "lucide-react";
import { VoiceSpeakButton } from "@/components/VoiceSpeakButton";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const GENRES = ["Drama", "Comedy", "Thriller", "Romance", "Action", "Horror", "Sci-Fi", "Documentary", "Inspirational"];
const TONES = ["Emotional & Dramatic", "Dark & Intense", "Uplifting & Inspirational", "Comedic & Light", "Suspenseful", "Romantic"];
const DURATIONS = ["5", "10", "15", "20", "30", "45", "60", "90"];
const PLATFORMS = ["YouTube/TikTok", "YouTube", "TikTok", "Instagram Reels", "Facebook"];
const FORMATS = ["Mix of short-form and long-form", "Short-form only (under 60s)", "Long-form only (5-20 min)"];

export default function Scripts() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"movie" | "ideas">("movie");

  // Movie script state
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [tone, setTone] = useState("Emotional & Dramatic");
  const [duration, setDuration] = useState("10");
  const [scriptMode, setScriptMode] = useState<"standard" | "multimillion">("standard");
  const [scriptResult, setScriptResult] = useState<any>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  // Video ideas state
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("YouTube/TikTok");
  const [format, setFormat] = useState("Mix of short-form and long-form");
  const [ideasResult, setIdeasResult] = useState<any>(null);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const handleGenerateScript = async () => {
    if (!premise.trim()) {
      toast({ title: "Please enter a premise/story idea", variant: "destructive" });
      return;
    }
    setScriptLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/scripts/movie`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, premise, genre, tone, duration, mode: scriptMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScriptResult(data);
    } catch (e: any) {
      toast({ title: e.message ?? "Generation failed", variant: "destructive" });
    } finally {
      setScriptLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!niche.trim()) {
      toast({ title: "Please enter your niche", variant: "destructive" });
      return;
    }
    setIdeasLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/scripts/video-ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ niche, platform, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeasResult(data);
    } catch (e: any) {
      toast({ title: e.message ?? "Generation failed", variant: "destructive" });
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (!scriptResult) return;
    const text = buildScriptText(scriptResult);
    navigator.clipboard.writeText(text);
    toast({ title: "Script copied!" });
  };

  const handleDownloadScript = () => {
    if (!scriptResult) return;
    const text = buildScriptText(scriptResult);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(scriptResult.title ?? "script").replace(/\s+/g, "-")}.txt`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Script Studio</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate cinematic movie scripts and viral video ideas</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("movie")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            mode === "movie" ? "bg-primary text-white border-transparent shadow" : "bg-card text-muted-foreground border hover:border"
          }`}
        >
          <Film className="w-4 h-4" /> Movie Script
        </button>
        <button
          onClick={() => setMode("ideas")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            mode === "ideas" ? "bg-primary text-white border-transparent shadow" : "bg-card text-muted-foreground border hover:border"
          }`}
        >
          <Lightbulb className="w-4 h-4" /> Video Ideas
        </button>
      </div>

      {/* Movie Script Generator */}
      {mode === "movie" && (
        <div className="space-y-5">
          <Card className="p-6 border space-y-4">
            {/* Script mode toggle */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Script Mode</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScriptMode("standard")}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    scriptMode === "standard" ? "bg-slate-900 text-white border-transparent" : "bg-card text-muted-foreground border"
                  }`}
                >
                  🎬 Standard Script
                </button>
                <button
                  onClick={() => setScriptMode("multimillion")}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    scriptMode === "multimillion" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow" : "bg-card text-muted-foreground border"
                  }`}
                >
                  💎 Multimillion Style
                </button>
              </div>
              {scriptMode === "multimillion" && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  ✨ Multimillion mode writes like top Hollywood creators — deep emotion, cinematic scope, unforgettable dialogue
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Script Title (optional)</Label>
                <Input placeholder="Give your script a title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => <SelectItem key={d} value={d}>{d} minutes</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Story Premise / Idea *</Label>
              <Textarea
                placeholder="e.g. A struggling single mother discovers her late husband left a secret family, forcing her to confront what love and forgiveness really mean..."
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleGenerateScript}
              disabled={scriptLoading}
              className={`w-full h-12 text-base font-semibold ${scriptMode === "multimillion" ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-primary hover:bg-primary/90"}`}
            >
              {scriptLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Writing Your Script...</> : <><Film className="w-4 h-4 mr-2" /> Generate Script</>}
            </Button>
          </Card>

          {scriptResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Script header */}
              <Card className="p-6 border">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{scriptResult.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 italic">"{scriptResult.logline}"</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-primary/5 text-primary">{scriptResult.genre}</Badge>
                    <Badge className="bg-muted text-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {scriptResult.estimatedDuration}
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Synopsis</h3>
                  <p className="text-sm text-foreground leading-relaxed">{scriptResult.synopsis}</p>
                </div>

                {scriptResult.emotionalCore && (
                  <div className="bg-primary/5 rounded-xl p-4 mb-4">
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Emotional Core</h3>
                    <p className="text-sm text-primary">{scriptResult.emotionalCore}</p>
                  </div>
                )}

                {scriptResult.characters?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Characters</h3>
                    <div className="flex flex-wrap gap-2">
                      {scriptResult.characters.map((c: any, i: number) => (
                        <div key={i} className="bg-card border rounded-lg px-3 py-2 text-sm">
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-muted-foreground ml-2">— {c.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleCopyScript} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" /> Copy Script
                  </Button>
                  <Button onClick={handleDownloadScript} size="sm" className="bg-primary hover:bg-primary/90">
                    <Download className="w-4 h-4 mr-2" /> Download .txt
                  </Button>
                  <VoiceSpeakButton
                    getText={() => scriptResult ? (scriptResult.acts?.map((a: any) => a.scenes?.map((s: any) => s.dialogue ?? "").join(" ")).join(" ") ?? "") : ""}
                    compact
                  />
                </div>
              </Card>

              {/* Acts & Scenes */}
              {scriptResult.acts?.map((act: any, actIdx: number) => (
                <Card key={actIdx} className="p-6 border">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4 pb-2 border-b">{act.act}</h3>
                  <div className="space-y-5">
                    {act.scenes?.map((scene: any, sceneIdx: number) => (
                      <div key={sceneIdx} className="space-y-2">
                        <div className="font-mono text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded">
                          {scene.sceneNumber}. {scene.heading}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed pl-2">{scene.action}</p>
                        {scene.dialogue?.map((d: any, dIdx: number) => (
                          <div key={dIdx} className="ml-8 space-y-0.5">
                            <p className="font-mono text-xs font-bold text-muted-foreground text-center">{d.character}</p>
                            {d.parenthetical && <p className="font-mono text-xs text-muted-foreground text-center italic">({d.parenthetical})</p>}
                            <p className="font-mono text-sm text-foreground text-center max-w-xs mx-auto">{d.line}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {scriptResult.productionNotes && (
                <Card className="p-5 border bg-amber-50 border-amber-200">
                  <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">📽 Production Notes</h3>
                  <p className="text-sm text-amber-800">{scriptResult.productionNotes}</p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Video Ideas Generator */}
      {mode === "ideas" && (
        <div className="space-y-5">
          <Card className="p-6 border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <Label className="text-sm font-medium mb-1.5 block">Your Niche *</Label>
                <Input
                  placeholder="e.g. Personal finance, fitness, AI tools, cooking, crypto..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-1.5 block">Format Preference</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerateIdeas}
              disabled={ideasLoading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {ideasLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Finding Viral Ideas...</> : <><Lightbulb className="w-4 h-4 mr-2" /> Generate 10 Viral Video Ideas</>}
            </Button>
          </Card>

          {ideasResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {ideasResult.trendingTopics?.length > 0 && (
                <Card className="p-4 border bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Trending in {ideasResult.niche}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ideasResult.trendingTopics.map((t: string, i: number) => (
                      <Badge key={i} className="bg-green-100 text-green-800">{t}</Badge>
                    ))}
                  </div>
                  {ideasResult.bestPostingTime && (
                    <p className="text-xs text-green-700 mt-2">⏰ Best posting time: {ideasResult.bestPostingTime}</p>
                  )}
                </Card>
              )}

              <div className="space-y-3">
                {ideasResult.ideas?.map((idea: any, i: number) => (
                  <Card key={i} className="p-5 border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <h3 className="font-semibold text-foreground leading-snug">{idea.title}</h3>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Badge className={`text-xs ${idea.trendingScore >= 85 ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {idea.trendingScore}/100
                        </Badge>
                        <Badge className={`text-xs ${idea.format === "short_form" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"}`}>
                          {idea.format === "short_form" ? "Short" : "Long"}
                        </Badge>
                      </div>
                    </div>

                    <div className="ml-10 space-y-2">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-semibold text-amber-700">🪝 Opening Hook: </span>
                        <span className="text-xs text-amber-800 italic">"{idea.hook}"</span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Why it'll go viral: </span>{idea.viralAngle}
                      </p>

                      {idea.outline?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {idea.outline.map((point: string, j: number) => (
                            <span key={j} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{point}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Est. {idea.estimatedViews} views</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {idea.difficulty}</span>
                        {idea.cta && <span>CTA: {idea.cta}</span>}
                      </div>

                      {idea.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {idea.tags.map((tag: string, j: number) => (
                            <span key={j} className="text-xs text-primary">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => navigator.clipboard.writeText(ideasResult.ideas.map((idea: any, i: number) => `${i+1}. ${idea.title}\nHook: "${idea.hook}"\nWhy viral: ${idea.viralAngle}\nOutline: ${idea.outline?.join(" → ")}\n`).join("\n"))}
                variant="outline"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy All Ideas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildScriptText(s: any): string {
  let text = `${s.title?.toUpperCase() ?? "UNTITLED"}\n\n`;
  text += `LOGLINE: ${s.logline}\n`;
  text += `GENRE: ${s.genre}  |  DURATION: ${s.estimatedDuration}\n\n`;
  text += `SYNOPSIS:\n${s.synopsis}\n\n`;
  text += `EMOTIONAL CORE: ${s.emotionalCore}\n\n`;
  if (s.characters?.length) {
    text += `CHARACTERS:\n${s.characters.map((c: any) => `${c.name} — ${c.description}`).join("\n")}\n\n`;
  }
  text += "---\n\n";
  for (const act of (s.acts ?? [])) {
    text += `${act.act}\n${"=".repeat(act.act.length)}\n\n`;
    for (const scene of (act.scenes ?? [])) {
      text += `${scene.sceneNumber}. ${scene.heading}\n\n`;
      text += `${scene.action}\n\n`;
      for (const d of (scene.dialogue ?? [])) {
        text += `                    ${d.character}\n`;
        if (d.parenthetical) text += `                    (${d.parenthetical})\n`;
        text += `          ${d.line}\n\n`;
      }
    }
  }
  if (s.productionNotes) text += `\nPRODUCTION NOTES:\n${s.productionNotes}\n`;
  return text;
}
