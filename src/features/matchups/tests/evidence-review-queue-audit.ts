import { readFileSync } from "node:fs";
import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "../engine/mechanic-extractor";
import { extractMechanicsFromRecords } from "../engine/mechanic-evidence-extractor";
import { findEvidenceInteractions } from "../engine/evidence-interaction-engine";
import { buildEvidenceReviewQueue } from "../engine/evidence-review-queue";

const dataset = JSON.parse(
  readFileSync("hero-gameplay-normalized.json", "utf8"),
) as GameplayCandidateHero[];

const extractedMechanics = extractHeroMechanics(dataset);
const evidenceRecords = extractMechanicsFromRecords(extractedMechanics);
const candidates = findEvidenceInteractions(evidenceRecords);
const queue = buildEvidenceReviewQueue(candidates);

const allUnverified =
  evidenceRecords.every((record) =>
    record.verificationStatus === "UNVERIFIED" &&
    record.evidence.every((item) => item.verificationStatus === "UNVERIFIED")
  ) &&
  candidates.every((candidate) => candidate.verificationStatus === "UNVERIFIED") &&
  queue.items.every((item) =>
    item.verificationStatus === "UNVERIFIED" &&
    item.supportingSkillPairs.every((pair) => pair.verificationStatus === "UNVERIFIED")
  );

const candidateIds = candidates.map((candidate) => candidate.id);
const uniqueCandidateIds = new Set(candidateIds).size;

const totalSkillPairs = queue.items.reduce(
  (sum, item) => sum + item.skillPairCount,
  0,
);

const totalUniqueSourceSkills = queue.items.reduce(
  (sum, item) => sum + item.uniqueSourceSkills,
  0,
);

const totalUniqueTargetSkills = queue.items.reduce(
  (sum, item) => sum + item.uniqueTargetSkills,
  0,
);

console.log("\n=== EVIDENCE REVIEW QUEUE DATASET AUDIT ===");
console.log("Heroes:", dataset.length);
console.log("Extracted mechanic records:", extractedMechanics.length);
console.log("Evidence skill records:", evidenceRecords.length);
console.log("Interaction candidates:", candidates.length);
console.log("Review queue items:", queue.items.length);
console.log("Grouped skill pairs:", totalSkillPairs);
console.log("Unique directed hero pairs:", queue.metadata.uniqueHeroPairs);
console.log("Summed unique source skills per review item:", totalUniqueSourceSkills);
console.log("Summed unique target skills per review item:", totalUniqueTargetSkills);
console.log("Candidate IDs unique:", candidateIds.length === uniqueCandidateIds);
console.log("All evidence and candidates UNVERIFIED:", allUnverified);

console.log("\n=== REVIEW QUEUE SAMPLE ===");
for (const item of queue.items.slice(0, 10)) {
  console.log({
    sourceHero: item.sourceHero,
    targetHero: item.targetHero,
    ruleId: item.ruleId,
    skillPairCount: item.skillPairCount,
    uniqueSourceSkills: item.uniqueSourceSkills,
    uniqueTargetSkills: item.uniqueTargetSkills,
    verificationStatus: item.verificationStatus,
    sampleSkillPair: item.supportingSkillPairs[0]
      ? {
          sourceSkill: item.supportingSkillPairs[0].sourceSkill,
          targetSkill: item.supportingSkillPairs[0].targetSkill,
          sourceApiSkillId: item.supportingSkillPairs[0].sourceApiSkillId,
          targetApiSkillId: item.supportingSkillPairs[0].targetApiSkillId,
        }
      : null,
  });
}

if (!allUnverified) {
  throw new Error("Audit gagal: ditemukan status selain UNVERIFIED.");
}
if (candidateIds.length !== uniqueCandidateIds) {
  throw new Error("Audit gagal: ditemukan ID kandidat duplikat.");
}
if (totalSkillPairs !== queue.metadata.groupedSkillPairs) {
  throw new Error("Audit gagal: jumlah skill pair tidak konsisten.");
}

console.log("\nPASS: Dataset review queue lolos pemeriksaan integritas.");