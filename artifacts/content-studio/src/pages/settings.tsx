import { useState, useEffect } from "react";
import { useGetMe, useChangePassword } from "@workspace/api-client-react";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import ThemeToggle from "@/components/ThemeToggle";
import {
  User, Shield, Mail, Calendar, Lock, Eye, EyeOff,
  CheckCircle, Camera, Edit2, Save, X, Sun, Moon, Monitor,
  Share2, ExternalLink, Copy,
} from "lucide-react";
import { apiClient } from "@/lib/api";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const changePassword = useChangePassword();
  const { toast } = useToast();
  const { theme, setTheme, isDark } = useTheme();

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    country: "",
    profilePicture: "",
    profileBio: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: (user as any).name ?? "",
        username: (user as any).username ?? "",
        country: (user as any).country ?? "",
        profilePicture: (user as any).profilePicture ?? "",
        profileBio: (user as any).profileBio ?? "",
      });
    }
  }, [user]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordSuccess(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({ title: "Password too short — 6 characters minimum", variant: "destructive" });
      return;
    }
    changePassword.mutate(
      { data: { currentPassword: form.currentPassword, newPassword: form.newPassword } },
      {
        onSuccess: () => {
          setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          setPasswordSuccess(true);
          toast({ title: "Password updated" });
        },
        onError: (err: any) => {
          toast({ title: err?.data?.error ?? err?.message ?? "Something went wrong", variant: "destructive" });
        },
      }
    );
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await apiClient.patch("/user/profile", profileForm);
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setEditingProfile(false);
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error ?? "Update failed", variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  };

  const strength = (() => {
    const p = form.newPassword;
    if (!p) return null;
    if (p.length < 6) return { label: "Too short", color: "text-red-500" };
    if (p.length < 10) return { label: "Weak", color: "text-orange-500" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) return { label: "Strong", color: "text-green-500" };
    return { label: "Fair", color: "text-yellow-500" };
  })();

  const avatarUrl = (user as any)?.profilePicture;

  const themeOptions = [
    {
      id: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Cream & sky blue",
      preview: "bg-[#FAF7F2] border-sky-200",
      dot: "bg-sky-400",
    },
    {
      id: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Deep navy & sky blue",
      preview: "bg-[#0f1623] border-sky-900",
      dot: "bg-sky-500",
    },
    {
      id: "system" as const,
      label: "System",
      icon: Monitor,
      description: "Follows your OS setting",
      preview: isDark ? "bg-[#0f1623] border-sky-900" : "bg-[#FAF7F2] border-sky-200",
      dot: isDark ? "bg-sky-500" : "bg-sky-400",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, appearance, and security</p>
      </div>

      {/* ── PROFILE CARD ── */}
      <Card className="p-6 border">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-sky-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {(user as any)?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{(user as any)?.name}</h2>
              <p className="text-sm text-muted-foreground">{(user as any)?.email}</p>
              {(user as any)?.profileBio && (
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">{(user as any).profileBio}</p>
              )}
            </div>
          </div>
          {!editingProfile ? (
            <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={handleProfileSave} disabled={profileLoading} className="bg-sky-500 hover:bg-sky-600 text-white border-0">
                {profileLoading ? "Saving..." : <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>}
              </Button>
            </div>
          )}
        </div>

        {editingProfile ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">Full Name</Label>
                <Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input
                    value={profileForm.username}
                    onChange={e => setProfileForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                    placeholder="yourname"
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Your store: /store/{profileForm.username || "yourname"}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-sky-500" /> Profile Picture URL
              </Label>
              <Input
                value={profileForm.profilePicture}
                onChange={e => setProfileForm(p => ({ ...p, profilePicture: e.target.value }))}
                placeholder="https://your-photo-url.jpg"
              />
              {profileForm.profilePicture && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={profileForm.profilePicture} alt="Preview" className="w-12 h-12 rounded-full object-cover border" onError={e => { (e.target as HTMLImageElement).src = ""; }} />
                  <p className="text-xs text-muted-foreground">Preview</p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Bio / About You</Label>
              <Textarea
                value={profileForm.profileBio}
                onChange={e => setProfileForm(p => ({ ...p, profileBio: e.target.value }))}
                placeholder="Tell buyers about yourself and your expertise…"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-0.5">{profileForm.profileBio.length}/300 characters</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Country</Label>
              <Input value={profileForm.country} onChange={e => setProfileForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. United States" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-border pt-4">
            {[
              { icon: User, label: "Username", value: (user as any)?.username ? `@${(user as any).username}` : "Not set" },
              { icon: Shield, label: "Role", value: (user as any)?.role === "admin" ? "Admin" : "Creator" },
              { icon: Mail, label: "Subscription", value: (user as any)?.subscriptionTier === "pro" ? "Pro ✨" : "Free" },
              { icon: Calendar, label: "Joined", value: (user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : "—" },
              { icon: CheckCircle, label: "Email", value: (user as any)?.emailVerified ? "Verified ✓" : "Not verified" },
              { icon: User, label: "Country", value: (user as any)?.country || "Not set" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 bg-accent rounded-lg p-2.5">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── SHARE YOUR PROFILE ── */}
      {(user as any)?.username && (() => {
        const profileUrl = `${window.location.origin}/creator/${(user as any).username}`;
        const shareText = encodeURIComponent(`Check out my digital product store on Selovox! 🚀`);
        const encodedUrl = encodeURIComponent(profileUrl);
        return (
          <Card className="p-5 border bg-gradient-to-r from-sky-50/60 to-blue-50/40 dark:from-sky-950/20 dark:to-blue-950/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm">Your Creator Profile</p>
                <p className="text-xs text-muted-foreground truncate">{profileUrl}</p>
              </div>
              <a href={`/creator/${(user as any).username}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="text-muted-foreground flex-shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                  toast({ title: "Profile link copied!" });
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
              </Button>

              {/* Twitter/X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-sky-500 border-sky-200 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950/40 px-3">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="ml-1.5 hidden sm:inline">Post on X</span>
                </Button>
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/40 px-3">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="ml-1.5 hidden sm:inline">LinkedIn</span>
                </Button>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${shareText}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40 px-3">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="ml-1.5 hidden sm:inline">WhatsApp</span>
                </Button>
              </a>
            </div>
          </Card>
        );
      })()}

      {/* ── EMAIL VERIFICATION BANNER ── */}
      {(user as any) && !(user as any).emailVerified && (
        <Card className="p-4 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 border">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800 dark:text-yellow-400">Email Not Verified</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">Verify your email to unlock all features and ensure your store is trusted by buyers.</p>
            </div>
            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs" onClick={async () => {
              try {
                await apiClient.post("/auth/resend-verification", {});
                toast({ title: "Verification email sent!" });
              } catch {
                toast({ title: "Failed to send", variant: "destructive" });
              }
            }}>
              Resend Email
            </Button>
          </div>
        </Card>
      )}

      {/* ── APPEARANCE ── */}
      <Card className="p-6 border">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            {isDark ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-sky-500" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Appearance</h3>
            <p className="text-xs text-muted-foreground">Choose your preferred colour scheme</p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`relative rounded-xl border-2 p-4 flex flex-col items-center gap-2 text-center transition-all ${
                  isActive
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                    : "border-border hover:border-sky-300 dark:hover:border-sky-700 bg-card"
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`w-10 h-6 rounded-md border ${opt.preview} flex items-center justify-center gap-1`}>
                  <div className={`w-2 h-2 rounded-full ${opt.dot}`} />
                </div>
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-500" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-xs font-semibold ${isActive ? "text-sky-600 dark:text-sky-400" : "text-foreground"}`}>{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── CHANGE PASSWORD ── */}
      <Card className="p-6 border">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">Keep your account secure</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">Password updated successfully!</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { name: "currentPassword", label: "Current Password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { name: "newPassword", label: "New Password", show: showNew, toggle: () => setShowNew(!showNew) },
            { name: "confirmPassword", label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
          ].map(({ name, label, show, toggle }) => (
            <div key={name}>
              <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handlePasswordChange}
                  className="pr-10 h-10"
                />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {name === "newPassword" && strength && (
                <p className={`text-xs mt-1 font-medium ${strength.color}`}>{strength.label}</p>
              )}
            </div>
          ))}
          <Button
            type="submit"
            disabled={changePassword.isPending || !form.currentPassword || !form.newPassword}
            className="w-full bg-foreground hover:bg-foreground/90 text-background border-0"
          >
            {changePassword.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
