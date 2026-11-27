"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { cn } from "@/lib/cn";
import type { DraftHeroEntry, DraftSide } from "../types/draft.types";
import type {
  DraftHeroBuildPlan,
  DraftPostBuildPayload,
  EnemyThreatProfile,
} from "../types/draft-build.types";

type ApiResponse =
  | { success: true; data: DraftPostBuildPayload }
  | { success: false; error: string };

interface DraftItemSuggestionsPanelProps {
  bluePicks: DraftHeroEntry[];
  redPicks: DraftHeroEntry[];
}

function ThreatPills({
  profile,
  enemySideLabel,
}: {
  profile: EnemyThreatProfile;
  enemySideLabel: string;
}) {
  const groups = [
    {
      label: "Magic",
      heroes: profile.magicThreats,
      cls: "border-[#22D3EE]/40 bg-[#22D3EE]/10 text-[#22D3EE]",
    },
    {
      label: "Physical Burst",
      heroes: profile.physicalBurstThreats,
      cls: "border-[#F5B83D]/40 bg-[#F5B83D]/10 text-[#F5B83D]",
    },
    {
      label: "Marksman / Crit",
      heroes: profile.basicAtkCritThreats,
      cls: "border-orange-400/40 bg-orange-400/10 text-orange-300",
    },
    {
      label: "Sustain / Heal",
      heroes: profile.sustainHealThreats,
      cls: "border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80]",
    },
    {
      label: "Hard CC",
      heroes: profile.hardCCThreats,
      cls: "border-[#E11D48]/45 bg-[#E11D48]/10 text-[#FDA4AF]",
    },
    {
      label: "Frontline / Tank",
      heroes: profile.tankFrontlineThreats,
      cls: "border-slate-400/35 bg-slate-400/10 text-slate-200",
    },
  ].filter((g) => g.heroes.length > 0);

  return (
    <div className="border border-white/10 bg-[#0A0E1A] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#9AA6C4]">
        <ShieldAlert className="h-3.5 w-3.5 text-[#F5B83D]" aria-hidden="true" />
        <span>Ancaman {enemySideLabel} yang Dihadapi:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <span
            key={g.label}
            title={g.heroes.join(", ")}
            className={cn(
              "inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold",
              g.cls,
            )}
          >
            <span>
              {g.label} ({g.heroes.length}):
            </span>
            <span className="font-normal opacity-90">
              {g.heroes.slice(0, 3).join(", ")}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroAdaptiveBuildCard({ plan }: { plan: DraftHeroBuildPlan }) {
  const counterSlots = plan.items.filter((s) => s.slotRole === "COUNTER");

  return (
    <div className="space-y-3 border border-white/12 bg-[#0A0E1A] p-3.5 transition hover:border-[#22D3EE]/40">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <HeroPortrait
            slug={plan.heroSlug}
            name={plan.heroName}
            className="h-11 w-11 shrink-0 border border-[#F5B83D]/50"
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/heroes/${plan.heroSlug}`}
                className="font-display text-base text-[#E6EAF5] transition hover:text-[#F5B83D]"
              >
                {plan.heroName}
              </Link>
              <span className="font-display bg-[#22D3EE]/15 px-1.5 py-0.5 text-[10px] text-[#22D3EE]">
                {plan.assignedLane}
              </span>
              <span className="font-display border border-[#F5B83D]/35 bg-[#F5B83D]/10 px-1.5 py-0.5 text-[10px] text-[#F5B83D]">
                {counterSlots.length} Item Counter
              </span>
            </div>
            <p className="text-[11px] text-[#9AA6C4]">
              Basis: {plan.baseTemplateName} · Diadaptasi khusus lawan draft ini
            </p>
          </div>
        </div>

        <Link
          href={plan.workbenchUrl}
          className="font-display inline-flex items-center gap-1 border border-[#22D3EE]/40 bg-[#101830] px-2.5 py-1 text-[11px] text-[#22D3EE] transition hover:border-[#F5B83D] hover:text-[#F5B83D]"
        >
          <Wrench className="h-3 w-3" aria-hidden="true" />
          Ubah di Build
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {/* 6 Item Slots Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {plan.items.map((slot) => {
          const isCounter = slot.slotRole === "COUNTER";
          return (
            <Link
              key={`${plan.heroSlug}-${slot.position}-${slot.slug}`}
              href={`/items/${slot.slug}`}
              title={`${slot.name} — ${slot.reason}`}
              className={cn(
                "group relative flex flex-col items-center border p-2 text-center transition-all",
                isCounter
                  ? "border-[#F5B83D]/70 bg-[#F5B83D]/10 shadow-[0_0_12px_rgba(245,184,61,0.16)] hover:border-[#F5B83D]"
                  : "border-white/10 bg-[#101830]/75 hover:border-[#22D3EE]/60",
              )}
            >
              {/* Slot Order + Role Pill */}
              <div className="mb-1.5 flex w-full items-center justify-between gap-1">
                <span className="font-display text-[9px] text-[#64748B]">
                  #{slot.position}
                </span>
                <span
                  className={cn(
                    "font-display px-1 py-0.2 text-[8px] leading-tight",
                    isCounter
                      ? "bg-[#F5B83D] font-bold text-[#0A0E1A]"
                      : "bg-white/10 text-[#9AA6C4]",
                  )}
                >
                  {isCounter ? (slot.isSwapped ? "COUNTER ★" : "COUNTER") : "INTI"}
                </span>
              </div>

              {/* Item Icon */}
              <div
                className={cn(
                  "relative h-11 w-11 overflow-hidden rounded-full border",
                  isCounter ? "border-[#F5B83D]" : "border-white/15",
                )}
              >
                {slot.iconUrl ? (
                  <Image
                    src={slot.iconUrl}
                    alt={slot.name}
                    width={44}
                    height={44}
                    unoptimized
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1B2442] font-display text-[10px] text-[#9AA6C4]">
                    {slot.name.slice(0, 2)}
                  </div>
                )}
              </div>

              <p className="mt-1.5 line-clamp-2 font-display text-[10px] leading-tight text-[#E6EAF5] group-hover:text-[#F5B83D]">
                {slot.name}
              </p>

              {slot.counterTag && (
                <span className="mt-0.5 truncate text-[9px] text-[#22D3EE]">
                  {slot.counterTag}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Alasan Khusus Item Counter */}
      {counterSlots.length > 0 && (
        <div className="space-y-1.5 border-t border-white/10 pt-2.5">
          {counterSlots.map((slot) => (
            <div
              key={`reason-${plan.heroSlug}-${slot.slug}`}
              className="flex flex-wrap items-start gap-x-2 gap-y-0.5 text-[11px] leading-snug"
            >
              <span className="inline-flex shrink-0 items-center gap-1 font-display text-[#F5B83D]">
                <Flame className="h-3 w-3" aria-hidden="true" />
                {slot.name}
              </span>
              {slot.isSwapped && slot.replacedItemName && (
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[#9AA6C4]">
                  Ganti {slot.replacedItemName}
                </span>
              )}
              <span className="text-[#CBD5E1]">{slot.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DraftItemSuggestionsPanel({
  bluePicks,
  redPicks,
}: DraftItemSuggestionsPanelProps) {
  const [activeSide, setActiveSide] = useState<DraftSide>("BLUE");
  const [data, setData] = useState<DraftPostBuildPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const blueSlugsKey = useMemo(
    () => bluePicks.map((h) => h.slug).join(","),
    [bluePicks],
  );
  const redSlugsKey = useMemo(
    () => redPicks.map((h) => h.slug).join(","),
    [redPicks],
  );

  useEffect(() => {
    if (!blueSlugsKey || !redSlugsKey) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    fetch("/api/draft/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bluePicks: blueSlugsKey.split(","),
        redPicks: redSlugsKey.split(","),
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = (await res.json()) as ApiResponse;
        if (!res.ok || !json.success) {
          throw new Error(
            json.success
              ? "Gagal memuat saran item."
              : json.error,
          );
        }
        setData(json.data);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyusun rekomendasi item.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [blueSlugsKey, redSlugsKey]);

  const activePlan =
    activeSide === "BLUE" ? data?.blueSide : data?.redSide;
  const enemySideLabel =
    activeSide === "BLUE" ? "Red Side (Tim Merah)" : "Blue Side (Tim Biru)";

  return (
    <div className="space-y-4 border-t border-[#F5B83D]/30 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F5B83D]" aria-hidden="true" />
            <h3 className="font-display text-lg text-[#E6EAF5]">
              REKOMENDASI BUILD &amp; ITEM COUNTER TERBAIK (6 SLOT PER HERO)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[#9AA6C4]">
            Setiap hero otomatis mendapatkan build inti terbaiknya yang langsung
            diadaptasi dengan item counter paling efektif melawan 5 hero lawan.
          </p>
        </div>

        {/* Switcher Blue Side / Red Side */}
        <div className="inline-flex border border-white/15 bg-[#0A0E1A] p-0.5">
          <button
            type="button"
            onClick={() => setActiveSide("BLUE")}
            className={cn(
              "font-display cursor-pointer px-3.5 py-1.5 text-xs transition",
              activeSide === "BLUE"
                ? "bg-[#22D3EE] font-bold text-[#0A0E1A]"
                : "text-[#9AA6C4] hover:text-[#E6EAF5]",
            )}
          >
            Build Blue Side (5 Hero)
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("RED")}
            className={cn(
              "font-display cursor-pointer px-3.5 py-1.5 text-xs transition",
              activeSide === "RED"
                ? "bg-[#FB7185] font-bold text-[#0A0E1A]"
                : "text-[#9AA6C4] hover:text-[#E6EAF5]",
            )}
          >
            Build Red Side (5 Hero)
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 border border-white/10 bg-[#0A0E1A] py-8 text-xs text-[#9AA6C4]">
          <Loader2 className="h-4 w-4 animate-spin text-[#F5B83D]" />
          <span>Menyusun 6 item counter terbaik untuk seluruh 10 hero...</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="border border-[#E11D48]/45 bg-[#E11D48]/10 p-3 text-xs text-[#FDA4AF]">
          {error}
        </div>
      )}

      {!isLoading && activePlan && (
        <div className="space-y-3">
          <ThreatPills
            profile={activePlan.enemyThreatProfile}
            enemySideLabel={enemySideLabel}
          />

          <div className="space-y-3">
            {activePlan.heroes.map((heroPlan) => (
              <HeroAdaptiveBuildCard
                key={`${activeSide}-${heroPlan.heroSlug}`}
                plan={heroPlan}
              />
            ))}
          </div>

          <p className="text-[10px] text-[#9AA6C4]">
            Label <b className="text-[#F5B83D]">COUNTER ★</b> menandakan item
            bawaan diganti khusus untuk melawan komposisi musuh; label{" "}
            <b className="text-[#F5B83D]">COUNTER</b> menandakan item bawaan
            sudah sangat efektif untuk ancaman tim lawan. Klik item untuk detail
            efek &amp; harga atau klik <b>Ubah di Build</b> untuk kustomisasi.
          </p>
        </div>
      )}
    </div>
  );
}
