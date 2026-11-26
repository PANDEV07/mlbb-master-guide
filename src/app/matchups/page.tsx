import { buildPageMetadata } from "@/lib/metadata";
import { getHeroDirectory } from "@/features/heroes";
import { PageHeader } from "@/components/shared/PageHeader";
import { MatchupAnalyzerClient } from "@/features/matchups/MatchupAnalyzerClient";
import { Surface } from "@/components/ui/Surface";

export const metadata = buildPageMetadata(
  "Intelijen Matchup & Draft 5v5",
  "Analisis duel 1v1 head-to-head dan simulasi komposisi tim 5v5 Mobile Legends berbasis mekanik skill, kombo, dan katalog item Original Server.",
);

export const dynamic = "force-dynamic";

export default async function MatchupsPage() {
  const directory = await getHeroDirectory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelijen Matchup & Draft"
        description="Bandingkan duel hero 1v1 atau simulasikan komposisi tim 5v5 per lane untuk mengaudit kelengkapan peran, interaksi mekanik, kombo, dan rekomendasi item counter."
        breadcrumbs={[{ label: "Matchup" }]}
      />

      <MatchupAnalyzerClient
        heroes={directory.heroes}
        patchVersion={directory.patch?.versionCode ?? ""}
      />

      {directory.invalidRecords > 0 && (
        <Surface className="p-3">
          <p className="text-xs text-amber-300">
            {directory.invalidRecords} record hero tidak dapat dimuat karena
            gagal validasi.
          </p>
        </Surface>
      )}

      <p className="text-center text-[10px] text-slate-500">
        Data katalog Original Server · Seluruh analisis berbasis bukti mekanik
        kandidat dan katalog item, bukan prediksi win rate terverifikasi.
      </p>
    </div>
  );
}
