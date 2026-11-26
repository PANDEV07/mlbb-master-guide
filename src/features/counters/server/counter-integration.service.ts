import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  getItemCatalog,
  type ItemCatalogRecord,
} from "../../items/server/item.repository";

import {
  extractMechanicEvidence,
  type SkillMechanicEvidence,
} from "../../matchups/engine/mechanic-evidence-extractor";

import {
  analyzeItemCounters,
  type ItemCounterItem,
} from "../engine/item-counter-engine";

interface RawSkill {
  apiSkillId?: string | number;
  apiGroupId?: string | number;
  name: string;
  description?: string;
}

interface RawSkillGroup {
  apiGroupId: string | number;
  skills: RawSkill[];
}

interface RawHero {
  heroName: string;
  skillGroups: RawSkillGroup[];
}

function loadHeroDataset(): RawHero[] {
  const path = resolve(process.cwd(), "hero-gameplay-normalized.json");
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error("Format hero-gameplay-normalized.json bukan array.");
  }

  return parsed as RawHero[];
}

function buildHeroEvidence(heroes: RawHero[]): SkillMechanicEvidence[] {
  return heroes.flatMap((hero) =>
    hero.skillGroups.flatMap((group) =>
      group.skills.map((skill) => ({
        heroName: hero.heroName,
        skillName: skill.name,
        apiSkillId: skill.apiSkillId ?? null,
        apiGroupId: skill.apiGroupId ?? group.apiGroupId,
        sourceDataset: "hero-gameplay-normalized.json" as const,
        evidence: extractMechanicEvidence(skill.description ?? ""),
        verificationStatus: "UNVERIFIED" as const,
      })),
    ),
  );
}

function mapItem(record: ItemCatalogRecord): ItemCounterItem {
  return {
    entityId: record.entityId,
    canonicalId: record.canonicalId,
    name: record.name,
    slug: record.slug,
    category: record.category,
    tier: record.tier,
    iconUrl: record.iconUrl,
    price: record.price,
    passiveEffects: record.passiveEffects.map((effect) => ({
      name: effect.name,
      description: effect.description,
      verificationStatus: effect.verificationStatus,
    })),
    activeEffects: record.activeEffects.map((effect) => ({
      name: effect.name,
      description: effect.description,
      verificationStatus: effect.verificationStatus,
    })),
    verificationStatus: record.verificationStatus,
  };
}

export async function analyzeCounterWithItems(targetHero: string) {
  const [heroes, catalog] = await Promise.all([
    Promise.resolve(loadHeroDataset()),
    getItemCatalog(),
  ]);

  const heroEvidence = buildHeroEvidence(heroes);
  const items = catalog.items.map(mapItem);

  const analysis = analyzeItemCounters(
    targetHero,
    heroEvidence,
    items,
  );

  return {
    metadata: {
      heroSource: "hero-gameplay-normalized.json",
      heroCount: heroes.length,
      heroSkillRecordCount: heroEvidence.length,
      heroEvidenceRecordCount: heroEvidence.filter(
        (record) => record.evidence.length > 0,
      ).length,
      itemSource: "Original Server item catalog",
      itemPatchVersion: catalog.patchVersion,
      itemCount: items.length,
      itemVerificationStatus: "UNVERIFIED" as const,
      heroVerificationStatus: "UNVERIFIED" as const,
      patchCompatibility: "UNKNOWN" as const,
      patchCompatibilityReason:
        "Versi patch dataset hero lokal belum tersedia untuk dibandingkan dengan patch katalog item.",
    },
    analysis,
  };
}