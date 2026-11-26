import type { ItemIdentityInput } from "../schemas/item.schema";

export type ItemIdentity = ItemIdentityInput;

export type ItemRecord = {
  entityId: string;
  entityType: "item";
  metadata: ItemIdentity;
  profileId: string | null;
  patchVersionId: string | null;
  serverType:
    | "ORIGINAL_SERVER"
    | "ADVANCE_SERVER"
    | "EXPERIMENTAL"
    | null;
  effectiveRange: string | null;
};