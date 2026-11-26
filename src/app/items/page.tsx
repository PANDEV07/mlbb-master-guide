import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { ItemCatalog } from "@/features/items/components/ItemCatalog";
import { getItemCatalog } from "@/features/items/server/item.repository";

export const metadata = buildPageMetadata(
  "Database Item",
  "Katalog item Mobile Legends: Bang Bang dengan atribut, harga, efek, dan data patch Original Server."
);

export const revalidate = 3600;

export default async function ItemsPage() {
  try {
    const { items, patchVersion } = await getItemCatalog();

    return (
      <div className="space-y-6">
        <PageHeader
          title="Database Item"
          description="Jelajahi katalog peralatan, atribut, harga, passive, dan active effect berdasarkan data Original Server."
          breadcrumbs={[{ label: "Database Item" }]}
          statusLabel={`${items.length} Item Tersedia`}
          phaseBadge={`Patch ${patchVersion || "N/A"}`}
        />

        {items.length > 0 ? (
          <ItemCatalog items={items} patchVersion={patchVersion} />
        ) : (
          <Surface className="p-10 text-center">
            <h2 className="font-semibold text-slate-100">
              Data item belum tersedia
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Belum ada profil item untuk patch Original Server yang aktif.
            </p>
          </Surface>
        )}
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Database Item"
          description="Katalog item Mobile Legends: Bang Bang."
          breadcrumbs={[{ label: "Database Item" }]}
        />
        <Surface className="p-8">
          <h2 className="font-semibold text-amber-300">
            Data item gagal dimuat
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Periksa koneksi database dan konfigurasi server. Silakan coba kembali.
          </p>
        </Surface>
      </div>
    );
  }
}