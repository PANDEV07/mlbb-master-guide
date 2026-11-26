import type {
  CanonicalClaimClassification,
  CanonicalVerificationStatus,
  PatchChangeType,
  ServerEnvironment,
  SourceTier,
} from "@/types/knowledge";

export interface PatchVersionSummary {
  id: string;
  versionCode: string;
  versionOrder: number;
  serverType: ServerEnvironment;
  seasonLabel: string | null;
  releaseDate: string | null;
  isCurrentLive: boolean;
  notesSummary: string | null;
}

export interface PatchChangeRecord {
  id: string;
  patchVersionId: string;
  targetEntityType: string;
  targetEntityId: string | null;
  targetEntitySlug: string | null;
  changeType: PatchChangeType;
  attributeName: string | null;
  previousValue: string | null;
  newValue: string | null;
  summary: string;
}

export interface SourceRegistryRecord {
  id: string;
  name: string;
  domain: string;
  baseUrl: string;
  sourceTier: SourceTier;
  sourceCategory: string;
  reliabilityNotes: string | null;
  isActive: boolean;
}

export interface EvidenceAuditBucket {
  entityType: string;
  verificationStatus: CanonicalVerificationStatus;
  claimClassification: CanonicalClaimClassification;
  count: number;
}

export interface EntityInventorySummary {
  heroesCount: number;
  itemsCount: number;
  activeItemProfilesCount: number;
  heroBuildTemplatesCount: number;
  publishedHeroBuildsCount: number;
  outdatedHeroBuildsCount: number;
  proMatchesCount: number;
}

export interface EvidenceHealthSummary {
  totalEvidences: number;
  verifiedCount: number;
  partiallyVerifiedCount: number;
  unverifiedCount: number;
  outdatedCount: number;
  conflictingCount: number;
  otherCount: number;
  needsReviewCount: number;
  byEntityType: Array<{
    entityType: string;
    total: number;
    verified: number;
    partiallyVerified: number;
    unverified: number;
    outdated: number;
    conflicting: number;
  }>;
}

export interface PatchHubSnapshot {
  patches: PatchVersionSummary[];
  changes: PatchChangeRecord[];
  sources: SourceRegistryRecord[];
  evidenceBuckets: EvidenceAuditBucket[];
  evidenceHealth: EvidenceHealthSummary;
  inventory: EntityInventorySummary;
}
