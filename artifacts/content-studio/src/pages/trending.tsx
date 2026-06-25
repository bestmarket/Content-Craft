import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, Zap, DollarSign, ArrowRight, Sparkles, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

const POTENTIAL_COLOR: Record<string, string> = {
  High: "bg-primary/10 text-primary",
  Medium: "bg-blue-100 text-blue-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Health & Home Remedies": "text-green-600",
  "Fitness & Body": "text-orange-600",
  "Make Money Online": "text-primary",
  "Personal Finance": "text-blue-600",
  "Mental Health & Wellness": "text-pink-600",
  "Relationships": "text-red-600",
  "Women's Health": "text-rose-600",
  "Men's Health": "text-indigo-600",
  "Food & Nutrition": "text-amber-600",
  "Hair & Beauty": "text-fuchsia-600",
  "Home & Lifestyle": "text-teal-600",
  "Spirituality": "text-violet-600",
  "Parenting": "text-cyan-600",
  "Education": "text-sky-600",
  "Pet Care": "text-emerald-600",
  "Travel": "text-lime-600",
  "Career": "text-muted-foreground",
  "Productivity": "text-zinc-600",
};

const ALL_CATEGORIES = [
  "All", "Health & Home Remedies", "Fitness & Body", "Make Money Online",
  "Personal Finance", "Mental Health & Wellness", "Women's Health", "Men's Health",
  "Food & Nutrition", "Hair & Beauty", "Home & Lifestyle", "Spirituality",
  "Relationships", "Parenting", "Education", "Pet Care", "Travel", "Career", "Productivity"
];

export default function Trending() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [difficulty, setDifficulty] = useState<"" | "Easy" | "Medium" | "Hard">("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["trending-ideas", difficulty],
    queryFn: () => apiClient.get(`/trending/ideas${difficulty ? `?difficulty=${difficulty}` : ""}`).then(r => r.data),
    staleTime: 1000 * 60 * 60,
  });

  const ideas = (data?.ideas ?? []).filter((idea: any) => {
    const matchesCategory = category === "All" || idea.category === category;
    const matchesSearch = !search || idea.title.toLowerCase().includes(search.toLowerCase()) || idea.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalIdeas = data?.total ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" /> Trending Product Ideas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{totalIdeas}+ unique product ideas curated per user — updated with real market demand · unique order for each creator</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
          <p className="text-xl md:text-2xl font-bold text-orange-600">{totalIdeas}+</p>
          <p className="text-xs text-orange-700">Hot Opportunities</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xl md:text-2xl font-bold text-green-600">{(data?.ideas ?? []).filter((i: any) => i.difficulty === "Easy").length}</p>
          <p className="text-xs text-green-700">Easy to Create</p>
        </div>
        <div className="bg-primary/5 border border-purple-100 rounded-xl p-3">
          <p className="text-xl md:text-2xl font-bold text-primary">{(data?.ideas ?? []).filter((i: any) => i.monetizationPotential === "High").length}</p>
          <p className="text-xs text-primary">High Potential</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas (health, fitness, money...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Difficulty:</span>
          {(["", "Easy", "Medium", "Hard"] as const).map((d) => (
            <Button
              key={d || "all"}
              size="sm"
              variant={difficulty === d ? "default" : "outline"}
              className={`h-8 text-xs ${difficulty === d ? "bg-primary border-0 text-white" : ""}`}
              onClick={() => setDifficulty(d)}
            >
              {d === "" ? "All Levels" : d === "Easy" ? "⚡ Easy" : d === "Medium" ? "🔧 Medium" : "🔥 Hard"}
            </Button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Category:</span>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_CATEGORIES.slice(0, 10).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${category === cat ? "bg-primary text-white border-purple-600" : "bg-card text-muted-foreground border hover:border-primary/40"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading trending opportunities...</p>
        </div>
      ) : ideas.length === 0 ? (
        <Card className="p-10 text-center border">
          <TrendingUp className="w-10 h-10 text-white mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No ideas match your filters.</p>
          <Button className="mt-4 bg-primary border-0" onClick={() => { setDifficulty(""); setCategory("All"); setSearch(""); }}>Clear Filters</Button>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Showing <strong>{ideas.length}</strong> ideas {difficulty && `(${difficulty})`} {category !== "All" && `in ${category}`}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ideas.map((idea: any, i: number) => (
              <Card key={i} className="p-4 border hover:border-primary/40 hover:shadow-md transition-all group flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{idea.emoji ?? "🔥"}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm leading-snug">{idea.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{idea.description}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3">
                  <p className="text-xs text-amber-800 line-clamp-2"><span className="font-bold">Why trending:</span> {idea.whyTrending}</p>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className={`${POTENTIAL_COLOR[idea.monetizationPotential] ?? "bg-muted text-foreground"} border-0 text-xs`}>
                    💰 {idea.monetizationPotential} Potential
                  </Badge>
                  <Badge className={`${DIFFICULTY_COLOR[idea.difficulty] ?? "bg-muted text-foreground"} text-xs`}>
                    {idea.difficulty === "Easy" ? "⚡" : idea.difficulty === "Medium" ? "🔧" : "🔥"} {idea.difficulty}
                  </Badge>
                  {idea.suggestedPrice && (
                    <Badge variant="outline" className="text-xs text-green-700 border-green-300 font-bold">
                      ~${idea.suggestedPrice}
                    </Badge>
                  )}
                </div>

                <p className={`text-xs font-medium mb-3 ${CATEGORY_COLORS[idea.category] ?? "text-muted-foreground"}`}>
                  {idea.category}
                </p>

                <div className="mt-auto">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-sm h-9 group-hover:shadow-lg transition-shadow"
                    onClick={() => setLocation(`/create-product?topic=${encodeURIComponent(idea.title)}&description=${encodeURIComponent(`Target audience: people interested in ${idea.category}. Why trending: ${idea.whyTrending}. Suggested price: $${idea.suggestedPrice ?? 27}.`)}&category=${encodeURIComponent(idea.category ?? "")}&emoji=${encodeURIComponent(idea.emoji ?? "")}&price=${idea.suggestedPrice ?? 27}&fromTrending=1`)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Create This Product
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
