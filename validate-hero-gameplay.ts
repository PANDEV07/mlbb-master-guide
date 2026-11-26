import { readFileSync } from "node:fs";
import { heroSkillGroupSchema } from "./src/features/heroes/schemas/hero.schema";

const heroes = JSON.parse(readFileSync("hero-gameplay-normalized.json", "utf8"));
let valid = 0;
let invalid = 0;
const errors: string[] = [];

for (const hero of heroes) {
  for (const group of hero.skillGroups) {
    const result = heroSkillGroupSchema.safeParse(group);
    if (result.success) valid++;
    else {
      invalid++;
      errors.push(`${hero.heroName} / ${group.apiGroupId}: ${result.error.issues.map(i => i.message).join(", ")}`);
    }
  }
}

console.log({ heroes: heroes.length, validGroups: valid, invalidGroups: invalid });
if (errors.length) console.log(errors.slice(0, 10));
