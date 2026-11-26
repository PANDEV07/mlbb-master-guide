import { Database, FileCheck2 } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface EmptyKnowledgeStateProps {
  moduleTitle: string;
  reason: string;
  requiredArtifacts: string[];
  targetPhase: string;
}

export function EmptyKnowledgeState({
  moduleTitle,
  reason,
  requiredArtifacts,
  targetPhase,
}: EmptyKnowledgeStateProps) {
  return (
    <Surface elevated className="p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="blue">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Data Belum Diimpor
            </Badge>
            <Badge tone="neutral">Target Populasi: {targetPhase}</Badge>
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Basis Data {moduleTitle} Menunggu Verifikasi Riset
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{reason}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Sesuai kebijakan integritas data (<code className="text-slate-300">AGENTS.md</code>),
            halaman ini tidak menampilkan statistik, meta, atau catatan pertandingan buatan
            sebelum sumber resmi dan skema database selesai diaudit.
          </p>
        </div>

        <div className="w-full rounded-lg border border-[#1E2738] bg-[#0B0F17] p-4 lg:max-w-sm">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <FileCheck2 className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Prasyarat Sebelum Data Masuk
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            {requiredArtifacts.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/patches" variant="secondary" className="text-xs">
              Lihat Pusat Patch
            </Button>
            <Button href="/" variant="ghost" className="text-xs">
              Ringkasan Status
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}
