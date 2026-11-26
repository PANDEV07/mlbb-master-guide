import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { proBuildImportFileSchema } from "@/features/esports/schemas/pro-build-import.schema";
import {
  resolveProBuildImportCatalog,
  type CatalogLookupEntity,
} from "@/features/esports/server/pro-build-import.resolver";
import { closeDatabaseConnection, getDb } from "../client";
import { getDatabaseConfig } from "../env";
import {
  knowledgeEntities,
  patchVersions,
  proMatchBuildItems,
  proMatchPlayerBuilds,
  proMatchSources,
  proMatches,
} from "../schema";

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

function parseCliArgs(argv: string[]): { commit: boolean; filePath: string } {
  let commit = false;
  let filePath = path.resolve(
    process.cwd(),
    "src/data/imports/pro-builds.json",
  );

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--commit") {
      commit = true;
      continue;
    }
    if (arg === "--file") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("Argumen --file membutuhkan path berkas JSON.");
      }
      filePath = path.resolve(process.cwd(), next);
      index += 1;
      continue;
    }
    throw new Error(
      `Argumen tidak dikenal: ${arg}. Gunakan [--file <path>] [--commit].`,
    );
  }

  return { commit, filePath };
}

async function main(): Promise<void> {
  const { commit, filePath } = parseCliArgs(process.argv.slice(2));

  if (commit && process.env.MLBB_ALLOW_PRO_BUILD_IMPORT !== "YES") {
    throw new Error(
      "Commit diblokir. Set MLBB_ALLOW_PRO_BUILD_IMPORT=YES setelah memastikan DATABASE_URL menunjuk database yang benar.",
    );
  }

  const raw = await readFile(filePath, "utf8");
  const parsed = proBuildImportFileSchema.safeParse(
    JSON.parse(raw.replace(/^\uFEFF/, "")),
  );

  if (!parsed.success) {
    console.error("Import ditolak: struktur JSON Pro Build tidak valid.");
    console.error(parsed.error.flatten());
    process.exitCode = 1;
    return;
  }

  const config = getDatabaseConfig();
  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`Berkas input: ${filePath}`);
  console.log(`Target DB (${config.connectionMode}): ${config.maskedUrl}`);

  const db = getDb();

  try {
    const [entityRows, patchRows] = await Promise.all([
      db
        .select({
          entityId: knowledgeEntities.entityId,
          entityType: knowledgeEntities.entityType,
          metadata: knowledgeEntities.metadata,
        })
        .from(knowledgeEntities)
        .where(
          inArray(knowledgeEntities.entityType, [
            "hero",
            "item",
            "spell",
            "emblem",
          ]),
        ),
      db
        .select({
          id: patchVersions.id,
          versionCode: patchVersions.versionCode,
          serverType: patchVersions.serverType,
        })
        .from(patchVersions),
    ]);

    const grouped: Record<
      "hero" | "item" | "spell" | "emblem",
      CatalogLookupEntity[]
    > = {
      hero: [],
      item: [],
      spell: [],
      emblem: [],
    };

    for (const row of entityRows) {
      if (
        row.entityType === "hero" ||
        row.entityType === "item" ||
        row.entityType === "spell" ||
        row.entityType === "emblem"
      ) {
        grouped[row.entityType].push({
          entityId: row.entityId,
          slug: readMetadataText(row.metadata, "slug"),
          name: readMetadataText(row.metadata, "name"),
        });
      }
    }

    const resolved = resolveProBuildImportCatalog(parsed.data, {
      heroes: grouped.hero,
      items: grouped.item,
      spells: grouped.spell,
      emblems: grouped.emblem,
      patches: patchRows,
    });

    console.log("Ringkasan resolusi katalog:");
    console.log(JSON.stringify(resolved.summary, null, 2));

    if (!commit) {
      console.log(
        "\n[DRY RUN] Tidak ada data yang ditulis. Tambahkan --commit dan MLBB_ALLOW_PRO_BUILD_IMPORT=YES untuk menyimpan ke database.",
      );
      return;
    }

    let insertedMatches = 0;
    let insertedBuilds = 0;
    let skippedBuilds = 0;
    let insertedItems = 0;
    let insertedSources = 0;

    await db.transaction(async (tx) => {
      for (const match of resolved.matches) {
        const matchConditions = [
          eq(proMatches.tournamentName, match.tournamentName),
          eq(proMatches.teamAName, match.teamAName),
          eq(proMatches.teamBName, match.teamBName),
          match.matchCode
            ? eq(proMatches.matchCode, match.matchCode)
            : isNull(proMatches.matchCode),
          match.gameNumber !== null
            ? eq(proMatches.gameNumber, match.gameNumber)
            : isNull(proMatches.gameNumber),
        ];

        const [existingMatch] = await tx
          .select({ id: proMatches.id })
          .from(proMatches)
          .where(and(...matchConditions))
          .limit(1);

        let proMatchId = existingMatch?.id;

        if (!proMatchId) {
          const [createdMatch] = await tx
            .insert(proMatches)
            .values({
              tournamentName: match.tournamentName,
              stageName: match.stageName,
              matchCode: match.matchCode,
              gameNumber: match.gameNumber,
              teamAName: match.teamAName,
              teamBName: match.teamBName,
              winnerTeamName: match.winnerTeamName,
              matchDate: match.matchDate,
              playedAt: match.playedAt,
              patchVersionId: match.patchVersionId,
              serverType: match.serverType,
              rawPatchVersion: match.rawPatchVersion,
              verificationStatus: match.verificationStatus,
            })
            .returning({ id: proMatches.id });

          proMatchId = createdMatch.id;
          insertedMatches += 1;
        }

        for (const source of match.sources) {
          const [existingSource] = await tx
            .select({ id: proMatchSources.id })
            .from(proMatchSources)
            .where(
              and(
                eq(proMatchSources.proMatchId, proMatchId),
                eq(proMatchSources.provider, source.provider),
                eq(proMatchSources.sourceUrl, source.sourceUrl),
              ),
            )
            .limit(1);

          if (!existingSource) {
            await tx.insert(proMatchSources).values({
              proMatchId,
              provider: source.provider,
              sourceUrl: source.sourceUrl,
              sourceTier: source.sourceTier,
              claimClassification: source.claimClassification,
              confidenceLevel: source.confidenceLevel,
              verificationStatus: source.verificationStatus,
              verifiedAt: source.verifiedAt ?? null,
              verifiedBy: source.verifiedBy ?? null,
              evidenceExcerpt: source.evidenceExcerpt ?? null,
            });
            insertedSources += 1;
          }
        }

        for (const build of match.playerBuilds) {
          const [existingBuild] = await tx
            .select({ id: proMatchPlayerBuilds.id })
            .from(proMatchPlayerBuilds)
            .where(
              and(
                eq(proMatchPlayerBuilds.proMatchId, proMatchId),
                eq(proMatchPlayerBuilds.teamName, build.teamName),
                eq(proMatchPlayerBuilds.playerName, build.playerName),
              ),
            )
            .limit(1);

          if (existingBuild) {
            skippedBuilds += 1;
            continue;
          }

          const [createdBuild] = await tx
            .insert(proMatchPlayerBuilds)
            .values({
              proMatchId,
              playerName: build.playerName,
              teamName: build.teamName,
              teamSide: build.teamSide,
              roleLane: build.roleLane,
              heroEntityId: build.heroEntityId,
              rawHeroName: build.rawHeroName,
              battleSpellEntityId: build.battleSpellEntityId,
              rawBattleSpellName: build.rawBattleSpellName,
              emblemEntityId: build.emblemEntityId,
              rawEmblemName: build.rawEmblemName,
              rawEmblemTalents: build.rawEmblemTalents,
              matchResult: build.matchResult,
              kills: build.kills,
              deaths: build.deaths,
              assists: build.assists,
              verificationStatus: build.verificationStatus,
            })
            .returning({ id: proMatchPlayerBuilds.id });

          insertedBuilds += 1;

          for (const item of build.items) {
            await tx.insert(proMatchBuildItems).values({
              playerBuildId: createdBuild.id,
              slotOrder: item.slotOrder,
              rawItemName: item.rawItemName,
              itemEntityId: item.itemEntityId,
              catalogMatchStatus: item.catalogMatchStatus,
              verificationStatus: item.verificationStatus,
              isVerifiedItem: item.isVerifiedItem,
            });
            insertedItems += 1;
          }
        }
      }
    });

    console.log(
      `[COMMIT SELESAI] pro_matches: +${insertedMatches}, pro_match_player_builds: +${insertedBuilds} (dilewati: ${skippedBuilds}), pro_match_build_items: +${insertedItems}, pro_match_sources: +${insertedSources}.`,
    );
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(
    "[pro-build:import] GAGAL:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
