import { useGetAdminStats } from "@workspace/api-client-react";
import { getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Users, FileText, MessageSquare, TrendingUp, UserPlus, Settings,
  Key, CreditCard, Sliders, BookOpen, Globe, Copy, Check, PackageCheck,
  AlertTriangle, XCircle, CheckCircle2, ArrowRight, Cpu
} from "lucide-react";
import { useState } from "react";

function AIStatusBanner() {
  const { data: keysData } = useQuery({
    queryKey: ["admin-api-keys-status"],
    queryFn: () => apiClient.get("/admin/api-keys").then(r => r.data as any[]),
    staleTime: 30_000,
  });

  const { data: scryvoxData } = useQuery({
    queryKey: ["scryvox-settings-status"],
    queryFn: () => apiClient.get("/api/scryvox/settings").then(r => r.data as any),
    staleTime: 30_000,
  });

  if (!keysData || !scryvoxData) return null;

  const AI_PROVIDERS = ["gemini", "groq", "openai", "claude", "anthropic"];
  const keysArray = Array.isArray(keysData) ? keysData : [];
  const hasActiveKey = keysArray.some(
    (k: any) => AI_PROVIDERS.includes(k.provider) && k.isActive
  );
  const scryvoxMode = scryvoxData?.settings?.scryvox_mode ?? "studio_only";
  const scryvoxEnabled = scryvoxData?.settings?.scryvox_enabled !== "false";
  const scryvoxAllSystem = scryvoxEnabled && scryvoxMode === "all_system";

  if (hasActiveKey) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">AI engine active</span> — external API keys are configured and ready.
        </p>
      </div>
    );
  }

  if (scryvoxAllSystem) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
        <Cpu className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800">Running on built-in Scryvox engine</p>
          <p className="text-xs text-blue-600 mt-0.5">
            No external AI keys are set — all content generation uses Scryvox. Add API keys for higher-quality AI output.
          </p>
        </div>
        <Link href="/admin/api-keys">
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap">
            Add Keys <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">No AI engine configured — AI features will fail</p>
        <p className="text-xs text-red-600 mt-0.5">
          Add at least one API key, or enable Scryvox "All System" mode to use the built-in engine.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/admin/api-keys">
          <span className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 whitespace-nowrap">
            <Key className="w-3 h-3" /> Add Keys
          </span>
        </Link>
        <Link href="/admin/scryvox">
          <span className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 whitespace-nowrap">
            <Cpu className="w-3 h-3" /> Scryvox
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("admin@viralcraft.studio / Admin@ViralCraft2025");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "Active Users", value: stats?.activeUsers, icon: Users, color: "text-green-600" },
    { label: "Total Content", value: stats?.totalContent, icon: FileText, color: "text-primary" },
    { label: "This Week Content", value: stats?.contentThisWeek, icon: TrendingUp, color: "text-orange-600" },
    { label: "New Users (7d)", value: stats?.newUsersThisWeek, icon: UserPlus, color: "text-pink-600" },
    { label: "Open Chats", value: stats?.openConversations, icon: MessageSquare, color: "text-red-600" },
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Manage Users", icon: Users, description: "View, edit, activate/deactivate users", color: "text-blue-600" },
    { href: "/admin/prompts", label: "Prompt Library", icon: BookOpen, description: "Million-dollar AI prompts for all 6 workflows", color: "text-primary" },
    { href: "/admin/pages", label: "Page Manager", icon: Globe, description: "Edit About, Privacy Policy, Terms, Refund Policy", color: "text-emerald-600" },
    { href: "/admin/api-keys", label: "API Keys", icon: Key, description: "Groq, Claude, OpenAI, and other service keys", color: "text-amber-600" },
    { href: "/admin/payments", label: "Payment Gateways", icon: CreditCard, description: "Stripe, Paystack, and other gateways", color: "text-green-600" },
    { href: "/admin/features", label: "Feature Flags", icon: Sliders, description: "Enable/disable platform features per tier", color: "text-muted-foreground" },
    { href: "/admin/settings", label: "Platform Settings", icon: Settings, description: "Links, banners, affiliate links, and global settings", color: "text-orange-600" },
    { href: "/admin/products", label: "Product Approvals", icon: PackageCheck, description: "Review, approve, reject, and feature seller products", color: "text-green-600" },
    { href: "/admin/content", label: "All Content", icon: FileText, description: "Browse and moderate all user-generated content", color: "text-red-600" },
    { href: "/admin/chat", label: "Support Chat", icon: MessageSquare, description: "Respond to user support requests in real-time", color: "text-pink-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and management</p>
      </div>

      <AIStatusBanner />

      {/* Admin Credentials Card */}
      <Card className="p-4 border border-amber-200 bg-amber-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Default Admin Credentials</p>
            <p className="text-sm text-foreground">
              <span className="font-mono bg-card border border-amber-200 px-2 py-0.5 rounded text-xs mr-2">admin@viralcraft.studio</span>
              <span className="font-mono bg-card border border-amber-200 px-2 py-0.5 rounded text-xs">Admin@ViralCraft2025</span>
            </p>
            <p className="text-xs text-amber-600 mt-1">Change this password immediately in Users → Edit after first login.</p>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 flex-shrink-0">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4 border">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <Icon className={`w-5 h-5 ${card.color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{card.value ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Management Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminLinks.map(({ href, label, icon: Icon, description, color }) => (
            <Link key={href} href={href}>
              <div className="bg-card border border rounded-xl p-4 hover:border hover:shadow-sm transition-all cursor-pointer group">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="font-semibold text-foreground text-sm group-hover:text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
