import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Code2, Globe, AlertCircle, Loader2, Eye, FileText, Zap, ChevronDown, ChevronUp } from "lucide-react";

interface PreviewFile {
  id: number;
  path: string;
  name: string;
  content: string;
  language: string;
  isEntrypoint: boolean;
}

interface PreviewProject {
  id: number;
  name: string;
  description: string;
  projectType: string;
  framework: string;
  language: string;
  previewType: string;
  updatedAt: string;
}

const LANG_COLOR: Record<string, string> = {
  html: "#e44d26", css: "#264de4", javascript: "#f7df1e", typescript: "#3178c6",
  python: "#3572a5", json: "#c5a5c5", markdown: "#6b7280", bash: "#4eaa25",
};
const FILE_ICON: Record<string, string> = {
  html: "🌐", css: "🎨", javascript: "⚡", typescript: "💎",
  python: "🐍", json: "📦", markdown: "📝", bash: "🖥️", sql: "🗃️", text: "📄",
};

function buildPreviewHtml(files: PreviewFile[]): string {
  const htmlFile =
    files.find(f => f.isEntrypoint && f.language === "html") ||
    files.find(f => f.name === "index.html") ||
    files.find(f => f.language === "html");
  if (!htmlFile) return "";
  let html = htmlFile.content || "";
  for (const f of files.filter(f => f.language === "css")) {
    const re = new RegExp(`<link[^>]+href=["'](?:\\.?\\/)?${f.name}["'][^>]*>`, "gi");
    html = re.test(html)
      ? html.replace(re, `<style>\n${f.content}\n</style>`)
      : html.replace("</head>", `<style>\n${f.content}\n</style>\n</head>`);
  }
  for (const f of files.filter(f => f.language === "javascript")) {
    const re = new RegExp(`<script[^>]+src=["'](?:\\.?\\/)?${f.name}["'][^>]*>\\s*<\\/script>`, "gi");
    if (re.test(html)) html = html.replace(re, `<script>\n${f.content}\n</script>`);
  }
  return html;
}

export default function WorkspacePreview() {
  const [, params] = useRoute("/preview/:token");
  const token = params?.token;

  const [project, setProject] = useState<PreviewProject | null>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<PreviewFile | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/workspace/preview/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setProject(d.project);
        const sorted = [...(d.files ?? [])].sort((a: PreviewFile, b: PreviewFile) => {
          const order = ["html", "css", "javascript", "typescript"];
          const ai = order.indexOf(a.language), bi = order.indexOf(b.language);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        setFiles(sorted);
        const ep = sorted.find((f: PreviewFile) => f.isEntrypoint) ?? sorted[0] ?? null;
        setActiveFile(ep);
      })
      .catch(() => setError("Failed to load preview"))
      .finally(() => setIsLoading(false));
  }, [token]);

  const previewHtml = project?.previewType === "html" ? buildPreviewHtml(files) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading live demo…</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-white">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preview Unavailable</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {error ?? "This project preview is no longer available. The creator may have disabled sharing."}
          </p>
          <div className="mt-8 pt-6 border-t border-white/8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Zap className="w-3.5 h-3.5 text-violet-500" />
              <span>Built with <span className="text-violet-400 font-medium">AI Dev Studio</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div className="h-12 bg-[#12131a] border-b border-white/[0.07] flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Code2 className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="font-semibold text-[13px] truncate">{project.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium shrink-0">
            Live Demo
          </span>
          {project.framework && (
            <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{project.framework}</span>
          )}
        </div>

        {/* View toggle — only show for html projects */}
        {previewHtml && (
          <div className="flex items-center gap-1 bg-[#1e2130] rounded-md p-0.5">
            <button
              onClick={() => setView("preview")}
              className={`h-6 px-2.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                view === "preview" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button
              onClick={() => setView("code")}
              className={`h-6 px-2.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                view === "code" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Code2 className="w-3 h-3" /> Code
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-muted-foreground text-xs border-l border-white/8 pl-3">
          <Zap className="w-3 h-3 text-violet-500" />
          <span className="hidden sm:block">AI Dev Studio</span>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* HTML live preview */}
        {previewHtml && view === "preview" && (
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            className="flex-1 w-full h-full border-0 bg-card"
            title={project.name}
          />
        )}

        {/* Code viewer (for non-html or when code tab is active) */}
        {(!previewHtml || view === "code") && (
          <MobileCodeViewer files={files} activeFile={activeFile} setActiveFile={setActiveFile} />
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="h-8 bg-[#12131a] border-t border-white/[0.06] flex items-center px-4 gap-3 text-[11px] text-muted-foreground">
        <Globe className="w-3 h-3" />
        <span>Public live demo · {files.length} file{files.length !== 1 ? "s" : ""}</span>
        <span className="ml-auto hidden sm:block">{project.framework} · {project.language}</span>
      </div>
    </div>
  );
}

function MobileCodeViewer({
  files,
  activeFile,
  setActiveFile,
}: {
  files: PreviewFile[];
  activeFile: PreviewFile | null;
  setActiveFile: (f: PreviewFile) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile file picker header */}
      <div className="sm:hidden shrink-0 bg-[#12131a] border-b border-white/[0.06]">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-muted-foreground/60 text-[12px] font-semibold"
        >
          <span className="flex items-center gap-2">
            <span>{FILE_ICON[activeFile?.language ?? ""] ?? "📄"}</span>
            <span className="truncate">{activeFile?.path ?? "Select a file"}</span>
          </span>
          {sidebarOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>
        {sidebarOpen && (
          <div className="border-t border-white/[0.06] max-h-48 overflow-y-auto">
            {files.map(f => (
              <button
                key={f.id}
                onClick={() => { setActiveFile(f); setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 text-[12px] transition-colors ${
                  activeFile?.id === f.id
                    ? "bg-violet-500/15 text-white border-l-2 border-violet-500"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{FILE_ICON[f.language] ?? "📄"}</span>
                <span className="truncate">{f.path}</span>
                <span
                  className="ml-auto shrink-0 text-[9px] font-bold px-1 rounded"
                  style={{ color: LANG_COLOR[f.language] ?? "#6b7280", opacity: 0.8 }}
                >
                  {f.language?.toUpperCase().slice(0, 3)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop + Mobile layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden sm:block w-52 shrink-0 bg-[#0d1117] border-r border-white/[0.06] overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Files
          </div>
          {files.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFile(f)}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-[12px] transition-colors ${
                activeFile?.id === f.id
                  ? "bg-violet-500/15 text-white border-r-2 border-violet-500"
                  : "text-muted-foreground hover:bg-white/4 hover:text-white"
              }`}
            >
              <span>{FILE_ICON[f.language] ?? "📄"}</span>
              <span className="truncate">{f.path}</span>
              <span
                className="ml-auto shrink-0 text-[9px] font-bold px-1 rounded"
                style={{ color: LANG_COLOR[f.language] ?? "#6b7280", opacity: 0.8 }}
              >
                {f.language?.toUpperCase().slice(0, 3)}
              </span>
            </button>
          ))}
        </div>

        {/* Code display */}
        <div className="flex-1 overflow-auto bg-[#0d1117]">
          {activeFile ? (
            <pre className="p-4 text-[12px] leading-[1.6] text-[#cdd6f4] font-mono whitespace-pre-wrap break-words min-h-full">
              <code>{activeFile.content}</code>
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <FileText className="w-8 h-8 mr-3" />
              <span>Select a file to view its source</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
