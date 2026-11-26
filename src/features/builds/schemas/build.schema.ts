import { z } from "zod";

export const BUILD_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export const BUILD_VERIFICATION_STATUSES = [
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "UNVERIFIED",
  "OUTDATED",
  "UNKNOWN",
] as const;

export const BUILD_SLOT_POSITIONS = [1, 2, 3, 4, 5, 6] as const;

export const BUILD_CONDITION_TYPES = [
  "PHYSICAL_DAMAGE",
  "MAGIC_DAMAGE",
  "BURST_DAMAGE",
  "SUSTAINED_DAMAGE",
  "HIGH_HEALING",
  "HIGH_SHIELD",
  "HIGH_CROWD_CONTROL",
  "HIGH_MOBILITY",
  "TANKY_ENEMIES",
  "SQUISHY_ENEMIES",
  "UNKNOWN",
] as const;

export const buildItemSlotSchema = z.object({
  position: z.number().int().min(1).max(6),
  itemEntityId: z.string().uuid(),
  required: z.boolean().default(false),
  alternativeItemEntityIds: z.array(z.string().uuid()).default([]),
  rationale: z.string().trim().min(1),
});

export const buildConditionSchema = z.object({
  conditionType: z.enum(BUILD_CONDITION_TYPES),
  description: z.string().trim().min(1),
  affectedSlotPositions: z.array(
    z.number().int().min(1).max(6),
  ).default([]),
  replacementItemEntityIds: z.array(z.string().uuid()).default([]),
  rationale: z.string().trim().min(1),
});

export const buildProfileSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  role: z.string().trim().min(1),
  lane: z.string().trim().min(1),
  itemSlots: z.array(buildItemSlotSchema).length(6).superRefine((slots, ctx) => {
    const positions = slots.map((slot) => slot.position);
    if (new Set(positions).size !== 6) {
      ctx.addIssue({ code: "custom", message: "Setiap posisi slot item harus unik." });
    }
  }),
  emblemId: z.string().uuid().nullable(),
  emblemTalentIds: z.array(z.string().uuid()).default([]),
  battleSpellId: z.string().uuid().nullable(),
  conditions: z.array(buildConditionSchema).default([]),
});

export type BuildProfileInput = z.input<typeof buildProfileSchema>;
export type BuildProfile = z.output<typeof buildProfileSchema>;
export type BuildItemSlot = z.output<typeof buildItemSlotSchema>;
export type BuildCondition = z.output<typeof buildConditionSchema>;