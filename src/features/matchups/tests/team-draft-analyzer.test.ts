import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { GameplayCandidateHero } from "../engine/mechanic-extractor";
import { extractMechanicEvidence } from "../engine/mechanic-evidence-extractor";
import {
  aggregateEnemyThreats,
  auditTeamComposition,
  buildAllySlotSuggestions,
  buildDynamicPhaseChecklists,
  buildHeroMechanicProfile,
  buildLaneMatchupSummaries,
  toHeroSlug,
} from "../engine/team-draft-analyzer";
import type { TeamSlotInput } from "../types/matchup-hub.types";

const rawDataset = JSON.parse(
  readFileSync("hero-gameplay-normalized.json", "utf8"),
) as GameplayCandidateHero[];

const heroMap = new Map(
  rawDataset.map((hero) => [hero.heroName.toLowerCase(), hero]),
);

function mustGetHero(name: string): GameplayCandidateHero {
  const hero = heroMap.get(name.toLowerCase());
  assert.ok(hero, `Hero ${name} harus ada di dataset`);
  return hero;
}

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("toHeroSlug menormalisasi karakter khusus hero MLBB", () => {
  assert.equal(toHeroSlug("Chang'e"), "change");
  assert.equal(toHeroSlug("X.Borg"), "xborg");
  assert.equal(toHeroSlug("Yi Sun-shin"), "yi-sun-shin");
  assert.equal(toHeroSlug("Yu Zhong"), "yu-zhong");
});

test("buildHeroMechanicProfile memetakan dimensi mekanik dan tipe damage nyata", () => {
  const khufra = buildHeroMechanicProfile(mustGetHero("Khufra"));
  assert.equal(khufra.heroSlug, "khufra");
  assert.ok(khufra.roles.includes("Tank"));
  assert.ok(khufra.lanes.includes("Roam"));
  assert.ok(khufra.hardControlCount > 0, "Khufra harus memiliki bukti Hard CC");
  assert.equal(khufra.verificationStatus, "UNVERIFIED");

  const aamon = buildHeroMechanicProfile(mustGetHero("Aamon"));
  assert.equal(aamon.damageProfile, "Magic");
  assert.ok(aamon.dimensionCounts.DAMAGE > 0);
});

test("buildDynamicPhaseChecklists menghasilkan 3 fase taktis berbasis mekanik", () => {
  const fanny = buildHeroMechanicProfile(mustGetHero("Fanny"));
  const khufra = buildHeroMechanicProfile(mustGetHero("Khufra"));
  const checklists = buildDynamicPhaseChecklists(fanny, khufra, []);

  assert.equal(checklists.length, 3);
  assert.equal(checklists[0].phase, "early");
  assert.equal(checklists[1].phase, "mid");
  assert.equal(checklists[2].phase, "late");
  assert.match(checklists[0].focusForA, /Hard CC/i);
});

test("auditTeamComposition mendeteksi celah damage tunggal dan kelengkapan 6 pilar", () => {
  const allPhysical = [
    buildHeroMechanicProfile(mustGetHero("Miya")),
    buildHeroMechanicProfile(mustGetHero("Layla")),
    buildHeroMechanicProfile(mustGetHero("Clint")),
  ];
  const audit = auditTeamComposition("ALLY", allPhysical);
  assert.equal(audit.filledSlots, 3);
  assert.equal(audit.pillars.length, 6);
  const damagePillar = audit.pillars.find((p) => p.id === "DAMAGE_BALANCE");
  assert.equal(damagePillar?.status, "MISSING");
  assert.ok(audit.warnings.length > 0);

  const balancedTeam = [
    buildHeroMechanicProfile(mustGetHero("Yu Zhong")),
    buildHeroMechanicProfile(mustGetHero("Fanny")),
    buildHeroMechanicProfile(mustGetHero("Luo Yi")),
    buildHeroMechanicProfile(mustGetHero("Claude")),
    buildHeroMechanicProfile(mustGetHero("Tigreal")),
  ];
  const balancedAudit = auditTeamComposition("ALLY", balancedTeam);
  assert.equal(balancedAudit.filledSlots, 5);
  assert.equal(
    balancedAudit.pillars.find((p) => p.id === "DAMAGE_BALANCE")?.status,
    "STRONG",
  );
  assert.equal(
    balancedAudit.pillars.find((p) => p.id === "FRONTLINE")?.status,
    "STRONG",
  );
});

test("buildLaneMatchupSummaries dan aggregateEnemyThreats memetakan 5 lane & ancaman musuh", () => {
  const allySlots: TeamSlotInput[] = [
    { lane: "EXP Lane", heroName: "Yu Zhong" },
    { lane: "Jungle", heroName: "Fanny" },
    { lane: "Mid Lane", heroName: "Luo Yi" },
    { lane: "Gold Lane", heroName: "Claude" },
    { lane: "Roam", heroName: null },
  ];
  const enemySlots: TeamSlotInput[] = [
    { lane: "EXP Lane", heroName: "Terizla" },
    { lane: "Jungle", heroName: "Fredrinn" },
    { lane: "Mid Lane", heroName: "Pharsa" },
    { lane: "Gold Lane", heroName: "Lesley" },
    { lane: "Roam", heroName: "Khufra" },
  ];

  const profileMap = new Map(
    rawDataset.map((h) => [
      h.heroName.toLowerCase(),
      buildHeroMechanicProfile(h),
    ]),
  );

  const lanes = buildLaneMatchupSummaries(
    allySlots,
    enemySlots,
    heroMap,
    profileMap,
  );
  assert.equal(lanes.length, 5);
  assert.equal(lanes[0].lane, "EXP Lane");
  assert.equal(lanes[0].allyHero?.heroName, "Yu Zhong");
  assert.equal(lanes[0].enemyHero?.heroName, "Terizla");
  assert.equal(lanes[4].allyHero, null);
  assert.equal(lanes[4].enemyHero?.heroName, "Khufra");

  const enemyHeroes = enemySlots
    .map((s) => mustGetHero(s.heroName!));
  const threats = aggregateEnemyThreats(enemyHeroes);
  assert.ok(threats.length > 0);
  assert.ok(threats.every((t) => t.heroNames.length > 0));

  const allEvidence = rawDataset.flatMap((hero) =>
    hero.skillGroups.flatMap((group) =>
      group.skills.map((skill) => ({
        heroName: hero.heroName,
        skillName: skill.name,
        apiSkillId: skill.apiSkillId ?? null,
        apiGroupId: skill.apiGroupId ?? group.apiGroupId,
        sourceDataset: "hero-gameplay-normalized.json" as const,
        evidence: extractMechanicEvidence(skill.description ?? ""),
        verificationStatus: "UNVERIFIED" as const,
      })),
    ),
  );

  const allyProfiles = allySlots
    .filter((s) => s.heroName)
    .map((s) => profileMap.get(s.heroName!.toLowerCase())!);
  const enemyProfiles = enemySlots
    .filter((s) => s.heroName)
    .map((s) => profileMap.get(s.heroName!.toLowerCase())!);

  const suggestions = buildAllySlotSuggestions(
    allySlots,
    enemyProfiles,
    auditTeamComposition("ALLY", allyProfiles),
    rawDataset,
    allEvidence,
  );

  assert.ok(suggestions.length > 0, "Slot Roam kosong harus menghasilkan saran hero");
  assert.ok(suggestions.every((s) => s.lane === "Roam"));
  assert.ok(suggestions.every((s) => s.verificationStatus === "UNVERIFIED"));
});

process.stdout.write("\nSemua pengujian Team Draft & Matchup Hub selesai.\n");
