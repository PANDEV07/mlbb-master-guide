import assert from "node:assert/strict";
import {
  buildProfileSchema,
} from "../schemas/build.schema";
import {
  evaluateBuildPublishing,
} from "../server/build.publishing-guard";
import {
  composeThreeBuildTemplates,
  mapHeroBuildToTemplate,
  mapProMatchBuildToTemplate,
  templateToDraftSlots,
} from "../utils/template-mapper";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
];


const validProfile = {
  schemaVersion: 1 as const,
  name: "Build Uji",
  description: "Profil build untuk pengujian otomatis.",
  role: "Fighter",
  lane: "EXP Lane",
  itemSlots: ids.map((id, index) => ({
    position: index + 1,
    itemEntityId: id,
    required: index < 3,
    alternativeItemEntityIds: [],
    rationale: "Referensi pengujian.",
  })),
  emblemId: null,
  emblemTalentIds: [],
  battleSpellId: null,
  conditions: [],
};

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("Profil build valid diterima", () => {
  const parsed = buildProfileSchema.safeParse(validProfile);
  if (!parsed.success) {
    console.log("DETAIL ERROR ZOD:", parsed.error.issues);
  }
  assert.equal(parsed.success, true);
});

test("Posisi slot duplikat ditolak", () => {
  const invalid = {
    ...validProfile,
    itemSlots: validProfile.itemSlots.map((slot) => ({
      ...slot,
      position: 1,
    })),
  };

  assert.equal(buildProfileSchema.safeParse(invalid).success, false);
});

test("Profil dengan jumlah slot bukan enam ditolak", () => {
  const invalid = {
    ...validProfile,
    itemSlots: validProfile.itemSlots.slice(0, 5),
  };

  assert.equal(buildProfileSchema.safeParse(invalid).success, false);
});

test("Build tanpa evidence tidak boleh dipublikasikan", () => {
  const result = evaluateBuildPublishing(
    validProfile,
    "VERIFIED",
    [],
  );

  assert.equal(result.allowed, false);
  assert.ok(result.errors.length > 0);
});

test("Evidence belum VERIFIED menggagalkan publikasi", () => {
  const result = evaluateBuildPublishing(
    validProfile,
    "VERIFIED",
    [{
      verificationStatus: "UNVERIFIED",
      sourceUrl: "https://example.com/source",
      claimClassification: "SECONDARY_SOURCE",
    }],
  );

  assert.equal(result.allowed, false);
});

test("Evidence tanpa URL menggagalkan publikasi", () => {
  const result = evaluateBuildPublishing(
    validProfile,
    "VERIFIED",
    [{
      verificationStatus: "VERIFIED",
      sourceUrl: null,
      claimClassification: "OFFICIAL_FACT",
    }],
  );

  assert.equal(result.allowed, false);
});

test("Build dengan evidence VERIFIED dan URL dapat lolos", () => {
  const result = evaluateBuildPublishing(
    validProfile,
    "VERIFIED",
    [{
      verificationStatus: "VERIFIED",
      sourceUrl: "https://example.com/source",
      claimClassification: "OFFICIAL_FACT",
    }],
  );

  assert.equal(result.allowed, true);
  assert.equal(result.errors.length, 0);
});

test("Build dengan status UNVERIFIED tidak boleh dipublikasikan", () => {
  const result = evaluateBuildPublishing(
    validProfile,
    "UNVERIFIED",
    [{
      verificationStatus: "VERIFIED",
      sourceUrl: "https://example.com/source",
      claimClassification: "OFFICIAL_FACT",
    }],
  );

  assert.equal(result.allowed, false);
});

test("Komposisi 3 Template Build mengisi sisa slot dengan template kosong tanpa data palsu", () => {
  const emptyOnly = composeThreeBuildTemplates([]);
  assert.equal(emptyOnly.length, 3);
  assert.equal(
    emptyOnly.every((template) => template.sourceKind === "EMPTY_TEMPLATE"),
    true,
  );

  const heroTemplate = mapHeroBuildToTemplate({
    id: ids[0],
    patchVersion: "1.9.32",
    verificationStatus: "VERIFIED",
    profile: validProfile,
    sourceUrl: "https://example.com/build-source",
  });

  const proTemplate = mapProMatchBuildToTemplate({
    id: ids[1],
    playerName: "ProPlayer",
    teamName: "Team A",
    roleLane: "Jungle",
    matchResult: "WIN",
    tournamentName: "Test Tournament",
    stageName: "Playoffs",
    matchDate: "2026-01-10",
    patchVersion: "1.9.32",
    rawPatchVersion: "1.9.32",
    verificationStatus: "PARTIALLY_VERIFIED",
    provider: "liquipedia",
    sourceUrl: "https://liquipedia.net/mobilelegends/Main_Page",
    items: [
      {
        slotOrder: 1,
        rawItemName: "Arcane Boots",
        itemEntityId: ids[0],
        catalogMatchStatus: "MATCHED",
        isVerifiedItem: true,
      },
      {
        slotOrder: 2,
        rawItemName: "Unmatched Raw Item",
        itemEntityId: null,
        catalogMatchStatus: "UNMATCHED",
        isVerifiedItem: false,
      },
    ],
  });

  const mixed = composeThreeBuildTemplates([heroTemplate, proTemplate]);
  assert.equal(mixed.length, 3);
  assert.equal(mixed[0].sourceKind, "HERO_BUILD");
  assert.equal(mixed[1].sourceKind, "PRO_MATCH_BUILD");
  assert.equal(mixed[2].sourceKind, "EMPTY_TEMPLATE");

  const draftSlots = templateToDraftSlots(proTemplate, new Set(ids));
  assert.equal(draftSlots.length, 6);
  assert.equal(draftSlots[0].itemEntityId, ids[0]);
  assert.equal(draftSlots[1].itemEntityId, "");
  assert.match(draftSlots[1].rationale, /Unmatched Raw Item/);
});

process.stdout.write("\nSemua pengujian Build selesai.\n");