import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export interface UsageData {
  isPro: boolean;
  limits: { content: number; pdf: number; thumbnail: number; landingPage: number; script: number } | null;
  usage: { content: number; pdf: number; thumbnail: number };
}

export function useUsage() {
  return useQuery<UsageData>({
    queryKey: ["usage-today"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const res = await fetch(`${API_BASE}/usage/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function isLimitReached(usage: UsageData | undefined, type: keyof UsageData["usage"]) {
  if (!usage) return false;
  if (usage.isPro || !usage.limits) return false;
  return (usage.usage[type] ?? 0) >= (usage.limits[type] ?? 999);
}
