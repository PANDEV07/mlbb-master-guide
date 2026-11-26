import { z } from "zod";
import {
  CLAIM_CLASSIFICATIONS,
  CONFIDENCE_LEVELS,
  PRO_MATCH_RESULTS,
  PRO_MATCH_TEAM_SIDES,
  PRO_VERIFICATION_STATUSES,
  SERVER_TYPES,
  SOURCE_TIERS,
} from "./pro-build-pipeline.schema";

export const proBuildImportItemSchema = z.object({
  slotOrder: z.number().int().min(1).max(6),
  rawItemName: z.string().trim().min(1).max(160),
  itemSlug: z.string().trim().min(1).max(160).optional(),
  verified: z.boolean().default(false),
});

export const proBuildImportPlayerBuildSchema = z.object({
  playerName: z.string().trim().min(1).max(120),
  teamName: z.string().trim().min(1).max(120),
  teamSide: z.enum(PRO_MATCH_TEAM_SIDES).default("UNKNOWN"),
  roleLane: z.string().trim().min(1).max(64).nullable().optional(),
  rawHeroName: z.string().trim().min(1).max(120),
  heroSlug: z.string().trim().min(1).max(120).optional(),
  rawBattleSpellName: z.string().trim().min(1).max(120).nullable().optional(),
  battleSpellSlug: z.string().trim().min(1).max(120).optional(),
  rawEmblemName: z.string().trim().min(1).max(120).nullable().optional(),
  emblemSlug: z.string().trim().min(1).max(120).optional(),
  rawEmblemTalents: z.array(z.string().trim().min(1).max(80)).default([]),
  matchResult: z.enum(PRO_MATCH_RESULTS).default("UNKNOWN"),
  kills: z.number().int().min(0).nullable().optional(),
  deaths: z.number().int().min(0).nullable().optional(),
  assists: z.number().int().min(0).nullable().optional(),
  verificationStatus: z
    .enum(PRO_VERIFICATION_STATUSES)
    .default("UNVERIFIED"),
  items: z
    .array(proBuildImportItemSchema)
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
});

export const proBuildImportSourceSchema = z.object({
  provider: z.string().trim().min(1).max(100),
  sourceUrl: z.string().trim().url(),
  sourceTier: z.enum(SOURCE_TIERS).default("TIER_2_SECONDARY"),
  claimClassification: z.enum(CLAIM_CLASSIFICATIONS).default("SECONDARY_SOURCE"),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS).default("LOW"),
  verificationStatus: z
    .enum(PRO_VERIFICATION_STATUSES)
    .default("UNVERIFIED"),
  verifiedAt: z.coerce.date().nullable().optional(),
  verifiedBy: z.string().trim().min(1).max(128).nullable().optional(),
  evidenceExcerpt: z.string().trim().min(1).nullable().optional(),
});

export const proBuildImportMatchSchema = z
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
    serverType: z.enum(SERVER_TYPES).default("ORIGINAL_SERVER"),
    rawPatchVersion: z.string().trim().min(1).max(64).nullable().optional(),
    verificationStatus: z
      .enum(PRO_VERIFICATION_STATUSES)
      .default("UNVERIFIED"),
    sources: z.array(proBuildImportSourceSchema).min(1),
    playerBuilds: z.array(proBuildImportPlayerBuildSchema).min(1),
  })
  .superRefine((match, ctx) => {
    if (match.teamAName.toLowerCase() === match.teamBName.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["teamBName"],
        message: "teamAName dan teamBName harus berbeda.",
      });
    }

    if (
      match.winnerTeamName &&
      match.winnerTeamName !== match.teamAName &&
      match.winnerTeamName !== match.teamBName
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["winnerTeamName"],
        message: "winnerTeamName harus sama dengan teamAName atau teamBName.",
      });
    }
  });

export const proBuildImportFileSchema = z.object({
  schemaVersion: z.literal(1),
  matches: z.array(proBuildImportMatchSchema).min(1),
});

export type ProBuildImportFile = z.output<typeof proBuildImportFileSchema>;
export type ProBuildImportFileInput = z.input<typeof proBuildImportFileSchema>;
