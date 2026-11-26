"use client";

import { useMemo, useState } from "react";
import type { HeroRecord } from "@/features/heroes";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { Badge } from "@/components/ui/Badge";
import { Surface } from "@/components/ui/Surface";

interface BuildHeroPickerProps {
  heroes: HeroRecord[];
  patch: {
    versionCode: string;
    seasonLabel: string | null;
  } | null;
}

export function BuildHeroPicker({ heroes, patch }: BuildHeroPickerProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [lane, setLane] = useState("All");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  const roles = ["All", "Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"];
  const lanes = ["All", "EXP Lane", "Jungle", "Mid Lane", "Gold Lane", "Roam"];

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return heroes.filter((hero) => {
      const matchesName = hero.metadata.name.toLowerCase().includes(query);
      const heroRoles = HERO_ROLE_MAP[hero.metadata.slug] ?? [];
      const heroLanes = HERO_LANE_MAP[hero.metadata.slug] ?? [];

      const matchesRole = role === "All" || heroRoles.includes(role);
      const matchesLane = lane === "All" || heroLanes.includes(lane);

      return matchesName && matchesRole && matchesLane;
    });
  }, [heroes, search, role, lane]);

  const selectedHero =
    heroes.find((hero) => hero.entityId === selectedHeroId) ?? null;

  return (
    <section className="space-y-4">
      <Surface className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Pilih Hero</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih hero untuk melihat ketersediaan rekomendasi build.
            </p>
          </div>
          <Badge tone="blue">Original Server</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-3">
            <span className="mb-2 block text-xs font-medium text-slate-400">
              Cari nama hero
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Contoh: Miya, Tigreal, Fanny..."
              className="w-full rounded-lg border border-[#263247] bg-[#0B0F17] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-medium text-slate-400">
              Role
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-lg border border-[#263247] bg-[#0B0F17] px-3 py-3 text-sm text-slate-200 outline-none focus:border-sky-500"
            >
              {roles.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-medium text-slate-400">
              Lane
            </span>
            <select
              value={lane}
              onChange={(event) => setLane(event.target.value)}
              className="w-full rounded-lg border border-[#263247] bg-[#0B0F17] px-3 py-3 text-sm text-slate-200 outline-none focus:border-sky-500"
            >
              {lanes.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end text-xs text-slate-500">
            {filteredHeroes.length} dari {heroes.length} hero
          </div>
        </div>
      </Surface>

      {selectedHero && (
        <Surface className="border-sky-500/30 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <HeroPortrait
              slug={selectedHero.metadata.slug}
              name={selectedHero.metadata.name}
              className="h-16 w-16 text-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-sky-300">
                Hero terpilih
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">
                {selectedHero.metadata.name}
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedHero.profile ? (
                  <>
                    <Badge tone="blue">{selectedHero.profile.role}</Badge>
                    {selectedHero.profile.lanes.map((value) => (
                      <Badge key={value} tone="neutral">{value}</Badge>
                    ))}
                  </>
                ) : (
                  <Badge tone="neutral">Profil gameplay belum tersedia</Badge>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHeroId(null)}
              className="rounded-lg border border-[#263247] px-3 py-2 text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
          </div>
          <div className="mt-4 border-t border-[#263247] pt-4">
            <p className="font-medium text-slate-200">Belum ada build tersedia</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Belum ada rekomendasi build yang dipublikasikan untuk hero ini.
              Build akan ditampilkan setelah data, referensi, dan proses
              verifikasinya tersedia.
            </p>
          </div>
        </Surface>
      )}

      {filteredHeroes.length === 0 ? (
        <Surface className="p-8 text-center">
          <p className="font-medium text-slate-200">Hero tidak ditemukan</p>
          <p className="mt-1 text-sm text-slate-500">
            Ubah kata kunci atau filter role dan lane.
          </p>
        </Surface>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredHeroes.map((hero) => {
            const isSelected = selectedHeroId === hero.entityId;

            return (
              <button
                key={hero.entityId}
                type="button"
                onClick={() => setSelectedHeroId(hero.entityId)}
                aria-pressed={isSelected}
                className={`rounded-xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isSelected ? "ring-2 ring-sky-500" : ""
                }`}
              >
                <Surface className="h-full p-3 hover:border-sky-500/40">
                  <div className="flex items-center gap-3">
                    <HeroPortrait
                      slug={hero.metadata.slug}
                      name={hero.metadata.name}
                      className="h-12 w-12 text-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {hero.metadata.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {hero.profile ? hero.profile.role : "Profil belum tersedia"}
                      </p>
                    </div>
                  </div>
                </Surface>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Patch aktif: {patch?.versionCode ?? "Belum tersedia"}
        {patch?.seasonLabel ? ` · ${patch.seasonLabel}` : ""}
      </p>
    </section>
  );
}