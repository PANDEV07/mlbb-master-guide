import type { HeroComboCollection, HeroSkillDisplayItem } from "@/features/heroes/types/hero-combo.types";

export const MATCHUP_LANES = [
  "EXP Lane",
  "Jungle",
  "Mid Lane",
  "Gold Lane",
  "Roam",
] as const;

export type MatchupLane = (typeof MATCHUP_LANES)[number];

export const MECHANIC_DIMENSIONS = [
  { key: "DAMAGE", label: "Damage" },
  { key: "CROWD_CONTROL", label: "Crowd Control" },
  { key: "MOBILITY", label: "Mobilitas" },
  { key: "DEFENSE", label: "Pertahanan" },
  { key: "SUSTAIN", label: "Sustain" },
  { key: "BUFF_DEBUFF", label: "Buff / Debuff" },
  { key: "UTILITY", label: "Utilitas" },
  { key: "SPECIAL", label: "Mekanik Khusus" },
] as const;

export type MechanicDimensionKey = (typeof MECHANIC_DIMENSIONS)[number]["key"];

export type DamageProfileTag = "Physical" | "Magic" | "True" | "Mixed" | "Belum Terpetakan";

export interface HeroMechanicProfileSummary {
  heroName: string;
  heroSlug: string;
  roles: string[];
  lanes: string[];
  skillCount: number;
  damageProfile: DamageProfileTag;
  damageSources: {
    physical: number;
    magic: number;
    trueDamage: number;
  };
  dimensionCounts: Record<MechanicDimensionKey, number>;
  hardControlCount: number;
  slowCount: number;
  mobilityEvidenceCount: number;
  sustainEvidenceCount: number;
  defenseEvidenceCount: number;
  immunityEvidenceCount: number;
  specificMechanics: string[];
  verificationStatus: "UNVERIFIED";
}

export interface MatchupItemRecommendation {
  itemName: string;
  itemSlug: string;
  itemIconUrl: string | null;
  itemCategory: string;
  ruleIds: string[];
  explanation: string;
  evidenceCount: number;
  verificationStatus: "UNVERIFIED";
}

export interface MatchupControlImmunityPair {
  id: string;
  sourceHero: string;
  targetHero: string;
  sourceSkill: string;
  targetSkill: string;
  sourceMechanics: string[];
  targetMechanics: string[];
  explanation: string;
  verificationStatus: "UNVERIFIED";
}

export interface MatchupPhaseChecklistItem {
  phase: "early" | "mid" | "late";
  title: string;
  focusForA: string;
  focusForB: string;
  basis: "MECHANIC_EVIDENCE" | "STRATEGIC_INTERPRETATION";
}

export interface EnrichedHeadToHeadData {
  profileA: HeroMechanicProfileSummary;
  profileB: HeroMechanicProfileSummary;
  sharedLanes: string[];
  skillsA: Array<{ apiGroupId: string; skills: HeroSkillDisplayItem[] }>;
  skillsB: Array<{ apiGroupId: string; skills: HeroSkillDisplayItem[] }>;
  combosA: HeroComboCollection | null;
  combosB: HeroComboCollection | null;
  controlVsImmunity: {
    aToB: MatchupControlImmunityPair[];
    bToA: MatchupControlImmunityPair[];
  };
  itemRecommendations: {
    forAAgainstB: MatchupItemRecommendation[];
    forBAgainstA: MatchupItemRecommendation[];
    catalogAvailable: boolean;
  };
  phaseChecklists: MatchupPhaseChecklistItem[];
  verificationStatus: "UNVERIFIED";
}

export interface TeamSlotInput {
  lane: MatchupLane;
  heroName: string | null;
}

export type CompositionPillarStatus = "STRONG" | "ADEQUATE" | "MISSING";

export interface TeamCompositionPillar {
  id:
    | "FRONTLINE"
    | "HARD_CC"
    | "MOBILITY_ENGAGE"
    | "SUSTAIN"
    | "IMMUNITY_PEEL"
    | "DAMAGE_BALANCE";
  label: string;
  status: CompositionPillarStatus;
  count: number;
  contributors: string[];
  summary: string;
}

export interface TeamCompositionAudit {
  side: "ALLY" | "ENEMY";
  filledSlots: number;
  heroes: HeroMechanicProfileSummary[];
  damageMix: {
    physicalHeroes: number;
    magicHeroes: number;
    trueDamageHeroes: number;
    balanceNote: string;
  };
  pillars: TeamCompositionPillar[];
  totals: {
    hardControl: number;
    mobility: number;
    defense: number;
    sustain: number;
    immunity: number;
    damageSkills: number;
  };
  warnings: string[];
}

export interface LaneMatchupSummary {
  lane: MatchupLane;
  allyHero: HeroMechanicProfileSummary | null;
  enemyHero: HeroMechanicProfileSummary | null;
  allyToEnemyRules: number;
  enemyToAllyRules: number;
  totalSkillPairs: number;
  highlights: string[];
}

export interface TeamEnemyThreatSummary {
  mechanic: string;
  label: string;
  heroNames: string[];
  skillCount: number;
}

export interface TeamSlotSuggestion {
  lane: MatchupLane;
  heroName: string;
  heroSlug: string;
  roles: string[];
  lanes: string[];
  counteredEnemies: string[];
  matchedRules: string[];
  fillsGaps: string[];
  verificationStatus: "UNVERIFIED";
}

export interface TeamDraftAnalysisPayload {
  allyAudit: TeamCompositionAudit;
  enemyAudit: TeamCompositionAudit;
  laneMatchups: LaneMatchupSummary[];
  enemyThreats: TeamEnemyThreatSummary[];
  recommendedTeamItems: Array<
    MatchupItemRecommendation & {
      effectiveAgainst: string[];
    }
  >;
  allySuggestions: TeamSlotSuggestion[];
  itemCatalogAvailable: boolean;
  verificationStatus: "UNVERIFIED";
  disclaimer: string;
}
