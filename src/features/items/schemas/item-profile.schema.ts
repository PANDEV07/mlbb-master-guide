import { z } from "zod";
import { ITEM_CATEGORIES } from "./item.schema";

export const ITEM_ATTRIBUTE_TYPES = [
  "PHYSICAL_ATTACK",
  "MAGIC_POWER",
  "HP",
  "MANA",
  "PHYSICAL_DEFENSE",
  "MAGIC_DEFENSE",
  "HP_REGEN",
  "MANA_REGEN",
  "ATTACK_SPEED",
  "CRITICAL_CHANCE",
  "MOVEMENT_SPEED",
  "COOLDOWN_REDUCTION",
  "LIFESTEAL",
  "SPELL_VAMP",
  "PENETRATION",
  "OTHER",
] as const;

export const ITEM_EFFECT_TYPES = [
  "DAMAGE",
  "SHIELD",
  "HEAL",
  "CROWD_CONTROL",
  "BUFF",
  "DEBUFF",
  "MOBILITY",
  "UTILITY",
  "SPECIAL",
  "UNKNOWN",
] as const;

export const ITEM_PASSIVE_KINDS = [
  "UNIQUE_PASSIVE",
  "PASSIVE_STACKING",
  "UNCLASSIFIED",
] as const;

export const ITEM_STACKING_RULES = [
  "STACKABLE",
  "NON_STACKABLE",
  "HIGHEST_VALUE_ONLY",
  "REFRESH_DURATION",
  "INDEPENDENT_STACKS",
  "UNKNOWN",
] as const;

const verificationStatusSchema = z.enum([
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

const effectParametersSchema = z.record(
  z.string(),
  z.union([z.number(), z.string(), z.boolean(), z.null()]),
);

export const itemAttributeSchema = z.object({
  type: z.enum(ITEM_ATTRIBUTE_TYPES),
  value: z.number().nullable(),
  unit: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().optional(),
});

export const itemPassiveEffectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1),
  effectType: z.enum(ITEM_EFFECT_TYPES),
  passiveKind: z.enum(ITEM_PASSIVE_KINDS).default("UNCLASSIFIED"),
  passiveGroup: z.string().trim().min(1).nullable().optional(),
  stackingRule: z.enum(ITEM_STACKING_RULES).nullable().optional(),
  trigger: z.string().trim().nullable().optional(),
  parameters: effectParametersSchema.default({}),
  verificationStatus: verificationStatusSchema.default("UNVERIFIED"),
}).superRefine((effect, ctx) => {
  if (
    effect.passiveKind === "UNIQUE_PASSIVE" &&
    !effect.passiveGroup
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["passiveGroup"],
      message: "Unique Passive wajib memiliki passiveGroup.",
    });
  }

  if (
    effect.passiveKind === "PASSIVE_STACKING" &&
    !effect.stackingRule
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["stackingRule"],
      message: "Passive Stacking wajib memiliki stackingRule.",
    });
  }
});

export const itemActiveEffectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1),
  effectType: z.enum(ITEM_EFFECT_TYPES),
  cooldownSeconds: z.number().nonnegative().nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  trigger: z.string().trim().nullable().optional(),
  parameters: effectParametersSchema.default({}),
  verificationStatus: verificationStatusSchema.default("UNVERIFIED"),
});

export const itemStatEfficiencySchema = z.object({
  value: z.number().nullable(),
  unit: z.string().trim().min(1),
  methodology: z.string().trim().min(1),
  verificationStatus: verificationStatusSchema.default("UNVERIFIED"),
});

export const itemProfileSchema = z.object({
  schemaVersion: z.literal(1),
  category: z.enum(ITEM_CATEGORIES),
  price: z.number().int().nonnegative().nullable(),
  combineCost: z.number().int().nonnegative().nullable().optional(),
  attributes: z.array(itemAttributeSchema).default([]),
  passiveEffects: z.array(itemPassiveEffectSchema).default([]),
  activeEffects: z.array(itemActiveEffectSchema).default([]),
  statEfficiency: itemStatEfficiencySchema.nullable().optional(),
});

export type ItemAttributeInput = z.infer<typeof itemAttributeSchema>;
export type ItemPassiveEffectInput = z.infer<typeof itemPassiveEffectSchema>;
export type ItemActiveEffectInput = z.infer<typeof itemActiveEffectSchema>;
export type ItemStatEfficiencyInput = z.infer<typeof itemStatEfficiencySchema>;
export type ItemProfileInput = z.infer<typeof itemProfileSchema>;