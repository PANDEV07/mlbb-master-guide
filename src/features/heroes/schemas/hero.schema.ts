import { z } from "zod";

export const HERO_ROLES = [
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
] as const;

export const HERO_LANES = [
  "EXP Lane",
  "Jungle",
  "Mid Lane",
  "Gold Lane",
  "Roam",
] as const;

export const HERO_DAMAGE_TYPES = [
  "Physical",
  "Magic",
  "True Damage",
  "Hybrid",
] as const;

export const HERO_SKILL_SLOTS = [
  "PASSIVE",
  "SKILL_1",
  "SKILL_2",
  "SKILL_3",
  "ULTIMATE",
] as const;

export const heroIdentitySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120),
  portraitUrl: z.string().trim().min(1).optional(),
  releaseDate: z.string().date().optional(),
});

export const heroSkillSchema = z.object({
  slot: z.enum(HERO_SKILL_SLOTS).nullable().optional(),
  apiSkillId: z.union([z.string(), z.number()]).optional(),
  apiGroupId: z.union([z.string(), z.number()]).optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().default(""),
  apiTags: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string(),
    color: z.string().optional(),
  })).default([]),
  iconUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  rawCooldownCost: z.string().nullable().optional(),
  damageType: z.enum(HERO_DAMAGE_TYPES).optional(),
  cooldownSeconds: z.number().nonnegative().nullable().optional(),
  resourceType: z.enum(["MANA", "ENERGY"]).nullable().optional(),
  resourceCost: z.number().nonnegative().nullable().optional(),
  mechanicCategories: z.array(z.enum([
    "DAMAGE",
    "CROWD_CONTROL",
    "MOBILITY",
    "DEFENSE",
    "SUSTAIN",
    "BUFF_DEBUFF",
    "UTILITY",
    "SPECIAL",
  ])).default([]),
  mechanics: z.array(z.string().trim().min(1)).default([]),
});

export const heroSkillGroupSchema = z.object({
  apiGroupId: z.union([z.string(), z.number()]),
  skills: z.array(heroSkillSchema).default([]),
});

export const heroAttributesSchema = z.object({
  hp: z.number().nonnegative().optional(),
  hpRegen: z.number().nonnegative().optional(),
  mana: z.number().nonnegative().optional(),
  manaRegen: z.number().nonnegative().optional(),
  physicalAttack: z.number().nonnegative().optional(),
  magicPower: z.number().nonnegative().optional(),
  physicalDefense: z.number().nonnegative().optional(),
  magicDefense: z.number().nonnegative().optional(),
  attackSpeed: z.number().nonnegative().optional(),
  movementSpeed: z.number().nonnegative().optional(),
  attackRange: z.number().nonnegative().optional(),
});

export const heroProfileSchema = z.object({
  schemaVersion: z.literal(1),
  role: z.enum(HERO_ROLES),
  specialties: z.array(z.string().trim().min(1)).default([]),
  lanes: z.array(z.enum(HERO_LANES)).min(1),
  damageType: z.enum(HERO_DAMAGE_TYPES),
  difficulty: z.number().int().min(1).max(5),
  attributes: heroAttributesSchema.optional(),
  skills: z.array(heroSkillSchema).default([]),
  skillGroups: z.array(heroSkillGroupSchema).default([]),
  strengths: z.array(z.string().trim().min(1)).default([]),
  weaknesses: z.array(z.string().trim().min(1)).default([]),
  mechanicCategories: z.array(z.enum([
    "DAMAGE",
    "CROWD_CONTROL",
    "MOBILITY",
    "DEFENSE",
    "SUSTAIN",
    "BUFF_DEBUFF",
    "UTILITY",
    "SPECIAL",
  ])).default([]),
  mechanics: z.array(z.string().trim().min(1)).default([]),
});

export type HeroIdentityInput = z.infer<typeof heroIdentitySchema>;
export type HeroProfileInput = z.infer<typeof heroProfileSchema>;



