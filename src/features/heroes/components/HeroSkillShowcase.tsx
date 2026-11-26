"use client";

import { useState } from "react";
import Image from "next/image";
import type { HeroSkillDisplayItem } from "../types/hero-combo.types";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type Props = {
  heroName: string;
  skillGroups: Array<{ apiGroupId: string; skills: HeroSkillDisplayItem[] }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  DAMAGE: "Damage",
  CROWD_CONTROL: "Crowd Control",
  MOBILITY: "Mobilitas",
  DEFENSE: "Pertahanan",
  SUSTAIN: "Sustain",
  BUFF_DEBUFF: "Buff & Debuff",
  UTILITY: "Utilitas",
  SPECIAL: "Khusus",
};

export function HeroSkillShowcase({ heroName, skillGroups }: Props) {
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [selectedSkillIdx, setSelectedSkillIdx] = useState(0);

  const activeGroup = skillGroups[selectedGroupIdx] ?? skillGroups[0];
  const activeSkill =
    activeGroup?.skills[selectedSkillIdx] ?? activeGroup?.skills[0] ?? null;

  if (!activeGroup || !activeSkill) return null;

  const totalSkillCount = skillGroups.reduce(
    (sum, g) => sum + g.skills.length,
    0,
  );

  return (
    <section
      aria-labelledby="hero-skills-showcase-heading"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="hero-skills-showcase-heading"
            className="text-xl font-bold text-slate-100"
          >
            Skills {heroName}
          </h2>
          <Badge tone="neutral">Data API Moonton</Badge>
        </div>
        <Badge tone="neutral">{totalSkillCount} Skill</Badge>
      </div>

      <Surface className="border border-amber-500/30 p-4">
        <p className="text-xs leading-relaxed text-amber-200">
          Deskripsi dan ikon skill diambil dari data kandidat API Moonton (belum
          terverifikasi untuk versi patch spesifik). Pilih ikon skill di bawah
          untuk melihat rincian efek, cooldown, biaya resource, dan kategori
          mekaniknya.
        </p>
      </Surface>

      {skillGroups.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Mode / Grup Skill:</span>
          {skillGroups.map((group, idx) => (
            <button
              key={group.apiGroupId}
              type="button"
              onClick={() => {
                setSelectedGroupIdx(idx);
                setSelectedSkillIdx(0);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                idx === selectedGroupIdx
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                  : "border-[#1E2738] bg-[#0B0F17] text-slate-400 hover:text-slate-200",
              )}
            >
              Form {idx + 1} (Group {group.apiGroupId})
            </button>
          ))}
        </div>
      )}

      {/* Selector Ikon Skill Interaktif */}
      <Surface elevated className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {activeGroup.skills.map((skill, idx) => {
            const active = idx === selectedSkillIdx;
            return (
              <button
                key={skill.apiSkillId ?? `${activeGroup.apiGroupId}-${idx}`}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedSkillIdx(idx)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  active
                    ? "border-emerald-400/60 bg-emerald-500/10"
                    : "border-[#1E2A33] bg-[#0B1014] hover:border-[#2C3E4B]",
                )}
              >
                {skill.iconUrl ? (
                  <Image
                    src={skill.iconUrl}
                    alt={skill.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
                    {skill.slotLabel.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    {skill.slotLabel}
                  </p>
                  <p className="truncate text-xs font-semibold text-white">
                    {skill.name}
                  </p>
                  {skill.cooldownSeconds !== null && (
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      CD {skill.cooldownSeconds}s
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Penjelasan Detail Skill */}
        <div className="space-y-4 rounded-xl border border-[#1E2738] bg-[#080B10] p-5">
          <div className="flex items-start gap-3">
            {activeSkill.iconUrl && (
              <Image
                src={activeSkill.iconUrl}
                alt={activeSkill.name}
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 shrink-0 rounded-xl border border-amber-500/30 object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">{activeSkill.slotLabel}</Badge>
                {activeSkill.cooldownSeconds !== null && (
                  <Badge tone="neutral">
                    CD: {activeSkill.cooldownSeconds}s
                  </Badge>
                )}
                {activeSkill.resourceType &&
                  activeSkill.resourceCost !== null && (
                    <Badge tone="blue">
                      {activeSkill.resourceCost}{" "}
                      {activeSkill.resourceType === "MANA"
                        ? "Mana"
                        : "Energy"}
                    </Badge>
                  )}
              </div>
              <h3 className="mt-2 text-lg font-bold text-white">
                {activeSkill.name}
              </h3>
            </div>
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {activeSkill.description}
          </p>

          {(activeSkill.apiTags.length > 0 ||
            activeSkill.mechanicCategories.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {activeSkill.apiTags.map((tag, i) => (
                <Badge key={`${tag.name}-${i}`} tone="neutral">
                  {tag.name}
                </Badge>
              ))}
              {activeSkill.mechanicCategories.map((cat) => (
                <Badge key={cat} tone="blue">
                  {CATEGORY_LABELS[cat] ?? cat}
                </Badge>
              ))}
            </div>
          )}

          {activeSkill.rawCooldownCost && (
            <p className="text-xs text-slate-500">
              Data asli API: {activeSkill.rawCooldownCost}
            </p>
          )}
        </div>
      </Surface>
    </section>
  );
}
