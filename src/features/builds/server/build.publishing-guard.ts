import { buildProfileSchema } from "../schemas/build.schema";

export type PublishingEvidence = {
  verificationStatus: string;
  sourceUrl: string | null;
  claimClassification: string;
};

export type BuildPublishingResult = {
  allowed: boolean;
  errors: string[];
  warnings: string[];
};

export function evaluateBuildPublishing(
  profileInput: unknown,
  verificationStatus: string,
  evidence: PublishingEvidence[],
): BuildPublishingResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = buildProfileSchema.safeParse(profileInput);

  if (!parsed.success) {
    errors.push(
      ...parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    );
  }

  if (verificationStatus !== "VERIFIED") {
    errors.push(
      "Build belum dapat dipublikasikan: status verifikasi harus VERIFIED.",
    );
  }

  if (evidence.length === 0) {
    errors.push("Build wajib memiliki minimal satu bukti sumber.");
  }

  const unverifiedEvidence = evidence.filter(
    (item) => item.verificationStatus !== "VERIFIED",
  );

  if (unverifiedEvidence.length > 0) {
    errors.push(
      `${unverifiedEvidence.length} bukti belum berstatus VERIFIED.`,
    );
  }

  const evidenceWithoutUrl = evidence.filter(
    (item) => !item.sourceUrl?.trim(),
  );

  if (evidenceWithoutUrl.length > 0) {
    errors.push(
      `${evidenceWithoutUrl.length} bukti tidak memiliki URL sumber.`,
    );
  }

  if (
    evidence.some(
      (item) => item.claimClassification === "COMMUNITY_THEORY",
    )
  ) {
    warnings.push(
      "Terdapat bukti Community Theory. Jangan sajikan sebagai fakta resmi.",
    );
  }

  return {
    allowed: errors.length === 0,
    errors,
    warnings,
  };
}