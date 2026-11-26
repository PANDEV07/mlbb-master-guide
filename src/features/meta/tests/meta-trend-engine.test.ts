import assert from "node:assert/strict";
import {
  computeBracketTrends,
  type MetaHistoryDataset,
} from "../engine/meta-trend-engine";

function run() {
  // 1. Uji 1 snapshot (baseline jujur tanpa angka palsu)
  const singleDataset: MetaHistoryDataset = {
    schemaVersion: 1,
    sourceName: "Test Moonton GMS",
    sourceTier: "TIER_1_OFFICIAL",
    snapshots: [
      {
        snapshotDate: "2026-11-26",
        fetchedAt: "2026-11-26T00:00:00Z",
        sourceUpdatedAt: "2026-11-26T00:00:00Z",
        brackets: {
          mythical_glory: [
            { heroSlug: "akai", winRate: 0.5, pickRate: 0.01, banRate: 0.02 },
            { heroSlug: "fanny", winRate: 0.54, pickRate: 0.02, banRate: 0.4 },
          ],
        },
      },
    ],
  };

  const singleMap = computeBracketTrends(singleDataset, "mythical_glory");
  const akaiSingle = singleMap.get("akai");
  assert.ok(akaiSingle);
  assert.equal(akaiSingle.hasHistoricalComparison, false);
  assert.equal(akaiSingle.snapshotCount, 1);
  assert.equal(akaiSingle.winRateDelta, null);
  assert.equal(akaiSingle.tierDelta, null);
  console.log("PASS 1 snapshot baseline menandai hasHistoricalComparison=false");

  // 2. Uji 2 snapshot: hero naik & turun tier
  const multiDataset: MetaHistoryDataset = {
    schemaVersion: 1,
    sourceName: "Test Moonton GMS",
    sourceTier: "TIER_1_OFFICIAL",
    snapshots: [
      {
        snapshotDate: "2026-11-19",
        fetchedAt: "2026-11-19T00:00:00Z",
        sourceUpdatedAt: "2026-11-19T00:00:00Z",
        brackets: {
          mythical_glory: [
            { heroSlug: "h1", winRate: 0.56, pickRate: 0.03, banRate: 0.5 },
            { heroSlug: "h2", winRate: 0.53, pickRate: 0.02, banRate: 0.2 },
            { heroSlug: "h3", winRate: 0.5, pickRate: 0.01, banRate: 0.05 },
            { heroSlug: "h4", winRate: 0.48, pickRate: 0.008, banRate: 0.01 },
            { heroSlug: "h5", winRate: 0.44, pickRate: 0.005, banRate: 0.002 },
          ],
        },
      },
      {
        snapshotDate: "2026-11-26",
        fetchedAt: "2026-11-26T00:00:00Z",
        sourceUpdatedAt: "2026-11-26T00:00:00Z",
        brackets: {
          mythical_glory: [
            { heroSlug: "h5", winRate: 0.57, pickRate: 0.035, banRate: 0.55 },
            { heroSlug: "h2", winRate: 0.53, pickRate: 0.02, banRate: 0.2 },
            { heroSlug: "h3", winRate: 0.5, pickRate: 0.01, banRate: 0.05 },
            { heroSlug: "h4", winRate: 0.48, pickRate: 0.008, banRate: 0.01 },
            { heroSlug: "h1", winRate: 0.43, pickRate: 0.004, banRate: 0.001 },
          ],
        },
      },
    ],
  };

  const multiMap = computeBracketTrends(multiDataset, "mythical_glory");
  const h5 = multiMap.get("h5");
  const h1 = multiMap.get("h1");
  assert.ok(h5 && h1);
  assert.equal(h5.hasHistoricalComparison, true);
  assert.ok((h5.winRateDelta ?? 0) > 0.12);
  assert.ok((h5.tierDelta ?? 0) > 0, "h5 seharusnya naik tier");
  assert.ok((h1.tierDelta ?? 0) < 0, "h1 seharusnya turun tier");
  assert.equal(h5.points.length, 2);
  console.log("PASS 2 snapshot menghitung delta WR & pergerakan naik/turun tier akurat");
}

run();
