import {
  MATCHUP_LANES,
  type MatchupLane,
} from "@/features/matchups/types/matchup-hub.types";
import { assignPicksToLanes } from "./draft-simulator-engine";
import type { DraftHeroEntry, DraftSide } from "../types/draft.types";
import type {
  DraftBuildItemSlot,
  DraftHeroBuildPlan,
  DraftSideBuildPlan,
  EnemyThreatProfile,
  HeroBuildArchetype,
  VerifiedItemMeta,
} from "../types/draft-build.types";

export interface HeroCoreTemplateInput {
  templateName: string;
  itemNames: string[];
}

const BOOT_SLUGS = new Set([
  "tough-boots",
  "warrior-boots",
  "arcane-boots",
  "magic-boots",
  "swift-boots",
  "demon-boots",
  "rapid-boots",
]);

function slugifyItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function classifyHeroArchetype(
  hero: DraftHeroEntry,
  assignedLane: MatchupLane,
): HeroBuildArchetype {
  const primaryRole = hero.roles[0] ?? "";
  const isMagic = hero.damageProfile === "Magic";

  if (primaryRole === "Tank") return "TANK_ROAM";
  if (primaryRole === "Support") return "SUPPORT_UTILITY";
  if (primaryRole === "Marksman") return "MARKSMAN";
  if (primaryRole === "Mage" || (primaryRole === "Assassin" && isMagic)) {
    return "MAGE_MAGIC";
  }
  if (primaryRole === "Assassin") return "PHYSICAL_ASSASSIN";
  if (assignedLane === "Roam") return "TANK_ROAM";
  if (assignedLane === "Mid Lane" && isMagic) return "MAGE_MAGIC";
  return "FIGHTER_BRUISER";
}

export function analyzeEnemyThreats(
  enemies: DraftHeroEntry[],
): EnemyThreatProfile {
  const magicThreats: string[] = [];
  const physicalBurstThreats: string[] = [];
  const basicAtkCritThreats: string[] = [];
  const sustainHealThreats: string[] = [];
  const hardCCThreats: string[] = [];
  const tankFrontlineThreats: string[] = [];

  for (const enemy of enemies) {
    const isTank = enemy.roles.includes("Tank");
    const isMarksman = enemy.roles.includes("Marksman");
    const isAssassin = enemy.roles.includes("Assassin");
    const isFighter = enemy.roles.includes("Fighter");
    const isSupport = enemy.roles.includes("Support");
    const isMage = enemy.roles.includes("Mage");

    if (
      enemy.damageProfile === "Magic" ||
      enemy.damageProfile === "Mixed" ||
      isMage
    ) {
      magicThreats.push(enemy.name);
    }

    if (
      enemy.damageProfile !== "Magic" &&
      (isAssassin || isFighter) &&
      !isTank
    ) {
      physicalBurstThreats.push(enemy.name);
    }

    if (isMarksman) {
      basicAtkCritThreats.push(enemy.name);
    }

    if (enemy.hasSustain || isSupport) {
      sustainHealThreats.push(enemy.name);
    }

    if (enemy.hasHardCC) {
      hardCCThreats.push(enemy.name);
    }

    if (isTank || enemy.hasFrontline) {
      tankFrontlineThreats.push(enemy.name);
    }
  }

  return {
    magicThreats,
    physicalBurstThreats,
    basicAtkCritThreats,
    sustainHealThreats,
    hardCCThreats,
    tankFrontlineThreats,
  };
}

interface CounterCandidate {
  itemSlug: string;
  priority: number;
  counterTag: string;
  targets: string[];
  reason: string;
}

function formatTargets(names: string[], max = 3): string {
  const list = names.slice(0, max);
  if (list.length === 0) return "tim lawan";
  if (list.length === 1) return list[0]!;
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  return `${list[0]}, ${list[1]}, ${list[2]}`;
}

function selectOptimalBoots(
  archetype: HeroBuildArchetype,
  currentBootSlug: string,
  threats: EnemyThreatProfile,
): {
  slug: string;
  isCounter: boolean;
  tag: string | null;
  targets: string[];
  reason: string;
} {
  const ccCount = threats.hardCCThreats.length;
  const magicCount = threats.magicThreats.length;
  const physCount =
    threats.physicalBurstThreats.length + threats.basicAtkCritThreats.length;

  // Prioritas tinggi: Tough Boots saat lawan banyak Hard CC (>= 2 untuk frontline/assassin/support, >= 3 untuk marksman/mage)
  const ccThreshold =
    archetype === "MAGE_MAGIC" || archetype === "MARKSMAN" ? 3 : 2;
  if (ccCount >= ccThreshold || (magicCount >= 3 && archetype !== "MAGE_MAGIC")) {
    const targets =
      ccCount > 0 ? threats.hardCCThreats.slice(0, 3) : threats.magicThreats.slice(0, 3);
    return {
      slug: "tough-boots",
      isCounter: true,
      tag: "Anti-CC & Magic",
      targets,
      reason: `Mengurangi durasi Crowd Control (30%) & Magic Damage dari ${formatTargets(targets)}.`,
    };
  }

  // Warrior Boots untuk frontline / fighter / bruiser / marksman defensif saat lawan dominan Physical
  if (
    physCount >= 3 &&
    (archetype === "TANK_ROAM" ||
      archetype === "FIGHTER_BRUISER" ||
      archetype === "SUPPORT_UTILITY" ||
      (archetype === "MARKSMAN" && magicCount <= 1))
  ) {
    const targets = [
      ...threats.basicAtkCritThreats,
      ...threats.physicalBurstThreats,
    ].slice(0, 3);
    return {
      slug: "warrior-boots",
      isCounter: true,
      tag: "Anti-Physical",
      targets,
      reason: `Menahan Physical Damage berkelanjutan dari ${formatTargets(targets)}.`,
    };
  }

  // Jika lawan punya 2 Magic & hero bukan Mage/MM
  if (
    magicCount >= 2 &&
    (archetype === "TANK_ROAM" || archetype === "FIGHTER_BRUISER")
  ) {
    const targets = threats.magicThreats.slice(0, 3);
    return {
      slug: "tough-boots",
      isCounter: true,
      tag: "Anti-Magic",
      targets,
      reason: `Tambahan Magic Defense & ketahanan CC melawan ${formatTargets(targets)}.`,
    };
  }

  return {
    slug: BOOT_SLUGS.has(currentBootSlug) ? currentBootSlug : "tough-boots",
    isCounter: false,
    tag: null,
    targets: [],
    reason: "Sepatu inti bawaan yang optimal untuk mobilitas & tempo hero ini.",
  };
}

function buildCounterCandidatesForArchetype(
  archetype: HeroBuildArchetype,
  threats: EnemyThreatProfile,
): CounterCandidate[] {
  const candidates: CounterCandidate[] = [];

  const sustainCount = threats.sustainHealThreats.length;
  const magicCount = threats.magicThreats.length;
  const physBurstCount = threats.physicalBurstThreats.length;
  const critCount = threats.basicAtkCritThreats.length;
  const tankCount = threats.tankFrontlineThreats.length;
  const ccCount = threats.hardCCThreats.length;

  // 1. ANTI-HEAL / LIFEBANE & ANTI-ATTACK SPEED
  if (sustainCount >= 1 || (critCount >= 1 && (archetype === "TANK_ROAM" || archetype === "SUPPORT_UTILITY"))) {
    const targets =
      sustainCount > 0
        ? threats.sustainHealThreats.slice(0, 3)
        : threats.basicAtkCritThreats.slice(0, 2);
    if (archetype === "TANK_ROAM" || archetype === "SUPPORT_UTILITY") {
      candidates.push({
        itemSlug: "dominance-ice",
        priority: sustainCount >= 2 ? 96 : 92,
        counterTag: "Anti-Heal & ASPD",
        targets: [...new Set([...threats.sustainHealThreats, ...threats.basicAtkCritThreats])].slice(0, 3),
        reason: `Memotong efek Heal/Shield & Attack Speed milik ${formatTargets([...new Set([...threats.sustainHealThreats, ...threats.basicAtkCritThreats])])}.`,
      });
    } else if (archetype === "MAGE_MAGIC" && sustainCount >= 1) {
      candidates.push({
        itemSlug: "glowing-wand",
        priority: sustainCount >= 2 ? 95 : 88,
        counterTag: "Anti-Heal Magic",
        targets,
        reason: `Efek Lifebane memangkas regenerasi HP/Shield ${formatTargets(targets)} sekaligus burn Max HP.`,
      });
    } else if (sustainCount >= 2 || (sustainCount >= 1 && tankCount >= 2)) {
      // Marksman, Physical Assassin, Fighter Bruiser
      candidates.push({
        itemSlug: "sea-halberd",
        priority: 93,
        counterTag: "Anti-Heal Phys",
        targets,
        reason: `Efek Lifebane memotong regenerasi HP/Shield ${formatTargets(targets)} + bonus damage ke HP lebih tinggi.`,
      });
    }
  }

  // 2. ANTI-TANK / ARMOR & MAGIC PENETRATION / HP SHRED
  if (tankCount >= 2) {
    const targets = threats.tankFrontlineThreats.slice(0, 3);
    if (archetype === "MARKSMAN") {
      candidates.push({
        itemSlug: "demon-hunter-sword",
        priority: 88,
        counterTag: "Penghancur HP",
        targets,
        reason: `Serangan berbasis % HP saat ini sangat efektif menembus frontline tebal ${formatTargets(targets)}.`,
      });
      candidates.push({
        itemSlug: "malefic-gun",
        priority: 85,
        counterTag: "Armor Penetration",
        targets,
        reason: `Physical Penetration & tambahan jangkauan serang untuk menembus armor ${formatTargets(targets)}.`,
      });
    } else if (archetype === "PHYSICAL_ASSASSIN" || archetype === "FIGHTER_BRUISER") {
      candidates.push({
        itemSlug: "malefic-roar",
        priority: 88,
        counterTag: "Armor Penetration",
        targets,
        reason: `Menembus Physical Defense tinggi milik frontline ${formatTargets(targets)}.`,
      });
    } else if (archetype === "MAGE_MAGIC") {
      candidates.push({
        itemSlug: "divine-glaive",
        priority: 89,
        counterTag: "Magic Penetration",
        targets,
        reason: `Magic Penetration tinggi untuk melumerkan Magic Defense ${formatTargets(targets)}.`,
      });
      candidates.push({
        itemSlug: "wishing-lantern",
        priority: 84,
        counterTag: "Anti-HP Tebal",
        targets,
        reason: `Memicu damage tambahan berbasis % HP saat ini melawan ${formatTargets(targets)}.`,
      });
    }
  }

  // 3. ANTI-MAGIC DEFENSE
  if (magicCount >= 2) {
    const targets = threats.magicThreats.slice(0, 3);
    if (archetype === "TANK_ROAM" || archetype === "FIGHTER_BRUISER" || archetype === "SUPPORT_UTILITY") {
      candidates.push({
        itemSlug: magicCount >= 3 ? "radiant-armor" : "athenas-shield",
        priority: 90,
        counterTag: "Anti-Magic Burst",
        targets,
        reason:
          magicCount >= 3
            ? `Stack Magic Damage Reduction menahan gempuran Magic berlapis dari ${formatTargets(targets)}.`
            : `Perisai pengurang Magic Burst efektif meredam kombo ${formatTargets(targets)}.`,
      });
    } else if (archetype === "PHYSICAL_ASSASSIN" || archetype === "MARKSMAN") {
      candidates.push({
        itemSlug: "rose-gold-meteor",
        priority: 82,
        counterTag: "Shield Anti-Magic",
        targets,
        reason: `Memberikan Shield darurat + Magic Defense agar selamat dari burst ${formatTargets(targets)}.`,
      });
    }
  } else if (magicCount === 1 && archetype === "TANK_ROAM") {
    const targets = threats.magicThreats.slice(0, 2);
    candidates.push({
      itemSlug: "athenas-shield",
      priority: 76,
      counterTag: "Anti-Magic",
      targets,
      reason: `Melindungi frontline dari ledakan Magic Damage milik ${formatTargets(targets)}.`,
    });
  }

  // 4. ANTI-PHYSICAL BURST & ANTI-CRIT / MARKSMAN
  if (critCount >= 1 && (archetype === "TANK_ROAM" || archetype === "FIGHTER_BRUISER")) {
    const targets = threats.basicAtkCritThreats.slice(0, 2);
    candidates.push({
      itemSlug: "blade-armor",
      priority: critCount >= 2 ? 91 : 80,
      counterTag: "Anti-Marksman/Crit",
      targets,
      reason: `Mengurangi Critical Damage & memantulkan serangan Basic Attack ${formatTargets(targets)}.`,
    });
  }

  if (physBurstCount >= 2) {
    const targets = threats.physicalBurstThreats.slice(0, 3);
    if (archetype === "TANK_ROAM" || archetype === "FIGHTER_BRUISER" || archetype === "SUPPORT_UTILITY") {
      candidates.push({
        itemSlug: "antique-cuirass",
        priority: 89,
        counterTag: "Anti-Skill Physical",
        targets,
        reason: `Menurunkan Physical Attack lawan setiap terkena skill dari ${formatTargets(targets)}.`,
      });
    } else if (archetype === "MARKSMAN") {
      candidates.push({
        itemSlug: "wind-of-nature",
        priority: 91,
        counterTag: "Kebal Physical",
        targets,
        reason: `Aktifkan kebal Physical Damage 2 detik saat diincar dive ${formatTargets(targets)}.`,
      });
    } else if (archetype === "MAGE_MAGIC") {
      candidates.push({
        itemSlug: "winter-crown",
        priority: 86,
        counterTag: "Aktif Freeze Anti-Dive",
        targets,
        reason: `Efek beku kebal segala damage & CC saat dikeroyok oleh ${formatTargets(targets)}.`,
      });
    }
  }

  // 5. ANTI-LOCK / LATE-GAME INSURANCE (Winter Crown / Immortality)
  if (ccCount >= 3 && (archetype === "MAGE_MAGIC" || archetype === "PHYSICAL_ASSASSIN")) {
    const targets = threats.hardCCThreats.slice(0, 3);
    candidates.push({
      itemSlug: "winter-crown",
      priority: 81,
      counterTag: "Hindari Lock CC",
      targets,
      reason: `Membeli waktu dan menghindari kombo CC beruntun dari ${formatTargets(targets)}.`,
    });
  }

  if (
    archetype === "TANK_ROAM" ||
    archetype === "FIGHTER_BRUISER" ||
    archetype === "SUPPORT_UTILITY"
  ) {
    candidates.push({
      itemSlug: "immortality",
      priority: 72,
      counterTag: "Nyawa Kedua Teamfight",
      targets: threats.physicalBurstThreats.slice(0, 2),
      reason:
        "Memberikan kebangkitan kedua saat inisiasi teamfight late-game agar tetap unggul posisi.",
    });
  }

  // Deduplikasi berdasarkan itemSlug (pertahankan prioritas tertinggi)
  const bestBySlug = new Map<string, CounterCandidate>();
  for (const c of candidates) {
    const existing = bestBySlug.get(c.itemSlug);
    if (!existing || c.priority > existing.priority) {
      bestBySlug.set(c.itemSlug, c);
    }
  }

  return Array.from(bestBySlug.values()).sort((a, b) => b.priority - a.priority);
}

function getFallbackTemplateByArchetype(
  archetype: HeroBuildArchetype,
): HeroCoreTemplateInput {
  switch (archetype) {
    case "TANK_ROAM":
      return {
        templateName: "Standar Roam Tank",
        itemNames: [
          "Tough Boots",
          "Dominance Ice",
          "Antique Cuirass",
          "Athena's Shield",
          "Blade Armor",
          "Immortality",
        ],
      };
    case "SUPPORT_UTILITY":
      return {
        templateName: "Standar Roam Support",
        itemNames: [
          "Tough Boots",
          "Flask of the Oasis",
          "Dominance Ice",
          "Oracle",
          "Athena's Shield",
          "Immortality",
        ],
      };
    case "MAGE_MAGIC":
      return {
        templateName: "Standar Magic Burst",
        itemNames: [
          "Arcane Boots",
          "Genius Wand",
          "Glowing Wand",
          "Holy Crystal",
          "Divine Glaive",
          "Blood Wings",
        ],
      };
    case "MARKSMAN":
      return {
        templateName: "Standar Gold Lane DPS",
        itemNames: [
          "Swift Boots",
          "Corrosion Scythe",
          "Demon Hunter Sword",
          "Golden Staff",
          "Malefic Gun",
          "Wind of Nature",
        ],
      };
    case "PHYSICAL_ASSASSIN":
      return {
        templateName: "Standar Jungle Burst",
        itemNames: [
          "Tough Boots",
          "Hunter Strike",
          "Blade of the Heptaseas",
          "Malefic Roar",
          "Blade of Despair",
          "Rose Gold Meteor",
        ],
      };
    default:
      return {
        templateName: "Standar EXP Fighter",
        itemNames: [
          "Tough Boots",
          "War Axe",
          "Brute Force Breastplate",
          "Queen's Wings",
          "Dominance Ice",
          "Immortality",
        ],
      };
  }
}

function resolveItem(
  slugOrName: string,
  itemBySlug: Map<string, VerifiedItemMeta>,
): VerifiedItemMeta | null {
  const slug = slugifyItemName(slugOrName);
  return itemBySlug.get(slug) ?? null;
}

/**
 * Menghasilkan rekomendasi 6 item adaptif terbaik untuk satu hero melawan 5 hero musuh.
 * - Mempertahankan 2–3 item core bawaan hero dari template terverifikasi.
 * - Menyesuaikan Sepatu (Slot 1) dan hingga 2–3 slot akhir dengan item counter khusus musuh.
 * - Item core yang kebetulan sudah merupakan counter efektif musuh juga ditandai COUNTER + alasan targetnya!
 */
export function buildAdaptiveHeroItems(params: {
  hero: DraftHeroEntry;
  assignedLane: MatchupLane;
  enemies: DraftHeroEntry[];
  coreTemplate: HeroCoreTemplateInput | null;
  itemBySlug: Map<string, VerifiedItemMeta>;
}): DraftHeroBuildPlan {
  const { hero, assignedLane, enemies, coreTemplate, itemBySlug } = params;
  const archetype = classifyHeroArchetype(hero, assignedLane);
  const threats = analyzeEnemyThreats(enemies);

  const fallback = getFallbackTemplateByArchetype(archetype);
  const template =
    coreTemplate && coreTemplate.itemNames.length >= 6 ? coreTemplate : fallback;

  // Resolusi 6 item dasar dari template
  const baseMetas: VerifiedItemMeta[] = [];
  const usedBase = new Set<string>();
  for (const rawName of [...template.itemNames, ...fallback.itemNames]) {
    if (baseMetas.length >= 6) break;
    const meta = resolveItem(rawName, itemBySlug);
    if (meta && !usedBase.has(meta.slug)) {
      usedBase.add(meta.slug);
      baseMetas.push(meta);
    }
  }

  // Bangun 6 slot awal
  const slots: DraftBuildItemSlot[] = baseMetas.slice(0, 6).map((meta, idx) => ({
    position: idx + 1,
    slug: meta.slug,
    name: meta.name,
    category: meta.category,
    iconUrl: meta.iconUrl,
    slotRole: "CORE",
    isSwapped: false,
    replacedItemName: null,
    counterTag: null,
    counterTargets: [],
    reason: `Item inti bawaan ${hero.name} (${template.templateName}).`,
  }));

  // 1. Adaptasi Slot 1 (Sepatu) bila slot 0 adalah Movement
  const firstSlot = slots[0];
  if (firstSlot && BOOT_SLUGS.has(firstSlot.slug)) {
    const bootChoice = selectOptimalBoots(archetype, firstSlot.slug, threats);
    const bootMeta = itemBySlug.get(bootChoice.slug);
    if (bootMeta) {
      const changed = bootMeta.slug !== firstSlot.slug;
      slots[0] = {
        position: 1,
        slug: bootMeta.slug,
        name: bootMeta.name,
        category: bootMeta.category,
        iconUrl: bootMeta.iconUrl,
        slotRole: bootChoice.isCounter ? "COUNTER" : "CORE",
        isSwapped: changed,
        replacedItemName: changed ? firstSlot.name : null,
        counterTag: bootChoice.tag,
        counterTargets: bootChoice.targets,
        reason: bootChoice.reason,
      };
    }
  }

  // 2. Terapkan kandidat Counter Item untuk slot non-sepatu (Slot 2..6)
  const counterCandidates = buildCounterCandidatesForArchetype(
    archetype,
    threats,
  ).filter((c) => itemBySlug.has(c.itemSlug));

  // Maksimal berapa slot non-sepatu yang boleh diganti agar identitas core hero tetap utuh
  const maxSwaps =
    archetype === "TANK_ROAM" || archetype === "SUPPORT_UTILITY" ? 3 : 2;
  // Slot fleksibel yang aman diganti (dari belakang ke depan: indeks 5, 4, lalu 3 untuk Tank/Support)
  const swappableIndices =
    archetype === "TANK_ROAM" || archetype === "SUPPORT_UTILITY"
      ? [5, 4, 3]
      : [5, 4];

  let swapsUsed = 0;
  const lockedCounterIndices = new Set<number>([0]); // Slot 0 sudah ditangani sebagai sepatu

  for (const candidate of counterCandidates) {
    const existingIdx = slots.findIndex((s) => s.slug === candidate.itemSlug);

    if (existingIdx !== -1) {
      // Sudah ada di build dasar — tandai sebagai COUNTER efektif melawan musuh!
      const curr = slots[existingIdx]!;
      slots[existingIdx] = {
        ...curr,
        slotRole: "COUNTER",
        counterTag: candidate.counterTag,
        counterTargets: candidate.targets,
        reason: candidate.reason,
      };
      lockedCounterIndices.add(existingIdx);
      continue;
    }

    if (swapsUsed >= maxSwaps) continue;

    // Cari slot fleksibel yang belum terkunci oleh counter lain
    const targetIdx = swappableIndices.find(
      (idx) => idx < slots.length && !lockedCounterIndices.has(idx),
    );
    if (targetIdx === undefined) continue;

    const candidateMeta = itemBySlug.get(candidate.itemSlug);
    const oldSlot = slots[targetIdx];
    if (!candidateMeta || !oldSlot) continue;

    slots[targetIdx] = {
      position: targetIdx + 1,
      slug: candidateMeta.slug,
      name: candidateMeta.name,
      category: candidateMeta.category,
      iconUrl: candidateMeta.iconUrl,
      slotRole: "COUNTER",
      isSwapped: true,
      replacedItemName: oldSlot.name,
      counterTag: candidate.counterTag,
      counterTargets: candidate.targets,
      reason: candidate.reason,
    };
    lockedCounterIndices.add(targetIdx);
    swapsUsed += 1;
  }

  const counterHighlights = slots
    .filter((s) => s.slotRole === "COUNTER")
    .map((s) => `${s.name}: ${s.reason}`);

  const workbenchUrl = `/builds/${hero.slug}?items=${encodeURIComponent(
    slots.map((s) => s.slug).join(","),
  )}`;

  return {
    heroSlug: hero.slug,
    heroName: hero.name,
    assignedLane,
    roles: hero.roles,
    archetype,
    baseTemplateName: template.templateName,
    items: slots,
    counterHighlights,
    workbenchUrl,
  };
}

export function buildSidePostDraftPlan(params: {
  side: DraftSide;
  allies: DraftHeroEntry[];
  enemies: DraftHeroEntry[];
  templateByHeroSlug: Map<string, HeroCoreTemplateInput>;
  itemBySlug: Map<string, VerifiedItemMeta>;
}): DraftSideBuildPlan {
  const { side, allies, enemies, templateByHeroSlug, itemBySlug } = params;
  const laneMap = assignPicksToLanes(allies);
  const enemyThreatProfile = analyzeEnemyThreats(enemies);

  const orderedPairs: Array<{ lane: MatchupLane; hero: DraftHeroEntry }> = [];
  const seen = new Set<string>();

  for (const lane of MATCHUP_LANES) {
    const hero = laneMap[lane];
    if (hero && !seen.has(hero.slug)) {
      orderedPairs.push({ lane, hero });
      seen.add(hero.slug);
    }
  }
  for (const hero of allies) {
    if (!seen.has(hero.slug)) {
      orderedPairs.push({ lane: hero.lanes[0] ?? "EXP Lane", hero });
      seen.add(hero.slug);
    }
  }

  const heroes = orderedPairs.map(({ lane, hero }) =>
    buildAdaptiveHeroItems({
      hero,
      assignedLane: lane,
      enemies,
      coreTemplate: templateByHeroSlug.get(hero.slug) ?? null,
      itemBySlug,
    }),
  );

  return {
    side,
    enemyThreatProfile,
    heroes,
  };
}
