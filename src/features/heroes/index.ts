export const HERO_FILTER_DIMENSIONS = {
  roles: ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"],
  lanes: ["EXP Lane", "Jungle", "Mid Lane", "Gold Lane", "Roam"],
  damageTypes: ["Physical", "Magic", "True Damage", "Hybrid"],
} as const;

export {
  getHeroDirectory,
  getHeroDetail,
} from "./services/hero.service";

export {
  getCurrentOriginalServerHeroes,
  getOriginalServerHeroBySlug,
} from "./repositories/hero.repository";

export type {
  HeroIdentity,
  HeroProfile,
  HeroRecord,
} from "./types/hero.types";

export type { HeroEvidence } from "./types/hero-evidence.types";

export * from "./engine/hero-profile-insights";
