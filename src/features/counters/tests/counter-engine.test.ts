import assert from "node:assert/strict";
import {
  analyzeCounterAgainstHero,
} from "../engine/counter-engine";
import type {
  SkillMechanicEvidence,
} from "@/features/matchups/engine/mechanic-evidence-extractor";

const records: SkillMechanicEvidence[] = [
  {
    heroName: "Target Hero",
    skillName: "Mobility Skill",
    apiSkillId: 101,
    apiGroupId: 10,
    sourceDataset: "hero-gameplay-normalized.json",
    evidence: [{
      mechanic: "DASH",
      polarity: "APPLIED",
      evidenceText: "dashes forward",
      start: 0,
      end: 14,
      verificationStatus: "UNVERIFIED",
    }],
    verificationStatus: "UNVERIFIED",
  },
  {
    heroName: "Control Hero",
    skillName: "Control Skill",
    apiSkillId: 201,
    apiGroupId: 20,
    sourceDataset: "hero-gameplay-normalized.json",
    evidence: [{
      mechanic: "APPLY_STUN",
      polarity: "APPLIED",
      evidenceText: "stuns the enemy",
      start: 0,
      end: 15,
      verificationStatus: "UNVERIFIED",
    }],
    verificationStatus: "UNVERIFIED",
  },
  {
    heroName: "Protection Hero",
    skillName: "Protection Skill",
    apiSkillId: 301,
    apiGroupId: 30,
    sourceDataset: "hero-gameplay-normalized.json",
    evidence: [{
      mechanic: "CONTROL_IMMUNITY",
      polarity: "PROTECTED",
      evidenceText: "Control Immunity",
      start: 0,
      end: 16,
      verificationStatus: "UNVERIFIED",
    }],
    verificationStatus: "UNVERIFIED",
  },
];

function test(name: string, callback: () => void) {
  callback();
  console.log(`PASS ${name}`);
}

test("Hero target wajib diisi", () => {
  assert.throws(() => analyzeCounterAgainstHero(" ", records));
});

test("Hero target yang tidak ditemukan tidak menghasilkan kandidat", () => {
  const result = analyzeCounterAgainstHero("Unknown Hero", records);
  assert.equal(result.threats.length, 0);
  assert.equal(result.candidates.length, 0);
});

test("Ancaman mobilitas target berhasil ditemukan", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  assert.equal(result.threats.length, 1);
  assert.equal(result.threats[0].mechanic, "DASH");
});

test("Kontrol terhadap mobilitas menghasilkan kandidat potensial", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  assert.ok(
    result.candidates.some(
      (candidate) =>
        candidate.counterHero === "Control Hero" &&
        candidate.ruleId === "MOBILITY_CONTROL",
    ),
  );
});

test("Hero target tidak pernah direkomendasikan sebagai counter dirinya sendiri", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  assert.ok(
    result.candidates.every(
      (candidate) => candidate.counterHero !== "Target Hero",
    ),
  );
});

test("Semua kandidat tetap POTENTIAL dan UNVERIFIED", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  assert.ok(
    result.candidates.every(
      (candidate) =>
        candidate.confidence === "POTENTIAL" &&
        candidate.verificationStatus === "UNVERIFIED",
    ),
  );
});

test("Kandidat menyimpan bukti kedua skill", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  const candidate = result.candidates.find(
    (item) => item.counterHero === "Control Hero",
  );

  assert.ok(candidate);
  assert.equal(candidate.evidencePairs[0].targetApiSkillId, 101);
  assert.equal(candidate.evidencePairs[0].responseApiSkillId, 201);
  assert.equal(candidate.evidencePairs[0].targetEvidence.evidenceText, "dashes forward");
  assert.equal(candidate.evidencePairs[0].responseEvidence.evidenceText, "stuns the enemy");
});

test("Control immunity tidak salah dianggap sebagai efek kontrol ofensif", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  assert.ok(
    result.candidates.every(
      (candidate) => candidate.counterHero !== "Protection Hero",
    ),
  );
});

test("Hasil menyertakan disclaimer verifikasi", () => {
  const result = analyzeCounterAgainstHero("Target Hero", records);
  assert.equal(result.verificationStatus, "UNVERIFIED");
  assert.match(result.disclaimer, /kandidat analisis/i);
});

test("Ancaman damage dan slow menghasilkan kandidat hero counter perlindungan/anti-slow", () => {
  const damageRecords: SkillMechanicEvidence[] = [
    {
      heroName: "Burst Mage",
      skillName: "Shard Burst",
      apiSkillId: 401,
      apiGroupId: 40,
      sourceDataset: "hero-gameplay-normalized.json",
      evidence: [
        {
          mechanic: "MAGIC_DAMAGE",
          polarity: "APPLIED",
          evidenceText: "magic damage",
          start: 0,
          end: 12,
          verificationStatus: "UNVERIFIED",
        },
        {
          mechanic: "APPLY_SLOW",
          polarity: "APPLIED",
          evidenceText: "slows",
          start: 15,
          end: 20,
          verificationStatus: "UNVERIFIED",
        },
      ],
      verificationStatus: "UNVERIFIED",
    },
    {
      heroName: "Shield Tank",
      skillName: "Aegis Guard",
      apiSkillId: 501,
      apiGroupId: 50,
      sourceDataset: "hero-gameplay-normalized.json",
      evidence: [
        {
          mechanic: "SHIELD",
          polarity: "PROTECTED",
          evidenceText: "gains a shield",
          start: 0,
          end: 14,
          verificationStatus: "UNVERIFIED",
        },
      ],
      verificationStatus: "UNVERIFIED",
    },
  ];

  const result = analyzeCounterAgainstHero("Burst Mage", damageRecords);
  assert.ok(
    result.candidates.some(
      (candidate) =>
        candidate.counterHero === "Shield Tank" &&
        candidate.ruleIds.includes("DAMAGE_RESPONSE"),
    ),
  );
});

console.log("\nSemua Counter Engine tests selesai.");