"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  BarChart3,
  ExternalLink,
  Info,
  LayoutGrid,
  Search,
  X,
} from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import {
  META_LANES,
  META_ROLES,
  META_TIERS,
  formatPercent,
  groupHeroesByTier,
  type MetaDashboardPayload,
  type MetaRankBracketKey,
  type MetaTierGrade,
} from "../index";
import { MetaSpotlightStrip } from "./MetaSpotlightStrip";

type Props = {
  payload: MetaDashboardPayload;
  patchLabel: string;
};

type ViewMode = "tier-board" | "stat-table";
type SortField = "metaScore" | "winRate" | "banRate" | "pickRate";

const BRACKET_OPTIONS: Array<{ key: MetaRankBracketKey; label: string }> = [
  { key: "mythical_glory", label: "Mythical Glory+" },
  { key: "mythical_honor", label: "Mythical Honor" },
  { key: "mythic", label: "Mythic" },
  { key: "all_rank", label: "Semua Rank" },
];

const TIER_STYLES: Record<
  MetaTierGrade,
  {
    label: string;
    subtitle: string;
    badgeBg: string;
    borderAccent: string;
    textAccent: string;
  }
> = {
  S: {
    label: "S",
    subtitle: "Meta Dominan",
    badgeBg: "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950",
    borderAccent: "border-emerald-400/35",
    textAccent: "text-emerald-300",
  },
  A: {
    label: "A",
    subtitle: "Kuat & Konsisten",
    badgeBg: "bg-gradient-to-br from-sky-400 to-cyan-500 text-slate-950",
    borderAccent: "border-sky-400/30",
    textAccent: "text-sky-300",
  },
  B: {
    label: "B",
    subtitle: "Solid & Situasional",
    badgeBg: "bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950",
    borderAccent: "border-amber-400/25",
    textAccent: "text-amber-200",
  },
  C: {
    label: "C",
    subtitle: "Khusus Spesialis",
    badgeBg: "bg-slate-600 text-white",
    borderAccent: "border-[#243440]",
    textAccent: "text-slate-300",
  },
  D: {
    label: "D",
    subtitle: "Kurang Optimal",
    badgeBg: "bg-rose-500/80 text-white",
    borderAccent: "border-rose-500/25",
    textAccent: "text-rose-300",
  },
};

export function MetaTierListBoard({ payload, patchLabel }: Props) {
  const [bracketKey, setBracketKey] =
    useState<MetaRankBracketKey>("mythical_glory");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedLane, setSelectedLane] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tier-board");
  const [sortField, setSortField] = useState<SortField>("metaScore");

  const activeBracket = payload.brackets[bracketKey];

  const filteredHeroes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeBracket.heroes.filter((hero) => {
      if (q && !hero.heroName.toLowerCase().includes(q)) return false;
      if (selectedRole !== "ALL" && !hero.roles.includes(selectedRole)) {
        return false;
      }
      if (selectedLane !== "ALL" && !hero.lanes.includes(selectedLane)) {
        return false;
      }
      return true;
    });
  }, [activeBracket.heroes, search, selectedRole, selectedLane]);

  // Saat memfilter 1 Role spesifik, hitung ulang distribusi S–D relatif pada Role tsb agar adil
  const tierBuckets = useMemo(
    () =>
      groupHeroesByTier(
        filteredHeroes,
        selectedRole !== "ALL" || selectedLane !== "ALL",
      ),
    [filteredHeroes, selectedRole, selectedLane],
  );

  const sortedForTable = useMemo(() => {
    return [...filteredHeroes].sort(
      (a, b) =>
        b[sortField] - a[sortField] ||
        b.winRate - a.winRate ||
        a.heroName.localeCompare(b.heroName),
    );
  }, [filteredHeroes, sortField]);

  const updatedDateText = payload.sourceUpdatedAt
    ? new Date(payload.sourceUpdatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Terbaru";

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
      active
        ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-200"
        : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:border-[#2C3E4B] hover:text-slate-200",
    );

  return (
    <div className="space-y-6">
      {/* Header Dashboard Meta + Switcher Bracket Rank */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">Data Resmi Moonton</Badge>
            <Badge tone="neutral">Patch {patchLabel}</Badge>
            <Badge tone="neutral">Diperbarui {updatedDateText}</Badge>
          </div>
          <h2 className="mt-2.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Sorotan Meta &amp; Tier List Hero (S – D)
          </h2>
          <p className="mt-1 text-xs text-[#9FB0BE]">
            Statistik Win Rate, Ban Rate, dan Pick Rate asli dari{" "}
            <strong className="text-slate-200">{activeBracket.label}</strong>{" "}
            untuk seluruh {activeBracket.totalHeroes} hero.
          </p>
        </div>

        {/* Bracket Rank Switcher */}
        <div
          role="tablist"
          aria-label="Pilih Bracket Rank"
          className="flex flex-wrap gap-1.5 rounded-2xl border border-[#1E2A33] bg-[#10161B] p-1.5"
        >
          {BRACKET_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={bracketKey === opt.key}
              onClick={() => setBracketKey(opt.key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                bracketKey === opt.key
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Kartu Sorotan Meta */}
      <MetaSpotlightStrip bracket={activeBracket} />

      {/* Panel Kontrol Tier List S-D */}
      <Surface elevated className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Role Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedRole("ALL")}
              className={pillClass(selectedRole === "ALL")}
            >
              Semua Role
            </button>
            {META_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={pillClass(selectedRole === role)}
              >
                {role}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#1E2A33] bg-[#0B1014] p-1">
              <button
                type="button"
                onClick={() => setViewMode("tier-board")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "tier-board"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                Papan Tier S–D
              </button>
              <button
                type="button"
                onClick={() => setViewMode("stat-table")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "stat-table"
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Tabel Statistik
              </button>
            </div>
          </div>
        </div>

        {/* Lane Pills + Search */}
        <div className="flex flex-col gap-3 border-t border-[#1E2A33] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Lane:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLane("ALL")}
              className={pillClass(selectedLane === "ALL")}
            >
              Semua
            </button>
            {META_LANES.map((lane) => (
              <button
                key={lane}
                type="button"
                onClick={() => setSelectedLane(lane)}
                className={pillClass(selectedLane === lane)}
              >
                {lane}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari hero di tier list..."
              className="w-full rounded-xl border border-[#243440] bg-[#0B1014] py-2 pr-8 pl-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/70"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* MODE 1: VISUAL TIER BOARD S -> D */}
        {viewMode === "tier-board" ? (
          <div className="space-y-3">
            {filteredHeroes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#243440] p-8 text-center text-xs text-slate-400">
                Tidak ada hero yang cocok dengan kombinasi filter saat ini.
              </div>
            ) : (
              META_TIERS.map((grade) => {
                const heroesInTier = tierBuckets[grade];
                const style = TIER_STYLES[grade];

                return (
                  <div
                    key={grade}
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-[#0B1014]",
                      style.borderAccent,
                    )}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Tier Grade Label Column */}
                      <div className="flex items-center justify-between gap-3 border-b border-[#1E2A33] bg-[#10161B] px-4 py-3 sm:w-40 sm:shrink-0 sm:flex-col sm:justify-center sm:border-r sm:border-b-0 sm:text-center">
                        <div className="flex items-center gap-3 sm:flex-col sm:gap-1.5">
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black shadow-md",
                              style.badgeBg,
                            )}
                          >
                            {style.label}
                          </span>
                          <div>
                            <p
                              className={cn(
                                "text-xs font-bold",
                                style.textAccent,
                              )}
                            >
                              Tier {style.label}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {style.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#151D24] px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                          {heroesInTier.length} hero
                        </span>
                      </div>

                      {/* Hero Grid inside Tier */}
                      <div className="flex-1 p-3.5">
                        {heroesInTier.length === 0 ? (
                          <p className="py-2 text-xs text-slate-500">
                            Tidak ada hero di Tier {grade} pada filter ini.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {heroesInTier.map((hero) => (
                              <Link
                                key={`${grade}-${hero.heroSlug}`}
                                href={`/heroes/${hero.heroSlug}`}
                                className="group flex items-center gap-2.5 rounded-xl border border-[#1E2A33] bg-[#10161B] p-2 transition hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-[#151F27]"
                              >
                                <HeroPortrait
                                  slug={hero.heroSlug}
                                  name={hero.heroName}
                                  className="h-10 w-9 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold text-white group-hover:text-emerald-300">
                                    {hero.heroName}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px]">
                                    <span
                                      className={
                                        hero.winRate >= 0.52
                                          ? "font-semibold text-emerald-300"
                                          : hero.winRate < 0.48
                                            ? "text-rose-300"
                                            : "text-slate-300"
                                      }
                                    >
                                      {(hero.winRate * 100).toFixed(1)}%
                                    </span>
                                    {hero.banRate >= 0.05 && (
                                      <span className="text-rose-300/80">
                                        B:{(hero.banRate * 100).toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* MODE 2: SORTABLE STAT TABLE */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <ArrowUpDown className="h-3.5 w-3.5" /> Urutkan:
              </span>
              {(
                [
                  { id: "metaScore", label: "Skor Meta" },
                  { id: "winRate", label: "Win Rate" },
                  { id: "banRate", label: "Ban Rate" },
                  { id: "pickRate", label: "Pick Rate" },
                ] as const
              ).map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSortField(col.id)}
                  className={pillClass(sortField === col.id)}
                >
                  {col.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#1E2A33]">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2A33] bg-[#0B1014] text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-4 pr-2">#</th>
                    <th className="px-3 py-3">Hero</th>
                    <th className="px-3 py-3">Tier</th>
                    <th className="px-3 py-3 text-right">Win Rate</th>
                    <th className="px-3 py-3 text-right">Pick Rate</th>
                    <th className="px-3 py-3 text-right">Ban Rate</th>
                    <th className="px-3 py-3 text-right">Skor Meta</th>
                    <th className="py-3 pl-3 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2A33]/70 bg-[#10161B]">
                  {sortedForTable.slice(0, 30).map((hero, idx) => (
                    <tr
                      key={hero.heroSlug}
                      className="transition hover:bg-[#151D24]"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/heroes/${hero.heroSlug}`}
                          className="flex items-center gap-2.5 font-bold text-white hover:text-emerald-300"
                        >
                          <HeroPortrait
                            slug={hero.heroSlug}
                            name={hero.heroName}
                            className="h-9 w-8 shrink-0"
                          />
                          <div>
                            <p>{hero.heroName}</p>
                            <p className="text-[10px] font-normal text-slate-400">
                              {hero.roles.join("/")} ·{" "}
                              {hero.lanes[0] ?? "Fleksibel"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black",
                            TIER_STYLES[hero.tier].badgeBg,
                          )}
                        >
                          {hero.tier}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right font-mono font-semibold",
                          hero.winRate >= 0.52
                            ? "text-emerald-300"
                            : hero.winRate < 0.48
                              ? "text-rose-300"
                              : "text-slate-200",
                        )}
                      >
                        {formatPercent(hero.winRate)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sky-300">
                        {formatPercent(hero.pickRate)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-300">
                        {formatPercent(hero.banRate)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-200">
                        {hero.metaScore}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right">
                        <Link
                          href={`/builds/${hero.heroSlug}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#243440] px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:border-emerald-400/50"
                        >
                          Build <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedForTable.length > 30 && (
              <p className="text-center text-[11px] text-slate-500">
                Menampilkan 30 peringkat teratas dari {sortedForTable.length}{" "}
                hero. Gunakan filter Role/Lane atau pencarian untuk melihat hero
                lainnya.
              </p>
            )}
          </div>
        )}

        {/* Transparansi Metodologi & Sumber Resmi */}
        <details className="rounded-xl border border-[#1E2A33] bg-[#0B1014] p-3.5 text-xs text-[#9FB0BE]">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-slate-200 hover:text-emerald-200">
            <Info className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Metodologi Tier List S–D &amp; Sumber Data Resmi</span>
          </summary>
          <div className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed">
            <p>
              <strong className="text-white">Fakta Resmi (Tier 1):</strong>{" "}
              Seluruh angka Win Rate, Pick Rate, dan Ban Rate diambil langsung
              dari {payload.sourceName} (diperbarui {updatedDateText}).
            </p>
            <p>
              <strong className="text-white">
                Analisis Berbasis Riset (Tier S–D):
              </strong>{" "}
              Skor Meta dihitung secara deterministik dari normalisasi z-score
              (55% Win Rate + 25% Ban Rate + 20% Pick Rate) lalu dibagi ke Tier
              S (Top 15%), A (15%–38%), B (38%–66%), C (66%–86%), dan D (14%
              terbawah). Saat memilih 1 Role tertentu, tier diseimbangkan
              relatif terhadap seluruh hero di Role tersebut.
            </p>
          </div>
        </details>
      </Surface>
    </div>
  );
}
