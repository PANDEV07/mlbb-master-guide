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
    <header className="sticky top-0 z-30 border-b border-[#1E2A33] bg-[#090D10]/85 backdrop-blur-xl">
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E2A33] bg-[#10161B] text-slate-300 transition-colors hover:border-emerald-400/40 hover:text-white lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-extrabold tracking-tight text-slate-950 shadow-md shadow-emerald-950/60 transition-transform group-hover:scale-105">
              MG
            </span>
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-white">
                MLBB Master
              </span>
              <span className="hidden text-[10px] font-medium text-emerald-300/80 sm:block">
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
          {topLinks.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                    : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white",
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
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all",
              pathname === "/search"
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                : "border-[#1E2A33] bg-[#10161B] text-slate-300 hover:border-emerald-400/40 hover:text-white",
            )}
          >
            <Search
              className="h-3.5 w-3.5 text-emerald-400"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Cari Hero &amp; Item</span>
            <span className="sm:hidden">Cari</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
