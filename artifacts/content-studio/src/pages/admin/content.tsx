import { useState } from "react";
import { useListContentHistory } from "@workspace/api-client-react";
import { getListContentHistoryQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText } from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000", tiktok: "#010101", instagram: "#E1306C", facebook: "#1877F2", twitter: "#1DA1F2",
};

export default function AdminContent() {
  const { data, isLoading } = useListContentHistory({}, { query: { queryKey: getListContentHistoryQueryKey({}) } });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Content</h1>
        <p className="text-muted-foreground text-sm">{data?.total ?? 0} pieces generated across all users</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !data?.items?.length ? (
        <Card className="p-8 text-center text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No content generated yet
        </Card>
      ) : (
        <Card className="border divide-y">
          {data.items.map((item: any) => (
            <div key={item.id} className="p-4 flex items-center gap-3">
              <Badge
                className="flex-shrink-0 text-xs capitalize"
                style={{ backgroundColor: PLATFORM_COLORS[item.platform] + "18", color: PLATFORM_COLORS[item.platform] }}
              >
                {item.platform}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.topic}</p>
                <p className="text-xs text-muted-foreground">{item.wordCount} words</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
