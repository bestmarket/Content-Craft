import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, CheckCircle, XCircle, DollarSign, Clock, Globe,
  Mail, Megaphone, Star, Ban, TrendingUp, ShoppingBag,
  Eye, Loader2, RefreshCw,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "published" | "draft" | "rejected";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status, isPublished }: { status: string | null; isPublished: boolean }) {
  if (isPublished && status === "featured") return <Badge className="bg-amber-500 border-0 text-white">⭐ Featured</Badge>;
  if (isPublished) return <Badge className="bg-green-600 border-0 text-white">Published</Badge>;
  if (status === "pending_approval") return <Badge className="bg-orange-500 border-0 text-white">⏳ Pending</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500 border-0 text-white">Rejected</Badge>;
  if (status === "disabled") return <Badge className="bg-slate-500 border-0 text-white">Disabled</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>;
}

export default function AdminProducts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [acting, setActing] = useState<number | null>(null);

  const { data: overview } = useQuery({
    queryKey: ["admin-products-overview"],
    queryFn: () => apiClient.get("/admin/products/overview").then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["admin-products", filter],
    queryFn: () => apiClient.get(`/admin/products?status=${filter}`).then(r => r.data),
    refetchInterval: 15000,
  });

  const doAction = async (id: number, action: string, body?: any) => {
    setActing(id);
    try {
      await apiClient.patch(`/admin/products/${id}/${action}`, body ?? {});
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-products-overview"] });
      toast({ title: action === "approve" ? "✅ Product approved & published!" : action === "reject" ? "Product rejected" : "Done" });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Action failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const filterTabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: "pending", label: "Pending Approval", count: overview?.pending },
    { key: "published", label: "Published", count: overview?.published },
    { key: "draft", label: "Draft", count: overview?.draft },
    { key: "rejected", label: "Rejected", count: overview?.rejected },
    { key: "all", label: "All Products", count: overview?.total },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Approval</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve seller products before they go live</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: overview?.total ?? 0, icon: Package, color: "text-muted-foreground" },
          { label: "Pending Review", value: overview?.pending ?? 0, icon: Clock, color: "text-orange-600" },
          { label: "Published", value: overview?.published ?? 0, icon: Globe, color: "text-green-600" },
          { label: "Platform Revenue", value: `$${Number(overview?.totalRevenue ?? 0).toFixed(0)}`, icon: DollarSign, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4 border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
            {count != null && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === key ? "bg-card/20" : "bg-muted"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : !products?.length ? (
        <Card className="p-12 text-center border">
          <Package className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No products in this category</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((product: any) => (
            <Card key={product.id} className="p-4 md:p-5 border hover:border transition-all">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-foreground truncate">{product.title}</p>
                        <StatusBadge status={product.publishStatus} isPublished={product.isPublished} />
                        {product.productType && product.productType !== "pdf" && (
                          <Badge variant="outline" className="text-xs">{product.productType}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{product.topic}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span>👤 {product.userName} ({product.userEmail})</span>
                        <span>💰 ${product.price}</span>
                        <span>🛒 {product.totalSales} sales</span>
                        {product.category && <span>🏷️ {product.category}</span>}
                        <span>🕐 {timeAgo(product.createdAt)}</span>
                      </div>
                      {/* Asset badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.hasLandingPage ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {product.hasLandingPage ? "✓" : "✗"} Landing Page
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.hasEmailSeq ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {product.hasEmailSeq ? "✓" : "✗"} 30-Day Emails
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.hasMarketing ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {product.hasMarketing ? "✓" : "✗"} Marketing
                        </span>
                      </div>
                    </div>
                    {product.sellabilityScore != null && (
                      <div className="text-center flex-shrink-0">
                        <div className={`text-2xl font-black ${product.sellabilityScore >= 80 ? "text-green-600" : product.sellabilityScore >= 60 ? "text-amber-500" : "text-red-500"}`}>
                          {product.sellabilityScore}
                        </div>
                        <p className="text-xs text-muted-foreground">score</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:flex-col md:items-end shrink-0">
                  {product.isPublished ? (
                    <>
                      <Button
                        size="sm" variant="outline"
                        className="text-amber-600 border-amber-300"
                        disabled={acting === product.id}
                        onClick={() => doAction(product.id, "feature", { featured: product.publishStatus !== "featured" })}
                      >
                        <Star className="w-3.5 h-3.5 mr-1" />
                        {product.publishStatus === "featured" ? "Unfeature" : "Feature"}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-red-600 border-red-300"
                        disabled={acting === product.id}
                        onClick={() => doAction(product.id, "disable", { disabled: true })}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />Disable
                      </Button>
                    </>
                  ) : product.publishStatus === "disabled" ? (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white border-0"
                      disabled={acting === product.id}
                      onClick={() => doAction(product.id, "disable", { disabled: false })}
                    >
                      {acting === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                      Re-enable
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white border-0"
                        disabled={acting === product.id}
                        onClick={() => doAction(product.id, "approve")}
                      >
                        {acting === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-red-600 border-red-300"
                        disabled={acting === product.id}
                        onClick={() => doAction(product.id, "reject")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                      </Button>
                    </>
                  )}
                  <a
                    href={`/product/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary flex items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
