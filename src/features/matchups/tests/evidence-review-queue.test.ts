import assert from "node:assert/strict";
import {
  buildEvidenceReviewQueue,
} from "../engine/evidence-review-queue";
import type {
  EvidenceInteractionCandidate,
} from "../engine/evidence-interaction-engine";

function candidate(
  sourceHero: string,
  targetHero: string,
  sourceSkill: string,
  targetSkill: string,
  id: string,
): EvidenceInteractionCandidate {
  return {
    id,
    ruleId: "CONTROL_VS_IMMUNITY",
    sourceHero,
    targetHero,
    sourceSkill,
    targetSkill,
    sourceApiSkillId:
      sourceSkill === "Skill A1" ? 101 :
      sourceSkill === "Skill A2" ? 102 :
      sourceSkill === "Skill B1" ? 201 : 202,
    targetApiSkillId:
      targetSkill === "Skill A1" ? 101 :
      targetSkill === "Skill A2" ? 102 :
      targetSkill === "Skill B1" ? 201 : 202,
    sourceApiGroupId: 100,
    targetApiGroupId: 200,
    sourceEvidence: [{
      mechanic: "APPLY_STUN",
      polarity: "APPLIED",
      evidenceText: "stuns",
      start: 0,
      end: 5,
      verificationStatus: "UNVERIFIED",
    }],
    targetEvidence: [{
      mechanic: "CONTROL_IMMUNITY",
      polarity: "PROTECTED",
      evidenceText: "Control Immunity",
      start: 0,
      end: 16,
      verificationStatus: "UNVERIFIED",
    }],
    explanation: "Interaksi kandidat yang perlu ditinjau.",
    conditionsToCheck: [
      "Periksa timing dan durasi.",
      "Periksa kondisi aktivasi.",
    ],
    reviewRequired: true,
    verificationStatus: "UNVERIFIED",
  };
}

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

const input = [
  candidate("Hero A", "Hero B", "Skill A1", "Skill B1", "pair-1"),
  candidate("Hero A", "Hero B", "Skill A2", "Skill B1", "pair-2"),
  candidate("Hero A", "Hero B", "Skill A1", "Skill B2", "pair-3"),
  candidate("Hero B", "Hero A", "Skill B1", "Skill A1", "pair-4"),
];

const queue = buildEvidenceReviewQueue(input);

test("Empat kandidat dikelompokkan menjadi dua arah review", () => {
  assert.equal(queue.items.length, 2);
});

test("Arah pasangan hero tetap dibedakan", () => {
  assert.ok(queue.items.some(
    (item) => item.sourceHero === "Hero A" && item.targetHero === "Hero B",
  ));
  assert.ok(queue.items.some(
    (item) => item.sourceHero === "Hero B" && item.targetHero === "Hero A",
  ));
});

test("Semua pasangan skill pendukung tetap dipertahankan", () => {
  const forward = queue.items.find(
    (item) => item.sourceHero === "Hero A",
  );
  assert.ok(forward);
  assert.equal(forward.skillPairCount, 3);
  assert.equal(forward.supportingSkillPairs.length, 3);
});

test("Jumlah skill unik dihitung dengan group dan skill ID", () => {
  const forward = queue.items.find(
    (item) => item.sourceHero === "Hero A",
  );
  assert.ok(forward);
  assert.equal(forward.uniqueSourceSkills, 2);
  assert.equal(forward.uniqueTargetSkills, 2);
});

test("Checklist review digabung tanpa duplikasi", () => {
  const forward = queue.items.find(
    (item) => item.sourceHero === "Hero A",
  );
  assert.ok(forward);
  assert.equal(forward.conditionsToCheck.length, 2);
});

test("Metadata jumlah kandidat dan review konsisten", () => {
  assert.equal(queue.metadata.inputCandidates, 4);
  assert.equal(queue.metadata.reviewItems, 2);
  assert.equal(queue.metadata.groupedSkillPairs, 4);
  assert.equal(queue.metadata.uniqueHeroPairs, 2);
});

test("Semua item tetap UNVERIFIED dan perlu ditinjau", () => {
  assert.ok(queue.items.every(
    (item) =>
      item.verificationStatus === "UNVERIFIED" &&
      item.reviewRequired,
  ));
});

test("Input kosong menghasilkan antrean kosong", () => {
  const empty = buildEvidenceReviewQueue([]);
  assert.equal(empty.items.length, 0);
  assert.equal(empty.metadata.inputCandidates, 0);
});

test("ID kandidat tidak digandakan dalam satu review item", () => {
  const duplicated = [
    input[0],
    input[0],
  ];
  const result = buildEvidenceReviewQueue(duplicated);

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].skillPairCount, 1);
});

process.stdout.write("\nSemua evidence review queue tests selesai.\n");