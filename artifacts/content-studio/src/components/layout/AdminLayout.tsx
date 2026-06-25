import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard, Users, BookOpen, Key, CreditCard, Sliders,
  Settings, MessageSquare, FileText, LogOut, ChevronLeft, Globe,
  Menu, X, BarChart2, Send, Share2, Bot, PackageCheck, Mail, DollarSign, AudioWaveform, Zap, Brain, Layers, Clapperboard, Cloud, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/broadcast", label: "Broadcast Email", icon: Send },
  { href: "/admin/affiliates", label: "Affiliates", icon: Share2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "All Content", icon: FileText },
  { href: "/admin/prompts", label: "Prompt Library", icon: BookOpen },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/features", label: "Feature Flags", icon: Sliders },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/chat", label: "Support Chat", icon: MessageSquare },
  { href: "/admin/pages", label: "Page Manager", icon: Globe },
  { href: "/admin/automations", label: "Automation Engine", icon: Bot },
  { href: "/admin/products", label: "Product Approvals", icon: PackageCheck },
  { href: "/admin/email-marketing", label: "Email Marketing", icon: Mail },
  { href: "/admin/revenue", label: "Revenue Sharing", icon: DollarSign },
  { href: "/admin/voices", label: "Voice Engine", icon: AudioWaveform },
  { href: "/admin/scryvox", label: "Scryvox Engine", icon: Brain },
  { href: "/admin/scryvox/knowledge", label: "Knowledge Base", icon: Brain },
  { href: "/admin/templates", label: "Template Marketplace", icon: PackageCheck },
  { href: "/admin/prompt-packages", label: "Prompt Marketplace", icon: Layers },
  { href: "/admin/saas", label: "SaaS Builder", icon: Zap },
  { href: "/admin/video-agent", label: "Video Agent", icon: Clapperboard },
  { href: "/admin/media", label: "Media Library", icon: Cloud },
  { href: "/admin/credits", label: "AI Credits", icon: Coins },
  { href: "/admin/tools", label: "Tool Manager", icon: Zap },
];

function NavLinks({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {adminNavItems.map((item) => {
        const isActive = item.exact ? location === item.href : location.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      },
    });
  };

  const SidebarFooter = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="p-3 border-t border-slate-800 space-y-2">
      <Link href="/dashboard" onClick={onNavigate}>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-white text-xs px-3 py-2 w-full rounded-md hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to App
        </button>
      </Link>
      <div className="px-3 py-1">
        <p className="text-xs font-medium text-muted-foreground/60 truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-white hover:bg-slate-800"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">

      {/* ── Desktop sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex-col hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b border-slate-800 gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-md flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <Link href="/admin" className="text-white font-bold text-base tracking-tight">
            Selo<span className="text-violet-400">vox</span> <span className="text-muted-foreground font-normal text-sm">Admin</span>
          </Link>
        </div>
        <NavLinks location={location} />
        <SidebarFooter />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 bg-slate-900 flex flex-col transform transition-transform duration-200 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          <Link href="/admin" className="text-white font-bold text-base tracking-tight" onClick={() => setDrawerOpen(false)}>
            Selo<span className="text-violet-400">vox</span>
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavLinks location={location} onNavigate={() => setDrawerOpen(false)} />
        <SidebarFooter onNavigate={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center px-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button onClick={() => setDrawerOpen(true)} className="text-muted-foreground/60 hover:text-white mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-bold text-sm tracking-tight">
            Selo<span className="text-violet-400">vox</span> <span className="text-muted-foreground font-normal">Admin</span>
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
