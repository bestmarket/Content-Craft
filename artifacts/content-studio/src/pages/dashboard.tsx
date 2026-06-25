import { useGetDashboardStats, useGetRecentContent, useGetMe, useListSettings } from "@workspace/api-client-react";
import { getGetDashboardStatsQueryKey, getGetRecentContentQueryKey, getGetMeQueryKey, getListSettingsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  TrendingUp, FileText, Image, Clock, PenTool, ExternalLink,
  Sparkles, ShoppingBag, DollarSign, Globe, Zap, ArrowRight, Star, Flame, Trophy,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UsageBanner from "@/components/UsageBanner";
import { useToolFlags } from "@/hooks/use-tool-flags";

const PLATFORM_COLORS: Record<string, string> = {
  youtube:   "#FF0000",
  tiktok:    "#010101",
  instagram: "#E1306C",
  facebook:  "#1877F2",
  twitter:   "#1DA1F2",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube:   "YouTube",
  tiktok:    "TikTok",
  instagram: "Instagram",
  facebook:  "Facebook",
  twitter:   "Twitter",
};

const MONETIZE_CARDS = [
  {
    href: "/create-product",
    icon: Sparkles,
    color: "from-primary to-blue-700",
    bg: "bg-primary/10",
    iconColor: "text-primary",
    label: "Create Digital Product",
    desc: "Enter a topic → AI writes a complete sellable PDF guide with table of contents, chapters, checklists, and a sellability score",
    tag: "New",
    tagColor: "bg-primary/10 text-primary",
    tool: "product_generator",
  },
  {
    href: "/my-store",
    icon: ShoppingBag,
    color: "from-blue-600 to-blue-700",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "My Store",
    desc: "Set your @username, manage published products, and get your shareable store link at /store/yourusername",
    tag: null,
    tagColor: "",
    tool: "store",
  },
  {
    href: "/earnings",
    icon: DollarSign,
    color: "from-emerald-600 to-emerald-700",
    bg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    label: "Earnings & Wallet",
    desc: "Real-time wallet balance, transaction history, top products by revenue, and withdrawal requests",
    tag: null,
    tagColor: "",
    tool: "affiliate",
  },
  {
    href: "/trending",
    icon: TrendingUp,
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
    label: "Trending Ideas",
    desc: "AI-analyzed market trends showing what's selling right now — with difficulty score, price range, and one-click product creation",
    tag: "Hot",
    tagColor: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
    tool: "trending",
  },
  {
    href: "/edit-landing",
    icon: Globe,
    color: "from-muted-foreground to-foreground",
    bg: "bg-muted",
    iconColor: "text-muted-foreground",
    label: "Edit Landing Pages",
    desc: "Customize your product landing pages — headlines, pricing, CTA buttons, and guarantee text — all editable after AI generates them",
    tag: null,
    tagColor: "",
    tool: "landing_page",
  },
];

export default function Dashboard() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useGetRecentContent(undefined, { query: { queryKey: getGetRecentContentQueryKey() } });
  const { data: settings } = useListSettings({ query: { queryKey: getListSettingsQueryKey() } });
  const { flags } = useToolFlags();

  const affiliateLink = settings?.find((s: any) => s.key === "affiliate_link")?.value ?? "#";
  const adText = settings?.find((s: any) => s.key === "ad_text")?.value ?? "🚀 Create your first digital product and start earning — it takes under 3 minutes";

  const isEnabled = (tool: string) => flags[tool] !== false;
  const visibleMonetizeCards = MONETIZE_CARDS.filter(card => isEnabled(card.tool));
  const showContentTools = isEnabled("content_generator");
  const showThumbnails = isEnabled("thumbnails");

  const chartData = stats?.byPlatform?.map((p: any) => ({
    name: PLATFORM_LABELS[p.platform] ?? p.platform,
    count: p.count,
    platform: p.platform,
  })) ?? [];

  const statCards = [
    { label: "Total Content", value: stats?.totalContent ?? 0,    icon: FileText,   color: "text-primary"  },
    { label: "This Week",     value: stats?.thisWeek ?? 0,         icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "PDFs Created",  value: stats?.recentPdfs ?? 0,       icon: FileText,   color: "text-blue-600 dark:text-blue-400"  },
    { label: "Thumbnails",    value: stats?.totalThumbnails ?? 0,  icon: Image,      color: "text-orange-600 dark:text-orange-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <UsageBanner />

      {/* Ad Banner */}
      <a
        href={affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="banner-affiliate"
        className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-primary to-blue-700 text-white px-5 py-3 rounded-xl shadow hover:opacity-90 transition-opacity"
      >
        <span className="font-semibold text-sm">{adText}</span>
        <ExternalLink className="w-4 h-4 flex-shrink-0" />
      </a>

      {/* Marketplace Banner */}
      <Link href="/marketplace">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-indigo-700 text-white px-5 py-4 rounded-xl shadow-lg hover:opacity-95 transition-opacity cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <p className="font-bold text-sm">🌟 Global Marketplace is live!</p>
              <p className="text-violet-200 text-xs">Browse &amp; buy ebooks, courses, prompt packs, templates &amp; AI tools</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-lg px-3 py-1.5 flex-shrink-0 ml-3">
            <span className="text-xs font-semibold text-white">Explore</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </Link>

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You have access to <strong className="text-foreground">6 AI tools</strong> — create content, build products, and earn from your store.
          </p>
        </div>
        <Link href="/create-product">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow hidden md:flex">
            <Sparkles className="w-4 h-4 mr-2" /> Create Product
          </Button>
        </Link>
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
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Streak widget */}
      {((user as any)?.currentStreak ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{(user as any).currentStreak}</span>
              <span className="text-orange-700 dark:text-orange-300 font-semibold text-sm">
                day streak{(user as any).currentStreak === 1 ? "" : "s"}
              </span>
              {(user as any).currentStreak >= 7 && (
                <span className="text-xs bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full">🔥 On Fire</span>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">
              Keep coming back daily to maintain your streak.
              {(user as any).longestStreak > (user as any).currentStreak && (
                <> Best: <strong className="text-foreground">{(user as any).longestStreak} days</strong></>
              )}
            </p>
          </div>
          {(user as any).longestStreak > 0 && (
            <div className="hidden sm:flex flex-col items-center text-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">{(user as any).longestStreak}</span>
              <span className="text-muted-foreground text-[10px]">best</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {Array.from({ length: 7 }).map((_, i) => {
              const dayOffset = 6 - i;
              const active = dayOffset < (user as any).currentStreak;
              const isToday = dayOffset === 0;
              return (
                <div
                  key={i}
                  title={isToday ? "Today" : `${dayOffset} day${dayOffset === 1 ? "" : "s"} ago`}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                    active ? "bg-orange-400 text-white shadow-sm" : "bg-muted text-muted-foreground"
                  } ${isToday ? "ring-2 ring-orange-500 ring-offset-1" : ""}`}
                >
                  {active ? "🔥" : "·"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monetize Section */}
      {visibleMonetizeCards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Monetize Your Knowledge</h2>
            <span className="text-xs text-muted-foreground">— turn what you know into income</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleMonetizeCards.map(({ href, icon: Icon, bg, iconColor, label, desc, tag, tagColor }) => (
              <Link key={href} href={href}>
                <div className="group bg-card border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    {tag && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${tagColor}`}>
                        {tag}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Platform chart — always visible */}
        <Card className="p-5 border">
          <h2 className="text-sm font-semibold text-foreground mb-4">Content by Platform</h2>
          {statsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm">
              <PenTool className="w-6 h-6 mb-2 opacity-30" />
              No content yet — create your first piece below
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={index} fill={PLATFORM_COLORS[entry.platform] ?? "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quick Create — only shown when content_generator is enabled */}
        {showContentTools && (
          <Card className="p-5 border">
            <h2 className="text-sm font-semibold text-foreground mb-1">Quick Create Content</h2>
            <p className="text-xs text-muted-foreground mb-4">AI-written scripts, hooks, and copy — platform-optimized</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "🎬 YouTube Script",    href: "/create?platform=youtube", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50" },
                { label: "🎵 TikTok Script",     href: "/create?platform=tiktok",  color: "bg-foreground text-background border-foreground/20" },
                { label: "👥 Facebook Post",     href: "/create?platform=facebook",color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50" },
                { label: "🐦 Twitter/X Thread",  href: "/create?platform=twitter", color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/50" },
                ...(isEnabled("landing_page") ? [{ label: "🌐 Sales Landing Page", href: "/landing-page", color: "bg-primary/10 text-primary border-primary/20" }] : []),
                ...(isEnabled("scripts") ? [{ label: "🎬 Movie Script", href: "/scripts", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50" }] : []),
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    data-testid={`quick-create-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-medium text-left transition hover:opacity-80 ${item.color}`}
                  >
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>
            <Link href="/create" className="block mt-3">
              <Button className="w-full" size="sm" variant="outline">
                <PenTool className="w-4 h-4 mr-2" /> Open Full Content Creator
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* What's Inside — filtered by enabled tools */}
      {(() => {
        const insideItems = [
          { label: "AI PDF Product Builder", desc: "Enter any topic → get a complete, sellable PDF guide with chapters, checklists, and a 0–100 sellability score", icon: "📄", tool: "product_generator" },
          { label: "Viral Content Creator",  desc: "YouTube scripts, TikTok hooks, Facebook posts, Twitter threads — all platform-optimized", icon: "✍️", tool: "content_generator" },
          { label: "Landing Page Generator", desc: "AI writes your full sales page — hero, benefits, testimonials, pricing section — ready to publish", icon: "🌐", tool: "landing_page" },
          { label: "Thumbnail Creator",      desc: "Generate viral thumbnails for YouTube, TikTok, and your product covers", icon: "🖼️", tool: "thumbnails" },
          { label: "Personal Online Store",  desc: "Your own store at /store/yourusername. Publish products. Share the link. Platform handles checkout.", icon: "🏪", tool: "store" },
          { label: "Earnings & Payout",      desc: "Track every sale in real time. Platform takes 10% — you keep 90%. Withdraw when you hit $50.", icon: "💰", tool: "affiliate" },
          { label: "Prompt Studio",          desc: "Build and sell AI prompt packages — structured prompt collections your audience pays for", icon: "💡", tool: "prompt_generator" },
          { label: "Global Marketplace",     desc: "Browse and buy ebooks, courses, prompt packs, and templates from other creators", icon: "🌍", tool: "marketplace" },
        ].filter(item => isEnabled(item.tool));

        if (insideItems.length === 0) return null;
        return (
          <Card className="p-5 border bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">What's inside your account</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insideItems.map(({ label, desc, icon }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Recent Content */}
      <Card className="p-5 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Content</h2>
          <Link href="/history" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recentLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !recent || recent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <PenTool className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No content yet.</p>
            <Link href="/create" className="mt-2 inline-block">
              <Button size="sm" variant="outline" className="mt-2">Create your first piece <ArrowRight className="w-3 h-3 ml-1" /></Button>
            </Link>
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
                  <span className="text-sm text-foreground truncate">{item.topic}</span>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
