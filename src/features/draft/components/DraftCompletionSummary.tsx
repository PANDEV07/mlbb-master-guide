"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw, Swords, Trophy } from "lucide-react";
import { ShareLinkButton } from "@/components/shared/ShareLinkButton";
import { Surface } from "@/components/ui/Surface";
import { MATCHUP_LANES } from "@/features/matchups/types/matchup-hub.types";
import { assignPicksToLanes } from "../engine/draft-simulator-engine";
import type { DraftHeroEntry, TeamLiveAudit } from "../types/draft.types";

interface DraftCompletionSummaryProps {
  bluePicks: DraftHeroEntry[];
  redPicks: DraftHeroEntry[];
  blueAudit: TeamLiveAudit;
  redAudit: TeamLiveAudit;
  shareUrl: string;
  onReset: () => void;
}

export function DraftCompletionSummary({
  bluePicks,
  redPicks,
  blueAudit,
  redAudit,
  shareUrl,
  onReset,
}: DraftCompletionSummaryProps) {
  const blueByLane = assignPicksToLanes(bluePicks);
  const redByLane = assignPicksToLanes(redPicks);

  const allyOrdered = MATCHUP_LANES.map((lane) => blueByLane[lane]?.slug ?? "").join(",");
  const enemyOrdered = MATCHUP_LANES.map((lane) => redByLane[lane]?.slug ?? "").join(",");
  const matchup5v5Href = `/matchups?mode=5v5&ally=${encodeURIComponent(allyOrdered)}&enemy=${encodeURIComponent(enemyOrdered)}`;
  const counterRedHref = `/counters?enemies=${encodeURIComponent(redPicks.map((h) => h.slug).join(","))}`;

  const blueScore = blueAudit.avgMetaScore ?? 0;
  const redScore = redAudit.avgMetaScore ?? 0;
  const metaEdge =
    Math.abs(blueScore - redScore) < 1.5
      ? "Seimbang secara statistik meta"
      : blueScore > redScore
        ? `Blue Side unggul +${(blueScore - redScore).toFixed(1)} poin skor meta rata-rata`
        : `Red Side unggul +${(redScore - blueScore).toFixed(1)} poin skor meta rata-rata`;

  return (
    <Surface className="space-y-4 border-[#F5B83D]/55 bg-[#101830] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center bg-[#F5B83D] text-[#0A0E1A]">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl text-[#F5B83D]">
              DRAFT SELESAI — 10 BAN &amp; 10 PICK TERKUNCI
            </h2>
            <p className="text-xs text-[#9AA6C4]">
              {metaEdge} (berdasarkan rata-rata data resmi Moonton GMS Glory+).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ShareLinkButton
            label="Bagikan Hasil Draft"
            copiedLabel="Link Draft Disalin!"
            getUrl={() => shareUrl}
          />
          <button
            type="button"
            onClick={onReset}
            className="font-display inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-[#0A0E1A] px-3 py-1.5 text-xs text-[#E6EAF5] transition hover:border-[#F5B83D] hover:text-[#F5B83D]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Draft Baru
          </button>
        </div>
      </div>

      {/* Head-to-Head Draft Metrics */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-[#22D3EE]/35 bg-[#0A0E1A] p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm text-[#22D3EE]">
              BLUE SIDE
            </span>
            <span className="font-display text-sm text-[#F5B83D]">
              Meta {blueAudit.avgMetaScore ?? "-"} · WR{" "}
              {blueAudit.avgWinRate !== null
                ? `${(blueAudit.avgWinRate * 100).toFixed(1)}%`
                : "-"}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#9AA6C4]">
            Lane terisi: <b className="text-[#E6EAF5]">{blueAudit.filledLanes.length}/5</b>{" "}
            · Hard CC: <b className="text-[#22D3EE]">{blueAudit.hardCCCount}</b>{" "}
            · Frontline: <b className="text-[#F5B83D]">{blueAudit.frontlineCount}</b>
          </p>
          {blueAudit.warnings.length === 0 ? (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#4ADE80]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tidak ada celah struktural mayor terdeteksi.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-[#FDA4AF]">
              Catatan: {blueAudit.warnings[0]}
            </p>
          )}
        </div>

        <div className="border border-[#E11D48]/40 bg-[#0A0E1A] p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm text-[#FB7185]">
              RED SIDE
            </span>
            <span className="font-display text-sm text-[#F5B83D]">
              Meta {redAudit.avgMetaScore ?? "-"} · WR{" "}
              {redAudit.avgWinRate !== null
                ? `${(redAudit.avgWinRate * 100).toFixed(1)}%`
                : "-"}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#9AA6C4]">
            Lane terisi: <b className="text-[#E6EAF5]">{redAudit.filledLanes.length}/5</b>{" "}
            · Hard CC: <b className="text-[#22D3EE]">{redAudit.hardCCCount}</b>{" "}
            · Frontline: <b className="text-[#F5B83D]">{redAudit.frontlineCount}</b>
          </p>
          {redAudit.warnings.length === 0 ? (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#4ADE80]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tidak ada celah struktural mayor terdeteksi.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-[#FDA4AF]">
              Catatan: {redAudit.warnings[0]}
            </p>
          )}
        </div>
      </div>

      {/* Deep Analysis Actions */}
      <div className="flex flex-wrap gap-2.5 border-t border-white/10 pt-3">
        <Link
          href={matchup5v5Href}
          className="mlbb-btn-chamfer font-display inline-flex items-center gap-2 bg-[#F5B83D] px-4 py-2 text-xs font-extrabold text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.35)] transition hover:bg-[#fbca5c]"
        >
          <Swords className="h-4 w-4" aria-hidden="true" />
          Audit Mendalam 5v5 di Matchup Hub
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link
          href={counterRedHref}
          className="font-display inline-flex items-center gap-2 border border-[#22D3EE]/45 bg-[#0A0E1A] px-4 py-2 text-xs text-[#22D3EE] transition hover:border-[#F5B83D] hover:text-[#F5B83D]"
        >
          Analisis Counter untuk Lineup Red Side
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Surface>
  );
}
