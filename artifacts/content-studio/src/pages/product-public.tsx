import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Loader2, ArrowRight, CheckCircle, Star, Shield, ChevronDown, ChevronUp } from "lucide-react";
import RecentBuyerToast from "@/components/RecentBuyerToast";

/* ── Countdown hook ─────────────────────────────────────────────── */
function useCountdown(productId: string) {
  const KEY = `vc_cd_${productId}`;
  const [secs, setSecs] = useState(() => {
    const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(KEY) : null;
    return stored ? parseInt(stored, 10) : 15 * 60;
  });
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => {
      const next = secs - 1;
      setSecs(next);
      sessionStorage.setItem(KEY, String(next));
    }, 1000);
    return () => clearTimeout(t);
  });
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return { m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0"), expired: secs <= 0 };
}

/* ── Stored hero image (base64 from Gemini, no live external load) ── */
function HeroImage({
  src,
  style: imgStyle = {},
  className = "",
}: {
  src: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        background: "linear-gradient(135deg,#1a0533,#0d0d2b)",
        ...imgStyle,
      }}
    >
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#1a0533,#0d0d2b)",
        }}>
          <Loader2 style={{ width: 24, height: 24, color: "#7c3aed", animation: "spin 1s linear infinite" }} />
        </div>
      )}
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0, transition: "opacity .5s ease",
        }}
      />
    </div>
  );
}

/* ── 3D Book mockup ─────────────────────────────────────────────── */
function BookMockup({ title, coverImageUrl, topic }: { title: string; coverImageUrl?: string; topic?: string }) {
  const [imgOk, setImgOk] = useState<boolean | null>(null);
  const prompt = encodeURIComponent(`professional premium ebook cover for "${title}" ${topic ?? ""} dark luxury gold foil typography high quality`);
  const src = coverImageUrl || `https://image.pollinations.ai/prompt/${prompt}?width=300&height=420&nologo=true&seed=77`;

  return (
    <div style={{ perspective: "900px", display: "flex", justifyContent: "center", marginBottom: 8 }}>
      <div
        style={{
          position: "relative",
          transform: "rotateY(-14deg) rotateX(3deg)",
          transformStyle: "preserve-3d",
          filter: "drop-shadow(-18px 28px 60px rgba(0,0,0,.9))",
          transition: "transform .4s ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "rotateY(-6deg) rotateX(1deg) scale(1.05)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "rotateY(-14deg) rotateX(3deg)")}
      >
        <div style={{ width: 180, height: 252, borderRadius: "4px 12px 12px 4px", overflow: "hidden", position: "relative", boxShadow: "6px 0 28px rgba(0,0,0,.7)" }}>
          {imgOk !== false && (
            <img
              src={src} alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onLoad={() => setImgOk(true)}
              onError={() => setImgOk(false)}
            />
          )}
          {(imgOk === false || imgOk === null) && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(145deg,#1e1b4b,#4c1d95,#1e1b4b)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 14, textAlign: "center", opacity: imgOk === null ? 0 : 1,
            }}>
              <div style={{ fontSize: ".7rem", fontWeight: 900, color: "#e9d5ff", lineHeight: 1.3, textTransform: "uppercase", letterSpacing: ".06em" }}>
                {title}
              </div>
            </div>
          )}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,.15) 0%,transparent 100%)", borderRadius: "4px 12px 0 0", pointerEvents: "none" }} />
        </div>
        <div style={{ position: "absolute", left: -14, top: 4, bottom: 4, width: 14, background: "linear-gradient(90deg,#1e0a4b,#3b0f8a)", borderRadius: "3px 0 0 3px", transform: "rotateY(-90deg)", transformOrigin: "right center" }} />
      </div>
    </div>
  );
}

/* ── FAQ accordion item ─────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}
      >
        <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: ".93rem", lineHeight: 1.4, textAlign: "left" }}>{q}</span>
        {open
          ? <ChevronUp style={{ width: 18, height: 18, color: "#7c3aed", flexShrink: 0 }} />
          : <ChevronDown style={{ width: 18, height: 18, color: "#475569", flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px 20px", fontSize: ".88rem", color: "#64748b", lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function ProductPublic() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const cd = useCountdown(params.id ?? "0");

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["public-product", params.id],
    queryFn: () => apiClient.get(`/product/${params.id}/public`).then(r => r.data),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a1a" }}>
        <Loader2 style={{ width: 36, height: 36, color: "#7c3aed", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a1a" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📦</div>
          <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>Product Not Found</h1>
          <p style={{ color: "#475569", fontSize: ".9rem" }}>This product may be unpublished or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (product.previewMode || !product.isPublished) {
    const isPending = product.isPendingReview || product.publishStatus === "pending_approval";
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          {product.coverImageUrl && (
            <div style={{ width: 160, height: 220, margin: "0 auto 28px", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(124,58,237,.4)" }}>
              <img src={product.coverImageUrl} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ display: "inline-block", background: isPending ? "rgba(251,191,36,.12)" : "rgba(124,58,237,.12)", border: `1px solid ${isPending ? "rgba(251,191,36,.35)" : "rgba(124,58,237,.35)"}`, color: isPending ? "#fbbf24" : "#a78bfa", padding: "5px 18px", borderRadius: 50, fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 }}>
            {isPending ? "⏳ Under Review" : "🔒 Coming Soon"}
          </div>
          <h1 style={{ fontSize: "clamp(1.3rem,4vw,2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12 }}>{product.title}</h1>
          {product.subtitle && <p style={{ color: "#64748b", fontSize: ".95rem", lineHeight: 1.65, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>{product.subtitle}</p>}
          <div style={{ background: isPending ? "rgba(251,191,36,.07)" : "rgba(124,58,237,.07)", border: `1px solid ${isPending ? "rgba(251,191,36,.2)" : "rgba(124,58,237,.2)"}`, borderRadius: 14, padding: "20px 24px", color: isPending ? "#fde68a" : "#c4b5fd", fontSize: ".88rem", lineHeight: 1.6, marginBottom: 28 }}>
            {isPending ? "This product has been submitted for review. Once approved it will be live." : "This product is not yet available for purchase. Check back soon!"}
          </div>
          {product.price && <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fbbf24", marginBottom: 8 }}>${Number(product.price).toFixed(2)}</div>}
          <p style={{ color: "#334155", fontSize: ".75rem" }}>Powered by <a href="/" style={{ color: "#7c3aed", textDecoration: "none" }}>Selovox</a></p>
        </div>
      </div>
    );
  }

  const lp = product.landingPage as any;
  const topic = product.topic ?? product.title ?? "digital product";
  const checkoutUrl = `/product/${params.id}/checkout`;

  const goToCheckout = () => navigate(checkoutUrl);


  // Collect testimonials
  const testimonials: any[] =
    lp?.socialProof?.testimonials ??
    lp?.testimonialsSection?.items ??
    lp?.testimonialsSection?.testimonials ?? [];

  // Collect FAQ
  const faqItems: any[] =
    lp?.faqSection?.items ??
    lp?.faqSection?.faqs ??
    lp?.faq?.items ?? [];

  // Benefits
  const benefits: any[] = lp?.benefitsSection?.benefits ?? lp?.benefitsSection?.items ?? [];

  // What's included
  const includedItems: string[] = lp?.whatsIncluded?.items ?? product.landingPage?.pricingSection?.includedItems ?? [];

  // Problem points
  const problemPoints: string[] = lp?.problemSection?.points ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;max-width:100vw}
        body{font-family:'Montserrat',system-ui,sans-serif;background:#0a0a1a;color:#f1f5f9;-webkit-font-smoothing:antialiased}
        @keyframes vc-pulse{0%,100%{box-shadow:0 8px 32px rgba(22,163,74,.45),0 0 0 0 rgba(22,163,74,.5)}50%{box-shadow:0 8px 40px rgba(22,163,74,.65),0 0 0 14px rgba(22,163,74,0)}}
        @keyframes scarcity{0%,100%{background:linear-gradient(90deg,#7f1d1d,#991b1b,#7f1d1d)}50%{background:linear-gradient(90deg,#991b1b,#b91c1c,#991b1b)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{left:-100%}100%{left:200%}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,.3)}50%{box-shadow:0 0 40px rgba(124,58,237,.6),0 0 80px rgba(219,39,119,.2)}}
        .vc-cta-btn:hover{transform:translateY(-2px)!important;box-shadow:0 12px 40px rgba(22,163,74,.6)!important}
        .vc-cta-btn{transition:all .2s!important}
        .vc-sticky-bar{position:fixed;bottom:0;left:0;right:0;z-index:999;padding:14px 20px;background:linear-gradient(90deg,#0d1117,#0a0a1a);border-top:2px solid rgba(22,163,74,.4);display:flex;align-items:center;justify-content:space-between;gap:12;backdrop-filter:blur(12px)}
        @media(max-width:640px){
          .vc-hero{padding:32px 16px 48px!important}
          .vc-section{padding:36px 16px!important}
          .vc-benefits-grid{grid-template-columns:1fr!important}
          .vc-testimonial-grid{grid-template-columns:1fr!important}
          .vc-two-col{flex-direction:column!important}
          .vc-sticky-price{display:none!important}
        }
      `}</style>

      {/* ── SCARCITY BAR ── */}
      <div style={{ background: "linear-gradient(90deg,#7f1d1d,#991b1b,#7f1d1d)", textAlign: "center", padding: "10px 16px", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".05em", color: "#fecaca", borderBottom: "2px solid #ef4444", animation: "scarcity 2s ease-in-out infinite" }}>
        🔥 LIMITED TIME OFFER — Price increases when the timer hits zero!
      </div>

      {/* ── HERO ── */}
      <div className="vc-hero" style={{ background: "linear-gradient(160deg,#0a0a1a 0%,#1a0533 40%,#0d0d2b 100%)", padding: "60px 20px 72px", position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(124,58,237,.3)" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: "radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -100, width: 500, height: 500, background: "radial-gradient(circle,rgba(219,39,119,.1) 0%,transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(234,179,8,.12)", border: "1px solid rgba(234,179,8,.35)", color: "#fbbf24", padding: "6px 18px", borderRadius: 50, fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 24, animation: "fadeInUp .6s ease" }}>
            ⚡ Digital Product — Instant Download
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(1.7rem,5.5vw,3rem)", fontWeight: 900, lineHeight: 1.1, color: "#fff", textAlign: "center", maxWidth: 800, margin: "0 auto 16px", animation: "fadeInUp .7s ease" }}>
            {lp?.heroHeadline ?? product.title}
          </h1>
          <p style={{ fontSize: "clamp(.95rem,2.5vw,1.15rem)", color: "#94a3b8", textAlign: "center", maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.7, animation: "fadeInUp .8s ease" }}>
            {lp?.heroSubheadline ?? product.subtitle ?? product.aboutSection}
          </p>

          {/* Hero two-column layout */}
          <div className="vc-two-col" style={{ display: "flex", alignItems: "center", gap: 48, width: "100%", maxWidth: 900, justifyContent: "center" }}>
            {/* Left: Book + stats */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flexShrink: 0 }}>
              <div style={{ animation: "float 4s ease-in-out infinite" }}>
                <BookMockup title={product.title} coverImageUrl={product.coverImageUrl} topic={topic} />
              </div>

              {/* Rating */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: "1.1rem", color: "#f59e0b" }}>★</span>)}
                </div>
                <span style={{ fontSize: ".72rem", color: "#475569", fontWeight: 600 }}>
                  {(product.totalSales ?? 0) > 0 ? `${product.totalSales.toLocaleString()} happy customers` : "Premium digital guide"}
                </span>
              </div>
            </div>

            {/* Right: Hero image + countdown */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
              {/* AI-generated hero image — stored as base64 in landing page data */}
              {lp?.heroImage ? (
                <HeroImage
                  src={lp.heroImage}
                  style={{ width: "100%", height: 220, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: 220, borderRadius: 16,
                  background: "linear-gradient(135deg,#1a0533 0%,#2d1b69 50%,#0d0d2b 100%)",
                  boxShadow: "0 20px 60px rgba(0,0,0,.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, background: "radial-gradient(circle,rgba(124,58,237,.35) 0%,transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: -30, left: -30, width: 160, height: 160, background: "radial-gradient(circle,rgba(219,39,119,.2) 0%,transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ textAlign: "center", position: "relative" }}>
                    <div style={{ fontSize: "3rem", marginBottom: 8 }}>✨</div>
                    <div style={{ color: "#a78bfa", fontSize: ".8rem", fontWeight: 700 }}>{topic}</div>
                  </div>
                </div>
              )}

              {/* Countdown */}
              <div style={{ background: "linear-gradient(135deg,#1c0505,#3b0404)", border: "2px solid #ef4444", borderRadius: 14, padding: "16px 20px", boxShadow: "0 0 28px rgba(239,68,68,.22)" }}>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#fca5a5", marginBottom: 10, textAlign: "center" }}>
                  ⚠️ Special price expires in:
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}>
                  {[["mm", cd.m], ["ss", cd.s]].map(([lbl, val], i) => (
                    <>
                      <div key={lbl as string} style={{ background: "#0a0a1a", border: "1px solid rgba(239,68,68,.35)", borderRadius: 8, padding: "8px 14px", minWidth: 52, textAlign: "center" }}>
                        <span style={{ display: "block", fontSize: "1.9rem", fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{val}</span>
                        <span style={{ display: "block", fontSize: ".55rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 2 }}>{lbl === "mm" ? "mins" : "secs"}</span>
                      </div>
                      {i === 0 && <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ef4444", alignSelf: "flex-start", paddingTop: 6 }}>:</span>}
                    </>
                  ))}
                </div>
                {cd.expired && <div style={{ color: "#ef4444", fontWeight: 700, fontSize: ".8rem", marginTop: 8, textAlign: "center" }}>⛔ Offer Expired — Price Has Increased</div>}
              </div>
            </div>
          </div>

          {/* CTA button */}
          <button
            className="vc-cta-btn"
            onClick={goToCheckout}
            style={{
              marginTop: 40,
              background: "linear-gradient(135deg,#16a34a,#15803d)",
              color: "#fff", border: "none", borderRadius: 14,
              padding: "20px 48px", fontSize: "1.15rem", fontWeight: 900,
              cursor: "pointer", animation: "vc-pulse 2.2s ease-in-out infinite",
              boxShadow: "0 8px 36px rgba(22,163,74,.5)",
              display: "inline-flex", alignItems: "center", gap: 10,
            }}
          >
            {lp?.heroCta ?? "Get Instant Access"} — ${Number(product.price).toFixed(2)}
            <ArrowRight style={{ width: 20, height: 20 }} />
          </button>

          {/* Price note */}
          {Number(product.originalPrice) > Number(product.price) && (
            <p style={{ marginTop: 10, fontSize: ".8rem", color: "#475569" }}>
              <span style={{ textDecoration: "line-through", color: "#374151" }}>${Number(product.originalPrice).toFixed(2)}</span>
              {" "}→{" "}
              <span style={{ color: "#4ade80", fontWeight: 700 }}>${Number(product.price).toFixed(2)} today only</span>
            </p>
          )}

          {/* Trust row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
            {[["🔒", "256-bit SSL"], ["💳", "Secure Payment"], ["✅", "30-Day Guarantee"], ["⚡", "Instant Access"]].map(([icon, lbl]) => (
              <div key={lbl as string} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".68rem", color: "#475569", fontWeight: 600 }}>
                <span>{icon}</span> {lbl as string}
              </div>
            ))}
          </div>

          {/* Social proof */}
          {(product.totalSales ?? 0) > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.3)", borderRadius: 50, padding: "8px 20px", marginTop: 18, fontSize: ".75rem", fontWeight: 700, color: "#4ade80" }}>
              🔥 {product.totalSales.toLocaleString()} {product.totalSales === 1 ? "person has" : "people have"} already bought this
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Problem section */}
        {problemPoints.length > 0 && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h2 style={SECTION_H}>⛔ {lp.problemSection?.headline ?? "Does This Sound Like You?"}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                  {problemPoints.map((p: string, i: number) => (
                    <div key={i} style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.18)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14, fontSize: ".9rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                      <span style={{ color: "#ef4444", fontWeight: 900, fontSize: "1.1rem", flexShrink: 0 }}>✗</span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 320, flexShrink: 0 }}>
                <div style={{ width: "100%", height: 260, borderRadius: 16, background: "linear-gradient(135deg,#1c0505,#3b0404,#1a0a0a)", boxShadow: "0 16px 48px rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>
                  😩
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Solution section */}
        {lp?.solutionSection && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,.12),rgba(219,39,119,.08))", border: "1px solid rgba(124,58,237,.25)", borderRadius: 20, padding: "40px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle,rgba(124,58,237,.15),transparent)", pointerEvents: "none" }} />
              <h2 style={{ ...SECTION_H, marginBottom: 14 }}>💡 {lp.solutionSection.headline}</h2>
              <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.75, maxWidth: 620, margin: "0 auto 28px" }}>
                {lp.solutionSection.description}
              </p>
              <div style={{ width: "100%", maxWidth: 660, height: 260, margin: "0 auto", borderRadius: 16, background: "linear-gradient(135deg,#0d0d2b,#1a0533,#0f172a)", boxShadow: "0 20px 60px rgba(124,58,237,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>
                💡
              </div>
            </div>
          </section>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <h2 style={SECTION_H}>🎯 {lp?.benefitsSection?.headline ?? "What You'll Discover"}</h2>

            {/* Visual benefit banner */}
            <div style={{ width: "100%", height: 180, marginTop: 28, marginBottom: 32, borderRadius: 16, background: "linear-gradient(135deg,#0f172a,#1e1b4b,#0d0d2b)", boxShadow: "0 12px 40px rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 32, fontSize: "3.5rem" }}>
              🎯 ✅ 🚀
            </div>

            <div className="vc-benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
              {benefits.map((b: any, i: number) => (
                <div key={i} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "22px 20px", display: "flex", gap: 16, alignItems: "flex-start", transition: "border-color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,.4)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.08)")}
                >
                  <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#7c3aed,#db2777)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: ".85rem", color: "#fff", flexShrink: 0, marginTop: 2 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#e2e8f0", marginBottom: 6 }}>{b.title}</div>
                    <div style={{ fontSize: ".82rem", color: "#64748b", lineHeight: 1.6 }}>{b.description ?? b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Table of Contents (if no benefits) */}
        {benefits.length === 0 && product.tableOfContents && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <h2 style={SECTION_H}>📖 What's Inside</h2>
            <div style={{ width: "100%", height: 160, marginTop: 28, marginBottom: 32, borderRadius: 16, background: "linear-gradient(135deg,#0f172a,#1e1b4b,#0d0d2b)", boxShadow: "0 12px 40px rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 24, fontSize: "3rem" }}>
              📖 📚 📝
            </div>
            <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "28px 32px" }}>
              <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {(product.tableOfContents as string[]).map((ch, i) => (
                  <li key={i} style={{ display: "flex", gap: 14, fontSize: ".9rem", color: "#94a3b8" }}>
                    <span style={{ width: 26, height: 26, background: "linear-gradient(135deg,#7c3aed,#db2777)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: ".65rem", color: "#fff", flexShrink: 0 }}>{i + 1}</span>
                    {ch}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* What's Included */}
        {includedItems.length > 0 && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <h2 style={SECTION_H}>📦 {lp?.whatsIncluded?.headline ?? "Everything You Get"}</h2>
            <div style={{ maxWidth: 640, margin: "28px auto 0", display: "flex", flexDirection: "column", gap: 10 }}>
              {includedItems.map((item: string, i: number) => (
                <div key={i} style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.18)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, fontSize: ".93rem", color: "#cbd5e1" }}>
                  <CheckCircle style={{ width: 20, height: 20, color: "#10b981", flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <h2 style={SECTION_H}>⭐ {lp?.socialProof?.headline ?? lp?.testimonialsSection?.headline ?? "What Customers Are Saying"}</h2>

            {/* Social proof banner */}
            <div style={{ width: "100%", height: 140, marginTop: 24, marginBottom: 28, borderRadius: 16, background: "linear-gradient(135deg,#0f172a,#1e1b4b,#0d0d2b)", boxShadow: "0 8px 32px rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 24, fontSize: "2.5rem" }}>
              ⭐ 🌟 ✨ 🏆
            </div>

            <div className="vc-testimonial-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
              {testimonials.map((t: any, i: number) => (
                <div key={i} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "24px", position: "relative", transition: "border-color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.08)")}
                >
                  <div style={{ fontSize: "2.8rem", lineHeight: 1, color: "rgba(124,58,237,.3)", fontFamily: "Georgia,serif", marginBottom: 8 }}>"</div>
                  <div style={{ color: "#f59e0b", fontSize: ".88rem", marginBottom: 10, letterSpacing: 2 }}>{"★".repeat(t.rating ?? 5)}</div>
                  <p style={{ fontSize: ".88rem", color: "#94a3b8", lineHeight: 1.65, fontStyle: "italic", marginBottom: 14 }}>{t.text ?? t.quote ?? ""}</p>
                  {t.result && (
                    <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 8, padding: "7px 12px", marginBottom: 12, fontSize: ".75rem", color: "#6ee7b7", fontWeight: 700 }}>
                      🏆 {t.result}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".86rem", color: "#e2e8f0" }}>{t.name}</div>
                    <div style={{ fontSize: ".72rem", color: "#475569" }}>{t.role ?? t.title ?? ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Author */}
        {product.authorBio && (
          <section className="vc-section" style={{ padding: "48px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              {lp?.authorPhotoUrl ? (
                <img src={lp.authorPhotoUrl} alt="Author" style={{ width: 200, height: 240, flexShrink: 0, objectFit: "cover", borderRadius: 16, boxShadow: "0 16px 48px rgba(124,58,237,.2)" }} />
              ) : (
                <div style={{ width: 200, height: 240, flexShrink: 0, borderRadius: 16, background: "linear-gradient(135deg,#1a0533,#2d1b69,#0d0d2b)", boxShadow: "0 16px 48px rgba(124,58,237,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>
                  ✍️
                </div>
              )}
              <div style={{ flex: 1, minWidth: 240 }}>
                <h3 style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontSize: "1.1rem" }}>About the Author</h3>
                <p style={{ color: "#64748b", fontSize: ".9rem", lineHeight: 1.7 }}>{product.authorBio}</p>
                <p style={{ fontSize: ".82rem", color: "#7c3aed", fontWeight: 700, marginTop: 14 }}>— {product.authorName}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {["✍️ Expert Author", "🎓 Proven Results", "🏆 Trusted Creator"].map(b => (
                    <span key={b} style={{ background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.25)", color: "#a78bfa", padding: "4px 10px", borderRadius: 50, fontSize: ".65rem", fontWeight: 700 }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="vc-section" style={{ padding: "64px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <h2 style={SECTION_H}>❓ {lp?.faqSection?.headline ?? lp?.faq?.headline ?? "Frequently Asked Questions"}</h2>
            <div style={{ maxWidth: 700, margin: "28px auto 0" }}>
              {faqItems.map((faq: any, i: number) => (
                <FaqItem key={i} q={faq.q ?? faq.question ?? ""} a={faq.a ?? faq.answer ?? ""} />
              ))}
            </div>
          </section>
        )}

        {/* Final CTA section */}
        <section className="vc-section" style={{ padding: "72px 24px 96px", textAlign: "center" }}>
          {/* Final CTA visual banner */}
          <div style={{ width: "100%", maxWidth: 700, height: 200, margin: "0 auto 40px", borderRadius: 20, background: "linear-gradient(135deg,#1a0533,#2d1b69,#0d0d2b)", boxShadow: "0 20px 60px rgba(124,58,237,.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 28, fontSize: "4rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle,rgba(219,39,119,.25),transparent)", pointerEvents: "none" }} />
            <span>🚀</span><span>💰</span><span>🏆</span>
          </div>

          <div style={{ display: "inline-block", background: "rgba(22,163,74,.1)", border: "1px solid rgba(22,163,74,.3)", color: "#4ade80", padding: "5px 18px", borderRadius: 50, fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 }}>
            🎯 Ready to Transform Your Life?
          </div>

          <h2 style={{ fontSize: "clamp(1.5rem,4.5vw,2.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 16, maxWidth: 640, margin: "0 auto 16px" }}>
            {lp?.pricingSection?.headline ?? "Get Everything Today"}
          </h2>
          <p style={{ color: "#64748b", fontSize: ".95rem", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
            One-time payment · No subscriptions · Instant access after purchase
          </p>

          {/* Price */}
          <div style={{ marginBottom: 32 }}>
            {Number(product.originalPrice) > Number(product.price) && (
              <div style={{ color: "#475569", fontSize: "1.1rem", textDecoration: "line-through", marginBottom: 4 }}>
                ${Number(product.originalPrice).toFixed(2)}
              </div>
            )}
            <div style={{ fontSize: "4rem", fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>
              ${Number(product.price).toFixed(2)}
            </div>
            <div style={{ fontSize: ".8rem", color: "#475569", marginTop: 6 }}>One-time · Instant Download</div>
          </div>

          {/* What's included summary */}
          {includedItems.length > 0 && (
            <div style={{ maxWidth: 460, margin: "0 auto 32px", textAlign: "left" }}>
              {includedItems.slice(0, 5).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: ".86rem", color: "#94a3b8" }}>
                  <span style={{ color: "#10b981", fontWeight: 900 }}>✓</span> {item}
                </div>
              ))}
            </div>
          )}

          <button
            className="vc-cta-btn"
            onClick={goToCheckout}
            style={{
              background: "linear-gradient(135deg,#16a34a,#15803d)",
              color: "#fff", border: "none", borderRadius: 14,
              padding: "22px 56px", fontSize: "1.2rem", fontWeight: 900,
              cursor: "pointer", animation: "vc-pulse 2.2s ease-in-out infinite",
              boxShadow: "0 8px 36px rgba(22,163,74,.5)",
              display: "inline-flex", alignItems: "center", gap: 12,
              marginBottom: 20,
            }}
          >
            Yes! I Want Instant Access — ${Number(product.price).toFixed(2)}
            <ArrowRight style={{ width: 22, height: 22 }} />
          </button>

          {/* Guarantee */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.18)", borderRadius: 14, padding: "16px 20px", maxWidth: 460, margin: "0 auto 20px", textAlign: "left" }}>
            <Shield style={{ width: 22, height: 22, color: "#10b981", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: ".85rem", color: "#6ee7b7", lineHeight: 1.6 }}>
              {lp?.pricingSection?.guarantee ?? "30-Day Money-Back Guarantee. Not happy? Get a full refund — no questions asked."}
            </span>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginTop: 16 }}>
            {[["🔒", "SSL Secure"], ["⚡", "Instant Access"], ["📧", "Email Delivery"], ["💯", "100% Satisfaction"]].map(([icon, label]) => (
              <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".68rem", color: "#475569", fontWeight: 600 }}>
                <span style={{ fontSize: ".9rem" }}>{icon}</span> {label as string}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={{ background: "#050510", padding: "28px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <p style={{ fontSize: ".7rem", color: "#1e293b", lineHeight: 1.8 }}>
          © {new Date().getFullYear()} {product.authorName} · Powered by{" "}
          <a href="/" style={{ color: "#7c3aed", textDecoration: "none" }}>Selovox</a>
          <br />
          <a href="/privacy-policy" style={{ color: "#334155", textDecoration: "none" }}>Privacy Policy</a>
          {" · "}
          <a href="/terms" style={{ color: "#334155", textDecoration: "none" }}>Terms of Service</a>
          {" · "}
          <a href="/refund-policy" style={{ color: "#334155", textDecoration: "none" }}>Refund Policy</a>
        </p>
      </div>

      {/* Sticky buy bar */}
      <div className="vc-sticky-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, padding: "12px 20px", background: "rgba(10,10,26,.95)", borderTop: "2px solid rgba(22,163,74,.5)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, backdropFilter: "blur(16px)" }}>
        <div>
          <div style={{ fontSize: ".75rem", color: "#475569", fontWeight: 600 }}>{product.title}</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fbbf24" }}>${Number(product.price).toFixed(2)}</div>
        </div>
        <button
          onClick={goToCheckout}
          style={{
            background: "linear-gradient(135deg,#16a34a,#15803d)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 28px", fontSize: ".9rem", fontWeight: 900,
            cursor: "pointer", boxShadow: "0 4px 20px rgba(22,163,74,.4)",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          }}
        >
          Get Access <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <RecentBuyerToast productId={product.id} />
    </>
  );
}

const SECTION_H: React.CSSProperties = {
  fontSize: "clamp(1.2rem,3.5vw,1.9rem)",
  fontWeight: 900,
  color: "#fff",
  textAlign: "center",
  lineHeight: 1.2,
};
