import React from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { LayoutDashboard, PenTool, Video, Image as ImageIcon, FileText, History, MessageSquare, Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
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

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/create", label: "Create Content", icon: PenTool },
    { href: "/video-model", label: "Video Modeler", icon: Video },
    { href: "/thumbnails", label: "Thumbnails", icon: ImageIcon },
    { href: "/pdfs", label: "PDF Studio", icon: FileText },
    { href: "/history", label: "History", icon: History },
    { href: "/chat", label: "Support Chat", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            ViralCraft Studio
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full justify-start text-slate-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
