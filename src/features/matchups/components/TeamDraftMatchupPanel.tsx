"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { HeroRecord } from "@/features/heroes";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { ShareLinkButton } from "@/components/shared/ShareLinkButton";
import { cn } from "@/lib/cn";
import { HeroPickerModal } from "./HeroPickerModal";
import {
  MATCHUP_LANES,
  type MatchupLane,
  type TeamDraftAnalysisPayload,
  type TeamSlotInput,
} from "../types/matchup-hub.types";

type TeamApiResponse =
  | {
      success: true;
      teamAnalysis: TeamDraftAnalysisPayload;
    }
  | {
      success: false;
      error: string;
    };

type Props = {
  heroes: HeroRecord[];
  patchVersion: string;
  onInspectLane1v1: (heroA: string, heroB: string) => void;
};

type TeamTab = "composition" | "lanes" | "threats";

const EMPTY_SLOTS = (): Record<MatchupLane, string | null> => ({
  "EXP Lane": null,
  Jungle: null,
  "Mid Lane": null,
  "Gold Lane": null,
  Roam: null,
});

const SAMPLE_ALLY: Record<MatchupLane, string | null> = {
  "EXP Lane": "Yu Zhong",
  Jungle: "Fanny",
  "Mid Lane": "Luo Yi",
  "Gold Lane": "Claude",
  Roam: "Tigreal",
};

const SAMPLE_ENEMY: Record<MatchupLane, string | null> = {
  "EXP Lane": "Terizla",
  Jungle: "Fredrinn",
  "Mid Lane": "Pharsa",
  "Gold Lane": "Lesley",
  Roam: "Khufra",
};

const PILLAR_TONE = {
  STRONG: "emerald",
  ADEQUATE: "amber",
  MISSING: "rose",
} as const;

const PILLAR_TEXT = {
  STRONG: "Kuat",
  ADEQUATE: "Cukup",
  MISSING: "Kurang",
} as const;

export function TeamDraftMatchupPanel({
  heroes,
  patchVersion,
  onInspectLane1v1,
}: Props) {
  const [allyMap, setAllyMap] = useState<Record<MatchupLane, string | null>>(
    EMPTY_SLOTS,
  );
  const [enemyMap, setEnemyMap] = useState<Record<MatchupLane, string | null>>(
    EMPTY_SLOTS,
  );
  const [pickerTarget, setPickerTarget] = useState<{
    side: "ALLY" | "ENEMY";
    lane: MatchupLane;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TeamTab>("composition");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<TeamDraftAnalysisPayload | null>(
    null,
  );

  const heroByLowerName = useMemo(() => {
    const map = new Map<string, HeroRecord>();
    for (const h of heroes) {
      map.set(h.metadata.name.toLowerCase(), h);
    }
    return map;
  }, [heroes]);

  const heroBySlug = useMemo(() => {
    const map = new Map<string, HeroRecord>();
    for (const h of heroes) {
      map.set(h.metadata.slug.toLowerCase(), h);
    }
    return map;
  }, [heroes]);

  // Pulihkan komposisi 5v5 dari URL (?mode=5v5&ally=...&enemy=...)
  const [urlHydrated, setUrlHydrated] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const parseTeam = (raw: string | null) => {
        const slots = EMPTY_SLOTS();
        if (!raw) return slots;
        raw.split(",").forEach((token, idx) => {
          const lane = MATCHUP_LANES[idx];
          const clean = token.trim().toLowerCase();
          if (!lane || !clean) return;
          const match = heroBySlug.get(clean) ?? heroByLowerName.get(clean);
          if (match) slots[lane] = match.metadata.name;
        });
        return slots;
      };
      if (params.has("ally")) setAllyMap(parseTeam(params.get("ally")));
      if (params.has("enemy")) setEnemyMap(parseTeam(params.get("enemy")));
    } catch {
      // Abaikan bila URL tidak valid
    }
    setUrlHydrated(true);
  }, [heroByLowerName, heroBySlug]);

  const buildSharePath = () => {
    const serialize = (map: Record<MatchupLane, string | null>) =>
      MATCHUP_LANES.map((lane) => {
        const name = map[lane];
        if (!name) return "";
        return heroByLowerName.get(name.toLowerCase())?.metadata.slug ?? name;
      }).join(",");

    const params = new URLSearchParams();
    params.set("mode", "5v5");
    if (Object.values(allyMap).some(Boolean)) {
      params.set("ally", serialize(allyMap));
    }
    if (Object.values(enemyMap).some(Boolean)) {
      params.set("enemy", serialize(enemyMap));
    }
    return `/matchups?${params.toString()}`;
  };

  useEffect(() => {
    if (!urlHydrated || typeof window === "undefined") return;
    const hasAlly = Object.values(allyMap).some(Boolean);
    const hasEnemy = Object.values(enemyMap).some(Boolean);
    if (!hasAlly && !hasEnemy) {
      window.history.replaceState(null, "", "/matchups?mode=5v5");
      return;
    }
    const serialize = (map: Record<MatchupLane, string | null>) =>
      MATCHUP_LANES.map((lane) => {
        const name = map[lane];
        if (!name) return "";
        return heroByLowerName.get(name.toLowerCase())?.metadata.slug ?? name;
      }).join(",");
    const params = new URLSearchParams();
    params.set("mode", "5v5");
    if (hasAlly) params.set("ally", serialize(allyMap));
    if (hasEnemy) params.set("enemy", serialize(enemyMap));
    window.history.replaceState(null, "", `/matchups?${params.toString()}`);
  }, [allyMap, enemyMap, urlHydrated, heroByLowerName]);

  const allyCount = Object.values(allyMap).filter(Boolean).length;
  const enemyCount = Object.values(enemyMap).filter(Boolean).length;

  const allTakenNames = useMemo(
    () =>
      [...Object.values(allyMap), ...Object.values(enemyMap)].filter(
        (v): v is string => Boolean(v),
      ),
    [allyMap, enemyMap],
  );

  useEffect(() => {
    if (allyCount === 0 && enemyCount === 0) {
      setAnalysis(null);
      setError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    const allySlots: TeamSlotInput[] = MATCHUP_LANES.map((lane) => ({
      lane,
      heroName: allyMap[lane],
    }));
    const enemySlots: TeamSlotInput[] = MATCHUP_LANES.map((lane) => ({
      lane,
      heroName: enemyMap[lane],
    }));

    fetch("/api/matchups/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allySlots, enemySlots }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as TeamApiResponse;
        if (!res.ok || !data.success) {
          throw new Error(
            data.success ? "Gagal menganalisis draft tim." : data.error,
          );
        }
        setAnalysis(data.teamAnalysis);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAnalysis(null);
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menganalisis matchup tim 5v5.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [allyMap, enemyMap, allyCount, enemyCount]);

  const handleSetSlot = (
    side: "ALLY" | "ENEMY",
    lane: MatchupLane,
    heroName: string | null,
  ) => {
    if (side === "ALLY") {
      setAllyMap((prev) => ({ ...prev, [lane]: heroName }));
    } else {
      setEnemyMap((prev) => ({ ...prev, [lane]: heroName }));
    }
  };

  const handleSwapTeams = () => {
    setAllyMap(enemyMap);
    setEnemyMap(allyMap);
  };

  const handleLoadSample = () => {
    setAllyMap({ ...SAMPLE_ALLY });
    setEnemyMap({ ...SAMPLE_ENEMY });
  };

  const handleReset = () => {
    setAllyMap(EMPTY_SLOTS());
    setEnemyMap(EMPTY_SLOTS());
    setAnalysis(null);
    setError("");
  };

  const renderTeamSlot = (side: "ALLY" | "ENEMY", lane: MatchupLane) => {
    const heroName = side === "ALLY" ? allyMap[lane] : enemyMap[lane];
    const hero = heroName
      ? heroByLowerName.get(heroName.toLowerCase())
      : undefined;
    const roles = hero ? (HERO_ROLE_MAP[hero.metadata.slug] ?? []) : [];

    const accentClass =
      side === "ALLY"
        ? "border-sky-500/35 bg-sky-500/5 hover:border-sky-400"
        : "border-rose-500/35 bg-rose-500/5 hover:border-rose-400";

    if (!hero) {
      return (
        <button
          type="button"
          onClick={() => setPickerTarget({ side, lane })}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-[#0B0F17] px-3 text-xs text-slate-400 transition hover:border-amber-400/60 hover:text-amber-200"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Pilih {lane}</span>
        </button>
      );
    }

    return (
      <div
        className={cn(
          "flex h-14 items-center gap-2.5 rounded-xl border px-2.5 transition",
          accentClass,
        )}
      >
        <button
          type="button"
          onClick={() => setPickerTarget({ side, lane })}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <HeroPortrait
            slug={hero.metadata.slug}
            name={hero.metadata.name}
            className="h-10 w-9 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">
              {hero.metadata.name}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {roles.join("/") || "Hero"}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleSetSlot(side, lane, null)}
          aria-label={`Hapus ${hero.metadata.name} dari ${lane}`}
          className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Draft Board 5v5 */}
      <Surface elevated className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">
              Simulasi Matchup &amp; Komposisi Tim (5v5)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Susun draft Tim Kita vs Tim Musuh per lane untuk mengaudit
              keseimbangan damage, kelengkapan peran, ancaman lawan, dan saran
              pick pengisi slot kosong.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Patch {patchVersion || "Aktif"}</Badge>
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-[#F5B83D] transition hover:bg-emerald-500/25"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Contoh Draft 5v5
            </button>
            <button
              type="button"
              onClick={handleSwapTeams}
              disabled={allyCount === 0 && enemyCount === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-400 hover:text-white disabled:opacity-40"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              Tukar Tim
            </button>
            {(allyCount > 0 || enemyCount > 0) && (
              <>
                <ShareLinkButton
                  label="Bagikan Draft 5v5"
                  copiedLabel="Link Draft Disalin!"
                  getUrl={buildSharePath}
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Column Titles */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7.5rem_1fr] sm:items-center">
          <div className="flex items-center justify-between rounded-lg bg-sky-500/10 px-3 py-1.5">
            <span className="text-xs font-bold text-sky-300">
              Tim Kita (Biru)
            </span>
            <span className="text-[11px] font-semibold text-sky-200">
              {allyCount}/5
            </span>
          </div>
          <div className="hidden text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:block">
            Posisi Lane
          </div>
          <div className="flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-1.5">
            <span className="text-xs font-bold text-rose-300">
              Tim Musuh (Merah)
            </span>
            <span className="text-[11px] font-semibold text-rose-200">
              {enemyCount}/5
            </span>
          </div>
        </div>

        {/* 5 Lane Rows */}
        <div className="space-y-2.5">
          {MATCHUP_LANES.map((lane) => {
            const allyName = allyMap[lane];
            const enemyName = enemyMap[lane];
            return (
              <div
                key={lane}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7.5rem_1fr] sm:items-center"
              >
                {renderTeamSlot("ALLY", lane)}

                <div className="flex flex-row items-center justify-between rounded-lg bg-[#0A0E1A] px-2.5 py-1.5 sm:flex-col sm:justify-center sm:gap-1 sm:py-2">
                  <span className="text-[11px] font-bold text-slate-300">
                    {lane}
                  </span>
                  {allyName && enemyName ? (
                    <button
                      type="button"
                      onClick={() => onInspectLane1v1(allyName, enemyName)}
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-300 hover:underline"
                    >
                      Bedah 1v1 <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-600">VS</span>
                  )}
                </div>

                {renderTeamSlot("ENEMY", lane)}
              </div>
            );
          })}
        </div>
      </Surface>

      {isLoading && (
        <Surface className="p-6 text-center">
          <p role="status" className="text-sm font-medium text-amber-300">
            Mengaudit komposisi tim, interaksi per lane, dan ancaman musuh...
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

      {analysis && !isLoading && (
        <Surface className="space-y-5 p-4 sm:p-5">
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Analisis Matchup Tim 5v5"
            className="flex flex-wrap gap-2 border-b border-[#22D3EE]/25 pb-3"
          >
            {(
              [
                {
                  id: "composition",
                  label: "Audit Komposisi & Perbandingan",
                },
                {
                  id: "lanes",
                  label: `Duel Per-Lane & Saran Pick (${analysis.allySuggestions.length})`,
                },
                {
                  id: "threats",
                  label: `Ancaman & Item Counter (${analysis.recommendedTeamItems.length})`,
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

          {/* TAB 1: Composition Audit & Team Comparison */}
          {activeTab === "composition" && (
            <div className="space-y-5">
              {/* Dual Team Comparison Bars */}
              <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Perbandingan Kapasitas Mekanik Tim
                  </h3>
                  <Badge tone="amber">Jumlah Skill Terdeteksi</Badge>
                </div>
                <div className="space-y-2.5">
                  {(
                    [
                      {
                        label: "Hard CC",
                        a: analysis.allyAudit.totals.hardControl,
                        b: analysis.enemyAudit.totals.hardControl,
                      },
                      {
                        label: "Mobilitas",
                        a: analysis.allyAudit.totals.mobility,
                        b: analysis.enemyAudit.totals.mobility,
                      },
                      {
                        label: "Pertahanan",
                        a: analysis.allyAudit.totals.defense,
                        b: analysis.enemyAudit.totals.defense,
                      },
                      {
                        label: "Sustain / Heal",
                        a: analysis.allyAudit.totals.sustain,
                        b: analysis.enemyAudit.totals.sustain,
                      },
                      {
                        label: "CC Immunity",
                        a: analysis.allyAudit.totals.immunity,
                        b: analysis.enemyAudit.totals.immunity,
                      },
                      {
                        label: "Skill Damage",
                        a: analysis.allyAudit.totals.damageSkills,
                        b: analysis.enemyAudit.totals.damageSkills,
                      },
                    ] as const
                  ).map((row) => {
                    const max = Math.max(row.a, row.b, 5);
                    return (
                      <div
                        key={row.label}
                        className="grid grid-cols-[2rem_1fr_7.5rem_1fr_2rem] items-center gap-2 text-xs"
                      >
                        <span className="text-right font-bold text-sky-300">
                          {row.a}
                        </span>
                        <div className="flex h-2.5 justify-end overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{
                              width: `${Math.round((row.a / max) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-center text-[11px] text-slate-300">
                          {row.label}
                        </span>
                        <div className="flex h-2.5 justify-start overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-rose-400"
                            style={{
                              width: `${Math.round((row.b / max) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-left font-bold text-rose-300">
                          {row.b}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6-Pillar Audit Tim Kita */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    Audit 6 Pilar Komposisi Tim Kita ({analysis.allyAudit.filledSlots}/5)
                  </h3>
                  <Badge tone="neutral">
                    Physical: {analysis.allyAudit.damageMix.physicalHeroes} ·
                    Magic: {analysis.allyAudit.damageMix.magicHeroes} · True:{" "}
                    {analysis.allyAudit.damageMix.trueDamageHeroes}
                  </Badge>
                </div>

                {analysis.allyAudit.warnings.length > 0 && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-rose-200">
                      <AlertTriangle className="h-4 w-4" />
                      Peringatan Celah Draft Tim Kita
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-100/90">
                      {analysis.allyAudit.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {analysis.allyAudit.pillars.map((pillar) => (
                    <div
                      key={pillar.id}
                      className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white">
                          {pillar.label}
                        </p>
                        <Badge tone={PILLAR_TONE[pillar.status]}>
                          {PILLAR_TEXT[pillar.status]}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                        {pillar.summary}
                      </p>
                      {pillar.contributors.length > 0 && (
                        <p className="mt-2 text-[10px] text-sky-300">
                          Kontributor: {pillar.contributors.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Lane Matrix & Ally Suggestions */}
          {activeTab === "lanes" && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-white">
                  Matriks Duel Per-Lane
                </h3>
                {analysis.laneMatchups.map((row) => (
                  <div
                    key={row.lane}
                    className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge tone="neutral">{row.lane}</Badge>
                        <span className="font-bold text-sky-300">
                          {row.allyHero?.heroName ?? "Belum dipilih"}
                        </span>
                        <span className="text-slate-500">vs</span>
                        <span className="font-bold text-rose-300">
                          {row.enemyHero?.heroName ?? "Belum dipilih"}
                        </span>
                      </div>

                      {row.allyHero && row.enemyHero && (
                        <button
                          type="button"
                          onClick={() =>
                            onInspectLane1v1(
                              row.allyHero!.heroName,
                              row.enemyHero!.heroName,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20"
                        >
                          Bedah 1v1 <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {row.highlights.length > 0 ? (
                      <ul className="mt-2.5 space-y-1 text-[11px] text-slate-400">
                        {row.highlights.map((h, i) => (
                          <li key={i}>• {h}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[11px] text-slate-500">
                        {row.allyHero && row.enemyHero
                          ? "Tidak ada aturan interaksi mekanik langsung yang terdeteksi; buka Bedah 1v1 untuk melihat kombo & item."
                          : "Isi kedua sisi lane ini untuk melihat perbandingan interaksi."}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Open Slot Suggestions */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Saran Pick Pengisi Slot Kosong Tim Kita
                  </h3>
                  <Badge tone="gold">Berbasis Counter &amp; Celah Tim</Badge>
                </div>

                {analysis.allySuggestions.length === 0 ? (
                  <p className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 text-xs text-slate-400">
                    {allyCount >= 5
                      ? "Seluruh 5 slot Tim Kita sudah terisi. Kosongkan salah satu slot untuk melihat saran hero pengganti."
                      : "Pilih minimal 1 hero di Tim Musuh agar sistem dapat merekomendasikan hero pengisi slot kosong."}
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {analysis.allySuggestions.map((sug) => (
                      <div
                        key={`${sug.lane}-${sug.heroSlug}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3.5"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <HeroPortrait
                            slug={sug.heroSlug}
                            name={sug.heroName}
                            className="h-12 w-10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge tone="blue">{sug.lane}</Badge>
                              <p className="text-xs font-bold text-white">
                                {sug.heroName}
                              </p>
                            </div>
                            {sug.counteredEnemies.length > 0 && (
                              <p className="mt-1 text-[11px] text-[#F5B83D]">
                                Respons mekanik terhadap:{" "}
                                {sug.counteredEnemies.join(", ")}
                              </p>
                            )}
                            {sug.fillsGaps.length > 0 && (
                              <p className="mt-0.5 text-[11px] text-amber-300">
                                Menutup celah: {sug.fillsGaps.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleSetSlot("ALLY", sug.lane, sug.heroName)
                          }
                          className="shrink-0 rounded-lg border border-sky-400/50 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/25"
                        >
                          + Pasang
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Enemy Threats & Team Item Counters */}
          {activeTab === "threats" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Peta Ancaman Mekanik Tim Musuh
                </h3>
                {analysis.enemyThreats.length === 0 ? (
                  <p className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 text-xs text-slate-400">
                    Pilih hero pada Tim Musuh untuk memetakan ancaman CC,
                    mobilitas, sustain, dan damage lawan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analysis.enemyThreats.map((threat) => (
                      <div
                        key={threat.mechanic}
                        className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-rose-200">
                            {threat.label}
                          </span>
                          <Badge tone="rose">
                            {threat.heroNames.length} hero · {threat.skillCount}{" "}
                            skill
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Sumber: {threat.heroNames.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Prioritas Item Counter Tim
                </h3>
                {!analysis.itemCatalogAvailable ? (
                  <p className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 text-xs text-slate-400">
                    Katalog item PostgreSQL tidak terhubung saat ini.
                  </p>
                ) : analysis.recommendedTeamItems.length === 0 ? (
                  <p className="rounded-xl border border-slate-800 bg-[#0B0F17] p-4 text-xs text-slate-400">
                    Pilih hero pada Tim Musuh untuk menghitung item counter
                    prioritas tim.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {analysis.recommendedTeamItems.map((item) => (
                      <div
                        key={item.itemSlug}
                        className="flex items-start gap-3 rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-3"
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
                            <Badge tone="emerald">
                              Efektif vs {item.effectiveAgainst.length} musuh
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-amber-300">
                            Target: {item.effectiveAgainst.join(", ")}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-slate-400">
            <strong className="text-[#F5B83D]">
              Status: Belum Diverifikasi ·{" "}
            </strong>
            {analysis.disclaimer}
          </div>
        </Surface>
      )}

      {allyCount === 0 && enemyCount === 0 && (
        <Surface className="p-8 text-center">
          <Users
            className="mx-auto h-7 w-7 text-slate-500"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-semibold text-slate-200">
            Mulai Simulasi Matchup Tim 5v5
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Klik slot lane di atas untuk menyusun draft, atau klik tombol{" "}
            <strong className="text-amber-300">Contoh Draft 5v5</strong> untuk
            langsung mencoba audit komposisi tim dan saran counter pick.
          </p>
        </Surface>
      )}

      <HeroPickerModal
        open={pickerTarget !== null}
        title={
          pickerTarget
            ? `Pilih Hero ${pickerTarget.side === "ALLY" ? "Tim Kita" : "Tim Musuh"} — ${pickerTarget.lane}`
            : "Pilih Hero"
        }
        subtitle="Filter otomatis disetel ke lane pilihan, namun kamu dapat beralih ke Semua Lane untuk flex pick."
        heroes={heroes}
        defaultLane={pickerTarget?.lane ?? "ALL"}
        disabledHeroNames={allTakenNames.filter((n) => {
          if (!pickerTarget) return true;
          const current =
            pickerTarget.side === "ALLY"
              ? allyMap[pickerTarget.lane]
              : enemyMap[pickerTarget.lane];
          return current ? n.toLowerCase() !== current.toLowerCase() : true;
        })}
        onSelect={(hero) => {
          if (pickerTarget) {
            handleSetSlot(
              pickerTarget.side,
              pickerTarget.lane,
              hero.metadata.name,
            );
          }
        }}
        onClose={() => setPickerTarget(null)}
      />
    </div>
  );
}
