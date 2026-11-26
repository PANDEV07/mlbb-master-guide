import assert from "node:assert/strict";
import {
  getHeroComboCollection,
  getHeroSkillGroupsForDisplay,
} from "../data/hero-combos";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("Kombo Aamon terpetakan ke nama skill nyata dan Basic Attack", () => {
  const collection = getHeroComboCollection("aamon", "Aamon");
  assert.ok(collection, "Kombo Aamon harus tersedia");
  assert.equal(collection.combos.length, 2);
  assert.equal(collection.skillUpgradePriority, "3-1-2");
  assert.equal(collection.verificationStatus, "UNVERIFIED");

  const teamfight = collection.combos.find((c) => c.type === "teamfight");
  assert.ok(teamfight);
  assert.equal(teamfight.steps[0].skillName, "Slayer Shards");
  assert.equal(teamfight.steps[0].slotLabel, "Skill 2");
  assert.equal(teamfight.steps[1].skillName, "Basic Attack");
  assert.equal(teamfight.steps[2].skillName, "Soul Shards");
  assert.equal(teamfight.steps[4].skillName, "Endless Shards");
  assert.equal(teamfight.steps[4].slotLabel, "Ultimate");
});

test("Skill display groups memuat ikon, deskripsi Bahasa Indonesia, dan slotLabel", () => {
  const groups = getHeroSkillGroupsForDisplay("Aamon");
  assert.ok(groups.length >= 1);
  assert.equal(groups[0].skills.length, 4);
  assert.equal(groups[0].skills[0].slotLabel, "Pasif");
  assert.equal(groups[0].skills[1].slotLabel, "Skill 1");
  assert.equal(groups[0].skills[2].slotLabel, "Skill 2");
  assert.equal(groups[0].skills[3].slotLabel, "Ultimate");
  assert.match(
    groups[0].skills[0].description,
    /Setiap kali Aamon|lawan|skill/i,
  );
});

process.stdout.write("\nSemua pengujian Kombo & Skill Hero selesai.\n");
