import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const returnTo = new URLSearchParams(window.location.search).get("returnTo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (data: any) => {
          localStorage.setItem("token", data.token);
          if (returnTo) {
            setLocation(returnTo);
          } else if (data.user.role === "admin") {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground font-bold text-2xl mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Selo<span className="text-sky-500">vox</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-card border border-blue-100 rounded-2xl p-8 shadow-lg shadow-blue-50">
          <h1 className="text-2xl font-bold text-foreground mb-6">Welcome back</h1>
          <GoogleSignInButton />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 border-blue-100 focus:border-sky-400 bg-card"
              />
            </div>
            <Button
              data-testid="button-login"
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white h-11 mt-2 font-semibold border-0 shadow-md shadow-blue-200"
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
            <p>
              <Link href="/forgot-password" className="text-sky-500 hover:text-sky-600 font-medium">
                Forgot your password?
              </Link>
            </p>
            <p>
              Don't have an account?{" "}
              <Link href={returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register"} className="text-sky-500 hover:text-sky-600 font-medium">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
