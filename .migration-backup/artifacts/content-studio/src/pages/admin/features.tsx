import { useListFeatures, useToggleFeature } from "@workspace/api-client-react";
import { getListFeaturesQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminFeatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: features, isLoading } = useListFeatures({ query: { queryKey: getListFeaturesQueryKey() } });
  const toggleFeature = useToggleFeature();

  const handleToggle = (id: number, isActive: boolean) => {
    toggleFeature.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeaturesQueryKey() });
        toast({ title: isActive ? "Feature disabled" : "Feature enabled" });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Feature Flags</h1>
        <p className="text-slate-500 text-sm">Enable or disable platform features globally</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !features?.length ? (
        <Card className="p-8 text-center text-slate-400">No features configured</Card>
      ) : (
        <div className="space-y-3">
          {features.map((feature: any) => (
            <Card key={feature.id} data-testid={`feature-${feature.key}`} className="p-4 border flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800 text-sm">{feature.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{feature.description ?? feature.key}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`text-xs ${feature.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {feature.isActive ? "Enabled" : "Disabled"}
                </Badge>
                <button
                  data-testid={`toggle-${feature.key}`}
                  onClick={() => handleToggle(feature.id, feature.isActive)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {feature.isActive
                    ? <ToggleRight className="w-9 h-9 text-green-500" />
                    : <ToggleLeft className="w-9 h-9 text-slate-300" />}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
