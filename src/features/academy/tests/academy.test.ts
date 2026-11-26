import assert from "node:assert/strict";
import {
  PRO_TO_RANKED_STUDIES,
  RANKED_CONTEXTS,
  SEVEN_DIMENSION_MATRIX,
  filterStudiesByModeAndRating,
  filterTipsByPhase,
  validateProToRankedGuardrails,
} from "../index";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("Keempat mode Ranked (SOLO, DUO, TRIO, FIVE_MAN) memiliki tips lengkap di seluruh 4 fase", () => {
  assert.equal(RANKED_CONTEXTS.length, 4);
  const phases = ["DRAFT", "EARLY", "MID", "LATE"] as const;

  for (const context of RANKED_CONTEXTS) {
    assert.ok(context.goldenRules.length >= 3);
    for (const phase of phases) {
      const matched = filterTipsByPhase(context.tips, phase);
      assert.ok(
        matched.length >= 1,
        `${context.id} harus memiliki minimal 1 panduan fase ${phase}`,
      );
    }
  }
});

test("Matriks 7 Dimensi memuat tepat 7 dimensi perbandingan", () => {
  assert.equal(SEVEN_DIMENSION_MATRIX.length, 7);
});

test("Seluruh studi Pro-to-Ranked lulus 5 pertanyaan wajib dan Anti-Misleading Guardrails", () => {
  const result = validateProToRankedGuardrails(PRO_TO_RANKED_STUDIES);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("Guardrail menolak strategi PRO_LEVEL_VOICE_REQUIRED yang dilabeli RECOMMENDED untuk SOLO", () => {
  const invalidStudy = {
    ...PRO_TO_RANKED_STUDIES[0],
    id: "invalid-voice-solo",
    coordinationRequirement: "PRO_LEVEL_VOICE_REQUIRED" as const,
    modeAdaptations: {
      ...PRO_TO_RANKED_STUDIES[0].modeAdaptations,
      SOLO: {
        rating: "RECOMMENDED" as const,
        howToExecute: "Tiru langsung",
        risks: "Berisiko",
        safeAlternative: null,
      },
    },
  };

  const result = validateProToRankedGuardrails([invalidStudy]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test("Filter kelayakan studi bekerja per mode Ranked", () => {
  const soloNotRecommended = filterStudiesByModeAndRating(
    PRO_TO_RANKED_STUDIES,
    "SOLO",
    "NOT_RECOMMENDED",
  );
  assert.ok(soloNotRecommended.length >= 2);

  const fiveManRecommended = filterStudiesByModeAndRating(
    PRO_TO_RANKED_STUDIES,
    "FIVE_MAN",
    "RECOMMENDED",
  );
  assert.equal(fiveManRecommended.length, PRO_TO_RANKED_STUDIES.length);
});

process.stdout.write("\nSemua pengujian Akademi Ranked selesai.\n");
