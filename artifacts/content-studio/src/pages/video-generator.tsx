import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Clapperboard, Sparkles, Download, Trash2, Play, Clock,
  CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, RefreshCw,
  Mic, Film, Wand2, AlertCircle, Bot, PenLine, Users, Timer, X, Eye,
  Layers,
} from "lucide-react";

const API  = (path: string) => `/api${path}`;
const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  "Content-Type": "application/json",
});

// ── Platform / Aspect Ratios ──────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "landscape", label: "YouTube",     sub: "16:9 · 1280×720",
    emoji: "▶",  color: "#ff0000", bg: "#fff0f0",
    note: "Widescreen",
  },
  {
    id: "portrait",  label: "TikTok",      sub: "9:16 · 720×1280",
    emoji: "◈",  color: "#010101", bg: "#f3f3f3",
    note: "Vertical / Shorts / Reels",
  },
  {
    id: "square",    label: "Instagram",   sub: "1:1 · 720×720",
    emoji: "□",  color: "#e1306c", bg: "#fff0f5",
    note: "Feed post",
  },
  {
    id: "facebook",  label: "Facebook",    sub: "4:3 · 960×720",
    emoji: "f",  color: "#1877f2", bg: "#f0f5ff",
    note: "News feed",
  },
];

// ── 14 Visual styles ──────────────────────────────────────────────────────────
const VIDEO_STYLES = [
  { id: "dark_pro",       name: "Dark Pro",       tag: "Classic",  from: "#6d28d9", to: "#db2777", dark: true  },
  { id: "neon",           name: "Neon City",       tag: "Vibrant",  from: "#00d282", to: "#00aaff", dark: true  },
  { id: "cinematic",      name: "Cinematic",       tag: "Gold",     from: "#a17c1a", to: "#d4af37", dark: true  },
  { id: "tech_dark",      name: "Tech Dark",       tag: "Matrix",   from: "#00b932", to: "#005019", dark: true  },
  { id: "retro_wave",     name: "Retro Wave",      tag: "80s",      from: "#ff2daa", to: "#4b00d2", dark: true  },
  { id: "clean_light",    name: "Clean Light",     tag: "Pro",      from: "#4f46e5", to: "#10b981", dark: false },
  { id: "luxury_gold",    name: "Luxury Gold",     tag: "Premium",  from: "#d4af37", to: "#b4880f", dark: true  },
  { id: "corporate",      name: "Corporate",       tag: "Business", from: "#2563eb", to: "#06b6d4", dark: false },
  { id: "sunset",         name: "Sunset Fire",     tag: "Warm",     from: "#fb7120", to: "#ef4444", dark: true  },
  { id: "particles_dark", name: "Particle Storm",  tag: "Dynamic",  from: "#7c3aed", to: "#db2777", dark: true  },
  { id: "product_launch", name: "Product Launch",  tag: "Launch",   from: "#ff3c78", to: "#ffa01e", dark: true  },
  { id: "minimal_pro",    name: "Minimal Pro",     tag: "Clean",    from: "#1e1e28", to: "#646478", dark: false },
  { id: "blueprint",      name: "Blueprint",       tag: "Tech",     from: "#3296ff", to: "#1ec8ff", dark: true  },
  { id: "neon_urban",     name: "Neon Urban",      tag: "Street",   from: "#ffdc00", to: "#ff6400", dark: true  },
];

const CAPTION_STYLES = [
  { id: "none",     name: "None",     icon: "—",   desc: "No captions"          },
  { id: "subtitle", name: "Subtitle", icon: "Sub", desc: "White on dark bar"    },
  { id: "bold",     name: "Bold",     icon: "B",   desc: "Yellow outlined text" },
  { id: "minimal",  name: "Minimal",  icon: "min", desc: "Small clean text"     },
  { id: "box",      name: "Box",      icon: "■",   desc: "Accent-colored box"   },
  { id: "neon",     name: "Neon",     icon: "✦",   desc: "Glowing neon text"    },
];

const AI_TONES = [
  { id: "promotional",  label: "Promotional",  emoji: "🚀" },
  { id: "educational",  label: "Educational",  emoji: "📚" },
  { id: "storytelling", label: "Storytelling", emoji: "✨" },
  { id: "motivational", label: "Motivational", emoji: "🔥" },
];
const AI_DURATIONS = [
  { value: 30,  label: "30s"  },
  { value: 60,  label: "60s"  },
  { value: 90,  label: "90s"  },
  { value: 120, label: "2 min"},
];
const FALLBACK_VOICES = [
  { id: "af_sky",     name: "Sky",     accent: "US" },
  { id: "am_adam",    name: "Adam",    accent: "US" },
  { id: "bf_emma",    name: "Emma",    accent: "UK" },
  { id: "bm_george",  name: "George",  accent: "UK" },
  { id: "af_bella",   name: "Bella",   accent: "US" },
  { id: "am_michael", name: "Michael", accent: "US" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDur  = (s: number | null | undefined) => {
  if (!s) return "";
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const platformOf = (id: string) => PLATFORMS.find(p => p.id === id);
const styleOf    = (id: string) => VIDEO_STYLES.find(s => s.id === id);

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Queued",    cls: "bg-muted text-muted-foreground"       },
    processing: { label: "Rendering", cls: "bg-blue-100 text-blue-700"         },
    done:       { label: "Ready",     cls: "bg-emerald-100 text-emerald-700"   },
    failed:     { label: "Failed",    cls: "bg-red-100 text-red-700"           },
  };
  const { label, cls } = m[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function CircleProgress({ pct }: { pct: number }) {
  const r = 34, cx = 42, cy = 42, circ = 2 * Math.PI * r;
  return (
    <svg width={84} height={84} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#vg-g)" strokeWidth={7}
        strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s ease" }} />
      <defs>
        <linearGradient id="vg-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Platform card ─────────────────────────────────────────────────────────────
function PlatformCard({ p, selected, onClick }: {
  p: typeof PLATFORMS[0]; selected: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col gap-1 p-2.5 sm:p-3 rounded-xl border-2 transition-all text-left w-full ${
        selected
          ? "border-purple-500 bg-primary/5 shadow-sm shadow-purple-100"
          : "border bg-card hover:border-primary/30 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none" style={{ color: p.color }}>{p.emoji}</span>
          <span className={`text-xs sm:text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
            {p.label}
          </span>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
          selected ? "border-purple-500 bg-primary" : "border-slate-300"
        }`}>
          {selected && <CheckCircle2 className="w-full h-full text-white" />}
        </div>
      </div>
      <div>
        <p className={`text-[10px] sm:text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>
          {p.sub}
        </p>
        <p className={`text-[10px] hidden sm:block ${selected ? "text-primary/80" : "text-muted-foreground"}`}>
          {p.note}
        </p>
      </div>
    </button>
  );
}

// ── Style card ─────────────────────────────────────────────────────────────────
function StyleCard({ s, selected, onClick, onPreview, previewing }: {
  s: typeof VIDEO_STYLES[0]; selected: boolean;
  onClick: () => void; onPreview: () => void; previewing: boolean;
}) {
  return (
    <div className="relative group">
      <button onClick={onClick}
        className={`w-full rounded-xl overflow-hidden h-[72px] sm:h-[78px] transition-all block ${
          selected ? "ring-2 ring-primary ring-offset-2 scale-[1.04]" : "opacity-70 hover:opacity-90 hover:scale-[1.02]"
        }`}
      >
        <div className="absolute inset-0 rounded-xl"
          style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }} />
        {!s.dark && <div className="absolute inset-0 rounded-xl bg-white/55" />}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1.5">
          <span className={`text-xs font-bold leading-tight text-center drop-shadow-sm ${s.dark ? "text-white" : "text-foreground"}`}>
            {s.name}
          </span>
          <span className={`text-[10px] leading-none ${s.dark ? "text-white/70" : "text-muted-foreground"}`}>{s.tag}</span>
        </div>
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </button>
      <button
        onClick={e => { e.stopPropagation(); onPreview(); }}
        className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-all
          ${s.dark ? "bg-black/40 text-white/90 hover:bg-black/60" : "bg-white/60 text-foreground hover:bg-white/80"}
          ${previewing ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
        title="Preview animation"
      >
        {previewing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Eye className="w-2.5 h-2.5" />}
        {previewing ? "…" : "Preview"}
      </button>
    </div>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ styleId, url, onClose }: { styleId: string; url: string; onClose: () => void }) {
  const s = styleOf(styleId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-black rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <video src={url} autoPlay loop controls className="w-full aspect-video" />
        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {s && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ background: `linear-gradient(90deg, ${s.from}, ${s.to})` }}>
                {s.name}
              </span>
            )}
            <span className="text-muted-foreground text-xs">Animation preview · ~2s</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VideoGenerator() {
  const [title,            setTitle]            = useState("");
  const [script,           setScript]           = useState("");
  const [voiceId,          setVoiceId]          = useState("af_sky");
  const [style,            setStyle]            = useState("dark_pro");
  const [captionStyle,     setCaptionStyle]     = useState("subtitle");
  const [selectedPlatforms,setSelectedPlatforms]= useState<string[]>(["landscape"]);

  const [voices,    setVoices]    = useState<any[]>(FALLBACK_VOICES);
  const [jobs,      setJobs]      = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const [previewingStyle, setPreviewingStyle] = useState<string | null>(null);
  const [previewModal,    setPreviewModal]    = useState<{ styleId: string; url: string } | null>(null);
  const previewUrlsRef = useRef<Record<string, string>>({});

  const [frameThumbnail,     setFrameThumbnail]     = useState<string | null>(null);
  const [frameThumbLoading,  setFrameThumbLoading]  = useState(false);
  const frameThumbUrlRef = useRef<string | null>(null);

  const [aiOpen,     setAiOpen]     = useState(false);
  const [aiTopic,    setAiTopic]    = useState("");
  const [aiTone,     setAiTone]     = useState("promotional");
  const [aiAudience, setAiAudience] = useState("");
  const [aiDuration, setAiDuration] = useState(60);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState("");

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollSet     = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetch(API("/voice/voices"), { headers: auth() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.voices?.length) setVoices(d.voices); })
      .catch(() => {});
  }, []);

  const loadJobs = useCallback(() => {
    fetch(API("/video-generator/jobs"), { headers: auth() })
      .then(r => r.ok ? r.json() : { jobs: [] })
      .then(d => setJobs(d.jobs ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const startPollJob = (jobId: number) => {
    if (pollSet.current.has(jobId)) return;
    pollSet.current.add(jobId);
    const timer = setInterval(async () => {
      try {
        const r = await fetch(API(`/video-generator/jobs/${jobId}`), { headers: auth() });
        if (!r.ok) return;
        const j = await r.json();
        setActiveJob((prev: any) => prev?.id === jobId ? j : prev);
        setJobs(prev => prev.map(p => p.id === jobId ? j : p));
        if (j.status === "done" || j.status === "failed") {
          clearInterval(timer);
          pollSet.current.delete(jobId);
          loadJobs();
        }
      } catch {}
    }, 2500);
    if (pollRef.current === null) pollRef.current = timer;
  };

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    Object.values(previewUrlsRef.current).forEach(URL.revokeObjectURL);
    if (frameThumbUrlRef.current) URL.revokeObjectURL(frameThumbUrlRef.current);
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(p => p !== id) : prev   // keep at least 1
        : [...prev, id]
    );
  };

  // ── Generate (single or batch) ──────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!title.trim() || !script.trim()) { setError("Please fill in both the title and script."); return; }
    setError(""); setLoading(true);

    const isBatch = selectedPlatforms.length > 1;

    try {
      const created: any[] = [];
      for (const ratio of selectedPlatforms) {
        const r = await fetch(API("/video-generator/jobs"), {
          method: "POST", headers: auth(),
          body: JSON.stringify({
            title:       title.trim(),
            script:      script.trim(),
            voiceId,
            style,
            captionStyle,
            aspectRatio: ratio,
          }),
        });
        const job = await r.json();
        if (!r.ok) throw new Error(job.error ?? "Failed");
        created.push(job);
      }
      setJobs(prev => [...created.reverse(), ...prev]);
      setActiveJob(created[0]);
      created.forEach(j => startPollJob(j.id));
    } catch (e: any) { setError(e.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (jobId: number) => {
    await fetch(API(`/video-generator/jobs/${jobId}`), { method: "DELETE", headers: auth() }).catch(() => {});
    setJobs(prev => prev.filter(j => j.id !== jobId));
    if (activeJob?.id === jobId) setActiveJob(null);
  };

  const handleDownload = async (job: any) => {
    try {
      const r = await fetch(API(`/video-generator/jobs/${job.id}/download`), { headers: auth() });
      if (!r.ok) throw new Error("Download failed");
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      const plat = job.aspectRatio ? `-${job.aspectRatio}` : "";
      a.download = `viralcraft-${(job.title || "video").replace(/[^a-z0-9]/gi, "-").toLowerCase()}${plat}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { alert("Download failed — please try again."); }
  };

  const handlePreview = async (styleId: string) => {
    if (previewUrlsRef.current[styleId]) {
      setPreviewModal({ styleId, url: previewUrlsRef.current[styleId] });
      return;
    }
    setPreviewingStyle(styleId);
    try {
      const ratio = selectedPlatforms[0] ?? "landscape";
      const r = await fetch(
        API(`/video-generator/preview/${styleId}?caption=${captionStyle}&aspect_ratio=${ratio}`),
        { headers: auth() },
      );
      if (!r.ok) throw new Error("Preview failed");
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      previewUrlsRef.current[styleId] = url;
      setPreviewModal({ styleId, url });
    } catch { alert("Could not generate preview — please try again."); }
    finally { setPreviewingStyle(null); }
  };

  const handleFrameThumb = async () => {
    if (!title.trim()) return;
    if (frameThumbUrlRef.current) {
      URL.revokeObjectURL(frameThumbUrlRef.current);
      frameThumbUrlRef.current = null;
    }
    setFrameThumbnail(null);
    setFrameThumbLoading(true);
    try {
      const params = new URLSearchParams({ caption: captionStyle, title: title.trim() });
      const r = await fetch(API(`/video-generator/thumbnail/${style}?${params}`), { headers: auth() });
      if (!r.ok) throw new Error("failed");
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      frameThumbUrlRef.current = url;
      setFrameThumbnail(url);
    } catch { setFrameThumbnail(null); }
    finally  { setFrameThumbLoading(false); }
  };

  const handleAiWrite = async () => {
    if (!aiTopic.trim()) { setAiError("Please enter a topic."); return; }
    setAiError(""); setAiLoading(true);
    try {
      const r = await fetch(API("/video-generator/write-script"), {
        method: "POST", headers: auth(),
        body: JSON.stringify({ topic: aiTopic.trim(), tone: aiTone,
          targetAudience: aiAudience.trim() || "general audience", durationSeconds: aiDuration }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setTitle(d.title ?? aiTopic); setScript(d.script ?? "");
      setAiOpen(false); setAiTopic("");
    } catch (e: any) { setAiError(e.message ?? "Generation failed"); }
    finally { setAiLoading(false); }
  };

  const wc  = script.trim().split(/\s+/).filter(Boolean).length;
  const est = Math.max(15, Math.round(wc / 2.5));
  const isBatch = selectedPlatforms.length > 1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-0 space-y-6 pb-12">

      {previewModal && (
        <PreviewModal styleId={previewModal.styleId} url={previewModal.url}
          onClose={() => setPreviewModal(null)} />
      )}

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Clapperboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Video Generator</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            14 cinematic styles · Human character animation · 1920×1080 HD · 30 FPS · 4 platforms
          </p>
        </div>
      </div>

      {/* ── Active job(s) progress ── */}
      {activeJob && (activeJob.status === "pending" || activeJob.status === "processing") && (
        <div className="bg-card rounded-2xl border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0 hidden sm:block">
              <CircleProgress pct={activeJob.progress ?? 0} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                {activeJob.progress ?? 0}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  <span className="font-semibold text-foreground text-sm sm:text-base">Rendering animated video…</span>
                </div>
                <span className="text-sm font-bold text-foreground sm:hidden">{activeJob.progress ?? 0}%</span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">{activeJob.statusMessage || "Starting up…"}</p>
              {activeJob.aspectRatio && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(() => { const p = platformOf(activeJob.aspectRatio); return p ? (
                    <span className="text-xs text-muted-foreground">
                      <span style={{ color: p.color }}>{p.emoji}</span> {p.label} ({p.sub})
                    </span>
                  ) : null; })()}
                </div>
              )}
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${activeJob.progress ?? 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Video player ── */}
      {activeJob?.status === "done" && (
        <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
          {/* Video aspect ratio wrapper */}
          <div className={`relative mx-auto overflow-hidden bg-black ${
            activeJob.aspectRatio === "portrait" ? "w-full max-w-[280px] sm:max-w-sm" : "w-full"
          }`}>
            <video controls className="w-full aspect-video"
              src={API(`/video-generator/stream/${activeJob.jobKey}`)} />
          </div>
          <div className="bg-card px-4 sm:px-5 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{activeJob.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {(() => { const p = platformOf(activeJob.aspectRatio ?? "landscape"); return p ? (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white flex items-center gap-1"
                      style={{ background: p.color }}>
                      {p.emoji} {p.label}
                    </span>
                  ) : null; })()}
                  {(() => { const s = styleOf(activeJob.style); return s ? (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                      style={{ background: `linear-gradient(90deg,${s.from},${s.to})` }}>{s.name}</span>
                  ) : null; })()}
                  {activeJob.durationSeconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />{fmtDur(activeJob.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleDelete(activeJob.id)} className="h-8 text-xs">
                  <Trash2 className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Delete</span>
                </Button>
                <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
                  onClick={() => handleDownload(activeJob)}>
                  <Download className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">MP4</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Failed ── */}
      {activeJob?.status === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Render failed</p>
            <p className="text-red-600 text-xs mt-0.5">{activeJob.errorMessage || "An error occurred during rendering."}</p>
          </div>
        </div>
      )}

      {/* ── Create form ── */}
      <div className="bg-card rounded-2xl border shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-sm sm:text-base">Create New Video</h2>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Video Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. How to Build a 6-Figure Digital Business" maxLength={120}
            className="w-full px-3 sm:px-3.5 py-2.5 rounded-xl border border text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground" />
        </div>

        {/* Script + AI Writer */}
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <label className="text-sm font-medium text-foreground flex-shrink-0">Script</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{wc} words · ~{fmtDur(est)}</span>
              <button type="button" onClick={() => { setAiOpen(v => !v); setAiError(""); }}
                className={`flex items-center gap-1 text-xs font-medium px-2 sm:px-2.5 py-1 rounded-lg border transition-all ${
                  aiOpen ? "bg-violet-600 text-white border-violet-600" : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                }`}>
                <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Write with AI
                {aiOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {aiOpen && (
            <div className="mb-3 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-foreground">AI Script Writer</span>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <PenLine className="w-3.5 h-3.5" /> Topic or Product Name
                </label>
                <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAiWrite(); }}
                  placeholder="e.g. AI productivity tools for entrepreneurs"
                  className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {AI_TONES.map(t => (
                  <button key={t.id} type="button" onClick={() => setAiTone(t.id)}
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg border text-xs transition-all ${
                      aiTone === t.id ? "bg-violet-600 text-white border-violet-600" : "bg-card text-foreground border hover:border-violet-300"
                    }`}>
                    <span>{t.emoji}</span><span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
                    <Timer className="w-3.5 h-3.5" /> Duration
                  </label>
                  <div className="flex gap-1.5">
                    {AI_DURATIONS.map(d => (
                      <button key={d.value} type="button" onClick={() => setAiDuration(d.value)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          aiDuration === d.value ? "bg-violet-600 text-white border-violet-600" : "bg-card text-muted-foreground border hover:border-violet-300"
                        }`}>{d.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1.5">
                    <Users className="w-3.5 h-3.5" /> Audience <span className="text-muted-foreground font-normal">(opt.)</span>
                  </label>
                  <input type="text" value={aiAudience} onChange={e => setAiAudience(e.target.value)}
                    placeholder="e.g. entrepreneurs"
                    className="w-full px-3 py-1.5 rounded-lg border border-violet-200 bg-card text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-muted-foreground" />
                </div>
              </div>
              {aiError && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {aiError}
                </div>
              )}
              <Button type="button" onClick={handleAiWrite} disabled={aiLoading || !aiTopic.trim()}
                className="w-full h-9 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-semibold border-0 rounded-lg hover:opacity-90 disabled:opacity-50">
                {aiLoading ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Generating…</> : <><Sparkles className="w-3.5 h-3.5 mr-2" />Generate Script</>}
              </Button>
            </div>
          )}

          <textarea value={script} onChange={e => setScript(e.target.value)} rows={7} maxLength={5000}
            placeholder={"Write your script, or use 'Write with AI' above.\n\nSeparate scenes with blank lines.\n\nExample:\nDiscover the simple system top creators use to generate passive income daily.\n\nStart building yours today at Selovox."}
            className="w-full px-3 sm:px-3.5 py-2.5 rounded-xl border border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono leading-relaxed placeholder:text-muted-foreground" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground sm:hidden">{wc} words · ~{fmtDur(est)}</span>
            <span className="text-xs text-muted-foreground ml-auto">{script.length}/5000</span>
          </div>
        </div>

        {/* ── Platform / Aspect Ratio ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Platform & Format</label>
              {isBatch && (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  <Layers className="w-3 h-3" /> Batch · {selectedPlatforms.length} videos
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Select multiple to generate all at once</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORMS.map(p => (
              <PlatformCard key={p.id} p={p} selected={selectedPlatforms.includes(p.id)}
                onClick={() => togglePlatform(p.id)} />
            ))}
          </div>
        </div>

        {/* Visual Style */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Visual Style</label>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" /> Hover to preview
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {VIDEO_STYLES.map(s => (
              <StyleCard key={s.id} s={s} selected={style === s.id}
                onClick={() => { setStyle(s.id); setFrameThumbnail(null); }}
                onPreview={() => handlePreview(s.id)}
                previewing={previewingStyle === s.id}
              />
            ))}
          </div>

          {/* Frame preview strip */}
          {title.trim() && (
            <div className="mt-3">
              {frameThumbLoading ? (
                <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Rendering your title frame…</span>
                  </div>
                </div>
              ) : frameThumbnail ? (
                <div className="relative rounded-xl overflow-hidden shadow-lg border border">
                  <img src={frameThumbnail} alt="Title frame preview"
                    className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 flex items-end justify-between p-3">
                    <span className="text-[11px] text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      Frame preview · {styleOf(style)?.name}
                    </span>
                    <button
                      onClick={() => { setFrameThumbnail(null); frameThumbUrlRef.current && URL.revokeObjectURL(frameThumbUrlRef.current); frameThumbUrlRef.current = null; }}
                      className="text-white/70 hover:text-white bg-black/40 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleFrameThumb}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-300 rounded-xl text-muted-foreground hover:border-purple-400 hover:text-primary transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" /> Preview your title in this style
                </button>
              )}
            </div>
          )}
        </div>

        {/* Caption Style */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Caption Style</label>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {CAPTION_STYLES.map(c => (
              <button key={c.id} onClick={() => setCaptionStyle(c.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-center min-w-[72px] snap-start transition-all flex-shrink-0 ${
                  captionStyle === c.id ? "bg-primary text-white border-purple-600" : "bg-card text-foreground border hover:border-primary/40"
                }`}>
                <span className={`text-sm font-bold font-mono ${captionStyle === c.id ? "text-white" : "text-muted-foreground"}`}>{c.icon}</span>
                <span className="text-xs font-medium">{c.name}</span>
                <span className={`text-[10px] ${captionStyle === c.id ? "text-blue-200" : "text-muted-foreground"}`}>{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Narrator Voice</label>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            {voices.map((v: any) => (
              <button key={v.id} onClick={() => setVoiceId(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all whitespace-nowrap flex-shrink-0 snap-start ${
                  voiceId === v.id ? "bg-primary text-white border-purple-600 font-medium" : "bg-card text-foreground border hover:border-primary/40"
                }`}>
                <Mic className="w-3.5 h-3.5 flex-shrink-0" />
                {v.name}
                <span className={`text-xs ${voiceId === v.id ? "text-blue-200" : "text-muted-foreground"}`}>{v.accent}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <Button onClick={handleGenerate} disabled={loading || !title.trim() || !script.trim()}
          className="w-full h-11 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-semibold border-0 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isBatch ? `Queuing ${selectedPlatforms.length} videos…` : "Creating job…"}
            </>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />
              {isBatch
                ? `Generate for ${selectedPlatforms.length} Platforms`
                : `Generate Video · ${platformOf(selectedPlatforms[0])?.label ?? "YouTube"}`}
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {isBatch
            ? `${selectedPlatforms.length} separate 1080p MP4 files · one per platform · human character animation`
            : "1920×1080 HD · 30 FPS · Human character animation · Material cards · Kinetic typography · ~60–120s render"}
        </p>
      </div>

      {/* ── History ── */}
      {jobs.length > 0 && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm sm:text-base">Generated Videos</h2>
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{jobs.length}</span>
            </div>
            <button onClick={loadJobs} className="text-muted-foreground hover:text-muted-foreground p-1">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y">
            {jobs.map(job => {
              const js = styleOf(job.style);
              const jp = platformOf(job.aspectRatio ?? "landscape");
              return (
                <div key={job.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-muted/30 transition-colors">
                  {/* Thumbnail with platform badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: js ? `linear-gradient(135deg, ${js.from}, ${js.to})` : "#7c3aed" }}>
                      <Play className="w-3.5 h-3.5 text-white/80" />
                    </div>
                    {jp && (
                      <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded text-white leading-tight"
                        style={{ background: jp.color }}>
                        {jp.emoji}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{job.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <StatusBadge status={job.status} />
                      {jp && <span className="text-xs text-muted-foreground hidden sm:inline">{jp.label} {jp.sub}</span>}
                      {job.durationSeconds && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5 hidden sm:flex">
                          <Clock className="w-3 h-3" />{fmtDur(job.durationSeconds)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:inline">{fmtDate(job.createdAt)}</span>
                    </div>
                    {(job.status === "pending" || job.status === "processing") && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${job.progress ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{job.progress ?? 0}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(job.status === "pending" || job.status === "processing") ? (
                      <button onClick={() => { setActiveJob(job); startPollJob(job.id); }}
                        className="text-xs text-primary hover:underline px-1">Watch</button>
                    ) : job.status === "done" ? (
                      <>
                        <button onClick={() => setActiveJob(job)} className="text-xs text-primary hover:underline px-1 hidden sm:block">Play</button>
                        <button onClick={() => handleDownload(job)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    ) : null}
                    <button onClick={() => handleDelete(job.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {jobs.length === 0 && !activeJob && (
        <div className="text-center py-10 text-muted-foreground">
          <Clapperboard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Your generated videos will appear here</p>
        </div>
      )}
    </div>
  );
}
