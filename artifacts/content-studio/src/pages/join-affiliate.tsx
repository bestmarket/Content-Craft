import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Star, DollarSign, PackageOpen, CheckCircle, Loader2,
  UserCheck, TrendingUp, Shield, ArrowRight,
} from "lucide-react";

export default function JoinAffiliate() {
  const { code } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [joined, setJoined] = useState(false);

  const { data: program, isLoading, error } = useQuery({
    queryKey: ["affiliate-invite", code],
    queryFn: () => apiClient.get(`/affiliate/program-invite/${code}`).then(r => r.data),
    enabled: !!code,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiClient.post(`/affiliate/join/${code}`, {}).then(r => r.data),
    onSuccess: () => {
      setJoined(true);
      toast({ title: "Application submitted!", description: "The seller will review and approve your request." });
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error ?? "Failed to join";
      if (msg.includes("already")) {
        toast({ title: "Already applied", description: msg });
      } else if (msg.includes("login") || e.response?.status === 401) {
        navigate(`/login?redirect=/join-affiliate/${code}`);
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="p-8 text-center max-w-md">
          <PackageOpen className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Program Not Found</h2>
          <p className="text-muted-foreground text-sm mb-4">This affiliate invite link is invalid or the program is no longer active.</p>
          <Button onClick={() => navigate("/marketplace")} variant="outline">Browse Marketplace</Button>
        </Card>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-1">You've applied to promote <strong>{program.productTitle}</strong></p>
          <p className="text-muted-foreground text-sm mb-6">
            {program.sellerName} will review your application. Once approved, you'll get your unique tracking link.
          </p>
          <Button onClick={() => navigate("/affiliate-portal")} className="bg-primary hover:bg-primary/90 w-full gap-2">
            <TrendingUp className="w-4 h-4" /> Go to Affiliate Portal
          </Button>
        </Card>
      </div>
    );
  }

  const estimatedEarning = (Number(program.productPrice ?? 0) * Number(program.commissionRate ?? 30) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">

        {/* Header card */}
        <Card className="p-6 border border-primary/30 bg-card shadow-lg">
          <div className="flex items-start gap-4 mb-5">
            {program.coverImageUrl ? (
              <img src={program.coverImageUrl} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow">
                <PackageOpen className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <Badge className="bg-primary/10 text-primary border-0 text-xs mb-1.5">Affiliate Opportunity</Badge>
              <h1 className="text-xl font-bold text-foreground">{program.productTitle}</h1>
              <p className="text-sm text-muted-foreground">by {program.sellerName}</p>
            </div>
          </div>

          {/* Commission highlight */}
          <div className="bg-gradient-to-r from-primary to-pink-600 rounded-xl p-4 text-white mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs mb-0.5">Commission per sale</p>
                <p className="text-3xl font-black">{program.commissionRate}%</p>
                <p className="text-blue-200 text-xs mt-0.5">≈ ${estimatedEarning} per sale</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs mb-0.5">Product price</p>
                <p className="text-2xl font-bold">${Number(program.productPrice ?? 0).toFixed(2)}</p>
                <p className="text-blue-200 text-xs mt-0.5">{program.cookieDays}-day cookie</p>
              </div>
            </div>
          </div>

          {program.description && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">About this program</p>
              <p className="text-sm text-foreground leading-relaxed">{program.description}</p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-2 mb-5">
            {[
              { icon: DollarSign, text: `Earn ${program.commissionRate}% on every sale you drive` },
              { icon: TrendingUp, text: "Real-time stats tracking in your affiliate portal" },
              { icon: Shield, text: `${program.cookieDays}-day cookie window per referred visitor` },
              { icon: UserCheck, text: "Get exclusive promo materials and training from the seller" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                <Icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>

          {program.terms && (
            <details className="mb-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">Terms & Conditions</summary>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t pt-2">{program.terms}</p>
            </details>
          )}

          <Button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 py-3 text-base font-bold gap-2 shadow"
          >
            {joinMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Star className="w-5 h-5" />
                Apply to Become an Affiliate
                <ArrowRight className="w-4 h-4 ml-auto" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">Free to join · You must be logged in to apply</p>
        </Card>

      </div>
    </div>
  );
}
