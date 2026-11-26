"use client";

import { useState } from "react";
import { Swords, Users } from "lucide-react";
import type { HeroRecord } from "@/features/heroes";
import { Surface } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { HeadToHeadMatchupPanel } from "./components/HeadToHeadMatchupPanel";
import { TeamDraftMatchupPanel } from "./components/TeamDraftMatchupPanel";

type Props = {
  heroes: HeroRecord[];
  patchVersion: string;
};

type MatchupMode = "head-to-head" | "team-5v5";

export function MatchupAnalyzerClient({ heroes, patchVersion }: Props) {
  const [mode, setMode] = useState<MatchupMode>("head-to-head");
  const [heroAName, setHeroAName] = useState("");
  const [heroBName, setHeroBName] = useState("");

  const handleInspectLane1v1 = (allyName: string, enemyName: string) => {
    setHeroAName(allyName);
    setHeroBName(enemyName);
    setMode("head-to-head");
  };

  return (
    <div className="space-y-5">
      {/* Mode Switcher Bar */}
      <Surface className="p-2">
        <div
          role="tablist"
          aria-label="Mode Analisis Matchup"
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "head-to-head"}
            onClick={() => setMode("head-to-head")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition sm:text-sm",
              mode === "head-to-head"
                ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
                : "border-transparent bg-[#0A0E1A] text-slate-400 hover:border-[#22D3EE]/35 hover:text-slate-200",
            )}
          >
            <Swords className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Duel 1v1 (Satu Lawan Satu)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "team-5v5"}
            onClick={() => setMode("team-5v5")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition sm:text-sm",
              mode === "team-5v5"
                ? "border-[#F5B83D] bg-[#F5B83D] text-[#0A0E1A] shadow-[0_0_16px_rgba(245,184,61,0.4)]"
                : "border-transparent bg-[#0A0E1A] text-slate-400 hover:border-[#22D3EE]/35 hover:text-slate-200",
            )}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Matchup Tim 5v5 (Draft &amp; Komposisi)</span>
          </button>
        </div>
      </Surface>

      {mode === "head-to-head" ? (
        <HeadToHeadMatchupPanel
          heroes={heroes}
          patchVersion={patchVersion}
          heroAName={heroAName}
          heroBName={heroBName}
          onChangeHeroA={setHeroAName}
          onChangeHeroB={setHeroBName}
        />
      ) : (
        <TeamDraftMatchupPanel
          heroes={heroes}
          patchVersion={patchVersion}
          onInspectLane1v1={handleInspectLane1v1}
        />
      )}
    </div>
  );
}
