import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setTokenMissing(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => setLocation("/login"), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Invalid or expired link. Please request a new one.";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (tokenMissing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Invalid Link</h1>
            <p className="text-muted-foreground mb-6">This reset link is missing or malformed. Please request a new one.</p>
            <Link href="/forgot-password" className="text-primary/80 hover:text-primary/70 text-sm font-medium">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Password Reset!</h1>
            <p className="text-muted-foreground mb-6">Your password has been updated. Redirecting you to sign in...</p>
            <Link href="/login" className="text-primary/80 hover:text-primary/70 text-sm font-medium">
              Sign in now →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl mb-2">
            <Zap className="w-7 h-7 text-primary/80" />
            Selovox
          </Link>
          <p className="text-muted-foreground text-sm">Choose a new password</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6">Reset your password</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-muted-foreground/60 text-sm">New Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-muted-foreground focus:border-purple-500"
              />
            </div>
            <div>
              <Label className="text-muted-foreground/60 text-sm">Confirm Password</Label>
              <Input
                type="password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-muted-foreground focus:border-purple-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Set New Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
