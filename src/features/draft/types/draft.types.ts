import type { MetaTierGrade } from "@/features/meta/types/meta.types";
import type {
  DamageProfileTag,
  MatchupLane,
} from "@/features/matchups/types/matchup-hub.types";

export type DraftFormat = "mpl" | "ranked";
export type DraftSide = "BLUE" | "RED";
export type DraftActionType = "BAN" | "PICK";
export type DraftControlMode = "MANUAL" | "VS_AI_BLUE" | "VS_AI_RED";

export interface DraftTurnSpec {
  /** Indeks langkah 0..19 */
  index: number;
  side: DraftSide;
  action: DraftActionType;
  /** Slot indeks 0..4 pada daftar Ban atau Pick sisi terkait */
  slotIndex: number;
  phaseLabel: string;
  shortLabel: string;
}

export interface DraftHeroEntry {
  slug: string;
  name: string;
  roles: string[];
  lanes: MatchupLane[];
  tier: MetaTierGrade;
  metaScore: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  damageProfile: DamageProfileTag;
  hasHardCC: boolean;
  hasMobility: boolean;
  hasSustain: boolean;
  hasFrontline: boolean;
}

export interface DraftRecommendation {
  hero: DraftHeroEntry;
  score: number;
  primaryTag: string;
  reasons: string[];
}

export interface TeamLiveAudit {
  filledLanes: MatchupLane[];
  missingLanes: MatchupLane[];
  physicalCount: number;
  magicCount: number;
  trueOrMixedCount: number;
  hardCCCount: number;
  frontlineCount: number;
  sustainCount: number;
  mobilityCount: number;
  avgMetaScore: number | null;
  avgWinRate: number | null;
  warnings: string[];
  strengths: string[];
}

export interface DraftBoardState {
  format: DraftFormat;
  blueBans: (string | null)[];
  redBans: (string | null)[];
  bluePicks: (string | null)[];
  redPicks: (string | null)[];
  /** Urutan slug hero yang sudah dikunci untuk mendukung Undo */
  history: string[];
}
