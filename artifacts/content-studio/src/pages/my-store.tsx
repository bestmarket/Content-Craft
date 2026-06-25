import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetMe } from "@workspace/api-client-react";
import {
  ShoppingBag, ExternalLink, Copy, Globe, Share2, Eye, DollarSign,
  FileText, Loader2, Settings, CheckCircle, TrendingUp, Package, Wrench
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function MyStore() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user } = useGetMe();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["my-products"],
    queryFn: () => apiClient.get("/products").then(r => r.data),
  });

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) return;
    setSavingUsername(true);
    try {
      await apiClient.patch("/user/profile", { username: newUsername.toLowerCase() });
      qc.invalidateQueries({ queryKey: ["getMe"] });
      setEditingUsername(false);
      toast({ title: "Username saved! Your store is now live." });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Failed to save username", variant: "destructive" });
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePublish = async (productId: number) => {
    try {
      const res = await apiClient.post(`/products/${productId}/publish`, {});
      qc.invalidateQueries({ queryKey: ["my-products"] });
      toast({ title: "🎉 Product is now live on the marketplace!" });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Publish failed", variant: "destructive" });
    }
  };

  const username = (user as any)?.username;
  const storeUrl = username ? `${window.location.origin}/store/${username}` : null;

  const published = products?.filter((p: any) => p.isPublished) ?? [];
  const pending = products?.filter((p: any) => !p.isPublished && p.publishStatus === "pending_approval") ?? [];
  const drafts = products?.filter((p: any) => !p.isPublished && p.publishStatus !== "pending_approval") ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Store</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and share your digital products</p>
      </div>

      {!username ? (
        <Card className="p-6 border-2 border-dashed border-primary/30 bg-primary/5/50 space-y-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Set your store username to go live</p>
              <p className="text-sm text-muted-foreground mt-0.5">Your store will be at <span className="font-mono text-primary">{window.location.origin}/store/yourusername</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="yourusername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="max-w-xs font-mono"
            />
            <Button onClick={handleSaveUsername} disabled={savingUsername || !newUsername.trim()} className="bg-primary hover:bg-primary/90 border-0">
              {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Username"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">@{username}'s Store</p>
                <p className="text-xs text-muted-foreground">{published.length} published · {drafts.length} drafts</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(storeUrl!); toast({ title: "Store link copied!" }); }}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Store
              </Button>
              <a href={`/store/${username}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-primary hover:bg-primary/90 border-0">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Store
                </Button>
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* ── SHARE CREATOR PROFILE ── */}
      {username && (() => {
        const profileUrl = `${window.location.origin}/creator/${username}`;
        const shareText = encodeURIComponent(`Check out my digital product store on Selovox! 🚀`);
        const encodedUrl = encodeURIComponent(profileUrl);
        return (
          <Card className="p-4 border bg-gradient-to-r from-sky-50/60 to-blue-50/40 dark:from-sky-950/20 dark:to-blue-950/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Share2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground dark:text-foreground">Share Your Creator Profile</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate">{profileUrl}</p>
              </div>
              <a href={`/creator/${username}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="text-muted-foreground px-2">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(profileUrl); toast({ title: "Profile link copied!" }); }}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
              </Button>
              <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-sky-500 border-sky-200 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950/40 px-3">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="ml-1.5 hidden sm:inline">Post on X</span>
                </Button>
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/40 px-3">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="ml-1.5 hidden sm:inline">LinkedIn</span>
                </Button>
              </a>
              <a href={`https://wa.me/?text=${shareText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40 px-3">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="ml-1.5 hidden sm:inline">WhatsApp</span>
                </Button>
              </a>
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: products?.length ?? 0, icon: Package, color: "text-foreground" },
          { label: "Published", value: published.length, icon: Globe, color: "text-green-600" },
          { label: "Total Sales", value: products?.reduce((a: number, p: any) => a + (p.totalSales ?? 0), 0) ?? 0, icon: TrendingUp, color: "text-blue-600" },
          { label: "Revenue", value: `$${(products?.reduce((a: number, p: any) => a + Number(p.totalRevenue ?? 0), 0) ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-3 border text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !products || products.length === 0 ? (
        <Card className="p-10 text-center border">
          <FileText className="w-10 h-10 text-white mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No products yet. Create your first digital product!</p>
          <Link href="/create-product">
            <Button className="bg-gradient-to-r from-primary to-pink-600 border-0">Create Product</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {published.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Published ({published.length})
              </h2>
              <div className="space-y-3">
                {published.map((product: any) => (
                  <ProductCard key={product.id} product={product} username={username} onPublish={handlePublish} toast={toast} />
                ))}
              </div>
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-orange-500">⏳</span> Under Review ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((product: any) => (
                  <ProductCard key={product.id} product={product} username={username} onPublish={handlePublish} toast={toast} />
                ))}
              </div>
            </div>
          )}
          {drafts.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Drafts ({drafts.length})
              </h2>
              <div className="space-y-3">
                {drafts.map((product: any) => (
                  <ProductCard key={product.id} product={product} username={username} onPublish={handlePublish} toast={toast} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, username, onPublish, toast }: any) {
  const [publishing, setPublishing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const qc = useQueryClient();

  const doPublish = async () => {
    setPublishing(true);
    await onPublish(product.id);
    setPublishing(false);
  };

  const doRepair = async () => {
    setRepairing(true);
    try {
      await apiClient.post(`/products/${product.id}/improve`, {});
      qc.invalidateQueries({ queryKey: ["my-products"] });
      toast({ title: "Product repaired and upgraded!", description: "All sections have been refreshed and expanded." });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Repair failed", variant: "destructive" });
    } finally {
      setRepairing(false);
    }
  };

  return (
    <Card className="p-4 border flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-foreground text-sm truncate">{product.title}</p>
          {product.isPublished ? (
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">✓ Live</Badge>
          ) : product.publishStatus === "rejected" ? (
            <Badge className="bg-red-100 text-red-700 border-0 text-xs">Rejected</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Draft</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="font-bold text-green-600">${Number(product.price).toFixed(2)}</span>
          <span>{product.totalSales ?? 0} sales</span>
          <span>${Number(product.totalRevenue ?? 0).toFixed(2)} revenue</span>
          <span><Eye className="w-3 h-3 inline mr-0.5" />{product.viewCount ?? 0} views</span>
          {product.sellabilityScore && <span>⭐ {product.sellabilityScore}/100</span>}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {product.isPublished && username && (
          <>
            <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-8 bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-xs text-white">
                <ExternalLink className="w-3 h-3 mr-1" /> Sales Page
              </Button>
            </a>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`); toast({ title: "Sales page link copied!" }); }}>
              <Copy className="w-3 h-3 mr-1" /> Copy Link
            </Button>
          </>
        )}
        {!product.isPublished && (
          <Button size="sm" onClick={doPublish} disabled={publishing || !username} className="h-8 bg-primary hover:bg-primary/90 border-0 text-xs">
            {publishing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
            {!username ? "Set username first" : "Publish Now"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
          onClick={doRepair}
          disabled={repairing}
          title="Re-expand chapters and refresh all premium sections"
        >
          {repairing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wrench className="w-3 h-3 mr-1" />}
          {repairing ? "Repairing..." : "Repair"}
        </Button>
      </div>
    </Card>
  );
}
