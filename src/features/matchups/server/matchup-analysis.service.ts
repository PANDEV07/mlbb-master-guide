import candidateDataset from "../../../../hero-gameplay-normalized.json";
import { getHeroGameplayCandidate } from "@/features/heroes/data/hero-gameplay-candidates";
import {
  getHeroComboCollection,
  getHeroSkillGroupsForDisplay,
} from "@/features/heroes/data/hero-combos";
import {
  getItemCatalog,
  type ItemCatalogRecord,
} from "@/features/items/server/item.repository";
import {
  analyzeItemCounters,
  type ItemCounterItem,
} from "@/features/counters/engine/item-counter-engine";
import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "../engine/mechanic-extractor";
import {
  extractMechanicEvidence,
  type SkillMechanicEvidence,
} from "../engine/mechanic-evidence-extractor";
import { findEvidenceInteractions } from "../engine/evidence-interaction-engine";
import { findInteractionCandidates } from "../engine/interaction-rules";
import { aggregateMatchups } from "../engine/matchup-aggregator";
import { analyzeHeroMatchup } from "../engine/matchup-intelligence";
import {
  aggregateEnemyThreats,
  auditTeamComposition,
  buildAllySlotSuggestions,
  buildDynamicPhaseChecklists,
  buildHeroMechanicProfile,
  buildLaneMatchupSummaries,
  toHeroSlug,
} from "../engine/team-draft-analyzer";
import {
  MATCHUP_LANES,
  type EnrichedHeadToHeadData,
  type HeroMechanicProfileSummary,
  type MatchupControlImmunityPair,
  type MatchupItemRecommendation,
  type TeamDraftAnalysisPayload,
  type TeamSlotInput,
} from "../types/matchup-hub.types";

const ALL_CANDIDATE_HEROES =
  candidateDataset as unknown as GameplayCandidateHero[];

let cachedAllSkillEvidence: SkillMechanicEvidence[] | null = null;

function getAllSkillEvidence(): SkillMechanicEvidence[] {
  if (cachedAllSkillEvidence) return cachedAllSkillEvidence;

  cachedAllSkillEvidence = ALL_CANDIDATE_HEROES.flatMap((hero) =>
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

  return cachedAllSkillEvidence;
}

function buildSkillEvidenceForHeroes(
  heroes: GameplayCandidateHero[],
): SkillMechanicEvidence[] {
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

function mapCatalogItem(record: ItemCatalogRecord): ItemCounterItem {
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

async function safeLoadCounterItems(): Promise<{
  available: boolean;
  items: ItemCounterItem[];
}> {
  try {
    const catalog = await getItemCatalog();
    return {
      available: true,
      items: catalog.items.map(mapCatalogItem),
    };
  } catch {
    return {
      available: false,
      items: [],
    };
  }
}

export type MatchupAnalysisResult =
  | {
      success: true;
      analysis: ReturnType<typeof analyzeHeroMatchup>;
      metadata: {
        mechanicRecords: number;
        rawCandidates: number;
        aggregatedMatchups: number;
        excludedHeuristics: number;
      };
    }
  | {
      success: false;
      error: string;
    };

export type EnrichedMatchupAnalysisResult =
  | (Extract<MatchupAnalysisResult, { success: true }> & {
      enriched: EnrichedHeadToHeadData;
    })
  | {
      success: false;
      error: string;
    };

export type TeamDraftAnalysisResult =
  | {
      success: true;
      teamAnalysis: TeamDraftAnalysisPayload;
    }
  | {
      success: false;
      error: string;
    };

export function getMatchupAnalysis(
  heroAName: string,
  heroBName: string,
): MatchupAnalysisResult {
  const nameA = heroAName.trim();
  const nameB = heroBName.trim();

  if (!nameA || !nameB) {
    return { success: false, error: "Kedua nama hero wajib diisi." };
  }

  if (nameA.toLowerCase() === nameB.toLowerCase()) {
    return { success: false, error: "Pilih dua hero yang berbeda." };
  }

  const candidateA = getHeroGameplayCandidate(nameA);
  const candidateB = getHeroGameplayCandidate(nameB);

  if (!candidateA || !candidateB) {
    return {
      success: false,
      error: "Data gameplay kandidat untuk salah satu hero tidak ditemukan.",
    };
  }

  const selectedHeroes = [
    candidateA,
    candidateB,
  ] as unknown as GameplayCandidateHero[];

  const records = extractHeroMechanics(selectedHeroes);
  const candidates = findInteractionCandidates(records);
  const aggregation = aggregateMatchups(candidates);

  const analysis = analyzeHeroMatchup(
    aggregation.matchups,
    candidateA.heroName,
    candidateB.heroName,
  );

  return {
    success: true,
    analysis,
    metadata: {
      mechanicRecords: records.length,
      rawCandidates: candidates.length,
      aggregatedMatchups: aggregation.matchups.length,
      excludedHeuristics: aggregation.excludedHeuristics,
    },
  };
}

export async function getEnrichedHeadToHeadAnalysis(
  heroAName: string,
  heroBName: string,
): Promise<EnrichedMatchupAnalysisResult> {
  const base = getMatchupAnalysis(heroAName, heroBName);
  if (!base.success) return base;

  const candidateA = getHeroGameplayCandidate(
    base.analysis.heroA,
  ) as unknown as GameplayCandidateHero;
  const candidateB = getHeroGameplayCandidate(
    base.analysis.heroB,
  ) as unknown as GameplayCandidateHero;

  const profileA = buildHeroMechanicProfile(candidateA);
  const profileB = buildHeroMechanicProfile(candidateB);
  const sharedLanes = profileA.lanes.filter((lane) =>
    profileB.lanes.includes(lane),
  );

  const pairEvidence = buildSkillEvidenceForHeroes([candidateA, candidateB]);
  const evidenceInteractions = findEvidenceInteractions(pairEvidence);

  const mapEvidencePair = (
    item: (typeof evidenceInteractions)[number],
  ): MatchupControlImmunityPair => ({
    id: item.id,
    sourceHero: item.sourceHero,
    targetHero: item.targetHero,
    sourceSkill: item.sourceSkill,
    targetSkill: item.targetSkill,
    sourceMechanics: item.sourceEvidence.map((e) => e.mechanic),
    targetMechanics: item.targetEvidence.map((e) => e.mechanic),
    explanation: item.explanation,
    verificationStatus: "UNVERIFIED",
  });

  const aToBImmunity = evidenceInteractions
    .filter(
      (item) =>
        item.sourceHero.toLowerCase() === candidateA.heroName.toLowerCase(),
    )
    .map(mapEvidencePair);

  const bToAImmunity = evidenceInteractions
    .filter(
      (item) =>
        item.sourceHero.toLowerCase() === candidateB.heroName.toLowerCase(),
    )
    .map(mapEvidencePair);

  const itemCatalog = await safeLoadCounterItems();

  const mapItemRecs = (targetHeroName: string): MatchupItemRecommendation[] => {
    if (!itemCatalog.available || itemCatalog.items.length === 0) return [];
    const res = analyzeItemCounters(
      targetHeroName,
      pairEvidence,
      itemCatalog.items,
    );
    return res.candidates.slice(0, 6).map((c) => ({
      itemName: c.itemName,
      itemSlug: c.itemSlug,
      itemIconUrl: c.itemIconUrl,
      itemCategory: c.itemCategory,
      ruleIds: c.ruleIds,
      explanation: c.explanation,
      evidenceCount: c.evidencePairs.length,
      verificationStatus: "UNVERIFIED",
    }));
  };

  const skillsA = getHeroSkillGroupsForDisplay(candidateA.heroName);
  const skillsB = getHeroSkillGroupsForDisplay(candidateB.heroName);
  const combosA = getHeroComboCollection(
    toHeroSlug(candidateA.heroName),
    candidateA.heroName,
  );
  const combosB = getHeroComboCollection(
    toHeroSlug(candidateB.heroName),
    candidateB.heroName,
  );

  const phaseChecklists = buildDynamicPhaseChecklists(
    profileA,
    profileB,
    sharedLanes,
  );

  return {
    ...base,
    enriched: {
      profileA,
      profileB,
      sharedLanes,
      skillsA,
      skillsB,
      combosA,
      combosB,
      controlVsImmunity: {
        aToB: aToBImmunity,
        bToA: bToAImmunity,
      },
      itemRecommendations: {
        forAAgainstB: mapItemRecs(candidateB.heroName),
        forBAgainstA: mapItemRecs(candidateA.heroName),
        catalogAvailable: itemCatalog.available,
      },
      phaseChecklists,
      verificationStatus: "UNVERIFIED",
    },
  };
}

export async function getTeamMatchupAnalysis(
  allySlots: TeamSlotInput[],
  enemySlots: TeamSlotInput[],
): Promise<TeamDraftAnalysisResult> {
  const normalizedAlly: TeamSlotInput[] = MATCHUP_LANES.map((lane) => ({
    lane,
    heroName:
      allySlots.find((s) => s.lane === lane)?.heroName?.trim() || null,
  }));

  const normalizedEnemy: TeamSlotInput[] = MATCHUP_LANES.map((lane) => ({
    lane,
    heroName:
      enemySlots.find((s) => s.lane === lane)?.heroName?.trim() || null,
  }));

  const pickedCount =
    normalizedAlly.filter((s) => s.heroName).length +
    normalizedEnemy.filter((s) => s.heroName).length;

  if (pickedCount === 0) {
    return {
      success: false,
      error: "Pilih minimal satu hero pada Tim Kita atau Tim Musuh.",
    };
  }

  const heroByName = new Map<string, GameplayCandidateHero>();
  const profileByName = new Map<string, HeroMechanicProfileSummary>();

  for (const hero of ALL_CANDIDATE_HEROES) {
    heroByName.set(hero.heroName.toLowerCase(), hero);
  }

  const resolveTeamHeroes = (slots: TeamSlotInput[]) => {
    const heroes: GameplayCandidateHero[] = [];
    const seen = new Set<string>();
    for (const slot of slots) {
      if (!slot.heroName) continue;
      const key = slot.heroName.toLowerCase();
      if (seen.has(key)) continue;
      const candidate = heroByName.get(key);
      if (candidate) {
        seen.add(key);
        heroes.push(candidate);
        if (!profileByName.has(key)) {
          profileByName.set(key, buildHeroMechanicProfile(candidate));
        }
      }
    }
    return heroes;
  };

  const allyHeroes = resolveTeamHeroes(normalizedAlly);
  const enemyHeroes = resolveTeamHeroes(normalizedEnemy);

  const allyProfiles = allyHeroes.map(
    (h) => profileByName.get(h.heroName.toLowerCase())!,
  );
  const enemyProfiles = enemyHeroes.map(
    (h) => profileByName.get(h.heroName.toLowerCase())!,
  );

  const allyAudit = auditTeamComposition("ALLY", allyProfiles);
  const enemyAudit = auditTeamComposition("ENEMY", enemyProfiles);
  const laneMatchups = buildLaneMatchupSummaries(
    normalizedAlly,
    normalizedEnemy,
    heroByName,
    profileByName,
  );
  const enemyThreats = aggregateEnemyThreats(enemyHeroes);

  const allSkillEvidence = getAllSkillEvidence();
  const allySuggestions = buildAllySlotSuggestions(
    normalizedAlly,
    enemyProfiles,
    allyAudit,
    ALL_CANDIDATE_HEROES,
    allSkillEvidence,
  );

  const itemCatalog = await safeLoadCounterItems();
  const teamItemMap = new Map<
    string,
    MatchupItemRecommendation & { effectiveAgainst: Set<string>; ruleSet: Set<string> }
  >();

  if (itemCatalog.available && enemyHeroes.length > 0) {
    const enemyEvidence = buildSkillEvidenceForHeroes(enemyHeroes);
    for (const enemy of enemyHeroes) {
      const counter = analyzeItemCounters(
        enemy.heroName,
        enemyEvidence,
        itemCatalog.items,
      );
      for (const candidate of counter.candidates) {
        const existing = teamItemMap.get(candidate.itemSlug);
        if (existing) {
          existing.effectiveAgainst.add(enemy.heroName);
          existing.evidenceCount += candidate.evidencePairs.length;
          for (const r of candidate.ruleIds) existing.ruleSet.add(r);
        } else {
          teamItemMap.set(candidate.itemSlug, {
            itemName: candidate.itemName,
            itemSlug: candidate.itemSlug,
            itemIconUrl: candidate.itemIconUrl,
            itemCategory: candidate.itemCategory,
            ruleIds: [...candidate.ruleIds],
            ruleSet: new Set(candidate.ruleIds),
            explanation: candidate.explanation,
            evidenceCount: candidate.evidencePairs.length,
            effectiveAgainst: new Set([enemy.heroName]),
            verificationStatus: "UNVERIFIED",
          });
        }
      }
    }
  }

  const recommendedTeamItems = [...teamItemMap.values()]
    .map((entry) => ({
      itemName: entry.itemName,
      itemSlug: entry.itemSlug,
      itemIconUrl: entry.itemIconUrl,
      itemCategory: entry.itemCategory,
      ruleIds: [...entry.ruleSet],
      explanation: entry.explanation,
      evidenceCount: entry.evidenceCount,
      effectiveAgainst: [...entry.effectiveAgainst],
      verificationStatus: "UNVERIFIED" as const,
    }))
    .sort(
      (a, b) =>
        b.effectiveAgainst.length - a.effectiveAgainst.length ||
        b.ruleIds.length - a.ruleIds.length ||
        b.evidenceCount - a.evidenceCount,
    )
    .slice(0, 8);

  return {
    success: true,
    teamAnalysis: {
      allyAudit,
      enemyAudit,
      laneMatchups,
      enemyThreats,
      recommendedTeamItems,
      allySuggestions,
      itemCatalogAvailable: itemCatalog.available,
      verificationStatus: "UNVERIFIED",
      disclaimer:
        "Audit komposisi 5v5, ancaman musuh, rekomendasi item, dan saran hero dihitung dari kategori/bukti mekanik skill kandidat dan katalog item Original Server. Analisis ini bukan prediksi win rate atau hasil pertandingan pasti.",
    },
  };
}
