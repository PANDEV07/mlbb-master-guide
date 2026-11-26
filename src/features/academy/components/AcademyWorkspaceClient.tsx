"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Compass,
  Lightbulb,
  Target,
  Users,
} from "lucide-react";
import {
  GLOBAL_ESPORTS_REFERENCE_STATS,
  RANKED_CONTEXTS,
  filterTipsByPhase,
  type GameplayPhaseId,
  type RankedModeId,
} from "../index";
import { ProToRankedStudiesPanel } from "./ProToRankedStudiesPanel";
import { SevenDimensionMatrixPanel } from "./SevenDimensionMatrixPanel";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Props = {
  livePatchVersion: string | null;
  liveSeasonLabel: string | null;
};

const PHASE_OPTIONS: ReadonlyArray<{
  id: GameplayPhaseId | "ALL";
  label: string;
}> = [
  { id: "ALL", label: "Semua Fase" },
  { id: "DRAFT", label: "Draft & Pick" },
  { id: "EARLY", label: "Early (0–5 mnt)" },
  { id: "MID", label: "Mid (5–12 mnt)" },
  { id: "LATE", label: "Late & Lord (12+ mnt)" },
];

const PHASE_LABELS: Record<GameplayPhaseId, string> = {
  DRAFT: "Draft & Pick",
  EARLY: "Early Game (0–5 Menit)",
  MID: "Mid Game (5–12 Menit)",
  LATE: "Late Game & Lord (12+ Menit)",
};

export function AcademyWorkspaceClient({
  livePatchVersion,
  liveSeasonLabel,
}: Props) {
  const [selectedMode, setSelectedMode] = useState<RankedModeId>("SOLO");
  const [selectedPhase, setSelectedPhase] = useState<GameplayPhaseId | "ALL">(
    "ALL",
  );

  const activeContext = useMemo(
    () =>
      RANKED_CONTEXTS.find((ctx) => ctx.id === selectedMode) ??
      RANKED_CONTEXTS[0],
    [selectedMode],
  );

  const filteredTips = useMemo(
    () => filterTipsByPhase(activeContext.tips, selectedPhase),
    [activeContext, selectedPhase],
  );

  return (
    <div className="space-y-6">
      {/* Konteks Rujukan Turnamen Global & Patch */}
      <Surface className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-200">
              Rujukan Ekosistem Turnamen Global ({GLOBAL_ESPORTS_REFERENCE_STATS.totalAuditedEvents2026} Event 2026 di {GLOBAL_ESPORTS_REFERENCE_STATS.totalRegions} Kawasan)
            </p>
            <p className="text-xs text-slate-400">
              {GLOBAL_ESPORTS_REFERENCE_STATS.majorCircuits.join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">
              Patch Live: {livePatchVersion ?? "Belum tercatat"}
            </Badge>
            {liveSeasonLabel && (
              <Badge tone="neutral">{liveSeasonLabel}</Badge>
            )}
          </div>
        </div>
      </Surface>

      {/* Selector 4 Mode Ranked */}
      <section aria-label="Pilih Mode Bermain Ranked" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RANKED_CONTEXTS.map((ctx) => {
          const active = ctx.id === selectedMode;
          return (
            <button
              key={ctx.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelectedMode(ctx.id);
                setSelectedPhase("ALL");
              }}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                active
                  ? "border-amber-400/70 bg-amber-500/10"
                  : "border-[#22D3EE]/25 bg-[#0E1420] hover:border-slate-600",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {ctx.shortLabel}
                </span>
                <Users
                  className={cn(
                    "h-4 w-4",
                    active ? "text-amber-300" : "text-slate-500",
                  )}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-amber-200/90">
                {ctx.coordinationLabel}
              </p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {ctx.focusSummary}
              </p>
            </button>
          );
        })}
      </section>

      {/* Profil & Aturan Emas Mode Terpilih */}
      <Surface elevated className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Compass className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <h2 className="text-base font-semibold text-white">
                {activeContext.title}
              </h2>
            </div>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-300">
              {activeContext.focusSummary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{activeContext.draftControlLabel}</Badge>
            <Badge tone="neutral">{activeContext.riskProfileLabel}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sinergi &amp; Pendekatan Ideal</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {activeContext.idealSynergyNote}
            </p>
          </div>

          <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F5B83D]">
              <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
              <span>3 Aturan Emas {activeContext.shortLabel}</span>
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-300">
              {activeContext.goldenRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </Surface>

      {/* Tips & Trik Per Fase */}
      <section aria-labelledby="tips-heading" className="space-y-4">
        <Surface className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="tips-heading"
                className="text-base font-semibold text-slate-100"
              >
                Tips &amp; Trik Praktis {activeContext.shortLabel} (Per Fase Permainan)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Langkah eksekusi konkret beserta kesalahan paling sering yang harus dihindari.
              </p>
            </div>
            <Badge tone="blue">{filteredTips.length} panduan</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {PHASE_OPTIONS.map((option) => {
              const active = selectedPhase === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedPhase(option.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                      : "border-[#22D3EE]/25 bg-[#0B0F17] text-slate-400 hover:text-slate-200",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredTips.map((tip) => (
              <article
                key={tip.id}
                className="flex flex-col justify-between rounded-xl border border-[#22D3EE]/25 bg-[#0B0F17] p-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone="gold">{PHASE_LABELS[tip.phase]}</Badge>
                    {tip.recommendedRoles && (
                      <span className="text-[11px] text-slate-400">
                        {tip.recommendedRoles}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {tip.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      {tip.principle}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F5B83D]">
                      Langkah Eksekusi
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-300">
                      {tip.actionSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Kesalahan Umum yang Harus Dihindari</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {tip.commonMistake}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Surface>
      </section>

      {/* Studi Adaptasi Strategi Turnamen Global → Ranked */}
      <ProToRankedStudiesPanel
        selectedMode={selectedMode}
        selectedModeLabel={activeContext.shortLabel}
      />

      {/* Matriks 7 Dimensi Ranked */}
      <SevenDimensionMatrixPanel selectedMode={selectedMode} />
    </div>
  );
}
