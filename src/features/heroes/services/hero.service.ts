import { cache } from "react";
import {
  getCurrentOriginalServerHeroes,
  getOriginalServerHeroBySlug,
} from "../repositories/hero.repository";

export const getHeroDirectory = cache(async () => {
  return getCurrentOriginalServerHeroes();
});

export const getHeroDetail = cache(async (slug: string) => {
  return getOriginalServerHeroBySlug(slug);
});
