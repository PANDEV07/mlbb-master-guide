import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { knowledgeEntities } from "@/lib/db/schema";
import {
  buildProfileSchema,
  type BuildProfile,
  type BuildProfileInput,
} from "../schemas/build.schema";

type ReferenceEntityType = "hero" | "item" | "emblem" | "spell";

type ReferenceGroup = {
  entityType: ReferenceEntityType;
  ids: string[];
  label: string;
};

async function findMissingEntityIds(
  entityType: ReferenceEntityType,
  ids: string[],
): Promise<string[]> {
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length === 0) return [];

  const db = getDb();

  const rows = await db
    .select({ entityId: knowledgeEntities.entityId })
    .from(knowledgeEntities)
    .where(
      and(
        eq(knowledgeEntities.entityType, entityType),
        inArray(knowledgeEntities.entityId, uniqueIds),
      ),
    );

  const existingIds = new Set(rows.map((row) => row.entityId));

  return uniqueIds.filter((id) => !existingIds.has(id));
}

export type BuildValidationResult =
  | { success: true; data: BuildProfile }
  | { success: false; errors: string[] };

export async function validateBuildReferences(
  heroEntityId: string,
  input: BuildProfileInput | unknown,
): Promise<BuildValidationResult> {
  const heroIdResult = z.string().uuid().safeParse(heroEntityId);

  if (!heroIdResult.success) {
    return {
      success: false,
      errors: ["ID hero tidak valid."],
    };
  }

  const parsed = buildProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }

  const profile = parsed.data;

  const references: ReferenceGroup[] = [
    {
      entityType: "hero",
      ids: [heroIdResult.data],
      label: "Hero",
    },
    {
      entityType: "item",
      ids: [
        ...profile.itemSlots.map((slot) => slot.itemEntityId),
        ...profile.itemSlots.flatMap(
          (slot) => slot.alternativeItemEntityIds,
        ),
        ...profile.conditions.flatMap(
          (condition) => condition.replacementItemEntityIds,
        ),
      ],
      label: "Item",
    },
    {
      entityType: "emblem",
      ids: [
        ...(profile.emblemId ? [profile.emblemId] : []),
        ...profile.emblemTalentIds,
      ],
      label: "Emblem dan talent",
    },
    {
      entityType: "spell",
      ids: profile.battleSpellId ? [profile.battleSpellId] : [],
      label: "Battle Spell",
    },
  ];

  const errors: string[] = [];

  for (const reference of references) {
    const missingIds = await findMissingEntityIds(
      reference.entityType,
      reference.ids,
    );

    if (missingIds.length > 0) {
      errors.push(
        `${reference.label}: ${missingIds.length} referensi tidak ditemukan atau memiliki tipe entitas yang salah.`,
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: profile,
  };
}