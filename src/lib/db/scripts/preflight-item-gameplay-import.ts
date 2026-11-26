import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { itemProfileSchema } from "../../../features/items/schemas/item-profile.schema";

type FinalItem = {
  entity: {
    canonicalId: string;
    name: string;
    slug: string;
  };
  profile: unknown;
  recipe: unknown;
  provenance: {
    sourceUrl: string;
    [key: string]: unknown;
  };
};

type AuditRecord = {
  canonicalId: string;
  name: string;
  slug: string;
  patchVersion: string;
  serverType: string;
  verification: {
    status: string;
    verifiedAspect: string | null;
    patchChange: string | null;
    baseAttributesStatus: string;
    recipeStatus: string;
    sourceUrl: string;
    patchSources: Array<{
      name: string;
      url: string;
      sourceTier: string;
    }>;
  };
};

type AuditFile = {
  schemaVersion: number;
  auditType: string;
  patchVersion: string;
  serverType: string;
  totalItems: number;
  records: AuditRecord[];
};

async function main() {
  const root = process.cwd();

  const finalPath = path.join(root, "item-gameplay-final.json");
  const auditPath = path.join(root, "item-patch-verification-audit.json");
  const outputPath = path.join(root, "item-gameplay-import-preflight.json");

  const finalItems = JSON.parse(
    await readFile(finalPath, "utf8"),
  ) as FinalItem[];

  const audit = JSON.parse(
    await readFile(auditPath, "utf8"),
  ) as AuditFile;

  const errors: string[] = [];
  const prepared = [];
  const seenSlugs = new Set<string>();
  const auditBySlug = new Map<string, AuditRecord>();

  for (const record of audit.records) {
    if (auditBySlug.has(record.slug)) {
      errors.push(`Duplikat slug pada audit: ${record.slug}`);
    }
    auditBySlug.set(record.slug, record);
  }

  for (const item of finalItems) {
    const slug = item.entity?.slug;

    if (!slug) {
      errors.push("Item tanpa slug ditemukan.");
      continue;
    }

    if (seenSlugs.has(slug)) {
      errors.push(`Duplikat slug pada dataset: ${slug}`);
      continue;
    }
    seenSlugs.add(slug);

    const auditRecord = auditBySlug.get(slug);

    if (!auditRecord) {
      errors.push(`Audit tidak ditemukan: ${slug}`);
      continue;
    }

    if (auditRecord.canonicalId !== item.entity.canonicalId) {
      errors.push(`Canonical ID tidak cocok: ${slug}`);
    }

    if (auditRecord.verification.sourceUrl !== item.provenance.sourceUrl) {
      errors.push(`Source URL tidak cocok: ${slug}`);
    }

    const profileResult = itemProfileSchema.safeParse(item.profile);

    if (!profileResult.success) {
      errors.push(
        `Profile tidak valid: ${slug} - ${profileResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`,
      );
      continue;
    }

    const allowedStatuses = [
      "PARTIALLY_VERIFIED",
      "UNVERIFIED_NOT_COVERED_BY_PATCH_NOTES",
    ];

    if (!allowedStatuses.includes(auditRecord.verification.status)) {
      errors.push(`Status audit tidak dikenal: ${slug}`);
    }

    if (
      auditRecord.patchVersion !== audit.patchVersion ||
      auditRecord.serverType !== audit.serverType
    ) {
      errors.push(`Metadata patch tidak konsisten: ${slug}`);
    }

    prepared.push({
      entity: item.entity,
      profile: profileResult.data,
      recipe: item.recipe,
      provenance: item.provenance,
      verification: auditRecord.verification,
      target: {
        patchVersion: auditRecord.patchVersion,
        serverType: auditRecord.serverType,
        effectiveRange: null,
        commitAllowed: false,
      },
    });
  }

  for (const slug of auditBySlug.keys()) {
    if (!seenSlugs.has(slug)) {
      errors.push(`Audit tanpa item dataset: ${slug}`);
    }
  }

  const partialVerified = prepared.filter(
    (item) => item.verification.status === "PARTIALLY_VERIFIED",
  ).length;

  const report = {
    schemaVersion: 1,
    mode: "READ_ONLY_PREFLIGHT",
    generatedAt: new Date().toISOString(),
    targetPatch: audit.patchVersion,
    serverType: audit.serverType,
    targetEffectiveRange: null,
    commitAllowed: false,
    totalItems: finalItems.length,
    preparedItems: prepared.length,
    partialVerified,
    notVerified: prepared.length - partialVerified,
    errors,
    records: prepared,
  };

  await writeFile(
    outputPath,
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.log("\n=== ITEM GAMEPLAY IMPORT PREFLIGHT ===");
  console.log("Mode: READ ONLY");
  console.log("Total dataset:", finalItems.length);
  console.log("Profil valid:", prepared.length);
  console.log("Partial verified:", partialVerified);
  console.log("Belum terverifikasi:", prepared.length - partialVerified);
  console.log("Error:", errors.length);
  console.log("Target patch:", audit.patchVersion);
  console.log("Server:", audit.serverType);
  console.log("Effective range: BELUM DITETAPKAN");
  console.log("Commit allowed: NO");
  console.log("Output:", outputPath);

  if (errors.length > 0) {
    console.log("\n=== ERROR DETAIL ===");
    for (const error of errors) console.log("-", error);
    process.exitCode = 1;
  } else {
    console.log("\nPREFLIGHT LULUS. Database tidak diubah.");
  }
}

main().catch((error: unknown) => {
  console.error("Preflight gagal:", error);
  process.exitCode = 1;
});