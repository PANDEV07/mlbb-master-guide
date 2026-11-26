import rawMetaStats from "@/data/imports/hero-meta-stats.json";
import { buildMetaDashboardPayload } from "../engine/tier-list-engine";
import { getBracketTrendMap } from "./meta-history";
import type {
  MetaDashboardPayload,
  MetaRankBracketKey,
} from "../types/meta.types";

let cachedPayload: MetaDashboardPayload | null = null;

export function getMetaDashboardPayload(): MetaDashboardPayload {
  if (cachedPayload) return cachedPayload;

  const payload = buildMetaDashboardPayload(
    rawMetaStats as Parameters<typeof buildMetaDashboardPayload>[0],
  );

  // Tempelkan delta tren mingguan jika >= 2 snapshot tersedia
  const keys: MetaRankBracketKey[] = [
    "mythical_glory",
    "mythical_honor",
    "mythic",
    "all_rank",
  ];
  for (const key of keys) {
    const trendMap = getBracketTrendMap(key);
    for (const hero of payload.brackets[key].heroes) {
      const trend = trendMap.get(hero.heroSlug);
      if (trend?.hasHistoricalComparison) {
        hero.tierDelta = trend.tierDelta;
        hero.winRateDelta = trend.winRateDelta;
      }
    }
  }

  cachedPayload = payload;
  return cachedPayload;
}
