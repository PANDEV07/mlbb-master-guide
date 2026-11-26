import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  entityEvidences,
  heroBuilds,
  patchVersions,
  proMatchBuildItems,
  proMatchPlayerBuilds,
  proMatchSources,
  proMatches,
  sources,
} from "@/lib/db/schema";
import {
  composeThreeBuildTemplates,
  mapHeroBuildToTemplate,
  mapProMatchBuildToTemplate,
} from "../utils/template-mapper";
import type { HeroBuildTemplate } from "../types/build.types";

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; cause?: unknown };
  if (record.code === "42P01") return true;
  if (record.cause && typeof record.cause === "object") {
    return (record.cause as { code?: unknown }).code === "42P01";
  }
  return false;
}

async function safeGetHeroBuildTemplates(
  heroEntityId: string,
  limit: number,
): Promise<HeroBuildTemplate[]> {
  if (limit <= 0) return [];

  const db = getDb();

  try {
    const rows = await db
      .select({
        id: heroBuilds.id,
        patchVersion: patchVersions.versionCode,
        profile: heroBuilds.profile,
        status: heroBuilds.status,
        verificationStatus: heroBuilds.verificationStatus,
      })
      .from(heroBuilds)
      .innerJoin(
        patchVersions,
        and(
          eq(heroBuilds.patchVersionId, patchVersions.id),
          eq(heroBuilds.serverType, patchVersions.serverType),
        ),
      )
      .where(
        and(
          eq(heroBuilds.heroEntityId, heroEntityId),
          eq(heroBuilds.serverType, "ORIGINAL_SERVER"),
          eq(patchVersions.isCurrentLive, true),
          inArray(heroBuilds.status, ["PUBLISHED", "TEMPLATE"]),
        ),
      )
      .orderBy(
        desc(
          sql`CASE WHEN ${heroBuilds.status} = 'PUBLISHED' THEN 2 WHEN ${heroBuilds.status} = 'TEMPLATE' THEN 1 ELSE 0 END`,
        ),
        desc(
          sql`CASE WHEN ${heroBuilds.verificationStatus} = 'VERIFIED' THEN 2 WHEN ${heroBuilds.verificationStatus} = 'PARTIALLY_VERIFIED' THEN 1 ELSE 0 END`,
        ),
        asc(heroBuilds.createdAt),
      )
      .limit(limit);

    if (rows.length === 0) return [];

    const buildIds = rows.map((row) => row.id);
    const evidenceRows = await db
      .select({
        entityId: entityEvidences.entityId,
        sourceUrl: entityEvidences.sourceUrl,
        sourceName: sources.name,
      })
      .from(entityEvidences)
      .innerJoin(sources, eq(entityEvidences.sourceId, sources.id))
      .where(
        and(
          eq(entityEvidences.entityType, "hero_build"),
          inArray(entityEvidences.entityId, buildIds),
        ),
      );

    return rows.map((row) => {
      const evidence = evidenceRows.find((item) => item.entityId === row.id);
      return mapHeroBuildToTemplate({
        id: row.id,
        patchVersion: row.patchVersion,
        verificationStatus: row.verificationStatus,
        profile: row.profile,
        sourceLabel: evidence?.sourceName
          ? `Sumber: ${evidence.sourceName}`
          : "Database Hero Builds",
        sourceUrl: evidence?.sourceUrl ?? null,
      });
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

async function safeGetProMatchBuildTemplates(
  heroEntityId: string,
  limit: number,
): Promise<HeroBuildTemplate[]> {
  if (limit <= 0) return [];

  const db = getDb();

  try {
    const buildRows = await db
      .select({
        id: proMatchPlayerBuilds.id,
        proMatchId: proMatchPlayerBuilds.proMatchId,
        playerName: proMatchPlayerBuilds.playerName,
        teamName: proMatchPlayerBuilds.teamName,
        roleLane: proMatchPlayerBuilds.roleLane,
        matchResult: proMatchPlayerBuilds.matchResult,
        verificationStatus: proMatchPlayerBuilds.verificationStatus,
        tournamentName: proMatches.tournamentName,
        stageName: proMatches.stageName,
        matchDate: proMatches.matchDate,
        rawPatchVersion: proMatches.rawPatchVersion,
        patchVersion: patchVersions.versionCode,
      })
      .from(proMatchPlayerBuilds)
      .innerJoin(
        proMatches,
        eq(proMatchPlayerBuilds.proMatchId, proMatches.id),
      )
      .leftJoin(
        patchVersions,
        and(
          eq(proMatches.patchVersionId, patchVersions.id),
          eq(proMatches.serverType, patchVersions.serverType),
        ),
      )
      .where(
        and(
          eq(proMatchPlayerBuilds.heroEntityId, heroEntityId),
          eq(proMatches.serverType, "ORIGINAL_SERVER"),
        ),
      )
      .orderBy(
        desc(
          sql`CASE WHEN ${proMatchPlayerBuilds.verificationStatus} = 'VERIFIED' THEN 2 WHEN ${proMatchPlayerBuilds.verificationStatus} = 'PARTIALLY_VERIFIED' THEN 1 ELSE 0 END`,
        ),
        desc(proMatches.matchDate),
        desc(proMatchPlayerBuilds.createdAt),
      )
      .limit(limit);

    if (buildRows.length === 0) return [];

    const buildIds = buildRows.map((row) => row.id);
    const matchIds = [...new Set(buildRows.map((row) => row.proMatchId))];

    const [itemRows, sourceRows] = await Promise.all([
      db
        .select({
          playerBuildId: proMatchBuildItems.playerBuildId,
          slotOrder: proMatchBuildItems.slotOrder,
          rawItemName: proMatchBuildItems.rawItemName,
          itemEntityId: proMatchBuildItems.itemEntityId,
          catalogMatchStatus: proMatchBuildItems.catalogMatchStatus,
          isVerifiedItem: proMatchBuildItems.isVerifiedItem,
        })
        .from(proMatchBuildItems)
        .where(inArray(proMatchBuildItems.playerBuildId, buildIds))
        .orderBy(asc(proMatchBuildItems.slotOrder)),
      db
        .select({
          proMatchId: proMatchSources.proMatchId,
          playerBuildId: proMatchSources.playerBuildId,
          provider: proMatchSources.provider,
          sourceUrl: proMatchSources.sourceUrl,
          verificationStatus: proMatchSources.verificationStatus,
        })
        .from(proMatchSources)
        .where(inArray(proMatchSources.proMatchId, matchIds))
        .orderBy(
          desc(
            sql`CASE WHEN ${proMatchSources.verificationStatus} = 'VERIFIED' THEN 1 ELSE 0 END`,
          ),
          asc(proMatchSources.importedAt),
        ),
    ]);

    return buildRows.map((row) => {
      const items = itemRows.filter((item) => item.playerBuildId === row.id);
      const source =
        sourceRows.find((src) => src.playerBuildId === row.id) ??
        sourceRows.find(
          (src) => src.proMatchId === row.proMatchId && src.playerBuildId === null,
        ) ??
        sourceRows.find((src) => src.proMatchId === row.proMatchId) ??
        null;

      return mapProMatchBuildToTemplate({
        id: row.id,
        playerName: row.playerName,
        teamName: row.teamName,
        roleLane: row.roleLane,
        matchResult: row.matchResult,
        tournamentName: row.tournamentName,
        stageName: row.stageName,
        matchDate: row.matchDate,
        patchVersion: row.patchVersion,
        rawPatchVersion: row.rawPatchVersion,
        verificationStatus: row.verificationStatus,
        provider: source?.provider ?? null,
        sourceUrl: source?.sourceUrl ?? null,
        items,
      });
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
}

export type HeroBuildTemplatesResult = {
  templates: HeroBuildTemplate[];
  databaseTemplateCount: number;
};

/**
 * Mengambil hingga 3 template build nyata dari database (`hero_builds` lalu `pro_match_player_builds`)
 * untuk hero tertentu. Slot yang belum memiliki data di database diisi template kosong standar.
 */
export async function getHeroBuildTemplates(
  heroEntityId: string,
): Promise<HeroBuildTemplatesResult> {
  const heroBuildTemplates = await safeGetHeroBuildTemplates(heroEntityId, 3);
  const remaining = Math.max(0, 3 - heroBuildTemplates.length);
  const proBuildTemplates = await safeGetProMatchBuildTemplates(
    heroEntityId,
    remaining,
  );

  const databaseTemplates = [...heroBuildTemplates, ...proBuildTemplates];

  return {
    templates: composeThreeBuildTemplates(databaseTemplates),
    databaseTemplateCount: databaseTemplates.length,
  };
}
