"use client";

import { Sparkles } from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { cn } from "@/lib/cn";
import type {
  DraftActionType,
  DraftRecommendation,
  DraftSide,
} from "../types/draft.types";

interface DraftRecommendationStripProps {
  recommendations: DraftRecommendation[];
  action: DraftActionType;
  side: DraftSide;
  selectedSlug: string | null;
  disabled: boolean;
  onSelect: (slug: string) => void;
  onQuickLock: (slug: string) => void;
}

export function DraftRecommendationStrip({
  recommendations,
  action,
  side,
  selectedSlug,
  disabled,
  onSelect,
  onQuickLock,
}: DraftRecommendationStripProps) {
  if (recommendations.length === 0) return null;

  const isBan = action === "BAN";

  return (
    <div className="border border-[#F5B83D]/35 bg-[#101830] p-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#F5B83D]" aria-hidden="true" />
          <h3 className="font-display text-xs tracking-wide text-[#F5B83D]">
            {isBan
              ? `ASISTEN BAN — ${side === "BLUE" ? "BLUE SIDE" : "RED SIDE"}`
              : `ASISTEN PICK — ${side === "BLUE" ? "BLUE SIDE" : "RED SIDE"}`}
          </h3>
        </div>
        <span className="text-[10px] text-[#9AA6C4]">
          Klik untuk pratinjau · Klik ganda untuk langsung kunci
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const isSelected = selectedSlug === rec.hero.slug;
          return (
            <button
              key={rec.hero.slug}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(rec.hero.slug)}
              onDoubleClick={() => onQuickLock(rec.hero.slug)}
              className={cn(
                "flex items-center gap-2.5 border p-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-[#F5B83D] bg-[#F5B83D]/15 shadow-[0_0_12px_rgba(245,184,61,0.3)]"
                  : "border-white/10 bg-[#0A0E1A] hover:border-[#22D3EE]/60",
              )}
            >
              <HeroPortrait
                slug={rec.hero.slug}
                name={rec.hero.name}
                className="h-10 w-10 shrink-0 border border-white/15"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-display text-xs text-[#E6EAF5]">
                    {rec.hero.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 px-1.5 py-0.5 font-display text-[9px]",
                      isBan
                        ? "bg-[#E11D48]/20 text-[#FDA4AF]"
                        : "bg-[#22D3EE]/15 text-[#22D3EE]",
                    )}
                  >
                    {rec.primaryTag}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-[#9AA6C4]">
                  {rec.reasons[0]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
