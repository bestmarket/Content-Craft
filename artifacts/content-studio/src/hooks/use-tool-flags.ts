import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ToolDef {
  key: string;
  label: string;
  description: string;
  category: string;
}

export interface ToolFlagsData {
  flags: Record<string, boolean>;
  tools: ToolDef[];
}

export function useToolFlags() {
  const { data, isLoading } = useQuery<ToolFlagsData>({
    queryKey: ["tool-flags"],
    queryFn: () => api.get("/tool-flags").then(r => r.data),
    staleTime: 60000,
    refetchInterval: 120000,
  });

  return {
    flags: data?.flags ?? {},
    tools: data?.tools ?? [],
    isLoading,
    isEnabled: (key: string) => data?.flags?.[key] !== false,
  };
}
