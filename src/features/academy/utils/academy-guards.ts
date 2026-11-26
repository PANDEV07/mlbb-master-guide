import type {
  AdaptationRating,
  GameplayPhaseId,
  ModeTipItem,
  ProToRankedCaseStudy,
  RankedModeId,
} from "../types/academy.types";

export interface GuardrailValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Memvalidasi kepatuhan studi adaptasi Pro-to-Ranked terhadap:
 * - AGENTS.md §4 (5 pertanyaan inti wajib)
 * - PRO_TO_RANKED_ADAPTATION.md §3 (Anti-Misleading Guardrails)
 */
export function validateProToRankedGuardrails(
  studies: readonly ProToRankedCaseStudy[],
): GuardrailValidationResult {
  const errors: string[] = [];

  for (const study of studies) {
    if (!study.observedProExecution.trim()) {
      errors.push(`${study.id}: observedProExecution wajib diisi.`);
    }
    if (!study.whyItWorks.trim()) {
      errors.push(`${study.id}: whyItWorks wajib diisi.`);
    }
    if (study.requiredConditions.length === 0) {
      errors.push(`${study.id}: requiredConditions minimal 1 item.`);
    }
    if (!study.rankedRealismCheck.trim()) {
      errors.push(`${study.id}: rankedRealismCheck wajib diisi.`);
    }
    if (study.claimClassification === "OFFICIAL_FACT") {
      errors.push(
        `${study.id}: adaptasi taktis tidak boleh dilabeli OFFICIAL_FACT.`,
      );
    }

    const solo = study.modeAdaptations.SOLO;

    if (
      study.coordinationRequirement === "PRO_LEVEL_VOICE_REQUIRED" &&
      solo.rating !== "NOT_RECOMMENDED" &&
      solo.rating !== "HIGH_RISK"
    ) {
      errors.push(
        `${study.id}: strategi PRO_LEVEL_VOICE_REQUIRED wajib memberi rating NOT_RECOMMENDED atau HIGH_RISK untuk SOLO.`,
      );
    }

    if (
      (solo.rating === "NOT_RECOMMENDED" || solo.rating === "HIGH_RISK") &&
      !solo.safeAlternative?.trim()
    ) {
      errors.push(
        `${study.id}: adaptasi SOLO berisiko tinggi wajib menyertakan safeAlternative.`,
      );
    }

    for (const mode of ["SOLO", "DUO", "TRIO", "FIVE_MAN"] as const) {
      const detail = study.modeAdaptations[mode];
      if (!detail.howToExecute.trim() || !detail.risks.trim()) {
        errors.push(`${study.id}: adaptasi ${mode} wajib memuat howToExecute dan risks.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function filterTipsByPhase(
  tips: readonly ModeTipItem[],
  phase: GameplayPhaseId | "ALL",
): ModeTipItem[] {
  if (phase === "ALL") return [...tips];
  return tips.filter((tip) => tip.phase === phase);
}

export function filterStudiesByModeAndRating(
  studies: readonly ProToRankedCaseStudy[],
  mode: RankedModeId,
  rating: AdaptationRating | "ALL",
): ProToRankedCaseStudy[] {
  if (rating === "ALL") return [...studies];
  return studies.filter((study) => study.modeAdaptations[mode].rating === rating);
}
