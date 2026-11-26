"use client";

import { AlertTriangle, Ban, CheckCircle2, Shield } from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { MATCHUP_LANES } from "@/features/matchups/types/matchup-hub.types";
import { cn } from "@/lib/cn";
import type {
  DraftHeroEntry,
  DraftSide,
  DraftTurnSpec,
  TeamLiveAudit,
} from "../types/draft.types";

const TIER_PILL: Record<string, string> = {
  S: "bg-[#F5B83D] text-[#0A0E1A]",
  A: "bg-[#22D3EE] text-[#0A0E1A]",
  B: "bg-[#4ADE80] text-[#0A0E1A]",
  C: "bg-[#94A3B8] text-[#0A0E1A]",
  D: "bg-[#E11D48] text-white",
};

const LANE_SHORT: Record<string, string> = {
  "EXP Lane": "EXP",
  Jungle: "JGL",
  "Mid Lane": "MID",
  "Gold Lane": "GOLD",
  Roam: "ROAM",
};

interface DraftSideColumnProps {
  side: DraftSide;
  bans: (string | null)[];
  picks: (string | null)[];
  heroBySlug: Map<string, DraftHeroEntry>;
  currentTurn: DraftTurnSpec | null;
  pendingHero: DraftHeroEntry | null;
  audit: TeamLiveAudit;
  isAiControlled: boolean;
}

export function DraftSideColumn({
  side,
  bans,
  picks,
  heroBySlug,
  currentTurn,
  pendingHero,
  audit,
  isAiControlled,
}: DraftSideColumnProps) {
  const isBlue = side === "BLUE";
  const accentText = isBlue ? "text-[#22D3EE]" : "text-[#FB7185]";
  const accentBorder = isBlue ? "border-[#22D3EE]/45" : "border-[#E11D48]/50";
  const accentBg = isBlue ? "bg-[#22D3EE]/10" : "bg-[#E11D48]/10";
  const activeSlotRing = isBlue
    ? "border-[#22D3EE] bg-[#22D3EE]/15 shadow-[0_0_16px_rgba(34,211,238,0.35)]"
    : "border-[#FB7185] bg-[#E11D48]/18 shadow-[0_0_16px_rgba(225,29,72,0.38)]";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border bg-[#0E1529] p-3.5",
        accentBorder,
      )}
    >
      {/* Side Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0",
                isBlue
                  ? "bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"
                  : "bg-[#E11D48] shadow-[0_0_8px_#E11D48]",
              )}
            />
            <h2 className={cn("font-display text-lg tracking-wide", accentText)}>
              {isBlue ? "BLUE SIDE" : "RED SIDE"}
            </h2>
          </div>
          <p className="text-[11px] text-[#9AA6C4]">
            {isBlue ? "First Pick · Tim Biru" : "Last Pick · Tim Merah"}
          </p>
        </div>

        <span
          className={cn(
            "font-display border px-2 py-0.5 text-[11px]",
            accentBorder,
            accentBg,
            accentText,
          )}
        >
          {isAiControlled ? "AI DRAFTER" : "MANUAL"}
        </span>
      </div>

      {/* 5 Ban Slots */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#9AA6C4] uppercase">
          <span className="inline-flex items-center gap-1">
            <Ban className="h-3 w-3 text-[#FB7185]" aria-hidden="true" />
            Ban ({bans.filter(Boolean).length}/5)
          </span>
          {currentTurn?.side === side && currentTurn.action === "BAN" && (
            <span className="animate-pulse font-bold text-[#F5B83D]">
              MEMILIH BAN #{currentTurn.slotIndex + 1}
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {bans.map((slug, idx) => {
            const hero = slug ? heroBySlug.get(slug) : null;
            const isActiveBan =
              currentTurn?.side === side &&
              currentTurn.action === "BAN" &&
              currentTurn.slotIndex === idx;
            const previewHero = isActiveBan && !hero ? pendingHero : null;

            return (
              <div
                key={`ban-${side}-${idx}`}
                title={hero ? `Banned: ${hero.name}` : `Slot Ban ${idx + 1}`}
                className={cn(
                  "relative aspect-square overflow-hidden border bg-[#090D18] transition-all",
                  isActiveBan
                    ? "border-[#F5B83D] ring-1 ring-[#F5B83D] shadow-[0_0_12px_rgba(245,184,61,0.4)]"
                    : "border-white/10",
                )}
              >
                {hero ? (
                  <>
                    <HeroPortrait
                      slug={hero.slug}
                      name={hero.name}
                      className="h-full w-full opacity-55 grayscale"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#E11D48]/25">
                      <Ban className="h-5 w-5 text-[#FB7185] drop-shadow" />
                    </div>
                  </>
                ) : previewHero ? (
                  <HeroPortrait
                    slug={previewHero.slug}
                    name={previewHero.name}
                    className="h-full w-full opacity-75"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#64748B]">
                    B{idx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 Pick Slots */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#9AA6C4] uppercase">
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3 w-3 text-[#F5B83D]" aria-hidden="true" />
            Pick Tim ({picks.filter(Boolean).length}/5)
          </span>
          {audit.avgWinRate !== null && (
            <span className="text-[#F5B83D]">
              Avg WR {(audit.avgWinRate * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {picks.map((slug, idx) => {
          const hero = slug ? heroBySlug.get(slug) : null;
          const isActivePick =
            currentTurn?.side === side &&
            currentTurn.action === "PICK" &&
            currentTurn.slotIndex === idx;
          const displayHero = hero ?? (isActivePick ? pendingHero : null);

          return (
            <div
              key={`pick-${side}-${idx}`}
              className={cn(
                "flex items-center gap-2.5 border p-2 transition-all",
                isActivePick
                  ? activeSlotRing
                  : hero
                    ? "border-white/15 bg-[#121C36]"
                    : "border-white/10 bg-[#0A0F1F]/70",
              )}
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-white/15 bg-[#090D18]">
                {displayHero ? (
                  <HeroPortrait
                    slug={displayHero.slug}
                    name={displayHero.name}
                    className={cn(
                      "h-full w-full",
                      !hero && "opacity-75 ring-1 ring-[#F5B83D]",
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-xs text-[#64748B]">
                    P{idx + 1}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {displayHero ? (
                  <>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-display text-sm text-[#E6EAF5]">
                        {displayHero.name}
                        {!hero && (
                          <span className="ml-1.5 text-[10px] text-[#F5B83D]">
                            (Pratinjau)
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-display shrink-0 px-1.5 py-0.5 text-[10px]",
                          TIER_PILL[displayHero.tier] ??
                            "bg-[#94A3B8] text-[#0A0E1A]",
                        )}
                      >
                        {displayHero.tier}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#9AA6C4]">
                      <span>{displayHero.lanes[0]}</span>
                      <span>•</span>
                      <span>{displayHero.roles[0] ?? "Flex"}</span>
                      <span>•</span>
                      <span className="text-[#22D3EE]">
                        {displayHero.damageProfile}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="font-display text-xs text-[#64748B]">
                      {isActivePick
                        ? `Giliran Pick #${idx + 1}...`
                        : `Slot Pick #${idx + 1}`}
                    </span>
                    <p className="text-[10px] text-[#475569]">
                      {isActivePick
                        ? "Pilih hero dari panel tengah"
                        : "Menunggu giliran"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Team Audit Box */}
      <div className="mt-1 space-y-2 border-t border-white/10 pt-2.5">
        <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#9AA6C4] uppercase">
          <span>Cakupan 5 Lane</span>
          <span>
            CC: <b className="text-[#22D3EE]">{audit.hardCCCount}</b> · Tank/Front:{" "}
            <b className="text-[#F5B83D]">{audit.frontlineCount}</b>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {MATCHUP_LANES.map((lane) => {
            const filled = audit.filledLanes.includes(lane);
            return (
              <span
                key={lane}
                className={cn(
                  "py-1 text-center font-display text-[10px] border",
                  filled
                    ? "border-[#4ADE80]/40 bg-[#4ADE80]/15 text-[#4ADE80]"
                    : "border-white/10 bg-[#090D18] text-[#64748B]",
                )}
              >
                {LANE_SHORT[lane] ?? lane}
              </span>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#9AA6C4]">
          <span>
            Phys: <b className="text-[#E6EAF5]">{audit.physicalCount}</b> · Mag:{" "}
            <b className="text-[#22D3EE]">{audit.magicCount}</b> · Mix:{" "}
            <b className="text-[#F5B83D]">{audit.trueOrMixedCount}</b>
          </span>
          {audit.avgMetaScore !== null && (
            <span>
              Skor Meta: <b className="text-[#F5B83D]">{audit.avgMetaScore}</b>
            </span>
          )}
        </div>

        {audit.warnings.length > 0 && (
          <div className="space-y-1 border border-[#E11D48]/40 bg-[#E11D48]/10 p-2">
            {audit.warnings.slice(0, 2).map((w) => (
              <p
                key={w}
                className="flex items-start gap-1.5 text-[10px] leading-snug text-[#FDA4AF]"
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}

        {audit.warnings.length === 0 && audit.strengths.length > 0 && (
          <div className="border border-[#4ADE80]/30 bg-[#4ADE80]/10 p-2">
            <p className="flex items-start gap-1.5 text-[10px] leading-snug text-[#86EFAC]">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{audit.strengths[0]}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
