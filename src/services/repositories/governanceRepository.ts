import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { entityEvidences, patchChanges, patchVersions, sources } from "@/lib/db/schema";
import type { ServerEnvironment } from "@/types/knowledge";

export interface ProvenanceInheritanceRule {
  parentEntity: string;
  childEntity: string;
  inheritanceAllowed: "YES" | "CONDITIONAL" | "NO";
  ruleSummary: string;
}

/**
 * Matriks resmi Provenance Inheritance sesuai SOURCE_VERIFICATION_POLICY.md (ADR-005).
 */
export const PROVENANCE_INHERITANCE_MATRIX: readonly ProvenanceInheritanceRule[] = [
  {
    parentEntity: "item_version_profiles",
    childEntity: "item_effects / item_components",
    inheritanceAllowed: "YES",
    ruleSummary:
      "Mewarisi status & bukti bila diambil dari deskripsi/resep in-game item yang sama.",
  },
  {
    parentEntity: "builds",
    childEntity: "build_items",
    inheritanceAllowed: "YES",
    ruleSummary: "Mewarisi sumber, patch, dan status verifikasi dari build induknya.",
  },
  {
    parentEntity: "match_games",
    childEntity: "draft_actions / game_player_performances",
    inheritanceAllowed: "CONDITIONAL",
    ruleSummary:
      "Hanya mewarisi bila bukti game mendokumentasikan draft/boxscore game tersebut; dilarang dari agregat turnamen.",
  },
  {
    parentEntity: "heroes",
    childEntity: "hero_skills",
    inheritanceAllowed: "NO",
    ruleSummary: "Setiap hero_skills wajib memiliki status verifikasi dan bukti independen.",
  },
  {
    parentEntity: "heroes / items",
    childEntity: "hero_matchups / hero_counters / item_counters / hero_synergies / builds",
    inheritanceAllowed: "NO",
    ruleSummary: "Derived analysis wajib memiliki alasan mekanis, patch, confidence, dan status sendiri.",
  },
  {
    parentEntity: "match_games",
    childEntity: "match_observations",
    inheritanceAllowed: "NO",
    ruleSummary: "Wajib menyertakan bukti dan timestamp VOD spesifik untuk setiap observasi.",
  },
  {
    parentEntity: "match_observations",
    childEntity: "competitive_insights",
    inheritanceAllowed: "NO",
    ruleSummary: "Interpretasi strategis dinilai independen dengan reasoning dan syarat kondisi.",
  },
  {
    parentEntity: "competitive_insights",
    childEntity: "pro_to_ranked_adaptations",
    inheritanceAllowed: "NO",
    ruleSummary: "Adaptasi dinilai independen terhadap 7 dimensi konteks Ranked.",
  },
] as const;

export const DEFAULT_SERVER_ENVIRONMENT: ServerEnvironment = "ORIGINAL_SERVER";

export async function getCurrentLivePatch(
  serverType: ServerEnvironment = DEFAULT_SERVER_ENVIRONMENT
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(patchVersions)
    .where(
      and(
        eq(patchVersions.serverType, serverType),
        eq(patchVersions.isCurrentLive, true)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listPatchVersions(
  serverType: ServerEnvironment = DEFAULT_SERVER_ENVIRONMENT
) {
  const db = getDb();
  return db
    .select()
    .from(patchVersions)
    .where(eq(patchVersions.serverType, serverType))
    .orderBy(desc(patchVersions.versionOrder));
}

export async function listPatchChangesByPatchId(patchVersionId: string) {
  const db = getDb();
  return db
    .select()
    .from(patchChanges)
    .where(eq(patchChanges.patchVersionId, patchVersionId));
}

export async function listEvidencesForEntity(entityType: string, entityId: string) {
  const db = getDb();
  return db
    .select({
      evidence: entityEvidences,
      source: sources,
    })
    .from(entityEvidences)
    .innerJoin(sources, eq(entityEvidences.sourceId, sources.id))
    .where(
      and(
        eq(entityEvidences.entityType, entityType),
        eq(entityEvidences.entityId, entityId)
      )
    );
}
