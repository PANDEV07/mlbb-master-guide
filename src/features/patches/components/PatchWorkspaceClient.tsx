"use client";

import { useMemo, useState } from "react";
import { Calendar, CheckCircle2, FileDiff, ShieldAlert } from "lucide-react";
import type { PatchChangeType, ServerEnvironment } from "@/types/knowledge";
import {
  SERVER_TRACK_CATEGORIES,
  filterPatchChanges,
  filterPatchesByServer,
  type PatchChangeRecord,
  type PatchVersionSummary,
} from "../index";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Props = {
  patches: PatchVersionSummary[];
  changes: PatchChangeRecord[];
};

const CHANGE_TYPES: ReadonlyArray<PatchChangeType | "ALL"> = [
  "ALL",
  "BUFF",
  "NERF",
  "ADJUST",
  "REVAMP",
  "NEW",
  "BUGFIX",
];

function getChangeBadgeTone(
  type: PatchChangeType,
): "emerald" | "amber" | "blue" | "gold" | "neutral" {
  switch (type) {
    case "BUFF":
    case "NEW":
      return "emerald";
    case "NERF":
      return "amber";
    case "REVAMP":
      return "gold";
    case "ADJUST":
      return "blue";
    default:
      return "neutral";
  }
}

export function PatchWorkspaceClient({ patches, changes }: Props) {
  const [serverType, setServerType] =
    useState<ServerEnvironment>("ORIGINAL_SERVER");
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [changeTypeFilter, setChangeTypeFilter] = useState<
    PatchChangeType | "ALL"
  >("ALL");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("ALL");

  const patchesForServer = useMemo(
    () => filterPatchesByServer(patches, serverType),
    [patches, serverType],
  );

  const activePatch = useMemo(() => {
    if (patchesForServer.length === 0) return null;
    if (selectedPatchId) {
      const found = patchesForServer.find((p) => p.id === selectedPatchId);
      if (found) return found;
    }
    return (
      patchesForServer.find((p) => p.isCurrentLive) ?? patchesForServer[0]
    );
  }, [patchesForServer, selectedPatchId]);

  const changesForActivePatch = useMemo(() => {
    if (!activePatch) return [];
    return changes.filter((item) => item.patchVersionId === activePatch.id);
  }, [changes, activePatch]);

  const availableEntityTypes = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(changesForActivePatch.map((item) => item.targetEntityType)),
      ).sort(),
    ],
    [changesForActivePatch],
  );

  const filteredChanges = useMemo(
    () =>
      activePatch
        ? filterPatchChanges(changes, {
            patchVersionId: activePatch.id,
            changeType: changeTypeFilter,
            targetEntityType: entityTypeFilter,
          })
        : [],
    [activePatch, changes, changeTypeFilter, entityTypeFilter],
  );

  return (
    <section aria-labelledby="patch-tracker-heading" className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {SERVER_TRACK_CATEGORIES.map((env) => {
          const isSelected = serverType === env.id;
          const countForEnv = patches.filter(
            (p) => p.serverType === env.id,
          ).length;

          return (
            <button
              key={env.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setServerType(env.id);
                setSelectedPatchId(null);
                setChangeTypeFilter("ALL");
                setEntityTypeFilter("ALL");
              }}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                isSelected
                  ? "border-amber-400/70 bg-amber-500/10"
                  : "border-[#1E2738] bg-[#0E1420] hover:border-slate-600",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge
                  tone={env.id === "ORIGINAL_SERVER" ? "emerald" : "amber"}
                >
                  {env.title}
                </Badge>
                <span className="text-xs font-medium text-slate-400">
                  {countForEnv} patch
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                {env.description}
              </p>
            </button>
          );
        })}
      </div>

      <Surface elevated className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="patch-tracker-heading"
              className="text-base font-semibold text-slate-100"
            >
              Riwayat Versi &amp; Catatan Perubahan ({serverType.replaceAll("_", " ")})
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Data dibaca langsung dari tabel <code className="text-slate-300">patch_versions</code> dan{" "}
              <code className="text-slate-300">patch_changes</code> dengan isolasi ketat antar server.
            </p>
          </div>
          <Badge tone={serverType === "ORIGINAL_SERVER" ? "emerald" : "amber"}>
            {patchesForServer.length} versi tercatat
          </Badge>
        </div>

        {patchesForServer.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E2738] bg-[#0A0E16] p-6">
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <h3 className="text-sm font-semibold">
                Belum Ada Catatan Patch untuk {serverType.replaceAll("_", " ")}
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Sesuai kebijakan <code className="text-slate-300">PATCH_UPDATE_SYSTEM.md</code>,
              perubahan uji coba <em>Advance Server</em> atau konsep <em>Experimental</em> tidak
              pernah dicampur ke data <em>Original Server</em> dan hanya dicatat bila ada rujukan
              verifikasi yang sah.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Daftar Versi Patch */}
            <div className="space-y-2 lg:col-span-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Pilih Versi Patch
              </p>
              <div className="space-y-2">
                {patchesForServer.map((patch) => {
                  const selected = activePatch?.id === patch.id;
                  const diffCount = changes.filter(
                    (c) => c.patchVersionId === patch.id,
                  ).length;

                  return (
                    <button
                      key={patch.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatchId(patch.id);
                        setChangeTypeFilter("ALL");
                        setEntityTypeFilter("ALL");
                      }}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition",
                        selected
                          ? "border-amber-400/60 bg-amber-500/10"
                          : "border-[#1E2738] bg-[#0B0F17] hover:border-slate-600",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          Patch {patch.versionCode}
                        </span>
                        {patch.isCurrentLive && (
                          <Badge tone="emerald">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            LIVE
                          </Badge>
                        )}
                      </div>
                      {patch.seasonLabel && (
                        <p className="mt-1 text-xs text-slate-300">
                          {patch.seasonLabel}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {patch.releaseDate ?? "Tanggal belum tercatat"}
                        </span>
                        <span>{diffCount} diff tercatat</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail Patch Aktif & Log Perubahan */}
            <div className="space-y-4 lg:col-span-8">
              {activePatch && (
                <div className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">
                          Patch {activePatch.versionCode}
                        </h3>
                        {activePatch.isCurrentLive && (
                          <Badge tone="emerald">Live Original Server</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {activePatch.seasonLabel ?? "Label season belum tercatat"} · Rilis:{" "}
                        {activePatch.releaseDate ?? "Belum tercatat"}
                      </p>
                    </div>
                    <Badge tone="neutral">Order: {activePatch.versionOrder}</Badge>
                  </div>

                  {activePatch.notesSummary && (
                    <p className="mt-3 rounded-lg border border-white/5 bg-[#080B10] p-3 text-xs leading-relaxed text-slate-300">
                      {activePatch.notesSummary}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileDiff className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Log Perubahan Terstruktur (patch_changes)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {filteredChanges.length} entri
                  </span>
                </div>

                {changesForActivePatch.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {CHANGE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setChangeTypeFilter(type)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
                          changeTypeFilter === type
                            ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                            : "border-[#1E2738] bg-[#0B0F17] text-slate-400 hover:text-slate-200",
                        )}
                      >
                        {type}
                      </button>
                    ))}
                    {availableEntityTypes.length > 2 && (
                      <select
                        aria-label="Filter tipe entitas perubahan patch"
                        value={entityTypeFilter}
                        onChange={(event) =>
                          setEntityTypeFilter(event.target.value)
                        }
                        className="rounded-md border border-[#1E2738] bg-[#0B0F17] px-2.5 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-400"
                      >
                        {availableEntityTypes.map((entity) => (
                          <option key={entity} value={entity}>
                            Entitas: {entity}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {filteredChanges.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#1E2738] bg-[#0A0E16] p-5">
                    <p className="text-xs font-semibold text-slate-200">
                      {changesForActivePatch.length === 0
                        ? `Belum ada diff terstruktur di tabel patch_changes untuk Patch ${activePatch?.versionCode ?? "-"}.`
                        : "Tidak ada perubahan yang cocok dengan filter saat ini."}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      Angka buff/nerf hero, item, atau battlefield hanya boleh dimasukkan setelah
                      diverifikasi langsung dari patch notes resmi klien Original Server atau rilis
                      resmi MOONTON (bukan ringkasan blog komunitas atau URL redirect sementara).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredChanges.map((change) => (
                      <article
                        key={change.id}
                        className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={getChangeBadgeTone(change.changeType)}>
                              {change.changeType}
                            </Badge>
                            <span className="text-xs font-semibold text-white">
                              {change.targetEntitySlug ?? change.targetEntityType}
                            </span>
                            {change.attributeName && (
                              <span className="text-xs text-slate-400">
                                · {change.attributeName}
                              </span>
                            )}
                          </div>
                          <Badge tone="neutral">{change.targetEntityType}</Badge>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-300">
                          {change.summary}
                        </p>

                        {(change.previousValue || change.newValue) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="rounded bg-slate-900 px-2 py-0.5 text-slate-400">
                              Sebelum: {change.previousValue ?? "-"}
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-200">
                              Sesudah: {change.newValue ?? "-"}
                            </span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Surface>
    </section>
  );
}
