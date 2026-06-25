import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Loader2, Shield, Lock, ArrowLeft, CheckCircle, Copy, Bitcoin,
  CreditCard, Star, ArrowRight, Link as LinkIcon, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Crypto payment panel ───────────────────────────────────────── */
function CryptoPaymentPanel({
  product, buyerName, buyerEmail, onDone,
}: { product: any; buyerName: string; buyerEmail: string; onDone: () => void }) {
  const { toast } = useToast();
  const { data: cryptoCfg } = useQuery({
    queryKey: ["crypto-config"],
    queryFn: () => apiClient.get("/checkout/crypto/config").then(r => r.data),
    staleTime: 60000,
  });

  const coins: Array<{ id: string; label: string; network: string; symbol: string }> = cryptoCfg?.coins ?? [];
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  const effectiveCoin = selectedCoin || (coins[0]?.id ?? "");

  useEffect(() => {
    if (!notified || !pendingOrder?.reference) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/checkout/crypto/status/${pendingOrder.reference}`);
        const status = res.data?.status;
        setPollingStatus(status);
        if (status === "completed") { clearInterval(interval); onDone(); }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [notified, pendingOrder, onDone]);

  const handleInitiate = async () => {
    if (!buyerEmail) { toast({ title: "Email is required", variant: "destructive" }); return; }
    if (!effectiveCoin) { toast({ title: "Please select a coin", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await apiClient.post(`/checkout/crypto/product/${product.id}`, { buyerEmail, buyerName, coinId: effectiveCoin });
      setPendingOrder(res.data);
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Failed to initiate crypto payment", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const copyAddress = () => {
    if (!pendingOrder?.address) return;
    navigator.clipboard.writeText(pendingOrder.address).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleNotify = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/checkout/crypto/notify/${pendingOrder.reference}`, { txHash: txHash || undefined });
      setNotified(true);
      toast({ title: "Thank you! We'll confirm your payment shortly." });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Failed to notify", variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (!cryptoCfg?.enabled || coins.length === 0) {
    return (
      <div style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 12, padding: "16px 18px", textAlign: "center", color: "#fbbf24", fontSize: ".85rem" }}>
        ₿ Crypto payment is not configured. Please use the card option.
      </div>
    );
  }

  if (notified) {
    const isConfirmed = pollingStatus === "completed";
    return (
      <div style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 14, padding: "28px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{isConfirmed ? "✅" : "⏳"}</div>
        <p style={{ color: "#6ee7b7", fontWeight: 800, fontSize: "1rem", marginBottom: 8 }}>{isConfirmed ? "Payment Confirmed!" : "Awaiting Confirmation"}</p>
        <p style={{ color: "#94a3b8", fontSize: ".84rem", lineHeight: 1.6 }}>
          {isConfirmed ? "Payment confirmed! Redirecting to your download..." : "We've received your notification. Our team will verify within ~1 hour and email your product."}
        </p>
        {!isConfirmed && <p style={{ marginTop: 12, fontSize: ".72rem", color: "#475569" }}>Order ref: <span style={{ fontFamily: "monospace", color: "#64748b" }}>{pendingOrder?.reference}</span></p>}
      </div>
    );
  }

  if (pendingOrder) {
    const qrData = encodeURIComponent(pendingOrder.address);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&color=f59e0b&bgcolor=070714&margin=12`;
    const isStable = ["usdt_trc20", "usdt_erc20", "usdc_trc20"].includes(pendingOrder.coinId);
    const accessLink = `${window.location.origin}/product/${product.id}/access?purchase=success&email=${encodeURIComponent(buyerEmail)}&order=${pendingOrder.orderId}`;
    const copyLink = () => {
      navigator.clipboard.writeText(accessLink).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); });
    };

    return (
      /* ── Full-page overlay ── */
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#070714", overflowY: "auto" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse-ring{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.6);opacity:0}}`}</style>

        {/* Top bar */}
        <div style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(251,191,36,.25)", padding: "14px 28px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
          <Bitcoin style={{ width: 18, height: 18, color: "#f59e0b" }} />
          <span style={{ fontWeight: 800, color: "#fbbf24", fontSize: ".85rem", letterSpacing: ".04em" }}>CRYPTO PAYMENT — SEND & AWAIT CONFIRMATION</span>
          <span style={{ marginLeft: "auto", fontSize: ".72rem", color: "#475569" }}>Order #{pendingOrder.orderId}</span>
        </div>

        <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* Product + amount hero */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ fontSize: ".78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>You're paying for</p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: 12 }}>{pendingOrder.productTitle}</h2>
            <div style={{ fontSize: "2.8rem", fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>
              ${pendingOrder.amountUSD.toFixed(2)} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>USD</span>
            </div>
            {isStable
              ? <p style={{ color: "#6ee7b7", fontSize: ".78rem", marginTop: 6 }}>= {pendingOrder.amountUSD.toFixed(2)} {pendingOrder.symbol} (stablecoin 1:1)</p>
              : <p style={{ color: "#94a3b8", fontSize: ".75rem", marginTop: 6 }}>Send equivalent {pendingOrder.symbol} at current market rate</p>}
            <p style={{ color: "#64748b", fontSize: ".72rem", marginTop: 4 }}>{pendingOrder.coinLabel} · {pendingOrder.network}</p>
          </div>

          {/* Access link — save this! */}
          <div style={{ background: "rgba(124,58,237,.08)", border: "1.5px solid rgba(124,58,237,.35)", borderRadius: 16, padding: "18px 20px", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <LinkIcon style={{ width: 15, height: 15, color: "#a78bfa" }} />
              <span style={{ fontSize: ".75rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: ".07em" }}>Your Access Link — Save This!</span>
            </div>
            <p style={{ fontSize: ".75rem", color: "#94a3b8", marginBottom: 12, lineHeight: 1.6 }}>
              Bookmark this link. After admin approves your payment, open it to download your product.
              The page will show <em>"Payment Awaiting Approval"</em> until then.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 8, padding: "9px 12px" }}>
              <ExternalLink style={{ width: 11, height: 11, color: "#7c3aed", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: ".68rem", color: "#c4b5fd", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>{accessLink}</span>
              <button onClick={copyLink} style={{ flexShrink: 0, background: linkCopied ? "rgba(16,185,129,.15)" : "rgba(124,58,237,.15)", border: `1px solid ${linkCopied ? "rgba(16,185,129,.4)" : "rgba(124,58,237,.4)"}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: linkCopied ? "#6ee7b7" : "#a78bfa", fontSize: ".7rem", fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                <Copy style={{ width: 11, height: 11 }} />{linkCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* QR + wallet address */}
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 16, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginBottom: 20 }}>
            <p style={{ fontSize: ".8rem", fontWeight: 800, color: "#fbbf24" }}>₿ Send Payment to This Address</p>
            <img src={qrUrl} alt="Wallet QR" style={{ width: 160, height: 160, borderRadius: 10, border: "2px solid rgba(251,191,36,.35)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div style={{ width: "100%" }}>
              <p style={{ fontSize: ".65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Wallet Address</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "11px 14px" }}>
                <span style={{ flex: 1, fontFamily: "monospace", fontSize: ".72rem", color: "#e2e8f0", wordBreak: "break-all", lineHeight: 1.6 }}>{pendingOrder.address}</span>
                <button onClick={copyAddress} style={{ flexShrink: 0, background: copied ? "rgba(16,185,129,.2)" : "rgba(255,255,255,.08)", border: `1px solid ${copied ? "rgba(16,185,129,.4)" : "rgba(255,255,255,.15)"}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: copied ? "#6ee7b7" : "#94a3b8", fontSize: ".72rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <Copy style={{ width: 12, height: 12 }} />{copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div style={{ background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.18)", borderRadius: 10, padding: "12px 16px", fontSize: ".78rem", color: "#fcd34d", lineHeight: 1.65, marginBottom: 22 }}>
            ⚠️ <strong>Important:</strong> Send <strong>exactly ${pendingOrder.amountUSD.toFixed(2)} USD</strong> worth of {pendingOrder.symbol} on the <strong>{pendingOrder.network}</strong> network. Wrong network = permanent loss.
          </div>

          {/* Notify button */}
          <div>
            <p style={{ fontSize: ".72rem", color: "#64748b", marginBottom: 8 }}>Optional: paste your TX hash to speed up confirmation</p>
            <input type="text" placeholder="Transaction hash (optional)" value={txHash} onChange={e => setTxHash(e.target.value)} style={INPUT_STYLE} />
            <button onClick={handleNotify} disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000", border: "none", borderRadius: 14, padding: "18px 20px", fontSize: "1rem", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 12, boxShadow: "0 8px 28px rgba(245,158,11,.5)" }}>
              {loading ? <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Submitting...</> : "✅ I've Sent the Payment"}
            </button>
            <p style={{ textAlign: "center", marginTop: 14, fontSize: ".72rem", color: "#334155" }}>
              After clicking, the admin will verify and you'll receive the product by email within ~1 hour.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", textAlign: "center" }}>₿ Select Your Cryptocurrency</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 8 }}>
        {coins.map(coin => (
          <button key={coin.id} onClick={() => setSelectedCoin(coin.id)} style={{ background: effectiveCoin === coin.id ? "rgba(251,191,36,.15)" : "rgba(255,255,255,.04)", border: `1.5px solid ${effectiveCoin === coin.id ? "rgba(251,191,36,.6)" : "rgba(255,255,255,.1)"}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{coin.symbol === "BTC" ? "₿" : coin.symbol === "ETH" ? "Ξ" : coin.symbol === "SOL" ? "◎" : coin.symbol === "BNB" ? "⬡" : "💲"}</div>
            <div style={{ color: effectiveCoin === coin.id ? "#fbbf24" : "#e2e8f0", fontWeight: 700, fontSize: ".72rem" }}>{coin.symbol}</div>
            <div style={{ color: "#64748b", fontSize: ".62rem", marginTop: 2 }}>{coin.network.replace("TRON ", "").replace("Ethereum ", "")}</div>
          </button>
        ))}
      </div>
      <button onClick={handleInitiate} disabled={loading || !effectiveCoin} style={{ width: "100%", background: "linear-gradient(135deg,#f59e0b,#b45309)", color: "#fff", border: "none", borderRadius: 12, padding: "16px 20px", fontSize: "1rem", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(245,158,11,.35)" }}>
        {loading ? <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Generating address...</> : <>₿ Pay with {coins.find(c => c.id === effectiveCoin)?.label ?? "Crypto"} — ${Number(product.price).toFixed(2)}</>}
      </button>
      <p style={{ fontSize: ".7rem", color: "#475569", textAlign: "center", lineHeight: 1.5 }}>
        You'll receive a wallet address. Admin confirms receipt within ~1 hour, then your product is delivered by email.
      </p>
    </div>
  );
}

/* ── Main Checkout Page ─────────────────────────────────────────── */
export default function ProductCheckout() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<"standard" | "crypto">("standard");

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["public-product", params.id],
    queryFn: () => apiClient.get(`/product/${params.id}/public`).then(r => r.data),
    enabled: !!params.id,
  });

  const { data: cryptoCfg } = useQuery({
    queryKey: ["crypto-config"],
    queryFn: () => apiClient.get("/checkout/crypto/config").then(r => r.data),
    staleTime: 60000,
  });

  const { data: gatewayData } = useQuery({
    queryKey: ["active-gateway"],
    queryFn: () => apiClient.get("/checkout/active-gateway").then(r => r.data),
    staleTime: 60000,
  });

  const cryptoEnabled = cryptoCfg?.enabled && (cryptoCfg?.coins?.length ?? 0) > 0;
  const hasStandardGateway = !!(gatewayData?.gateway);

  useEffect(() => {
    if (cryptoEnabled && !hasStandardGateway) setPayMethod("crypto");
  }, [cryptoEnabled, hasStandardGateway]);

  const goToAccess = () => navigate(`/product/${params.id}/access?purchase=success&email=${encodeURIComponent(buyerEmail)}`);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail) { toast({ title: "Email is required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const origin = window.location.origin;
      const checkoutRes = await apiClient.post(`/checkout/product/${product.id}`, {
        buyerEmail, buyerName,
        successUrl: `${origin}/product/${params.id}/access?purchase=success&email=${encodeURIComponent(buyerEmail)}`,
        cancelUrl: `${origin}/product/${params.id}/checkout`,
      });
      if (checkoutRes.data?.checkoutUrl) {
        window.location.href = checkoutRes.data.checkoutUrl;
        return;
      }
      goToAccess();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Purchase failed — please try again", variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080814" }}>
        <Loader2 style={{ width: 36, height: 36, color: "#7c3aed", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080814" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📦</div>
          <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>Product Not Found</h1>
          <p style={{ color: "#475569", fontSize: ".9rem" }}>This product may be unpublished or the link is invalid.</p>
          <a href="/" style={{ color: "#7c3aed", fontSize: ".9rem", textDecoration: "none", marginTop: 16, display: "inline-block" }}>← Go Home</a>
        </div>
      </div>
    );
  }

  const lp = product.landingPage as any;
  const includedItems: string[] = lp?.pricingSection?.includedItems ?? lp?.whatsIncluded?.items ?? [];
  const prompt = encodeURIComponent(`professional premium ebook cover for "${product.title}" dark luxury gold foil high quality`);
  const coverSrc = product.coverImageUrl || `https://image.pollinations.ai/prompt/${prompt}?width=300&height=420&nologo=true&seed=77`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden}
        body{font-family:'Montserrat',system-ui,sans-serif;background:#080814;color:#f1f5f9;-webkit-font-smoothing:antialiased;min-height:100vh}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-green{0%,100%{box-shadow:0 8px 32px rgba(22,163,74,.45),0 0 0 0 rgba(22,163,74,.4)}50%{box-shadow:0 8px 40px rgba(22,163,74,.65),0 0 0 14px rgba(22,163,74,0)}}
        @keyframes shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
        .co-submit-btn:hover{transform:translateY(-1px);box-shadow:0 12px 40px rgba(22,163,74,.6)!important}
        .co-submit-btn{transition:all .2s}
        @media(max-width:860px){
          .co-layout{flex-direction:column!important}
          .co-left{max-width:100%!important;width:100%!important;position:static!important}
          .co-right{max-width:100%!important;width:100%!important}
        }
        @media(max-width:480px){
          .co-form-wrap{padding:24px 18px!important}
          .co-summary{padding:20px 16px!important}
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a0a1a", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a
          href={`/product/${params.id}`}
          style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: ".82rem", fontWeight: 600, textDecoration: "none", transition: "color .2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e2e8f0")}
          onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to sales page
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".7rem", color: "#475569", fontWeight: 700 }}>
          <Lock style={{ width: 14, height: 14, color: "#10b981" }} />
          <span style={{ color: "#10b981" }}>SECURE CHECKOUT</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["🔒 SSL", "⚡ Instant", "💯 Guaranteed"].map(b => (
            <span key={b} style={{ fontSize: ".65rem", color: "#334155", fontWeight: 600 }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="co-layout" style={{ display: "flex", minHeight: "calc(100vh - 56px)", maxWidth: 1080, margin: "0 auto" }}>

        {/* LEFT: Order summary */}
        <div className="co-left" style={{ width: 380, flexShrink: 0, background: "linear-gradient(160deg,#0d0520,#120528)", borderRight: "1px solid rgba(124,58,237,.15)", padding: "48px 36px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Product header */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{
              width: 80, height: 112, borderRadius: "4px 8px 8px 4px", overflow: "hidden", flexShrink: 0,
              boxShadow: "4px 0 20px rgba(0,0,0,.6), -8px 12px 32px rgba(124,58,237,.3)",
              filter: "drop-shadow(-4px 8px 20px rgba(0,0,0,.8))",
            }}>
              <img src={coverSrc} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 6 }}>Digital Product</div>
              <div style={{ fontWeight: 800, fontSize: ".95rem", color: "#e2e8f0", lineHeight: 1.35, marginBottom: 8 }}>{product.title}</div>
              <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: ".85rem", color: "#f59e0b" }}>★</span>)}
                <span style={{ fontSize: ".7rem", color: "#475569", marginLeft: 4, fontWeight: 600 }}>5.0</span>
              </div>
              <div style={{ display: "inline-block", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)", color: "#10b981", padding: "3px 10px", borderRadius: 50, fontSize: ".65rem", fontWeight: 700 }}>
                ⚡ Instant Download
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <span style={{ fontSize: ".85rem", color: "#64748b" }}>Product price</span>
              {Number(product.originalPrice) > Number(product.price) ? (
                <span style={{ fontSize: ".85rem", color: "#94a3b8", textDecoration: "line-through" }}>${Number(product.originalPrice).toFixed(2)}</span>
              ) : (
                <span style={{ fontSize: ".85rem", color: "#94a3b8" }}>${Number(product.price).toFixed(2)}</span>
              )}
            </div>
            {Number(product.originalPrice) > Number(product.price) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ fontSize: ".85rem", color: "#4ade80" }}>Limited-time discount</span>
                <span style={{ fontSize: ".85rem", color: "#4ade80", fontWeight: 700 }}>-${(Number(product.originalPrice) - Number(product.price)).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: ".95rem", color: "#e2e8f0" }}>Total today</span>
              <span style={{ fontWeight: 900, fontSize: "1.8rem", color: "#fbbf24" }}>${Number(product.price).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: ".72rem", color: "#334155", textAlign: "right" }}>One-time · No subscriptions</div>
          </div>

          {/* What's included */}
          {includedItems.length > 0 && (
            <div>
              <p style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>What You're Getting</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {includedItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".83rem", color: "#94a3b8" }}>
                    <CheckCircle style={{ width: 15, height: 15, color: "#10b981", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guarantee */}
          <div style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.18)", borderRadius: 12, padding: "16px 18px", display: "flex", gap: 12 }}>
            <Shield style={{ width: 22, height: 22, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: ".82rem", color: "#6ee7b7", marginBottom: 4 }}>30-Day Money-Back Guarantee</p>
              <p style={{ fontSize: ".75rem", color: "#475569", lineHeight: 1.55 }}>
                {lp?.pricingSection?.guarantee ?? "If you're not completely satisfied within 30 days, we'll refund every penny — no questions asked."}
              </p>
            </div>
          </div>

          {/* Testimonial snippet */}
          <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ color: "#f59e0b", fontSize: ".85rem", marginBottom: 8, letterSpacing: 2 }}>★★★★★</div>
            <p style={{ fontSize: ".8rem", color: "#64748b", fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
              "{lp?.socialProof?.testimonials?.[0]?.text ?? lp?.testimonialsSection?.items?.[0]?.text ?? "This guide completely changed how I approach things. Best investment I've made!"}"
            </p>
            <p style={{ fontSize: ".75rem", color: "#475569", fontWeight: 700 }}>
              — {lp?.socialProof?.testimonials?.[0]?.name ?? lp?.testimonialsSection?.items?.[0]?.name ?? "Verified Customer"}
            </p>
          </div>
        </div>

        {/* RIGHT: Checkout form */}
        <div className="co-right" style={{ flex: 1, padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          <div className="co-form-wrap" style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>

            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 10 }}>
                🔒 Secure Checkout
              </p>
              <h1 style={{ fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
                Complete Your Order
              </h1>
              <p style={{ fontSize: ".88rem", color: "#475569", lineHeight: 1.6 }}>
                You're one step away from getting instant access to <strong style={{ color: "#e2e8f0" }}>{product.title}</strong>.
              </p>
            </div>

            {/* Contact info */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 14 }}>
                Contact Information
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: ".78rem", fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Full Name</label>
                  <input
                    type="text" placeholder="John Smith" value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".78rem", fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="email" placeholder="you@example.com" value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)} required
                    style={INPUT_STYLE}
                  />
                  <p style={{ fontSize: ".7rem", color: "#334155", marginTop: 5 }}>Your download link will be sent to this email.</p>
                </div>
              </div>
            </div>

            {/* Payment method tabs — only show when both available */}
            {cryptoEnabled && hasStandardGateway && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>Payment Method</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { id: "standard", label: "💳 Card", icon: <CreditCard style={{ width: 16, height: 16 }} /> },
                    { id: "crypto", label: "₿ Crypto", icon: <Bitcoin style={{ width: 16, height: 16 }} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPayMethod(tab.id as any)}
                      style={{
                        flex: 1, padding: "14px 12px", border: `2px solid ${payMethod === tab.id ? (tab.id === "crypto" ? "rgba(251,191,36,.7)" : "rgba(124,58,237,.7)") : "rgba(255,255,255,.08)"}`,
                        background: payMethod === tab.id ? (tab.id === "crypto" ? "rgba(251,191,36,.1)" : "rgba(124,58,237,.1)") : "rgba(255,255,255,.03)",
                        borderRadius: 12, cursor: "pointer",
                        color: payMethod === tab.id ? "#fff" : "#64748b",
                        fontWeight: 700, fontSize: ".85rem",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "all .2s",
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard checkout form */}
            {payMethod === "standard" && (
              <form onSubmit={handlePurchase} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Card info note */}
                <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, fontSize: ".82rem", color: "#64748b" }}>
                  <CreditCard style={{ width: 18, height: 18, color: "#7c3aed", flexShrink: 0 }} />
                  <span>You'll be securely redirected to our payment processor to enter your card details.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="co-submit-btn"
                  style={{
                    width: "100%",
                    background: loading ? "#15803d" : "linear-gradient(135deg,#16a34a,#15803d)",
                    color: "#fff", border: "none", borderRadius: 14,
                    padding: "20px 28px", fontSize: "1.08rem", fontWeight: 900,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    animation: loading ? "none" : "pulse-green 2.2s ease-in-out infinite",
                    boxShadow: "0 8px 36px rgba(22,163,74,.45)",
                    lineHeight: 1.3, marginTop: 4,
                  }}
                >
                  {loading
                    ? <><Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} /> Processing...</>
                    : <><Lock style={{ width: 18, height: 18 }} /> Yes! Get Instant Access — ${Number(product.price).toFixed(2)} <ArrowRight style={{ width: 18, height: 18 }} /></>
                  }
                </button>

                {/* Trust line */}
                <p style={{ textAlign: "center", fontSize: ".72rem", color: "#334155", lineHeight: 1.6 }}>
                  🔒 256-bit SSL encryption · Your data is 100% secure
                </p>
              </form>
            )}

            {/* Crypto payment */}
            {payMethod === "crypto" && (
              <CryptoPaymentPanel
                product={product}
                buyerName={buyerName}
                buyerEmail={buyerEmail}
                onDone={goToAccess}
              />
            )}

            {/* Trust badges row */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.05)" }}>
              {[["🔒", "SSL Secure"], ["💳", "Encrypted"], ["✅", "30-Day Guarantee"], ["⚡", "Instant Access"]].map(([icon, label]) => (
                <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".68rem", color: "#334155", fontWeight: 600 }}>
                  <span style={{ fontSize: ".9rem" }}>{icon}</span> {label as string}
                </div>
              ))}
            </div>

            {/* Already have account */}
            <p style={{ textAlign: "center", marginTop: 20, fontSize: ".78rem", color: "#334155" }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#a78bfa", fontWeight: 700, textDecoration: "none" }}>Sign in</a>
              {" · "}
              New here?{" "}
              <a href="/register" style={{ color: "#a78bfa", fontWeight: 700, textDecoration: "none" }}>Create a free account</a>
            </p>
          </div>
        </div>
      </div>

      {/* Related products */}
      {product.relatedProducts?.length > 0 && (
        <div style={{ background: "#060614", borderTop: "1px solid rgba(124,58,237,.15)", padding: "52px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.1rem,3vw,1.5rem)", fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 8 }}>
              📚 Customers Also Bought
            </h2>
            <p style={{ textAlign: "center", color: "#475569", fontSize: ".82rem", marginBottom: 28 }}>
              Complete your collection with these popular picks
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
              {product.relatedProducts.slice(0, 4).map((rp: any) => (
                <div key={rp.id} style={{ background: "linear-gradient(145deg,#0f0f1e,#1a1040)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 16, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7c3aed" }}>Digital Guide</div>
                  <h3 style={{ fontWeight: 800, fontSize: ".9rem", color: "#e2e8f0", lineHeight: 1.35 }}>{rp.title}</h3>
                  {rp.subtitle && <p style={{ fontSize: ".75rem", color: "#64748b", lineHeight: 1.5 }}>{rp.subtitle}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fbbf24" }}>${Number(rp.price ?? 27).toFixed(2)}</span>
                    <a href={`/product/${rp.id}`} style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: ".75rem", fontWeight: 700, textDecoration: "none" }}>
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: "#050510", padding: "20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <p style={{ fontSize: ".68rem", color: "#1e293b", lineHeight: 1.8 }}>
          © {new Date().getFullYear()} {product.authorName} · Powered by{" "}
          <a href="/" style={{ color: "#7c3aed", textDecoration: "none" }}>Selovox</a>
          {" · "}
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

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 10,
  padding: "14px 16px",
  color: "#f1f5f9",
  fontSize: ".93rem",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color .2s",
};
