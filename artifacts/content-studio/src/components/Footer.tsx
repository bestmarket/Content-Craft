import { Link } from "wouter";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">
              Selo<span className="text-sky-500">vox</span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center">
            {[
              { href: "/about", label: "About" },
              { href: "/promo", label: "How It Works" },
              { href: "/pricing", label: "Pricing" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms" },
              { href: "/refund-policy", label: "Refund Policy" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Selovox. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
