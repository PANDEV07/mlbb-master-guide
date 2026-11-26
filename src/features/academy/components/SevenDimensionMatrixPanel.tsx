import { ShieldCheck } from "lucide-react";
import {
  ANTI_MISLEADING_GUARDRAILS,
  SEVEN_DIMENSION_MATRIX,
  type RankedModeId,
} from "../index";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Props = {
  selectedMode: RankedModeId;
};

export function SevenDimensionMatrixPanel({ selectedMode }: Props) {
  const columns: Array<{ id: RankedModeId; label: string }> = [
    { id: "FIVE_MAN", label: "5-Man Squad" },
    { id: "TRIO", label: "Trio Rank" },
    { id: "DUO", label: "Duo Rank" },
    { id: "SOLO", label: "Solo Queue" },
  ];

  return (
    <section aria-labelledby="matrix-heading" className="space-y-4">
      <Surface className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="matrix-heading"
              className="text-base font-semibold text-slate-100"
            >
              Matriks 7 Dimensi Perbedaan Konteks Ranked (Pro Play vs Solo–5-Man)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Kerangka resmi <code className="text-slate-300">PRO_TO_RANKED_ADAPTATION.md</code>{" "}
              untuk menilai kesenjangan komunikasi, kontrol draft, dan eksekusi sebelum meniru
              strategi turnamen.
            </p>
          </div>
          <Badge tone="neutral">ADR-008 · 7 Dimensi</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#22D3EE]/25 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-3">Dimensi</th>
                <th className="px-3 py-2.5 text-sky-300">Pro Play</th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "px-3 py-2.5",
                      selectedMode === col.id &&
                        "rounded-t-lg bg-amber-500/10 text-amber-300",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22D3EE]/20/70">
              {SEVEN_DIMENSION_MATRIX.map((row) => (
                <tr key={row.dimension} className="align-top text-slate-300">
                  <td className="py-3 pr-3 font-semibold text-white">
                    {row.dimension}
                  </td>
                  <td className="px-3 py-3 text-slate-400">{row.proPlay}</td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-3 py-3",
                        selectedMode === col.id
                          ? "bg-amber-500/5 text-slate-100"
                          : "text-slate-400",
                      )}
                    >
                      {row[col.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0A0E16] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F5B83D]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Aturan Anti-Misleading Guardrails (PRO_TO_RANKED_ADAPTATION.md)</span>
          </div>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-400">
            {ANTI_MISLEADING_GUARDRAILS.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </Surface>
    </section>
  );
}
