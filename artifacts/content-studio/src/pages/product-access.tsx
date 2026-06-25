import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Loader2, Download, CheckCircle, Mail, ArrowRight, ExternalLink, Star, Shield, RefreshCw, Send } from "lucide-react";

/* ── Confetti burst (pure CSS) ──────────────────────────────────── */
function ConfettiPop() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 9999 }}>
      {Array.from({ length: 36 }).map((_, i) => {
        const hue = (i * 37) % 360;
        const x = Math.random() * 100;
        const delay = Math.random() * 1.2;
        const size = 6 + Math.random() * 8;
        const dur = 1.8 + Math.random() * 1.2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: "-20px",
              width: size,
              height: size,
              background: `hsl(${hue},80%,60%)`,
              borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? 0 : "2px",
              animation: `confetti-fall ${dur}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall{
          0%{transform:translateY(0) rotate(0deg);opacity:1}
          80%{opacity:1}
          100%{transform:translateY(110vh) rotate(${Math.random() > .5 ? "" : "-"}720deg);opacity:0}
        }
      `}</style>
    </div>
  );
}

/* ── Step card ──────────────────────────────────────────────────── */
function Step({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: string }) {
  return (
    <div style={{ display: "flex", gap: 18, padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7c3aed,#db2777)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: ".9rem", marginBottom: 4 }}>{num}. {title}</p>
        <p style={{ color: "#475569", fontSize: ".82rem", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Main Access/Download Page ──────────────────────────────────── */
export default function ProductAccess() {
  const params = useParams<{ id: string }>();
  const [showConfetti, setShowConfetti] = useState(true);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState("");

  // Read URL params
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const purchaseSuccess = urlParams?.get("purchase") === "success";
  const buyerEmail = urlParams?.get("email") ?? "";
  const orderId = urlParams?.get("order") ?? "";

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["public-product", params.id],
    queryFn: () => apiClient.get(`/product/${params.id}/public`).then(r => r.data),
    enabled: !!params.id,
  });

  // Check order status first (lightweight — no download attempt)
  const { data: orderStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["order-status", params.id, orderId],
    queryFn: () => apiClient.get(`/product/${params.id}/order-status/${orderId}`).then(r => r.data),
    enabled: !!(params.id && orderId),
    retry: false,
    refetchInterval: (data: any) => {
      const s = data?.state?.data?.status;
      return s === "pending" || s === "awaiting_confirmation" ? 8000 : false;
    },
  });

  const orderApproved = orderStatus?.status === "completed";
  const orderPending = orderId && (orderStatus?.status === "pending" || orderStatus?.status === "awaiting_confirmation");
  const orderFailed = orderId && orderStatus?.status === "failed";

  // Only fetch download URL once order is approved
  const { data: orderData } = useQuery({
    queryKey: ["order-download", params.id, orderId],
    queryFn: () => apiClient.get(`/product/${params.id}/download/${orderId}`).then(r => r.data),
    enabled: !!(params.id && orderId && orderApproved),
    retry: false,
  });

  const downloadUrl = orderData?.downloadUrl ?? null;

  const handleDownload = () => {
    if (downloadUrl) {
      setDownloadStarted(true);
      window.open(downloadUrl, "_blank");
    }
  };

  const handleResend = async () => {
    if (!buyerEmail || resending || resendDone) return;
    setResending(true);
    setResendError("");
    try {
      await apiClient.post(`/product/${params.id}/resend-download`, { email: buyerEmail });
      setResendDone(true);
    } catch (err: any) {
      setResendError(err?.response?.data?.error ?? "Could not resend — please contact support.");
    } finally {
      setResending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080814" }}>
        <Loader2 style={{ width: 36, height: 36, color: "#7c3aed", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // Pending crypto payment — order exists but admin hasn't approved yet
  if (orderPending && product) {
    return (
      <div style={{ minHeight: "100vh", background: "#070714", display: "flex", flexDirection: "column" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse-ring{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.6);opacity:0}}`}</style>
        {/* Header */}
        <div style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(251,191,36,.2)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 10, height: 10 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#f59e0b", animation: "pulse-ring 1.5s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fbbf24" }} />
          </div>
          <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#fbbf24", letterSpacing: ".08em" }}>AWAITING PAYMENT CONFIRMATION</span>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: 24 }}>⏳</div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
              Payment Awaiting Approval
            </h1>
            <p style={{ color: "#94a3b8", fontSize: ".9rem", lineHeight: 1.7, marginBottom: 32 }}>
              Your crypto payment for <strong style={{ color: "#fbbf24" }}>{product.title}</strong> is being verified.
              Once our admin confirms receipt, your download link will be delivered to{" "}
              {buyerEmail ? <strong style={{ color: "#e2e8f0" }}>{buyerEmail}</strong> : "your email"} automatically.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {[
                { icon: "₿", label: "Payment submitted", done: true },
                { icon: "🔍", label: "Admin reviewing transaction", done: false },
                { icon: "✅", label: "Confirmation & download delivered", done: false },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: step.done ? "rgba(16,185,129,.06)" : "rgba(255,255,255,.03)", border: `1px solid ${step.done ? "rgba(16,185,129,.2)" : "rgba(255,255,255,.07)"}`, borderRadius: 12, padding: "14px 18px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{step.done ? "✅" : step.icon}</span>
                  <span style={{ color: step.done ? "#6ee7b7" : "#64748b", fontSize: ".85rem", fontWeight: step.done ? 700 : 500 }}>{step.label}</span>
                  {!step.done && i === 1 && <Loader2 style={{ width: 14, height: 14, color: "#fbbf24", marginLeft: "auto", animation: "spin 1s linear infinite" }} />}
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 14, padding: "16px 20px", fontSize: ".8rem", color: "#fcd34d", lineHeight: 1.65, marginBottom: 24 }}>
              ⚠️ <strong>Bookmark this page.</strong> Return here after admin approval and your download will be ready. Approval usually takes <strong>less than 1 hour</strong>.
            </div>

            <p style={{ fontSize: ".72rem", color: "#334155" }}>
              This page auto-refreshes every 8 seconds · Order #{orderId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Failed crypto payment
  if (orderFailed && product) {
    return (
      <div style={{ minHeight: "100vh", background: "#070714", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 20 }}>❌</div>
          <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 900, marginBottom: 12 }}>Payment Not Approved</h1>
          <p style={{ color: "#94a3b8", fontSize: ".88rem", lineHeight: 1.7, marginBottom: 28 }}>
            This crypto payment was not confirmed. If you believe this is a mistake, please contact support with your order reference.
          </p>
          <a href={`/product/${params.id}/checkout`} style={{ display: "inline-block", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 800, fontSize: ".9rem" }}>
            ← Try Again
          </a>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080814", padding: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📦</div>
          <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>Page Not Found</h1>
          <p style={{ color: "#475569", fontSize: ".9rem", marginBottom: 20 }}>This access page is invalid or expired.</p>
          <a href="/" style={{ color: "#7c3aed", textDecoration: "none", fontSize: ".9rem", fontWeight: 600 }}>← Go Home</a>
        </div>
      </div>
    );
  }

  const prompt = encodeURIComponent(`professional premium ebook cover for "${product.title}" dark luxury gold foil high quality`);
  const coverSrc = product.coverImageUrl || `https://image.pollinations.ai/prompt/${prompt}?width=300&height=420&nologo=true&seed=77`;
  const topic = product.topic ?? product.title ?? "digital product";

  return (
    <>
      {showConfetti && <ConfettiPop />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden}
        body{font-family:'Montserrat',system-ui,sans-serif;background:#080814;color:#f1f5f9;-webkit-font-smoothing:antialiased;min-height:100vh}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pop-in{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 24px rgba(16,185,129,.3)}50%{box-shadow:0 0 48px rgba(16,185,129,.7),0 0 80px rgba(16,185,129,.2)}}
        @keyframes pulse-dl{0%,100%{box-shadow:0 8px 32px rgba(16,185,129,.4)}50%{box-shadow:0 8px 48px rgba(16,185,129,.7),0 0 0 12px rgba(16,185,129,0)}}
        .dl-btn:hover{transform:translateY(-2px)!important;box-shadow:0 16px 48px rgba(16,185,129,.7)!important}
        .dl-btn{transition:all .2s!important}
        @media(max-width:700px){
          .acc-inner{padding:28px 18px!important}
          .acc-two-col{flex-direction:column!important}
        }
      `}</style>

      {/* Header bar */}
      <div style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(16,185,129,.2)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,.8)", animation: "glow 2s ease-in-out infinite" }} />
          <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#10b981", letterSpacing: ".08em" }}>ACCESS GRANTED</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["✅ Purchase Verified", "🔒 Secure Link", "📧 Email Sent"].map(b => (
            <span key={b} style={{ fontSize: ".65rem", color: "#334155", fontWeight: 600 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }} className="acc-inner">

        {/* Success hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {/* Success icon */}
          <div style={{
            width: 100, height: 100, background: "linear-gradient(135deg,#10b981,#059669)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            animation: "pop-in .6s cubic-bezier(0.175,0.885,0.32,1.275) both, glow 2.5s 1s ease-in-out infinite",
          }}>
            <CheckCircle style={{ width: 52, height: 52, color: "#fff" }} />
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem,5vw,2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>
            🎉 Your Order Is Confirmed!
          </h1>
          <p style={{ fontSize: "clamp(.9rem,2.5vw,1.05rem)", color: "#94a3b8", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 28px" }}>
            {buyerEmail
              ? <>Thank you! Your purchase of <strong style={{ color: "#e2e8f0" }}>{product.title}</strong> has been confirmed. {downloadUrl ? "Your download is ready below." : `Check your inbox at ${buyerEmail} for your access link.`}</>
              : <>Thank you for your purchase of <strong style={{ color: "#e2e8f0" }}>{product.title}</strong>! {downloadUrl ? "Your download is ready below." : "Check your email inbox for your access link and download instructions."}</>
            }
          </p>

          {/* Order note if no download URL yet */}
          {!downloadUrl && buyerEmail && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.25)", borderRadius: 12, padding: "12px 20px", fontSize: ".82rem", color: "#fbbf24" }}>
              <Mail style={{ width: 16, height: 16, flexShrink: 0 }} />
              Delivery sent to <strong>{buyerEmail}</strong> · Check spam if not found
            </div>
          )}
        </div>

        {/* Two-column: Product + Download */}
        <div className="acc-two-col" style={{ display: "flex", gap: 28, alignItems: "flex-start", marginBottom: 36 }}>

          {/* Product card */}
          <div style={{ width: 240, flexShrink: 0, background: "linear-gradient(145deg,#0f0f1e,#1a1040)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 20, padding: "28px 24px", textAlign: "center" }}>
            <div style={{ animation: "float 4s ease-in-out infinite", marginBottom: 18 }}>
              <div style={{
                width: 120, height: 168, margin: "0 auto",
                borderRadius: "4px 10px 10px 4px", overflow: "hidden",
                boxShadow: "6px 0 24px rgba(0,0,0,.7), -4px 8px 32px rgba(124,58,237,.4)",
                filter: "drop-shadow(-6px 12px 24px rgba(0,0,0,.8))",
              }}>
                <img src={coverSrc} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
            <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 8 }}>Digital Product</div>
            <div style={{ fontWeight: 800, fontSize: ".92rem", color: "#e2e8f0", lineHeight: 1.35, marginBottom: 10 }}>{product.title}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 10 }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: ".9rem", color: "#f59e0b" }}>★</span>)}
            </div>
            <div style={{ display: "inline-block", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)", color: "#10b981", padding: "4px 12px", borderRadius: 50, fontSize: ".65rem", fontWeight: 700 }}>
              ✅ Purchased
            </div>
          </div>

          {/* Download & action section */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Primary download button */}
            {downloadUrl ? (
              <div style={{ background: "linear-gradient(135deg,rgba(16,185,129,.12),rgba(5,150,105,.06))", border: "2px solid rgba(16,185,129,.35)", borderRadius: 20, padding: "28px 28px", textAlign: "center" }}>
                <p style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#10b981", marginBottom: 12 }}>
                  ⚡ Ready for Download
                </p>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: 18 }}>
                  Your Product Is Ready!
                </h2>
                <button
                  onClick={handleDownload}
                  className="dl-btn"
                  style={{
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    color: "#fff", border: "none", borderRadius: 14,
                    padding: "18px 36px", fontSize: "1.05rem", fontWeight: 900,
                    cursor: "pointer", width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    animation: "pulse-dl 2.5s ease-in-out infinite",
                    boxShadow: "0 8px 36px rgba(16,185,129,.45)",
                    marginBottom: 14,
                  }}
                >
                  <Download style={{ width: 22, height: 22 }} />
                  {downloadStarted ? "Download Again" : "Download Your Product"}
                </button>

                {/* View online */}
                <a
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}&embedded=false`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    color: "#a78bfa", fontSize: ".82rem", fontWeight: 700,
                    textDecoration: "none", padding: "8px 18px",
                    border: "1px solid rgba(167,139,250,.35)", borderRadius: 50,
                    transition: "border-color .2s",
                  }}
                >
                  <ExternalLink style={{ width: 14, height: 14 }} /> View PDF Online
                </a>

                {downloadStarted && (
                  <p style={{ marginTop: 14, fontSize: ".78rem", color: "#10b981", fontWeight: 700 }}>
                    ✅ Download started! Check your downloads folder.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ background: "linear-gradient(135deg,rgba(251,191,36,.08),rgba(245,158,11,.04))", border: "2px solid rgba(251,191,36,.25)", borderRadius: 20, padding: "28px", textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📧</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: 10 }}>Check Your Email</h2>
                <p style={{ fontSize: ".86rem", color: "#94a3b8", lineHeight: 1.65, marginBottom: 18 }}>
                  Your download link has been sent to {buyerEmail ? <strong style={{ color: "#fbbf24" }}>{buyerEmail}</strong> : "your email address"}.
                  Check your inbox (and spam folder) — it arrives within 2 minutes.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "12px 16px", fontSize: ".82rem", color: "#64748b" }}>
                    <Mail style={{ width: 16, height: 16, color: "#fbbf24", flexShrink: 0 }} />
                    Look for an email with subject: <em style={{ color: "#94a3b8", marginLeft: 4 }}>Your purchase is confirmed</em>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "12px 16px", fontSize: ".82rem", color: "#64748b" }}>
                    <RefreshCw style={{ width: 16, height: 16, color: "#475569", flexShrink: 0 }} />
                    Also check your Promotions or Spam folder
                  </div>
                </div>

                {/* Resend button — only if we have their email */}
                {buyerEmail && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 18 }}>
                    <p style={{ fontSize: ".75rem", color: "#475569", marginBottom: 12 }}>Didn't receive it?</p>
                    {resendDone ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", color: "#6ee7b7", borderRadius: 10, padding: "10px 18px", fontSize: ".82rem", fontWeight: 700 }}>
                        <CheckCircle style={{ width: 15, height: 15 }} /> Sent! Check your inbox again.
                      </div>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={resending}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          background: resending ? "rgba(251,191,36,.05)" : "rgba(251,191,36,.1)",
                          border: "1px solid rgba(251,191,36,.35)",
                          color: "#fbbf24", borderRadius: 10, padding: "10px 20px",
                          fontSize: ".82rem", fontWeight: 700, cursor: resending ? "not-allowed" : "pointer",
                          transition: "all .2s",
                        }}
                      >
                        {resending
                          ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Sending...</>
                          : <><Send style={{ width: 14, height: 14 }} /> Resend Download Link</>
                        }
                      </button>
                    )}
                    {resendError && (
                      <p style={{ marginTop: 10, fontSize: ".75rem", color: "#f87171" }}>{resendError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Guarantee reminder */}
            <div style={{ background: "rgba(16,185,129,.05)", border: "1px solid rgba(16,185,129,.15)", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Shield style={{ width: 20, height: 20, color: "#10b981", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: ".82rem", color: "#6ee7b7", marginBottom: 3 }}>You're Protected by Our 30-Day Guarantee</p>
                <p style={{ fontSize: ".76rem", color: "#475569", lineHeight: 1.55 }}>
                  If you're not 100% satisfied, contact us within 30 days for a full refund. No questions asked.
                </p>
              </div>
            </div>

            {/* Social proof */}
            <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                {[1,2,3,4,5].map(i => <Star key={i} style={{ width: 16, height: 16, fill: "#f59e0b", color: "#f59e0b" }} />)}
                <span style={{ fontSize: ".75rem", color: "#475569", marginLeft: 6, fontWeight: 600 }}>5.0 · Verified Purchase</span>
              </div>
              <p style={{ fontSize: ".82rem", color: "#64748b", fontStyle: "italic", lineHeight: 1.6 }}>
                "This changed everything for me. Seriously, the best digital purchase I've made this year."
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div style={{ background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.18)", borderRadius: 20, padding: "32px 28px", marginBottom: 32 }}>
          <h2 style={{ fontWeight: 900, color: "#e2e8f0", fontSize: "1.05rem", marginBottom: 20, textAlign: "center" }}>
            📖 Getting Started — Your 3-Step Guide
          </h2>
          <Step num="Step 1" icon="⬇️" title="Download or Open Your Email" desc="Click the download button above, or check your inbox for the delivery email. Save the file to a safe location." />
          <Step num="Step 2" icon="📖" title="Open & Read the Introduction" desc="Start from the beginning. The introduction explains exactly how to use this guide for maximum results." />
          <Step num="Step 3" icon="🚀" title="Take Action Today" desc="Don't wait — implement one strategy right now. Consistency beats speed. Start with the first actionable step." />
          <div style={{ marginTop: 20, background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.15)", borderRadius: 12, padding: "14px 18px", fontSize: ".8rem", color: "#fcd34d", lineHeight: 1.6 }}>
            💡 <strong>Pro tip:</strong> Bookmark this page and save your download link. You can always return here to re-download your product.
          </div>
        </div>

        {/* Related products from same author */}
        {product.relatedProducts?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontWeight: 900, color: "#e2e8f0", fontSize: "1rem", marginBottom: 16, textAlign: "center" }}>
              📚 You Might Also Love These
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {product.relatedProducts.slice(0, 3).map((rp: any) => (
                <div key={rp.id} style={{ background: "linear-gradient(145deg,#0f0f1e,#1a1040)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 14, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7c3aed" }}>Digital Guide</div>
                  <h3 style={{ fontWeight: 800, fontSize: ".9rem", color: "#e2e8f0", lineHeight: 1.35 }}>{rp.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fbbf24" }}>${Number(rp.price ?? 27).toFixed(2)}</span>
                    <a href={`/product/${rp.id}`} style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: ".75rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      View <ArrowRight style={{ width: 12, height: 12 }} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My purchases link */}
        <div style={{ textAlign: "center" }}>
          <a
            href="/my-purchases"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#a78bfa", fontSize: ".85rem", fontWeight: 700, textDecoration: "none", padding: "12px 24px", border: "1px solid rgba(167,139,250,.25)", borderRadius: 50, transition: "border-color .2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(167,139,250,.5)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(167,139,250,.25)")}
          >
            📦 View All My Purchases <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#050510", padding: "24px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <p style={{ fontSize: ".7rem", color: "#1e293b", lineHeight: 1.8 }}>
          © {new Date().getFullYear()} {product.authorName} · Powered by{" "}
          <a href="/" style={{ color: "#7c3aed", textDecoration: "none" }}>Selovox</a>
          <br />
          <a href="/privacy-policy" style={{ color: "#1e293b", textDecoration: "none" }}>Privacy Policy</a>
          {" · "}
          <a href="/terms" style={{ color: "#1e293b", textDecoration: "none" }}>Terms of Service</a>
          {" · "}
          <a href="/refund-policy" style={{ color: "#1e293b", textDecoration: "none" }}>Refund Policy</a>
        </p>
      </div>
    </>
  );
}
