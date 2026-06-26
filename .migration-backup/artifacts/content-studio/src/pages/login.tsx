import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (data: any) => {
          localStorage.setItem("token", data.token);
          if (data.user.role === "admin") {
            setLocation("/admin");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: () => {
          toast({ title: "Invalid credentials", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-2xl mb-2">
            <Zap className="w-7 h-7 text-purple-400" />
            ViralCraft Studio
          </Link>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6">Welcome back</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
            </div>
            <Button
              data-testid="button-login"
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11 mt-2"
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
              Create one free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Admin demo: admin@viralcraft.com / admin123
        </p>
      </div>
    </div>
  );
}
