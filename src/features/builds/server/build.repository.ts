import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  entityEvidences,
  heroBuilds,
  patchVersions,
} from "@/lib/db/schema";
import type { BuildProfile } from "../schemas/build.schema";

export type PublishedBuildRecord = {
  id: string;
  heroEntityId: string;
  patchVersionId: string;
  patchVersion: string;
  serverType: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL";
  profile: BuildProfile;
  verificationStatus: string;
  publishedAt: Date | null;
  evidence: Array<{
    aspectName: string;
    verificationStatus: string;
    confidenceLevel: string;
    sourceUrl: string | null;
    claimClassification: string;
  }>;
};

type BuildQueryOptions = {
  heroEntityId: string;
  patchVersionId?: string;
  serverType?: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL";
};

export async function getPublishedBuildsForHero({
  heroEntityId,
  patchVersionId,
  serverType = "ORIGINAL_SERVER",
}: BuildQueryOptions): Promise<PublishedBuildRecord[]> {
  const db = getDb();

  const conditions = [
    eq(heroBuilds.heroEntityId, heroEntityId),
    eq(heroBuilds.serverType, serverType),
    eq(heroBuilds.status, "PUBLISHED"),
    patchVersionId
      ? eq(heroBuilds.patchVersionId, patchVersionId)
      : eq(patchVersions.isCurrentLive, true),
  ];

  const rows = await db
    .select({
      id: heroBuilds.id,
      heroEntityId: heroBuilds.heroEntityId,
      patchVersionId: heroBuilds.patchVersionId,
      patchVersion: patchVersions.versionCode,
      serverType: heroBuilds.serverType,
      profile: heroBuilds.profile,
      verificationStatus: heroBuilds.verificationStatus,
      publishedAt: heroBuilds.publishedAt,
    })
    .from(heroBuilds)
    .innerJoin(
      patchVersions,
      and(
        eq(heroBuilds.patchVersionId, patchVersions.id),
        eq(heroBuilds.serverType, patchVersions.serverType),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(heroBuilds.createdAt));

  if (rows.length === 0) return [];

  const buildIds = rows.map((row) => row.id);

  const evidenceRows = await db
    .select({
      entityId: entityEvidences.entityId,
      aspectName: entityEvidences.aspectName,
      verificationStatus: entityEvidences.verificationStatus,
      confidenceLevel: entityEvidences.confidenceLevel,
      sourceUrl: entityEvidences.sourceUrl,
      claimClassification: entityEvidences.claimClassification,
    })
    .from(entityEvidences)
    .where(
      and(
        eq(entityEvidences.entityType, "hero_build"),
        inArray(entityEvidences.entityId, buildIds),
      ),
    );

  return rows.map((row) => ({
    ...row,
    profile: row.profile,
    evidence: evidenceRows
      .filter((evidence) => evidence.entityId === row.id)
      .map((evidence) => ({
        aspectName: evidence.aspectName,
        verificationStatus: evidence.verificationStatus,
        confidenceLevel: evidence.confidenceLevel,
        sourceUrl: evidence.sourceUrl,
        claimClassification: evidence.claimClassification,
      })),
  }));
}