import { useState } from "react";
import { useListContentHistory, useDeleteContentHistory } from "@workspace/api-client-react";
import { getListContentHistoryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000", tiktok: "#010101", instagram: "#E1306C", facebook: "#1877F2", twitter: "#1DA1F2",
};

export default function History() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const params = platform !== "all" ? { platform } : {};
  const { data, isLoading } = useListContentHistory(params, {
    query: { queryKey: getListContentHistoryQueryKey(params) },
  });
  const deleteItem = useDeleteContentHistory();

  const handleDelete = (id: number) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContentHistoryQueryKey() });
        toast({ title: "Deleted" });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content History</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? 0} pieces generated</p>
        </div>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !data?.items?.length ? (
        <Card className="p-10 text-center text-slate-400">No content found</Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((item: any) => (
            <Card key={item.id} data-testid={`history-item-${item.id}`} className="border overflow-hidden">
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <Badge
                  className="flex-shrink-0 text-xs capitalize font-medium"
                  style={{ backgroundColor: PLATFORM_COLORS[item.platform] + "18", color: PLATFORM_COLORS[item.platform] }}
                >
                  {item.platform}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.topic}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                    {item.wordCount && <span className="ml-2">{item.wordCount} words</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              {expandedId === item.id && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3">
                  {item.titles?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Viral Titles</p>
                      {item.titles.slice(0, 2).map((t: any, i: number) => (
                        <p key={i} className="text-sm text-slate-700">{t.title} <span className="text-slate-400">({t.viralityScore}/100)</span></p>
                      ))}
                    </div>
                  )}
                  {item.script && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Script Preview</p>
                      <p className="text-sm text-slate-600 line-clamp-4">{item.script}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {item.hashtags?.slice(0, 5).map((h: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs text-purple-600">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
