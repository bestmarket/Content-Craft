import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  ArrowLeft, Download, Upload, Loader2, Code2, Eye,
  AlertCircle, Zap, X, Send, RefreshCw,
  Share2, Copy, Check, Link,
  FilePlus, Trash2, FolderTree,
  Sparkles, RotateCcw, Globe, Terminal,
  BookOpen, ChevronRight, Play, Cpu, Network,
  FileCode, GitBranch, Box, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";

interface ProjectFile {
  id: number; projectId: number; path: string; name: string;
  content: string; language: string; isEntrypoint: boolean; updatedAt: string;
}
interface Project {
  id: number; name: string; description: string; projectType: string;
  framework: string; status: string; previewType: string; readme: string;
  chatHistory: Array<{ role: string; content: string; ts: string }>; updatedAt: string;
  shareToken?: string | null;
}
interface ChatMsg { role: "user" | "assistant"; content: string; ts: string; }

interface WorkflowStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

function buildPreviewHtml(files: ProjectFile[]): string {
  const html = files.find(f => f.isEntrypoint && f.language === "html")
    || files.find(f => f.name === "index.html")
    || files.find(f => f.language === "html");
  if (!html) return "";
  let out = html.content || "";
  for (const f of files.filter(f => f.language === "css")) {
    const re = new RegExp(`<link[^>]+href=["'](?:\\.?\\/)?${f.name}["'][^>]*>`, "gi");
    out = re.test(out) ? out.replace(re, `<style>\n${f.content}\n</style>`)
      : out.replace("</head>", `<style>\n${f.content}\n</style>\n</head>`);
  }
  for (const f of files.filter(f => f.language === "javascript")) {
    const re = new RegExp(`<script[^>]+src=["'](?:\\.?\\/)?${f.name}["'][^>]*>\\s*<\\/script>`, "gi");
    if (re.test(out)) out = out.replace(re, `<script>\n${f.content}\n</script>`);
  }
  return out;
}

function sortFiles(files: ProjectFile[]): ProjectFile[] {
  const order = ["html", "css", "javascript", "typescript", "python", "json", "markdown"];
  return [...files].sort((a, b) => {
    const ai = order.indexOf(a.language), bi = order.indexOf(b.language);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.path.localeCompare(b.path);
  });
}

const FILE_ICON: Record<string, string> = {
  html: "🌐", css: "🎨", javascript: "⚡", typescript: "💎",
  python: "🐍", json: "📦", markdown: "📝", bash: "🖥️", sql: "🗃️", text: "📄",
  ruby: "💎", go: "🐹", rust: "🦀", java: "☕", php: "🐘",
};

function guessLang(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html", css: "css", js: "javascript", ts: "typescript",
    py: "python", json: "json", md: "markdown", sh: "bash", sql: "sql",
    rb: "ruby", go: "go", rs: "rust", java: "java", php: "php",
  };
  return map[ext] ?? "text";
}

function buildWorkflowSteps(files: ProjectFile[], projectType: string): WorkflowStep[] {
  const steps: WorkflowStep[] = [
    { id: "plan", label: "Planning project structure", status: "pending", detail: `${projectType} project` },
    { id: "scaffold", label: "Scaffolding files", status: "pending", detail: `${files.length} file${files.length !== 1 ? "s" : ""}` },
  ];

  const htmlFiles = files.filter(f => f.language === "html");
  const cssFiles = files.filter(f => f.language === "css");
  const jsFiles = files.filter(f => f.language === "javascript" || f.language === "typescript");
  const pyFiles = files.filter(f => f.language === "python");

  if (htmlFiles.length) steps.push({ id: "html", label: "Writing HTML structure", status: "pending", detail: htmlFiles.map(f => f.name).join(", ") });
  if (cssFiles.length) steps.push({ id: "css", label: "Styling with CSS", status: "pending", detail: cssFiles.map(f => f.name).join(", ") });
  if (jsFiles.length) steps.push({ id: "js", label: "Adding JavaScript logic", status: "pending", detail: jsFiles.map(f => f.name).join(", ") });
  if (pyFiles.length) steps.push({ id: "py", label: "Writing Python code", status: "pending", detail: pyFiles.map(f => f.name).join(", ") });

  const configFiles = files.filter(f => ["json", "yaml", "toml", "text"].includes(f.language ?? ""));
  if (configFiles.length) steps.push({ id: "config", label: "Adding configuration", status: "pending", detail: configFiles.map(f => f.name).join(", ") });

  steps.push({ id: "connect", label: "Connecting all pieces", status: "pending" });
  steps.push({ id: "done", label: "Project ready!", status: "pending" });

  return steps;
}

function extractRoutes(files: ProjectFile[]): string[] {
  const routes: string[] = [];
  for (const f of files) {
    const c = f.content ?? "";
    const matches = [
      ...c.matchAll(/(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"` ]+)['"`]/gi),
      ...c.matchAll(/@(?:app|blueprint)\.route\s*\(\s*['"`]([^'"` ]+)['"`].*?methods=\[([^\]]+)\]/gi),
    ];
    for (const m of matches) {
      if (m[2]) routes.push(`${m[1].toUpperCase()} ${m[2]}`);
      else if (m[1]) routes.push(`ROUTE ${m[1]}`);
    }
  }
  return [...new Set(routes)].slice(0, 12);
}

function extractDependencies(files: ProjectFile[]): string[] {
  const deps: string[] = [];
  for (const f of files) {
    const c = f.content ?? "";
    if (f.name === "package.json") {
      try {
        const pkg = JSON.parse(c);
        deps.push(...Object.keys(pkg.dependencies ?? {}));
        deps.push(...Object.keys(pkg.devDependencies ?? {}));
      } catch {}
    }
    if (f.name === "requirements.txt") {
      deps.push(...c.split("\n").map(l => l.trim().split(/[>=<]/)[0]).filter(Boolean));
    }
  }
  return [...new Set(deps)].slice(0, 10);
}

type PreviewTab = "preview" | "workflow" | "readme";

export default function WorkspaceIDE() {
  const [, params] = useRoute("/workspace/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  const [chatInput, setChatInput] = useState("");
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showFileTree, setShowFileTree] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);

  const [previewTab, setPreviewTab] = useState<PreviewTab>("preview");

  const [showShare, setShowShare] = useState(false);
  const [shareToken, setShareToken] = useState<string | null | undefined>(undefined);
  const [isSharing, setIsSharing] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const [showPublish, setShowPublish] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDesc, setPublishDesc] = useState("");
  const [publishPrice, setPublishPrice] = useState("0");
  const [isPublishing, setIsPublishing] = useState(false);

  const [mobilePanel, setMobilePanel] = useState<"code" | "preview" | "chat">("preview");

  const startWorkflowAnimation = useCallback((projectFiles: ProjectFile[], projectType: string) => {
    const steps = buildWorkflowSteps(projectFiles, projectType);
    setWorkflowSteps(steps.map(s => ({ ...s, status: "pending" })));
    setPreviewTab("workflow");

    let stepIdx = 0;
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);

    stepTimerRef.current = setInterval(() => {
      setWorkflowSteps(prev => {
        const next = [...prev];
        for (let i = 0; i < next.length; i++) {
          if (next[i].status === "active") {
            next[i] = { ...next[i], status: "done" };
            if (i + 1 < next.length) next[i + 1] = { ...next[i + 1], status: "active" };
            break;
          } else if (next[i].status === "pending") {
            next[i] = { ...next[i], status: "active" };
            break;
          }
        }
        return next;
      });
      stepIdx++;
      if (stepIdx >= steps.length + 1) {
        if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      }
    }, 1400);
  }, []);

  const finishWorkflow = useCallback(() => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    setWorkflowSteps(prev => prev.map(s => ({ ...s, status: "done" })));
    setTimeout(() => setPreviewTab("preview"), 1200);
  }, []);

  useEffect(() => {
    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const r = await apiClient(`/workspace/projects/${projectId}`);
      if (!r.ok) throw new Error("Not found");
      const d = await r.json();
      setProject(d.project);
      setShareToken(d.project.shareToken);
      const sorted = sortFiles(d.files ?? []);
      setFiles(sorted);
      const ep = sorted.find(f => f.isEntrypoint) ?? sorted[0] ?? null;
      setActiveFile(ep);
      if (ep) setEditContent(ep.content ?? "");
      const history: ChatMsg[] = (d.project.chatHistory ?? []) as ChatMsg[];
      setMessages(history);
      if (d.project.status === "generating") {
        startWorkflowAnimation(sorted, d.project.projectType);
      } else {
        setWorkflowSteps(buildWorkflowSteps(sorted, d.project.projectType).map(s => ({ ...s, status: "done" })));
      }
    } catch {
      toast({ title: "Failed to load project", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, startWorkflowAnimation]);

  useEffect(() => { loadProject(); }, [loadProject]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isAIWorking]);

  const previewHtml = project?.previewType === "html" ? buildPreviewHtml(files) : "";
  const isHtmlProject = project?.previewType === "html";

  const sendChat = async () => {
    if (!chatInput.trim() || isAIWorking || !projectId) return;
    const msg = chatInput.trim();
    setChatInput("");
    setIsAIWorking(true);
    const userMsg: ChatMsg = { role: "user", content: msg, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    startWorkflowAnimation(files, project?.projectType ?? "web");
    try {
      const r = await apiClient(`/workspace/projects/${projectId}/chat`, {
        method: "POST", body: JSON.stringify({ message: msg }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "AI failed");
      const sorted = sortFiles(d.files ?? []);
      setFiles(sorted);
      const updated = sorted.find(f => f.id === activeFile?.id);
      if (updated) { setActiveFile(updated); setEditContent(updated.content ?? ""); }
      else if (sorted[0]) { setActiveFile(sorted[0]); setEditContent(sorted[0].content ?? ""); }
      setPreviewKey(k => k + 1);
      finishWorkflow();
      const aiMsg: ChatMsg = { role: "assistant", content: d.message, ts: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      finishWorkflow();
      const errMsg: ChatMsg = { role: "assistant", content: `Something went wrong: ${err.message}`, ts: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
      toast({ title: err.message ?? "AI failed", variant: "destructive" });
    } finally {
      setIsAIWorking(false);
    }
  };

  const saveFile = async () => {
    if (!activeFile || !projectId) return;
    setIsSaving(true);
    try {
      const r = await apiClient(`/workspace/projects/${projectId}/files/${activeFile.id}`, {
        method: "PUT", body: JSON.stringify({ content: editContent }),
      });
      if (!r.ok) throw new Error("Save failed");
      setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: editContent } : f));
      setPreviewKey(k => k + 1);
      toast({ title: "Saved ✓ preview updated" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addFile = async () => {
    if (!newFileName.trim() || !projectId) return;
    const name = newFileName.trim();
    try {
      const r = await apiClient(`/workspace/projects/${projectId}/files`, {
        method: "POST", body: JSON.stringify({ path: name, name: name.split("/").pop(), content: "", language: guessLang(name), isEntrypoint: false }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const nf = { ...d.file, language: guessLang(name) };
      setFiles(prev => sortFiles([...prev, nf]));
      setActiveFile(nf); setEditContent("");
      setNewFileName(""); setShowNewFile(false);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  const deleteFile = async (f: ProjectFile) => {
    if (!projectId || !confirm(`Delete ${f.name}?`)) return;
    await apiClient(`/workspace/projects/${projectId}/files/${f.id}`, { method: "DELETE" });
    setFiles(prev => prev.filter(x => x.id !== f.id));
    if (activeFile?.id === f.id) {
      const next = files.filter(x => x.id !== f.id)[0] ?? null;
      setActiveFile(next); setEditContent(next?.content ?? "");
    }
  };

  const downloadZip = async () => {
    if (!project) return;
    const zip = new JSZip();
    const folder = zip.folder(project.name.replace(/[^a-z0-9_-]/gi, "_") || "project")!;
    for (const f of files) folder.file(f.path, f.content ?? "");
    if (project.readme) folder.file("README.md", project.readme);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${project.name}.zip`; a.click();
    URL.revokeObjectURL(url);
  };

  const shareUrl = shareToken ? `${window.location.origin}/preview/${shareToken}` : null;

  const enableSharing = async () => {
    if (!projectId || isSharing) return;
    setIsSharing(true);
    try {
      const r = await apiClient(`/workspace/projects/${projectId}/share`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setShareToken(d.shareToken);
      toast({ title: "Share link ready!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const disableSharing = async () => {
    if (!projectId || isSharing || !confirm("Disable sharing? The current link will stop working.")) return;
    setIsSharing(true);
    try {
      await apiClient(`/workspace/projects/${projectId}/share`, { method: "DELETE" });
      setShareToken(null);
      toast({ title: "Sharing disabled" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const handlePublish = async () => {
    if (!projectId) return;
    setIsPublishing(true);
    try {
      const r = await apiClient(`/workspace/projects/${projectId}/publish`, {
        method: "POST",
        body: JSON.stringify({ title: publishTitle, description: publishDesc, price: parseFloat(publishPrice) || 0 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast({ title: "Submitted for review!", description: "Pending approval before going live." });
      setShowPublish(false);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const regenerate = async () => {
    if (!projectId || isAIWorking) return;
    if (!confirm("Regenerate the entire project? This replaces all current files.")) return;
    setIsAIWorking(true);
    const sysMsg: ChatMsg = { role: "assistant", content: "Regenerating the entire project from scratch…", ts: new Date().toISOString() };
    setMessages(prev => [...prev, sysMsg]);
    startWorkflowAnimation(files, project?.projectType ?? "web");
    try {
      const r = await apiClient(`/workspace/projects/${projectId}/regenerate`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setProject(d.project);
      const sorted = sortFiles(d.files ?? []);
      setFiles(sorted);
      const ep = sorted.find(f => f.isEntrypoint) ?? sorted[0];
      if (ep) { setActiveFile(ep); setEditContent(ep.content ?? ""); }
      setPreviewKey(k => k + 1);
      finishWorkflow();
      const doneMsg: ChatMsg = { role: "assistant", content: "Done! Your project has been fully regenerated.", ts: new Date().toISOString() };
      setMessages(prev => [...prev, doneMsg]);
    } catch (err: any) {
      finishWorkflow();
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setIsAIWorking(false);
    }
  };

  const routes = extractRoutes(files);
  const deps = extractDependencies(files);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fdf2ff 50%, #fff0f6 100%)" }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-violet-200">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading your project…</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fdf2ff 50%, #fff0f6 100%)" }}>
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">Project not found</p>
        <Button onClick={() => setLocation("/workspace")} className="bg-gradient-to-r from-violet-600 to-pink-500 text-white border-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    </div>
  );

  const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    web: { icon: <Globe className="w-3 h-3" />, color: "from-blue-500 to-cyan-500", label: "Web App" },
    dashboard: { icon: <Layers className="w-3 h-3" />, color: "from-violet-500 to-primary", label: "Dashboard" },
    game: { icon: <Play className="w-3 h-3" />, color: "from-pink-500 to-rose-500", label: "Game" },
    api: { icon: <Network className="w-3 h-3" />, color: "from-amber-500 to-orange-500", label: "API" },
    script: { icon: <Terminal className="w-3 h-3" />, color: "from-emerald-500 to-teal-500", label: "Script" },
    fullstack: { icon: <Box className="w-3 h-3" />, color: "from-indigo-500 to-blue-600", label: "Full Stack" },
  };
  const typeMeta = TYPE_META[project.projectType] ?? TYPE_META.web;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f8f9ff" }}>

      {/* ═══ TOP BAR ════════════════════════════════════════════════════════ */}
      <div className="h-12 bg-card border-b border-gray-100 flex items-center px-3 gap-2 shrink-0 z-30 shadow-sm">
        <button
          onClick={() => setLocation("/workspace")}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-100 mx-1" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${typeMeta.color} flex items-center justify-center shrink-0 shadow-sm text-white`}>
            {typeMeta.icon}
          </div>
          <span className="font-bold text-[13px] truncate text-gray-800">{project.name}</span>
          <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${typeMeta.color} text-white shrink-0`}>
            {typeMeta.label}
          </span>
          {isAIWorking ? (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold shrink-0">
              <div className="flex gap-0.5">
                {["bg-violet-500", "bg-pink-500", "bg-orange-400"].map((c, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <span className="hidden md:block bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">Building</span>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-200" title="Ready" />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowFileTree(v => !v)}
            className={`hidden md:flex h-8 px-2.5 rounded-xl items-center gap-1.5 text-xs font-semibold transition-all ${showFileTree ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-100"}`}
            title="Toggle file tree"
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowEditor(v => !v)}
            className={`hidden md:flex h-8 px-2.5 rounded-xl items-center gap-1.5 text-xs font-semibold transition-all ${showEditor ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-100"}`}
            title="Toggle code editor"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Code</span>
          </button>
          <button
            onClick={() => { setPreviewKey(k => k + 1); setPreviewTab("preview"); }}
            disabled={isAIWorking}
            className="h-8 px-3.5 rounded-xl flex items-center gap-1.5 text-sm font-bold bg-[#1c7c1c] hover:bg-[#228b22] active:bg-[#166016] text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none"
            title="Run / refresh preview"
            style={{ minWidth: 72 }}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run</span>
          </button>
          <button
            onClick={regenerate}
            disabled={isAIWorking}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-30"
            title="Regenerate entire project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={downloadZip}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Download ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowShare(true)}
            className={`h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${shareToken ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{shareToken ? "Shared" : "Share"}</span>
          </button>
          <button
            onClick={() => { setPublishTitle(project.name); setPublishDesc(project.description ?? ""); setShowPublish(true); }}
            className="h-8 px-4 rounded-xl flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white shadow-md shadow-violet-200 transition-all hover:scale-105 active:scale-95"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:block">Publish</span>
          </button>
        </div>
      </div>

      {/* ═══ BODY ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Code Group: File Tree + Editor (hidden on mobile when not active) ── */}
        <div className={`flex overflow-hidden shrink-0 ${mobilePanel !== "code" ? "hidden md:flex" : "flex-1 md:flex-none"}`}>

        {/* ── File Tree Sidebar ───────────────────────────────────────────── */}
        {showFileTree && (
          <div className="w-44 bg-card border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Files</span>
              <button
                onClick={() => setShowNewFile(true)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                title="New file"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5">
              {files.map(f => (
                <div
                  key={f.id}
                  onClick={() => { setActiveFile(f); setEditContent(f.content ?? ""); }}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-[12px] transition-all mx-1.5 rounded-lg ${
                    activeFile?.id === f.id
                      ? "bg-violet-50 text-violet-700 font-semibold border-l-2 border-violet-500 pl-2"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <span className="text-sm shrink-0">{FILE_ICON[f.language] ?? "📄"}</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteFile(f); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {files.length === 0 && (
                <div className="px-3 py-4 text-[11px] text-gray-400 text-center">No files yet</div>
              )}
            </div>
            <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* ── Code Editor ─────────────────────────────────────────────────── */}
        {showEditor && (
          <div className="flex flex-col overflow-hidden border-r border-gray-100" style={{ width: 380, minWidth: 280 }}>
            <div className="h-9 bg-gray-50 border-b border-gray-200 flex items-center px-3 gap-2 shrink-0">
              <span className="text-[12px] text-gray-500 flex-1 truncate font-mono">
                {activeFile?.path ?? "No file selected"}
              </span>
              {activeFile && (
                <button
                  onClick={saveFile}
                  disabled={isSaving}
                  className="h-6 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </button>
              )}
            </div>
            {activeFile ? (
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const s = e.currentTarget.selectionStart;
                    const v = editContent.substring(0, s) + "  " + editContent.substring(e.currentTarget.selectionEnd);
                    setEditContent(v);
                    requestAnimationFrame(() => {
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2;
                    });
                  }
                  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveFile(); }
                }}
                spellCheck={false}
                autoComplete="off"
                className="flex-1 w-full bg-card text-gray-800 text-[12.5px] font-mono p-4 resize-none outline-none leading-[1.75] overflow-auto"
                style={{ tabSize: 2, caretColor: "#7c3aed" }}
              />
            ) : (
              <div className="flex-1 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center">
                  <FileCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        )}

        </div>{/* end code group */}

        {/* ── Preview Panel ────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-card ${mobilePanel !== "preview" ? "hidden md:flex" : ""}`}>

          {/* Preview Tab Bar */}
          <div className="h-9 bg-gray-50 border-b border-gray-100 flex items-center px-3 gap-1 shrink-0">
            <div className="flex gap-1.5 mr-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            {([
              { key: "preview" as PreviewTab, icon: <Eye className="w-3 h-3" />, label: "Preview" },
              { key: "workflow" as PreviewTab, icon: <GitBranch className="w-3 h-3" />, label: "Workflow" },
              { key: "readme" as PreviewTab, icon: <BookOpen className="w-3 h-3" />, label: "README" },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setPreviewTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 h-6 rounded-lg text-[11px] font-semibold transition-all ${
                  previewTab === tab.key
                    ? "bg-card text-violet-700 shadow-sm border border-gray-200"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "workflow" && isAIWorking && (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                )}
              </button>
            ))}
            <div className="flex-1" />
            {isHtmlProject && previewTab === "preview" && (
              <span className="text-[10px] text-gray-400 font-medium">✨ Live iframe</span>
            )}
          </div>

          {/* Preview Content */}
          <div className="flex-1 relative overflow-hidden">

            {/* ── Tab: Live Preview ─────────────────────────────────────── */}
            {previewTab === "preview" && (
              <>
                {isHtmlProject && previewHtml ? (
                  <iframe
                    key={previewKey}
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                    className="w-full h-full border-0 bg-card"
                    title="Live Preview"
                  />
                ) : (
                  <SmartPreview project={project} files={files} routes={routes} deps={deps} onDownload={downloadZip} />
                )}

                {isAIWorking && (
                  <div className="absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center gap-5 z-10"
                    style={{ background: "rgba(248,249,255,0.92)" }}>
                    <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-violet-300 animate-pulse">
                        <Cpu className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -inset-3 rounded-[2rem] border-2 border-violet-300/40 animate-ping" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg text-gray-800 mb-1">AI is building…</p>
                      <p className="text-violet-500 text-sm font-medium">Switch to Workflow tab to see live steps</p>
                    </div>
                    <button
                      onClick={() => setPreviewTab("workflow")}
                      className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-violet-200 hover:scale-105 transition-all"
                    >
                      <GitBranch className="w-4 h-4" /> Watch Workflow
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Tab: Workflow ─────────────────────────────────────────── */}
            {previewTab === "workflow" && (
              <WorkflowPanel
                steps={workflowSteps}
                isBuilding={isAIWorking}
                project={project}
                files={files}
              />
            )}

            {/* ── Tab: README ───────────────────────────────────────────── */}
            {previewTab === "readme" && (
              <div className="h-full overflow-y-auto p-6" style={{ background: "linear-gradient(135deg, #f8f9ff 0%, #fdf2ff 100%)" }}>
                {project.readme ? (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                        <BookOpen className="w-5 h-5 text-violet-500" />
                        <h2 className="font-bold text-gray-800">{project.name}</h2>
                      </div>
                      <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{project.readme}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No README generated yet</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── AI Chat Panel ────────────────────────────────────────────────── */}
        <div className={`shrink-0 bg-card border-l border-gray-100 flex flex-col overflow-hidden z-10 shadow-sm ${mobilePanel !== "chat" ? "hidden md:flex md:w-72" : "flex-1 w-full"}`}>
          <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-2 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">AI Assistant</span>
            {isAIWorking && (
              <div className="ml-auto flex gap-0.5">
                {["bg-violet-500", "bg-pink-500", "bg-orange-400"].map((c, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
            {messages.length === 0 && !isAIWorking && (
              <div className="py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-violet-500" />
                </div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Your app is ready!</p>
                <p className="text-gray-400 text-xs mb-4">Tell me what to change and I'll update it live.</p>
                <div className="space-y-2">
                  {[
                    "Make the design more modern",
                    "Add a dark mode toggle",
                    "Add animations",
                    "Fix any bugs",
                    "Make it mobile-friendly",
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => setChatInput(s)}
                      className="block w-full text-left text-[12px] px-3 py-2 rounded-xl bg-card hover:bg-violet-50 text-gray-500 hover:text-violet-700 transition-colors border border-gray-100 hover:border-violet-200 font-medium shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200 rounded-br-md"
                    : "bg-card text-gray-700 rounded-bl-md border border-gray-100 shadow-sm"
                }`}>
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
                  {m.role === "user" ? "You" : "AI"} · {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {isAIWorking && (
              <div className="flex flex-col items-start">
                <div className="bg-card border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] flex items-center gap-2">
                  <div className="flex gap-1">
                    {["bg-violet-500", "bg-pink-500", "bg-orange-400"].map((c, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <span className="text-violet-600 font-semibold text-[12px]">Generating…</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-gray-100 shrink-0 bg-card">
            <div className={`flex gap-2 bg-gray-50 rounded-2xl border-2 transition-colors overflow-hidden ${
              isAIWorking ? "border-violet-200" : "border-gray-100 focus-within:border-violet-300"
            }`}>
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
                }}
                placeholder={isAIWorking ? "AI is working…" : "Tell me what to change…"}
                disabled={isAIWorking}
                rows={2}
                className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-gray-700 placeholder:text-gray-300 outline-none resize-none leading-relaxed"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || isAIWorking}
                className="px-3 self-end mb-2 text-violet-500 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isAIWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM NAV ══════════════════════════════════════════════ */}
      <div className="md:hidden flex shrink-0 h-14 bg-card border-t border-gray-100 z-20 safe-area-pb">
        <button
          onClick={() => setMobilePanel("code")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${mobilePanel === "code" ? "text-violet-600" : "text-gray-400"}`}
        >
          <Code2 className={`w-5 h-5 ${mobilePanel === "code" ? "text-violet-600" : "text-gray-400"}`} />
          Code
        </button>
        <button
          onClick={() => { setMobilePanel("preview"); setPreviewTab("preview"); }}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${mobilePanel === "preview" ? "text-violet-600" : "text-gray-400"}`}
        >
          <Eye className={`w-5 h-5 ${mobilePanel === "preview" ? "text-violet-600" : "text-gray-400"}`} />
          Preview
        </button>
        <button
          onClick={() => setMobilePanel("chat")}
          className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${mobilePanel === "chat" ? "text-violet-600" : "text-gray-400"}`}
        >
          {isAIWorking && (
            <span className="absolute top-2 right-[calc(50%-8px)] w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          )}
          <Sparkles className={`w-5 h-5 ${mobilePanel === "chat" ? "text-violet-600" : "text-gray-400"}`} />
          AI Chat
        </button>
      </div>

      {/* ═══ NEW FILE DIALOG ════════════════════════════════════════════════ */}
      <Dialog open={showNewFile} onOpenChange={setShowNewFile}>
        <DialogContent className="max-w-sm bg-card rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="filename.js or path/to/file.py"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addFile()}
              autoFocus
              className="rounded-xl border-gray-200"
            />
            <Button onClick={addFile} className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white border-0 rounded-xl">
              Create File
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ SHARE DIALOG ═══════════════════════════════════════════════════ */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-sm bg-card rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Share Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {shareToken ? (
              <>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2">
                  <Link className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-700 text-xs font-mono truncate flex-1">{shareUrl}</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyShareUrl} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 rounded-xl">
                    {copyDone ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copyDone ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button onClick={disableSharing} variant="outline" className="rounded-xl border-red-200 text-red-500 hover:bg-red-50">
                    Disable
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={enableSharing} disabled={isSharing} className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white border-0 rounded-xl">
                {isSharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                Enable Public Link
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ PUBLISH DIALOG ════════════════════════════════════════════════ */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent className="max-w-sm bg-card rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Publish to Marketplace</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Title</label>
              <Input value={publishTitle} onChange={e => setPublishTitle(e.target.value)} className="rounded-xl border-gray-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <textarea
                value={publishDesc}
                onChange={e => setPublishDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-300 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Price (USD)</label>
              <Input type="number" min="0" step="0.01" value={publishPrice} onChange={e => setPublishPrice(e.target.value)} className="rounded-xl border-gray-200" />
            </div>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !publishTitle.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white border-0 rounded-xl font-semibold"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Submit for Review
            </Button>
            <p className="text-xs text-gray-400 text-center">Your project will be reviewed before going live.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══ WorkflowPanel Component ════════════════════════════════════════════════ */
function WorkflowPanel({
  steps, isBuilding, project, files,
}: {
  steps: WorkflowStep[];
  isBuilding: boolean;
  project: Project;
  files: ProjectFile[];
}) {
  const doneCount = steps.filter(s => s.status === "done").length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  const langCounts = files.reduce((acc, f) => {
    acc[f.language ?? "text"] = (acc[f.language ?? "text"] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const LANG_COLOR: Record<string, string> = {
    html: "bg-orange-400", css: "bg-blue-400", javascript: "bg-yellow-400",
    typescript: "bg-blue-600", python: "bg-green-500", json: "bg-gray-400",
    markdown: "bg-gray-500", bash: "bg-emerald-500", sql: "bg-primary",
  };

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fdf2ff 60%, #fff0f6 100%)" }}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Build Workflow</h3>
              <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">{pct}%</div>
              <div className="text-[10px] text-gray-400 font-medium">Complete</div>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Build Steps</h4>
          {steps.map((step, i) => (
            <div key={step.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
              step.status === "active" ? "bg-violet-50 border border-violet-100" :
              step.status === "done" ? "opacity-80" : "opacity-40"
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                step.status === "done" ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm" :
                step.status === "active" ? "bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm shadow-violet-200" :
                "bg-gray-200"
              }`}>
                {step.status === "done" ? (
                  <Check className="w-3 h-3 text-white" />
                ) : step.status === "active" ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-bold">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold ${
                  step.status === "active" ? "text-violet-700" :
                  step.status === "done" ? "text-gray-600" : "text-gray-400"
                }`}>{step.label}</p>
                {step.detail && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{step.detail}</p>
                )}
              </div>
              {step.status === "active" && (
                <div className="flex gap-0.5 shrink-0 mt-1.5">
                  {["bg-violet-400", "bg-pink-400", "bg-orange-400"].map((c, j) => (
                    <div key={j} className={`w-1 h-1 rounded-full ${c} animate-bounce`} style={{ animationDelay: `${j * 150}ms` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {steps.length === 0 && (
            <div className="py-4 text-center text-gray-400 text-sm">
              <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Build a project to see workflow steps
            </div>
          )}
        </div>

        {/* File breakdown */}
        {files.length > 0 && (
          <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Project Files</h4>
            <div className="space-y-1.5">
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-2.5 py-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${LANG_COLOR[f.language ?? "text"] ?? "bg-gray-300"}`} />
                  <span className="text-[12px] text-gray-700 font-mono flex-1 truncate">{f.path}</span>
                  <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                    {f.content ? Math.round(f.content.length / 1024 * 10) / 10 + "kb" : "—"}
                  </span>
                </div>
              ))}
            </div>
            {Object.keys(langCounts).length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 flex-wrap">
                {Object.entries(langCounts).map(([lang, count]) => (
                  <div key={lang} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${LANG_COLOR[lang] ?? "bg-gray-300"}`} />
                    <span className="text-[11px] text-gray-500">{lang} ({count})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isBuilding && pct === 100 && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-center shadow-lg shadow-emerald-100">
            <div className="text-2xl mb-1">🎉</div>
            <p className="text-white font-bold text-sm">Build Complete!</p>
            <p className="text-emerald-100 text-xs mt-0.5">Switch to Preview tab to see your project</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ SmartPreview Component ═════════════════════════════════════════════════ */
function SmartPreview({
  project, files, routes, deps, onDownload,
}: {
  project: Project;
  files: ProjectFile[];
  routes: string[];
  deps: string[];
  onDownload: () => void;
}) {
  const entrypoint = files.find(f => f.isEntrypoint) ?? files[0];

  const TYPE_INFO: Record<string, { icon: string; title: string; runCmd: string; desc: string }> = {
    api: { icon: "🌐", title: "API / Backend", runCmd: "node index.js", desc: "REST API — download and run locally" },
    script: { icon: "⚙️", title: "Script", runCmd: "python main.py", desc: "Script — run it locally or in a REPL" },
    fullstack: { icon: "📦", title: "Full Stack App", runCmd: "npm install && npm start", desc: "Full stack app — requires a server" },
  };
  const info = TYPE_INFO[project.projectType] ?? { icon: "💻", title: "Server-Side Project", runCmd: "see README", desc: "Runs on a server — download to run" };

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fdf2ff 60%, #fff0f6 100%)" }}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header card */}
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-4xl">{info.icon}</div>
            <div>
              <h2 className="font-bold text-gray-800">{project.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{info.title}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">{project.description}</p>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-violet-200 hover:scale-105 transition-all w-full justify-center"
          >
            <Download className="w-4 h-4" /> Download ZIP to Run Locally
          </button>
        </div>

        {/* How to run */}
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Terminal className="w-3 h-3" /> How to Run
          </h4>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 font-mono text-sm space-y-1">
            <div className="text-violet-400 text-xs mb-2"># unzip and run:</div>
            <div className="text-violet-700 font-semibold">$ {info.runCmd}</div>
          </div>
          {project.framework && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Framework:</span>
              <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{project.framework}</span>
            </div>
          )}
        </div>

        {/* Routes (for API projects) */}
        {routes.length > 0 && (
          <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Network className="w-3 h-3" /> API Endpoints
            </h4>
            <div className="space-y-1.5">
              {routes.map((r, i) => {
                const [method, ...rest] = r.split(" ");
                const path = rest.join(" ");
                const methodColor: Record<string, string> = {
                  GET: "bg-emerald-100 text-emerald-700",
                  POST: "bg-blue-100 text-blue-700",
                  PUT: "bg-amber-100 text-amber-700",
                  DELETE: "bg-red-100 text-red-700",
                  PATCH: "bg-primary/10 text-primary",
                };
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${methodColor[method] ?? "bg-gray-100 text-gray-600"}`}>
                      {method}
                    </span>
                    <span className="text-[12px] font-mono text-gray-700">{path}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {deps.length > 0 && (
          <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Box className="w-3 h-3" /> Dependencies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {deps.map(d => (
                <span key={d} className="text-[11px] bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-mono">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Entrypoint preview */}
        {entrypoint && (
          <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3 h-3" /> {entrypoint.name}
              </h4>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md font-medium">{entrypoint.language}</span>
            </div>
            <pre className="p-4 text-[11px] font-mono text-gray-700 overflow-x-auto leading-relaxed bg-gray-50" style={{ maxHeight: 220 }}>
              {(entrypoint.content ?? "").slice(0, 1200)}
              {(entrypoint.content ?? "").length > 1200 && "\n\n… (truncated)"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
