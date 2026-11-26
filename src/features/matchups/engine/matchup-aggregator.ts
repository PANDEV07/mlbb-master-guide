import type {
  InteractionCandidate,
  InteractionType,
} from "./interaction-rules";

export interface AggregatedMatchup {
  sourceHero: string;
  targetHero: string;
  ruleId: InteractionType;
  ruleLabel: string;
  skillPairCount: number;
  uniqueSourceSkills: number;
  uniqueTargetSkills: number;
  supportingSkillPairs: Array<{
    sourceSkill: string;
    sourceSkillId: string | number | null;
    sourceDescription: string;
    sourceGroupId: string | number;
    targetSkill: string;
    targetSkillId: string | number | null;
    targetDescription: string;
    targetGroupId: string | number;
    evidence: InteractionCandidate["evidence"];
  }>;
  conditionsToCheck: string[];
  explanation: string;
  status: "POTENTIAL";
  verificationStatus: "UNVERIFIED";
  analysisMode: "MECHANIC_INTERACTION";
}

export interface MatchupAggregationResult {
  matchups: AggregatedMatchup[];
  excludedHeuristics: number;
}

function skillKey(
  hero: string,
  skill: string,
  groupId: string | number,
): string {
  return JSON.stringify([hero, groupId, skill]);
}

export function aggregateMatchups(
  candidates: InteractionCandidate[],
): MatchupAggregationResult {
  const groups = new Map<string, InteractionCandidate[]>();
  let excludedHeuristics = 0;

  for (const candidate of candidates) {
    // CC + DAMAGE saja belum cukup membuktikan sinergi engage.
    if (candidate.ruleId === "ENGAGE_FOLLOW_UP") {
      excludedHeuristics += 1;
      continue;
    }

    const key = JSON.stringify([
      candidate.sourceHero,
      candidate.targetHero,
      candidate.ruleId,
    ]);

    const existing = groups.get(key) ?? [];
    existing.push(candidate);
    groups.set(key, existing);
  }

  const matchups: AggregatedMatchup[] = [];

  for (const entries of groups.values()) {
    const first = entries[0];
    if (!first) continue;

    const sourceSkills = new Set<string>();
    const targetSkills = new Set<string>();
    const seenPairs = new Set<string>();

    const supportingSkillPairs = entries.filter((entry) => {
      const sourceKey = skillKey(
        entry.sourceHero,
        entry.sourceSkill,
        entry.sourceGroupId,
      );

      const targetKey = skillKey(
        entry.targetHero,
        entry.targetSkill,
        entry.targetGroupId,
      );

      sourceSkills.add(sourceKey);
      targetSkills.add(targetKey);

      const pairKey = JSON.stringify([sourceKey, targetKey]);
      if (seenPairs.has(pairKey)) return false;

      seenPairs.add(pairKey);
      return true;
    }).map((entry) => ({
      sourceSkill: entry.sourceSkill,
      sourceSkillId: entry.sourceSkillId,
      sourceDescription: entry.sourceDescription,
      sourceGroupId: entry.sourceGroupId,
      targetSkill: entry.targetSkill,
      targetSkillId: entry.targetSkillId,
      targetDescription: entry.targetDescription,
      targetGroupId: entry.targetGroupId,
      evidence: entry.evidence,
    }));

    matchups.push({
      sourceHero: first.sourceHero,
      targetHero: first.targetHero,
      ruleId: first.ruleId,
      ruleLabel: first.ruleLabel,
      skillPairCount: supportingSkillPairs.length,
      uniqueSourceSkills: sourceSkills.size,
      uniqueTargetSkills: targetSkills.size,
      supportingSkillPairs,
      conditionsToCheck: first.conditionsToCheck,
      explanation: first.explanation,
      status: "POTENTIAL",
      verificationStatus: "UNVERIFIED",
      analysisMode: "MECHANIC_INTERACTION",
    });
  }

  return {
    matchups: matchups.sort(
      (a, b) => b.skillPairCount - a.skillPairCount,
    ),
    excludedHeuristics,
  };
}