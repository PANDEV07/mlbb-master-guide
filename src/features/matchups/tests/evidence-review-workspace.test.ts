import assert from "node:assert/strict";
import {
  applyReviewDecisions,
  createEmptyReviewWorkspace,
} from "../engine/evidence-review-workspace";
import type { ManualReviewInput } from "../engine/evidence-review-workflow";

const queue = {
  items: [
    { id: "rule|Hero A|Hero B" },
    { id: "rule|Hero C|Hero D" },
  ],
};

const timestamp = "2026-11-25T09:00:00Z";

function decision(
  itemId: string,
  status: ManualReviewInput["status"] = "NEEDS_REVIEW",
): ManualReviewInput {
  return {
    itemId,
    status,
    reviewer: "Reviewer 1",
    reviewedAt: timestamp,
    rationale: "Sudah diperiksa secara manual.",
    evidenceConfirmed: false,
  };
}

function test(name: string, callback: () => void) {
  callback();
  process.stdout.write(`PASS ${name}\n`);
}

test("Workspace baru kosong", () => {
  const state = createEmptyReviewWorkspace();
  assert.equal(state.currentReviews.length, 0);
  assert.equal(state.auditTrail.length, 0);
});

test("Import keputusan valid", () => {
  const result = applyReviewDecisions(
    queue,
    createEmptyReviewWorkspace(),
    [decision("rule|Hero A|Hero B")],
    timestamp,
  );

  assert.equal(result.importedCount, 1);
  assert.equal(result.state.currentReviews.length, 1);
  assert.equal(result.state.auditTrail.length, 1);
});

test("ID yang tidak ada di queue ditolak", () => {
  assert.throws(
    () => applyReviewDecisions(
      queue,
      createEmptyReviewWorkspace(),
      [decision("unknown-item")],
      timestamp,
    ),
    /tidak ditemukan/,
  );
});

test("ID duplikat dalam satu import ditolak", () => {
  assert.throws(
    () => applyReviewDecisions(
      queue,
      createEmptyReviewWorkspace(),
      [
        decision("rule|Hero A|Hero B"),
        decision("rule|Hero A|Hero B"),
      ],
      timestamp,
    ),
    /duplikat dalam satu import/,
  );
});

test("Import batch gagal secara atomik jika satu item invalid", () => {
  const initial = createEmptyReviewWorkspace();

  assert.throws(
    () => applyReviewDecisions(
      queue,
      initial,
      [
        decision("rule|Hero A|Hero B"),
        decision("unknown-item"),
      ],
      timestamp,
    ),
    /tidak ditemukan/,
  );

  assert.equal(initial.currentReviews.length, 0);
  assert.equal(initial.auditTrail.length, 0);
});

test("Keputusan baru memperbarui current state dan mempertahankan audit trail", () => {
  const first = applyReviewDecisions(
    queue,
    createEmptyReviewWorkspace(),
    [decision("rule|Hero A|Hero B", "NEEDS_REVIEW")],
    timestamp,
  );

  const second = applyReviewDecisions(
    queue,
    first.state,
    [{
      ...decision("rule|Hero A|Hero B", "REJECTED"),
      rationale: "Evidence tidak mendukung interaksi.",
    }],
    "2026-11-25T10:00:00Z",
  );

  assert.equal(second.state.currentReviews.length, 1);
  assert.equal(second.state.currentReviews[0].status, "REJECTED");
  assert.equal(second.state.auditTrail.length, 2);
  assert.equal(second.state.auditTrail[0].status, "NEEDS_REVIEW");
  assert.equal(second.state.auditTrail[1].status, "REJECTED");
});

test("Import tidak mengubah item lain", () => {
  const result = applyReviewDecisions(
    queue,
    createEmptyReviewWorkspace(),
    [decision("rule|Hero A|Hero B")],
    timestamp,
  );

  assert.equal(result.state.currentReviews.length, 1);
  assert.equal(
    result.state.currentReviews[0].itemId,
    "rule|Hero A|Hero B",
  );
});

test("Waktu import tidak valid ditolak", () => {
  assert.throws(
    () => applyReviewDecisions(
      queue,
      createEmptyReviewWorkspace(),
      [],
      "invalid-date",
    ),
    /Waktu import/,
  );
});

test("Queue dengan ID duplikat ditolak", () => {
  assert.throws(
    () => applyReviewDecisions(
      { items: [{ id: "same" }, { id: "same" }] },
      createEmptyReviewWorkspace(),
      [],
      timestamp,
    ),
    /ID item duplikat/,
  );
});

process.stdout.write("\nSemua reviewer workspace tests selesai.\n");