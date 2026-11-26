export type MetaRankBracketKey =
  | "mythical_glory"
  | "mythical_honor"
  | "mythic"
  | "all_rank";

export type MetaTierGrade = "S" | "A" | "B" | "C" | "D";

export const META_TIERS: readonly MetaTierGrade[] = ["S", "A", "B", "C", "D"];

export const META_ROLES = [
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
] as const;

export type MetaRole = (typeof META_ROLES)[number];

export const META_LANES = [
  "EXP Lane",
  "Jungle",
  "Mid Lane",
  "Gold Lane",
  "Roam",
] as const;

export type MetaLane = (typeof META_LANES)[number];

export interface RawHeroMetaStat {
  heroId: number;
  heroName: string;
  heroSlug: string;
  winRate: number;
  pickRate: number;
  banRate: number;
}

export interface RankedMetaHero {
  heroId: number;
  heroName: string;
  heroSlug: string;
  roles: string[];
  lanes: string[];
  winRate: number;
  pickRate: number;
  banRate: number;
  metaScore: number;
  tier: MetaTierGrade;
  overallRank: number;
}

export interface MetaBracketSnapshot {
  key: MetaRankBracketKey;
  bigrank: string;
  label: string;
  totalHeroes: number;
  heroes: RankedMetaHero[];
  spotlights: {
    highestWinRate: RankedMetaHero[];
    mostBanned: RankedMetaHero[];
    mostPicked: RankedMetaHero[];
    metaLeaders: RankedMetaHero[];
  };
}

export interface MetaDashboardPayload {
  fetchedAt: string;
  sourceUpdatedAt: string | null;
  sourceName: string;
  sourceTier: "TIER_1_OFFICIAL";
  brackets: Record<MetaRankBracketKey, MetaBracketSnapshot>;
}
