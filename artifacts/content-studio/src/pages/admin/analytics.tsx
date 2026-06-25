import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, DollarSign, ShoppingBag, TrendingUp, UserPlus,
  PackageCheck, FileText, RefreshCw, CheckCircle2, Clock,
} from "lucide-react";

type Range = "7" | "30" | "90";

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
];

const TIER_COLORS = ["#7c3aed", "#a78bfa"];
const PLATFORM_COLORS = ["#7c3aed", "#a78bfa", "#6d28d9", "#c4b5fd", "#4c1d95", "#ddd6fe"];
const LIVE_REFRESH_MS = 15_000;

function fmt(d: string) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function fmtMoney(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SummaryCard({
  label, value, sub, icon: Icon, color,
}: {
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

function LiveStatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-3 bg-card border border rounded-xl min-w-[110px]">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-[11px] text-muted-foreground mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

function ChartSkeleton({ h = 220 }: { h?: number }) {
  return <Skeleton className="w-full rounded-xl" style={{ height: h }} />;
}

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

function useSecondsAgo(isoStr: string | null) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!isoStr) return;
    const update = () => setSecs(Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isoStr]);
  return secs;
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>("30");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: () => apiClient.get(`/dashboard/analytics?days=${range}`).then((r) => r.data),
    staleTime: 60_000,
  });

  const {
    data: rt,
    isLoading: rtLoading,
    dataUpdatedAt,
    refetch: refetchRT,
    isFetching: rtFetching,
  } = useQuery({
    queryKey: ["admin-realtime"],
    queryFn: () => apiClient.get("/dashboard/realtime").then((r) => r.data),
    refetchInterval: LIVE_REFRESH_MS,
    staleTime: 0,
  });

  const lastFetched = rt?.fetchedAt ?? null;
  const secsAgo = useSecondsAgo(lastFetched);

  const signups = (data?.signups ?? []).map((r: any) => ({ day: fmt(r.day), value: r.value }));
  const content = (data?.content ?? []).map((r: any) => ({ day: fmt(r.day), value: r.value }));
  const revenue = (data?.revenue ?? []).map((r: any) => ({ day: fmt(r.day), value: parseFloat(r.value) }));
  const tiers = (data?.tiers ?? []).map((r: any) => ({ name: r.tier === "pro" ? "Pro" : "Free", value: r.count }));
  const platforms = (data?.platforms ?? []).map((r: any) => ({ name: r.platform ?? "Other", value: r.count }));
  const totals = data?.totals ?? {};

  const totalRevenue = parseFloat(totals.total_revenue ?? 0);
  const revenue30d = parseFloat(totals.revenue_30d ?? 0);

  const live = rt?.live ?? {};
  const recentSignups: any[] = rt?.recentSignups ?? [];
  const recentOrders: any[] = rt?.recentOrders ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform growth, revenue, and content trends</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border rounded-lg p-1">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                range === o.value ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE SECTION ──────────────────────────────────────── */}
      <div className="rounded-2xl border border bg-gradient-to-br from-slate-50 to-white p-5 space-y-4">
        {/* Live header row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <LivePulse />
            <span className="text-sm font-semibold text-foreground">Live — Today's Activity</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastFetched
                ? secsAgo < 5 ? "Just updated" : `Updated ${secsAgo}s ago`
                : "Loading…"}
            </span>
            <button
              onClick={() => refetchRT()}
              disabled={rtFetching}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium disabled:opacity-40 transition-opacity"
            >
              <RefreshCw className={`w-3 h-3 ${rtFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Live stat badges */}
        <div className="flex gap-3 flex-wrap">
          {rtLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-[110px] rounded-xl" />
            ))
          ) : (
            <>
              <LiveStatBadge label="New Users Today" value={live.users_today ?? 0} color="text-primary" />
              <LiveStatBadge label="Orders Today" value={live.orders_today ?? 0} color="text-blue-600" />
              <LiveStatBadge label="Revenue Today" value={fmtMoney(parseFloat(live.revenue_today ?? 0))} color="text-green-600" />
              <LiveStatBadge label="Content Today" value={live.content_today ?? 0} color="text-amber-600" />
              <LiveStatBadge label="Pending Approvals" value={live.pending_approvals ?? 0} color="text-red-500" />
              <LiveStatBadge label="Total Users" value={live.total_users ?? 0} color="text-foreground" />
            </>
          )}
        </div>

        {/* Recent activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Recent signups */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-primary" /> Recent Signups
            </p>
            <div className="space-y-1.5">
              {rtLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)
              ) : recentSignups.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">No signups yet</p>
              ) : (
                recentSignups.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between bg-card border border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">
                          {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{u.name || u.email}</p>
                        {u.name && <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        u.subscription_tier === "pro"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {u.subscription_tier ?? "free"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(u.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> Recent Orders
            </p>
            <div className="space-y-1.5">
              {rtLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)
              ) : recentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">No orders yet</p>
              ) : (
                recentOrders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between bg-card border border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        o.status === "completed" ? "bg-green-100" : o.status === "pending" ? "bg-amber-100" : "bg-red-100"
                      }`}>
                        <CheckCircle2 className={`w-3 h-3 ${
                          o.status === "completed" ? "text-green-600" : o.status === "pending" ? "text-amber-500" : "text-red-500"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{o.product_title || "Product"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{o.buyer_name || o.buyer_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs font-semibold text-green-700">{fmtMoney(parseFloat(o.amount))}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(o.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ALL-TIME SUMMARY CARDS ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} h={100} />)
        ) : (
          <>
            <SummaryCard label="Total Users" value={totals.total_users ?? 0} sub={`+${totals.users_30d ?? 0} last 30 days`} icon={Users} color="text-primary" />
            <SummaryCard label="Total Revenue" value={fmtMoney(totalRevenue)} sub={`${fmtMoney(revenue30d)} last 30 days`} icon={DollarSign} color="text-green-600" />
            <SummaryCard label="Total Orders" value={totals.total_orders ?? 0} icon={ShoppingBag} color="text-blue-600" />
            <SummaryCard label="Pro Users" value={tiers.find((t: any) => t.name === "Pro")?.value ?? 0} sub={`of ${totals.total_users ?? 0} total`} icon={TrendingUp} color="text-amber-600" />
          </>
        )}
      </div>

      {/* ── CHARTS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border">
          <p className="text-sm font-semibold text-foreground mb-4">New Signups</p>
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={signups}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => [v, "Signups"]} />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#signupGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 border">
          <p className="text-sm font-semibold text-foreground mb-4">Content Generated</p>
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={content}>
                <defs>
                  <linearGradient id="contentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => [v, "Items"]} />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#contentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5 border">
        <p className="text-sm font-semibold text-foreground mb-4">Revenue (Completed Orders)</p>
        {isLoading ? <ChartSkeleton h={240} /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
              <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border">
          <p className="text-sm font-semibold text-foreground mb-4">Subscription Tiers</p>
          {isLoading ? <ChartSkeleton /> : tiers.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tiers} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {tiers.map((_: any, i: number) => <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [v, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5 border">
          <p className="text-sm font-semibold text-foreground mb-4">Content by Platform</p>
          {isLoading ? <ChartSkeleton /> : platforms.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platforms} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={72} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {platforms.map((_: any, i: number) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
