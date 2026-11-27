import type { MatchupLane } from "@/features/matchups/types/matchup-hub.types";
import type { DraftSide } from "./draft.types";

export type HeroBuildArchetype =
  | "TANK_ROAM"
  | "FIGHTER_BRUISER"
  | "PHYSICAL_ASSASSIN"
  | "MARKSMAN"
  | "MAGE_MAGIC"
  | "SUPPORT_UTILITY";

export interface VerifiedItemMeta {
  slug: string;
  name: string;
  category: string;
  tier: string;
  iconUrl: string | null;
}

export interface EnemyThreatProfile {
  magicThreats: string[];
  physicalBurstThreats: string[];
  basicAtkCritThreats: string[];
  sustainHealThreats: string[];
  hardCCThreats: string[];
  tankFrontlineThreats: string[];
}

export interface DraftBuildItemSlot {
  position: number;
  slug: string;
  name: string;
  category: string;
  iconUrl: string | null;
  slotRole: "CORE" | "COUNTER";
  /** True bila item ini menggantikan item bawaan template demi meng-counter lawan */
  isSwapped: boolean;
  replacedItemName: string | null;
  counterTag: string | null;
  counterTargets: string[];
  reason: string;
}

export interface DraftHeroBuildPlan {
  heroSlug: string;
  heroName: string;
  assignedLane: MatchupLane;
  roles: string[];
  archetype: HeroBuildArchetype;
  baseTemplateName: string;
  items: DraftBuildItemSlot[];
  counterHighlights: string[];
  workbenchUrl: string;
}

export interface DraftSideBuildPlan {
  side: DraftSide;
  enemyThreatProfile: EnemyThreatProfile;
  heroes: DraftHeroBuildPlan[];
}

export interface DraftPostBuildPayload {
  patchVersion: string;
  blueSide: DraftSideBuildPlan;
  redSide: DraftSideBuildPlan;
}
