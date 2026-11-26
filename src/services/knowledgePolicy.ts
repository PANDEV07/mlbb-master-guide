import type { ClaimClassification, KnowledgeGovernanceMeta } from "@/types/knowledge";

export const PROJECT_TRACK_STATUS = {
  phaseLabel: "Phase 0.5 — Project Initialization",
  researchTrackStatus: "Riset Phase 0 Berjalan Paralel",
  dataPopulationState: "BELUM_DIISI",
  referenceDate: "2026-11-18",
} as const;

export const CLAIM_CLASSIFICATION_LABELS: Record<
  ClaimClassification,
  { label: string; description: string }
> = {
  VERIFIED_FACT: {
    label: "Fakta Terverifikasi",
    description: "Bersumber langsung dari catatan resmi atau data pertandingan yang terkonfirmasi.",
  },
  RESEARCH_BASED_ANALYSIS: {
    label: "Analisis Berbasis Riset",
    description: "Kesimpulan analitis dari sampel data terverifikasi dan metodologi yang jelas.",
  },
  STRATEGIC_INTERPRETATION: {
    label: "Interpretasi Strategis",
    description: "Pembacaan taktis dari perilaku gameplay yang memerlukan konteks situasi.",
  },
  COMMUNITY_THEORY: {
    label: "Teori Komunitas",
    description: "Hipotesis atau diskusi komunitas yang belum divalidasi secara formal.",
  },
  UNKNOWN_UNVERIFIED: {
    label: "Belum Terverifikasi",
    description: "Data belum ditemukan, belum diaudit, atau masih bertentangan.",
  },
};

export function createPendingGovernanceMeta(): KnowledgeGovernanceMeta {
  return {
    patchVersion: "Menunggu Ingest Patch Terverifikasi",
    serverEnvironment: "ORIGINAL_SERVER",
    verificationStatus: "UNVERIFIED",
    confidenceLevel: "LOW",
    lastVerified: null,
    sourceLabel: null,
  };
}
