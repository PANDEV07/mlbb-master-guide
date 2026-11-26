import type {
  CanonicalClaimClassification,
  CanonicalVerificationStatus,
  ConfidenceLevel,
} from "@/types/knowledge";

export type RankedModeId = "SOLO" | "DUO" | "TRIO" | "FIVE_MAN";

export type GameplayPhaseId =
  | "DRAFT"
  | "EARLY"
  | "MID"
  | "LATE";

export type AdaptationRating =
  | "RECOMMENDED"
  | "CONDITIONAL"
  | "HIGH_RISK"
  | "NOT_RECOMMENDED";

export type CoordinationRequirement =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "PRO_LEVEL_VOICE_REQUIRED";

export interface ModeTipItem {
  id: string;
  phase: GameplayPhaseId;
  title: string;
  principle: string;
  actionSteps: string[];
  commonMistake: string;
  recommendedRoles?: string;
}

export interface RankedContextProfile {
  id: RankedModeId;
  title: string;
  shortLabel: string;
  coordinationLabel: string;
  draftControlLabel: string;
  riskProfileLabel: string;
  focusSummary: string;
  idealSynergyNote: string;
  goldenRules: string[];
  tips: ModeTipItem[];
}

export interface SevenDimensionRow {
  dimension: string;
  proPlay: string;
  FIVE_MAN: string;
  TRIO: string;
  DUO: string;
  SOLO: string;
}

export interface ModeAdaptationDetail {
  rating: AdaptationRating;
  howToExecute: string;
  risks: string;
  safeAlternative: string | null;
}

export interface TournamentReferenceLink {
  label: string;
  region: string;
  url: string | null;
  sourceTier: "TIER_1_OFFICIAL" | "TIER_2_SECONDARY";
}

export interface ProToRankedCaseStudy {
  id: string;
  title: string;
  category: "MACRO" | "OBJECTIVE" | "LANE_CONTROL" | "INVADE" | "ROTATION";
  coordinationRequirement: CoordinationRequirement;
  tournamentCircuits: string[];
  references: TournamentReferenceLink[];
  /** Q1: Apa yang benar-benar dilakukan tim profesional? */
  observedProExecution: string;
  /** Q2: Mengapa strategi tersebut berhasil? */
  whyItWorks: string;
  /** Q3: Kondisi apa yang memungkinkan strategi itu berjalan? */
  requiredConditions: string[];
  /** Q4: Apakah realistis diterapkan di Ranked? */
  rankedRealismCheck: string;
  /** Q5: Adaptasi dan risiko spesifik untuk Solo, Duo, Trio, dan 5-Man */
  modeAdaptations: Record<RankedModeId, ModeAdaptationDetail>;
  limitations: string;
  claimClassification: CanonicalClaimClassification;
  verificationStatus: CanonicalVerificationStatus;
  confidenceLevel: ConfidenceLevel;
  referencePatchNote: string;
}
