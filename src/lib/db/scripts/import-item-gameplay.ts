import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, sql } from "drizzle-orm";

import { itemProfileSchema } from "../../../features/items/schemas/item-profile.schema";
import { getDb, closeDatabaseConnection } from "../client";
import { getDatabaseConfig } from "../env";
import {
  knowledgeEntities,
  patchVersions,
  profiles,
  sources,
  entityEvidences,
} from "../schema";

type FinalItem = {
  entity: {
    canonicalId: string;
    name: string;
    slug: string;
  };
  profile: unknown;
  recipe: {
    recipeType?: string;
    components?: Array<{ componentSlug: string; quantity: number }>;
    componentCost?: number | null;
    combineCost?: number | null;
    availability?: unknown;
  };
  provenance: {
    sourceUrl: string;
    [key: string]: unknown;
  };
};

type AuditRecord = {
  slug: string;
  canonicalId: string;
  verification: {
    status: string;
    verifiedAspect: string | null;
    patchChange: string | null;
    [key: string]: unknown;
  };
};

type AuditFile = {
  patchVersion: string;
  serverType: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL";
  records: AuditRecord[];
};

type EvidenceCandidate = {
  entityId: string;
  sourceUrl: string;
  aspectName: string;
  excerpt: string;
  verificationStatus: "UNVERIFIED" | "PARTIALLY_VERIFIED";
};

const sourceConfig = {
  name: "MLBBHub Item Gameplay",
  domain: "mlbbhub.com",
  baseUrl: "https://mlbbhub.com/items",
  sourceTier: "TIER_2_SECONDARY" as const,
  sourceCategory: "ITEM_GAMEPLAY",
  reliabilityNotes:
    "Data gameplay item dan recipe diekstrak dari halaman MLBBHub. Sumber sekunder; bukan verifikasi resmi Moonton. Status verifikasi disimpan per aspek dan patch.",
};

function excerpt(value: unknown): string {
  return JSON.stringify(value).slice(0, 2000);
}

function buildEvidence(
  item: FinalItem,
  entityId: string,
  audit: AuditRecord,
): EvidenceCandidate[] {
  const profile = item.profile as {
    price: number | null;
    attributes: unknown[];
    passiveEffects: unknown[];
    activeEffects: unknown[];
  };

  const candidates: EvidenceCandidate[] = [];
  const add = (
    aspectName: string,
    value: unknown,
    status: EvidenceCandidate["verificationStatus"] = "UNVERIFIED",
  ) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value) && value.length === 0) return;

    candidates.push({
      entityId,
      sourceUrl: item.provenance.sourceUrl,
      aspectName,
      excerpt: excerpt(value),
      verificationStatus: status,
    });
  };

  add("ITEM_PRICE", profile.price);
  add("ITEM_ATTRIBUTES", profile.attributes);
  add(
    "ITEM_PASSIVE_EFFECTS",
    profile.passiveEffects,
    audit.verification.status === "PARTIALLY_VERIFIED" &&
      audit.verification.verifiedAspect === "PASSIVE_EFFECT"
      ? "PARTIALLY_VERIFIED"
      : "UNVERIFIED",
  );
  add("ITEM_ACTIVE_EFFECTS", profile.activeEffects);
  add("ITEM_RECIPE", item.recipe);

  return candidates;
}

async function main(): Promise<void> {
  const commit = process.argv.includes("--commit");

  if (
    commit &&
    process.env.MLBB_ALLOW_ITEM_GAMEPLAY_IMPORT !== "YES"
  ) {
    throw new Error(
      "Commit ditolak. Persetujuan eksplisit belum diberikan.",
    );
  }

  const root = process.cwd();

  const items = JSON.parse(
    await readFile(
      path.join(root, "item-gameplay-final.json"),
      "utf8",
    ),
  ) as FinalItem[];

  const audit = JSON.parse(
    await readFile(
      path.join(root, "item-patch-verification-audit.json"),
      "utf8",
    ),
  ) as AuditFile;

  if (items.length !== 104 || audit.records.length !== 104) {
    throw new Error("Dataset dan audit harus berisi 104 item.");
  }

  const auditMap = new Map(
    audit.records.map((record) => [record.slug, record]),
  );

  const prepared = items.map((item) => {
    const record = auditMap.get(item.entity.slug);

    if (
      !record ||
      record.canonicalId !== item.entity.canonicalId
    ) {
      throw new Error(`Audit tidak cocok: ${item.entity.slug}`);
    }

    const parsed = itemProfileSchema.safeParse(item.profile);

    if (!parsed.success) {
      throw new Error(`Profile tidak valid: ${item.entity.slug}`);
    }

    if (!item.provenance.sourceUrl) {
      throw new Error(`Source URL kosong: ${item.entity.slug}`);
    }

    return {
      ...item,
      profile: parsed.data,
      audit: record,
    };
  });

  const db = getDb();
  const config = getDatabaseConfig();

  try {
    console.log("\n=== ITEM GAMEPLAY IMPORT PREFLIGHT ===");
    console.log("Mode:", commit ? "COMMIT" : "DRY RUN");
    console.log("Host:", config.host);
    console.log("Items:", prepared.length);

    const [patch] = await db
      .select()
      .from(patchVersions)
      .where(
        and(
          eq(patchVersions.versionCode, audit.patchVersion),
          eq(patchVersions.serverType, audit.serverType),
        ),
      )
      .limit(1);

    if (!patch?.releaseDate) {
      throw new Error("Patch atau release date tidak ditemukan.");
    }

    const releaseDate = String(patch.releaseDate).slice(0, 10);

    const entities = await db
      .select({
        entityId: knowledgeEntities.entityId,
        metadata: knowledgeEntities.metadata,
      })
      .from(knowledgeEntities)
      .where(eq(knowledgeEntities.entityType, "item"));

    const entityBySlug = new Map<string, string>();

    for (const entity of entities) {
      if (
        entity.metadata &&
        typeof entity.metadata === "object" &&
        !Array.isArray(entity.metadata)
      ) {
        const metadata = entity.metadata as Record<string, unknown>;
        if (typeof metadata.slug === "string") {
          entityBySlug.set(metadata.slug, entity.entityId);
        }
      }
    }

    const missing = prepared.filter(
      (item) => !entityBySlug.has(item.entity.slug),
    );

    if (missing.length) {
      throw new Error(
        `Entity hilang: ${missing.map((item) => item.entity.slug).join(", ")}`,
      );
    }

    const sourceRows = await db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.name, sourceConfig.name),
          eq(sources.domain, sourceConfig.domain),
        ),
      )
      .limit(1);

    const existingSource = sourceRows[0];

    if (
      existingSource &&
      (
        existingSource.baseUrl !== sourceConfig.baseUrl ||
        existingSource.sourceTier !== sourceConfig.sourceTier ||
        existingSource.sourceCategory !== sourceConfig.sourceCategory
      )
    ) {
      throw new Error("Konfigurasi source berbeda dari registry.");
    }

    const entityIds = prepared.map(
      (item) => entityBySlug.get(item.entity.slug)!,
    );

    const existingProfiles = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.entityType, "item"),
          eq(profiles.patchVersionId, patch.id),
          eq(profiles.serverType, audit.serverType),
          inArray(profiles.entityId, entityIds),
        ),
      );

    if (existingProfiles.length) {
      throw new Error(
        `Ditemukan ${existingProfiles.length} profil pada target patch. Import dibatalkan.`,
      );
    }

    const overlapRows = await db
      .select({
        entityId: profiles.entityId,
        patchVersionId: profiles.patchVersionId,
      })
      .from(profiles)
      .where(
        and(
          eq(profiles.entityType, "item"),
          eq(profiles.serverType, audit.serverType),
          inArray(profiles.entityId, entityIds),
          sql`${profiles.effectiveRange} && tstzrange(${`${releaseDate}T00:00:00Z`}::timestamptz, NULL, '[)')`,
        ),
      );

    if (overlapRows.length > 0) {
      throw new Error(
        `Benturan effective range ditemukan pada ${overlapRows.length} profil. Import dibatalkan.`,
      );
    }

    const evidenceCandidates = prepared.flatMap((item) =>
      buildEvidence(
        item,
        entityBySlug.get(item.entity.slug)!,
        item.audit,
      ),
    );

    let existingEvidenceCount = 0;

    if (existingSource && evidenceCandidates.length) {
      const existingEvidence = await db
        .select({
          entityId: entityEvidences.entityId,
          sourceUrl: entityEvidences.sourceUrl,
          aspectName: entityEvidences.aspectName,
          patchVersionId: entityEvidences.patchVersionId,
        })
        .from(entityEvidences)
        .where(
          and(
            eq(entityEvidences.entityType, "item"),
            eq(entityEvidences.sourceId, existingSource.id),
            eq(entityEvidences.patchVersionId, patch.id),
            inArray(
              entityEvidences.entityId,
              entityIds,
            ),
          ),
        );

      const existingKeys = new Set(
        existingEvidence.map((row) =>
          [
            row.entityId,
            row.sourceUrl ?? "",
            row.aspectName,
            row.patchVersionId ?? "",
          ].join("|"),
        ),
      );

      existingEvidenceCount = evidenceCandidates.filter((candidate) =>
        existingKeys.has(
          [
            candidate.entityId,
            candidate.sourceUrl,
            candidate.aspectName,
            patch.id,
          ].join("|"),
        ),
      ).length;
    }

    if (existingEvidenceCount > 0) {
      throw new Error(
        `Ditemukan ${existingEvidenceCount} evidence yang sudah ada. Import dibatalkan agar tidak duplikat.`,
      );
    }

    const evidenceByAspect = new Map<string, number>();

    for (const candidate of evidenceCandidates) {
      evidenceByAspect.set(
        candidate.aspectName,
        (evidenceByAspect.get(candidate.aspectName) ?? 0) + 1,
      );
    }

    console.log("\n=== PREFLIGHT RESULT ===");
    console.log("Patch:", audit.patchVersion);
    console.log("Patch ID:", patch.id);
    console.log("Release date:", releaseDate);
    console.log("Server:", audit.serverType);
    console.log("Entity cocok:", entityIds.length);
    console.log("Source:", existingSource ? "Sudah terdaftar" : "Baru");
    console.log("Profil existing:", existingProfiles.length);
    console.log("Evidence kandidat:", evidenceCandidates.length);
    console.log("Evidence existing:", existingEvidenceCount);

    for (const [aspect, count] of evidenceByAspect) {
      console.log(`  ${aspect}: ${count}`);
    }

    console.log("Effective range:", `[${releaseDate}T00:00:00Z, infinity)`);

    if (!commit) {
      console.log("\nDRY RUN LULUS. Database tidak diubah.");
      return;
    }

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('mlbb-item-gameplay-import-v2'))`,
      );

      const [lockedPatch] = await tx
        .select({ id: patchVersions.id })
        .from(patchVersions)
        .where(
          and(
            eq(patchVersions.id, patch.id),
            eq(patchVersions.versionCode, audit.patchVersion),
            eq(patchVersions.serverType, audit.serverType),
          ),
        )
        .limit(1);

      if (!lockedPatch) {
        throw new Error("Patch target berubah. Transaksi dibatalkan.");
      }

      const profileRecheck = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(
          and(
            eq(profiles.entityType, "item"),
            eq(profiles.patchVersionId, patch.id),
            eq(profiles.serverType, audit.serverType),
            inArray(profiles.entityId, entityIds),
          ),
        );

      if (profileRecheck.length) {
        throw new Error("Profil muncul saat transaksi. Dibatalkan.");
      }

      const overlapRecheck = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(
          and(
            eq(profiles.entityType, "item"),
            eq(profiles.serverType, audit.serverType),
            inArray(profiles.entityId, entityIds),
            sql`${profiles.effectiveRange} && tstzrange(${`${releaseDate}T00:00:00Z`}::timestamptz, NULL, '[)')`,
          ),
        );

      if (overlapRecheck.length) {
        throw new Error("Benturan effective range saat transaksi. Dibatalkan.");
      }

      await tx
        .insert(sources)
        .values(sourceConfig)
        .onConflictDoNothing({
          target: [sources.name, sources.domain],
        });

      const [source] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.name, sourceConfig.name),
            eq(sources.domain, sourceConfig.domain),
          ),
        )
        .limit(1);

      if (!source) {
        throw new Error("Source registry gagal dibuat/ditemukan.");
      }

      const evidenceRecheck = await tx
        .select({
          entityId: entityEvidences.entityId,
          sourceUrl: entityEvidences.sourceUrl,
          aspectName: entityEvidences.aspectName,
        })
        .from(entityEvidences)
        .where(
          and(
            eq(entityEvidences.entityType, "item"),
            eq(entityEvidences.sourceId, source.id),
            eq(entityEvidences.patchVersionId, patch.id),
            inArray(entityEvidences.entityId, entityIds),
          ),
        );

      const evidenceKeys = new Set(
        evidenceRecheck.map((row) =>
          `${row.entityId}|${row.sourceUrl ?? ""}|${row.aspectName}`,
        ),
      );

      const duplicateCandidates = evidenceCandidates.filter((candidate) =>
        evidenceKeys.has(
          `${candidate.entityId}|${candidate.sourceUrl}|${candidate.aspectName}`,
        ),
      );

      if (duplicateCandidates.length) {
        throw new Error("Evidence duplikat ditemukan saat transaksi.");
      }

      for (const item of prepared) {
        const entityId = entityBySlug.get(item.entity.slug);

        if (!entityId) {
          throw new Error(`Entity ID hilang: ${item.entity.slug}`);
        }

        await tx.insert(profiles).values({
          entityId,
          entityType: "item",
          patchVersionId: patch.id,
          serverType: audit.serverType,
          effectiveRange: sql` tstzrange(${`${releaseDate}T00:00:00Z`}::timestamptz, NULL, '[)') `,
          payload: {
            schemaVersion: 1,
            gameplay: item.profile,
            recipe: item.recipe,
            provenance: item.provenance,
            verification: item.audit.verification,
          },
        });
      }

      for (const candidate of evidenceCandidates) {
        await tx.insert(entityEvidences).values({
          entityType: "item",
          entityId: candidate.entityId,
          aspectName: candidate.aspectName,
          sourceId: source.id,
          sourceUrl: candidate.sourceUrl,
          claimClassification: "SECONDARY_SOURCE",
          verificationStatus: candidate.verificationStatus,
          confidenceLevel: "LOW",
          stance: "SUPPORTING",
          evidenceExcerpt: candidate.excerpt,
          patchVersionId: patch.id,
        });
      }
    });

    console.log("\nIMPORT BERHASIL");
    console.log("Profil dibuat:", prepared.length);
    console.log("Evidence dibuat:", evidenceCandidates.length);
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error: unknown) => {
  console.error("\nIMPORT GAGAL:", error);
  process.exitCode = 1;
});