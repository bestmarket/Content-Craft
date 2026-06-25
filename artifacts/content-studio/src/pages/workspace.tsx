import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, ArrowRight, Loader2, Clock, Trash2,
  Globe, Server, Terminal, Cpu, Gamepad2, LayoutDashboard, Sparkles,
  KeyRound, AlertTriangle,
} from "lucide-react";

const QUICK_PROMPTS = [
  { label: "🗒️ Todo App", prompt: "A beautiful todo app with categories, priorities, due dates, and dark mode. Smooth animations on task completion.", color: "from-violet-500 to-primary" },
  { label: "🧮 Calculator", prompt: "A sleek calculator with scientific mode, history, and keyboard support. Modern dark UI.", color: "from-blue-500 to-cyan-500" },
  { label: "🎮 Quiz Game", prompt: "An interactive quiz game with multiple choice questions, score tracking, timer, and celebration animations.", color: "from-pink-500 to-rose-500" },
  { label: "🌤️ Weather", prompt: "A weather dashboard with city search, 5-day forecast, animated weather icons, and a gradient background based on conditions.", color: "from-amber-500 to-orange-500" },
  { label: "📋 Kanban", prompt: "A drag-and-drop Kanban board with columns for Todo, In Progress, Done. Cards with labels and due dates.", color: "from-emerald-500 to-teal-500" },
  { label: "⏱️ Pomodoro", prompt: "A Pomodoro productivity timer with work/break cycles, progress ring, sound notifications, and session history.", color: "from-red-500 to-pink-500" },
  { label: "🔐 Password Gen", prompt: "A password generator with strength meter, custom rules (length, symbols, numbers), and one-click copy.", color: "from-indigo-500 to-violet-500" },
  { label: "💰 Budget", prompt: "A personal finance tracker with income/expense categories, monthly charts, and running balance.", color: "from-green-500 to-emerald-500" },
];

const TYPE_OPTIONS = [
  { id: "web", label: "Web App", icon: Globe, color: "bg-blue-500" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-violet-500" },
  { id: "game", label: "Game", icon: Gamepad2, color: "bg-pink-500" },
  { id: "api", label: "API", icon: Server, color: "bg-amber-500" },
  { id: "script", label: "Script", icon: Terminal, color: "bg-emerald-500" },
  { id: "fullstack", label: "Full Stack", icon: Cpu, color: "bg-rose-500" },
];

export default function Workspace() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [projectType, setProjectType] = useState("web");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data } = useQuery({
    queryKey: ["workspace-projects"],
    queryFn: () => apiClient("/workspace/projects").then(r => r.json()),
  });

  const [noKeyError, setNoKeyError] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const r = await apiClient("/workspace/projects", { method: "POST", body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Creation failed");
      return d;
    },
    onSuccess: (data) => {
      setNoKeyError(false);
      queryClient.invalidateQueries({ queryKey: ["workspace-projects"] });
      setLocation(`/workspace/${data.project.id}`);
    },
    onError: (err: any) => {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("generation failed")) {
        setNoKeyError(true);
      } else {
        toast({ title: msg || "Build failed", variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/workspace/projects/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-projects"] }),
  });

  const handleBuild = () => {
    if (!prompt.trim() || createMutation.isPending) return;
    createMutation.mutate({ description: prompt.trim(), projectType });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleBuild();
  };

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const projects: any[] = data?.projects ?? [];
  const isBuilding = createMutation.isPending;
  const selectedType = TYPE_OPTIONS.find(t => t.id === projectType);

  return (
    <div className="min-h-screen text-gray-900 flex flex-col" style={{
      background: "linear-gradient(135deg, #f0f4ff 0%, #fdf2ff 40%, #fff0f6 70%, #f0fff4 100%)",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/80 flex items-center px-6 shrink-0 backdrop-blur-md bg-white/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-gray-900">AI Code Builder</span>
            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white">BETA</span>
          </div>
        </div>
      </div>

      {/* ── No API key banner ─────────────────────────────────────────────── */}
      {noKeyError && (
        <div className="mx-6 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 text-sm">No AI API key configured</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Add a Gemini API key in Admin → API Keys to enable code generation.
              Get a free key at{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                className="underline font-semibold hover:text-amber-900">aistudio.google.com/apikey</a>
            </p>
          </div>
          <button
            onClick={() => setLocation("/admin/api-keys")}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            <KeyRound className="w-3 h-3" /> Add Key
          </button>
        </div>
      )}

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* Hero text */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-violet-200 shadow-sm mb-5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-semibold text-violet-600">Powered by AI · Builds in seconds</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              What do you want{" "}
              <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                to build?
              </span>
            </h1>
            <p className="text-gray-500 text-base">
              Describe anything — AI writes the code and shows it live in seconds
            </p>
          </div>

          {/* Main input */}
          <div className={`relative rounded-3xl border-2 transition-all duration-200 shadow-xl ${
            isBuilding
              ? "border-violet-400 bg-card shadow-violet-100"
              : "border-gray-200 bg-card hover:border-violet-300 focus-within:border-violet-400 focus-within:shadow-violet-100"
          }`}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. A todo app with dark mode, drag-and-drop tasks, and smooth animations..."
              disabled={isBuilding}
              rows={4}
              className="w-full bg-transparent text-gray-800 placeholder:text-gray-300 text-[15px] leading-relaxed px-4 sm:px-6 pt-5 pb-3 resize-none outline-none rounded-3xl"
            />

            {/* Bottom row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 pb-4">
              {/* Type pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setProjectType(t.id)}
                    disabled={isBuilding}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      projectType === t.id
                        ? `${t.color} text-white shadow-md`
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    }`}
                  >
                    <t.icon className="w-3 h-3" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Build button */}
              <button
                onClick={handleBuild}
                disabled={!prompt.trim() || isBuilding}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shrink-0 ${
                  !prompt.trim() || isBuilding
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-105 active:scale-95"
                }`}
              >
                {isBuilding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Building…</>
                ) : (
                  <><Zap className="w-4 h-4 fill-current" /> Build <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>

          {/* Building status */}
          {isBuilding && (
            <div className="mt-5 flex items-center justify-center gap-3 text-sm">
              <div className="flex gap-1.5">
                {["bg-violet-500", "bg-pink-500", "bg-orange-400"].map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span className="font-semibold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                AI is generating your project…
              </span>
            </div>
          )}

          {/* Hint */}
          {!isBuilding && (
            <p className="text-center text-gray-400 text-xs mt-3">
              Press <kbd className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-mono">Ctrl</kbd> +{" "}
              <kbd className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-mono">Enter</kbd> to build
            </p>
          )}

          {/* Quick prompts */}
          {!isBuilding && (
            <div className="mt-10">
              <p className="text-gray-400 text-xs mb-4 text-center font-semibold uppercase tracking-widest">Quick start</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_PROMPTS.map(q => (
                  <button
                    key={q.label}
                    onClick={() => { setPrompt(q.prompt); textareaRef.current?.focus(); }}
                    className="group relative px-3 py-2.5 rounded-2xl bg-card border-2 border-gray-100 hover:border-transparent text-gray-600 hover:text-white text-xs font-semibold transition-all shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${q.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                    <span className="relative">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent projects */}
          {!isBuilding && projects.length > 0 && (
            <div className="mt-10">
              <p className="text-gray-400 text-xs mb-4 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recent projects
              </p>
              <div className="space-y-2">
                {projects.slice(0, 6).map((p: any) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border-2 border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 cursor-pointer transition-all shadow-sm hover:shadow-md"
                    onClick={() => setLocation(`/workspace/${p.id}`)}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      p.status === "ready" ? "bg-emerald-400" :
                      p.status === "generating" ? "bg-amber-400 animate-pulse" :
                      p.status === "error" ? "bg-red-400" : "bg-gray-300"
                    }`} />
                    <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{p.name}</span>
                    <span className="text-[11px] font-medium text-gray-400 shrink-0 hidden group-hover:block">
                      {p.projectType}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(p.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
