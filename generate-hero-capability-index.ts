import { readFileSync, writeFileSync } from "node:fs";

const heroes = JSON.parse(
  readFileSync("hero-gameplay-normalized.json", "utf8")
);

const index = heroes.map((hero: any) => {
  const categories = new Set<string>();
  const tags = new Set<string>();

  for (const group of hero.skillGroups) {
    for (const skill of group.skills) {
      for (const category of skill.mechanicCategories ?? []) {
        categories.add(category);
      }

      for (const tag of skill.apiTags ?? []) {
        if (tag.name) tags.add(tag.name);
      }
    }
  }

  return {
    heroName: hero.heroName,
    mechanicCategories: [...categories].sort(),
    apiTags: [...tags].sort(),
  };
});

writeFileSync(
  "src/features/heroes/data/hero-capability-index.json",
  JSON.stringify(index, null, 2),
  "utf8"
);

console.log({
  heroes: index.length,
  categories: [...new Set(index.flatMap((h: any) => h.mechanicCategories))].length,
  apiTags: [...new Set(index.flatMap((h: any) => h.apiTags))].length,
  output: "src/features/heroes/data/hero-capability-index.json",
});