import assert from "node:assert/strict";
import {
  findEvidenceInteractions,
} from "../engine/evidence-interaction-engine";
import type {
  SkillMechanicEvidence,
} from "../engine/mechanic-evidence-extractor";

function record(
  heroName: string,
  skillName: string,
  apiSkillId: number,
  mechanics: SkillMechanicEvidence["evidence"][number]["mechanic"][],
): SkillMechanicEvidence {
  return {
    heroName,
    skillName,
    apiSkillId,
    apiGroupId: 100 + apiSkillId,
    sourceDataset: "hero-gameplay-normalized.json",
    verificationStatus: "UNVERIFIED",
    evidence: mechanics.map((mechanic) => ({
      mechanic,
      polarity:
        mechanic === "CONTROL_IMMUNITY" ||
        mechanic === "CC_REMOVAL" ||
        mechanic === "UNTARGETABLE"
          ? "PROTECTED"
          : "APPLIED",
      evidenceText: mechanic,
      start: 0,
      end: mechanic.length,
      verificationStatus: "UNVERIFIED",
    })),
  };
}

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

const fixtures = [
  record("Hero A", "Stunning Skill", 1, ["APPLY_STUN"]),
  record("Hero B", "Immunity Skill", 2, ["CONTROL_IMMUNITY"]),
  record("Hero C", "Dash Skill", 3, ["DASH"]),
  record("Hero D", "Untargetable Skill", 4, ["UNTARGETABLE"]),
  record("Hero E", "Magic Skill", 5, ["MAGIC_DAMAGE"]),
];

const candidates = findEvidenceInteractions(fixtures);

test("Mendeteksi kontrol melawan control immunity", () => {
  assert.ok(candidates.some(
    (item) => item.sourceHero === "Hero A" && item.targetHero === "Hero B",
  ));
});

test("Dash tidak otomatis menjadi interaksi aktif", () => {
  assert.ok(!candidates.some((item) => item.targetHero === "Hero C"));
});

test("Untargetable versus damage tidak otomatis menjadi interaksi aktif", () => {
  assert.ok(!candidates.some((item) => item.sourceHero === "Hero D"));
});

test("Hanya rule CONTROL_VS_IMMUNITY yang aktif", () => {
  assert.ok(candidates.every((item) => item.ruleId === "CONTROL_VS_IMMUNITY"));
});

test("Tidak membuat interaksi hero melawan dirinya sendiri", () => {
  assert.ok(candidates.every(
    (item) => item.sourceHero !== item.targetHero,
  ));
});

test("Evidence mekanik duplikat pada skill dideduplikasi", () => {
  const duplicated = record(
    "Hero F",
    "Double Stun",
    6,
    ["APPLY_STUN", "APPLY_STUN"],
  );

  const result = findEvidenceInteractions([duplicated, fixtures[1]]);
  const candidate = result.find((item) => item.sourceHero === "Hero F");

  assert.ok(candidate);
  assert.equal(candidate.sourceEvidence.length, 1);
});

test("ID skill dan group tetap dipertahankan", () => {
  assert.ok(candidates.every(
    (item) =>
      item.sourceApiSkillId !== null &&
      item.targetApiSkillId !== null &&
      item.sourceApiGroupId !== null &&
      item.targetApiGroupId !== null,
  ));
});

test("Kandidat tetap UNVERIFIED dan memiliki checklist review", () => {
  assert.ok(candidates.every(
    (item) =>
      item.verificationStatus === "UNVERIFIED" &&
      item.reviewRequired &&
      item.conditionsToCheck.length > 0,
  ));
});

test("ID kandidat unik", () => {
  const ids = candidates.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("Input kosong tidak menghasilkan kandidat", () => {
  assert.deepEqual(findEvidenceInteractions([]), []);
});

process.stdout.write("\nSemua evidence interaction tests selesai.\n");