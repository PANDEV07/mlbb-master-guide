"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Info,
  LayoutGrid,
  Loader2,
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
  type MetaBracketSnapshot,
  type MetaRankBracketKey,
  type MetaTierGrade,
  type RankedMetaHero,
} from "../index";
import { MetaSpotlightStrip } from "./MetaSpotlightStrip";

type Props = {
  initialBracket: MetaBracketSnapshot;
  sourceName: string;
  sourceUpdatedAt: string | null;
  patchLabel: string;
};

type ViewMode = "tier-board" | "stat-table";
type SortField = "metaScore" | "winRate" | "banRate" | "pickRate";
type MetricFocus = "winRate" | "pickRate" | "banRate";

const BRACKET_OPTIONS: Array<{ key: MetaRankBracketKey; label: string }> = [
  { key: "mythical_glory", label: "Mythical Glory+" },
  { key: "mythical_honor", label: "Mythical Honor" },
  { key: "mythic", label: "Mythic" },
  { key: "all_rank", label: "Semua Rank" },
];

const METRIC_OPTIONS: Array<{ key: MetricFocus; label: string }> = [
  { key: "winRate", label: "Win Rate" },
  { key: "pickRate", label: "Pick Rate" },
  { key: "banRate", label: "Ban Rate" },
];

const ROLE_CODES: Record<string, string> = {
  Tank: "TK",
  Fighter: "FG",
  Assassin: "AS",
  Mage: "MG",
  Marksman: "MM",
  Support: "SP",
};

const TIER_STYLES: Record<
  MetaTierGrade,
  {
    label: string;
    subtitle: string;
    hex: string;
    flagBg: string;
    borderColor: string;
    textAccent: string;
    glow: string;
  }
> = {
  S: {
    label: "S",
    subtitle: "Meta Dominan",
    hex: "#F5B83D",
    flagBg: "bg-[#F5B83D] text-[#0A0E1A]",
    borderColor: "border-[#F5B83D]/60",
    textAccent: "text-[#F5B83D]",
    glow: "shadow-[0_0_24px_rgba(245,184,61,0.45)]",
  },
  A: {
    label: "A",
    subtitle: "Kuat & Konsisten",
    hex: "#22D3EE",
    flagBg: "bg-[#22D3EE] text-[#0A0E1A]",
    borderColor: "border-[#22D3EE]/55",
    textAccent: "text-[#22D3EE]",
    glow: "shadow-[0_0_22px_rgba(34,211,238,0.4)]",
  },
  B: {
    label: "B",
    subtitle: "Solid & Situasional",
    hex: "#4ADE80",
    flagBg: "bg-[#4ADE80] text-[#0A0E1A]",
    borderColor: "border-[#4ADE80]/45",
    textAccent: "text-[#4ADE80]",
    glow: "shadow-[0_0_18px_rgba(74,222,128,0.3)]",
  },
  C: {
    label: "C",
    subtitle: "Khusus Spesialis",
    hex: "#94A3B8",
    flagBg: "bg-[#94A3B8] text-[#0A0E1A]",
    borderColor: "border-[#94A3B8]/40",
    textAccent: "text-[#94A3B8]",
    glow: "",
  },
  D: {
    label: "D",
    subtitle: "Kurang Optimal",
    hex: "#E11D48",
    flagBg: "bg-[#E11D48] text-white",
    borderColor: "border-[#E11D48]/50",
    textAccent: "text-[#FB7185]",
    glow: "shadow-[0_0_18px_rgba(225,29,72,0.35)]",
  },
};

export function MetaTierListBoard({
  initialBracket,
  sourceName,
  sourceUpdatedAt,
  patchLabel,
}: Props) {
  const [bracketCache, setBracketCache] = useState<
    Partial<Record<MetaRankBracketKey, MetaBracketSnapshot>>
  >({ [initialBracket.key]: initialBracket });
  const [bracketKey, setBracketKey] = useState<MetaRankBracketKey>(
    initialBracket.key,
  );
  const [loadingBracket, setLoadingBracket] =
    useState<MetaRankBracketKey | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedLane, setSelectedLane] = useState<string>("ALL");
  const [metricFocus, setMetricFocus] = useState<MetricFocus>("winRate");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [viewMode, setViewMode] = useState<ViewMode>("tier-board");
  const [sortField, setSortField] = useState<SortField>("metaScore");
  const [mobileOpenTiers, setMobileOpenTiers] = useState<
    Record<MetaTierGrade, boolean>
  >({
    S: true,
    A: true,
    B: false,
    C: false,
    D: false,
  });

  const activeBracket = bracketCache[bracketKey] ?? initialBracket;

  const handleSelectBracket = async (nextKey: MetaRankBracketKey) => {
    if (bracketCache[nextKey]) {
      setBracketKey(nextKey);
      return;
    }
    setLoadingBracket(nextKey);
    try {
      const res = await fetch(`/api/meta?bracket=${encodeURIComponent(nextKey)}`);
      if (res.ok) {
        const data = (await res.json()) as { bracket?: MetaBracketSnapshot };
        if (data.bracket) {
          setBracketCache((prev) => ({ ...prev, [nextKey]: data.bracket! }));
          setBracketKey(nextKey);
        }
      }
    } finally {
      setLoadingBracket(null);
    }
  };

  const filteredHeroes = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
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
  }, [activeBracket.heroes, deferredSearch, selectedRole, selectedLane]);

  const tierBuckets = useMemo(() => {
    const grouped = groupHeroesByTier(
      filteredHeroes,
      selectedRole !== "ALL" || selectedLane !== "ALL",
    );
    const sortedBuckets: Record<MetaTierGrade, RankedMetaHero[]> = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
    };
    for (const grade of META_TIERS) {
      sortedBuckets[grade] = [...grouped[grade]].sort(
        (a, b) =>
          b[metricFocus] - a[metricFocus] ||
          b.metaScore - a.metaScore ||
          a.heroName.localeCompare(b.heroName),
      );
    }
    return sortedBuckets;
  }, [filteredHeroes, selectedRole, selectedLane, metricFocus]);

  const sortedForTable = useMemo(() => {
    return [...filteredHeroes].sort(
      (a, b) =>
        b[sortField] - a[sortField] ||
        b.winRate - a.winRate ||
        a.heroName.localeCompare(b.heroName),
    );
  }, [filteredHeroes, sortField]);

  const topFiveMeta = useMemo(
    () => activeBracket.heroes.slice(0, 5),
    [activeBracket.heroes],
  );

  const updatedDateText = sourceUpdatedAt
    ? new Date(sourceUpdatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Terbaru";

  const pillClass = (active: boolean) =>
    cn(
      "px-3.5 py-1.5 text-sm cursor-pointer",
      active ? "mlbb-pill-active" : "mlbb-pill",
    );

  const toggleMobileTier = (grade: MetaTierGrade) => {
    setMobileOpenTiers((prev) => ({ ...prev, [grade]: !prev[grade] }));
  };

  return (
    <div className="space-y-8">
      {/* Header Dashboard Meta + Switcher Bracket Rank */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">Data Resmi Moonton</Badge>
            <Badge tone="blue">Patch {patchLabel}</Badge>
            <Badge tone="neutral">Diperbarui {updatedDateText}</Badge>
          </div>
          <h2 className="mlbb-heading mt-3 text-2xl text-[#E6EAF5] sm:text-3xl">
            Meta Terkini &amp; Tier List{" "}
            <span className="text-[#F5B83D]">Mobile Legends</span>
          </h2>
          <p className="mt-1.5 text-xs text-[#9AA6C4] sm:text-sm">
            Statistik Win Rate, Ban Rate, dan Pick Rate asli dari{" "}
            <strong className="text-[#E6EAF5]">{activeBracket.label}</strong>{" "}
            untuk seluruh {activeBracket.totalHeroes} hero Original Server.
          </p>
        </div>

        {/* Bracket Rank Switcher */}
        <div
          role="tablist"
          aria-label="Pilih Bracket Rank"
          className="flex flex-wrap gap-1.5 border border-[#22D3EE]/30 bg-[#101830] p-1.5"
        >
          {BRACKET_OPTIONS.map((opt) => {
            const isLoading = loadingBracket === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={bracketKey === opt.key}
                disabled={isLoading}
                onClick={() => handleSelectBracket(opt.key)}
                className={cn(
                  "font-display inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs transition sm:text-sm",
                  bracketKey === opt.key
                    ? "bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.45)]"
                    : "text-[#9AA6C4] hover:text-[#F5B83D]",
                )}
              >
                {isLoading && (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 5 Meta Terkini — Progress Bars */}
      <section className="border border-[#22D3EE]/20 bg-[#0D1328] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="mlbb-heading text-xl text-[#E6EAF5] sm:text-2xl">
            Meta Terkini{" "}
            <span className="text-sm font-semibold text-[#9AA6C4]">
              Top 5 · {activeBracket.label}
            </span>
          </h3>
          <span className="font-display text-xs text-[#22D3EE]">
            Win Rate · Pick Rate · Ban Rate
          </span>
        </div>

        <Surface className="divide-y divide-white/10 px-4 py-1 sm:px-6">
          {topFiveMeta.map((hero, idx) => {
            const wrPct = hero.winRate * 100;
            const prPct = hero.pickRate * 100;
            const brPct = hero.banRate * 100;
            return (
              <Link
                key={`top5-${hero.heroSlug}`}
                href={`/heroes/${hero.heroSlug}`}
                className="group grid grid-cols-1 gap-3 py-3.5 transition hover:bg-[#15203E]/50 sm:grid-cols-[36px_190px_1fr_1fr_1fr] sm:items-center sm:gap-5"
              >
                <div className="flex items-center gap-3 sm:contents">
                  <span className="font-display text-2xl text-[#F5B83D]">
                    {idx + 1}
                  </span>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <HeroPortrait
                      slug={hero.heroSlug}
                      name={hero.heroName}
                      className="h-10 w-9 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display truncate text-lg text-[#E6EAF5] group-hover:text-[#F5B83D]">
                        {hero.heroName}
                      </p>
                      <p className="truncate text-[11px] text-[#9AA6C4]">
                        {hero.roles.join(" / ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#9AA6C4]">
                    <span>Win Rate</span>
                    <span className="font-display text-sm text-[#F5B83D]">
                      {wrPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1B2442]">
                    <div
                      className="h-1.5 bg-[#F5B83D] shadow-[0_0_8px_#F5B83D]"
                      style={{ width: `${Math.min(100, Math.max(12, wrPct))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#9AA6C4]">
                    <span>Pick Rate</span>
                    <span className="font-display text-sm text-[#22D3EE]">
                      {prPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1B2442]">
                    <div
                      className="h-1.5 bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"
                      style={{
                        width: `${Math.min(100, Math.max(8, prPct * 28))}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#9AA6C4]">
                    <span>Ban Rate</span>
                    <span className="font-display text-sm text-[#FB7185]">
                      {brPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1B2442]">
                    <div
                      className="h-1.5 bg-[#E11D48] shadow-[0_0_8px_#E11D48]"
                      style={{
                        width: `${Math.min(100, Math.max(6, brPct))}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </Surface>
      </section>

      {/* 4 Kartu Sorotan Meta */}
      <MetaSpotlightStrip bracket={activeBracket} />

      {/* Panel Kontrol Tier List S–D */}
      <div id="tier-list" className="scroll-mt-20 space-y-5">
        <Surface elevated className="space-y-4 p-4 sm:p-5">
          {/* Baris 1: Filter Role + Switcher Tampilan */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("ALL")}
                className={pillClass(selectedRole === "ALL")}
              >
                Semua
              </button>
              {META_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    pillClass(selectedRole === role),
                    "inline-flex items-center gap-2",
                  )}
                >
                  <span className="border border-current px-1 text-[10px] leading-tight">
                    {ROLE_CODES[role] ?? role.slice(0, 2).toUpperCase()}
                  </span>
                  {role}
                </button>
              ))}
            </div>

            <div className="inline-flex self-start border border-[#22D3EE]/30 bg-[#0A0E1A] p-1">
              <button
                type="button"
                onClick={() => setViewMode("tier-board")}
                className={cn(
                  "font-display inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs transition",
                  viewMode === "tier-board"
                    ? "bg-[#F5B83D] text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                Papan Tier S–D
              </button>
              <button
                type="button"
                onClick={() => setViewMode("stat-table")}
                className={cn(
                  "font-display inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs transition",
                  viewMode === "stat-table"
                    ? "bg-[#F5B83D] text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Tabel Statistik
              </button>
            </div>
          </div>

          {/* Baris 2: Filter Lane + Metrik Fokus + Cari Hero */}
          <div className="flex flex-col gap-3 border-t border-[#22D3EE]/15 pt-3.5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-display mr-1 text-xs text-[#9AA6C4]">
                Lane:
              </span>
              <button
                type="button"
                onClick={() => setSelectedLane("ALL")}
                className={cn(
                  "px-3 py-1 text-xs cursor-pointer",
                  selectedLane === "ALL" ? "mlbb-pill-active" : "mlbb-pill",
                )}
              >
                Semua
              </button>
              {META_LANES.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => setSelectedLane(lane)}
                  className={cn(
                    "px-3 py-1 text-xs cursor-pointer",
                    selectedLane === lane ? "mlbb-pill-active" : "mlbb-pill",
                  )}
                >
                  {lane}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              {viewMode === "tier-board" && (
                <div className="inline-flex border border-[#22D3EE]/30 bg-[#0A0E1A]">
                  {METRIC_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setMetricFocus(opt.key)}
                      className={cn(
                        "font-display cursor-pointer px-3 py-1.5 text-xs transition",
                        metricFocus === opt.key
                          ? "bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_14px_rgba(245,184,61,0.4)]"
                          : "text-[#9AA6C4] hover:text-[#22D3EE]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#22D3EE]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari hero di tier list..."
                  className="w-full border border-[#22D3EE]/30 bg-[#0A0E1A] py-1.5 pr-8 pl-9 text-xs text-[#E6EAF5] placeholder:text-[#9AA6C4]/70 outline-none focus:border-[#F5B83D]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Hapus pencarian"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9AA6C4] hover:text-[#F5B83D]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MODE 1: SINGLE UNIFIED RESPONSIVE TIER BOARD (tanpa duplikasi DOM) */}
          {viewMode === "tier-board" ? (
            <div className="space-y-3.5">
              {filteredHeroes.length === 0 ? (
                <div className="border border-dashed border-[#22D3EE]/30 bg-[#0A0E1A] p-8 text-center text-xs text-[#9AA6C4]">
                  Tidak ada hero yang cocok dengan kombinasi filter saat ini.
                </div>
              ) : (
                META_TIERS.map((grade) => {
                  const heroesInTier = tierBuckets[grade];
                  const style = TIER_STYLES[grade];
                  const isMobileOpen = mobileOpenTiers[grade];

                  return (
                    <div
                      key={grade}
                      style={{
                        contentVisibility: "auto",
                        containIntrinsicSize: "0 180px",
                      }}
                      className="flex flex-col sm:min-h-[132px] sm:flex-row"
                    >
                      {/* Mobile Accordion Header (< sm) */}
                      <button
                        type="button"
                        onClick={() => toggleMobileTier(grade)}
                        aria-expanded={isMobileOpen}
                        className={cn(
                          "mlbb-card flex h-14 w-full cursor-pointer items-center gap-3.5 pr-4 text-left sm:hidden",
                          style.borderColor,
                        )}
                      >
                        <span
                          className={cn(
                            "font-display flex h-14 w-14 shrink-0 items-center justify-center text-3xl font-extrabold",
                            style.flagBg,
                          )}
                        >
                          {style.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-display block text-lg leading-tight text-[#E6EAF5]">
                            {heroesInTier.length} Hero
                          </span>
                          <span className="text-[11px] text-[#9AA6C4]">
                            {style.subtitle}
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-[#22D3EE] transition-transform",
                            isMobileOpen ? "rotate-180" : "",
                          )}
                          aria-hidden="true"
                        />
                      </button>

                      {/* Desktop Angled Tier Flag (sm+) */}
                      <div
                        className={cn(
                          "mlbb-tier-flag font-display hidden w-28 shrink-0 flex-col items-center justify-center pr-3 sm:flex",
                          style.flagBg,
                          style.glow,
                        )}
                      >
                        <span className="text-6xl leading-none font-extrabold">
                          {style.label}
                        </span>
                        <span className="mt-1 text-[10px] tracking-widest opacity-85">
                          {heroesInTier.length} HERO
                        </span>
                      </div>

                      {/* Single Shared Hero Grid (responsive mobile toggle, always open on desktop) */}
                      <div
                        className={cn(
                          "mlbb-card flex-1 p-3.5",
                          style.borderColor,
                          isMobileOpen ? "block" : "hidden sm:block",
                        )}
                      >
                        {heroesInTier.length === 0 ? (
                          <p className="py-4 text-xs text-[#9AA6C4]">
                            Tidak ada hero di Tier {grade} pada filter ini.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {heroesInTier.map((hero) => {
                              const primaryRoleCode =
                                ROLE_CODES[hero.roles[0] ?? ""] ?? "ML";
                              const metricVal = (
                                hero[metricFocus] * 100
                              ).toFixed(metricFocus === "pickRate" ? 2 : 1);

                              return (
                                <Link
                                  key={`${grade}-${hero.heroSlug}`}
                                  href={`/heroes/${hero.heroSlug}`}
                                  className="group flex items-center gap-2.5 border border-white/12 bg-[#0A0E1A] p-2 transition hover:-translate-y-0.5 hover:border-[#F5B83D]/70 hover:bg-[#15203E]"
                                >
                                  <div className="relative shrink-0">
                                    <HeroPortrait
                                      slug={hero.heroSlug}
                                      name={hero.heroName}
                                      className="h-11 w-10 shrink-0"
                                    />
                                    <span className="font-display absolute top-0.5 left-0.5 border border-[#22D3EE]/50 bg-[#0A0E1A]/90 px-1 text-[9px] leading-tight text-[#22D3EE]">
                                      {primaryRoleCode}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="font-display truncate text-sm leading-tight text-[#E6EAF5] group-hover:text-[#F5B83D]">
                                        {hero.heroName}
                                      </p>
                                      {typeof hero.tierDelta === "number" &&
                                        hero.tierDelta !== 0 && (
                                          <span
                                            title={
                                              hero.tierDelta > 0
                                                ? `Naik ${hero.tierDelta} tier dibanding snapshot lalu`
                                                : `Turun ${Math.abs(hero.tierDelta)} tier dibanding snapshot lalu`
                                            }
                                            className={cn(
                                              "font-display shrink-0 text-[10px]",
                                              hero.tierDelta > 0
                                                ? "text-[#4ADE80]"
                                                : "text-[#FB7185]",
                                            )}
                                          >
                                            {hero.tierDelta > 0 ? "▲" : "▼"}
                                          </span>
                                        )}
                                    </div>
                                    <p
                                      className={cn(
                                        "font-display mt-0.5 text-base leading-none",
                                        style.textAccent,
                                      )}
                                    >
                                      {metricVal}%
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
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
                <span className="font-display inline-flex items-center gap-1 text-[#9AA6C4]">
                  <ArrowUpDown className="h-3.5 w-3.5 text-[#22D3EE]" /> Urutkan:
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
                    className={cn(
                      "px-3 py-1 text-xs cursor-pointer",
                      sortField === col.id ? "mlbb-pill-active" : "mlbb-pill",
                    )}
                  >
                    {col.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto border border-[#22D3EE]/25">
                <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="font-display border-b border-[#F5B83D]/30 bg-[#0A0E1A] text-xs text-[#9AA6C4]">
                      <th className="py-3 pr-2 pl-4">#</th>
                      <th className="px-3 py-3">Hero</th>
                      <th className="px-3 py-3">Tier</th>
                      <th className="px-3 py-3 text-right">Win Rate</th>
                      <th className="px-3 py-3 text-right">Pick Rate</th>
                      <th className="px-3 py-3 text-right">Ban Rate</th>
                      <th className="px-3 py-3 text-right">Skor Meta</th>
                      <th className="py-3 pr-4 pl-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-[#101830]">
                    {sortedForTable.slice(0, 30).map((hero, idx) => (
                      <tr
                        key={hero.heroSlug}
                        className="transition hover:bg-[#15203E]"
                      >
                        <td className="font-display py-2.5 pr-2 pl-4 text-sm text-[#F5B83D]">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/heroes/${hero.heroSlug}`}
                            className="flex items-center gap-2.5 font-bold text-[#E6EAF5] hover:text-[#F5B83D]"
                          >
                            <HeroPortrait
                              slug={hero.heroSlug}
                              name={hero.heroName}
                              className="h-9 w-8 shrink-0"
                            />
                            <div>
                              <p className="font-display text-sm">
                                {hero.heroName}
                              </p>
                              <p className="text-[10px] font-normal text-[#9AA6C4]">
                                {hero.roles.join("/")} ·{" "}
                                {hero.lanes[0] ?? "Fleksibel"}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "font-display inline-flex h-7 w-7 items-center justify-center text-sm font-black",
                              TIER_STYLES[hero.tier].flagBg,
                            )}
                          >
                            {hero.tier}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "font-display px-3 py-2.5 text-right text-sm",
                            hero.winRate >= 0.52
                              ? "text-[#4ADE80]"
                              : hero.winRate < 0.48
                                ? "text-[#FB7185]"
                                : "text-[#F5B83D]",
                          )}
                        >
                          {formatPercent(hero.winRate)}
                        </td>
                        <td className="font-display px-3 py-2.5 text-right text-sm text-[#22D3EE]">
                          {formatPercent(hero.pickRate)}
                        </td>
                        <td className="font-display px-3 py-2.5 text-right text-sm text-[#FB7185]">
                          {formatPercent(hero.banRate)}
                        </td>
                        <td className="font-display px-3 py-2.5 text-right text-sm text-[#F5B83D]">
                          {hero.metaScore}
                        </td>
                        <td className="py-2.5 pr-4 pl-3 text-right">
                          <Link
                            href={`/builds/${hero.heroSlug}`}
                            className="font-display inline-flex items-center gap-1 border border-[#22D3EE]/35 bg-[#0A0E1A] px-2.5 py-1 text-xs text-[#22D3EE] transition hover:border-[#F5B83D] hover:text-[#F5B83D]"
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
                <p className="text-center text-[11px] text-[#9AA6C4]">
                  Menampilkan 30 peringkat teratas dari {sortedForTable.length}{" "}
                  hero. Gunakan filter Role/Lane atau pencarian untuk melihat
                  hero lainnya.
                </p>
              )}
            </div>
          )}

          {/* Transparansi Metodologi & Sumber Resmi */}
          <details className="border border-[#22D3EE]/20 bg-[#0A0E1A] p-3.5 text-xs text-[#9AA6C4]">
            <summary className="font-display flex cursor-pointer items-center gap-2 text-sm text-[#E6EAF5] hover:text-[#F5B83D]">
              <Info className="h-4 w-4 text-[#22D3EE]" aria-hidden="true" />
              <span>Metodologi Tier List S–D &amp; Sumber Data Resmi</span>
            </summary>
            <div className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed">
              <p>
                <strong className="text-[#F5B83D]">Fakta Resmi (Tier 1):</strong>{" "}
                Seluruh angka Win Rate, Pick Rate, dan Ban Rate diambil langsung
                dari {sourceName} (diperbarui {updatedDateText}).
              </p>
              <p>
                <strong className="text-[#22D3EE]">
                  Analisis Berbasis Riset (Tier S–D):
                </strong>{" "}
                Skor Meta dihitung secara deterministik dari normalisasi z-score
                (55% Win Rate + 25% Ban Rate + 20% Pick Rate) lalu dibagi ke
                Tier S (Top 15%), A (15%–38%), B (38%–66%), C (66%–86%), dan D
                (14% terbawah). Saat memilih 1 Role tertentu, tier diseimbangkan
                relatif terhadap seluruh hero di Role tersebut.
              </p>
            </div>
          </details>
        </Surface>
      </div>
    </div>
  );
}
