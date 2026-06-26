import { useState, useEffect } from "react";
import { useListSettings, useUpdateSetting } from "@workspace/api-client-react";
import { getListSettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";

const SETTING_KEYS = [
  { key: "affiliate_link", label: "Affiliate / CTA Link", placeholder: "https://...", description: "Main affiliate or call-to-action URL on dashboard banner" },
  { key: "ad_text", label: "Banner Ad Text", placeholder: "Click Here To Create your Digital Product in Minutes with AI", description: "Text displayed in the dashboard promotional banner" },
  { key: "video_tool_link", label: "Video Tool Link", placeholder: "https://...", description: "Link for 'Create Video/Audio with this Content' button" },
  { key: "support_email", label: "Support Email", placeholder: "support@example.com", description: "Email shown in support pages" },
  { key: "platform_name", label: "Platform Name", placeholder: "ViralCraft Studio", description: "Name shown across the platform" },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [changed, setChanged] = useState(false);

  const { data: settings } = useListSettings({ query: { queryKey: getListSettingsQueryKey() } });
  const updateSettings = useUpdateSetting();

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      settings.forEach((s: any) => { vals[s.key] = s.value; });
      setValues(vals);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setChanged(true);
  };

  const handleSave = () => {
    const updates = SETTING_KEYS
      .filter(({ key }) => values[key] !== undefined)
      .map(({ key }) => ({ key, value: values[key] }));

    updateSettings.mutate({ data: { updates } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
        toast({ title: "Settings saved" });
        setChanged(false);
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 text-sm">Global configuration and links</p>
        </div>
        <Button onClick={handleSave} disabled={!changed || updateSettings.isPending} size="sm">
          <Save className="w-4 h-4 mr-1" />
          Save Changes
        </Button>
      </div>

      <Card className="p-6 border space-y-5">
        {SETTING_KEYS.map(({ key, label, placeholder, description }) => (
          <div key={key}>
            <Label className="text-sm font-medium text-slate-700 mb-1 block">{label}</Label>
            {key === "ad_text" ? (
              <Textarea
                data-testid={`input-${key}`}
                placeholder={placeholder}
                value={values[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                rows={2}
              />
            ) : (
              <Input
                data-testid={`input-${key}`}
                placeholder={placeholder}
                value={values[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            )}
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
