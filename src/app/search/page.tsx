import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchWorkspace } from "@/features/search/SearchWorkspace";
import { getHeroDirectory } from "@/features/heroes/services/hero.service";
import { getItemCatalog } from "@/features/items/server/item.repository";

export const metadata = buildPageMetadata(
  "Pencarian",
  "Cari hero, item, build, matchup, counter, akademi ranked, dan catatan patch secara instan.",
);

export const revalidate = 3600;

export default async function SearchPage() {
  const [heroDir, itemCatalog] = await Promise.all([
    getHeroDirectory().catch(() => ({
      heroes: [],
      patch: null,
      invalidRecords: 0,
    })),
    getItemCatalog().catch(() => ({
      items: [],
      patchVersion: "",
    })),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pencarian Terpadu"
        description="Temukan hero, item, dan alat strategi secara instan hanya dengan mengetik nama, role, lane, atau kategori."
        breadcrumbs={[{ label: "Pencarian" }]}
        phaseBadge={
          heroDir.patch?.versionCode
            ? `Patch ${heroDir.patch.versionCode}`
            : undefined
        }
        statusLabel={`${heroDir.heroes.length} Hero · ${itemCatalog.items.length} Item`}
      />

      <SearchWorkspace heroes={heroDir.heroes} items={itemCatalog.items} />
    </div>
  );
}
