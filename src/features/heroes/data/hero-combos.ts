import heroCombosData from "@/data/imports/hero-combos.json";
import {
  cleanCandidateDescription,
  getHeroGameplayCandidate,
} from "./hero-gameplay-candidates";
import {
  getIndonesianSkillOverlay,
  localizeRawCooldownCost,
  localizeSkillTagName,
} from "./hero-skills-id";
import type {
  HeroComboCollection,
  HeroComboEntry,
  HeroComboStep,
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
    return "Pasif";
  }
  if (skill.apiSkillId !== null) {
    const suffix = skill.apiSkillId % 100;
    if (suffix === 0) return "Basic Attack";
    if (suffix === 40 || suffix === 80) return "Pasif";
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

function localizeComboTitle(type: string, rawTitle: string): string {
  const normalizedType = type.trim().toLowerCase();
  const normalizedTitle = rawTitle.trim().toLowerCase();

  if (normalizedType === "teamfight" || normalizedTitle.includes("teamfight")) {
    return "Kombo Teamfight";
  }
  if (normalizedType === "laning" || normalizedTitle.includes("laning")) {
    return "Kombo Laning & Farming";
  }
  if (normalizedTitle.includes("burst")) {
    return "Kombo Burst";
  }
  if (normalizedTitle.includes("poke")) {
    return "Kombo Poke";
  }
  return `Kombo ${rawTitle}`;
}

function buildIndonesianComboDescription(
  heroName: string,
  type: string,
  steps: HeroComboStep[],
): string {
  if (steps.length === 0) {
    return `Urutan eksekusi skill ${heroName}.`;
  }

  const context =
    type.trim().toLowerCase() === "teamfight"
      ? "pertarungan tim (teamfight)"
      : type.trim().toLowerCase() === "laning"
        ? "fase laning dan farming"
        : "pertarungan";

  const formattedSteps = steps.map((step) =>
    step.slotLabel === "Basic Attack"
      ? "Basic Attack"
      : `${step.slotLabel} (${step.skillName})`,
  );

  if (formattedSteps.length === 1) {
    return `Untuk ${context}, gunakan ${formattedSteps[0]} sebagai eksekusi utama ${heroName}.`;
  }

  const first = formattedSteps[0];
  const last = formattedSteps[formattedSteps.length - 1];
  const middle = formattedSteps.slice(1, -1);

  if (middle.length === 0) {
    return `Untuk ${context}, mulai dengan ${first} lalu akhiri dengan ${last}.`;
  }

  return `Untuk ${context}, buka dengan ${first}, lanjutkan ${middle.join(" → ")}, lalu tutup dengan ${last}.`;
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
      skills: skills.map((skill, index) => {
        const idOverlay = getIndonesianSkillOverlay(
          candidate.heroName,
          skill.apiSkillId,
          skill.name,
        );

        const rawTags = Array.isArray(skill.apiTags) ? skill.apiTags : [];
        const localizedTags =
          idOverlay && idOverlay.tags.length > 0
            ? idOverlay.tags.map((tagName, tagIdx) => ({
                id: rawTags[tagIdx]?.id ?? tagIdx + 1,
                name: localizeSkillTagName(tagName),
                color: rawTags[tagIdx]?.color ?? "",
              }))
            : rawTags.map((tag) => ({
                ...tag,
                name: localizeSkillTagName(tag.name),
              }));

        const description =
          idOverlay && idOverlay.description.trim().length > 0
            ? idOverlay.description
            : cleanCandidateDescription(skill.description);

        const rawCooldownCost =
          idOverlay?.rawCooldownCost ??
          localizeRawCooldownCost(skill.rawCooldownCost ?? null);

        return {
          apiSkillId: skill.apiSkillId ?? null,
          apiGroupId: String(skill.apiGroupId ?? group.apiGroupId),
          slotLabel: inferSkillSlotLabel(skill, index, skills.length),
          name: idOverlay?.name || skill.name,
          description,
          iconUrl: skill.iconUrl ?? null,
          rawCooldownCost,
          cooldownSeconds: skill.cooldownSeconds ?? null,
          resourceType: skill.resourceType ?? null,
          resourceCost: skill.resourceCost ?? null,
          apiTags: localizedTags,
          mechanicCategories: Array.isArray(skill.mechanicCategories)
            ? skill.mechanicCategories
            : [],
        };
      }),
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

  const combos: HeroComboEntry[] = entry.combos.map((combo, comboIndex) => {
    const steps: HeroComboStep[] = combo.skillSequence.map((step, stepIndex) => {
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
    });

    return {
      id: `${entry.heroSlug}-${combo.type}-${comboIndex}`,
      type: combo.type,
      title: localizeComboTitle(combo.type, combo.title),
      description: buildIndonesianComboDescription(
        entry.heroName,
        combo.type,
        steps,
      ),
      steps,
    };
  });

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
