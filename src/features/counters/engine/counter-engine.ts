import type {
  SkillMechanicEvidence,
  MechanicEvidence,
} from "@/features/matchups/engine/mechanic-evidence-extractor";

export type CounterRuleId =
  | "CONTROL_RESPONSE"
  | "MOBILITY_CONTROL"
  | "SLOW_RESPONSE"
  | "DAMAGE_RESPONSE";

export type CounterConfidence = "POTENTIAL";
export type CounterVerification = "UNVERIFIED";

export interface CounterEvidencePair {
  targetSkill: string;
  targetApiSkillId: string | number | null;
  targetApiGroupId: string | number;
  targetEvidence: MechanicEvidence;
  responseSkill: string;
  responseApiSkillId: string | number | null;
  responseApiGroupId: string | number;
  responseEvidence: MechanicEvidence;
}

export interface CounterCandidate {
  id: string;
  targetHero: string;
  counterHero: string;
  ruleId: CounterRuleId;
  ruleIds: CounterRuleId[];
  explanation: string;
  evidencePairs: CounterEvidencePair[];
  conditionsToCheck: string[];
  confidence: CounterConfidence;
  verificationStatus: CounterVerification;
}

export interface CounterThreat {
  mechanic: MechanicEvidence["mechanic"];
  skillName: string;
  apiSkillId: string | number | null;
  apiGroupId: string | number;
  evidenceText: string;
  verificationStatus: CounterVerification;
}

export interface CounterAnalysis {
  targetHero: string;
  threats: CounterThreat[];
  candidates: CounterCandidate[];
  verificationStatus: CounterVerification;
  disclaimer: string;
}

type RuleDefinition = {
  id: CounterRuleId;
  targetMechanics: MechanicEvidence["mechanic"][];
  responseMechanics: MechanicEvidence["mechanic"][];
  explanation: string;
  conditionsToCheck: string[];
};

const RULES: RuleDefinition[] = [
  {
    id: "CONTROL_RESPONSE",
    targetMechanics: [
      "APPLY_STUN",
      "APPLY_IMMOBILIZE",
      "APPLY_AIRBORNE",
      "APPLY_KNOCKBACK",
    ],
    responseMechanics: [
      "CONTROL_IMMUNITY",
      "CC_REMOVAL",
    ],
    explanation:
      "Hero kandidat memiliki bukti mekanik immunity atau penghapusan crowd control yang relevan terhadap ancaman kontrol target.",
    conditionsToCheck: [
      "Apakah perlindungan aktif saat crowd control diterapkan?",
      "Apakah jenis crowd control tersebut dapat dicegah atau dihapus?",
      "Periksa durasi, cooldown, dan syarat aktivasi.",
    ],
  },
  {
    id: "MOBILITY_CONTROL",
    targetMechanics: [
      "DASH",
      "BLINK",
    ],
    responseMechanics: [
      "APPLY_STUN",
      "APPLY_IMMOBILIZE",
      "APPLY_AIRBORNE",
      "APPLY_KNOCKBACK",
      "APPLY_SLOW",
    ],
    explanation:
      "Hero kandidat memiliki bukti efek kontrol yang berpotensi membatasi mobilitas target. Efektivitas aktual bergantung pada jenis dan timing skill.",
    conditionsToCheck: [
      "Apakah efek kontrol dapat mengenai target saat bergerak?",
      "Apakah mobilitas target memiliki immunity atau untargetable?",
      "Periksa jangkauan, timing, durasi, dan cooldown.",
    ],
  },
  {
    id: "SLOW_RESPONSE",
    targetMechanics: ["APPLY_SLOW"],
    responseMechanics: ["REMOVE_SLOW", "CONTROL_IMMUNITY", "CC_REMOVAL"],
    explanation:
      "Hero kandidat memiliki bukti mekanik penghapusan slow atau control immunity yang berpotensi merespons efek slow target.",
    conditionsToCheck: [
      "Apakah efek penghapusan slow atau immunity aktif saat slow diterapkan?",
      "Periksa durasi, cooldown, dan syarat aktivasi skill.",
    ],
  },
  {
    id: "DAMAGE_RESPONSE",
    targetMechanics: ["PHYSICAL_DAMAGE", "MAGIC_DAMAGE", "TRUE_DAMAGE"],
    responseMechanics: ["SHIELD", "DAMAGE_REDUCTION", "INVULNERABLE"],
    explanation:
      "Hero kandidat memiliki bukti mekanik perlindungan (shield, damage reduction, atau invulnerable) yang berpotensi meredam sumber damage target.",
    conditionsToCheck: [
      "Apakah perlindungan berlaku terhadap jenis damage target (physical, magic, atau true damage)?",
      "Periksa durasi, cooldown, nilai shield, dan syarat aktivasi skill.",
    ],
  },
];

function uniqueEvidence(
  records: SkillMechanicEvidence[],
  allowed: MechanicEvidence["mechanic"][],
) {
  return records.flatMap((record) =>
    record.evidence
      .filter((evidence) => allowed.includes(evidence.mechanic))
      .map((evidence) => ({ record, evidence })),
  );
}

function buildHeroExplanation(
  counterHero: string,
  targetHero: string,
  pairs: CounterEvidencePair[],
  ruleIds: CounterRuleId[],
): string {
  const unique = (values: string[]) => [...new Set(values)];

  const responseMechanics = unique(
    pairs.map((pair) => pair.responseEvidence.mechanic.replaceAll("_", " ").toLowerCase()),
  );

  const responseSkills = unique(
    pairs.map((pair) => pair.responseSkill),
  );

  const targetMechanics = unique(
    pairs.map((pair) => pair.targetEvidence.mechanic.replaceAll("_", " ").toLowerCase()),
  );

  const targetSkills = unique(
    pairs.map((pair) => pair.targetSkill),
  );

  const mechanicText = responseMechanics.join(", ");
  const skillText = responseSkills.join(", ");
  const threatText = targetMechanics.join(", ");
  const targetSkillText = targetSkills.join(", ");

  const explanations: string[] = [];

  if (ruleIds.includes("CONTROL_RESPONSE")) {
    explanations.push(
      `${counterHero} memiliki bukti mekanik ${mechanicText} pada skill ${skillText}. Mekanik ini berpotensi membantu menghadapi efek kontrol ${targetHero}, yang terdeteksi pada ${targetSkillText}. Efektivitasnya bergantung pada jenis crowd control, timing, durasi, dan syarat aktivasi.`,
    );
  }

  if (ruleIds.includes("MOBILITY_CONTROL")) {
    explanations.push(
      `${counterHero} memiliki bukti efek kontrol ${mechanicText} melalui skill ${skillText}. Efek tersebut berpotensi membatasi mobilitas ${targetHero}, yang memiliki bukti mekanik ${threatText} pada ${targetSkillText}. Keberhasilan interaksi tetap bergantung pada jangkauan dan timing skill.`,
    );
  }

  if (ruleIds.includes("SLOW_RESPONSE")) {
    explanations.push(
      `${counterHero} memiliki bukti mekanik ${mechanicText} pada skill ${skillText} yang berpotensi merespons efek slow ${targetHero} (${targetSkillText}). Efektivitas bergantung pada timing dan cooldown skill.`,
    );
  }

  if (ruleIds.includes("DAMAGE_RESPONSE")) {
    explanations.push(
      `${counterHero} memiliki bukti perlindungan ${mechanicText} melalui skill ${skillText} yang berpotensi meredam ${threatText} dari ${targetHero} (${targetSkillText}). Kesesuaian jenis damage dan durasi perlindungan masih perlu diverifikasi.`,
    );
  }

  return explanations.length > 0
    ? explanations.join(" ")
    : `${counterHero} memiliki bukti mekanik ${mechanicText} pada ${skillText} yang berpotensi relevan terhadap ${targetHero}. Interaksi ini masih memerlukan verifikasi gameplay.`;
}
export function analyzeCounterAgainstHero(
  targetHero: string,
  records: SkillMechanicEvidence[],
): CounterAnalysis {
  const normalizedTarget = targetHero.trim().toLowerCase();

  if (!normalizedTarget) {
    throw new Error("Nama hero target wajib diisi.");
  }

  const targetRecords = records.filter(
    (record) => record.heroName.trim().toLowerCase() === normalizedTarget,
  );

  if (targetRecords.length === 0) {
    return {
      targetHero,
      threats: [],
      candidates: [],
      verificationStatus: "UNVERIFIED",
      disclaimer:
        "Data skill hero target tidak ditemukan. Tidak ada rekomendasi counter yang dibuat.",
    };
  }

  const threats: CounterThreat[] = [];
  const candidates = new Map<string, CounterCandidate>();

  for (const rule of RULES) {
    const targetEvidence = uniqueEvidence(
      targetRecords,
      rule.targetMechanics,
    );

    for (const entry of targetEvidence) {
      threats.push({
        mechanic: entry.evidence.mechanic,
        skillName: entry.record.skillName,
        apiSkillId: entry.record.apiSkillId,
        apiGroupId: entry.record.apiGroupId,
        evidenceText: entry.evidence.evidenceText,
        verificationStatus: "UNVERIFIED",
      });
    }

    const responseEvidence = uniqueEvidence(
      records.filter(
        (record) =>
          record.heroName.trim().toLowerCase() !== normalizedTarget,
      ),
      rule.responseMechanics,
    );

    for (const threat of targetEvidence) {
      for (const response of responseEvidence) {
        const candidateId = [
          normalizedTarget,
          response.record.heroName.trim().toLowerCase(),
        ].join("|");

        const pair: CounterEvidencePair = {
          targetSkill: threat.record.skillName,
          targetApiSkillId: threat.record.apiSkillId,
          targetApiGroupId: threat.record.apiGroupId,
          targetEvidence: threat.evidence,
          responseSkill: response.record.skillName,
          responseApiSkillId: response.record.apiSkillId,
          responseApiGroupId: response.record.apiGroupId,
          responseEvidence: response.evidence,
        };

        const existing = candidates.get(candidateId);

        if (existing) {
          const duplicatePair = existing.evidencePairs.some(
            (item) =>
              item.targetApiSkillId === pair.targetApiSkillId &&
              item.responseApiSkillId === pair.responseApiSkillId &&
              item.targetSkill === pair.targetSkill &&
              item.responseSkill === pair.responseSkill &&
              item.targetEvidence.mechanic === pair.targetEvidence.mechanic &&
              item.responseEvidence.mechanic === pair.responseEvidence.mechanic &&
              item.targetEvidence.evidenceText === pair.targetEvidence.evidenceText &&
              item.responseEvidence.evidenceText === pair.responseEvidence.evidenceText,
          );

          if (!duplicatePair) {
            existing.evidencePairs.push(pair);
          }

          if (!existing.ruleIds.includes(rule.id)) {
            existing.ruleIds.push(rule.id);
          }

          existing.explanation = buildHeroExplanation(
            existing.counterHero,
            existing.targetHero,
            existing.evidencePairs,
            existing.ruleIds,
          );

          existing.conditionsToCheck = [
            ...new Set([
              ...existing.conditionsToCheck,
              ...rule.conditionsToCheck,
            ]),
          ];

          continue;
        }

        candidates.set(candidateId, {
          id: candidateId,
          targetHero,
          counterHero: response.record.heroName,
          ruleId: rule.id,
          ruleIds: [rule.id],
          explanation: buildHeroExplanation(
            response.record.heroName,
            targetHero,
            [pair],
            [rule.id],
          ),
          evidencePairs: [pair],
          conditionsToCheck: [...rule.conditionsToCheck],
          confidence: "POTENTIAL",
          verificationStatus: "UNVERIFIED",
        });
      }
    }
  }

  const uniqueThreats = new Map<string, CounterThreat>();

  for (const threat of threats) {
    const key = [
      threat.skillName,
      threat.apiGroupId,
      threat.apiSkillId ?? "unknown",
      threat.mechanic,
      threat.evidenceText,
    ].join("|");

    uniqueThreats.set(key, threat);
  }

  return {
    targetHero,
    threats: [...uniqueThreats.values()],
    candidates: [...candidates.values()],
    verificationStatus: "UNVERIFIED",
    disclaimer:
      "Hasil ini merupakan kandidat analisis berbasis teks skill, bukan bukti kemenangan atau counter yang telah terverifikasi. Periksa kondisi interaksi, patch, dan gameplay aktual.",
  };
}