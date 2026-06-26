import { useGetAdminStats } from "@workspace/api-client-react";
import { getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, FileText, MessageSquare, TrendingUp, UserPlus, Settings, Key, CreditCard, Sliders, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "Active Users", value: stats?.activeUsers, icon: Users, color: "text-green-600" },
    { label: "Total Content", value: stats?.totalContent, icon: FileText, color: "text-purple-600" },
    { label: "This Week Content", value: stats?.contentThisWeek, icon: TrendingUp, color: "text-orange-600" },
    { label: "New Users (7d)", value: stats?.newUsersThisWeek, icon: UserPlus, color: "text-pink-600" },
    { label: "Open Chats", value: stats?.openConversations, icon: MessageSquare, color: "text-red-600" },
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Manage Users", icon: Users, description: "View, edit, activate/deactivate users" },
    { href: "/admin/prompts", label: "Prompt Library", icon: BookOpen, description: "Manage AI writing style prompts" },
    { href: "/admin/api-keys", label: "API Keys", icon: Key, description: "Claude, OpenAI, and other service keys" },
    { href: "/admin/payments", label: "Payment Gateways", icon: CreditCard, description: "Stripe, PayPal, and other gateways" },
    { href: "/admin/features", label: "Feature Flags", icon: Sliders, description: "Enable/disable platform features" },
    { href: "/admin/settings", label: "Platform Settings", icon: Settings, description: "Links, banners, and global settings" },
    { href: "/admin/content", label: "All Content", icon: FileText, description: "Browse all user-generated content" },
    { href: "/admin/chat", label: "Support Chat", icon: MessageSquare, description: "Respond to user support requests" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4 border">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${card.color}`} />
                    <p className="text-xs text-slate-500">{card.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{card.value ?? 0}</p>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card
                data-testid={`admin-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="p-5 border hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{link.label}</h3>
                </div>
                <p className="text-xs text-slate-500">{link.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
