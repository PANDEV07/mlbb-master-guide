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
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="hero-combos-heading"
            className="mlbb-heading flex items-center gap-2 text-2xl text-[#E6EAF5]"
          >
            <Sparkles className="h-5 w-5 text-[#F5B83D]" aria-hidden="true" />
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
            className="font-display inline-flex items-center gap-1 text-xs text-[#22D3EE] hover:text-[#F5B83D]"
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
                    <h3 className="font-display mt-2 text-xl text-[#E6EAF5]">
                      {combo.title}
                    </h3>
                  </div>
                  <span className="font-display text-xs text-[#F5B83D]">
                    {combo.steps.length} langkah
                  </span>
                </div>

                {/* Urutan Ikon Skill Interaktif */}
                <div className="flex flex-wrap items-center gap-2 border border-[#22D3EE]/25 bg-[#0A0E1A] p-3">
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
                            "group flex cursor-pointer flex-col items-center gap-1 border p-1.5 transition",
                            selected
                              ? "border-[#F5B83D] bg-[#F5B83D]/15 shadow-[0_0_12px_rgba(245,184,61,0.3)]"
                              : "border-transparent hover:border-[#22D3EE]/40 hover:bg-[#101830]",
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
                                className="h-11 w-11 border border-[#22D3EE]/35 object-cover"
                              />
                            ) : (
                              <div className="font-display flex h-11 w-11 items-center justify-center border border-[#F5B83D]/50 bg-[#101830] text-xs text-[#F5B83D]">
                                {step.slotLabel}
                              </div>
                            )}
                            <span className="font-display absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center bg-[#F5B83D] text-[11px] font-bold text-[#0A0E1A]">
                              {step.stepNumber}
                            </span>
                          </div>
                          <span className="font-display max-w-[64px] truncate text-[10px] text-[#E6EAF5]">
                            {step.slotLabel}
                          </span>
                        </button>

                        {idx < combo.steps.length - 1 && (
                          <ArrowRight
                            className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]/60"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Penjelasan Umum Kombo */}
                <p className="text-sm leading-relaxed text-[#E6EAF5]/90">
                  {combo.description}
                </p>

                {/* Sorotan Langkah Terpilih */}
                {activeStep && (
                  <div className="border border-[#F5B83D]/35 bg-[#F5B83D]/8 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-sm text-[#F5B83D]">
                        Langkah {activeStep.stepNumber}: {activeStep.skillName}{" "}
                        ({activeStep.slotLabel})
                      </span>
                      {activeStep.cooldownSeconds !== null && (
                        <span className="font-display text-xs text-[#22D3EE]">
                          CD: {activeStep.cooldownSeconds}s
                        </span>
                      )}
                    </div>
                    {activeStep.description ? (
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#E6EAF5]/85">
                        {activeStep.description}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-[#9AA6C4]">
                        Sisipkan {activeStep.skillName} pada titik urutan ini
                        untuk memaksimalkan damage/pasif hero.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[11px] text-[#9AA6C4]">
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
                  className="mlbb-btn-chamfer font-display cursor-pointer bg-[#F5B83D] px-3.5 py-1.5 text-xs text-[#0A0E1A] transition hover:bg-[#FFC757]"
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
