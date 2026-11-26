import type {
  MetaRankBracketKey,
  MetaTierGrade,
} from "../types/meta.types";
import { computeTierListForBracket } from "./tier-list-engine";

export interface MetaHistoryHeroPoint {
  heroSlug: string;
  winRate: number;
  pickRate: number;
  banRate: number;
}

export interface MetaHistorySnapshot {
  snapshotDate: string;
  fetchedAt: string;
  sourceUpdatedAt: string | null;
  brackets: Partial<Record<MetaRankBracketKey, MetaHistoryHeroPoint[]>>;
}

export interface MetaHistoryDataset {
  schemaVersion: number;
  sourceName: string;
  sourceTier: "TIER_1_OFFICIAL";
  snapshots: MetaHistorySnapshot[];
}

export interface HeroTrendSeriesPoint {
  snapshotDate: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  tier: MetaTierGrade;
  metaScore: number;
}

export interface HeroMetaTrendSummary {
  heroSlug: string;
  bracket: MetaRankBracketKey;
  snapshotCount: number;
  hasHistoricalComparison: boolean;
  latestDate: string | null;
  previousDate: string | null;
  winRateDelta: number | null;
  pickRateDelta: number | null;
  banRateDelta: number | null;
  /** Positif = naik tier (mis. A -> S = +1), Negatif = turun tier (S -> A = -1) */
  tierDelta: number | null;
  previousTier: MetaTierGrade | null;
  currentTier: MetaTierGrade | null;
  points: HeroTrendSeriesPoint[];
}

const TIER_RANK: Record<MetaTierGrade, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

export function computeBracketTrends(
  dataset: MetaHistoryDataset,
  bracket: MetaRankBracketKey,
): Map<string, HeroMetaTrendSummary> {
  const ordered = [...dataset.snapshots]
    .filter((s) => Array.isArray(s.brackets[bracket]) && (s.brackets[bracket]?.length ?? 0) > 0)
    .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));

  const seriesByHero = new Map<string, HeroTrendSeriesPoint[]>();

  for (const snap of ordered) {
    const rawHeroes = snap.brackets[bracket] ?? [];
    const ranked = computeTierListForBracket(
      rawHeroes.map((h, idx) => ({
        heroId: idx + 1,
        heroName: h.heroSlug,
        heroSlug: h.heroSlug,
        winRate: h.winRate,
        pickRate: h.pickRate,
        banRate: h.banRate,
      })),
    );

    for (const r of ranked) {
      const list = seriesByHero.get(r.heroSlug) ?? [];
      list.push({
        snapshotDate: snap.snapshotDate,
        winRate: r.winRate,
        pickRate: r.pickRate,
        banRate: r.banRate,
        tier: r.tier,
        metaScore: r.metaScore,
      });
      seriesByHero.set(r.heroSlug, list);
    }
  }

  const summaries = new Map<string, HeroMetaTrendSummary>();
  for (const [heroSlug, points] of seriesByHero.entries()) {
    const latest = points[points.length - 1] ?? null;
    const prev = points.length >= 2 ? points[points.length - 2] : null;
    const hasComp = Boolean(latest && prev);

    summaries.set(heroSlug, {
      heroSlug,
      bracket,
      snapshotCount: points.length,
      hasHistoricalComparison: hasComp,
      latestDate: latest?.snapshotDate ?? null,
      previousDate: prev?.snapshotDate ?? null,
      winRateDelta:
        latest && prev ? Number((latest.winRate - prev.winRate).toFixed(6)) : null,
      pickRateDelta:
        latest && prev ? Number((latest.pickRate - prev.pickRate).toFixed(6)) : null,
      banRateDelta:
        latest && prev ? Number((latest.banRate - prev.banRate).toFixed(6)) : null,
      tierDelta:
        latest && prev ? TIER_RANK[latest.tier] - TIER_RANK[prev.tier] : null,
      previousTier: prev?.tier ?? null,
      currentTier: latest?.tier ?? null,
      points,
    });
  }

  return summaries;
}
