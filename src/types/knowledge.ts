export type LegacyVerificationStatus =
  | "VERIFIED"
  | "PARTIAL"
  | "UNVERIFIED"
  | "STALE"
  | "NOT_YET_AVAILABLE";

export type CanonicalVerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "UNVERIFIED"
  | "OUTDATED"
  | "CONFLICTING"
  | "UNKNOWN"
  | "NOT_RESEARCHED"
  | "NOT_YET_AVAILABLE"
  | "NOT_FOUND";

export type VerificationStatus = LegacyVerificationStatus | CanonicalVerificationStatus;

export type ClaimClassification =
  | "VERIFIED_FACT"
  | "RESEARCH_BASED_ANALYSIS"
  | "STRATEGIC_INTERPRETATION"
  | "COMMUNITY_THEORY"
  | "UNKNOWN_UNVERIFIED";

export type CanonicalClaimClassification =
  | "OFFICIAL_FACT"
  | "SECONDARY_SOURCE"
  | "RESEARCH_BASED_ANALYSIS"
  | "STRATEGIC_INTERPRETATION"
  | "COMMUNITY_THEORY"
  | "UNKNOWN";

export type ServerEnvironment =
  | "ORIGINAL_SERVER"
  | "ADVANCE_SERVER"
  | "EXPERIMENTAL";

export type PatchChangeType =
  | "BUFF"
  | "NERF"
  | "ADJUST"
  | "REVAMP"
  | "NEW"
  | "BUGFIX";

export type SourceTier =
  | "TIER_1_OFFICIAL"
  | "TIER_2_SECONDARY"
  | "TIER_3_ANALYTICAL"
  | "TIER_4_COMMUNITY";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type EvidenceStance = "SUPPORTING" | "CONFLICTING";

export interface EntityEvidenceRef {
  sourceId: string;
  aspectName: string;
  sourceUrl: string | null;
  claimClassification: CanonicalClaimClassification;
  verificationStatus: CanonicalVerificationStatus;
  confidenceLevel: ConfidenceLevel;
  stance: EvidenceStance;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface KnowledgeGovernanceMeta {
  patchVersion: string;
  serverEnvironment: ServerEnvironment;
  verificationStatus: VerificationStatus;
  confidenceLevel: ConfidenceLevel;
  lastVerified: string | null;
  sourceLabel: string | null;
  claimClassification?: CanonicalClaimClassification;
  verifiedBy?: string | null;
  evidences?: EntityEvidenceRef[];
}

export interface PlatformModuleSpec {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: "core" | "tactical" | "intelligence";
  description: string;
  plannedScope: string[];
  requiredEntities: string[];
  phaseTarget: string;
  currentState: "SKELETON_READY" | "RESEARCH_IN_PROGRESS";
}
