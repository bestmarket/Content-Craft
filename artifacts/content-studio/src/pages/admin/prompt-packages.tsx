import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, Package, Star, TrendingUp,
  Users, AlertTriangle, ChevronDown, ChevronUp, BarChart2,
} from "lucide-react";

type PromptPkg = {
  id: number;
  title: string;
  topic: string;
  authorName: string;
  authorEmail: string;
  publishStatus: string;
  price: number | null;
  createdAt: string;
  qualityScore: number;
  sellabilityScore: number;
  totalPrompts: number;
  platform: string;
  industry: string;
  tagline: string;
  rejectionReason?: string;
};

type Stats = {
  total: number;
  pending: number;
  live: number;
  rejected: number;
  avgQuality: number;
  avgSellability: number;
};

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 60 ? "bg-amber-100 text-amber-700 border-amber-200" :
    "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {label}: {score}/100
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending_approval: { color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" />, label: "Pending" },
    live: { color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" />, label: "Live" },
    rejected: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" />, label: "Rejected" },
    draft: { color: "bg-muted text-muted-foreground", icon: <Package className="w-3 h-3" />, label: "Draft" },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function PackageCard({ pkg, onApprove, onReject, approving, rejecting }: {
  pkg: PromptPkg;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(pkg.id, reason);
    setShowReject(false);
    setReason("");
  };

  return (
    <Card className="border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <StatusBadge status={pkg.publishStatus} />
              <span className="text-xs text-muted-foreground capitalize">{pkg.platform}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground capitalize">{pkg.industry}</span>
            </div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">{pkg.title}</h3>
            {pkg.tagline && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pkg.tagline}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <ScoreBadge score={pkg.qualityScore} label="Quality" />
              <ScoreBadge score={pkg.sellabilityScore} label="Sellability" />
              <span className="text-xs text-muted-foreground">{pkg.totalPrompts} prompts</span>
              {pkg.price != null && (
                <span className="text-xs font-medium text-foreground">${(pkg.price / 100).toFixed(2)}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              By {pkg.authorName} ({pkg.authorEmail}) · {new Date(pkg.createdAt).toLocaleDateString()}
            </p>
            {pkg.publishStatus === "rejected" && pkg.rejectionReason && (
              <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
                Rejection reason: {pkg.rejectionReason}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {pkg.publishStatus === "pending_approval" && (
              <>
                <Button
                  size="sm"
                  className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs"
                  onClick={() => onApprove(pkg.id)}
                  disabled={approving}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  onClick={() => setShowReject(!showReject)}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {pkg.publishStatus === "live" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                onClick={() => setShowReject(!showReject)}
                disabled={rejecting}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Revoke
              </Button>
            )}
            {pkg.publishStatus === "rejected" && (
              <Button
                size="sm"
                className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs"
                onClick={() => onApprove(pkg.id)}
                disabled={approving}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Re-approve
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {showReject && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-medium text-foreground mb-1.5">
              {pkg.publishStatus === "live" ? "Revocation reason" : "Rejection reason"}
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Prompts are too generic. Please add more specific niche context and use cases."
              rows={2}
              className="text-xs mb-2"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs"
                onClick={handleReject}
                disabled={!reason.trim() || rejecting}
              >
                Confirm
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowReject(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {expanded && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-medium text-foreground mb-1">Topic</p>
            <p className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">{pkg.topic}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AdminPromptPackages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending_approval" | "live" | "rejected">("pending_approval");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ packages: PromptPkg[]; stats: Stats }>({
    queryKey: ["admin-prompt-packages", filter],
    queryFn: () => apiClient.get(`/admin/prompt-packages?status=${filter}`).then((r: any) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-prompt-packages"] });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/prompt-packages/${id}/approve`, {}),
    onSuccess: () => { invalidate(); toast({ title: "✅ Prompt package approved and set to live." }); setApprovingId(null); },
    onError: () => { toast({ title: "Failed to approve", variant: "destructive" }); setApprovingId(null); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiClient.post(`/admin/prompt-packages/${id}/reject`, { reason }),
    onSuccess: () => { invalidate(); toast({ title: "Package rejected and creator notified." }); setRejectingId(null); },
    onError: () => { toast({ title: "Failed to reject", variant: "destructive" }); setRejectingId(null); },
  });

  const handleApprove = (id: number) => {
    setApprovingId(id);
    approveMutation.mutate(id);
  };

  const handleReject = (id: number, reason: string) => {
    setRejectingId(id);
    rejectMutation.mutate({ id, reason });
  };

  const stats = data?.stats;
  const packages = data?.packages ?? [];

  const FILTERS = [
    { key: "pending_approval", label: "Pending Review", icon: Clock },
    { key: "live", label: "Live", icon: CheckCircle },
    { key: "rejected", label: "Rejected", icon: XCircle },
    { key: "all", label: "All", icon: Package },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Prompt Pack Marketplace</h1>
        <p className="text-muted-foreground text-sm">Review, approve, or reject user-submitted prompt packages</p>
      </div>

      {/* Stats dashboard */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 text-center col-span-1">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </Card>
          <Card className="p-3 text-center border-amber-200 bg-amber-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            </div>
            <p className="text-xs text-amber-600">Pending</p>
          </Card>
          <Card className="p-3 text-center border-green-200 bg-green-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <p className="text-2xl font-bold text-green-700">{stats.live}</p>
            </div>
            <p className="text-xs text-green-600">Live</p>
          </Card>
          <Card className="p-3 text-center border-red-200 bg-red-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
            </div>
            <p className="text-xs text-red-600">Rejected</p>
          </Card>
          <Card className="p-3 text-center border-primary/30 bg-primary/5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="w-3.5 h-3.5 text-primary" />
              <p className="text-2xl font-bold text-primary">{stats.avgQuality}</p>
            </div>
            <p className="text-xs text-primary">Avg Quality</p>
          </Card>
          <Card className="p-3 text-center border-indigo-200 bg-indigo-50">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-2xl font-bold text-indigo-700">{stats.avgSellability}</p>
            </div>
            <p className="text-xs text-indigo-600">Avg Sell.</p>
          </Card>
        </div>
      )}

      {/* Quality score context */}
      <Card className="p-3 bg-muted/30 border border">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium">Marketplace minimum: 75/100 quality</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
            <span>80+ = Great</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>60–79 = Review carefully</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            <span>&lt;60 = Reject</span>
          </div>
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? "bg-violet-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {key === "pending_approval" && stats?.pending ? (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${filter === key ? "bg-card/20" : "bg-amber-100 text-amber-700"}`}>
                {stats.pending}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Package list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 h-24 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <Card className="p-10 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No packages with status "{filter}"</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg: PromptPkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onApprove={handleApprove}
              onReject={handleReject}
              approving={approvingId === pkg.id && approveMutation.isPending}
              rejecting={rejectingId === pkg.id && rejectMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
