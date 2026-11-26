"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { AggregatedItemCounter } from "../engine/multi-enemy-counter";

const ITEM_RULE_LABELS: Record<string, string> = {
  CONTROL_RESPONSE: "Respons CC",
  DAMAGE_RESPONSE: "Mitigasi Damage",
  SUSTAIN_RESPONSE: "Anti-Sustain",
};

type Props = {
  candidate: AggregatedItemCounter;
  totalTargets: number;
};

export function CounterItemCard({ candidate, totalTargets }: Props) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#22D3EE]/25 bg-[#101830]/95 p-4 transition hover:border-[#F5B83D]/55">
      <div>
        <div className="flex items-start gap-3.5">
          {candidate.itemIconUrl ? (
            <Image
              src={candidate.itemIconUrl}
              alt={candidate.itemName}
              width={52}
              height={52}
              unoptimized
              className="h-13 w-13 shrink-0 rounded-xl border border-emerald-400/35 bg-[#0A0E1A] object-cover"
            />
          ) : (
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-[#22D3EE]/25 bg-[#0A0E1A] text-slate-400">
              <Package className="h-5 w-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <h4 className="truncate text-sm font-bold text-white">
                {candidate.itemName}
              </h4>
              {totalTargets > 1 && (
                <Badge tone="emerald">
                  Efektif vs {candidate.counteredEnemies.length}/{totalTargets}
                </Badge>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{candidate.itemCategory}</Badge>
              {candidate.ruleIds.map((rule) => (
                <Badge key={rule} tone="gold">
                  {ITEM_RULE_LABELS[rule] ?? rule}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {totalTargets > 1 && (
          <p className="mt-2.5 text-[11px] text-[#F5B83D]/90">
            Target: {candidate.counteredEnemies.join(", ")}
          </p>
        )}

        <p className="mt-2.5 text-xs leading-relaxed text-[#9AA6C4]">
          {candidate.explanation}
        </p>
      </div>

      <div className="mt-3.5 space-y-3">
        <details className="rounded-xl border border-[#22D3EE]/25 bg-[#0A0E1A] p-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-slate-300 hover:text-[#F5B83D]">
            Lihat bukti efek item &amp; kondisi (
            {candidate.evidencePairs.length})
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
                    {pair.itemEffect} ({pair.itemEffectType}):
                  </span>{" "}
                  {pair.itemMechanic.replaceAll("_", " ")} —{" "}
                  <span className="text-slate-400">
                    {pair.itemEvidenceText}
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

        <div className="flex items-center justify-between border-t border-[#22D3EE]/25 pt-2.5 text-[11px]">
          <span className="text-[10px] text-slate-500">
            {candidate.evidenceCount} bukti · Belum Diverifikasi
          </span>
          <Link
            href={`/items/${candidate.itemSlug}`}
            className="inline-flex items-center gap-1 font-medium text-[#F5B83D] hover:underline"
          >
            Detail Item <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
