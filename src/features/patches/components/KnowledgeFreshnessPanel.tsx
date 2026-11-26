import Link from "next/link";
import { AlertTriangle, CheckCircle2, Database, Layers } from "lucide-react";
import type {
  EntityInventorySummary,
  EvidenceAuditBucket,
  EvidenceHealthSummary,
} from "../types/patch-hub.types";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";

type Props = {
  evidenceHealth: EvidenceHealthSummary;
  evidenceBuckets: EvidenceAuditBucket[];
  inventory: EntityInventorySummary;
};

function getEntityHref(entityType: string): string | null {
  switch (entityType) {
    case "hero":
      return "/heroes";
    case "item":
      return "/items";
    case "hero_build":
      return "/builds";
    default:
      return null;
  }
}

function getEntityLabel(entityType: string): string {
  switch (entityType) {
    case "hero":
      return "Hero";
    case "item":
      return "Item";
    case "hero_build":
      return "Hero Build Templates";
    default:
      return entityType;
  }
}

export function KnowledgeFreshnessPanel({
  evidenceHealth,
  evidenceBuckets,
  inventory,
}: Props) {
  const total = Math.max(evidenceHealth.totalEvidences, 1);
  const verifiedPct = Math.round((evidenceHealth.verifiedCount / total) * 100);
  const partialPct = Math.round(
    (evidenceHealth.partiallyVerifiedCount / total) * 100,
  );
  const unverifiedPct = Math.round(
    (evidenceHealth.unverifiedCount / total) * 100,
  );

  return (
    <section aria-labelledby="freshness-heading" className="space-y-5">
      <Surface className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="freshness-heading"
              className="text-base font-semibold text-slate-100"
            >
              Audit Kesegaran Pengetahuan &amp; Antrean Verifikasi (Live DB)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Ringkasan nyata dari <code className="text-slate-300">entity_evidences</code>,{" "}
              <code className="text-slate-300">knowledge_entities</code>,{" "}
              <code className="text-slate-300">profiles</code>, dan{" "}
              <code className="text-slate-300">hero_builds</code> di Supabase.
            </p>
          </div>
          <Badge tone={evidenceHealth.outdatedCount > 0 ? "amber" : "blue"}>
            {evidenceHealth.totalEvidences} total bukti tercatat
          </Badge>
        </div>

        {/* Metrik Inventaris & Status Verifikasi */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Entitas Katalog</span>
              <Database className="h-4 w-4 text-sky-400" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {inventory.heroesCount + inventory.itemsCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {inventory.heroesCount} Hero · {inventory.itemsCount} Item (
              {inventory.activeItemProfilesCount} profil aktif)
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Template &amp; Build</span>
              <Layers className="h-4 w-4 text-amber-400" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {inventory.heroBuildTemplatesCount +
                inventory.publishedHeroBuildsCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {inventory.heroBuildTemplatesCount} Template ·{" "}
              {inventory.publishedHeroBuildsCount} Terpublikasi ·{" "}
              {inventory.proMatchesCount} Match Pro
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Bukti Terverifikasi</span>
              <CheckCircle2
                className="h-4 w-4 text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {evidenceHealth.verifiedCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {evidenceHealth.partiallyVerifiedCount} Parsial · {verifiedPct}%
              terverifikasi penuh
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Antrean Audit</span>
              <AlertTriangle
                className="h-4 w-4 text-amber-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-300">
              {evidenceHealth.needsReviewCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {evidenceHealth.unverifiedCount} Belum Diverifikasi ·{" "}
              {evidenceHealth.outdatedCount} Usang ·{" "}
              {evidenceHealth.conflictingCount} Konflik
            </p>
          </div>
        </div>

        {/* Bar Proporsi Status Verifikasi */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Distribusi Status Verifikasi Bukti</span>
            <span>
              Terverifikasi {verifiedPct}% · Parsial {partialPct}% · Belum Diverifikasi{" "}
              {unverifiedPct}%
            </span>
          </div>
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
            role="img"
            aria-label={`Distribusi bukti: ${verifiedPct}% terverifikasi, ${partialPct}% parsial, ${unverifiedPct}% belum terverifikasi`}
          >
            {evidenceHealth.verifiedCount > 0 && (
              <div
                className="bg-emerald-500"
                style={{ width: `${verifiedPct}%` }}
              />
            )}
            {evidenceHealth.partiallyVerifiedCount > 0 && (
              <div
                className="bg-sky-500"
                style={{ width: `${Math.max(partialPct, 1)}%` }}
              />
            )}
            {evidenceHealth.unverifiedCount > 0 && (
              <div
                className="bg-amber-500/80"
                style={{ width: `${unverifiedPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Tabel Breakdown Per Domain */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2738] text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4">Domain Entitas</th>
                <th className="px-3 py-2.5 text-right">Total Bukti</th>
                <th className="px-3 py-2.5 text-right">Terverifikasi</th>
                <th className="px-3 py-2.5 text-right">Parsial</th>
                <th className="px-3 py-2.5 text-right">Belum Diverifikasi</th>
                <th className="px-3 py-2.5 text-right">Usang</th>
                <th className="pl-3 py-2.5 text-right">Navigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2738]/70">
              {evidenceHealth.byEntityType.map((row) => {
                const href = getEntityHref(row.entityType);
                return (
                  <tr key={row.entityType} className="text-slate-300">
                    <td className="py-3 pr-4 font-medium text-white">
                      {getEntityLabel(row.entityType)}
                    </td>
                    <td className="px-3 py-3 text-right">{row.total}</td>
                    <td className="px-3 py-3 text-right text-emerald-300">
                      {row.verified}
                    </td>
                    <td className="px-3 py-3 text-right text-sky-300">
                      {row.partiallyVerified}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-300">
                      {row.unverified}
                    </td>
                    <td className="px-3 py-3 text-right text-rose-300">
                      {row.outdated}
                    </td>
                    <td className="pl-3 py-3 text-right">
                      {href ? (
                        <Link
                          href={href}
                          className="text-amber-300 hover:underline"
                        >
                          Buka →
                        </Link>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rincian Klasifikasi Klaim */}
        {evidenceBuckets.length > 0 && (
          <div className="space-y-2 border-t border-[#1E2738] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Rincian Klasifikasi Klaim Aktif
            </p>
            <div className="flex flex-wrap gap-2">
              {evidenceBuckets.map((bucket) => (
                <div
                  key={`${bucket.entityType}-${bucket.verificationStatus}-${bucket.claimClassification}`}
                  className="rounded-lg border border-[#1E2738] bg-[#0B0F17] px-3 py-1.5 text-[11px] text-slate-300"
                >
                  <span className="font-semibold text-white">
                    {getEntityLabel(bucket.entityType)}
                  </span>{" "}
                  · {bucket.claimClassification.replaceAll("_", " ")} ·{" "}
                  <span className="text-amber-300">
                    {bucket.verificationStatus}
                  </span>{" "}
                  ({bucket.count})
                </div>
              ))}
            </div>
          </div>
        )}
      </Surface>
    </section>
  );
}
