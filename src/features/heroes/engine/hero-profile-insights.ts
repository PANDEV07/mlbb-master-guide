import type { ExtractedMechanicRecord } from "@/features/matchups/engine/mechanic-extractor";

export type InsightStatus =
  | "POTENTIAL"
  | "INSUFFICIENT_EVIDENCE";

export type InsightVerificationStatus = "UNVERIFIED";

export interface InsightEvidence {
  skillName: string;
  apiGroupId: string | number;
  apiSkillId: string | number | null;
  mechanicCategories: string[];
  apiTags: string[];
  description: string;
}

export interface HeroInsight {
  id: string;
  title: string;
  explanation: string;
  status: InsightStatus;
  verificationStatus: InsightVerificationStatus;
  evidence: InsightEvidence[];
}

export interface HeroProfileInsights {
  heroName: string;
  strengths: HeroInsight[];
  situationalAdvantages: HeroInsight[];
  weaknesses: HeroInsight[];
  counterplay: HeroInsight[];
  weaknessAssessment: InsightStatus;
  verificationStatus: InsightVerificationStatus;
  disclaimer: string;
  metadata: {
    mechanicRecords: number;
    classifiedRecords: number;
    unknownRecords: number;
  };
}

const STRENGTH_DEFINITIONS = [
  {
    category: "CROWD_CONTROL",
    id: "crowd-control",
    title: "Potensi Crowd Control",
    explanation:
      "Dataset menunjukkan skill dengan kategori Crowd Control. Dampak dan efektivitasnya dalam pertandingan belum diverifikasi.",
  },
  {
    category: "MOBILITY",
    id: "mobility",
    title: "Potensi Mobilitas",
    explanation:
      "Dataset menunjukkan skill dengan kategori Mobility. Jarak, frekuensi, dan keamanannya belum diverifikasi.",
  },
  {
    category: "DAMAGE",
    id: "damage",
    title: "Potensi Damage",
    explanation:
      "Dataset menunjukkan skill dengan kategori Damage. Besaran damage dan kemampuan burst belum diverifikasi.",
  },
  {
    category: "DEFENSE",
    id: "defense",
    title: "Potensi Pertahanan",
    explanation:
      "Dataset menunjukkan skill dengan kategori Defense. Ketahanan aktual dan syarat penggunaannya belum diverifikasi.",
  },
  {
    category: "SUSTAIN",
    id: "sustain",
    title: "Potensi Sustain",
    explanation:
      "Dataset menunjukkan skill dengan kategori Sustain. Besaran dan konsistensi sustain belum diverifikasi.",
  },
  {
    category: "UTILITY",
    id: "utility",
    title: "Potensi Utility",
    explanation:
      "Dataset menunjukkan skill dengan kategori Utility. Manfaat strategis aktualnya belum diverifikasi.",
  },
  {
    category: "BUFF_DEBUFF",
    id: "buff-debuff",
    title: "Potensi Buff dan Debuff",
    explanation:
      "Dataset menunjukkan skill dengan kategori Buff/Debuff. Efek dan durasinya belum diverifikasi.",
  },
  {
    category: "SPECIAL",
    id: "special",
    title: "Mekanik Khusus",
    explanation:
      "Dataset menunjukkan skill dengan kategori Special. Fungsi dan dampak mekaniknya belum diverifikasi.",
  },
] as const;

function toEvidence(
  record: ExtractedMechanicRecord,
): InsightEvidence {
  return {
    skillName: record.skillName,
    apiGroupId: record.apiGroupId,
    apiSkillId: record.apiSkillId,
    mechanicCategories: [...record.mechanicCategories],
    apiTags: record.apiTags.map((tag) => tag.name),
    description: record.description,
  };
}

export function analyzeHeroProfileInsights(
  heroName: string,
  records: ExtractedMechanicRecord[],
): HeroProfileInsights {
  const normalizedName = heroName.trim().toLowerCase();

  if (!normalizedName) {
    throw new Error("Nama hero wajib diisi.");
  }

  const heroRecords = records.filter(
    (record) =>
      record.heroName.trim().toLowerCase() === normalizedName,
  );

  const strengths: HeroInsight[] = [];

  for (const definition of STRENGTH_DEFINITIONS) {
    const supportingRecords = heroRecords.filter((record) =>
      record.mechanicCategories.includes(definition.category),
    );

    if (supportingRecords.length === 0) {
      continue;
    }

    strengths.push({
      id: definition.id,
      title: definition.title,
      explanation: definition.explanation,
      status: "POTENTIAL",
      verificationStatus: "UNVERIFIED",
      evidence: supportingRecords.map(toEvidence),
    });
  }

  const classifiedRecords = heroRecords.filter(
    (record) => record.categoryStatus === "CLASSIFIED",
  ).length;

  const unknownRecords = heroRecords.length - classifiedRecords;

  const hasHeroRecords = heroRecords.length > 0;

  return {
    heroName: heroRecords[0]?.heroName ?? heroName.trim(),
    strengths,
    situationalAdvantages: [],
    weaknesses: [],
    counterplay: [],
    weaknessAssessment: "INSUFFICIENT_EVIDENCE",
    verificationStatus: "UNVERIFIED",
    disclaimer:
      "Hasil ini merupakan pemetaan potensi berdasarkan kategori mekanik kandidat. " +
      "Bukan penilaian kekuatan hero, matchup, win rate, atau fakta gameplay terverifikasi. " +
      "Kelemahan dan counterplay tidak disimpulkan dari ketiadaan kategori mekanik.",
    metadata: {
      mechanicRecords: heroRecords.length,
      classifiedRecords,
      unknownRecords: hasHeroRecords ? unknownRecords : 0,
    },
  };
}