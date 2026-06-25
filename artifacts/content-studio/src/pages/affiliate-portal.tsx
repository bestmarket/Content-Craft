import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MousePointerClick, ShoppingBag, DollarSign, Copy, Check, MessageSquare,
  Paperclip, TrendingUp, Link as LinkIcon, Loader2, PackageOpen, ExternalLink,
  Mail, Globe, Star, BookOpen, ArrowUpRight, UserCheck, Clock,
} from "lucide-react";

const BASE = typeof window !== "undefined" ? window.location.origin : "";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: "Link copied!" });
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  removed:  "bg-muted text-muted-foreground",
};

const MSG_TYPE_ICON: Record<string, any> = {
  training:     BookOpen,
  announcement: Globe,
  promotion:    Star,
  update:       ArrowUpRight,
};

export default function AffiliatePortal() {
  const [activeTab, setActiveTab] = useState<"programs" | "messages" | "materials" | "commissions">("programs");

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["affiliate-portal-programs"],
    queryFn: () => apiClient.get("/affiliate-portal").then(r => r.data),
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["affiliate-portal-messages"],
    queryFn: () => apiClient.get("/affiliate-portal/messages").then(r => r.data),
    enabled: activeTab === "messages",
  });

  const { data: materials = [], isLoading: loadingMats } = useQuery({
    queryKey: ["affiliate-portal-materials"],
    queryFn: () => apiClient.get("/affiliate-portal/materials").then(r => r.data),
    enabled: activeTab === "materials",
  });

  const { data: commissionData, isLoading: loadingComm } = useQuery({
    queryKey: ["affiliate-portal-commissions"],
    queryFn: () => apiClient.get("/affiliate-portal/commissions").then(r => r.data),
    enabled: activeTab === "commissions",
  });

  const approvedPrograms = programs.filter((p: any) => p.status === "approved");
  const totalEarned = approvedPrograms.reduce((s: number, p: any) => s + Number(p.total_earned ?? 0), 0);
  const totalClicks = approvedPrograms.reduce((s: number, p: any) => s + Number(p.total_clicks ?? 0), 0);
  const totalSales  = approvedPrograms.reduce((s: number, p: any) => s + Number(p.total_sales ?? 0), 0);

  const TABS = [
    { key: "programs",    label: "My Links",       icon: LinkIcon },
    { key: "messages",    label: "Training",        icon: MessageSquare },
    { key: "materials",   label: "Promo Assets",    icon: Paperclip },
    { key: "commissions", label: "Earnings",        icon: DollarSign },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Affiliate Portal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Products you're promoting · Get your tracking links · View training · Earn commissions
        </p>
      </div>

      {/* Summary stats */}
      {approvedPrograms.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Star, label: "Active Programs", value: approvedPrograms.length, color: "from-primary to-primary" },
            { icon: MousePointerClick, label: "Total Clicks", value: totalClicks, color: "from-blue-500 to-blue-600" },
            { icon: ShoppingBag, label: "Total Sales", value: totalSales, color: "from-green-500 to-green-600" },
            { icon: DollarSign, label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, color: "from-emerald-500 to-emerald-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="p-4 border">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-2 rounded-lg transition-all ${
              activeTab === key ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Programs / Links Tab ── */}
      {activeTab === "programs" && (
        isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : programs.length === 0 ? (
          <Card className="py-14 text-center border-dashed border-2 border">
            <PackageOpen className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground mb-1">No affiliate programs yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Get an invite link from a seller to join their program, or browse the marketplace.
            </p>
            <Button asChild variant="outline">
              <a href="/marketplace">Browse Marketplace</a>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {programs.map((prog: any) => {
              const trackingLink = `${BASE}/product/${prog.product_id}?aff=${prog.tracking_code}`;
              const MsgIcon = MSG_TYPE_ICON[prog.message_type] ?? Globe;
              return (
                <Card key={prog.id} className="p-5 border">
                  <div className="flex items-start gap-4">
                    {prog.cover_image_url ? (
                      <img src={prog.cover_image_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <PackageOpen className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-bold text-foreground">{prog.product_title}</span>
                        <Badge className={`text-xs border-0 ${STATUS_STYLES[prog.status] ?? ""}`}>{prog.status}</Badge>
                        {prog.status === "approved" && (
                          <Badge className="text-xs bg-primary/10 text-primary border-0">{prog.commission_rate}% commission</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Sold by {prog.seller_name} · ${Number(prog.product_price ?? 0).toFixed(2)}</p>

                      {prog.status === "pending" && (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          Application submitted — waiting for seller approval
                        </div>
                      )}

                      {prog.status === "approved" && (
                        <>
                          {/* Tracking link */}
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Your Tracking Link</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted/30 border border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                                {trackingLink}
                              </div>
                              <CopyButton text={trackingLink} />
                              <a href={`/product/${prog.product_id}`} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5 text-blue-500" /> {prog.total_clicks} clicks</span>
                            <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5 text-green-500" /> {prog.total_sales} sales</span>
                            <span className="flex items-center gap-1 font-semibold text-emerald-600"><DollarSign className="w-3.5 h-3.5" /> ${Number(prog.total_earned ?? 0).toFixed(2)} earned</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── Training / Messages Tab ── */}
      {activeTab === "messages" && (
        loadingMsgs ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <Card className="py-14 text-center border-dashed border-2 border">
            <MessageSquare className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground mb-1">No messages yet</p>
            <p className="text-sm text-muted-foreground">Training materials and announcements from sellers will appear here</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: any) => {
              const Icon = MSG_TYPE_ICON[msg.message_type] ?? Globe;
              const typeColors: Record<string, string> = {
                training:     "bg-blue-100 text-blue-700",
                announcement: "bg-primary/10 text-primary",
                promotion:    "bg-pink-100 text-pink-700",
                update:       "bg-green-100 text-green-700",
              };
              return (
                <Card key={msg.id} className="p-4 border">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{msg.subject}</span>
                        <Badge className={`text-xs border-0 capitalize ${typeColors[msg.message_type] ?? ""}`}>{msg.message_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">From {msg.seller_name} · {msg.product_title} · {new Date(msg.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── Materials Tab ── */}
      {activeTab === "materials" && (
        loadingMats ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : materials.length === 0 ? (
          <Card className="py-14 text-center border-dashed border-2 border">
            <Paperclip className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground mb-1">No materials yet</p>
            <p className="text-sm text-muted-foreground">Sellers will add promo copy, banner images, and email swipes here</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials.map((mat: any) => (
              <Card key={mat.id} className="p-4 border">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{mat.name}</span>
                    <Badge className="ml-2 text-xs bg-blue-100 text-blue-700 border-0">{mat.material_type?.replace("_", " ")}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{mat.seller_name}</span>
                </div>
                {mat.description && <p className="text-xs text-muted-foreground mb-2">{mat.description}</p>}
                {mat.content && (
                  <div className="relative">
                    <pre className="text-xs text-foreground bg-muted/30 border rounded-lg p-3 whitespace-pre-wrap leading-relaxed font-mono overflow-auto max-h-48">{mat.content}</pre>
                    <div className="absolute top-2 right-2">
                      <CopyButton text={mat.content} />
                    </div>
                  </div>
                )}
                {mat.url && (
                  <a href={mat.url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> {mat.url}
                  </a>
                )}
              </Card>
            ))}
          </div>
        )
      )}

      {/* ── Commissions Tab ── */}
      {activeTab === "commissions" && (
        loadingComm ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            <Card className="p-5 border border-emerald-200 bg-emerald-50/30">
              <p className="text-xs text-emerald-600 font-medium mb-1">Total Product Affiliate Earnings</p>
              <p className="text-3xl font-black text-emerald-700">${Number(commissionData?.totalEarned ?? 0).toFixed(2)}</p>
              <p className="text-xs text-emerald-600 mt-1">Credited directly to your wallet</p>
            </Card>

            {(commissionData?.commissions ?? []).length === 0 ? (
              <Card className="py-10 text-center border-dashed border-2 border">
                <DollarSign className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No commissions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your tracking links to start earning</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {(commissionData?.commissions ?? []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-card border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{c.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-600">+${Number(c.amount ?? 0).toFixed(2)}</p>
                      <Badge className="text-xs bg-green-100 text-green-700 border-0 mt-0.5">{c.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
