import {
  createManualReviewRecord,
  type ManualReviewInput,
  type ManualReviewRecord,
} from "./evidence-review-workflow";

export interface ReviewQueueSource {
  items: Array<{ id: string }>;
}

export interface ReviewWorkspaceState {
  schemaVersion: "1.0";
  updatedAt: string;
  currentReviews: ManualReviewRecord[];
  auditTrail: ManualReviewRecord[];
}

export interface ReviewImportResult {
  state: ReviewWorkspaceState;
  importedCount: number;
}

export function createEmptyReviewWorkspace(): ReviewWorkspaceState {
  return {
    schemaVersion: "1.0",
    updatedAt: new Date(0).toISOString(),
    currentReviews: [],
    auditTrail: [],
  };
}

export function applyReviewDecisions(
  queue: ReviewQueueSource,
  previousState: ReviewWorkspaceState,
  inputs: ManualReviewInput[],
  importedAt: string,
): ReviewImportResult {
  if (!Number.isFinite(Date.parse(importedAt))) {
    throw new Error("Waktu import tidak valid.");
  }

  const validIds = new Set(queue.items.map((item) => item.id));

  if (validIds.size !== queue.items.length) {
    throw new Error("Queue sumber memiliki ID item duplikat.");
  }

  const seen = new Set<string>();
  const validated: ManualReviewRecord[] = [];

  // Validate every decision before changing the state.
  for (const input of inputs) {
    if (!validIds.has(input.itemId)) {
      throw new Error(`Item ID tidak ditemukan di queue: ${input.itemId}`);
    }

    if (seen.has(input.itemId)) {
      throw new Error(`Item ID duplikat dalam satu import: ${input.itemId}`);
    }

    seen.add(input.itemId);
    validated.push(createManualReviewRecord(input));
  }

  const currentById = new Map(
    previousState.currentReviews.map((record) => [record.itemId, record]),
  );

  for (const record of validated) {
    currentById.set(record.itemId, record);
  }

  const auditTrail = [
    ...previousState.auditTrail,
    ...validated,
  ];

  return {
    importedCount: validated.length,
    state: {
      schemaVersion: "1.0",
      updatedAt: new Date(importedAt).toISOString(),
      currentReviews: [...currentById.values()].sort(
        (a, b) => a.itemId.localeCompare(b.itemId),
      ),
      auditTrail,
    },
  };
}