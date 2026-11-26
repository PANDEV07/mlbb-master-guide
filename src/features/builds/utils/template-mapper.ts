import type { BuildProfile } from "../schemas/build.schema";
import type {
  BuildTemplateSlot,
  HeroBuildTemplate,
} from "../types/build.types";

export type DraftSlot = {
  itemEntityId: string;
  modifierItemEntityId: string;
  alternativeItemEntityId: string;
  rationale: string;
};

type EmptyTemplateSeed = {
  id: string;
  name: string;
  description: string;
};

export const EMPTY_TEMPLATE_SEEDS: readonly EmptyTemplateSeed[] = [
  {
    id: "balanced",
    name: "Balanced",
    description:
      "Template fleksibel untuk kombinasi atribut dan kebutuhan hero.",
  },
  {
    id: "damage",
    name: "Damage",
    description:
      "Template untuk menyusun fokus damage sesuai kondisi pertandingan.",
  },
  {
    id: "situational",
    name: "Situational",
    description:
      "Template untuk item responsif terhadap komposisi lawan.",
  },
] as const;

export function createEmptyDraftSlots(): DraftSlot[] {
  return Array.from({ length: 6 }, () => ({
    itemEntityId: "",
    modifierItemEntityId: "",
    alternativeItemEntityId: "",
    rationale: "",
  }));
}

export function createEmptyTemplateSlots(): BuildTemplateSlot[] {
  return Array.from({ length: 6 }, (_, index) => ({
    slotOrder: index + 1,
    itemEntityId: null,
    alternativeItemEntityId: null,
    rawItemName: null,
    catalogMatchStatus: "EMPTY",
    isVerifiedItem: false,
    rationale: "",
  }));
}

export function mapHeroBuildToTemplate(input: {
  id: string;
  patchVersion: string;
  verificationStatus: string;
  profile: BuildProfile;
  sourceLabel?: string | null;
  sourceUrl: string | null;
}): HeroBuildTemplate {
  const slotMap = new Map(
    input.profile.itemSlots.map((slot) => [slot.position, slot]),
  );

  const slots: BuildTemplateSlot[] = Array.from({ length: 6 }, (_, index) => {
    const position = index + 1;
    const found = slotMap.get(position);
    if (!found) {
      return {
        slotOrder: position,
        itemEntityId: null,
        alternativeItemEntityId: null,
        rawItemName: null,
        catalogMatchStatus: "EMPTY",
        isVerifiedItem: false,
        rationale: "",
      };
    }

    return {
      slotOrder: position,
      itemEntityId: found.itemEntityId,
      alternativeItemEntityId: found.alternativeItemEntityIds[0] ?? null,
      rawItemName: null,
      catalogMatchStatus: "MATCHED",
      isVerifiedItem: input.verificationStatus === "VERIFIED",
      rationale: found.rationale,
    };
  });

  return {
    id: `hero-build:${input.id}`,
    sourceKind: "HERO_BUILD",
    name: input.profile.name,
    description: input.profile.description,
    verificationStatus: input.verificationStatus,
    patchVersion: input.patchVersion || null,
    sourceLabel: input.sourceLabel ?? "Database Hero Builds",
    sourceUrl: input.sourceUrl,
    metaSummary: `${input.profile.role} · ${input.profile.lane}`,
    slots,
  };
}

export type ProBuildTemplateSourceInput = {
  id: string;
  playerName: string;
  teamName: string;
  roleLane: string | null;
  matchResult: "WIN" | "LOSS" | "UNKNOWN";
  tournamentName: string;
  stageName: string | null;
  matchDate: string | null;
  patchVersion: string | null;
  rawPatchVersion: string | null;
  verificationStatus: string;
  provider: string | null;
  sourceUrl: string | null;
  items: Array<{
    slotOrder: number;
    rawItemName: string;
    itemEntityId: string | null;
    catalogMatchStatus: "MATCHED" | "UNMATCHED" | "AMBIGUOUS";
    isVerifiedItem: boolean;
  }>;
};

export function mapProMatchBuildToTemplate(
  input: ProBuildTemplateSourceInput,
): HeroBuildTemplate {
  const bySlot = new Map(input.items.map((item) => [item.slotOrder, item]));

  const slots: BuildTemplateSlot[] = Array.from({ length: 6 }, (_, index) => {
    const slotOrder = index + 1;
    const found = bySlot.get(slotOrder);

    if (!found) {
      return {
        slotOrder,
        itemEntityId: null,
        alternativeItemEntityId: null,
        rawItemName: null,
        catalogMatchStatus: "EMPTY",
        isVerifiedItem: false,
        rationale: "",
      };
    }

    const matchedEntityId =
      found.catalogMatchStatus === "MATCHED" ? found.itemEntityId : null;

    return {
      slotOrder,
      itemEntityId: matchedEntityId,
      alternativeItemEntityId: null,
      rawItemName: found.rawItemName,
      catalogMatchStatus: matchedEntityId
        ? "MATCHED"
        : found.catalogMatchStatus === "AMBIGUOUS"
          ? "AMBIGUOUS"
          : "UNMATCHED",
      isVerifiedItem: Boolean(matchedEntityId && found.isVerifiedItem),
      rationale: matchedEntityId
        ? `Dipakai ${input.playerName} (${input.teamName}) di ${input.tournamentName}.`
        : `[Item mentah belum cocok katalog: ${found.rawItemName}]`,
    };
  });

  const resultBadge =
    input.matchResult === "WIN"
      ? "WIN"
      : input.matchResult === "LOSS"
        ? "LOSS"
        : "HASIL BELUM DIKETAHUI";

  const metaParts = [
    input.tournamentName,
    input.stageName,
    input.roleLane,
    resultBadge,
    input.matchDate,
  ].filter(Boolean);

  return {
    id: `pro-build:${input.id}`,
    sourceKind: "PRO_MATCH_BUILD",
    name: `${input.playerName} (${input.teamName})`,
    description: metaParts.join(" · "),
    verificationStatus: input.verificationStatus,
    patchVersion: input.patchVersion ?? input.rawPatchVersion ?? null,
    sourceLabel: input.provider ? `Sumber: ${input.provider}` : "Pro Match Pipeline",
    sourceUrl: input.sourceUrl,
    metaSummary: `${input.teamName} · ${resultBadge}`,
    slots,
  };
}

/**
 * Menggabungkan template nyata dari database (maksimal 3) dan mengisi sisa slot
 * dengan template kosong standar agar halaman selalu menampilkan 3 kartu tanpa data karangan.
 */
export function composeThreeBuildTemplates(
  databaseTemplates: HeroBuildTemplate[],
): HeroBuildTemplate[] {
  const filled = databaseTemplates.slice(0, 3);
  const remainingCount = Math.max(0, 3 - filled.length);

  const emptyTemplates: HeroBuildTemplate[] = EMPTY_TEMPLATE_SEEDS.slice(
    0,
    remainingCount,
  ).map((seed) => ({
    id: seed.id,
    sourceKind: "EMPTY_TEMPLATE",
    name: seed.name,
    description: seed.description,
    verificationStatus: "UNVERIFIED",
    patchVersion: null,
    sourceLabel: null,
    sourceUrl: null,
    metaSummary: null,
    slots: createEmptyTemplateSlots(),
  }));

  return [...filled, ...emptyTemplates];
}

/**
 * Konversi template build menjadi 6 DraftSlot untuk editor workbench.
 * Item mentah yang belum cocok katalog tidak diberi UUID palsu.
 */
export function templateToDraftSlots(
  template: HeroBuildTemplate,
  validItemIds: ReadonlySet<string>,
): DraftSlot[] {
  const bySlot = new Map(template.slots.map((slot) => [slot.slotOrder, slot]));

  return Array.from({ length: 6 }, (_, index) => {
    const slot = bySlot.get(index + 1);
    if (!slot) {
      return {
        itemEntityId: "",
        modifierItemEntityId: "",
        alternativeItemEntityId: "",
        rationale: "",
      };
    }

    const itemEntityId =
      slot.itemEntityId && validItemIds.has(slot.itemEntityId)
        ? slot.itemEntityId
        : "";
    const alternativeItemEntityId =
      slot.alternativeItemEntityId &&
      validItemIds.has(slot.alternativeItemEntityId)
        ? slot.alternativeItemEntityId
        : "";

    return {
      itemEntityId,
      modifierItemEntityId: "",
      alternativeItemEntityId,
      rationale: slot.rationale,
    };
  });
}
