import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface Props {
  onSuccess?: () => void;
}

export default function GoogleSignInButton({ onSuccess }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: googleClientId, isLoading } = useQuery<string | null>({
    queryKey: ["google-client-id"],
    queryFn: () =>
      fetch("/api/auth/google-config")
        .then((r) => r.json())
        .then((d) => (d.clientId as string | null) ?? null),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading || !googleClientId) return null;

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;
    try {
      const { data } = await apiClient.post("/auth/google", { credential: response.credential });
      localStorage.setItem("token", (data as any).token);
      onSuccess?.();
      if ((data as any).user?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      toast({
        title: err?.response?.data?.error ?? "Google sign-in failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast({ title: "Google sign-in failed", variant: "destructive" })}
        theme="filled_black"
        shape="pill"
        size="large"
        width="320"
      />
    </div>
  );
}
