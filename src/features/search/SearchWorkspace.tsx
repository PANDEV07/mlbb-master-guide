"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Search, X } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { cn } from "@/lib/cn";
import type { HeroRecord } from "@/features/heroes/types/hero.types";
import type { ItemCatalogRecord } from "@/features/items/server/item.repository";

interface SearchWorkspaceProps {
  heroes: HeroRecord[];
  items?: ItemCatalogRecord[];
}

type SearchScope = "all" | "heroes" | "items" | "modules";

const MODULES_INDEX = [
  {
    href: "/matchups",
    title: "Matchup 1v1 & Draft Tim 5v5",
    keywords: "matchup duel 1v1 5v5 draft komposisi tim lane",
    description: "Analisis duel head-to-head dan audit komposisi tim 5v5.",
  },
  {
    href: "/counters",
    title: "Counter Hero & Item",
    keywords: "counter lawan anti heal cc defense",
    description: "Cari kandidat hero dan item penangkal ancaman musuh.",
  },
  {
    href: "/builds",
    title: "Panduan & Rakitan Build",
    keywords: "build item template custom core",
    description: "3 template build per hero + workbench rakitan custom.",
  },
  {
    href: "/academy",
    title: "Akademi Ranked (Solo · Duo · Trio · 5-Man)",
    keywords: "akademi ranked solo duo trio 5man macro micro tips trik",
    description: "Panduan adaptasi strategi pro sesuai ukuran party.",
  },
  {
    href: "/patches",
    title: "Pusat Patch & Meta",
    keywords: "patch meta update buff nerf original advance server",
    description: "Status patch aktif, sumber resmi, dan kesegaran data.",
  },
] as const;

const SCOPES: Array<{ id: SearchScope; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "heroes", label: "Hero" },
  { id: "items", label: "Item" },
  { id: "modules", label: "Modul" },
];

export function SearchWorkspace({ heroes, items = [] }: SearchWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState<SearchScope>("all");

  const normalized = query.trim().toLowerCase();

  const matchedHeroes = useMemo(() => {
    if (!normalized || (selectedScope !== "all" && selectedScope !== "heroes")) {
      return [];
    }
    return heroes
      .filter((hero) => {
        const roles = HERO_ROLE_MAP[hero.metadata.slug] ?? [];
        const lanes = HERO_LANE_MAP[hero.metadata.slug] ?? [];
        return (
          hero.metadata.name.toLowerCase().includes(normalized) ||
          roles.some((r) => r.toLowerCase().includes(normalized)) ||
          lanes.some((l) => l.toLowerCase().includes(normalized))
        );
      })
      .slice(0, 24);
  }, [heroes, normalized, selectedScope]);

  const matchedItems = useMemo(() => {
    if (!normalized || (selectedScope !== "all" && selectedScope !== "items")) {
      return [];
    }
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized) ||
          item.passiveEffects.some(
            (p) =>
              p.name.toLowerCase().includes(normalized) ||
              p.description.toLowerCase().includes(normalized),
          ),
      )
      .slice(0, 20);
  }, [items, normalized, selectedScope]);

  const matchedModules = useMemo(() => {
    if (
      !normalized ||
      (selectedScope !== "all" && selectedScope !== "modules")
    ) {
      return [];
    }
    return MODULES_INDEX.filter(
      (mod) =>
        mod.title.toLowerCase().includes(normalized) ||
        mod.keywords.includes(normalized) ||
        mod.description.toLowerCase().includes(normalized),
    );
  }, [normalized, selectedScope]);

  const totalCount =
    matchedHeroes.length + matchedItems.length + matchedModules.length;

  return (
    <Surface className="space-y-6 p-5 sm:p-6">
      <div role="search" aria-label="Pencarian Pengetahuan MLBB" className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-emerald-400"
            aria-hidden="true"
          />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ketik nama hero, item, role, lane, atau modul (mis. Aamon, Assassin, Athena, Solo)..."
            aria-label="Kata kunci pencarian"
            className="w-full rounded-2xl border border-[#243440] bg-[#0B1014] py-3.5 pr-11 pl-11 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus kata kunci"
              className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Filter:</span>
          {SCOPES.map((scope) => {
            const active = selectedScope === scope.id;
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => setSelectedScope(scope.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  active
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                    : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:text-slate-200",
                )}
              >
                {scope.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {!normalized ? (
        <div className="rounded-2xl border border-dashed border-[#243440] bg-[#0B1014]/60 p-8 text-center">
          <p className="text-sm font-medium text-slate-200">
            Mulai mengetik untuk mencari secara langsung
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Contoh cepat:{" "}
            {["Aamon", "Khufra", "Athena", "Anti-Heal", "Matchup"].map(
              (sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setQuery(sample)}
                  className="mx-1 rounded-full border border-[#243440] bg-[#151D24] px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 hover:border-emerald-400/50"
                >
                  {sample}
                </button>
              ),
            )}
          </p>
        </div>
      ) : totalCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#243440] bg-[#0B1014]/60 p-8 text-center">
          <Badge tone="neutral">Tidak ditemukan</Badge>
          <p className="mt-2 text-sm text-slate-300">
            Tidak ada hasil yang cocok untuk &ldquo;{query}&rdquo;.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Coba kata kunci lain atau ubah filter ke Semua.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-slate-400">
            Menampilkan <strong className="text-white">{totalCount}</strong>{" "}
            hasil untuk &ldquo;{query}&rdquo;
          </p>

          {matchedHeroes.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Hero ({matchedHeroes.length})
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {matchedHeroes.map((hero) => {
                  const roles = HERO_ROLE_MAP[hero.metadata.slug] ?? [];
                  const lanes = HERO_LANE_MAP[hero.metadata.slug] ?? [];
                  return (
                    <div
                      key={hero.entityId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-3 transition hover:border-emerald-400/40"
                    >
                      <Link
                        href={`/heroes/${hero.metadata.slug}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <HeroPortrait
                          slug={hero.metadata.slug}
                          name={hero.metadata.name}
                          className="h-11 w-10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {hero.metadata.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {[...roles, ...lanes].join(" · ") || "Hero MLBB"}
                          </p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Link
                          href={`/heroes/${hero.metadata.slug}`}
                          className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-center text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/25"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/builds/${hero.metadata.slug}`}
                          className="rounded-lg border border-[#263542] px-2.5 py-1 text-center text-[11px] text-slate-300 hover:border-emerald-400/50"
                        >
                          Build
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchedItems.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                Item ({matchedItems.length})
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {matchedItems.map((item) => (
                  <Link
                    key={item.entityId}
                    href={`/items/${item.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-3 transition hover:border-emerald-400/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.iconUrl ? (
                        <Image
                          src={item.iconUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 shrink-0 rounded-lg border border-[#263542] object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#151D24] text-slate-400">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white group-hover:text-emerald-200">
                          {item.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {item.category}
                          {item.price ? ` · ${item.price} Gold` : ""}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-emerald-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {matchedModules.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Modul &amp; Alat ({matchedModules.length})
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {matchedModules.map((mod) => (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4 transition hover:border-emerald-400/40"
                  >
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-emerald-200">
                        {mod.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {mod.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-emerald-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}
