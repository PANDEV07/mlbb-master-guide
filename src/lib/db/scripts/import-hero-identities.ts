import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, closeDatabaseConnection } from "../client";
import { knowledgeEntities, sources, entityEvidences } from "../schema";
import { readFile } from "node:fs/promises";

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

const heroSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120),
  portraitUrl: z.string().url().optional(),
  releaseDate: z.string().date().optional(),
  sourceUrl: z.string().url(),
});

const importSchema = z.object({
  schemaVersion: z.literal(1),
  source: sourceSchema,
  heroes: z.array(heroSchema).min(1),
});

async function main() {
  const commit = process.argv.includes("--commit");

  if (process.argv.some((arg) => !["--commit"].includes(arg) && arg.startsWith("--"))) {
    throw new Error("Argumen tidak dikenal. Gunakan tanpa argumen untuk dry-run atau --commit.");
  }

  const fileUrl = new URL("../../../data/imports/hero-identities.json", import.meta.url);
  const raw = await readFile(fileUrl, "utf8");
  const parsed = importSchema.safeParse(JSON.parse(raw.replace(/^\uFEFF/, "")));

  if (!parsed.success) {
    console.error("Import ditolak: JSON tidak valid.");
    console.error(parsed.error.flatten());
    process.exitCode = 1;
    return;
  }

  const data = parsed.data;
  const normalizedSlugs = data.heroes.map((hero) => hero.slug.toLowerCase());
  const duplicateSlugs = normalizedSlugs.filter(
    (slug, index, all) => all.indexOf(slug) !== index,
  );

  if (duplicateSlugs.length > 0) {
    throw new Error(`Slug duplikat dalam file: ${[...new Set(duplicateSlugs)].join(", ")}`);
  }

  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`Jumlah identitas: ${data.heroes.length}`);
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

    if (
      existingSource &&
      (
        existingSource.baseUrl !== data.source.baseUrl ||
        existingSource.sourceTier !== data.source.sourceTier ||
        existingSource.sourceCategory !== data.source.sourceCategory
      )
    ) {
      throw new Error(
        "Konfigurasi source yang sudah ada berbeda dari file impor. Periksa registry secara manual.",
      );
    }

    const existingHeroRows = await db
      .select({
        entityId: knowledgeEntities.entityId,
        metadata: knowledgeEntities.metadata,
      })
      .from(knowledgeEntities)
      .where(eq(knowledgeEntities.entityType, "hero"));

    const heroBySlug = new Map<string, { entityId: string; name: string }>();

    for (const row of existingHeroRows) {
      const metadata = row.metadata;

      if (
        metadata &&
        typeof metadata === "object" &&
        "slug" in metadata &&
        typeof metadata.slug === "string"
      ) {
        const slug = metadata.slug.toLowerCase();

        if (heroBySlug.has(slug)) {
          throw new Error(`Database memiliki slug hero duplikat: ${slug}`);
        }

        heroBySlug.set(slug, {
          entityId: row.entityId,
          name:
            "name" in metadata && typeof metadata.name === "string"
              ? metadata.name
              : "",
        });
      }
    }

    const newHeroes: string[] = [];
    const existingHeroes: string[] = [];
    const conflicts: string[] = [];
    const existingEntityIds: string[] = [];

    for (const hero of data.heroes) {
      const existing = heroBySlug.get(hero.slug.toLowerCase());

      if (!existing) {
        newHeroes.push(hero.slug);
        continue;
      }

      if (existing.name.toLowerCase() !== hero.name.toLowerCase()) {
        conflicts.push(
          `${hero.slug}: nama file "${hero.name}" berbeda dari database "${existing.name}"`,
        );
        continue;
      }

      existingHeroes.push(hero.slug);
      existingEntityIds.push(existing.entityId);
    }

    if (conflicts.length > 0) {
      throw new Error(`Konflik identitas ditemukan:\n${conflicts.join("\n")}`);
    }

    let existingEvidenceCount = 0;

    if (existingSource && existingEntityIds.length > 0) {
      const evidenceRows = await db
        .select({
          entityId: entityEvidences.entityId,
          sourceUrl: entityEvidences.sourceUrl,
        })
        .from(entityEvidences)
        .where(
          and(
            eq(entityEvidences.entityType, "hero"),
            eq(entityEvidences.sourceId, existingSource.id),
            eq(entityEvidences.aspectName, "IDENTITY"),
            inArray(entityEvidences.entityId, existingEntityIds),
          ),
        );

      const evidenceKeys = new Set(
        evidenceRows.map((row) => `${row.entityId}|${row.sourceUrl ?? ""}`),
      );

      for (const hero of data.heroes) {
        const existing = heroBySlug.get(hero.slug.toLowerCase());

        if (
          existing &&
          evidenceKeys.has(`${existing.entityId}|${hero.sourceUrl}`)
        ) {
          existingEvidenceCount += 1;
        }
      }
    }

    const evidenceToInsert =
      data.heroes.length - existingEvidenceCount;

    console.log("\n===== DATABASE PREFLIGHT =====");
    console.log(`Source: ${existingSource ? "Sudah terdaftar" : "Baru"}`);
    console.log(`Hero baru: ${newHeroes.length}`);
    console.log(`Hero sudah ada: ${existingHeroes.length}`);
    console.log(`Evidence sudah ada: ${existingEvidenceCount}`);
    console.log(`Evidence yang akan ditambahkan: ${evidenceToInsert}`);

    if (newHeroes.length > 0) {
      console.log(`\nHero baru: ${newHeroes.join(", ")}`);
    }

    if (existingHeroes.length > 0) {
      console.log(`Hero lama: ${existingHeroes.join(", ")}`);
    }

    if (!commit) {
      console.log("\nDRY RUN selesai. Database tidak diubah.");
      console.log("Periksa hasil preflight sebelum menjalankan --commit.");
      return;
    }

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('mlbb-hero-identity-import-v1'))`,
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

      let inserted = 0;
      let existing = 0;
      let evidenceInserted = 0;

      for (const hero of data.heroes) {
        const [existingHero] = await tx
          .select({
            entityId: knowledgeEntities.entityId,
            metadata: knowledgeEntities.metadata,
          })
          .from(knowledgeEntities)
          .where(
            and(
              eq(knowledgeEntities.entityType, "hero"),
              sql`lower(${knowledgeEntities.metadata}->>'slug') = ${hero.slug.toLowerCase()}`,
            ),
          )
          .limit(1);

        let entityId: string;

        if (existingHero) {
          const metadata = existingHero.metadata;
          const existingName =
            metadata &&
            typeof metadata === "object" &&
            "name" in metadata &&
            typeof metadata.name === "string"
              ? metadata.name
              : "";

          if (existingName.toLowerCase() !== hero.name.toLowerCase()) {
            throw new Error(`Konflik nama untuk slug ${hero.slug}.`);
          }

          entityId = existingHero.entityId;
          existing += 1;
        } else {
          const [created] = await tx
            .insert(knowledgeEntities)
            .values({
              entityType: "hero",
              metadata: {
                name: hero.name,
                slug: hero.slug,
                ...(hero.portraitUrl ? { portraitUrl: hero.portraitUrl } : {}),
                ...(hero.releaseDate ? { releaseDate: hero.releaseDate } : {}),
              },
            })
            .returning({ entityId: knowledgeEntities.entityId });

          if (!created) {
            throw new Error(`Gagal membuat identitas: ${hero.slug}`);
          }

          entityId = created.entityId;
          inserted += 1;
        }

        const [existingEvidence] = await tx
          .select({ id: entityEvidences.id })
          .from(entityEvidences)
          .where(
            and(
              eq(entityEvidences.entityType, "hero"),
              eq(entityEvidences.entityId, entityId),
              eq(entityEvidences.sourceId, source.id),
              eq(entityEvidences.sourceUrl, hero.sourceUrl),
              eq(entityEvidences.aspectName, "IDENTITY"),
            ),
          )
          .limit(1);

        if (!existingEvidence) {
          await tx.insert(entityEvidences).values({
            entityType: "hero",
            entityId,
            aspectName: "IDENTITY",
            sourceId: source.id,
            sourceUrl: hero.sourceUrl,
            claimClassification: "UNKNOWN",
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

main().catch((error) => {
  console.error("Import gagal:", error);
  process.exitCode = 1;
});
