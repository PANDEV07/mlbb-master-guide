import { ExternalLink, ShieldCheck } from "lucide-react";
import { PROVENANCE_INHERITANCE_MATRIX } from "@/services/repositories/governanceRepository";
import { PATCH_LIFECYCLE_STAGES } from "../utils/patch-health";
import type { SourceRegistryRecord } from "../types/patch-hub.types";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";

type Props = {
  sources: SourceRegistryRecord[];
};

function getTierTone(
  tier: SourceRegistryRecord["sourceTier"],
): "emerald" | "blue" | "gold" | "amber" {
  switch (tier) {
    case "TIER_1_OFFICIAL":
      return "emerald";
    case "TIER_2_SECONDARY":
      return "blue";
    case "TIER_3_ANALYTICAL":
      return "gold";
    default:
      return "amber";
  }
}

export function SourceGovernancePanel({ sources }: Props) {
  return (
    <section aria-labelledby="governance-heading" className="space-y-5">
      {/* Registry Sumber */}
      <Surface className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="governance-heading"
              className="text-base font-semibold text-slate-100"
            >
              Registry Sumber Data Terdaftar (sources)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Seluruh sumber dikelompokkan berdasarkan hierarki Tier 1–4 sesuai{" "}
              <code className="text-slate-300">SOURCE_VERIFICATION_POLICY.md</code>.
            </p>
          </div>
          <Badge tone="blue">{sources.length} sumber aktif</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((source) => (
            <article
              key={source.id}
              className="rounded-xl border border-[#1E2738] bg-[#0B0F17] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {source.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {source.domain} · {source.sourceCategory}
                  </p>
                </div>
                <Badge tone={getTierTone(source.sourceTier)}>
                  {source.sourceTier.replaceAll("_", " ")}
                </Badge>
              </div>

              {source.reliabilityNotes && (
                <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                  {source.reliabilityNotes}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500">
                  Status: {source.isActive ? "Aktif" : "Nonaktif"}
                </span>
                <a
                  href={source.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                >
                  Kunjungi sumber
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </Surface>

      {/* Lifecycle 7 Tahap & Matriks Pewarisan Provenance */}
      <Surface className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-100">
            Alur Pembaruan 7 Tahap &amp; Aturan Pewarisan Provenance (ADR-005 / ADR-006)
          </h2>
        </div>

        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PATCH_LIFECYCLE_STAGES.map((stage) => (
            <li
              key={stage.step}
              className="rounded-lg border border-[#1E2738] bg-[#0A0E16] p-3"
            >
              <div className="text-[11px] font-semibold text-amber-300">
                {stage.step}. {stage.title}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {stage.description}
              </p>
            </li>
          ))}
        </ol>

        <details className="rounded-xl border border-[#1E2738] bg-[#0A0E16] p-4">
          <summary className="cursor-pointer text-xs font-semibold text-slate-200 hover:text-white">
            Lihat Matriks Aturan Provenance Inheritance (
            {PROVENANCE_INHERITANCE_MATRIX.length} relasi)
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2738] text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">Entitas Induk</th>
                  <th className="px-3 py-2">Entitas Anak</th>
                  <th className="px-3 py-2">Pewarisan</th>
                  <th className="pl-3 py-2">Aturan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2738]/70">
                {PROVENANCE_INHERITANCE_MATRIX.map((rule) => (
                  <tr
                    key={`${rule.parentEntity}-${rule.childEntity}`}
                    className="text-slate-300"
                  >
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-200">
                      {rule.parentEntity}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-200">
                      {rule.childEntity}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        tone={
                          rule.inheritanceAllowed === "YES"
                            ? "emerald"
                            : rule.inheritanceAllowed === "CONDITIONAL"
                              ? "blue"
                              : "amber"
                        }
                      >
                        {rule.inheritanceAllowed}
                      </Badge>
                    </td>
                    <td className="pl-3 py-2.5 text-[11px] text-slate-400">
                      {rule.ruleSummary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Surface>
    </section>
  );
}
