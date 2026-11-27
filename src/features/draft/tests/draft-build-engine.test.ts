import assert from "node:assert/strict";
import {
  analyzeEnemyThreats,
  buildAdaptiveHeroItems,
  buildSidePostDraftPlan,
  type HeroCoreTemplateInput,
} from "../engine/draft-build-engine";
import type { DraftHeroEntry } from "../types/draft.types";
import type { VerifiedItemMeta } from "../types/draft-build.types";
import itemIdentitiesRaw from "@/data/imports/item-identities.json";

const itemBySlug = new Map<string, VerifiedItemMeta>(
  (
    itemIdentitiesRaw as {
      items: Array<{
        name: string;
        slug: string;
        category: string;
        tier: string;
        iconUrl: string | null;
      }>;
    }
  ).items.map((i) => [
    i.slug.toLowerCase(),
    {
      slug: i.slug.toLowerCase(),
      name: i.name,
      category: i.category,
      tier: i.tier,
      iconUrl: i.iconUrl,
    },
  ]),
);

const BLUE_HEROES: DraftHeroEntry[] = [
  {
    slug: "claude",
    name: "Claude",
    roles: ["Marksman"],
    lanes: ["Gold Lane"],
    tier: "B",
    metaScore: 55,
    winRate: 0.49,
    pickRate: 0.01,
    banRate: 0.03,
    damageProfile: "Physical",
    hasHardCC: false,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: false,
  },
  {
    slug: "zhuxin",
    name: "Zhuxin",
    roles: ["Mage"],
    lanes: ["Mid Lane"],
    tier: "B",
    metaScore: 60,
    winRate: 0.5,
    pickRate: 0.01,
    banRate: 0.2,
    damageProfile: "Magic",
    hasHardCC: true,
    hasMobility: false,
    hasSustain: false,
    hasFrontline: false,
  },
  {
    slug: "belerick",
    name: "Belerick",
    roles: ["Tank"],
    lanes: ["Roam"],
    tier: "S",
    metaScore: 78,
    winRate: 0.54,
    pickRate: 0.01,
    banRate: 0.08,
    damageProfile: "Magic",
    hasHardCC: true,
    hasMobility: false,
    hasSustain: true,
    hasFrontline: true,
  },
];

// Musuh dengan banyak Sustain/Heal, Tank, Magic, dan Physical Burst + Hard CC
const RED_ENEMIES: DraftHeroEntry[] = [
  {
    slug: "atlas",
    name: "Atlas",
    roles: ["Tank"],
    lanes: ["Roam"],
    tier: "B",
    metaScore: 58,
    winRate: 0.5,
    pickRate: 0.01,
    banRate: 0.05,
    damageProfile: "Magic",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: true,
  },
  {
    slug: "faramis",
    name: "Faramis",
    roles: ["Support", "Mage"],
    lanes: ["Mid Lane"],
    tier: "B",
    metaScore: 56,
    winRate: 0.51,
    pickRate: 0.01,
    banRate: 0.05,
    damageProfile: "Magic",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: true,
    hasFrontline: false,
  },
  {
    slug: "leomord",
    name: "Leomord",
    roles: ["Fighter"],
    lanes: ["Jungle"],
    tier: "B",
    metaScore: 60,
    winRate: 0.51,
    pickRate: 0.01,
    banRate: 0.05,
    damageProfile: "Physical",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: true,
    hasFrontline: true,
  },
  {
    slug: "lukas",
    name: "Lukas",
    roles: ["Fighter"],
    lanes: ["EXP Lane"],
    tier: "A",
    metaScore: 70,
    winRate: 0.51,
    pickRate: 0.01,
    banRate: 0.28,
    damageProfile: "Physical",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: true,
    hasFrontline: true,
  },
  {
    slug: "obsidia",
    name: "Obsidia",
    roles: ["Marksman"],
    lanes: ["Gold Lane"],
    tier: "S",
    metaScore: 85,
    winRate: 0.53,
    pickRate: 0.02,
    banRate: 0.3,
    damageProfile: "Physical",
    hasHardCC: false,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: false,
  },
];

function run() {
  const threats = analyzeEnemyThreats(RED_ENEMIES);
  assert.ok(threats.hardCCThreats.length >= 4);
  assert.ok(threats.sustainHealThreats.length >= 3);
  assert.ok(threats.tankFrontlineThreats.length >= 3);
  assert.ok(threats.magicThreats.length >= 2);
  console.log("PASS analyzeEnemyThreats memetakan ancaman Magic, Physical, Sustain, Tank, dan Hard CC");

  // 1. Marksman (Claude) menghadapi 3 Sustain + 2 Physical Burst + 4 Hard CC
  const claudePlan = buildAdaptiveHeroItems({
    hero: BLUE_HEROES[0]!,
    assignedLane: "Gold Lane",
    enemies: RED_ENEMIES,
    coreTemplate: {
      templateName: "Gold Lane DPS",
      itemNames: [
        "Swift Boots",
        "Corrosion Scythe",
        "Demon Hunter Sword",
        "Golden Staff",
        "Blade of Despair",
        "Malefic Roar",
      ],
    },
    itemBySlug,
  });

  assert.equal(claudePlan.items.length, 6);
  const claudeSlugs = claudePlan.items.map((i) => i.slug);
  assert.equal(new Set(claudeSlugs).size, 6, "Semua 6 item harus unik");
  assert.equal(claudeSlugs[0], "tough-boots", "Harus adaptasi ke Tough Boots vs 4 Hard CC");
  assert.ok(
    claudeSlugs.includes("sea-halberd") || claudeSlugs.includes("wind-of-nature"),
    "Marksman harus mendapat Sea Halberd (Anti-Heal) atau Wind of Nature (Anti-Phys Burst)",
  );
  assert.ok(
    claudePlan.workbenchUrl.startsWith("/builds/claude?items="),
    "URL workbench harus memuat 6 item adaptif",
  );
  console.log("PASS Marksman (Claude) mendapat Tough Boots + item counter spesifik musuh tanpa duplikasi");

  // 2. Mage (Zhuxin) harus mendapat Glowing Wand (Anti-Heal Magic) & Divine Glaive / Winter Crown
  const zhuxinPlan = buildAdaptiveHeroItems({
    hero: BLUE_HEROES[1]!,
    assignedLane: "Mid Lane",
    enemies: RED_ENEMIES,
    coreTemplate: {
      templateName: "Mid Control",
      itemNames: [
        "Arcane Boots",
        "Clock of Destiny",
        "Ice Queen Wand",
        "Holy Crystal",
        "Blood Wings",
        "Lightning Truncheon",
      ],
    },
    itemBySlug,
  });
  const zhuxinSlugs = zhuxinPlan.items.map((i) => i.slug);
  assert.equal(new Set(zhuxinSlugs).size, 6);
  assert.ok(
    zhuxinSlugs.includes("glowing-wand"),
    "Mage harus menyertakan Glowing Wand (Anti-Heal Magic) melawan 3 musuh Sustain",
  );
  console.log("PASS Mage (Zhuxin) otomatis menambahkan Glowing Wand melawan tim Sustain/Heal");

  // 3. Tank (Belerick) harus mendapat Dominance Ice + Athena's Shield / Antique Cuirass
  const belerickPlan = buildAdaptiveHeroItems({
    hero: BLUE_HEROES[2]!,
    assignedLane: "Roam",
    enemies: RED_ENEMIES,
    coreTemplate: null, // Uji fallback archetype juga
    itemBySlug,
  });
  const belerickSlugs = belerickPlan.items.map((i) => i.slug);
  assert.equal(new Set(belerickSlugs).size, 6);
  assert.ok(belerickSlugs.includes("dominance-ice"));
  assert.ok(belerickSlugs.includes("athenas-shield"));
  console.log("PASS Tank (Belerick) menyertakan Dominance Ice & Athena's Shield");

  // 4. Side plan penuh memetakan seluruh hero terurut sesuai lane
  const sidePlan = buildSidePostDraftPlan({
    side: "BLUE",
    allies: BLUE_HEROES,
    enemies: RED_ENEMIES,
    templateByHeroSlug: new Map<string, HeroCoreTemplateInput>(),
    itemBySlug,
  });
  assert.equal(sidePlan.heroes.length, 3);
  console.log("PASS buildSidePostDraftPlan memetakan seluruh hero tim dengan sukses");

  console.log("\nSemua pengujian Post-Draft Adaptive Counter Build selesai.");
}

run();
