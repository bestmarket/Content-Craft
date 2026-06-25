import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Loader2, ShoppingBag, Star, ArrowRight, Zap, Globe, Package,
  Share2, ExternalLink, CheckCircle, TrendingUp, Users, BookOpen,
} from "lucide-react";

interface Product {
  id: number;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  category: string;
  sellabilityScore: number;
  totalSales: number;
  targetAudience: string;
  description: string;
  coverImageUrl: string | null;
  pageCount: number | null;
}

interface StoreData {
  store: {
    username: string;
    ownerName: string;
    profilePicture: string | null;
    profileBio: string | null;
  };
  products: Product[];
}

const CATEGORY_COLORS: Record<string, string> = {
  ebook: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  course: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  template: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  guide: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  toolkit: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  default: "bg-muted text-muted-foreground dark:bg-slate-800 dark:text-muted-foreground",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat?.toLowerCase()] ?? CATEGORY_COLORS.default;
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? "text-emerald-500" : pct >= 60 ? "text-sky-500" : "text-amber-500";
  return (
    <span className={`text-xs font-bold ${color} flex items-center gap-0.5`}>
      <Star className="w-3 h-3 fill-current" />
      {pct}
    </span>
  );
}

function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.originalPrice > product.price;
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-sky-400/50 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer h-full flex flex-col">
        {/* Cover image / placeholder */}
        <div className="aspect-[16/9] bg-gradient-to-br from-sky-500/10 to-blue-600/10 dark:from-sky-900/30 dark:to-blue-900/20 relative overflow-hidden flex-shrink-0">
          {product.coverImageUrl ? (
            <img
              src={product.coverImageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-sky-300 dark:text-sky-700" />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${categoryColor(product.category)}`}>
              {product.category}
            </span>
            {product.sellabilityScore > 0 && <ScoreRing score={product.sellabilityScore} />}
          </div>

          <h3 className="font-bold text-sm text-card-foreground leading-snug line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {product.title}
          </h3>

          {product.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">{product.subtitle}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-foreground">${product.price.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            <span className="text-xs font-semibold text-sky-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function copyLink(username: string) {
  navigator.clipboard.writeText(`${window.location.origin}/creator/${username}`);
}

export default function CreatorProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data, isLoading, error } = useQuery<StoreData>({
    queryKey: ["creator-profile", username],
    queryFn: () => apiClient.get(`/store/${username}`).then(r => r.data),
    enabled: !!username,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Creator Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">@{username} doesn't have a profile yet.</p>
          <Link href="/">
            <Button variant="outline">← Back to Selovox</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { store, products } = data;
  const totalRevenue = products.reduce((s, p) => s + p.price * (p.totalSales ?? 0), 0);
  const avgScore = products.length
    ? Math.round(products.reduce((s, p) => s + (p.sellabilityScore ?? 0), 0) / products.length)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ── */}
      <header className="h-14 border-b border-border px-4 md:px-10 flex items-center justify-between sticky top-0 z-40 bg-background/95 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">Selo<span className="text-sky-500">vox</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hidden sm:flex"
            onClick={() => copyLink(store.username)}
          >
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
          <Link href={`/store/${store.username}`}>
            <Button size="sm" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 shadow-sm">
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Visit Store
            </Button>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/8 via-background to-background dark:from-sky-500/5" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 pt-14 pb-10 text-center">
          {/* Avatar */}
          <div className="inline-block mb-5 relative">
            {store.profilePicture ? (
              <img
                src={store.profilePicture}
                alt={store.ownerName}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl shadow-sky-500/10"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                  ((e.target as HTMLImageElement).nextSibling as HTMLElement)?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-sky-500/20 border-4 border-white dark:border-slate-800 ${store.profilePicture ? "hidden" : ""}`}>
              {store.ownerName?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-foreground mb-1">{store.ownerName}</h1>
          <p className="text-muted-foreground text-sm mb-3">@{store.username}</p>

          {store.profileBio && (
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed mb-5">
              {store.profileBio}
            </p>
          )}

          {/* Stats row */}
          <div className="inline-flex items-center gap-6 md:gap-10 bg-card border border-border rounded-2xl px-6 py-3 shadow-sm mx-auto mb-6">
            {[
              { icon: Package, label: "Products", value: products.length.toString() },
              { icon: TrendingUp, label: "Avg Score", value: avgScore > 0 ? `${avgScore}/100` : "—" },
              { icon: Globe, label: "Creator", value: "Verified" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="w-4 h-4 text-sky-500 mx-auto mb-0.5" />
                <p className="text-base font-black text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={`/store/${store.username}`}>
              <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-blue-500/20 font-semibold">
                <ShoppingBag className="w-4 h-4 mr-2" /> Shop All Products
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => copyLink(store.username)}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share Profile
            </Button>
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-t border-border" />
      </div>

      {/* ── PRODUCTS ── */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {products.length > 0 ? `${products.length} Product${products.length !== 1 ? "s" : ""}` : "No products yet"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {products.length > 0 ? "Click any product to learn more or purchase" : "Check back soon"}
            </p>
          </div>
          {products.length > 0 && (
            <Link href={`/store/${store.username}`}>
              <Button variant="ghost" size="sm" className="text-sky-500 hover:text-sky-600">
                Full Store <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No published products yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Follow @{store.username} to stay updated.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER CTA ── */}
      <div className="max-w-4xl mx-auto px-4 pb-14 mt-4">
        <div className="bg-gradient-to-r from-sky-500/10 to-blue-600/10 dark:from-sky-900/20 dark:to-blue-900/10 border border-sky-200/50 dark:border-sky-800/30 rounded-2xl p-8 text-center">
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-2">Powered by Selovox</p>
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
            Create your own digital product business
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Turn your expertise into products like {store.ownerName} did. Free forever — launch in 60 seconds.
          </p>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-blue-500/20 font-semibold">
              Start for Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
