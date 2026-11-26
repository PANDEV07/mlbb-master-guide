"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, GitCompare, Layers, Shield, Swords } from "lucide-react";
import { Header } from "./Header";
import { SidebarNav } from "./SidebarNav";
import { Footer } from "./Footer";
import { cn } from "@/lib/cn";

interface AppShellProps {
  children: ReactNode;
}

const MOBILE_BOTTOM_NAV = [
  { href: "/", label: "Beranda", icon: Compass },
  { href: "/heroes", label: "Hero", icon: Shield },
  { href: "/counters", label: "Counter", icon: GitCompare },
  { href: "/matchups", label: "Matchup", icon: Swords },
  { href: "/builds", label: "Build", icon: Layers },
] as const;

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col text-[#E6EAF5]">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Drawer Mobile */}
      {mobileMenuOpen ? (
        <div
          id="mobile-navigation-drawer"
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-[#F5B83D]/35 bg-[#0A0E1A]/98 backdrop-blur-xl lg:hidden"
        >
          <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      ) : null}

      {/* Konten Utama Lebar & Fokus */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 pb-24 sm:px-6 sm:py-9 lg:px-8 lg:pb-12">
          {children}
        </main>
        <Footer />
      </div>

      {/* Bottom Navigation Mobile (Referensi Tier List Mobile) */}
      <nav
        aria-label="Navigasi Cepat Mobile"
        className="fixed right-0 bottom-0 left-0 z-30 grid grid-cols-5 border-t border-[#F5B83D]/45 bg-[#0D1328]/98 pb-1 backdrop-blur-md lg:hidden"
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-[#F5B83D]" : "text-[#9AA6C4]",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="font-display text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
