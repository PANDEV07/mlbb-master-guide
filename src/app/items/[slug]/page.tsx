import Link from "next/link";
import { notFound } from "next/navigation";

import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/shared/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { getItemDetail, type RecipeNode } from "@/features/items/server/item.repository";
import {
  formatClaimClassificationId,
  formatConfidenceLevelId,
  formatRecipeTypeId,
} from "@/lib/i18n/labels";

interface ItemDetailPageProps {
  params: Promise<{ slug: string }>;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  PHYSICAL_ATTACK: "Physical Attack",
  MAGIC_POWER: "Magic Power",
  HP: "HP",
  MANA: "Mana",
  PHYSICAL_DEFENSE: "Physical Defense",
  MAGIC_DEFENSE: "Magic Defense",
  HP_REGEN: "HP Regen",
  MANA_REGEN: "Mana Regen",
  ATTACK_SPEED: "Attack Speed",
  CRITICAL_CHANCE: "Critical Chance",
  MOVEMENT_SPEED: "Movement Speed",
  COOLDOWN_REDUCTION: "Cooldown Reduction",
  LIFESTEAL: "Lifesteal",
  SPELL_VAMP: "Spell Vamp",
  PENETRATION: "Penetration",
  OTHER: "Lainnya",
};

const ASPECT_LABELS: Record<string, string> = {
  ITEM_PRICE: "Harga Item",
  ITEM_ATTRIBUTES: "Atribut Item",
  ITEM_PASSIVE_EFFECTS: "Efek Pasif",
  ITEM_ACTIVE_EFFECTS: "Efek Aktif",
  ITEM_RECIPE: "Resep Item",
};

function VerificationBadge({ status }: { status: string }) {
  const partial = status === "PARTIALLY_VERIFIED";
  const verified = status === "VERIFIED";

  return (
    <Badge tone={verified ? "emerald" : partial ? "amber" : "neutral"}>
      {verified
        ? "Terverifikasi"
        : partial
          ? "Verifikasi parsial"
          : "Belum terverifikasi"}
    </Badge>
  );
}

function RecipeTreeNode({
  node,
  depth = 0,
}: {
  node: RecipeNode;
  depth?: number;
}) {
  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between gap-3 rounded-lg border border-[#293548] bg-[#121927] p-3"
        style={{ marginLeft: `${Math.min(depth, 5) * 12}px` }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {node.iconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.iconUrl}
              alt=""
              className="size-10 shrink-0 rounded-md object-contain"
            />
          )}
          <div className="min-w-0">
            <Link
              href={`/items/${node.slug}`}
              className="text-sm font-medium text-sky-300 hover:text-sky-200"
            >
              {node.name}
            </Link>
            <div className="mt-1 space-y-1">
              <p className="text-xs text-slate-400">
                Harga satuan: {node.price !== null
                  ? `${node.price.toLocaleString("id-ID")} Gold`
                  : "Tidak tersedia"}
              </p>
              {node.componentCost !== null && (
                <p className="text-xs text-slate-500">
                  Bahan resep: {(node.componentCost * node.quantity).toLocaleString("id-ID")} Gold
                </p>
              )}
              {node.combineCost !== null && (
                <p className="text-xs text-slate-500">
                  Biaya gabung: {(node.combineCost * node.quantity).toLocaleString("id-ID")} Gold
                </p>
              )}
              {node.price !== null && (
                <p className="text-xs font-medium text-amber-300">
                  Subtotal: {(node.price * node.quantity).toLocaleString("id-ID")} Gold
                </p>
              )}
            </div>
          </div>
        </div>
        <Badge tone="blue">×{node.quantity}</Badge>
      </div>

      {node.cycleDetected && (
        <p className="text-xs text-amber-400">
          Siklus recipe terdeteksi. Penelusuran dihentikan.
        </p>
      )}

      {node.depthLimited && (
        <p className="text-xs text-amber-400">
          Batas kedalaman recipe tercapai.
        </p>
      )}

      {node.children.length > 0 && (
        <div className="ml-3 space-y-2 border-l border-[#293548] pl-3">
          {node.children.map((child, index) => (
            <RecipeTreeNode
              key={`${child.slug}-${depth}-${index}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default async function ItemDetailPage({
  params,
}: ItemDetailPageProps) {
  const { slug } = await params;
  const { item, patchVersion } = await getItemDetail(slug);

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description={`${item.category} · ${item.tier} · Data Original Server`}
        breadcrumbs={[
          { label: "Database Item", href: "/items" },
          { label: item.name },
        ]}
        statusLabel="Original Server"
        phaseBadge={`Patch ${patchVersion}`}
      />

      <Link
        href="/items"
        className="inline-flex text-sm text-sky-400 hover:text-sky-300"
      >
        ← Kembali ke katalog item
      </Link>

      <Surface className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#293548] bg-[#080D15]">
            {item.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.iconUrl}
                alt={item.name}
                className="size-full object-contain"
              />
            ) : (
              <span className="text-xs text-slate-500">ITEM</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge>{item.category}</Badge>
              <Badge tone="blue">{item.tier}</Badge>
              <VerificationBadge status={item.verificationStatus} />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-100">
              {item.name}
            </h2>
            <p className="mt-2 text-lg font-semibold text-amber-300">
              {item.price !== null
                ? `${item.price.toLocaleString("id-ID")} Gold`
                : "Harga belum tersedia"}
            </p>
          </div>
        </div>
      </Surface>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          Atribut Item
        </h2>
        <Surface className="p-5">
          {item.attributes.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {item.attributes.map((attribute, index) => (
                <div
                  key={`${attribute.type}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#293548] bg-[#121927] p-3"
                >
                  <span className="text-sm text-slate-300">
                    {ATTRIBUTE_LABELS[attribute.type] ?? attribute.type}
                  </span>
                  <strong className="text-sm text-amber-300">
                    {attribute.value ?? "—"}
                    {attribute.unit ?? ""}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Tidak ada atribut dasar yang tercatat pada sumber data.
            </p>
          )}
        </Surface>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Efek Pasif</h2>
        {item.passiveEffects.length ? (
          item.passiveEffects.map((effect, index) => (
            <Surface key={`${effect.name}-${index}`} className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">
                  {effect.name}
                </h3>
                <VerificationBadge status={effect.verificationStatus} />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {effect.description}
              </p>
            </Surface>
          ))
        ) : (
          <Surface className="p-5">
            <p className="text-sm text-slate-500">
              Tidak ada efek pasif yang tercatat.
            </p>
          </Surface>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Efek Aktif</h2>
        {item.activeEffects.length ? (
          item.activeEffects.map((effect, index) => (
            <Surface key={`${effect.name}-${index}`} className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">
                  {effect.name}
                </h3>
                <VerificationBadge status={effect.verificationStatus} />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {effect.description}
              </p>
            </Surface>
          ))
        ) : (
          <Surface className="p-5">
            <p className="text-sm text-slate-500">
              Tidak ada efek aktif yang tercatat.
            </p>
          </Surface>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          Analisis Biaya Crafting
        </h2>
        <Surface className="space-y-4 p-5">
          {item.recipeCost.totalCraftCost !== null ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#293548] bg-[#121927] p-4">
                  <p className="text-xs text-slate-500">Total biaya crafting</p>
                  <p className="mt-1 text-xl font-bold text-amber-300">
                    {item.recipeCost.totalCraftCost.toLocaleString("id-ID")} Gold
                  </p>
                </div>
                <div className="rounded-lg border border-[#293548] bg-[#121927] p-4">
                  <p className="text-xs text-slate-500">Bahan dasar</p>
                  <p className="mt-1 text-xl font-bold text-slate-100">
                    {item.recipeCost.baseMaterialsCost?.toLocaleString("id-ID")} Gold
                  </p>
                </div>
                <div className="rounded-lg border border-[#293548] bg-[#121927] p-4">
                  <p className="text-xs text-slate-500">Akumulasi biaya gabung</p>
                  <p className="mt-1 text-xl font-bold text-slate-100">
                    {item.recipeCost.accumulatedCombineCost?.toLocaleString("id-ID")} Gold
                  </p>
                </div>
                <div className="rounded-lg border border-[#293548] bg-[#121927] p-4">
                  <p className="text-xs text-slate-500">Selisih terhadap harga item</p>
                  <p className={`mt-1 text-xl font-bold ${
                    item.recipeCost.priceDifference === 0
                      ? "text-[#22D3EE]"
                      : "text-amber-300"
                  }`}>
                    {item.recipeCost.priceDifference?.toLocaleString("id-ID")} Gold
                  </p>
                </div>
              </div>
              <Badge tone={item.recipeCost.priceDifference === 0 ? "emerald" : "amber"}>
                {item.recipeCost.priceDifference === 0
                  ? "Biaya crafting cocok dengan harga item"
                  : "Ada selisih biaya yang perlu ditinjau"}
              </Badge>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-amber-300">
                Total biaya crafting belum dapat dihitung secara lengkap.
              </p>
              {item.recipeCost.missingItems.length > 0 && (
                <p className="text-xs text-slate-400">
                  Komponen tidak ditemukan: {item.recipeCost.missingItems.join(", ")}
                </p>
              )}
              {item.recipeCost.cycleDetected && (
                <p className="text-xs text-amber-400">
                  Siklus recipe terdeteksi.
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Perhitungan berdasarkan harga komponen dan biaya gabung yang tercatat.
            Data sumber tetap mengikuti status verifikasi masing-masing.
          </p>
        </Surface>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">
          Resep &amp; Pohon Komponen
        </h2>
        <Surface className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{formatRecipeTypeId(item.recipe.recipeType)}</Badge>
            {item.recipe.componentCost !== null && (
              <Badge tone="blue">
                Biaya komponen:{" "}
                {item.recipe.componentCost.toLocaleString("id-ID")} Gold
              </Badge>
            )}
            {item.recipe.combineCost !== null && (
              <Badge tone="gold">
                Biaya gabung: {item.recipe.combineCost.toLocaleString("id-ID")}{" "}
                Gold
              </Badge>
            )}
          </div>

          {item.recipeTree.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Dibangun dari · Pohon komponen
              </p>
              {item.recipeTree.map((node, index) => (
                <RecipeTreeNode
                  key={`${node.slug}-${index}`}
                  node={node}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Tidak ada komponen resep yang tercatat. Item ini merupakan komponen dasar atau data resep belum tersedia.
            </p>
          )}
        </Surface>
      </section>

      <Surface className="p-4 sm:p-5">
        <details className="group">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white">
                Sumber Referensi &amp; Status Verifikasi Data
              </h2>
              <p className="text-xs text-[#9AA6C4]">
                {item.evidence.length > 0
                  ? `${item.evidence.length} catatan sumber terdaftar untuk item ini`
                  : "Belum ada catatan sumber untuk item ini."}
              </p>
            </div>
            <span className="rounded-full border border-[#22D3EE]/35 bg-[#0A0E1A] px-3 py-1 text-[11px] font-medium text-slate-300 group-hover:border-[#F5B83D]/55 group-hover:text-[#F5B83D]">
              Lihat rincian
            </span>
          </summary>

          <div className="mt-4 space-y-3 border-t border-[#22D3EE]/25 pt-4">
            {item.evidence.length ? (
              item.evidence.map((evidence, index) => (
                <div
                  key={`${evidence.aspectName}-${index}`}
                  className="flex flex-col gap-2 border-b border-[#22D3EE]/25 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {ASPECT_LABELS[evidence.aspectName] ??
                        evidence.aspectName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatClaimClassificationId(
                        evidence.claimClassification,
                      )}{" "}
                      · Tingkat keyakinan:{" "}
                      {formatConfidenceLevelId(evidence.confidenceLevel)}
                    </p>
                    {evidence.sourceUrl && (
                      <a
                        href={evidence.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-xs text-[#F5B83D] hover:underline"
                      >
                        Buka sumber rujukan
                      </a>
                    )}
                  </div>
                  <VerificationBadge status={evidence.verificationStatus} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">
                Belum ada catatan sumber untuk item ini.
              </p>
            )}
          </div>
        </details>
      </Surface>
    </div>
  );
}

export async function generateMetadata({
  params,
}: ItemDetailPageProps) {
  const { slug } = await params;
  const { item } = await getItemDetail(slug);

  return buildPageMetadata(
    item ? item.name : "Item tidak ditemukan",
    item
      ? `Detail ${item.name}: atribut, harga, efek, recipe, dan status verifikasi.`
      : "Detail item tidak ditemukan.",
  );
}