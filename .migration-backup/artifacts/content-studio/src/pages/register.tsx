import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { name, email, password } },
      {
        onSuccess: (data: any) => {
          localStorage.setItem("token", data.token);
          setLocation("/dashboard");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: value prop */}
        <div className="hidden md:block">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl mb-8">
            <Zap className="w-7 h-7 text-purple-400" />
            ViralCraft Studio
          </Link>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Start creating viral content <span className="text-purple-400">today</span>
          </h2>
          <p className="text-slate-400 mb-8">Join thousands of creators generating high-quality content that gets views.</p>
          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form */}
        <div>
          <div className="text-center md:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl">
              <Zap className="w-7 h-7 text-purple-400" />
              ViralCraft Studio
            </Link>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-6">Create your account</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Full Name</Label>
                <Input
                  data-testid="input-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input
                  data-testid="input-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Password</Label>
                <Input
                  data-testid="input-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
                />
              </div>
              <Button
                data-testid="button-register"
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11 mt-2"
                disabled={register.isPending}
              >
                {register.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Free Account
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
