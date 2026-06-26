import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard, Users, BookOpen, Key, CreditCard, Sliders, Settings, MessageSquare, FileText, LogOut, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "All Content", icon: FileText },
  { href: "/admin/prompts", label: "Prompt Library", icon: BookOpen },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/features", label: "Feature Flags", icon: Sliders },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/chat", label: "Support Chat", icon: MessageSquare },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b border-slate-800">
          <Link href="/admin" className="text-white font-bold text-base">
            ViralCraft <span className="text-purple-400">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs px-3 py-2 w-full rounded-md hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to App
            </button>
          </Link>
          <div className="px-3 py-1">
            <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
