import { asc, count, desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  entityEvidences,
  heroBuilds,
  knowledgeEntities,
  patchChanges,
  patchVersions,
  proMatches,
  profiles,
  sources,
} from "@/lib/db/schema";
import { summarizeEvidenceHealth } from "../utils/patch-health";
import type {
  EvidenceAuditBucket,
  PatchHubSnapshot,
} from "../types/patch-hub.types";

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; cause?: unknown };
  if (record.code === "42P01") return true;
  if (record.cause && typeof record.cause === "object") {
    return (record.cause as { code?: unknown }).code === "42P01";
  }
  return false;
}

async function safeCountProMatches(): Promise<number> {
  const db = getDb();
  try {
    const rows = await db.select({ total: count() }).from(proMatches);
    return rows[0]?.total ?? 0;
  } catch (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
}

async function safeHeroBuildStats(): Promise<
  Array<{ status: string; verificationStatus: string; total: number }>
> {
  const db = getDb();
  try {
    return await db
      .select({
        status: heroBuilds.status,
        verificationStatus: heroBuilds.verificationStatus,
        total: count(),
      })
      .from(heroBuilds)
      .groupBy(heroBuilds.status, heroBuilds.verificationStatus);
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function getPatchHubSnapshot(): Promise<PatchHubSnapshot> {
  const db = getDb();

  const [
    patchRows,
    changeRows,
    sourceRows,
    evidenceRows,
    entityRows,
    profileRows,
    heroBuildRows,
    proMatchesCount,
  ] = await Promise.all([
    db
      .select({
        id: patchVersions.id,
        versionCode: patchVersions.versionCode,
        versionOrder: patchVersions.versionOrder,
        serverType: patchVersions.serverType,
        seasonLabel: patchVersions.seasonLabel,
        releaseDate: patchVersions.releaseDate,
        isCurrentLive: patchVersions.isCurrentLive,
        notesSummary: patchVersions.notesSummary,
      })
      .from(patchVersions)
      .orderBy(desc(patchVersions.versionOrder)),
    db
      .select({
        id: patchChanges.id,
        patchVersionId: patchChanges.patchVersionId,
        targetEntityType: patchChanges.targetEntityType,
        targetEntityId: patchChanges.targetEntityId,
        targetEntitySlug: patchChanges.targetEntitySlug,
        changeType: patchChanges.changeType,
        attributeName: patchChanges.attributeName,
        previousValue: patchChanges.previousValue,
        newValue: patchChanges.newValue,
        summary: patchChanges.summary,
      })
      .from(patchChanges)
      .orderBy(desc(patchChanges.createdAt)),
    db
      .select({
        id: sources.id,
        name: sources.name,
        domain: sources.domain,
        baseUrl: sources.baseUrl,
        sourceTier: sources.sourceTier,
        sourceCategory: sources.sourceCategory,
        reliabilityNotes: sources.reliabilityNotes,
        isActive: sources.isActive,
      })
      .from(sources)
      .orderBy(asc(sources.sourceTier), asc(sources.name)),
    db
      .select({
        entityType: entityEvidences.entityType,
        verificationStatus: entityEvidences.verificationStatus,
        claimClassification: entityEvidences.claimClassification,
        total: count(),
      })
      .from(entityEvidences)
      .groupBy(
        entityEvidences.entityType,
        entityEvidences.verificationStatus,
        entityEvidences.claimClassification,
      ),
    db
      .select({
        entityType: knowledgeEntities.entityType,
        total: count(),
      })
      .from(knowledgeEntities)
      .groupBy(knowledgeEntities.entityType),
    db
      .select({
        entityType: profiles.entityType,
        serverType: profiles.serverType,
        total: count(),
      })
      .from(profiles)
      .groupBy(profiles.entityType, profiles.serverType),
    safeHeroBuildStats(),
    safeCountProMatches(),
  ]);

  const evidenceBuckets: EvidenceAuditBucket[] = evidenceRows.map((row) => ({
    entityType: row.entityType,
    verificationStatus: row.verificationStatus,
    claimClassification: row.claimClassification,
    count: row.total,
  }));

  const heroesCount =
    entityRows.find((row) => row.entityType === "hero")?.total ?? 0;
  const itemsCount =
    entityRows.find((row) => row.entityType === "item")?.total ?? 0;
  const activeItemProfilesCount =
    profileRows.find(
      (row) =>
        row.entityType === "item" && row.serverType === "ORIGINAL_SERVER",
    )?.total ?? 0;

  let heroBuildTemplatesCount = 0;
  let publishedHeroBuildsCount = 0;
  let outdatedHeroBuildsCount = 0;

  for (const row of heroBuildRows) {
    if (row.status === "TEMPLATE") heroBuildTemplatesCount += row.total;
    if (row.status === "PUBLISHED") publishedHeroBuildsCount += row.total;
    if (row.verificationStatus === "OUTDATED") {
      outdatedHeroBuildsCount += row.total;
    }
  }

  return {
    patches: patchRows,
    changes: changeRows,
    sources: sourceRows,
    evidenceBuckets,
    evidenceHealth: summarizeEvidenceHealth(evidenceBuckets),
    inventory: {
      heroesCount,
      itemsCount,
      activeItemProfilesCount,
      heroBuildTemplatesCount,
      publishedHeroBuildsCount,
      outdatedHeroBuildsCount,
      proMatchesCount,
    },
  };
}
