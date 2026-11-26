import { buildPageMetadata } from "@/lib/metadata";
import { getCurrentOriginalServerHeroes } from "@/features/heroes";
import { HeroDirectoryClient } from "@/features/heroes/components/HeroDirectoryClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { Surface } from "@/components/ui/Surface";

export const metadata = buildPageMetadata(
  "Database Hero",
  "Direktori lengkap hero Mobile Legends: Bang Bang lengkap dengan filter role, lane, spesialisasi, skill, dan kombo.",
);

export const dynamic = "force-dynamic";

export default async function HeroesPage() {
  const result = await getCurrentOriginalServerHeroes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Database Hero"
        description="Temukan profil hero, filter berdasarkan role, lane, spesialisasi, atau mekanik skill, lalu pelajari urutan kombonya."
        breadcrumbs={[{ label: "Hero" }]}
        phaseBadge={
          result.patch?.versionCode
            ? `Patch ${result.patch.versionCode}`
            : "Original Server"
        }
        statusLabel={`${result.heroes.length} Hero Terdaftar`}
      />

      {result.invalidRecords > 0 && (
        <Surface className="p-3.5">
          <p className="text-xs text-amber-300">
            {result.invalidRecords} record profil atau identitas gagal validasi.
          </p>
        </Surface>
      )}

      <HeroDirectoryClient heroes={result.heroes} />
    </div>
  );
}
