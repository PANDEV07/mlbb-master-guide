"use client";

import Link from "next/link";
import { Ban, Crown, Flame, Trophy } from "lucide-react";
import { HeroPortrait } from "@/features/heroes/components/HeroPortrait";
import { Surface } from "@/components/ui/Surface";
import {
  formatPercent,
  type MetaBracketSnapshot,
  type RankedMetaHero,
} from "../index";

type Props = {
  bracket: MetaBracketSnapshot;
};

type SpotlightCardConfig = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Trophy;
  iconAccent: string;
  valueAccent: string;
  heroes: RankedMetaHero[];
  formatMetric: (hero: RankedMetaHero) => string;
};

export function MetaSpotlightStrip({ bracket }: Props) {
  const cards: SpotlightCardConfig[] = [
    {
      id: "meta-leaders",
      title: "Meta Dominan",
      subtitle: "Skor komposit tertinggi",
      icon: Crown,
      iconAccent: "text-[#F5B83D] bg-[#F5B83D]/15 border-[#F5B83D]/40",
      valueAccent: "text-[#F5B83D]",
      heroes: bracket.spotlights.metaLeaders,
      formatMetric: (h) => `Skor ${h.metaScore}`,
    },
    {
      id: "highest-wr",
      title: "Win Rate Tertinggi",
      subtitle: "Paling konsisten menang",
      icon: Trophy,
      iconAccent: "text-[#4ADE80] bg-[#4ADE80]/15 border-[#4ADE80]/40",
      valueAccent: "text-[#4ADE80]",
      heroes: bracket.spotlights.highestWinRate,
      formatMetric: (h) => `${formatPercent(h.winRate)} WR`,
    },
    {
      id: "most-banned",
      title: "Prioritas Ban",
      subtitle: "Paling diwaspadai di draft",
      icon: Ban,
      iconAccent: "text-[#FB7185] bg-[#E11D48]/15 border-[#E11D48]/45",
      valueAccent: "text-[#FB7185]",
      heroes: bracket.spotlights.mostBanned,
      formatMetric: (h) => `${formatPercent(h.banRate)} Ban`,
    },
    {
      id: "most-picked",
      title: "Paling Populer",
      subtitle: "Sering muncul di ranked",
      icon: Flame,
      iconAccent: "text-[#22D3EE] bg-[#22D3EE]/15 border-[#22D3EE]/40",
      valueAccent: "text-[#22D3EE]",
      heroes: bracket.spotlights.mostPicked,
      formatMetric: (h) => `${formatPercent(h.pickRate)} Pick`,
    },
  ];

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Surface key={card.id} className="space-y-3 p-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border ${card.iconAccent}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display truncate text-base text-[#E6EAF5]">
                  {card.title}
                </h3>
                <p className="truncate text-[11px] text-[#9AA6C4]">
                  {card.subtitle}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {card.heroes.map((hero, index) => (
                <Link
                  key={`${card.id}-${hero.heroSlug}`}
                  href={`/heroes/${hero.heroSlug}`}
                  className="group flex items-center justify-between gap-2.5 border border-[#22D3EE]/20 bg-[#0A0E1A] px-2.5 py-2 transition hover:border-[#F5B83D]/60 hover:bg-[#15203E]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-display w-4 text-center text-sm text-[#F5B83D]">
                      {index + 1}
                    </span>
                    <HeroPortrait
                      slug={hero.heroSlug}
                      name={hero.heroName}
                      className="h-9 w-8 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display truncate text-sm text-[#E6EAF5] group-hover:text-[#F5B83D]">
                        {hero.heroName}
                      </p>
                      <p className="truncate text-[10px] text-[#9AA6C4]">
                        {hero.roles.join("/") || "Hero"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-display shrink-0 text-sm ${card.valueAccent}`}
                  >
                    {card.formatMetric(hero)}
                  </span>
                </Link>
              ))}
            </div>
          </Surface>
        );
      })}
    </div>
  );
}
