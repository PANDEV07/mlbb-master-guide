import type {
  ExtractedMechanicRecord,
  MechanicCategory,
} from "./mechanic-extractor";

export type InteractionType =
  | "CC_VS_MOBILITY"
  | "BURST_VS_DEFENSE"
  | "SUSTAIN_VS_ANTI_HEAL"
  | "CC_VS_IMMUNITY"
  | "ENGAGE_FOLLOW_UP";

export type InteractionStatus =
  | "POTENTIAL"
  | "INSUFFICIENT_EVIDENCE";

export interface InteractionRule {
  id: InteractionType;
  label: string;
  description: string;
  conditionsToCheck: string[];
  attackerCategory?: MechanicCategory;
  defenderCategory?: MechanicCategory;
  requiredTags?: string[];
  status: InteractionStatus;
  verificationStatus: "UNVERIFIED";
}

export const INTERACTION_RULES: InteractionRule[] = [
  {
    id: "CC_VS_MOBILITY",
    label: "Crowd Control vs Mobility",
    description:
      "Kandidat interaksi Crowd Control dengan mekanik mobilitas. Kecocokan efek aktual belum diverifikasi.",
    conditionsToCheck: [
      "Identifikasi jenis Crowd Control dan jenis mobilitas secara spesifik.",
      "Verifikasi apakah efek Crowd Control dapat menghentikan atau membatasi skill mobilitas tersebut.",
      "Periksa timing, jangkauan, target, dan kondisi aktivasi kedua skill.",
    ],
    attackerCategory: "CROWD_CONTROL",
    defenderCategory: "MOBILITY",
    status: "POTENTIAL",
    verificationStatus: "UNVERIFIED",
  },
  {
    id: "BURST_VS_DEFENSE",
    label: "Damage vs Defense",
    description:
      "Kandidat interaksi kategori damage dengan mekanik pertahanan. Kategori umum ini tidak membuktikan bahwa damage dapat menembus atau mengatasi pertahanan target.",
    conditionsToCheck: [
      "Identifikasi tipe damage dan mekanisme pertahanan secara spesifik.",
      "Verifikasi apakah pertahanan tersebut memitigasi tipe damage yang dimaksud.",
      "Periksa durasi, timing, nilai mitigasi, dan kondisi aktivasi.",
    ],
    attackerCategory: "DAMAGE",
    defenderCategory: "DEFENSE",
    status: "POTENTIAL",
    verificationStatus: "UNVERIFIED",
  },
  {
    id: "SUSTAIN_VS_ANTI_HEAL",
    label: "Sustain vs Anti-Heal",
    description:
      "Memerlukan bukti eksplisit efek pengurangan pemulihan. Kategori Anti-Heal belum tersedia pada dataset skill saat ini.",
    conditionsToCheck: [
      "Diperlukan bukti eksplisit efek pengurangan healing atau regenerasi.",
      "Verifikasi sumber efek, durasi, dan target yang terkena.",
    ],
    attackerCategory: "SUSTAIN",
    status: "INSUFFICIENT_EVIDENCE",
    verificationStatus: "UNVERIFIED",
  },
  {
    id: "CC_VS_IMMUNITY",
    label: "Crowd Control vs Immunity",
    description:
      "Kandidat interaksi berdasarkan tag terkait immunity. Tag seperti Invincible tidak otomatis membuktikan kekebalan terhadap semua Crowd Control.",
    conditionsToCheck: [
      "Verifikasi apakah efek benar-benar memberikan CC immunity, CC removal, atau hanya invulnerability.",
      "Identifikasi jenis Crowd Control yang dapat ditahan atau dihapus.",
      "Periksa timing, durasi, dan kondisi aktivasi efek.",
    ],
    attackerCategory: "CROWD_CONTROL",
    requiredTags: ["CC Immune", "Remove CC", "Invincible"],
    status: "POTENTIAL",
    verificationStatus: "UNVERIFIED",
  },
  {
    id: "ENGAGE_FOLLOW_UP",
    label: "Engage vs Follow-up",
    description:
      "Kandidat sinergi antara kemampuan memulai pertarungan dan kemampuan lanjutan. Urutan serta kondisi aktivasi belum diverifikasi.",
    conditionsToCheck: [
      "Verifikasi apakah efek engage benar-benar menciptakan peluang follow-up.",
      "Periksa urutan skill, jangkauan, timing, dan kondisi aktivasi.",
    ],
    attackerCategory: "CROWD_CONTROL",
    defenderCategory: "DAMAGE",
    status: "POTENTIAL",
    verificationStatus: "UNVERIFIED",
  },
];

export interface InteractionCandidate {
  ruleId: InteractionType;
  ruleLabel: string;
  sourceHero: string;
  sourceSkill: string;
  sourceSkillId: string | number | null;
  sourceDescription: string;
  targetHero: string;
  targetSkill: string;
  targetSkillId: string | number | null;
  targetDescription: string;
  sourceGroupId: string | number;
  targetGroupId: string | number;
  evidence: {
    sourceCategories: MechanicCategory[];
    targetCategories: MechanicCategory[];
    sourceTags: string[];
    targetTags: string[];
  };
  conditionsToCheck: string[];
  explanation: string;
  status: InteractionStatus;
  verificationStatus: "UNVERIFIED";
}

function hasCategory(
  record: ExtractedMechanicRecord,
  category?: MechanicCategory,
): boolean {
  return category !== undefined &&
    record.mechanicCategories.includes(category);
}

function hasAnyTag(
  record: ExtractedMechanicRecord,
  tags: string[],
): boolean {
  return tags.some((tag) =>
    record.apiTags.some(
      (candidate) =>
        candidate.name.toLowerCase() === tag.toLowerCase(),
    ),
  );
}

export function findInteractionCandidates(
  records: ExtractedMechanicRecord[],
): InteractionCandidate[] {
  const candidates: InteractionCandidate[] = [];

  for (const rule of INTERACTION_RULES) {
    if (rule.status === "INSUFFICIENT_EVIDENCE") {
      continue;
    }

    const sources = records.filter((record) =>
      hasCategory(record, rule.attackerCategory),
    );

    const targets = records.filter((record) => {
      if (rule.requiredTags?.length) {
        return hasAnyTag(record, rule.requiredTags);
      }

      return hasCategory(record, rule.defenderCategory);
    });

    for (const source of sources) {
      for (const target of targets) {
        if (source.heroName === target.heroName) {
          continue;
        }

        candidates.push({
          ruleId: rule.id,
          ruleLabel: rule.label,
          sourceHero: source.heroName,
          sourceSkill: source.skillName,
          sourceSkillId: source.apiSkillId,
          sourceDescription: source.description,
          targetHero: target.heroName,
          targetSkill: target.skillName,
          targetSkillId: target.apiSkillId,
          targetDescription: target.description,
          sourceGroupId: source.apiGroupId,
          targetGroupId: target.apiGroupId,
          evidence: {
            sourceCategories: source.mechanicCategories,
            targetCategories: target.mechanicCategories,
            sourceTags: source.apiTags.map((tag) => tag.name),
            targetTags: target.apiTags.map((tag) => tag.name),
          },
          conditionsToCheck: [...rule.conditionsToCheck],
          explanation: rule.description,
          status: rule.status,
          verificationStatus: "UNVERIFIED",
        });
      }
    }
  }

  return candidates;
}