import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  applyReviewDecisions,
  createEmptyReviewWorkspace,
  type ReviewQueueSource,
  type ReviewWorkspaceState,
} from "../engine/evidence-review-workspace";
import type { ManualReviewInput } from "../engine/evidence-review-workflow";

const artifactDir = join(process.cwd(), "artifacts", "evidence-review-queue");
const queuePath = join(artifactDir, "evidence-review-queue.json");
const templatePath = join(artifactDir, "review-decisions.template.json");
const statePath = join(artifactDir, "review-workspace-state.json");
const importLogPath = join(artifactDir, "review-import-log.json");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2), "utf8");
}

function fail(message: string): never {
  throw new Error(message);
}

mkdirSync(artifactDir, { recursive: true });

const command = process.argv[2] ?? "template";

if (!existsSync(queuePath)) {
  fail(`Queue export tidak ditemukan: ${queuePath}`);
}

const queue = readJson<ReviewQueueSource & { metadata?: unknown }>(queuePath);

if (command === "template") {
  const template = {
    instructions: [
      "Isi array decisions dengan keputusan manual reviewer.",
      "Gunakan itemId persis seperti id pada evidence-review-queue.json.",
      "Status yang diterima: NEEDS_REVIEW, VERIFIED, REJECTED.",
      "VERIFIED wajib evidenceConfirmed=true dan minimal satu sourceRefs.",
      "Jangan mengubah file evidence-review-queue.json.",
    ],
    decisions: [] as ManualReviewInput[],
  };

  writeJson(templatePath, template);
  console.log("Template:", templatePath);
  console.log("Queue items:", queue.items.length);
  process.exit(0);
}

if (command === "import") {
  const inputArgument = process.argv[3];

  if (!inputArgument) {
    fail("Gunakan: npm exec tsx -- src/features/matchups/scripts/review-workspace.ts import <path-json>");
  }

  const inputPath = resolve(inputArgument);

  if (!existsSync(inputPath)) {
    fail(`File keputusan tidak ditemukan: ${inputPath}`);
  }

  const imported = readJson<{ decisions: ManualReviewInput[] }>(inputPath);

  if (!Array.isArray(imported.decisions)) {
    fail("Format file tidak valid: decisions harus berupa array.");
  }

  const previousState = existsSync(statePath)
    ? readJson<ReviewWorkspaceState>(statePath)
    : createEmptyReviewWorkspace();

  const importedAt = new Date().toISOString();

  const result = applyReviewDecisions(
    queue,
    previousState,
    imported.decisions,
    importedAt,
  );

  const importLog = existsSync(importLogPath)
    ? readJson<Array<{
        importedAt: string;
        importedCount: number;
        sourceFile: string;
      }>>(importLogPath)
    : [];

  // Persist only after the entire batch passes validation.
  writeJson(statePath, result.state);
  writeJson(importLogPath, [
    ...importLog,
    {
      importedAt,
      importedCount: result.importedCount,
      sourceFile: inputPath,
    },
  ]);

  console.log("\n=== REVIEW IMPORT RESULT ===");
  console.log("Imported decisions:", result.importedCount);
  console.log("Current reviewed items:", result.state.currentReviews.length);
  console.log("Audit trail entries:", result.state.auditTrail.length);
  console.log("State:", statePath);
  console.log("Import log:", importLogPath);
  console.log("\nPASS: Review decisions berhasil diimpor.");
  process.exit(0);
}

fail(`Perintah tidak dikenal: ${command}. Gunakan template atau import.`);