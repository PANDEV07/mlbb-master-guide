import assert from "node:assert/strict";
import { analyzeCounterFromCandidateDataset } from "../server/counter-analysis.service";
import {
  aggregateMultiEnemyCounters,
  counterSlugify,
} from "../engine/multi-enemy-counter";
import type { ItemCounterAnalysis } from "../engine/item-counter-engine";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("counterSlugify menormalisasi nama hero khusus MLBB", () => {
  assert.equal(counterSlugify("Chang'e"), "change");
  assert.equal(counterSlugify("X.Borg"), "xborg");
  assert.equal(counterSlugify("Yi Sun-shin"), "yi-sun-shin");
});

test("Agregasi 1 musuh (Fanny) memetakan ancaman, ranking counter, dan penanda Satu Lane", () => {
  const fannyHero = analyzeCounterFromCandidateDataset("Fanny").analysis;
  const emptyItems: ItemCounterAnalysis = {
    targetHero: "Fanny",
    threats: [],
    candidates: [],
    verificationStatus: "UNVERIFIED",
    disclaimer: "test",
  };

  const summary = aggregateMultiEnemyCounters([fannyHero], [emptyItems]);
  assert.equal(summary.targets.length, 1);
  assert.equal(summary.targets[0].heroName, "Fanny");
  assert.ok(summary.threatGroups.length > 0);
  assert.ok(summary.heroCounters.length > 0);
  assert.ok(
    summary.heroCounters.every((c) => c.counterHero.toLowerCase() !== "fanny"),
    "Hero target tidak boleh muncul sebagai counter dirinya sendiri",
  );
  assert.ok(
    summary.heroCounters.some((c) => c.sameLaneAsTargets.includes("Fanny")),
    "Harus menandai hero counter yang berbagi lane Jungle dengan Fanny",
  );
  assert.equal(summary.verificationStatus, "UNVERIFIED");
});

test("Agregasi multi-musuh (Fanny, Estes, Tigreal) memeringkat counter multi-target dan deduplikasi item", () => {
  const targets = ["Fanny", "Estes", "Tigreal"];
  const heroAnalyses = targets.map(
    (name) => analyzeCounterFromCandidateDataset(name).analysis,
  );

  const mockItemAnalyses: ItemCounterAnalysis[] = [
    {
      targetHero: "Fanny",
      threats: [],
      candidates: [
        {
          id: "fanny|antique-cuirass",
          targetHero: "Fanny",
          itemName: "Antique Cuirass",
          itemSlug: "antique-cuirass",
          itemIconUrl: null,
          itemCategory: "Defense",
          ruleId: "DAMAGE_RESPONSE",
          ruleIds: ["DAMAGE_RESPONSE"],
          explanation: "Mengurangi physical damage.",
          evidencePairs: [],
          conditionsToCheck: ["Periksa tipe damage"],
          confidence: "POTENTIAL",
          verificationStatus: "UNVERIFIED",
        },
      ],
      verificationStatus: "UNVERIFIED",
      disclaimer: "test",
    },
    {
      targetHero: "Tigreal",
      threats: [],
      candidates: [
        {
          id: "tigreal|antique-cuirass",
          targetHero: "Tigreal",
          itemName: "Antique Cuirass",
          itemSlug: "antique-cuirass",
          itemIconUrl: null,
          itemCategory: "Defense",
          ruleId: "DAMAGE_RESPONSE",
          ruleIds: ["DAMAGE_RESPONSE"],
          explanation: "Mengurangi physical damage.",
          evidencePairs: [],
          conditionsToCheck: ["Periksa tipe damage"],
          confidence: "POTENTIAL",
          verificationStatus: "UNVERIFIED",
        },
      ],
      verificationStatus: "UNVERIFIED",
      disclaimer: "test",
    },
  ];

  const summary = aggregateMultiEnemyCounters(heroAnalyses, mockItemAnalyses);
  assert.equal(summary.targets.length, 3);
  assert.ok(
    summary.heroCounters.every(
      (c) => !targets.map((t) => t.toLowerCase()).includes(c.counterHero.toLowerCase()),
    ),
    "Ketiga hero target tidak boleh muncul sebagai kandidat counter",
  );
  assert.ok(
    summary.heroCounters[0].counteredEnemies.length >= 2,
    "Peringkat teratas harus menangkal beberapa hero musuh sekaligus",
  );
  assert.equal(
    summary.itemCounters.length,
    1,
    "Item yang sama di beberapa musuh harus terdeduplikasi menjadi 1 kartu",
  );
  assert.deepEqual(
    summary.itemCounters[0].counteredEnemies.sort(),
    ["Fanny", "Tigreal"],
  );
  assert.ok(
    summary.tacticalBrief.length >= 2,
    "Panduan taktis otomatis harus mendeteksi beberapa kategori ancaman",
  );
});

process.stdout.write("\nSemua pengujian Multi-Enemy Counter selesai.\n");
