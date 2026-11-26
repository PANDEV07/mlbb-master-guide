import "dotenv/config";
import { readFile } from "node:fs/promises";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { itemIdentitySchema } from "@/features/items/schemas/item.schema";
import { getDb, closeDatabaseConnection } from "../client";
import { getDatabaseConfig } from "../env";
import { knowledgeEntities, sources, entityEvidences } from "../schema";

const sourceSchema = z.object({
  name: z.string().trim().min(1).max(160),
  domain: z.string().trim().min(1).max(160),
  baseUrl: z.string().url(),
  sourceTier: z.enum([
    "TIER_1_OFFICIAL",
    "TIER_2_SECONDARY",
    "TIER_3_ANALYTICAL",
    "TIER_4_COMMUNITY",
  ]),
  sourceCategory: z.string().trim().min(1).max(64),
  reliabilityNotes: z.string().optional(),
});

const itemImportSchema = itemIdentitySchema.extend({
  sourceUrl: z.string().url(),
});

const importSchema = z.object({
  schemaVersion: z.literal(1),
  source: sourceSchema,
  items: z.array(itemImportSchema).min(1),
});

type ItemImport = z.infer<typeof itemImportSchema>;

type ExistingItem = {
  entityId: string;
  metadata: unknown;
};

function readMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function normalized(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateDuplicates(items: ItemImport[]): void {
  const canonicalIds = items.map((item) => normalized(item.canonicalId));
  const slugs = items.map((item) => normalized(item.slug));

  const duplicateCanonicalIds = canonicalIds.filter(
    (value, index, all) => all.indexOf(value) !== index,
  );
  const duplicateSlugs = slugs.filter(
    (value, index, all) => all.indexOf(value) !== index,
  );

  if (duplicateCanonicalIds.length > 0 || duplicateSlugs.length > 0) {
    throw new Error(
      [
        duplicateCanonicalIds.length
          ? `canonicalId duplikat: ${[...new Set(duplicateCanonicalIds)].join(", ")}`
          : "",
        duplicateSlugs.length
          ? `slug duplikat: ${[...new Set(duplicateSlugs)].join(", ")}`
          : "",
      ].filter(Boolean).join("\n"),
    );
  }
}

function assertIdentityMatches(
  item: ItemImport,
  metadata: Record<string, unknown>,
): void {
  const fields: Array<keyof ItemImport> = [
    "canonicalId",
    "name",
    "slug",
    "category",
    "tier",
  ];

  for (const field of fields) {
    if (normalized(metadata[field]) !== normalized(item[field])) {
      throw new Error(
        `Konflik ${field} untuk item ${item.slug}: file="${item[field]}", database="${String(metadata[field] ?? "")}".`,
      );
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");

  if (args.some((arg) => arg !== "--commit")) {
    throw new Error("Argumen tidak dikenal. Gunakan tanpa argumen atau --commit.");
  }

  if (commit && process.env.MLBB_ALLOW_ITEM_IMPORT !== "YES") {
    throw new Error(
      "Commit diblokir. Untuk mengizinkan penulisan, set MLBB_ALLOW_ITEM_IMPORT=YES setelah memastikan DATABASE_URL menunjuk database yang benar.",
    );
  }

  const fileUrl = new URL("../../../data/imports/item-identities.json", import.meta.url);
  const raw = await readFile(fileUrl, "utf8");
  const parsed = importSchema.safeParse(JSON.parse(raw.replace(/^\uFEFF/, "")));

  if (!parsed.success) {
    console.error("Import ditolak: JSON item tidak valid.");
    console.error(parsed.error.flatten());
    process.exitCode = 1;
    return;
  }

  const data = parsed.data;
  validateDuplicates(data.items);

  const config = getDatabaseConfig();

  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`Database host: ${config.host}`);
  console.log(`Database port: ${config.port}`);
  console.log(`Database name: ${config.databaseName}`);
  console.log(`Connection mode: ${config.connectionMode}`);
  console.log(`Masked URL: ${config.maskedUrl}`);
  console.log(`Jumlah item: ${data.items.length}`);
  console.log(`Sumber: ${data.source.name} (${data.source.domain})`);

  const db = getDb();

  try {
    const [existingSource] = await db
      .select({
        id: sources.id,
        baseUrl: sources.baseUrl,
        sourceTier: sources.sourceTier,
        sourceCategory: sources.sourceCategory,
      })
      .from(sources)
      .where(
        and(
          eq(sources.name, data.source.name),
          eq(sources.domain, data.source.domain),
        ),
      )
      .limit(1);

    if (existingSource) {
      console.log("Source registry yang tersimpan:");
      console.log("baseUrl:", existingSource.baseUrl);
      console.log("sourceTier:", existingSource.sourceTier);
      console.log("sourceCategory:", existingSource.sourceCategory);
    }
    if (
      existingSource &&
      (
        existingSource.baseUrl !== data.source.baseUrl ||
        existingSource.sourceTier !== data.source.sourceTier ||
        existingSource.sourceCategory !== data.source.sourceCategory
      )
    ) {
      throw new Error(
        "Konfigurasi source berbeda dari registry database. Import dibatalkan.",
      );
    }

    const rows = await db
      .select({
        entityId: knowledgeEntities.entityId,
        metadata: knowledgeEntities.metadata,
      })
      .from(knowledgeEntities)
      .where(eq(knowledgeEntities.entityType, "item"));

    const bySlug = new Map<string, ExistingItem>();
    const byCanonicalId = new Map<string, ExistingItem>();

    for (const row of rows) {
      const metadata = readMetadata(row.metadata);
      const slug = normalized(metadata.slug);
      const canonicalId = normalized(metadata.canonicalId);

      if (slug) {
        if (bySlug.has(slug)) {
          throw new Error(`Database memiliki slug item duplikat: ${slug}`);
        }
        bySlug.set(slug, row);
      }

      if (canonicalId) {
        if (byCanonicalId.has(canonicalId)) {
          throw new Error(`Database memiliki canonicalId duplikat: ${canonicalId}`);
        }
        byCanonicalId.set(canonicalId, row);
      }
    }

    const newItems: ItemImport[] = [];
    const existingItems: ItemImport[] = [];
    const entityIds: string[] = [];
    const conflicts: string[] = [];

    for (const item of data.items) {
      const slugMatch = bySlug.get(normalized(item.slug));
      const idMatch = byCanonicalId.get(normalized(item.canonicalId));

      if (slugMatch && idMatch && slugMatch.entityId !== idMatch.entityId) {
        conflicts.push(`${item.slug}: slug dan canonicalId menunjuk entity berbeda`);
        continue;
      }

      const existing = slugMatch ?? idMatch;

      if (!existing) {
        newItems.push(item);
        continue;
      }

      try {
        assertIdentityMatches(item, readMetadata(existing.metadata));
        existingItems.push(item);
        entityIds.push(existing.entityId);
      } catch (error) {
        conflicts.push(error instanceof Error ? error.message : item.slug);
      }
    }

    if (conflicts.length > 0) {
      throw new Error(`Konflik identitas ditemukan:\n${conflicts.join("\n")}`);
    }

    let existingEvidenceCount = 0;

    if (existingSource && entityIds.length > 0) {
      const evidenceRows = await db
        .select({
          entityId: entityEvidences.entityId,
          sourceUrl: entityEvidences.sourceUrl,
        })
        .from(entityEvidences)
        .where(
          and(
            eq(entityEvidences.entityType, "item"),
            eq(entityEvidences.sourceId, existingSource.id),
            eq(entityEvidences.aspectName, "IDENTITY"),
            inArray(entityEvidences.entityId, entityIds),
          ),
        );

      const evidenceKeys = new Set(
        evidenceRows.map((row) => `${row.entityId}|${row.sourceUrl ?? ""}`),
      );

      for (const item of existingItems) {
        const entity = bySlug.get(normalized(item.slug))
          ?? byCanonicalId.get(normalized(item.canonicalId));

        if (
          entity &&
          evidenceKeys.has(`${entity.entityId}|${item.sourceUrl}`)
        ) {
          existingEvidenceCount += 1;
        }
      }
    }

    const evidenceToInsert = data.items.length - existingEvidenceCount;

    console.log("\n===== DATABASE PREFLIGHT =====");
    console.log(`Source: ${existingSource ? "Sudah terdaftar" : "Baru"}`);
    console.log(`Item baru: ${newItems.length}`);
    console.log(`Item sudah ada: ${existingItems.length}`);
    console.log(`Evidence sudah ada: ${existingEvidenceCount}`);
    console.log(`Evidence berpotensi ditambahkan: ${evidenceToInsert}`);

    if (newItems.length > 0) {
      console.log(`\nItem baru: ${newItems.map((item) => item.name).join(", ")}`);
    }

    if (!commit) {
      console.log("\nDRY RUN selesai. Database tidak diubah.");
      return;
    }

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('mlbb-item-identity-import-v1'))`,
      );

      await tx
        .insert(sources)
        .values({
          name: data.source.name,
          domain: data.source.domain,
          baseUrl: data.source.baseUrl,
          sourceTier: data.source.sourceTier,
          sourceCategory: data.source.sourceCategory,
          reliabilityNotes: data.source.reliabilityNotes ?? null,
        })
        .onConflictDoNothing({
          target: [sources.name, sources.domain],
        });

      const [source] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.name, data.source.name),
            eq(sources.domain, data.source.domain),
          ),
        )
        .limit(1);

      if (!source) {
        throw new Error("Source registry tidak ditemukan.");
      }

      const currentRows = await tx
        .select({
          entityId: knowledgeEntities.entityId,
          metadata: knowledgeEntities.metadata,
        })
        .from(knowledgeEntities)
        .where(eq(knowledgeEntities.entityType, "item"));

      const currentBySlug = new Map<string, ExistingItem>();
      const currentByCanonicalId = new Map<string, ExistingItem>();

      for (const row of currentRows) {
        const metadata = readMetadata(row.metadata);
        const slug = normalized(metadata.slug);
        const canonicalId = normalized(metadata.canonicalId);

        if (slug) currentBySlug.set(slug, row);
        if (canonicalId) currentByCanonicalId.set(canonicalId, row);
      }

      let inserted = 0;
      let existing = 0;
      let evidenceInserted = 0;

      for (const item of data.items) {
        const slugMatch = currentBySlug.get(normalized(item.slug));
        const idMatch = currentByCanonicalId.get(normalized(item.canonicalId));

        if (slugMatch && idMatch && slugMatch.entityId !== idMatch.entityId) {
          throw new Error(`Konflik entity saat commit: ${item.slug}`);
        }

        const current = slugMatch ?? idMatch;
        let entityId: string;

        if (current) {
          assertIdentityMatches(item, readMetadata(current.metadata));
          entityId = current.entityId;
          existing += 1;
        } else {
          const [created] = await tx
            .insert(knowledgeEntities)
            .values({
              entityType: "item",
              metadata: {
                canonicalId: item.canonicalId,
                name: item.name,
                slug: item.slug,
                category: item.category,
                tier: item.tier,
                additionalCategories: item.additionalCategories,
                ...(item.iconUrl ? { iconUrl: item.iconUrl } : {}),
              },
            })
            .returning({ entityId: knowledgeEntities.entityId });

          if (!created) {
            throw new Error(`Gagal membuat identitas item: ${item.slug}`);
          }

          entityId = created.entityId;
          inserted += 1;
        }

        const [existingEvidence] = await tx
          .select({ id: entityEvidences.id })
          .from(entityEvidences)
          .where(
            and(
              eq(entityEvidences.entityType, "item"),
              eq(entityEvidences.entityId, entityId),
              eq(entityEvidences.sourceId, source.id),
              eq(entityEvidences.sourceUrl, item.sourceUrl),
              eq(entityEvidences.aspectName, "IDENTITY"),
            ),
          )
          .limit(1);

        if (!existingEvidence) {
          await tx.insert(entityEvidences).values({
            entityType: "item",
            entityId,
            aspectName: "IDENTITY",
            sourceId: source.id,
            sourceUrl: item.sourceUrl,
            claimClassification: "SECONDARY_SOURCE",
            verificationStatus: "UNVERIFIED",
            confidenceLevel: "LOW",
            stance: "SUPPORTING",
          });

          evidenceInserted += 1;
        }
      }

      return { inserted, existing, evidenceInserted };
    });

    console.log("\nCOMMIT berhasil:", result);
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error: unknown) => {
  console.error("Import Item gagal:", error);
  process.exitCode = 1;
});