import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CheckCircle2, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
            <p className="text-muted-foreground mb-2">If an account exists for</p>
            <p className="text-primary/70 font-semibold text-lg mb-6">{email}</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              you'll receive a password reset link shortly. It expires in 1 hour. Check your spam folder if you don't see it.
            </p>
            <Link href="/login" className="text-primary/80 hover:text-primary/70 text-sm font-medium">
              ← Back to sign in
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
          <p className="text-muted-foreground text-sm">Reset your password</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
          <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-muted-foreground/60 text-sm">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-muted-foreground focus:border-purple-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="inline-flex items-center gap-1 text-primary/80 hover:text-primary/70 font-medium">
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
