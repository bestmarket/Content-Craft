import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Loader2, FileText } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  let html = "";
  for (const line of lines) {
    if (line.startsWith("# ")) {
      html += `<h1 class="text-3xl font-black text-white mb-4 mt-8">${line.slice(2)}</h1>`;
    } else if (line.startsWith("## ")) {
      html += `<h2 class="text-xl font-bold text-white mb-3 mt-6">${line.slice(3)}</h2>`;
    } else if (line.startsWith("### ")) {
      html += `<h3 class="text-lg font-semibold text-white mb-2 mt-4">${line.slice(4)}</h3>`;
    } else if (line.startsWith("**") && line.endsWith("**")) {
      html += `<p class="text-white font-semibold mb-2">${line.slice(2, -2)}</p>`;
    } else if (line.startsWith("- ")) {
      html += `<li class="text-muted-foreground ml-4 mb-1">${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}</li>`;
    } else if (line.trim() === "") {
      html += `<div class="mb-3"></div>`;
    } else {
      html += `<p class="text-muted-foreground mb-3 leading-relaxed">${line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}</p>`;
    }
  }
  return html;
}

export default function LegalPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, "");

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => apiClient.get(`/pages/${slug}`).then(r => r.data),
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Selovox
          </Link>
          <Link href="/register">
            <span className="text-sm text-muted-foreground hover:text-white transition-colors">Start Free →</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : error || !page ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-foreground mx-auto mb-3" />
            <h1 className="text-xl font-bold text-muted-foreground">Page not found</h1>
          </div>
        ) : (
          <>
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
              className="prose-custom"
            />
            <p className="text-foreground text-xs mt-12 border-t border-slate-800 pt-6">
              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </p>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
