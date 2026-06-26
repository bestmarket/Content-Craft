import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, PenTool, Video, Image as ImageIcon, FileText,
  History, MessageSquare, Settings, LogOut, Globe, Film,
  Lightbulb, Menu, ChevronRight, ChevronDown, Crown, Zap,
  TrendingUp, ShoppingBag, DollarSign, Sparkles, Package, Gift, Bot,
  Mic, AudioWaveform, Clapperboard, Rocket, Code2, Store,
  PackagePlus, Layers, Wand2, BarChart2, Pin, Star, Coins, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { useToolFlags } from "@/hooks/use-tool-flags";

interface AppLayoutProps {
  children: React.ReactNode;
}

// ─── Category color tokens (intentional per-category accent colors) ───────────
const CAT_COLORS: Record<string, { dot: string; text: string; hoverBg: string; activeBg: string }> = {
  home:        { dot: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400",    hoverBg: "hover:bg-accent",        activeBg: "bg-accent"        },
  products:    { dot: "bg-blue-500",    text: "text-blue-600 dark:text-blue-400",      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-950/40",    activeBg: "bg-blue-50 dark:bg-blue-950/40"    },
  content:     { dot: "bg-violet-500",  text: "text-violet-600 dark:text-violet-400",  hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/40",  activeBg: "bg-violet-50 dark:bg-violet-950/40"  },
  video:       { dot: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400",      hoverBg: "hover:bg-rose-50 dark:hover:bg-rose-950/40",    activeBg: "bg-rose-50 dark:bg-rose-950/40"    },
  automation:  { dot: "bg-orange-500",  text: "text-orange-600 dark:text-orange-400",  hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-950/40",  activeBg: "bg-orange-50 dark:bg-orange-950/40"  },
  dev:         { dot: "bg-cyan-500",    text: "text-cyan-600 dark:text-cyan-400",      hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-950/40",    activeBg: "bg-cyan-50 dark:bg-cyan-950/40"    },
  marketplace: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400",hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/40",activeBg: "bg-emerald-50 dark:bg-emerald-950/40" },
  growth:      { dot: "bg-green-500",   text: "text-green-600 dark:text-green-400",    hoverBg: "hover:bg-green-50 dark:hover:bg-green-950/40",  activeBg: "bg-green-50 dark:bg-green-950/40"  },
  account:     { dot: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400",    hoverBg: "hover:bg-accent",        activeBg: "bg-accent"        },
  favorites:   { dot: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400",    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/40",  activeBg: "bg-amber-50 dark:bg-amber-950/40"  },
};

const COLLAPSED_KEY = "sidebar_collapsed_v1";
const FAVORITES_KEY = "sidebar_favorites_v1";

const NAV_GROUPS = [
  {
    label: "Home", cat: "home",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tool: null },
    ],
  },
  {
    label: "Products", cat: "products",
    items: [
      { href: "/product-studio",  label: "🚀 Product Studio",  icon: Sparkles,    tool: "product_generator" },
      { href: "/create-product", label: "Create Product",     icon: PackagePlus, tool: "product_generator" },
      { href: "/quick-launch",   label: "Quick Launch",       icon: Rocket,      tool: "product_generator" },
      { href: "/prompt-studio",  label: "Prompt Studio",      icon: Lightbulb,   tool: "prompt_generator"  },
      { href: "/courses",        label: "My Courses",          icon: GraduationCap, tool: "course_generator"  },
      { href: "/courses/create", label: "Course Builder",     icon: BookOpen,    tool: "course_generator"  },
      { href: "/my-store",       label: "My Store",           icon: Store,       tool: "store"             },
      { href: "/edit-landing",   label: "Edit Landing Pages", icon: Layers,      tool: "product_generator" },
    ],
  },
  {
    label: "AI Content Tools", cat: "content",
    items: [
      { href: "/create",           label: "Viral Content",    icon: PenTool,   tool: "content_generator" },
      { href: "/scryvox",          label: "Scryvox Writer",   icon: Wand2,     tool: "content_generator" },
      { href: "/scryvox/products", label: "Product Pipeline", icon: Package,   tool: "product_generator" },
      { href: "/thumbnails",       label: "Thumbnails",       icon: ImageIcon, tool: "thumbnails"        },
      { href: "/pdfs",             label: "PDF Studio",       icon: FileText,  tool: "pdf_studio"        },
      { href: "/scripts",          label: "Script Studio",    icon: Film,      tool: "scripts"           },
      { href: "/landing-page",     label: "Landing Page",     icon: Globe,     tool: "landing_page"      },
    ],
  },
  {
    label: "Video & Voice", cat: "video",
    items: [
      { href: "/video-agent",     label: "Video Marketing Agent", icon: Clapperboard,  tool: "video_agent"   },
      { href: "/video-model",     label: "Video Modeler",          icon: Video,         tool: "video_modeler" },
      { href: "/video-generator", label: "Video Generator",        icon: Film,          tool: "video_modeler" },
      { href: "/voice",           label: "Generate Voice",         icon: Mic,           tool: "voice"         },
      { href: "/voice/clones",    label: "My Voice Clones",        icon: AudioWaveform, tool: "voice"         },
    ],
  },
  {
    label: "Automation", cat: "automation",
    items: [
      { href: "/automations",             label: "My Automations",  icon: Zap,         tool: "automation" },
      { href: "/automations/builder",     label: "Build a Tool",    icon: Bot,         tool: "automation" },
      { href: "/automations/marketplace", label: "Tool Marketplace",icon: ShoppingBag, tool: "automation" },
      { href: "/automations/runs",        label: "Run History",     icon: History,     tool: "automation" },
    ],
  },
  {
    label: "Dev Studio", cat: "dev",
    items: [
      { href: "/workspace",    label: "AI Code Builder", icon: Code2,  tool: "dev_studio" },
      { href: "/saas-builder", label: "SaaS Builder",    icon: Rocket, tool: "dev_studio" },
      { href: "/my-agents",    label: "My AI Agents",    icon: Bot,    tool: "dev_studio" },
    ],
  },
  {
    label: "Marketplace", cat: "marketplace",
    items: [
      { href: "/marketplace",            label: "Global Marketplace",  icon: Globe,      tool: "marketplace" },
      { href: "/my-purchases",           label: "My Purchases",        icon: ShoppingBag,tool: "marketplace" },
      { href: "/automations/generators", label: "Template Generators", icon: Sparkles,   tool: "automation"  },
    ],
  },
  {
    label: "Growth & Earnings", cat: "growth",
    items: [
      { href: "/earnings",  label: "Earnings",       icon: DollarSign, tool: "affiliate" },
      { href: "/trending",  label: "Trending Ideas", icon: TrendingUp, tool: "trending"  },
      { href: "/affiliate", label: "Affiliate",      icon: Gift,       tool: "affiliate" },
    ],
  },
  {
    label: "Account", cat: "account",
    items: [
      { href: "/history",  label: "History",      icon: BarChart2,     tool: null },
      { href: "/chat",     label: "Support Chat", icon: MessageSquare, tool: null },
      { href: "/settings", label: "Settings",     icon: Settings,      tool: null },
    ],
  },
];

type NavItem = { href: string; label: string; icon: React.ComponentType<any>; cat: string };
const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap(g => g.items.map(item => ({ ...item, cat: g.cat })));

function loadLS<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function CreditsWidget({ onNavigate }: { onNavigate: () => void }) {
  const { data } = useQuery({
    queryKey: ["credits-balance"],
    queryFn: () => api.get("/credits/balance").then(r => r.data),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const credits = data?.credits ?? 0;
  const unlimited = data?.unlimited ?? false;
  const dailyMax = data?.tier === "pro" ? 200 : 20;
  const pct = unlimited ? 100 : Math.min(100, (credits / dailyMax) * 100);
  const low = !unlimited && credits < 5;

  return (
    <div className="px-2.5 pb-2">
      <Link href="/credits" onClick={onNavigate}>
        <div className={`rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity border ${
          low
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            : "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800"
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Coins className={`w-3.5 h-3.5 ${low ? "text-red-500" : "text-violet-600 dark:text-violet-400"}`} />
              <span className={`text-xs font-bold ${low ? "text-red-700 dark:text-red-400" : "text-violet-700 dark:text-violet-300"}`}>
                AI Credits
              </span>
            </div>
            <span className={`text-xs font-bold ${low ? "text-red-600" : "text-violet-700 dark:text-violet-300"}`}>
              {unlimited ? "∞" : credits}
            </span>
          </div>
          {!unlimited && (
            <div className="w-full h-1.5 rounded-full bg-violet-200 dark:bg-violet-900 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${low ? "bg-red-500" : "bg-violet-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
          {low && (
            <p className="text-xs text-red-500 mt-1 font-medium">Low — tap to buy more</p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const { flags: toolFlags } = useToolFlags();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => loadLS(COLLAPSED_KEY, {}));
  const [favorites, setFavorites] = useState<string[]>(() => loadLS(FAVORITES_KEY, []));

  // Auto-expand the active category
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find(g =>
      g.items.some(item =>
        location === item.href ||
        (item.href !== "/dashboard" && location.startsWith(item.href + "/"))
      )
    );
    if (activeGroup && collapsed[activeGroup.label]) {
      setCollapsed(prev => {
        const next = { ...prev, [activeGroup.label]: false };
        saveLS(COLLAPSED_KEY, next);
        return next;
      });
    }
  }, [location]);

  const toggleCollapsed = useCallback((label: string) => {
    setCollapsed(prev => {
      const next = { ...prev, [label]: !prev[label] };
      saveLS(COLLAPSED_KEY, next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href];
      saveLS(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      },
    });
  };

  // ── NavLink ───────────────────────────────────────────────────────────────
  const NavLink = ({ href, label, icon: Icon, showPin = true }: { href: string; label: string; icon: any; showPin?: boolean }) => {
    const isActive = location === href || (href !== "/dashboard" && location.startsWith(href + "/"));
    const isPinned = favorites.includes(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm group ${
          isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
            : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"}`} />
        <span className="truncate flex-1">{label}</span>
        {showPin && (
          <button
            onClick={(e) => toggleFavorite(href, e)}
            title={isPinned ? "Unpin from Favorites" : "Pin to Favorites"}
            className={`flex-shrink-0 p-0.5 rounded transition-all ${
              isActive
                ? isPinned ? "text-yellow-300 opacity-100" : "text-primary-foreground/40 opacity-0 group-hover:opacity-100"
                : isPinned ? "text-amber-400 opacity-100" : "text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-amber-400"
            }`}
          >
            {isPinned ? <Star className="w-3 h-3 fill-current" /> : <Pin className="w-3 h-3" />}
          </button>
        )}
      </Link>
    );
  };

  const favoriteItems = favorites.map(href => ALL_ITEMS.find(i => i.href === href)).filter(Boolean) as NavItem[];

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Selo<span className="text-primary">vox</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">

        {/* ── Favorites ── */}
        {favoriteItems.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 mb-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex-1">Favorites</p>
              <span className="text-xs text-amber-400/70 font-medium">{favoriteItems.length}</span>
            </div>
            <div className="space-y-0.5">
              {favoriteItems.map(item => (
                <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} showPin />
              ))}
            </div>
            <div className="mt-3 mx-3 border-t border-border" />
          </div>
        )}

        {/* ── Regular groups ── */}
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(item =>
            item.tool === null || toolFlags[item.tool] !== false
          );
          if (visibleItems.length === 0) return null;
          const colors = CAT_COLORS[group.cat] ?? CAT_COLORS.home;
          const isCollapsed = !!collapsed[group.label];
          const collapsible = visibleItems.length > 1;
          const hasActive = visibleItems.some(item =>
            location === item.href ||
            (item.href !== "/dashboard" && location.startsWith(item.href + "/"))
          );

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => collapsible && toggleCollapsed(group.label)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all mb-0.5 ${
                  collapsible ? `cursor-pointer ${colors.hoverBg}` : "cursor-default"
                } ${hasActive && isCollapsed ? colors.activeBg : ""}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                  hasActive ? colors.dot + " scale-125" : colors.dot + " opacity-50"
                }`} />
                <p className={`text-xs font-bold uppercase tracking-wider flex-1 text-left transition-colors ${
                  hasActive ? colors.text : "text-muted-foreground"
                }`}>
                  {group.label}
                </p>
                {isCollapsed && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${colors.activeBg} ${colors.text} opacity-80`}>
                    {visibleItems.length}
                  </span>
                )}
                {collapsible && (
                  <span className="text-muted-foreground/50 flex-shrink-0">
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                )}
              </button>

              <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{ maxHeight: isCollapsed ? 0 : `${visibleItems.length * 44}px`, opacity: isCollapsed ? 0 : 1 }}
              >
                <div className="space-y-0.5 pb-1">
                  {visibleItems.map((item) => (
                    <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} showPin />
                  ))}
                </div>
              </div>

              {isCollapsed && hasActive && (() => {
                const activeItem = visibleItems.find(item =>
                  location === item.href ||
                  (item.href !== "/dashboard" && location.startsWith(item.href + "/"))
                );
                return activeItem ? (
                  <div
                    onClick={() => toggleCollapsed(group.label)}
                    className={`flex items-center gap-2 mx-1 px-3 py-1.5 rounded-lg cursor-pointer ${colors.activeBg}`}
                  >
                    <activeItem.icon className={`w-3.5 h-3.5 flex-shrink-0 ${colors.text}`} />
                    <span className={`text-xs font-semibold truncate ${colors.text}`}>{activeItem.label}</span>
                  </div>
                ) : null;
              })()}
            </div>
          );
        })}

        {/* Empty favorites hint */}
        {favoriteItems.length === 0 && (
          <p className="text-center text-xs text-muted-foreground/50 py-2 px-3 mt-1">
            Hover any link and click <Pin className="w-3 h-3 inline mb-0.5" /> to pin it
          </p>
        )}
      </nav>

      {/* Credits widget */}
      <CreditsWidget onNavigate={() => setMobileOpen(false)} />

      {/* Upgrade CTA */}
      {(user as any)?.subscriptionTier !== "pro" && (user as any)?.subscriptionTier !== "enterprise" && (
        <div className="px-2.5 pb-2">
          <Link href="/pricing" onClick={() => setMobileOpen(false)}>
            <div className="bg-gradient-to-r from-primary to-blue-700 rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-2 mb-0.5">
                <Crown className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
                <span className="text-white text-xs font-bold">Upgrade to Pro</span>
              </div>
              <p className="text-blue-100 text-xs">Unlimited products, stores &amp; campaigns</p>
            </div>
          </Link>
        </div>
      )}

      {/* User + logout */}
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-2.5 px-1">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold">
              {(user?.name ?? (user as any)?.email ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? (user as any)?.email}</p>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                (user as any)?.subscriptionTier === "enterprise"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : (user as any)?.subscriptionTier === "pro"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {(user as any)?.subscriptionTier === "enterprise" ? "Enterprise"
                  : (user as any)?.subscriptionTier === "pro" ? "⭐ Pro"
                  : "Free"}
              </span>
              {((user as any)?.currentStreak ?? 0) > 0 && (
                <span className="text-xs font-bold text-orange-500">🔥 {(user as any).currentStreak}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="flex-1 justify-start text-muted-foreground text-xs h-8 px-2.5"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
          <ThemeToggle size="sm" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 z-50 shadow-xl transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 bg-card border-b flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-base font-bold tracking-tight text-foreground">
            Selo<span className="text-primary">vox</span>
          </span>
          <ThemeToggle size="sm" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
