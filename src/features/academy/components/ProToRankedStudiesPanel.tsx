"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Globe2, ShieldAlert } from "lucide-react";
import {
  PRO_TO_RANKED_STUDIES,
  filterStudiesByModeAndRating,
  type AdaptationRating,
  type RankedModeId,
} from "../index";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Props = {
  selectedMode: RankedModeId;
  selectedModeLabel: string;
};

const RATING_LABELS: Record<AdaptationRating, string> = {
  RECOMMENDED: "Direkomendasikan",
  CONDITIONAL: "Kondisional",
  HIGH_RISK: "Risiko Tinggi",
  NOT_RECOMMENDED: "Jangan Ditiru Mentah",
};

const RATING_FILTERS: ReadonlyArray<AdaptationRating | "ALL"> = [
  "ALL",
  "RECOMMENDED",
  "CONDITIONAL",
  "HIGH_RISK",
  "NOT_RECOMMENDED",
];

function getRatingTone(
  rating: AdaptationRating,
): "emerald" | "blue" | "amber" | "gold" {
  switch (rating) {
    case "RECOMMENDED":
      return "emerald";
    case "CONDITIONAL":
      return "blue";
    case "HIGH_RISK":
      return "gold";
    case "NOT_RECOMMENDED":
      return "amber";
  }
}

export function ProToRankedStudiesPanel({
  selectedMode,
  selectedModeLabel,
}: Props) {
  const [ratingFilter, setRatingFilter] = useState<AdaptationRating | "ALL">(
    "ALL",
  );

  const filteredStudies = useMemo(
    () =>
      filterStudiesByModeAndRating(
        PRO_TO_RANKED_STUDIES,
        selectedMode,
        ratingFilter,
      ),
    [selectedMode, ratingFilter],
  );

  return (
    <section aria-labelledby="pro-to-ranked-heading" className="space-y-4">
      <Surface elevated className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Globe2 className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <h2
                id="pro-to-ranked-heading"
                className="text-base font-semibold text-slate-100"
              >
                Adaptasi Strategi Turnamen Global untuk {selectedModeLabel}
              </h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Setiap taktik dari panggung MPL, MSC, MCC, MTC, dan MCT diuji dengan{" "}
              <strong className="text-slate-200">5 pertanyaan wajib</strong>: bukti
              eksekusi pro, alasan keberhasilan, syarat kondisi, kelayakan Ranked, dan risiko per
              ukuran party.
            </p>
          </div>
          <Badge tone="blue">STRATEGIC INTERPRETATION</Badge>
        </div>

        {/* Filter Rating Kelayakan */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Filter kelayakan:</span>
          {RATING_FILTERS.map((filter) => {
            const active = ratingFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setRatingFilter(filter)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                  active
                    ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                    : "border-[#1E2738] bg-[#0B0F17] text-slate-400 hover:text-slate-200",
                )}
              >
                {filter === "ALL" ? "Semua" : RATING_LABELS[filter]}
              </button>
            );
          })}
        </div>

        {filteredStudies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E2738] bg-[#0A0E16] p-5 text-center text-xs text-slate-400">
            Tidak ada studi adaptasi dengan status kelayakan tersebut untuk{" "}
            {selectedModeLabel}. Coba pilih filter &quot;Semua&quot;.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudies.map((study) => {
              const modeDetail = study.modeAdaptations[selectedMode];

              return (
                <article
                  key={study.id}
                  className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {study.title}
                        </h3>
                        <Badge tone={getRatingTone(modeDetail.rating)}>
                          {selectedModeLabel}: {RATING_LABELS[modeDetail.rating]}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Sirkuit rujukan: {study.tournamentCircuits.join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="neutral">
                        Koordinasi:{" "}
                        {study.coordinationRequirement.replaceAll("_", " ")}
                      </Badge>
                      <Badge tone="blue">{study.verificationStatus}</Badge>
                    </div>
                  </div>

                  {/* Panduan Langsung untuk Mode Terpilih */}
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[#1E2738] bg-[#080B10] p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Cara Menerapkan di {selectedModeLabel}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {modeDetail.howToExecute}
                      </p>
                    </div>

                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Risiko Spesifik di {selectedModeLabel}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {modeDetail.risks}
                      </p>
                      {modeDetail.safeAlternative && (
                        <p className="mt-2 border-t border-amber-500/20 pt-2 text-[11px] leading-relaxed text-amber-200">
                          <strong>Alternatif Aman:</strong>{" "}
                          {modeDetail.safeAlternative}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Perbandingan Rating Lintas 4 Mode */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-slate-500">Kelayakan 4 Mode:</span>
                    {(
                      [
                        ["SOLO", "Solo"],
                        ["DUO", "Duo"],
                        ["TRIO", "Trio"],
                        ["FIVE_MAN", "5-Man"],
                      ] as const
                    ).map(([modeKey, label]) => (
                      <span
                        key={modeKey}
                        className={cn(
                          "rounded border px-2 py-0.5",
                          modeKey === selectedMode
                            ? "border-amber-400/60 bg-amber-500/15 font-semibold text-amber-200"
                            : "border-[#1E2738] bg-[#080B10] text-slate-400",
                        )}
                      >
                        {label}: {RATING_LABELS[study.modeAdaptations[modeKey].rating]}
                      </span>
                    ))}
                  </div>

                  {/* Detail 5 Pertanyaan Inti (AGENTS.md §4) */}
                  <details className="mt-3 border-t border-[#1E2738] pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-amber-300 hover:text-amber-200">
                      Bedah 5 Pertanyaan Inti Pro-to-Ranked &amp; Sumber Turnamen
                    </summary>
                    <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-300">
                      <div>
                        <p className="font-semibold text-slate-100">
                          1. Apa yang dilakukan tim profesional? (Bukti Pengamatan)
                        </p>
                        <p className="mt-1 text-slate-400">
                          {study.observedProExecution}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">
                          2. Mengapa strategi tersebut berhasil? (Interpretasi Strategis)
                        </p>
                        <p className="mt-1 text-slate-400">{study.whyItWorks}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">
                          3. Kondisi yang wajib terpenuhi (Syarat Pelaksanaan)
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-400">
                          {study.requiredConditions.map((cond) => (
                            <li key={cond}>{cond}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">
                          4. Uji Realisme Ranked (Pemeriksaan Adaptasi)
                        </p>
                        <p className="mt-1 text-slate-400">
                          {study.rankedRealismCheck}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#1E2738] bg-[#080B10] p-3 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                          <span>Batasan &amp; Rujukan Turnamen</span>
                        </div>
                        <p className="mt-1">{study.limitations}</p>
                        <p className="mt-1 text-slate-500">
                          Catatan Patch: {study.referencePatchNote}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {study.references.map((ref) =>
                            ref.url ? (
                              <a
                                key={`${study.id}-${ref.label}`}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                              >
                                {ref.label} ({ref.region})
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            ) : (
                              <span
                                key={`${study.id}-${ref.label}`}
                                className="text-slate-500"
                              >
                                {ref.label} ({ref.region})
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </Surface>
    </section>
  );
}
