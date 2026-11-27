import { getDraftHeroPool } from "./draft-hero-pool";
import {
  buildSidePostDraftPlan,
  type HeroCoreTemplateInput,
} from "../engine/draft-build-engine";
import type {
  DraftPostBuildPayload,
  VerifiedItemMeta,
} from "../types/draft-build.types";
import heroBuildTemplatesRaw from "@/data/imports/hero-build-templates.json";
import itemIdentitiesRaw from "@/data/imports/item-identities.json";

interface RawTemplateDataset {
  heroes: Array<{
    heroSlug: string;
    builds: Array<{
      name: string;
      items: Array<{ position: number; rawItemName: string }>;
    }>;
  }>;
}

interface RawItemDataset {
  items: Array<{
    name: string;
    slug: string;
    category: string;
    tier: string;
    iconUrl: string | null;
  }>;
}

let cachedTemplates: Map<string, HeroCoreTemplateInput> | null = null;
let cachedItems: Map<string, VerifiedItemMeta> | null = null;

function getTemplateMap(): Map<string, HeroCoreTemplateInput> {
  if (cachedTemplates) return cachedTemplates;
  const dataset = heroBuildTemplatesRaw as RawTemplateDataset;
  const map = new Map<string, HeroCoreTemplateInput>();

  for (const entry of dataset.heroes) {
    const primaryBuild = entry.builds[0];
    if (!primaryBuild) continue;
    const orderedItems = [...primaryBuild.items]
      .sort((a, b) => a.position - b.position)
      .map((i) => i.rawItemName);
    map.set(entry.heroSlug.toLowerCase(), {
      templateName: primaryBuild.name,
      itemNames: orderedItems,
    });
  }

  cachedTemplates = map;
  return map;
}

function getItemMetaMap(): Map<string, VerifiedItemMeta> {
  if (cachedItems) return cachedItems;
  const dataset = itemIdentitiesRaw as RawItemDataset;
  const map = new Map<string, VerifiedItemMeta>();

  for (const item of dataset.items) {
    map.set(item.slug.toLowerCase(), {
      slug: item.slug.toLowerCase(),
      name: item.name,
      category: item.category,
      tier: item.tier,
      iconUrl: item.iconUrl,
    });
  }

  cachedItems = map;
  return map;
}

export async function generatePostDraftItemSuggestions(params: {
  bluePickSlugs: string[];
  redPickSlugs: string[];
}): Promise<DraftPostBuildPayload> {
  const { heroPool, patchVersion } = await getDraftHeroPool();
  const bySlug = new Map(heroPool.map((h) => [h.slug, h]));

  const blueHeroes = params.bluePickSlugs
    .map((s) => bySlug.get(s.trim().toLowerCase()))
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  const redHeroes = params.redPickSlugs
    .map((s) => bySlug.get(s.trim().toLowerCase()))
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  const templateByHeroSlug = getTemplateMap();
  const itemBySlug = getItemMetaMap();

  const blueSide = buildSidePostDraftPlan({
    side: "BLUE",
    allies: blueHeroes,
    enemies: redHeroes,
    templateByHeroSlug,
    itemBySlug,
  });

  const redSide = buildSidePostDraftPlan({
    side: "RED",
    allies: redHeroes,
    enemies: blueHeroes,
    templateByHeroSlug,
    itemBySlug,
  });

  return {
    patchVersion,
    blueSide,
    redSide,
  };
}
