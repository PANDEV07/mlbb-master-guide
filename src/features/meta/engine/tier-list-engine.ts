import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import {
  META_TIERS,
  type MetaBracketSnapshot,
  type MetaDashboardPayload,
  type MetaRankBracketKey,
  type MetaTierGrade,
  type RankedMetaHero,
  type RawHeroMetaStat,
} from "../types/meta.types";

/**
 * Menghitung skor komposit meta secara deterministik dari 3 metrik resmi Moonton GMS:
 * - 55% Win Rate (z-score ternormalisasi relatif terhadap rata-rata bracket)
 * - 25% Ban Rate (tekanan prioritas draft / ancaman)
 * - 20% Pick Rate (kehadiran nyata di pertandingan)
 *
 * Seluruh angka input berasal dari data resmi Moonton (OFFICIAL_FACT),
 * sedangkan klasifikasi Tier S–D adalah Analisis Berbasis Riset (RESEARCH-BASED ANALYSIS).
 */
export function computeTierListForBracket(
  rawHeroes: readonly RawHeroMetaStat[],
): RankedMetaHero[] {
  if (rawHeroes.length === 0) return [];

  const mean = (values: number[]) =>
    values.reduce((acc, v) => acc + v, 0) / Math.max(values.length, 1);

  const stdDev = (values: number[], avg: number) => {
    const variance =
      values.reduce((acc, v) => acc + (v - avg) ** 2, 0) /
      Math.max(values.length, 1);
    return Math.sqrt(variance) || 1;
  };

  const wrValues = rawHeroes.map((h) => h.winRate);
  const prValues = rawHeroes.map((h) => h.pickRate);
  const brValues = rawHeroes.map((h) => h.banRate);

  const wrMean = mean(wrValues);
  const prMean = mean(prValues);
  const brMean = mean(brValues);

  const wrStd = stdDev(wrValues, wrMean);
  const prStd = stdDev(prValues, prMean);
  const brStd = stdDev(brValues, brMean);

  const scored = rawHeroes.map((hero) => {
    const zWr = (hero.winRate - wrMean) / wrStd;
    const zPr = (hero.pickRate - prMean) / prStd;
    const zBr = (hero.banRate - brMean) / brStd;

    // Skor skala 0–100 berpusat di 50 untuk keterbacaan tabel
    const compositeZ = zWr * 0.55 + zBr * 0.25 + zPr * 0.2;
    const metaScore = Number(
      Math.max(10, Math.min(99, 50 + compositeZ * 18)).toFixed(1),
    );

    return {
      ...hero,
      roles: HERO_ROLE_MAP[hero.heroSlug] ?? [],
      lanes: HERO_LANE_MAP[hero.heroSlug] ?? [],
      metaScore,
    };
  });

  scored.sort(
    (a, b) =>
      b.metaScore - a.metaScore ||
      b.winRate - a.winRate ||
      a.heroName.localeCompare(b.heroName),
  );

  const total = scored.length;

  return scored.map((hero, index) => {
    const percentile = index / Math.max(total - 1, 1);
    const tier = percentileToTier(percentile);

    return {
      ...hero,
      tier,
      overallRank: index + 1,
    };
  });
}

/**
 * Pembagian persentil transparan untuk Tier S–D:
 * - S Tier: Top 15% (Meta Dominan)
 * - A Tier: 15% – 38% (Kuat & Konsisten)
 * - B Tier: 38% – 66% (Solid / Situasional)
 * - C Tier: 66% – 86% (Khusus Spesialis)
 * - D Tier: Bottom 14% (Kurang Optimal di Patch Ini)
 */
export function percentileToTier(percentile: number): MetaTierGrade {
  if (percentile <= 0.15) return "S";
  if (percentile <= 0.38) return "A";
  if (percentile <= 0.66) return "B";
  if (percentile <= 0.86) return "C";
  return "D";
}

/**
 * Mengelompokkan daftar hero terfilter (mis. per Role atau per Lane) ke Tier S–D.
 * Bila `rebalanceInSubset` aktif, peringkat dihitung relatif terhadap subset Role tersebut
 * sehingga setiap Role selalu memiliki distribusi S–D yang jelas dan adil.
 */
export function groupHeroesByTier(
  heroes: readonly RankedMetaHero[],
  rebalanceInSubset = false,
): Record<MetaTierGrade, RankedMetaHero[]> {
  const buckets: Record<MetaTierGrade, RankedMetaHero[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };

  if (heroes.length === 0) return buckets;

  const sorted = [...heroes].sort(
    (a, b) =>
      b.metaScore - a.metaScore ||
      b.winRate - a.winRate ||
      a.heroName.localeCompare(b.heroName),
  );

  if (!rebalanceInSubset || sorted.length < 5) {
    for (const hero of sorted) {
      buckets[hero.tier].push(hero);
    }
    return buckets;
  }

  const total = sorted.length;
  sorted.forEach((hero, index) => {
    const pct = index / Math.max(total - 1, 1);
    const tier = percentileToTier(pct);
    buckets[tier].push({ ...hero, tier });
  });

  return buckets;
}

export function buildBracketSnapshot(
  key: MetaRankBracketKey,
  bigrank: string,
  label: string,
  rawHeroes: readonly RawHeroMetaStat[],
): MetaBracketSnapshot {
  const ranked = computeTierListForBracket(rawHeroes);

  const highestWinRate = [...ranked]
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  const mostBanned = [...ranked]
    .sort((a, b) => b.banRate - a.banRate)
    .slice(0, 3);

  const mostPicked = [...ranked]
    .sort((a, b) => b.pickRate - a.pickRate)
    .slice(0, 3);

  const metaLeaders = ranked.slice(0, 3);

  return {
    key,
    bigrank,
    label,
    totalHeroes: ranked.length,
    heroes: ranked,
    spotlights: {
      highestWinRate,
      mostBanned,
      mostPicked,
      metaLeaders,
    },
  };
}

export function buildMetaDashboardPayload(rawDataset: {
  fetchedAt: string;
  sourceUpdatedAt: string | null;
  source: {
    name: string;
    sourceTier: "TIER_1_OFFICIAL";
  };
  brackets: Record<
    string,
    {
      bigrank: string;
      label: string;
      heroes: RawHeroMetaStat[];
    }
  >;
}): MetaDashboardPayload {
  const keys: MetaRankBracketKey[] = [
    "mythical_glory",
    "mythical_honor",
    "mythic",
    "all_rank",
  ];

  const brackets = {} as Record<MetaRankBracketKey, MetaBracketSnapshot>;

  for (const key of keys) {
    const entry = rawDataset.brackets[key];
    brackets[key] = buildBracketSnapshot(
      key,
      entry?.bigrank ?? "",
      entry?.label ?? key,
      entry?.heroes ?? [],
    );
  }

  return {
    fetchedAt: rawDataset.fetchedAt,
    sourceUpdatedAt: rawDataset.sourceUpdatedAt,
    sourceName: rawDataset.source.name,
    sourceTier: rawDataset.source.sourceTier,
    brackets,
  };
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

export function countByTier(
  buckets: Record<MetaTierGrade, RankedMetaHero[]>,
): Record<MetaTierGrade, number> {
  return META_TIERS.reduce(
    (acc, tier) => {
      acc[tier] = buckets[tier].length;
      return acc;
    },
    {} as Record<MetaTierGrade, number>,
  );
}
