import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Clapperboard, Sparkles, Download, Trash2, RefreshCw,
  CheckCircle2, XCircle, Loader2, Play, ChevronRight,
  TrendingUp, Film, Mic2, Palette, ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Platform { id: string; label: string; aspect: string; icon: string }
interface StyleOpt  { id: string; label: string; preview: string }
interface VoiceOpt  { id: string; label: string; accent: string }
interface CaptionOpt{ id: string; label: string }
interface Config {
  enabled: boolean; platforms: Platform[]; styles: StyleOpt[];
  voices: VoiceOpt[]; captions: CaptionOpt[];
}
interface VideoJob {
  id: number; title: string; niche: string; platform: string; style: string;
  status: string; hook?: string; problem?: string; solution?: string; cta?: string;
  fullScript?: string; jobKey?: string; createdAt: string;
  liveProgress?: number; liveMessage?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status, progress, message }: { status: string; progress?: number; message?: string }) {
  if (status === "done")       return <Badge className="bg-green-600 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</Badge>;
  if (status === "failed")     return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
  if (status === "generating") return (
    <Badge className="bg-violet-600 text-white gap-1 animate-pulse">
      <Loader2 className="w-3 h-3 animate-spin" />
      {progress != null ? `${progress}%` : "Generating…"}
    </Badge>
  );
  return <Badge variant="outline">Draft</Badge>;
}

const PLATFORM_ICONS: Record<string, string> = { tiktok: "📱", youtube: "▶️", instagram: "📷", facebook: "👥" };

// ─── Script Preview Card ──────────────────────────────────────────────────────

function ScriptPreview({ job }: { job: VideoJob }) {
  return (
    <div className="space-y-3 text-sm">
      {[
        { label: "🎣 Hook",     text: job.hook },
        { label: "😤 Problem",  text: job.problem },
        { label: "✅ Solution", text: job.solution },
        { label: "🚀 CTA",     text: job.cta },
      ].map(({ label, text }) => text ? (
        <div key={label} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-violet-400 mb-1">{label}</p>
          <p className="text-white leading-relaxed">{text}</p>
        </div>
      ) : null)}
    </div>
  );
}

// ─── Active Job Poller ────────────────────────────────────────────────────────

function ActiveJobCard({ job, onDone, onDelete }: { job: VideoJob; onDone: () => void; onDelete: () => void }) {
  const { toast } = useToast();
  const [polled, setPolled] = useState<VideoJob>(job);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (polled.status !== "generating") return;
    intervalRef.current = setInterval(async () => {
      try {
        const data = await api<VideoJob>(`/video-agent/job/${job.id}`);
        setPolled(data);
        if (data.status !== "generating") { clearInterval(intervalRef.current); onDone(); }
      } catch {}
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [job.id, polled.status]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `/api/video-agent/download/${job.id}`;
    a.download = `video-${job.id}.mp4`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <Card className="bg-slate-900 border-slate-700 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-lg">{PLATFORM_ICONS[polled.platform] || "🎬"}</span>
            <h3 className="font-semibold text-white text-sm truncate">{polled.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={polled.status} progress={polled.liveProgress} message={polled.liveMessage} />
            <span className="text-xs text-muted-foreground">{polled.niche}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {polled.status === "done" && (
            <Button size="sm" onClick={handleDownload} className="bg-violet-600 hover:bg-violet-700 gap-1 text-xs">
              <Download className="w-3 h-3" /> Download
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-950/30 p-2">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {polled.status === "generating" && (
        <div className="space-y-1">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all duration-700"
                 style={{ width: `${polled.liveProgress || 5}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{polled.liveMessage || "Rendering your video…"}</p>
        </div>
      )}

      {(polled.hook || polled.problem) && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-violet-400 hover:text-violet-300 font-medium select-none">
            View Script ▾
          </summary>
          <div className="mt-2">
            <ScriptPreview job={polled} />
          </div>
        </details>
      )}
    </Card>
  );
}

// ─── Create Video Wizard ──────────────────────────────────────────────────────

function CreateWizard({ config, onDone }: { config: Config; onDone: (job: VideoJob) => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [niche,        setNiche]        = useState("");
  const [platform,     setPlatform]     = useState("tiktok");
  const [voiceId,      setVoiceId]      = useState("af_sky");
  const [style,        setStyle]        = useState("dark_pro");
  const [captionStyle, setCaptionStyle] = useState("subtitle");
  const [preview, setPreview] = useState<{ hook: string; problem: string; solution: string; cta: string } | null>(null);

  const generateMut = useMutation({
    mutationFn: () => api.post("/video-agent/generate", { niche, platform, voiceId, style, captionStyle }).then(r => r.data as { job: VideoJob; script: { hook: string; problem: string; solution: string; cta: string } }),
    onSuccess: (data) => {
      setPreview(data.script);
      setStep(3);
      toast({ title: "Script generated!", description: "Reviewing script — then your video renders automatically." });
      setTimeout(() => { onDone(data.job); }, 3000);
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const NICHES = [
    "Productivity", "Make Money Online", "Fitness & Health", "Personal Finance",
    "Digital Marketing", "Online Courses", "E-commerce", "AI Tools",
    "Mindset & Self-Help", "Passive Income",
  ];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step >= s ? "bg-violet-600 text-white" : "bg-slate-700 text-muted-foreground"}`}>{s}</div>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-violet-600" : "bg-slate-700"}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === 1 ? "Topic & Platform" : step === 2 ? "Voice & Style" : "Generating…"}
        </span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-white mb-2 block">What's your product/topic?</Label>
            <Textarea
              placeholder="e.g. 'AI writing tool that helps bloggers 10× their output in 30 days'"
              value={niche} onChange={e => setNiche(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-muted-foreground resize-none h-20"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NICHES.map(n => (
                <button key={n} onClick={() => setNiche(n)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-muted-foreground hover:border-violet-500 hover:text-violet-400 transition-colors">
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Platform</Label>
            <div className="grid grid-cols-2 gap-3">
              {config.platforms.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                    ${platform === p.id ? "border-violet-500 bg-violet-950/40 text-white" : "border-slate-700 bg-slate-800/50 text-muted-foreground hover:border-slate-500"}`}>
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs opacity-60">{p.aspect}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => setStep(2)} disabled={!niche.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 gap-2">
            Next: Style <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-5">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div>
            <Label className="text-sm font-medium text-white mb-3 block flex items-center gap-2">
              <Palette className="w-4 h-4" /> Visual Style
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {config.styles.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all text-sm
                    ${style === s.id ? "border-violet-500 bg-violet-950/40 text-white" : "border-slate-700 bg-slate-800/50 text-muted-foreground hover:border-slate-600"}`}>
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: s.preview }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-white mb-3 block flex items-center gap-2">
              <Mic2 className="w-4 h-4" /> Voice
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {config.voices.map(v => (
                <button key={v.id} onClick={() => setVoiceId(v.id)}
                  className={`p-2.5 rounded-lg border text-left text-sm transition-all
                    ${voiceId === v.id ? "border-violet-500 bg-violet-950/40 text-white" : "border-slate-700 bg-slate-800/50 text-muted-foreground hover:border-slate-600"}`}>
                  <div className="font-medium">{v.label}</div>
                  <div className="text-xs opacity-60">{v.accent}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-white mb-3 block">Captions</Label>
            <div className="flex flex-wrap gap-2">
              {config.captions.map(c => (
                <button key={c.id} onClick={() => setCaptionStyle(c.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all
                    ${captionStyle === c.id ? "border-violet-500 bg-violet-950/40 text-violet-300" : "border-slate-700 text-muted-foreground hover:border-slate-600"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 gap-2 h-12 text-base font-semibold">
            {generateMut.isPending
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating script + video…</>
              : <><Sparkles className="w-5 h-5" /> Generate Video</>}
          </Button>
        </div>
      )}

      {/* Step 3 — Script preview while rendering starts */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" /> <span className="font-semibold">Script ready — video rendering started!</span>
          </div>
          <ScriptPreview job={{ ...preview, id: 0, title: "", niche, platform, style, status: "done", createdAt: "" }} />
          <p className="text-xs text-muted-foreground text-center">Check My Videos tab to download when ready.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideoAgentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"create" | "jobs">("create");

  const { data: config } = useQuery<Config>({
    queryKey: ["video-agent-config"],
    queryFn: () => api.get("/video-agent/config").then(r => r.data),
  });

  const { data: jobs = [], refetch: refetchJobs } = useQuery<VideoJob[]>({
    queryKey: ["video-agent-jobs"],
    queryFn: () => api.get("/video-agent/jobs").then(r => r.data),
    refetchInterval: ({ state }: any) => {
      const arr: VideoJob[] = Array.isArray(state?.data) ? state.data : [];
      return arr.some(j => j.status === "generating") ? 6000 : false;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/video-agent/job/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["video-agent-jobs"] }); },
  });

  const handleDownload = (job: VideoJob) => {
    const a = document.createElement("a");
    a.href = `/api/video-agent/download/${job.id}`;
    a.download = `video-${job.id}.mp4`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const generatingCount = jobs.filter(j => j.status === "generating").length;

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!config.enabled) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center px-4">
        <Clapperboard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Video Agent Unavailable</h2>
        <p className="text-muted-foreground">This feature is currently disabled. Contact your admin to enable it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clapperboard className="w-7 h-7 text-violet-400" /> Video Marketing Agent
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI writes the script, voices it, and renders a professional video — ready to post.
            </p>
          </div>
          {generatingCount > 0 && (
            <Badge className="bg-violet-700 text-white animate-pulse gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> {generatingCount} rendering
            </Badge>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Videos", value: jobs.length, icon: Film },
            { label: "Ready to Download", value: jobs.filter(j => j.status === "done").length, icon: CheckCircle2 },
            { label: "Rendering Now", value: generatingCount, icon: Loader2 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="bg-slate-900 border-slate-700 p-4 text-center">
              <Icon className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 w-fit">
          {(["create", "jobs"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t ? "bg-violet-600 text-white shadow" : "text-muted-foreground hover:text-white"}`}>
              {t === "create" ? "✨ Create Video" : `🎬 My Videos (${jobs.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "create" && (
          <Card className="bg-slate-900 border-slate-700 p-6">
            <CreateWizard config={config} onDone={() => {
              setTab("jobs");
              queryClient.invalidateQueries({ queryKey: ["video-agent-jobs"] });
            }} />
          </Card>
        )}

        {tab === "jobs" && (
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No videos yet</p>
                <p className="text-sm mt-1">Create your first video to get started</p>
                <Button onClick={() => setTab("create")} className="mt-4 bg-violet-600 hover:bg-violet-700">
                  Create First Video
                </Button>
              </div>
            ) : (
              jobs.map(job => (
                <ActiveJobCard
                  key={job.id} job={job}
                  onDone={() => queryClient.invalidateQueries({ queryKey: ["video-agent-jobs"] })}
                  onDelete={() => deleteMut.mutate(job.id)}
                />
              ))
            )}
            <Button variant="ghost" onClick={() => refetchJobs()} className="w-full text-muted-foreground text-sm gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        )}
      </div>
  );
}
