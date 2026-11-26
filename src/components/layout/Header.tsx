"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/navigation/navConfig";
import { cn } from "@/lib/cn";

interface HeaderProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const TOP_NAV_HREFS = [
  "/heroes",
  "/items",
  "/builds",
  "/draft",
  "/matchups",
  "/counters",
  "/academy",
  "/patches",
] as const;

export function Header({ mobileMenuOpen, onToggleMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const topLinks = TOP_NAV_HREFS.map((href) =>
    NAV_ITEMS.find((item) => item.href === href),
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <header className="sticky top-0 z-30 border-b border-[#F5B83D]/35 bg-[#0A0E1A]/94 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={
              mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
            }
            className="inline-flex h-10 w-10 items-center justify-center border border-[#22D3EE]/35 bg-[#101830] text-[#22D3EE] transition-colors hover:border-[#F5B83D] hover:text-[#F5B83D] lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none"
          >
            <span className="mlbb-btn-chamfer font-display flex h-9 w-9 items-center justify-center bg-[#F5B83D] text-sm font-extrabold text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.45)] transition-transform group-hover:scale-105">
              MG
            </span>
            <div className="leading-none">
              <span className="font-display block text-xl tracking-wider text-[#F5B83D] sm:text-2xl">
                MLBB MASTER
              </span>
              <span className="hidden text-[10px] font-medium tracking-widest text-[#9AA6C4] uppercase sm:block">
                Panduan Strategi
              </span>
            </div>
          </Link>
        </div>

        {/* Top Horizontal Navigation (Desktop) */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden items-center gap-1 lg:flex"
        >
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "font-display px-3 py-2 text-[15px] transition-colors",
              pathname === "/"
                ? "border-b-2 border-[#22D3EE] text-[#22D3EE]"
                : "text-[#E6EAF5] hover:text-[#F5B83D]",
            )}
          >
            Tier List
          </Link>
          {topLinks.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "font-display px-3 py-2 text-[15px] transition-colors",
                  isActive
                    ? "border-b-2 border-[#22D3EE] text-[#22D3EE]"
                    : "text-[#E6EAF5] hover:text-[#F5B83D]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Quick Search Action */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/search"
            className={cn(
              "inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-medium transition-all",
              pathname === "/search"
                ? "border-[#F5B83D] bg-[#F5B83D] font-bold text-[#0A0E1A] shadow-[0_0_14px_rgba(245,184,61,0.45)]"
                : "border-[#22D3EE]/35 bg-[#101830] text-[#9AA6C4] hover:border-[#F5B83D] hover:text-[#E6EAF5]",
            )}
          >
            <Search
              className={cn(
                "h-3.5 w-3.5",
                pathname === "/search" ? "text-[#0A0E1A]" : "text-[#22D3EE]",
              )}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Cari hero, build, item…</span>
            <span className="sm:hidden">Cari</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
