"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Swords,
} from "lucide-react";
import type { HeroRecord } from "@/features/heroes";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatClaimClassificationId } from "@/lib/i18n/labels";
import { HeroPickerModal } from "./HeroPickerModal";
import {
  MECHANIC_DIMENSIONS,
  type EnrichedHeadToHeadData,
  type MatchupItemRecommendation,
} from "../types/matchup-hub.types";

type MatchupDirection = {
  ruleId: string;
  ruleLabel: string;
  skillPairCount: number;
  uniqueSourceSkills: number;
  uniqueTargetSkills: number;
  supportingSkillPairs: {
    sourceSkill: string;
    sourceSkillId: string | number | null;
    sourceDescription: string;
    sourceGroupId: string | number;
    targetSkill: string;
    targetSkillId: string | number | null;
    targetDescription: string;
    targetGroupId: string | number;
    evidence: {
      sourceCategories: string[];
      targetCategories: string[];
      sourceTags: string[];
      targetTags: string[];
    };
  }[];
  conditionsToCheck: string[];
  explanation: string;
  verificationStatus: "UNVERIFIED";
};

type MatchupAnalysisPayload = {
  heroA: string;
  heroB: string;
  aToB: MatchupDirection[];
  bToA: MatchupDirection[];
  summary: {
    aToBInteractions: number;
    bToAInteractions: number;
    totalSkillPairs: number;
  };
  verificationStatus: "UNVERIFIED";
  disclaimer: string;
};

type ApiResponse =
  | {
      success: true;
      analysis: MatchupAnalysisPayload;
      enriched: EnrichedHeadToHeadData;
    }
  | {
      success: false;
      error: string;
    };

type Props = {
  heroes: HeroRecord[];
  patchVersion: string;
  heroAName: string;
  heroBName: string;
  onChangeHeroA: (name: string) => void;
  onChangeHeroB: (name: string) => void;
};

const POPULAR_PRESETS: Array<{ label: string; a: string; b: string }> = [
  { label: "Fanny vs Khufra", a: "Fanny", b: "Khufra" },
  { label: "Aamon vs Saber", a: "Aamon", b: "Saber" },
  { label: "Yu Zhong vs Terizla", a: "Yu Zhong", b: "Terizla" },
  { label: "Claude vs Lesley", a: "Claude", b: "Lesley" },
  { label: "Luo Yi vs Pharsa", a: "Luo Yi", b: "Pharsa" },
];

const RULE_LABELS: Record<string, string> = {
  CONTROL_RESPONSE: "Respons CC",
  DAMAGE_RESPONSE: "Mitigasi Damage",
  SUSTAIN_RESPONSE: "Anti-Sustain",
};

type TabId = "interactions" | "skills" | "items" | "phases";

export function HeadToHeadMatchupPanel({
  heroes,
  patchVersion,
  heroAName,
  heroBName,
  onChangeHeroA,
  onChangeHeroB,
}: Props) {
  const [pickerSide, setPickerSide] = useState<"A" | "B" | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("interactions");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    analysis: MatchupAnalysisPayload;
    enriched: EnrichedHeadToHeadData;
  } | null>(null);

  const heroA = heroes.find(
    (h) => h.metadata.name.toLowerCase() === heroAName.toLowerCase(),
  );
  const heroB = heroes.find(
    (h) => h.metadata.name.toLowerCase() === heroBName.toLowerCase(),
  );

  useEffect(() => {
    if (!heroA || !heroB) {
      setResult(null);
      setError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    fetch("/api/matchups/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroA: heroA.metadata.name,
        heroB: heroB.metadata.name,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as ApiResponse;
        if (!res.ok || !data.success) {
          throw new Error(data.success ? "Gagal memuat analisis." : data.error);
        }
        setResult({ analysis: data.analysis, enriched: data.enriched });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult(null);
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menganalisis matchup.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [heroA, heroB]);

  const handleSwap = () => {
    const prevA = heroAName;
    onChangeHeroA(heroBName);
    onChangeHeroB(prevA);
  };

  const handleReset = () => {
    onChangeHeroA("");
    onChangeHeroB("");
    setResult(null);
    setError("");
  };

  const renderSlotCard = (
    side: "A" | "B",
    hero: HeroRecord | undefined,
    accent: "sky" | "rose",
  ) => {
    const roles = hero ? (HERO_ROLE_MAP[hero.metadata.slug] ?? []) : [];
    const lanes = hero ? (HERO_LANE_MAP[hero.metadata.slug] ?? []) : [];
    const borderAccent =
      accent === "sky"
        ? "border-sky-500/40 bg-sky-500/5 hover:border-sky-400"
        : "border-rose-500/40 bg-rose-500/5 hover:border-rose-400";

    return (
      <div
        className={cn(
          "rounded-2xl border p-4 transition",
          hero ? borderAccent : "border-dashed border-slate-700 bg-[#0B0F17]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              accent === "sky" ? "text-sky-300" : "text-rose-300",
            )}
          >
            {side === "A" ? "Hero A (Sisi Biru)" : "Hero B (Sisi Merah)"}
          </span>
          {hero && (
            <button
              type="button"
              onClick={() => setPickerSide(side)}
              className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-amber-400 hover:text-white"
            >
              Ganti Hero
            </button>
          )}
        </div>

        {hero ? (
          <div className="mt-3 flex items-center gap-3.5">
            <HeroPortrait
              slug={hero.metadata.slug}
              name={hero.metadata.name}
              className="h-20 w-16 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-white">
                {hero.metadata.name}
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <Badge key={r} tone="blue">
                    {r}
                  </Badge>
                ))}
                {lanes.map((l) => (
                  <Badge key={l} tone="neutral">
                    {l}
                  </Badge>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-3 text-[11px]">
                <Link
                  href={`/heroes/${hero.metadata.slug}`}
                  className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                >
                  Profil Hero <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href={`/builds/${hero.metadata.slug}`}
                  className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                >
                  Build Template <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPickerSide(side)}
            className="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/80 py-6 text-center transition hover:border-amber-400/70 hover:bg-amber-500/5"
          >
            <Swords className="h-6 w-6 text-slate-500" aria-hidden="true" />
            <span className="mt-2 text-xs font-semibold text-slate-200">
              Pilih {side === "A" ? "Hero A" : "Hero B"}
            </span>
            <span className="mt-0.5 text-[11px] text-slate-500">
              Filter berdasarkan Role, Lane, atau Nama
            </span>
          </button>
        )}
      </div>
    );
  };

  const renderItemList = (
    title: string,
    items: MatchupItemRecommendation[],
    catalogAvailable: boolean,
  ) => (
    <div className="space-y-3 rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <Badge tone="neutral">{items.length} kandidat</Badge>
      </div>

      {!catalogAvailable ? (
        <p className="text-xs text-slate-400">
          Katalog item PostgreSQL tidak terhubung saat ini sehingga rekomendasi
          item counter belum dapat dimuat.
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400">
          Tidak ditemukan kandidat item counter langsung dari bukti mekanik
          deskripsi skill lawan.
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.itemSlug}
              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0F1420] p-3"
            >
              {item.itemIconUrl ? (
                <Image
                  src={item.itemIconUrl}
                  alt={item.itemName}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-lg border border-amber-500/30 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
                  {item.itemName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-xs font-bold text-white">
                    {item.itemName}
                  </p>
                  <Badge tone="gold">{item.itemCategory}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.ruleIds.map((rule) => (
                    <span
                      key={rule}
                      className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                    >
                      {RULE_LABELS[rule] ?? rule}
                    </span>
                  ))}
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    {item.evidenceCount} bukti mekanik
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  {item.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* VS Arena Selector */}
      <Surface elevated className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">
              Arena Duel Satu Lawan Satu (1v1)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Pilih dua hero untuk membandingkan kapabilitas mekanik, interaksi
              skill, kombo, dan rekomendasi item counter secara otomatis.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Patch {patchVersion || "Aktif"}</Badge>
            {(heroAName || heroBName) && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          {renderSlotCard("A", heroA, "sky")}

          <div className="flex flex-row items-center justify-center gap-2 md:flex-col">
            <span className="text-sm font-black tracking-widest text-amber-400">
              VS
            </span>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!heroAName && !heroBName}
              title="Tukar posisi Hero A dan Hero B"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-[#0B0F17] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-amber-400 hover:text-amber-200 disabled:opacity-40"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              Tukar
            </button>
          </div>

          {renderSlotCard("B", heroB, "rose")}
        </div>

        {/* Preset Populer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#22D3EE]/25 pt-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            Contoh Duel Cepat:
          </span>
          {POPULAR_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChangeHeroA(preset.a);
                onChangeHeroB(preset.b);
              }}
              className="rounded-full border border-[#263247] bg-[#0B0F17] px-3 py-1 text-[11px] font-medium text-slate-300 transition hover:border-amber-400/60 hover:text-amber-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Surface>

      {/* Loading & Error */}
      {isLoading && (
        <Surface className="p-6 text-center">
          <p role="status" className="text-sm font-medium text-amber-300">
            Memproses profil mekanik, interaksi skill, kombo, dan item counter...
          </p>
        </Surface>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300"
        >
          {error}
        </div>
      )}

      {/* Enriched Results */}
      {result && !isLoading && (
        <div className="space-y-5">
          {/* Overview Metrics & 8-Dimension Capability Bars */}
          <Surface className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  Perbandingan Profil Mekanik
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Jumlah skill yang memiliki kategori mekanik pada dataset
                  kandidat (bukan prediksi win rate).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.enriched.sharedLanes.length > 0 ? (
                  <Badge tone="emerald">
                    Duel Satu Lane: {result.enriched.sharedLanes.join(", ")}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Duel Lintas Lane</Badge>
                )}
                <Badge tone="amber">Belum Diverifikasi · Kandidat Mekanik</Badge>
              </div>
            </div>

            {/* Summary KPI Row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Tipe Damage {result.enriched.profileA.heroName}
                </p>
                <p className="mt-1 text-sm font-bold text-sky-300">
                  {result.enriched.profileA.damageProfile}
                </p>
              </div>
              <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Aturan A → B / B → A
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {result.analysis.summary.aToBInteractions} /{" "}
                  {result.analysis.summary.bToAInteractions}
                </p>
              </div>
              <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Total Pasangan Interaksi
                </p>
                <p className="mt-1 text-sm font-bold text-amber-300">
                  {result.analysis.summary.totalSkillPairs}
                </p>
              </div>
              <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Tipe Damage {result.enriched.profileB.heroName}
                </p>
                <p className="mt-1 text-sm font-bold text-rose-300">
                  {result.enriched.profileB.damageProfile}
                </p>
              </div>
            </div>

            {/* Mirrored 8-Dimension Mechanic Bars */}
            <div className="space-y-2.5">
              {MECHANIC_DIMENSIONS.map((dim) => {
                const countA =
                  result.enriched.profileA.dimensionCounts[dim.key];
                const countB =
                  result.enriched.profileB.dimensionCounts[dim.key];
                const maxVal = Math.max(countA, countB, 4);
                const pctA = Math.round((countA / maxVal) * 100);
                const pctB = Math.round((countB / maxVal) * 100);

                return (
                  <div
                    key={dim.key}
                    className="grid grid-cols-[2rem_1fr_7.5rem_1fr_2rem] items-center gap-2 text-xs"
                  >
                    <span className="text-right font-bold text-sky-300">
                      {countA}
                    </span>
                    <div className="flex h-2.5 justify-end overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all"
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                    <span className="text-center text-[11px] font-medium text-slate-300">
                      {dim.label}
                    </span>
                    <div className="flex h-2.5 justify-start overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-rose-400 transition-all"
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                    <span className="text-left font-bold text-rose-300">
                      {countB}
                    </span>
                  </div>
                );
              })}
            </div>
          </Surface>

          {/* 4-Tab Detail Panel */}
          <Surface className="space-y-4 p-4 sm:p-5">
            <div
              role="tablist"
              aria-label="Detail Analisis Matchup 1v1"
              className="flex flex-wrap gap-2 border-b border-[#22D3EE]/25 pb-3"
            >
              {(
                [
                  {
                    id: "interactions",
                    label: `Interaksi Mekanik (${result.analysis.summary.totalSkillPairs})`,
                  },
                  {
                    id: "skills",
                    label: "Skill & Kombo Duel",
                  },
                  {
                    id: "items",
                    label: `Item Counter (${result.enriched.itemRecommendations.forAAgainstB.length + result.enriched.itemRecommendations.forBAgainstA.length})`,
                  },
                  {
                    id: "phases",
                    label: "Checklist Fase Duel",
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
                    "rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                    activeTab === tab.id
                      ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
                      : "border-[#22D3EE]/25 bg-[#0A0E1A] text-slate-400 hover:text-slate-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Interactions */}
            {activeTab === "interactions" && (
              <div className="space-y-5">
                {/* Control vs Immunity Evidence Highlights */}
                {(result.enriched.controlVsImmunity.aToB.length > 0 ||
                  result.enriched.controlVsImmunity.bToA.length > 0) && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert
                        className="h-4 w-4 text-amber-300"
                        aria-hidden="true"
                      />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                        Interaksi Kunci: Hard CC vs Control Immunity
                      </h4>
                    </div>
                    <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                      {[
                        ...result.enriched.controlVsImmunity.aToB,
                        ...result.enriched.controlVsImmunity.bToA,
                      ]
                        .slice(0, 6)
                        .map((pair) => (
                          <div
                            key={pair.id}
                            className="rounded-lg border border-[#263247] bg-[#0B0F17] p-3 text-xs"
                          >
                            <p className="font-semibold text-white">
                              {pair.sourceHero} ({pair.sourceSkill}) →{" "}
                              {pair.targetHero} ({pair.targetSkill})
                            </p>
                            <p className="mt-1 text-[11px] text-amber-300">
                              {pair.sourceMechanics.join(", ")} vs{" "}
                              {pair.targetMechanics.join(", ")}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    {
                      title: `${result.analysis.heroA} → ${result.analysis.heroB}`,
                      accent: "text-sky-300",
                      items: result.analysis.aToB,
                    },
                    {
                      title: `${result.analysis.heroB} → ${result.analysis.heroA}`,
                      accent: "text-rose-300",
                      items: result.analysis.bToA,
                    },
                  ].map((dir) => (
                    <div key={dir.title} className="space-y-3">
                      <h4 className={cn("text-sm font-bold", dir.accent)}>
                        {dir.title}
                      </h4>
                      {dir.items.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 text-xs text-slate-400">
                          Belum ditemukan kandidat interaksi mekanik langsung
                          pada arah ini.
                        </div>
                      ) : (
                        dir.items.map((item) => (
                          <div
                            key={item.ruleId}
                            className="space-y-3 rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">
                                {item.ruleLabel}
                              </span>
                              <Badge tone="gold">
                                {item.skillPairCount} pasangan skill
                              </Badge>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-400">
                              {item.explanation}
                            </p>
                            <div className="space-y-2">
                              {item.supportingSkillPairs
                                .slice(0, 4)
                                .map((pair, idx) => (
                                  <div
                                    key={`${pair.sourceSkill}-${pair.targetSkill}-${idx}`}
                                    className="rounded-lg border border-slate-800 bg-[#0F1420] p-2.5 text-xs"
                                  >
                                    <p className="font-semibold text-slate-200">
                                      <span className="text-sky-300">
                                        {pair.sourceSkill}
                                      </span>{" "}
                                      <span className="text-slate-500">vs</span>{" "}
                                      <span className="text-amber-300">
                                        {pair.targetSkill}
                                      </span>
                                    </p>
                                    {(pair.sourceDescription ||
                                      pair.targetDescription) && (
                                      <details className="mt-1.5">
                                        <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-200">
                                          Lihat detail teks skill
                                        </summary>
                                        <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-400">
                                          <p>
                                            <strong className="text-sky-300">
                                              {pair.sourceSkill}:
                                            </strong>{" "}
                                            {pair.sourceDescription}
                                          </p>
                                          <p>
                                            <strong className="text-amber-300">
                                              {pair.targetSkill}:
                                            </strong>{" "}
                                            {pair.targetDescription}
                                          </p>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                ))}
                            </div>
                            <details className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                              <summary className="cursor-pointer text-[11px] font-semibold text-amber-300">
                                Kondisi yang wajib diverifikasi (
                                {item.conditionsToCheck.length})
                              </summary>
                              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                                {item.conditionsToCheck.map((c, idx) => (
                                  <li key={idx}>{c}</li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Skills & Combos Side-by-Side */}
            {activeTab === "skills" && (
              <div className="grid gap-5 lg:grid-cols-2">
                {[
                  {
                    name: result.enriched.profileA.heroName,
                    accent: "text-sky-300",
                    groups: result.enriched.skillsA,
                    combos: result.enriched.combosA,
                  },
                  {
                    name: result.enriched.profileB.heroName,
                    accent: "text-rose-300",
                    groups: result.enriched.skillsB,
                    combos: result.enriched.combosB,
                  },
                ].map((side) => (
                  <div key={side.name} className="space-y-4">
                    <h4 className={cn("text-sm font-bold", side.accent)}>
                      {side.name}
                    </h4>

                    {/* Combos */}
                    {side.combos && side.combos.combos.length > 0 && (
                      <div className="space-y-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-amber-200">
                            Kombo Skill ({side.combos.combos.length})
                          </p>
                          {side.combos.skillUpgradePriority && (
                            <Badge tone="gold">
                              Prioritas: {side.combos.skillUpgradePriority}
                            </Badge>
                          )}
                        </div>
                        {side.combos.combos.map((combo) => (
                          <div
                            key={combo.id}
                            className="rounded-lg border border-[#22D3EE]/25 bg-[#0B0F17] p-3"
                          >
                            <p className="text-xs font-semibold text-white">
                              {combo.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {combo.steps.map((step, i) => (
                                <span
                                  key={`${combo.id}-${step.stepNumber}`}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-[#0F1420] px-2 py-1 text-[10px] font-medium text-slate-200"
                                >
                                  <span className="text-amber-300">
                                    {step.slotLabel}
                                  </span>
                                  <span>{step.skillName}</span>
                                  {i < combo.steps.length - 1 && (
                                    <span className="ml-1 text-slate-500">
                                      →
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skill Cards */}
                    <div className="space-y-2.5">
                      {side.groups.flatMap((g) => g.skills).map((skill, idx) => (
                        <div
                          key={`${skill.apiGroupId}-${skill.apiSkillId ?? idx}`}
                          className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3.5"
                        >
                          <div className="flex items-center gap-3">
                            {skill.iconUrl && (
                              <Image
                                src={skill.iconUrl}
                                alt={skill.name}
                                width={40}
                                height={40}
                                unoptimized
                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge tone="gold">{skill.slotLabel}</Badge>
                                {skill.cooldownSeconds !== null && (
                                  <Badge tone="neutral">
                                    CD {skill.cooldownSeconds}s
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs font-bold text-white">
                                {skill.name}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-400">
                            {skill.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Item Counter Duel */}
            {activeTab === "items" && (
              <div className="grid gap-4 lg:grid-cols-2">
                {renderItemList(
                  `Item untuk ${result.enriched.profileA.heroName} melawan ${result.enriched.profileB.heroName}`,
                  result.enriched.itemRecommendations.forAAgainstB,
                  result.enriched.itemRecommendations.catalogAvailable,
                )}
                {renderItemList(
                  `Item untuk ${result.enriched.profileB.heroName} melawan ${result.enriched.profileA.heroName}`,
                  result.enriched.itemRecommendations.forBAgainstA,
                  result.enriched.itemRecommendations.catalogAvailable,
                )}
              </div>
            )}

            {/* TAB 4: Dynamic Phase Checklists */}
            {activeTab === "phases" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Panduan persiapan taktis disusun dari mekanik yang terdeteksi
                  pada kedua hero (klasifikasi{" "}
                  <strong className="text-[#F5B83D]">
                    Interpretasi Strategis
                  </strong>
                  , bukan angka win rate).
                </p>
                {result.enriched.phaseChecklists.map((item) => (
                  <div
                    key={item.phase}
                    className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {item.title}
                      </h4>
                      <Badge tone="neutral">
                        {formatClaimClassificationId(item.basis)}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Fokus {result.enriched.profileA.heroName}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {item.focusForA}
                        </p>
                      </div>
                      <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Fokus {result.enriched.profileB.heroName}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {item.focusForB}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-slate-400">
              <strong className="text-[#F5B83D]">
                Status: Belum Diverifikasi ·{" "}
              </strong>
              {result.analysis.disclaimer}
            </div>
          </Surface>
        </div>
      )}

      {!heroA || !heroB ? (
        <Surface className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-200">
            Pilih Hero A dan Hero B untuk memulai analisis 1v1
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Atau klik salah satu contoh duel cepat di atas untuk langsung melihat
            profil mekanik, kombo, dan rekomendasi item counter.
          </p>
        </Surface>
      ) : null}

      <HeroPickerModal
        open={pickerSide !== null}
        title={
          pickerSide === "A"
            ? "Pilih Hero A (Sisi Biru)"
            : "Pilih Hero B (Sisi Merah)"
        }
        subtitle="Gunakan pencarian atau filter Lane & Role untuk memilih hero dengan cepat."
        heroes={heroes}
        disabledHeroNames={
          pickerSide === "A"
            ? heroBName
              ? [heroBName]
              : []
            : heroAName
              ? [heroAName]
              : []
        }
        onSelect={(hero) => {
          if (pickerSide === "A") onChangeHeroA(hero.metadata.name);
          if (pickerSide === "B") onChangeHeroB(hero.metadata.name);
        }}
        onClose={() => setPickerSide(null)}
      />
    </div>
  );
}
