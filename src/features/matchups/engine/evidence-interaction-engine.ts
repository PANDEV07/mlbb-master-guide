import type {
  SkillMechanicEvidence,
  MechanicEvidence,
} from "./mechanic-evidence-extractor";

export type EvidenceInteractionRule = "CONTROL_VS_IMMUNITY";

export interface EvidenceInteractionCandidate {
  id: string;
  ruleId: EvidenceInteractionRule;
  sourceHero: string;
  targetHero: string;
  sourceSkill: string;
  targetSkill: string;
  sourceApiSkillId: string | number | null;
  targetApiSkillId: string | number | null;
  sourceApiGroupId: string | number;
  targetApiGroupId: string | number;
  sourceEvidence: MechanicEvidence[];
  targetEvidence: MechanicEvidence[];
  explanation: string;
  conditionsToCheck: string[];
  reviewRequired: true;
  verificationStatus: "UNVERIFIED";
}

function selectUniqueEvidence(
  evidence: MechanicEvidence[],
  allowed: MechanicEvidence["mechanic"][],
): MechanicEvidence[] {
  const seen = new Set<MechanicEvidence["mechanic"]>();
  const selected: MechanicEvidence[] = [];

  for (const item of evidence) {
    if (!allowed.includes(item.mechanic) || seen.has(item.mechanic)) {
      continue;
    }

    seen.add(item.mechanic);
    selected.push(item);
  }

  return selected;
}

export function findEvidenceInteractions(
  records: SkillMechanicEvidence[],
): EvidenceInteractionCandidate[] {
  const controlMechanics: MechanicEvidence["mechanic"][] = [
    "APPLY_STUN",
    "APPLY_IMMOBILIZE",
    "APPLY_AIRBORNE",
    "APPLY_KNOCKBACK",
  ];

  const protectionMechanics: MechanicEvidence["mechanic"][] = [
    "CONTROL_IMMUNITY",
    "CC_REMOVAL",
  ];

  const sources = records
    .map((record) => ({
      record,
      evidence: selectUniqueEvidence(record.evidence, controlMechanics),
    }))
    .filter((entry) => entry.evidence.length > 0);

  const targets = records
    .map((record) => ({
      record,
      evidence: selectUniqueEvidence(record.evidence, protectionMechanics),
    }))
    .filter((entry) => entry.evidence.length > 0);

  const candidates: EvidenceInteractionCandidate[] = [];

  for (const source of sources) {
    for (const target of targets) {
      if (source.record.heroName === target.record.heroName) continue;

      const id = [
        "CONTROL_VS_IMMUNITY",
        source.record.heroName,
        source.record.apiGroupId,
        source.record.apiSkillId ?? source.record.skillName,
        target.record.heroName,
        target.record.apiGroupId,
        target.record.apiSkillId ?? target.record.skillName,
      ].join("|");

      candidates.push({
        id,
        ruleId: "CONTROL_VS_IMMUNITY",
        sourceHero: source.record.heroName,
        targetHero: target.record.heroName,
        sourceSkill: source.record.skillName,
        targetSkill: target.record.skillName,
        sourceApiSkillId: source.record.apiSkillId,
        targetApiSkillId: target.record.apiSkillId,
        sourceApiGroupId: source.record.apiGroupId,
        targetApiGroupId: target.record.apiGroupId,
        sourceEvidence: source.evidence,
        targetEvidence: target.evidence,
        explanation:
          "Skill sumber memiliki bukti efek kontrol dan skill target " +
          "memiliki bukti control immunity atau penghapusan CC. " +
          "Interaksi aktual belum diverifikasi.",
        conditionsToCheck: [
          "Apakah immunity aktif saat efek kontrol diterapkan?",
          "Apakah immunity berlaku terhadap jenis kontrol tersebut?",
          "Apakah penghapusan CC dapat digunakan setelah kontrol diterapkan?",
          "Apa durasi, cooldown, dan syarat aktivasi efek?",
        ],
        reviewRequired: true,
        verificationStatus: "UNVERIFIED",
      });
    }
  }

  return candidates;
}