import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Cloud, Upload, Trash2, Copy, ExternalLink, LayoutGrid, List,
  Image, Film, Music, FileText, FolderOpen, RefreshCw, X,
  CheckCircle2, XCircle, HardDrive, Search, ChevronLeft, ChevronRight,
  Loader2, File, Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface R2File {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
  mime: string;
  type: "image" | "video" | "audio" | "pdf" | "other";
  folder: string;
  name: string;
}

interface StatsData {
  totalFiles: number;
  totalBytes: number;
  byFolder: Record<string, { count: number; bytes: number }>;
}

interface StatusData {
  configured: boolean;
  connected: boolean;
  bucketName?: string;
  publicDomain?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const FOLDER_TABS = [
  { key: "",             label: "All Files",   icon: FolderOpen },
  { key: "images",       label: "Images",      icon: Image      },
  { key: "hero-images",  label: "Hero Images", icon: Image      },
  { key: "thumbnails",   label: "Thumbnails",  icon: Image      },
  { key: "videos",       label: "Videos",      icon: Film       },
  { key: "audio",        label: "Audio",       icon: Music      },
  { key: "uploads",      label: "Uploads",     icon: Upload     },
  { key: "pdfs",         label: "PDFs",        icon: FileText   },
];

const TYPE_COLORS: Record<string, string> = {
  image: "bg-violet-100 text-violet-700",
  video: "bg-blue-100 text-blue-700",
  audio: "bg-emerald-100 text-emerald-700",
  pdf:   "bg-amber-100 text-amber-700",
  other: "bg-slate-100 text-slate-600",
};

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({ file, onDelete, onCopy }: { file: R2File; onDelete: () => void; onCopy: () => void }) {
  const [hover, setHover] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const preview = file.type === "image" && !imgErr ? (
    <img
      src={file.url}
      alt={file.name}
      className="w-full h-full object-cover"
      onError={() => setImgErr(true)}
    />
  ) : file.type === "video" ? (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <Film className="w-10 h-10 text-blue-400" />
      <span className="text-xs text-slate-500">Video</span>
    </div>
  ) : file.type === "audio" ? (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <Music className="w-10 h-10 text-emerald-400" />
      <span className="text-xs text-slate-500">Audio</span>
    </div>
  ) : file.type === "pdf" ? (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <FileText className="w-10 h-10 text-amber-400" />
      <span className="text-xs text-slate-500">PDF</span>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <File className="w-10 h-10 text-slate-400" />
      <span className="text-xs text-slate-500">File</span>
    </div>
  );

  return (
    <div
      className="group relative border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="aspect-square bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
        {preview}
        {hover && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 backdrop-blur-[1px]">
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
              title="Copy URL"
            >
              <Copy className="w-4 h-4 text-white" />
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
              title="Open in new tab"
            >
              <Eye className="w-4 h-4 text-white" />
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 rounded-full bg-red-500/70 hover:bg-red-600/80 flex items-center justify-center transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium text-foreground truncate" title={file.name}>{file.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[file.type] ?? TYPE_COLORS.other}`}>
            {file.type}
          </span>
          <span className="text-[10px] text-muted-foreground">{fmtBytes(file.size)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function FileRow({ file, onDelete, onCopy }: { file: R2File; onDelete: () => void; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        {file.type === "image"  ? <Image    className="w-4 h-4 text-violet-500" /> :
         file.type === "video"  ? <Film     className="w-4 h-4 text-blue-500"   /> :
         file.type === "audio"  ? <Music    className="w-4 h-4 text-emerald-500"/> :
         file.type === "pdf"    ? <FileText className="w-4 h-4 text-amber-500"  /> :
                                  <File     className="w-4 h-4 text-slate-400"  />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground truncate">{file.key}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${TYPE_COLORS[file.type] ?? TYPE_COLORS.other}`}>{file.type}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0 w-16 text-right">{fmtBytes(file.size)}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0 w-24 text-right hidden md:block">{fmtDate(file.lastModified)}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onCopy} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground" title="Copy URL">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground" title="Open">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

function UploadZone({ folder, onDone }: { folder: string; onDone: () => void }) {
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("folder", folder || "uploads");
      Array.from(files).forEach(f => form.append("files", f));
      const res = await fetch("/api/admin/r2/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: form,
      });
      const data = await res.json();
      toast({ title: `${data.uploaded?.length ?? 0} file(s) uploaded${data.failed?.length ? `, ${data.failed.length} failed` : ""}` });
      onDone();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragging ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20" : "border-slate-200 dark:border-slate-700 hover:border-violet-300"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); doUpload(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => doUpload(e.target.files)} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading to R2…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Upload className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Images, videos, audio, PDFs — up to 200 MB each</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMedia() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeFolder, setActiveFolder] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const statusQ = useQuery<StatusData>({
    queryKey: ["r2-status"],
    queryFn: () => apiClient.get("/admin/r2/status").then(r => r.data),
    staleTime: 30_000,
  });

  const statsQ = useQuery<StatsData>({
    queryKey: ["r2-stats"],
    queryFn: () => apiClient.get("/admin/r2/stats").then(r => r.data),
    staleTime: 60_000,
    enabled: statusQ.data?.connected === true,
  });

  const filesQ = useQuery<{ files: R2File[]; nextCursor: string | null }>({
    queryKey: ["r2-files", activeFolder, cursor],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "48" });
      if (activeFolder) params.set("folder", activeFolder);
      if (cursor) params.set("cursor", cursor);
      return apiClient.get(`/admin/r2/files?${params}`).then(r => r.data);
    },
    enabled: statusQ.data?.connected === true,
    staleTime: 15_000,
  });

  const deleteMut = useMutation({
    mutationFn: (key: string) => apiClient.delete("/admin/r2/file", { data: { key } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["r2-files"] });
      queryClient.invalidateQueries({ queryKey: ["r2-stats"] });
      toast({ title: "File deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => toast({ title: "URL copied" }));
  }, [toast]);

  const visibleFiles = (filesQ.data?.files ?? []).filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.key.toLowerCase().includes(search.toLowerCase())
  );

  const status = statusQ.data;
  const stats = statsQ.data;

  if (statusQ.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!status?.configured) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto">
            <Cloud className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Cloudflare R2 not configured</h2>
          <p className="text-muted-foreground text-sm">Set up your R2 storage credentials in Admin → Settings to use the media library.</p>
          <a href="/admin/settings">
            <Button variant="outline">Go to Settings</Button>
          </a>
        </div>
      </AdminLayout>
    );
  }

  if (!status?.connected) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">R2 connection failed</h2>
          <p className="text-muted-foreground text-sm">Could not reach your R2 bucket. Check your credentials in Settings.</p>
          <p className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{status.error}</p>
          <a href="/admin/settings">
            <Button variant="outline">Fix Credentials</Button>
          </a>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Bucket: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{status.bucketName}</code>
              {" · "}{status.publicDomain}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["r2-files"] });
                queryClient.invalidateQueries({ queryKey: ["r2-stats"] });
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setShowUpload(v => !v)}>
              <Upload className="w-3.5 h-3.5" /> Upload
            </Button>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Files",  value: stats.totalFiles.toLocaleString(),     icon: FolderOpen, color: "violet" },
              { label: "Total Size",   value: fmtBytes(stats.totalBytes),              icon: HardDrive,  color: "blue"   },
              { label: "Images",       value: ((stats.byFolder["images"]?.count ?? 0) + (stats.byFolder["thumbnails"]?.count ?? 0) + (stats.byFolder["hero-images"]?.count ?? 0)).toLocaleString(), icon: Image, color: "purple" },
              { label: "Videos",       value: (stats.byFolder["videos"]?.count ?? 0).toLocaleString(), icon: Film, color: "indigo" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
                <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        {showUpload && (
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm relative">
            <button
              onClick={() => setShowUpload(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-sm mb-3">Upload Files to R2 → <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{activeFolder || "uploads"}/</code></h3>
            <UploadZone
              folder={activeFolder || "uploads"}
              onDone={() => {
                setShowUpload(false);
                queryClient.invalidateQueries({ queryKey: ["r2-files"] });
                queryClient.invalidateQueries({ queryKey: ["r2-stats"] });
              }}
            />
          </div>
        )}

        {/* Folder tabs + controls */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-0 border-b flex-wrap gap-y-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-hide">
              {FOLDER_TABS.map(({ key, label, icon: Icon }) => {
                const folderStats = key ? stats?.byFolder[key] : null;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveFolder(key); setCursor(null); }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                      activeFolder === key
                        ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {folderStats && folderStats.count > 0 && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {folderStats.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pb-4">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files…"
                  className="pl-8 h-8 text-sm w-44"
                />
              </div>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-muted-foreground hover:bg-slate-50"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 ${viewMode === "list" ? "bg-violet-600 text-white" : "text-muted-foreground hover:bg-slate-50"}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {filesQ.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          ) : filesQ.isError ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <XCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-muted-foreground">Failed to load files</p>
            </div>
          ) : visibleFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Cloud className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "No files match your search" : "No files in this folder yet"}
              </p>
              {!search && (
                <Button variant="outline" size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload Files
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {visibleFiles.map(f => (
                <FileCard
                  key={f.key}
                  file={f}
                  onDelete={() => deleteMut.mutate(f.key)}
                  onCopy={() => handleCopy(f.url)}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              <div className="flex items-center gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8" />
                <div className="flex-1">Name / Key</div>
                <div className="w-16">Type</div>
                <div className="w-16 text-right">Size</div>
                <div className="w-24 text-right hidden md:block">Modified</div>
                <div className="w-20" />
              </div>
              {visibleFiles.map(f => (
                <FileRow
                  key={f.key}
                  file={f}
                  onDelete={() => deleteMut.mutate(f.key)}
                  onCopy={() => handleCopy(f.url)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {(filesQ.data?.nextCursor || cursor) && (
            <div className="flex items-center justify-center gap-3 p-4 border-t">
              <Button
                variant="outline" size="sm"
                disabled={!cursor}
                onClick={() => setCursor(null)}
                className="gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> First Page
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={!filesQ.data?.nextCursor}
                onClick={() => setCursor(filesQ.data?.nextCursor ?? null)}
                className="gap-1.5"
              >
                Next Page <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Folder breakdown */}
        {stats && (
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm text-foreground mb-4">Storage by Folder</h3>
            <div className="space-y-3">
              {Object.entries(stats.byFolder)
                .filter(([, v]) => v.count > 0)
                .sort(([, a], [, b]) => b.bytes - a.bytes)
                .map(([folder, { count, bytes }]) => {
                  const pct = stats.totalBytes > 0 ? (bytes / stats.totalBytes) * 100 : 0;
                  return (
                    <div key={folder} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <button
                          onClick={() => { setActiveFolder(folder); setCursor(null); }}
                          className="font-medium text-foreground hover:text-violet-600 transition-colors flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                          {folder}
                        </button>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span>{count} {count === 1 ? "file" : "files"}</span>
                          <span>{fmtBytes(bytes)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 0.5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
