import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe, Save, Loader2, FileText, CheckCircle, ExternalLink, Edit3,
  ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { Link } from "wouter";

type Section = { key: string; label: string; fields: { key: string; label: string; type: "text" | "textarea" | "price" }[] };

const SECTIONS: Section[] = [
  {
    key: "hero",
    label: "🎯 Hero Section",
    fields: [
      { key: "heroHeadline", label: "Main Headline", type: "textarea" },
      { key: "heroSubheadline", label: "Subheadline", type: "textarea" },
      { key: "heroCta", label: "Button Text", type: "text" },
    ],
  },
  {
    key: "pricing",
    label: "💰 Pricing Section",
    fields: [
      { key: "pricingHeadline", label: "Pricing Headline", type: "text" },
      { key: "currentPrice", label: "Current Price ($)", type: "price" },
      { key: "originalPrice", label: "Original Price ($)", type: "price" },
      { key: "guarantee", label: "Guarantee Text", type: "text" },
    ],
  },
  {
    key: "finalCta",
    label: "🚀 Final CTA",
    fields: [
      { key: "finalHeadline", label: "Final Headline", type: "textarea" },
      { key: "finalButtonText", label: "Button Text", type: "text" },
      { key: "finalSubtext", label: "Sub-text (under button)", type: "text" },
    ],
  },
];

export default function EditLanding() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [localLanding, setLocalLanding] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [openSection, setOpenSection] = useState<string>("hero");

  const { data: products, isLoading } = useQuery({
    queryKey: ["my-products"],
    queryFn: () => apiClient.get("/products").then(r => r.data),
  });

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    const lp = product.landingPage ?? {};
    setLocalLanding({
      heroHeadline: lp.heroHeadline ?? "",
      heroSubheadline: lp.heroSubheadline ?? "",
      heroCta: lp.heroCta ?? "Get Instant Access",
      pricingHeadline: lp.pricingSection?.headline ?? "",
      currentPrice: lp.pricingSection?.currentPrice ?? String(product.price),
      originalPrice: lp.pricingSection?.originalPrice ?? String(product.originalPrice ?? Number(product.price) * 2),
      guarantee: lp.pricingSection?.guarantee ?? "30-day money-back guarantee",
      finalHeadline: lp.finalCta?.headline ?? "",
      finalButtonText: lp.finalCta?.buttonText ?? "Yes, I Want This!",
      finalSubtext: lp.finalCta?.subtext ?? "Instant Access · 30-Day Guarantee",
    });
  };

  const handleSave = async () => {
    if (!selectedProduct || !localLanding) return;
    setSaving(true);
    try {
      const existing = selectedProduct.landingPage ?? {};
      const updated = {
        ...existing,
        heroHeadline: localLanding.heroHeadline,
        heroSubheadline: localLanding.heroSubheadline,
        heroCta: localLanding.heroCta,
        pricingSection: {
          ...(existing.pricingSection ?? {}),
          headline: localLanding.pricingHeadline,
          currentPrice: localLanding.currentPrice,
          originalPrice: localLanding.originalPrice,
          guarantee: localLanding.guarantee,
          includedItems: existing.pricingSection?.includedItems ?? [],
        },
        finalCta: {
          headline: localLanding.finalHeadline,
          buttonText: localLanding.finalButtonText,
          subtext: localLanding.finalSubtext,
        },
      };
      await apiClient.patch(`/products/${selectedProduct.id}`, { landingPage: updated });
      qc.invalidateQueries({ queryKey: ["my-products"] });
      toast({ title: "Landing page saved!" });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedProduct) return;
    setRegenerating(true);
    try {
      const res = await apiClient.post(`/products/${selectedProduct.id}/generate-landing-page`, {});
      const lp = res.data;
      setLocalLanding({
        heroHeadline: lp.heroHeadline ?? "",
        heroSubheadline: lp.heroSubheadline ?? "",
        heroCta: lp.heroCta ?? "Get Instant Access",
        pricingHeadline: lp.pricingSection?.headline ?? "",
        currentPrice: lp.pricingSection?.currentPrice ?? String(selectedProduct.price),
        originalPrice: lp.pricingSection?.originalPrice ?? String(selectedProduct.originalPrice ?? Number(selectedProduct.price) * 2),
        guarantee: lp.pricingSection?.guarantee ?? "30-day money-back guarantee",
        finalHeadline: lp.finalCta?.headline ?? "",
        finalButtonText: lp.finalCta?.buttonText ?? "Yes, I Want This!",
        finalSubtext: lp.finalCta?.subtext ?? "Instant Access · 30-Day Guarantee",
      });
      setSelectedProduct({ ...selectedProduct, landingPage: lp });
      qc.invalidateQueries({ queryKey: ["my-products"] });
      toast({ title: "Landing page regenerated!" });
    } catch {
      toast({ title: "Regeneration failed", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  if (!selectedProduct) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Edit Landing Pages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Select a product to edit its landing page copy</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !products || products.length === 0 ? (
          <Card className="p-10 text-center border">
            <FileText className="w-10 h-10 text-white mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">No products yet.</p>
            <Link href="/create-product"><Button className="bg-primary border-0">Create Product</Button></Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {products.map((p: any) => (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="w-full text-left bg-card border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>${Number(p.price).toFixed(2)}</span>
                    {p.isPublished ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Published</span> : <span>Draft</span>}
                    {p.landingPage ? <span className="text-blue-600">✓ Has landing page</span> : <span className="text-orange-500">No landing page yet</span>}
                  </p>
                </div>
                <Edit3 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => { setSelectedProduct(null); setLocalLanding(null); }} className="text-sm text-muted-foreground hover:text-foreground mb-1 flex items-center gap-1">← Back to products</button>
          <h1 className="text-xl font-bold text-foreground">Edit Landing Page</h1>
          <p className="text-muted-foreground text-sm truncate max-w-sm">{selectedProduct.title}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Regenerate with AI
          </Button>
          {selectedProduct.isPublished && (
            <a href={`/product/${selectedProduct.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Live</Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 border-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      {!selectedProduct.landingPage && !localLanding?.heroHeadline && (
        <Card className="p-4 border-dashed border-2 border-orange-200 bg-orange-50 text-center">
          <p className="text-orange-700 text-sm font-medium mb-2">No landing page yet — generate one first</p>
          <Button size="sm" onClick={handleRegenerate} disabled={regenerating} className="bg-orange-500 hover:bg-orange-600 border-0">
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Globe className="w-3.5 h-3.5 mr-1.5" />}
            Generate Landing Page
          </Button>
        </Card>
      )}

      {localLanding && SECTIONS.map((section) => (
        <Card key={section.key} className="border overflow-hidden">
          <button
            className="w-full px-5 py-4 flex items-center justify-between bg-muted/30 hover:bg-muted transition-colors"
            onClick={() => setOpenSection(openSection === section.key ? "" : section.key)}
          >
            <span className="font-semibold text-foreground text-sm">{section.label}</span>
            {openSection === section.key ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {openSection === section.key && (
            <div className="p-5 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <Label className="text-sm font-medium mb-1.5 block">{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={localLanding[field.key] ?? ""}
                      onChange={(e) => setLocalLanding({ ...localLanding, [field.key]: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  ) : field.type === "price" ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                      <Input
                        type="number"
                        className="pl-7"
                        value={localLanding[field.key] ?? ""}
                        onChange={(e) => setLocalLanding({ ...localLanding, [field.key]: e.target.value })}
                      />
                    </div>
                  ) : (
                    <Input
                      value={localLanding[field.key] ?? ""}
                      onChange={(e) => setLocalLanding({ ...localLanding, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {localLanding && (
        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 border-0 h-11">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Landing Page Changes
        </Button>
      )}
    </div>
  );
}
