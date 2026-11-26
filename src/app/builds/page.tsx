import { getHeroDirectory } from "@/features/heroes";
import { BuildHeroSelection } from "@/features/builds/components/BuildHeroSelection";
import { PageHeader } from "@/components/shared/PageHeader";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata(
  "Panduan Build Hero",
  "Pilih hero untuk melihat 3 template build siap pakai atau menyusun konfigurasi item custom.",
);

export const dynamic = "force-dynamic";

export default async function BuildsPage() {
  const directory = await getHeroDirectory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panduan & Rakitan Build"
        description="Pilih hero di bawah untuk membuka 3 template build siap pakai serta workbench konfigurasi item custom."
        breadcrumbs={[{ label: "Build" }]}
        phaseBadge={
          directory.patch?.versionCode
            ? `Patch ${directory.patch.versionCode}`
            : undefined
        }
        statusLabel={`${directory.heroes.length} Hero Tersedia`}
      />
      <BuildHeroSelection heroes={directory.heroes} />
    </div>
  );
}
