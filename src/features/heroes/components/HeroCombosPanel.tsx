"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import type { HeroComboCollection } from "../types/hero-combo.types";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatVerificationStatusId } from "@/lib/i18n/labels";

type Props = {
  collection: HeroComboCollection;
};

function formatComboTypeLabel(type: string): string {
  switch (type.toLowerCase()) {
    case "teamfight":
      return "Teamfight";
    case "laning":
      return "Laning / Farming";
    default:
      return type;
  }
}

export function HeroCombosPanel({ collection }: Props) {
  const [activeStepByCombo, setActiveStepByCombo] = useState<
    Record<string, number>
  >({});

  return (
    <section aria-labelledby="hero-combos-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-300" aria-hidden="true" />
          <h2
            id="hero-combos-heading"
            className="text-xl font-bold text-slate-100"
          >
            Kombo Skill {collection.heroName}
          </h2>
          <Badge tone="neutral">
            {formatVerificationStatusId(collection.verificationStatus)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {collection.skillUpgradePriority && (
            <Badge tone="gold">
              Prioritas Upgrade Skill: {collection.skillUpgradePriority}
            </Badge>
          )}
          <a
            href={collection.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-300 hover:underline"
          >
            Sumber: {collection.sourceName}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {collection.combos.map((combo) => {
          const activeStepIdx = activeStepByCombo[combo.id] ?? 0;
          const activeStep = combo.steps[activeStepIdx] ?? combo.steps[0];

          return (
            <Surface
              key={combo.id}
              elevated
              className="flex flex-col justify-between space-y-4 p-5"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge tone="blue">
                      {formatComboTypeLabel(combo.type)}
                    </Badge>
                    <h3 className="mt-2 text-base font-bold text-white">
                      {combo.title}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {combo.steps.length} langkah
                  </span>
                </div>

                {/* Urutan Ikon Skill Interaktif (Klik untuk simulasi langkah) */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#1E2738] bg-[#080B10] p-3">
                  {combo.steps.map((step, idx) => {
                    const selected = idx === activeStepIdx;
                    return (
                      <div
                        key={`${combo.id}-step-${step.stepNumber}`}
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveStepByCombo((prev) => ({
                              ...prev,
                              [combo.id]: idx,
                            }))
                          }
                          aria-pressed={selected}
                          className={cn(
                            "group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition",
                            selected
                              ? "border-amber-400 bg-amber-500/15"
                              : "border-transparent hover:border-slate-700 hover:bg-slate-900",
                          )}
                        >
                          <div className="relative">
                            {step.iconUrl ? (
                              <Image
                                src={step.iconUrl}
                                alt={step.skillName}
                                width={44}
                                height={44}
                                unoptimized
                                className="h-11 w-11 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-200">
                                {step.slotLabel}
                              </div>
                            )}
                            <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                              {step.stepNumber}
                            </span>
                          </div>
                          <span className="max-w-[64px] truncate text-[10px] font-medium text-slate-300">
                            {step.slotLabel}
                          </span>
                        </button>

                        {idx < combo.steps.length - 1 && (
                          <ArrowRight
                            className="h-3.5 w-3.5 shrink-0 text-slate-600"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Penjelasan Umum Kombo */}
                <p className="text-sm leading-relaxed text-slate-300">
                  {combo.description}
                </p>

                {/* Sorotan Langkah Terpilih */}
                {activeStep && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-200">
                        Langkah {activeStep.stepNumber}: {activeStep.skillName} (
                        {activeStep.slotLabel})
                      </span>
                      {activeStep.cooldownSeconds !== null && (
                        <span className="text-[11px] text-slate-400">
                          CD: {activeStep.cooldownSeconds}s
                        </span>
                      )}
                    </div>
                    {activeStep.description ? (
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-300">
                        {activeStep.description}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Sisipkan {activeStep.skillName} pada titik urutan ini
                        untuk memaksimalkan damage/pasif hero.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#1E2738] pt-3">
                <span className="text-[11px] text-slate-500">
                  Klik ikon langkah atau gunakan tombol simulasi
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveStepByCombo((prev) => ({
                      ...prev,
                      [combo.id]:
                        ((prev[combo.id] ?? 0) + 1) % combo.steps.length,
                    }))
                  }
                  className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25"
                >
                  Langkah Berikutnya →
                </button>
              </div>
            </Surface>
          );
        })}
      </div>
    </section>
  );
}
