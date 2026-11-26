import type { SkillMechanicEvidence, MechanicEvidence } from "@/features/matchups/engine/mechanic-evidence-extractor";
import { extractMechanicEvidence } from "@/features/matchups/engine/mechanic-evidence-extractor";

export type ItemCounterRuleId =
  | "CONTROL_RESPONSE"
  | "DAMAGE_RESPONSE"
  | "SUSTAIN_RESPONSE";

export interface ItemCounterItem {
  entityId: string;
  canonicalId: string;
  name: string;
  slug: string;
  category: string;
  tier: string;
  iconUrl: string | null;
  price: number | null;
  passiveEffects: Array<{
    name: string;
    description: string;
    verificationStatus: string;
  }>;
  activeEffects: Array<{
    name: string;
    description: string;
    verificationStatus: string;
  }>;
  verificationStatus: string;
}

export interface ItemCounterEvidencePair {
  targetSkill: string;
  targetApiSkillId: string | number | null;
  targetApiGroupId: string | number;
  targetEvidence: MechanicEvidence;
  itemEffect: string;
  itemEffectType: "PASSIVE" | "ACTIVE";
  itemEvidence: MechanicEvidence;
}

export interface ItemCounterCandidate {
  id: string;
  targetHero: string;
  itemName: string;
  itemSlug: string;
  itemIconUrl: string | null;
  itemCategory: string;
  ruleId: ItemCounterRuleId;
  ruleIds: ItemCounterRuleId[];
  explanation: string;
  evidencePairs: ItemCounterEvidencePair[];
  conditionsToCheck: string[];
  confidence: "POTENTIAL";
  verificationStatus: "UNVERIFIED";
}

export interface ItemCounterThreat {
  mechanic: MechanicEvidence["mechanic"];
  skillName: string;
  apiSkillId: string | number | null;
  apiGroupId: string | number;
  evidenceText: string;
  verificationStatus: "UNVERIFIED";
}

export interface ItemCounterAnalysis {
  targetHero: string;
  threats: ItemCounterThreat[];
  candidates: ItemCounterCandidate[];
  verificationStatus: "UNVERIFIED";
  disclaimer: string;
}

interface ItemEffectEvidence {
  item: ItemCounterItem;
  effectName: string;
  effectType: "PASSIVE" | "ACTIVE";
  effectDescription: string;
  evidence: MechanicEvidence;
}

interface RuleDefinition {
  id: ItemCounterRuleId;
  targetMechanics: MechanicEvidence["mechanic"][];
  responseMechanics: MechanicEvidence["mechanic"][];
  explanation: string;
  conditionsToCheck: string[];
}

const RULES: RuleDefinition[] = [
  {
    id: "CONTROL_RESPONSE",
    targetMechanics: [
      "APPLY_STUN",
      "APPLY_IMMOBILIZE",
      "APPLY_AIRBORNE",
      "APPLY_KNOCKBACK",
    ],
    responseMechanics: ["CONTROL_IMMUNITY", "CC_REMOVAL"],
    explanation:
      "Efek item memiliki teks bukti immunity atau penghapusan crowd control yang berpotensi merespons ancaman kontrol target.",
    conditionsToCheck: [
      "Apakah efek aktif sebelum atau saat crowd control diterapkan?",
      "Apakah jenis crowd control tersebut dapat dicegah atau dihapus?",
      "Periksa durasi, cooldown, syarat aktivasi, dan waktu penggunaan item.",
    ],
  },
  {
    id: "DAMAGE_RESPONSE",
    targetMechanics: ["PHYSICAL_DAMAGE", "MAGIC_DAMAGE", "TRUE_DAMAGE"],
    responseMechanics: ["SHIELD", "DAMAGE_REDUCTION", "INVULNERABLE"],
    explanation:
      "Efek item memiliki bukti perlindungan yang berpotensi merespons sumber damage target. Jenis damage dan cakupan perlindungan wajib diverifikasi.",
    conditionsToCheck: [
      "Apakah efek melindungi dari jenis damage yang digunakan target?",
      "Apakah perlindungan berlaku terhadap physical, magic, atau true damage?",
      "Periksa durasi, cooldown, nilai shield, dan syarat aktivasi.",
    ],
  },
  {
    id: "SUSTAIN_RESPONSE",
    targetMechanics: ["PHYSICAL_DAMAGE", "MAGIC_DAMAGE", "TRUE_DAMAGE"],
    responseMechanics: ["HEALING"],
    explanation:
      "Efek item memiliki bukti healing yang berpotensi membantu sustain setelah menerima damage. Healing bukan pencegahan damage.",
    conditionsToCheck: [
      "Apakah healing dapat aktif dalam kondisi pertarungan tersebut?",
      "Periksa jumlah healing, cooldown, dan syarat aktivasi.",
      "Periksa apakah efek dapat dikurangi oleh anti-heal.",
    ],
  },
];

function extractItemEffects(items: ItemCounterItem[]): ItemEffectEvidence[] {
  return items.flatMap((item) => {
    const effects = [
      ...item.passiveEffects.map((effect) => ({
        ...effect,
        effectType: "PASSIVE" as const,
      })),
      ...item.activeEffects.map((effect) => ({
        ...effect,
        effectType: "ACTIVE" as const,
      })),
    ];

    return effects.flatMap((effect) =>
      extractMechanicEvidence(effect.description).map((evidence) => ({
        item,
        effectName: effect.name,
        effectType: effect.effectType,
        effectDescription: effect.description,
        evidence,
      })),
    );
  });
}

function formatMechanicName(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

function buildItemCounterExplanation(
  itemName: string,
  targetHero: string,
  pairs: ItemCounterEvidencePair[],
  ruleIds: ItemCounterRuleId[],
): string {
  const unique = (values: string[]) => [...new Set(values)];

  const effectLabels = unique(
    pairs.map(
      (pair) =>
        `${pair.itemEffectType === "PASSIVE" ? "efek pasif" : "efek aktif"} ${pair.itemEffect}`,
    ),
  ).join(", ");
  const itemMechanics = unique(
    pairs.map((pair) => formatMechanicName(pair.itemEvidence.mechanic)),
  ).join(", ");
  const targetMechanics = unique(
    pairs.map((pair) => formatMechanicName(pair.targetEvidence.mechanic)),
  ).join(", ");
  const targetSkills = unique(pairs.map((pair) => pair.targetSkill)).join(", ");

  const explanations: string[] = [];

  if (ruleIds.includes("CONTROL_RESPONSE")) {
    explanations.push(
      `${itemName} (${effectLabels}) menunjukkan mekanik ${itemMechanics} yang berpotensi merespons ancaman kontrol (${targetMechanics}) dari skill ${targetSkills} milik ${targetHero}. Kecocokan jenis crowd control dan timing aktivasi masih perlu diverifikasi.`,
    );
  }

  if (ruleIds.includes("DAMAGE_RESPONSE")) {
    explanations.push(
      `${itemName} (${effectLabels}) memiliki bukti mekanik ${itemMechanics} yang berpotensi memberi perlindungan terhadap ${targetMechanics} dari skill ${targetSkills} milik ${targetHero}. Kesesuaian jenis damage dan cakupan perlindungannya belum terverifikasi.`,
    );
  }

  if (ruleIds.includes("SUSTAIN_RESPONSE")) {
    explanations.push(
      `${itemName} (${effectLabels}) menunjukkan efek ${itemMechanics} yang berpotensi membantu pemulihan setelah menerima ${targetMechanics} dari skill ${targetSkills} milik ${targetHero}. Healing merupakan sustain setelah damage, bukan pencegahan damage.`,
    );
  }

  return explanations.length > 0
    ? explanations.join(" ")
    : `${itemName} (${effectLabels}) memiliki bukti mekanik ${itemMechanics} yang berpotensi relevan terhadap ${targetHero}. Hubungan mekanik ini masih perlu diverifikasi.`;
}

export function analyzeItemCounters(
  targetHero: string,
  targetRecords: SkillMechanicEvidence[],
  items: ItemCounterItem[],
): ItemCounterAnalysis {
  const normalizedTarget = targetHero.trim().toLowerCase();

  if (!normalizedTarget) {
    throw new Error("Nama hero target wajib diisi.");
  }

  const heroRecords = targetRecords.filter(
    (record) => record.heroName.trim().toLowerCase() === normalizedTarget,
  );

  if (heroRecords.length === 0) {
    return {
      targetHero,
      threats: [],
      candidates: [],
      verificationStatus: "UNVERIFIED",
      disclaimer:
        "Data skill hero target tidak ditemukan. Tidak ada kandidat item yang dibuat.",
    };
  }

  const threats: ItemCounterThreat[] = [];
  const candidates = new Map<string, ItemCounterCandidate>();
  const itemEvidence = extractItemEffects(items);

  for (const rule of RULES) {
    const targetEvidence = heroRecords.flatMap((record) =>
      record.evidence
        .filter((evidence) => rule.targetMechanics.includes(evidence.mechanic))
        .map((evidence) => ({ record, evidence })),
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

    const matchingResponses = itemEvidence.filter((entry) =>
      rule.responseMechanics.includes(entry.evidence.mechanic),
    );

    for (const threat of targetEvidence) {
      for (const response of matchingResponses) {
        const normalizedSlug = response.item.slug.trim().toLowerCase();
        const id = [normalizedTarget, normalizedSlug].join("|");

        const pair: ItemCounterEvidencePair = {
          targetSkill: threat.record.skillName,
          targetApiSkillId: threat.record.apiSkillId,
          targetApiGroupId: threat.record.apiGroupId,
          targetEvidence: threat.evidence,
          itemEffect: response.effectName,
          itemEffectType: response.effectType,
          itemEvidence: response.evidence,
        };

        const existing = candidates.get(id);

        if (existing) {
          const duplicatePair = existing.evidencePairs.some(
            (current) =>
              current.targetApiSkillId === pair.targetApiSkillId &&
              current.targetSkill === pair.targetSkill &&
              current.itemEffect === pair.itemEffect &&
              current.itemEffectType === pair.itemEffectType &&
              current.targetEvidence.mechanic === pair.targetEvidence.mechanic &&
              current.itemEvidence.mechanic === pair.itemEvidence.mechanic &&
              current.targetEvidence.evidenceText === pair.targetEvidence.evidenceText &&
              current.itemEvidence.evidenceText === pair.itemEvidence.evidenceText,
          );

          if (!duplicatePair) {
            existing.evidencePairs.push(pair);
          }

          if (!existing.ruleIds.includes(rule.id)) {
            existing.ruleIds.push(rule.id);
          }

          existing.conditionsToCheck = [
            ...new Set([
              ...existing.conditionsToCheck,
              ...rule.conditionsToCheck,
            ]),
          ];

          existing.explanation = buildItemCounterExplanation(
            existing.itemName,
            existing.targetHero,
            existing.evidencePairs,
            existing.ruleIds,
          );

          continue;
        }

        candidates.set(id, {
          id,
          targetHero,
          itemName: response.item.name,
          itemSlug: response.item.slug,
          itemIconUrl: response.item.iconUrl,
          itemCategory: response.item.category,
          ruleId: rule.id,
          ruleIds: [rule.id],
          explanation: buildItemCounterExplanation(
            response.item.name,
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

  const uniqueThreats = new Map<string, ItemCounterThreat>();

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
      "Kandidat item dihasilkan dari pencocokan teks mekanik, bukan bukti counter terverifikasi. Periksa patch, cakupan efek, timing, cooldown, dan gameplay aktual. Healing adalah sustain, bukan pencegahan damage.",
  };
}
