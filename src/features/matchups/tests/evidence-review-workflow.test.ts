import assert from "node:assert/strict";
import {
  createManualReviewRecord,
} from "../engine/evidence-review-workflow";

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("NEEDS_REVIEW dapat dibuat dengan reviewer dan alasan", () => {
  const result = createManualReviewRecord({
    itemId: "CONTROL_VS_IMMUNITY|Akai|Alice",
    status: "NEEDS_REVIEW",
    reviewer: "Reviewer 1",
    reviewedAt: "2026-11-25T09:00:00+08:00",
    rationale: "Perlu pemeriksaan timing.",
  });

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.evidenceConfirmed, false);
});

test("VERIFIED membutuhkan konfirmasi evidence", () => {
  assert.throws(
    () => createManualReviewRecord({
      itemId: "item-1",
      status: "VERIFIED",
      reviewer: "Reviewer 1",
      reviewedAt: "2026-11-25T09:00:00Z",
      rationale: "Sudah diperiksa.",
      sourceRefs: ["official-source"],
    }),
    /konfirmasi evidence/,
  );
});

test("VERIFIED membutuhkan referensi sumber", () => {
  assert.throws(
    () => createManualReviewRecord({
      itemId: "item-1",
      status: "VERIFIED",
      reviewer: "Reviewer 1",
      reviewedAt: "2026-11-25T09:00:00Z",
      rationale: "Sudah diperiksa.",
      evidenceConfirmed: true,
    }),
    /referensi sumber/,
  );
});

test("VERIFIED valid menyimpan metadata reviewer dan sumber", () => {
  const result = createManualReviewRecord({
    itemId: "item-1",
    status: "VERIFIED",
    reviewer: " Reviewer 1 ",
    reviewedAt: "2026-11-25T09:00:00Z",
    rationale: "Evidence cocok dengan sumber resmi.",
    evidenceConfirmed: true,
    sourceRefs: ["official-source", "official-source"],
  });

  assert.equal(result.status, "VERIFIED");
  assert.equal(result.reviewer, "Reviewer 1");
  assert.equal(result.sourceRefs.length, 1);
  assert.equal(result.evidenceConfirmed, true);
});

test("REJECTED wajib punya alasan", () => {
  assert.throws(
    () => createManualReviewRecord({
      itemId: "item-1",
      status: "REJECTED",
      reviewer: "Reviewer 1",
      reviewedAt: "2026-11-25T09:00:00Z",
      rationale: " ",
    }),
    /Alasan keputusan/,
  );
});

test("ID kosong ditolak", () => {
  assert.throws(
    () => createManualReviewRecord({
      itemId: " ",
      status: "NEEDS_REVIEW",
      reviewer: "Reviewer 1",
      reviewedAt: "2026-11-25T09:00:00Z",
      rationale: "Perlu dicek.",
    }),
    /Item ID/,
  );
});

test("Tanggal tidak valid ditolak", () => {
  assert.throws(
    () => createManualReviewRecord({
      itemId: "item-1",
      status: "NEEDS_REVIEW",
      reviewer: "Reviewer 1",
      reviewedAt: "bukan-tanggal",
      rationale: "Perlu dicek.",
    }),
    /tanggal yang valid/,
  );
});

process.stdout.write("\nSemua manual review workflow tests selesai.\n");