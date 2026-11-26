export interface HeroSkillDisplayItem {
  apiSkillId: number | null;
  apiGroupId: string;
  slotLabel: string;
  name: string;
  description: string;
  iconUrl: string | null;
  rawCooldownCost: string | null;
  cooldownSeconds: number | null;
  resourceType: string | null;
  resourceCost: number | null;
  apiTags: Array<{ id: number; name: string; color: string }>;
  mechanicCategories: string[];
}

export interface HeroComboStep {
  stepNumber: number;
  skillId: number;
  skillName: string;
  slotLabel: string;
  iconUrl: string | null;
  cooldownSeconds: number | null;
  description: string | null;
}

export interface HeroComboEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  steps: HeroComboStep[];
}

export interface HeroComboCollection {
  heroSlug: string;
  heroName: string;
  skillUpgradePriority: string | null;
  sourceName: string;
  sourceUrl: string;
  verificationStatus: "UNVERIFIED";
  claimClassification: "COMMUNITY_THEORY";
  combos: HeroComboEntry[];
}
