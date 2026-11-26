import rawHistory from "@/data/imports/hero-meta-history.json";
import {
  computeBracketTrends,
  type HeroMetaTrendSummary,
  type MetaHistoryDataset,
} from "../engine/meta-trend-engine";
import type { MetaRankBracketKey } from "../types/meta.types";

const historyDataset = rawHistory as MetaHistoryDataset;

const trendCache = new Map<
  MetaRankBracketKey,
  Map<string, HeroMetaTrendSummary>
>();

export function getBracketTrendMap(
  bracket: MetaRankBracketKey = "mythical_glory",
): Map<string, HeroMetaTrendSummary> {
  const cached = trendCache.get(bracket);
  if (cached) return cached;

  const computed = computeBracketTrends(historyDataset, bracket);
  trendCache.set(bracket, computed);
  return computed;
}

export function getHeroMetaTrend(
  heroSlug: string,
  bracket: MetaRankBracketKey = "mythical_glory",
): HeroMetaTrendSummary | null {
  return getBracketTrendMap(bracket).get(heroSlug) ?? null;
}

export function getMetaHistoryOverview(): {
  snapshotCount: number;
  earliestDate: string | null;
  latestDate: string | null;
} {
  const dates = historyDataset.snapshots
    .map((s) => s.snapshotDate)
    .sort((a, b) => a.localeCompare(b));
  return {
    snapshotCount: dates.length,
    earliestDate: dates[0] ?? null,
    latestDate: dates[dates.length - 1] ?? null,
  };
}
