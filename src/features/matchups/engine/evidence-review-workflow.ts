export const REVIEW_STATUSES = [
  "UNVERIFIED",
  "NEEDS_REVIEW",
  "VERIFIED",
  "REJECTED",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface ManualReviewInput {
  itemId: string;
  status: Exclude<ReviewStatus, "UNVERIFIED">;
  reviewer: string;
  reviewedAt: string;
  rationale: string;
  evidenceConfirmed?: boolean;
  sourceRefs?: string[];
}

export interface ManualReviewRecord {
  itemId: string;
  status: Exclude<ReviewStatus, "UNVERIFIED">;
  reviewer: string;
  reviewedAt: string;
  rationale: string;
  evidenceConfirmed: boolean;
  sourceRefs: string[];
}

export function createManualReviewRecord(
  input: ManualReviewInput,
): ManualReviewRecord {
  const reviewer = input.reviewer.trim();
  const rationale = input.rationale.trim();
  const sourceRefs = [...new Set(
    (input.sourceRefs ?? [])
      .map((value) => value.trim())
      .filter(Boolean),
  )];

  if (!input.itemId.trim()) {
    throw new Error("Item ID wajib diisi.");
  }

  if (!reviewer) {
    throw new Error("Identitas reviewer wajib diisi.");
  }

  if (!rationale) {
    throw new Error("Alasan keputusan review wajib diisi.");
  }

  if (!Number.isFinite(Date.parse(input.reviewedAt))) {
    throw new Error("Waktu review harus berupa tanggal yang valid.");
  }

  if (
    input.status === "VERIFIED" &&
    (input.evidenceConfirmed !== true || sourceRefs.length === 0)
  ) {
    throw new Error(
      "VERIFIED membutuhkan konfirmasi evidence dan minimal satu referensi sumber.",
    );
  }

  return {
    itemId: input.itemId.trim(),
    status: input.status,
    reviewer,
    reviewedAt: new Date(input.reviewedAt).toISOString(),
    rationale,
    evidenceConfirmed: input.evidenceConfirmed === true,
    sourceRefs,
  };
}