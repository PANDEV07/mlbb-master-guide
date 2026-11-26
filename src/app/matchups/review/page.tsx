import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PageHeader } from "@/components/shared/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { EvidenceReviewDashboard } from "@/features/matchups/components/EvidenceReviewDashboard";
import type { EvidenceReviewItem } from "@/features/matchups/engine/evidence-review-queue";

export const dynamic = "force-dynamic";

type QueueFile = {
  metadata?: {
    heroes?: number;
    mechanicRecords?: number;
    evidenceSkillRecords?: number;
    interactionCandidates?: number;
    reviewItems?: number;
    groupedSkillPairs?: number;
    uniqueDirectedHeroPairs?: number;
    verificationStatus?: string;
  };
  items?: EvidenceReviewItem[];
};

async function loadReviewQueue(): Promise<{
  items: EvidenceReviewItem[];
  metadata: QueueFile["metadata"];
  error: string;
}> {
  const path = join(
    process.cwd(),
    "artifacts",
    "evidence-review-queue",
    "evidence-review-queue.json",
  );

  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as QueueFile;

    if (!Array.isArray(parsed.items)) {
      throw new Error("Format queue tidak memiliki array items.");
    }

    return {
      items: parsed.items,
      metadata: parsed.metadata,
      error: "",
    };
  } catch (error) {
    return {
      items: [],
      metadata: undefined,
      error: error instanceof Error
        ? error.message
        : "Gagal membaca review queue.",
    };
  }
}

export default async function EvidenceReviewPage() {
  const queue = await loadReviewQueue();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviewer Workspace"
        description="Tinjau evidence interaksi mekanik hero, catat keputusan manual, dan simpan hasil review dengan audit trail."
        breadcrumbs={[
          { label: "Matchup", href: "/matchups" },
          { label: "Reviewer Workspace" },
        ]}
      />

      {queue.error ? (
        <Surface className="space-y-3 p-5">
          <h2 className="font-bold text-amber-300">
            Review queue belum tersedia
          </h2>
          <p className="text-sm text-slate-400">
            {queue.error}
          </p>
          <p className="text-xs text-slate-500">
            Jalankan export terlebih dahulu:
            {" "}
            npx tsx src/features/matchups/scripts/export-evidence-review-queue.ts
          </p>
        </Surface>
      ) : (
        <EvidenceReviewDashboard
          items={queue.items}
          metadata={queue.metadata ?? {}}
        />
      )}

      <p className="text-center text-[10px] text-slate-500">
        Keputusan review disimpan sebagai file unduhan lokal.
        Status kandidat sumber tidak berubah otomatis.
      </p>
    </div>
  );
}