import { buildPageMetadata } from "@/lib/metadata";
import { getHeroDirectory } from "@/features/heroes";
import { PageHeader } from "@/components/shared/PageHeader";
import { CounterAnalyzerClient } from "@/features/counters/components/CounterAnalyzerClient";

export const metadata = buildPageMetadata(
  "Counter Pick Hero & Item",
  "Temukan rekomendasi hero counter dan item counter untuk 1 hingga 5 hero lawan Mobile Legends berbasis bukti mekanik.",
);

export const dynamic = "force-dynamic";

export default async function CountersPage() {
  const directory = await getHeroDirectory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Counter Pick Hero & Item"
        description="Pilih 1 hingga 5 hero lawan untuk memetakan ancaman utama, melihat rekomendasi hero counter per lane, serta prioritas item penangkal."
        breadcrumbs={[{ label: "Counter" }]}
        phaseBadge={
          directory.patch?.versionCode
            ? `Patch ${directory.patch.versionCode}`
            : "Original Server"
        }
        statusLabel="Counter 1–5 Hero Lawan"
      />

      <CounterAnalyzerClient
        heroes={directory.heroes}
        patchVersion={directory.patch?.versionCode ?? ""}
      />
    </div>
  );
}
