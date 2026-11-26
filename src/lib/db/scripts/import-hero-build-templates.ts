import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { buildProfileSchema } from "@/features/builds/schemas/build.schema";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { closeDatabaseConnection, getDb } from "../client";
import { getDatabaseConfig } from "../env";
import {
  entityEvidences,
  heroBuilds,
  knowledgeEntities,
  patchVersions,
  sources,
} from "../schema";

const OUTPUT_FILE = path.resolve(
  process.cwd(),
  "src/data/imports/hero-build-templates.json",
);

const extractedBuildSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  sourceUrl: z.string().trim().url(),
  items: z
    .array(
      z.object({
        position: z.number().int().min(1).max(6),
        rawItemName: z.string().trim().min(1).max(160),
        rationale: z.string().trim().min(1).max(400),
      }),
    )
    .length(6),
});

const extractedFileSchema = z.object({
  schemaVersion: z.literal(1),
  extractedAt: z.string(),
  source: z.object({
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
    reliabilityNotes: z.string(),
  }),
  heroes: z.array(
    z.object({
      heroSlug: z.string().trim().min(1),
      heroName: z.string().trim().min(1),
      pageUrl: z.string().url(),
      builds: z.array(extractedBuildSchema),
    }),
  ),
});

type ExtractedFile = z.output<typeof extractedFileSchema>;

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readMetadataText(
  metadata: unknown,
  field: "slug" | "name",
): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }
  const value = (metadata as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}

function cleanBuildName(rawName: string): string {
  const colonIdx = rawName.indexOf(":");
  const stripped =
    colonIdx >= 0 ? rawName.slice(colonIdx + 1).trim() : rawName.trim();
  return stripped.slice(0, 120) || rawName.trim().slice(0, 120);
}

function cleanItemStepName(stepName: string): string {
  return stepName.replace(/^buy\s+/i, "").trim();
}

async function fetchHeroBuildsFromMlbbHub(hero: {
  slug: string;
  name: string;
}): Promise<{
  heroSlug: string;
  heroName: string;
  pageUrl: string;
  builds: ExtractedFile["heroes"][number]["builds"];
}> {
  const pageUrl = `https://mlbbhub.com/heroes/${hero.slug}`;

  try {
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent": "MLBBMasterGuide/1.0 (+build-template-sync)",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { heroSlug: hero.slug, heroName: hero.name, pageUrl, builds: [] };
    }

    const html = await response.text();
    const jsonLdBlocks = [
      ...html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      ),
    ];

    const builds: ExtractedFile["heroes"][number]["builds"] = [];

    for (const match of jsonLdBlocks) {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(match[1]);
      } catch {
        continue;
      }

      if (!parsedJson || typeof parsedJson !== "object") continue;
      const obj = parsedJson as Record<string, unknown>;
      if (obj["@type"] !== "HowTo") continue;

      const rawSteps = Array.isArray(obj.step) ? obj.step : [];
      const items = rawSteps
        .map((step, index) => {
          if (!step || typeof step !== "object") return null;
          const rec = step as Record<string, unknown>;
          const position =
            typeof rec.position === "number" ? rec.position : index + 1;
          const stepName =
            typeof rec.name === "string" ? cleanItemStepName(rec.name) : "";
          const stepText =
            typeof rec.text === "string" && rec.text.trim()
              ? rec.text.trim()
              : `Slot ${position}: ${stepName}`;
          const stepUrl = typeof rec.url === "string" ? rec.url.trim() : "";

          if (!stepName || position < 1 || position > 6) return null;
          return {
            position,
            rawItemName: stepName,
            rationale: stepText.slice(0, 400),
            url: stepUrl,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.position - b.position);

      if (items.length !== 6) continue;
      const uniquePositions = new Set(items.map((item) => item.position));
      if (uniquePositions.size !== 6) continue;

      const rawName =
        typeof obj.name === "string" ? obj.name : `Build ${builds.length + 1}`;
      const description =
        typeof obj.description === "string" && obj.description.trim()
          ? obj.description.trim().slice(0, 1000)
          : `Template build ${hero.name} dari MLBBHub.`;
      const sourceUrl = items[0]?.url || pageUrl;

      builds.push({
        name: cleanBuildName(rawName),
        description,
        sourceUrl,
        items: items.map(({ position, rawItemName, rationale }) => ({
          position,
          rawItemName,
          rationale,
        })),
      });

      if (builds.length >= 3) break;
    }

    return { heroSlug: hero.slug, heroName: hero.name, pageUrl, builds };
  } catch {
    return { heroSlug: hero.slug, heroName: hero.name, pageUrl, builds: [] };
  }
}

async function runExtract(): Promise<void> {
  const db = getDb();
  try {
    const heroRows = await db
      .select({
        entityId: knowledgeEntities.entityId,
        metadata: knowledgeEntities.metadata,
      })
      .from(knowledgeEntities)
      .where(eq(knowledgeEntities.entityType, "hero"));

    const heroes = heroRows
      .map((row) => ({
        slug: readMetadataText(row.metadata, "slug"),
        name: readMetadataText(row.metadata, "name"),
      }))
      .filter((hero) => hero.slug && hero.name)
      .sort((a, b) => a.slug.localeCompare(b.slug));

    console.log(
      `[build-template:extract] Mengekstrak 3 build dari mlbbhub.com untuk ${heroes.length} hero...`,
    );

    const results: ExtractedFile["heroes"] = [];
    const concurrency = 8;

    for (let i = 0; i < heroes.length; i += concurrency) {
      const batch = heroes.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((hero) => fetchHeroBuildsFromMlbbHub(hero)),
      );
      results.push(...batchResults);
      process.stdout.write(
        `\r[build-template:extract] Progres: ${Math.min(i + concurrency, heroes.length)}/${heroes.length} hero`,
      );
    }
    process.stdout.write("\n");

    const payload: ExtractedFile = {
      schemaVersion: 1,
      extractedAt: new Date().toISOString(),
      source: {
        name: "MLBBHub",
        domain: "mlbbhub.com",
        baseUrl: "https://mlbbhub.com/heroes",
        sourceTier: "TIER_2_SECONDARY",
        sourceCategory: "SECONDARY_HERO_BUILDS",
        reliabilityNotes:
          "Template build diekstrak dari JSON-LD HowTo halaman hero MLBBHub. Sumber sekunder/komunitas; berstatus UNVERIFIED hingga diverifikasi terhadap sumber resmi atau pertandingan pro.",
      },
      heroes: results,
    };

    const validated = extractedFileSchema.parse(payload);
    await writeFile(OUTPUT_FILE, JSON.stringify(validated, null, 2), "utf8");

    const heroesWithBuilds = validated.heroes.filter(
      (hero) => hero.builds.length > 0,
    ).length;
    const totalBuilds = validated.heroes.reduce(
      (sum, hero) => sum + hero.builds.length,
      0,
    );
    console.log(
      `[build-template:extract] SELESAI: ${heroesWithBuilds}/${validated.heroes.length} hero memiliki build (${totalBuilds} total template) -> ${OUTPUT_FILE}`,
    );
  } finally {
    await closeDatabaseConnection();
  }
}

async function runImport(commit: boolean): Promise<void> {
  if (commit && process.env.MLBB_ALLOW_BUILD_TEMPLATE_IMPORT !== "YES") {
    throw new Error(
      "Commit diblokir. Set MLBB_ALLOW_BUILD_TEMPLATE_IMPORT=YES untuk menulis template build ke database.",
    );
  }

  const raw = await readFile(OUTPUT_FILE, "utf8");
  const parsed = extractedFileSchema.safeParse(
    JSON.parse(raw.replace(/^\uFEFF/, "")),
  );
  if (!parsed.success) {
    throw new Error(
      `Berkas ${OUTPUT_FILE} tidak valid: ${JSON.stringify(parsed.error.flatten())}`,
    );
  }

  const data = parsed.data;
  const config = getDatabaseConfig();
  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`Target DB (${config.connectionMode}): ${config.maskedUrl}`);

  const db = getDb();
  try {
    const [currentPatch] = await db
      .select({
        id: patchVersions.id,
        versionCode: patchVersions.versionCode,
      })
      .from(patchVersions)
      .where(
        and(
          eq(patchVersions.serverType, "ORIGINAL_SERVER"),
          eq(patchVersions.isCurrentLive, true),
        ),
      )
      .limit(1);

    if (!currentPatch) {
      throw new Error(
        "Current live ORIGINAL_SERVER patch belum ditemukan di patch_versions.",
      );
    }

    const [entityRows, existingBuilds] = await Promise.all([
      db
        .select({
          entityId: knowledgeEntities.entityId,
          entityType: knowledgeEntities.entityType,
          metadata: knowledgeEntities.metadata,
        })
        .from(knowledgeEntities)
        .where(inArray(knowledgeEntities.entityType, ["hero", "item"])),
      db
        .select({
          id: heroBuilds.id,
          heroEntityId: heroBuilds.heroEntityId,
          profile: heroBuilds.profile,
          status: heroBuilds.status,
        })
        .from(heroBuilds)
        .where(
          and(
            eq(heroBuilds.patchVersionId, currentPatch.id),
            eq(heroBuilds.serverType, "ORIGINAL_SERVER"),
            eq(heroBuilds.status, "TEMPLATE"),
          ),
        ),
    ]);

    const heroBySlug = new Map<string, string>();
    const itemByKey = new Map<string, string>();

    for (const row of entityRows) {
      const slug = readMetadataText(row.metadata, "slug");
      const name = readMetadataText(row.metadata, "name");
      if (row.entityType === "hero" && slug) {
        heroBySlug.set(normalizeKey(slug), row.entityId);
      }
      if (row.entityType === "item") {
        if (slug) itemByKey.set(normalizeKey(slug), row.entityId);
        if (name) itemByKey.set(normalizeKey(name), row.entityId);
      }
    }

    const existingKeys = new Set(
      existingBuilds.map(
        (row) => `${row.heroEntityId}:${row.profile.name.trim().toLowerCase()}`,
      ),
    );

    const readyToInsert: Array<{
      heroEntityId: string;
      heroSlug: string;
      profile: z.output<typeof buildProfileSchema>;
      sourceUrl: string;
    }> = [];
    const unmatchedItemNames = new Set<string>();
    let skippedExisting = 0;
    let skippedIncomplete = 0;

    for (const hero of data.heroes) {
      const heroEntityId = heroBySlug.get(normalizeKey(hero.heroSlug));
      if (!heroEntityId) continue;

      const role = HERO_ROLE_MAP[hero.heroSlug]?.[0] ?? "Unknown";
      const lane = HERO_LANE_MAP[hero.heroSlug]?.[0] ?? "Unknown";

      for (const build of hero.builds.slice(0, 3)) {
        const dedupKey = `${heroEntityId}:${build.name.trim().toLowerCase()}`;
        if (existingKeys.has(dedupKey)) {
          skippedExisting += 1;
          continue;
        }

        const resolvedSlots = build.items.map((item) => {
          const itemEntityId = itemByKey.get(normalizeKey(item.rawItemName));
          if (!itemEntityId) {
            unmatchedItemNames.add(item.rawItemName);
            return null;
          }
          return {
            position: item.position,
            itemEntityId,
            required: item.position <= 3,
            alternativeItemEntityIds: [],
            rationale: item.rationale,
          };
        });

        if (resolvedSlots.some((slot) => slot === null)) {
          skippedIncomplete += 1;
          continue;
        }

        const validatedProfile = buildProfileSchema.safeParse({
          schemaVersion: 1,
          name: build.name,
          description: build.description,
          role,
          lane,
          itemSlots: resolvedSlots,
          emblemId: null,
          emblemTalentIds: [],
          battleSpellId: null,
          conditions: [],
        });

        if (!validatedProfile.success) {
          skippedIncomplete += 1;
          continue;
        }

        readyToInsert.push({
          heroEntityId,
          heroSlug: hero.heroSlug,
          profile: validatedProfile.data,
          sourceUrl: build.sourceUrl,
        });
      }
    }

    const coveredHeroes = new Set(readyToInsert.map((item) => item.heroSlug))
      .size;
    console.log(
      JSON.stringify(
        {
          patchVersion: currentPatch.versionCode,
          readyToInsertBuilds: readyToInsert.length,
          readyToInsertHeroes: coveredHeroes,
          skippedExisting,
          skippedIncomplete,
          unmatchedItemNames: [...unmatchedItemNames].sort(),
        },
        null,
        2,
      ),
    );

    if (!commit) {
      console.log(
        "\n[DRY RUN] Tidak ada data ditulis. Tambahkan --commit dan MLBB_ALLOW_BUILD_TEMPLATE_IMPORT=YES untuk menyimpan.",
      );
      return;
    }

    await db.transaction(async (tx) => {
      let [sourceRow] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.name, data.source.name),
            eq(sources.domain, data.source.domain),
          ),
        )
        .limit(1);

      if (!sourceRow) {
        [sourceRow] = await tx
          .insert(sources)
          .values({
            name: data.source.name,
            domain: data.source.domain,
            baseUrl: data.source.baseUrl,
            sourceTier: data.source.sourceTier,
            sourceCategory: data.source.sourceCategory,
            reliabilityNotes: data.source.reliabilityNotes,
            isActive: true,
          })
          .returning({ id: sources.id });
      }

      for (const entry of readyToInsert) {
        const [created] = await tx
          .insert(heroBuilds)
          .values({
            heroEntityId: entry.heroEntityId,
            heroEntityType: "hero",
            patchVersionId: currentPatch.id,
            serverType: "ORIGINAL_SERVER",
            profile: entry.profile,
            status: "TEMPLATE",
            verificationStatus: "UNVERIFIED",
            publishedAt: null,
          })
          .returning({ id: heroBuilds.id });

        await tx.insert(entityEvidences).values({
          entityType: "hero_build",
          entityId: created.id,
          aspectName: "BUILD_TEMPLATE",
          sourceId: sourceRow.id,
          sourceUrl: entry.sourceUrl,
          claimClassification: "COMMUNITY_THEORY",
          verificationStatus: "UNVERIFIED",
          confidenceLevel: "LOW",
          stance: "SUPPORTING",
          evidenceExcerpt: `Template build "${entry.profile.name}" diekstrak dari JSON-LD HowTo MLBBHub.`,
          patchVersionId: currentPatch.id,
        });
      }
    });

    console.log(
      `[COMMIT SELESAI] Berhasil menyimpan ${readyToInsert.length} template build untuk ${coveredHeroes} hero ke hero_builds & entity_evidences.`,
    );
  } finally {
    await closeDatabaseConnection();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const extract = args.includes("--extract");
  const commit = args.includes("--commit");

  if (extract) {
    await runExtract();
    return;
  }

  await runImport(commit);
}

main().catch((error) => {
  console.error(
    "[build-template:import] GAGAL:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
