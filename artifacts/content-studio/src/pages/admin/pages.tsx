import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Save, Loader2, Globe, Eye, Edit3, CheckCircle } from "lucide-react";

const PAGE_SLUGS = [
  { slug: "about", label: "About Us", icon: "🏢" },
  { slug: "privacy-policy", label: "Privacy Policy", icon: "🔒" },
  { slug: "terms", label: "Terms of Service", icon: "📋" },
  { slug: "refund-policy", label: "Refund Policy", icon: "💳" },
];

export default function AdminPages() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeSlug, setActiveSlug] = useState("about");
  const [editing, setEditing] = useState<{ title: string; content: string; metaDescription: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: () => apiClient.get("/admin/pages").then(r => r.data),
  });

  const activePage = pages?.find((p: any) => p.slug === activeSlug);

  useEffect(() => {
    if (activePage && !editing) {
      setEditing({ title: activePage.title, content: activePage.content, metaDescription: activePage.metaDescription ?? "" });
    }
  }, [activePage?.slug]);

  const handleSlugChange = (slug: string) => {
    setActiveSlug(slug);
    const page = pages?.find((p: any) => p.slug === slug);
    if (page) setEditing({ title: page.title, content: page.content, metaDescription: page.metaDescription ?? "" });
    else setEditing({ title: "", content: "", metaDescription: "" });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/pages/${activeSlug}`, editing);
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      toast({ title: "Page saved and published!" });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Page Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Edit and publish legal and information pages</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 border-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save & Publish
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Sidebar */}
        <div className="col-span-3 space-y-2">
          {PAGE_SLUGS.map(({ slug, label, icon }) => {
            const page = pages?.find((p: any) => p.slug === slug);
            return (
              <button
                key={slug}
                onClick={() => handleSlugChange(slug)}
                className={`w-full text-left px-3 py-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                  activeSlug === slug
                    ? "bg-primary/5 border-primary/40 text-primary"
                    : "bg-card border text-foreground hover:bg-muted/30"
                }`}
              >
                <span className="text-base">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{slug}</p>
                </div>
                {page && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
              </button>
            );
          })}

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground px-1 mb-2">Quick Links</p>
            {PAGE_SLUGS.map(({ slug, label }) => (
              <a key={slug} href={`/${slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary px-1 py-1 transition-colors">
                <Eye className="w-3 h-3" /> View /{slug}
              </a>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-9 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : editing ? (
            <>
              <Card className="p-5 border space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Page Title</Label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Page title..."
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Meta Description</Label>
                  <Input
                    value={editing.metaDescription}
                    onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                    placeholder="Brief description for search engines..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm font-medium">Page Content</Label>
                    <span className="text-xs text-muted-foreground">Supports Markdown: # Heading, ## Subheading, **bold**, - bullet</span>
                  </div>
                  <Textarea
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    rows={22}
                    className="font-mono text-sm"
                    placeholder="Write your page content here. Supports Markdown formatting."
                  />
                </div>
              </Card>

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 border-0">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save & Publish
                </Button>
                <a href={`/${activeSlug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Page</Button>
                </a>
                <span className="text-xs text-muted-foreground">
                  {activePage ? `Last updated: ${new Date(activePage.updatedAt).toLocaleString()}` : "Not yet saved"}
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
