import { pgEnum } from "drizzle-orm/pg-core";

export const serverTypeEnum = pgEnum("server_type_enum", [
  "ORIGINAL_SERVER",
  "ADVANCE_SERVER",
  "EXPERIMENTAL",
]);

export const patchChangeTypeEnum = pgEnum("patch_change_type_enum", [
  "BUFF",
  "NERF",
  "ADJUST",
  "REVAMP",
  "NEW",
  "BUGFIX",
]);

export const sourceTierEnum = pgEnum("source_tier_enum", [
  "TIER_1_OFFICIAL",
  "TIER_2_SECONDARY",
  "TIER_3_ANALYTICAL",
  "TIER_4_COMMUNITY",
]);

export const claimClassificationEnum = pgEnum("claim_classification_enum", [
  "OFFICIAL_FACT",
  "SECONDARY_SOURCE",
  "RESEARCH_BASED_ANALYSIS",
  "STRATEGIC_INTERPRETATION",
  "COMMUNITY_THEORY",
  "UNKNOWN",
]);

export const verificationStatusEnum = pgEnum("verification_status_enum", [
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "UNVERIFIED",
  "OUTDATED",
  "CONFLICTING",
  "UNKNOWN",
  "NOT_RESEARCHED",
  "NOT_YET_AVAILABLE",
  "NOT_FOUND",
]);

// Existing enums above remain unchanged

// ----------------------------------------
// New enum for KnowledgeEntity domain types
// ----------------------------------------
export const entityTypeEnum = pgEnum("entity_type_enum", [
  "hero",
  "item",
  "emblem",
  "spell",
  "skill",
]);

// Existing confidence level and stance enums (unchanged)
export const confidenceLevelEnum = pgEnum("confidence_level_enum", [
  "HIGH",
  "MEDIUM",
  "LOW",
]);

export const evidenceStanceEnum = pgEnum("evidence_stance_enum", [
  "SUPPORTING",
  "CONFLICTING",
]);

export const proMatchTeamSideEnum = pgEnum("pro_match_team_side_enum", [
  "BLUE",
  "RED",
  "UNKNOWN",
]);

export const proMatchResultEnum = pgEnum("pro_match_result_enum", [
  "WIN",
  "LOSS",
  "UNKNOWN",
]);

export const proBuildItemCatalogStatusEnum = pgEnum(
  "pro_build_item_catalog_status_enum",
  ["MATCHED", "UNMATCHED", "AMBIGUOUS"],
);
