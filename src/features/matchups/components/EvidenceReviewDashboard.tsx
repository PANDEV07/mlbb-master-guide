"use client";

import { useMemo, useState } from "react";
import { Surface } from "@/components/ui/Surface";
import type {
  EvidenceReviewItem,
} from "../engine/evidence-review-queue";
import {
  createManualReviewRecord,
  type ManualReviewInput,
  type ManualReviewRecord,
  type ReviewStatus,
} from "../engine/evidence-review-workflow";

type Props = {
  items: EvidenceReviewItem[];
  metadata: {
    heroes?: number;
    mechanicRecords?: number;
    evidenceSkillRecords?: number;
    interactionCandidates?: number;
    reviewItems?: number;
    groupedSkillPairs?: number;
    uniqueDirectedHeroPairs?: number;
    verificationStatus?: string;
  };
};

type FilterStatus =
  | "ALL"
  | "UNREVIEWED"
  | "NEEDS_REVIEW"
  | "VERIFIED"
  | "REJECTED";

type WorkspaceState = {
  schemaVersion: "1.0";
  updatedAt: string;
  currentReviews: ManualReviewRecord[];
  auditTrail: ManualReviewRecord[];
};

const PAGE_SIZE = 30;

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob(
    [JSON.stringify(value, null, 2)],
    { type: "application/json;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function statusLabel(status: string | undefined) {
  switch (status) {
    case "NEEDS_REVIEW": return "Perlu Review";
    case "VERIFIED": return "Verified";
    case "REJECTED": return "Rejected";
    default: return "Belum Direview";
  }
}

function statusClass(status: string | undefined) {
  switch (status) {
    case "NEEDS_REVIEW":
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    case "VERIFIED":
      return "border-emerald-400/30 bg-emerald-400/10 text-[#F5B83D]";
    case "REJECTED":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-slate-700 bg-slate-800/70 text-slate-300";
  }
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Surface className="p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums text-white">
        {value.toLocaleString("id-ID")}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">{description}</p>
    </Surface>
  );
}

export function EvidenceReviewDashboard({ items, metadata }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [currentReviews, setCurrentReviews] = useState<
    ManualReviewRecord[]
  >([]);
  const [auditTrail, setAuditTrail] = useState<ManualReviewRecord[]>([]);

  const [reviewer, setReviewer] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    Exclude<ReviewStatus, "UNVERIFIED">
  >("NEEDS_REVIEW");
  const [rationale, setRationale] = useState("");
  const [sourceRefs, setSourceRefs] = useState("");
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(false);
  const [reviewedAt, setReviewedAt] = useState(
    () => new Date().toISOString().slice(0, 16),
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const reviewMap = useMemo(
    () => new Map(currentReviews.map((record) => [record.itemId, record])),
    [currentReviews],
  );

  const counts = useMemo(() => {
    const result = {
      unreviewed: 0,
      needsReview: 0,
      verified: 0,
      rejected: 0,
    };

    for (const item of items) {
      const status = reviewMap.get(item.id)?.status;

      if (status === "NEEDS_REVIEW") result.needsReview += 1;
      else if (status === "VERIFIED") result.verified += 1;
      else if (status === "REJECTED") result.rejected += 1;
      else result.unreviewed += 1;
    }

    return result;
  }, [items, reviewMap]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const review = reviewMap.get(item.id);
      const status = review?.status;

      const statusMatches =
        filter === "ALL" ||
        (filter === "UNREVIEWED" && !status) ||
        status === filter;

      if (!statusMatches) return false;
      if (!query) return true;

      const searchable = [
        item.id,
        item.ruleId,
        item.sourceHero,
        item.targetHero,
        ...item.supportingSkillPairs.flatMap((pair) => [
          pair.sourceSkill,
          pair.targetSkill,
          String(pair.sourceApiSkillId ?? ""),
          String(pair.targetApiSkillId ?? ""),
        ]),
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });
  }, [items, search, filter, reviewMap]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleItems = filteredItems.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const selectedItem =
    items.find((item) => item.id === selectedId) ?? visibleItems[0];

  const selectedReview = selectedItem
    ? reviewMap.get(selectedItem.id)
    : undefined;

  const selectItem = (item: EvidenceReviewItem) => {
    setSelectedId(item.id);
    setError("");
    setMessage("");

    const existing = reviewMap.get(item.id);
    setReviewStatus(existing?.status ?? "NEEDS_REVIEW");
    setReviewer(existing?.reviewer ?? "");
    setRationale(existing?.rationale ?? "");
    setSourceRefs(existing?.sourceRefs.join("\n") ?? "");
    setEvidenceConfirmed(existing?.evidenceConfirmed ?? false);
    setReviewedAt(
      existing?.reviewedAt
        ? new Date(existing.reviewedAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    );
  };

  const saveDecision = () => {
    if (!selectedItem) return;

    setError("");
    setMessage("");

    try {
      const refs = sourceRefs
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

      const input: ManualReviewInput = {
        itemId: selectedItem.id,
        status: reviewStatus,
        reviewer,
        reviewedAt: new Date(reviewedAt).toISOString(),
        rationale,
        evidenceConfirmed,
        sourceRefs: refs,
      };

      const record = createManualReviewRecord(input);
      const next = new Map(
        currentReviews.map((entry) => [entry.itemId, entry]),
      );

      next.set(record.itemId, record);

      setCurrentReviews([...next.values()].sort(
        (a, b) => a.itemId.localeCompare(b.itemId),
      ));
      setAuditTrail((previous) => [...previous, record]);
      setMessage(`Keputusan ${statusLabel(record.status)} tersimpan di workspace browser.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Keputusan gagal divalidasi.",
      );
    }
  };

  const exportDecisions = () => {
    downloadJson("review-decisions.json", {
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      decisions: currentReviews,
    });
  };

  const exportWorkspace = () => {
    const state: WorkspaceState = {
      schemaVersion: "1.0",
      updatedAt: new Date().toISOString(),
      currentReviews,
      auditTrail,
    };

    downloadJson("review-workspace-state.json", state);
  };

  const importDecisions = async (file?: File) => {
    if (!file) return;

    setError("");
    setMessage("");
    setIsImporting(true);

    try {
      const parsed: unknown = JSON.parse(await file.text());

      if (
        typeof parsed !== "object" ||
        parsed === null
      ) {
        throw new Error("Format JSON tidak valid.");
      }

      const data = parsed as {
        decisions?: unknown;
        currentReviews?: unknown;
        auditTrail?: unknown;
      };

      const rawDecisions = Array.isArray(data.decisions)
        ? data.decisions
        : Array.isArray(data.currentReviews)
          ? data.currentReviews
          : null;

      if (!rawDecisions) {
        throw new Error("File harus memiliki array decisions atau currentReviews.");
      }

      const validIds = new Set(items.map((item) => item.id));
      const seen = new Set<string>();

      const imported = rawDecisions.map((raw) => {
        const input = raw as ManualReviewInput;

        if (!validIds.has(input.itemId)) {
          throw new Error(`Item tidak ditemukan: ${input.itemId}`);
        }

        if (seen.has(input.itemId)) {
          throw new Error(`Item duplikat: ${input.itemId}`);
        }

        seen.add(input.itemId);
        return createManualReviewRecord(input);
      });

      const next = new Map(
        currentReviews.map((entry) => [entry.itemId, entry]),
      );

      for (const record of imported) {
        next.set(record.itemId, record);
      }

      setCurrentReviews([...next.values()]);
      setAuditTrail((previous) => [...previous, ...imported]);
      setMessage(`${imported.length} keputusan berhasil diimpor ke workspace browser.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Import gagal divalidasi.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Total Queue"
          value={items.length}
          description="Item review"
        />
        <StatCard
          label="Belum Direview"
          value={counts.unreviewed}
          description="Belum ada keputusan"
        />
        <StatCard
          label="Perlu Review"
          value={counts.needsReview}
          description="Butuh pemeriksaan lanjutan"
        />
        <StatCard
          label="Verified"
          value={counts.verified}
          description="Keputusan manual"
        />
        <StatCard
          label="Rejected"
          value={counts.rejected}
          description="Tidak didukung evidence"
        />
      </div>

      <Surface className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-white">Review Queue</h2>
            <p className="mt-1 text-xs text-slate-400">
              {filteredItems.length.toLocaleString("id-ID")} item ditemukan
              {" · "}
              {metadata.groupedSkillPairs?.toLocaleString("id-ID") ?? "—"} pasangan skill
            </p>
          </div>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] text-amber-300">
            Source: {metadata.verificationStatus ?? "UNVERIFIED"}
          </span>
        </div>

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Cari hero, skill, API ID, atau rule..."
          className="w-full rounded-xl border border-slate-700 bg-[#0B111B] px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
        />

        <div className="flex flex-wrap gap-2">
          {([
            ["ALL", "Semua"],
            ["UNREVIEWED", "Belum direview"],
            ["NEEDS_REVIEW", "Perlu review"],
            ["VERIFIED", "Verified"],
            ["REJECTED", "Rejected"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFilter(value);
                setPage(0);
              }}
              aria-pressed={filter === value}
              className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${
                filter === value
                  ? "border-amber-400 bg-amber-400/10 text-amber-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const status = reviewMap.get(item.id)?.status;
              const active = selectedItem?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectItem(item)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-amber-400 bg-amber-400/5"
                      : "border-slate-800 bg-[#0B111B] hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">
                        {item.sourceHero}
                        <span className="px-2 text-amber-400">→</span>
                        {item.targetHero}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {item.ruleId}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] ${statusClass(status)}`}>
                      {statusLabel(status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-400">
                    <span>{item.skillPairCount} pasangan skill</span>
                    <span>{item.uniqueSourceSkills} skill sumber</span>
                    <span>{item.uniqueTargetSkills} skill target</span>
                  </div>
                </button>
              );
            })}

            {visibleItems.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-xs text-slate-500">
                Tidak ada item yang cocok dengan pencarian atau filter.
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-30"
              >
                Sebelumnya
              </button>
              <span className="text-[10px] text-slate-500">
                Halaman {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-30"
              >
                Berikutnya
              </button>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            {selectedItem ? (
              <>
                <Surface className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-amber-300">
                        Detail Review
                      </p>
                      <h3 className="mt-1 text-lg font-black text-white">
                        {selectedItem.sourceHero} → {selectedItem.targetHero}
                      </h3>
                      <p className="mt-1 break-all text-[10px] text-slate-500">
                        {selectedItem.id}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] ${statusClass(selectedReview?.status)}`}>
                      {statusLabel(selectedReview?.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Pasangan Skill", selectedItem.skillPairCount],
                      ["Skill Sumber", selectedItem.uniqueSourceSkills],
                      ["Skill Target", selectedItem.uniqueTargetSkills],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-lg bg-[#0B111B] p-2 text-center">
                        <p className="text-lg font-bold text-white">{value}</p>
                        <p className="text-[9px] text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {selectedItem.supportingSkillPairs.map((pair, index) => (
                      <div
                        key={`${pair.candidateId}-${index}`}
                        className="rounded-xl border border-slate-800 bg-[#0B111B] p-3"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-sky-300">
                              {selectedItem.sourceHero}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {pair.sourceSkill}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              Skill ID: {pair.sourceApiSkillId ?? "—"}
                              {" · "}Group: {pair.sourceApiGroupId}
                            </p>
                            <div className="mt-2 space-y-1">
                              {pair.sourceEvidence.map((evidence, evidenceIndex) => (
                                <div key={`${evidence.mechanic}-${evidenceIndex}`} className="rounded-lg border border-sky-400/10 bg-sky-400/5 p-2">
                                  <p className="text-[10px] font-semibold text-sky-300">
                                    {evidence.mechanic}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-300">
                                    “{evidence.evidenceText}”
                                  </p>
                                  <p className="text-[9px] text-slate-500">
                                    Posisi {evidence.start}–{evidence.end}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-amber-300">
                              {selectedItem.targetHero}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-white">
                              {pair.targetSkill}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              Skill ID: {pair.targetApiSkillId ?? "—"}
                              {" · "}Group: {pair.targetApiGroupId}
                            </p>
                            <div className="mt-2 space-y-1">
                              {pair.targetEvidence.map((evidence, evidenceIndex) => (
                                <div key={`${evidence.mechanic}-${evidenceIndex}`} className="rounded-lg border border-amber-400/10 bg-amber-400/5 p-2">
                                  <p className="text-[10px] font-semibold text-amber-300">
                                    {evidence.mechanic}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-300">
                                    “{evidence.evidenceText}”
                                  </p>
                                  <p className="text-[9px] text-slate-500">
                                    Posisi {evidence.start}–{evidence.end}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 border-t border-slate-800 pt-2 text-[9px] text-slate-500">
                          Candidate ID: {pair.candidateId}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                    <p className="text-xs font-bold text-amber-300">
                      Checklist verifikasi
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                      {selectedItem.conditionsToCheck.map((condition, index) => (
                        <li key={`${index}-${condition}`}>{condition}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {selectedItem.explanation}
                    </p>
                  </div>
                </Surface>

                <Surface className="space-y-3 p-4">
                  <div>
                    <h3 className="font-bold text-white">Keputusan Reviewer</h3>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Keputusan hanya berlaku untuk item ini.
                    </p>
                  </div>

                  <label className="block text-xs text-slate-400">
                    Nama reviewer
                    <input
                      value={reviewer}
                      onChange={(event) => setReviewer(event.target.value)}
                      placeholder="Nama atau ID reviewer"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B111B] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </label>

                  <label className="block text-xs text-slate-400">
                    Keputusan
                    <select
                      value={reviewStatus}
                      onChange={(event) => setReviewStatus(event.target.value as Exclude<ReviewStatus, "UNVERIFIED">)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B111B] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                    >
                      <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </label>

                  <label className="block text-xs text-slate-400">
                    Waktu review
                    <input
                      type="datetime-local"
                      value={reviewedAt}
                      onChange={(event) => setReviewedAt(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B111B] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </label>

                  <label className="block text-xs text-slate-400">
                    Alasan / catatan reviewer
                    <textarea
                      value={rationale}
                      onChange={(event) => setRationale(event.target.value)}
                      rows={3}
                      placeholder="Jelaskan dasar keputusan dan kondisi yang sudah diperiksa..."
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B111B] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </label>

                  <label className="block text-xs text-slate-400">
                    Referensi sumber (satu URL atau ID per baris)
                    <textarea
                      value={sourceRefs}
                      onChange={(event) => setSourceRefs(event.target.value)}
                      rows={2}
                      placeholder="https://... atau ID sumber"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B111B] px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </label>

                  <label className="flex items-start gap-2 rounded-lg border border-slate-800 p-3 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={evidenceConfirmed}
                      onChange={(event) => setEvidenceConfirmed(event.target.checked)}
                      className="mt-0.5 accent-amber-400"
                    />
                    Saya telah memeriksa evidence dan mengonfirmasi kecocokannya dengan sumber.
                  </label>

                  {reviewStatus === "VERIFIED" && (
                    <p className="text-[10px] leading-relaxed text-amber-300">
                      VERIFIED memerlukan konfirmasi evidence dan minimal satu referensi sumber.
                      Status ini adalah keputusan reviewer, bukan verifikasi otomatis oleh sistem.
                    </p>
                  )}

                  {error && (
                    <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                      {error}
                    </p>
                  )}

                  {message && (
                    <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-[#F5B83D]">
                      {message}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={saveDecision}
                    className="w-full rounded-xl bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-300"
                  >
                    Simpan Keputusan
                  </button>
                </Surface>
              </>
            ) : (
              <Surface className="p-8 text-center text-xs text-slate-500">
                Pilih item review untuk melihat detail evidence.
              </Surface>
            )}
          </div>
        </div>
      </Surface>

      <Surface className="space-y-3 p-4">
        <div>
          <h3 className="font-bold text-white">Impor dan Ekspor Workspace</h3>
          <p className="mt-1 text-xs text-slate-500">
            Keputusan disimpan sebagai file JSON. Refresh halaman akan menghapus state browser yang belum diekspor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportDecisions}
            disabled={currentReviews.length === 0}
            className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40"
          >
            Ekspor Keputusan ({currentReviews.length})
          </button>
          <button
            type="button"
            onClick={exportWorkspace}
            disabled={currentReviews.length === 0}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"
          >
            Ekspor Audit Trail ({auditTrail.length})
          </button>
          <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-amber-400">
            {isImporting ? "Mengimpor..." : "Impor JSON"}
            <input
              type="file"
              accept=".json,application/json"
              disabled={isImporting}
              className="hidden"
              onChange={(event) => {
                void importDecisions(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <p className="text-[10px] text-slate-500">
          Riwayat keputusan dalam sesi ini: {auditTrail.length} · Item dengan keputusan terkini: {currentReviews.length}
        </p>
      </Surface>
    </div>
  );
}