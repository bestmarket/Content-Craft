import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, Play, Pause, Download, Loader2, AudioWaveform,
  Zap, Volume2, ChevronRight, CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const CHAR_LIMIT = 3000;

function VoicePreviewBtn({ voiceId }: { voiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`/api/voice/preview/${voiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(URL.createObjectURL(blob));
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.play();
      setPlaying(true);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/70 hover:bg-card border border text-muted-foreground hover:text-primary transition-colors"
      title="Preview this voice"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : playing ? (
        <Pause className="w-3 h-3 text-primary" />
      ) : (
        <Play className="w-3 h-3" />
      )}
      {playing ? "Pause" : "Sample"}
    </button>
  );
}

export default function VoiceStudio() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("af_sky");
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [genderFilter, setGenderFilter] = useState<"All" | "Female" | "Male">("All");
  const [accentFilter, setAccentFilter] = useState<"All" | "American" | "British">("All");
  const [isStreaming, setIsStreaming] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartRef = useRef(0);
  const streamingRef = useRef(false);

  const { data: voicesData } = useQuery({
    queryKey: ["voice-voices"],
    queryFn: () => apiClient.get("/voice/voices").then(r => r.data),
  });

  const { data: clonesData } = useQuery({
    queryKey: ["voice-clones"],
    queryFn: () => apiClient.get("/voice/clones").then(r => r.data),
  });

  const voices: any[] = voicesData?.voices ?? [];
  const clones: any[] = clonesData?.clones ?? [];

  const filteredVoices = voices.filter(v => {
    if (genderFilter !== "All" && v.gender !== genderFilter) return false;
    if (accentFilter !== "All" && v.accent !== accentFilter) return false;
    return true;
  });

  const selectedVoiceInfo = voices.find(v => v.id === selectedVoice)
    ?? clones.find((c: any) => `clone:${c.id}` === selectedVoice);

  const stopCurrent = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    streamingRef.current = false;
    setIsPlaying(false);
    setIsStreaming(false);
  };

  const handleGenerate = async () => {
    if (!text.trim()) { toast({ title: "Enter some text first", variant: "destructive" }); return; }
    if (text.length > CHAR_LIMIT) { toast({ title: `Max ${CHAR_LIMIT} chars`, variant: "destructive" }); return; }

    stopCurrent();
    setIsGenerating(true);
    setAudioUrl(null);
    setProgress(0);

    const token = localStorage.getItem("token") ?? "";
    const isClone = selectedVoice.startsWith("clone:");
    const cloneId = isClone ? parseInt(selectedVoice.replace("clone:", "")) : undefined;
    const voiceId = isClone ? undefined : selectedVoice;

    try {
      // ── Try streaming first ─────────────────────────────────────────────────
      const res = await fetch("/api/voice/speak/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, voiceId, cloneId, speed }),
      });

      if (!res.ok || !res.body) throw new Error("stream_unavailable");

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      nextStartRef.current = ctx.currentTime + 0.15;
      streamingRef.current = true;
      setIsStreaming(true);

      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let firstChunk = true;
      let chunkIndex = 0;
      let totalChunks = 1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) throw new Error(parsed.error);
            if (!parsed.chunk) continue;

            totalChunks = parsed.total ?? totalChunks;
            const binary = atob(parsed.chunk);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);

            const startAt = Math.max(nextStartRef.current, ctx.currentTime + 0.05);
            source.start(startAt);
            nextStartRef.current = startAt + audioBuffer.duration;

            chunkIndex++;
            setProgress(Math.round((chunkIndex / totalChunks) * 100));

            if (firstChunk) {
              setIsGenerating(false);
              setIsPlaying(true);
              firstChunk = false;
              toast({ title: "🎙 Playing — streaming sentence by sentence" });
            }
          } catch (parseErr: any) {
            if (parseErr?.message !== "parse_error") throw parseErr;
          }
        }
      }

      setIsStreaming(false);
      setProgress(100);
    } catch (err: any) {
      // ── Fallback: non-streaming ─────────────────────────────────────────────
      if (err.message !== "stream_unavailable") {
        stopCurrent();
      }
      try {
        const res2 = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text, voiceId, cloneId, speed }),
        });
        if (!res2.ok) {
          const e = await res2.json().catch(() => ({}));
          throw new Error((e as any).error ?? "Generation failed");
        }
        const blob = await res2.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setProgress(100);
        setIsGenerating(false);
        toast({ title: "✅ Audio ready!" });
      } catch (err2: any) {
        toast({ title: err2.message ?? "Voice generation failed", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `voice-${Date.now()}.wav`;
    a.click();
  };

  useEffect(() => () => stopCurrent(), []);

  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsPlaying(false); }
  }, [audioUrl]);

  const selectedLabel = selectedVoice.startsWith("clone:")
    ? clones.find((c: any) => `clone:${c.id}` === selectedVoice)?.name ?? "Clone"
    : voices.find(v => v.id === selectedVoice)?.name ?? selectedVoice;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mic className="w-6 h-6 text-primary" />
            Voice Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered TTS — 100% on-device, no API key needed.</p>
        </div>
        <Link href="/voice/clones">
          <Button variant="outline" size="sm" className="gap-2">
            <AudioWaveform className="w-4 h-4" />
            My Clones
            <ChevronRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: text + player ── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5">
            <Label className="text-sm font-semibold text-foreground mb-2 block">Text to Speak</Label>
            <Textarea
              placeholder="Paste your script, viral hook, podcast intro, or any text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] resize-none font-mono text-sm"
              maxLength={CHAR_LIMIT}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${text.length > CHAR_LIMIT * 0.9 ? "text-orange-500" : "text-muted-foreground"}`}>
                {text.length} / {CHAR_LIMIT}
              </span>
              {text.length > 0 && (
                <button onClick={() => setText("")} className="text-xs text-muted-foreground hover:text-muted-foreground">Clear</button>
              )}
            </div>
          </Card>

          {/* Generation progress / audio player */}
          {(isStreaming || audioUrl) && (
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {isStreaming ? (
                    <span className="relative flex w-5 h-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                      <span className="relative inline-flex rounded-full w-5 h-5 bg-primary items-center justify-center">
                        <Volume2 className="w-3 h-3 text-white" />
                      </span>
                    </span>
                  ) : (
                    <Volume2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {isStreaming ? "Streaming audio…" : "Audio Ready"}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedLabel}</p>
                  {progress > 0 && progress < 100 && (
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  {progress === 100 && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">Complete</span>
                    </div>
                  )}
                </div>
              </div>
              {audioUrl && (
                <div className="flex gap-3">
                  <Button onClick={handlePlay} className="flex-1 bg-primary hover:bg-primary/90 gap-2">
                    {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" /> Download
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── Right: voice picker + controls ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Voice selector */}
          <Card className="p-4">
            <Label className="text-sm font-semibold text-foreground mb-3 block">Select Voice</Label>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(["All", "Female", "Male"] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${genderFilter === g ? "bg-primary text-white border-purple-600" : "border text-muted-foreground hover:border-primary/40"}`}
                >
                  {g}
                </button>
              ))}
              <span className="text-muted-foreground/60 self-center">|</span>
              {(["All", "American", "British"] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAccentFilter(a)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${accentFilter === a ? "bg-pink-600 text-white border-pink-600" : "border text-muted-foreground hover:border-pink-300"}`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Voice cards grid */}
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredVoices.map((v: any) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all relative ${
                      isSelected
                        ? "border-purple-500 bg-primary/5"
                        : "border-slate-150 bg-muted/30 hover:border-primary/30 hover:bg-primary/5/40"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{v.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          <Badge variant="secondary" className={`text-xs py-0 px-1 ${v.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                            {v.gender}
                          </Badge>
                          <Badge variant="secondary" className="text-xs py-0 px-1 bg-muted text-muted-foreground">
                            {v.accent}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    {v.description && (
                      <p className="text-xs text-muted-foreground leading-tight mb-2">{v.description}</p>
                    )}
                    <VoicePreviewBtn voiceId={v.id} />
                  </div>
                );
              })}
            </div>

            {/* My clones */}
            {clones.length > 0 && (
              <div className="mt-3 pt-3 border-t border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">My Clones</p>
                <div className="space-y-1.5">
                  {clones.map((c: any) => {
                    const val = `clone:${c.id}`;
                    const isSel = selectedVoice === val;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedVoice(val)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border-2 cursor-pointer transition-all ${isSel ? "border-purple-500 bg-primary/5" : "border-slate-150 bg-muted/30 hover:border-primary/30"}`}
                      >
                        <Mic className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className={`text-sm font-medium flex-1 ${isSel ? "text-primary" : "text-foreground"}`}>{c.name}</span>
                        {isSel && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Speed + Generate */}
          <Card className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground mb-3 block">
                Speed <span className="font-normal text-muted-foreground">{speed.toFixed(1)}×</span>
              </Label>
              <Slider min={0.5} max={2.0} step={0.1} value={[speed]} onValueChange={([v]) => setSpeed(v)} />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Slow</span>
                <span className="text-xs text-muted-foreground">Fast</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full bg-gradient-to-r from-primary to-pink-600 hover:opacity-90 gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Zap className="w-4 h-4" /> Generate Voice</>
              )}
            </Button>

            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-muted-foreground">⚡ Streaming mode</p>
              <p>Audio plays sentence-by-sentence — first words in seconds, not after the full clip.</p>
            </div>
          </Card>

          {clones.length === 0 && (
            <Link href="/voice/clones">
              <Card className="p-4 border-dashed border-2 border-primary/30 hover:border-purple-400 cursor-pointer transition-colors">
                <div className="text-center">
                  <Mic className="w-6 h-6 text-primary/80 mx-auto mb-1.5" />
                  <p className="text-sm font-medium text-foreground">Clone Your Voice</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload a 6-sec sample</p>
                </div>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
