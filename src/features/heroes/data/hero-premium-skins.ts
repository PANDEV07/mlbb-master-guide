import rawData from "@/data/imports/hero-premium-skins.json";

export interface HeroPremiumSkinRecord {
  heroSlug: string;
  heroName: string;
  skinName: string;
  skinTier: string;
  skinTag: string;
  splashUrl: string;
  width: number;
  height: number;
  sourceUrl: string;
}

interface HeroPremiumSkinDataset {
  schemaVersion: number;
  fetchedAt: string;
  totalHeroes: number;
  heroes: HeroPremiumSkinRecord[];
}

const dataset = rawData as HeroPremiumSkinDataset;

function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

const SKIN_BY_SLUG = new Map<string, HeroPremiumSkinRecord>();
const SKIN_BY_NORMALIZED = new Map<string, HeroPremiumSkinRecord>();

for (const entry of dataset.heroes) {
  SKIN_BY_SLUG.set(entry.heroSlug, entry);
  SKIN_BY_NORMALIZED.set(normalizeKey(entry.heroSlug), entry);
  SKIN_BY_NORMALIZED.set(normalizeKey(entry.heroName), entry);
}

const SLUG_FALLBACK_ALIASES: Record<string, string> = {
  "popol-and-kupa": "popol-kupa",
  "popol-kupa": "popol-kupa",
  change: "chang-e",
  "chang-e": "chang-e",
  xborg: "x-borg",
  "x-borg": "x-borg",
};

export function getHeroPremiumSkin(
  slugOrName: string,
): HeroPremiumSkinRecord | null {
  const direct = SKIN_BY_SLUG.get(slugOrName);
  if (direct) return direct;

  const aliased = SLUG_FALLBACK_ALIASES[slugOrName.toLowerCase()];
  if (aliased && SKIN_BY_SLUG.has(aliased)) {
    return SKIN_BY_SLUG.get(aliased) ?? null;
  }

  return SKIN_BY_NORMALIZED.get(normalizeKey(slugOrName)) ?? null;
}

export function formatSkinTierLabelId(tier: string, tag: string): string {
  const cleanTag = tag.trim();
  const cleanTier = tier.trim();
  if (cleanTag && cleanTag.toLowerCase() !== cleanTier.toLowerCase()) {
    return `${cleanTag} · ${cleanTier}`;
  }
  return cleanTier || "Default";
}
