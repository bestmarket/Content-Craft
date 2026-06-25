import { useState } from "react";
import { apiClient } from "@/lib/api";
import { Loader2, Search, Download, Package, Calendar, CreditCard, ArrowRight, RefreshCw } from "lucide-react";

interface Order {
  orderId: number;
  productId: number;
  amount: string;
  currency: string;
  purchasedAt: string;
  productTitle: string;
  coverImageUrl: string | null;
  productType: string | null;
  paymentProvider: string | null;
}

export default function MyOrders() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    setError("");
    setOrders(null);
    setSearched(false);
    try {
      const res = await apiClient.post("/orders/lookup", { email });
      setOrders(res.data.orders ?? []);
      setSearched(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const productTypeLabel = (type: string | null) => {
    if (!type) return "Digital Product";
    const map: Record<string, string> = {
      ebook: "eBook", guide: "Guide", report: "Report",
      template: "Template", course: "Course", prompt_package: "Prompt Pack",
      ai_agent: "AI Agent", n8n_workflow: "n8n Workflow",
    };
    return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { return iso; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070714", fontFamily: "'Montserrat',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .order-card{transition:transform .2s,box-shadow .2s}
        .order-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(124,58,237,.2)!important}
        .lookup-btn:hover{opacity:.9}
        .dl-link:hover{background:rgba(16,185,129,.15)!important}
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(124,58,237,.2)", padding: "16px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>S</div>
          <span style={{ fontSize: ".9rem", fontWeight: 800, color: "#fff" }}>Selovox</span>
        </a>
        <span style={{ color: "#334155", fontSize: ".8rem", marginLeft: 4 }}>/ My Orders</span>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,rgba(124,58,237,.2),rgba(109,40,217,.1))", border: "1px solid rgba(124,58,237,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem" }}>
            📦
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, color: "#fff", marginBottom: 12 }}>
            Find Your Purchases
          </h1>
          <p style={{ color: "#64748b", fontSize: ".95rem", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Enter the email you used at checkout. We'll show all your completed orders with instant download links — no account needed.
          </p>
        </div>

        {/* Lookup form */}
        <form onSubmit={handleLookup} style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,.03)", border: "1.5px solid rgba(124,58,237,.3)", borderRadius: 16, padding: "8px 8px 8px 18px", transition: "border-color .2s" }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="your@email.com"
              required
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#fff", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600,
                minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="lookup-btn"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", border: "none", borderRadius: 10,
                padding: "13px 24px", fontWeight: 800, fontSize: ".9rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
              }}
            >
              {loading
                ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Searching...</>
                : <><Search style={{ width: 16, height: 16 }} /> Look Up Orders</>
              }
            </button>
          </div>
          {error && (
            <p style={{ marginTop: 10, fontSize: ".8rem", color: "#f87171", textAlign: "center" }}>{error}</p>
          )}
        </form>

        {/* Results */}
        {searched && orders !== null && (
          <div style={{ animation: "fade-up .4s ease both" }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "52px 24px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 20 }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
                <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", marginBottom: 10 }}>No Orders Found</h3>
                <p style={{ color: "#475569", fontSize: ".88rem", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 24px" }}>
                  We couldn't find any completed purchases for <strong style={{ color: "#94a3b8" }}>{email}</strong>.
                  Double-check the email you used at checkout, or try a different address.
                </p>
                <button
                  onClick={() => { setOrders(null); setSearched(false); setEmail(""); }}
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#94a3b8", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: ".85rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <RefreshCw style={{ width: 14, height: 14 }} /> Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Count bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <p style={{ color: "#6ee7b7", fontWeight: 800, fontSize: ".85rem" }}>
                    ✅ {orders.length} order{orders.length !== 1 ? "s" : ""} found for <span style={{ color: "#fff" }}>{email}</span>
                  </p>
                  <button
                    onClick={() => { setOrders(null); setSearched(false); setEmail(""); }}
                    style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: ".75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <RefreshCw style={{ width: 12, height: 12 }} /> New search
                  </button>
                </div>

                {/* Order cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {orders.map(order => {
                    const accessUrl = `/product/${order.productId}/access?purchase=success&email=${encodeURIComponent(email)}&order=${order.orderId}`;
                    const prompt = encodeURIComponent(`professional premium ebook cover for "${order.productTitle}" dark luxury gold foil`);
                    const cover = order.coverImageUrl || `https://image.pollinations.ai/prompt/${prompt}?width=120&height=160&nologo=true&seed=42`;

                    return (
                      <div
                        key={order.orderId}
                        className="order-card"
                        style={{
                          background: "rgba(255,255,255,.03)",
                          border: "1px solid rgba(255,255,255,.08)",
                          borderRadius: 18, overflow: "hidden",
                          display: "flex", alignItems: "stretch",
                          boxShadow: "0 4px 24px rgba(0,0,0,.3)",
                        }}
                      >
                        {/* Cover */}
                        <div style={{ width: 90, flexShrink: 0, background: "rgba(0,0,0,.3)", overflow: "hidden" }}>
                          <img
                            src={cover}
                            alt={order.productTitle}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/90x120/0f0f23/7c3aed?text=📦`; }}
                          />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                              <h3 style={{ color: "#fff", fontWeight: 800, fontSize: ".95rem", lineHeight: 1.35 }}>{order.productTitle}</h3>
                              <span style={{ flexShrink: 0, background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.3)", color: "#a78bfa", borderRadius: 6, padding: "3px 8px", fontSize: ".65rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                {productTypeLabel(order.productType)}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: ".75rem" }}>
                                <Calendar style={{ width: 12, height: 12 }} />{formatDate(order.purchasedAt)}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: ".75rem" }}>
                                <CreditCard style={{ width: 12, height: 12 }} />${parseFloat(order.amount).toFixed(2)} {order.currency?.toUpperCase() ?? "USD"}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#475569", fontSize: ".68rem" }}>
                                <Package style={{ width: 11, height: 11 }} />Order #{order.orderId}
                              </span>
                            </div>
                          </div>

                          <a
                            href={accessUrl}
                            className="dl-link"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 8,
                              alignSelf: "flex-start",
                              background: "rgba(16,185,129,.08)",
                              border: "1px solid rgba(16,185,129,.3)",
                              color: "#6ee7b7", borderRadius: 10, padding: "9px 16px",
                              textDecoration: "none", fontWeight: 800, fontSize: ".8rem",
                              transition: "background .2s",
                            }}
                          >
                            <Download style={{ width: 14, height: 14 }} />
                            Access & Download
                            <ArrowRight style={{ width: 13, height: 13, marginLeft: 2 }} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer hint */}
                <div style={{ marginTop: 28, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "14px 18px", fontSize: ".75rem", color: "#475569", lineHeight: 1.7 }}>
                  💡 <strong style={{ color: "#64748b" }}>Tip:</strong> Bookmark the "Access & Download" link for each product — it will always take you directly to your download, no login needed.
                </div>
              </>
            )}
          </div>
        )}

        {/* How it works (shown before search) */}
        {!searched && !loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, animation: "fade-up .5s .1s ease both" }}>
            {[
              { icon: "✉️", title: "Enter your email", desc: "Use the same email you provided at checkout" },
              { icon: "📋", title: "See all purchases", desc: "Every completed order appears instantly" },
              { icon: "⬇️", title: "Download anytime", desc: "Unlimited re-downloads — no expiry on your links" },
            ].map(step => (
              <div key={step.title} style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "20px 18px", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>{step.icon}</div>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: ".82rem", marginBottom: 6 }}>{step.title}</p>
                <p style={{ color: "#475569", fontSize: ".75rem", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
