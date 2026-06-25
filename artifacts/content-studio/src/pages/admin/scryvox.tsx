import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, Brain, Globe, FlaskConical, CheckCircle2, Settings2, ToggleLeft, ToggleRight } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const STYLES = ["youtube","storytelling","persuasive","conversational","professional","blog","email","podcast","linkedin","pdf_chapter","twitter_thread","poetic"];
const TONES = ["empathetic","fired_up","serious","reflective","humorous","inspiring","raw","wise"];
const LENGTHS = ["micro","short","medium","long","epic"];

const STYLE_LABELS: Record<string, string> = {
  youtube: "YouTube Script", storytelling: "Storytelling", persuasive: "Persuasive / Sales",
  conversational: "Conversational", professional: "Professional", blog: "Blog Post",
  email: "Email", podcast: "Podcast Script", linkedin: "LinkedIn Post",
  pdf_chapter: "PDF Chapter", twitter_thread: "X / Twitter Thread", poetic: "Poetic"
};
const TONE_LABELS: Record<string, string> = {
  empathetic: "Empathetic", fired_up: "Fired Up", serious: "Serious", reflective: "Reflective",
  humorous: "Humorous", inspiring: "Inspiring", raw: "Raw & Honest", wise: "Wise"
};
const LENGTH_LABELS: Record<string, string> = {
  micro: "Micro (~150w)", short: "Short (~350w)", medium: "Medium (~700w)", long: "Long (~1,200w)", epic: "Epic (~2,000w)"
};

interface ScrySettings {
  enabled: boolean;
  mode: string;
  defaultStyle: string;
  defaultTone: string;
  defaultLength: string;
}

export default function AdminScryvox() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ScrySettings>({
    enabled: true, mode: "studio_only", defaultStyle: "blog", defaultTone: "inspiring", defaultLength: "medium"
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/scryvox/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.enabled !== undefined) setSettings(d); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/scryvox/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Scryvox settings saved", description: "Changes are live immediately." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Scryvox Engine</h1>
          <p className="text-sm text-muted-foreground">Human-grade writing engine — no API keys required</p>
        </div>
        <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
          <Zap className="w-3 h-3 mr-1" /> Built-in · Unlimited · Free
        </Badge>
      </div>

      {/* Enable / Disable */}
      <Card className="p-5 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Engine Status</p>
            <p className="text-sm text-muted-foreground mt-0.5">Enable or disable the Scryvox writing engine globally</p>
          </div>
          <button onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))} className="flex-shrink-0">
            {settings.enabled
              ? <ToggleRight className="w-10 h-10 text-violet-600" />
              : <ToggleLeft className="w-10 h-10 text-muted-foreground" />}
          </button>
        </div>
        <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${settings.enabled ? "bg-emerald-50 text-emerald-700" : "bg-muted/30 text-muted-foreground"}`}>
          {settings.enabled ? "✓ Scryvox is active and available to users" : "✗ Scryvox is disabled — users cannot generate content"}
        </div>
      </Card>

      {/* Mode Selection */}
      <Card className="p-5 border">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <p className="font-semibold text-foreground">Scope Mode</p>
        </div>
        <div className="space-y-3">
          {[
            { value: "studio_only", icon: FlaskConical, title: "Writer Studio Only", desc: "Scryvox powers the dedicated Writer Studio page at /scryvox. All other content tools continue using external AI API keys as configured." },
            { value: "all_system", icon: Globe, title: "All System (Replace AI)", desc: "Scryvox replaces external AI for all text generation across the entire platform — content creation, scripts, PDFs, landing pages, and more. Ideal if you have no AI API keys or want zero API costs." },
            { value: "none", icon: ToggleLeft, title: "Disabled (External AI Only)", desc: "Scryvox generates nothing. All features rely entirely on external AI API keys (Gemini, Groq, Anthropic, OpenAI) configured in Admin > API Keys." },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, mode: opt.value }))}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${settings.mode === opt.value ? "border-violet-500 bg-violet-50" : "border hover:border bg-card"}`}
            >
              <div className="flex items-start gap-3">
                <opt.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${settings.mode === opt.value ? "text-violet-600" : "text-muted-foreground"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${settings.mode === opt.value ? "text-violet-900" : "text-foreground"}`}>{opt.title}</span>
                    {settings.mode === opt.value && <CheckCircle2 className="w-4 h-4 text-violet-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Defaults */}
      <Card className="p-5 border">
        <p className="font-semibold text-foreground mb-4">Default Output Settings</p>
        <p className="text-xs text-muted-foreground mb-4">These defaults pre-fill the Writer Studio for users. They can change them per generation.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Default Style</label>
            <select
              value={settings.defaultStyle}
              onChange={e => setSettings(s => ({ ...s, defaultStyle: e.target.value }))}
              className="w-full border border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {STYLES.map(s => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Default Tone</label>
            <select
              value={settings.defaultTone}
              onChange={e => setSettings(s => ({ ...s, defaultTone: e.target.value }))}
              className="w-full border border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {TONES.map(t => <option key={t} value={t}>{TONE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Default Length</label>
            <select
              value={settings.defaultLength}
              onChange={e => setSettings(s => ({ ...s, defaultLength: e.target.value }))}
              className="w-full border border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {LENGTHS.map(l => <option key={l} value={l}>{LENGTH_LABELS[l]}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Engine Info */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
        <p className="font-semibold text-violet-900 mb-3">How Scryvox Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-violet-800">
          {[
            ["12 Writing Styles", "From YouTube scripts to PDF chapters — every major format covered"],
            ["8 Emotional Tones", "Empathetic to fired-up — matched to your content's purpose"],
            ["Topic Expander", "Goes beyond what users type — explores deeper angles, insights, contrarian views"],
            ["Humanizer Layer", "Post-processes to remove AI patterns — adds rhythm, em-dashes, fragments, variation"],
            ["5 Variations", "Same topic → 5 completely different pieces every time"],
            ["Viral Scoring", "Rates each piece for YouTube algorithm appeal and human authenticity"],
            ["Zero API Cost", "Runs entirely on your server — no external calls, no limits, no keys"],
            ["< 50ms Generation", "Faster than any AI model — generates 2,000 words in under a second"],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{title}:</span> <span className="text-violet-700">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white px-8">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
