import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Copy, Check, Users, DollarSign, TrendingUp, Gift,
  Link as LinkIcon, Twitter, Facebook, MessageCircle,
  Star, Trophy, Loader2, Crown, Zap, BookOpen,
  ChevronDown, ChevronUp, Calculator, ClipboardList, Megaphone,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="p-5 border">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-green-600 font-medium mt-1">{sub}</p>}
    </Card>
  );
}

function CopyScript({ label, platform, icon, text, link }: { label: string; platform: string; icon: string; text: string; link: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const full = text + "\n\n" + link;
  const copy = () => {
    navigator.clipboard.writeText(full);
    setCopied(true);
    toast({ title: `${platform} script copied!` });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="border border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-xs font-bold text-foreground">{platform}</span>
          <Badge variant="secondary" className="text-xs">{label}</Badge>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy script"}
        </button>
      </div>
      <div className="px-4 py-3 bg-card">
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{text}</p>
        <p className="text-xs text-primary font-mono mt-2">{link}</p>
      </div>
    </div>
  );
}

function ActionStep({ step, title, time, description, tip }: any) {
  const [open, setOpen] = useState(step === 1);
  return (
    <div className="border border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow">
          {step}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-muted/30 border-t border">
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{description}</p>
          {tip && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-sm">💡</span>
              <p className="text-xs text-amber-800 leading-relaxed">{tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Affiliate() {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referrals, setReferrals] = useState(10);
  const [conversionRate, setConversionRate] = useState(30);
  const [activeGuideTab, setActiveGuideTab] = useState<"plan" | "scripts" | "calc">("plan");

  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-stats"],
    queryFn: () => apiClient.get("/affiliate/stats").then(r => r.data),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["affiliate-leaderboard"],
    queryFn: () => apiClient.get("/affiliate/leaderboard").then(r => r.data),
  });

  const BASE = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${BASE}/register?ref=${data?.affiliateCode ?? "YOUR_CODE"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast({ title: "Referral link copied!" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data?.affiliateCode ?? "");
    setCopiedCode(true);
    toast({ title: "Affiliate code copied!" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareTwitter = () => {
    const text = `I'm using Selovox to create & sell digital products with AI. Start free:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = `Check out Selovox — create & sell digital products with AI in minutes. Start free here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats ?? {};
  const commissions = data?.commissions ?? [];
  const referralsList = data?.referrals ?? [];

  const proConversions = Math.round(referrals * (conversionRate / 100));
  const monthlyEarnings = proConversions * 8.70;
  const yearlyEarnings = monthlyEarnings * 12;

  const COMMISSION_STRUCTURE = [
    { icon: "🎯", event: "Someone signs up with your link", earn: "$1.00", color: "from-primary to-primary" },
    { icon: "⭐", event: "Your referral upgrades to Pro ($29/mo)", earn: "$8.70", color: "from-pink-500 to-pink-600" },
    { icon: "💰", event: "Your referral makes a product sale", earn: "30% of sale", color: "from-green-500 to-green-600" },
  ];

  const ACTION_STEPS = [
    {
      step: 1,
      title: "Copy your referral link right now",
      time: "⏱ 30 seconds",
      description: "Scroll up and copy your unique referral link. Save it somewhere easy to access — your notes app, a pinned message, or your phone's clipboard. You'll be pasting this everywhere today.",
      tip: "Your link never expires and works 24/7. Every click is tracked and credited to you automatically.",
    },
    {
      step: 2,
      title: "Post a TikTok or Instagram Reel (fastest traffic)",
      time: "⏱ 10–20 minutes",
      description: 'Film a 30–60 second video showing yourself using Selovox to create a digital product. You don\'t need to show your face — just screen record. Add text overlay: "Made a digital product in 2 minutes with AI 🤯" and put your referral link in your bio. TikTok and Reels get free organic reach, even on new accounts.',
      tip: 'Use the script in the "Copy-Paste Scripts" tab below — it\'s written specifically for short-form video captions and hooks.',
    },
    {
      step: 3,
      title: "Post in 3 Facebook groups",
      time: "⏱ 15 minutes",
      description: 'Search Facebook for "digital products", "make money online", "side hustle", "passive income". Join the top 3 active groups (at least 5,000 members). Post your story: what you created, why it saved you time, your results. Don\'t make it sound like an ad — talk about YOUR experience first. Add the link at the end naturally.',
      tip: "Groups with 10,000–50,000 members often outperform larger ones because the community is more engaged and less spammy.",
    },
    {
      step: 4,
      title: "Send a WhatsApp broadcast to your contacts",
      time: "⏱ 5 minutes",
      description: "Open WhatsApp and send a personal message (not a group blast) to 10–20 people you know who are interested in side income, content creation, or digital business. Keep it short and personal. \"Hey [Name], found this AI tool that lets you create & sell digital products in minutes — thought of you. Here's my link if you want to try it free.\"",
      tip: "Personal 1-on-1 WhatsApp messages convert at 3-5x the rate of group posts. 15 messages could easily get you 3–5 signups.",
    },
    {
      step: 5,
      title: "Tweet + pin it to your profile",
      time: "⏱ 5 minutes",
      description: 'Post on Twitter/X using the script in the Scripts tab. Then go to your profile and pin that tweet. Pinned tweets get 3x more impressions because every visitor to your profile sees it first.',
      tip: "Add 3–5 hashtags: #sidehustle #digitalproducts #makemoneyonline #aitools #passiveincome",
    },
    {
      step: 6,
      title: "Follow up 24 hours later",
      time: "⏱ 10 minutes",
      description: "Check your affiliate stats page to see how many clicks and signups you got. Reply to everyone who commented or messaged about your post. People who clicked but didn't sign up often just need a nudge — send them a follow-up: \"Did you get a chance to check it out? Happy to answer any questions.\"",
      tip: "Most affiliate sales come from 2–3 touchpoints, not one. The follow-up is where money is made.",
    },
  ];

  const PROMO_SCRIPTS = [
    {
      platform: "TikTok / Instagram Reels",
      label: "Caption",
      icon: "🎵",
      text: `POV: You made your first digital product in under 3 minutes using AI 🤯

No writing. No design skills. No experience needed.

I used Selovox and honestly — I wish I found this sooner.

👇 Free to start (link below)`,
    },
    {
      platform: "Twitter / X",
      label: "Thread starter",
      icon: "🐦",
      text: `I created a digital product, built a sales page, and wrote all the marketing copy for it — in under 10 minutes.

Here's the AI tool I used (and how you can do the same):

→ Selovox lets you generate PDFs, scripts, thumbnails, and landing pages with a single prompt.

Free to start. No card required.`,
    },
    {
      platform: "Facebook Group",
      label: "Story post",
      icon: "👥",
      text: `Genuine question for this group: has anyone else been using AI to create digital products?

I've been using Selovox for the past few weeks and it's genuinely changed how I create content. I can produce a full PDF guide, sales copy, and thumbnail in one session — stuff that used to take me days.

Not an ad — just sharing what's working for me. If you want to try it free, here's my referral link:`,
    },
    {
      platform: "WhatsApp / Telegram",
      label: "Personal message",
      icon: "💬",
      text: `Hey! Quick one — I've been using this AI tool to create and sell digital products online. It literally writes everything: the product, the sales page, the marketing copy.

Thought of you because I know you're into [side income / content / online business].

You can start free — here's my link if you want to check it out:`,
    },
    {
      platform: "Email",
      label: "Newsletter / blast",
      icon: "📧",
      text: `Subject: The AI tool I've been using to create digital products fast

Hey [First Name],

I want to share something that's saved me a serious amount of time lately.

It's called Selovox — and it uses AI to help you create digital products (eBooks, guides, PDFs), write sales copy, generate thumbnails, and even build landing pages.

The whole thing takes minutes, not days.

I've been using it and honestly, it's one of the best tools I've come across for anyone who wants to make money online without having to be a writer or designer.

You can start for free here:`,
    },
    {
      platform: "YouTube Description",
      label: "Description / pinned comment",
      icon: "▶️",
      text: `🔗 Tools I use in this video:

Selovox (FREE to start) — the AI tool I used to create digital products, write my sales copy, and build my landing page:

I earn a small commission if you sign up through my link (at no extra cost to you). I only recommend tools I actually use.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" /> Affiliate Program
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Share your link. Earn 30% commissions. Money hits your wallet automatically.
          </p>
        </div>
        {Number(stats.totalEarned) > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-green-600 font-medium">Total Earned</p>
            <p className="text-xl font-black text-green-700">${stats.totalEarned}</p>
          </div>
        )}
      </div>

      {/* Commission Structure */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">How You Earn</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {COMMISSION_STRUCTURE.map(({ icon, event, earn, color }) => (
            <div key={event} className="bg-card border border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-base mb-3 shadow`}>
                {icon}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{event}</p>
              <p className="text-xl font-black text-foreground">{earn}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Commissions credited to your wallet instantly. Minimum withdrawal: $50.
        </p>
      </div>

      {/* Referral Link */}
      <Card className="p-5 border border-primary/30 bg-gradient-to-r from-purple-50 to-pink-50/30">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-primary" /> Your Referral Link
        </h2>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-card border border-primary/30 rounded-lg px-4 py-3 text-sm text-foreground font-mono truncate">
            {referralLink}
          </div>
          <Button onClick={copyLink} className="bg-primary hover:bg-primary/90 border-0 flex-shrink-0">
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? "Copied!" : "Copy Link"}
          </Button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Share on:</span>
          <button onClick={shareTwitter} className="flex items-center gap-1.5 text-xs bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors">
            <Twitter className="w-3.5 h-3.5" /> Twitter / X
          </button>
          <button onClick={shareWhatsApp} className="flex items-center gap-1.5 text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button onClick={shareFacebook} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
            <Facebook className="w-3.5 h-3.5" /> Facebook
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Code:</span>
            <button onClick={copyCode} className="flex items-center gap-1.5 font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors">
              {data?.affiliateCode}
              {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Referrals" value={stats.totalReferrals ?? 0} color="from-primary to-primary" />
        <StatCard icon={Crown} label="Pro Subscribers" value={stats.activeReferrals ?? 0} sub={stats.activeReferrals > 0 ? `$${(stats.activeReferrals * 8.70).toFixed(2)} earned` : null} color="from-pink-500 to-pink-600" />
        <StatCard icon={DollarSign} label="Total Earned" value={`$${stats.totalEarned ?? "0.00"}`} color="from-green-500 to-green-600" />
        <StatCard icon={TrendingUp} label="Pending Payout" value={`$${stats.pendingPayout ?? "0.00"}`} sub="In your wallet" color="from-orange-500 to-orange-600" />
      </div>

      {/* ── AFFILIATE QUICK MONEY GUIDE ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Affiliate Quick Money Guide</h2>
          <Badge className="bg-primary/10 text-primary border-0 text-xs">Start earning today</Badge>
        </div>

        {/* Guide Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
          {([
            { key: "plan", label: "24-Hour Action Plan", icon: ClipboardList },
            { key: "scripts", label: "Copy-Paste Scripts", icon: Megaphone },
            { key: "calc", label: "Earnings Calculator", icon: Calculator },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveGuideTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
                activeGuideTab === key
                  ? "bg-card text-primary shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab: 24-Hour Action Plan */}
        {activeGuideTab === "plan" && (
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-primary to-pink-600 rounded-xl p-4 mb-4 text-white">
              <p className="font-bold text-sm mb-1">🚀 Your first commission in 24 hours</p>
              <p className="text-xs text-blue-100">
                Follow these 6 steps in order today. Each step takes under 20 minutes. Most affiliates who get their first commission do so within the first day of sharing.
              </p>
            </div>
            {ACTION_STEPS.map(step => (
              <ActionStep key={step.step} {...step} />
            ))}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
              <p className="text-xs font-bold text-amber-800 mb-1">📊 Realistic expectations</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                If you do all 6 steps today: expect 15–40 link clicks, 3–8 signups, and 1–3 who upgrade to Pro within the first week.
                That's <strong>$8.70–$26.10 in your first week</strong> from a few hours of sharing.
                Scale by repeating steps 2–5 every few days with fresh content.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Copy-Paste Scripts */}
        {activeGuideTab === "scripts" && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-1">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>How to use:</strong> Click "Copy script" on any card below — the text + your referral link copies to your clipboard instantly.
                Paste it directly into the platform. You can edit the text to match your voice, but don't change the link.
              </p>
            </div>
            {PROMO_SCRIPTS.map(s => (
              <CopyScript key={s.platform} {...s} link={referralLink} />
            ))}
          </div>
        )}

        {/* Tab: Earnings Calculator */}
        {activeGuideTab === "calc" && (
          <div className="space-y-4">
            <div className="bg-card border border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-5">How much could you earn?</h3>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-muted-foreground">People you share with per week</label>
                    <span className="text-sm font-black text-primary">{referrals} people</span>
                  </div>
                  <input
                    type="range" min={1} max={500} value={referrals}
                    onChange={e => setReferrals(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span><span>500</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-semibold text-muted-foreground">% who upgrade to Pro (industry avg: 20–40%)</label>
                    <span className="text-sm font-black text-primary">{conversionRate}%</span>
                  </div>
                  <input
                    type="range" min={5} max={60} value={conversionRate}
                    onChange={e => setConversionRate(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5%</span><span>60%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="text-center bg-primary/5 rounded-xl p-4">
                  <p className="text-xs text-primary mb-1">Pro conversions</p>
                  <p className="text-2xl font-black text-primary">{proConversions}</p>
                  <p className="text-xs text-primary">per week</p>
                </div>
                <div className="text-center bg-pink-50 rounded-xl p-4">
                  <p className="text-xs text-pink-600 mb-1">Monthly earnings</p>
                  <p className="text-2xl font-black text-pink-700">${monthlyEarnings.toFixed(0)}</p>
                  <p className="text-xs text-pink-500">$8.70 × {proConversions * 4}</p>
                </div>
                <div className="text-center bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 mb-1">Annual earnings</p>
                  <p className="text-2xl font-black text-green-700">${yearlyEarnings.toFixed(0)}</p>
                  <p className="text-xs text-green-500">per year</p>
                </div>
              </div>

              <div className="mt-4 bg-muted/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Note:</strong> Based on $8.70 per Pro upgrade (30% of $29/mo). Actual results depend on your audience and how you promote.
                  These are estimates — some affiliates earn more, some less. The biggest factor is consistency.
                </p>
              </div>
            </div>

            {/* Income milestones */}
            <Card className="p-5 border">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Income milestones to aim for
              </h3>
              <div className="space-y-3">
                {[
                  { goal: "$50/mo", referrals: "6 Pro referrals/mo", effort: "Share 3x per week for 2 weeks", badge: "Starter" },
                  { goal: "$200/mo", referrals: "23 Pro referrals/mo", effort: "Post daily on 2 platforms for 1 month", badge: "Growing" },
                  { goal: "$500/mo", referrals: "58 Pro referrals/mo", effort: "Consistent content + personal outreach", badge: "Scaling" },
                  { goal: "$1,000/mo", referrals: "115 Pro referrals/mo", effort: "Email list + TikTok + community strategy", badge: "Pro" },
                  { goal: "$3,000/mo", referrals: "345 Pro referrals/mo", effort: "Dedicated affiliate site or YouTube channel", badge: "Expert" },
                ].map(({ goal, referrals, effort, badge }) => (
                  <div key={goal} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="w-14 text-right">
                      <span className="text-sm font-black text-foreground">{goal}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{referrals}</p>
                      <p className="text-xs text-muted-foreground">{effort}</p>
                    </div>
                    <Badge className="text-xs bg-primary/5 text-primary border-primary/30 flex-shrink-0">{badge}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Commission History + Referrals */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5 border">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" /> Commission History
          </h2>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No commissions yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Share your link using the guide above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.slice(0, 8).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-green-600">+${Number(c.amount).toFixed(2)}</p>
                    <Badge className={`text-xs ${c.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5 border">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Your Referrals
            </h2>
            {referralsList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No referrals yet — follow the guide above!</p>
            ) : (
              <div className="space-y-2">
                {referralsList.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground">{r.name}</span>
                    </div>
                    <Badge className={`text-xs ${r.plan === "pro" ? "bg-primary/5 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {r.plan === "pro" ? "Pro ⭐" : "Free"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {leaderboard && leaderboard.length > 0 && (
            <Card className="p-5 border">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Top Affiliates
              </h2>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black w-5 ${i === 0 ? "text-amber-500" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber-700" : "text-muted-foreground/60"}`}>
                        #{i + 1}
                      </span>
                      <span className="text-sm text-foreground">{l.name}</span>
                      <span className="text-xs text-muted-foreground">{l.referrals} referrals</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">${Number(l.total).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
