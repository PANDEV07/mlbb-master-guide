import {
  getCurrentOriginalServerHeroes,
  getOriginalServerHeroBySlug,
} from "../repositories/hero.repository";

export async function getHeroDirectory() {
  return getCurrentOriginalServerHeroes();
}

export async function getHeroDetail(slug: string) {
  return getOriginalServerHeroBySlug(slug);
}
