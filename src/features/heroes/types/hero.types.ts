import type {
  HeroIdentityInput,
  HeroProfileInput,
} from "../schemas/hero.schema";

export type HeroIdentity = HeroIdentityInput;
export type HeroProfile = HeroProfileInput;

export type HeroRecord = {
  entityId: string;
  entityType: "hero";
  metadata: HeroIdentity;
  profileId: string | null;
  patchVersionId: string | null;
  serverType: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL" | null;
  effectiveRange: string | null;
  profile: HeroProfile | null;
};
