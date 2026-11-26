"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { HeroRecord } from "@/features/heroes";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { HeroPickerModal } from "@/features/matchups/components/HeroPickerModal";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatClaimClassificationId } from "@/lib/i18n/labels";
import type { MultiEnemyCounterSummary } from "../engine/multi-enemy-counter";
import { CounterHeroCard } from "./CounterHeroCard";
import { CounterItemCard } from "./CounterItemCard";

type ApiResponse = {
  hero: string;
  heroes: string[];
  summary: MultiEnemyCounterSummary;
  metadata: {
    heroCount: number;
    skillRecordCount: number;
    itemCount: number;
    itemPatchVersion: string;
    itemCatalogAvailable: boolean;
  };
};

type Props = {
  heroes: HeroRecord[];
  patchVersion?: string;
};

type CounterTab = "heroes" | "items" | "tactics";

const POPULAR_TARGETS = [
  "Fanny",
  "Aamon",
  "Khufra",
  "Yu Zhong",
  "Estes",
  "Claude",
] as const;

const SAMPLE_MULTI_DRAFT = ["Fanny", "Estes", "Tigreal"] as const;

const HERO_RULE_OPTIONS = [
  { id: "ALL", label: "Semua Aturan" },
  { id: "CONTROL_RESPONSE", label: "Respons CC" },
  { id: "MOBILITY_CONTROL", label: "Tahan Mobilitas" },
  { id: "SLOW_RESPONSE", label: "Respons Slow" },
  { id: "DAMAGE_RESPONSE", label: "Mitigasi Damage" },
] as const;

const ITEM_RULE_OPTIONS = [
  { id: "ALL", label: "Semua Tipe" },
  { id: "CONTROL_RESPONSE", label: "Respons CC" },
  { id: "DAMAGE_RESPONSE", label: "Mitigasi Damage" },
  { id: "SUSTAIN_RESPONSE", label: "Anti-Sustain" },
] as const;

const MAX_ENEMY_SLOTS = 5;
const PAGE_SIZE = 18;

export function CounterAnalyzerClient({ heroes, patchVersion }: Props) {
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CounterTab>("heroes");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);

  // Hero Counter Filters
  const [heroSearch, setHeroSearch] = useState("");
  const [heroRole, setHeroRole] = useState("ALL");
  const [heroLane, setHeroLane] = useState("ALL");
  const [heroRule, setHeroRule] = useState("ALL");
  const [sameLaneOnly, setSameLaneOnly] = useState(false);
  const [visibleHeroCount, setVisibleHeroCount] = useState(PAGE_SIZE);

  // Item Counter Filters
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategory, setItemCategory] = useState("ALL");
  const [itemRule, setItemRule] = useState("ALL");

  const heroByLowerName = useMemo(() => {
    const map = new Map<string, HeroRecord>();
    for (const h of heroes) {
      map.set(h.metadata.name.toLowerCase(), h);
    }
    return map;
  }, [heroes]);

  useEffect(() => {
    if (selectedEnemies.length === 0) {
      setData(null);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setVisibleHeroCount(PAGE_SIZE);

    fetch("/api/counters/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroes: selectedEnemies }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload: unknown = await res.json();
        if (!res.ok) {
          const msg =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Analisis counter gagal diproses.";
          throw new Error(msg);
        }
        setData(payload as ApiResponse);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setData(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "Terjadi kesalahan saat menganalisis counter.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedEnemies]);

  const handleAddEnemy = (name: string) => {
    setSelectedEnemies((prev) => {
      if (prev.length >= MAX_ENEMY_SLOTS) return prev;
      if (prev.some((item) => item.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleRemoveEnemy = (name: string) => {
    setSelectedEnemies((prev) =>
      prev.filter((item) => item.toLowerCase() !== name.toLowerCase()),
    );
  };

  const resetHeroFilters = () => {
    setHeroSearch("");
    setHeroRole("ALL");
    setHeroLane("ALL");
    setHeroRule("ALL");
    setSameLaneOnly(false);
    setVisibleHeroCount(PAGE_SIZE);
  };

  const resetItemFilters = () => {
    setItemSearch("");
    setItemCategory("ALL");
    setItemRule("ALL");
  };

  const summary = data?.summary ?? null;

  const availableRoles = useMemo(() => {
    if (!summary) return [];
    return [
      ...new Set(summary.heroCounters.flatMap((c) => c.roles)),
    ].sort();
  }, [summary]);

  const availableLanes = useMemo(() => {
    if (!summary) return [];
    return [
      ...new Set(summary.heroCounters.flatMap((c) => c.lanes)),
    ].sort();
  }, [summary]);

  const availableItemCategories = useMemo(() => {
    if (!summary) return [];
    return [
      ...new Set(summary.itemCounters.map((i) => i.itemCategory)),
    ].sort();
  }, [summary]);

  const filteredHeroes = useMemo(() => {
    if (!summary) return [];
    const q = heroSearch.trim().toLowerCase();
    return summary.heroCounters.filter((candidate) => {
      if (q && !candidate.counterHero.toLowerCase().includes(q)) return false;
      if (heroRole !== "ALL" && !candidate.roles.includes(heroRole)) {
        return false;
      }
      if (heroLane !== "ALL" && !candidate.lanes.includes(heroLane)) {
        return false;
      }
      if (
        heroRule !== "ALL" &&
        !candidate.ruleIds.includes(heroRule as (typeof candidate.ruleIds)[number])
      ) {
        return false;
      }
      if (sameLaneOnly && candidate.sameLaneAsTargets.length === 0) {
        return false;
      }
      return true;
    });
  }, [summary, heroSearch, heroRole, heroLane, heroRule, sameLaneOnly]);

  const filteredItems = useMemo(() => {
    if (!summary) return [];
    const q = itemSearch.trim().toLowerCase();
    return summary.itemCounters.filter((item) => {
      if (q && !item.itemName.toLowerCase().includes(q)) return false;
      if (itemCategory !== "ALL" && item.itemCategory !== itemCategory) {
        return false;
      }
      if (
        itemRule !== "ALL" &&
        !item.ruleIds.includes(itemRule as (typeof item.ruleIds)[number])
      ) {
        return false;
      }
      return true;
    });
  }, [summary, itemSearch, itemCategory, itemRule]);

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition",
      active
        ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-200"
        : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:border-[#2C3E4B] hover:text-slate-200",
    );

  return (
    <div className="space-y-6">
      {/* Enemy Selector Board (1–5 Hero Lawan) */}
      <Surface elevated className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">
              Pilih Hero Lawan (1 hingga 5 Hero)
            </h2>
            <p className="mt-0.5 text-xs text-[#9FB0BE]">
              Pilih 1 hero untuk counter langsung, atau tambahkan hingga 5 hero
              musuh sekaligus untuk menemukan hero &amp; item counter terbaik bagi
              seluruh draft lawan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {patchVersion && (
              <Badge tone="emerald">Patch {patchVersion}</Badge>
            )}
            <button
              type="button"
              onClick={() => {
                resetHeroFilters();
                resetItemFilters();
                setSelectedEnemies([...SAMPLE_MULTI_DRAFT]);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Contoh 3 Musuh
            </button>
            {selectedEnemies.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEnemies([]);
                  resetHeroFilters();
                  resetItemFilters();
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#243440] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 5 Enemy Slots */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {Array.from({ length: MAX_ENEMY_SLOTS }).map((_, idx) => {
            const enemyName = selectedEnemies[idx];
            const hero = enemyName
              ? heroByLowerName.get(enemyName.toLowerCase())
              : undefined;

            if (hero) {
              return (
                <div
                  key={hero.entityId}
                  className="flex items-center gap-2.5 rounded-xl border border-rose-500/35 bg-rose-500/5 p-2.5"
                >
                  <HeroPortrait
                    slug={hero.metadata.slug}
                    name={hero.metadata.name}
                    className="h-11 w-10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {hero.metadata.name}
                    </p>
                    <p className="text-[10px] text-rose-300">
                      Musuh #{idx + 1}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEnemy(hero.metadata.name)}
                    aria-label={`Hapus ${hero.metadata.name}`}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }

            const isNextSlot = idx === selectedEnemies.length;
            return (
              <button
                key={`empty-slot-${idx}`}
                type="button"
                onClick={() => setPickerOpen(true)}
                className={cn(
                  "flex h-16 items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 text-xs transition",
                  isNextSlot
                    ? "border-emerald-400/55 bg-emerald-500/10 font-semibold text-emerald-200 hover:bg-emerald-500/15"
                    : "border-[#243440] bg-[#0B1014] text-slate-500 hover:border-emerald-400/40 hover:text-slate-300",
                )}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isNextSlot ? "Pilih Musuh" : `Slot #${idx + 1}`}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Picks */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#1E2A33] pt-3">
          <span className="text-[11px] font-semibold text-slate-400">
            Target Populer:
          </span>
          {POPULAR_TARGETS.map((name) => {
            const picked = selectedEnemies.some(
              (s) => s.toLowerCase() === name.toLowerCase(),
            );
            return (
              <button
                key={name}
                type="button"
                disabled={picked || selectedEnemies.length >= MAX_ENEMY_SLOTS}
                onClick={() => handleAddEnemy(name)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                  picked
                    ? "border-rose-500/35 bg-rose-500/10 text-rose-200 opacity-70"
                    : "border-[#243440] bg-[#0B1014] text-slate-300 hover:border-emerald-400/50 hover:text-emerald-200 disabled:opacity-40",
                )}
              >
                {picked ? `✓ ${name}` : `+ ${name}`}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
          >
            {error}
          </div>
        )}
      </Surface>

      {/* Loading */}
      {loading && (
        <Surface className="p-8 text-center">
          <p role="status" className="text-sm font-medium text-emerald-300">
            Memetakan ancaman skill dan menyusun peringkat Hero &amp; Item
            Counter...
          </p>
        </Surface>
      )}

      {/* Results */}
      {summary && !loading && (
        <div className="space-y-5">
          {/* Peta Ancaman Lawan */}
          <Surface className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className="h-4 w-4 text-rose-400"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-white">
                  Peta Ancaman Lawan (
                  {summary.targets.map((t) => t.heroName).join(" + ")})
                </h3>
              </div>
              <Badge tone="neutral">
                {summary.threatGroups.length} jenis ancaman terdeteksi
              </Badge>
            </div>

            {summary.threatGroups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summary.threatGroups.slice(0, 10).map((threat) => (
                  <div
                    key={threat.mechanic}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#243440] bg-[#0B1014] px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-rose-200">
                      {threat.label}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({threat.enemyHeroes.join(", ")})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Belum terdeteksi teks ancaman mekanik spesifik pada deskripsi
                skill target.
              </p>
            )}
          </Surface>

          {/* 3-Tab Counter Panel */}
          <Surface className="space-y-5 p-4 sm:p-5">
            <div
              role="tablist"
              aria-label="Hasil Counter Pick"
              className="flex flex-wrap gap-2 border-b border-[#1E2A33] pb-3.5"
            >
              {(
                [
                  {
                    id: "heroes",
                    label: `Hero Counter (${filteredHeroes.length})`,
                  },
                  {
                    id: "items",
                    label: `Item Counter (${filteredItems.length})`,
                  },
                  {
                    id: "tactics",
                    label: `Panduan Taktis (${summary.tacticalBrief.length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition",
                    activeTab === tab.id
                      ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-200"
                      : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:text-slate-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: HERO COUNTERS */}
            {activeTab === "heroes" && (
              <div className="space-y-4">
                {/* Clean Pill Filters */}
                <div className="space-y-3 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
                      <input
                        value={heroSearch}
                        onChange={(e) => setHeroSearch(e.target.value)}
                        placeholder="Cari hero counter..."
                        className="w-full rounded-xl border border-[#243440] bg-[#10161B] py-2 pr-3 pl-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/70"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSameLaneOnly((prev) => !prev)}
                      aria-pressed={sameLaneOnly}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
                        sameLaneOnly
                          ? "border-emerald-400/55 bg-emerald-500/15 text-emerald-200"
                          : "border-[#243440] bg-[#10161B] text-slate-300 hover:border-emerald-400/40",
                      )}
                    >
                      {sameLaneOnly
                        ? "✓ Hanya Satu Lane dengan Lawan"
                        : "Filter Satu Lane dengan Lawan"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Lane:
                    </span>
                    <button
                      type="button"
                      onClick={() => setHeroLane("ALL")}
                      className={pillClass(heroLane === "ALL")}
                    >
                      Semua
                    </button>
                    {availableLanes.map((lane) => (
                      <button
                        key={lane}
                        type="button"
                        onClick={() => setHeroLane(lane)}
                        className={pillClass(heroLane === lane)}
                      >
                        {lane}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Role:
                    </span>
                    <button
                      type="button"
                      onClick={() => setHeroRole("ALL")}
                      className={pillClass(heroRole === "ALL")}
                    >
                      Semua
                    </button>
                    {availableRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setHeroRole(role)}
                        className={pillClass(heroRole === role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Aturan:
                      </span>
                      {HERO_RULE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setHeroRule(opt.id)}
                          className={pillClass(heroRule === opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {(heroSearch ||
                      heroRole !== "ALL" ||
                      heroLane !== "ALL" ||
                      heroRule !== "ALL" ||
                      sameLaneOnly) && (
                      <button
                        type="button"
                        onClick={resetHeroFilters}
                        className="text-xs font-semibold text-emerald-300 hover:underline"
                      >
                        Reset filter
                      </button>
                    )}
                  </div>
                </div>

                {filteredHeroes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#243440] p-8 text-center">
                    <p className="text-sm font-semibold text-slate-200">
                      Tidak ada hero counter yang cocok dengan filter ini
                    </p>
                    <button
                      type="button"
                      onClick={resetHeroFilters}
                      className="mt-3 rounded-xl border border-emerald-400/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
                    >
                      Reset Filter Hero
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                      {filteredHeroes
                        .slice(0, visibleHeroCount)
                        .map((candidate, index) => (
                          <CounterHeroCard
                            key={candidate.id}
                            candidate={candidate}
                            totalTargets={summary.targets.length}
                            rank={index + 1}
                          />
                        ))}
                    </div>

                    {visibleHeroCount < filteredHeroes.length && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleHeroCount((prev) => prev + PAGE_SIZE)
                          }
                          className="rounded-xl border border-[#243440] bg-[#0B1014] px-5 py-2.5 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/10"
                        >
                          Tampilkan Lebih Banyak (
                          {filteredHeroes.length - visibleHeroCount} tersisa)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: ITEM COUNTERS */}
            {activeTab === "items" && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
                    <input
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Cari nama item counter..."
                      className="w-full rounded-xl border border-[#243440] bg-[#10161B] py-2 pr-3 pl-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/70"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Kategori:
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemCategory("ALL")}
                      className={pillClass(itemCategory === "ALL")}
                    >
                      Semua
                    </button>
                    {availableItemCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setItemCategory(cat)}
                        className={pillClass(itemCategory === cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Tipe:
                      </span>
                      {ITEM_RULE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setItemRule(opt.id)}
                          className={pillClass(itemRule === opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {(itemSearch ||
                      itemCategory !== "ALL" ||
                      itemRule !== "ALL") && (
                      <button
                        type="button"
                        onClick={resetItemFilters}
                        className="text-xs font-semibold text-emerald-300 hover:underline"
                      >
                        Reset filter
                      </button>
                    )}
                  </div>
                </div>

                {!data?.metadata.itemCatalogAvailable ? (
                  <div className="rounded-xl border border-dashed border-[#243440] p-8 text-center text-xs text-slate-400">
                    Katalog item PostgreSQL tidak terhubung saat ini sehingga
                    rekomendasi item counter belum dapat dimuat.
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#243440] p-8 text-center text-xs text-slate-400">
                    Tidak ada item counter yang cocok dengan filter saat ini.
                  </div>
                ) : (
                  <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                      <CounterItemCard
                        key={item.id}
                        candidate={item}
                        totalTargets={summary.targets.length}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TACTICAL BRIEF & SOURCES */}
            {activeTab === "tactics" && (
              <div className="space-y-4">
                {summary.tacticalBrief.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {summary.tacticalBrief.map((tip) => (
                      <div
                        key={tip.id}
                        className="rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="flex items-center gap-1.5 text-sm font-bold text-white">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            {tip.title}
                          </h4>
                          <Badge tone="neutral">
                            {formatClaimClassificationId(tip.basis)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-200">
                          {tip.recommendation}
                        </p>
                        <p className="mt-2 text-[11px] text-[#9FB0BE]">
                          Dasar deteksi: {tip.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Tambahkan hero lawan dengan ancaman spesifik untuk melihat
                    panduan taktis otomatis.
                  </p>
                )}

                <div className="rounded-xl border border-[#1E2A33] bg-[#0B1014] p-4 text-xs leading-relaxed text-[#9FB0BE]">
                  <p className="font-bold text-white">
                    Transparansi Sumber &amp; Metodologi
                  </p>
                  <p className="mt-1.5">
                    Dataset skill: {data?.metadata.heroCount ?? 133} hero (
                    {data?.metadata.skillRecordCount ?? 622} record skill) ·
                    Katalog item: {data?.metadata.itemCount ?? 0} item (Patch{" "}
                    {data?.metadata.itemPatchVersion || "N/A"}).
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {summary.disclaimer}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-[#9FB0BE]">
              <strong className="text-emerald-300">
                Status: Belum Diverifikasi ·{" "}
              </strong>
              {summary.disclaimer}
            </div>
          </Surface>
        </div>
      )}

      {/* Empty State */}
      {selectedEnemies.length === 0 && (
        <Surface className="p-9 text-center">
          <p className="text-sm font-semibold text-slate-100">
            Pilih minimal 1 hero lawan untuk melihat rekomendasi counter
          </p>
          <p className="mt-1.5 text-xs text-[#9FB0BE]">
            Klik tombol <strong className="text-emerald-300">+ Pilih Musuh</strong>{" "}
            di atas, pilih dari target populer, atau coba simulasi{" "}
            <strong className="text-emerald-300">Contoh 3 Musuh</strong> untuk
            melihat pemeringkatan counter multi-hero.
          </p>
        </Surface>
      )}

      <HeroPickerModal
        open={pickerOpen}
        title={`Pilih Hero Lawan (${selectedEnemies.length}/${MAX_ENEMY_SLOTS})`}
        subtitle="Cari berdasarkan nama atau filter Role & Lane — kamu dapat menambahkan hingga 5 hero musuh sekaligus."
        heroes={heroes}
        disabledHeroNames={selectedEnemies}
        onSelect={(hero) => handleAddEnemy(hero.metadata.name)}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
