import { useState, useEffect } from "react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, TrendingUp, Star, ShoppingBag, Zap, Users, DollarSign,
  Filter, Globe, Package, Sparkles, Crown, ArrowRight,
  BookOpen, Layers, FileText, Bot, Wand2, MessageSquare,
} from "lucide-react";

const CATEGORIES = [
  { key: "all",             label: "All Products",    emoji: "🌟" },
  { key: "digital_product", label: "Ebooks & Guides", emoji: "📖" },
  { key: "prompt_package",  label: "Prompt Packs",    emoji: "✨" },
  { key: "ai_agent",        label: "AI Tools",        emoji: "🤖" },
  { key: "course",          label: "Courses",         emoji: "🎓" },
  { key: "template",        label: "Templates",       emoji: "📋" },
  { key: "n8n_workflow",    label: "Automations",     emoji: "⚡" },
  { key: "web_app",         label: "Web Apps",        emoji: "🌐" },
];

const SORT_OPTIONS = [
  { key: "trending", label: "Trending" },
  { key: "newest",   label: "Newest" },
  { key: "top_rated", label: "Top Rated" },
  { key: "price_low",  label: "Price: Low → High" },
  { key: "price_high", label: "Price: High → Low" },
];

const TYPE_COLORS: Record<string, string> = {
  digital_product: "bg-blue-100 text-blue-700 border-blue-200",
  prompt_package:  "bg-violet-100 text-violet-700 border-violet-200",
  ai_agent:        "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  course:          "bg-emerald-100 text-emerald-700 border-emerald-200",
  template:        "bg-cyan-100 text-cyan-700 border-cyan-200",
  n8n_workflow:    "bg-orange-100 text-orange-700 border-orange-200",
  web_app:         "bg-teal-100 text-teal-700 border-teal-200",
  mobile_app:      "bg-rose-100 text-rose-700 border-rose-200",
  chrome_extension:"bg-green-100 text-green-700 border-green-200",
  automation_tool: "bg-pink-100 text-pink-700 border-pink-200",
};

const TYPE_LABELS: Record<string, string> = {
  digital_product: "Ebook / Guide",
  prompt_package:  "Prompt Pack",
  ai_agent:        "AI Tool",
  course:          "Course",
  template:        "Template",
  n8n_workflow:    "Automation",
  web_app:         "Web App",
  mobile_app:      "Mobile App",
  chrome_extension:"Chrome Extension",
  automation_tool: "Automation Tool",
};

const TYPE_EMOJIS: Record<string, string> = {
  digital_product: "📖",
  prompt_package:  "✨",
  ai_agent:        "🤖",
  course:          "🎓",
  template:        "📋",
  n8n_workflow:    "⚡",
  web_app:         "🌐",
  mobile_app:      "📱",
  chrome_extension:"🧩",
  automation_tool: "🔧",
};

const COVER_GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-700",
  "from-fuchsia-500 to-purple-700",
];

function CoverPlaceholder({ item, typeEmoji }: { item: any; typeEmoji: string }) {
  const gradIdx = ((item.id ?? 0) + (item.title?.charCodeAt(0) ?? 0)) % COVER_GRADIENTS.length;
  const grad = COVER_GRADIENTS[gradIdx];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${grad} relative overflow-hidden flex items-center justify-center`}>
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 300 168" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <circle cx="250" cy="-20" r="120" fill="white"/>
          <circle cx="30" cy="180" r="100" fill="white"/>
          <circle cx="150" cy="84" r="180" fill="white" opacity="0.3"/>
        </svg>
      </div>
      <div className="relative z-10 text-center px-4">
        <div className="text-4xl mb-2 drop-shadow-lg">{typeEmoji}</div>
        <p className="text-white font-bold text-xs leading-tight line-clamp-2 drop-shadow">{item.title}</p>
      </div>
    </div>
  );
}

function MarketplaceCard({ item }: { item: any }) {
  const typeColor = TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const typeLabel = TYPE_LABELS[item.type] ?? item.type ?? "Digital Product";
  const typeEmoji = TYPE_EMOJIS[item.type] ?? "📦";
  const rating = parseFloat(item.rating ?? "0");
  const price = parseFloat(item.price ?? "0");
  const originalPrice = parseFloat(item.originalPrice ?? "0");
  const hasDiscount = originalPrice > price && originalPrice > 0;
  const score = item.sellabilityScore ?? item.qualityScore;
  const isNew = item.createdAt && (Date.now() - new Date(item.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const href = item.source === "product" ? `/product/${item.id}` : `/marketplace/template/${item.id}`;

  return (
    <Link href={href}>
      <Card className="group overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border hover:border-violet-300 flex flex-col h-full bg-card">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-[16/9]">
          {item.coverImageUrl ? (
            <>
              <img
                src={item.coverImageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full group-hover:scale-105 transition-transform duration-700">
              <CoverPlaceholder item={item} typeEmoji={typeEmoji} />
            </div>
          )}
          {item.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500 text-white border-0 text-xs gap-1 shadow-lg">
                <Crown className="w-3 h-3" /> Featured
              </Badge>
            </div>
          )}
          {isNew && !item.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-emerald-500 text-white border-0 text-xs shadow-lg">
                ✨ New
              </Badge>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className={`text-xs border ${typeColor} bg-white/90 backdrop-blur-sm`}>
              {typeEmoji} {typeLabel}
            </Badge>
          </div>
          {score && (
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Badge className={`text-xs gap-1 border shadow-lg ${score >= 80 ? "bg-emerald-600/90 text-white border-emerald-400" : score >= 60 ? "bg-amber-600/90 text-white border-amber-400" : "bg-slate-700/90 text-white border-slate-500"}`}>
                ⭐ {score}% quality
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 group-hover:text-violet-700 transition-colors line-clamp-2">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-xs font-medium text-violet-600 mb-1 line-clamp-1">{item.subtitle}</p>
          )}
          <p className="text-xs text-muted-foreground line-clamp-3 mb-3 flex-1">
            {item.marketplaceDescription || item.description || item.subtitle || "Premium digital product — instant download"}
          </p>

          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-violet-700 text-[9px] font-bold">
                {(item.authorName ?? "C")?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">{item.authorName ?? "Creator"}</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
              ))}
              {item.reviewCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">({item.reviewCount})</span>
              )}
            </div>
            {item.totalSales > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Users className="w-3 h-3" /> {item.totalSales} sold
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">${price.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">${originalPrice.toFixed(0)}</span>
              )}
            </div>
            <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white border-0 gap-1 rounded-lg">
              Get It <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="text-center">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-white/70">{label}</div>
    </div>
  );
}

const BUYER_PERKS = [
  { emoji: "⚡", title: "Instant Download", desc: "Get access the moment you pay" },
  { emoji: "🔒", title: "Secure Checkout", desc: "256-bit SSL on every purchase" },
  { emoji: "✅", title: "Quality Vetted", desc: "Every product reviewed before listing" },
  { emoji: "💬", title: "Creator Support", desc: "Reach the author directly if needed" },
];

export default function Marketplace() {
  const [items, setItems] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("trending");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    apiClient.get("/marketplace/stats").then(r => setStats((r.data as any))).catch(() => {});
    apiClient.get("/marketplace/featured").then(r => setFeatured((r.data as any).items ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    apiClient.get(`/marketplace/listings?category=${category}&search=${encodeURIComponent(search)}&sort=${sort}&page=1`)
      .then(r => {
        const d = r.data as any;
        setItems(d.items ?? []);
        setHasMore(d.hasMore ?? false);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    apiClient.get(`/marketplace/listings?category=${category}&search=${encodeURIComponent(search)}&sort=${sort}&page=1`)
      .then(r => {
        const d = r.data as any;
        setItems(d.items ?? []);
        setHasMore(d.hasMore ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    apiClient.get(`/marketplace/listings?category=${category}&search=${encodeURIComponent(search)}&sort=${sort}&page=${nextPage}`)
      .then(r => {
        const d = r.data as any;
        setItems(prev => [...prev, ...(d.items ?? [])]);
        setHasMore(d.hasMore ?? false);
        setPage(nextPage);
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 35%, #6d28d9 65%, #7c3aed 100%)"
      }}>
        {/* Soft texture overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)"
        }} />
        {/* Warm glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-white/90 text-xs font-semibold tracking-wide">
                The Digital Product Marketplace — Instant Access, Every Time
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Find What You Need.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-300">
                Download Instantly.
              </span>
            </h1>
            <p className="text-violet-100 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Ebooks, courses, prompt packs, templates & AI tools — crafted by expert creators, available the moment you pay.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search ebooks, courses, templates, prompt packs…"
                    className="pl-12 h-14 text-base rounded-2xl border-0 shadow-2xl bg-card text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-14 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 border-0 font-bold text-base shadow-2xl"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <StatCard icon={Package}    label="Products Listed"  value={stats.totalListings?.toLocaleString() ?? "0"} color="bg-violet-500" />
              <StatCard icon={Users}      label="Creators"         value={stats.totalCreators?.toLocaleString() ?? "0"} color="bg-pink-500" />
              <StatCard icon={DollarSign} label="Paid to Creators" value={`$${parseFloat(stats.totalRevenue ?? "0").toLocaleString()}`} color="bg-amber-500" />
              <StatCard icon={Globe}      label="Categories"       value={stats.categories?.toString() ?? "8"}           color="bg-cyan-500" />
            </div>
          )}
        </div>
      </div>

      {/* ── Buyer trust strip ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 md:gap-10">
          {BUYER_PERKS.map(p => (
            <div key={p.title} className="flex items-center gap-2">
              <span className="text-xl">{p.emoji}</span>
              <div>
                <div className="text-xs font-bold text-foreground">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Featured Section */}
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-foreground">Featured Picks</h2>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">Hand-picked by our team</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(item => <MarketplaceCard key={`f-${item.id}-${item.type}`} item={item} />)}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                category === cat.key
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-violet-50 hover:text-violet-700 border"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading products…" : `${items.length} product${items.length !== 1 ? "s" : ""} found`}
          </p>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[16/9] bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-5 bg-muted rounded animate-pulse w-1/3 mt-2" />
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No products found yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Be the first to publish in this category — creators earn 90% of every sale.
            </p>
            <Link href="/register">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <Sparkles className="w-4 h-4" /> Create & Sell Your First Product
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => <MarketplaceCard key={`${item.source}-${item.id}`} item={item} />)}
            </div>
            {hasMore && (
              <div className="text-center mt-10">
                <Button variant="outline" onClick={loadMore} className="px-8">
                  Load More Products
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Creator CTA ── */}
        <div className="mt-16 rounded-3xl p-10 text-center relative overflow-hidden" style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)"
        }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24 pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
              💡
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Have knowledge to share?</h2>
            <p className="text-violet-200 text-lg mb-2 max-w-xl mx-auto">
              Turn your expertise into an ebook, course, or template in 60 seconds with AI — then sell it here and keep 90% of every sale.
            </p>
            <p className="text-violet-300/70 text-sm mb-8">Free to start · No tech skills needed · Your store live instantly</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-8 h-12 gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4" /> Start Creating — It's Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 gap-2">
                  Sign In to My Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
