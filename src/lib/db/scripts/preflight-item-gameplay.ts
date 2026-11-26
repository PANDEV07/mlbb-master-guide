import "dotenv/config";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";

import { itemProfileSchema } from "@/features/items/schemas/item-profile.schema";
import { getDb, closeDatabaseConnection } from "../client";
import { getDatabaseConfig } from "../env";
import { knowledgeEntities, patchVersions, profiles } from "../schema";

const componentSchema = z.object({
  componentSlug: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

const itemSchema = z.object({
  schemaVersion: z.literal(1),
  entity: z.object({
    canonicalId: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
  }),
  profile: itemProfileSchema,
  recipe: z.object({
    recipeType: z.enum([
      "COMPOSITE_ITEM",
      "COMPONENT_ITEM",
      "SPECIAL_ITEM",
      "UNKNOWN",
    ]),
    components: z.array(componentSchema),
    componentCost: z.number().nonnegative().nullable().optional(),
    combineCost: z.number().nonnegative().nullable().optional(),
    availability: z.unknown().optional(),
  }),
  provenance: z.object({
    sourceName: z.string().min(1),
    sourceUrl: z.string().url(),
    sourceType: z.string().min(1),
    verificationStatus: z.string().min(1),
    confidenceLevel: z.string().min(1),
    serverType: z.string().nullable().optional(),
    patchVersion: z.string().nullable().optional(),
  }).passthrough(),
}).passthrough();

const fileSchema = z.array(itemSchema).min(1);

type ItemData = z.infer<typeof itemSchema>;

function readMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function main(): Promise<void> {
  const fileUrl = new URL("../../../../item-gameplay-final.json", import.meta.url);
  const raw = await readFile(fileUrl, "utf8");
  const parsed = fileSchema.safeParse(JSON.parse(raw.replace(/^\uFEFF/, "")));

  if (!parsed.success) {
    console.error("VALIDASI FILE GAGAL");
    console.error(parsed.error.issues.slice(0, 15));
    process.exitCode = 1;
    return;
  }

  const items: ItemData[] = parsed.data;
  const slugSet = new Set<string>();

  for (const item of items) {
    const slug = normalize(item.entity.slug);
    if (slugSet.has(slug)) {
      throw new Error(`Slug duplikat dalam file: ${slug}`);
    }
    slugSet.add(slug);
  }

  const config = getDatabaseConfig();

  console.log("Mode: READ-ONLY PREFLIGHT");
  console.log("Database host:", config.host);
  console.log("Database port:", config.port);
  console.log("Database:", config.databaseName);
  console.log("Connection:", config.connectionMode);
  console.log("Item file valid:", items.length);

  const db = getDb();

  try {
    const entityRows = await db
      .select({
        entityId: knowledgeEntities.entityId,
        metadata: knowledgeEntities.metadata,
      })
      .from(knowledgeEntities)
      .where(eq(knowledgeEntities.entityType, "item"));

    const entityBySlug = new Map<string, {
      entityId: string;
      metadata: Record<string, unknown>;
    }>();

    for (const row of entityRows) {
      const metadata = readMetadata(row.metadata);
      const slug = normalize(metadata.slug);

      if (!slug) continue;
      if (entityBySlug.has(slug)) {
        throw new Error(`Slug database duplikat: ${slug}`);
      }

      entityBySlug.set(slug, {
        entityId: row.entityId,
        metadata,
      });
    }

    const matched: Array<{
      item: ItemData;
      entityId: string;
    }> = [];

    const missing: string[] = [];
    const conflicts: string[] = [];

    for (const item of items) {
      const entity = entityBySlug.get(normalize(item.entity.slug));

      if (!entity) {
        missing.push(item.entity.slug);
        continue;
      }

      const fields = ["canonicalId", "name", "slug"] as const;

      const mismatch = fields.filter(
        (field) =>
          normalize(entity.metadata[field]) !==
          normalize(item.entity[field]),
      );

      if (mismatch.length > 0) {
        conflicts.push(
          `${item.entity.slug}: ${mismatch.join(", ")}`,
        );
        continue;
      }

      matched.push({
        item,
        entityId: entity.entityId,
      });
    }

    const patchRows = await db
      .select({
        id: patchVersions.id,
        versionCode: patchVersions.versionCode,
        serverType: patchVersions.serverType,
        releaseDate: patchVersions.releaseDate,
        isCurrentLive: patchVersions.isCurrentLive,
      })
      .from(patchVersions);

    const entityIds = matched.map((row) => row.entityId);

    const existingProfiles = entityIds.length > 0
      ? await db
          .select({
            entityId: profiles.entityId,
            patchVersionId: profiles.patchVersionId,
            serverType: profiles.serverType,
            effectiveRange: profiles.effectiveRange,
          })
          .from(profiles)
          .where(
            and(
              eq(profiles.entityType, "item"),
              inArray(profiles.entityId, entityIds),
            ),
          )
      : [];

    const profileEntityIds = new Set(
      existingProfiles.map((row) => row.entityId),
    );

    const recipeCounts = {
      COMPOSITE_ITEM: 0,
      COMPONENT_ITEM: 0,
      SPECIAL_ITEM: 0,
      UNKNOWN: 0,
    };

    for (const item of items) {
      recipeCounts[item.recipe.recipeType]++;
    }

    const unverified = items.filter(
      (item) => item.provenance.verificationStatus !== "VERIFIED",
    ).length;

    console.log("\n=== ENTITY PREFLIGHT ===");
    console.log("Entity item di database:", entityRows.length);
    console.log("Identitas cocok:", matched.length);
    console.log("Identitas tidak ditemukan:", missing.length);
    console.log("Konflik identitas:", conflicts.length);

    console.log("\n=== PROFILE PREFLIGHT ===");
    console.log("Item sudah memiliki profil:", profileEntityIds.size);
    console.log("Item belum memiliki profil:", matched.length - profileEntityIds.size);
    console.log("Total profil item ditemukan:", existingProfiles.length);

    console.log("\n=== PATCH PREFLIGHT ===");
    console.log("Patch terdaftar:", patchRows.length);

    for (const patch of patchRows) {
      console.log(
        `${patch.versionCode} | ${patch.serverType} | ` +
        `current=${patch.isCurrentLive} | release=${patch.releaseDate ?? "unknown"}`,
      );
    }

    console.log("\n=== RECIPE TYPE ===");
    for (const [type, count] of Object.entries(recipeCounts)) {
      console.log(`${type}: ${count}`);
    }

    console.log("\n=== PROVENANCE ===");
    console.log("Item belum berstatus VERIFIED:", unverified);
    console.log("Sumber:", [...new Set(items.map((item) => item.provenance.sourceName))].join(", "));

    console.log("\n=== PREFLIGHT RESULT ===");

    if (missing.length > 0) {
      console.log("Entity tidak ditemukan:", missing.slice(0, 20).join(", "));
    }

    if (conflicts.length > 0) {
      console.log("Konflik:", conflicts.slice(0, 20).join(" | "));
    }

    console.log("Target patch:", "BELUM DITETAPKAN");
    console.log("Effective range:", "BELUM DITETAPKAN");
    console.log("Commit tersedia:", "TIDAK");

    if (missing.length === 0 && conflicts.length === 0) {
      console.log("Status identitas: LULUS");
    } else {
      console.log("Status identitas: PERLU PERBAIKAN");
    }

    console.log("\nREAD-ONLY PREFLIGHT SELESAI. DATABASE TIDAK DIUBAH.");
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Preflight gagal:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});