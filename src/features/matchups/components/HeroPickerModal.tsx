"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { HeroRecord } from "@/features/heroes";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { MATCHUP_LANES, type MatchupLane } from "../types/matchup-hub.types";
import { cn } from "@/lib/cn";

const ROLES = [
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
] as const;

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  heroes: HeroRecord[];
  defaultLane?: MatchupLane | "ALL";
  disabledHeroNames?: string[];
  onSelect: (hero: HeroRecord) => void;
  onClose: () => void;
};

export function HeroPickerModal({
  open,
  title,
  subtitle,
  heroes,
  defaultLane = "ALL",
  disabledHeroNames = [],
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [laneFilter, setLaneFilter] = useState<string>(defaultLane);

  useEffect(() => {
    if (open) {
      setSearch("");
      setRoleFilter("ALL");
      setLaneFilter(defaultLane);
    }
  }, [open, defaultLane]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const disabledSet = useMemo(
    () => new Set(disabledHeroNames.map((n) => n.toLowerCase())),
    [disabledHeroNames],
  );

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return heroes.filter((hero) => {
      const roles = HERO_ROLE_MAP[hero.metadata.slug] ?? [];
      const lanes = HERO_LANE_MAP[hero.metadata.slug] ?? [];

      if (query && !hero.metadata.name.toLowerCase().includes(query)) {
        return false;
      }
      if (roleFilter !== "ALL" && !roles.includes(roleFilter)) {
        return false;
      }
      if (laneFilter !== "ALL" && !lanes.includes(laneFilter)) {
        return false;
      }
      return true;
    });
  }, [heroes, search, roleFilter, laneFilter]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
        <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#22D3EE]/35 bg-[#101830] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#22D3EE]/25 p-4 sm:p-5">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemilih hero"
            className="rounded-lg border border-[#22D3EE]/35 p-1.5 text-slate-400 transition hover:border-[#F5B83D]/65 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 border-b border-[#22D3EE]/25 bg-[#0A0E1A] p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#22D3EE]"
              aria-hidden="true"
            />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama hero (mis. Fanny, Khufra, Aamon)..."
              className="w-full rounded-xl border border-[#22D3EE]/35 bg-[#101830] py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-[#F5B83D]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Lane:
            </span>
            <button
              type="button"
              onClick={() => setLaneFilter("ALL")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                laneFilter === "ALL"
                  ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
                  : "border-[#22D3EE]/25 bg-[#101830] text-slate-400 hover:text-slate-200",
              )}
            >
              Semua Lane
            </button>
            {MATCHUP_LANES.map((lane) => (
              <button
                key={lane}
                type="button"
                onClick={() => setLaneFilter(lane)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  laneFilter === lane
                    ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
                    : "border-[#22D3EE]/25 bg-[#101830] text-slate-400 hover:text-slate-200",
                )}
              >
                {lane}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Role:
            </span>
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                roleFilter === "ALL"
                  ? "border-sky-400/70 bg-sky-500/15 text-sky-200"
                  : "border-slate-700 bg-[#0B0F17] text-slate-400 hover:text-slate-200",
              )}
            >
              Semua Role
            </button>
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  roleFilter === role
                    ? "border-sky-400/70 bg-sky-500/15 text-sky-200"
                    : "border-slate-700 bg-[#0B0F17] text-slate-400 hover:text-slate-200",
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-[11px] text-slate-500">
            Menampilkan {filteredHeroes.length} dari {heroes.length} hero
          </p>

          {filteredHeroes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-sm font-medium text-slate-300">
                Tidak ada hero yang cocok dengan filter saat ini.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setLaneFilter("ALL");
                }}
                className="mt-3 rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {filteredHeroes.map((hero) => {
                const isDisabled = disabledSet.has(
                  hero.metadata.name.toLowerCase(),
                );
                const roles = HERO_ROLE_MAP[hero.metadata.slug] ?? [];
                const lanes = HERO_LANE_MAP[hero.metadata.slug] ?? [];

                return (
                  <button
                    key={hero.entityId}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onSelect(hero);
                      onClose();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition",
                      isDisabled
                        ? "cursor-not-allowed border-slate-800 bg-[#101830]/70 opacity-45"
                        : "border-[#22D3EE]/25 bg-[#0F1420] hover:border-amber-400/70 hover:bg-amber-500/5",
                    )}
                  >
                    <HeroPortrait
                      slug={hero.metadata.slug}
                      name={hero.metadata.name}
                      className="h-11 w-10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {hero.metadata.name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {roles.join("/") || "Role?"}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {isDisabled
                          ? "Sudah dipilih"
                          : lanes.join("/") || "Lane?"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
