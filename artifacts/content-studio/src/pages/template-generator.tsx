import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeBanner } from "@/components/ui/UpgradeGate";
import {
  Sparkles, ArrowLeft, Lightbulb, Play, CheckCircle, Loader2,
  ExternalLink, Store, ShoppingBag, Crown, Star, DollarSign,
  Copy, Download, Globe, TrendingUp, ArrowRight, Zap, ChevronDown, ChevronUp,
  Youtube, Instagram, Facebook, Twitter, Mail, Calendar, Megaphone,
} from "lucide-react";

const TYPE_META: Record<string, any> = {
  ai_agent: {
    label: "AI Agent Template",
    emoji: "🤖",
    color: "from-violet-600 to-blue-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    textColor: "text-violet-700",
    placeholder: "e.g. Customer Support Agent for SaaS companies",
    priceDefault: 149,
    priceSuggestions: [49, 99, 149, 199, 299],
  },
  n8n_workflow: {
    label: "n8n Workflow Template",
    emoji: "⚡",
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    placeholder: "e.g. Cold email automation + CRM sync workflow",
    priceDefault: 79,
    priceSuggestions: [29, 49, 79, 99, 149],
  },
  replit_template: {
    label: "Replit App Template",
    emoji: "💻",
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
    placeholder: "e.g. SaaS subscription app with Stripe and auth",
    priceDefault: 129,
    priceSuggestions: [49, 79, 99, 129, 199],
  },
  chrome_extension: {
    label: "Chrome Extension Template",
    emoji: "🧩",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    placeholder: "e.g. AI writing assistant for Gmail users",
    priceDefault: 49,
    priceSuggestions: [19, 29, 49, 79, 99],
  },
};

function IdeaChip({ idea, onSelect }: { idea: any; onSelect: (t: string) => void }) {
  return (
    <button
      onClick={() => onSelect(idea.idea)}
      className="group flex items-start gap-2 text-left bg-card border border hover:border-violet-400 rounded-xl p-3 transition-all hover:shadow-md hover:bg-violet-50/50"
    >
      <span className="text-xl flex-shrink-0">{idea.emoji}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-violet-700 transition-colors">{idea.idea}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{idea.niche}</span>
          <Badge variant="outline" className="text-xs text-green-700 bg-green-50 border-green-200">{idea.estimatedPrice}</Badge>
        </div>
      </div>
    </button>
  );
}

function SectionExpander({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted transition-colors text-left"
      >
        <span className="font-semibold text-foreground text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 bg-card">{children}</div>}
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
  const { toast } = useToast();
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  return (
    <div className="relative">
      <pre className="bg-slate-950 text-green-400 p-4 rounded-xl text-xs overflow-x-auto max-h-64 font-mono leading-relaxed">
        {text}
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Copied to clipboard!" }); }}
        className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-muted-foreground/60 text-xs px-2 py-1 rounded flex items-center gap-1"
      >
        <Copy className="w-3 h-3" /> Copy
      </button>
    </div>
  );
}

export default function TemplateGenerator() {
  const { type } = useParams<{ type: string }>();
  const { toast } = useToast();
  const { data: access } = useFeatureAccess();
  const isAdmin = access?.isAdmin ?? false;
  const isPremium = isAdmin || (access?.tier === "pro" || access?.tier === "enterprise");

  const meta = TYPE_META[type] ?? TYPE_META.ai_agent;
  const [ideas, setIdeas] = useState<any[]>([]);
  const [topic, setTopic] = useState("");
  const [price, setPrice] = useState(meta.priceDefault);
  const [generating, setGenerating] = useState(false);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<any>(null);
  const [publishingStore, setPublishingStore] = useState(false);
  const [publishingMarket, setPublishingMarket] = useState(false);
  const [deployingAgent, setDeployingAgent] = useState(false);
  const [agentDeployed, setAgentDeployed] = useState(false);
  const [activeTab, setActiveTab] = useState<"template" | "landing" | "marketing">("template");
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [marketingGuide, setMarketingGuide] = useState<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerateMarketingGuide = async () => {
    if (!templateId) return;
    setGeneratingGuide(true);
    try {
      const res = await apiClient.post(`/templates/${templateId}/marketing-guide`, {});
      setMarketingGuide((res.data as any).guide ?? {});
      toast({ title: "📣 Marketing guide ready!", description: "Facebook, YouTube, TikTok, Instagram, Email — all done." });
    } catch (err: any) {
      toast({ title: "Guide generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingGuide(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <UpgradeBanner featureKey="template_generators" label="Template Generator Suite" />
      </div>
    );
  }

  useEffect(() => {
    apiClient.get(`/templates/ideas/${type}`)
      .then(r => setIdeas((r.data as any).ideas ?? []))
      .catch(() => {});
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [type]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic or select an idea", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setTemplate(null);
    try {
      const res = await apiClient.post("/templates/generate", { type, topic: topic.trim(), price });
      const { id } = res.data as any;
      setTemplateId(id);
      const interval = setInterval(async () => {
        const statusRes = await apiClient.get(`/templates/${id}/status`);
        const data = statusRes.data as any;
        if (data.generationStatus === "complete") {
          clearInterval(interval);
          const fullRes = await apiClient.get(`/templates/${id}`);
          setTemplate(fullRes.data);
          setGenerating(false);
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        } else if (data.generationStatus === "error") {
          clearInterval(interval);
          setGenerating(false);
          toast({ title: "Generation failed", description: data.generationError, variant: "destructive" });
        }
      }, 3000);
      setPollInterval(interval);
    } catch (err: any) {
      setGenerating(false);
      toast({ title: "Failed to start generation", description: err.message, variant: "destructive" });
    }
  };

  const handlePublishStore = async () => {
    if (!templateId) return;
    setPublishingStore(true);
    try {
      await apiClient.post(`/templates/${templateId}/publish-store`, {});
      toast({ title: "✅ Published to your store!", description: "Customers can now find and buy this template." });
      setTemplate((prev: any) => ({ ...prev, isPublishedToStore: true }));
    } catch {
      toast({ title: "Failed to publish", variant: "destructive" });
    } finally {
      setPublishingStore(false);
    }
  };

  const handlePublishMarketplace = async () => {
    if (!templateId) return;
    setPublishingMarket(true);
    try {
      await apiClient.post(`/templates/${templateId}/publish-marketplace`, {});
      toast({ title: "🚀 Submitted to Marketplace!", description: "Under review — usually approved within 24 hours." });
      setTemplate((prev: any) => ({ ...prev, isPublishedToMarketplace: true, publishStatus: "pending_approval" }));
    } catch {
      toast({ title: "Failed to submit", variant: "destructive" });
    } finally {
      setPublishingMarket(false);
    }
  };

  const handleDeployAgent = async () => {
    if (!templateId) return;
    setDeployingAgent(true);
    try {
      await apiClient.post(`/ai-agents/deploy/${templateId}`, {});
      setAgentDeployed(true);
      toast({ title: "🤖 Agent Deployed!", description: "Go to My AI Agents to get your embed code." });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message;
      if (msg?.includes("already deployed")) {
        setAgentDeployed(true);
        toast({ title: "Agent already deployed", description: "Visit My AI Agents to manage it." });
      } else {
        toast({ title: "Deploy failed", description: msg, variant: "destructive" });
      }
    } finally {
      setDeployingAgent(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/marketplace/template/${templateId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: "Share this with your audience." });
  };

  const tc = template?.templateContent ?? {};
  const lp = template?.landingPage ?? {};
  const ma = template?.marketingAssets ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back */}
      <Link href="/automations/generators">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> All Generators
        </Button>
      </Link>

      {/* Header */}
      <div className={`bg-gradient-to-br ${meta.color} rounded-2xl p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        <div className="relative">
          <div className="text-4xl mb-3">{meta.emoji}</div>
          <h1 className="text-3xl font-black mb-2">{meta.label}</h1>
          <p className="text-white/80 text-base max-w-xl">
            Enter a topic below, or click any idea card. The AI will generate a complete, sellable template with landing page, cover image, and marketing assets.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            What template do you want to generate?
          </label>
          <Textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder={meta.placeholder}
            className="min-h-[80px] text-base resize-none"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" /> Selling Price
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
              <Input
                type="number"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="pl-7"
                min={1}
                max={999}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {meta.priceSuggestions.map((p: number) => (
                <button
                  key={p}
                  onClick={() => setPrice(p)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                    price === p
                      ? `${meta.bgColor} ${meta.textColor} ${meta.borderColor} font-semibold`
                      : "bg-card text-muted-foreground border hover:border-slate-400"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Recommended: ${meta.priceDefault} based on market data</p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className={`w-full h-14 text-base font-bold bg-gradient-to-r ${meta.color} text-white border-0 gap-3 shadow-lg`}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI is generating your template — this takes 30–60 seconds…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Complete Template
              <ArrowRight className="w-5 h-5 ml-auto" />
            </>
          )}
        </Button>

        {generating && (
          <div className="bg-muted/30 border border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span className="text-sm font-medium text-foreground">Generating your premium template…</span>
            </div>
            <div className="space-y-2">
              {[
                "Building template content & code…",
                "Writing high-converting landing page…",
                "Generating marketing assets…",
                "Creating shareable product listing…",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  <span className="text-xs text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Ideas Section */}
      {!template && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className={`w-4 h-4 ${meta.textColor}`} />
            <h2 className="font-bold text-foreground">Trending Ideas — Click to Autofill</h2>
            <Badge variant="outline" className="text-xs">AI-personalized</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ideas.map((idea, i) => (
              <IdeaChip key={i} idea={idea} onSelect={setTopic} />
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {template && (
        <div ref={resultRef} className="space-y-6">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black mb-1">Your template is ready! 🎉</h2>
              <p className="text-green-100 text-sm">
                {template.title} — Sellability Score: <strong>{template.sellabilityScore}/100</strong>
              </p>
            </div>
            <div className="flex-shrink-0 text-right hidden md:block">
              <div className="text-3xl font-black">${parseFloat(template.price ?? "0").toFixed(0)}</div>
              <div className="text-green-200 text-xs">per sale</div>
            </div>
          </div>

          {/* Cover + Actions Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cover Image */}
            <Card className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted relative">
                {template.coverImageUrl ? (
                  <img src={template.coverImageUrl} alt={template.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br ${meta.color}`}>
                    {meta.emoji}
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">PRODUCT COVER</p>
                <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                  <Download className="w-3 h-3" /> Download Image
                </Button>
              </div>
            </Card>

            {/* Actions */}
            <div className="md:col-span-2 space-y-3">
              <Card className="p-4">
                <h3 className="font-bold text-foreground text-sm mb-3">Publish & Sell</h3>
                <div className="space-y-2.5">
                  <Button
                    onClick={handlePublishStore}
                    disabled={publishingStore || template.isPublishedToStore}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 gap-2"
                  >
                    {publishingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                    {template.isPublishedToStore ? "✅ Published to Store" : "Publish to My Store"}
                  </Button>
                  <Button
                    onClick={handlePublishMarketplace}
                    disabled={publishingMarket || template.isPublishedToMarketplace}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2"
                  >
                    {publishingMarket ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    {template.isPublishedToMarketplace
                      ? (template.publishStatus === "pending_approval" ? "⏳ Under Review" : "✅ Live on Marketplace")
                      : "Publish to Marketplace"}
                  </Button>
                  <Button onClick={copyLink} variant="outline" className="w-full gap-2">
                    <Globe className="w-4 h-4" /> Copy Shareable Link
                  </Button>
                  {type === "ai_agent" && (
                    <div className="pt-1 border-t border">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">AI AGENT DEPLOYMENT</p>
                      {agentDeployed ? (
                        <Link href="/my-agents">
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white border-0 gap-2">
                            <CheckCircle className="w-4 h-4" /> View in My AI Agents →
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={handleDeployAgent}
                          disabled={deployingAgent}
                          className="w-full bg-gradient-to-r from-violet-600 to-blue-700 hover:from-violet-700 hover:to-purple-800 text-white border-0 gap-2"
                        >
                          {deployingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          Deploy Live AI Agent
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5 text-center">
                        Get an embed code — works on any website
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Sellability */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Sellability Score</span>
                  <span className={`text-lg font-black ${(template.sellabilityScore ?? 0) >= 80 ? "text-green-600" : "text-amber-600"}`}>
                    {template.sellabilityScore ?? 0}/100
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${(template.sellabilityScore ?? 0) >= 80 ? "bg-green-500" : "bg-amber-500"}`}
                    style={{ width: `${template.sellabilityScore ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {(template.sellabilityScore ?? 0) >= 85
                    ? "🔥 High demand — this will sell well"
                    : "Good potential — consider refining the topic for higher conversion"}
                </p>
              </Card>
            </div>
          </div>

          {/* Tabs: Template | Landing Page | Marketing */}
          <Card className="overflow-hidden">
            <div className="flex border-b bg-muted/30">
              {(["template", "landing", "marketing"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-card text-violet-700 border-b-2 border-violet-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "template" ? `${meta.emoji} Template Content`
                    : tab === "landing" ? "🌐 Landing Page"
                    : "📣 Marketing"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {/* Template Tab */}
              {activeTab === "template" && (
                <div className="space-y-4">
                  {tc.overview && (
                    <SectionExpander title="Overview" defaultOpen>
                      <p className="text-sm text-foreground leading-relaxed">{tc.overview}</p>
                    </SectionExpander>
                  )}
                  {tc.systemPrompt && (
                    <SectionExpander title="System Prompt">
                      <CodeBlock content={tc.systemPrompt} />
                    </SectionExpander>
                  )}
                  {tc.capabilities && (
                    <SectionExpander title="Capabilities">
                      <ul className="space-y-2">
                        {tc.capabilities.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </SectionExpander>
                  )}
                  {tc.conversationFlows && (
                    <SectionExpander title="Conversation Flows">
                      <div className="space-y-4">
                        {tc.conversationFlows.map((f: any, i: number) => (
                          <div key={i} className="border border rounded-xl p-4">
                            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-3">{f.scenario}</p>
                            <div className="space-y-2">
                              <div className="bg-muted rounded-lg p-3">
                                <p className="text-xs text-muted-foreground font-semibold mb-1">User</p>
                                <p className="text-sm text-foreground">{f.userMessage}</p>
                              </div>
                              <div className="bg-violet-50 rounded-lg p-3">
                                <p className="text-xs text-violet-500 font-semibold mb-1">Agent</p>
                                <p className="text-sm text-foreground">{f.agentResponse}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionExpander>
                  )}
                  {tc.workflowJson && (
                    <SectionExpander title="Workflow JSON (import into n8n)">
                      <CodeBlock content={JSON.stringify(tc.workflowJson, null, 2)} />
                    </SectionExpander>
                  )}
                  {tc.files && (
                    <SectionExpander title="Source Files">
                      <div className="space-y-3">
                        {tc.files.map((f: any, i: number) => (
                          <div key={i}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono bg-muted text-foreground px-2 py-0.5 rounded">{f.path}</span>
                            </div>
                            <CodeBlock content={f.content} />
                          </div>
                        ))}
                      </div>
                    </SectionExpander>
                  )}
                  {tc.setupGuide && (
                    <SectionExpander title="Setup Guide">
                      <ol className="space-y-2">
                        {tc.setupGuide.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                            <span className="w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </SectionExpander>
                  )}
                  {tc.customizationGuide && (
                    <SectionExpander title="Customization Guide">
                      <p className="text-sm text-foreground leading-relaxed">{tc.customizationGuide}</p>
                    </SectionExpander>
                  )}
                  {tc.monetizationIdeas && (
                    <SectionExpander title="Monetization Ideas">
                      <p className="text-sm text-foreground leading-relaxed">{tc.monetizationIdeas}</p>
                    </SectionExpander>
                  )}
                </div>
              )}

              {/* Landing Page Tab */}
              {activeTab === "landing" && (
                <div className="space-y-4">
                  {lp.headline && (
                    <div className="text-center bg-gradient-to-br from-slate-900 to-violet-900 rounded-xl p-8 text-white">
                      <h1 className="text-2xl md:text-3xl font-black mb-3">{lp.headline}</h1>
                      <p className="text-violet-200 text-lg mb-4">{lp.subheadline}</p>
                      <p className="text-muted-foreground/60 text-sm max-w-lg mx-auto">{lp.heroDescription}</p>
                    </div>
                  )}
                  {lp.problemStatement && (
                    <SectionExpander title="Problem + Solution" defaultOpen>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                          <p className="text-xs font-bold text-red-700 uppercase mb-2">The Problem</p>
                          <p className="text-sm text-foreground">{lp.problemStatement}</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                          <p className="text-xs font-bold text-green-700 uppercase mb-2">The Solution</p>
                          <p className="text-sm text-foreground">{lp.solutionStatement}</p>
                        </div>
                      </div>
                    </SectionExpander>
                  )}
                  {lp.benefits && (
                    <SectionExpander title="Benefits">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {lp.benefits.map((b: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground">{b}</p>
                          </div>
                        ))}
                      </div>
                    </SectionExpander>
                  )}
                  {lp.testimonials && (
                    <SectionExpander title="Testimonials">
                      <div className="grid md:grid-cols-2 gap-3">
                        {lp.testimonials.map((t: any, i: number) => (
                          <div key={i} className="bg-muted/30 border border rounded-xl p-4">
                            <div className="flex gap-0.5 mb-2">
                              {Array.from({ length: t.stars ?? 5 }).map((_, s) => (
                                <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <p className="text-sm text-foreground italic mb-3">"{t.text}"</p>
                            <p className="text-xs font-semibold text-foreground">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.role}</p>
                          </div>
                        ))}
                      </div>
                    </SectionExpander>
                  )}
                  {lp.faq && (
                    <SectionExpander title="FAQ">
                      <div className="space-y-3">
                        {lp.faq.map((f: any, i: number) => (
                          <div key={i}>
                            <p className="text-sm font-semibold text-foreground mb-1">Q: {f.q}</p>
                            <p className="text-sm text-muted-foreground">A: {f.a}</p>
                          </div>
                        ))}
                      </div>
                    </SectionExpander>
                  )}
                </div>
              )}

              {/* Marketing Tab */}
              {activeTab === "marketing" && (
                <div className="space-y-4">
                  {/* Generate Full Marketing Guide — Hero CTA */}
                  {!marketingGuide && (
                    <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 rounded-2xl p-6 text-white">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-6 h-6 text-violet-300" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black mb-1">Generate Full Marketing Guide</h3>
                          <p className="text-muted-foreground/60 text-sm mb-4 leading-relaxed">
                            AI writes a complete platform-by-platform playbook: Facebook/Meta ads with 3 copy variations, YouTube video script, TikTok scripts, Instagram content, Twitter thread, 3-email launch sequence, and a 7-day content calendar.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-5">
                            {[
                              { icon: Facebook, label: "Facebook Ads" },
                              { icon: Youtube, label: "YouTube Script" },
                              { icon: Instagram, label: "TikTok + Reels" },
                              { icon: Twitter, label: "Twitter Thread" },
                              { icon: Mail, label: "Email Sequence" },
                              { icon: Calendar, label: "Content Calendar" },
                            ].map(({ icon: Icon, label }) => (
                              <div key={label} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                                <Icon className="w-3 h-3 text-violet-300" />
                                <span className="text-xs text-muted-foreground/60 font-medium">{label}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={handleGenerateMarketingGuide}
                            disabled={generatingGuide}
                            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-primary hover:from-violet-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
                          >
                            {generatingGuide ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Generating — ~30 seconds…</>
                            ) : (
                              <><Sparkles className="w-4 h-4" /> Generate Full Marketing Guide</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Marketing Guide Results */}
                  {marketingGuide && (
                    <div className="space-y-4">
                      {/* Regenerate button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-foreground">Marketing guide generated</span>
                        </div>
                        <button onClick={() => { setMarketingGuide(null); }}
                          className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Regenerate
                        </button>
                      </div>

                      {/* Facebook / Meta Ads */}
                      {marketingGuide.facebook && (
                        <SectionExpander title="📘 Facebook / Meta Ads" defaultOpen>
                          <div className="space-y-4">
                            {["adCopy1", "adCopy2", "adCopy3"].map((key, i) => marketingGuide.facebook[key] && (
                              <div key={key} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Ad Variation {i + 1}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(marketingGuide.facebook[key]); toast({ title: "Copied!" }); }}
                                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{marketingGuide.facebook[key]}</p>
                              </div>
                            ))}
                            {marketingGuide.facebook.targeting && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Audience Targeting Strategy</p>
                                <p className="text-sm text-foreground leading-relaxed">{marketingGuide.facebook.targeting}</p>
                              </div>
                            )}
                            {marketingGuide.facebook.budgetStrategy && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Budget Strategy</p>
                                <p className="text-sm text-foreground leading-relaxed">{marketingGuide.facebook.budgetStrategy}</p>
                              </div>
                            )}
                            {marketingGuide.facebook.retargeting && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Retargeting Sequence</p>
                                <p className="text-sm text-foreground leading-relaxed">{marketingGuide.facebook.retargeting}</p>
                              </div>
                            )}
                          </div>
                        </SectionExpander>
                      )}

                      {/* YouTube */}
                      {marketingGuide.youtube && (
                        <SectionExpander title="▶️ YouTube Strategy">
                          <div className="space-y-4">
                            {marketingGuide.youtube.videoTitle && (
                              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                <p className="text-xs font-bold text-red-600 uppercase mb-1">Video Title</p>
                                <p className="font-bold text-foreground text-sm">{marketingGuide.youtube.videoTitle}</p>
                                <button onClick={() => { navigator.clipboard.writeText(marketingGuide.youtube.videoTitle); toast({ title: "Copied!" }); }}
                                  className="mt-1.5 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                              </div>
                            )}
                            {marketingGuide.youtube.thumbnailIdea && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Thumbnail Concept</p>
                                <p className="text-sm text-foreground">{marketingGuide.youtube.thumbnailIdea}</p>
                              </div>
                            )}
                            {marketingGuide.youtube.scriptHook && (
                              <div className="bg-muted/30 rounded-xl p-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">🎣 Hook (First 30 Seconds)</p>
                                <p className="text-sm text-foreground whitespace-pre-line">{marketingGuide.youtube.scriptHook}</p>
                              </div>
                            )}
                            {marketingGuide.youtube.scriptBody && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">📝 Main Script Body</p>
                                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{marketingGuide.youtube.scriptBody}</p>
                                <button onClick={() => { navigator.clipboard.writeText(marketingGuide.youtube.scriptBody); toast({ title: "Script copied!" }); }}
                                  className="mt-2 text-xs text-violet-600 hover:underline flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy script
                                </button>
                              </div>
                            )}
                            {marketingGuide.youtube.scriptCTA && (
                              <div className="bg-green-50 rounded-xl p-3">
                                <p className="text-xs font-bold text-green-700 uppercase mb-1">Closing CTA</p>
                                <p className="text-sm text-foreground whitespace-pre-line">{marketingGuide.youtube.scriptCTA}</p>
                              </div>
                            )}
                            {marketingGuide.youtube.tags && marketingGuide.youtube.tags.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">SEO Tags</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {marketingGuide.youtube.tags.map((t: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </SectionExpander>
                      )}

                      {/* TikTok */}
                      {marketingGuide.tiktok && (
                        <SectionExpander title="🎵 TikTok / Short-Form Video">
                          <div className="space-y-4">
                            {marketingGuide.tiktok.hooks && marketingGuide.tiktok.hooks.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">⚡ Hook Variations (first 3 seconds)</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {marketingGuide.tiktok.hooks.map((h: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-xl p-3">
                                      <span className="text-xs font-black text-violet-600 w-5">{i + 1}</span>
                                      <p className="text-sm text-foreground flex-1">{h}</p>
                                      <button onClick={() => { navigator.clipboard.writeText(h); toast({ title: "Hook copied!" }); }}
                                        className="text-muted-foreground hover:text-foreground flex-shrink-0">
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {marketingGuide.tiktok.script1 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">30-Second Script</p>
                                <p className="text-sm text-foreground whitespace-pre-line bg-pink-50 border border-pink-100 rounded-xl p-4">{marketingGuide.tiktok.script1}</p>
                                <button onClick={() => { navigator.clipboard.writeText(marketingGuide.tiktok.script1); toast({ title: "Script copied!" }); }}
                                  className="mt-1.5 text-xs text-violet-600 hover:underline flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy script
                                </button>
                              </div>
                            )}
                            {marketingGuide.tiktok.script2 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">45-Second Tutorial Script</p>
                                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{marketingGuide.tiktok.script2}</p>
                              </div>
                            )}
                            {marketingGuide.tiktok.sounds && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Sound Strategy</p>
                                <p className="text-sm text-foreground">{marketingGuide.tiktok.sounds}</p>
                              </div>
                            )}
                            {marketingGuide.tiktok.hashtags && marketingGuide.tiktok.hashtags.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Hashtags</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {marketingGuide.tiktok.hashtags.map((h: string, i: number) => (
                                    <span key={i} className="text-xs bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-medium">{h}</span>
                                  ))}
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(marketingGuide.tiktok.hashtags.join(" ")); toast({ title: "Hashtags copied!" }); }}
                                  className="mt-2 text-xs text-violet-600 hover:underline flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy all hashtags
                                </button>
                              </div>
                            )}
                          </div>
                        </SectionExpander>
                      )}

                      {/* Instagram */}
                      {marketingGuide.instagram && (
                        <SectionExpander title="📸 Instagram">
                          <div className="space-y-4">
                            {marketingGuide.instagram.reelScript && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Reel Script (60s)</p>
                                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{marketingGuide.instagram.reelScript}</p>
                              </div>
                            )}
                            {marketingGuide.instagram.carouselSlides && marketingGuide.instagram.carouselSlides.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Carousel Slide Copy</p>
                                <div className="flex flex-col gap-2">
                                  {marketingGuide.instagram.carouselSlides.map((s: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 bg-muted/30 rounded-xl p-3">
                                      <span className="w-6 h-6 bg-gradient-to-br from-pink-500 to-orange-500 text-white text-xs font-black rounded-lg flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                      <p className="text-sm text-foreground">{s}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {marketingGuide.instagram.caption && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Caption</p>
                                <div className="bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100 rounded-xl p-4">
                                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{marketingGuide.instagram.caption}</p>
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(marketingGuide.instagram.caption); toast({ title: "Caption copied!" }); }}
                                  className="mt-1.5 text-xs text-violet-600 hover:underline flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy caption
                                </button>
                              </div>
                            )}
                            {marketingGuide.instagram.hashtags && marketingGuide.instagram.hashtags.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Hashtags</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {marketingGuide.instagram.hashtags.map((h: string, i: number) => (
                                    <span key={i} className="text-xs bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-medium">{h}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </SectionExpander>
                      )}

                      {/* Twitter / X */}
                      {marketingGuide.twitter && (
                        <SectionExpander title="🐦 Twitter / X">
                          <div className="space-y-4">
                            {marketingGuide.twitter.thread && marketingGuide.twitter.thread.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-bold text-muted-foreground uppercase">Thread</p>
                                  <button onClick={() => { navigator.clipboard.writeText(marketingGuide.twitter.thread.join("\n\n")); toast({ title: "Thread copied!" }); }}
                                    className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> Copy thread
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {marketingGuide.twitter.thread.map((t: string, i: number) => (
                                    <div key={i} className="flex gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 bg-slate-950 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</div>
                                        {i < marketingGuide.twitter.thread.length - 1 && <div className="w-px flex-1 bg-muted mt-1" />}
                                      </div>
                                      <div className="bg-muted/30 rounded-xl p-3 mb-2 flex-1">
                                        <p className="text-sm text-foreground">{t}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {marketingGuide.twitter.singleTweet1 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Standalone Tweets</p>
                                <div className="space-y-2">
                                  {[marketingGuide.twitter.singleTweet1, marketingGuide.twitter.singleTweet2].filter(Boolean).map((t: string, i: number) => (
                                    <div key={i} className="bg-slate-950 rounded-xl p-3 flex items-start gap-2">
                                      <p className="text-sm text-white flex-1">{t}</p>
                                      <button onClick={() => { navigator.clipboard.writeText(t); toast({ title: "Copied!" }); }}
                                        className="text-muted-foreground hover:text-white flex-shrink-0"><Copy className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </SectionExpander>
                      )}

                      {/* Email Sequence */}
                      {marketingGuide.email && (
                        <SectionExpander title="📧 3-Email Launch Sequence">
                          <div className="space-y-4">
                            {marketingGuide.email.subject1 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-xs font-bold text-amber-700 uppercase mb-1">Subject Lines</p>
                                <p className="text-sm font-medium text-foreground">1. {marketingGuide.email.subject1}</p>
                                {marketingGuide.email.subject2 && <p className="text-sm font-medium text-foreground mt-1">2. {marketingGuide.email.subject2}</p>}
                              </div>
                            )}
                            {["email1", "email2", "email3"].map((key, i) => marketingGuide.email[key] && (
                              <div key={key}>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">
                                  {i === 0 ? "Email 1 — Launch Announcement" : i === 1 ? "Email 2 — Social Proof (Day 3)" : "Email 3 — Last Chance Urgency"}
                                </p>
                                <div className="bg-muted/30 border border rounded-xl p-4">
                                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{marketingGuide.email[key]}</p>
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(marketingGuide.email[key]); toast({ title: `Email ${i + 1} copied!` }); }}
                                  className="mt-1.5 text-xs text-violet-600 hover:underline flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy email {i + 1}
                                </button>
                              </div>
                            ))}
                          </div>
                        </SectionExpander>
                      )}

                      {/* 7-Day Content Calendar */}
                      {marketingGuide.contentCalendar && marketingGuide.contentCalendar.length > 0 && (
                        <SectionExpander title="📅 7-Day Content Calendar">
                          <div className="space-y-2">
                            {marketingGuide.contentCalendar.map((item: any, i: number) => (
                              <div key={i} className="flex gap-3 items-start p-3 bg-muted/30 rounded-xl">
                                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-black text-violet-700">D{item.day}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-bold text-muted-foreground uppercase">{item.platform}</span>
                                  <p className="text-sm text-foreground mt-0.5 leading-relaxed">{item.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SectionExpander>
                      )}

                      {/* Pricing Psychology */}
                      {marketingGuide.pricingPsychology && (
                        <SectionExpander title="💰 Pricing Psychology">
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-sm text-foreground leading-relaxed">{marketingGuide.pricingPsychology}</p>
                          </div>
                        </SectionExpander>
                      )}
                    </div>
                  )}

                  {/* Base marketing assets from template generation */}
                  <div className="border-t border pt-4 space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quick Assets (from generation)</p>
                  {ma.marketplaceDescription && (
                    <SectionExpander title="Marketplace Description">
                      <div className="relative">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ma.marketplaceDescription}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(ma.marketplaceDescription); toast({ title: "Copied!" }); }}
                          className="mt-2 text-xs text-violet-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </SectionExpander>
                  )}
                  {ma.twitterHook && (
                    <SectionExpander title="Twitter/X Hook">
                      <div className="bg-slate-950 rounded-xl p-4">
                        <p className="text-white text-sm">{ma.twitterHook}</p>
                        <button onClick={() => { navigator.clipboard.writeText(ma.twitterHook); toast({ title: "Copied!" }); }}
                          className="mt-2 text-xs text-muted-foreground hover:text-white flex items-center gap-1">
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </SectionExpander>
                  )}
                  {ma.linkedinPost && (
                    <SectionExpander title="LinkedIn Post">
                      <p className="text-sm text-foreground whitespace-pre-line">{ma.linkedinPost}</p>
                      <button onClick={() => { navigator.clipboard.writeText(ma.linkedinPost); toast({ title: "Copied!" }); }}
                        className="mt-2 text-xs text-violet-600 hover:underline flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </SectionExpander>
                  )}
                  {ma.emailSubjectLine && (
                    <SectionExpander title="Email Campaign">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Subject Line</p>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-900 font-medium">{ma.emailSubjectLine}</p>
                          </div>
                        </div>
                        {ma.emailBody && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Email Body</p>
                            <p className="text-sm text-foreground whitespace-pre-line">{ma.emailBody}</p>
                          </div>
                        )}
                      </div>
                    </SectionExpander>
                  )}
                  {ma.tiktokScript && (
                    <SectionExpander title="TikTok / Reel Script">
                      <p className="text-sm text-foreground whitespace-pre-line">{ma.tiktokScript}</p>
                    </SectionExpander>
                  )}
                  {ma.usp && (
                    <SectionExpander title="Unique Selling Proposition">
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                        <p className="text-sm text-violet-900 font-semibold">{ma.usp}</p>
                      </div>
                    </SectionExpander>
                  )}
                  {ma.tags && ma.tags.length > 0 && (
                    <SectionExpander title="SEO Tags">
                      <div className="flex flex-wrap gap-2">
                        {ma.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </SectionExpander>
                  )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Re-generate */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => { setTemplate(null); setTemplateId(null); }}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate Another Template
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
