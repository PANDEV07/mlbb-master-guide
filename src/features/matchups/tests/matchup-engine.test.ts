import { analyzeHeroMatchup } from "../engine/matchup-intelligence";
import {
  aggregateMatchups,
} from "../engine/matchup-aggregator";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "../engine/mechanic-extractor";
import {
  findInteractionCandidates,
} from "../engine/interaction-rules";

const datasetPath = "hero-gameplay-normalized.json";

const rawDataset = JSON.parse(
  readFileSync(datasetPath, "utf8"),
) as GameplayCandidateHero[];

const records = extractHeroMechanics(rawDataset);
const candidates = findInteractionCandidates(records);

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("Dataset memuat 133 hero", () => {
  assert.equal(rawDataset.length, 133);
});

test("Extractor menghasilkan 622 mechanic records", () => {
  assert.equal(records.length, 622);
});

test("Seluruh kombinasi hero-group-skill tetap unik", () => {
  const keys = records.map((record) =>
    `${record.heroName}|${record.apiGroupId}|${record.apiSkillId}`,
  );

  assert.equal(new Set(keys).size, records.length);
});

test("Kategori kosong Hanzo tetap UNKNOWN", () => {
  const hanzoSkill = records.find(
    (record) =>
      record.heroName === "Hanzo" &&
      record.skillName === "Ninjutsu Flee: Return",
  );

  assert.ok(hanzoSkill);
  assert.equal(hanzoSkill.categoryStatus, "UNKNOWN");
  assert.deepEqual(hanzoSkill.mechanicCategories, []);
});

test("Semua record berstatus UNVERIFIED", () => {
  assert.ok(
    records.every(
      (record) => record.verificationStatus === "UNVERIFIED",
    ),
  );
});

test("API group ID dipertahankan", () => {
  assert.ok(
    records.every(
      (record) => record.apiGroupId !== undefined &&
        record.apiGroupId !== null,
    ),
  );
});

test("Interaction engine menghasilkan kandidat", () => {
  assert.ok(candidates.length > 0);
});

test("Tidak ada interaksi hero melawan dirinya sendiri", () => {
  assert.ok(
    candidates.every(
      (candidate) => candidate.sourceHero !== candidate.targetHero,
    ),
  );
});

test("Semua kandidat memiliki evidence kategori atau tag", () => {
  assert.ok(
    candidates.every((candidate) =>
      candidate.evidence.sourceCategories.length > 0 ||
      candidate.evidence.targetCategories.length > 0 ||
      candidate.evidence.sourceTags.length > 0 ||
      candidate.evidence.targetTags.length > 0,
    ),
  );
});

test("Semua kandidat tetap UNVERIFIED", () => {
  assert.ok(
    candidates.every(
      (candidate) => candidate.verificationStatus === "UNVERIFIED",
    ),
  );
});

test("Rule Anti-Heal tidak menghasilkan klaim tanpa bukti", () => {
  assert.ok(
    candidates.every(
      (candidate) => candidate.ruleId !== "SUSTAIN_VS_ANTI_HEAL",
    ),
  );
});

const ruleDistribution = candidates.reduce<Record<string, number>>(
  (result, candidate) => {
    result[candidate.ruleId] =
      (result[candidate.ruleId] ?? 0) + 1;
    return result;
  },
  {},
);
const aggregation = aggregateMatchups(candidates);

test("Agregasi menghasilkan matchup hero-level", () => {
  assert.ok(aggregation.matchups.length > 0);
});

test("Tidak ada duplikasi pasangan hero dan rule", () => {
  const keys = aggregation.matchups.map((matchup) =>
    `${matchup.sourceHero}|${matchup.targetHero}|${matchup.ruleId}`,
  );

  assert.equal(new Set(keys).size, keys.length);
});

test("Heuristik Engage Follow-up dikeluarkan dari matchup aktif", () => {
  assert.ok(
    aggregation.matchups.every(
      (matchup) => matchup.ruleId !== "ENGAGE_FOLLOW_UP",
    ),
  );
  assert.ok(aggregation.excludedHeuristics > 0);
});

test("Agregasi mempertahankan pasangan skill pendukung", () => {
  assert.ok(
    aggregation.matchups.every(
      (matchup) =>
        matchup.skillPairCount === matchup.supportingSkillPairs.length,
    ),
  );
});

test("Semua matchup agregat tetap UNVERIFIED", () => {
  assert.ok(
    aggregation.matchups.every(
      (matchup) => matchup.verificationStatus === "UNVERIFIED",
    ),
  );
});

const matchupAnalysis = aggregation.matchups.length > 0
  ? analyzeHeroMatchup(
      aggregation.matchups,
      aggregation.matchups[0].sourceHero,
      aggregation.matchups[0].targetHero,
    )
  : null;

test("Matchup service menghasilkan analisis dua arah", () => {
  assert.ok(matchupAnalysis);
  assert.ok(matchupAnalysis.summary);
});

test("Analisis mempertahankan identitas kedua hero", () => {
  assert.ok(matchupAnalysis);
  assert.notEqual(matchupAnalysis.heroA, matchupAnalysis.heroB);
});

test("Jumlah interaksi dua arah konsisten", () => {
  assert.ok(matchupAnalysis);
  assert.equal(
    matchupAnalysis.summary.aToBInteractions,
    matchupAnalysis.aToB.length,
  );
  assert.equal(
    matchupAnalysis.summary.bToAInteractions,
    matchupAnalysis.bToA.length,
  );
});

test("Analisis tidak mengklaim verifikasi atau win rate", () => {
  assert.ok(matchupAnalysis);
  assert.equal(matchupAnalysis.verificationStatus, "UNVERIFIED");
  assert.ok(matchupAnalysis.disclaimer.length > 0);
});
process.stdout.write("\n=== AGGREGATION SUMMARY ===\n");
process.stdout.write(`Raw candidates: ${candidates.length}\n`);
process.stdout.write(`Aggregated matchups: ${aggregation.matchups.length}\n`);
process.stdout.write(`Excluded heuristic candidates: ${aggregation.excludedHeuristics}\n`);
process.stdout.write("\n=== RULE DISTRIBUTION ===\n");
for (const [rule, count] of Object.entries(ruleDistribution)) {
  process.stdout.write(`${rule}: ${count}\n`);
}
process.stdout.write("\n=== MATCHUP ENGINE SUMMARY ===\n");
process.stdout.write(`Heroes: ${rawDataset.length}\n`);
process.stdout.write(`Mechanic records: ${records.length}\n`);
process.stdout.write(`Interaction candidates: ${candidates.length}\n`);
process.stdout.write("Semua pengujian Matchup Engine selesai.\n");