import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export type FeatureAccess = {
  allowed: boolean;
  tier: string;
  limit: { count: number; unit: string } | null;
  isActive: boolean;
  label: string;
  category: string;
};

export type MyFeatureAccess = {
  tier: string;
  isAdmin: boolean;
  features: Record<string, FeatureAccess>;
};

export function useFeatureAccess() {
  return useQuery<MyFeatureAccess>({
    queryKey: ["my-feature-access"],
    queryFn: () => apiClient.get("/features/my-access").then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanUse(featureKey: string): { allowed: boolean; upgradeRequired: boolean; requiredTier: string; limit: any } {
  const { data } = useFeatureAccess();
  if (!data) return { allowed: true, upgradeRequired: false, requiredTier: "pro", limit: null };
  const f = data.features[featureKey];
  if (!f) return { allowed: true, upgradeRequired: false, requiredTier: "pro", limit: null };
  const tiersOrder = ["free", "pro", "enterprise"];
  const requiredTier = tiersOrder.find(t => {
    return true;
  }) ?? "pro";
  return {
    allowed: f.allowed,
    upgradeRequired: !f.allowed,
    requiredTier: data.tier === "free" ? "pro" : "enterprise",
    limit: f.limit,
  };
}
