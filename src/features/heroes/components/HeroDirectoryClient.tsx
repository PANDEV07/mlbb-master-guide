"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { HeroRecord } from "../types/hero.types";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { HERO_ROLE_MAP } from "../data/hero-role-map";
import { HERO_LANE_MAP } from "../data/hero-lane-map";
import { HERO_SPECIALTY_MAP } from "../data/hero-specialty-map";
import { HeroPortrait } from "./HeroPortrait";
import capabilityIndex from "../data/hero-capability-index.json";
import { cn } from "@/lib/cn";

interface HeroDirectoryClientProps {
  heroes: HeroRecord[];
}

const ROLES = [
  "All",
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
] as const;

const LANES = [
  "All",
  "EXP Lane",
  "Jungle",
  "Mid Lane",
  "Gold Lane",
  "Roam",
] as const;

const SPECIALTIES = [
  "All",
  "Burst",
  "Damage",
  "Finisher",
  "Chase",
  "Crowd Control",
  "Regen",
  "Poke",
  "Charge",
  "Guard",
  "Control",
  "Initiator",
  "Magic Damage",
  "Support",
  "Push",
  "Mixed Damage",
] as const;

const MECHANIC_OPTIONS = [
  "All",
  "DAMAGE",
  "CROWD_CONTROL",
  "MOBILITY",
  "DEFENSE",
  "SUSTAIN",
  "BUFF_DEBUFF",
  "UTILITY",
  "SPECIAL",
] as const;

const MECHANIC_LABELS: Record<string, string> = {
  All: "Semua",
  DAMAGE: "Damage",
  CROWD_CONTROL: "Crowd Control",
  MOBILITY: "Mobilitas",
  DEFENSE: "Pertahanan",
  SUSTAIN: "Sustain",
  BUFF_DEBUFF: "Buff & Debuff",
  UTILITY: "Utilitas",
  SPECIAL: "Khusus",
};

export function HeroDirectoryClient({ heroes }: HeroDirectoryClientProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedLane, setSelectedLane] = useState("All");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedMechanic, setSelectedMechanic] = useState("All");
  const [selectedApiTag, setSelectedApiTag] = useState("All");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const apiTagOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(capabilityIndex.flatMap((hero) => hero.apiTags)),
      ).sort(),
    ],
    [],
  );

  const capabilityByLowerName = useMemo(
    () =>
      new Map(
        capabilityIndex.map((entry) => [entry.heroName.toLowerCase(), entry]),
      ),
    [],
  );

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return heroes.filter((hero) => {
      const slug = hero.metadata.slug;
      const matchesName = hero.metadata.name.toLowerCase().includes(query);
      const matchesRole =
        selectedRole === "All" ||
        (HERO_ROLE_MAP[slug] ?? []).includes(selectedRole);
      const matchesLane =
        selectedLane === "All" ||
        (HERO_LANE_MAP[slug] ?? []).includes(selectedLane);
      const capability = capabilityByLowerName.get(
        hero.metadata.name.toLowerCase(),
      );
      const matchesMechanic =
        selectedMechanic === "All" ||
        (capability?.mechanicCategories ?? []).includes(selectedMechanic);
      const matchesApiTag =
        selectedApiTag === "All" ||
        (capability?.apiTags ?? []).includes(selectedApiTag);
      const matchesSpecialty =
        selectedSpecialty === "All" ||
        (HERO_SPECIALTY_MAP[slug] ?? []).includes(selectedSpecialty);

      return (
        matchesName &&
        matchesRole &&
        matchesLane &&
        matchesSpecialty &&
        matchesMechanic &&
        matchesApiTag
      );
    });
  }, [
    heroes,
    search,
    selectedRole,
    selectedLane,
    selectedSpecialty,
    selectedMechanic,
    selectedApiTag,
    capabilityByLowerName,
  ]);

  const activeAdvancedCount = [
    selectedSpecialty !== "All",
    selectedMechanic !== "All",
    selectedApiTag !== "All",
  ].filter(Boolean).length;

  const hasAnyFilter =
    Boolean(search.trim()) ||
    selectedRole !== "All" ||
    selectedLane !== "All" ||
    activeAdvancedCount > 0;

  const resetAll = () => {
    setSearch("");
    setSelectedRole("All");
    setSelectedLane("All");
    setSelectedSpecialty("All");
    setSelectedMechanic("All");
    setSelectedApiTag("All");
  };

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
      active
        ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
        : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:border-[#2C3E4B] hover:text-slate-200",
    );

  return (
    <div className="space-y-5">
      <Surface className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-emerald-400"
              aria-hidden="true"
            />
            <input
              id="hero-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama hero (filter otomatis)..."
              aria-label="Cari hero"
              className="w-full rounded-xl border border-[#243440] bg-[#0B1014] py-3 pr-10 pl-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/70"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus kata kunci"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition",
              showAdvanced || activeAdvancedCount > 0
                ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200"
                : "border-[#243440] bg-[#0B1014] text-slate-300 hover:border-[#2C3E4B] hover:text-white",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              Filter Lanjutan
              {activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
            </span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Role:
            </span>
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                aria-pressed={selectedRole === role}
                className={pillClass(selectedRole === role)}
              >
                {role === "All" ? "Semua" : role}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Lane:
            </span>
            {LANES.map((lane) => (
              <button
                key={lane}
                type="button"
                onClick={() => setSelectedLane(lane)}
                aria-pressed={selectedLane === lane}
                className={pillClass(selectedLane === lane)}
              >
                {lane === "All" ? "Semua" : lane}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Lanjutan Tersembunyi agar Halaman Ringkas */}
        {showAdvanced && (
          <div className="space-y-4 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4">
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-300">
                Spesialisasi
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTIES.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => setSelectedSpecialty(specialty)}
                    aria-pressed={selectedSpecialty === specialty}
                    className={pillClass(selectedSpecialty === specialty)}
                  >
                    {specialty === "All" ? "Semua" : specialty}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-slate-300">
                Kategori Mekanik
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MECHANIC_OPTIONS.map((mechanic) => (
                  <button
                    key={mechanic}
                    type="button"
                    onClick={() => setSelectedMechanic(mechanic)}
                    aria-pressed={selectedMechanic === mechanic}
                    className={pillClass(selectedMechanic === mechanic)}
                  >
                    {MECHANIC_LABELS[mechanic] ?? mechanic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-slate-300">
                Tag Skill API
              </div>
              <div className="flex flex-wrap gap-1.5">
                {apiTagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedApiTag(tag)}
                    aria-pressed={selectedApiTag === tag}
                    className={pillClass(selectedApiTag === tag)}
                  >
                    {tag === "All" ? "Semua" : tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2A33] pt-3 text-xs text-slate-400">
          <span>
            Menampilkan{" "}
            <strong className="text-white">{filteredHeroes.length}</strong> dari{" "}
            {heroes.length} hero
          </span>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={resetAll}
              className="font-semibold text-emerald-300 hover:underline"
            >
              Reset semua filter
            </button>
          )}
        </div>
      </Surface>

      {filteredHeroes.length === 0 ? (
        <Surface className="p-10 text-center">
          <p className="font-semibold text-slate-200">Hero tidak ditemukan</p>
          <p className="mt-1.5 text-xs text-slate-500">
            Coba kata kunci atau kombinasi filter yang berbeda.
          </p>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredHeroes.map((hero) => {
            const slug = hero.metadata.slug;
            const heroRoles = HERO_ROLE_MAP[slug] ?? [];
            const heroLanes = HERO_LANE_MAP[slug] ?? [];
            const heroSpecialties = HERO_SPECIALTY_MAP[slug] ?? [];

            return (
              <Link
                key={hero.entityId}
                href={`/heroes/${encodeURIComponent(slug)}`}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label={`Lihat detail ${hero.metadata.name}`}
              >
                <Surface className="flex h-full flex-col justify-between p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-400/45 group-hover:bg-[#141D24]">
                  <div className="flex items-start gap-3.5">
                    <HeroPortrait
                      slug={slug}
                      name={hero.metadata.name}
                      className="h-16 w-14 shrink-0 text-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-white group-hover:text-emerald-300">
                        {hero.metadata.name}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {heroRoles.map((role) => (
                          <Badge key={role} tone="emerald">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      {heroSpecialties.length > 0 && (
                        <p className="mt-1.5 truncate text-[11px] text-[#9FB0BE]">
                          {heroSpecialties.join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E2A33] pt-3">
                    <div className="flex flex-wrap gap-1">
                      {heroLanes.length > 0 ? (
                        heroLanes.map((lane) => (
                          <Badge key={lane} tone="neutral">
                            {lane}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Lane fleksibel
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-300/80 group-hover:text-emerald-300">
                      Detail →
                    </span>
                  </div>
                </Surface>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
