import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Users, DollarSign, MousePointerClick, ShoppingBag, Plus, Copy, Check,
  Send, Link as LinkIcon, Settings, ChevronRight, MessageSquare, Paperclip,
  UserCheck, UserX, Trash2, Star, TrendingUp, Loader2, RefreshCw, Eye,
  PackageOpen, BookOpen, ChevronDown, ChevronUp, ExternalLink, Globe,
} from "lucide-react";

const BASE = typeof window !== "undefined" ? window.location.origin : "";

function StatPill({ icon: Icon, label, value, color }: any) {
  return (
    <div className={`flex items-center gap-2 bg-card border rounded-xl px-4 py-3 ${color}`}>
      <Icon className="w-4 h-4" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

function AffiliateRow({ aff, onApprove, onReject, onRemove }: any) {
  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    pending:  "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    removed:  "bg-muted text-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {(aff.affiliate_name ?? "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{aff.affiliate_name}</p>
        <p className="text-xs text-muted-foreground truncate">{aff.affiliate_email}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{aff.total_clicks}</span>
        <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{aff.total_sales}</span>
        <span className="font-semibold text-green-600">${Number(aff.total_earned ?? 0).toFixed(2)}</span>
      </div>
      <Badge className={`text-xs ${statusColors[aff.status] ?? ""} border-0`}>{aff.status}</Badge>
      <div className="flex items-center gap-1">
        {aff.status === "pending" && (
          <>
            <button onClick={() => onApprove(aff.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
              <UserCheck className="w-4 h-4" />
            </button>
            <button onClick={() => onReject(aff.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
              <UserX className="w-4 h-4" />
            </button>
          </>
        )}
        {aff.status === "approved" && (
          <button onClick={() => onRemove(aff.id)} className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Remove">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProgramCard({ program, onSelect, selected }: any) {
  return (
    <div
      onClick={() => onSelect(program)}
      className={`cursor-pointer border rounded-xl p-4 transition-all hover:border-primary/40 hover:shadow-sm ${
        selected ? "border-purple-500 bg-primary/5/50 shadow-sm" : "border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        {program.coverImageUrl ? (
          <img src={program.coverImageUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <PackageOpen className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{program.productTitle}</p>
          <p className="text-xs text-muted-foreground">${Number(program.productPrice ?? 0).toFixed(2)} product</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{program.commissionRate}% commission</Badge>
            {program.pendingCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{program.pendingCount} pending</Badge>
            )}
            {!program.isActive && <Badge className="bg-muted text-muted-foreground border-0 text-xs">Paused</Badge>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-foreground">{program.approvedCount}</p>
          <p className="text-xs text-muted-foreground">affiliates</p>
        </div>
      </div>
    </div>
  );
}

export default function MyAffiliateProgram() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"affiliates" | "messages" | "materials" | "settings">("affiliates");
  const [showCreate, setShowCreate] = useState(false);
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [showMatForm, setShowMatForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Create program form
  const [createProductId, setCreateProductId] = useState("");
  const [createRate, setCreateRate] = useState("30");
  const [createDesc, setCreateDesc] = useState("");

  // Message form
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgType, setMsgType] = useState("announcement");

  // Material form
  const [matName, setMatName] = useState("");
  const [matType, setMatType] = useState("social_post");
  const [matContent, setMatContent] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matDesc, setMatDesc] = useState("");

  // Settings update
  const [settingsRate, setSettingsRate] = useState("");
  const [settingsActive, setSettingsActive] = useState(true);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["my-affiliate-programs"],
    queryFn: () => apiClient.get("/my-affiliate-programs").then(r => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["my-products-for-aff"],
    queryFn: () => apiClient.get("/products/my").then(r => r.data?.products ?? []),
  });

  const { data: affiliates = [], isLoading: loadingAff } = useQuery({
    queryKey: ["program-affiliates", selectedProgram?.id],
    queryFn: () => selectedProgram
      ? apiClient.get(`/my-affiliate-programs/${selectedProgram.id}/affiliates`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!selectedProgram,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["program-messages", selectedProgram?.id],
    queryFn: () => selectedProgram
      ? apiClient.get(`/my-affiliate-programs/${selectedProgram.id}/messages`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!selectedProgram && activeTab === "messages",
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["program-materials", selectedProgram?.id],
    queryFn: () => selectedProgram
      ? apiClient.get(`/my-affiliate-programs/${selectedProgram.id}/materials`).then(r => r.data)
      : Promise.resolve([]),
    enabled: !!selectedProgram && activeTab === "materials",
  });

  const { data: stats } = useQuery({
    queryKey: ["program-stats", selectedProgram?.id],
    queryFn: () => selectedProgram
      ? apiClient.get(`/my-affiliate-programs/${selectedProgram.id}/stats`).then(r => r.data)
      : Promise.resolve(null),
    enabled: !!selectedProgram,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/my-affiliate-programs", data).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Affiliate program created!" });
      qc.invalidateQueries({ queryKey: ["my-affiliate-programs"] });
      setShowCreate(false);
      setCreateProductId(""); setCreateRate("30"); setCreateDesc("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.response?.data?.error, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.put(`/my-affiliate-programs/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Program updated!" });
      qc.invalidateQueries({ queryKey: ["my-affiliate-programs"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.response?.data?.error, variant: "destructive" }),
  });

  const affiliateActionMutation = useMutation({
    mutationFn: ({ affiliateId, status }: any) =>
      apiClient.patch(`/my-affiliate-programs/${selectedProgram.id}/affiliates/${affiliateId}`, { status }).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Affiliate updated!" });
      qc.invalidateQueries({ queryKey: ["program-affiliates", selectedProgram?.id] });
      qc.invalidateQueries({ queryKey: ["my-affiliate-programs"] });
      qc.invalidateQueries({ queryKey: ["program-stats", selectedProgram?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.response?.data?.error, variant: "destructive" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/my-affiliate-programs/${selectedProgram.id}/messages`, data).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Message sent to all affiliates!" });
      qc.invalidateQueries({ queryKey: ["program-messages", selectedProgram?.id] });
      setShowMsgForm(false);
      setMsgSubject(""); setMsgBody(""); setMsgType("announcement");
    },
    onError: (e: any) => toast({ title: "Error", description: e.response?.data?.error, variant: "destructive" }),
  });

  const addMaterialMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient.post(`/my-affiliate-programs/${selectedProgram.id}/materials`, data).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Material added!" });
      qc.invalidateQueries({ queryKey: ["program-materials", selectedProgram?.id] });
      setShowMatForm(false);
      setMatName(""); setMatContent(""); setMatUrl(""); setMatDesc("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.response?.data?.error, variant: "destructive" }),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (matId: number) =>
      apiClient.delete(`/my-affiliate-programs/${selectedProgram.id}/materials/${matId}`).then(r => r.data),
    onSuccess: () => {
      toast({ title: "Material removed" });
      qc.invalidateQueries({ queryKey: ["program-materials", selectedProgram?.id] });
    },
  });

  const inviteLink = selectedProgram
    ? `${BASE}/join-affiliate/${selectedProgram.inviteCode}`
    : "";

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast({ title: "Invite link copied!" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSelectProgram = (prog: any) => {
    setSelectedProgram(prog);
    setSettingsRate(prog.commissionRate);
    setSettingsActive(prog.isActive);
    setActiveTab("affiliates");
  };

  const TABS = [
    { key: "affiliates", label: "Affiliates", icon: Users },
    { key: "messages",   label: "Messages",   icon: MessageSquare },
    { key: "materials",  label: "Materials",  icon: Paperclip },
    { key: "settings",   label: "Settings",   icon: Settings },
  ] as const;

  const MSG_TYPES = ["announcement", "training", "promotion", "update"];
  const MAT_TYPES = ["social_post", "email_swipe", "text", "link", "image", "pdf", "video"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" /> My Affiliate Programs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recruit affiliates to promote your products. Set commission rates, send training, track sales.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" /> New Program
        </Button>
      </div>

      {/* Create Program Modal */}
      {showCreate && (
        <Card className="p-5 border border-primary/30 bg-primary/5/30">
          <h3 className="font-bold text-foreground mb-4">Create Affiliate Program</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Product</Label>
              <select
                value={createProductId}
                onChange={e => setCreateProductId(e.target.value)}
                className="w-full border border rounded-lg px-3 py-2 text-sm bg-card focus:ring-2 focus:ring-purple-300 focus:outline-none"
              >
                <option value="">Select a product…</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Commission Rate (%)</Label>
              <Input
                type="number" min={1} max={70} value={createRate}
                onChange={e => setCreateRate(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1.5 block">Description (shown to potential affiliates)</Label>
              <textarea
                value={createDesc} onChange={e => setCreateDesc(e.target.value)}
                placeholder="Tell affiliates what they're promoting and why it converts well…"
                className="w-full border border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:ring-2 focus:ring-purple-300 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => createMutation.mutate({ productId: createProductId, commissionRate: Number(createRate), description: createDesc })}
              disabled={!createProductId || createMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Program"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : programs.length === 0 && !showCreate ? (
        <Card className="p-10 text-center border-dashed border-2 border">
          <PackageOpen className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground mb-1">No affiliate programs yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create a program for one of your products and recruit affiliates to drive sales.</p>
          <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Create First Program
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: program list */}
          <div className="space-y-3">
            {programs.map((prog: any) => (
              <ProgramCard
                key={prog.id}
                program={prog}
                selected={selectedProgram?.id === prog.id}
                onSelect={handleSelectProgram}
              />
            ))}
          </div>

          {/* Right column: program detail */}
          {selectedProgram ? (
            <div className="lg:col-span-2 space-y-4">

              {/* Invite link bar */}
              <Card className="p-4 border border-primary/30 bg-gradient-to-r from-purple-50 to-pink-50/20">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Affiliate Invite Link</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-card border border-primary/30 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                    {inviteLink}
                  </div>
                  <Button onClick={copyInviteLink} size="sm" className="bg-primary hover:bg-primary/90 flex-shrink-0">
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Share this link with anyone you want to recruit as an affiliate. They submit a request and you approve them.</p>
              </Card>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatPill icon={Users} label="Total Affiliates" value={stats.total_affiliates ?? 0} color="text-primary" />
                  <StatPill icon={MousePointerClick} label="Total Clicks" value={stats.total_clicks ?? 0} color="text-blue-600" />
                  <StatPill icon={ShoppingBag} label="Total Sales" value={stats.total_sales ?? 0} color="text-green-600" />
                  <StatPill icon={DollarSign} label="Commissions Paid" value={`$${Number(stats.total_commissions_paid ?? 0).toFixed(2)}`} color="text-emerald-600" />
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

              {/* ── Affiliates Tab ── */}
              {activeTab === "affiliates" && (
                <Card className="border overflow-hidden">
                  {loadingAff ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : affiliates.length === 0 ? (
                    <div className="py-10 text-center">
                      <Users className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No affiliates yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Share your invite link to recruit affiliates</p>
                    </div>
                  ) : (
                    <div>
                      {affiliates.map((aff: any) => (
                        <AffiliateRow
                          key={aff.id}
                          aff={aff}
                          onApprove={(id: number) => affiliateActionMutation.mutate({ affiliateId: id, status: "approved" })}
                          onReject={(id: number) => affiliateActionMutation.mutate({ affiliateId: id, status: "rejected" })}
                          onRemove={(id: number) => affiliateActionMutation.mutate({ affiliateId: id, status: "removed" })}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* ── Messages Tab ── */}
              {activeTab === "messages" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Training & Announcements</p>
                    <Button size="sm" onClick={() => setShowMsgForm(!showMsgForm)} className="bg-primary hover:bg-primary/90 gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Send Message
                    </Button>
                  </div>

                  {showMsgForm && (
                    <Card className="p-4 border border-primary/30 bg-primary/5/20 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1.5 block">Subject</Label>
                          <Input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="e.g. How to promote this product" />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Type</Label>
                          <select value={msgType} onChange={e => setMsgType(e.target.value)}
                            className="w-full border border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300 capitalize">
                            {MSG_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Message</Label>
                        <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)}
                          className="w-full border border rounded-lg px-3 py-2 text-sm resize-none h-28 focus:ring-2 focus:ring-purple-300 focus:outline-none"
                          placeholder="Write training tips, promotion guidelines, or an announcement for your affiliates…" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => sendMessageMutation.mutate({ subject: msgSubject, body: msgBody, messageType: msgType })}
                          disabled={!msgSubject || !msgBody || sendMessageMutation.isPending}
                          className="bg-primary hover:bg-primary/90">
                          {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send to All Affiliates"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowMsgForm(false)}>Cancel</Button>
                      </div>
                    </Card>
                  )}

                  {messages.length === 0 ? (
                    <Card className="py-10 text-center border-dashed">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No messages sent yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Send training tips and promotions to all your affiliates</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg: any) => (
                        <Card key={msg.id} className="p-4 border">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-foreground">{msg.subject}</span>
                            <div className="flex items-center gap-2">
                              <Badge className="text-xs bg-primary/10 text-primary border-0 capitalize">{msg.message_type}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Materials Tab ── */}
              {activeTab === "materials" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Marketing Assets</p>
                    <Button size="sm" onClick={() => setShowMatForm(!showMatForm)} className="bg-primary hover:bg-primary/90 gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> Add Material
                    </Button>
                  </div>

                  {showMatForm && (
                    <Card className="p-4 border border-primary/30 bg-primary/5/20 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1.5 block">Name</Label>
                          <Input value={matName} onChange={e => setMatName(e.target.value)} placeholder="e.g. Twitter promo copy" />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Type</Label>
                          <select value={matType} onChange={e => setMatType(e.target.value)}
                            className="w-full border border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-purple-300">
                            {MAT_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Content / Text</Label>
                        <textarea value={matContent} onChange={e => setMatContent(e.target.value)}
                          className="w-full border border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:ring-2 focus:ring-purple-300 focus:outline-none"
                          placeholder="Paste copy, script, or description here…" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">URL (optional — for image/PDF/video links)</Label>
                        <Input value={matUrl} onChange={e => setMatUrl(e.target.value)} placeholder="https://…" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Description</Label>
                        <Input value={matDesc} onChange={e => setMatDesc(e.target.value)} placeholder="Brief description of when/how to use this…" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => addMaterialMutation.mutate({ name: matName, materialType: matType, url: matUrl || undefined, content: matContent || undefined, description: matDesc || undefined })}
                          disabled={!matName || (!matContent && !matUrl) || addMaterialMutation.isPending}
                          className="bg-primary hover:bg-primary/90">
                          {addMaterialMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Material"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowMatForm(false)}>Cancel</Button>
                      </div>
                    </Card>
                  )}

                  {materials.length === 0 ? (
                    <Card className="py-10 text-center border-dashed">
                      <Paperclip className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No materials yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add promo copy, banner images, and email swipes for affiliates</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {materials.map((mat: any) => (
                        <Card key={mat.id} className="p-4 border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">{mat.name}</span>
                                <Badge className="text-xs bg-blue-100 text-blue-700 border-0">{mat.material_type?.replace("_", " ")}</Badge>
                              </div>
                              {mat.description && <p className="text-xs text-muted-foreground mb-1.5">{mat.description}</p>}
                              {mat.content && (
                                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 whitespace-pre-wrap font-mono leading-relaxed">{mat.content}</p>
                              )}
                              {mat.url && (
                                <a href={mat.url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                                  <ExternalLink className="w-3 h-3" /> {mat.url}
                                </a>
                              )}
                            </div>
                            <button onClick={() => deleteMaterialMutation.mutate(mat.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Settings Tab ── */}
              {activeTab === "settings" && (
                <Card className="p-5 border space-y-4">
                  <h3 className="font-semibold text-foreground">Program Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1.5 block">Commission Rate (%)</Label>
                      <Input type="number" min={1} max={70} value={settingsRate}
                        onChange={e => setSettingsRate(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">Percentage of sale price paid to affiliates</p>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Program Status</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => setSettingsActive(true)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${settingsActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
                        >Active</button>
                        <button
                          onClick={() => setSettingsActive(false)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!settingsActive ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"}`}
                        >Paused</button>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedProgram.id, data: { commissionRate: Number(settingsRate), isActive: settingsActive } })}
                    disabled={updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
                  </Button>
                </Card>
              )}

            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center border-2 border-dashed border rounded-xl min-h-64">
              <div className="text-center">
                <ChevronRight className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a program to manage it</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
