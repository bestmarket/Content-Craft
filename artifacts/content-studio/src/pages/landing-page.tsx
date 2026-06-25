import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Copy, Download, ExternalLink } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export default function LandingPageGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [price, setPrice] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [benefits, setBenefits] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"form" | "preview">("form");
  const [previewKey, setPreviewKey] = useState(0);

  const handleGenerate = async () => {
    if (!topic.trim() || !productTitle.trim()) {
      toast({ title: "Topic and product title are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/landing-page/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, productTitle, price, targetAudience, benefits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setPreviewKey(k => k + 1);
      setTab("preview");
      toast({ title: "Landing page generated!", description: "JVZoo-style sales page ready" });
    } catch (e: any) {
      toast({ title: e.message ?? "Generation failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHtml = () => {
    if (!result) return;
    const html = buildHtml(result);
    navigator.clipboard.writeText(html);
    toast({ title: "Full HTML copied!", description: "Paste into any web host or file" });
  };

  const handleDownload = () => {
    if (!result) return;
    const html = buildHtml(result);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productTitle.slice(0, 30).replace(/\s+/g, "-")}-sales-page.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenBlank = () => {
    if (!result) return;
    const html = buildHtml(result);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Landing Page Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate a <span className="font-semibold text-primary">high-converting JVZoo-style sales page</span> — mobile-first, countdown timer, trust badges, 3D book mockup
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "form" ? "default" : "outline"} size="sm" onClick={() => setTab("form")}>
          Build Page
        </Button>
        {result && (
          <Button variant={tab === "preview" ? "default" : "outline"} size="sm" onClick={() => setTab("preview")}>
            Preview
          </Button>
        )}
      </div>

      {tab === "form" && (
        <Card className="p-6 border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Product Title *</Label>
              <Input
                placeholder="e.g. The 7-Figure Dropshipping Blueprint"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Niche / Topic *</Label>
              <Input
                placeholder="e.g. E-commerce, dropshipping"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Price (optional)</Label>
              <Input
                placeholder="e.g. $47"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Target Audience (optional)</Label>
              <Input
                placeholder="e.g. Beginner entrepreneurs aged 18-35"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Key Benefits (optional)</Label>
            <Textarea
              placeholder="List what customers will gain from your product..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-t">
            {[
              { icon: "⏱", text: "15-min countdown timer built-in" },
              { icon: "📱", text: "Mobile-first / WhatsApp ready" },
              { icon: "🔒", text: "Trust badges + pulsing CTA" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                <span>{icon}</span>
                <span className="text-xs text-primary font-medium leading-tight">{text}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-base font-semibold"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Building JVZoo Sales Page...</>
              : <><Globe className="w-4 h-4 mr-2" /> Generate High-Converting Sales Page</>}
          </Button>
        </Card>
      )}

      {tab === "preview" && result && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleCopyHtml} variant="outline">
              <Copy className="w-4 h-4 mr-2" /> Copy HTML
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Download .html
            </Button>
            <Button onClick={handleOpenBlank} className="bg-primary hover:bg-primary/90">
              <ExternalLink className="w-4 h-4 mr-2" /> Open Full Page
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden shadow-xl bg-slate-950">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 bg-slate-700 rounded text-xs text-muted-foreground text-center py-0.5 px-3 mx-4 font-mono">
                {productTitle.slice(0, 40)} — Sales Page
              </div>
            </div>
            <iframe
              key={previewKey}
              srcDoc={buildHtml(result)}
              className="w-full"
              style={{ height: "700px", border: "none" }}
              title="Landing Page Preview"
              sandbox="allow-scripts"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Preview above. Click "Open Full Page" to see it in your browser exactly as visitors will.
          </p>
        </div>
      )}
    </div>
  );
}

function esc(str: string = ""): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHtml(result: any): string {
  const title = esc(result.productTitle ?? "");
  const price = result.pricingSection?.currentPrice ?? "47";
  const origPrice = result.pricingSection?.originalPrice ?? "97";
  const imagePrompt = encodeURIComponent(`professional premium ebook cover ${result.productTitle} dark luxury gold`);
  const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=300&height=420&nologo=true&seed=42`;

  const benefitItems = (result.benefitsSection?.benefits ?? [])
    .map((b: any) => `
      <div class="benefit-item">
        <div class="check-icon">✓</div>
        <div>
          <div class="benefit-title">${esc(b.title)}</div>
          <div class="benefit-desc">${esc(b.description)}</div>
        </div>
      </div>`).join("");

  const testimonialItems = (result.socialProof?.testimonials ?? [])
    .map((t: any) => `
      <div class="testimonial-card">
        <div class="stars">${"★".repeat(t.rating ?? 5)}</div>
        <div class="testimonial-text">"${esc(t.text)}"</div>
        <div class="testimonial-author">
          <strong>${esc(t.name)}</strong>
          <span>${esc(t.role)}</span>
        </div>
      </div>`).join("");

  const includedItems = (result.pricingSection?.includedItems ?? [])
    .map((item: string) => `<div class="included-item"><span class="check-green">✓</span> ${esc(item)}</div>`).join("");

  const problemPoints = (result.problemSection?.points ?? [])
    .map((p: string) => `<div class="problem-item"><span class="x-red">✗</span> ${esc(p)}</div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="theme-color" content="#0a0a1a">
<title>${title} — Official Sales Page</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Montserrat',Arial,sans-serif;background:#0a0a1a;color:#f1f5f9;-webkit-font-smoothing:antialiased;overflow-x:hidden}

  /* ── SCARCITY BAR ────────────────────────────────── */
  .scarcity-bar{background:linear-gradient(90deg,#7f1d1d,#991b1b,#7f1d1d);text-align:center;padding:10px 16px;font-size:.78rem;font-weight:700;letter-spacing:.05em;color:#fecaca;border-bottom:2px solid #ef4444;animation:scarcity-pulse 2s ease-in-out infinite}
  @keyframes scarcity-pulse{0%,100%{background:linear-gradient(90deg,#7f1d1d,#991b1b,#7f1d1d)}50%{background:linear-gradient(90deg,#991b1b,#b91c1c,#991b1b)}}

  /* ── HERO ───────────────────────────────────────── */
  .hero{background:linear-gradient(160deg,#0a0a1a 0%,#1a0533 40%,#0d0d2b 100%);padding:50px 20px 60px;text-align:center;position:relative;overflow:hidden;border-bottom:1px solid rgba(124,58,237,.3)}
  .hero::before{content:'';position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%);pointer-events:none}
  .badge{display:inline-block;background:rgba(234,179,8,.15);border:1px solid rgba(234,179,8,.4);color:#fbbf24;padding:6px 18px;border-radius:50px;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px}
  .hero-headline{font-size:clamp(1.6rem,5vw,2.6rem);font-weight:900;line-height:1.15;margin-bottom:16px;color:#fff}
  .hero-headline .highlight-yellow{color:#fbbf24;display:inline}
  .hero-headline .highlight-red{color:#f87171;display:inline}
  .hero-subline{font-size:clamp(.95rem,2.5vw,1.15rem);color:#94a3b8;max-width:600px;margin:0 auto 30px;line-height:1.6}

  /* ── BOOK MOCKUP ────────────────────────────────── */
  .book-wrap{display:flex;justify-content:center;margin:28px 0 10px;perspective:900px}
  .book-3d{position:relative;width:180px;transform:rotateY(-12deg) rotateX(3deg);transform-style:preserve-3d;transition:transform .4s ease;filter:drop-shadow(-12px 20px 40px rgba(0,0,0,.8))}
  .book-3d:hover{transform:rotateY(-5deg) rotateX(1deg) scale(1.04)}
  .book-cover{width:180px;height:252px;border-radius:4px 10px 10px 4px;overflow:hidden;position:relative;box-shadow:6px 0 20px rgba(0,0,0,.6)}
  .book-cover img{width:100%;height:100%;object-fit:cover;display:block}
  .book-cover-fallback{width:100%;height:100%;background:linear-gradient(145deg,#1e1b4b,#4c1d95,#1e1b4b);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}
  .book-cover-fallback .fallback-title{font-size:.75rem;font-weight:900;color:#e9d5ff;line-height:1.3;text-transform:uppercase;letter-spacing:.06em}
  .book-gloss{position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,255,255,.18) 0%,transparent 100%);border-radius:4px 10px 0 0;pointer-events:none}
  .book-spine{position:absolute;left:-14px;top:4px;bottom:4px;width:14px;background:linear-gradient(90deg,#1e0a4b,#3b0f8a);border-radius:3px 0 0 3px;transform:rotateY(-90deg);transform-origin:right center}

  /* ── COUNTDOWN ──────────────────────────────────── */
  .countdown-wrap{background:linear-gradient(135deg,#1c0505,#3b0404);border:2px solid #ef4444;border-radius:14px;padding:20px 24px;margin:30px auto;max-width:480px;text-align:center;box-shadow:0 0 30px rgba(239,68,68,.25)}
  .countdown-label{font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fca5a5;margin-bottom:10px}
  .countdown-digits{display:flex;justify-content:center;gap:12px;align-items:center}
  .digit-box{background:#0a0a1a;border:1px solid rgba(239,68,68,.4);border-radius:8px;padding:10px 14px;min-width:56px}
  .digit-num{font-size:2rem;font-weight:900;color:#ef4444;line-height:1;display:block}
  .digit-label{font-size:.6rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-top:2px;display:block}
  .digit-sep{font-size:1.8rem;font-weight:900;color:#ef4444;align-self:flex-start;padding-top:8px}
  .countdown-sub{font-size:.75rem;color:#94a3b8;margin-top:10px}

  /* ── CTA BUTTON ─────────────────────────────────── */
  .cta-primary{display:block;width:100%;max-width:480px;margin:0 auto;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;font-size:1.15rem;font-weight:900;padding:20px 24px;border-radius:12px;border:none;cursor:pointer;text-align:center;text-decoration:none;letter-spacing:.02em;line-height:1.3;animation:cta-pulse 2.2s ease-in-out infinite;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(22,163,74,.45)}
  .cta-primary::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmer 2.5s infinite}
  @keyframes cta-pulse{0%,100%{box-shadow:0 8px 32px rgba(22,163,74,.45),0 0 0 0 rgba(22,163,74,.5)}50%{box-shadow:0 8px 40px rgba(22,163,74,.65),0 0 0 12px rgba(22,163,74,0)}}
  @keyframes shimmer{0%{left:-100%}100%{left:200%}}
  .cta-sub{font-size:.7rem;font-weight:400;opacity:.85;display:block;margin-top:4px}
  .trust-badges{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:14px}
  .trust-badge{display:flex;align-items:center;gap:6px;font-size:.7rem;color:#64748b;font-weight:600}
  .trust-badge .icon{font-size:1rem}

  /* ── SECTIONS ───────────────────────────────────── */
  .section{padding:52px 20px;max-width:860px;margin:0 auto}
  .section-dark{background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06)}
  .section-headline{font-size:clamp(1.3rem,4vw,2rem);font-weight:900;text-align:center;margin-bottom:10px;color:#fff;line-height:1.2}
  .section-sub{text-align:center;color:#64748b;font-size:.9rem;margin-bottom:36px}

  /* ── PROBLEM ────────────────────────────────────── */
  .problem-item{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:flex-start;gap:14px;font-size:.92rem;color:#cbd5e1;line-height:1.5}
  .x-red{color:#ef4444;font-weight:900;font-size:1.1rem;flex-shrink:0;margin-top:1px}

  /* ── SOLUTION ───────────────────────────────────── */
  .solution-wrap{background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(219,39,119,.08));border:1px solid rgba(124,58,237,.25);border-radius:16px;padding:32px;text-align:center}
  .solution-wrap p{color:#94a3b8;font-size:1rem;line-height:1.7;max-width:620px;margin:12px auto 0}

  /* ── BENEFITS ───────────────────────────────────── */
  .benefits-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
  .benefit-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px 20px;display:flex;gap:14px;align-items:flex-start}
  .check-icon{width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#db2777);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem;flex-shrink:0;margin-top:2px}
  .benefit-title{font-weight:700;font-size:.95rem;color:#e2e8f0;margin-bottom:4px}
  .benefit-desc{font-size:.82rem;color:#64748b;line-height:1.55}

  /* ── TESTIMONIALS ───────────────────────────────── */
  .testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
  .testimonial-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:22px;position:relative}
  .testimonial-card::before{content:'"';position:absolute;top:10px;right:16px;font-size:3rem;color:rgba(124,58,237,.2);font-family:Georgia,serif;line-height:1}
  .stars{color:#f59e0b;font-size:1rem;margin-bottom:10px;letter-spacing:2px}
  .testimonial-text{font-size:.88rem;color:#94a3b8;line-height:1.6;font-style:italic;margin-bottom:14px}
  .testimonial-author{display:flex;flex-direction:column;gap:2px}
  .testimonial-author strong{font-size:.88rem;color:#e2e8f0}
  .testimonial-author span{font-size:.75rem;color:#475569}

  /* ── PRICING ────────────────────────────────────── */
  .pricing-outer{background:linear-gradient(160deg,#0f0f2e,#1a0533);border-top:1px solid rgba(124,58,237,.2);padding:60px 20px}
  .pricing-box{background:linear-gradient(145deg,#0f172a,#1e1b4b);border:2px solid rgba(124,58,237,.5);border-radius:20px;padding:36px 28px;max-width:460px;margin:0 auto;text-align:center;box-shadow:0 24px 80px rgba(124,58,237,.25),inset 0 1px 0 rgba(255,255,255,.06)}
  .price-orig{font-size:1rem;color:#475569;text-decoration:line-through;margin-bottom:4px}
  .price-now-label{font-size:.72rem;font-weight:700;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;margin-bottom:4px}
  .price-now{font-size:4rem;font-weight:900;color:#fbbf24;line-height:1;margin-bottom:8px}
  .price-note{font-size:.75rem;color:#475569;margin-bottom:28px}
  .included-item{text-align:left;padding:8px 0;font-size:.87rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px}
  .check-green{color:#10b981;font-weight:900}
  .guarantee-box{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:12px 16px;margin:20px 0;font-size:.8rem;color:#6ee7b7;line-height:1.5}

  /* ── FINAL CTA ──────────────────────────────────── */
  .final-section{background:linear-gradient(160deg,#0a0a1a,#1a0533,#0a0a1a);padding:60px 20px;text-align:center;border-top:1px solid rgba(124,58,237,.2)}
  .final-urgency{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:10px;display:inline-block;padding:8px 20px;font-size:.78rem;font-weight:700;color:#fca5a5;letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px}

  /* ── FOOTER ─────────────────────────────────────── */
  .footer{background:#050510;padding:24px 20px;text-align:center;border-top:1px solid rgba(255,255,255,.05)}
  .footer p{font-size:.72rem;color:#334155;line-height:1.7}

  /* ── MOBILE ─────────────────────────────────────── */
  @media(max-width:600px){
    .hero{padding:36px 16px 48px}
    .book-3d{width:150px;transform:rotateY(-8deg) rotateX(2deg)}
    .book-cover{width:150px;height:210px}
    .digit-box{min-width:46px;padding:8px 10px}
    .digit-num{font-size:1.6rem}
    .pricing-box{padding:28px 18px}
    .price-now{font-size:3rem}
    .section{padding:40px 16px}
  }
</style>
</head>
<body>

<!-- SCARCITY BAR -->
<div class="scarcity-bar">
  🔥 LIMITED TIME OFFER — This price expires when the timer hits zero!
</div>

<!-- HERO -->
<div class="hero">
  <div class="badge">⚡ OFFICIAL RELEASE — Special Founder's Price</div>
  <h1 class="hero-headline">${result.heroHeadline?.replace(/\b(FREE|PROVEN|GUARANTEED|INSTANT|SECRET|REVEALED)\b/g, '<span class="highlight-yellow">$1</span>').replace(/\b(WARNING|STOP|URGENT|CRITICAL)\b/g, '<span class="highlight-red">$1</span>') ?? esc(result.heroHeadline)}</h1>
  <p class="hero-subline">${esc(result.heroSubheadline)}</p>

  <!-- 3D BOOK MOCKUP -->
  <div class="book-wrap">
    <div class="book-3d">
      <div class="book-cover" id="book-cover">
        <img
          src="${imageUrl}"
          alt="${title} cover"
          style="width:100%;height:100%;object-fit:cover;display:block"
          onerror="this.style.display='none';document.getElementById('book-fallback').style.display='flex'"
          onload="document.getElementById('book-fallback').style.display='none'"
        />
        <div id="book-fallback" class="book-cover-fallback" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0">
          <div class="fallback-title">${title}</div>
        </div>
        <div class="book-gloss"></div>
      </div>
      <div class="book-spine"></div>
    </div>
  </div>

  <!-- COUNTDOWN TIMER -->
  <div class="countdown-wrap">
    <div class="countdown-label">⚠️ Special Price Expires In:</div>
    <div class="countdown-digits">
      <div class="digit-box"><span class="digit-num" id="cd-min">15</span><span class="digit-label">Mins</span></div>
      <div class="digit-sep">:</div>
      <div class="digit-box"><span class="digit-num" id="cd-sec">00</span><span class="digit-label">Secs</span></div>
    </div>
    <div class="countdown-sub">Price increases once timer expires — don't miss this.</div>
  </div>

  <a href="#order" class="cta-primary">
    ✅ YES — Give Me Instant Access Now!
    <span class="cta-sub">Secure Checkout • Instant Download • 30-Day Guarantee</span>
  </a>
  <div class="trust-badges">
    <div class="trust-badge"><span class="icon">🔒</span> 256-bit SSL Secure</div>
    <div class="trust-badge"><span class="icon">💳</span> Secure Payment</div>
    <div class="trust-badge"><span class="icon">✅</span> 30-Day Money Back</div>
    <div class="trust-badge"><span class="icon">⚡</span> Instant Access</div>
  </div>
</div>

<!-- PROBLEM SECTION -->
<div class="section-dark" style="padding:52px 20px">
  <div class="section" style="padding:0">
    <h2 class="section-headline" style="color:#f87171">⛔ Does This Sound Familiar?</h2>
    <p class="section-sub">${esc(result.problemSection?.headline)}</p>
    ${problemPoints}
  </div>
</div>

<!-- SOLUTION -->
<div style="padding:52px 20px">
  <div class="section" style="padding:0">
    <div class="solution-wrap">
      <h2 class="section-headline" style="color:#a78bfa">💡 Introducing: ${title}</h2>
      <p>${esc(result.solutionSection?.description)}</p>
    </div>
  </div>
</div>

<!-- BENEFITS -->
<div class="section-dark" style="padding:52px 20px">
  <div class="section" style="padding:0">
    <h2 class="section-headline">🎯 ${esc(result.benefitsSection?.headline)}</h2>
    <p class="section-sub">Everything you get when you say YES today</p>
    <div class="benefits-grid">
      ${benefitItems}
    </div>
  </div>
</div>

<!-- TESTIMONIALS -->
<div style="padding:52px 20px">
  <div class="section" style="padding:0">
    <h2 class="section-headline">⭐ ${esc(result.socialProof?.headline)}</h2>
    <p class="section-sub">Real results from real people</p>
    <div class="testimonials-grid">
      ${testimonialItems}
    </div>
  </div>
</div>

<!-- PRICING -->
<div id="order" class="pricing-outer">
  <div class="section" style="padding:0">
    <h2 class="section-headline">${esc(result.pricingSection?.headline)}</h2>
    <p class="section-sub">One-time payment — No subscriptions — No hidden fees</p>
    <div class="pricing-box">
      <div class="price-orig">Regular Price: $${esc(origPrice)}</div>
      <div class="price-now-label">Today Only</div>
      <div class="price-now">$${esc(price)}</div>
      <div class="price-note">One-time investment • Instant access after payment</div>
      <div>
        ${includedItems}
      </div>
      <div class="guarantee-box">
        🛡️ ${esc(result.pricingSection?.guarantee)}
      </div>
      <a href="#" class="cta-primary">
        🔐 Add to Cart — Get Instant Access
        <span class="cta-sub">Secure Checkout · SSL Encrypted · Instant Download</span>
      </a>
      <div class="trust-badges" style="margin-top:16px">
        <div class="trust-badge"><span class="icon">🔒</span> SSL Secure</div>
        <div class="trust-badge"><span class="icon">💳</span> Safe Payment</div>
        <div class="trust-badge"><span class="icon">💰</span> Money-Back</div>
      </div>
    </div>
  </div>
</div>

<!-- FINAL CTA -->
<div class="final-section">
  <div class="final-urgency">⚠️ Warning: Price Increases Soon</div>
  <h2 class="section-headline" style="margin-bottom:10px">${esc(result.finalCta?.headline)}</h2>
  <p style="color:#475569;font-size:.9rem;max-width:520px;margin:0 auto 28px;line-height:1.6">${esc(result.finalCta?.subtext)}</p>
  <a href="#order" class="cta-primary" style="max-width:420px">
    ${esc(result.finalCta?.buttonText)} — Claim Your Copy Now →
    <span class="cta-sub">30-Day Money-Back Guarantee • No Risk</span>
  </a>
</div>

<!-- FOOTER -->
<div class="footer">
  <p>© ${new Date().getFullYear()} ${title}. All Rights Reserved.<br>
  This page is not affiliated with or endorsed by any third party.<br>
  Results may vary. Testimonials are from real customers but individual results are not guaranteed.<br>
  <a href="#" style="color:#7c3aed;text-decoration:none">Privacy Policy</a> &nbsp;·&nbsp;
  <a href="#" style="color:#7c3aed;text-decoration:none">Terms of Service</a> &nbsp;·&nbsp;
  <a href="#" style="color:#7c3aed;text-decoration:none">Contact</a>
  </p>
</div>

<script>
(function(){
  var total = 15 * 60;
  var stored = sessionStorage.getItem('vc_countdown');
  if(stored){ total = parseInt(stored,10); }
  function tick(){
    if(total <= 0){ total = 0; }
    var m = Math.floor(total / 60);
    var s = total % 60;
    var em = document.getElementById('cd-min');
    var es = document.getElementById('cd-sec');
    if(em) em.textContent = (m < 10 ? '0' : '') + m;
    if(es) es.textContent = (s < 10 ? '0' : '') + s;
    if(total > 0){
      total--;
      sessionStorage.setItem('vc_countdown', total.toString());
      setTimeout(tick, 1000);
    } else {
      var cw = document.querySelector('.countdown-wrap');
      if(cw){ cw.innerHTML = '<div style="font-weight:900;color:#ef4444;font-size:1rem;padding:8px 0">⛔ OFFER EXPIRED — PRICE HAS INCREASED</div>'; }
    }
  }
  tick();
})();
</script>
</body>
</html>`;
}
