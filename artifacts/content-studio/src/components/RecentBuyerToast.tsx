import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api";

interface Buyer {
  name: string;
  country: string | null;
  ago: string;
}

const FLAG: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", DE: "🇩🇪", FR: "🇫🇷",
  NG: "🇳🇬", IN: "🇮🇳", BR: "🇧🇷", MX: "🇲🇽", ZA: "🇿🇦", GH: "🇬🇭",
  KE: "🇰🇪", PH: "🇵🇭", SG: "🇸🇬", AE: "🇦🇪", NL: "🇳🇱", ES: "🇪🇸",
  IT: "🇮🇹", PL: "🇵🇱", SE: "🇸🇪", NO: "🇳🇴", NZ: "🇳🇿", JP: "🇯🇵",
};

export default function RecentBuyerToast({ productId }: { productId: number }) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [animIn, setAnimIn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiClient
      .get(`/product/${productId}/recent-buyers`)
      .then(r => {
        if (r.data.buyers?.length > 0) setBuyers(r.data.buyers);
      })
      .catch(() => {});
  }, [productId]);

  useEffect(() => {
    if (buyers.length === 0) return;

    const show = (idx: number) => {
      setCurrent(idx);
      setVisible(true);
      setAnimIn(true);

      timerRef.current = setTimeout(() => {
        setAnimIn(false);
        timerRef.current = setTimeout(() => {
          setVisible(false);
          timerRef.current = setTimeout(() => {
            show((idx + 1) % buyers.length);
          }, 2000);
        }, 400);
      }, 5000);
    };

    const initial = setTimeout(() => show(0), 3000);
    return () => {
      clearTimeout(initial);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [buyers]);

  if (!visible || buyers.length === 0) return null;

  const b = buyers[current];
  const flag = b.country ? (FLAG[b.country.toUpperCase()] ?? "") : "";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 20,
        zIndex: 9999,
        maxWidth: 290,
        background: "rgba(15,15,30,0.96)",
        border: "1px solid rgba(124,58,237,0.35)",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        backdropFilter: "blur(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        opacity: animIn ? 1 : 0,
        transform: animIn ? "translateY(0)" : "translateY(12px)",
        pointerEvents: "none",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg,#7c3aed,#db2777)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", fontWeight: 900, color: "#fff",
      }}>
        {b.name[0]}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: ".72rem", color: "#a78bfa", fontWeight: 700, marginBottom: 2 }}>
          🛒 Recent purchase
        </div>
        <div style={{ fontSize: ".8rem", color: "#f1f5f9", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {b.name}{flag ? ` ${flag}` : ""} just bought this
        </div>
        <div style={{ fontSize: ".68rem", color: "#64748b", marginTop: 2 }}>
          {b.ago}
        </div>
      </div>
    </div>
  );
}
