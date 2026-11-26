import assert from "node:assert/strict";
import {
  analyzeItemCounters,
  type ItemCounterItem,
} from "../engine/item-counter-engine";
import {
  extractMechanicEvidence,
  type SkillMechanicEvidence,
} from "../../matchups/engine/mechanic-evidence-extractor";

function makeHeroRecord(description: string): SkillMechanicEvidence {
  return {
    heroName: "Hirara",
    skillName: "Test Skill",
    apiSkillId: 13390,
    apiGroupId: 1332,
    sourceDataset: "hero-gameplay-normalized.json",
    evidence: extractMechanicEvidence(description),
    verificationStatus: "UNVERIFIED",
  };
}

function makeItem(
  name: string,
  activeDescription = "",
  passiveDescription = "",
): ItemCounterItem {
  return {
    entityId: name,
    canonicalId: name,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    category: "Defense",
    tier: "TIER_3",
    iconUrl: null,
    price: 1000,
    passiveEffects: passiveDescription
      ? [{
          name: "Passive",
          description: passiveDescription,
          verificationStatus: "UNVERIFIED",
        }]
      : [],
    activeEffects: activeDescription
      ? [{
          name: "Active",
          description: activeDescription,
          verificationStatus: "UNVERIFIED",
        }]
      : [],
    verificationStatus: "UNVERIFIED",
  };
}

function run(name: string, test: () => void) {
  test();
  console.log(`PASS: ${name}`);
}

run("Nama hero target wajib diisi", () => {
  assert.throws(
    () => analyzeItemCounters(" ", [], []),
    /Nama hero target wajib diisi/,
  );
});

run("Hero tanpa skill record tidak menghasilkan kandidat", () => {
  const result = analyzeItemCounters("Hirara", [], [
    makeItem("Winter Crown", "immune to all crowd control"),
  ]);
  assert.equal(result.candidates.length, 0);
  assert.equal(result.threats.length, 0);
});

run("Ancaman crowd control cocok dengan item control immunity", () => {
  const hero = makeHeroRecord("immobilizing enemies");
  const item = makeItem("Test Crown", "grants Control Immunity for 2s");
  const result = analyzeItemCounters("Hirara", [hero], [item]);

  assert.ok(result.candidates.some(
    (candidate) => candidate.ruleId === "CONTROL_RESPONSE",
  ));
});

run("Ancaman damage cocok dengan shield", () => {
  const hero = makeHeroRecord("deals physical damage to enemies");
  const item = makeItem("Test Shield", "", "grants a shield for 3 seconds");
  const result = analyzeItemCounters("Hirara", [hero], [item]);

  assert.ok(result.candidates.some(
    (candidate) => candidate.ruleId === "DAMAGE_RESPONSE",
  ));
});

run("Healing dikategorikan sebagai sustain, bukan damage prevention", () => {
  const hero = makeHeroRecord("deals magic damage to enemies");
  const item = makeItem("Test Regen", "", "restores HP over time");
  const result = analyzeItemCounters("Hirara", [hero], [item]);

  assert.ok(result.candidates.some(
    (candidate) => candidate.ruleId === "SUSTAIN_RESPONSE",
  ));
  assert.ok(!result.candidates.some(
    (candidate) => candidate.ruleId === "DAMAGE_RESPONSE",
  ));
});

run("Untargetable tidak dianggap invulnerable", () => {
  const hero = makeHeroRecord("deals physical damage to enemies");
  const item = makeItem("Test Crown", "becomes untargetable for 2 seconds");
  const result = analyzeItemCounters("Hirara", [hero], [item]);

  assert.equal(result.candidates.length, 0);
});

run("Passive dan active effect mempertahankan jenis sumber", () => {
  const hero = makeHeroRecord("deals physical damage to enemies");
  const item = makeItem(
    "Test Item",
    "becomes invulnerable for 1 second",
    "grants a shield",
  );
  const result = analyzeItemCounters("Hirara", [hero], [item]);
  const types = result.candidates.flatMap((candidate) =>
    candidate.evidencePairs.map((pair) => pair.itemEffectType),
  );

  assert.ok(types.includes("ACTIVE"));
  assert.ok(types.includes("PASSIVE"));
});

run("Semua kandidat tetap POTENTIAL dan UNVERIFIED", () => {
  const hero = makeHeroRecord("immobilizing enemies");
  const item = makeItem("Test Crown", "grants Control Immunity");
  const result = analyzeItemCounters("Hirara", [hero], [item]);

  for (const candidate of result.candidates) {
    assert.equal(candidate.confidence, "POTENTIAL");
    assert.equal(candidate.verificationStatus, "UNVERIFIED");
  }
});

run("Kandidat menyimpan evidence hero dan item", () => {
  const hero = makeHeroRecord("immobilizing enemies");
  const item = makeItem("Test Crown", "grants Control Immunity");
  const result = analyzeItemCounters("Hirara", [hero], [item]);
  const pair = result.candidates[0]?.evidencePairs[0];

  assert.ok(pair);
  assert.equal(pair.targetSkill, "Test Skill");
  assert.equal(pair.itemEffect, "Active");
  assert.equal(pair.targetEvidence.mechanic, "APPLY_IMMOBILIZE");
  assert.equal(pair.itemEvidence.mechanic, "CONTROL_IMMUNITY");
});

run("Item yang sama tidak duplikat walau cocok banyak skill, efek, dan rule", () => {
  const skill1: SkillMechanicEvidence = {
    heroName: "Hirara",
    skillName: "Skill 1",
    apiSkillId: 101,
    apiGroupId: 1,
    sourceDataset: "hero-gameplay-normalized.json",
    evidence: extractMechanicEvidence("deals physical damage and immobilizing enemies"),
    verificationStatus: "UNVERIFIED",
  };
  const skill2: SkillMechanicEvidence = {
    heroName: "Hirara",
    skillName: "Skill 2",
    apiSkillId: 102,
    apiGroupId: 1,
    sourceDataset: "hero-gameplay-normalized.json",
    evidence: extractMechanicEvidence("deals magic damage to enemies"),
    verificationStatus: "UNVERIFIED",
  };
  const item = makeItem(
    "Multi Effect Armor",
    "becomes invulnerable and grants Control Immunity",
    "grants a shield and restores HP over time",
  );

  const result = analyzeItemCounters("Hirara", [skill1, skill2], [item]);
  assert.equal(result.candidates.length, 1);

  const candidate = result.candidates[0];
  assert.equal(candidate.itemSlug, "multi-effect-armor");
  assert.ok(candidate.ruleIds.includes("CONTROL_RESPONSE"));
  assert.ok(candidate.ruleIds.includes("DAMAGE_RESPONSE"));
  assert.ok(candidate.ruleIds.includes("SUSTAIN_RESPONSE"));
  assert.ok(candidate.evidencePairs.some((pair) => pair.targetSkill === "Skill 1"));
  assert.ok(candidate.evidencePairs.some((pair) => pair.targetSkill === "Skill 2"));
  assert.ok(candidate.evidencePairs.some((pair) => pair.itemEffectType === "ACTIVE"));
  assert.ok(candidate.evidencePairs.some((pair) => pair.itemEffectType === "PASSIVE"));
});

console.log("\nSemua Item Counter Engine tests berhasil.");