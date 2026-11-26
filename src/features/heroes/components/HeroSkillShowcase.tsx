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
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="hero-skills-showcase-heading"
            className="mlbb-heading text-2xl text-[#E6EAF5]"
          >
            Rincian Skill {heroName}
          </h2>
          <Badge tone="gold">Bahasa Indonesia · Resmi Moonton</Badge>
        </div>
        <Badge tone="blue">{totalSkillCount} Skill</Badge>
      </div>

      <Surface className="p-4">
        <p className="text-xs leading-relaxed text-[#9AA6C4]">
          Deskripsi dan ikon skill diambil dari data resmi Moonton (Bahasa
          Indonesia). Pilih ikon skill di bawah untuk melihat rincian efek,
          cooldown, biaya resource, dan kategori mekaniknya.
        </p>
      </Surface>

      {skillGroups.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-xs text-[#9AA6C4]">
            Mode / Grup Skill:
          </span>
          {skillGroups.map((group, idx) => (
            <button
              key={group.apiGroupId}
              type="button"
              onClick={() => {
                setSelectedGroupIdx(idx);
                setSelectedSkillIdx(0);
              }}
              className={cn(
                "cursor-pointer px-3.5 py-1.5 text-xs",
                idx === selectedGroupIdx ? "mlbb-pill-active" : "mlbb-pill",
              )}
            >
              Mode {idx + 1} (Grup {group.apiGroupId})
            </button>
          ))}
        </div>
      )}

      {/* Selector Ikon Skill Interaktif */}
      <Surface elevated className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {activeGroup.skills.map((skill, idx) => {
            const active = idx === selectedSkillIdx;
            return (
              <button
                key={skill.apiSkillId ?? `${activeGroup.apiGroupId}-${idx}`}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedSkillIdx(idx)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border p-3 text-left transition",
                  active
                    ? "border-[#F5B83D] bg-[#F5B83D]/12 shadow-[0_0_16px_rgba(245,184,61,0.28)]"
                    : "border-[#22D3EE]/25 bg-[#0A0E1A] hover:border-[#22D3EE]/60 hover:bg-[#15203E]",
                )}
              >
                {skill.iconUrl ? (
                  <Image
                    src={skill.iconUrl}
                    alt={skill.name}
                    width={48}
                    height={48}
                    unoptimized
                    className={cn(
                      "h-12 w-12 shrink-0 border-2 object-cover",
                      active
                        ? "border-[#F5B83D] shadow-[0_0_12px_rgba(245,184,61,0.4)]"
                        : "border-[#22D3EE]/35",
                    )}
                  />
                ) : (
                  <div className="font-display flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#F5B83D] bg-[#0A0E1A] text-sm text-[#F5B83D] shadow-[0_0_12px_rgba(245,184,61,0.3)]">
                    {skill.slotLabel.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display text-[11px] text-[#F5B83D]">
                    {skill.slotLabel}
                  </p>
                  <p className="font-display truncate text-sm text-[#E6EAF5]">
                    {skill.name}
                  </p>
                  {skill.cooldownSeconds !== null && (
                    <p className="mt-0.5 text-[10px] text-[#22D3EE]">
                      CD {skill.cooldownSeconds}s
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Penjelasan Detail Skill */}
        <div className="space-y-4 border border-[#22D3EE]/25 bg-[#0A0E1A] p-5">
          <div className="flex items-start gap-3.5">
            {activeSkill.iconUrl && (
              <Image
                src={activeSkill.iconUrl}
                alt={activeSkill.name}
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 shrink-0 border-2 border-[#F5B83D] object-cover shadow-[0_0_14px_rgba(245,184,61,0.4)]"
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
                        : "Energi"}
                    </Badge>
                  )}
              </div>
              <h3 className="font-display mt-2 text-2xl text-[#E6EAF5]">
                {activeSkill.name}
              </h3>
            </div>
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-[#E6EAF5]/90">
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
            <p className="text-xs text-[#9AA6C4]">
              Info Cooldown &amp; Biaya: {activeSkill.rawCooldownCost}
            </p>
          )}
        </div>
      </Surface>
    </section>
  );
}
