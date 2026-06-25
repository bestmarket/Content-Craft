import { useState, useEffect } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, ChevronRight, Trash2, Loader2 } from "lucide-react";

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  research:     { label: "Research",    color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  architect:    { label: "Architect",   color: "bg-primary/20 text-primary/70 border-purple-500/30" },
  content:      { label: "Content",     color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  critic:       { label: "Critic",      color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  sellability:  { label: "Sellability", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  marketing:    { label: "Marketing",   color: "bg-green-500/20 text-green-300 border-green-500/30" },
  complete:     { label: "Complete ✓",  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

export default function ScryvoxProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    apiClient.get("/scryvox/products")
      .then(r => setProducts(r.data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this product pipeline? This cannot be undone.")) return;
    setDeleting(id);
    await apiClient.delete(`/scryvox/products/${id}`).catch(() => {});
    setProducts(p => p.filter(x => x.id !== id));
    setDeleting(null);
  }

  const stageInfo = (stage: string) => STAGE_LABELS[stage] ?? { label: stage, color: "bg-gray-500/20 text-gray-300 border-gray-500/30" };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Product Pipeline</h1>
            <p className="text-gray-400 mt-1">Build complete digital products — research through marketing — with Scryvox</p>
          </div>
          <Link href="/scryvox/products/new">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              New Product
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : products.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
              <BookOpen className="w-16 h-16 text-gray-600" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">No products yet</h3>
                <p className="text-gray-400 mb-6">Start your first product pipeline — from research to marketing assets</p>
                <Link href="/scryvox/products/new">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" />
                    Create First Product
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const info = stageInfo(p.stage);
              const wordCount = (p.contentData as any)?.totalWordCount;
              const chapterCount = (p.contentData as any)?.chapters?.length;
              const score = (p.criticData as any)?.overallScore;

              return (
                <Card key={p.id} className="bg-gray-800/60 border-gray-700 hover:border-indigo-500/50 transition-all group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-white text-base leading-tight line-clamp-2">{p.title}</CardTitle>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                      >
                        {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <Badge className={`w-fit text-xs border ${info.color}`}>{info.label}</Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-4">
                      {wordCount && <span>{wordCount.toLocaleString()} words</span>}
                      {chapterCount && <span>{chapterCount} chapters</span>}
                      {score !== undefined && <span>Score: {score}/100</span>}
                      <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-1">
                        {["research","architect","content","critic","sellability","marketing"].map((s, i) => {
                          const stages = ["research","architect","content","critic","sellability","marketing","complete"];
                          const stageIdx = stages.indexOf(p.stage);
                          const done = stageIdx > i;
                          const current = stageIdx === i;
                          return (
                            <div key={s} className={`h-1.5 w-5 rounded-full ${done ? "bg-indigo-500" : current ? "bg-indigo-400/60" : "bg-gray-700"}`} />
                          );
                        })}
                      </div>
                    </div>

                    <Link href={`/scryvox/products/${p.id}`}>
                      <Button size="sm" className="w-full gap-1 bg-indigo-600/80 hover:bg-indigo-600">
                        {p.stage === "complete" ? "View Product" : "Continue Pipeline"}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
