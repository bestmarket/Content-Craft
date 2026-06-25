import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, Lock, ExternalLink, LogOut } from "lucide-react";

export default function SaasApp() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const token = new URLSearchParams(window.location.search).get("token");

  const { data, isLoading, error } = useQuery({
    queryKey: ["saas-app-access", slug, token],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const res = await fetch(`/api/saas/public/${slug}/access/${token}`);
      if (!res.ok) throw new Error("Access denied");
      return res.json();
    },
    enabled: !!token && !!slug,
    retry: false,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Access Required</h1>
          <p className="text-muted-foreground text-sm">You need a valid access token to use this tool.</p>
          <button
            onClick={() => navigate(`/saas/${slug}`)}
            className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            Get Access →
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Validating your access...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground text-sm">Your access token is invalid or has expired.</p>
          <button
            onClick={() => navigate(`/saas/${slug}`)}
            className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
          >
            Subscribe to Get Access
          </button>
        </div>
      </div>
    );
  }

  const brandColor = data.brandColor || "#7c3aed";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0"
        style={{ background: brandColor }}>
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-sm">{data.appName}</h1>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            {data.tier}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span className="hidden sm:block">{data.email}</span>
          <button
            onClick={() => navigate(`/saas/${slug}`)}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Landing Page
          </button>
        </div>
      </div>

      {/* App Iframe */}
      <div className="flex-1 relative">
        {data.appHtml ? (
          <AppSandbox html={data.appHtml} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-5xl mb-4">🚧</div>
              <p className="text-lg font-semibold">App content coming soon</p>
              <p className="text-sm mt-1">The creator hasn't uploaded the app yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppSandbox({ html }: { html: string }) {
  useEffect(() => {
    const iframe = document.getElementById("saas-tool-iframe") as HTMLIFrameElement;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  return (
    <iframe
      id="saas-tool-iframe"
      title="SaaS Tool"
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
    />
  );
}
