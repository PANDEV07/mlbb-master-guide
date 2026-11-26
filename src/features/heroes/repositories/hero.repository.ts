import type { HeroEvidence } from "../types/hero-evidence.types";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  knowledgeEntities,
  patchVersions,
  profiles,
  entityEvidences,
  sources,
} from "@/lib/db/schema";
import {
  heroIdentitySchema,
  heroProfileSchema,
} from "../schemas/hero.schema";
import type { HeroRecord } from "../types/hero.types";

export type HeroRepositoryResult = {
  patch: {
    id: string;
    versionCode: string;
    seasonLabel: string | null;
  } | null;
  heroes: HeroRecord[];
  invalidRecords: number;
};

export async function getCurrentOriginalServerHeroes(): Promise<HeroRepositoryResult> {
  const db = getDb();

  const [currentPatch] = await db
    .select({
      id: patchVersions.id,
      versionCode: patchVersions.versionCode,
      seasonLabel: patchVersions.seasonLabel,
    })
    .from(patchVersions)
    .where(
      and(
        eq(patchVersions.serverType, "ORIGINAL_SERVER"),
        eq(patchVersions.isCurrentLive, true),
      ),
    )
    .limit(1);

  const rows = await db
    .select({
      entityId: knowledgeEntities.entityId,
      entityType: knowledgeEntities.entityType,
      metadata: knowledgeEntities.metadata,
      profileId: profiles.id,
      patchVersionId: profiles.patchVersionId,
      serverType: profiles.serverType,
      effectiveRange: profiles.effectiveRange,
      payload: profiles.payload,
    })
    .from(knowledgeEntities)
    .leftJoin(
      profiles,
      currentPatch
        ? and(
          eq(profiles.entityId, knowledgeEntities.entityId),
          eq(profiles.entityType, knowledgeEntities.entityType),
          eq(profiles.patchVersionId, currentPatch.id),
          eq(profiles.serverType, "ORIGINAL_SERVER"),
          sql`${profiles.effectiveRange} @> now()`,
        )
        : sql`false`,
    )
    .where(eq(knowledgeEntities.entityType, "hero"))
    .orderBy(asc(sql`lower((${knowledgeEntities.metadata}->>'name'))`));

  const heroes: HeroRecord[] = [];
  let invalidRecords = 0;

  for (const row of rows) {
    const identity = heroIdentitySchema.safeParse(row.metadata);

    if (!identity.success) {
      invalidRecords += 1;
      continue;
    }

    let profile: HeroRecord["profile"] = null;

    if (row.profileId && row.payload) {
      const parsedProfile = heroProfileSchema.safeParse(row.payload);

      if (parsedProfile.success) {
        profile = parsedProfile.data;
      } else {
        invalidRecords += 1;
      }
    }

    heroes.push({
      entityId: row.entityId,
      entityType: "hero",
      metadata: identity.data,
      profileId: row.profileId,
      patchVersionId: row.patchVersionId,
      serverType: row.serverType,
      effectiveRange: row.effectiveRange,
      profile,
    });
  }

  return {
    patch: currentPatch ?? null,
    heroes,
    invalidRecords,
  };
}



export async function getOriginalServerHeroBySlug(
  slug: string,
): Promise<{
  patch: HeroRepositoryResult["patch"];
  hero: HeroRecord;
  evidences: {
    id: string;
    aspectName: string;
    sourceName: string;
    sourceDomain: string;
    sourceTier: "TIER_1_OFFICIAL" | "TIER_2_SECONDARY" | "TIER_3_ANALYTICAL" | "TIER_4_COMMUNITY";
    sourceUrl: string | null;
    claimClassification: "OFFICIAL_FACT" | "SECONDARY_SOURCE" | "RESEARCH_BASED_ANALYSIS" | "STRATEGIC_INTERPRETATION" | "COMMUNITY_THEORY" | "UNKNOWN";
    verificationStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" | "OUTDATED" | "CONFLICTING" | "UNKNOWN" | "NOT_RESEARCHED" | "NOT_YET_AVAILABLE" | "NOT_FOUND";
    confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
    stance: "SUPPORTING" | "CONFLICTING";
    evidenceExcerpt: string | null;
    conflictNotes: string | null;
    patchVersionId: string | null;
    verifiedAt: Date | null;
  }[];
} | null> {
  const db = getDb();

  const [currentPatch] = await db
    .select({
      id: patchVersions.id,
      versionCode: patchVersions.versionCode,
      seasonLabel: patchVersions.seasonLabel,
    })
    .from(patchVersions)
    .where(
      and(
        eq(patchVersions.serverType, "ORIGINAL_SERVER"),
        eq(patchVersions.isCurrentLive, true),
      ),
    )
    .limit(1);

  const rows = await db
    .select({
      entityId: knowledgeEntities.entityId,
      entityType: knowledgeEntities.entityType,
      metadata: knowledgeEntities.metadata,
      profileId: profiles.id,
      patchVersionId: profiles.patchVersionId,
      serverType: profiles.serverType,
      effectiveRange: profiles.effectiveRange,
      payload: profiles.payload,
    })
    .from(knowledgeEntities)
    .leftJoin(
      profiles,
      currentPatch
        ? and(
          eq(profiles.entityId, knowledgeEntities.entityId),
          eq(profiles.entityType, knowledgeEntities.entityType),
          eq(profiles.patchVersionId, currentPatch.id),
          eq(profiles.serverType, "ORIGINAL_SERVER"),
          sql`${profiles.effectiveRange} @> now()`,
        )
        : sql`false`,
    )
    .where(
      and(
        eq(knowledgeEntities.entityType, "hero"),
        sql`lower(${knowledgeEntities.metadata}->>'slug') = ${slug.toLowerCase()}`,
      ),
    )
    .limit(1);

  const row = rows[0];

  if (!row) return null;

  const identity = heroIdentitySchema.safeParse(row.metadata);

  if (!identity.success) return null;
  const evidences = await db
    .select({
      id: entityEvidences.id,
      aspectName: entityEvidences.aspectName,
      sourceName: sources.name,
      sourceDomain: sources.domain,
      sourceTier: sources.sourceTier,
      sourceUrl: entityEvidences.sourceUrl,
      claimClassification: entityEvidences.claimClassification,
      verificationStatus: entityEvidences.verificationStatus,
      confidenceLevel: entityEvidences.confidenceLevel,
      stance: entityEvidences.stance,
      evidenceExcerpt: entityEvidences.evidenceExcerpt,
      conflictNotes: entityEvidences.conflictNotes,
      patchVersionId: entityEvidences.patchVersionId,
      verifiedAt: entityEvidences.verifiedAt,
    })
    .from(entityEvidences)
    .innerJoin(sources, eq(entityEvidences.sourceId, sources.id))
    .where(
      and(
        eq(entityEvidences.entityType, "hero"),
        eq(entityEvidences.entityId, row.entityId),
        currentPatch
          ? or(
            eq(entityEvidences.patchVersionId, currentPatch.id),
            isNull(entityEvidences.patchVersionId),
          )
          : isNull(entityEvidences.patchVersionId),
      ),
    )
    .orderBy(asc(entityEvidences.createdAt));

  let profile: HeroRecord["profile"] = null;

  if (row.profileId && row.payload) {
    const parsedProfile = heroProfileSchema.safeParse(row.payload);

    if (parsedProfile.success) {
      profile = parsedProfile.data;
    }
  }

  return {
    patch: currentPatch ?? null,
    hero: {
      entityId: row.entityId,
      entityType: "hero",
      metadata: identity.data,
      profileId: row.profileId,
      patchVersionId: row.patchVersionId,
      serverType: row.serverType,
      effectiveRange: row.effectiveRange,
      profile,
    },
    evidences,
  };
}


