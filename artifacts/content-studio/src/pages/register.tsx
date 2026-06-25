import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CheckCircle2, Gift } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setRefCode(ref.trim().toUpperCase());
    const rt = params.get("returnTo");
    if (rt) setReturnTo(rt);
  }, []);

  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { name, email, password };
    if (refCode) body.ref = refCode;
    register.mutate(
      { data: body },
      {
        onSuccess: (data: any) => {
          if ((data as any).requiresVerification) {
            setVerificationSent(true);
          } else {
            localStorage.setItem("token", (data as any).token);
            setLocation(returnTo ?? "/dashboard");
          }
        },
        onError: (err: any) => {
          toast({ title: err?.response?.data?.error ?? "Registration failed", variant: "destructive" });
        },
      }
    );
  };

  const perks = [
    "Generate viral scripts for 5 platforms",
    "AI thumbnail generation",
    "Premium PDF creation",
    "Video modeling & analysis",
  ];

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-blue-100 rounded-2xl p-10 shadow-lg shadow-blue-50">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-md">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check Your Email!</h1>
            <p className="text-muted-foreground mb-2">We sent a verification link to</p>
            <p className="text-sky-600 font-semibold text-lg mb-6">{email}</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Click the link in the email to verify your account and access your dashboard. Check your spam folder if you don't see it within a few minutes.
            </p>
            <Link href="/login" className="text-sky-500 hover:text-sky-600 text-sm font-medium">
              Already verified? Sign in →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: value prop */}
        <div className="hidden md:block">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground font-bold text-2xl mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Selo<span className="text-sky-500">vox</span>
          </Link>
          <h2 className="text-4xl font-extrabold text-foreground mb-4 leading-tight">
            Start creating viral content <span className="text-sky-500">today</span>
          </h2>
          <p className="text-muted-foreground mb-8">Join thousands of creators generating high-quality content that gets views.</p>
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-muted-foreground text-sm">
                <CheckCircle2 className="w-5 h-5 text-sky-500 flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form */}
        <div>
          <div className="text-center md:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-foreground font-bold text-2xl">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              Selo<span className="text-sky-500">vox</span>
            </Link>
          </div>
          <div className="bg-card border border-blue-100 rounded-2xl p-8 shadow-lg shadow-blue-50">
            <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>

            {refCode && (
              <div className="flex items-center gap-2 mb-5 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
                <Gift className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <p className="text-xs text-sky-600">
                  You were invited with referral code <span className="font-mono font-bold text-sky-700">{refCode}</span> — your friend earns a commission when you join!
                </p>
              </div>
            )}

            <GoogleSignInButton />
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or sign up with email</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Full Name</Label>
                <Input
                  data-testid="input-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5 border-blue-100 focus:border-sky-400 bg-card"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <Input
                  data-testid="input-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 border-blue-100 focus:border-sky-400 bg-card"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Password</Label>
                <Input
                  data-testid="input-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1.5 border-blue-100 focus:border-sky-400 bg-card"
                />
              </div>
              <Button
                data-testid="button-register"
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white h-11 mt-2 font-semibold border-0 shadow-md shadow-blue-200"
                disabled={register.isPending}
              >
                {register.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Free Account
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} className="text-sky-500 hover:text-sky-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
