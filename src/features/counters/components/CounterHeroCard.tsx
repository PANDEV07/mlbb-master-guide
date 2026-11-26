"use client";

import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { Badge } from "@/components/ui/Badge";
import type { AggregatedHeroCounter } from "../engine/multi-enemy-counter";

const HERO_RULE_LABELS: Record<string, string> = {
  CONTROL_RESPONSE: "Respons CC",
  MOBILITY_CONTROL: "Tahan Mobilitas",
  SLOW_RESPONSE: "Respons Slow",
  DAMAGE_RESPONSE: "Mitigasi Damage",
};

type Props = {
  candidate: AggregatedHeroCounter;
  totalTargets: number;
  rank: number;
};

export function CounterHeroCard({ candidate, totalTargets, rank }: Props) {
  const isSameLane = candidate.sameLaneAsTargets.length > 0;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#22D3EE]/25 bg-[#101830]/95 p-4 transition hover:border-[#F5B83D]/55">
      <div>
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <HeroPortrait
              slug={candidate.counterSlug}
              name={candidate.counterHero}
              className="h-16 w-14 rounded-xl"
            />
            <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/40 bg-[#0A0E1A] text-[10px] font-bold text-[#F5B83D]">
              #{rank}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <h4 className="truncate text-sm font-bold text-white">
                {candidate.counterHero}
              </h4>
              {totalTargets > 1 ? (
                <Badge tone="emerald">
                  Lawan {candidate.counteredEnemies.length}/{totalTargets} Musuh
                </Badge>
              ) : isSameLane ? (
                <Badge tone="emerald">Satu Lane</Badge>
              ) : null}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              {candidate.roles.map((r) => (
                <Badge key={r} tone="blue">
                  {r}
                </Badge>
              ))}
              {candidate.lanes.map((l) => (
                <Badge key={l} tone="neutral">
                  {l}
                </Badge>
              ))}
              {totalTargets > 1 && isSameLane && (
                <Badge tone="gold">Satu Lane</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Rule Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {candidate.ruleIds.map((rule) => (
            <span
              key={rule}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#F5B83D]"
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {HERO_RULE_LABELS[rule] ?? rule}
            </span>
          ))}
          <span className="rounded-full bg-[#15203E] px-2 py-0.5 text-[10px] text-slate-400">
            {candidate.evidenceCount} bukti mekanik
          </span>
        </div>

        {totalTargets > 1 && (
          <p className="mt-2 text-[11px] text-[#F5B83D]/90">
            Efektif terhadap: {candidate.counteredEnemies.join(", ")}
          </p>
        )}

        <p className="mt-2.5 text-xs leading-relaxed text-[#9AA6C4]">
          {candidate.explanation}
        </p>
      </div>

      <div className="mt-3.5 space-y-3">
        <details className="rounded-xl border border-[#22D3EE]/25 bg-[#0A0E1A] p-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-slate-300 hover:text-[#F5B83D]">
            Lihat bukti skill &amp; kondisi ({candidate.evidencePairs.length})
          </summary>
          <div className="mt-2.5 space-y-2">
            {candidate.evidencePairs.slice(0, 4).map((pair, idx) => (
              <div
                key={`${candidate.id}-${idx}`}
                className="rounded-lg border border-[#22D3EE]/25 bg-[#101830] p-2.5 text-[11px] text-slate-300"
              >
                <p>
                  <span className="font-semibold text-rose-300">
                    {pair.targetHero} ({pair.targetSkill}):
                  </span>{" "}
                  {pair.targetMechanic.replaceAll("_", " ")} —{" "}
                  <span className="text-slate-400">
                    {pair.targetEvidenceText}
                  </span>
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-[#F5B83D]">
                    {candidate.counterHero} ({pair.responseSkill}):
                  </span>{" "}
                  {pair.responseMechanic.replaceAll("_", " ")} —{" "}
                  <span className="text-slate-400">
                    {pair.responseEvidenceText}
                  </span>
                </p>
              </div>
            ))}
            {candidate.conditionsToCheck.length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                {candidate.conditionsToCheck.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#22D3EE]/25 pt-2.5 text-[11px]">
          <span className="text-[10px] text-slate-500">
            Kandidat · Belum Diverifikasi
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={`/heroes/${candidate.counterSlug}`}
              className="inline-flex items-center gap-1 font-medium text-[#F5B83D] hover:underline"
            >
              Skill &amp; Kombo <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href={`/builds/${candidate.counterSlug}`}
              className="inline-flex items-center gap-1 font-medium text-sky-300 hover:underline"
            >
              Build <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
