import type { ProBuildImportFile } from "../schemas/pro-build-import.schema";
import { buildProMatchItemRecord } from "../schemas/pro-build-pipeline.schema";

export type CatalogLookupEntity = {
  entityId: string;
  slug: string;
  name: string;
};

export type PatchLookupEntry = {
  id: string;
  versionCode: string;
  serverType: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL";
};

export type CatalogLookupIndex = {
  heroes: CatalogLookupEntity[];
  items: CatalogLookupEntity[];
  spells: CatalogLookupEntity[];
  emblems: CatalogLookupEntity[];
  patches: PatchLookupEntry[];
};

function normalizeLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildLookupMap(
  entries: CatalogLookupEntity[],
): Map<string, CatalogLookupEntity[]> {
  const map = new Map<string, CatalogLookupEntity[]>();

  const register = (key: string, entry: CatalogLookupEntity) => {
    if (!key) return;
    const list = map.get(key) ?? [];
    if (!list.some((existing) => existing.entityId === entry.entityId)) {
      list.push(entry);
      map.set(key, list);
    }
  };

  for (const entry of entries) {
    register(normalizeLookupKey(entry.slug), entry);
    register(normalizeLookupKey(entry.name), entry);
  }

  return map;
}

function lookupEntity(
  map: Map<string, CatalogLookupEntity[]>,
  preferredSlug: string | undefined,
  rawName: string | null | undefined,
): { entityId: string | null; ambiguous: boolean } {
  const candidates = [preferredSlug, rawName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeLookupKey);

  for (const key of candidates) {
    const matches = map.get(key);
    if (!matches || matches.length === 0) continue;
    if (matches.length === 1) {
      return { entityId: matches[0].entityId, ambiguous: false };
    }
    return { entityId: null, ambiguous: true };
  }

  return { entityId: null, ambiguous: false };
}

export type ResolvedProBuildImport = {
  summary: {
    matchCount: number;
    playerBuildCount: number;
    sourceCount: number;
    matchedItemCount: number;
    unmatchedItemCount: number;
    ambiguousItemCount: number;
    unmatchedHeroNames: string[];
    unmatchedPatchVersions: string[];
    unmatchedRawItemNames: string[];
  };
  matches: Array<{
    tournamentName: string;
    stageName: string | null;
    matchCode: string | null;
    gameNumber: number | null;
    teamAName: string;
    teamBName: string;
    winnerTeamName: string | null;
    matchDate: string | null;
    playedAt: Date | null;
    patchVersionId: string | null;
    serverType: "ORIGINAL_SERVER" | "ADVANCE_SERVER" | "EXPERIMENTAL";
    rawPatchVersion: string | null;
    verificationStatus:
      | "VERIFIED"
      | "PARTIALLY_VERIFIED"
      | "UNVERIFIED"
      | "OUTDATED"
      | "CONFLICTING"
      | "UNKNOWN"
      | "NOT_RESEARCHED"
      | "NOT_YET_AVAILABLE"
      | "NOT_FOUND";
    sources: ProBuildImportFile["matches"][number]["sources"];
    playerBuilds: Array<{
      playerName: string;
      teamName: string;
      teamSide: "BLUE" | "RED" | "UNKNOWN";
      roleLane: string | null;
      heroEntityId: string | null;
      rawHeroName: string;
      battleSpellEntityId: string | null;
      rawBattleSpellName: string | null;
      emblemEntityId: string | null;
      rawEmblemName: string | null;
      rawEmblemTalents: string[];
      matchResult: "WIN" | "LOSS" | "UNKNOWN";
      kills: number | null;
      deaths: number | null;
      assists: number | null;
      verificationStatus:
        | "VERIFIED"
        | "PARTIALLY_VERIFIED"
        | "UNVERIFIED"
        | "OUTDATED"
        | "CONFLICTING"
        | "UNKNOWN"
        | "NOT_RESEARCHED"
        | "NOT_YET_AVAILABLE"
        | "NOT_FOUND";
      items: Array<ReturnType<typeof buildProMatchItemRecord>>;
    }>;
  }>;
};

/**
 * Memetakan dataset impor Pro Player Build terhadap katalog `knowledge_entities` & `patch_versions`.
 * Invarian: item yang belum cocok katalog tetap disimpan dengan `rawItemName`,
 * namun selalu dipaksa `itemEntityId = null`, `isVerifiedItem = false`, dan `verificationStatus = 'UNVERIFIED'`.
 */
export function resolveProBuildImportCatalog(
  file: ProBuildImportFile,
  catalog: CatalogLookupIndex,
): ResolvedProBuildImport {
  const heroMap = buildLookupMap(catalog.heroes);
  const itemMap = buildLookupMap(catalog.items);
  const spellMap = buildLookupMap(catalog.spells);
  const emblemMap = buildLookupMap(catalog.emblems);

  const patchMap = new Map<string, PatchLookupEntry>();
  for (const patch of catalog.patches) {
    patchMap.set(
      `${patch.serverType}:${patch.versionCode.trim().toLowerCase()}`,
      patch,
    );
  }

  let playerBuildCount = 0;
  let sourceCount = 0;
  let matchedItemCount = 0;
  let unmatchedItemCount = 0;
  let ambiguousItemCount = 0;
  const unmatchedHeroNames = new Set<string>();
  const unmatchedPatchVersions = new Set<string>();
  const unmatchedRawItemNames = new Set<string>();

  const matches = file.matches.map((match) => {
    const patchKey = match.rawPatchVersion
      ? `${match.serverType}:${match.rawPatchVersion.trim().toLowerCase()}`
      : null;
    const matchedPatch = patchKey ? patchMap.get(patchKey) ?? null : null;

    if (match.rawPatchVersion && !matchedPatch) {
      unmatchedPatchVersions.add(match.rawPatchVersion);
    }

    // Pertandingan tanpa patchVersionId tidak boleh berstatus VERIFIED (selaras CHECK constraint DB)
    const matchVerificationStatus =
      match.verificationStatus === "VERIFIED" && !matchedPatch
        ? "UNVERIFIED"
        : match.verificationStatus;

    sourceCount += match.sources.length;

    const playerBuilds = match.playerBuilds.map((build) => {
      playerBuildCount += 1;

      const heroLookup = lookupEntity(heroMap, build.heroSlug, build.rawHeroName);
      if (!heroLookup.entityId) {
        unmatchedHeroNames.add(build.rawHeroName);
      }

      const spellLookup = lookupEntity(
        spellMap,
        build.battleSpellSlug,
        build.rawBattleSpellName,
      );
      const emblemLookup = lookupEntity(
        emblemMap,
        build.emblemSlug,
        build.rawEmblemName,
      );

      const items = build.items
        .slice()
        .sort((a, b) => a.slotOrder - b.slotOrder)
        .map((item) => {
          const itemLookup = lookupEntity(
            itemMap,
            item.itemSlug,
            item.rawItemName,
          );

          if (itemLookup.entityId) {
            matchedItemCount += 1;
          } else if (itemLookup.ambiguous) {
            ambiguousItemCount += 1;
            unmatchedRawItemNames.add(item.rawItemName);
          } else {
            unmatchedItemCount += 1;
            unmatchedRawItemNames.add(item.rawItemName);
          }

          return buildProMatchItemRecord({
            slotOrder: item.slotOrder,
            rawItemName: item.rawItemName,
            itemEntityId: itemLookup.entityId,
            ambiguous: itemLookup.ambiguous,
            verified: Boolean(itemLookup.entityId && item.verified),
          });
        });

      const buildVerificationStatus =
        build.verificationStatus === "VERIFIED" && !heroLookup.entityId
          ? "UNVERIFIED"
          : build.verificationStatus;

      return {
        playerName: build.playerName,
        teamName: build.teamName,
        teamSide: build.teamSide,
        roleLane: build.roleLane ?? null,
        heroEntityId: heroLookup.entityId,
        rawHeroName: build.rawHeroName,
        battleSpellEntityId: spellLookup.entityId,
        rawBattleSpellName: build.rawBattleSpellName ?? null,
        emblemEntityId: emblemLookup.entityId,
        rawEmblemName: build.rawEmblemName ?? null,
        rawEmblemTalents: build.rawEmblemTalents,
        matchResult: build.matchResult,
        kills: build.kills ?? null,
        deaths: build.deaths ?? null,
        assists: build.assists ?? null,
        verificationStatus: buildVerificationStatus,
        items,
      };
    });

    return {
      tournamentName: match.tournamentName,
      stageName: match.stageName ?? null,
      matchCode: match.matchCode ?? null,
      gameNumber: match.gameNumber ?? null,
      teamAName: match.teamAName,
      teamBName: match.teamBName,
      winnerTeamName: match.winnerTeamName ?? null,
      matchDate: match.matchDate ?? null,
      playedAt: match.playedAt ?? null,
      patchVersionId: matchedPatch?.id ?? null,
      serverType: match.serverType,
      rawPatchVersion: match.rawPatchVersion ?? null,
      verificationStatus: matchVerificationStatus,
      sources: match.sources,
      playerBuilds,
    };
  });

  return {
    summary: {
      matchCount: matches.length,
      playerBuildCount,
      sourceCount,
      matchedItemCount,
      unmatchedItemCount,
      ambiguousItemCount,
      unmatchedHeroNames: [...unmatchedHeroNames],
      unmatchedPatchVersions: [...unmatchedPatchVersions],
      unmatchedRawItemNames: [...unmatchedRawItemNames],
    },
    matches,
  };
}
