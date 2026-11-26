function mapMechanicCategories(tags: string[]) {
  const mapping: Record<string, string> = {
    AOE: "DAMAGE",
    Attach: "UTILITY",
    Buff: "BUFF_DEBUFF",
    Burst: "DAMAGE",
    CC: "CROWD_CONTROL",
    "CC Immune": "DEFENSE",
    Charge: "MOBILITY",
    Conceal: "UTILITY",
    Damage: "DAMAGE",
    "Death Immunity": "DEFENSE",
    Debuff: "BUFF_DEBUFF",
    Heal: "SUSTAIN",
    Invincible: "DEFENSE",
    Mobility: "MOBILITY",
    Morph: "SPECIAL",
    "Reduce DMG": "DEFENSE",
    "Remove CC": "UTILITY",
    Shield: "DEFENSE",
    Slow: "CROWD_CONTROL",
    "Speed Up": "BUFF_DEBUFF",
    Summon: "SPECIAL",
    Teleport: "MOBILITY",
  };

  return [...new Set(
    tags
      .map((tag) => mapping[tag])
      .filter((category): category is string => Boolean(category))
  )];
}
function parseCooldownCost(raw: string | null) {
  if (!raw?.trim()) {
    return {
      cooldownSeconds: null,
      resourceType: null,
      resourceCost: null,
    };
  }

  const cooldown = raw.match(/\bCD:\s*(\d+(?:\.\d+)?)/i);
  const mana = raw.match(/\bMana Cost:\s*(\d+(?:\.\d+)?)/i);
  const energy = raw.match(/\bEnergy Cost:\s*(\d+(?:\.\d+)?)/i);

  return {
    cooldownSeconds: cooldown ? Number(cooldown[1]) : null,
    resourceType: mana ? "MANA" as const : energy ? "ENERGY" as const : null,
    resourceCost: mana
      ? Number(mana[1])
      : energy
        ? Number(energy[1])
        : null,
  };
}
import { readFileSync, writeFileSync } from "node:fs";

const input = JSON.parse(
  readFileSync("hero-gameplay-api-audit.json", "utf8")
);

const normalized = input.map((hero: any) => ({
  heroName: hero.name,
  heroId: hero.heroId,
  skillGroups: Object.values(
    hero.skills.reduce((groups: any, skill: any) => {
      const key = String(skill.groupId ?? "unknown");

      if (!groups[key]) {
        groups[key] = {
          apiGroupId: key,
          skills: [],
        };
      }

      const rawTags = Array.isArray(skill.tags)
        ? skill.tags
        : skill.tags
          ? [skill.tags]
          : [];

      groups[key].skills.push({
        apiSkillId: skill.skillId,
        apiGroupId: key,
        name: skill.name,
        description: skill.description ?? "",
        apiTags: rawTags.map((tag: any) => ({
          id: tag.tagid ?? tag.id,
          name: tag.tagname ?? tag.name ?? String(tag),
          color: tag.tagrgb ?? tag.color,
        })),
        iconUrl: skill.iconUrl || null,
        videoUrl: skill.videoUrl || null,
        rawCooldownCost: skill.cooldownCost || null,
        ...parseCooldownCost(skill.cooldownCost || null),
        mechanicCategories: mapMechanicCategories(rawTags.map((tag: any) => tag.tagname ?? tag.name ?? String(tag))),
        mechanics: [],
      });

      return groups;
    }, {})
  ),
}));

writeFileSync(
  "hero-gameplay-normalized.json",
  JSON.stringify(normalized, null, 2),
  "utf8"
);

const totalGroups = normalized.reduce(
  (sum: number, hero: any) => sum + hero.skillGroups.length,
  0
);

const totalSkills = normalized.reduce(
  (sum: number, hero: any) =>
    sum + hero.skillGroups.reduce(
      (n: number, group: any) => n + group.skills.length, 0
    ),
  0
);

console.log({
  heroes: normalized.length,
  skillGroups: totalGroups,
  skills: totalSkills,
  output: "hero-gameplay-normalized.json",
});
