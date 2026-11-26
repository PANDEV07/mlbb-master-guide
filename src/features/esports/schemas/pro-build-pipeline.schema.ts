import { z } from "zod";

export const PRO_MATCH_TEAM_SIDES = ["BLUE", "RED", "UNKNOWN"] as const;
export const PRO_MATCH_RESULTS = ["WIN", "LOSS", "UNKNOWN"] as const;
export const PRO_BUILD_ITEM_CATALOG_STATUSES = [
  "MATCHED",
  "UNMATCHED",
  "AMBIGUOUS",
] as const;

export const PRO_VERIFICATION_STATUSES = [
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "UNVERIFIED",
  "OUTDATED",
  "CONFLICTING",
  "UNKNOWN",
  "NOT_RESEARCHED",
  "NOT_YET_AVAILABLE",
  "NOT_FOUND",
] as const;

export const SERVER_TYPES = [
  "ORIGINAL_SERVER",
  "ADVANCE_SERVER",
  "EXPERIMENTAL",
] as const;

export const SOURCE_TIERS = [
  "TIER_1_OFFICIAL",
  "TIER_2_SECONDARY",
  "TIER_3_ANALYTICAL",
  "TIER_4_COMMUNITY",
] as const;

export const CLAIM_CLASSIFICATIONS = [
  "OFFICIAL_FACT",
  "SECONDARY_SOURCE",
  "RESEARCH_BASED_ANALYSIS",
  "STRATEGIC_INTERPRETATION",
  "COMMUNITY_THEORY",
  "UNKNOWN",
] as const;

export const CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;

export const proMatchSchema = z
  .object({
    tournamentName: z.string().trim().min(1).max(160),
    stageName: z.string().trim().min(1).max(120).nullable().optional(),
    matchCode: z.string().trim().min(1).max(160).nullable().optional(),
    gameNumber: z.number().int().min(1).nullable().optional(),
    teamAName: z.string().trim().min(1).max(120),
    teamBName: z.string().trim().min(1).max(120),
    winnerTeamName: z.string().trim().min(1).max(120).nullable().optional(),
    matchDate: z.string().date().nullable().optional(),
    playedAt: z.coerce.date().nullable().optional(),
    patchVersionId: z.string().uuid().nullable().optional(),
    serverType: z.enum(SERVER_TYPES).default("ORIGINAL_SERVER"),
    rawPatchVersion: z.string().trim().min(1).max(64).nullable().optional(),
    verificationStatus: z
      .enum(PRO_VERIFICATION_STATUSES)
      .default("UNVERIFIED"),
  })
  .superRefine((value, ctx) => {
    if (value.teamAName.toLowerCase() === value.teamBName.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["teamBName"],
        message: "teamAName dan teamBName harus berbeda.",
      });
    }

    if (
      value.winnerTeamName &&
      value.winnerTeamName !== value.teamAName &&
      value.winnerTeamName !== value.teamBName
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["winnerTeamName"],
        message: "winnerTeamName harus sama dengan teamAName atau teamBName.",
      });
    }

    if (value.verificationStatus === "VERIFIED" && !value.patchVersionId) {
      ctx.addIssue({
        code: "custom",
        path: ["patchVersionId"],
        message:
          "Pertandingan berstatus VERIFIED wajib terikat ke patchVersionId.",
      });
    }
  });

export const proMatchBuildItemSchema = z
  .object({
    slotOrder: z.number().int().min(1).max(6),
    rawItemName: z.string().trim().min(1).max(160),
    itemEntityId: z.string().uuid().nullable().default(null),
    catalogMatchStatus: z
      .enum(PRO_BUILD_ITEM_CATALOG_STATUSES)
      .default("UNMATCHED"),
    verificationStatus: z
      .enum(PRO_VERIFICATION_STATUSES)
      .default("UNVERIFIED"),
    isVerifiedItem: z.boolean().default(false),
  })
  .superRefine((item, ctx) => {
    if (!item.itemEntityId) {
      if (item.catalogMatchStatus === "MATCHED") {
        ctx.addIssue({
          code: "custom",
          path: ["catalogMatchStatus"],
          message:
            "Item tanpa itemEntityId tidak boleh berstatus MATCHED.",
        });
      }

      if (
        item.isVerifiedItem ||
        item.verificationStatus === "VERIFIED" ||
        item.verificationStatus === "PARTIALLY_VERIFIED"
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["verificationStatus"],
          message:
            "Item yang belum cocok dengan katalog tetap disimpan sebagai nama mentah, tetapi tidak boleh dianggap terverifikasi.",
        });
      }
      return;
    }

    if (item.catalogMatchStatus !== "MATCHED") {
      ctx.addIssue({
        code: "custom",
        path: ["catalogMatchStatus"],
        message: "Item dengan itemEntityId wajib berstatus MATCHED.",
      });
    }

    const expectedVerified = item.verificationStatus === "VERIFIED";
    if (item.isVerifiedItem !== expectedVerified) {
      ctx.addIssue({
        code: "custom",
        path: ["isVerifiedItem"],
        message:
          "isVerifiedItem harus konsisten dengan verificationStatus === 'VERIFIED'.",
      });
    }
  });

export const proMatchPlayerBuildSchema = z
  .object({
    playerName: z.string().trim().min(1).max(120),
    teamName: z.string().trim().min(1).max(120),
    teamSide: z.enum(PRO_MATCH_TEAM_SIDES).default("UNKNOWN"),
    roleLane: z.string().trim().min(1).max(64).nullable().optional(),
    heroEntityId: z.string().uuid().nullable().default(null),
    rawHeroName: z.string().trim().min(1).max(120),
    battleSpellEntityId: z.string().uuid().nullable().default(null),
    rawBattleSpellName: z.string().trim().min(1).max(120).nullable().optional(),
    emblemEntityId: z.string().uuid().nullable().default(null),
    rawEmblemName: z.string().trim().min(1).max(120).nullable().optional(),
    rawEmblemTalents: z.array(z.string().trim().min(1).max(80)).default([]),
    matchResult: z.enum(PRO_MATCH_RESULTS).default("UNKNOWN"),
    kills: z.number().int().min(0).nullable().optional(),
    deaths: z.number().int().min(0).nullable().optional(),
    assists: z.number().int().min(0).nullable().optional(),
    verificationStatus: z
      .enum(PRO_VERIFICATION_STATUSES)
      .default("UNVERIFIED"),
    items: z
      .array(proMatchBuildItemSchema)
      .min(1)
      .max(6)
      .superRefine((items, ctx) => {
        const slots = items.map((item) => item.slotOrder);
        if (new Set(slots).size !== slots.length) {
          ctx.addIssue({
            code: "custom",
            message: "Setiap slotOrder (1–6) dalam build harus unik.",
          });
        }
      }),
  })
  .superRefine((build, ctx) => {
    if (build.verificationStatus === "VERIFIED" && !build.heroEntityId) {
      ctx.addIssue({
        code: "custom",
        path: ["heroEntityId"],
        message:
          "Build pemain berstatus VERIFIED wajib memiliki heroEntityId yang cocok.",
      });
    }
  });

export const proMatchSourceSchema = z.object({
  provider: z.string().trim().min(1).max(100),
  sourceUrl: z.string().trim().url(),
  sourceTier: z.enum(SOURCE_TIERS).default("TIER_2_SECONDARY"),
  sourceRegistryId: z.string().uuid().nullable().optional(),
  importedAt: z.coerce.date().optional(),
  verificationStatus: z
    .enum(PRO_VERIFICATION_STATUSES)
    .default("UNVERIFIED"),
  claimClassification: z.enum(CLAIM_CLASSIFICATIONS).default("UNKNOWN"),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS).default("LOW"),
  verifiedAt: z.coerce.date().nullable().optional(),
  verifiedBy: z.string().trim().min(1).max(128).nullable().optional(),
  evidenceExcerpt: z.string().trim().min(1).nullable().optional(),
});

export type ProMatchInput = z.input<typeof proMatchSchema>;
export type ProMatchPlayerBuildInput = z.input<typeof proMatchPlayerBuildSchema>;
export type ProMatchBuildItemInput = z.input<typeof proMatchBuildItemSchema>;
export type ProMatchSourceInput = z.input<typeof proMatchSourceSchema>;

/**
 * Helper aman saat mengonstruksi item build pro dari pipeline impor:
 * item tanpa `itemEntityId` selalu dipaksa UNMATCHED / UNVERIFIED / isVerifiedItem = false.
 */
export function buildProMatchItemRecord(params: {
  slotOrder: number;
  rawItemName: string;
  itemEntityId?: string | null;
  ambiguous?: boolean;
  verified?: boolean;
}): z.output<typeof proMatchBuildItemSchema> {
  const itemEntityId = params.itemEntityId ?? null;

  if (!itemEntityId) {
    return proMatchBuildItemSchema.parse({
      slotOrder: params.slotOrder,
      rawItemName: params.rawItemName,
      itemEntityId: null,
      catalogMatchStatus: params.ambiguous ? "AMBIGUOUS" : "UNMATCHED",
      verificationStatus: "UNVERIFIED",
      isVerifiedItem: false,
    });
  }

  const verified = Boolean(params.verified);
  return proMatchBuildItemSchema.parse({
    slotOrder: params.slotOrder,
    rawItemName: params.rawItemName,
    itemEntityId,
    catalogMatchStatus: "MATCHED",
    verificationStatus: verified ? "VERIFIED" : "UNVERIFIED",
    isVerifiedItem: verified,
  });
}
