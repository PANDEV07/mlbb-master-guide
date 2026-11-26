import type { PatchChangeType, ServerEnvironment } from "@/types/knowledge";
import type {
  EvidenceAuditBucket,
  EvidenceHealthSummary,
  PatchChangeRecord,
  PatchVersionSummary,
} from "../types/patch-hub.types";

export const PATCH_LIFECYCLE_STAGES = [
  {
    step: 1,
    title: "Research",
    description: "Kumpulkan catatan resmi Original Server dari in-game atau portal MOONTON.",
  },
  {
    step: 2,
    title: "Verification",
    description: "Validasi sumber sesuai hirarki Tier 1–4; pisahkan tegas Advance Server.",
  },
  {
    step: 3,
    title: "Knowledge Update",
    description: "Catat diff atribut hero, item, emblem, atau battlefield ke patch_changes.",
  },
  {
    step: 4,
    title: "Patch Association",
    description: "Tautkan profil versi baru dan bukti ke patch_version_id terkait.",
  },
  {
    step: 5,
    title: "Historical Preservation",
    description: "Tutup rentang profil patch lama tanpa menghapus riwayat atau fakta match.",
  },
  {
    step: 6,
    title: "Review & Outdated Flag",
    description: "Tandai derived knowledge terdampak sebagai OUTDATED untuk audit ulang.",
  },
  {
    step: 7,
    title: "Publication",
    description: "Pulihkan status menjadi VERIFIED setelah audit ulang selesai.",
  },
] as const;

export function filterPatchesByServer(
  patches: PatchVersionSummary[],
  serverType: ServerEnvironment,
): PatchVersionSummary[] {
  return patches
    .filter((patch) => patch.serverType === serverType)
    .sort((a, b) => b.versionOrder - a.versionOrder);
}

export function filterPatchChanges(
  changes: PatchChangeRecord[],
  options: {
    patchVersionId: string | null;
    changeType: PatchChangeType | "ALL";
    targetEntityType: string | "ALL";
  },
): PatchChangeRecord[] {
  return changes.filter((change) => {
    if (options.patchVersionId && change.patchVersionId !== options.patchVersionId) {
      return false;
    }
    if (options.changeType !== "ALL" && change.changeType !== options.changeType) {
      return false;
    }
    if (
      options.targetEntityType !== "ALL" &&
      change.targetEntityType.toLowerCase() !==
        options.targetEntityType.toLowerCase()
    ) {
      return false;
    }
    return true;
  });
}

export function summarizeEvidenceHealth(
  buckets: EvidenceAuditBucket[],
): EvidenceHealthSummary {
  let totalEvidences = 0;
  let verifiedCount = 0;
  let partiallyVerifiedCount = 0;
  let unverifiedCount = 0;
  let outdatedCount = 0;
  let conflictingCount = 0;
  let otherCount = 0;

  const entityMap = new Map<
    string,
    {
      entityType: string;
      total: number;
      verified: number;
      partiallyVerified: number;
      unverified: number;
      outdated: number;
      conflicting: number;
    }
  >();

  for (const bucket of buckets) {
    const count = bucket.count;
    totalEvidences += count;

    const current = entityMap.get(bucket.entityType) ?? {
      entityType: bucket.entityType,
      total: 0,
      verified: 0,
      partiallyVerified: 0,
      unverified: 0,
      outdated: 0,
      conflicting: 0,
    };
    current.total += count;

    switch (bucket.verificationStatus) {
      case "VERIFIED":
        verifiedCount += count;
        current.verified += count;
        break;
      case "PARTIALLY_VERIFIED":
        partiallyVerifiedCount += count;
        current.partiallyVerified += count;
        break;
      case "UNVERIFIED":
        unverifiedCount += count;
        current.unverified += count;
        break;
      case "OUTDATED":
        outdatedCount += count;
        current.outdated += count;
        break;
      case "CONFLICTING":
        conflictingCount += count;
        current.conflicting += count;
        break;
      default:
        otherCount += count;
        break;
    }

    entityMap.set(bucket.entityType, current);
  }

  return {
    totalEvidences,
    verifiedCount,
    partiallyVerifiedCount,
    unverifiedCount,
    outdatedCount,
    conflictingCount,
    otherCount,
    needsReviewCount:
      unverifiedCount + outdatedCount + conflictingCount + partiallyVerifiedCount,
    byEntityType: [...entityMap.values()].sort((a, b) => b.total - a.total),
  };
}
