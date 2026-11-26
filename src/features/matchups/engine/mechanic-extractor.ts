export const MECHANIC_CATEGORIES = [
  "DAMAGE",
  "CROWD_CONTROL",
  "MOBILITY",
  "DEFENSE",
  "SUSTAIN",
  "BUFF_DEBUFF",
  "UTILITY",
  "SPECIAL",
] as const;

export type MechanicCategory = (typeof MECHANIC_CATEGORIES)[number];

export type MechanicCategoryStatus = "CLASSIFIED" | "UNKNOWN";

export type MechanicVerificationStatus = "UNVERIFIED";

export interface GameplayCandidateTag {
  id?: string | number;
  name: string;
  color?: string;
}

export interface GameplayCandidateSkill {
  apiSkillId?: string | number;
  apiGroupId?: string | number;
  name: string;
  description?: string;
  apiTags?: GameplayCandidateTag[];
  mechanicCategories?: MechanicCategory[];
  mechanics?: string[];
  iconUrl?: string | null;
  videoUrl?: string | null;
}

export interface GameplayCandidateSkillGroup {
  apiGroupId: string | number;
  skills: GameplayCandidateSkill[];
}

export interface GameplayCandidateHero {
  heroName: string;
  skillGroups: GameplayCandidateSkillGroup[];
}

export interface ExtractedMechanicRecord {
  heroName: string;
  apiGroupId: string | number;
  apiSkillId: string | number | null;
  skillName: string;
  description: string;
  mechanicCategories: MechanicCategory[];
  categoryStatus: MechanicCategoryStatus;
  apiTags: GameplayCandidateTag[];
  mechanics: string[];
  iconUrl: string | null;
  videoUrl: string | null;
  sourceDataset: "hero-gameplay-normalized.json";
  verificationStatus: MechanicVerificationStatus;
}

export function extractHeroMechanics(
  heroes: GameplayCandidateHero[],
): ExtractedMechanicRecord[] {
  return heroes.flatMap((hero) =>
    hero.skillGroups.flatMap((group) =>
      group.skills.map((skill) => {
        const categories = skill.mechanicCategories ?? [];

        return {
          heroName: hero.heroName,
          apiGroupId: group.apiGroupId,
          apiSkillId: skill.apiSkillId ?? null,
          skillName: skill.name,
          description: skill.description ?? "",
          mechanicCategories: [...categories],
          categoryStatus:
            categories.length > 0 ? "CLASSIFIED" : "UNKNOWN",
          apiTags: (skill.apiTags ?? []).map((tag) => ({ ...tag })),
          mechanics: [...(skill.mechanics ?? [])],
          iconUrl: skill.iconUrl ?? null,
          videoUrl: skill.videoUrl ?? null,
          sourceDataset: "hero-gameplay-normalized.json",
          verificationStatus: "UNVERIFIED",
        };
      }),
    ),
  );
}