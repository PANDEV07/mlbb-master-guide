import type { AggregatedMatchup } from "./matchup-aggregator";

export interface HeroMatchupAnalysis {
  heroA: string;
  heroB: string;
  aToB: AggregatedMatchup[];
  bToA: AggregatedMatchup[];
  summary: {
    aToBInteractions: number;
    bToAInteractions: number;
    totalSkillPairs: number;
  };
  verificationStatus: "UNVERIFIED";
  disclaimer: string;
}

export function analyzeHeroMatchup(
  matchups: AggregatedMatchup[],
  heroA: string,
  heroB: string,
): HeroMatchupAnalysis {
  const normalizedA = heroA.trim().toLowerCase();
  const normalizedB = heroB.trim().toLowerCase();

  if (!normalizedA || !normalizedB) {
    throw new Error("Nama kedua hero wajib diisi.");
  }

  if (normalizedA === normalizedB) {
    throw new Error("Matchup membutuhkan dua hero yang berbeda.");
  }

  const aToB = matchups.filter(
    (matchup) =>
      matchup.sourceHero.toLowerCase() === normalizedA &&
      matchup.targetHero.toLowerCase() === normalizedB,
  );

  const bToA = matchups.filter(
    (matchup) =>
      matchup.sourceHero.toLowerCase() === normalizedB &&
      matchup.targetHero.toLowerCase() === normalizedA,
  );

  return {
    heroA,
    heroB,
    aToB,
    bToA,
    summary: {
      aToBInteractions: aToB.length,
      bToAInteractions: bToA.length,
      totalSkillPairs: [...aToB, ...bToA].reduce(
        (total, matchup) => total + matchup.skillPairCount,
        0,
      ),
    },
    verificationStatus: "UNVERIFIED",
    disclaimer:
      "Analisis ini menampilkan kandidat interaksi mekanik berdasarkan kategori dan tag dataset skill. Jumlah kandidat bukan skor counter atau ukuran keunggulan. Efek aktual, kondisi skill, timing, dan interaksi dalam game belum diverifikasi.",
  };
}