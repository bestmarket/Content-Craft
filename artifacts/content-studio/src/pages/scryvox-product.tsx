import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, ChevronRight, CheckCircle2, Circle, BookOpen,
  Target, PenTool, Star, TrendingUp, Megaphone, ArrowLeft,
  Download, Copy, Lightbulb, AlertTriangle
} from "lucide-react";

const STAGES = ["research", "architect", "content", "critic", "sellability", "marketing", "complete"] as const;
type Stage = typeof STAGES[number];

const STAGE_META = [
  { key: "research",    icon: Target,      label: "Research",       desc: "Build knowledge base, FAQs & frameworks" },
  { key: "architect",   icon: BookOpen,    label: "Architect",      desc: "Create product structure & table of contents" },
  { key: "content",     icon: PenTool,     label: "Content",        desc: "Write all chapters" },
  { key: "critic",      icon: Star,        label: "Critic",         desc: "Find weaknesses & score the product" },
  { key: "sellability", icon: TrendingUp,  label: "Sellability",    desc: "Optimize pricing & conversion" },
  { key: "marketing",   icon: Megaphone,   label: "Marketing",      desc: "Create all promotion assets" },
];

function stageIndex(stage: string) {
  return STAGES.indexOf(stage as Stage);
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function ResearchView({ data }: { data: any }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-indigo-400 font-semibold mb-2 text-sm uppercase tracking-wider">Topic Overview</h3>
        <p className="text-gray-200 leading-relaxed">{data.topicOverview}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700">
          <h3 className="text-primary/80 font-semibold mb-3 text-sm uppercase tracking-wider">Target Audience</h3>
          <p className="text-gray-300 text-sm mb-3">{data.audienceProfile?.primaryDescription}</p>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Pain Points</p>
            <ul className="space-y-1">
              {data.audienceProfile?.painPoints?.slice(0, 3).map((p: string, i: number) => (
                <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-red-400 mt-0.5">•</span>{p}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700">
          <h3 className="text-green-400 font-semibold mb-3 text-sm uppercase tracking-wider">Core Frameworks</h3>
          <div className="space-y-3">
            {data.coreFrameworks?.slice(0, 3).map((f: any, i: number) => (
              <div key={i} className="border-l-2 border-indigo-500/50 pl-3">
                <p className="text-white text-sm font-medium">{f.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{f.keyPrinciple}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-yellow-400 font-semibold mb-3 text-sm uppercase tracking-wider">FAQs ({data.faqs?.length})</h3>
        <div className="space-y-2">
          {data.faqs?.slice(0, 6).map((f: any, i: number) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden">
              <button className="w-full text-left p-3 text-sm text-gray-200 font-medium flex justify-between items-center" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                {f.question}
                <span className="text-gray-500 text-xs ml-2">{faqOpen === i ? "▲" : "▼"}</span>
              </button>
              {faqOpen === i && <div className="px-3 pb-3 text-gray-400 text-sm border-t border-gray-700 pt-2">{f.answer}</div>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-blue-400 font-semibold mb-2 text-sm uppercase tracking-wider">Unique Angles</h3>
        <ul className="space-y-1">
          {data.uniqueAngles?.map((a: string, i: number) => (
            <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-indigo-400">→</span>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ArchitectView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-950/50 border border-indigo-700/40 rounded-xl p-5">
        <h2 className="text-2xl font-bold text-white mb-1">{data.productTitle}</h2>
        <p className="text-indigo-300 text-sm">{data.subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.titleAlternatives?.map((t: string, i: number) => (
            <Badge key={i} className="bg-gray-800 text-gray-300 border-gray-600 text-xs">{t}</Badge>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-yellow-400 font-semibold mb-1 text-sm uppercase tracking-wider">Promise</h3>
        <p className="text-gray-300 italic">"{data.promiseSentence}"</p>
      </div>
      <div>
        <h3 className="text-indigo-400 font-semibold mb-3 text-sm uppercase tracking-wider">Table of Contents ({data.tableOfContents?.length} chapters, ~{(data.totalWordCountTarget || 0).toLocaleString()} words)</h3>
        <div className="space-y-2">
          {data.tableOfContents?.map((ch: any) => (
            <div key={ch.number} className="flex gap-3 items-start bg-gray-900/60 border border-gray-700 rounded-lg p-3">
              <span className="text-indigo-400 font-bold text-sm w-6 shrink-0">{ch.number}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{ch.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{ch.subtitle}</p>
              </div>
              <span className="text-gray-500 text-xs shrink-0">{(ch.wordCountTarget || 0).toLocaleString()}w</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700">
          <h3 className="text-green-400 font-semibold mb-2 text-sm uppercase tracking-wider">UVP</h3>
          <p className="text-gray-300 text-sm">{data.uniqueValueProposition}</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700">
          <h3 className="text-primary/80 font-semibold mb-2 text-sm uppercase tracking-wider">Target Reader</h3>
          <p className="text-gray-300 text-sm">{data.targetReaderProfile}</p>
        </div>
      </div>
    </div>
  );
}

function ContentView({ data }: { data: any }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const chapter = data.chapters?.[activeChapter];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{data.chapters?.length} chapters · {(data.totalWordCount || 0).toLocaleString()} words total</p>
        <Button size="sm" variant="outline" className="gap-1 text-xs border-gray-600" onClick={() => copyText(data.fullMarkdown ?? data.fullContent ?? "")}>
          <Copy className="w-3 h-3" /> Copy Full Content
        </Button>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-1">
          {data.chapters?.map((ch: any, i: number) => (
            <button key={i} onClick={() => setActiveChapter(i)}
              className={`w-full text-left p-2.5 rounded-lg text-sm transition-all ${activeChapter === i ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
              <span className="font-medium">{ch.number}.</span> {ch.title.split("—")[0].slice(0, 30)}
            </button>
          ))}
        </div>
        {chapter && (
          <div className="md:col-span-3 bg-gray-900/60 border border-gray-700 rounded-xl p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <h3 className="text-white font-bold text-lg">{chapter.title}</h3>
              <p className="text-gray-400 text-sm">{chapter.subtitle} · {chapter.wordCount?.toLocaleString()} words</p>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-700/30 rounded-lg p-3 italic text-indigo-200 text-sm">"{chapter.hook}"</div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1 uppercase">Overview</p>
              <p className="text-gray-300 text-sm leading-relaxed">{chapter.overview}</p>
            </div>
            {chapter.sections?.slice(0, 2).map((s: any, i: number) => (
              <div key={i}>
                <p className="text-indigo-400 font-semibold text-sm mb-1">{s.sectionTitle}</p>
                <p className="text-gray-300 text-sm leading-relaxed">{s.body?.slice(0, 400)}{s.body?.length > 400 ? "..." : ""}</p>
              </div>
            ))}
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
              <p className="text-yellow-400 text-xs font-medium mb-1">💡 Key Insight</p>
              <p className="text-gray-200 text-sm">{chapter.keyInsight}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase">Action Steps</p>
              {chapter.actionSteps?.map((step: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="text-indigo-400 font-bold text-xs shrink-0 mt-0.5">Step {i + 1}</span>
                  <p className="text-gray-300 text-xs">{step.slice(0, 200)}{step.length > 200 ? "..." : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CriticView({ data }: { data: any }) {
  const scoreColor = (s: number) => s >= 75 ? "text-green-400" : s >= 55 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall", val: data.overallScore },
          { label: "Content Quality", val: data.contentQualityScore },
          { label: "Audience Fit", val: data.audienceAlignmentScore },
          { label: "Sellability", val: data.sellabilityScore },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${scoreColor(val)}`}>{val}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {data.readyForSale ? (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">✓ Ready for sale</Badge>
        ) : (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">⚠ Needs improvement first</Badge>
        )}
      </div>
      <div>
        <h3 className="text-green-400 font-semibold mb-3 text-sm uppercase tracking-wider">Strengths</h3>
        <ul className="space-y-1">
          {data.strengths?.map((s: string, i: number) => (
            <li key={i} className="flex gap-2 text-gray-300 text-sm"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />{s}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-orange-400 font-semibold mb-3 text-sm uppercase tracking-wider">Weaknesses to Fix</h3>
        <div className="space-y-3">
          {data.weaknesses?.map((w: any, i: number) => (
            <div key={i} className={`rounded-xl p-4 border ${w.severity === "high" ? "border-red-700/40 bg-red-950/20" : w.severity === "medium" ? "border-orange-700/40 bg-orange-950/20" : "border-gray-700 bg-gray-900/40"}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-4 h-4 ${w.severity === "high" ? "text-red-400" : w.severity === "medium" ? "text-orange-400" : "text-gray-400"}`} />
                <span className="text-white text-sm font-semibold">{w.area}</span>
                <Badge className="text-xs">{w.severity}</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-2">{w.description}</p>
              <p className="text-indigo-300 text-xs"><strong>Fix:</strong> {w.specificFix}</p>
            </div>
          ))}
        </div>
      </div>
      {data.missingElements?.length > 0 && (
        <div>
          <h3 className="text-yellow-400 font-semibold mb-2 text-sm uppercase tracking-wider">Missing Elements</h3>
          <ul className="space-y-1">
            {data.missingElements.map((m: string, i: number) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-yellow-400">○</span>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SellabilityView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-950/50 border border-indigo-700/40 rounded-xl p-5">
        <p className="text-xs text-gray-400 mb-1">Revised Title</p>
        <h2 className="text-xl font-bold text-white">{data.revisedTitle}</h2>
        <p className="text-indigo-300 text-sm mt-1">{data.revisedSubtitle}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {data.pricingRecommendation?.tierBreakdown?.map((tier: any, i: number) => (
          <div key={i} className={`rounded-xl p-4 border ${i === 0 ? "border-gray-700 bg-gray-900/60" : i === 1 ? "border-indigo-600/50 bg-indigo-950/40" : "border-purple-600/50 bg-purple-950/30"}`}>
            <p className="text-gray-400 text-xs mb-1">{tier.name}</p>
            <p className={`text-2xl font-bold ${i === 0 ? "text-white" : i === 1 ? "text-indigo-300" : "text-primary/70"}`}>${tier.price}</p>
            <ul className="mt-2 space-y-0.5">
              {tier.includes?.map((inc: string, j: number) => (
                <li key={j} className="text-gray-400 text-xs flex gap-1"><span className="text-green-400">✓</span>{inc}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <p className="text-gray-400 text-xs italic">{data.pricingRecommendation?.psychologicalPricingNote}</p>
      </div>
      <div>
        <h3 className="text-yellow-400 font-semibold mb-3 text-sm uppercase tracking-wider">Bonus Ideas</h3>
        <div className="space-y-2">
          {data.bonusIdeas?.map((b: any, i: number) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-lg p-3 flex justify-between items-start gap-3">
              <div>
                <p className="text-white text-sm font-medium">{b.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{b.description}</p>
              </div>
              <Badge className="bg-green-900/40 text-green-300 border-green-700/40 text-xs shrink-0">{b.perceivedValue}</Badge>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-orange-400 font-semibold mb-2 text-sm uppercase tracking-wider">Urgency Elements</h3>
        <ul className="space-y-1">
          {data.urgencyElements?.slice(0, 3).map((u: string, i: number) => (
            <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-orange-400">⏱</span>{u}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-blue-400 font-semibold mb-2 text-sm uppercase tracking-wider">Target Platforms</h3>
        <div className="flex flex-wrap gap-2">
          {data.targetPlatforms?.map((p: string, i: number) => (
            <Badge key={i} className="bg-blue-900/30 text-blue-300 border-blue-700/40">{p}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketingView({ data }: { data: any }) {
  const [tab, setTab] = useState("sales");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="bg-gray-800 mb-4 flex-wrap h-auto gap-1">
        <TabsTrigger value="sales">Sales Copy</TabsTrigger>
        <TabsTrigger value="emails">Email Sequence</TabsTrigger>
        <TabsTrigger value="social">Social Posts</TabsTrigger>
        <TabsTrigger value="ads">Ad Copy</TabsTrigger>
        <TabsTrigger value="youtube">YouTube</TabsTrigger>
        <TabsTrigger value="landing">Landing Sections</TabsTrigger>
      </TabsList>
      <TabsContent value="sales">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="gap-1 text-xs border-gray-600" onClick={() => copyText(data.salesCopy?.fullSalesPage ?? "")}>
              <Copy className="w-3 h-3" /> Copy Full Sales Page
            </Button>
          </div>
          <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Headline</p>
              <p className="text-white text-xl font-bold">{data.salesCopy?.headline}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Subheadline</p>
              <p className="text-indigo-300 text-base">{data.salesCopy?.subheadline}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Bullet Points</p>
              <ul className="space-y-2">
                {data.salesCopy?.bulletPoints?.map((b: string, i: number) => (
                  <li key={i} className="text-gray-300 text-sm leading-relaxed">{b}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Guarantee</p>
              <p className="text-gray-200 text-sm">{data.salesCopy?.guarantee}</p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="emails">
        <div className="space-y-4">
          {[data.emailSequence?.email1, data.emailSequence?.email2, data.emailSequence?.email3].filter(Boolean).map((email: any, i: number) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Badge className="bg-indigo-900/50 text-indigo-300 border-indigo-700/40 mb-2">Email {i + 1}: {email.purpose?.split("—")[0]?.trim()}</Badge>
                  <p className="text-white font-semibold text-sm">Subject: {email.subject}</p>
                  <p className="text-gray-400 text-xs">Preview: {email.previewText}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-white" onClick={() => copyText(email.body)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-gray-300 text-xs whitespace-pre-wrap font-sans leading-relaxed border-t border-gray-700 pt-3 mt-3">{email.body}</pre>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="social">
        <div className="space-y-4">
          {data.socialPosts?.map((post: any, i: number) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2 items-center">
                  <Badge className="bg-blue-900/40 text-blue-300 border-blue-700/40">{post.platform}</Badge>
                  {post.bestTimeToPost && <span className="text-gray-500 text-xs">{post.bestTimeToPost}</span>}
                </div>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-white" onClick={() => copyText(post.post)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-gray-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">{post.post}</pre>
              {post.hashtags?.length > 0 && (
                <p className="text-indigo-400 text-xs mt-2">{post.hashtags.join(" ")}</p>
              )}
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="ads">
        <div className="space-y-4">
          {data.adCopy?.map((ad: any, i: number) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                  <Badge className="bg-orange-900/40 text-orange-300 border-orange-700/40">{ad.variant}</Badge>
                  <Badge className="bg-gray-700 text-gray-300 border-gray-600">{ad.format}</Badge>
                </div>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-white" onClick={() => copyText(`${ad.headline}\n\n${ad.primaryText}\n\nCTA: ${ad.callToAction}`)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-white font-bold mb-1">{ad.headline}</p>
              <p className="text-gray-300 text-sm mb-2">{ad.primaryText}</p>
              <p className="text-green-400 text-sm font-medium">CTA: {ad.callToAction}</p>
              <p className="text-gray-500 text-xs mt-1">Target: {ad.targetAudience}</p>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="youtube">
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Video Title</p>
            <p className="text-white font-bold text-lg">{data.youtubeVideo?.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Hook</p>
            <p className="text-gray-200 italic">"{data.youtubeVideo?.hook}"</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Thumbnail Concept</p>
            <p className="text-yellow-300 text-sm">{data.youtubeVideo?.thumbnail}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Outline</p>
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">{data.youtubeVideo?.outline}</pre>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="landing">
        <div className="space-y-3">
          {data.landingSections?.map((s: any, i: number) => (
            <div key={i} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-semibold text-sm">{s.name}</p>
                  <p className="text-gray-500 text-xs">{s.purpose}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-white" onClick={() => copyText(s.content)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <pre className="text-gray-300 text-xs whitespace-pre-wrap font-sans mt-2 border-t border-gray-700 pt-2">{s.content}</pre>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function NewProductForm({ onCreated }: { onCreated: (product: any, research: any) => void }) {
  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!topic.trim()) return;
    setCreating(true); setError("");
    try {
      const r = await apiClient.post("/scryvox/products", { topic: topic.trim() });
      onCreated(r.data.product, r.data.researchData);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to start product");
    }
    setCreating(false);
  }

  return (
    <Card className="bg-gray-800/60 border-gray-700 max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle className="text-white">Start a New Product</CardTitle>
        <p className="text-gray-400 text-sm">Enter your product topic and Scryvox will run 6 engines to build it from scratch</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-gray-300">Product Topic</Label>
          <Input
            className="mt-1 bg-gray-900 border-gray-600 text-white"
            placeholder="e.g. Building morning routines, Financial freedom, Stoic mindset..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button onClick={handleCreate} disabled={creating || !topic.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
          {creating ? <><Loader2 className="w-4 h-4 animate-spin" />Running Research Engine...</> : "Start Pipeline →"}
        </Button>
        <div className="grid grid-cols-6 gap-1 pt-2">
          {STAGE_META.map((s, i) => (
            <div key={i} className="text-center">
              <div className="bg-gray-700/60 rounded-lg p-2 mb-1"><s.icon className="w-4 h-4 text-gray-400 mx-auto" /></div>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScryvoxProduct() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = params.id === "new";

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (isNew || !params.id) return;
    apiClient.get(`/scryvox/products/${params.id}`)
      .then(r => setProduct(r.data.product))
      .catch(() => toast({ title: "Product not found", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function runNextStage() {
    if (!product) return;
    setRunning(true);
    try {
      const r = await apiClient.post(`/scryvox/products/${product.id}/next`, {});
      setProduct(r.data.product);
      toast({ title: `${r.data.completedStage.charAt(0).toUpperCase() + r.data.completedStage.slice(1)} complete!`, description: `Next: ${r.data.nextStage}` });
    } catch (e: any) {
      toast({ title: "Stage failed", description: e?.response?.data?.error, variant: "destructive" });
    }
    setRunning(false);
  }

  function handleCreated(prod: any, researchData: any) {
    const withResearch = { ...prod, researchData };
    setProduct(withResearch);
    navigate(`/scryvox/products/${prod.id}`);
  }

  const currentStageIdx = product ? stageIndex(product.stage) : -1;
  const isComplete = product?.stage === "complete";

  const stageDataMap: Record<string, any> = {
    research:    product?.researchData,
    architect:   product?.architectData,
    content:     product?.contentData,
    critic:      product?.criticData,
    sellability: product?.sellabilityData,
    marketing:   product?.marketingData,
  };

  const STAGE_VIEWS: Record<string, (data: any) => React.ReactElement> = {
    research:    (d) => <ResearchView data={d} />,
    architect:   (d) => <ArchitectView data={d} />,
    content:     (d) => <ContentView data={d} />,
    critic:      (d) => <CriticView data={d} />,
    sellability: (d) => <SellabilityView data={d} />,
    marketing:   (d) => <MarketingView data={d} />,
  };

  const nextStageLabel = product && !isComplete
    ? STAGE_META[currentStageIdx]?.label ?? product.stage
    : null;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/scryvox/products" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-white">{product?.title ?? "New Product"}</h1>
            <p className="text-gray-400 text-sm">Product Pipeline · Scryvox</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
        ) : isNew && !product ? (
          <NewProductForm onCreated={handleCreated} />
        ) : product ? (
          <div className="space-y-6">
            {/* Stage progress */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STAGE_META.map((s, i) => {
                const done = currentStageIdx > i || isComplete;
                const current = currentStageIdx === i && !isComplete;
                const hasData = !!stageDataMap[s.key];
                return (
                  <div key={s.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm shrink-0 transition-all
                    ${done ? "border-indigo-600/50 bg-indigo-950/30 text-indigo-300" :
                      current ? "border-indigo-500 bg-indigo-900/40 text-white" :
                      "border-gray-700 bg-gray-800/40 text-gray-500"}`}>
                    {done ? <CheckCircle2 className="w-4 h-4 text-indigo-400" /> : <s.icon className="w-4 h-4" />}
                    <span>{s.label}</span>
                  </div>
                );
              })}
              {isComplete && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-600/50 bg-emerald-950/30 text-emerald-300 text-sm shrink-0">
                  <CheckCircle2 className="w-4 h-4" /> Complete
                </div>
              )}
            </div>

            {/* Stage outputs — accordion */}
            <div className="space-y-3">
              {STAGE_META.map((s, i) => {
                const data = stageDataMap[s.key];
                if (!data) return null;
                const done = currentStageIdx > i || isComplete;
                return (
                  <Card key={s.key} className={`border ${done ? "border-indigo-700/40 bg-gray-900/60" : "border-indigo-500 bg-indigo-950/20"}`}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        {done ? <CheckCircle2 className="w-4 h-4 text-indigo-400" /> : <s.icon className="w-4 h-4 text-indigo-400" />}
                        {s.label} Engine Output
                        <Badge className="ml-auto bg-indigo-900/50 text-indigo-300 border-indigo-700/40 text-xs">Done</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{STAGE_VIEWS[s.key]?.(data)}</CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Run next stage button */}
            {!isComplete && (
              <div className="sticky bottom-6 flex justify-center">
                <Button
                  onClick={runNextStage}
                  disabled={running}
                  size="lg"
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-900/50 px-8"
                >
                  {running ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Running {nextStageLabel} Engine...</>
                  ) : (
                    <><Lightbulb className="w-5 h-5" />Run {nextStageLabel} Engine<ChevronRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            )}

            {isComplete && (
              <Card className="border-emerald-700/40 bg-emerald-950/20">
                <CardContent className="py-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-white text-xl font-bold mb-2">Product Complete!</h3>
                  <p className="text-gray-400 mb-4">All 6 engines have run. Your product, critique, pricing, and full marketing kit are above.</p>
                  <Button
                    onClick={() => copyText(product?.contentData?.fullMarkdown ?? product?.contentData?.fullContent ?? "")}
                    variant="outline" className="gap-2 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/30"
                  >
                    <Download className="w-4 h-4" /> Copy Full Content
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
