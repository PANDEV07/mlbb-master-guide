"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { HeroRecord } from "@/features/heroes";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { Surface } from "@/components/ui/Surface";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { cn } from "@/lib/cn";

interface Props {
  heroes: HeroRecord[];
}

const roles = [
  "All",
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
];
const lanes = ["All", "EXP Lane", "Jungle", "Mid Lane", "Gold Lane", "Roam"];

export function BuildHeroSelection({ heroes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedLane, setSelectedLane] = useState("All");

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return heroes.filter((hero) => {
      const matchesName = hero.metadata.name.toLowerCase().includes(query);
      const matchesRole =
        selectedRole === "All" ||
        (HERO_ROLE_MAP[hero.metadata.slug] ?? []).includes(selectedRole);
      const matchesLane =
        selectedLane === "All" ||
        (HERO_LANE_MAP[hero.metadata.slug] ?? []).includes(selectedLane);

      return matchesName && matchesRole && matchesLane;
    });
  }, [heroes, search, selectedRole, selectedLane]);

  const filterClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
      active
        ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
        : "border-[#22D3EE]/25 bg-[#0A0E1A] text-slate-400 hover:border-[#22D3EE]/45 hover:text-slate-200",
    );

  return (
    <div className="space-y-5">
      <Surface className="space-y-4 p-4 sm:p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#22D3EE]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama hero (filter langsung saat mengetik)..."
            className="w-full rounded-xl border border-[#22D3EE]/35 bg-[#0A0E1A] py-3 pr-10 pl-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-[#F5B83D]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Hapus pencarian"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Role:
            </span>
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                aria-pressed={selectedRole === role}
                className={filterClass(selectedRole === role)}
              >
                {role === "All" ? "Semua" : role}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Lane:
            </span>
            {lanes.map((lane) => (
              <button
                key={lane}
                type="button"
                onClick={() => setSelectedLane(lane)}
                aria-pressed={selectedLane === lane}
                className={filterClass(selectedLane === lane)}
              >
                {lane === "All" ? "Semua" : lane}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#22D3EE]/25 pt-3 text-xs text-slate-400">
          <span>
            Menampilkan{" "}
            <strong className="text-white">{filteredHeroes.length}</strong> dari{" "}
            {heroes.length} hero
          </span>
          {(search || selectedRole !== "All" || selectedLane !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedRole("All");
                setSelectedLane("All");
              }}
              className="font-semibold text-[#F5B83D] hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      </Surface>

      {filteredHeroes.length === 0 ? (
        <Surface className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-200">
            Hero tidak ditemukan
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ubah kata kunci pencarian atau reset filter role/lane.
          </p>
        </Surface>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredHeroes.map((hero) => {
            const heroRoles = HERO_ROLE_MAP[hero.metadata.slug] ?? [];
            const heroLanes = HERO_LANE_MAP[hero.metadata.slug] ?? [];
            return (
              <Link
                key={hero.entityId}
                href={`/builds/${hero.metadata.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-[#22D3EE]/25 bg-[#101830]/90 p-3.5 text-center transition-all hover:-translate-y-0.5 hover:border-[#F5B83D]/65 hover:bg-[#15203E]"
              >
                <HeroPortrait
                  slug={hero.metadata.slug}
                  name={hero.metadata.name}
                  className="h-20 w-16"
                />
                <p className="mt-3 line-clamp-1 text-sm font-bold text-white group-hover:text-[#F5B83D]">
                  {hero.metadata.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-[#9AA6C4]">
                  {heroRoles.join(" / ") || "Hero"}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                  {heroLanes.join(" · ") || "Fleksibel"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
