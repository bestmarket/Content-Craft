import { useState } from "react";
import { useListPaymentGateways, useUpsertPaymentGateway, useTogglePaymentGateway } from "@workspace/api-client-react";
import { getListPaymentGatewaysQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, ToggleLeft, ToggleRight, Plus, Bitcoin, CheckCircle, XCircle, Clock, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api";

const GATEWAYS = [
  {
    name: "crypto",
    label: "Crypto Payments",
    badge: "LIVE",
    badgeColor: "bg-orange-100 text-orange-700",
    icon: "₿",
    description: "Accept Bitcoin, USDT, ETH, SOL, BNB and more directly to your wallets",
    fields: [
      { key: "usdt_trc20_address", label: "USDT Wallet Address (TRC-20 / TRON) — Recommended" },
      { key: "usdt_erc20_address", label: "USDT Wallet Address (ERC-20 / Ethereum)" },
      { key: "usdc_trc20_address", label: "USDC Wallet Address (TRC-20 / TRON)" },
      { key: "btc_address",         label: "Bitcoin (BTC) Wallet Address" },
      { key: "eth_address",         label: "Ethereum (ETH) Wallet Address" },
      { key: "sol_address",         label: "Solana (SOL) Wallet Address" },
      { key: "bnb_address",         label: "BNB Wallet Address (BEP-20)" },
      { key: "note",                label: "Custom Note to Buyers (optional)" },
    ],
  },
  {
    name: "paddle",
    label: "Paddle",
    badge: "LIVE",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: "🏓",
    description: "Full checkout & subscription billing with webhooks",
    fields: [
      { key: "vendor_auth_code", label: "API Key (vendor_auth_code)" },
      { key: "public_key", label: "Webhook Secret Key" },
      { key: "price_id", label: "Pro Subscription Price ID (pri_xxx)" },
      { key: "sandbox", label: "Sandbox mode? (true/false)" },
    ],
  },
  {
    name: "lemonsqueezy",
    label: "Lemon Squeezy",
    badge: "LIVE",
    badgeColor: "bg-yellow-100 text-yellow-700",
    icon: "🍋",
    description: "Digital products & subscription checkout",
    fields: [
      { key: "api_key", label: "API Key" },
      { key: "store_id", label: "Store ID" },
      { key: "variant_id", label: "One-Time Product Variant ID" },
      { key: "subscription_variant_id", label: "Pro Subscription Variant ID" },
      { key: "webhook_secret", label: "Webhook Secret" },
    ],
  },
  {
    name: "stripe",
    label: "Stripe",
    badgeColor: "bg-muted text-muted-foreground",
    icon: "💳",
    description: "Card payments (coming soon — configure keys to prepare)",
    fields: [
      { key: "publishable_key", label: "Publishable Key" },
      { key: "secret_key", label: "Secret Key (keep private)" },
    ],
  },
  {
    name: "paypal",
    label: "PayPal",
    badgeColor: "bg-muted text-muted-foreground",
    icon: "💙",
    description: "PayPal checkout (coming soon)",
    fields: [
      { key: "client_id", label: "Client ID" },
      { key: "client_secret", label: "Client Secret" },
    ],
  },
  {
    name: "flutterwave",
    label: "Flutterwave",
    badgeColor: "bg-muted text-muted-foreground",
    icon: "🌊",
    description: "Africa-focused payments (coming soon)",
    fields: [
      { key: "public_key", label: "Public Key" },
      { key: "secret_key", label: "Secret Key" },
    ],
  },
  {
    name: "paystack",
    label: "Paystack",
    badgeColor: "bg-muted text-muted-foreground",
    icon: "🅿",
    description: "Nigeria & Africa payments (coming soon)",
    fields: [
      { key: "public_key", label: "Public Key" },
      { key: "secret_key", label: "Secret Key" },
    ],
  },
];

const STATUS_BADGE: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  completed:  "bg-green-100 text-green-700",
  failed:     "bg-red-100 text-red-700",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className="ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CryptoPendingOrders() {
  const { toast } = useToast();
  const { data: orders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-crypto-pending"],
    queryFn: () => apiClient.get("/admin/crypto/pending").then(r => r.data),
    refetchInterval: 30000,
  });

  const confirm = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/crypto/confirm/${id}`),
    onSuccess: () => { refetch(); toast({ title: "Payment confirmed — order fulfilled and seller wallet credited" }); },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/crypto/reject/${id}`),
    onSuccess: () => { refetch(); toast({ title: "Order rejected" }); },
    onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Failed", variant: "destructive" }),
  });

  const pending = (orders ?? []).filter((o: any) => o.status === "pending");
  const recent = (orders ?? []).filter((o: any) => o.status !== "pending").slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Crypto Payment Orders</h2>
          <p className="text-sm text-muted-foreground">Confirm payments after you verify receipt in your wallet</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
      ) : pending.length === 0 ? (
        <Card className="border p-8 text-center">
          <Bitcoin className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No pending crypto payments</p>
          <p className="text-sm text-muted-foreground/60 mt-1">New orders will appear here when buyers initiate crypto checkout</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ {pending.length} pending payment{pending.length !== 1 ? "s" : ""} — verify receipt in your wallet before confirming
          </p>
          {pending.map((order: any) => (
            <Card key={order.id} className="border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${STATUS_BADGE[order.status] ?? "bg-muted text-muted-foreground"}`}>
                        {order.status === "pending" ? <><Clock className="w-3 h-3 mr-1" />Pending</> : order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{order.id}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm truncate">{order.product_title ?? "Product"}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span><strong className="text-foreground">Buyer:</strong> {order.buyer_email}</span>
                      <span><strong className="text-foreground">Amount:</strong> ${Number(order.amount).toFixed(2)}</span>
                      <span className="col-span-2 flex items-center gap-1">
                        <strong className="text-foreground">Ref:</strong>
                        <span className="font-mono text-xs truncate">{order.payment_reference}</span>
                        <CopyButton text={order.payment_reference ?? ""} />
                      </span>
                      <span><strong className="text-foreground">Date:</strong> {new Date(order.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => confirm.mutate(order.id)}
                      disabled={confirm.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => reject.mutate(order.id)}
                      disabled={reject.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Recent History</h3>
          <div className="space-y-2">
            {recent.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm">
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs ${STATUS_BADGE[order.status] ?? "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </Badge>
                  <span className="text-foreground font-medium truncate max-w-48">{order.product_title ?? "Product"}</span>
                  <span className="text-muted-foreground text-xs">{order.buyer_email}</span>
                </div>
                <span className="font-bold text-foreground">${Number(order.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [activeTab, setActiveTab] = useState<"gateways" | "crypto_orders">("gateways");

  const { data: gateways } = useListPaymentGateways({ query: { queryKey: getListPaymentGatewaysQueryKey() } });
  const upsert = useUpsertPaymentGateway();
  const toggle = useTogglePaymentGateway();

  const getConfig = (name: string): Record<string, string> => configs[name] ?? {};
  const setConfig = (name: string, key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [name]: { ...prev[name], [key]: value } }));
  };

  const handleSave = (name: string) => {
    upsert.mutate({ data: { name, config: JSON.stringify(getConfig(name)) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentGatewaysQueryKey() });
        setActiveGateway(null);
        toast({ title: `${name} gateway saved` });
      },
    });
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggle.mutate({ id, data: { isActive: !isActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentGatewaysQueryKey() });
        toast({ title: isActive ? "Gateway disabled" : "Gateway enabled" });
      },
    });
  };

  const savedGateways = new Map(gateways?.map((g: any) => [g.name, g]) ?? []);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Gateways</h1>
        <p className="text-muted-foreground text-sm">Configure and enable payment providers. Toggle to activate or deactivate each gateway.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "gateways", label: "Configure Gateways" },
          { id: "crypto_orders", label: "₿ Crypto Orders" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "crypto_orders" ? (
        <CryptoPendingOrders />
      ) : (
        <>
          {/* Webhook URLs info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-blue-800 mb-2">Webhook Setup (Paddle & Lemon Squeezy)</p>
            <div className="space-y-1 font-mono text-xs bg-card rounded-lg p-3 border border-blue-100">
              <p><span className="text-muted-foreground">Paddle:</span> <span className="text-blue-700 select-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/paddle</span></p>
              <p><span className="text-muted-foreground">Lemon Squeezy:</span> <span className="text-blue-700 select-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/lemonsqueezy</span></p>
            </div>
            <p className="text-blue-600 mt-2 text-xs">Crypto payments use manual admin confirmation — no webhook needed.</p>
          </div>

          <div className="space-y-4">
            {GATEWAYS.map((gw) => {
              const saved = savedGateways.get(gw.name) as any;
              const isExpanded = activeGateway === gw.name;
              const isCrypto = gw.name === "crypto";

              return (
                <Card key={gw.name} data-testid={`gateway-${gw.name}`} className="border overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${isCrypto ? "bg-orange-100" : "bg-muted"}`}>
                        {gw.icon ?? <CreditCard className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">{gw.label}</p>
                          {gw.badge && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gw.badgeColor ?? "bg-blue-100 text-blue-700"}`}>
                              {gw.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{saved ? "Configured" : gw.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {saved && (
                        <button
                          onClick={() => handleToggle(saved.id, saved.isActive)}
                          className="text-muted-foreground hover:text-foreground"
                          title={saved.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          {saved.isActive
                            ? <ToggleRight className="w-8 h-8 text-green-500" />
                            : <ToggleLeft className="w-8 h-8 text-muted-foreground/60" />}
                        </button>
                      )}
                      <Badge className={`text-xs ${saved?.isActive ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {saved?.isActive ? "Active" : saved ? "Inactive" : "Not set"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setActiveGateway(isExpanded ? null : gw.name)}>
                        {isExpanded ? "Cancel" : saved ? <><Plus className="w-4 h-4 mr-1" /> Update</> : <><Plus className="w-4 h-4 mr-1" /> Configure</>}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 bg-muted/30 space-y-3">
                      {isCrypto && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 mb-2">
                          <strong>How it works:</strong> Add your wallet addresses below. Buyers will see only the coins you configure. When a buyer pays, you confirm receipt manually in the <button onClick={() => setActiveTab("crypto_orders")} className="underline font-semibold">Crypto Orders</button> tab, and the seller's platform wallet is credited automatically.
                        </div>
                      )}
                      {gw.fields.map((field) => (
                        <div key={field.key}>
                          <Label className="text-xs mb-1 block">{field.label}</Label>
                          <Input
                            data-testid={`input-${gw.name}-${field.key}`}
                            type={field.key.includes("key") || field.key.includes("secret") ? "password" : "text"}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            value={getConfig(gw.name)[field.key] ?? ""}
                            onChange={(e) => setConfig(gw.name, field.key, e.target.value)}
                          />
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" onClick={() => handleSave(gw.name)} disabled={upsert.isPending}>
                          Save {gw.label} Config
                        </Button>
                        {saved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggle(saved.id, saved.isActive)}
                            className={saved.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-700 border-green-200 hover:bg-green-50"}
                          >
                            {saved.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                        {isCrypto && saved?.isActive && (
                          <Button size="sm" variant="outline" onClick={() => setActiveTab("crypto_orders")}>
                            <Bitcoin className="w-3.5 h-3.5 mr-1" /> View Orders
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
