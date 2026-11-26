import assert from "node:assert/strict";
import { getTableName, isTable } from "drizzle-orm";
import {
  proMatchBuildItems,
  proMatchPlayerBuilds,
  proMatchSources,
  proMatches,
} from "@/lib/db/schema";
import {
  buildProMatchItemRecord,
  proMatchBuildItemSchema,
  proMatchPlayerBuildSchema,
  proMatchSchema,
  proMatchSourceSchema,
} from "../schemas/pro-build-pipeline.schema";
import { proBuildImportFileSchema } from "../schemas/pro-build-import.schema";
import { resolveProBuildImportCatalog } from "../server/pro-build-import.resolver";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

const samplePatchId = "11111111-1111-4111-8111-111111111111";
const sampleHeroId = "22222222-2222-4222-8222-222222222222";
const sampleItemId = "33333333-3333-4333-8333-333333333333";

test("Keempat tabel Drizzle Pro Player Build Pipeline v1 terekspor dengan nama tepat", () => {
  assert.equal(isTable(proMatches), true);
  assert.equal(isTable(proMatchPlayerBuilds), true);
  assert.equal(isTable(proMatchBuildItems), true);
  assert.equal(isTable(proMatchSources), true);

  assert.equal(getTableName(proMatches), "pro_matches");
  assert.equal(getTableName(proMatchPlayerBuilds), "pro_match_player_builds");
  assert.equal(getTableName(proMatchBuildItems), "pro_match_build_items");
  assert.equal(getTableName(proMatchSources), "pro_match_sources");
});

test("Item mentah tanpa kecocokan katalog dapat disimpan sebagai UNMATCHED & UNVERIFIED", () => {
  const item = buildProMatchItemRecord({
    slotOrder: 1,
    rawItemName: "Unknown Boot Variant",
    itemEntityId: null,
    verified: true,
  });

  assert.equal(item.rawItemName, "Unknown Boot Variant");
  assert.equal(item.itemEntityId, null);
  assert.equal(item.catalogMatchStatus, "UNMATCHED");
  assert.equal(item.verificationStatus, "UNVERIFIED");
  assert.equal(item.isVerifiedItem, false);
});

test("Item tanpa itemEntityId ditolak jika ditandai VERIFIED atau MATCHED", () => {
  const markedVerified = proMatchBuildItemSchema.safeParse({
    slotOrder: 2,
    rawItemName: "BOD",
    itemEntityId: null,
    catalogMatchStatus: "UNMATCHED",
    verificationStatus: "VERIFIED",
    isVerifiedItem: true,
  });
  assert.equal(markedVerified.success, false);

  const markedPartiallyVerified = proMatchBuildItemSchema.safeParse({
    slotOrder: 2,
    rawItemName: "BOD",
    itemEntityId: null,
    catalogMatchStatus: "UNMATCHED",
    verificationStatus: "PARTIALLY_VERIFIED",
    isVerifiedItem: false,
  });
  assert.equal(markedPartiallyVerified.success, false);

  const markedMatched = proMatchBuildItemSchema.safeParse({
    slotOrder: 2,
    rawItemName: "BOD",
    itemEntityId: null,
    catalogMatchStatus: "MATCHED",
    verificationStatus: "UNVERIFIED",
    isVerifiedItem: false,
  });
  assert.equal(markedMatched.success, false);
});

test("Item yang cocok dengan katalog dapat berstatus MATCHED dan VERIFIED", () => {
  const item = buildProMatchItemRecord({
    slotOrder: 3,
    rawItemName: "Blade of Despair",
    itemEntityId: sampleItemId,
    verified: true,
  });

  assert.equal(item.itemEntityId, sampleItemId);
  assert.equal(item.catalogMatchStatus, "MATCHED");
  assert.equal(item.verificationStatus, "VERIFIED");
  assert.equal(item.isVerifiedItem, true);
});

test("Build pemain menerima kombinasi item terverifikasi dan item mentah serta menolak slot duplikat", () => {
  const validBuild = proMatchPlayerBuildSchema.safeParse({
    playerName: "Skylar",
    teamName: "RRQ Hoshi",
    teamSide: "BLUE",
    roleLane: "Gold Lane",
    heroEntityId: sampleHeroId,
    rawHeroName: "Beatrix",
    rawBattleSpellName: "Flicker",
    rawEmblemName: "Assassin",
    rawEmblemTalents: ["Thrill", "Weapons Master", "Quantum Charge"],
    matchResult: "WIN",
    kills: 6,
    deaths: 1,
    assists: 4,
    verificationStatus: "PARTIALLY_VERIFIED",
    items: [1, 2, 3, 4, 5, 6].map((slot) =>
      buildProMatchItemRecord({
        slotOrder: slot,
        rawItemName: slot === 6 ? "Unmatched Custom Item" : `Item ${slot}`,
        itemEntityId: slot === 6 ? null : sampleItemId,
        verified: slot !== 6,
      }),
    ),
  });
  assert.equal(validBuild.success, true);

  const duplicateSlot = proMatchPlayerBuildSchema.safeParse({
    playerName: "Skylar",
    teamName: "RRQ Hoshi",
    rawHeroName: "Beatrix",
    items: [
      buildProMatchItemRecord({ slotOrder: 1, rawItemName: "Item A" }),
      buildProMatchItemRecord({ slotOrder: 1, rawItemName: "Item B" }),
    ],
  });
  assert.equal(duplicateSlot.success, false);
});

test("Pertandingan dan sumber pro memvalidasi aturan tim, patch, dan URL", () => {
  const validMatch = proMatchSchema.safeParse({
    tournamentName: "MPL Indonesia Season 14",
    stageName: "Playoffs",
    gameNumber: 1,
    teamAName: "RRQ Hoshi",
    teamBName: "Team Liquid ID",
    winnerTeamName: "RRQ Hoshi",
    matchDate: "2024-10-25",
    patchVersionId: samplePatchId,
    verificationStatus: "VERIFIED",
  });
  assert.equal(validMatch.success, true);

  const verifiedMatchWithoutPatch = proMatchSchema.safeParse({
    tournamentName: "MPL Indonesia Season 14",
    teamAName: "RRQ Hoshi",
    teamBName: "Team Liquid ID",
    verificationStatus: "VERIFIED",
  });
  assert.equal(verifiedMatchWithoutPatch.success, false);

  const validSource = proMatchSourceSchema.safeParse({
    provider: "liquipedia",
    sourceUrl: "https://liquipedia.net/mobilelegends/MPL/Indonesia/Season_14",
    sourceTier: "TIER_2_SECONDARY",
    verificationStatus: "UNVERIFIED",
  });
  assert.equal(validSource.success, true);
});

test("Resolver impor mencocokkan katalog dan memaksa item mentah tetap UNVERIFIED", () => {
  const parsed = proBuildImportFileSchema.parse({
    schemaVersion: 1,
    matches: [
      {
        tournamentName: "MPL Indonesia",
        teamAName: "Team A",
        teamBName: "Team B",
        winnerTeamName: "Team A",
        matchDate: "2026-01-15",
        rawPatchVersion: "1.9.32",
        verificationStatus: "VERIFIED",
        sources: [
          {
            provider: "liquipedia",
            sourceUrl: "https://liquipedia.net/mobilelegends/Main_Page",
          },
        ],
        playerBuilds: [
          {
            playerName: "Player1",
            teamName: "Team A",
            rawHeroName: "Aamon",
            matchResult: "WIN",
            verificationStatus: "VERIFIED",
            items: [
              { slotOrder: 1, rawItemName: "Arcane Boots", verified: true },
              { slotOrder: 2, rawItemName: "Mystery Raw Item", verified: true },
            ],
          },
        ],
      },
    ],
  });

  const resolved = resolveProBuildImportCatalog(parsed, {
    heroes: [{ entityId: sampleHeroId, slug: "aamon", name: "Aamon" }],
    items: [
      { entityId: sampleItemId, slug: "arcane-boots", name: "Arcane Boots" },
    ],
    spells: [],
    emblems: [],
    patches: [
      {
        id: samplePatchId,
        versionCode: "1.9.32",
        serverType: "ORIGINAL_SERVER",
      },
    ],
  });

  assert.equal(resolved.summary.matchedItemCount, 1);
  assert.equal(resolved.summary.unmatchedItemCount, 1);
  assert.deepEqual(resolved.summary.unmatchedRawItemNames, ["Mystery Raw Item"]);

  const items = resolved.matches[0].playerBuilds[0].items;
  assert.equal(items[0].itemEntityId, sampleItemId);
  assert.equal(items[0].catalogMatchStatus, "MATCHED");
  assert.equal(items[0].isVerifiedItem, true);

  assert.equal(items[1].itemEntityId, null);
  assert.equal(items[1].catalogMatchStatus, "UNMATCHED");
  assert.equal(items[1].verificationStatus, "UNVERIFIED");
  assert.equal(items[1].isVerifiedItem, false);
});

process.stdout.write("\nSemua pengujian Pro Player Build Pipeline v1 selesai.\n");
