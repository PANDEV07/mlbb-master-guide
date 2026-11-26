import { cache } from "react";
import { getHeroDirectory } from "@/features/heroes";
import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import { getMetaDashboardPayload } from "@/features/meta";
import {
  buildHeroMechanicProfile,
  toHeroSlug,
} from "@/features/matchups/engine/team-draft-analyzer";
import type { GameplayCandidateHero } from "@/features/matchups/engine/mechanic-extractor";
import type { MatchupLane } from "@/features/matchups/types/matchup-hub.types";
import candidateData from "../../../../hero-gameplay-normalized.json";
import type { DraftHeroEntry } from "../types/draft.types";

const VALID_LANES = new Set<string>([
  "EXP Lane",
  "Jungle",
  "Mid Lane",
  "Gold Lane",
  "Roam",
]);

function normalizeLanes(raw: readonly string[]): MatchupLane[] {
  const out: MatchupLane[] = [];
  for (const lane of raw) {
    if (VALID_LANES.has(lane) && !out.includes(lane as MatchupLane)) {
      out.push(lane as MatchupLane);
    }
  }
  return out.length > 0 ? out : ["EXP Lane"];
}

/**
 * Membangun pool 133 hero ringkas di sisi server untuk Live Draft Simulator.
 * Menggabungkan:
 * - Direktori Hero Original Server
 * - Statistik Resmi Moonton GMS (Mythical Glory+: WR, Pick, Ban, Tier S–D, Meta Score)
 * - Ringkasan mekanik nyata (Damage Profile, Hard CC, Mobility, Sustain, Frontline)
 */
export const getDraftHeroPool = cache(async (): Promise<{
  heroPool: DraftHeroEntry[];
  patchVersion: string;
  metaUpdatedAt: string;
}> => {
  const [directory, metaPayload] = await Promise.all([
    getHeroDirectory(),
    Promise.resolve(getMetaDashboardPayload()),
  ]);

  const metaBySlug = new Map(
    metaPayload.brackets.mythical_glory.heroes.map((h) => [h.heroSlug, h]),
  );

  const mechanicBySlug = new Map(
    (candidateData as GameplayCandidateHero[]).map((candidate) => {
      const slug = toHeroSlug(candidate.heroName);
      return [slug, buildHeroMechanicProfile(candidate)] as const;
    }),
  );

  const heroPool: DraftHeroEntry[] = directory.heroes.map((hero) => {
    const slug = hero.metadata.slug;
    const roles = hero.profile?.role
      ? [hero.profile.role, ...(HERO_ROLE_MAP[slug] ?? []).filter((r) => r !== hero.profile?.role)]
      : (HERO_ROLE_MAP[slug] ?? []);
    const rawLanes =
      hero.profile?.lanes && hero.profile.lanes.length > 0
        ? hero.profile.lanes
        : (HERO_LANE_MAP[slug] ?? []);
    const lanes = normalizeLanes(rawLanes);

    const meta = metaBySlug.get(slug);
    const mech = mechanicBySlug.get(slug);

    const hasFrontline =
      roles.includes("Tank") ||
      (roles.includes("Fighter") && (mech?.defenseEvidenceCount ?? 0) >= 1) ||
      lanes.includes("Roam");

    return {
      slug,
      name: hero.metadata.name,
      roles,
      lanes,
      tier: meta?.tier ?? "C",
      metaScore: meta?.metaScore ?? 40,
      winRate: meta?.winRate ?? 0.5,
      pickRate: meta?.pickRate ?? 0.005,
      banRate: meta?.banRate ?? 0.005,
      damageProfile: mech?.damageProfile ?? "Belum Terpetakan",
      hasHardCC: (mech?.hardControlCount ?? 0) > 0,
      hasMobility: (mech?.mobilityEvidenceCount ?? 0) > 0,
      hasSustain: (mech?.sustainEvidenceCount ?? 0) > 0,
      hasFrontline,
    };
  });

  // Urutkan default berdasarkan Meta Score tertinggi
  heroPool.sort((a, b) => b.metaScore - a.metaScore || a.name.localeCompare(b.name));

  return {
    heroPool,
    patchVersion: directory.patch?.versionCode ?? "2.2.23",
    metaUpdatedAt: metaPayload.fetchedAt,
  };
});
