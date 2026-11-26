import assert from "node:assert/strict";
import {
  META_ROLES,
  META_TIERS,
  getMetaDashboardPayload,
  groupHeroesByTier,
  percentileToTier,
} from "../index";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("percentileToTier memetakan rentang 0..1 ke S, A, B, C, D secara konsisten", () => {
  assert.equal(percentileToTier(0), "S");
  assert.equal(percentileToTier(0.15), "S");
  assert.equal(percentileToTier(0.25), "A");
  assert.equal(percentileToTier(0.5), "B");
  assert.equal(percentileToTier(0.75), "C");
  assert.equal(percentileToTier(0.95), "D");
});

test("Dataset Moonton GMS memuat 133 hero pada keempat bracket rank", () => {
  const payload = getMetaDashboardPayload();
  assert.equal(payload.sourceTier, "TIER_1_OFFICIAL");

  for (const key of [
    "mythical_glory",
    "mythical_honor",
    "mythic",
    "all_rank",
  ] as const) {
    const bracket = payload.brackets[key];
    assert.equal(bracket.totalHeroes, 133, `Bracket ${key} harus memuat 133 hero`);
    assert.equal(bracket.spotlights.highestWinRate.length, 3);
    assert.equal(bracket.spotlights.mostBanned.length, 3);
    assert.equal(bracket.spotlights.mostPicked.length, 3);
    assert.equal(bracket.spotlights.metaLeaders.length, 3);

    for (const hero of bracket.heroes) {
      assert.ok(hero.winRate >= 0 && hero.winRate <= 1);
      assert.ok(hero.pickRate >= 0 && hero.pickRate <= 1);
      assert.ok(hero.banRate >= 0 && hero.banRate <= 1);
      assert.ok(META_TIERS.includes(hero.tier));
    }
  }
});

test("Setiap Role (Tank..Support) menghasilkan distribusi Tier S sampai D lengkap", () => {
  const payload = getMetaDashboardPayload();
  const mgHeroes = payload.brackets.mythical_glory.heroes;

  for (const role of META_ROLES) {
    const roleHeroes = mgHeroes.filter((h) => h.roles.includes(role));
    assert.ok(roleHeroes.length >= 10, `Role ${role} harus memiliki minimal 10 hero`);

    const grouped = groupHeroesByTier(roleHeroes, true);
    for (const tier of META_TIERS) {
      assert.ok(
        grouped[tier].length >= 1,
        `Role ${role} harus memiliki hero di Tier ${tier}`,
      );
    }
  }
});

process.stdout.write("\nSemua pengujian Meta Dashboard & Tier List S–D selesai.\n");
