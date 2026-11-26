import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import {
  extractHeroMechanics,
  type GameplayCandidateHero,
} from "./mechanic-extractor";
import {
  extractMechanicEvidence,
  type SkillMechanicEvidence,
  type SpecificMechanic,
} from "./mechanic-evidence-extractor";
import { findInteractionCandidates } from "./interaction-rules";
import { aggregateMatchups } from "./matchup-aggregator";
import { analyzeHeroMatchup } from "./matchup-intelligence";
import { analyzeCounterAgainstHero } from "@/features/counters/engine/counter-engine";
import {
  MATCHUP_LANES,
  type DamageProfileTag,
  type HeroMechanicProfileSummary,
  type LaneMatchupSummary,
  type MatchupLane,
  type MatchupPhaseChecklistItem,
  type MechanicDimensionKey,
  type TeamCompositionAudit,
  type TeamCompositionPillar,
  type TeamEnemyThreatSummary,
  type TeamSlotInput,
  type TeamSlotSuggestion,
} from "../types/matchup-hub.types";

const HARD_CC_MECHANICS: readonly SpecificMechanic[] = [
  "APPLY_STUN",
  "APPLY_IMMOBILIZE",
  "APPLY_AIRBORNE",
  "APPLY_KNOCKBACK",
];

const MOBILITY_MECHANICS: readonly SpecificMechanic[] = ["DASH", "BLINK"];

const DEFENSE_MECHANICS: readonly SpecificMechanic[] = [
  "SHIELD",
  "DAMAGE_REDUCTION",
  "INVULNERABLE",
];

const IMMUNITY_MECHANICS: readonly SpecificMechanic[] = [
  "CONTROL_IMMUNITY",
  "CC_REMOVAL",
  "UNTARGETABLE",
];

const THREAT_LABELS: Partial<Record<SpecificMechanic, string>> = {
  APPLY_STUN: "Stun / Hard CC",
  APPLY_AIRBORNE: "Airborne / Knock-up",
  APPLY_IMMOBILIZE: "Immobilize / Root",
  APPLY_KNOCKBACK: "Knockback / Displacement",
  APPLY_SLOW: "Slow Berkelanjutan",
  HEALING: "Heal / Regenerasi Tinggi",
  SHIELD: "Shield Tebal",
  DASH: "Mobilitas Dash",
  BLINK: "Mobilitas Blink",
  CONTROL_IMMUNITY: "Control Immunity",
  TRUE_DAMAGE: "True Damage",
  MAGIC_DAMAGE: "Magic Damage",
  PHYSICAL_DAMAGE: "Physical Damage",
};

export function toHeroSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyDimensionCounts(): Record<MechanicDimensionKey, number> {
  return {
    DAMAGE: 0,
    CROWD_CONTROL: 0,
    MOBILITY: 0,
    DEFENSE: 0,
    SUSTAIN: 0,
    BUFF_DEBUFF: 0,
    UTILITY: 0,
    SPECIAL: 0,
  };
}

function classifyDamageProfile(
  physical: number,
  magic: number,
  trueDamage: number,
): DamageProfileTag {
  if (physical === 0 && magic === 0 && trueDamage === 0) {
    return "Belum Terpetakan";
  }
  if (trueDamage > 0 && physical === 0 && magic === 0) {
    return "True";
  }
  if (physical > 0 && magic > 0) {
    return "Mixed";
  }
  if (magic > 0) {
    return "Magic";
  }
  if (physical > 0) {
    return "Physical";
  }
  return "True";
}

export function buildHeroMechanicProfile(
  hero: GameplayCandidateHero,
): HeroMechanicProfileSummary {
  const slug = toHeroSlug(hero.heroName);
  const roles = HERO_ROLE_MAP[slug] ?? [];
  const lanes = HERO_LANE_MAP[slug] ?? [];

  const extracted = extractHeroMechanics([hero]);
  const dimensionCounts = createEmptyDimensionCounts();
  const specificSet = new Set<SpecificMechanic>();

  let physical = 0;
  let magic = 0;
  let trueDamage = 0;
  let hardControlCount = 0;
  let slowCount = 0;
  let mobilityEvidenceCount = 0;
  let sustainEvidenceCount = 0;
  let defenseEvidenceCount = 0;
  let immunityEvidenceCount = 0;

  for (const record of extracted) {
    for (const category of record.mechanicCategories) {
      if (category in dimensionCounts) {
        dimensionCounts[category as MechanicDimensionKey] += 1;
      }
    }

    const evidences = extractMechanicEvidence(record.description);
    const skillMechs = new Set(evidences.map((e) => e.mechanic));

    for (const mech of skillMechs) {
      specificSet.add(mech);
    }

    if (skillMechs.has("PHYSICAL_DAMAGE")) physical += 1;
    if (skillMechs.has("MAGIC_DAMAGE")) magic += 1;
    if (skillMechs.has("TRUE_DAMAGE")) trueDamage += 1;
    if (HARD_CC_MECHANICS.some((m) => skillMechs.has(m))) hardControlCount += 1;
    if (skillMechs.has("APPLY_SLOW")) slowCount += 1;
    if (MOBILITY_MECHANICS.some((m) => skillMechs.has(m))) {
      mobilityEvidenceCount += 1;
    }
    if (skillMechs.has("HEALING")) sustainEvidenceCount += 1;
    if (DEFENSE_MECHANICS.some((m) => skillMechs.has(m))) {
      defenseEvidenceCount += 1;
    }
    if (IMMUNITY_MECHANICS.some((m) => skillMechs.has(m))) {
      immunityEvidenceCount += 1;
    }
  }

  return {
    heroName: hero.heroName,
    heroSlug: slug,
    roles,
    lanes,
    skillCount: extracted.length,
    damageProfile: classifyDamageProfile(physical, magic, trueDamage),
    damageSources: {
      physical,
      magic,
      trueDamage,
    },
    dimensionCounts,
    hardControlCount,
    slowCount,
    mobilityEvidenceCount,
    sustainEvidenceCount,
    defenseEvidenceCount,
    immunityEvidenceCount,
    specificMechanics: [...specificSet],
    verificationStatus: "UNVERIFIED",
  };
}

export function buildDynamicPhaseChecklists(
  profileA: HeroMechanicProfileSummary,
  profileB: HeroMechanicProfileSummary,
  sharedLanes: string[],
): MatchupPhaseChecklistItem[] {
  const sameLaneNote =
    sharedLanes.length > 0
      ? `Keduanya berbagi lane utama (${sharedLanes.join(", ")}), sehingga trade level 1–4 langsung menentukan prioritas wave.`
      : `Lane utama berbeda (${profileA.lanes[0] ?? "fleksibel"} vs ${profileB.lanes[0] ?? "fleksibel"}), interaksi lebih sering terjadi saat rotasi Turtle atau gank.`;

  const earlyA =
    profileB.hardControlCount > 0
      ? `Waspadai ${profileB.hardControlCount} skill Hard CC milik ${profileB.heroName}; simpan skill mobilitas atau jaga posisi di balik minion.`
      : profileB.mobilityEvidenceCount > 0
        ? `Perhatikan mobilitas ${profileB.heroName} (${profileB.mobilityEvidenceCount} skill dash/blink) agar skill utama tidak meleset.`
        : `Manfaatkan manajemen wave untuk menekan ruang gerak ${profileB.heroName} sebelum level 4.`;

  const earlyB =
    profileA.hardControlCount > 0
      ? `Waspadai ${profileA.hardControlCount} skill Hard CC milik ${profileA.heroName}; hindari overextend tanpa informasi posisi musuh.`
      : profileA.mobilityEvidenceCount > 0
        ? `Pantau celah cooldown mobilitas ${profileA.heroName} (${profileA.mobilityEvidenceCount} skill dash/blink) sebelum melakukan trade panjang.`
        : `Jaga tempo clear wave dan hindari mengambil poke gratis di area sungai.`;

  const midA =
    profileB.sustainEvidenceCount > 0 || profileB.defenseEvidenceCount > 0
      ? `Pertimbangkan item anti-sustain atau penetrasi lebih awal karena ${profileB.heroName} terdeteksi memiliki mekanik heal/shield/defense.`
      : `Fokus pada rotasi objektif Turtle dan siapkan item defensif sesuai tipe damage ${profileB.heroName} (${profileB.damageProfile}).`;

  const midB =
    profileA.sustainEvidenceCount > 0 || profileA.defenseEvidenceCount > 0
      ? `Siapkan respons anti-sustain atau penetrasi lebih awal menghadapi potensi defense/heal ${profileA.heroName}.`
      : `Koordinasikan kontes objektif dan sesuaikan item defensif terhadap tipe damage ${profileA.heroName} (${profileA.damageProfile}).`;

  const lateA =
    profileB.immunityEvidenceCount > 0
      ? `Jangan buka seluruh CC ke ${profileB.heroName} sekaligus karena terdeteksi mekanik immunity/untargetable; pancing keluar lebih dulu.`
      : `Posisikan diri sesuai peran (${profileA.roles.join("/") || "peran tim"}) dan eksekusi target prioritas setelah skill kunci ${profileB.heroName} keluar.`;

  const lateB =
    profileA.immunityEvidenceCount > 0
      ? `Pancing mekanik immunity/untargetable ${profileA.heroName} sebelum menginvestasikan Ultimate atau rantai CC tim.`
      : `Jaga jarak inisiasi tim dan lindungi sumber damage utama dari potensi serangan ${profileA.heroName}.`;

  return [
    {
      phase: "early",
      title: `Early Game (Lv 1–4) · ${sameLaneNote}`,
      focusForA: earlyA,
      focusForB: earlyB,
      basis: "STRATEGIC_INTERPRETATION",
    },
    {
      phase: "mid",
      title: "Mid Game (Rotasi & Power Spike Item Pertama)",
      focusForA: midA,
      focusForB: midB,
      basis: "MECHANIC_EVIDENCE",
    },
    {
      phase: "late",
      title: "Late Game (Teamfight Lord & Eksekusi Cooldown Kunci)",
      focusForA: lateA,
      focusForB: lateB,
      basis: "STRATEGIC_INTERPRETATION",
    },
  ];
}

export function auditTeamComposition(
  side: "ALLY" | "ENEMY",
  profiles: HeroMechanicProfileSummary[],
): TeamCompositionAudit {
  const frontlineHeroes = profiles.filter(
    (p) =>
      p.roles.includes("Tank") ||
      p.roles.includes("Fighter") ||
      p.defenseEvidenceCount >= 2,
  );
  const hardCcHeroes = profiles.filter((p) => p.hardControlCount > 0);
  const mobilityHeroes = profiles.filter(
    (p) => p.mobilityEvidenceCount > 0 || p.dimensionCounts.MOBILITY > 0,
  );
  const sustainHeroes = profiles.filter(
    (p) => p.sustainEvidenceCount > 0 || p.dimensionCounts.SUSTAIN > 0,
  );
  const immunityHeroes = profiles.filter((p) => p.immunityEvidenceCount > 0);

  const physicalHeroes = profiles.filter(
    (p) => p.damageSources.physical > 0,
  ).length;
  const magicHeroes = profiles.filter((p) => p.damageSources.magic > 0).length;
  const trueDamageHeroes = profiles.filter(
    (p) => p.damageSources.trueDamage > 0,
  ).length;

  let balanceNote = "Pilih minimal 2 hero untuk melihat keseimbangan tipe damage.";
  let damageBalanceStatus: TeamCompositionPillar["status"] = "MISSING";

  if (profiles.length >= 2) {
    if (physicalHeroes > 0 && magicHeroes > 0) {
      balanceNote = `Campuran Physical (${physicalHeroes}) & Magic (${magicHeroes})${trueDamageHeroes > 0 ? ` + True (${trueDamageHeroes})` : ""} mempersulit itemisasi defensif lawan.`;
      damageBalanceStatus =
        physicalHeroes >= 1 && magicHeroes >= 1 ? "STRONG" : "ADEQUATE";
    } else if (physicalHeroes > 0 && magicHeroes === 0) {
      balanceNote =
        "Dominan Physical Damage tanpa sumber Magic — rawan ditahan oleh Physical Defense (Antique Cuirass / Dominance Ice / Blade Armor).";
      damageBalanceStatus = "MISSING";
    } else if (magicHeroes > 0 && physicalHeroes === 0) {
      balanceNote =
        "Dominan Magic Damage tanpa sumber Physical — rawan ditahan oleh Magic Defense (Athena's Shield / Radiant Armor).";
      damageBalanceStatus = "MISSING";
    } else {
      balanceNote = "Sumber damage belum terpetakan dari deskripsi skill kandidat.";
      damageBalanceStatus = "ADEQUATE";
    }
  }

  const pillars: TeamCompositionPillar[] = [
    {
      id: "FRONTLINE",
      label: "Frontline & Durabilitas",
      status:
        frontlineHeroes.length >= 2
          ? "STRONG"
          : frontlineHeroes.length === 1
            ? "ADEQUATE"
            : "MISSING",
      count: frontlineHeroes.length,
      contributors: frontlineHeroes.map((h) => h.heroName),
      summary:
        frontlineHeroes.length >= 2
          ? "Ada minimal 2 hero berkapasitas badan depan / pertahanan."
          : frontlineHeroes.length === 1
            ? "Hanya 1 frontline — backline rentan jika ia tumbang lebih dulu."
            : "Belum ada Tank/Fighter atau mekanik defense memadai.",
    },
    {
      id: "HARD_CC",
      label: "Hard Crowd Control",
      status:
        hardCcHeroes.length >= 2
          ? "STRONG"
          : hardCcHeroes.length === 1
            ? "ADEQUATE"
            : "MISSING",
      count: hardCcHeroes.length,
      contributors: hardCcHeroes.map((h) => h.heroName),
      summary:
        hardCcHeroes.length >= 2
          ? "Memiliki beberapa sumber Stun/Airborne/Immobilize/Knockback untuk mengunci target."
          : hardCcHeroes.length === 1
            ? "Hanya 1 sumber Hard CC — agak sulit menghentikan banyak hero lincah."
            : "Belum ada bukti skill Hard CC pada susunan tim saat ini.",
    },
    {
      id: "MOBILITY_ENGAGE",
      label: "Mobilitas & Akses Backline",
      status:
        mobilityHeroes.length >= 2
          ? "STRONG"
          : mobilityHeroes.length === 1
            ? "ADEQUATE"
            : "MISSING",
      count: mobilityHeroes.length,
      contributors: mobilityHeroes.map((h) => h.heroName),
      summary:
        mobilityHeroes.length >= 2
          ? "Mobilitas tim baik untuk rotasi cepat, flanking, dan chase."
          : mobilityHeroes.length === 1
            ? "Mobilitas terbatas pada 1 hero."
            : "Minim dash/blink — rawan di-kite lawan berjarak jauh.",
    },
    {
      id: "SUSTAIN",
      label: "Sustain & Teamfight Panjang",
      status:
        sustainHeroes.length >= 2
          ? "STRONG"
          : sustainHeroes.length === 1
            ? "ADEQUATE"
            : "MISSING",
      count: sustainHeroes.length,
      contributors: sustainHeroes.map((h) => h.heroName),
      summary:
        sustainHeroes.length >= 2
          ? "Kuat dalam skenario skirmish panjang berkat beberapa sumber sustain."
          : sustainHeroes.length === 1
            ? "Sustain bertumpu pada 1 hero."
            : "Minim sustain — lebih mengandalkan burst pendek.",
    },
    {
      id: "IMMUNITY_PEEL",
      label: "CC Immunity & Anti-Pickoff",
      status:
        immunityHeroes.length >= 2
          ? "STRONG"
          : immunityHeroes.length === 1
            ? "ADEQUATE"
            : "MISSING",
      count: immunityHeroes.length,
      contributors: immunityHeroes.map((h) => h.heroName),
      summary:
        immunityHeroes.length >= 1
          ? "Terdapat mekanik Control Immunity / Remove CC / Untargetable."
          : "Belum ada mekanik immunity bawaan — tim perlu lebih disiplin terhadap CC lawan.",
    },
    {
      id: "DAMAGE_BALANCE",
      label: "Keseimbangan Tipe Damage",
      status: damageBalanceStatus,
      count: physicalHeroes + magicHeroes + trueDamageHeroes,
      contributors: profiles
        .filter((p) => p.damageProfile !== "Belum Terpetakan")
        .map((p) => `${p.heroName} (${p.damageProfile})`),
      summary: balanceNote,
    },
  ];

  const warnings: string[] = [];
  if (profiles.length >= 3) {
    for (const pillar of pillars) {
      if (pillar.status === "MISSING") {
        warnings.push(`${pillar.label}: ${pillar.summary}`);
      }
    }
  }

  return {
    side,
    filledSlots: profiles.length,
    heroes: profiles,
    damageMix: {
      physicalHeroes,
      magicHeroes,
      trueDamageHeroes,
      balanceNote,
    },
    pillars,
    totals: {
      hardControl: profiles.reduce((acc, p) => acc + p.hardControlCount, 0),
      mobility: profiles.reduce((acc, p) => acc + p.mobilityEvidenceCount, 0),
      defense: profiles.reduce((acc, p) => acc + p.defenseEvidenceCount, 0),
      sustain: profiles.reduce((acc, p) => acc + p.sustainEvidenceCount, 0),
      immunity: profiles.reduce((acc, p) => acc + p.immunityEvidenceCount, 0),
      damageSkills: profiles.reduce(
        (acc, p) => acc + p.dimensionCounts.DAMAGE,
        0,
      ),
    },
    warnings,
  };
}

export function buildLaneMatchupSummaries(
  allySlots: TeamSlotInput[],
  enemySlots: TeamSlotInput[],
  heroByName: Map<string, GameplayCandidateHero>,
  profileByName: Map<string, HeroMechanicProfileSummary>,
): LaneMatchupSummary[] {
  return MATCHUP_LANES.map((lane) => {
    const allyName =
      allySlots.find((s) => s.lane === lane)?.heroName?.trim() ?? null;
    const enemyName =
      enemySlots.find((s) => s.lane === lane)?.heroName?.trim() ?? null;

    const allyCandidate = allyName
      ? heroByName.get(allyName.toLowerCase()) ?? null
      : null;
    const enemyCandidate = enemyName
      ? heroByName.get(enemyName.toLowerCase()) ?? null
      : null;

    const allyProfile = allyCandidate
      ? profileByName.get(allyCandidate.heroName.toLowerCase()) ?? null
      : null;
    const enemyProfile = enemyCandidate
      ? profileByName.get(enemyCandidate.heroName.toLowerCase()) ?? null
      : null;

    if (
      !allyCandidate ||
      !enemyCandidate ||
      allyCandidate.heroName.toLowerCase() ===
        enemyCandidate.heroName.toLowerCase()
    ) {
      return {
        lane,
        allyHero: allyProfile,
        enemyHero: enemyProfile,
        allyToEnemyRules: 0,
        enemyToAllyRules: 0,
        totalSkillPairs: 0,
        highlights: [],
      };
    }

    const records = extractHeroMechanics([allyCandidate, enemyCandidate]);
    const candidates = findInteractionCandidates(records);
    const aggregation = aggregateMatchups(candidates);
    const matchup = analyzeHeroMatchup(
      aggregation.matchups,
      allyCandidate.heroName,
      enemyCandidate.heroName,
    );

    const highlights: string[] = [];
    for (const item of matchup.aToB.slice(0, 2)) {
      highlights.push(
        `${allyCandidate.heroName} → ${enemyCandidate.heroName}: ${item.ruleLabel} (${item.skillPairCount} pasangan skill)`,
      );
    }
    for (const item of matchup.bToA.slice(0, 2)) {
      highlights.push(
        `${enemyCandidate.heroName} → ${allyCandidate.heroName}: ${item.ruleLabel} (${item.skillPairCount} pasangan skill)`,
      );
    }

    return {
      lane,
      allyHero: allyProfile,
      enemyHero: enemyProfile,
      allyToEnemyRules: matchup.summary.aToBInteractions,
      enemyToAllyRules: matchup.summary.bToAInteractions,
      totalSkillPairs: matchup.summary.totalSkillPairs,
      highlights,
    };
  });
}

export function aggregateEnemyThreats(
  enemyHeroes: GameplayCandidateHero[],
): TeamEnemyThreatSummary[] {
  const threatMap = new Map<
    SpecificMechanic,
    { heroNames: Set<string>; skillCount: number }
  >();

  for (const hero of enemyHeroes) {
    for (const group of hero.skillGroups) {
      for (const skill of group.skills) {
        const evidences = extractMechanicEvidence(skill.description ?? "");
        const uniqueInSkill = new Set(evidences.map((e) => e.mechanic));
        for (const mech of uniqueInSkill) {
          if (!(mech in THREAT_LABELS)) continue;
          const current = threatMap.get(mech) ?? {
            heroNames: new Set<string>(),
            skillCount: 0,
          };
          current.heroNames.add(hero.heroName);
          current.skillCount += 1;
          threatMap.set(mech, current);
        }
      }
    }
  }

  return [...threatMap.entries()]
    .map(([mechanic, value]) => ({
      mechanic,
      label: THREAT_LABELS[mechanic] ?? mechanic,
      heroNames: [...value.heroNames],
      skillCount: value.skillCount,
    }))
    .sort(
      (a, b) =>
        b.heroNames.length - a.heroNames.length || b.skillCount - a.skillCount,
    )
    .slice(0, 8);
}

export function buildAllySlotSuggestions(
  allySlots: TeamSlotInput[],
  enemyProfiles: HeroMechanicProfileSummary[],
  allyAudit: TeamCompositionAudit,
  allHeroes: GameplayCandidateHero[],
  allSkillEvidence: SkillMechanicEvidence[],
): TeamSlotSuggestion[] {
  const openLanes = MATCHUP_LANES.filter((lane) => {
    const slot = allySlots.find((s) => s.lane === lane);
    return !slot || !slot.heroName;
  });

  if (openLanes.length === 0 || enemyProfiles.length === 0) {
    return [];
  }

  const takenHeroNames = new Set(
    [
      ...allySlots.map((s) => s.heroName).filter(Boolean),
      ...enemyProfiles.map((e) => e.heroName),
    ].map((n) => String(n).toLowerCase()),
  );

  // Aggregate counter candidates across all picked enemies
  const counterScoreByHero = new Map<
    string,
    { enemies: Set<string>; rules: Set<string>; pairCount: number }
  >();

  for (const enemy of enemyProfiles) {
    const counterResult = analyzeCounterAgainstHero(
      enemy.heroName,
      allSkillEvidence,
    );
    for (const candidate of counterResult.candidates) {
      const key = candidate.counterHero.toLowerCase();
      if (takenHeroNames.has(key)) continue;
      const entry = counterScoreByHero.get(key) ?? {
        enemies: new Set<string>(),
        rules: new Set<string>(),
        pairCount: 0,
      };
      entry.enemies.add(enemy.heroName);
      for (const r of candidate.ruleIds) {
        entry.rules.add(r);
      }
      entry.pairCount += candidate.evidencePairs.length;
      counterScoreByHero.set(key, entry);
    }
  }

  const missingPillarIds = new Set(
    allyAudit.pillars
      .filter((p) => p.status === "MISSING")
      .map((p) => p.id),
  );
  const needsMagic =
    allyAudit.damageMix.magicHeroes === 0 &&
    allyAudit.damageMix.physicalHeroes > 0;
  const needsPhysical =
    allyAudit.damageMix.physicalHeroes === 0 &&
    allyAudit.damageMix.magicHeroes > 0;

  const suggestions: TeamSlotSuggestion[] = [];
  const usedSuggested = new Set<string>();

  for (const lane of openLanes) {
    const candidatesForLane = allHeroes
      .filter((hero) => {
        const key = hero.heroName.toLowerCase();
        if (takenHeroNames.has(key) || usedSuggested.has(key)) return false;
        const slug = toHeroSlug(hero.heroName);
        const lanes = HERO_LANE_MAP[slug] ?? [];
        return lanes.includes(lane);
      })
      .map((hero) => {
        const profile = buildHeroMechanicProfile(hero);
        const counterInfo = counterScoreByHero.get(hero.heroName.toLowerCase());
        const fillsGaps: string[] = [];

        if (
          missingPillarIds.has("FRONTLINE") &&
          (profile.roles.includes("Tank") ||
            profile.roles.includes("Fighter") ||
            profile.defenseEvidenceCount >= 2)
        ) {
          fillsGaps.push("Frontline");
        }
        if (missingPillarIds.has("HARD_CC") && profile.hardControlCount > 0) {
          fillsGaps.push("Hard CC");
        }
        if (
          missingPillarIds.has("MOBILITY_ENGAGE") &&
          profile.mobilityEvidenceCount > 0
        ) {
          fillsGaps.push("Mobilitas");
        }
        if (missingPillarIds.has("SUSTAIN") && profile.sustainEvidenceCount > 0) {
          fillsGaps.push("Sustain");
        }
        if (
          missingPillarIds.has("IMMUNITY_PEEL") &&
          profile.immunityEvidenceCount > 0
        ) {
          fillsGaps.push("CC Immunity");
        }
        if (needsMagic && profile.damageSources.magic > 0) {
          fillsGaps.push("Magic Damage");
        }
        if (needsPhysical && profile.damageSources.physical > 0) {
          fillsGaps.push("Physical Damage");
        }

        const enemyCount = counterInfo?.enemies.size ?? 0;
        const ruleCount = counterInfo?.rules.size ?? 0;
        const rankScore =
          enemyCount * 10 + fillsGaps.length * 6 + ruleCount * 2;

        return {
          hero,
          profile,
          counterInfo,
          fillsGaps,
          rankScore,
        };
      })
      .filter((item) => item.rankScore > 0)
      .sort(
        (a, b) =>
          b.rankScore - a.rankScore ||
          a.hero.heroName.localeCompare(b.hero.heroName),
      )
      .slice(0, 2);

    for (const picked of candidatesForLane) {
      usedSuggested.add(picked.hero.heroName.toLowerCase());
      suggestions.push({
        lane: lane as MatchupLane,
        heroName: picked.hero.heroName,
        heroSlug: picked.profile.heroSlug,
        roles: picked.profile.roles,
        lanes: picked.profile.lanes,
        counteredEnemies: [...(picked.counterInfo?.enemies ?? [])],
        matchedRules: [...(picked.counterInfo?.rules ?? [])],
        fillsGaps: picked.fillsGaps,
        verificationStatus: "UNVERIFIED",
      });
    }
  }

  return suggestions;
}
