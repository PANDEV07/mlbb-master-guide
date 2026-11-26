import { readFileSync } from "node:fs";
import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "../engine/mechanic-extractor";
import {
  extractMechanicsFromRecords,
} from "../engine/mechanic-evidence-extractor";
import {
  findEvidenceInteractions,
} from "../engine/evidence-interaction-engine";

const raw = JSON.parse(
  readFileSync("hero-gameplay-normalized.json", "utf8"),
) as GameplayCandidateHero[];

const mechanics = extractHeroMechanics(raw);
const evidenceRecords = extractMechanicsFromRecords(mechanics);
const candidates = findEvidenceInteractions(evidenceRecords);

const skillsWithEvidence = evidenceRecords.filter(
  (record) => record.evidence.length > 0,
);

const mechanicCounts = evidenceRecords.reduce<Record<string, number>>(
  (counts, record) => {
    for (const item of record.evidence) {
      counts[item.mechanic] = (counts[item.mechanic] ?? 0) + 1;
    }
    return counts;
  },
  {},
);

const ruleCounts = candidates.reduce<Record<string, number>>(
  (counts, candidate) => {
    counts[candidate.ruleId] = (counts[candidate.ruleId] ?? 0) + 1;
    return counts;
  },
  {},
);

const uniqueHeroPairs = new Map<string, Set<string>>();

for (const candidate of candidates) {
  const key = candidate.ruleId;
  const pair = `${candidate.sourceHero} -> ${candidate.targetHero}`;

  if (!uniqueHeroPairs.has(key)) {
    uniqueHeroPairs.set(key, new Set());
  }

  uniqueHeroPairs.get(key)!.add(pair);
}

console.log("\n=== DATASET EVIDENCE COVERAGE ===");
console.log("Heroes:", raw.length);
console.log("Skill records:", mechanics.length);
console.log("Skills with evidence:", skillsWithEvidence.length);
console.log(
  "Skills without evidence:",
  evidenceRecords.length - skillsWithEvidence.length,
);
console.log(
  "Evidence coverage:",
  `${((skillsWithEvidence.length / evidenceRecords.length) * 100).toFixed(2)}%`,
);
console.log(
  "Total extracted evidence:",
  evidenceRecords.reduce((sum, record) => sum + record.evidence.length, 0),
);

console.log("\n=== MECHANIC DISTRIBUTION ===");
for (const [mechanic, count] of Object.entries(mechanicCounts).sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`${mechanic}: ${count}`);
}

console.log("\n=== INTERACTION RULE DISTRIBUTION ===");
for (const rule of [
  "CONTROL_VS_IMMUNITY",
  "CONTROL_VS_MOBILITY",
  "TARGETABILITY_VS_DAMAGE",
]) {
  console.log(
    `${rule}: candidates=${ruleCounts[rule] ?? 0}, ` +
    `uniqueHeroPairs=${uniqueHeroPairs.get(rule)?.size ?? 0}`,
  );
}

console.log("\n=== REAL DATA SAMPLES ===");

for (const rule of [
  "CONTROL_VS_IMMUNITY",
  "CONTROL_VS_MOBILITY",
  "TARGETABILITY_VS_DAMAGE",
] as const) {
  console.log(`\n--- ${rule} ---`);

  const samples = candidates
    .filter((candidate) => candidate.ruleId === rule)
    .slice(0, 8);

  if (samples.length === 0) {
    console.log("Tidak ada kandidat.");
    continue;
  }

  for (const item of samples) {
    console.log(
      `${item.sourceHero} [${item.sourceSkill}] ` +
      `(skill ${item.sourceApiSkillId}, group ${item.sourceApiGroupId})`,
    );
    console.log(
      `  Evidence source: ${item.sourceEvidence.map(
        (evidence) => `${evidence.mechanic}: "${evidence.evidenceText}"`,
      ).join("; ")}`,
    );
    console.log(
      `  -> ${item.targetHero} [${item.targetSkill}] ` +
      `(skill ${item.targetApiSkillId}, group ${item.targetApiGroupId})`,
    );
    console.log(
      `  Evidence target: ${item.targetEvidence.map(
        (evidence) => `${evidence.mechanic}: "${evidence.evidenceText}"`,
      ).join("; ")}`,
    );
    console.log("  Status:", item.verificationStatus);
  }
}

console.log("\n=== AUDIT INTEGRITY ===");
console.log(
  "All evidence records UNVERIFIED:",
  evidenceRecords.every((record) => record.verificationStatus === "UNVERIFIED"),
);
console.log(
  "All candidates UNVERIFIED:",
  candidates.every((candidate) => candidate.verificationStatus === "UNVERIFIED"),
);
console.log(
  "Unique candidate IDs:",
  new Set(candidates.map((candidate) => candidate.id)).size === candidates.length,
);