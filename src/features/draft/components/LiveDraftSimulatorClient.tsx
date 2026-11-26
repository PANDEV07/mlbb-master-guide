"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Bot,
  Check,
  Clock,
  RotateCcw,
  Search,
  Shield,
  Undo2,
  Users,
} from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { ShareLinkButton } from "@/components/shared/ShareLinkButton";
import { Surface } from "@/components/ui/Surface";
import { MATCHUP_LANES, type MatchupLane } from "@/features/matchups/types/matchup-hub.types";
import { cn } from "@/lib/cn";
import {
  applyDraftSelection,
  auditDraftTeam,
  computeDraftRecommendations,
  createInitialDraftState,
  decodeDraftFromSearchParams,
  encodeDraftToSearchParams,
  getCurrentTurn,
  getDraftSequence,
  getUnavailableSlugs,
  undoLastSelection,
} from "../engine/draft-simulator-engine";
import type {
  DraftBoardState,
  DraftControlMode,
  DraftFormat,
  DraftHeroEntry,
} from "../types/draft.types";
import { DraftSideColumn } from "./DraftSideColumn";
import { DraftRecommendationStrip } from "./DraftRecommendationStrip";
import { DraftCompletionSummary } from "./DraftCompletionSummary";

const ROLE_FILTERS = [
  "Semua",
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
] as const;

const TIMER_OPTIONS = [
  { label: "Timer Off", seconds: 0 },
  { label: "30 Detik", seconds: 30 },
  { label: "45 Detik", seconds: 45 },
] as const;

type SortMode = "meta" | "ban" | "wr" | "name";

const TIER_DOT: Record<string, string> = {
  S: "bg-[#F5B83D] text-[#0A0E1A]",
  A: "bg-[#22D3EE] text-[#0A0E1A]",
  B: "bg-[#4ADE80] text-[#0A0E1A]",
  C: "bg-[#94A3B8] text-[#0A0E1A]",
  D: "bg-[#E11D48] text-white",
};

interface LiveDraftSimulatorClientProps {
  heroPool: DraftHeroEntry[];
  patchVersion: string;
}

export function LiveDraftSimulatorClient({
  heroPool,
  patchVersion,
}: LiveDraftSimulatorClientProps) {
  const [draft, setDraft] = useState<DraftBoardState>(() =>
    createInitialDraftState("mpl"),
  );
  const [controlMode, setControlMode] = useState<DraftControlMode>("MANUAL");
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("Semua");
  const [laneFilter, setLaneFilter] = useState<MatchupLane | "ALL">("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("meta");
  const [urlHydrated, setUrlHydrated] = useState(false);

  const heroBySlug = useMemo(
    () => new Map(heroPool.map((h) => [h.slug, h])),
    [heroPool],
  );
  const validSlugs = useMemo(
    () => new Set(heroPool.map((h) => h.slug)),
    [heroPool],
  );

  // Pulihkan state dari URL (?format=mpl&seq=...)
  useEffect(() => {
    try {
      const restored = decodeDraftFromSearchParams(
        window.location.search,
        validSlugs,
      );
      if (restored) {
        setDraft(restored);
      }
    } catch {
      // Abaikan jika query tidak valid
    }
    setUrlHydrated(true);
  }, [validSlugs]);

  // Sinkronkan state draft ke URL
  useEffect(() => {
    if (!urlHydrated || typeof window === "undefined") return;
    const qs = encodeDraftToSearchParams(draft);
    const nextUrl =
      draft.history.length > 0 || draft.format !== "mpl"
        ? `/draft?${qs}`
        : "/draft";
    window.history.replaceState(null, "", nextUrl);
  }, [draft, urlHydrated]);

  const sequence = useMemo(
    () => getDraftSequence(draft.format),
    [draft.format],
  );
  const currentTurn = useMemo(() => getCurrentTurn(draft), [draft]);
  const unavailableSlugs = useMemo(() => getUnavailableSlugs(draft), [draft]);

  const bannedSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const s of draft.blueBans) if (s) set.add(s);
    for (const s of draft.redBans) if (s) set.add(s);
    return set;
  }, [draft.blueBans, draft.redBans]);

  const pickedSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const s of draft.bluePicks) if (s) set.add(s);
    for (const s of draft.redPicks) if (s) set.add(s);
    return set;
  }, [draft.bluePicks, draft.redPicks]);

  const bluePickEntries = useMemo(
    () =>
      draft.bluePicks
        .filter((s): s is string => Boolean(s))
        .map((s) => heroBySlug.get(s))
        .filter((h): h is DraftHeroEntry => Boolean(h)),
    [draft.bluePicks, heroBySlug],
  );

  const redPickEntries = useMemo(
    () =>
      draft.redPicks
        .filter((s): s is string => Boolean(s))
        .map((s) => heroBySlug.get(s))
        .filter((h): h is DraftHeroEntry => Boolean(h)),
    [draft.redPicks, heroBySlug],
  );

  const blueAudit = useMemo(
    () => auditDraftTeam(bluePickEntries),
    [bluePickEntries],
  );
  const redAudit = useMemo(
    () => auditDraftTeam(redPickEntries),
    [redPickEntries],
  );

  const recommendations = useMemo(
    () =>
      computeDraftRecommendations({
        state: draft,
        heroPool,
        limit: 6,
      }),
    [draft, heroPool],
  );

  const isAiTurn = useMemo(() => {
    if (!currentTurn) return false;
    if (controlMode === "VS_AI_BLUE") return currentTurn.side === "RED";
    if (controlMode === "VS_AI_RED") return currentTurn.side === "BLUE";
    return false;
  }, [controlMode, currentTurn]);

  const lockHero = useCallback((slug: string) => {
    setDraft((prev) => applyDraftSelection(prev, slug));
    setSelectedSlug(null);
  }, []);

  // Eksekusi otomatis AI Drafter saat gilirannya tiba
  useEffect(() => {
    if (!isAiTurn || !currentTurn || recommendations.length === 0) return;

    // Sedikit variasi deterministik di 2 kandidat teratas agar terasa natural namun tetap optimal
    const pickIdx =
      recommendations.length >= 2 && currentTurn.index % 4 === 3 ? 1 : 0;
    const aiChoice = recommendations[pickIdx] ?? recommendations[0];
    if (!aiChoice) return;

    const timer = window.setTimeout(() => {
      lockHero(aiChoice.hero.slug);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [isAiTurn, currentTurn, recommendations, lockHero]);

  // Countdown timer per giliran (opsional)
  useEffect(() => {
    if (!currentTurn || timerDuration <= 0 || isAiTurn) {
      setSecondsLeft(timerDuration);
      return;
    }

    setSecondsLeft(timerDuration);
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentTurn, timerDuration, isAiTurn]);

  // Auto-lock saat timer habis
  useEffect(() => {
    if (
      timerDuration > 0 &&
      secondsLeft === 0 &&
      currentTurn &&
      !isAiTurn
    ) {
      const fallbackSlug =
        (selectedSlug && !unavailableSlugs.has(selectedSlug)
          ? selectedSlug
          : null) ?? recommendations[0]?.hero.slug;
      if (fallbackSlug) {
        lockHero(fallbackSlug);
      }
    }
  }, [
    timerDuration,
    secondsLeft,
    currentTurn,
    isAiTurn,
    selectedSlug,
    unavailableSlugs,
    recommendations,
    lockHero,
  ]);

  const filteredHeroes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = heroPool.filter((h) => {
      if (roleFilter !== "Semua" && !h.roles.includes(roleFilter)) return false;
      if (laneFilter !== "ALL" && !h.lanes.includes(laneFilter)) return false;
      if (
        q &&
        !h.name.toLowerCase().includes(q) &&
        !h.slug.includes(q) &&
        !h.roles.some((r) => r.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortMode === "ban") {
      sorted.sort((a, b) => b.banRate - a.banRate || b.metaScore - a.metaScore);
    } else if (sortMode === "wr") {
      sorted.sort((a, b) => b.winRate - a.winRate || b.metaScore - a.metaScore);
    } else if (sortMode === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => b.metaScore - a.metaScore || b.winRate - a.winRate);
    }
    return sorted;
  }, [heroPool, roleFilter, laneFilter, searchQuery, sortMode]);

  const handleFormatChange = (nextFormat: DraftFormat) => {
    setDraft(createInitialDraftState(nextFormat));
    setSelectedSlug(null);
  };

  const handleReset = () => {
    setDraft(createInitialDraftState(draft.format));
    setSelectedSlug(null);
  };

  const handleUndo = () => {
    setSelectedSlug(null);
    setDraft((prev) => {
      // Pada mode lawan AI, jika sedang giliran user maka undo 2 langkah (AI + user)
      if (controlMode !== "MANUAL" && prev.history.length >= 2) {
        return undoLastSelection(undoLastSelection(prev));
      }
      return undoLastSelection(prev);
    });
  };

  const pendingHero = selectedSlug ? (heroBySlug.get(selectedSlug) ?? null) : null;
  const shareUrl = `/draft?${encodeDraftToSearchParams(draft)}`;
  const isDraftComplete = currentTurn === null;
  const progressPct = Math.round((draft.history.length / sequence.length) * 100);

  return (
    <div className="space-y-5">
      {/* Control Bar: Format, Mode AI/Manual, Timer, Undo, Reset, Share */}
      <Surface className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Format Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xs text-[#9AA6C4]">FORMAT:</span>
            <div className="inline-flex border border-white/15 bg-[#0A0E1A] p-0.5">
              <button
                type="button"
                onClick={() => handleFormatChange("mpl")}
                className={cn(
                  "font-display cursor-pointer px-3 py-1.5 text-xs transition",
                  draft.format === "mpl"
                    ? "bg-[#F5B83D] font-bold text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                Turnamen MPL (2 Fase)
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange("ranked")}
                className={cn(
                  "font-display cursor-pointer px-3 py-1.5 text-xs transition",
                  draft.format === "ranked"
                    ? "bg-[#F5B83D] font-bold text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                Ranked Mythic (10 Ban)
              </button>
            </div>
          </div>

          {/* Control Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xs text-[#9AA6C4]">MODE:</span>
            <div className="inline-flex border border-white/15 bg-[#0A0E1A] p-0.5">
              <button
                type="button"
                onClick={() => setControlMode("MANUAL")}
                className={cn(
                  "font-display inline-flex cursor-pointer items-center gap-1 px-2.5 py-1.5 text-xs transition",
                  controlMode === "MANUAL"
                    ? "bg-[#22D3EE] font-bold text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Manual / Coach
              </button>
              <button
                type="button"
                onClick={() => setControlMode("VS_AI_BLUE")}
                className={cn(
                  "font-display inline-flex cursor-pointer items-center gap-1 px-2.5 py-1.5 text-xs transition",
                  controlMode === "VS_AI_BLUE"
                    ? "bg-[#22D3EE] font-bold text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                Lawan AI (Blue)
              </button>
              <button
                type="button"
                onClick={() => setControlMode("VS_AI_RED")}
                className={cn(
                  "font-display inline-flex cursor-pointer items-center gap-1 px-2.5 py-1.5 text-xs transition",
                  controlMode === "VS_AI_RED"
                    ? "bg-[#FB7185] font-bold text-[#0A0E1A]"
                    : "text-[#9AA6C4] hover:text-[#E6EAF5]",
                )}
              >
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                Lawan AI (Red)
              </button>
            </div>
          </div>
        </div>

        {/* Second Toolbar Row: Timer + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#9AA6C4]" aria-hidden="true" />
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                type="button"
                onClick={() => setTimerDuration(opt.seconds)}
                className={cn(
                  "font-display cursor-pointer border px-2.5 py-1 text-[11px] transition",
                  timerDuration === opt.seconds
                    ? "border-[#F5B83D] bg-[#F5B83D]/15 text-[#F5B83D]"
                    : "border-white/10 bg-[#0A0E1A] text-[#9AA6C4] hover:border-white/25",
                )}
              >
                {opt.label}
              </button>
            ))}
            <span className="ml-2 hidden text-[11px] text-[#9AA6C4] sm:inline">
              Patch {patchVersion} · Data Resmi Moonton Glory+
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={draft.history.length === 0 || isAiTurn}
              onClick={handleUndo}
              className="font-display inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-[#0A0E1A] px-3 py-1.5 text-xs text-[#E6EAF5] transition hover:border-[#22D3EE] hover:text-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              Undo
            </button>
            <button
              type="button"
              disabled={draft.history.length === 0}
              onClick={handleReset}
              className="font-display inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-[#0A0E1A] px-3 py-1.5 text-xs text-[#E6EAF5] transition hover:border-[#FB7185] hover:text-[#FB7185] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
            <ShareLinkButton
              label="Bagikan Draft"
              copiedLabel="Link Draft Disalin!"
              getUrl={() => shareUrl}
            />
          </div>
        </div>
      </Surface>

      {/* Active Turn Broadcast Banner */}
      {currentTurn && (
        <div
          className={cn(
            "relative overflow-hidden border p-4",
            currentTurn.side === "BLUE"
              ? "border-[#22D3EE]/55 bg-gradient-to-r from-[#0E2438] via-[#101830] to-[#0A0E1A]"
              : "border-[#E11D48]/60 bg-gradient-to-r from-[#0A0E1A] via-[#101830] to-[#2B1020]",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-display inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold",
                  currentTurn.action === "BAN"
                    ? "bg-[#E11D48] text-white"
                    : currentTurn.side === "BLUE"
                      ? "bg-[#22D3EE] text-[#0A0E1A]"
                      : "bg-[#F5B83D] text-[#0A0E1A]",
                )}
              >
                {currentTurn.action === "BAN" ? (
                  <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {currentTurn.action} {currentTurn.shortLabel}
              </span>

              <div>
                <p className="font-display text-base text-[#E6EAF5] sm:text-lg">
                  {isAiTurn
                    ? `AI Drafter (${currentTurn.side === "BLUE" ? "Blue Side" : "Red Side"}) sedang menentukan ${currentTurn.action}...`
                    : `Giliran ${currentTurn.side === "BLUE" ? "BLUE SIDE" : "RED SIDE"} — ${currentTurn.action === "BAN" ? "Ban Hero" : "Pick Hero"}`}
                </p>
                <p className="text-[11px] text-[#9AA6C4]">
                  {currentTurn.phaseLabel} · Langkah {currentTurn.index + 1} dari{" "}
                  {sequence.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {timerDuration > 0 && !isAiTurn && (
                <div
                  className={cn(
                    "font-display border px-3 py-1 text-lg",
                    secondsLeft <= 8
                      ? "animate-pulse border-[#E11D48] bg-[#E11D48]/20 text-[#FB7185]"
                      : "border-[#F5B83D]/50 bg-[#0A0E1A] text-[#F5B83D]",
                  )}
                >
                  {secondsLeft}d
                </div>
              )}

              <button
                type="button"
                disabled={!pendingHero || isAiTurn}
                onClick={() => pendingHero && lockHero(pendingHero.slug)}
                className={cn(
                  "mlbb-btn-chamfer font-display inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40",
                  currentTurn.action === "BAN"
                    ? "bg-[#E11D48] text-white shadow-[0_0_18px_rgba(225,29,72,0.45)] hover:bg-[#f43f5e]"
                    : "bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_18px_rgba(245,184,61,0.45)] hover:bg-[#fbca5c]",
                )}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {pendingHero
                  ? `KUNCI ${currentTurn.action}: ${pendingHero.name}`
                  : `PILIH HERO UNTUK ${currentTurn.action}`}
              </button>
            </div>
          </div>

          {/* Progress Bar 20 Langkah */}
          <div className="mt-3 h-1.5 w-full bg-[#1B2442]">
            <div
              className="h-1.5 bg-gradient-to-r from-[#22D3EE] via-[#F5B83D] to-[#E11D48] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Ringkasan Selesai Draft */}
      {isDraftComplete && (
        <DraftCompletionSummary
          bluePicks={bluePickEntries}
          redPicks={redPickEntries}
          blueAudit={blueAudit}
          redAudit={redAudit}
          shareUrl={shareUrl}
          onReset={handleReset}
        />
      )}

      {/* 3-Column Esports Draft Arena */}
      <div className="grid gap-4 xl:grid-cols-[290px_1fr_290px]">
        {/* Blue Side */}
        <DraftSideColumn
          side="BLUE"
          bans={draft.blueBans}
          picks={draft.bluePicks}
          heroBySlug={heroBySlug}
          currentTurn={currentTurn}
          pendingHero={currentTurn?.side === "BLUE" ? pendingHero : null}
          audit={blueAudit}
          isAiControlled={controlMode === "VS_AI_RED"}
        />

        {/* Center Hero Pool & Assistant */}
        <div className="flex min-w-0 flex-col gap-3">
          {currentTurn && (
            <DraftRecommendationStrip
              recommendations={recommendations}
              action={currentTurn.action}
              side={currentTurn.side}
              selectedSlug={selectedSlug}
              disabled={isAiTurn}
              onSelect={(slug) => setSelectedSlug(slug)}
              onQuickLock={(slug) => !isAiTurn && lockHero(slug)}
            />
          )}

          {/* Filter & Search Bar */}
          <Surface className="space-y-3 p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[190px] flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9AA6C4]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari hero cepat (mis. Fanny, Hayabusa, Tigreal)..."
                  aria-label="Cari hero di Draft Simulator"
                  className="w-full border border-white/15 bg-[#0A0E1A] py-2 pr-3 pl-9 text-xs text-[#E6EAF5] placeholder:text-[#64748B] focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <select
                value={laneFilter}
                onChange={(e) =>
                  setLaneFilter(e.target.value as MatchupLane | "ALL")
                }
                aria-label="Filter Lane"
                className="border border-white/15 bg-[#0A0E1A] px-2.5 py-2 text-xs text-[#E6EAF5] focus:border-[#22D3EE] focus:outline-none"
              >
                <option value="ALL">Semua Lane</option>
                {MATCHUP_LANES.map((lane) => (
                  <option key={lane} value={lane}>
                    {lane}
                  </option>
                ))}
              </select>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Urutkan Hero"
                className="border border-white/15 bg-[#0A0E1A] px-2.5 py-2 text-xs text-[#E6EAF5] focus:border-[#22D3EE] focus:outline-none"
              >
                <option value="meta">Urut: Tier &amp; Meta</option>
                <option value="ban">Urut: Ban Rate Tertinggi</option>
                <option value="wr">Urut: Win Rate Tertinggi</option>
                <option value="name">Urut: Nama A–Z</option>
              </select>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {ROLE_FILTERS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    "font-display cursor-pointer border px-2.5 py-1 text-[11px] transition",
                    roleFilter === role
                      ? "border-[#F5B83D] bg-[#F5B83D] font-bold text-[#0A0E1A]"
                      : "border-white/10 bg-[#0A0E1A] text-[#9AA6C4] hover:border-[#22D3EE]/50 hover:text-[#E6EAF5]",
                  )}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* 133-Hero Selection Grid */}
            <div className="grid max-h-[540px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5 md:grid-cols-6">
              {filteredHeroes.map((hero) => {
                const isBanned = bannedSlugs.has(hero.slug);
                const isPicked = pickedSlugs.has(hero.slug);
                const isUsed = isBanned || isPicked;
                const isSelected = selectedSlug === hero.slug;

                return (
                  <button
                    key={hero.slug}
                    type="button"
                    disabled={isUsed || isDraftComplete || isAiTurn}
                    onClick={() => setSelectedSlug(hero.slug)}
                    onDoubleClick={() =>
                      !isUsed && !isDraftComplete && !isAiTurn && lockHero(hero.slug)
                    }
                    title={`${hero.name} · Tier ${hero.tier} · WR ${(hero.winRate * 100).toFixed(1)}% · Ban ${(hero.banRate * 100).toFixed(1)}%`}
                    className={cn(
                      "group relative flex flex-col overflow-hidden border bg-[#0A0E1A] text-left transition-all",
                      isSelected
                        ? "border-[#F5B83D] ring-1 ring-[#F5B83D] shadow-[0_0_14px_rgba(245,184,61,0.4)]"
                        : isUsed
                          ? "cursor-not-allowed border-white/5 opacity-45"
                          : "cursor-pointer border-white/10 hover:border-[#22D3EE]",
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden">
                      <HeroPortrait
                        slug={hero.slug}
                        name={hero.name}
                        className={cn(
                          "h-full w-full transition-transform duration-200",
                          !isUsed && "group-hover:scale-105",
                          isUsed && "grayscale",
                        )}
                      />

                      {/* Tier Badge */}
                      <span
                        className={cn(
                          "font-display absolute top-1 left-1 px-1 text-[9px] leading-tight",
                          TIER_DOT[hero.tier] ?? "bg-[#94A3B8] text-[#0A0E1A]",
                        )}
                      >
                        {hero.tier}
                      </span>

                      {/* Status Overlay */}
                      {isBanned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#E11D48]/35">
                          <span className="font-display bg-[#E11D48] px-1.5 py-0.5 text-[9px] text-white">
                            BANNED
                          </span>
                        </div>
                      )}
                      {isPicked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0E1A]/55">
                          <span className="font-display bg-[#22D3EE] px-1.5 py-0.5 text-[9px] text-[#0A0E1A]">
                            PICKED
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-1.5 py-1">
                      <p className="truncate font-display text-[11px] leading-tight text-[#E6EAF5]">
                        {hero.name}
                      </p>
                      <p className="truncate text-[9px] text-[#9AA6C4]">
                        WR {(hero.winRate * 100).toFixed(0)}% · B{" "}
                        {(hero.banRate * 100).toFixed(0)}%
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredHeroes.length === 0 && (
                <div className="col-span-full py-10 text-center text-xs text-[#9AA6C4]">
                  Tidak ada hero yang cocok dengan filter pencarian.
                </div>
              )}
            </div>
          </Surface>
        </div>

        {/* Red Side */}
        <DraftSideColumn
          side="RED"
          bans={draft.redBans}
          picks={draft.redPicks}
          heroBySlug={heroBySlug}
          currentTurn={currentTurn}
          pendingHero={currentTurn?.side === "RED" ? pendingHero : null}
          audit={redAudit}
          isAiControlled={controlMode === "VS_AI_BLUE"}
        />
      </div>

      <p className="text-center text-[10px] text-[#9AA6C4]">
        Asisten Ban/Pick menggunakan statistik resmi Moonton GMS (Mythical Glory+,
        Patch {patchVersion}) serta analisis mekanik &amp; cakupan 5 lane secara
        deterministik.
      </p>
    </div>
  );
}
