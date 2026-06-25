import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Crown, Lock, Zap, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const TIER_CONFIG = {
  free: { icon: Zap, label: "Free", color: "text-muted-foreground", gradient: "from-slate-500 to-slate-600" },
  pro: { icon: Crown, label: "Pro", color: "text-primary", gradient: "from-primary to-indigo-600" },
  enterprise: { icon: ShieldCheck, label: "Enterprise", color: "text-amber-700", gradient: "from-amber-500 to-orange-500" },
};

type Props = {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: "blur" | "hide" | "badge";
};

export function UpgradeGate({ featureKey, children, fallback, mode = "blur" }: Props) {
  const { data, isLoading } = useFeatureAccess();

  if (isLoading) return <>{children}</>;

  const f = data?.features?.[featureKey];
  const allowed = !f || f.allowed;

  if (allowed) return <>{children}</>;

  const requiredTier = f ? (data?.tier === "free" ? "pro" : "enterprise") : "pro";
  const tierCfg = TIER_CONFIG[requiredTier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.pro;

  if (mode === "hide") return fallback ? <>{fallback}</> : null;

  if (mode === "badge") {
    return (
      <div className="relative inline-flex">
        <div className="opacity-50 pointer-events-none">{children}</div>
        <Link href="/pricing">
          <span className={`absolute -top-1 -right-1 flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${tierCfg.gradient ?? "from-primary to-indigo-600"} text-white shadow-sm cursor-pointer`}>
            <tierCfg.icon className="w-2.5 h-2.5" />
            {tierCfg.label}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link href="/pricing">
          <div className={`bg-gradient-to-r ${tierCfg.gradient ?? "from-primary to-indigo-600"} text-white rounded-xl px-5 py-3 shadow-xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform`}>
            <Lock className="w-4 h-4" />
            <div>
              <p className="font-bold text-sm">Requires {tierCfg.label} Plan</p>
              <p className="text-xs opacity-80">{f?.label} · Upgrade to unlock</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function UpgradeBanner({ featureKey, label }: { featureKey: string; label?: string }) {
  const { data } = useFeatureAccess();
  const f = data?.features?.[featureKey];
  if (!f || f.allowed) return null;
  const requiredTier = data?.tier === "free" ? "pro" : "enterprise";
  const tierCfg = TIER_CONFIG[requiredTier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.pro;

  return (
    <div className={`bg-gradient-to-r ${tierCfg.gradient ?? "from-primary to-indigo-600"} rounded-xl p-4 flex items-center gap-3 text-white`}>
      <tierCfg.icon className="w-5 h-5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm">{label ?? f.label} requires {tierCfg.label}</p>
        <p className="text-xs opacity-80">Upgrade your plan to unlock this feature</p>
      </div>
      <Link href="/pricing">
        <span className="bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">
          Upgrade →
        </span>
      </Link>
    </div>
  );
}

export function TierLimitBadge({ featureKey }: { featureKey: string }) {
  const { data } = useFeatureAccess();
  const f = data?.features?.[featureKey];
  if (!f?.limit) return null;
  const { count, unit } = f.limit;
  if (count === -1) return null;

  return (
    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
      {count === 0 ? "Not available" : `${count} ${unit}`}
    </span>
  );
}
