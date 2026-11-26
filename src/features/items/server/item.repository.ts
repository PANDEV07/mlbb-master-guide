import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { calculateRecipeCost } from "@/features/items/utils/recipe-cost";
import {
  entityEvidences,
  knowledgeEntities,
  patchVersions,
  profiles,
} from "@/lib/db/schema";

type AttributeRecord = {
  type: string;
  value: number | null;
  unit: string | null;
};

type EffectRecord = {
  name: string;
  description: string;
  verificationStatus: string;
};

export type RecipeNode = {
  slug: string;
  name: string;
  quantity: number;
  price: number | null;
  iconUrl: string | null;
  recipeType: string;
  combineCost: number | null;
  componentCost: number | null;
  children: RecipeNode[];
  cycleDetected: boolean;
  depthLimited: boolean;
};

export type ItemCatalogRecord = {
  entityId: string;
  canonicalId: string;
  name: string;
  slug: string;
  category: string;
  tier: string;
  iconUrl: string | null;
  price: number | null;
  attributes: AttributeRecord[];
  passiveEffects: EffectRecord[];
  activeEffects: EffectRecord[];
  verificationStatus: string;
  recipe: {
    recipeType: string;
    componentCost: number | null;
    combineCost: number | null;
    components: Array<{
      componentSlug: string;
      quantity: number;
    }>;
  };
};

export type ItemDetailRecord = ItemCatalogRecord & {
  recipeTree: RecipeNode[];
  recipeCost: ReturnType<typeof calculateRecipeCost>;
  evidence: Array<{
    aspectName: string;
    verificationStatus: string;
    confidenceLevel: string;
    sourceUrl: string | null;
    claimClassification: string;
  }>;
};

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function mapCatalogRow(row: {
  entityId: string;
  metadata: unknown;
  payload: unknown;
}): ItemCatalogRecord {
  const metadata = asObject(row.metadata);
  const payload = asObject(row.payload);
  const gameplay = asObject(payload.gameplay);
  const recipe = asObject(payload.recipe);

  const attributes = asArray(gameplay.attributes).map((value) => {
    const attribute = asObject(value);
    return {
      type: asString(attribute.type, "OTHER"),
      value: asNumber(attribute.value),
      unit: typeof attribute.unit === "string" ? attribute.unit : null,
    };
  });

  const mapEffects = (values: unknown[]): EffectRecord[] =>
    values.map((value) => {
      const effect = asObject(value);
      return {
        name: asString(effect.name, "Efek"),
        description: asString(effect.description),
        verificationStatus: asString(
          effect.verificationStatus,
          "UNVERIFIED",
        ),
      };
    });

  const passiveEffects = mapEffects(asArray(gameplay.passiveEffects));
  const activeEffects = mapEffects(asArray(gameplay.activeEffects));

  const statuses = [
    ...passiveEffects.map((effect) => effect.verificationStatus),
    ...activeEffects.map((effect) => effect.verificationStatus),
  ];

  const components = asArray(recipe.components).map((value) => {
    const component = asObject(value);
    return {
      componentSlug: asString(component.componentSlug),
      quantity: asNumber(component.quantity) ?? 1,
    };
  });

  return {
    entityId: row.entityId,
    canonicalId: asString(metadata.canonicalId),
    name: asString(metadata.name, "Item tanpa nama"),
    slug: asString(metadata.slug),
    category: asString(gameplay.category, asString(metadata.category)),
    tier: asString(metadata.tier),
    iconUrl:
      typeof metadata.iconUrl === "string" ? metadata.iconUrl : null,
    price: asNumber(gameplay.price),
    attributes,
    passiveEffects,
    activeEffects,
    verificationStatus: statuses.includes("PARTIALLY_VERIFIED")
      ? "PARTIALLY_VERIFIED"
      : "UNVERIFIED",
    recipe: {
      recipeType: asString(recipe.recipeType, "UNKNOWN"),
      componentCost: asNumber(recipe.componentCost),
      combineCost: asNumber(gameplay.combineCost),
      components,
    },
  };
}

export async function getItemCatalog(): Promise<{
  patchVersion: string;
  items: ItemCatalogRecord[];
}> {
  const db = getDb();

  const rows = await db
    .select({
      entityId: knowledgeEntities.entityId,
      metadata: knowledgeEntities.metadata,
      payload: profiles.payload,
      patchVersion: patchVersions.versionCode,
    })
    .from(profiles)
    .innerJoin(
      knowledgeEntities,
      and(
        eq(profiles.entityId, knowledgeEntities.entityId),
        eq(profiles.entityType, knowledgeEntities.entityType),
      ),
    )
    .innerJoin(
      patchVersions,
      and(
        eq(profiles.patchVersionId, patchVersions.id),
        eq(profiles.serverType, patchVersions.serverType),
      ),
    )
    .where(
      and(
        eq(knowledgeEntities.entityType, "item"),
        eq(profiles.entityType, "item"),
        eq(profiles.serverType, "ORIGINAL_SERVER"),
        eq(patchVersions.serverType, "ORIGINAL_SERVER"),
        eq(patchVersions.isCurrentLive, true),
      ),
    )
    .orderBy(asc(knowledgeEntities.entityId));

  return {
    patchVersion: rows[0]?.patchVersion ?? "",
    items: rows.map(mapCatalogRow),
  };
}

export async function getItemDetail(
  slug: string,
): Promise<{ item: ItemDetailRecord | null; patchVersion: string }> {
  const db = getDb();

  const rows = await db
    .select({
      entityId: knowledgeEntities.entityId,
      metadata: knowledgeEntities.metadata,
      payload: profiles.payload,
      patchVersion: patchVersions.versionCode,
      patchVersionId: patchVersions.id,
    })
    .from(profiles)
    .innerJoin(
      knowledgeEntities,
      and(
        eq(profiles.entityId, knowledgeEntities.entityId),
        eq(profiles.entityType, knowledgeEntities.entityType),
      ),
    )
    .innerJoin(
      patchVersions,
      and(
        eq(profiles.patchVersionId, patchVersions.id),
        eq(profiles.serverType, patchVersions.serverType),
      ),
    )
    .where(
      and(
        eq(knowledgeEntities.entityType, "item"),
        eq(profiles.entityType, "item"),
        eq(profiles.serverType, "ORIGINAL_SERVER"),
        eq(patchVersions.serverType, "ORIGINAL_SERVER"),
        eq(patchVersions.isCurrentLive, true),
        sql`${knowledgeEntities.metadata}->>'slug' = ${slug}`,
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return { item: null, patchVersion: "" };

  const catalog = await getItemCatalog();
  const catalogBySlug = new Map(
    catalog.items.map((entry) => [entry.slug, entry]),
  );

  const root = mapCatalogRow(row);

  const recipeCost = calculateRecipeCost(
    root.slug,
    catalog.items.map((entry) => ({
      slug: entry.slug,
      price: entry.price,
      combineCost: entry.recipe.combineCost,
      recipeType: entry.recipe.recipeType,
      components: entry.recipe.components,
    })),
  );

  const maxDepth = 12;

  function buildNode(
    componentSlug: string,
    quantity: number,
    ancestors: Set<string>,
    depth: number,
  ): RecipeNode {
    const component = catalogBySlug.get(componentSlug);

    if (!component) {
      return {
        slug: componentSlug,
        name: componentSlug,
        quantity,
        price: null,
        iconUrl: null,
        recipeType: "UNKNOWN",
        combineCost: null,
        componentCost: null,
        children: [],
        cycleDetected: false,
        depthLimited: false,
      };
    }

    if (ancestors.has(componentSlug)) {
      return {
        slug: component.slug,
        name: component.name,
        quantity,
        price: component.price,
        iconUrl: component.iconUrl,
        recipeType: component.recipe.recipeType,
        combineCost: component.recipe.combineCost,
        componentCost: component.recipe.componentCost,
        children: [],
        cycleDetected: true,
        depthLimited: false,
      };
    }

    if (depth >= maxDepth) {
      return {
        slug: component.slug,
        name: component.name,
        quantity,
        price: component.price,
        iconUrl: component.iconUrl,
        recipeType: component.recipe.recipeType,
        combineCost: component.recipe.combineCost,
        componentCost: component.recipe.componentCost,
        children: [],
        cycleDetected: false,
        depthLimited: true,
      };
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(componentSlug);

    const children = component.recipe.components.map((child) =>
      buildNode(
        child.componentSlug,
        child.quantity,
        nextAncestors,
        depth + 1,
      ),
    );

    return {
      slug: component.slug,
      name: component.name,
      quantity,
      price: component.price,
      iconUrl: component.iconUrl,
      recipeType: component.recipe.recipeType,
      combineCost: component.recipe.combineCost,
      componentCost: component.recipe.componentCost,
      children,
      cycleDetected: false,
      depthLimited: false,
    };
  }

  const recipeTree = root.recipe.components.map((component) =>
    buildNode(component.componentSlug, component.quantity, new Set([root.slug]), 1),
  );

  const evidenceRows = await db
    .select({
      aspectName: entityEvidences.aspectName,
      verificationStatus: entityEvidences.verificationStatus,
      confidenceLevel: entityEvidences.confidenceLevel,
      sourceUrl: entityEvidences.sourceUrl,
      claimClassification: entityEvidences.claimClassification,
    })
    .from(entityEvidences)
    .where(
      and(
        eq(entityEvidences.entityType, "item"),
        eq(entityEvidences.entityId, row.entityId),
        eq(entityEvidences.patchVersionId, row.patchVersionId),
      ),
    );

  return {
    patchVersion: row.patchVersion,
    item: {
      ...root,
      recipeTree,
      recipeCost,
      evidence: evidenceRows.map((evidence) => ({
        aspectName: evidence.aspectName,
        verificationStatus: evidence.verificationStatus,
        confidenceLevel: evidence.confidenceLevel,
        sourceUrl: evidence.sourceUrl,
        claimClassification: evidence.claimClassification,
      })),
    },
  };
}