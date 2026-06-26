import { useState } from "react";
import { useGetMe, useChangePassword } from "@workspace/api-client-react";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Mail, Calendar, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function Settings() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const changePassword = useChangePassword();
  const { toast } = useToast();

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must be identical.", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({ title: "Password too short", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    changePassword.mutate(
      { data: { currentPassword: form.currentPassword, newPassword: form.newPassword } },
      {
        onSuccess: () => {
          setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          setSuccess(true);
          toast({ title: "Password updated", description: "Your password has been changed successfully." });
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? err?.message ?? "Something went wrong";
          toast({ title: "Failed to change password", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const newPasswordStrength = () => {
    const p = form.newPassword;
    if (!p) return null;
    if (p.length < 6) return { label: "Too short", color: "text-red-500" };
    if (p.length < 10) return { label: "Weak", color: "text-orange-500" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) return { label: "Strong", color: "text-green-500" };
    return { label: "Fair", color: "text-yellow-500" };
  };
  const strength = newPasswordStrength();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and security</p>
      </div>

      {/* Profile card */}
      <Card className="p-6 border">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <Badge className="ml-auto capitalize" variant={user?.role === "admin" ? "default" : "secondary"}>
            {user?.role}
          </Badge>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-28">Email</span>
            <span className="text-slate-800">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-28">Full Name</span>
            <span className="text-slate-800">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-28">Role</span>
            <span className="text-slate-800 capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-28">Member Since</span>
            <span className="text-slate-800">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</span>
          </div>
          {user?.lastLogin && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 w-28">Last Login</span>
              <span className="text-slate-800">{new Date(user.lastLogin).toLocaleString()}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Change password card */}
      <Card className="p-6 border">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
        </div>

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Password changed successfully. Use your new password next time you log in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {strength && (
              <p className={`text-xs font-medium ${strength.color}`}>
                Strength: {strength.label}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat new password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs font-medium text-red-500">Passwords do not match</p>
            )}
            {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 6 && (
              <p className="text-xs font-medium text-green-500">Passwords match ✓</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={changePassword.isPending || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          >
            {changePassword.isPending ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
