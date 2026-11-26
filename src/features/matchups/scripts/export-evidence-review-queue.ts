import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
import {
  buildEvidenceReviewQueue,
} from "../engine/evidence-review-queue";

function csvCell(value: unknown): string {
  const text = value === null || value === undefined
    ? ""
    : typeof value === "string"
      ? value
      : JSON.stringify(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function evidenceText(
  evidence: Array<{
    mechanic: string;
    polarity: string;
    evidenceText: string;
    start: number;
    end: number;
    verificationStatus: string;
  }>,
): string {
  return evidence.map((item) =>
    [
      `mechanic=${item.mechanic}`,
      `polarity=${item.polarity}`,
      `text=${item.evidenceText}`,
      `position=${item.start}-${item.end}`,
      `status=${item.verificationStatus}`,
    ].join("; "),
  ).join(" || ");
}

const dataset = JSON.parse(
  readFileSync("hero-gameplay-normalized.json", "utf8"),
) as GameplayCandidateHero[];

const extracted = extractHeroMechanics(dataset);
const evidenceRecords = extractMechanicsFromRecords(extracted);
const candidates = findEvidenceInteractions(evidenceRecords);
const queue = buildEvidenceReviewQueue(candidates);

const allUnverified =
  evidenceRecords.every((record) =>
    record.verificationStatus === "UNVERIFIED" &&
    record.evidence.every((item) => item.verificationStatus === "UNVERIFIED")
  ) &&
  candidates.every((candidate) =>
    candidate.verificationStatus === "UNVERIFIED"
  ) &&
  queue.items.every((item) =>
    item.verificationStatus === "UNVERIFIED" &&
    item.supportingSkillPairs.every(
      (pair) => pair.verificationStatus === "UNVERIFIED",
    )
  );

if (!allUnverified) {
  throw new Error("Export dibatalkan: ditemukan status selain UNVERIFIED.");
}

const outputDir = join(process.cwd(), "artifacts", "evidence-review-queue");
mkdirSync(outputDir, { recursive: true });

const jsonOutput = {
  exportVersion: "3.0.5",
  exportedAt: new Date().toISOString(),
  policy: {
    defaultStatus: "UNVERIFIED",
    verifiedRequiresManualReview: true,
    databaseWrites: false,
  },
  metadata: {
    heroes: dataset.length,
    mechanicRecords: extracted.length,
    evidenceSkillRecords: evidenceRecords.length,
    interactionCandidates: candidates.length,
    reviewItems: queue.metadata.reviewItems,
    groupedSkillPairs: queue.metadata.groupedSkillPairs,
    uniqueDirectedHeroPairs: queue.metadata.uniqueHeroPairs,
    verificationStatus: queue.metadata.verificationStatus,
  },
  items: queue.items,
};

const headers = [
  "review_item_id",
  "rule_id",
  "source_hero",
  "target_hero",
  "skill_pair_count",
  "unique_source_skills",
  "unique_target_skills",
  "source_skill",
  "source_api_skill_id",
  "source_api_group_id",
  "source_evidence",
  "target_skill",
  "target_api_skill_id",
  "target_api_group_id",
  "target_evidence",
  "verification_status",
  "review_required",
  "conditions_to_check",
  "explanation",
];

const rows: string[][] = [];

for (const item of queue.items) {
  for (const pair of item.supportingSkillPairs) {
    rows.push([
      item.id,
      item.ruleId,
      item.sourceHero,
      item.targetHero,
      String(item.skillPairCount),
      String(item.uniqueSourceSkills),
      String(item.uniqueTargetSkills),
      pair.sourceSkill,
      String(pair.sourceApiSkillId ?? ""),
      String(pair.sourceApiGroupId),
      evidenceText(pair.sourceEvidence),
      pair.targetSkill,
      String(pair.targetApiSkillId ?? ""),
      String(pair.targetApiGroupId),
      evidenceText(pair.targetEvidence),
      pair.verificationStatus,
      String(item.reviewRequired),
      item.conditionsToCheck.join(" || "),
      item.explanation,
    ]);
  }
}

const csvOutput = [
  headers.map(csvCell).join(","),
  ...rows.map((row) => row.map(csvCell).join(",")),
].join("\r\n");

const jsonPath = join(outputDir, "evidence-review-queue.json");
const csvPath = join(outputDir, "evidence-review-queue.csv");

writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), "utf8");
writeFileSync(csvPath, csvOutput, "utf8");

console.log("\n=== REVIEW QUEUE EXPORT ===");
console.log("Heroes:", dataset.length);
console.log("Review items:", queue.metadata.reviewItems);
console.log("Skill pair rows:", rows.length);
console.log("All UNVERIFIED:", allUnverified);
console.log("JSON:", jsonPath);
console.log("CSV:", csvPath);
console.log("\nPASS: Review queue berhasil diekspor.");