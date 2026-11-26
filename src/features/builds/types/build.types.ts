import type {
  BuildCondition,
  BuildItemSlot,
  BuildProfile,
} from "../schemas/build.schema";

export type {
  BuildCondition,
  BuildItemSlot,
  BuildProfile,
};

export type BuildRecord = {
  id: string;
  patchVersionId: string;
  serverType: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL";
  profile: BuildProfile;
  sourceUrls: string[];
  verifiedAt: Date | null;
};

export type BuildTemplateSourceKind =
  | "HERO_BUILD"
  | "PRO_MATCH_BUILD"
  | "EMPTY_TEMPLATE";

export type BuildTemplateSlot = {
  slotOrder: number;
  itemEntityId: string | null;
  alternativeItemEntityId: string | null;
  rawItemName: string | null;
  catalogMatchStatus: "MATCHED" | "UNMATCHED" | "AMBIGUOUS" | "EMPTY";
  isVerifiedItem: boolean;
  rationale: string;
};

export type HeroBuildTemplate = {
  id: string;
  sourceKind: BuildTemplateSourceKind;
  name: string;
  description: string;
  verificationStatus: string;
  patchVersion: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  metaSummary: string | null;
  slots: BuildTemplateSlot[];
};
