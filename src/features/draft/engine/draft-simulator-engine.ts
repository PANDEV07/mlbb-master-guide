import {
  MATCHUP_LANES,
  type MatchupLane,
} from "@/features/matchups/types/matchup-hub.types";
import type {
  DraftBoardState,
  DraftComparisonIndex,
  DraftFormat,
  DraftHeroEntry,
  DraftRecommendation,
  DraftSide,
  DraftTurnSpec,
  TeamLiveAudit,
} from "../types/draft.types";

/**
 * Urutan resmi Draft Turnamen MPL / M-Series (10 Ban · 10 Pick · 20 Langkah):
 * Fase Ban 1 (6) -> Fase Pick 1 (6) -> Fase Ban 2 (4) -> Fase Pick 2 (4)
 */
export const MPL_DRAFT_SEQUENCE: readonly DraftTurnSpec[] = [
  // Fase Ban 1
  { index: 0, side: "BLUE", action: "BAN", slotIndex: 0, phaseLabel: "Fase Ban 1", shortLabel: "B1" },
  { index: 1, side: "RED", action: "BAN", slotIndex: 0, phaseLabel: "Fase Ban 1", shortLabel: "B1" },
  { index: 2, side: "BLUE", action: "BAN", slotIndex: 1, phaseLabel: "Fase Ban 1", shortLabel: "B2" },
  { index: 3, side: "RED", action: "BAN", slotIndex: 1, phaseLabel: "Fase Ban 1", shortLabel: "B2" },
  { index: 4, side: "BLUE", action: "BAN", slotIndex: 2, phaseLabel: "Fase Ban 1", shortLabel: "B3" },
  { index: 5, side: "RED", action: "BAN", slotIndex: 2, phaseLabel: "Fase Ban 1", shortLabel: "B3" },
  // Fase Pick 1 (1-2-2-1)
  { index: 6, side: "BLUE", action: "PICK", slotIndex: 0, phaseLabel: "Fase Pick 1", shortLabel: "P1" },
  { index: 7, side: "RED", action: "PICK", slotIndex: 0, phaseLabel: "Fase Pick 1", shortLabel: "P1" },
  { index: 8, side: "RED", action: "PICK", slotIndex: 1, phaseLabel: "Fase Pick 1", shortLabel: "P2" },
  { index: 9, side: "BLUE", action: "PICK", slotIndex: 1, phaseLabel: "Fase Pick 1", shortLabel: "P2" },
  { index: 10, side: "BLUE", action: "PICK", slotIndex: 2, phaseLabel: "Fase Pick 1", shortLabel: "P3" },
  { index: 11, side: "RED", action: "PICK", slotIndex: 2, phaseLabel: "Fase Pick 1", shortLabel: "P3" },
  // Fase Ban 2 (Red duluan sesuai aturan resmi turnamen MLBB)
  { index: 12, side: "RED", action: "BAN", slotIndex: 3, phaseLabel: "Fase Ban 2", shortLabel: "B4" },
  { index: 13, side: "BLUE", action: "BAN", slotIndex: 3, phaseLabel: "Fase Ban 2", shortLabel: "B4" },
  { index: 14, side: "RED", action: "BAN", slotIndex: 4, phaseLabel: "Fase Ban 2", shortLabel: "B5" },
  { index: 15, side: "BLUE", action: "BAN", slotIndex: 4, phaseLabel: "Fase Ban 2", shortLabel: "B5" },
  // Fase Pick 2 (1-2-1, Red mendapat Last Pick)
  { index: 16, side: "RED", action: "PICK", slotIndex: 3, phaseLabel: "Fase Pick 2", shortLabel: "P4" },
  { index: 17, side: "BLUE", action: "PICK", slotIndex: 3, phaseLabel: "Fase Pick 2", shortLabel: "P4" },
  { index: 18, side: "BLUE", action: "PICK", slotIndex: 4, phaseLabel: "Fase Pick 2", shortLabel: "P5" },
  { index: 19, side: "RED", action: "PICK", slotIndex: 4, phaseLabel: "Fase Pick 2", shortLabel: "P5" },
] as const;

/**
 * Urutan Draft Ranked Mythic 10-Ban (10 Ban dulu -> 10 Pick 1-2-2-2-2-1)
 */
export const RANKED_DRAFT_SEQUENCE: readonly DraftTurnSpec[] = [
  // Fase Ban (10 Ban)
  { index: 0, side: "BLUE", action: "BAN", slotIndex: 0, phaseLabel: "Fase Ban Ranked", shortLabel: "B1" },
  { index: 1, side: "RED", action: "BAN", slotIndex: 0, phaseLabel: "Fase Ban Ranked", shortLabel: "B1" },
  { index: 2, side: "BLUE", action: "BAN", slotIndex: 1, phaseLabel: "Fase Ban Ranked", shortLabel: "B2" },
  { index: 3, side: "RED", action: "BAN", slotIndex: 1, phaseLabel: "Fase Ban Ranked", shortLabel: "B2" },
  { index: 4, side: "BLUE", action: "BAN", slotIndex: 2, phaseLabel: "Fase Ban Ranked", shortLabel: "B3" },
  { index: 5, side: "RED", action: "BAN", slotIndex: 2, phaseLabel: "Fase Ban Ranked", shortLabel: "B3" },
  { index: 6, side: "BLUE", action: "BAN", slotIndex: 3, phaseLabel: "Fase Ban Ranked", shortLabel: "B4" },
  { index: 7, side: "RED", action: "BAN", slotIndex: 3, phaseLabel: "Fase Ban Ranked", shortLabel: "B4" },
  { index: 8, side: "BLUE", action: "BAN", slotIndex: 4, phaseLabel: "Fase Ban Ranked", shortLabel: "B5" },
  { index: 9, side: "RED", action: "BAN", slotIndex: 4, phaseLabel: "Fase Ban Ranked", shortLabel: "B5" },
  // Fase Pick (1-2-2-2-2-1)
  { index: 10, side: "BLUE", action: "PICK", slotIndex: 0, phaseLabel: "Fase Pick Ranked", shortLabel: "P1" },
  { index: 11, side: "RED", action: "PICK", slotIndex: 0, phaseLabel: "Fase Pick Ranked", shortLabel: "P1" },
  { index: 12, side: "RED", action: "PICK", slotIndex: 1, phaseLabel: "Fase Pick Ranked", shortLabel: "P2" },
  { index: 13, side: "BLUE", action: "PICK", slotIndex: 1, phaseLabel: "Fase Pick Ranked", shortLabel: "P2" },
  { index: 14, side: "BLUE", action: "PICK", slotIndex: 2, phaseLabel: "Fase Pick Ranked", shortLabel: "P3" },
  { index: 15, side: "RED", action: "PICK", slotIndex: 2, phaseLabel: "Fase Pick Ranked", shortLabel: "P3" },
  { index: 16, side: "RED", action: "PICK", slotIndex: 3, phaseLabel: "Fase Pick Ranked", shortLabel: "P4" },
  { index: 17, side: "BLUE", action: "PICK", slotIndex: 3, phaseLabel: "Fase Pick Ranked", shortLabel: "P4" },
  { index: 18, side: "BLUE", action: "PICK", slotIndex: 4, phaseLabel: "Fase Pick Ranked", shortLabel: "P5" },
  { index: 19, side: "RED", action: "PICK", slotIndex: 4, phaseLabel: "Fase Pick Ranked", shortLabel: "P5" },
] as const;

export function getDraftSequence(format: DraftFormat): readonly DraftTurnSpec[] {
  return format === "ranked" ? RANKED_DRAFT_SEQUENCE : MPL_DRAFT_SEQUENCE;
}

export function createInitialDraftState(
  format: DraftFormat = "mpl",
): DraftBoardState {
  return {
    format,
    blueBans: [null, null, null, null, null],
    redBans: [null, null, null, null, null],
    bluePicks: [null, null, null, null, null],
    redPicks: [null, null, null, null, null],
    history: [],
  };
}

export function getCurrentTurn(state: DraftBoardState): DraftTurnSpec | null {
  const seq = getDraftSequence(state.format);
  if (state.history.length >= seq.length) return null;
  return seq[state.history.length] ?? null;
}

export function getUnavailableSlugs(state: DraftBoardState): Set<string> {
  const set = new Set<string>();
  for (const s of state.blueBans) if (s) set.add(s);
  for (const s of state.redBans) if (s) set.add(s);
  for (const s of state.bluePicks) if (s) set.add(s);
  for (const s of state.redPicks) if (s) set.add(s);
  return set;
}

export function applyDraftSelection(
  state: DraftBoardState,
  heroSlug: string,
): DraftBoardState {
  const turn = getCurrentTurn(state);
  if (!turn) return state;

  const unavailable = getUnavailableSlugs(state);
  if (unavailable.has(heroSlug)) return state;

  const next: DraftBoardState = {
    format: state.format,
    blueBans: [...state.blueBans],
    redBans: [...state.redBans],
    bluePicks: [...state.bluePicks],
    redPicks: [...state.redPicks],
    history: [...state.history, heroSlug],
  };

  if (turn.side === "BLUE" && turn.action === "BAN") {
    next.blueBans[turn.slotIndex] = heroSlug;
  } else if (turn.side === "RED" && turn.action === "BAN") {
    next.redBans[turn.slotIndex] = heroSlug;
  } else if (turn.side === "BLUE" && turn.action === "PICK") {
    next.bluePicks[turn.slotIndex] = heroSlug;
  } else {
    next.redPicks[turn.slotIndex] = heroSlug;
  }

  return next;
}

export function undoLastSelection(state: DraftBoardState): DraftBoardState {
  if (state.history.length === 0) return state;
  const seq = getDraftSequence(state.format);
  const lastTurn = seq[state.history.length - 1];
  if (!lastTurn) return state;

  const next: DraftBoardState = {
    format: state.format,
    blueBans: [...state.blueBans],
    redBans: [...state.redBans],
    bluePicks: [...state.bluePicks],
    redPicks: [...state.redPicks],
    history: state.history.slice(0, -1),
  };

  if (lastTurn.side === "BLUE" && lastTurn.action === "BAN") {
    next.blueBans[lastTurn.slotIndex] = null;
  } else if (lastTurn.side === "RED" && lastTurn.action === "BAN") {
    next.redBans[lastTurn.slotIndex] = null;
  } else if (lastTurn.side === "BLUE" && lastTurn.action === "PICK") {
    next.bluePicks[lastTurn.slotIndex] = null;
  } else {
    next.redPicks[lastTurn.slotIndex] = null;
  }

  return next;
}

/**
 * Memetakan 1–5 hero yang sudah dipick ke 5 lane standar secara greedy
 * (prioritaskan hero yang hanya punya 1 lane utama dulu agar pemetaan akurat).
 */
export function assignPicksToLanes(
  picks: DraftHeroEntry[],
): Record<MatchupLane, DraftHeroEntry | null> {
  const result: Record<MatchupLane, DraftHeroEntry | null> = {
    "EXP Lane": null,
    Jungle: null,
    "Mid Lane": null,
    "Gold Lane": null,
    Roam: null,
  };

  // Urutkan hero yang paling spesifik lane-nya terlebih dahulu
  const sorted = [...picks].sort((a, b) => a.lanes.length - b.lanes.length);
  const remaining: DraftHeroEntry[] = [];

  for (const hero of sorted) {
    const primaryOpen = hero.lanes.find((lane) => result[lane] === null);
    if (primaryOpen) {
      result[primaryOpen] = hero;
    } else {
      remaining.push(hero);
    }
  }

  // Fallback jika semua lane utama hero sudah terisi
  for (const hero of remaining) {
    const anyOpen = MATCHUP_LANES.find((lane) => result[lane] === null);
    if (anyOpen) result[anyOpen] = hero;
  }

  return result;
}

export function auditDraftTeam(picks: DraftHeroEntry[]): TeamLiveAudit {
  const laneAssignment = assignPicksToLanes(picks);
  const filledLanes: MatchupLane[] = [];
  const missingLanes: MatchupLane[] = [];

  for (const lane of MATCHUP_LANES) {
    if (laneAssignment[lane]) filledLanes.push(lane);
    else missingLanes.push(lane);
  }

  let physicalCount = 0;
  let magicCount = 0;
  let trueOrMixedCount = 0;
  let hardCCCount = 0;
  let frontlineCount = 0;
  let sustainCount = 0;
  let mobilityCount = 0;

  for (const hero of picks) {
    if (hero.damageProfile === "Physical") physicalCount += 1;
    else if (hero.damageProfile === "Magic") magicCount += 1;
    else if (hero.damageProfile === "Mixed" || hero.damageProfile === "True") {
      trueOrMixedCount += 1;
    }

    if (hero.hasHardCC) hardCCCount += 1;
    if (hero.hasFrontline) frontlineCount += 1;
    if (hero.hasSustain) sustainCount += 1;
    if (hero.hasMobility) mobilityCount += 1;
  }

  const avgMetaScore =
    picks.length > 0
      ? Math.round(
          (picks.reduce((sum, h) => sum + h.metaScore, 0) / picks.length) * 10,
        ) / 10
      : null;

  const avgWinRate =
    picks.length > 0
      ? picks.reduce((sum, h) => sum + h.winRate, 0) / picks.length
      : null;

  const warnings: string[] = [];
  const strengths: string[] = [];

  if (picks.length >= 3 && magicCount === 0 && trueOrMixedCount === 0) {
    warnings.push("Belum ada sumber Magic Damage (rawan ditahan item Armor).");
  }
  if (picks.length >= 3 && physicalCount === 0 && trueOrMixedCount === 0) {
    warnings.push("Belum ada sumber Physical Damage (rawan ditahan Radiant/Athena).");
  }
  if (picks.length >= 3 && hardCCCount === 0) {
    warnings.push("Minim Hard CC untuk mengunci Assassin/Core lincah musuh.");
  }
  if (picks.length >= 4 && frontlineCount === 0) {
    warnings.push("Tidak ada Frontline/Tank penahan badan di teamfight.");
  }

  if (hardCCCount >= 2) {
    strengths.push(`${hardCCCount} hero memiliki Hard CC pengunci target.`);
  }
  if (frontlineCount >= 1 && (magicCount >= 1 || trueOrMixedCount >= 1) && (physicalCount >= 1 || trueOrMixedCount >= 1)) {
    strengths.push("Kombinasi damage Physical & Magic seimbang dengan frontline.");
  }
  if (sustainCount >= 2) {
    strengths.push("Daya tahan teamfight panjang kuat (sustain ganda).");
  }

  return {
    filledLanes,
    missingLanes,
    physicalCount,
    magicCount,
    trueOrMixedCount,
    hardCCCount,
    frontlineCount,
    sustainCount,
    mobilityCount,
    avgMetaScore,
    avgWinRate,
    warnings,
    strengths,
  };
}

/**
 * Menghitung rekomendasi Ban atau Pick secara deterministik berdasarkan:
 * 1. Statistik Resmi Moonton GMS (Tier, Meta Score, Win Rate, Ban Rate)
 * 2. Celah Lane & Komposisi Tim saat ini (missingLanes, Hard CC, Frontline, Balance Damage)
 * 3. Respons mekanik terhadap hero lawan yang sudah dikunci
 */
export function computeDraftRecommendations(params: {
  state: DraftBoardState;
  heroPool: DraftHeroEntry[];
  limit?: number;
}): DraftRecommendation[] {
  const { state, heroPool, limit = 6 } = params;
  const turn = getCurrentTurn(state);
  if (!turn) return [];

  const unavailable = getUnavailableSlugs(state);
  const bySlug = new Map(heroPool.map((h) => [h.slug, h]));

  const allySlugs = turn.side === "BLUE" ? state.bluePicks : state.redPicks;
  const enemySlugs = turn.side === "BLUE" ? state.redPicks : state.bluePicks;

  const allyPicks = allySlugs
    .filter((s): s is string => Boolean(s))
    .map((s) => bySlug.get(s))
    .filter((h): h is DraftHeroEntry => Boolean(h));

  const enemyPicks = enemySlugs
    .filter((s): s is string => Boolean(s))
    .map((s) => bySlug.get(s))
    .filter((h): h is DraftHeroEntry => Boolean(h));

  const allyAudit = auditDraftTeam(allyPicks);
  const enemyAudit = auditDraftTeam(enemyPicks);

  const available = heroPool.filter((h) => !unavailable.has(h.slug));
  const scored: DraftRecommendation[] = [];

  if (turn.action === "BAN") {
    const enemyMissingLanes = new Set(enemyAudit.missingLanes);

    for (const hero of available) {
      let score = 0;
      const reasons: string[] = [];
      let primaryTag = `Ban ${(hero.banRate * 100).toFixed(1)}%`;

      // Bobot utama: Ban Rate resmi Moonton Glory+ & Meta Score
      score += hero.banRate * 140;
      score += hero.metaScore * 0.55;
      if (hero.tier === "S") score += 14;
      else if (hero.tier === "A") score += 7;

      if (hero.banRate >= 0.25) {
        reasons.push(`Ban Rate tinggi ${(hero.banRate * 100).toFixed(1)}% (Glory+)`);
      } else if (hero.tier === "S") {
        reasons.push(`Prioritas Meta Tier S (Skor ${hero.metaScore})`);
      }

      // Fase Ban 2 (target ban lane lawan yang belum terisi!)
      if (enemyPicks.length >= 2) {
        const fillsEnemyOpenLane = hero.lanes.find((l) => enemyMissingLanes.has(l));
        if (fillsEnemyOpenLane && (hero.tier === "S" || hero.tier === "A")) {
          score += 16;
          primaryTag = `Target Ban ${fillsEnemyOpenLane}`;
          reasons.push(`Tutup opsi ${fillsEnemyOpenLane} lawan`);
        }
      }

      // Jika tim kita minim Hard CC, prioritaskan ban hero lincah Tier S/A
      if (allyPicks.length >= 2 && allyAudit.hardCCCount === 0 && hero.hasMobility && hero.metaScore >= 60) {
        score += 12;
        reasons.push("Mobilitas tinggi berbahaya saat tim minim Hard CC");
      }

      if (reasons.length === 0) {
        reasons.push(`Win Rate ${(hero.winRate * 100).toFixed(1)}% · Tier ${hero.tier}`);
      }

      scored.push({
        hero,
        score: Math.round(score * 10) / 10,
        primaryTag,
        reasons: reasons.slice(0, 2),
      });
    }
  } else {
    // PICK recommendation
    const missingLaneSet = new Set(allyAudit.missingLanes);
    const needMagic =
      allyPicks.length >= 2 &&
      allyAudit.magicCount === 0 &&
      allyAudit.trueOrMixedCount === 0;
    const needPhysical =
      allyPicks.length >= 2 &&
      allyAudit.physicalCount === 0 &&
      allyAudit.trueOrMixedCount === 0;
    const needHardCC = allyPicks.length >= 1 && allyAudit.hardCCCount === 0;
    const needFrontline = allyPicks.length >= 2 && allyAudit.frontlineCount === 0;
    const enemyHighMobility = enemyAudit.mobilityCount >= 2;

    for (const hero of available) {
      let score = 0;
      const reasons: string[] = [];
      let primaryTag = `Tier ${hero.tier}`;

      // 1. Kekuatan Meta Resmi Moonton
      score += hero.metaScore * 0.72;
      score += (hero.winRate - 0.45) * 180;
      if (hero.tier === "S") score += 12;
      else if (hero.tier === "A") score += 6;

      // 2. Kecocokan lane yang belum terisi
      const openLane = hero.lanes.find((l) => missingLaneSet.has(l));
      if (openLane) {
        score += 24;
        primaryTag = `Isi ${openLane}`;
        reasons.push(`Mengisi kekosongan ${openLane}`);
      } else if (allyPicks.length > 0) {
        // Penalti jika seluruh lane hero sudah terisi
        score -= 22;
      }

      // 3. Menutup celah komposisi tim
      if (needMagic && (hero.damageProfile === "Magic" || hero.damageProfile === "Mixed")) {
        score += 16;
        reasons.push("Seimbangkan sumber Magic Damage");
      }
      if (needPhysical && (hero.damageProfile === "Physical" || hero.damageProfile === "Mixed")) {
        score += 16;
        reasons.push("Seimbangkan sumber Physical Damage");
      }
      if (needHardCC && hero.hasHardCC) {
        score += 14;
        reasons.push("Tambah Hard CC pengunci lawan");
      }
      if (needFrontline && hero.hasFrontline) {
        score += 14;
        reasons.push("Perkuat Frontline teamfight");
      }

      // 4. Respons terhadap draft lawan
      if (enemyHighMobility && hero.hasHardCC) {
        score += 12;
        if (!openLane) primaryTag = "Counter Mobilitas";
        reasons.push("Redam mobilitas tinggi tim lawan");
      }

      // Tambahkan stat resmi Moonton sebagai alasan pelengkap
      if (reasons.length < 2) {
        reasons.push(
          `Tier ${hero.tier} · WR ${(hero.winRate * 100).toFixed(1)}% (Glory+)`,
        );
      }

      scored.push({
        hero,
        score: Math.round(score * 10) / 10,
        primaryTag,
        reasons: reasons.slice(0, 2),
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Serialisasi ringkas state draft ke query URL agar mudah dibagikan:
 * ?format=mpl&bb=a,b&rb=c,d&bp=e,f&rp=g,h (atau urutan history via h=...)
 */
export function encodeDraftToSearchParams(state: DraftBoardState): string {
  const params = new URLSearchParams();
  params.set("format", state.format);
  if (state.history.length > 0) {
    params.set("seq", state.history.join(","));
  }
  return params.toString();
}

export function decodeDraftFromSearchParams(
  search: string,
  validSlugs: Set<string>,
): DraftBoardState | null {
  try {
    const params = new URLSearchParams(search);
    const rawFormat = params.get("format");
    const format: DraftFormat = rawFormat === "ranked" ? "ranked" : "mpl";
    const rawSeq = params.get("seq");
    if (!rawSeq && !rawFormat) return null;

    let state = createInitialDraftState(format);
    if (rawSeq) {
      const slugs = rawSeq
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => validSlugs.has(s));

      for (const slug of slugs) {
        state = applyDraftSelection(state, slug);
      }
    }
    return state;
  } catch {
    return null;
  }
}

export function getSideLabel(side: DraftSide): string {
  return side === "BLUE" ? "Blue Side (Tim Biru)" : "Red Side (Tim Merah)";
}

/**
 * Menghitung indeks perbandingan relatif kedua tim (selalu total tepat 100,0%).
 * Menggabungkan:
 * - Skor Meta rata-rata & Win Rate rata-rata hero (Moonton GMS Glory+)
 * - Kelengkapan 5 lane, keseimbangan damage Physical/Magic, Hard CC, dan Frontline
 * Catatan: Ini adalah indeks komparasi statistik + komposisi, bukan jaminan hasil match.
 */
export function computeDraftComparisonIndex(
  blueAudit: TeamLiveAudit,
  redAudit: TeamLiveAudit,
): DraftComparisonIndex {
  const computeSidePower = (audit: TeamLiveAudit): number => {
    const pickCount = audit.filledLanes.length;
    if (pickCount === 0) return 50;

    const metaBase = audit.avgMetaScore ?? 50;
    const wrBonus = ((audit.avgWinRate ?? 0.5) - 0.5) * 200; // +-10 poin untuk WR 55% / 45%
    const laneBonus = (audit.filledLanes.length / 5) * 6;
    const ccBonus = Math.min(3, audit.hardCCCount) * 1.5;
    const frontlineBonus = audit.frontlineCount > 0 ? 2.5 : 0;
    const hasBalancedDamage =
      (audit.physicalCount > 0 || audit.trueOrMixedCount > 0) &&
      (audit.magicCount > 0 || audit.trueOrMixedCount > 0);
    const damageBonus = hasBalancedDamage ? 2.5 : 0;
    const warningPenalty = audit.warnings.length * 2.5;

    return Math.max(
      15,
      metaBase + wrBonus + laneBonus + ccBonus + frontlineBonus + damageBonus - warningPenalty,
    );
  };

  const bluePower = Math.round(computeSidePower(blueAudit) * 10) / 10;
  const redPower = Math.round(computeSidePower(redAudit) * 10) / 10;
  const total = bluePower + redPower;

  const rawBluePct = total > 0 ? (bluePower / total) * 100 : 50;
  const blueSharePct = Math.round(rawBluePct * 10) / 10;
  const redSharePct = Math.round((100 - blueSharePct) * 10) / 10;

  const diff = Math.abs(blueSharePct - redSharePct);
  let verdict = "Kedua draft seimbang secara statistik meta dan kelengkapan komposisi.";
  if (diff >= 1.5) {
    const leader = blueSharePct > redSharePct ? "Blue Side" : "Red Side";
    verdict = `${leader} lebih unggul (+${diff.toFixed(1)}%) pada indeks meta & kelengkapan komposisi.`;
  }

  return {
    blueSharePct,
    redSharePct,
    bluePower,
    redPower,
    verdict,
  };
}
