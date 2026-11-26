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
      iconAccent: "text-amber-300 bg-amber-400/15 border-amber-400/30",
      valueAccent: "text-amber-200",
      heroes: bracket.spotlights.metaLeaders,
      formatMetric: (h) => `Skor ${h.metaScore}`,
    },
    {
      id: "highest-wr",
      title: "Win Rate Tertinggi",
      subtitle: "Paling konsisten menang",
      icon: Trophy,
      iconAccent: "text-emerald-300 bg-emerald-500/15 border-emerald-400/30",
      valueAccent: "text-emerald-300",
      heroes: bracket.spotlights.highestWinRate,
      formatMetric: (h) => `${formatPercent(h.winRate)} WR`,
    },
    {
      id: "most-banned",
      title: "Prioritas Ban",
      subtitle: "Paling diwaspadai di draft",
      icon: Ban,
      iconAccent: "text-rose-300 bg-rose-500/15 border-rose-400/30",
      valueAccent: "text-rose-300",
      heroes: bracket.spotlights.mostBanned,
      formatMetric: (h) => `${formatPercent(h.banRate)} Ban`,
    },
    {
      id: "most-picked",
      title: "Paling Populer",
      subtitle: "Sering muncul di ranked",
      icon: Flame,
      iconAccent: "text-sky-300 bg-sky-500/15 border-sky-400/30",
      valueAccent: "text-sky-300",
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
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${card.iconAccent}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold text-white">
                  {card.title}
                </h3>
                <p className="truncate text-[11px] text-slate-400">
                  {card.subtitle}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {card.heroes.map((hero, index) => (
                <Link
                  key={`${card.id}-${hero.heroSlug}`}
                  href={`/heroes/${hero.heroSlug}`}
                  className="group flex items-center justify-between gap-2.5 rounded-xl border border-[#1E2A33] bg-[#0B1014] px-2.5 py-2 transition hover:border-emerald-400/45 hover:bg-[#131C23]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-4 text-center text-[11px] font-bold text-slate-500">
                      {index + 1}
                    </span>
                    <HeroPortrait
                      slug={hero.heroSlug}
                      name={hero.heroName}
                      className="h-9 w-8 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white group-hover:text-emerald-300">
                        {hero.heroName}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {hero.roles.join("/") || "Hero"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[11px] font-semibold ${card.valueAccent}`}
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
