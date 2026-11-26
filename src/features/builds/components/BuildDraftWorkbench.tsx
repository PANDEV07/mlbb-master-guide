"use client";

import { useEffect, useMemo, useState } from "react";
import type { HeroRecord } from "@/features/heroes";
import type { ItemCatalogRecord } from "@/features/items/server/item.repository";
import type { HeroBuildTemplate } from "../types/build.types";
import {
  composeThreeBuildTemplates,
  createEmptyDraftSlots,
  templateToDraftSlots,
  type DraftSlot,
} from "../utils/template-mapper";
import { BuildTemplatePanel } from "./BuildTemplatePanel";
import { Badge } from "@/components/ui/Badge";
import { Surface } from "@/components/ui/Surface";

type Props = {
  hero: HeroRecord;
  items: ItemCatalogRecord[];
  patchVersion: string;
  templates?: HeroBuildTemplate[];
};

type SavedBuild = {
  id: string;
  name: string;
  slots: DraftSlot[];
  updatedAt: string;
};

type PickerMode = "main" | "alternative" | "boots";
type ItemCategoryFilter = "All" | "Attack" | "Defense" | "Magic" | "Movement" | "Jungling" | "Roaming";

const createSlots = createEmptyDraftSlots;

export function BuildDraftWorkbench({ hero, items, patchVersion, templates }: Props) {
  const [slots, setSlots] = useState<DraftSlot[]>(createSlots);
  const [pendingModifierId, setPendingModifierId] = useState("");
  const [loadedDraftKey, setLoadedDraftKey] = useState<string | null>(null);

  const storageKey = `mlbb-build-draft:${hero.entityId}`;

  // Muat draft milik hero ini dari browser
  useEffect(() => {
    setLoadedDraftKey(null);

    try {
      const saved = window.localStorage.getItem(storageKey);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length === 6) {
          const restored: DraftSlot[] = parsed.map((entry: unknown) => {
            if (!entry || typeof entry !== "object") {
              return {
                itemEntityId: "",
                modifierItemEntityId: "",
                alternativeItemEntityId: "",
                rationale: "",
              };
            }

            const value = entry as Record<string, unknown>;

            return {
              itemEntityId:
                typeof value.itemEntityId === "string" ? value.itemEntityId : "",
              modifierItemEntityId:
                typeof value.modifierItemEntityId === "string"
                  ? value.modifierItemEntityId
                  : "",
              alternativeItemEntityId:
                typeof value.alternativeItemEntityId === "string"
                  ? value.alternativeItemEntityId
                  : "",
              rationale:
                typeof value.rationale === "string" ? value.rationale : "",
            };
          });

          setSlots(restored);
        } else {
          setSlots(createSlots());
        }
      } else {
        setSlots(createSlots());
      }
    } catch {
      setSlots(createSlots());
    }

    setLoadedDraftKey(storageKey);
  }, [storageKey]);

  // Simpan otomatis setelah draft selesai dimuat
  useEffect(() => {
    if (loadedDraftKey !== storageKey) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(slots));
    } catch {
      // Browser dapat menolak penyimpanan jika kuota penuh atau storage dibatasi.
    }
  }, [slots, storageKey, loadedDraftKey]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>("main");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategoryFilter>("All");
  const [previewItemId, setPreviewItemId] = useState("");
  const savedBuildStorageKey = `mlbb-build-saved:${hero.entityId}`;
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [savedBuildsLoaded, setSavedBuildsLoaded] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const resolvedTemplates = useMemo(
    () => (templates && templates.length > 0 ? templates : composeThreeBuildTemplates([])),
    [templates],
  );

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.entityId, item])),
    [items],
  );

  const validItemIds = useMemo(
    () => new Set(items.map((item) => item.entityId)),
    [items],
  );

  const loadPreset = (template: HeroBuildTemplate) => {
    setSlots(templateToDraftSlots(template, validItemIds));
    setBuildName(`${hero.metadata.name} - ${template.name}`);
    setEditingBuildId(null);
    setActivePresetId(template.id);
    setActiveSlot(null);
    setPreviewItemId("");
  };

  useEffect(() => {
    setSavedBuildsLoaded(false);

    try {
      const raw = window.localStorage.getItem(savedBuildStorageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        const validBuilds: SavedBuild[] = parsed.filter(
          (entry): entry is SavedBuild =>
            Boolean(
              entry &&
              typeof entry === "object" &&
              typeof entry.id === "string" &&
              typeof entry.name === "string" &&
              Array.isArray(entry.slots) &&
              entry.slots.length === 6 &&
              typeof entry.updatedAt === "string",
            ),
        );

        setSavedBuilds(validBuilds);
      } else {
        setSavedBuilds([]);
      }
    } catch {
      setSavedBuilds([]);
    }

    setSavedBuildsLoaded(true);
  }, [savedBuildStorageKey]);

  useEffect(() => {
    if (!savedBuildsLoaded) return;

    try {
      window.localStorage.setItem(
        savedBuildStorageKey,
        JSON.stringify(savedBuilds),
      );
    } catch {
      // Penyimpanan browser mungkin tidak tersedia atau penuh.
    }
  }, [savedBuilds, savedBuildsLoaded, savedBuildStorageKey]);

  const saveBuild = () => {
    const name = buildName.trim();

    if (!name || !savedBuildsLoaded) return;

    const updatedAt = new Date().toISOString();

    if (editingBuildId) {
      setSavedBuilds((current) =>
        current.map((build) =>
          build.id === editingBuildId
            ? { ...build, name, slots: slots.map((slot) => ({ ...slot })), updatedAt }
            : build,
        ),
      );
    } else {
      setSavedBuilds((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          name,
          slots: slots.map((slot) => ({ ...slot })),
          updatedAt,
        },
      ]);
    }

    setEditingBuildId(null);
    setBuildName("");
  };

  const editSavedBuild = (build: SavedBuild) => {
    setSlots(build.slots.map((slot) => ({
      ...slot,
      modifierItemEntityId:
        typeof slot.modifierItemEntityId === "string"
          ? slot.modifierItemEntityId
          : "",
    })));
    setBuildName(build.name);
    setEditingBuildId(build.id);
    setActiveSlot(null);
  };

  const cancelBuildEdit = () => {
    setEditingBuildId(null);
    setBuildName("");
  };

  const deleteSavedBuild = (id: string) => {
    setSavedBuilds((current) => current.filter((build) => build.id !== id));

    if (editingBuildId === id) {
      cancelBuildEdit();
    }
  };

  const selectableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.recipe.recipeType === "COMPOSITE_ITEM" ||
          item.recipe.recipeType === "SPECIAL_ITEM" ||
          item.category === "Movement" ||
          item.category === "Jungling" ||
          item.category === "Roaming",
      ),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return selectableItems.filter((item) => {
      const matchesName = item.name.toLowerCase().includes(query);
      const categoryFilter = pickerMode === "boots" ? "Movement" : selectedCategory;
      const matchesCategory =
        categoryFilter === "All" ||
        item.category.trim().toLowerCase() === categoryFilter.toLowerCase();

      return matchesName && matchesCategory;
    });
  }, [selectableItems, search, selectedCategory, pickerMode]);

  const previewItem = selectableItems.find((item) => item.entityId === previewItemId);

  const getItem = (id: string) =>
    selectableItems.find((item) => item.entityId === id);

  const updateSlot = (index: number, patch: Partial<DraftSlot>) => {
    setSlots((current) =>
      current.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)),
    );
  };

  const openPicker = (index: number, mode: PickerMode) => {
    setActiveSlot(index);
    setPickerMode(mode);
    setPendingModifierId("");
    setSearch("");
    setPreviewItemId("");
  };

  const chooseItem = (item: ItemCatalogRecord) => {
    if (activeSlot === null) return;

    if (pickerMode === "boots") {
      updateSlot(activeSlot, {
        itemEntityId: item.entityId,
        modifierItemEntityId: pendingModifierId,
      });
      setPendingModifierId("");
      setActiveSlot(null);
      return;
    }

    if (pickerMode === "main") {
      if (item.category === "Jungling" || item.category === "Roaming") {
        setPendingModifierId(item.entityId);
        setPickerMode("boots");
        setSelectedCategory("Movement");
        setSearch("");
        setPreviewItemId("");
        return;
      }

      updateSlot(activeSlot, {
        itemEntityId: item.entityId,
        modifierItemEntityId: "",
        alternativeItemEntityId:
          slots[activeSlot].alternativeItemEntityId === item.entityId
            ? ""
            : slots[activeSlot].alternativeItemEntityId,
      });
    } else {
      updateSlot(activeSlot, {
        alternativeItemEntityId: item.entityId,
      });
    }

    setActiveSlot(null);
  };

  const selectedCount = slots.filter((slot) => slot.itemEntityId).length;
  const completeCount = slots.filter(
    (slot) => slot.itemEntityId && slot.rationale.trim(),
  ).length;

  return (
    <div className="space-y-5">
      <BuildTemplatePanel
        heroName={hero.metadata.name}
        templates={resolvedTemplates}
        itemsById={itemsById}
        activePresetId={activePresetId}
        onSelectTemplate={loadPreset}
      />

      <Surface className="space-y-4 p-4 sm:p-5">
        <div>
          <h2 className="font-semibold text-white">
            {editingBuildId ? "Edit Build Tersimpan" : "Simpan Build"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Simpan susunan item {hero.metadata.name} agar bisa dibuka dan diedit kembali.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={buildName}
            onChange={(event) => setBuildName(event.target.value)}
            placeholder="Nama build, misalnya Miya Gold Lane"
            aria-label="Nama build"
            maxLength={80}
            className="min-h-11 flex-1 rounded-lg border border-slate-700 bg-[#0B111B] px-3 text-sm text-white outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={saveBuild}
            disabled={!savedBuildsLoaded || !buildName.trim() || selectedCount === 0}
            className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editingBuildId ? "Simpan Perubahan" : "Simpan Build"}
          </button>
          {editingBuildId && (
            <button
              type="button"
              onClick={cancelBuildEdit}
              className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              Batal Edit
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Build Tersimpan</h3>
            <Badge tone="blue">{savedBuilds.length} build</Badge>
          </div>

          {!savedBuildsLoaded ? (
            <p className="text-xs text-slate-500">Memuat penyimpanan...</p>
          ) : savedBuilds.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">
              Belum ada build tersimpan untuk hero ini.
            </p>
          ) : (
            <div className="space-y-2">
              {savedBuilds.map((build) => (
                <div
                  key={build.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#0B111B] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {build.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {build.slots.filter((slot) => slot.itemEntityId).length}/6 item · Diperbarui {new Date(build.updatedAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editSavedBuild(build)}
                      className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus build "${build.name}"?`)) {
                          deleteSavedBuild(build.id);
                        }
                      }}
                      className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Surface>

      <Surface className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white">Susunan Item</h2>
            <p className="text-xs text-slate-400">
              Ketuk slot untuk memilih gambar item.
            </p>
          </div>
          <Badge tone="amber">{selectedCount}/6 item</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {slots.map((slot, index) => {
            const item = getItem(slot.itemEntityId);
            const modifier = getItem(slot.modifierItemEntityId);
            const alternative = getItem(slot.alternativeItemEntityId);

            return (
              <div key={index} className="min-w-0 space-y-2">
                <button
                  type="button"
                  onClick={() => openPicker(index, "main")}
                  aria-label={`Pilih item slot ${index + 1}`}
                  className="group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-600 bg-[#0B111B] p-2 transition hover:border-amber-400 hover:bg-amber-400/5"
                >
                  {item?.iconUrl ? (
                    <img
                      src={item.iconUrl}
                      alt={item.name}
                      className="h-full w-full rounded-xl object-contain"
                    />
                  ) : (
                    <span className="text-3xl text-slate-500 group-hover:text-amber-300">+</span>
                  )}
                  {modifier?.iconUrl && (
                    <span className="absolute bottom-1 right-1 h-9 w-9 rounded-lg border-2 border-[#111927] bg-[#0B111B] p-1 shadow-lg">
                      <img src={modifier.iconUrl} alt={modifier.name} className="h-full w-full object-contain" />
                    </span>
                  )}
                </button>

                <p className="line-clamp-2 text-center text-xs font-medium text-slate-300">
                  {item?.name ?? `Slot ${index + 1}`}
                  {modifier ? ` + ${modifier.name}` : ""}
                </p>
                {modifier && (
                  <button
                    type="button"
                    onClick={() => updateSlot(index, { modifierItemEntityId: "" })}
                    className="w-full text-[10px] text-amber-300 hover:underline"
                  >
                    Hapus modifier
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openPicker(index, "alternative")}
                  className="w-full rounded-lg border border-slate-700 px-1 py-2 text-[10px] text-slate-400 hover:border-amber-400 hover:text-amber-300"
                >
                  {alternative ? "Ganti alternatif" : "+ Alternatif"}
                </button>

                {alternative && (
                  <div className="flex items-center gap-1">
                    {alternative.iconUrl && (
                      <img
                        src={alternative.iconUrl}
                        alt={alternative.name}
                        className="h-6 w-6 rounded object-contain"
                      />
                    )}
                    <span className="truncate text-[10px] text-slate-400">
                      {alternative.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Hapus alternatif slot ${index + 1}`}
                      onClick={() => updateSlot(index, { alternativeItemEntityId: "" })}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                )}

                <textarea
                  value={slot.rationale}
                  onChange={(event) =>
                    updateSlot(index, { rationale: event.target.value })
                  }
                  rows={2}
                  placeholder="Alasan item..."
                  aria-label={`Alasan item slot ${index + 1}`}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-[#0B111B] p-2 text-[11px] text-white outline-none placeholder:text-slate-600 focus:border-amber-400"
                />

                {item && (
                  <button
                    type="button"
                    onClick={() => updateSlot(index, { itemEntityId: "", modifierItemEntityId: "" })}
                    className="w-full text-[10px] text-red-400 hover:underline"
                  >
                    Hapus item
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Surface>

      <Surface className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">Kelengkapan draft</h3>
            <p className="text-xs text-slate-400">
              Setiap slot membutuhkan item dan alasan pemilihan.
            </p>
          </div>
          <Badge tone={completeCount === 6 ? "blue" : "neutral"}>
            {completeCount}/6 lengkap
          </Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${(completeCount / 6) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Patch {patchVersion || "belum tersedia"} · Draft lokal untuk {hero.metadata.name}.
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {loadedDraftKey === storageKey ? "Auto-save aktif" : "Memuat draft..."}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Draft disimpan di browser ini, bukan di server atau akun pengguna.
        </p>
      </Surface>

      {activeSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pilih item"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveSlot(null);
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-700 bg-[#111927] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <div>
                <h3 className="font-semibold text-white">
                  {pickerMode === "main"
                    ? "Pilih Item"
                    : pickerMode === "boots"
                      ? "Pilih Boots"
                      : "Pilih Item Alternatif"}
                </h3>
                <p className="text-xs text-slate-400">
                  {pickerMode === "boots"
                    ? "Tahap 2/2 · Pilih boots untuk modifier"
                    : `Slot ${activeSlot + 1} · Ketuk ikon item`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800"
              >
                Tutup ✕
              </button>
            </div>

            <div className="p-4">
              <input
                type="search"
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama item..."
                className="mb-4 w-full rounded-xl border border-slate-700 bg-[#0B111B] px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
              />

              <div className="mb-4 flex flex-wrap gap-2">
                {(["All", "Attack", "Defense", "Magic", "Movement", "Jungling", "Roaming"] as const).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    disabled={pickerMode === "boots" && category !== "Movement"}
                    aria-pressed={selectedCategory === category}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                      selectedCategory === category
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                        : "border-slate-700 bg-[#0B111B] text-slate-400 hover:text-white"
                    }`}
                  >
                    {category === "All" ? "Semua Item" : category}
                  </button>
                ))}
              </div>

              <div className="grid max-h-[55dvh] grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-6 md:grid-cols-7">
                {filteredItems
                  .filter((item) =>
                    pickerMode === "main"
                      ? true
                      : item.entityId !== slots[activeSlot].itemEntityId,
                  )
                  .map((item) => (
                    <button
                      key={item.entityId}
                      type="button"
                      title={`${item.name}${item.price !== null ? ` · ${item.price}` : ""}`}
                      onClick={() => setPreviewItemId(item.entityId)}
                      className="group flex min-w-0 flex-col items-center gap-2 rounded-xl border border-slate-700 bg-[#0B111B] p-2 transition hover:border-amber-400 hover:bg-amber-400/5"
                    >
                      <div className="flex aspect-square w-full items-center justify-center">
                        {item.iconUrl ? (
                          <img
                            src={item.iconUrl}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">?</span>
                        )}
                      </div>
                      <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-slate-300 group-hover:text-amber-300">
                        {item.name}
                      </span>
                    </button>
                  ))}
              </div>

              {previewItem && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-[#0B111B] p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-[#111927] p-2">
                      {previewItem.iconUrl ? (
                        <img
                          src={previewItem.iconUrl}
                          alt={previewItem.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl text-slate-500">?</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white">
                        {previewItem.name}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="amber">{previewItem.category}</Badge>
                        <Badge tone="neutral">
                          {previewItem.price !== null
                            ? `${previewItem.price} Gold`
                            : "Harga belum tersedia"}
                        </Badge>
                        <Badge tone="neutral">
                          {previewItem.verificationStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {previewItem.attributes.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Atribut
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {previewItem.attributes.map((attribute, index) => (
                          <div
                            key={`${attribute.type}-${index}`}
                            className="rounded-lg border border-slate-700 bg-[#111927] p-2"
                          >
                            <p className="text-xs text-slate-400">
                              {attribute.type}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-200">
                              {attribute.value !== null
                                ? `${attribute.value}${attribute.unit ?? ""}`
                                : "Belum tersedia"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewItem.passiveEffects.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Efek Pasif
                      </p>
                      {previewItem.passiveEffects.map((effect, index) => (
                        <div
                          key={`${effect.name}-${index}`}
                          className="rounded-lg border border-slate-700 bg-[#111927] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-200">
                              {effect.name}
                            </p>
                            <Badge tone="neutral">
                              {effect.verificationStatus}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {effect.description || "Deskripsi belum tersedia."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewItem.activeEffects.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Efek Aktif
                      </p>
                      {previewItem.activeEffects.map((effect, index) => (
                        <div
                          key={`${effect.name}-${index}`}
                          className="rounded-lg border border-slate-700 bg-[#111927] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-200">
                              {effect.name}
                            </p>
                            <Badge tone="neutral">
                              {effect.verificationStatus}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {effect.description || "Deskripsi belum tersedia."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewItem.attributes.length === 0 &&
                    previewItem.passiveEffects.length === 0 &&
                    previewItem.activeEffects.length === 0 && (
                      <p className="mt-4 text-xs text-slate-500">
                        Detail atribut dan efek item belum tersedia pada data katalog.
                      </p>
                    )}

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewItemId("")}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseItem(previewItem)}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400"
                    >
                      Gunakan Item
                    </button>
                  </div>
                </div>
              )}

              {filteredItems.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  Item tidak ditemukan.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}