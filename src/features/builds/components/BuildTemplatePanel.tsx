"use client";

import Image from "next/image";
import type { ItemCatalogRecord } from "@/features/items/server/item.repository";
import type { HeroBuildTemplate } from "../types/build.types";
import { Badge } from "@/components/ui/Badge";
import { Surface } from "@/components/ui/Surface";
import { formatVerificationStatusId } from "@/lib/i18n/labels";

type Props = {
  heroName: string;
  templates: HeroBuildTemplate[];
  itemsById: ReadonlyMap<string, ItemCatalogRecord>;
  activePresetId: string | null;
  onSelectTemplate: (template: HeroBuildTemplate) => void;
};

function getVerificationTone(
  status: string,
): "emerald" | "blue" | "amber" | "neutral" {
  if (status === "VERIFIED") return "emerald";
  if (status === "PARTIALLY_VERIFIED") return "blue";
  if (status === "UNVERIFIED" || status === "OUTDATED" || status === "CONFLICTING") {
    return "amber";
  }
  return "neutral";
}

function getSourceBadgeLabel(template: HeroBuildTemplate): string {
  if (template.sourceKind === "HERO_BUILD") {
    return template.verificationStatus === "VERIFIED"
      ? "Build Terkurasi"
      : "Template Referensi";
  }
  if (template.sourceKind === "PRO_MATCH_BUILD") return "Build Pertandingan Pro";
  return "Template kosong";
}

export function BuildTemplatePanel({
  heroName,
  templates,
  itemsById,
  activePresetId,
  onSelectTemplate,
}: Props) {
  const databaseCount = templates.filter(
    (template) => template.sourceKind !== "EMPTY_TEMPLATE",
  ).length;

  return (
    <Surface className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">3 Template Build</h2>
          <p className="mt-1 text-xs text-slate-400">
            {databaseCount > 0
              ? `Menampilkan ${databaseCount} build dari database untuk ${heroName}. Pilih template untuk dimuat ke editor.`
              : `Belum ada data build tersimpan di database untuk ${heroName}. Gunakan template kosong atau impor data sumber nyata terlebih dahulu.`}
          </p>
        </div>
        <Badge tone={databaseCount > 0 ? "blue" : "amber"}>
          {databaseCount > 0 ? `${databaseCount}/3 dari DB` : "Belum Diverifikasi"}
        </Badge>
      </div>

      <div className="space-y-3">
        {templates.map((template) => {
          const matchedCount = template.slots.filter(
            (slot) => slot.itemEntityId && itemsById.has(slot.itemEntityId),
          ).length;
          const rawUnmatchedCount = template.slots.filter(
            (slot) => !slot.itemEntityId && Boolean(slot.rawItemName),
          ).length;
          const filledCount = matchedCount + rawUnmatchedCount;
          const isDatabaseTemplate = template.sourceKind !== "EMPTY_TEMPLATE";

          return (
            <div
              key={template.id}
              className={`rounded-xl border p-3 transition ${
                activePresetId === template.id
                  ? "border-amber-400/70 bg-amber-500/5"
                  : "border-slate-700 bg-[#0B111B]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {template.name}
                    </h3>
                    {template.patchVersion && (
                      <Badge tone="neutral">Patch {template.patchVersion}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {template.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    tone={
                      template.sourceKind === "EMPTY_TEMPLATE"
                        ? "neutral"
                        : template.sourceKind === "PRO_MATCH_BUILD"
                          ? "gold"
                          : "blue"
                    }
                  >
                    {getSourceBadgeLabel(template)}
                  </Badge>
                  {isDatabaseTemplate && (
                    <Badge tone={getVerificationTone(template.verificationStatus)}>
                      {formatVerificationStatusId(template.verificationStatus)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3">
                {template.slots.map((slot) => {
                  const catalogItem = slot.itemEntityId
                    ? itemsById.get(slot.itemEntityId)
                    : undefined;

                  if (catalogItem) {
                    return (
                      <div
                        key={`${template.id}-${slot.slotOrder}`}
                        className="flex flex-col items-center gap-1"
                        title={
                          slot.isVerifiedItem
                            ? `${catalogItem.name} (Terverifikasi)`
                            : `${catalogItem.name} (Cocok katalog · UNVERIFIED)`
                        }
                      >
                        <div
                          className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full border p-1.5 ${
                            slot.isVerifiedItem
                              ? "border-emerald-500/50 bg-[#111927]"
                              : "border-amber-500/50 bg-[#111927]"
                          }`}
                        >
                          {catalogItem.iconUrl ? (
                            <Image
                              src={catalogItem.iconUrl}
                              alt={catalogItem.name}
                              width={64}
                              height={64}
                              unoptimized
                              className="h-full w-full rounded-full object-contain"
                            />
                          ) : (
                            <span className="px-1 text-center text-[10px] font-medium text-slate-200">
                              {catalogItem.name}
                            </span>
                          )}
                        </div>
                        <span className="line-clamp-1 w-full text-center text-[10px] text-slate-300">
                          {catalogItem.name}
                        </span>
                      </div>
                    );
                  }

                  if (slot.rawItemName) {
                    return (
                      <div
                        key={`${template.id}-${slot.slotOrder}`}
                        className="flex flex-col items-center gap-1"
                        title={`Item mentah belum cocok katalog (UNVERIFIED): ${slot.rawItemName}`}
                      >
                        <div className="flex aspect-square w-full flex-col items-center justify-center rounded-full border border-dashed border-amber-500/60 bg-amber-500/5 p-1.5 text-center">
                          <span className="line-clamp-2 text-[9px] font-medium text-amber-200">
                            {slot.rawItemName}
                          </span>
                        </div>
                        <span className="text-[9px] text-amber-400">
                          Mentah · Unverified
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${template.id}-${slot.slotOrder}`}
                      className="flex aspect-square items-center justify-center rounded-full border border-dashed border-slate-600 bg-[#111927] text-lg text-slate-500"
                      aria-label={`Slot ${slot.slotOrder} belum diisi`}
                    >
                      +
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span>
                    {filledCount}/6 item
                    {rawUnmatchedCount > 0
                      ? ` (${rawUnmatchedCount} mentah belum cocok katalog)`
                      : ""}
                    {!isDatabaseTemplate
                      ? " · Belum merupakan rekomendasi terverifikasi"
                      : template.sourceLabel
                        ? ` · ${template.sourceLabel}`
                        : ""}
                  </span>
                  {template.sourceUrl && (
                    <a
                      href={template.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 hover:underline"
                    >
                      Lihat sumber ↗
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
                >
                  Gunakan & Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
