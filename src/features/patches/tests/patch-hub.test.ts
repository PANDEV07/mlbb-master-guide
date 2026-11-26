import assert from "node:assert/strict";
import {
  filterPatchChanges,
  filterPatchesByServer,
  summarizeEvidenceHealth,
} from "../utils/patch-health";
import type {
  EvidenceAuditBucket,
  PatchChangeRecord,
  PatchVersionSummary,
} from "../types/patch-hub.types";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

const samplePatches: PatchVersionSummary[] = [
  {
    id: "p1",
    versionCode: "2.2.20",
    versionOrder: 20261001,
    serverType: "ORIGINAL_SERVER",
    seasonLabel: "Season 42",
    releaseDate: "2026-10-01",
    isCurrentLive: false,
    notesSummary: null,
  },
  {
    id: "p2",
    versionCode: "2.2.23",
    versionOrder: 20261111,
    serverType: "ORIGINAL_SERVER",
    seasonLabel: "Season 42",
    releaseDate: "2026-11-11",
    isCurrentLive: true,
    notesSummary: "Live original patch",
  },
  {
    id: "p3",
    versionCode: "2.2.25-adv",
    versionOrder: 20261120,
    serverType: "ADVANCE_SERVER",
    seasonLabel: null,
    releaseDate: "2026-11-20",
    isCurrentLive: true,
    notesSummary: "Advance server test",
  },
];

const sampleChanges: PatchChangeRecord[] = [
  {
    id: "c1",
    patchVersionId: "p2",
    targetEntityType: "hero",
    targetEntityId: null,
    targetEntitySlug: "aamon",
    changeType: "BUFF",
    attributeName: "Skill 1 Damage",
    previousValue: "150",
    newValue: "170",
    summary: "Base damage dinaikkan.",
  },
  {
    id: "c2",
    patchVersionId: "p2",
    targetEntityType: "item",
    targetEntityId: null,
    targetEntitySlug: "antique-cuirass",
    changeType: "ADJUST",
    attributeName: "Physical Defense",
    previousValue: "40",
    newValue: "45",
    summary: "Penyesuaian pertahanan fisik.",
  },
  {
    id: "c3",
    patchVersionId: "p3",
    targetEntityType: "hero",
    targetEntityId: null,
    targetEntitySlug: "fanny",
    changeType: "NERF",
    attributeName: "Energy",
    previousValue: "100",
    newValue: "90",
    summary: "Uji coba Advance Server.",
  },
];

test("Isolasi server memisahkan Original Server, Advance Server, dan Experimental", () => {
  const original = filterPatchesByServer(samplePatches, "ORIGINAL_SERVER");
  assert.equal(original.length, 2);
  assert.equal(original[0].versionCode, "2.2.23");
  assert.equal(original[1].versionCode, "2.2.20");

  const advance = filterPatchesByServer(samplePatches, "ADVANCE_SERVER");
  assert.equal(advance.length, 1);
  assert.equal(advance[0].versionCode, "2.2.25-adv");

  const experimental = filterPatchesByServer(samplePatches, "EXPERIMENTAL");
  assert.equal(experimental.length, 0);
});

test("Filter patch_changes menyaring patchVersionId, changeType, dan targetEntityType", () => {
  const onlyPatch2 = filterPatchChanges(sampleChanges, {
    patchVersionId: "p2",
    changeType: "ALL",
    targetEntityType: "ALL",
  });
  assert.equal(onlyPatch2.length, 2);

  const onlyBuff = filterPatchChanges(sampleChanges, {
    patchVersionId: "p2",
    changeType: "BUFF",
    targetEntityType: "ALL",
  });
  assert.equal(onlyBuff.length, 1);
  assert.equal(onlyBuff[0].targetEntitySlug, "aamon");

  const onlyItem = filterPatchChanges(sampleChanges, {
    patchVersionId: "p2",
    changeType: "ALL",
    targetEntityType: "item",
  });
  assert.equal(onlyItem.length, 1);
  assert.equal(onlyItem[0].targetEntitySlug, "antique-cuirass");
});

test("Ringkasan kesehatan bukti menghitung total, status, dan breakdown per domain dengan akurat", () => {
  const buckets: EvidenceAuditBucket[] = [
    {
      entityType: "item",
      verificationStatus: "PARTIALLY_VERIFIED",
      claimClassification: "SECONDARY_SOURCE",
      count: 2,
    },
    {
      entityType: "item",
      verificationStatus: "UNVERIFIED",
      claimClassification: "SECONDARY_SOURCE",
      count: 461,
    },
    {
      entityType: "hero_build",
      verificationStatus: "UNVERIFIED",
      claimClassification: "COMMUNITY_THEORY",
      count: 393,
    },
    {
      entityType: "hero",
      verificationStatus: "VERIFIED",
      claimClassification: "OFFICIAL_FACT",
      count: 10,
    },
    {
      entityType: "hero",
      verificationStatus: "OUTDATED",
      claimClassification: "OFFICIAL_FACT",
      count: 3,
    },
  ];

  const health = summarizeEvidenceHealth(buckets);
  assert.equal(health.totalEvidences, 869);
  assert.equal(health.verifiedCount, 10);
  assert.equal(health.partiallyVerifiedCount, 2);
  assert.equal(health.unverifiedCount, 854);
  assert.equal(health.outdatedCount, 3);
  assert.equal(health.needsReviewCount, 859);
  assert.equal(health.byEntityType[0].entityType, "item");
  assert.equal(health.byEntityType[0].total, 463);
});

process.stdout.write("\nSemua pengujian Pusat Patch selesai.\n");
