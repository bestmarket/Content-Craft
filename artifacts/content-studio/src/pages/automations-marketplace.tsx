import { useState, useEffect } from "react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag, Search, Zap, Users, Download, CheckCircle,
  Loader2, Star, DollarSign, Filter, ArrowLeft, Play,
  TrendingUp, Package, Sparkles,
} from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";

const CATEGORIES = ["All", "Content AI", "Business", "Research", "Productivity"];

export default function AutomationsMarketplace() {
  const { toast } = useToast();
  const { data: access } = useFeatureAccess();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");

  const load = () => {
    apiClient.get("/automations/marketplace").then((res) => {
      setTools((res.data as any).tools || []);
    }).catch(() => {
      toast({ title: "Error loading marketplace", variant: "destructive" });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInstall = async (tool: any) => {
    setInstalling(tool.id);
    try {
      const res = await apiClient.post(`/automations/marketplace/${tool.id}/install`, {});
      toast({ title: (res.data as any).message || "Tool installed!", description: "Find it in your Automation Engine." });
      setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isInstalled: true, installCount: t.installCount + 1 } : t));
    } catch (err: any) {
      toast({ title: "Install failed", description: err.message, variant: "destructive" });
    } finally {
      setInstalling(null);
    }
  };

  const filtered = tools.filter((t) => {
    const matchSearch = !search || t.marketplaceTitle?.toLowerCase().includes(search.toLowerCase()) ||
      t.marketplaceDescription?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || t.category === category.toLowerCase();
    const price = parseFloat(t.price || "0");
    const matchPrice = priceFilter === "All" || (priceFilter === "Free" && price === 0) ||
      (priceFilter === "Paid" && price > 0) || (priceFilter === "Under $10" && price > 0 && price < 10) ||
      (priceFilter === "$10+" && price >= 10);
    return matchSearch && matchCat && matchPrice;
  });

  const isAdmin = access?.isAdmin ?? false;
  const canUse = isAdmin || (access?.features?.automation_marketplace?.allowed !== false);

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <UpgradeBanner featureKey="automation_marketplace" label="Automation Marketplace" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/automations">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs h-7 px-2">
                <ArrowLeft className="w-3 h-3" /> Back
              </Button>
            </Link>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Tool Marketplace</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm ml-8">Discover automation tools built by the community. Buy once, use forever.</p>
        </div>
        <Link href="/automations/builder">
          <Button className="gap-2 text-sm bg-gradient-to-r from-primary to-pink-500 text-white border-0 hover:from-purple-700 hover:to-pink-600">
            <Sparkles className="w-4 h-4" /> Sell Your Tool
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <Button key={c} variant={category === c ? "default" : "outline"} size="sm"
              className={`text-xs h-9 ${category === c ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
              onClick={() => setCategory(c)}>{c}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", "Free", "Under $10", "Paid"].map((p) => (
            <Button key={p} variant={priceFilter === p ? "default" : "outline"} size="sm"
              className={`text-xs h-9 ${priceFilter === p ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
              onClick={() => setPriceFilter(p)}>{p}</Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Loading marketplace...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No tools found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term." : "Be the first to publish a tool!"}</p>
          </div>
          <Link href="/automations/builder">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Sparkles className="w-4 h-4" /> Build & Publish a Tool
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filtered.length} tool{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" /> Sorted by popularity
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((tool) => {
              const price = parseFloat(tool.price || "0");
              const steps: any[] = Array.isArray(tool.steps) ? tool.steps : [];
              const tags: string[] = Array.isArray(tool.marketplaceTags) ? tool.marketplaceTags : [];
              return (
                <Card key={tool.id} className="p-5 flex flex-col hover:shadow-lg transition-all border-2 hover:border-primary/30 group">
                  {/* Tool header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-2xl">
                        {tool.emoji || "⚡"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight">
                          {tool.marketplaceTitle || tool.name}
                        </p>
                        <p className="text-xs text-muted-foreground">by {tool.creatorName || "Creator"}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {price === 0 ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-bold">FREE</Badge>
                      ) : (
                        <span className="text-base font-bold text-primary">${price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                    {tool.marketplaceDescription || tool.description || "No description provided."}
                  </p>

                  {/* Steps preview */}
                  {steps.length > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <Zap className="w-3 h-3 text-primary/80" />
                      <span className="text-xs text-muted-foreground">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
                      <span className="text-muted-foreground/60 mx-1">·</span>
                      <Play className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{tool.runCount || 0} runs</span>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats bar */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {tool.installCount || 0} installs
                    </span>
                    {price > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> ${(parseFloat(tool.totalRevenue || "0")).toFixed(0)} earned
                      </span>
                    )}
                    {tool.isOwn && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/30 ml-auto">Your tool</Badge>
                    )}
                  </div>

                  {/* Action button */}
                  {tool.isOwn ? (
                    <Link href={`/automations/builder?edit=${tool.id}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                        <Sparkles className="w-3 h-3" /> Edit Tool
                      </Button>
                    </Link>
                  ) : tool.isInstalled ? (
                    <Button disabled variant="outline" size="sm" className="w-full text-xs gap-1 text-green-600 border-green-200 bg-green-50">
                      <CheckCircle className="w-3 h-3" /> Installed
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full text-xs gap-1 bg-gradient-to-r from-primary to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0"
                      onClick={() => handleInstall(tool)}
                      disabled={installing === tool.id}
                    >
                      {installing === tool.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : price === 0 ? (
                        <><Download className="w-3 h-3" /> Install Free</>
                      ) : (
                        <><ShoppingBag className="w-3 h-3" /> Buy for ${price.toFixed(2)}</>
                      )}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Sell CTA banner */}
      <Card className="p-6 bg-gradient-to-r from-primary to-pink-500 text-white border-0 text-center">
        <h3 className="font-bold text-lg mb-2">Turn your automation into passive income</h3>
        <p className="text-blue-200 text-sm mb-4">Build a tool in the builder, set a price, and earn every time someone installs it.</p>
        <Link href="/automations/builder">
          <Button className="bg-card text-primary hover:bg-primary/5 font-semibold gap-2">
            <Sparkles className="w-4 h-4" /> Start Building
          </Button>
        </Link>
      </Card>
    </div>
  );
}
