import heroCombosData from "@/data/imports/hero-combos.json";
import {
  cleanCandidateDescription,
  getHeroGameplayCandidate,
} from "./hero-gameplay-candidates";
import type {
  HeroComboCollection,
  HeroComboEntry,
  HeroSkillDisplayItem,
} from "../types/hero-combo.types";

type RawSkill = {
  apiSkillId: number | null;
  apiGroupId: string;
  name: string;
  description: string;
  iconUrl: string | null;
  videoUrl: string | null;
  rawCooldownCost: string | null;
  cooldownSeconds: number | null;
  resourceType: string | null;
  resourceCost: number | null;
  apiTags: Array<{ id: number; name: string; color: string }>;
  mechanicCategories?: string[];
};

function inferSkillSlotLabel(
  skill: Pick<RawSkill, "apiSkillId" | "cooldownSeconds">,
  indexInGroup: number,
  groupLength: number,
): string {
  if (indexInGroup === 0 && skill.cooldownSeconds === null) {
    return "Passive";
  }
  if (skill.apiSkillId !== null) {
    const suffix = skill.apiSkillId % 100;
    if (suffix === 0) return "Basic Attack";
    if (suffix === 40 || suffix === 80) return "Passive";
    if (suffix === 10 || suffix === 11) return "Skill 1";
    if (suffix === 20 || suffix === 21) return "Skill 2";
    if (suffix === 30 || suffix === 31) {
      return groupLength <= 4 ? "Ultimate" : "Skill 3";
    }
    if (suffix === 50 || suffix === 91) return "Ultimate";
  }
  if (indexInGroup === groupLength - 1 && groupLength >= 3) {
    return "Ultimate";
  }
  return `Skill ${indexInGroup}`;
}

export function getHeroSkillGroupsForDisplay(
  heroName: string,
): Array<{ apiGroupId: string; skills: HeroSkillDisplayItem[] }> {
  const candidate = getHeroGameplayCandidate(heroName);
  if (!candidate) return [];

  return candidate.skillGroups.map((group) => {
    const skills = group.skills as RawSkill[];
    return {
      apiGroupId: String(group.apiGroupId),
      skills: skills.map((skill, index) => ({
        apiSkillId: skill.apiSkillId ?? null,
        apiGroupId: String(skill.apiGroupId ?? group.apiGroupId),
        slotLabel: inferSkillSlotLabel(skill, index, skills.length),
        name: skill.name,
        description: cleanCandidateDescription(skill.description),
        iconUrl: skill.iconUrl ?? null,
        rawCooldownCost: skill.rawCooldownCost ?? null,
        cooldownSeconds: skill.cooldownSeconds ?? null,
        resourceType: skill.resourceType ?? null,
        resourceCost: skill.resourceCost ?? null,
        apiTags: Array.isArray(skill.apiTags) ? skill.apiTags : [],
        mechanicCategories: Array.isArray(skill.mechanicCategories)
          ? skill.mechanicCategories
          : [],
      })),
    };
  });
}

export function getHeroComboCollection(
  heroSlug: string,
  heroName: string,
): HeroComboCollection | null {
  const normalizedSlug = heroSlug.trim().toLowerCase();
  const normalizedName = heroName.trim().toLowerCase();

  const entry = heroCombosData.heroes.find(
    (item) =>
      item.heroSlug.trim().toLowerCase() === normalizedSlug ||
      item.heroName.trim().toLowerCase() === normalizedName,
  );

  if (!entry || entry.combos.length === 0) return null;

  const skillGroups = getHeroSkillGroupsForDisplay(heroName);
  const skillById = new Map<number, HeroSkillDisplayItem>();
  for (const group of skillGroups) {
    for (const skill of group.skills) {
      if (skill.apiSkillId !== null && !skillById.has(skill.apiSkillId)) {
        skillById.set(skill.apiSkillId, skill);
      }
    }
  }

  const combos: HeroComboEntry[] = entry.combos.map((combo, comboIndex) => ({
    id: `${entry.heroSlug}-${combo.type}-${comboIndex}`,
    type: combo.type,
    title: combo.title,
    description: combo.description,
    steps: combo.skillSequence.map((step, stepIndex) => {
      const matchedSkill = skillById.get(step.skillId);
      const isBasicAttack = !matchedSkill && step.skillId % 100 === 0;

      return {
        stepNumber: stepIndex + 1,
        skillId: step.skillId,
        skillName: matchedSkill
          ? matchedSkill.name
          : isBasicAttack
            ? "Basic Attack"
            : `Skill #${step.skillId}`,
        slotLabel: matchedSkill
          ? matchedSkill.slotLabel
          : isBasicAttack
            ? "Basic Attack"
            : "Skill",
        iconUrl: matchedSkill?.iconUrl ?? step.skillIcon ?? null,
        cooldownSeconds: matchedSkill?.cooldownSeconds ?? null,
        description: matchedSkill?.description ?? null,
      };
    }),
  }));

  return {
    heroSlug: entry.heroSlug,
    heroName: entry.heroName,
    skillUpgradePriority: entry.skillUpgradePriority,
    sourceName: heroCombosData.source.name,
    sourceUrl: entry.sourceUrl,
    verificationStatus: "UNVERIFIED",
    claimClassification: "COMMUNITY_THEORY",
    combos,
  };
}
