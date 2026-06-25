import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGetMe } from "@workspace/api-client-react";
import { apiClient } from "@/lib/api";
import {
  Loader2, Sparkles, FileText, Globe, Megaphone, DollarSign,
  CheckCircle, Download, Upload, Image, BookOpen, ArrowRight,
  ExternalLink, Copy, Share2, ChevronDown, ChevronRight,
  TrendingUp, AlertTriangle, Zap, ListChecks, HelpCircle, Library,
  Wrench, BookMarked, LayoutTemplate, Briefcase, BarChart2,
  Star, XCircle, ArrowUpRight, Target, ChevronUp, Mail, Mic, Volume2
} from "lucide-react";

const PAGE_COUNTS = [
  { value: 10, label: "10 pages", desc: "Quick guide ($7–$17)" },
  { value: 20, label: "20 pages", desc: "Standard guide ($17–$27)", popular: true },
  { value: 30, label: "30 pages", desc: "Complete guide ($27–$37)" },
  { value: 40, label: "40 pages", desc: "Premium guide ($37–$47)" },
  { value: 50, label: "50 pages", desc: "Ultimate guide ($47–$97)" },
];

function CampaignTabs({ campaign, copyToClipboard }: { campaign: any; copyToClipboard: (t: string, l: string) => void }) {
  const [mTab, setMTab] = useState<"tiktok"|"youtube"|"facebook"|"ads"|"instagram"|"twitter"|"sales"|"strategies">("tiktok");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1 border-b">
        {[
          { id: "tiktok", label: "🎵 TikTok" },
          { id: "youtube", label: "▶️ YouTube" },
          { id: "facebook", label: "👥 Facebook" },
          { id: "ads", label: "📣 FB Ads" },
          { id: "instagram", label: "📸 Instagram" },
          { id: "twitter", label: "🐦 Twitter/X" },
          { id: "sales", label: "💬 Sales Scripts" },
          { id: "strategies", label: "🚀 Strategies" },
        ].map(t => (
          <button key={t.id} onClick={() => setMTab(t.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${mTab === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >{t.label}</button>
        ))}
      </div>

      {/* TikTok */}
      {mTab === "tiktok" && (
        <div className="space-y-4">
          {campaign.tiktokGuide && (
            <Card className="p-4 border bg-gradient-to-br from-gray-950 to-gray-800 text-white">
              <p className="text-xs font-bold text-pink-400 mb-2">🎵 TIKTOK STRATEGY</p>
              <p className="text-sm text-gray-200 mb-3">{campaign.tiktokGuide.overview}</p>
              {Array.isArray(campaign.tiktokGuide.algorithmTips) && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-pink-300 mb-2">Algorithm Tips</p>
                  <ul className="space-y-1">{campaign.tiktokGuide.algorithmTips.map((tip: string, i: number) => <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5"><span className="text-pink-400 mt-0.5">▸</span>{tip}</li>)}</ul>
                </div>
              )}
              {campaign.tiktokGuide.postingSchedule && <div className="bg-white/10 rounded-lg p-2.5 text-xs text-gray-200">{campaign.tiktokGuide.postingSchedule}</div>}
            </Card>
          )}
          {Array.isArray(campaign.tiktok) && campaign.tiktok.map((script: any, i: number) => (
            <Card key={i} className="p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-black text-white border-0 text-xs">TikTok Script {i + 1}</Badge>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(script.script, "Script")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
              </div>
              <p className="text-xs font-bold text-pink-600 mb-1">Hook: {script.hook}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{script.script}</p>
              {script.caption && <p className="text-xs text-muted-foreground mt-2 italic">{script.caption}</p>}
              <p className="text-xs text-muted-foreground mt-1">{script.hashtags?.join(" ")}</p>
            </Card>
          ))}
          {Array.isArray(campaign.contentIdeas) && campaign.contentIdeas.length > 0 && (
            <Card className="p-4 border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Content Ideas</p>
              <ul className="space-y-1.5">{campaign.contentIdeas.map((idea: string, i: number) => <li key={i} className="text-sm text-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{idea}</li>)}</ul>
            </Card>
          )}
        </div>
      )}

      {/* YouTube */}
      {mTab === "youtube" && (
        <div className="space-y-4">
          {campaign.youtubeGuide && (
            <Card className="p-4 border bg-red-50 border-red-200">
              <p className="text-xs font-bold text-red-700 mb-2">▶️ YOUTUBE STRATEGY</p>
              <p className="text-sm text-red-800 mb-3">{campaign.youtubeGuide.overview}</p>
              <div className="grid md:grid-cols-2 gap-3">
                {Array.isArray(campaign.youtubeGuide.seoTips) && (
                  <div><p className="text-xs font-bold text-red-700 mb-1">SEO Tips</p><ul className="space-y-1">{campaign.youtubeGuide.seoTips.map((tip: string, i: number) => <li key={i} className="text-xs text-red-800 flex items-start gap-1.5"><span className="text-red-500 mt-0.5">▸</span>{tip}</li>)}</ul></div>
                )}
                {Array.isArray(campaign.youtubeGuide.thumbnailTips) && (
                  <div><p className="text-xs font-bold text-red-700 mb-1">Thumbnail Tips</p><ul className="space-y-1">{campaign.youtubeGuide.thumbnailTips.map((tip: string, i: number) => <li key={i} className="text-xs text-red-800 flex items-start gap-1.5"><span className="text-red-500 mt-0.5">▸</span>{tip}</li>)}</ul></div>
                )}
              </div>
              {campaign.youtubeGuide.channelStrategy && <div className="mt-3 bg-white rounded-lg p-3 border border-red-100"><p className="text-xs font-bold text-red-700 mb-1">Channel Strategy</p><p className="text-xs text-red-800">{campaign.youtubeGuide.channelStrategy}</p></div>}
            </Card>
          )}
          {Array.isArray(campaign.youtubeShorts) && campaign.youtubeShorts.map((short: any, i: number) => (
            <Card key={i} className="p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-red-500 text-white border-0 text-xs">YouTube Short {i + 1}</Badge>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(short.script, "Short script")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
              </div>
              <p className="font-semibold text-sm text-foreground mb-2">{short.title}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{short.script}</p>
            </Card>
          ))}
          {campaign.youtubeLong && (
            <Card className="p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-red-600 text-white border-0 text-xs">YouTube Long-form</Badge>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(campaign.youtubeLong.script, "Script")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
              </div>
              <p className="font-bold text-foreground mb-1">{campaign.youtubeLong.title}</p>
              {campaign.youtubeLong.description && <p className="text-xs text-muted-foreground mb-2 bg-muted/30 p-2 rounded">{campaign.youtubeLong.description}</p>}
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 max-h-60 overflow-y-auto">{campaign.youtubeLong.script}</p>
            </Card>
          )}
        </div>
      )}

      {/* Facebook Guide */}
      {mTab === "facebook" && (
        <div className="space-y-4">
          {campaign.facebookGuide ? (
            <>
              <Card className="p-4 border bg-blue-50 border-blue-200">
                <p className="text-xs font-bold text-blue-700 mb-2">👥 FACEBOOK MARKETING STRATEGY</p>
                <p className="text-sm text-blue-900 mb-3">{campaign.facebookGuide.overview}</p>
                {campaign.facebookGuide.organicStrategy && (
                  <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100"><p className="text-xs font-bold text-blue-700 mb-1">Organic Strategy</p><p className="text-sm text-blue-800">{campaign.facebookGuide.organicStrategy}</p></div>
                )}
                {campaign.facebookGuide.groupStrategy && (
                  <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100"><p className="text-xs font-bold text-blue-700 mb-1">Facebook Groups Strategy</p><p className="text-sm text-blue-800">{campaign.facebookGuide.groupStrategy}</p></div>
                )}
                {Array.isArray(campaign.facebookGuide.bestPractices) && (
                  <div><p className="text-xs font-bold text-blue-700 mb-2">Best Practices</p><ul className="space-y-1">{campaign.facebookGuide.bestPractices.map((p: string, i: number) => <li key={i} className="text-xs text-blue-900 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />{p}</li>)}</ul></div>
                )}
              </Card>
              {Array.isArray(campaign.facebookGuide.postIdeas) && (
                <Card className="p-4 border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Facebook Post Ideas</p>
                  <ul className="space-y-2">{campaign.facebookGuide.postIdeas.map((idea: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                      <p className="text-sm text-foreground">{idea}</p>
                    </li>
                  ))}</ul>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 border text-center"><p className="text-muted-foreground text-sm">Click <strong>Gen Campaign</strong> to generate your full Facebook strategy.</p></Card>
          )}
        </div>
      )}

      {/* Facebook Ads */}
      {mTab === "ads" && (
        <div className="space-y-4">
          {campaign.facebookAds ? (
            <>
              <Card className="p-4 border bg-indigo-50 border-indigo-200">
                <p className="text-xs font-bold text-indigo-700 mb-2">📣 FACEBOOK ADS STRATEGY</p>
                <p className="text-sm text-indigo-900 mb-3">{campaign.facebookAds.overview}</p>
                {campaign.facebookAds.targeting && <div className="bg-white rounded-lg p-3 mb-3 border border-indigo-100"><p className="text-xs font-bold text-indigo-700 mb-1">Audience Targeting</p><p className="text-sm text-indigo-800">{campaign.facebookAds.targeting}</p></div>}
                <div className="grid md:grid-cols-2 gap-3">
                  {campaign.facebookAds.budgetAdvice && <div className="bg-green-50 rounded-lg p-3 border border-green-100"><p className="text-xs font-bold text-green-700 mb-1">Budget Strategy</p><p className="text-xs text-green-800">{campaign.facebookAds.budgetAdvice}</p></div>}
                  {campaign.facebookAds.retargeting && <div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><p className="text-xs font-bold text-amber-700 mb-1">Retargeting</p><p className="text-xs text-amber-800">{campaign.facebookAds.retargeting}</p></div>}
                </div>
              </Card>
              {Array.isArray(campaign.facebookAds.adExamples) && campaign.facebookAds.adExamples.map((ad: any, i: number) => (
                <Card key={i} className="p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-indigo-600 text-white border-0 text-xs">{ad.format}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`Headline: ${ad.headline}\n\n${ad.primaryText}\n\nCTA: ${ad.cta}`, "Ad copy")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                  </div>
                  <p className="font-bold text-foreground mb-2 text-lg">{ad.headline}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 mb-2">{ad.primaryText}</p>
                  <Badge variant="outline" className="text-xs">{ad.cta}</Badge>
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-6 border text-center"><p className="text-muted-foreground text-sm">Click <strong>Gen Campaign</strong> to generate Facebook ad copy and strategy.</p></Card>
          )}
        </div>
      )}

      {/* Instagram */}
      {mTab === "instagram" && (
        <div className="space-y-4">
          {Array.isArray(campaign.instagram) ? campaign.instagram.map((post: any, i: number) => (
            <Card key={i} className="p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white border-0 text-xs">Instagram {post.type === "story" ? "Story" : "Post"}</Badge>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(post.caption, "Caption")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 mb-2">{post.caption}</p>
              <p className="text-xs text-muted-foreground">{post.hashtags?.join(" ")}</p>
            </Card>
          )) : campaign.instagram?.caption ? (
            <Card className="p-4 border">
              <Badge className="bg-gradient-to-r from-pink-500 to-orange-400 text-white border-0 text-xs mb-2">Instagram</Badge>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3 mb-2">{campaign.instagram.caption}</p>
              <p className="text-xs text-muted-foreground">{campaign.instagram.hashtags?.join(" ")}</p>
            </Card>
          ) : null}
        </div>
      )}

      {/* Twitter */}
      {mTab === "twitter" && (
        campaign.twitter ? (
          <Card className="p-4 border">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-sky-500 text-white border-0 text-xs">Twitter/X Thread</Badge>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard([campaign.twitter.tweet, ...(campaign.twitter.thread ?? [])].join("\n\n"), "Thread")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy Thread</Button>
            </div>
            <div className="space-y-2">
              <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                <p className="text-xs font-bold text-sky-700 mb-1">Tweet Hook</p>
                <p className="text-sm font-semibold text-foreground">{campaign.twitter.tweet}</p>
              </div>
              {campaign.twitter.thread?.map((t: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+2}</span>
                  <p className="text-sm text-foreground border-l-2 border-sky-200 pl-3">{t}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6 border text-center"><p className="text-muted-foreground text-sm">Click <strong>Gen Campaign</strong> to generate a full Twitter/X thread.</p></Card>
        )
      )}

      {/* Sales Scripts */}
      {mTab === "sales" && (
        <div className="space-y-4">
          {campaign.salesScripts ? (
            <>
              {campaign.salesScripts.dmScript && (
                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-emerald-600 text-white border-0 text-xs">DM / Chat Script</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(campaign.salesScripts.dmScript, "DM script")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{campaign.salesScripts.dmScript}</p>
                </Card>
              )}
              {campaign.salesScripts.emailPitch && (
                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-teal-600 text-white border-0 text-xs">Email Pitch</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(campaign.salesScripts.emailPitch, "Email pitch")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{campaign.salesScripts.emailPitch}</p>
                </Card>
              )}
              {campaign.salesScripts.storyScript && (
                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-pink-600 text-white border-0 text-xs">Story Script</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(campaign.salesScripts.storyScript, "Story script")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{campaign.salesScripts.storyScript}</p>
                </Card>
              )}
              {campaign.salesScripts.liveScript && (
                <Card className="p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-red-600 text-white border-0 text-xs">Live Stream Pitch</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(campaign.salesScripts.liveScript, "Live script")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{campaign.salesScripts.liveScript}</p>
                </Card>
              )}
              {Array.isArray(campaign.salesScripts.objectionHandling) && campaign.salesScripts.objectionHandling.length > 0 && (
                <Card className="p-4 border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Objection Handling</p>
                  <div className="space-y-3">
                    {campaign.salesScripts.objectionHandling.map((obj: any, i: number) => (
                      <div key={i} className="rounded-lg border overflow-hidden">
                        <div className="bg-red-50 border-b border-red-100 px-3 py-2"><p className="text-xs font-bold text-red-700">❝ {obj.objection}</p></div>
                        <div className="px-3 py-2 bg-green-50"><p className="text-xs text-green-800">{obj.response}</p></div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {Array.isArray(campaign.ctaSuggestions) && campaign.ctaSuggestions.length > 0 && (
                <Card className="p-4 border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">CTA Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.ctaSuggestions.map((cta: string, i: number) => (
                      <button key={i} onClick={() => copyToClipboard(cta, "CTA")} className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full transition-colors text-left">{cta}</button>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 border text-center"><p className="text-muted-foreground text-sm">Click <strong>Gen Campaign</strong> to generate DM scripts, email pitches, and objection handlers.</p></Card>
          )}
        </div>
      )}

      {/* Strategies */}
      {mTab === "strategies" && (
        <div className="space-y-4">
          {Array.isArray(campaign.promotionStrategies) && campaign.promotionStrategies.length > 0 ? (
            campaign.promotionStrategies.map((s: any, i: number) => {
              const diffColor = s.difficulty === "Easy" ? "bg-green-100 text-green-700" : s.difficulty === "Hard" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
              return (
                <Card key={i} className="p-4 border">
                  <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                    <p className="font-semibold text-foreground">{s.strategy}</p>
                    <div className="flex gap-1.5">
                      {s.difficulty && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diffColor}`}>{s.difficulty}</span>}
                      {s.timeframe && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{s.timeframe}</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </Card>
              );
            })
          ) : (
            <Card className="p-6 border text-center"><p className="text-muted-foreground text-sm">Click <strong>Gen Campaign</strong> to generate ranked promotion strategies.</p></Card>
          )}
        </div>
      )}
    </div>
  );
}

function EmailCard({ email, index }: { email: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast({ title: `${label} copied!` });
  };
  return (
    <Card className="border overflow-hidden">
      <button
        className="w-full p-4 text-left flex items-start gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {email.day ?? index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {email.type && <Badge variant="outline" className="text-xs capitalize">{email.type}</Badge>}
          </div>
          <p className="font-semibold text-sm text-foreground">{email.subject}</p>
          {email.preview && <p className="text-xs text-muted-foreground italic mt-0.5">{email.preview}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, `Day ${email.day ?? index + 1} email`); }}>
            <Copy className="w-3 h-3" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/20">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pt-3">{email.body}</p>
        </div>
      )}
    </Card>
  );
}

function ProgressSteps({ step }: { step: "details" | "generating" | "result" }) {
  const steps = ["Details", "Creating", "Ready"];
  const idx = step === "details" ? 0 : step === "generating" ? 1 : 2;
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < idx ? "bg-green-500 text-white" : i === idx ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {i < idx ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-xs font-medium ${i === idx ? "text-primary" : i < idx ? "text-green-600" : "text-muted-foreground"}`}>{s}</span>
          {i < 2 && <div className={`w-8 h-px ${i < idx ? "bg-green-300" : "bg-muted"}`} />}
        </div>
      ))}
    </div>
  );
}

const PRODUCT_STYLES = [
  { value: "ebook", label: "eBook", icon: BookMarked, desc: "Rich storytelling, case studies, expert insights" },
  { value: "blueprint", label: "Blueprint", icon: LayoutTemplate, desc: "Step-by-step frameworks, precise sequences" },
  { value: "workbook", label: "Workbook", icon: FileText, desc: "Exercises, fill-ins, interactive worksheets" },
  { value: "playbook", label: "Playbook", icon: Briefcase, desc: "Tactical plays, decision trees, strategies" },
  { value: "toolkit", label: "Toolkit", icon: Wrench, desc: "Templates, checklists, ready-to-use resources" },
];

function GeneratingAnimation() {
  const steps = [
    { icon: "🧠", label: "Stage 1: Topic Analysis", text: "Profiling your exact audience — their pain, psychology, and desired transformation..." },
    { icon: "🔍", label: "Stage 2: Deep Research", text: "Simulating expert research — core concepts, best practices, real-world examples..." },
    { icon: "🏗️", label: "Stage 3: Product Architect", text: "Designing your product structure — Quick Start, Framework, Checklists, FAQ, Resources..." },
    { icon: "✍️", label: "Stage 4: Writing Chapters", text: "Writing each chapter individually with full prose, case studies, and action steps..." },
    { icon: "📋", label: "Stage 5: Premium Sections", text: "Adding worksheets, success framework, common mistakes, and resource vault..." },
    { icon: "💰", label: "Stage 6: Sellability Audit", text: "Running sellability analysis — evaluating market demand, depth, and transformation potential..." },
    { icon: "✅", label: "Stage 7: Final Polish", text: "Cleaning output, syncing table of contents, and preparing your premium product..." },
  ];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => Math.min(c + 1, steps.length - 1)), 12000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 text-2xl animate-bounce">{steps[current].icon}</div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">{steps[current].label}</p>
        <p className="text-base font-bold text-foreground">Building Your Premium Product</p>
        <p className="text-sm text-muted-foreground max-w-sm">{steps[current].text}</p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 text-xs transition-all ${i === current ? "opacity-100" : i < current ? "opacity-50" : "opacity-25"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < current ? "bg-green-500" : i === current ? "bg-primary" : "bg-muted"}`}>
              {i < current ? <CheckCircle className="w-3 h-3 text-white" /> : <span className="text-white font-bold" style={{fontSize:"9px"}}>{i+1}</span>}
            </div>
            <span className={`font-medium ${i === current ? "text-primary" : i < current ? "text-green-600" : "text-muted-foreground"}`}>{s.label}</span>
            {i === current && <Loader2 className="w-3 h-3 text-primary animate-spin ml-auto" />}
            {i < current && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Takes 60–120 seconds · Quality over speed</p>
    </div>
  );
}

async function fetchChapterIllustration(chapterTitle: string, productTopic: string, idx: number): Promise<string> {
  return new Promise((resolve) => {
    try {
      const conceptWords = chapterTitle.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 3).slice(0, 4).join(" ");
      const prompt = encodeURIComponent(
        `abstract conceptual illustration of ${conceptWords}, dark purple navy blue background, ` +
        `dramatic studio lighting, glowing particles, smooth gradients, 3d render, no text no words no letters, photorealistic, artstation`
      );
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=450&nologo=true&seed=${idx * 37 + 100}&enhance=true&model=flux`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timer = setTimeout(() => resolve(""), 18000);
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 800; canvas.height = 450;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(""); return; }
          ctx.drawImage(img, 0, 0, 800, 450);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch { resolve(""); }
      };
      img.onerror = () => { clearTimeout(timer); resolve(""); };
      img.src = url;
    } catch { resolve(""); }
  });
}

export default function CreateProduct() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const [step, setStep] = useState<"details" | "generating" | "result">("details");

  // Form fields
  const [topic, setTopic] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [angle, setAngle] = useState("");
  const [pageCount, setPageCount] = useState(20);
  const [price, setPrice] = useState(27);
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState("");
  const [productStyle, setProductStyle] = useState("ebook");
  const [fromTrending, setFromTrending] = useState(false);

  // Result state
  const [product, setProduct] = useState<any>(null);
  const [landingPage, setLandingPage] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [emailSequence, setEmailSequence] = useState<any[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<any>(null);
  const [publishedUrls, setPublishedUrls] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"product" | "landing" | "campaign" | "emails">("product");
  const [loadingLanding, setLoadingLanding] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [loadingGenerateAll, setLoadingGenerateAll] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [sellabilityReport, setSellabilityReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  // Upload tab
  const [uploadMode, setUploadMode] = useState<"ai" | "upload">("ai");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadPrice, setUploadPrice] = useState(27);
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadAuthorPhoto, setUploadAuthorPhoto] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("topic");
    const d = p.get("description");
    const cat = p.get("category");
    const priceParam = p.get("price");
    const ft = p.get("fromTrending");
    if (t) setTopic(t);
    if (d) setDescription(d + (cat ? ` | Category: ${cat}` : ""));
    if (priceParam) setPrice(Number(priceParam));
    if (ft) setFromTrending(true);
  }, []);

  useEffect(() => {
    if ((user as any)?.name && !authorName) setAuthorName((user as any).name);
  }, [user]);

  const handleCreate = async () => {
    if (!topic.trim()) { toast({ title: "Please enter a product topic", variant: "destructive" }); return; }
    if (!authorName.trim()) { toast({ title: "Please enter author name", variant: "destructive" }); return; }
    setStep("generating");
    try {
      const res = await apiClient.post("/products/create", {
        topic, authorName, description: description || undefined,
        angle: angle || undefined,
        price,
        pageCount, authorPhotoUrl: authorPhotoUrl || undefined,
        productStyle,
      });
      setProduct({ ...res.data, price: res.data.price ?? price });
      setStep("result");
      toast({ title: "✅ Premium product created!", description: "All 7 stages complete — your product is ready." });
    } catch (err: any) {
      setStep("details");
      toast({ title: err?.response?.data?.error ?? "Product creation failed", variant: "destructive" });
    }
  };

  const handleImprove = async () => {
    if (!product) return;
    setImproving(true);
    try {
      const res = await apiClient.post(`/products/${product.id}/improve`, {});
      setProduct((p: any) => ({ ...p, sellabilityScore: res.data.sellabilityScore, chaptersData: res.data.chaptersData }));
      setSellabilityReport(null); // clear old report so it re-generates fresh
      toast({ title: `✨ Product improved! Score: ${res.data.sellabilityScore}/100`, description: "Chapters expanded, missing sections added." });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Improvement failed", variant: "destructive" });
    } finally {
      setImproving(false);
    }
  };

  const handleGetReport = async () => {
    if (!product) return;
    if (sellabilityReport) { setReportExpanded(e => !e); return; }
    setReportLoading(true);
    setReportExpanded(true);
    try {
      const res = await apiClient.post(`/products/${product.id}/sellability-report`, {});
      setSellabilityReport(res.data);
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Report generation failed", variant: "destructive" });
      setReportExpanded(false);
    } finally {
      setReportLoading(false);
    }
  };

  const handleUploadProduct = async () => {
    if (!uploadTitle.trim() || !uploadFileUrl.trim()) {
      toast({ title: "Title and file URL required", variant: "destructive" }); return;
    }
    setUploadLoading(true);
    try {
      const res = await apiClient.post("/products/upload", {
        title: uploadTitle, description: uploadDesc,
        price: uploadPrice, authorName: (user as any)?.name || "Author",
        uploadedFileUrl: uploadFileUrl, authorPhotoUrl: uploadAuthorPhoto || undefined
      });
      setProduct(res.data);
      setStep("result");
      toast({ title: "✅ Product uploaded!" });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Upload failed", variant: "destructive" });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGenerateLanding = async () => {
    if (!product) return;
    setLoadingLanding(true);
    try {
      const res = await apiClient.post(`/products/${product.id}/generate-landing-page`, {
        authorPhotoUrl: authorPhotoUrl || product.authorPhotoUrl || undefined
      });
      setLandingPage(res.data);
      setActiveTab("landing");
      toast({ title: "🎉 Landing page generated!" });
    } catch {
      toast({ title: "Landing page generation failed", variant: "destructive" });
    } finally {
      setLoadingLanding(false);
    }
  };

  const handleGenerateCampaign = async () => {
    if (!product) return;
    setLoadingCampaign(true);
    try {
      const res = await apiClient.post(`/products/${product.id}/generate-campaign`, {});
      setCampaign(res.data);
      setActiveTab("campaign");
      toast({ title: "🚀 Marketing campaign generated!" });
    } catch {
      toast({ title: "Campaign generation failed", variant: "destructive" });
    } finally {
      setLoadingCampaign(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!product) return;
    setLoadingGenerateAll(true);
    try {
      const res = await apiClient.post(`/products/${product.id}/generate-all`, {});
      setLandingPage(res.data.landingPage);
      setEmailSequence(Array.isArray(res.data.emailSequence30Days) ? res.data.emailSequence30Days : []);
      setMarketingAssets(res.data.marketingAssets);
      // Populate campaign tab with marketing assets so it shows content immediately
      // Normalize generate-all assets to match generate-campaign structure
      if (res.data.marketingAssets) {
        const ma = res.data.marketingAssets;
        const normalizedCampaign = {
          ...ma,
          // generate-all returns twitterThread[], generate-campaign returns twitter.{tweet,thread}
          twitter: ma.twitterThread?.length
            ? { tweet: ma.twitterThread[0] ?? "", thread: ma.twitterThread.slice(1) }
            : ma.twitter ?? null,
          // adCopy array → facebookAds.adExamples shape so the Ads tab shows something
          facebookAds: ma.adCopy?.length
            ? { adExamples: ma.adCopy.map((a: any) => ({ format: a.platform ?? "Ad", headline: a.headline ?? "", primaryText: a.primaryText ?? a.description ?? "", cta: a.cta ?? "Learn More" })) }
            : undefined,
        };
        setCampaign(normalizedCampaign);
      }
      setActiveTab("landing");
      toast({ title: "🚀 Everything generated!", description: "Landing page + 30-day emails + marketing assets — all ready." });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Generation failed", variant: "destructive" });
    } finally {
      setLoadingGenerateAll(false);
    }
  };

  const handlePublish = async () => {
    if (!product) return;
    setPublishing(true);
    try {
      const res = await apiClient.post(`/products/${product.id}/publish`, {});
      setPublishedUrls(res.data);
      toast({ title: "🎉 Product is now live!", description: "Your product is published and ready to sell." });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Publish failed", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handleDownloadEmails = () => {
    if (!emailSequence.length) return;
    const lines: string[] = [];
    lines.push(`30-DAY EMAIL SEQUENCE — ${product?.title ?? topic}`);
    lines.push(`Generated by Selovox · ${emailSequence.length} emails`);
    lines.push("=".repeat(60));
    lines.push("");
    emailSequence.forEach((email: any, i: number) => {
      lines.push(`EMAIL ${email.day ?? i + 1}${email.type ? ` — ${String(email.type).toUpperCase()}` : ""}`);
      lines.push(`Subject: ${email.subject}`);
      if (email.preview) lines.push(`Preview: ${email.preview}`);
      lines.push("-".repeat(40));
      lines.push(email.body ?? "");
      lines.push("");
      lines.push("=".repeat(60));
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `email-sequence-${(product?.title ?? topic ?? "product").slice(0, 40).replace(/\s+/g, "-")}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "📧 Email sequence downloaded as .txt!" });
  };

  const handleDownloadEmailsCsv = () => {
    if (!emailSequence.length) return;
    const escape = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows: string[] = ["Day,Type,Subject,Preview Text,Body"];
    emailSequence.forEach((email: any, i: number) => {
      rows.push([
        escape(email.day ?? i + 1),
        escape(email.type ?? ""),
        escape(email.subject ?? ""),
        escape(email.preview ?? ""),
        escape(email.body ?? ""),
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `email-sequence-${(product?.title ?? topic ?? "product").slice(0, 40).replace(/\s+/g, "-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "📧 Email sequence downloaded as .csv!", description: "Import this into Mailchimp, ConvertKit, ActiveCampaign, or any email tool." });
  };

  const handleDownloadPdf = async () => {
    if (!product) return;
    setPdfGenerating(true);

    // Parse chaptersData early — needed before parallel image fetch
    let chaptersData: any = product.chaptersData ?? null;
    if (!chaptersData && product.content) {
      try { const p = JSON.parse(product.content); if (p?.chapters) chaptersData = p; } catch {}
    }
    const earlyChapters: any[] = Array.isArray(chaptersData?.chapters) ? chaptersData.chapters : [];

    // Pre-fetch cover image + all chapter illustrations in parallel
    let coverBase64: string | null = null;
    const chapterImgMap = new Map<number, string>();

    const allImgFetches: Promise<string | null>[] = [
      product.coverImageUrl
        ? fetch(product.coverImageUrl)
            .then(r => r.ok ? r.blob() : null)
            .then(b => b ? new Promise<string>((res, rej) => {
              const rd = new FileReader();
              rd.onloadend = () => res(rd.result as string);
              rd.onerror = rej;
              rd.readAsDataURL(b);
            }) : null)
            .catch(() => null)
        : Promise.resolve(null),
      ...earlyChapters.map((ch: any, i: number) =>
        fetchChapterIllustration(ch.title ?? `Chapter ${i + 1}`, topic, i)
      ),
    ];

    const imgSettled = await Promise.allSettled(allImgFetches);
    coverBase64 = imgSettled[0].status === "fulfilled" ? (imgSettled[0].value as string | null) : null;
    imgSettled.slice(1).forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) chapterImgMap.set(i, r.value as string);
    });

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const ML = 20; const MR = 20; const MT = 22; const MB = 22;
      const CW = PW - ML - MR;
      const aName = authorName || (user as any)?.name || "Author";
      const prodTitle = (product.title ?? topic) as string;
      let pageNum = 0;

      const useStructured = chaptersData && Array.isArray(chaptersData.chapters) && chaptersData.chapters.length > 0;

      // ─── PALETTE ────────────────────────────────────────────────────────
      const C = {
        dark:   [10, 10, 28] as [number,number,number],
        purple: [109, 40, 217] as [number,number,number],
        pink:   [219, 39, 119] as [number,number,number],
        gold:   [245, 158, 11] as [number,number,number],
        white:  [255,255,255] as [number,number,number],
        light:  [248, 249, 252] as [number,number,number],
        text:   [30, 41, 59] as [number,number,number],
        muted:  [100, 116, 139] as [number,number,number],
        green:  [16, 185, 129] as [number,number,number],
        orange: [234, 88, 12] as [number,number,number],
        border: [226, 232, 240] as [number,number,number],
      };

      // ─── HELPERS ─────────────────────────────────────────────────────────
      const fill = (c: [number,number,number]) => doc.setFillColor(...c);
      const textC = (c: [number,number,number]) => doc.setTextColor(...c);
      const bold = (sz: number) => { doc.setFont("helvetica","bold"); doc.setFontSize(sz); };
      const normal = (sz: number) => { doc.setFont("helvetica","normal"); doc.setFontSize(sz); };
      const italic = (sz: number) => { doc.setFont("helvetica","italic"); doc.setFontSize(sz); };

      const drawPageFrame = (headerTitle: string, pn: number, dark = false) => {
        if (dark) {
          fill(C.dark); doc.rect(0, 0, PW, PH, "F");
        } else {
          fill(C.white); doc.rect(0, 0, PW, PH, "F");
        }
        // Top accent bar
        fill(C.purple); doc.rect(0, 0, PW, 3, "F");
        fill(C.gold);   doc.rect(0, 0, 60, 3, "F");
        // Footer line
        fill(C.border); doc.rect(ML, PH - MB + 4, CW, 0.4, "F");
        // Footer: title + page number
        normal(7);
        textC(C.muted);
        const shortTitle = headerTitle.length > 50 ? headerTitle.slice(0, 47) + "..." : headerTitle;
        doc.text(shortTitle, ML, PH - MB + 10);
        bold(7);
        doc.text(String(pn), PW - MR, PH - MB + 10, { align: "right" });
      };

      // Render a line with inline **bold** support (simple, word-wrap handled externally)
      const renderInline = (raw: string, x: number, y: number, maxW: number, sz: number, baseColor: [number,number,number]): number => {
        // Split on **...**
        const parts = raw.split(/(\*\*[^*]+\*\*)/g);
        let cx = x;
        parts.forEach(part => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const text = part.slice(2, -2);
            bold(sz); textC(C.text);
            doc.text(text, cx, y);
            cx += doc.getTextWidth(text);
          } else if (part) {
            normal(sz); textC(baseColor);
            doc.text(part, cx, y);
            cx += doc.getTextWidth(part);
          }
        });
        return y;
      };

      // Wrap and render a paragraph with inline bold, returns new Y
      const renderPara = (raw: string, x: number, startY: number, maxW: number, sz: number, lh: number, color: [number,number,number], ensureSpace: () => number): number => {
        // Strip markdown bold for wrapping measurement
        const plain = raw.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        if (!plain) return startY + 3;
        normal(sz); textC(color);
        const wrapped = doc.splitTextToSize(plain, maxW);
        let y = startY;
        wrapped.forEach((wl: string, wi: number) => {
          y = ensureSpace();
          // Re-find the chunk of raw text for this wrapped line — for inline bold, approximate
          const boldMatches = raw.match(/\*\*[^*]+\*\*/g);
          if (boldMatches && wi === 0) {
            // Only first wrapped line may contain bold (approximation)
            renderInline(raw.replace(/\n/g,""), x, y, maxW, sz, color);
          } else {
            normal(sz); textC(color);
            doc.text(wl, x, y);
          }
          y += lh;
        });
        return y;
      };

      // ─── 1. COVER PAGE ───────────────────────────────────────────────────
      pageNum++;
      fill(C.dark); doc.rect(0, 0, PW, PH, "F");
      // Rich dark gradient on lower half
      fill([22, 16, 55]); doc.rect(0, PH * 0.55, PW, PH * 0.45, "F");
      // Top + bottom accent bars
      fill(C.purple); doc.rect(0, 0, PW, 6, "F");
      fill(C.gold);   doc.rect(0, 0, 80, 6, "F");
      fill(C.purple); doc.rect(0, PH - 6, PW, 6, "F");

      // Cover image — right half, full-height portrait layout
      const hasImg = !!coverBase64;
      const textAreaW = hasImg ? PW * 0.52 - ML - 2 : CW - 4;

      if (hasImg) {
        const imgX = PW * 0.52;
        const imgW = PW - imgX - 2;
        try {
          doc.addImage(coverBase64!, "JPEG", imgX, 6, imgW, PH - 12, undefined, "FAST");
          // Dark gradient blend on left edge of image
          fill(C.dark); doc.setGState(doc.GState({ opacity: 0.75 }));
          doc.rect(imgX, 6, 16, PH - 12, "F");
          doc.setGState(doc.GState({ opacity: 1 }));
        } catch {}
      } else {
        // Decorative right accent when no image
        fill([40, 20, 100]); doc.rect(PW - 18, 0, 18, PH, "F");
        fill(C.purple); doc.rect(PW - 18, PH * 0.35, 18, PH * 0.3, "F");
      }

      // Badge
      fill([40, 25, 10]); doc.rect(ML, 20, Math.min(textAreaW, 82), 10, "F");
      fill(C.gold); doc.rect(ML, 20, 3, 10, "F");
      bold(7.5); textC(C.gold);
      doc.text("PREMIUM DIGITAL GUIDE", ML + 8, 26.5);

      // Main title
      bold(hasImg ? 22 : 28); textC(C.white);
      const tLines = doc.splitTextToSize(prodTitle, textAreaW);
      let tY = 50;
      tLines.slice(0, 4).forEach((ln: string) => { doc.text(ln, ML, tY); tY += hasImg ? 11 : 14; });

      // AI subtitle
      if (product.subtitle) {
        normal(10); textC([167, 139, 250] as [number,number,number]);
        const sLines = doc.splitTextToSize(product.subtitle, textAreaW);
        tY += 2;
        sLines.slice(0, 2).forEach((ln: string) => { doc.text(ln, ML, tY); tY += 7; });
      }

      // Marketplace description — prominently on cover page
      const mktDesc: string = ((product as any).description ?? (product as any).aboutSection ?? "").trim();
      if (mktDesc) {
        tY += 5;
        normal(9); textC([148, 163, 184] as [number,number,number]);
        const dLines = doc.splitTextToSize(mktDesc, textAreaW);
        dLines.slice(0, 3).forEach((ln: string) => { doc.text(ln, ML, tY); tY += 6.5; });
      }

      // Divider
      tY += 6;
      fill(C.purple); doc.rect(ML, tY, 36, 1.5, "F");
      fill(C.gold);   doc.rect(ML + 38, tY, 18, 1.5, "F");

      // Stats row: chapters · pages · guide
      tY += 10;
      if (earlyChapters.length > 0) {
        bold(7.5); textC(C.purple);
        doc.text(`${earlyChapters.length} CHAPTERS`, ML, tY);
        const chW = doc.getTextWidth(`${earlyChapters.length} CHAPTERS`);
        normal(7.5); textC([71, 85, 105] as [number,number,number]);
        doc.text("  ·  ", ML + chW, tY);
        const dotW = doc.getTextWidth("  ·  ");
        bold(7.5); textC([148, 163, 184] as [number,number,number]);
        doc.text(`${product.pageCount ?? pageCount} PAGES  ·  DIGITAL GUIDE`, ML + chW + dotW, tY);
      }

      // Author block anchored to bottom-left
      tY = PH - 55;
      fill([22, 16, 55]); doc.rect(ML, tY - 4, textAreaW + 2, 28, "F");
      fill(C.purple); doc.rect(ML, tY - 4, 3, 28, "F");
      bold(9); textC(C.gold); doc.text("AUTHOR", ML + 8, tY + 5);
      bold(13); textC(C.white); doc.text(aName, ML + 8, tY + 14);
      normal(8); textC([148,163,184] as [number,number,number]); doc.text("selovox.com  ·  Digital Guide", ML + 8, tY + 21);

      // ─── 2. TABLE OF CONTENTS ────────────────────────────────────────────
      const toc: string[] = (useStructured ? chaptersData.tableOfContents : product.tableOfContents) ?? [];
      doc.addPage(); pageNum++;
      drawPageFrame(prodTitle, pageNum, false);
      fill(C.light); doc.rect(0, 0, PW, PH, "F");
      fill(C.purple); doc.rect(0, 0, PW, 3, "F");
      fill(C.gold); doc.rect(0, 0, 60, 3, "F");

      bold(20); textC(C.dark); doc.text("Table of Contents", ML, MT + 12);
      fill(C.purple); doc.rect(ML, MT + 15, 45, 1.5, "F");
      fill(C.gold); doc.rect(ML + 47, MT + 15, 20, 1.5, "F");

      let tocY = MT + 26;
      toc.forEach((ch, i) => {
        if (tocY > PH - MB - 16) { doc.addPage(); pageNum++; drawPageFrame(prodTitle, pageNum); tocY = MT + 10; }
        const isBonus = ch.toLowerCase().includes("bonus") || ch.toLowerCase().includes("seller");
        const bgC: [number,number,number] = isBonus ? [255, 248, 225] : (i % 2 === 0 ? [242, 240, 255] : C.white);
        fill(bgC); doc.rect(ML - 2, tocY - 5, CW + 4, 12, "F");
        fill(isBonus ? C.gold : C.purple); doc.rect(ML - 2, tocY - 5, 3, 12, "F");
        bold(9); textC(isBonus ? C.gold : C.purple);
        doc.text(String(i + 1).padStart(2, "0"), ML + 3, tocY + 2);
        normal(9); textC(C.text);
        const chShort = ch.replace(/^(Chapter \d+:|CHAPTER \d+:|Bonus:|SELLER BONUS:)\s*/i, "");
        const tocLine = doc.splitTextToSize(chShort, CW - 22);
        doc.text(tocLine[0] ?? chShort, ML + 14, tocY + 2);
        tocY += 14;
      });

      if (useStructured) {
        // ─── 3A. STRUCTURED CHAPTERS RENDERER (Premium, no markdown) ─────
        const BODY_SZ = 10.5;
        const BODY_LH = 6.2;

        const addPage = () => { doc.addPage(); pageNum++; drawPageFrame(prodTitle, pageNum); };

        const makeEnsure = () => {
          let y = MT + 8;
          const ensure = (needed = BODY_LH * 2): number => {
            if (y > PH - MB - needed) { addPage(); y = MT + 8; }
            return y;
          };
          return { getY: () => y, setY: (v: number) => { y = v; }, ensure };
        };

        // Last-line-of-defense: strip JSON / markdown from any body text before rendering
        const cleanForPDF = (raw: string): string => {
          if (!raw) return "";
          let t = raw;
          // Remove code fences
          t = t.replace(/```[\s\S]*?```/g, "");
          // Remove embedded JSON objects (product structure keys)
          const jsonKeyRe = /"(title|subtitle|chapters|tableOfContents|sellabilityScore|suggestedPrice|targetAudience|monetizationNotes|authorBio|quickStart|framework|checklist|faq|resources|introduction|commonMistakes|conclusion|bonus|category|aboutSection)"[\s]*:/;
          t = t.replace(/\{[\s\S]{20,}?\}/g, m => (jsonKeyRe.test(m) || /"[\w]+":\s*["{\[]/.test(m)) ? "" : m);
          // Remove JSON-looking lines
          t = t.split("\n").filter(line => {
            const s = line.trim();
            return !/"[\w]+":\s*["{\[0-9]/.test(s) && s !== "{" && s !== "}" && s !== "[" && s !== "]" && s !== "```";
          }).join("\n");
          // Strip markdown
          t = t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
               .replace(/^#{1,6}\s+/gm, "").replace(/^[-*+]\s+/gm, "")
               .replace(/`([^`]+)`/g, "$1").replace(/_{2}([^_]+)_{2}/g, "$1");
          return t.replace(/\n{3,}/g, "\n\n").trim();
        };

        const renderTextBlock = (text: string, ctx: ReturnType<typeof makeEnsure>, indent = 0) => {
          if (!text?.trim()) return;
          const safe = cleanForPDF(text);
          if (!safe) return;
          const paragraphs = safe.split(/\n\n+/).filter(p => p.trim());
          paragraphs.forEach(para => {
            const lines = doc.splitTextToSize(para.trim(), CW - indent);
            lines.forEach((l: string) => {
              ctx.ensure(BODY_LH);
              normal(BODY_SZ); textC(C.text);
              doc.text(l, ML + indent, ctx.getY());
              ctx.setY(ctx.getY() + BODY_LH);
            });
            ctx.setY(ctx.getY() + 2.5);
          });
        };

        const renderCallout = (label: string, text: string, bg: [number,number,number], ac: [number,number,number], ctx: ReturnType<typeof makeEnsure>) => {
          if (!text?.trim()) return;
          const lines = doc.splitTextToSize(text.trim(), CW - 14);
          const boxH = Math.max(18, lines.length * 5.6 + 16);
          ctx.ensure(boxH + 6);
          const y = ctx.getY();
          fill(bg); doc.rect(ML - 2, y - 4, CW + 4, boxH, "F");
          fill(ac); doc.rect(ML - 2, y - 4, 3.5, boxH, "F");
          bold(7); textC(ac); doc.text(label, ML + 7, y + 3);
          let ty = y + 10;
          lines.forEach((l: string) => { normal(9.5); textC(C.text); doc.text(l, ML + 7, ty); ty += 5.6; });
          ctx.setY(ty + 6);
        };

        // ─── 3A-0. QUICK START PAGE ───────────────────────────────────────
        if (chaptersData.quickStart?.steps?.length > 0) {
          doc.addPage(); pageNum++;
          fill(C.green); doc.rect(0, 0, PW, PH, "F");
          fill([5, 100, 70]); doc.rect(PW - 20, 0, 20, PH, "F");
          fill(C.white); doc.rect(0, 0, PW, 5, "F");
          fill(C.gold); doc.rect(0, 0, 70, 5, "F");
          bold(8); textC(C.white); doc.text("QUICK START GUIDE", ML, 22);
          fill(C.white); doc.rect(ML, 25, 50, 1.5, "F");
          bold(24); textC(C.white);
          const qsTitle = chaptersData.quickStart.title ?? "What to Do in the First 24 Hours";
          const qsTitleLines = doc.splitTextToSize(qsTitle, CW - 28);
          let qsY = 42;
          qsTitleLines.forEach((l: string) => { doc.text(l, ML, qsY); qsY += 13; });
          normal(10); textC([180, 255, 220]);
          doc.text("Complete these 5 steps before moving to Chapter 1.", ML, qsY + 4);

          addPage();
          const qsCtx = makeEnsure();
          const qsSteps = chaptersData.quickStart.steps ?? [];
          qsSteps.forEach((step: any, si: number) => {
            const stepText = typeof step === "string" ? step : (step.step ?? "");
            const detail = typeof step === "string" ? "" : (step.detail ?? "");
            qsCtx.ensure(30);
            const sy = qsCtx.getY();
            fill(C.green); doc.rect(ML - 2, sy - 5, CW + 4, 10, "F");
            bold(8); textC(C.white); doc.text(`ACTION ${si + 1}`, ML + 3, sy + 1);
            qsCtx.setY(sy + 10);
            const stLines = doc.splitTextToSize(stepText, CW - 4);
            stLines.forEach((l: string) => {
              qsCtx.ensure(BODY_LH);
              bold(10.5); textC(C.dark); doc.text(l, ML + 2, qsCtx.getY());
              qsCtx.setY(qsCtx.getY() + BODY_LH + 0.5);
            });
            if (detail) {
              const dtLines = doc.splitTextToSize(detail, CW - 4);
              dtLines.forEach((l: string) => {
                qsCtx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.muted); doc.text(l, ML + 2, qsCtx.getY());
                qsCtx.setY(qsCtx.getY() + BODY_LH);
              });
            }
            qsCtx.setY(qsCtx.getY() + 5);
          });
        }

        // ─── 3A-0b. INTRODUCTION PAGE ────────────────────────────────────
        if (chaptersData.introduction?.body) {
          const intro = chaptersData.introduction;
          doc.addPage(); pageNum++;
          fill(C.dark); doc.rect(0, 0, PW, PH, "F");
          fill(C.purple); doc.rect(0, 0, PW, 6, "F");
          fill(C.gold); doc.rect(0, 0, 60, 6, "F");
          fill([18, 14, 50]); doc.rect(PW - 22, 0, 22, PH, "F");
          bold(8); textC(C.gold); doc.text("INTRODUCTION", ML, 28);
          fill(C.gold); doc.rect(ML, 31, 40, 1.5, "F");
          bold(20); textC(C.white);
          const introTitleLines = doc.splitTextToSize(intro.title ?? "Why Everything Changes Today", CW - 28);
          let inY = 48;
          introTitleLines.forEach((l: string) => { doc.text(l, ML, inY); inY += 12; });
          if (intro.promise) {
            inY += 4;
            normal(10.5); textC([148,163,184]);
            const pLines = doc.splitTextToSize(intro.promise, CW - 28);
            pLines.slice(0, 2).forEach((l: string) => { doc.text(l, ML, inY); inY += 7; });
          }

          addPage();
          const inCtx = makeEnsure();
          if (intro.body) renderTextBlock(intro.body, inCtx);
        }

        chaptersData.chapters.forEach((ch: any, chIdx: number) => {
          // Chapter opener page — dark themed
          doc.addPage(); pageNum++;
          fill(C.dark); doc.rect(0, 0, PW, PH, "F");
          fill(C.purple); doc.rect(0, 0, PW, 6, "F");
          fill(C.gold); doc.rect(0, 0, 60, 6, "F");
          fill([18, 14, 50]); doc.rect(PW - 22, 0, 22, PH, "F");
          fill(C.purple); doc.rect(PW - 22, PH * 0.35, 22, PH * 0.3, "F");
          doc.setFont("helvetica","bold"); doc.setFontSize(80);
          doc.setTextColor(25, 20, 60);
          doc.text(String(ch.number ?? ""), ML, PH * 0.58);
          bold(19); textC(C.white);
          const chTitleLines = doc.splitTextToSize(ch.title ?? "", CW - 28);
          let fy = PH * 0.33;
          chTitleLines.forEach((l: string) => { doc.text(l, ML, fy); fy += 12; });
          if (ch.hook) {
            fy += 6;
            normal(10.5); textC([148, 163, 184]);
            const hookLines = doc.splitTextToSize(ch.hook, CW - 28);
            hookLines.slice(0, 3).forEach((l: string) => { doc.text(l, ML, fy); fy += 7; });
          }

          // Body content page
          addPage();
          const ctx = makeEnsure();

          // Hook block
          if (ch.hook) {
            ctx.ensure(18);
            const hLines = doc.splitTextToSize(ch.hook, CW - 12);
            const hH = Math.max(16, hLines.length * 6 + 12);
            const hy = ctx.getY();
            fill([245, 243, 255]); doc.rect(ML - 2, hy - 4, CW + 4, hH, "F");
            fill(C.purple); doc.rect(ML - 2, hy - 4, 3.5, hH, "F");
            italic(10.5); textC([88, 28, 135]);
            let ty = hy + 4;
            hLines.forEach((l: string) => { doc.text(l, ML + 7, ty); ty += 6.3; });
            ctx.setY(ty + 6);
          }

          // Chapter illustration image — contextual visual for this chapter's topic
          const chImg = chapterImgMap.get(chIdx);
          if (chImg) {
            const imgH = 52;
            ctx.ensure(imgH + 10);
            const iy = ctx.getY();
            fill(C.dark); doc.rect(ML - 2, iy - 2, CW + 4, imgH + 4, "F");
            try { doc.addImage(chImg, "JPEG", ML, iy, CW, imgH, undefined, "FAST"); } catch {}
            fill([12, 8, 30]); doc.rect(ML - 2, iy + imgH - 7, CW + 4, 7, "F");
            bold(6); textC([120, 100, 180] as [number,number,number]);
            doc.text(`Ch. ${ch.number ?? chIdx + 1}  ·  ${(ch.title ?? "").slice(0, 55)}`, ML + 4, iy + imgH - 2);
            ctx.setY(iy + imgH + 10);
          }

          // Body text
          if (ch.body) {
            renderTextBlock(ch.body, ctx);
          }

          // Steps
          if (Array.isArray(ch.steps) && ch.steps.length > 0) {
            ctx.ensure(18);
            ctx.setY(ctx.getY() + 3);
            bold(11); textC(C.dark);
            doc.text("Step-by-Step Action Plan", ML, ctx.getY());
            ctx.setY(ctx.getY() + 2);
            fill(C.purple); doc.rect(ML, ctx.getY(), 40, 1, "F");
            ctx.setY(ctx.getY() + 6);
            ch.steps.forEach((step: string, si: number) => {
              ctx.ensure(BODY_LH + 4);
              const stepLines = doc.splitTextToSize(step, CW - 14);
              const stepH = stepLines.length * 5.8 + 8;
              ctx.ensure(stepH);
              const sy = ctx.getY();
              fill(C.purple); doc.rect(ML, sy - 4.5, 8, 8, "F");
              bold(8); textC(C.white); doc.text(String(si + 1), ML + 2, sy - 0.3);
              let ty = sy;
              stepLines.forEach((l: string, li: number) => {
                if (li > 0) ctx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.text);
                doc.text(l, ML + 11, ctx.getY());
                ctx.setY(ctx.getY() + BODY_LH);
              });
              ctx.setY(ctx.getY() + 2);
            });
            ctx.setY(ctx.getY() + 3);
          }

          // Callout / Pro Tip
          if (ch.callout) {
            renderCallout("PRO TIP", ch.callout, [240, 249, 255], [59, 130, 246], ctx);
          }

          // Example
          if (ch.example) {
            renderCallout("REAL EXAMPLE", ch.example, [236, 253, 245], C.green, ctx);
          }

          // Key Takeaways
          if (Array.isArray(ch.keyTakeaways) && ch.keyTakeaways.length > 0) {
            ctx.ensure(20);
            ctx.setY(ctx.getY() + 3);
            bold(11); textC(C.dark);
            doc.text("Key Takeaways", ML, ctx.getY());
            ctx.setY(ctx.getY() + 2);
            fill(C.gold); doc.rect(ML, ctx.getY(), 30, 1, "F");
            ctx.setY(ctx.getY() + 6);
            ch.keyTakeaways.forEach((kt: string) => {
              ctx.ensure(BODY_LH + 2);
              const ktLines = doc.splitTextToSize(kt, CW - 10);
              fill(C.gold); doc.circle(ML + 2, ctx.getY() - 1.5, 1.5, "F");
              ktLines.forEach((l: string, li: number) => {
                if (li > 0) ctx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.text);
                doc.text(l, ML + 7, ctx.getY());
                ctx.setY(ctx.getY() + BODY_LH);
              });
              ctx.setY(ctx.getY() + 1.5);
            });
            ctx.setY(ctx.getY() + 3);
          }

          // Action Step
          if (ch.actionStep) {
            renderCallout("YOUR ACTION STEP RIGHT NOW", ch.actionStep, [254, 243, 199], C.gold, ctx);
          }
        });

        // ─── Success Framework ────────────────────────────────────────────
        if (chaptersData.framework?.steps?.length > 0) {
          const fw = chaptersData.framework;
          doc.addPage(); pageNum++;
          fill(C.purple); doc.rect(0, 0, PW, PH, "F");
          fill([60, 20, 140]); doc.rect(PW - 20, 0, 20, PH, "F");
          fill(C.gold); doc.rect(0, 0, PW, 4, "F");
          bold(8); textC(C.gold); doc.text("SUCCESS FRAMEWORK", ML, 22);
          fill(C.gold); doc.rect(ML, 25, 55, 1.5, "F");
          bold(22); textC(C.white);
          const fwNameLines = doc.splitTextToSize(fw.name ?? "The Success Framework", CW - 28);
          let fwY = 42;
          fwNameLines.forEach((l: string) => { doc.text(l, ML, fwY); fwY += 12; });
          if (fw.description) {
            fwY += 2;
            normal(10); textC([200, 180, 255]);
            const fdLines = doc.splitTextToSize(fw.description, CW - 28);
            fdLines.slice(0, 2).forEach((l: string) => { doc.text(l, ML, fwY); fwY += 7; });
          }

          addPage();
          const fwCtx = makeEnsure();
          const fwColors: [number,number,number][] = [C.purple, C.pink, C.green, [59,130,246], C.gold, C.orange];
          fw.steps.forEach((step: any, si: number) => {
            const label = typeof step === "string" ? step : (step.label ?? "");
            const desc = typeof step === "string" ? "" : (step.description ?? "");
            fwCtx.ensure(25);
            const sy = fwCtx.getY();
            const col = fwColors[si % fwColors.length];
            fill(col); doc.circle(ML + 5, sy, 5, "F");
            bold(9); textC(C.white); doc.text(String(si + 1), ML + 3.5, sy + 3);
            const labLines = doc.splitTextToSize(label, CW - 18);
            bold(10.5); textC(C.dark);
            let ly = sy - 1;
            labLines.forEach((l: string) => { doc.text(l, ML + 14, ly); ly += 6.5; });
            fwCtx.setY(Math.max(ly, sy + 7));
            if (desc) {
              const dLines = doc.splitTextToSize(desc, CW - 14);
              dLines.forEach((l: string) => {
                fwCtx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.muted); doc.text(l, ML + 14, fwCtx.getY());
                fwCtx.setY(fwCtx.getY() + BODY_LH);
              });
            }
            fwCtx.setY(fwCtx.getY() + 4);
          });
        }

        // ─── Common Mistakes ──────────────────────────────────────────────
        if (chaptersData.commonMistakes?.mistakes?.length > 0) {
          const cm = chaptersData.commonMistakes;
          doc.addPage(); pageNum++;
          fill(C.orange); doc.rect(0, 0, PW, PH, "F");
          fill([160, 50, 0]); doc.rect(PW - 20, 0, 20, PH, "F");
          fill(C.white); doc.rect(0, 0, PW, 4, "F");
          bold(8); textC(C.white); doc.text("AVOID THESE MISTAKES", ML, 22);
          fill(C.white); doc.rect(ML, 25, 58, 1.5, "F");
          bold(22); textC(C.white);
          const cmTitle = cm.title ?? "The 5 Mistakes That Kill Results";
          const cmTLines = doc.splitTextToSize(cmTitle, CW - 28);
          let cmY = 42;
          cmTLines.forEach((l: string) => { doc.text(l, ML, cmY); cmY += 12; });
          normal(10); textC([255,220,180]);
          doc.text("Learn from others — so you don't have to.", ML, cmY + 3);

          addPage();
          const cmCtx = makeEnsure();
          cm.mistakes.forEach((m: any, mi: number) => {
            const mistake = typeof m === "string" ? m : (m.mistake ?? "");
            const fix = typeof m === "string" ? "" : (m.fix ?? "");
            cmCtx.ensure(30);
            const mY = cmCtx.getY();
            fill([255, 240, 230]); doc.rect(ML - 2, mY - 4, CW + 4, 10, "F");
            fill(C.orange); doc.rect(ML - 2, mY - 4, 3.5, 10, "F");
            bold(7.5); textC(C.orange); doc.text(`MISTAKE ${mi + 1}`, ML + 7, mY + 2);
            cmCtx.setY(mY + 10);
            const mstLines = doc.splitTextToSize(mistake, CW - 6);
            mstLines.forEach((l: string) => {
              cmCtx.ensure(BODY_LH);
              bold(10); textC(C.dark); doc.text(l, ML + 2, cmCtx.getY());
              cmCtx.setY(cmCtx.getY() + BODY_LH);
            });
            if (fix) {
              cmCtx.setY(cmCtx.getY() + 1);
              const fixLines = doc.splitTextToSize(`Fix: ${fix}`, CW - 6);
              fixLines.forEach((l: string) => {
                cmCtx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.green); doc.text(l, ML + 2, cmCtx.getY());
                cmCtx.setY(cmCtx.getY() + BODY_LH);
              });
            }
            cmCtx.setY(cmCtx.getY() + 6);
          });
        }

        // ─── Checklist ────────────────────────────────────────────────────
        if (chaptersData.checklist?.items?.length > 0) {
          const ck = chaptersData.checklist;
          doc.addPage(); pageNum++;
          fill([10, 18, 45]); doc.rect(0, 0, PW, PH, "F");
          fill(C.green); doc.rect(0, 0, PW, 4, "F");
          fill([20,80,60]); doc.rect(PW - 20, 0, 20, PH, "F");
          bold(8); textC(C.green); doc.text("MASTER CHECKLIST", ML, 22);
          fill(C.green); doc.rect(ML, 25, 50, 1.5, "F");
          bold(22); textC(C.white);
          const ckTLines = doc.splitTextToSize(ck.title ?? "Your Complete Implementation Checklist", CW - 28);
          let ckY = 42;
          ckTLines.forEach((l: string) => { doc.text(l, ML, ckY); ckY += 12; });
          normal(10); textC([150, 220, 180]);
          doc.text(`${ck.items.length} action items to complete your transformation.`, ML, ckY + 3);

          addPage();
          const ckCtx = makeEnsure();
          ck.items.forEach((item: string, ii: number) => {
            ckCtx.ensure(14);
            const iy = ckCtx.getY();
            // Checkbox
            fill(C.white); doc.rect(ML, iy - 4, 6, 6, "F");
            fill(C.border); doc.rect(ML, iy - 4, 6, 6, "S");
            // Number
            bold(7); textC(C.green); doc.text(String(ii + 1).padStart(2, "0"), ML + 9, iy);
            // Item
            const iLines = doc.splitTextToSize(item, CW - 26);
            let firstLine = true;
            iLines.forEach((l: string) => {
              if (!firstLine) ckCtx.ensure(BODY_LH);
              normal(BODY_SZ); textC(C.text); doc.text(l, ML + 20, ckCtx.getY());
              ckCtx.setY(ckCtx.getY() + (firstLine ? BODY_LH : BODY_LH));
              firstLine = false;
            });
            ckCtx.setY(ckCtx.getY() + 2);
          });
        }

        // ─── FAQ ──────────────────────────────────────────────────────────
        if (chaptersData.faq?.questions?.length > 0) {
          const fq = chaptersData.faq;
          doc.addPage(); pageNum++;
          fill(C.dark); doc.rect(0, 0, PW, PH, "F");
          fill([59, 130, 246]); doc.rect(0, 0, PW, 4, "F");
          fill([20, 50, 120]); doc.rect(PW - 20, 0, 20, PH, "F");
          bold(8); textC([100, 160, 255]); doc.text("FREQUENTLY ASKED QUESTIONS", ML, 22);
          fill([100, 160, 255]); doc.rect(ML, 25, 70, 1.5, "F");
          bold(22); textC(C.white);
          doc.text(fq.title ?? "Your Questions Answered", ML, 42);

          addPage();
          const fqCtx = makeEnsure();
          fq.questions.forEach((q: any, qi: number) => {
            const question = typeof q === "string" ? q : (q.question ?? "");
            const answer = typeof q === "string" ? "" : (q.answer ?? "");
            fqCtx.ensure(22);
            const qY = fqCtx.getY();
            fill([240, 245, 255]); doc.rect(ML - 2, qY - 4, CW + 4, 11, "F");
            fill([59, 130, 246]); doc.rect(ML - 2, qY - 4, 3.5, 11, "F");
            bold(7); textC([59, 130, 246]); doc.text(`Q${qi + 1}`, ML + 7, qY + 2);
            const qLines = doc.splitTextToSize(question, CW - 20);
            bold(10); textC(C.dark);
            let qly = qY + 1;
            qLines.forEach((l: string) => { doc.text(l, ML + 14, qly); qly += 6; });
            fqCtx.setY(Math.max(qly + 3, qY + 14));
            if (answer) {
              const aLines = doc.splitTextToSize(answer, CW - 4);
              aLines.forEach((l: string) => {
                fqCtx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.text); doc.text(l, ML + 2, fqCtx.getY());
                fqCtx.setY(fqCtx.getY() + BODY_LH);
              });
            }
            fqCtx.setY(fqCtx.getY() + 7);
          });
        }

        // ─── Resources ────────────────────────────────────────────────────
        if (chaptersData.resources?.items?.length > 0) {
          const rv = chaptersData.resources;
          doc.addPage(); pageNum++;
          fill([20, 10, 50]); doc.rect(0, 0, PW, PH, "F");
          fill(C.gold); doc.rect(0, 0, PW, 4, "F");
          fill([80, 60, 10]); doc.rect(PW - 20, 0, 20, PH, "F");
          bold(8); textC(C.gold); doc.text("RESOURCE VAULT", ML, 22);
          fill(C.gold); doc.rect(ML, 25, 45, 1.5, "F");
          bold(22); textC(C.white);
          doc.text(rv.title ?? "Your Resource Vault", ML, 42);
          normal(10); textC([200, 180, 100]);
          doc.text("Tools, books, and resources to accelerate your results.", ML, 56);

          addPage();
          const rvCtx = makeEnsure();
          rv.items.forEach((item: any, ri: number) => {
            const name = typeof item === "string" ? item : (item.name ?? "");
            const desc = typeof item === "string" ? "" : (item.description ?? "");
            rvCtx.ensure(26);
            const rY = rvCtx.getY();
            fill([255, 248, 220]); doc.rect(ML - 2, rY - 5, CW + 4, 12, "F");
            fill(C.gold); doc.rect(ML - 2, rY - 5, 3.5, 12, "F");
            bold(9); textC([120, 80, 0]);
            const nLines = doc.splitTextToSize(name, CW - 12);
            let nly = rY + 1;
            nLines.forEach((l: string) => { doc.text(l, ML + 7, nly); nly += 6; });
            rvCtx.setY(Math.max(nly + 2, rY + 14));
            if (desc) {
              const dLines = doc.splitTextToSize(desc, CW - 4);
              dLines.forEach((l: string) => {
                rvCtx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.muted); doc.text(l, ML + 2, rvCtx.getY());
                rvCtx.setY(rvCtx.getY() + BODY_LH);
              });
            }
            rvCtx.setY(rvCtx.getY() + 5);
          });
        }

        // ─── Conclusion ───────────────────────────────────────────────────
        if (chaptersData.conclusion) {
          const conc = chaptersData.conclusion;
          doc.addPage(); pageNum++;
          fill(C.dark); doc.rect(0, 0, PW, PH, "F");
          fill(C.purple); doc.rect(0, 0, PW, 6, "F");
          fill(C.gold); doc.rect(0, 0, 60, 6, "F");
          fill([18, 14, 50]); doc.rect(PW - 22, 0, 22, PH, "F");
          fill(C.purple); doc.rect(PW - 22, PH * 0.35, 22, PH * 0.3, "F");
          bold(8); textC(C.gold); doc.text("CONCLUSION", ML, 28);
          fill(C.gold); doc.rect(ML, 31, 40, 1.5, "F");
          bold(22); textC(C.white);
          const ctLines = doc.splitTextToSize(conc.title ?? "Your 30-Day Action Plan", CW - 28);
          let cfy = 50;
          ctLines.forEach((l: string) => { doc.text(l, ML, cfy); cfy += 13; });

          addPage();
          const cCtx = makeEnsure();
          if (conc.body) renderTextBlock(conc.body, cCtx);
          if (Array.isArray(conc.steps) && conc.steps.length > 0) {
            cCtx.setY(cCtx.getY() + 4);
            bold(12); textC(C.dark); doc.text("Your 30-Day Roadmap", ML, cCtx.getY());
            cCtx.setY(cCtx.getY() + 7);
            const wkColors: [number,number,number][] = [C.purple, C.pink, C.green, [59, 130, 246]];
            conc.steps.forEach((step: string, si: number) => {
              cCtx.ensure(20);
              const wkLines = doc.splitTextToSize(step, CW - 16);
              const wkH = wkLines.length * 5.8 + 12;
              cCtx.ensure(wkH);
              const wy = cCtx.getY();
              fill(wkColors[si % 4]); doc.rect(ML - 2, wy - 5, CW + 4, wkH, "F");
              bold(8); textC(C.white); doc.text(`WEEK ${si + 1}`, ML + 3, wy + 1);
              let ty2 = wy + 8;
              wkLines.forEach((l: string) => { normal(9.5); textC(C.white); doc.text(l, ML + 3, ty2); ty2 += 5.8; });
              cCtx.setY(ty2 + 5);
            });
          }
        }

        // ─── Bonus ────────────────────────────────────────────────────────
        if (chaptersData.bonus) {
          const bonus = chaptersData.bonus;
          doc.addPage(); pageNum++;
          fill([12, 5, 35]); doc.rect(0, 0, PW, PH, "F");
          fill(C.gold); doc.rect(0, 0, PW, 6, "F");
          fill([18, 14, 50]); doc.rect(PW - 22, 0, 22, PH, "F");
          fill(C.gold); doc.rect(PW - 22, PH * 0.3, 22, PH * 0.4, "F");
          bold(8); textC(C.gold); doc.text("EXCLUSIVE BONUS", ML, 28);
          fill(C.gold); doc.rect(ML, 31, 60, 1.5, "F");
          bold(22); textC(C.white);
          const bTitleLines = doc.splitTextToSize(bonus.title ?? "The Secret Nobody Shares", CW - 28);
          let bfy = 55;
          bTitleLines.forEach((l: string) => { doc.text(l, ML, bfy); bfy += 13; });

          addPage();
          const bCtx = makeEnsure();
          if (bonus.body) renderTextBlock(bonus.body, bCtx);
          if (Array.isArray(bonus.items) && bonus.items.length > 0) {
            bCtx.setY(bCtx.getY() + 4);
            bold(11); textC(C.dark); doc.text("Bonus Resources", ML, bCtx.getY());
            bCtx.setY(bCtx.getY() + 7);
            bonus.items.forEach((item: string) => {
              bCtx.ensure(BODY_LH + 2);
              const itemLines = doc.splitTextToSize(item, CW - 10);
              fill(C.gold); doc.circle(ML + 2, bCtx.getY() - 1.5, 1.5, "F");
              itemLines.forEach((l: string, li: number) => {
                if (li > 0) bCtx.ensure(BODY_LH);
                normal(BODY_SZ); textC(C.text);
                doc.text(l, ML + 7, bCtx.getY());
                bCtx.setY(bCtx.getY() + BODY_LH);
              });
              bCtx.setY(bCtx.getY() + 2);
            });
          }
        }

      } else {
        // ─── 3B. LEGACY MARKDOWN RENDERER (fallback for old products) ────
        const rawContent = (product.content ?? "") as string;
        const sections = rawContent.split(/\n(?=(?:#{1,3} |Chapter \d+|CHAPTER \d+|SELLER BONUS|## BONUS|## ))/);
        const BODY_SZ = 10.5;
        const BODY_LH = 6.2;
        const H1_SZ = 15;
        const H2_SZ = 12;
        const H3_SZ = 10.5;

        sections.forEach(section => {
          if (!section.trim()) return;
          doc.addPage(); pageNum++;
          const lines = section.split("\n");
          const firstLine = (lines[0] ?? "").replace(/^#{1,4}\s*/, "").trim();
          const isBonus = firstLine.toLowerCase().includes("bonus") || firstLine.toLowerCase().includes("checklist") || firstLine.toLowerCase().includes("template");
          const isSellerBonus = firstLine.toLowerCase().includes("seller bonus") || firstLine.toLowerCase().includes("facebook ad");

          if (isSellerBonus) {
            return;
          } else if (isBonus) {
            fill([12, 5, 35]); doc.rect(0, 0, PW, PH, "F");
            fill(C.gold); doc.rect(0, 0, PW, 6, "F");
            bold(8); textC(C.gold); doc.text("BONUS SECTION", ML, 24);
            fill(C.gold); doc.rect(ML, 27, 60, 1.5, "F");
            bold(24); textC(C.white);
            const fl = doc.splitTextToSize(firstLine, CW - 24);
            let fy = 50;
            fl.forEach((l: string) => { doc.text(l, ML, fy); fy += 13; });
          } else {
            fill(C.dark); doc.rect(0, 0, PW, PH, "F");
            fill(C.purple); doc.rect(0, 0, PW, 6, "F");
            fill(C.gold); doc.rect(0, 0, 60, 6, "F");
            fill([18, 14, 50]); doc.rect(PW - 22, 0, 22, PH, "F");
            fill(C.purple); doc.rect(PW - 22, PH * 0.35, 22, PH * 0.3, "F");
            doc.setFont("helvetica","bold"); doc.setFontSize(80);
            doc.setTextColor(25, 20, 60);
            doc.text("—", ML, PH * 0.55);
            bold(H1_SZ + 4); textC(C.white);
            const fl = doc.splitTextToSize(firstLine, CW - 28);
            let fy = PH * 0.35;
            fl.forEach((l: string) => { doc.text(l, ML, fy); fy += 13; });
            const nextLine = lines.slice(1).find(l => l.trim() && !l.startsWith("#"));
            if (nextLine) {
              fy += 4;
              normal(10); textC([148, 163, 184]);
              const nl = doc.splitTextToSize(nextLine.replace(/\*\*/g,"").trim(), CW - 28);
              nl.slice(0,2).forEach((l: string) => { doc.text(l, ML, fy); fy += 7; });
            }
          }

          doc.addPage(); pageNum++;
          drawPageFrame(prodTitle, pageNum);
          let y = MT + 8;
          const ensureSpace = (needed = BODY_LH * 2): number => {
            if (y > PH - MB - needed) { doc.addPage(); pageNum++; drawPageFrame(prodTitle, pageNum); y = MT + 8; }
            return y;
          };

          lines.slice(1).forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) { y += 3; return; }
            const isH1 = /^#{1,2}\s/.test(rawLine) || /^(Chapter|CHAPTER)\s*\d+/.test(rawLine);
            const isH2 = /^#{3}\s/.test(rawLine);
            const isBullet = /^[-•*]\s/.test(rawLine);
            const isNumbered = /^\d+\.\s/.test(rawLine);
            const cleanLine = line.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").trim();

            if (isH1) {
              ensureSpace(20); y += 4;
              fill([245, 243, 255]); doc.rect(ML - 2, y - 7, CW + 4, 15, "F");
              fill(C.purple); doc.rect(ML - 2, y - 7, 4, 15, "F");
              bold(H1_SZ); textC(C.purple);
              const hl = doc.splitTextToSize(cleanLine, CW - 10);
              hl.forEach((l: string) => { doc.text(l, ML + 6, y); y += 9; });
              y += 4;
            } else if (isH2) {
              ensureSpace(14); y += 3;
              bold(H2_SZ); textC(C.dark);
              const hl = doc.splitTextToSize(cleanLine, CW);
              hl.forEach((l: string) => { doc.text(l, ML, y); y += 7.5; });
              fill([226,232,240]); doc.rect(ML, y - 1, CW * 0.6, 0.5, "F");
              y += 4;
            } else if (isBullet) {
              ensureSpace(BODY_LH);
              const bl = doc.splitTextToSize(cleanLine.replace(/^[-•*]\s*/, ""), CW - 10);
              fill(C.purple); doc.circle(ML + 2.2, y - 1.5, 1.2, "F");
              bl.forEach((l: string, bi: number) => {
                if (bi > 0) ensureSpace(BODY_LH);
                normal(BODY_SZ); textC(C.text); doc.text(l, ML + 6, y); y += BODY_LH;
              });
              y += 1;
            } else if (isNumbered) {
              ensureSpace(BODY_LH);
              const nText = cleanLine.replace(/^\d+\.\s*/, "");
              const nNum = (rawLine.match(/^(\d+)\./) ?? ["","1"])[1];
              const nl = doc.splitTextToSize(nText, CW - 12);
              fill(C.purple); doc.rect(ML, y - 4.5, 7, 6, "F");
              bold(7); textC(C.white); doc.text(nNum, ML + 1.5, y - 0.2);
              nl.forEach((l: string, ni: number) => {
                if (ni > 0) ensureSpace(BODY_LH);
                normal(BODY_SZ); textC(C.text); doc.text(l, ML + 10, y); y += BODY_LH;
              });
              y += 1;
            } else {
              const pl = doc.splitTextToSize(cleanLine, CW);
              pl.forEach((l: string) => { ensureSpace(BODY_LH); normal(BODY_SZ); textC(C.text); doc.text(l, ML, y); y += BODY_LH; });
              y += 1.5;
            }
          });
        });
      }

      // ─── 5. ABOUT AUTHOR PAGE ────────────────────────────────────────────
      doc.addPage(); pageNum++;
      fill(C.dark); doc.rect(0, 0, PW, PH, "F");
      fill(C.purple); doc.rect(0, 0, PW, 6, "F");
      fill(C.gold); doc.rect(0, 0, 60, 6, "F");
      fill([18,14,50]); doc.rect(PW - 22, 0, 22, PH, "F");
      fill(C.purple); doc.rect(PW - 22, PH * 0.3, 22, PH * 0.4, "F");

      bold(8); textC(C.gold); doc.text("ABOUT THE AUTHOR", ML, MT + 4);
      fill(C.gold); doc.rect(ML, MT + 7, 50, 1.5, "F");
      bold(22); textC(C.white); doc.text(aName, ML, MT + 22);
      fill(C.purple); doc.rect(ML, MT + 26, 30, 2, "F");

      const bio = product.authorBio ?? `${aName} is a passionate expert dedicated to helping people achieve real results.`;
      normal(11); textC([203,213,225]);
      const bioWl = doc.splitTextToSize(bio, CW - 24);
      let bioY = MT + 38;
      bioWl.forEach((bl: string) => { doc.text(bl, ML, bioY); bioY += 7; });

      // Disclaimer
      bioY += 10;
      fill([22,16,55]); doc.rect(ML, bioY - 4, CW - 24, 22, "F");
      normal(7.5); textC([100,116,139]);
      const disclaimer = "This guide is for informational purposes only. Results may vary. The information provided does not constitute medical, legal, or financial advice. Always consult a qualified professional before making significant health, legal, or financial decisions.";
      const disWl = doc.splitTextToSize(disclaimer, CW - 30);
      let disY = bioY + 4;
      disWl.forEach((l: string) => { doc.text(l, ML + 3, disY); disY += 5; });

      doc.save(`${prodTitle.slice(0, 40).replace(/[^a-z0-9]/gi, "-")}.pdf`);
      toast({ title: "📥 PDF downloaded! — Premium professional quality" });
    } catch (err) {
      console.error(err);
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setPdfGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: `${label} copied!` }));
  };

  // ── STEP: Details ──────────────────────────────────────────────────────────
  if (step === "details") {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Create Digital Product</h1>
          <p className="text-muted-foreground text-sm mt-1">AI builds a complete professional PDF + landing page + viral marketing campaign</p>
        </div>
        <ProgressSteps step="details" />

        {/* Mode toggle */}
        <div className="flex gap-2 border border rounded-xl p-1 bg-muted/30">
          <button
            onClick={() => setUploadMode("ai")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${uploadMode === "ai" ? "bg-card shadow text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-4 h-4" /> AI Create Product
          </button>
          <button
            onClick={() => setUploadMode("upload")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${uploadMode === "upload" ? "bg-card shadow text-blue-700 border border-blue-200" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Upload className="w-4 h-4" /> Upload My Product
          </button>
        </div>

        {uploadMode === "ai" ? (
          <Card className="p-5 md:p-6 border space-y-4">
            {fromTrending && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">Pre-filled from Trending Ideas — all details ready. Just hit Create!</p>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Product Topic <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Natural Remedies for Belly Fat Loss, Bigger Hips Workout Guide..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">Be specific — better topic = higher quality product that sells faster</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Author Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Your name or brand name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Selling Price ($)</Label>
                <Input
                  type="number"
                  placeholder="27"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="h-11"
                  min={1}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Target Audience / Context (optional)</Label>
              <Textarea
                placeholder="e.g. Women 30+ struggling with stubborn belly fat who want natural solutions without medication..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-4">
              <Label className="text-sm font-bold mb-1.5 block flex items-center gap-1.5 text-violet-700">
                <Target className="w-4 h-4 text-violet-600" /> AI Angle / Direction <span className="font-normal text-xs text-violet-500">(optional — but powerful)</span>
              </Label>
              <Textarea
                placeholder={`Tell the AI exactly what angle to take. Examples:\n• "I want to teach people how to make money with YouTube\n  — focus on short-form content monetization"\n• "Teach beginners how to start a blog and get paid\n  through affiliate marketing"\n• "Show people how to lose weight using a 16:8 fasting\n  schedule — make it very practical and actionable"`}
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                rows={4}
                className="bg-card border-violet-200 focus:border-violet-500 text-sm"
              />
              <p className="text-xs text-violet-600 mt-1.5 font-medium">💡 The more specific your angle, the more targeted and high-converting your product will be.</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" /> PDF Size & Price Range
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {PAGE_COUNTS.map((pc) => (
                  <button
                    key={pc.value}
                    onClick={() => { setPageCount(pc.value); if (!price || price === 27) setPrice(pc.value === 10 ? 17 : pc.value === 20 ? 27 : pc.value === 30 ? 37 : pc.value === 40 ? 47 : 67); }}
                    className={`relative text-left p-2 rounded-lg border transition-all text-xs ${pageCount === pc.value ? "border-purple-500 bg-primary/5" : "border hover:border-primary/40"}`}
                  >
                    {pc.popular && <span className="absolute -top-2 left-2 text-xs bg-orange-400 text-white px-1.5 rounded-full font-bold">Popular</span>}
                    <p className="font-bold text-foreground">{pc.label}</p>
                    <p className="text-muted-foreground">{pc.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Product Style
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {PRODUCT_STYLES.map((ps) => {
                  const Icon = ps.icon;
                  return (
                    <button
                      key={ps.value}
                      onClick={() => setProductStyle(ps.value)}
                      className={`text-left p-2 rounded-lg border transition-all text-xs ${productStyle === ps.value ? "border-purple-500 bg-primary/5" : "border hover:border-primary/40"}`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${productStyle === ps.value ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`font-bold ${productStyle === ps.value ? "text-primary" : "text-foreground"}`}>{ps.label}</p>
                      <p className="text-muted-foreground leading-tight" style={{fontSize:"10px"}}>{ps.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                <Image className="w-4 h-4 text-pink-500" /> Your Photo URL (optional — shown on landing page)
              </Label>
              <Input
                placeholder="https://your-photo-url.jpg — paste a URL to your photo"
                value={authorPhotoUrl}
                onChange={(e) => setAuthorPhotoUrl(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">Adding your photo increases buyer trust and conversion rates by up to 40%</p>
            </div>

            <Button
              onClick={handleCreate}
              className="w-full h-12 bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-base font-bold text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create My {PRODUCT_STYLES.find(s => s.value === productStyle)?.label ?? "Product"} ({pageCount} Pages)
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">Takes 60–120 seconds • 7-Stage AI Pipeline • Premium Quality</p>
          </Card>
        ) : (
          <Card className="p-5 md:p-6 border space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-800 mb-1">Upload Your Own Product</p>
              <p className="text-xs text-blue-600">Already have a PDF, eBook, or digital product? Upload it here to sell on your store with a landing page and marketing campaign.</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Product Title <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. The Complete Hip Growth Guide" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="h-11" />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Product Description</Label>
              <Textarea placeholder="Describe what buyers get and why they should buy it..." value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Price ($)</Label>
                <Input type="number" value={uploadPrice} onChange={e => setUploadPrice(Number(e.target.value))} className="h-11" min={1} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">File URL / Google Drive Link <span className="text-red-500">*</span></Label>
                <Input placeholder="https://drive.google.com/..." value={uploadFileUrl} onChange={e => setUploadFileUrl(e.target.value)} className="h-11" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Your Photo URL (optional)</Label>
              <Input placeholder="https://your-photo-url.jpg" value={uploadAuthorPhoto} onChange={e => setUploadAuthorPhoto(e.target.value)} className="h-10" />
            </div>

            <Button
              onClick={handleUploadProduct}
              disabled={uploadLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 text-base font-bold"
            >
              {uploadLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Upload & List Product</>}
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // ── STEP: Generating ──────────────────────────────────────────────────────
  if (step === "generating") {
    return (
      <div className="max-w-2xl mx-auto">
        <ProgressSteps step="generating" />
        <Card className="border p-8">
          <GeneratingAnimation />
        </Card>
      </div>
    );
  }

  // ── STEP: Result ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <ProgressSteps step="result" />

      {/* Title row */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{product?.title}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{product?.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setStep("details"); setProduct(null); setLandingPage(null); setCampaign(null); setPublishedUrls(null); setFromTrending(false); }}>
          ← Create Another
        </Button>
      </div>

      {/* Cover Image + Shareable Link + Description */}
      <div className={product?.coverImageUrl ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "space-y-3"}>
        {product?.coverImageUrl && (
          <div className="md:col-span-1">
            <div className="rounded-xl overflow-hidden border border shadow-md aspect-[4/5]">
              <img
                src={product.coverImageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        <div className={`${product?.coverImageUrl ? "md:col-span-2" : ""} space-y-3 flex flex-col justify-start`}>
          {(product?.subtitle || product?.description || product?.aboutSection) && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-4">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1.5">Product Description</p>
              <p className="text-sm text-foreground leading-relaxed">
                {product?.subtitle || product?.description || product?.aboutSection}
              </p>
              {product?.targetAudience && (
                <p className="text-xs text-muted-foreground mt-2">
                  🎯 <strong>For:</strong> {product.targetAudience}
                </p>
              )}
            </div>
          )}
          <div className="bg-muted/30 border border rounded-xl p-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Your Product Landing Page
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-card border border rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate min-w-0">
                {typeof window !== "undefined" ? window.location.origin : ""}/product/{product?.id}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(`${window.location.origin}/product/${product?.id}`, "Product link")}
                className="shrink-0 h-9 gap-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <a href={`/product/${product?.id}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-9 px-2.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Share this link — customers can view and buy directly from this page.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-600">${product?.price ?? price}</p>
          <p className="text-xs text-green-700">Selling Price</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${(product?.sellabilityScore ?? 85) >= 85 ? "bg-primary/5 border-purple-100" : "bg-amber-50 border-amber-200"}`}>
          <p className={`text-2xl font-black ${(product?.sellabilityScore ?? 85) >= 85 ? "text-primary" : "text-amber-600"}`}>{product?.sellabilityScore ?? 85}/100</p>
          <p className={`text-xs ${(product?.sellabilityScore ?? 85) >= 85 ? "text-primary" : "text-amber-700"}`}>Sellability Score</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-blue-600">{product?.pageCount ?? pageCount}</p>
          <p className="text-xs text-blue-700">Pages</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-orange-600 truncate">{product?.category ?? "General"}</p>
          <p className="text-xs text-orange-700">Category</p>
        </div>
      </div>

      {/* Sellability Improvement Panel */}
      {(product?.sellabilityScore ?? 85) < 85 ? (
        <Card className="p-4 border-2 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3 flex-wrap">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900">Product can be improved</p>
              <p className="text-sm text-amber-700 mt-0.5">Score is below 85. AI can expand weak chapters, add missing sections (Quick Start, Framework, Checklist, FAQ, Resources), and boost content depth.</p>
            </div>
            <Button
              onClick={handleImprove}
              disabled={improving}
              className="bg-amber-500 hover:bg-amber-600 border-0 font-bold text-white flex-shrink-0"
            >
              {improving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Improving...</> : <><Zap className="w-4 h-4 mr-2" />Improve Product</>}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800">Premium quality — sellability score is excellent ({product?.sellabilityScore ?? 85}/100)</p>
          <Button variant="ghost" size="sm" onClick={handleImprove} disabled={improving} className="ml-auto text-green-700 hover:text-green-900 text-xs h-7">
            {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
            {improving ? "Improving..." : "Boost further"}
          </Button>
        </div>
      )}

      {/* Sellability Report Panel */}
      <div className="border border rounded-xl overflow-hidden">
        <button
          onClick={handleGetReport}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-sm">AI Sellability Report</span>
            {sellabilityReport && (
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                Ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!sellabilityReport && !reportLoading && (
              <span className="text-xs text-muted-foreground">Analyze what's weak & how to fix it</span>
            )}
            {reportLoading
              ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
              : reportExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        </button>

        {reportExpanded && (
          <div className="p-4 space-y-5 border-t border bg-card">
            {reportLoading ? (
              <div className="flex flex-col items-center py-8 gap-3 text-muted-foreground">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-sm font-medium">Analyzing product quality across 8 dimensions…</p>
                <p className="text-xs text-muted-foreground">This takes 10–20 seconds</p>
              </div>
            ) : sellabilityReport && (
              <>
                {/* Summary */}
                <div className="bg-muted/30 rounded-lg p-3 border border">
                  <p className="text-sm text-foreground leading-relaxed">{sellabilityReport.summary}</p>
                  {sellabilityReport.potentialScore > (product?.sellabilityScore ?? 85) && (
                    <p className="text-xs text-primary font-semibold mt-2 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Potential score after improvements: <span className="font-black">{sellabilityReport.potentialScore}/100</span>
                    </p>
                  )}
                </div>

                {/* 8 Dimension Scores */}
                {Array.isArray(sellabilityReport.sections) && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quality Breakdown</p>
                    <div className="space-y-2.5">
                      {sellabilityReport.sections.map((sec: any, i: number) => {
                        const score = sec.score ?? 0;
                        const isStrong = sec.status === "strong" || score >= 85;
                        const isMissing = sec.status === "missing" || score < 50;
                        const barColor = isMissing ? "bg-red-400" : isStrong ? "bg-green-500" : "bg-amber-400";
                        const labelColor = isMissing ? "text-red-600" : isStrong ? "text-green-700" : "text-amber-700";
                        const bgColor = isMissing ? "bg-red-50 border-red-100" : isStrong ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100";
                        return (
                          <div key={i} className={`rounded-lg px-3 py-2.5 border ${bgColor}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-foreground">{sec.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black ${labelColor}`}>{score}/100</span>
                                {isMissing ? <XCircle className="w-3.5 h-3.5 text-red-500" /> : isStrong ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
                              <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${score}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground">{sec.feedback}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.isArray(sellabilityReport.topStrengths) && sellabilityReport.topStrengths.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1"><Star className="w-3 h-3" /> What's Working</p>
                      <ul className="space-y-1.5">
                        {sellabilityReport.topStrengths.map((s: string, i: number) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(sellabilityReport.topWeaknesses) && sellabilityReport.topWeaknesses.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> What's Holding It Back</p>
                      <ul className="space-y-1.5">
                        {sellabilityReport.topWeaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                            <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Improvement Plan */}
                {Array.isArray(sellabilityReport.improvementPlan) && sellabilityReport.improvementPlan.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Action Plan to Reach 90+</p>
                    <div className="space-y-2">
                      {sellabilityReport.improvementPlan.map((item: any, i: number) => {
                        const isHigh = item.priority === "high";
                        const isMed = item.priority === "medium";
                        const badgeClass = isHigh ? "bg-red-100 text-red-700" : isMed ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground";
                        const borderClass = isHigh ? "border-red-200 bg-red-50" : isMed ? "border-amber-200 bg-amber-50" : "border bg-muted/30";
                        return (
                          <div key={i} className={`rounded-lg p-3 border ${borderClass}`}>
                            <div className="flex items-start gap-2">
                              <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${badgeClass}`}>
                                {item.priority}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">{item.action}</p>
                                {item.impact && (
                                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3 text-primary/80 flex-shrink-0" />{item.impact}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Marketability Note */}
                {sellabilityReport.marketabilityNote && (
                  <div className="bg-primary/5 border border-primary/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Market Opportunity</p>
                    <p className="text-xs text-primary">{sellabilityReport.marketabilityNote}</p>
                  </div>
                )}

                {/* Re-run improve */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">Report generated based on current product structure</p>
                  <Button size="sm" onClick={handleImprove} disabled={improving} className="bg-primary hover:bg-primary/90 border-0 text-white text-xs h-8">
                    {improving ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Improving...</> : <><Zap className="w-3 h-3 mr-1.5" />Apply AI Improvements</>}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Generate All CTA banner */}
      {!landingPage && !emailSequence.length && !marketingAssets && (
        <Card className="p-4 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-foreground">⚡ One-click: Generate Everything</p>
              <p className="text-sm text-muted-foreground">Landing page + 30-day email sequence + TikTok/Instagram scripts — all in one shot.</p>
            </div>
            <Button onClick={handleGenerateAll} disabled={loadingGenerateAll} className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 font-bold text-white">
              {loadingGenerateAll ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating (60–90s)...</> : <>⚡ Generate All Assets</>}
            </Button>
          </div>
        </Card>
      )}

      {/* Publish CTA */}
      {!publishedUrls ? (
        <Card className="p-4 border-2 border-primary/30 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-foreground">Ready to start selling?</p>
              <p className="text-sm text-muted-foreground">Publish instantly — your product goes live on the marketplace right away.</p>
            </div>
            <Button onClick={handlePublish} disabled={publishing} className="bg-gradient-to-r from-primary to-pink-600 border-0 font-bold">
              {publishing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Publishing...</> : <><DollarSign className="w-4 h-4 mr-1" /> Publish Now</>}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-3 flex-wrap">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-green-800">Product is LIVE on your store! 🎉</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <a href={publishedUrls.storeUrl} target="_blank" className="text-xs text-blue-600 underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />View Store</a>
                <a href={`/product/${product?.id}`} target="_blank" className="text-xs text-blue-600 underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Product Page</a>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${window.location.origin}/product/${product?.id}`, "Product link")}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
            </Button>
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          onClick={() => { if (!landingPage) handleGenerateLanding(); else setActiveTab("landing"); }}
          disabled={loadingLanding || loadingGenerateAll}
          className={`h-auto py-3 flex-col gap-1 text-xs ${landingPage ? "border-green-400 text-green-700 bg-green-50" : "border-primary/40 text-primary hover:bg-primary/5"}`}
        >
          {loadingLanding ? <Loader2 className="w-4 h-4 animate-spin" /> : landingPage ? <CheckCircle className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          {loadingLanding ? "Generating..." : landingPage ? "Landing Page ✓" : "Gen Landing Page"}
        </Button>

        <Button
          variant="outline"
          onClick={() => { if (!emailSequence.length) { toast({ title: "Use ⚡ Generate All to create the 30-day sequence" }); } else setActiveTab("emails"); }}
          className={`h-auto py-3 flex-col gap-1 text-xs ${emailSequence.length > 0 ? "border-green-400 text-green-700 bg-green-50" : "border-teal-300 text-teal-700 hover:bg-teal-50"}`}
        >
          {emailSequence.length > 0 ? <CheckCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          {emailSequence.length > 0 ? `30-Day Emails ✓` : "30-Day Emails"}
        </Button>

        <Button
          variant="outline"
          onClick={() => { if (!campaign) handleGenerateCampaign(); else setActiveTab("campaign"); }}
          disabled={loadingCampaign || loadingGenerateAll}
          className={`h-auto py-3 flex-col gap-1 text-xs ${campaign || marketingAssets ? "border-green-400 text-green-700 bg-green-50" : "border-orange-300 text-orange-700 hover:bg-orange-50"}`}
        >
          {loadingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : (campaign || marketingAssets) ? <CheckCircle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
          {loadingCampaign ? "Generating..." : (campaign || marketingAssets) ? "Marketing ✓" : "Gen Campaign"}
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={pdfGenerating}
          className="h-auto py-3 flex-col gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {pdfGenerating ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border overflow-x-auto">
        {[
          { id: "product", label: "📖 Product Content" },
          { id: "landing", label: "🎯 Landing Page" },
          { id: "emails", label: `📧 30-Day Emails${emailSequence.length > 0 ? ` (${emailSequence.length})` : ""}` },
          { id: "campaign", label: "📢 Marketing" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? "border-purple-600 text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Product Tab */}
      {activeTab === "product" && (
        <Card className="p-4 md:p-6 border space-y-5">
          {product?.monetizationNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-800 mb-1">💡 Monetization Strategy</p>
              <p className="text-sm text-amber-700">{product.monetizationNotes}</p>
            </div>
          )}

          {/* Premium Sections Badges */}
          {product?.chaptersData && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Premium Sections Included</p>
              <div className="flex flex-wrap gap-2">
                {product.chaptersData.quickStart && <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full"><Zap className="w-3 h-3" /> Quick Start</span>}
                {product.chaptersData.introduction && <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full"><BookOpen className="w-3 h-3" /> Introduction</span>}
                {product.chaptersData.framework && <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full"><LayoutTemplate className="w-3 h-3" /> Framework</span>}
                {product.chaptersData.commonMistakes && <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full"><AlertTriangle className="w-3 h-3" /> Mistakes</span>}
                {product.chaptersData.checklist && <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full"><ListChecks className="w-3 h-3" /> Checklist ({product.chaptersData.checklist.items?.length ?? 0})</span>}
                {product.chaptersData.faq && <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-1 rounded-full"><HelpCircle className="w-3 h-3" /> FAQ ({product.chaptersData.faq.questions?.length ?? 0} Q&A)</span>}
                {product.chaptersData.resources && <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full"><Library className="w-3 h-3" /> Resources ({product.chaptersData.resources.items?.length ?? 0})</span>}
                {product.chaptersData.bonus && <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-800 text-xs font-semibold px-2.5 py-1 rounded-full"><Sparkles className="w-3 h-3" /> Bonus</span>}
                {Array.isArray(product.chaptersData.chapters) && <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full"><BookMarked className="w-3 h-3" /> {product.chaptersData.chapters.length} Chapters</span>}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Table of Contents</p>
            <div className="space-y-1">
              {(product?.tableOfContents ?? []).map((ch: string, i: number) => (
                <div key={i} className="flex items-start gap-2 bg-muted/30 rounded-lg px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-foreground">{ch}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter Preview */}
          {product?.chaptersData?.chapters?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Chapter Preview ({product.chaptersData.chapters.length} chapters · ~{Math.round(product.chaptersData.chapters.reduce((a: number, ch: any) => a + (ch.body?.split(/\s+/).length ?? 0), 0) / 250)} pages of content)
              </p>
              <div className="space-y-2">
                {product.chaptersData.chapters.slice(0, 3).map((ch: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3 border border">
                    <p className="text-xs font-bold text-primary mb-1">Ch. {ch.number}: {ch.title}</p>
                    {ch.hook && <p className="text-xs text-muted-foreground italic mb-2">"{ch.hook}"</p>}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{ch.body?.slice(0, 300)}...</p>
                    <p className="text-xs text-muted-foreground mt-1">{ch.body?.split(/\s+/).length ?? 0} words</p>
                  </div>
                ))}
                {product.chaptersData.chapters.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">+ {product.chaptersData.chapters.length - 3} more chapters in the full PDF</p>
                )}
              </div>
            </div>
          )}

          {/* Quick Start Preview */}
          {product?.chaptersData?.quickStart?.steps?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Quick Start: {product.chaptersData.quickStart.title}</p>
              <div className="space-y-1">
                {product.chaptersData.quickStart.steps.slice(0, 3).map((step: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-green-700">
                    <span className="w-4 h-4 rounded-full bg-green-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[9px]">{i+1}</span>
                    <span>{typeof step === "string" ? step : step.step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Landing Page Tab */}
      {activeTab === "landing" && (
        !landingPage ? (
          <Card className="p-8 border text-center space-y-4">
            <Globe className="w-10 h-10 text-primary/70 mx-auto" />
            <p className="font-semibold text-foreground">Generate a unique landing page for this product</p>
            <p className="text-sm text-muted-foreground">AI will write custom, high-conversion sales copy tailored to your exact audience</p>
            <Button onClick={handleGenerateLanding} disabled={loadingLanding} className="bg-gradient-to-r from-primary to-pink-600 border-0">
              {loadingLanding ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Globe className="w-4 h-4 mr-2" />Generate Landing Page</>}
            </Button>
          </Card>
        ) : (
          <Card className="p-4 md:p-6 border space-y-4">
            {landingPage.heroHeadline && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-bold text-primary mb-1">HERO HEADLINE</p>
                <p className="text-xl md:text-2xl font-black text-foreground">{landingPage.heroHeadline}</p>
                {landingPage.heroSubheadline && <p className="text-muted-foreground mt-2">{landingPage.heroSubheadline}</p>}
                {landingPage.heroCta && <Badge className="mt-2 bg-primary text-white border-0">{landingPage.heroCta}</Badge>}
              </div>
            )}
            {landingPage.problemSection && (
              <div>
                <p className="text-sm font-bold text-foreground mb-2">{landingPage.problemSection.headline}</p>
                <ul className="space-y-1">
                  {landingPage.problemSection.points?.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-red-400 mt-0.5">✗</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {landingPage.socialProof?.testimonials && (
              <div>
                <p className="text-sm font-bold text-foreground mb-2">{landingPage.socialProof.headline}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {landingPage.socialProof.testimonials.map((t: any, i: number) => (
                    <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <div className="flex gap-1 mb-1">{Array.from({length: 5}).map((_,j)=><span key={j} className="text-yellow-400 text-xs">★</span>)}</div>
                      <p className="text-xs text-muted-foreground italic">"{t.text}"</p>
                      <p className="text-xs font-bold text-foreground mt-1">{t.name} <span className="font-normal text-muted-foreground">— {t.role}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-2">📋 Pricing Section</p>
              <p className="text-sm font-bold text-foreground">{landingPage.pricingSection?.headline}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-muted-foreground line-through">${landingPage.pricingSection?.originalPrice}</span>
                <span className="text-2xl font-black text-green-600">${landingPage.pricingSection?.currentPrice}</span>
              </div>
              {landingPage.pricingSection?.guarantee && (
                <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {landingPage.pricingSection.guarantee}
                </p>
              )}
            </div>
          </Card>
        )
      )}

      {/* Campaign Tab */}
      {activeTab === "campaign" && (
        !campaign ? (
          <Card className="p-8 border text-center space-y-4">
            <Megaphone className="w-10 h-10 text-orange-300 mx-auto" />
            <p className="font-semibold text-foreground">Generate your complete marketing guide</p>
            <p className="text-sm text-muted-foreground">Facebook guide + ads, YouTube strategy, TikTok scripts, sales scripts, ad copy, CTAs — everything in one shot</p>
            <Button onClick={handleGenerateCampaign} disabled={loadingCampaign} className="bg-gradient-to-r from-orange-500 to-amber-500 border-0">
              {loadingCampaign ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Megaphone className="w-4 h-4 mr-2" />Generate Full Marketing Guide</>}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <CampaignTabs campaign={campaign} copyToClipboard={copyToClipboard} />
          </div>
        )
      )}

      {/* 30-Day Email Sequence Tab */}
      {activeTab === "emails" && (
        emailSequence.length === 0 ? (
          <Card className="p-8 border text-center space-y-4">
            <Mail className="w-10 h-10 text-teal-300 mx-auto" />
            <p className="font-semibold text-foreground">Generate a complete 30-day email sequence</p>
            <p className="text-sm text-muted-foreground">AI writes 30 strategic emails — welcome, value, case studies, objection handling, and conversion emails — all personalized to your product.</p>
            <Button onClick={handleGenerateAll} disabled={loadingGenerateAll} className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white font-bold">
              {loadingGenerateAll ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating everything...</> : <>⚡ Generate All Assets (incl. 30-day emails)</>}
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            <Card className="p-4 border-2 border-teal-200 bg-teal-50/50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-bold text-teal-800">{emailSequence.length} emails ready · Complete 30-day follow-up sequence</p>
                  <p className="text-xs text-teal-600 mt-0.5">Download as .txt to read, or .csv to import into Mailchimp, ConvertKit, ActiveCampaign, etc.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={handleDownloadEmailsCsv} className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                    <Download className="w-3.5 h-3.5 mr-1" /> Download .csv
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadEmails} className="border-teal-300 text-teal-700 hover:bg-teal-50">
                    <Download className="w-3.5 h-3.5 mr-1" /> Download .txt
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(emailSequence.map((e: any, i: number) => `Subject: ${e.subject}\n\n${e.body}`).join("\n\n" + "=".repeat(50) + "\n\n"), "All emails")}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy All
                  </Button>
                </div>
              </div>
            </Card>
            {emailSequence.map((email: any, i: number) => (
              <EmailCard key={i} email={email} index={i} />
            ))}
          </div>
        )
      )}

      {/* ── Audio Generation CTA ── always visible at bottom ── */}
      <Card className="p-5 border-2 border-violet-100 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
        <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-base mb-1">🎙️ Want to generate audio for this product?</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transform your product into professional AI audio — perfect for audiobooks, promotional voiceovers, podcast content, or social media ads. Use our Voice Studio to create compelling audio from your product content in minutes.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <a href="/voice" target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-violet-600 to-blue-700 hover:from-violet-700 hover:to-purple-800 border-0 text-white font-semibold gap-2 shadow-md shadow-violet-200">
                <Mic className="w-4 h-4" /> Yes, Go to Voice Studio
              </Button>
            </a>
            <a href="/voice/clones" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50 gap-2 font-medium">
                <Volume2 className="w-4 h-4" /> Clone My Voice
              </Button>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
