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
    <nav aria-label="Navigasi Mobile" className="flex flex-col gap-5 px-4 py-5">
      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter((item) => item.group === group.id);
        return (
          <div key={group.id}>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </div>
            <ul className="space-y-1">
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
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                          : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-emerald-300" : "text-slate-500",
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
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
