"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Surface } from "@/components/ui/Surface";
import type { ItemCatalogRecord } from "../server/item.repository";
import { ITEM_CATEGORIES } from "../schemas/item.schema";

interface ItemCatalogProps {
  items: ItemCatalogRecord[];
  patchVersion: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  Attack: "Attack",
  Magic: "Magic",
  Defense: "Defense",
  Movement: "Movement",
  Jungling: "Jungling",
  Roaming: "Roaming",
};

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
  OTHER: "Other",
};

export function ItemCatalog({
  items,
  patchVersion,
}: ItemCatalogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const finishedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.recipe.recipeType === "COMPOSITE_ITEM" ||
          item.recipe.recipeType === "SPECIAL_ITEM" ||
          item.category === "Jungling" ||
          item.category === "Roaming",
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return finishedItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.slug.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        category === "ALL" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [finishedItems, search, category]);

  return (
    <div className="space-y-5">
      <Surface className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama item..."
            aria-label="Cari item"
            className="min-h-11 flex-1 rounded-xl border border-[#243440] bg-[#0B1014] px-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/70"
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Badge tone="blue">{patchVersion || "Patch tidak tersedia"}</Badge>
            <Badge tone="emerald">Original Server</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            aria-pressed={category === "ALL"}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              category === "ALL"
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:border-[#2C3E4B] hover:text-slate-100"
            }`}
          >
            Semua
          </button>

          {ITEM_CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                category === value
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                  : "border-[#1E2A33] bg-[#0B1014] text-slate-400 hover:border-[#2C3E4B] hover:text-slate-100"
              }`}
            >
              {CATEGORY_LABELS[value] ?? value}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500" aria-live="polite">
          Menampilkan {filteredItems.length} dari {finishedItems.length} item jadi
        </div>
      </Surface>

      {filteredItems.length === 0 ? (
        <Surface className="p-10 text-center">
          <p className="font-medium text-slate-200">
            Item tidak ditemukan
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Coba kata kunci atau kategori lain.
          </p>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Link
              key={item.entityId}
              href={`/items/${item.slug}`}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Surface className="h-full p-4 transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-400/45 group-hover:bg-[#141D24]">
                <div className="flex gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1E2A33] bg-[#0B1014]">
                    {item.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.iconUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">ITEM</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-slate-100 group-hover:text-emerald-300">
                      {item.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="neutral">{item.category}</Badge>
                      {item.tier && (
                        <Badge tone="blue">{item.tier}</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-medium text-amber-300">
                      {item.price !== null
                        ? `${item.price.toLocaleString("id-ID")} Gold`
                        : "Harga belum tersedia"}
                    </div>
                  </div>
                </div>

                {item.attributes.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.attributes.slice(0, 3).map((attribute, index) => (
                      <span
                        key={`${attribute.type}-${index}`}
                        className="rounded-md bg-[#1B2637] px-2 py-1 text-[11px] text-slate-300"
                      >
                        {ATTRIBUTE_LABELS[attribute.type] ?? attribute.type}
                        {attribute.value !== null
                          ? ` +${attribute.value}${attribute.unit ?? ""}`
                          : ""}
                      </span>
                    ))}
                    {item.attributes.length > 3 && (
                      <span className="px-1 py-1 text-[11px] text-slate-500">
                        +{item.attributes.length - 3} lainnya
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-[#293548] pt-3">
                  <span className="text-xs text-slate-500">
                    {item.passiveEffects.length} passive · {item.activeEffects.length} active
                  </span>
                  <Badge
                    tone={
                      item.verificationStatus === "PARTIALLY_VERIFIED"
                        ? "amber"
                        : "neutral"
                    }
                  >
                    {item.verificationStatus === "PARTIALLY_VERIFIED"
                      ? "Verifikasi parsial"
                      : "Belum terverifikasi"}
                  </Badge>
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}