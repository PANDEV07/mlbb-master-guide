import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import candidateData from "../../../../hero-gameplay-normalized.json";

import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "@/features/matchups/engine/mechanic-extractor";

import {
  analyzeHeroProfileInsights,
} from "../engine/hero-profile-insights";

const rawHeroes = candidateData as GameplayCandidateHero[];
const records = extractHeroMechanics(rawHeroes);

function pass(message: string) {
  process.stdout.write(`PASS ${message}\n`);
}

const heroName = rawHeroes[0]?.heroName;

assert.ok(heroName, "Dataset harus memiliki hero.");
pass("Dataset menyediakan hero untuk analisis");

const result = analyzeHeroProfileInsights(heroName, records);

assert.equal(result.heroName, heroName);
pass("Identitas hero dipertahankan");

assert.equal(result.verificationStatus, "UNVERIFIED");
pass("Hasil analisis tetap UNVERIFIED");

assert.ok(Array.isArray(result.strengths));
pass("Strengths tersedia sebagai daftar");

assert.ok(Array.isArray(result.weaknesses));
pass("Weaknesses tersedia sebagai daftar");

assert.ok(Array.isArray(result.situationalAdvantages));
pass("Situational advantages tersedia sebagai daftar");

assert.ok(Array.isArray(result.counterplay));
pass("Counterplay tersedia sebagai daftar");

assert.equal(
  result.weaknessAssessment,
  "INSUFFICIENT_EVIDENCE",
);
pass("Kelemahan tidak dikarang tanpa evidence");

for (const insight of result.strengths) {
  assert.equal(insight.status, "POTENTIAL");
  assert.equal(insight.verificationStatus, "UNVERIFIED");
  assert.ok(insight.evidence.length > 0);

  for (const evidence of insight.evidence) {
    assert.ok(evidence.skillName.length > 0);
    assert.ok(evidence.apiGroupId !== undefined);
  }
}
pass("Setiap potential strength memiliki jejak evidence skill");

assert.equal(
  result.metadata.mechanicRecords,
  records.filter(
    (record) =>
      record.heroName.toLowerCase() === heroName.toLowerCase(),
  ).length,
);
pass("Jumlah mechanic records sesuai dataset");

assert.equal(
  result.metadata.classifiedRecords +
    result.metadata.unknownRecords,
  result.metadata.mechanicRecords,
);
pass("Status classified dan unknown konsisten");

const unknownResult = analyzeHeroProfileInsights(
  "Hero Yang Tidak Ada",
  records,
);

assert.equal(unknownResult.metadata.mechanicRecords, 0);
assert.equal(unknownResult.strengths.length, 0);
assert.equal(unknownResult.weaknesses.length, 0);
pass("Hero tanpa data tidak menghasilkan insight palsu");

assert.throws(
  () => analyzeHeroProfileInsights("   ", records),
);
pass("Nama hero kosong ditolak");

assert.ok(result.disclaimer.length > 0);
pass("Disclaimer analisis tersedia");

console.log("\n=== HERO INSIGHTS SUMMARY ===");
console.log(`Hero: ${result.heroName}`);
console.log(`Mechanic records: ${result.metadata.mechanicRecords}`);
console.log(`Classified: ${result.metadata.classifiedRecords}`);
console.log(`Unknown: ${result.metadata.unknownRecords}`);
console.log(`Potential strengths: ${result.strengths.length}`);
console.log(`Weaknesses: ${result.weaknesses.length}`);
console.log(`Verification: ${result.verificationStatus}`);

console.log("\nSemua Hero Profile Insights tests selesai.");