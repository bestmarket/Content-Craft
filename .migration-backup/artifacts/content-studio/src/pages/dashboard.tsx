import { useGetDashboardStats, useGetRecentContent, useGetMe, useListSettings } from "@workspace/api-client-react";
import { getGetDashboardStatsQueryKey, getGetRecentContentQueryKey, getGetMeQueryKey, getListSettingsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, FileText, Image, Clock, PenTool, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  tiktok: "#010101",
  instagram: "#E1306C",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter",
};

export default function Dashboard() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useGetRecentContent(undefined, { query: { queryKey: getGetRecentContentQueryKey() } });
  const { data: settings } = useListSettings({ query: { queryKey: getListSettingsQueryKey() } });

  const affiliateLink = settings?.find((s: any) => s.key === "affiliate_link")?.value ?? "#";
  const adText = settings?.find((s: any) => s.key === "ad_text")?.value ?? "Click Here To Create your Digital Product in Minutes with ai";

  const chartData = stats?.byPlatform?.map((p: any) => ({
    name: PLATFORM_LABELS[p.platform] ?? p.platform,
    count: p.count,
    platform: p.platform,
  })) ?? [];

  const statCards = [
    { label: "Total Content", value: stats?.totalContent ?? 0, icon: FileText, color: "text-purple-600" },
    { label: "This Week", value: stats?.thisWeek ?? 0, icon: TrendingUp, color: "text-green-600" },
    { label: "PDFs Created", value: stats?.recentPdfs ?? 0, icon: FileText, color: "text-blue-600" },
    { label: "Thumbnails", value: stats?.totalThumbnails ?? 0, icon: Image, color: "text-orange-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Ad Banner */}
      <a
        href={affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="banner-affiliate"
        className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 rounded-xl shadow hover:opacity-90 transition-opacity"
      >
        <span className="font-semibold text-sm">{adText}</span>
        <ExternalLink className="w-4 h-4 flex-shrink-0 ml-3" />
      </a>

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4 border" data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform chart */}
        <Card className="p-5 border">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Content by Platform</h2>
          {statsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No content yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={index} fill={PLATFORM_COLORS[entry.platform] ?? "#8b5cf6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-5 border">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Quick Create</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "YouTube Script", href: "/create?platform=youtube", color: "bg-red-50 text-red-700 border-red-200" },
              { label: "TikTok Script", href: "/create?platform=tiktok", color: "bg-slate-900 text-white border-slate-800" },
              { label: "Instagram Post", href: "/create?platform=instagram", color: "bg-pink-50 text-pink-700 border-pink-200" },
              { label: "Facebook Post", href: "/create?platform=facebook", color: "bg-blue-50 text-blue-700 border-blue-200" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  data-testid={`quick-create-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-medium text-left transition hover:opacity-80 ${item.color}`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
          <Link href="/create" className="block mt-3">
            <Button className="w-full" size="sm">
              <PenTool className="w-4 h-4 mr-2" />
              Open Content Creator
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Content */}
      <Card className="p-5 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Content</h2>
          <Link href="/history" className="text-xs text-purple-600 hover:underline">View all</Link>
        </div>
        {recentLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !recent || recent.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No content yet. Create your first piece!
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((item: any) => (
              <div key={item.id} data-testid={`content-item-${item.id}`} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant="secondary"
                    className="flex-shrink-0 text-xs capitalize"
                    style={{ backgroundColor: PLATFORM_COLORS[item.platform] + "20", color: PLATFORM_COLORS[item.platform] }}
                  >
                    {item.platform}
                  </Badge>
                  <span className="text-sm text-slate-700 truncate">{item.topic}</span>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
