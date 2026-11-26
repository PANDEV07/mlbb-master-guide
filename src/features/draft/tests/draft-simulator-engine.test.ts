import assert from "node:assert/strict";
import {
  applyDraftSelection,
  auditDraftTeam,
  computeDraftRecommendations,
  createInitialDraftState,
  decodeDraftFromSearchParams,
  encodeDraftToSearchParams,
  getCurrentTurn,
  getDraftSequence,
  MPL_DRAFT_SEQUENCE,
  RANKED_DRAFT_SEQUENCE,
  undoLastSelection,
} from "../engine/draft-simulator-engine";
import type { DraftHeroEntry } from "../types/draft.types";

const SAMPLE_POOL: DraftHeroEntry[] = [
  {
    slug: "fanny",
    name: "Fanny",
    roles: ["Assassin"],
    lanes: ["Jungle"],
    tier: "S",
    metaScore: 88,
    winRate: 0.535,
    pickRate: 0.015,
    banRate: 0.52,
    damageProfile: "Physical",
    hasHardCC: false,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: false,
  },
  {
    slug: "tigreal",
    name: "Tigreal",
    roles: ["Tank"],
    lanes: ["Roam"],
    tier: "A",
    metaScore: 76,
    winRate: 0.525,
    pickRate: 0.02,
    banRate: 0.14,
    damageProfile: "Physical",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: true,
  },
  {
    slug: "zhuxin",
    name: "Zhuxin",
    roles: ["Mage"],
    lanes: ["Mid Lane"],
    tier: "S",
    metaScore: 91,
    winRate: 0.542,
    pickRate: 0.019,
    banRate: 0.61,
    damageProfile: "Magic",
    hasHardCC: true,
    hasMobility: false,
    hasSustain: false,
    hasFrontline: false,
  },
  {
    slug: "yu-zhong",
    name: "Yu Zhong",
    roles: ["Fighter"],
    lanes: ["EXP Lane"],
    tier: "A",
    metaScore: 74,
    winRate: 0.515,
    pickRate: 0.012,
    banRate: 0.08,
    damageProfile: "Physical",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: true,
    hasFrontline: true,
  },
  {
    slug: "claude",
    name: "Claude",
    roles: ["Marksman"],
    lanes: ["Gold Lane"],
    tier: "A",
    metaScore: 73,
    winRate: 0.512,
    pickRate: 0.014,
    banRate: 0.06,
    damageProfile: "Physical",
    hasHardCC: false,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: false,
  },
  {
    slug: "khufra",
    name: "Khufra",
    roles: ["Tank"],
    lanes: ["Roam"],
    tier: "A",
    metaScore: 78,
    winRate: 0.528,
    pickRate: 0.011,
    banRate: 0.12,
    damageProfile: "Physical",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: true,
    hasFrontline: true,
  },
  {
    slug: "pharsa",
    name: "Pharsa",
    roles: ["Mage"],
    lanes: ["Mid Lane"],
    tier: "A",
    metaScore: 75,
    winRate: 0.521,
    pickRate: 0.013,
    banRate: 0.07,
    damageProfile: "Magic",
    hasHardCC: true,
    hasMobility: true,
    hasSustain: false,
    hasFrontline: false,
  },
];

function run() {
  // 1. Verifikasi struktur 20 langkah MPL & Ranked
  assert.equal(MPL_DRAFT_SEQUENCE.length, 20);
  assert.equal(RANKED_DRAFT_SEQUENCE.length, 20);
  assert.equal(getDraftSequence("mpl")[12]?.side, "RED");
  assert.equal(getDraftSequence("mpl")[12]?.action, "BAN");
  assert.equal(getDraftSequence("mpl")[19]?.side, "RED");
  assert.equal(getDraftSequence("mpl")[19]?.action, "PICK");
  assert.equal(getDraftSequence("ranked")[9]?.action, "BAN");
  assert.equal(getDraftSequence("ranked")[10]?.action, "PICK");
  console.log("PASS Urutan 20 langkah Turnamen MPL & Ranked 10-Ban sesuai aturan resmi");

  // 2. Verifikasi applyDraftSelection, pencegahan duplikat, undo, dan URL encode/decode
  let state = createInitialDraftState("mpl");
  state = applyDraftSelection(state, "zhuxin"); // Blue Ban 1
  state = applyDraftSelection(state, "zhuxin"); // Duplikat harus ditolak
  assert.equal(state.history.length, 1);
  assert.equal(state.blueBans[0], "zhuxin");

  state = applyDraftSelection(state, "fanny"); // Red Ban 1
  assert.equal(state.redBans[0], "fanny");
  assert.equal(getCurrentTurn(state)?.index, 2);

  const encoded = encodeDraftToSearchParams(state);
  const validSlugs = new Set(SAMPLE_POOL.map((h) => h.slug));
  const decoded = decodeDraftFromSearchParams(`?${encoded}`, validSlugs);
  assert.ok(decoded);
  assert.deepEqual(decoded.history, ["zhuxin", "fanny"]);
  assert.equal(decoded.blueBans[0], "zhuxin");
  assert.equal(decoded.redBans[0], "fanny");

  const undone = undoLastSelection(state);
  assert.equal(undone.history.length, 1);
  assert.equal(undone.redBans[0], null);
  console.log("PASS Seleksi, pencegahan duplikat, Undo, dan serialisasi URL akurat");

  // 3. Verifikasi rekomendasi Ban memprioritaskan Ban Rate tinggi
  const banRecs = computeDraftRecommendations({
    state: createInitialDraftState("mpl"),
    heroPool: SAMPLE_POOL,
    limit: 3,
  });
  assert.equal(banRecs[0]?.hero.slug, "zhuxin");
  assert.equal(banRecs[1]?.hero.slug, "fanny");
  console.log("PASS Rekomendasi Ban memprioritaskan hero Ban Rate & Tier S tertinggi");

  // 4. Verifikasi audit tim & rekomendasi Pick menutup celah Magic Damage & lane kosong
  const blueAudit = auditDraftTeam([
    SAMPLE_POOL[3]!, // Yu Zhong (EXP, Physical)
    SAMPLE_POOL[4]!, // Claude (Gold, Physical)
    SAMPLE_POOL[1]!, // Tigreal (Roam, Physical)
  ]);
  assert.ok(
    blueAudit.warnings.some((w) => w.includes("Magic Damage")),
    "Harus mendeteksi tim tanpa Magic Damage",
  );
  assert.ok(blueAudit.missingLanes.includes("Mid Lane"));
  assert.ok(blueAudit.missingLanes.includes("Jungle"));
  console.log("PASS Audit tim live mendeteksi celah Magic Damage dan lane kosong");

  console.log("\nSemua pengujian Live Draft Simulator selesai.");
}

run();
