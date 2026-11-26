"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  GitCompare,
  GraduationCap,
  History,
  Layers,
  Package,
  Search,
  Shield,
  Swords,
  Trophy,
} from "lucide-react";
import {
  NAV_GROUPS,
  NAV_ITEMS,
  type NavItemConfig,
} from "@/components/navigation/navConfig";
import { cn } from "@/lib/cn";

const ICONS: Record<NavItemConfig["iconName"], typeof Compass> = {
  compass: Compass,
  shield: Shield,
  package: Package,
  layers: Layers,
  swords: Swords,
  "git-compare": GitCompare,
  trophy: Trophy,
  "graduation-cap": GraduationCap,
  history: History,
  search: Search,
};

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi Mobile" className="flex flex-col gap-5 px-4 py-5 pb-24">
      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter((item) => item.group === group.id);
        return (
          <div key={group.id}>
            <div className="font-display mb-2 border-l-2 border-[#F5B83D] pl-2.5 text-xs tracking-wider text-[#F5B83D]">
              {group.label}
            </div>
            <ul className="space-y-1.5">
              {items.map((item) => {
                const Icon = ICONS[item.iconName];
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 border px-3 py-2.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
                          : "border-[#22D3EE]/20 bg-[#101830] text-[#E6EAF5] hover:border-[#F5B83D]/55 hover:text-[#F5B83D]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[#0A0E1A]" : "text-[#22D3EE]",
                        )}
                        aria-hidden="true"
                      />
                      <span className="font-display text-base">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
