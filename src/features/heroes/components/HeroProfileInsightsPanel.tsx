import type { HeroProfileInsights } from "../engine/hero-profile-insights";
import { cleanCandidateDescription } from "../data/hero-gameplay-candidates";
import { getIndonesianSkillOverlay } from "../data/hero-skills-id";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import {
  formatMechanicCategoryId,
  formatVerificationStatusId,
} from "@/lib/i18n/labels";

type Props = {
  insights: HeroProfileInsights;
};

const statusLabels: Record<string, string> = {
  POTENTIAL: "Potensi Mekanik",
  INSUFFICIENT_EVIDENCE: "Belum Cukup Bukti",
};

export function HeroProfileInsightsPanel({ insights }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">
            Analisis Mekanik Hero
          </h2>
          <p className="mt-1 text-xs text-[#9AA6C4]">
            Ringkasan potensi keunggulan berdasarkan data skill kandidat (bukan
            penilaian performa terverifikasi).
          </p>
        </div>
        <Badge tone="neutral">
          {formatVerificationStatusId(insights.verificationStatus)}
        </Badge>
      </div>

      <Surface className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">
            Potensi Keunggulan ({insights.strengths.length})
          </h3>
          <span className="text-xs text-[#F5B83D]">
            {insights.metadata.mechanicRecords} skill dianalisis
          </span>
        </div>

        {insights.strengths.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {insights.strengths.map((strength) => (
              <div
                key={strength.id}
                className="rounded-xl border border-[#22D3EE]/25 bg-[#0A0E1A] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {strength.title}
                  </h4>
                  <Badge tone="emerald">{statusLabels.POTENTIAL}</Badge>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[#9AA6C4]">
                  {strength.explanation}
                </p>

                <details className="mt-3 rounded-lg border border-[#22D3EE]/25 bg-[#101830] p-2.5">
                  <summary className="cursor-pointer text-[11px] font-semibold text-[#F5B83D]">
                    Lihat skill pendukung ({strength.evidence.length})
                  </summary>
                  <div className="mt-2.5 space-y-2">
                    {strength.evidence.map((evidence, index) => (
                      <div
                        key={`${evidence.apiGroupId}-${evidence.apiSkillId ?? index}-${index}`}
                        className="rounded-lg border border-[#22D3EE]/25 bg-[#0A0E1A] p-2.5 text-xs"
                      >
                        <p className="font-semibold text-white">
                          {evidence.skillName}
                        </p>
                        {evidence.mechanicCategories.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {evidence.mechanicCategories.map((category) => (
                              <span
                                key={category}
                                className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-[#F5B83D]"
                              >
                                {formatMechanicCategoryId(category)}
                              </span>
                            ))}
                          </div>
                        )}
                        {evidence.description.trim() && (
                          <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-slate-400">
                            {getIndonesianSkillOverlay(
                              insights.heroName,
                              evidence.apiSkillId,
                              evidence.skillName,
                            )?.description ||
                              cleanCandidateDescription(evidence.description)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-slate-400">
            Belum ada kategori mekanik kandidat yang dapat digunakan untuk
            menyusun potensi keunggulan hero ini.
          </p>
        )}

        <div className="grid gap-3 border-t border-[#22D3EE]/25 pt-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0A0E1A] p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-white">
                Penilaian Kelemahan
              </h3>
              <Badge tone="neutral">
                {statusLabels[insights.weaknessAssessment]}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#9AA6C4]">
              Kelemahan hero belum disimpulkan otomatis dari teks skill saja.
              Gunakan modul Counter atau Matchup untuk menguji interaksi
              spesifiknya.
            </p>
          </div>

          <div className="rounded-xl border border-[#22D3EE]/25 bg-[#0A0E1A] p-4">
            <h3 className="text-xs font-bold text-white">
              Keunggulan Situasional &amp; Cara Menghadapi
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#9AA6C4]">
              Memerlukan bukti tambahan mengenai fase permainan dan kondisi
              draft agar rekomendasi tidak menyesatkan.
            </p>
          </div>
        </div>
      </Surface>
    </section>
  );
}
