export type HeroEvidence = {
  id: string;
  aspectName: string;
  sourceName: string;
  sourceDomain: string;
  sourceTier:
    | "TIER_1_OFFICIAL"
    | "TIER_2_SECONDARY"
    | "TIER_3_ANALYTICAL"
    | "TIER_4_COMMUNITY";
  sourceUrl: string | null;
  claimClassification:
    | "OFFICIAL_FACT"
    | "SECONDARY_SOURCE"
    | "RESEARCH_BASED_ANALYSIS"
    | "STRATEGIC_INTERPRETATION"
    | "COMMUNITY_THEORY"
    | "UNKNOWN";
  verificationStatus:
    | "VERIFIED"
    | "PARTIALLY_VERIFIED"
    | "UNVERIFIED"
    | "OUTDATED"
    | "CONFLICTING"
    | "UNKNOWN"
    | "NOT_RESEARCHED"
    | "NOT_YET_AVAILABLE"
    | "NOT_FOUND";
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  stance: "SUPPORTING" | "CONFLICTING";
  evidenceExcerpt: string | null;
  conflictNotes: string | null;
  patchVersionId: string | null;
  verifiedAt: Date | null;
};