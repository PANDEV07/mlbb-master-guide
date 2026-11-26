import { z } from "zod";

export const ITEM_CATEGORIES = [
  "Attack",
  "Magic",
  "Defense",
  "Movement",
  "Jungling",
  "Roaming",
] as const;

export const ITEM_TIERS = [
  "TIER_1",
  "TIER_2",
  "TIER_3",
] as const;

export const itemIdentitySchema = z.object({
  canonicalId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120),
  category: z.enum(ITEM_CATEGORIES),
  additionalCategories: z.array(z.enum(ITEM_CATEGORIES)).default([]),
  tier: z.enum(ITEM_TIERS),
  iconUrl: z.string().trim().url().nullable().optional(),
});

export type ItemIdentityInput = z.infer<typeof itemIdentitySchema>;