import { Link } from "wouter";
import { Zap, Crown } from "lucide-react";
import { useUsage } from "@/hooks/use-usage";

export default function UsageBanner() {
  const { data: usage } = useUsage();
  if (!usage || usage.isPro || !usage.limits) return null;

  const contentUsed = usage.usage.content ?? 0;
  const contentLimit = usage.limits.content ?? 5;
  const pct = Math.min(100, Math.round((contentUsed / contentLimit) * 100));
  const nearLimit = contentUsed >= contentLimit - 1;
  const atLimit = contentUsed >= contentLimit;

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 text-sm mb-6 ${
      atLimit
        ? "bg-red-50 border-red-200"
        : nearLimit
        ? "bg-amber-50 border-amber-200"
        : "bg-muted/30 border"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <Zap className={`w-4 h-4 flex-shrink-0 ${atLimit ? "text-red-500" : nearLimit ? "text-amber-500" : "text-muted-foreground"}`} />
        <div className="min-w-0">
          <span className={`font-medium ${atLimit ? "text-red-700" : nearLimit ? "text-amber-700" : "text-foreground"}`}>
            {atLimit
              ? "Daily limit reached — upgrade to keep creating"
              : `${contentUsed} / ${contentLimit} free generations used today`}
          </span>
          {!atLimit && (
            <div className="mt-1.5 h-1.5 w-48 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <Link href="/pricing">
        <button className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition flex-shrink-0">
          <Crown className="w-3.5 h-3.5" />
          Upgrade to Pro
        </button>
      </Link>
    </div>
  );
}
