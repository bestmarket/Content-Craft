import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, FileText, Star, ArrowRight, Globe, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function StorePublic() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-store", username],
    queryFn: () => apiClient.get(`/store/${username}`).then(r => r.data),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground">Store Not Found</h1>
          <p className="text-muted-foreground text-sm mt-1">@{username} doesn't have a store yet.</p>
        </div>
      </div>
    );
  }

  const { store, products } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{store.ownerName}'s Digital Store</h1>
        <p className="text-primary/70 text-sm">@{store.username} · {products.length} product{products.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Store Live</span>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No products yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product: any) => (
              <a key={product.id} href={`/product/${product.id}`} className="block group">
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/50 transition-all">
                  {product.coverImageUrl ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={product.coverImageUrl} alt={product.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-purple-900/80 to-pink-900/60 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary/70/60" />
                    </div>
                  )}
                  <div className="p-5">
                  <h2 className="font-bold text-white text-sm leading-snug mb-1 line-clamp-2">{product.title}</h2>
                  {product.targetAudience && (
                    <p className="text-muted-foreground text-xs line-clamp-1 mb-3">{product.targetAudience}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <span className="text-muted-foreground line-through text-xs mr-1">${Number(product.originalPrice).toFixed(2)}</span>
                      )}
                      <span className="text-xl font-bold text-green-400">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary/80 group-hover:translate-x-1 transition-transform">
                      Get it <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  {product.sellabilityScore && (
                    <div className="mt-2 flex gap-2 items-center">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full" style={{ width: `${product.sellabilityScore}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{product.sellabilityScore}/100</span>
                    </div>
                  )}
                  </div>{/* end p-5 */}
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="text-center mt-12 text-muted-foreground text-sm">
          <p>Powered by <span className="text-primary/80 font-medium">Selovox</span></p>
        </div>
      </div>
    </div>
  );
}
