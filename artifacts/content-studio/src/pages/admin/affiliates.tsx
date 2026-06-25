import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users, DollarSign, Clock, CheckCircle2, TrendingUp,
  Percent, CreditCard, ChevronDown, ChevronUp,
} from "lucide-react";

function fmt$(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <Card className="p-5 border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

export default function AdminAffiliates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rateUser, setRateUser] = useState<{ id: number; name: string; rate: number } | null>(null);
  const [newRate, setNewRate] = useState("");
  const [commissionFilter, setCommissionFilter] = useState<"" | "pending" | "paid">("");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-affiliate-stats"],
    queryFn: () => apiClient.get("/admin/affiliates/stats").then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ["admin-affiliate-leaderboard"],
    queryFn: () => apiClient.get("/admin/affiliates/leaderboard?limit=25").then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: commissions, isLoading: comLoading } = useQuery({
    queryKey: ["admin-affiliate-commissions", commissionFilter],
    queryFn: () =>
      apiClient.get(`/admin/affiliates/commissions?limit=50${commissionFilter ? `&status=${commissionFilter}` : ""}`).then((r) => r.data),
    staleTime: 30_000,
  });

  const updateRate = useMutation({
    mutationFn: ({ userId, rate }: { userId: number; rate: number }) =>
      apiClient.patch(`/admin/affiliates/${userId}/rate`, { rate }),
    onSuccess: () => {
      toast({ title: "Commission rate updated" });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-leaderboard"] });
      setRateUser(null);
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const markPaid = useMutation({
    mutationFn: (commissionId: number) =>
      apiClient.post(`/admin/affiliates/commissions/${commissionId}/mark-paid`, {}),
    onSuccess: () => {
      toast({ title: "Marked as paid" });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-commissions"] });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-leaderboard"] });
    },
  });

  const markAllPaid = useMutation({
    mutationFn: (userId: number) =>
      apiClient.post(`/admin/affiliates/${userId}/mark-all-paid`, {}),
    onSuccess: (_, userId) => {
      toast({ title: "All pending commissions marked as paid" });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-commissions"] });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-affiliate-leaderboard"] });
    },
  });

  const totals = stats?.totals ?? {};

  const openRateDialog = (u: any) => {
    setNewRate((parseFloat(u.commission_rate) * 100).toFixed(0));
    setRateUser({ id: u.id, name: u.name, rate: parseFloat(u.commission_rate) });
  };

  const handleSaveRate = () => {
    if (!rateUser) return;
    const pct = parseFloat(newRate);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Enter a percentage between 0 and 100", variant: "destructive" });
      return;
    }
    updateRate.mutate({ userId: rateUser.id, rate: pct / 100 });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Affiliate Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Referral stats, top affiliates, and commission management</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)
        ) : (
          <>
            <SummaryCard label="Active Affiliates" value={totals.total_affiliates ?? 0}
              sub={`${totals.total_signups ?? 0} signups · ${totals.total_upgrades ?? 0} upgrades`}
              icon={Users} color="text-primary" />
            <SummaryCard label="Total Commissions" value={fmt$(totals.total_commissions ?? 0)}
              sub={`${totals.total_sales ?? 0} sale commissions`}
              icon={DollarSign} color="text-green-600" />
            <SummaryCard label="Pending Payout" value={fmt$(totals.pending_commissions ?? 0)}
              icon={Clock} color="text-amber-600" />
            <SummaryCard label="Total Paid Out" value={fmt$(totals.paid_commissions ?? 0)}
              icon={CheckCircle2} color="text-blue-600" />
          </>
        )}
      </div>

      {/* Leaderboard */}
      <Card className="border overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm">Top Affiliates</p>
          <p className="text-xs text-muted-foreground">Click a row to manage</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Affiliate</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Rate</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Referrals</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Earned</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Pending</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lbLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-7 w-full" /></td></tr>
                ))
              ) : !leaderboard?.length ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No affiliates yet</td></tr>
              ) : leaderboard.map((u: any, idx: number) => {
                const isExpanded = expandedUser === u.id;
                return (
                  <>
                    <tr
                      key={u.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {u.affiliate_code ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-primary/5 text-primary border border-primary/30 text-xs">
                          {(parseFloat(u.commission_rate) * 100).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">{u.total_referrals}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground text-xs">{fmt$(u.total_earned)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 text-xs font-medium">{fmt$(u.pending)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${u.id}-expanded`} className="bg-muted/30">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-6">
                            {/* Breakdown */}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span><span className="font-semibold">{u.signups}</span> signup{u.signups !== 1 ? "s" : ""}</span>
                              <span><span className="font-semibold">{u.upgrades}</span> upgrade{u.upgrades !== 1 ? "s" : ""}</span>
                              <span><span className="font-semibold">{u.sales}</span> sale{u.sales !== 1 ? "s" : ""}</span>
                              <span className="text-green-700"><span className="font-semibold">{fmt$(u.paid_out)}</span> paid</span>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-2 ml-auto">
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={(e) => { e.stopPropagation(); openRateDialog(u); }}>
                                <Percent className="w-3 h-3 mr-1" /> Set Rate
                              </Button>
                              {u.pending > 0 && (
                                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  disabled={markAllPaid.isPending}
                                  onClick={(e) => { e.stopPropagation(); markAllPaid.mutate(u.id); }}>
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Pay {fmt$(u.pending)}
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent commissions */}
      <Card className="border overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between flex-wrap gap-3">
          <p className="font-semibold text-foreground text-sm">Recent Commissions</p>
          <div className="flex gap-1">
            {(["", "pending", "paid"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCommissionFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  commissionFilter === f
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground bg-card border border"
                }`}
              >
                {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Affiliate</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Referee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>
                ))
              ) : !commissions?.length ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No commissions found</td></tr>
              ) : commissions.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">{c.referrer_name}</p>
                    <p className="text-muted-foreground text-xs">{c.referrer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-muted-foreground text-xs">{c.referee_name}</p>
                    <p className="text-muted-foreground text-xs">{c.referee_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs capitalize ${
                      c.type === "sale" ? "bg-blue-50 text-blue-700 border-blue-200"
                        : c.type === "upgrade" ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-muted text-muted-foreground border"
                    } border`}>
                      {c.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground text-xs">
                    {fmt$(c.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${
                      c.status === "paid"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === "pending" && (
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-xs border-green-200 text-green-700 hover:bg-green-50"
                        disabled={markPaid.isPending}
                        onClick={() => markPaid.mutate(c.id)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rate dialog */}
      <Dialog open={!!rateUser} onOpenChange={(o) => !o && setRateUser(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" /> Custom Commission Rate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Setting a custom rate for <span className="font-semibold">{rateUser?.name}</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              Default platform rate is 30%. Custom rates apply to future commissions only.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="rate-input">Commission rate (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rate-input"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="30"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateUser(null)}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleSaveRate}
              disabled={updateRate.isPending}
            >
              {updateRate.isPending ? "Saving…" : "Save Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
