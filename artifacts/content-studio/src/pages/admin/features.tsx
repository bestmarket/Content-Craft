import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Crown, ShieldCheck, Save, RefreshCw, Loader2,
  ToggleLeft, ToggleRight, Layers, Search,
  Wand2, ShoppingBag, Mail, Bot, TrendingUp, Wallet,
  Store, Code, HelpCircle, Check, X, ChevronDown, ChevronRight,
  Users, Globe, UserCheck, UserX, Trash2, CheckSquare, Square,
  ShieldAlert, Power, PowerOff, AlertTriangle, Info,
  LayoutGrid, Settings2, UserCog,
} from "lucide-react";

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { icon: any; color: string; bg: string; border: string; dot: string }> = {
  "AI Tools":          { icon: Wand2,       color: "text-violet-700", bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-500"  },
  "Products":          { icon: ShoppingBag, color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500"    },
  "Email Marketing":   { icon: Mail,        color: "text-cyan-700",   bg: "bg-cyan-50",    border: "border-cyan-200",   dot: "bg-cyan-500"    },
  "Automation":        { icon: Bot,         color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", dot: "bg-orange-500"  },
  "Growth":            { icon: TrendingUp,  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500"   },
  "Finance":           { icon: Wallet,      color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500" },
  "Store & Branding":  { icon: Store,       color: "text-rose-700",   bg: "bg-rose-50",    border: "border-rose-200",   dot: "bg-rose-500"    },
  "Developer":         { icon: Code,        color: "text-foreground",  bg: "bg-muted/30",   border: "border",  dot: "bg-slate-500"   },
  "Support":           { icon: HelpCircle,  color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500"   },
};

const getCat = (cat: string) => CATEGORIES[cat] ?? { icon: Layers, color: "text-muted-foreground", bg: "bg-muted/30", border: "border", dot: "bg-slate-400" };

const TIERS = [
  { key: "free",       label: "Free",       icon: Zap,         color: "text-muted-foreground",  bg: "bg-muted/30",  border: "border",  check: "text-muted-foreground"  },
  { key: "pro",        label: "Pro",        icon: Crown,       color: "text-primary", bg: "bg-primary/5", border: "border-primary/30", check: "text-primary" },
  { key: "enterprise", label: "Enterprise", icon: ShieldCheck, color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  check: "text-amber-600"  },
];

const TIER_BADGE: Record<string, string> = {
  free: "bg-muted text-foreground",
  pro: "bg-primary/10 text-primary",
  enterprise: "bg-amber-100 text-amber-700",
  admin: "bg-red-100 text-red-700",
};

// ─── Shared hooks ─────────────────────────────────────────────────────────────
function useFeatures() {
  return useQuery({
    queryKey: ["admin-features"],
    queryFn: () => apiClient.get("/features").then(r => r.data as any[]),
  });
}

function useOverrideStats() {
  return useQuery({
    queryKey: ["admin-override-stats"],
    queryFn: () => apiClient.get("/admin/user-features/stats").then(r => r.data as Record<string, { granted: number; revoked: number }>),
    staleTime: 10_000,
  });
}

// ─── Grouped helper ───────────────────────────────────────────────────────────
function groupBy(items: any[], key = "category", search = "") {
  const filtered = search
    ? items.filter(f => f.label.toLowerCase().includes(search.toLowerCase()) || (f.category ?? "").toLowerCase().includes(search.toLowerCase()) || (f.description ?? "").toLowerCase().includes(search.toLowerCase()))
    : items;
  return filtered.reduce((acc: Record<string, any[]>, f: any) => {
    const cat = f[key] ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — SITE CONTROL
// ═══════════════════════════════════════════════════════════════════════════════
function SiteControlTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<number | null>(null);

  const { data: features, isLoading, refetch } = useFeatures();

  const grouped = useMemo(() => {
    if (!features) return {};
    return groupBy(features, "category", search);
  }, [features, search]);

  const activeCount = features?.filter(f => f.is_active ?? f.isActive).length ?? 0;
  const totalCount = features?.length ?? 0;

  const toggleFeature = async (f: any) => {
    const isActive = f.is_active ?? f.isActive;
    setToggling(f.id);
    try {
      await apiClient.patch(`/features/${f.id}/toggle`, { isActive: !isActive });
      qc.invalidateQueries({ queryKey: ["admin-features"] });
      qc.invalidateQueries({ queryKey: ["my-feature-access"] });
      toast({ title: `${!isActive ? "✅ Enabled" : "🔴 Disabled"}: ${f.label}` });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setToggling(null); }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Power className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{activeCount}</p>
              <p className="text-xs text-green-600">Features Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <PowerOff className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{totalCount - activeCount}</p>
              <p className="text-xs text-red-500">Features Disabled</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Layers className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Object.keys(grouped).length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search + refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search features..."
            className="w-full pl-9 pr-4 h-9 border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
        </Button>
        <p className="text-sm text-muted-foreground ml-auto">{totalCount} features across {Object.keys(grouped).length} categories</p>
      </div>

      {/* Category groups */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => {
          const cat = getCat(category);
          const Icon = cat.icon;
          const isCollapsed = collapsed[category];
          const catActive = (items as any[]).filter(f => f.is_active ?? f.isActive).length;
          return (
            <Card key={category} className={`border ${cat.border} overflow-hidden`}>
              <button
                className={`w-full flex items-center gap-3 px-5 py-3.5 ${cat.bg} hover:opacity-90 transition-opacity border-b text-left`}
                onClick={() => setCollapsed(c => ({ ...c, [category]: !isCollapsed }))}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.bg} border ${cat.border}`}>
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                </div>
                <span className={`font-bold ${cat.color}`}>{category}</span>
                <span className="text-xs text-muted-foreground ml-1">({(items as any[]).length} features)</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-semibold text-green-600">{catActive} active</span>
                  {(items as any[]).length - catActive > 0 && (
                    <span className="text-xs text-red-400">{(items as any[]).length - catActive} off</span>
                  )}
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {(items as any[]).map((f: any) => {
                    const isActive = f.is_active ?? f.isActive;
                    const isToggling = toggling === f.id;
                    return (
                      <div key={f.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isActive ? "bg-card hover:bg-muted/30" : "bg-muted/30/60 hover:bg-muted/30"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? "bg-green-400" : "bg-slate-300"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{f.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">{f.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                            {isActive ? "Active" : "Disabled"}
                          </span>
                          <button
                            onClick={() => toggleFeature(f)}
                            disabled={isToggling}
                            className="relative transition-transform hover:scale-105 active:scale-95"
                            title={isActive ? "Click to disable globally" : "Click to enable globally"}>
                            {isToggling
                              ? <Loader2 className="w-9 h-9 animate-spin text-muted-foreground/60" />
                              : isActive
                                ? <ToggleRight className="w-10 h-10 text-green-500" />
                                : <ToggleLeft className="w-10 h-10 text-muted-foreground/60" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Site Control</span> — toggling a feature off here disables it for <em>everyone</em> on the platform instantly, regardless of their plan or any user-level overrides.
            Use the <span className="font-semibold">Plan Access</span> tab to control which subscription plans can access each feature, and <span className="font-semibold">User Access</span> to manage individual users.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PLAN ACCESS
// ═══════════════════════════════════════════════════════════════════════════════
function PlanAccessTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<number, { tiersAllowed: string[]; isActive: boolean }>>({});
  const [saving, setSaving] = useState(false);

  const { data: features, isLoading, refetch } = useFeatures();

  const grouped = useMemo(() => {
    if (!features) return {};
    return groupBy(features, "category", search);
  }, [features, search]);

  const getPending = (f: any) => pendingChanges[f.id] ?? {
    tiersAllowed: f.tiers_allowed ?? f.tiersAllowed ?? [],
    isActive: f.is_active ?? f.isActive,
  };

  const toggleTier = (f: any, tier: string) => {
    const current = getPending(f);
    const tiers = current.tiersAllowed.includes(tier)
      ? current.tiersAllowed.filter((t: string) => t !== tier)
      : [...current.tiersAllowed, tier];
    setPendingChanges(p => ({ ...p, [f.id]: { ...current, tiersAllowed: tiers } }));
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;
  const changeCount = Object.keys(pendingChanges).length;

  const saveAll = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(pendingChanges).map(([id, changes]) => ({
        id: parseInt(id), tiersAllowed: changes.tiersAllowed, isActive: changes.isActive,
      }));
      await apiClient.post("/admin/features/bulk-tier-update", updates);
      qc.invalidateQueries({ queryKey: ["admin-features"] });
      qc.invalidateQueries({ queryKey: ["my-feature-access"] });
      setPendingChanges({});
      toast({ title: `✅ Saved plan access for ${updates.length} feature${updates.length !== 1 ? "s" : ""}` });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Save failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Plan legend */}
      <div className="grid grid-cols-3 gap-4">
        {TIERS.map(t => (
          <div key={t.key} className={`rounded-xl border ${t.border} ${t.bg} p-4 flex items-center gap-3`}>
            <t.icon className={`w-5 h-5 ${t.color}`} />
            <div>
              <p className={`font-bold ${t.color}`}>{t.label} Plan</p>
              <p className="text-xs text-muted-foreground">
                {t.key === "free" ? "Default — no payment" : t.key === "pro" ? "Monthly / annual subscription" : "Custom enterprise pricing"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky top-4 z-10 bg-card border border-primary/30 rounded-xl shadow-lg px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-semibold text-foreground">{changeCount} unsaved change{changeCount !== 1 ? "s" : ""}</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPendingChanges({})} disabled={saving}>Discard</Button>
            <Button size="sm" onClick={saveAll} disabled={saving} className="bg-primary hover:bg-primary/90 text-white border-0">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save All Changes</>}
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search features..."
            className="w-full pl-9 pr-4 h-9 border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
        <p className="text-sm text-muted-foreground ml-auto">{features?.length ?? 0} features</p>
      </div>

      {/* Feature tier matrix */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => {
          const cat = getCat(category);
          const Icon = cat.icon;
          const isCollapsed = collapsed[category];
          const pending = (items as any[]).filter(f => pendingChanges[f.id]).length;
          return (
            <Card key={category} className={`border ${cat.border} overflow-hidden`}>
              <button
                className={`w-full flex items-center gap-3 px-5 py-3.5 ${cat.bg} hover:opacity-90 transition-opacity border-b text-left`}
                onClick={() => setCollapsed(c => ({ ...c, [category]: !isCollapsed }))}>
                <Icon className={`w-4 h-4 ${cat.color}`} />
                <span className={`font-bold ${cat.color}`}>{category}</span>
                <span className="text-xs text-muted-foreground ml-1">({(items as any[]).length} features)</span>
                {pending > 0 && <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">{pending} changed</Badge>}
                <div className="ml-auto">{isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}</div>
              </button>

              {!isCollapsed && (
                <>
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_100px_100px_100px] gap-0 border-b bg-card px-5 py-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature</span>
                    {TIERS.map(t => (
                      <span key={t.key} className={`text-xs font-semibold uppercase tracking-wider text-center ${t.color}`}>{t.label}</span>
                    ))}
                  </div>

                  {(items as any[]).map((f: any) => {
                    const state = getPending(f);
                    const isDirty = !!pendingChanges[f.id];
                    const tiers = state.tiersAllowed;
                    const limits = (f.limits ?? {}) as Record<string, any>;
                    const isActive = state.isActive;
                    return (
                      <div key={f.id}
                        className={`grid grid-cols-[1fr_100px_100px_100px] gap-0 px-5 py-4 border-b last:border-b-0 items-center transition-colors ${isDirty ? "bg-amber-50" : "hover:bg-muted/30"} ${!isActive ? "opacity-60" : ""}`}>
                        <div className="pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400" : "bg-slate-300"}`} />
                            <span className="font-semibold text-foreground text-sm">{f.label}</span>
                            {isDirty && <span className="text-xs text-amber-600 font-semibold">● edited</span>}
                            {!isActive && <Badge className="bg-red-100 text-red-600 text-xs">disabled site-wide</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-4 leading-relaxed">{f.description}</p>
                        </div>
                        {TIERS.map(tier => {
                          const hasTier = tiers.includes(tier.key);
                          const limit = limits[tier.key];
                          return (
                            <div key={tier.key} className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => toggleTier(f, tier.key)}
                                disabled={!isActive}
                                className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${hasTier ? `${tier.bg} ${tier.border} ${tier.check}` : "bg-card border text-white hover:border"} ${!isActive ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}>
                                {hasTier ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-25" />}
                              </button>
                              {limit && (
                                <span className="text-center leading-tight px-1 text-muted-foreground" style={{ fontSize: "10px" }}>
                                  {limit.count === -1 ? "∞ unlimited" : limit.count === 0 ? "✗" : `${limit.count} ${limit.unit ?? ""}`}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Plan Access</span> — checking a plan's box gives everyone on that plan access to the feature. Admin accounts always have full access regardless of plan settings.
            Features that are <span className="font-semibold">disabled site-wide</span> (from the Site Control tab) can't be toggled here until re-enabled.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — USER ACCESS
// ═══════════════════════════════════════════════════════════════════════════════
function UserAccessTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // User selector state
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [focusedUserId, setFocusedUserId] = useState<number | null>(null);
  const [featureSearch, setFeatureSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  // All-users section state
  const [allFeatureSearch, setAllFeatureSearch] = useState("");
  const [allApplying, setAllApplying] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-uf-users"],
    queryFn: () => apiClient.get("/admin/user-features/users").then(r => r.data as any[]),
  });

  const { data: userAccess, isLoading: accessLoading, refetch: refetchAccess } = useQuery({
    queryKey: ["admin-uf-access", focusedUserId],
    queryFn: () => focusedUserId ? apiClient.get(`/admin/user-features/${focusedUserId}`).then(r => r.data as any) : null,
    enabled: !!focusedUserId,
  });

  const { data: features } = useFeatures();
  const { data: overrideStats, refetch: refetchStats } = useOverrideStats();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = userSearch.toLowerCase();
    return users.filter((u: any) =>
      u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredFeatures = useMemo(() => {
    if (!features) return [];
    if (!allFeatureSearch) return features;
    const q = allFeatureSearch.toLowerCase();
    return features.filter((f: any) => f.label?.toLowerCase().includes(q) || (f.category ?? "").toLowerCase().includes(q));
  }, [features, allFeatureSearch]);

  const groupedAllFeatures = useMemo(() => groupBy(filteredFeatures, "category"), [filteredFeatures]);

  const filteredAccess = useMemo(() => {
    if (!userAccess?.access) return [];
    if (!featureSearch) return userAccess.access;
    const q = featureSearch.toLowerCase();
    return userAccess.access.filter((f: any) =>
      f.label.toLowerCase().includes(q) || (f.category ?? "").toLowerCase().includes(q)
    );
  }, [userAccess, featureSearch]);

  const groupedAccess = useMemo(() => groupBy(filteredAccess, "category"), [filteredAccess]);

  const toggleUserSelect = (id: number) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Per-user override actions ──
  const setOverride = async (featureKey: string, access: "granted" | "revoked") => {
    setApplying(featureKey + access);
    try {
      if (selectedUserIds.size > 1) {
        await apiClient.post("/admin/user-features/bulk-override", { userIds: Array.from(selectedUserIds), featureKey, access });
        toast({ title: `✅ Applied to ${selectedUserIds.size} users` });
        qc.invalidateQueries({ queryKey: ["admin-uf-access"] });
      } else if (focusedUserId) {
        await apiClient.post("/admin/user-features/override", { userId: focusedUserId, featureKey, access });
        toast({ title: `✅ Override applied` });
        qc.invalidateQueries({ queryKey: ["admin-uf-access", focusedUserId] });
      }
      qc.invalidateQueries({ queryKey: ["admin-override-stats"] });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setApplying(null); }
  };

  const clearOverride = async (featureKey: string) => {
    setApplying(featureKey + "clear");
    try {
      if (selectedUserIds.size > 1) {
        for (const uid of selectedUserIds) {
          await apiClient.delete("/admin/user-features/override", { data: { userId: uid, featureKey } });
        }
        toast({ title: `✅ Override cleared for ${selectedUserIds.size} users` });
        qc.invalidateQueries({ queryKey: ["admin-uf-access"] });
      } else if (focusedUserId) {
        await apiClient.delete("/admin/user-features/override", { data: { userId: focusedUserId, featureKey } });
        toast({ title: "✅ Override cleared — reverted to plan default" });
        qc.invalidateQueries({ queryKey: ["admin-uf-access", focusedUserId] });
      }
      qc.invalidateQueries({ queryKey: ["admin-override-stats"] });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setApplying(null); }
  };

  const clearAllUserOverrides = async (userId: number) => {
    try {
      await apiClient.delete("/admin/user-features/all", { data: { userId } });
      toast({ title: "✅ All overrides cleared for this user" });
      qc.invalidateQueries({ queryKey: ["admin-uf-access", userId] });
      qc.invalidateQueries({ queryKey: ["admin-override-stats"] });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" });
    }
  };

  // ── All-users actions ──
  const overrideAllUsers = async (featureKey: string, access: "granted" | "revoked") => {
    const key = `${featureKey}-${access}`;
    setAllApplying(key);
    try {
      const res = await apiClient.post("/admin/user-features/override-all", { featureKey, access });
      toast({ title: `✅ ${access === "granted" ? "Granted" : "Revoked"} for all ${res.data?.updated ?? "all"} users` });
      qc.invalidateQueries({ queryKey: ["admin-uf-access"] });
      qc.invalidateQueries({ queryKey: ["admin-override-stats"] });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setAllApplying(null); }
  };

  const clearAllUsersOverride = async (featureKey: string) => {
    setAllApplying(`${featureKey}-clear`);
    try {
      await apiClient.delete("/admin/user-features/override-all", { data: { featureKey } });
      toast({ title: "✅ Overrides cleared for all users — reverted to plan default" });
      qc.invalidateQueries({ queryKey: ["admin-uf-access"] });
      qc.invalidateQueries({ queryKey: ["admin-override-stats"] });
    } catch (e: any) {
      toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setAllApplying(null); }
  };

  return (
    <div className="space-y-6">

      {/* ── SECTION A: ALL USERS ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">Apply to All Users</h2>
            <p className="text-xs text-muted-foreground">Grant or revoke a feature for every registered user at once</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { refetchStats(); }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
          </Button>
        </div>

        {/* Feature search for all-users panel */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={allFeatureSearch} onChange={e => setAllFeatureSearch(e.target.value)}
            placeholder="Search features to apply bulk action..."
            className="w-full pl-9 pr-4 h-9 border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>

        <div className="space-y-3">
          {Object.entries(groupedAllFeatures).map(([category, catFeatures]) => {
            const cat = getCat(category);
            const Icon = cat.icon;
            return (
              <Card key={category} className={`border ${cat.border} overflow-hidden`}>
                <div className={`flex items-center gap-2 px-4 py-2.5 ${cat.bg} border-b`}>
                  <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  <span className={`text-sm font-bold ${cat.color}`}>{category}</span>
                  <span className="text-xs text-muted-foreground ml-1">({(catFeatures as any[]).length})</span>
                </div>

                {/* Header row */}
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-0 px-4 py-2 border-b bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature</span>
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wider text-center">Granted</span>
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wider text-center">Revoked</span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider text-center">Grant All</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Revoke All / Clear</span>
                </div>

                {(catFeatures as any[]).map((f: any) => {
                  const stats = overrideStats?.[f.key ?? f.featureKey] ?? { granted: 0, revoked: 0 };
                  const isApplyingGrant = allApplying === `${f.key}-granted`;
                  const isApplyingRevoke = allApplying === `${f.key}-revoked`;
                  const isApplyingClear = allApplying === `${f.key}-clear`;
                  const anyApplying = isApplyingGrant || isApplyingRevoke || isApplyingClear;
                  return (
                    <div key={f.id ?? f.key} className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-0 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{f.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.description}</p>
                      </div>
                      {/* Granted count */}
                      <div className="flex justify-center">
                        {stats.granted > 0
                          ? <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{stats.granted}</span>
                          : <span className="text-xs text-muted-foreground/60">—</span>}
                      </div>
                      {/* Revoked count */}
                      <div className="flex justify-center">
                        {stats.revoked > 0
                          ? <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{stats.revoked}</span>
                          : <span className="text-xs text-muted-foreground/60">—</span>}
                      </div>
                      {/* Grant All */}
                      <div className="flex justify-center">
                        {anyApplying && isApplyingGrant
                          ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
                          : <button
                            disabled={!!allApplying}
                            onClick={() => overrideAllUsers(f.key, "granted")}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-card border border-green-300 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <UserCheck className="w-3 h-3" />All
                          </button>}
                      </div>
                      {/* Revoke All + Clear */}
                      <div className="flex justify-center gap-1">
                        {anyApplying && (isApplyingRevoke || isApplyingClear)
                          ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
                          : <>
                            <button
                              disabled={!!allApplying}
                              onClick={() => overrideAllUsers(f.key, "revoked")}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-card border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Revoke from all users">
                              <UserX className="w-3 h-3" />All
                            </button>
                            <button
                              disabled={!!allApplying || (stats.granted === 0 && stats.revoked === 0)}
                              onClick={() => clearAllUsersOverride(f.key)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-card border border text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Clear all overrides — revert to plan default">
                              <Trash2 className="w-3 h-3" />Clear
                            </button>
                          </>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-muted" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Per-User Access</span>
        <div className="flex-1 h-px bg-muted" />
      </div>

      {/* ── SECTION B: PER-USER ───────────────────────────────────────────── */}
      <div className="grid grid-cols-[280px_1fr] gap-6 min-h-[500px]">

        {/* Left: user selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">Select User(s)</p>
            {selectedUserIds.size > 0 && (
              <button className="text-xs text-primary hover:underline" onClick={() => setSelectedUserIds(new Set())}>
                Clear ({selectedUserIds.size})
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by email or name..."
              className="w-full pl-9 pr-4 h-9 border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="border rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
              ) : filteredUsers.map((u: any) => {
                const isSelected = selectedUserIds.has(u.id);
                const isFocused = focusedUserId === u.id;
                return (
                  <div key={u.id}
                    className={`flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors ${isFocused ? "bg-primary/5 border-l-2 border-l-purple-400" : isSelected ? "bg-blue-50" : "hover:bg-muted/30"}`}
                    onClick={() => { setFocusedUserId(u.id); if (!selectedUserIds.has(u.id)) setSelectedUserIds(new Set()); }}>
                    <button className="shrink-0 text-muted-foreground hover:text-primary" onClick={e => { e.stopPropagation(); toggleUserSelect(u.id); }}>
                      {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{u.username ?? u.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${TIER_BADGE[u.role === "admin" ? "admin" : (u.subscriptionTier ?? "free")]}`}>
                      {u.role === "admin" ? "admin" : (u.subscriptionTier ?? "free")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {selectedUserIds.size > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              <p className="font-semibold">{selectedUserIds.size} users selected</p>
              <p className="text-xs text-blue-600 mt-0.5">Overrides will apply to all selected users at once.</p>
            </div>
          )}
        </div>

        {/* Right: feature access panel */}
        <div className="space-y-4">
          {!focusedUserId && selectedUserIds.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold">Select a user to manage their features</p>
              <p className="text-sm mt-1">Click a user on the left, or select multiple for bulk overrides.</p>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedUserIds.size > 1 ? (
                  <div>
                    <p className="font-bold text-foreground">{selectedUserIds.size} users selected</p>
                    <p className="text-xs text-muted-foreground">Overrides will apply to all selected users</p>
                  </div>
                ) : userAccess ? (
                  <div>
                    <p className="font-bold text-foreground">{userAccess.username ?? userAccess.email}</p>
                    <p className="text-xs text-muted-foreground">{userAccess.email} — <span className={`font-semibold`}>{userAccess.tier} plan</span></p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading…</span></div>
                )}
                <div className="ml-auto flex gap-2 flex-wrap">
                  {focusedUserId && selectedUserIds.size <= 1 && (
                    <Button variant="outline" size="sm" onClick={() => clearAllUserOverrides(focusedUserId!)} disabled={!!applying}>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-500" />Clear All Overrides
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => refetchAccess()}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
                  </Button>
                </div>
              </div>

              {/* Feature search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={featureSearch} onChange={e => setFeatureSearch(e.target.value)} placeholder="Search features…"
                  className="w-full pl-9 pr-4 h-9 border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Access granted</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300 inline-block" />Access revoked</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Manual override active</span>
              </div>

              {accessLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedAccess).map(([category, items]) => {
                    const cat = getCat(category);
                    const Icon = cat.icon;
                    return (
                      <Card key={category} className={`border ${cat.border} overflow-hidden`}>
                        <div className={`flex items-center gap-2 px-4 py-2.5 ${cat.bg} border-b`}>
                          <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                          <span className={`font-bold text-sm ${cat.color}`}>{category}</span>
                          <span className="text-xs text-muted-foreground ml-1">({(items as any[]).length})</span>
                        </div>

                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_80px_110px_auto] gap-0 border-b bg-card px-4 py-1.5">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature</span>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Plan Access</span>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Override</span>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center pr-1">Actions</span>
                        </div>

                        {(items as any[]).map((f: any) => {
                          const isApplying = applying?.startsWith(f.featureKey);
                          return (
                            <div key={f.featureKey}
                              className={`grid grid-cols-[1fr_80px_110px_auto] gap-0 px-4 py-3 border-b last:border-b-0 items-center transition-colors hover:bg-muted/30 ${!f.effective ? "opacity-70" : ""}`}>
                              <div className="pr-3">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${f.effective ? "bg-green-400" : "bg-red-300"}`} />
                                  <span className="font-semibold text-foreground text-sm">{f.label}</span>
                                  {f.override && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Override active" />}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 ml-4 leading-relaxed line-clamp-1">{f.description}</p>
                              </div>

                              <div className="flex justify-center">
                                {f.tierAllowed
                                  ? <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" />Yes</span>
                                  : <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><X className="w-3 h-3" />No</span>}
                              </div>

                              <div className="flex justify-center">
                                {f.override
                                  ? f.override.access === "granted"
                                    ? <span className="flex items-center gap-1 text-xs text-primary bg-primary/5 border border-primary/30 px-2 py-0.5 rounded-full font-semibold"><UserCheck className="w-3 h-3" />Granted</span>
                                    : <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold"><UserX className="w-3 h-3" />Revoked</span>
                                  : <span className="text-xs text-muted-foreground/60">none</span>}
                              </div>

                              <div className="flex items-center gap-1 justify-end">
                                {isApplying ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setOverride(f.featureKey, "granted")}
                                      disabled={f.override?.access === "granted"}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${f.override?.access === "granted" ? "bg-primary/10 text-primary/80 cursor-not-allowed" : "bg-card border border-green-300 text-green-700 hover:bg-green-50"}`}>
                                      <UserCheck className="w-3 h-3" />Grant
                                    </button>
                                    <button
                                      onClick={() => setOverride(f.featureKey, "revoked")}
                                      disabled={f.override?.access === "revoked"}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${f.override?.access === "revoked" ? "bg-red-100 text-red-300 cursor-not-allowed" : "bg-card border border-red-300 text-red-700 hover:bg-red-50"}`}>
                                      <UserX className="w-3 h-3" />Revoke
                                    </button>
                                    {f.override && (
                                      <button
                                        onClick={() => clearOverride(f.featureKey)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-card border border text-muted-foreground hover:bg-muted/30 transition-colors">
                                        <Trash2 className="w-3 h-3" />Clear
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </Card>
                    );
                  })}

                  {Object.keys(groupedAccess).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No features match your search</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminFeatures() {
  const [tab, setTab] = useState<"site" | "plans" | "users">("site");

  const tabs = [
    { key: "site",  label: "Site Control",  icon: LayoutGrid,  desc: "Enable / disable features globally" },
    { key: "plans", label: "Plan Access",   icon: Settings2,   desc: "Control which plans get what" },
    { key: "users", label: "User Access",   icon: UserCog,     desc: "Per-user & all-users overrides" },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feature Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full control over every feature on the platform — toggle site-wide, manage by plan, or override for individual users.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all border ${tab === t.key
              ? "bg-primary text-white border-purple-600 shadow-lg shadow-purple-200"
              : "bg-card text-muted-foreground border hover:border hover:bg-muted/30"}`}>
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab description banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 border border">
        {tab === "site" && <><LayoutGrid className="w-4 h-4 text-primary" /><p className="text-sm text-muted-foreground">Toggle any feature <strong>on or off for everyone</strong> on the platform instantly — organized by category.</p></>}
        {tab === "plans" && <><Settings2 className="w-4 h-4 text-primary" /><p className="text-sm text-muted-foreground">Control which <strong>subscription plans</strong> (Free, Pro, Enterprise) can access each feature.</p></>}
        {tab === "users" && <><UserCog className="w-4 h-4 text-primary" /><p className="text-sm text-muted-foreground"><strong>Apply to all users</strong> or grant/revoke access for specific users — overrides their plan tier.</p></>}
      </div>

      {tab === "site"  && <SiteControlTab />}
      {tab === "plans" && <PlanAccessTab />}
      {tab === "users" && <UserAccessTab />}
    </div>
  );
}
