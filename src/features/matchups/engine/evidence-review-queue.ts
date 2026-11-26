import type {
  EvidenceInteractionCandidate,
} from "./evidence-interaction-engine";

export interface EvidenceReviewSkillPair {
  candidateId: string;
  sourceSkill: string;
  sourceApiSkillId: string | number | null;
  sourceApiGroupId: string | number;
  sourceEvidence: EvidenceInteractionCandidate["sourceEvidence"];
  targetSkill: string;
  targetApiSkillId: string | number | null;
  targetApiGroupId: string | number;
  targetEvidence: EvidenceInteractionCandidate["targetEvidence"];
  verificationStatus: "UNVERIFIED";
}

export interface EvidenceReviewItem {
  id: string;
  ruleId: EvidenceInteractionCandidate["ruleId"];
  sourceHero: string;
  targetHero: string;
  skillPairCount: number;
  uniqueSourceSkills: number;
  uniqueTargetSkills: number;
  supportingSkillPairs: EvidenceReviewSkillPair[];
  conditionsToCheck: string[];
  explanation: string;
  reviewRequired: true;
  verificationStatus: "UNVERIFIED";
}

export interface EvidenceReviewQueue {
  items: EvidenceReviewItem[];
  metadata: {
    inputCandidates: number;
    reviewItems: number;
    groupedSkillPairs: number;
    uniqueHeroPairs: number;
    verificationStatus: "UNVERIFIED";
  };
}

function uniqueValues<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function buildEvidenceReviewQueue(
  candidates: EvidenceInteractionCandidate[],
): EvidenceReviewQueue {
  const groups = new Map<string, EvidenceInteractionCandidate[]>();

  for (const candidate of candidates) {
    const key = [
      candidate.ruleId,
      candidate.sourceHero,
      candidate.targetHero,
    ].join("|");

    const group = groups.get(key) ?? [];
    group.push(candidate);
    groups.set(key, group);
  }

  const items: EvidenceReviewItem[] = [];

  for (const [key, group] of groups) {
    const first = group[0];

    const uniqueCandidates = [
      ...new Map(group.map((candidate) => [candidate.id, candidate])).values(),
    ];

    const supportingSkillPairs: EvidenceReviewSkillPair[] =
      uniqueCandidates.map((candidate) => ({
        candidateId: candidate.id,
        sourceSkill: candidate.sourceSkill,
        sourceApiSkillId: candidate.sourceApiSkillId,
        sourceApiGroupId: candidate.sourceApiGroupId,
        sourceEvidence: candidate.sourceEvidence,
        targetSkill: candidate.targetSkill,
        targetApiSkillId: candidate.targetApiSkillId,
        targetApiGroupId: candidate.targetApiGroupId,
        targetEvidence: candidate.targetEvidence,
        verificationStatus: "UNVERIFIED",
      }));

    const sourceSkillKeys = new Set(
      uniqueCandidates.map((candidate) =>
        `${candidate.sourceApiGroupId}|${candidate.sourceApiSkillId ?? candidate.sourceSkill}`,
      ),
    );

    const targetSkillKeys = new Set(
      uniqueCandidates.map((candidate) =>
        `${candidate.targetApiGroupId}|${candidate.targetApiSkillId ?? candidate.targetSkill}`,
      ),
    );

    items.push({
      id: key,
      ruleId: first.ruleId,
      sourceHero: first.sourceHero,
      targetHero: first.targetHero,
      skillPairCount: supportingSkillPairs.length,
      uniqueSourceSkills: sourceSkillKeys.size,
      uniqueTargetSkills: targetSkillKeys.size,
      supportingSkillPairs,
      conditionsToCheck: uniqueValues(
        uniqueCandidates.flatMap((candidate) => candidate.conditionsToCheck),
      ),
      explanation: first.explanation,
      reviewRequired: true,
      verificationStatus: "UNVERIFIED",
    });
  }

  items.sort((a, b) =>
    a.sourceHero.localeCompare(b.sourceHero) ||
    a.targetHero.localeCompare(b.targetHero) ||
    a.ruleId.localeCompare(b.ruleId),
  );

  return {
    items,
    metadata: {
      inputCandidates: candidates.length,
      reviewItems: items.length,
      groupedSkillPairs: items.reduce(
        (sum, item) => sum + item.skillPairCount,
        0,
      ),
      uniqueHeroPairs: new Set(
        items.map((item) => `${item.sourceHero}|${item.targetHero}`),
      ).size,
      verificationStatus: "UNVERIFIED",
    },
  };
}