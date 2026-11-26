import { HERO_ROLE_MAP } from "@/features/heroes/data/hero-role-map";
import { HERO_LANE_MAP } from "@/features/heroes/data/hero-lane-map";
import type {
  CounterAnalysis,
  CounterCandidate,
  CounterRuleId,
} from "./counter-engine";
import type {
  ItemCounterAnalysis,
  ItemCounterCandidate,
  ItemCounterRuleId,
} from "./item-counter-engine";

export function counterSlugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface AggregatedHeroCounter {
  id: string;
  counterHero: string;
  counterSlug: string;
  roles: string[];
  lanes: string[];
  sameLaneAsTargets: string[];
  counteredEnemies: string[];
  ruleIds: CounterRuleId[];
  evidenceCount: number;
  explanation: string;
  evidencePairs: Array<{
    targetHero: string;
    targetSkill: string;
    targetMechanic: string;
    targetEvidenceText: string;
    responseSkill: string;
    responseMechanic: string;
    responseEvidenceText: string;
  }>;
  conditionsToCheck: string[];
  verificationStatus: "UNVERIFIED";
}

export interface AggregatedItemCounter {
  id: string;
  itemName: string;
  itemSlug: string;
  itemIconUrl: string | null;
  itemCategory: string;
  counteredEnemies: string[];
  ruleIds: ItemCounterRuleId[];
  evidenceCount: number;
  explanation: string;
  evidencePairs: Array<{
    targetHero: string;
    targetSkill: string;
    targetMechanic: string;
    targetEvidenceText: string;
    itemEffect: string;
    itemEffectType: "PASSIVE" | "ACTIVE";
    itemMechanic: string;
    itemEvidenceText: string;
  }>;
  conditionsToCheck: string[];
  verificationStatus: "UNVERIFIED";
}

export interface EnemyThreatGroup {
  mechanic: string;
  label: string;
  enemyHeroes: string[];
  skillExamples: string[];
}

export interface CounterplayBriefItem {
  id: string;
  title: string;
  recommendation: string;
  reason: string;
  basis: "MECHANIC_EVIDENCE" | "STRATEGIC_INTERPRETATION";
}

export interface MultiEnemyCounterSummary {
  targets: Array<{
    heroName: string;
    heroSlug: string;
    roles: string[];
    lanes: string[];
    threatCount: number;
  }>;
  threatGroups: EnemyThreatGroup[];
  heroCounters: AggregatedHeroCounter[];
  itemCounters: AggregatedItemCounter[];
  tacticalBrief: CounterplayBriefItem[];
  verificationStatus: "UNVERIFIED";
  disclaimer: string;
}

const MECHANIC_LABELS: Record<string, string> = {
  APPLY_STUN: "Stun (Hard CC)",
  APPLY_AIRBORNE: "Airborne / Knock-up",
  APPLY_IMMOBILIZE: "Immobilize / Root",
  APPLY_KNOCKBACK: "Knockback / Displacement",
  APPLY_SLOW: "Efek Slow",
  DASH: "Mobilitas Dash",
  BLINK: "Mobilitas Blink",
  HEALING: "Heal / Regenerasi",
  SHIELD: "Shield / Pelindung",
  PHYSICAL_DAMAGE: "Physical Damage",
  MAGIC_DAMAGE: "Magic Damage",
  TRUE_DAMAGE: "True Damage",
  CONTROL_IMMUNITY: "Control Immunity",
  CC_REMOVAL: "Hapus CC",
};

export function aggregateMultiEnemyCounters(
  heroAnalyses: CounterAnalysis[],
  itemAnalyses: ItemCounterAnalysis[],
): MultiEnemyCounterSummary {
  const targetNamesLower = new Set(
    heroAnalyses.map((a) => a.targetHero.trim().toLowerCase()),
  );

  const targets = heroAnalyses.map((a) => {
    const slug = counterSlugify(a.targetHero);
    return {
      heroName: a.targetHero,
      heroSlug: slug,
      roles: HERO_ROLE_MAP[slug] ?? [],
      lanes: HERO_LANE_MAP[slug] ?? [],
      threatCount: a.threats.length,
    };
  });

  const targetLanesByName = new Map(
    targets.map((t) => [t.heroName, new Set(t.lanes)]),
  );

  // 1. Group Enemy Threats
  const threatMap = new Map<
    string,
    { enemies: Set<string>; skills: Set<string> }
  >();

  const registerThreats = (
    heroName: string,
    threats: Array<{ mechanic: string; skillName: string }>,
  ) => {
    for (const t of threats) {
      const entry = threatMap.get(t.mechanic) ?? {
        enemies: new Set<string>(),
        skills: new Set<string>(),
      };
      entry.enemies.add(heroName);
      entry.skills.add(`${heroName}: ${t.skillName}`);
      threatMap.set(t.mechanic, entry);
    }
  };

  for (const a of heroAnalyses) {
    registerThreats(a.targetHero, a.threats);
  }
  for (const ia of itemAnalyses) {
    registerThreats(ia.targetHero, ia.threats);
  }

  const threatGroups: EnemyThreatGroup[] = [...threatMap.entries()]
    .map(([mechanic, info]) => ({
      mechanic,
      label: MECHANIC_LABELS[mechanic] ?? mechanic.replaceAll("_", " "),
      enemyHeroes: [...info.enemies],
      skillExamples: [...info.skills].slice(0, 6),
    }))
    .sort(
      (a, b) =>
        b.enemyHeroes.length - a.enemyHeroes.length ||
        b.skillExamples.length - a.skillExamples.length,
    );

  // 2. Aggregate Hero Counters across all selected enemies
  const heroMap = new Map<
    string,
    {
      counterHero: string;
      counterSlug: string;
      enemies: Set<string>;
      rules: Set<CounterRuleId>;
      explanations: string[];
      conditions: Set<string>;
      pairs: AggregatedHeroCounter["evidencePairs"];
    }
  >();

  for (const analysis of heroAnalyses) {
    for (const candidate of analysis.candidates as CounterCandidate[]) {
      const key = candidate.counterHero.trim().toLowerCase();
      if (targetNamesLower.has(key)) continue;

      const slug = counterSlugify(candidate.counterHero);
      const existing = heroMap.get(key) ?? {
        counterHero: candidate.counterHero,
        counterSlug: slug,
        enemies: new Set<string>(),
        rules: new Set<CounterRuleId>(),
        explanations: [],
        conditions: new Set<string>(),
        pairs: [],
      };

      existing.enemies.add(analysis.targetHero);
      for (const r of candidate.ruleIds) existing.rules.add(r);
      if (existing.explanations.length < 2) {
        existing.explanations.push(candidate.explanation);
      }
      for (const c of candidate.conditionsToCheck) existing.conditions.add(c);

      for (const pair of candidate.evidencePairs) {
        existing.pairs.push({
          targetHero: analysis.targetHero,
          targetSkill: pair.targetSkill,
          targetMechanic: pair.targetEvidence.mechanic,
          targetEvidenceText: pair.targetEvidence.evidenceText,
          responseSkill: pair.responseSkill,
          responseMechanic: pair.responseEvidence.mechanic,
          responseEvidenceText: pair.responseEvidence.evidenceText,
        });
      }

      heroMap.set(key, existing);
    }
  }

  const heroCounters: AggregatedHeroCounter[] = [...heroMap.values()]
    .map((entry) => {
      const roles = HERO_ROLE_MAP[entry.counterSlug] ?? [];
      const lanes = HERO_LANE_MAP[entry.counterSlug] ?? [];
      const counteredEnemies = [...entry.enemies];

      const sameLaneAsTargets = counteredEnemies.filter((enemyName) => {
        const enemyLanes = targetLanesByName.get(enemyName);
        if (!enemyLanes) return false;
        return lanes.some((l) => enemyLanes.has(l));
      });

      return {
        id: entry.counterSlug,
        counterHero: entry.counterHero,
        counterSlug: entry.counterSlug,
        roles,
        lanes,
        sameLaneAsTargets,
        counteredEnemies,
        ruleIds: [...entry.rules],
        evidenceCount: entry.pairs.length,
        explanation: entry.explanations.join(" "),
        evidencePairs: entry.pairs.slice(0, 12),
        conditionsToCheck: [...entry.conditions],
        verificationStatus: "UNVERIFIED" as const,
      };
    })
    .sort(
      (a, b) =>
        b.counteredEnemies.length - a.counteredEnemies.length ||
        b.ruleIds.length - a.ruleIds.length ||
        b.sameLaneAsTargets.length - a.sameLaneAsTargets.length ||
        b.evidenceCount - a.evidenceCount ||
        a.counterHero.localeCompare(b.counterHero),
    );

  // 3. Aggregate Item Counters across all selected enemies
  const itemMap = new Map<
    string,
    {
      itemName: string;
      itemSlug: string;
      itemIconUrl: string | null;
      itemCategory: string;
      enemies: Set<string>;
      rules: Set<ItemCounterRuleId>;
      explanations: Set<string>;
      conditions: Set<string>;
      pairs: AggregatedItemCounter["evidencePairs"];
    }
  >();

  for (const analysis of itemAnalyses) {
    for (const candidate of analysis.candidates as ItemCounterCandidate[]) {
      const key = candidate.itemSlug;
      const existing = itemMap.get(key) ?? {
        itemName: candidate.itemName,
        itemSlug: candidate.itemSlug,
        itemIconUrl: candidate.itemIconUrl,
        itemCategory: candidate.itemCategory,
        enemies: new Set<string>(),
        rules: new Set<ItemCounterRuleId>(),
        explanations: new Set<string>(),
        conditions: new Set<string>(),
        pairs: [],
      };

      existing.enemies.add(analysis.targetHero);
      const rules =
        candidate.ruleIds.length > 0 ? candidate.ruleIds : [candidate.ruleId];
      for (const r of rules) existing.rules.add(r);
      existing.explanations.add(candidate.explanation);
      for (const c of candidate.conditionsToCheck) existing.conditions.add(c);

      for (const pair of candidate.evidencePairs) {
        existing.pairs.push({
          targetHero: analysis.targetHero,
          targetSkill: pair.targetSkill,
          targetMechanic: pair.targetEvidence.mechanic,
          targetEvidenceText: pair.targetEvidence.evidenceText,
          itemEffect: pair.itemEffect,
          itemEffectType: pair.itemEffectType,
          itemMechanic: pair.itemEvidence.mechanic,
          itemEvidenceText: pair.itemEvidence.evidenceText,
        });
      }

      itemMap.set(key, existing);
    }
  }

  const itemCounters: AggregatedItemCounter[] = [...itemMap.values()]
    .map((entry) => ({
      id: entry.itemSlug,
      itemName: entry.itemName,
      itemSlug: entry.itemSlug,
      itemIconUrl: entry.itemIconUrl,
      itemCategory: entry.itemCategory,
      counteredEnemies: [...entry.enemies],
      ruleIds: [...entry.rules],
      evidenceCount: entry.pairs.length,
      explanation: [...entry.explanations][0] ?? "",
      evidencePairs: entry.pairs.slice(0, 12),
      conditionsToCheck: [...entry.conditions],
      verificationStatus: "UNVERIFIED" as const,
    }))
    .sort(
      (a, b) =>
        b.counteredEnemies.length - a.counteredEnemies.length ||
        b.ruleIds.length - a.ruleIds.length ||
        b.evidenceCount - a.evidenceCount ||
        a.itemName.localeCompare(b.itemName),
    );

  // 4. Dynamic Tactical Brief (Battle Spell, Item Timing, Positioning)
  const threatKeys = new Set(threatGroups.map((t) => t.mechanic));
  const tacticalBrief: CounterplayBriefItem[] = [];

  const hardCcEnemies = new Set(
    threatGroups
      .filter((t) =>
        [
          "APPLY_STUN",
          "APPLY_AIRBORNE",
          "APPLY_IMMOBILIZE",
          "APPLY_KNOCKBACK",
        ].includes(t.mechanic),
      )
      .flatMap((t) => t.enemyHeroes),
  );

  if (hardCcEnemies.size > 0) {
    tacticalBrief.push({
      id: "cc-prep",
      title: "Respons Crowd Control & Battle Spell",
      recommendation:
        "Pertimbangkan Battle Spell Purify atau hero dengan Control Immunity / Remove CC, serta sepatu Tough Boots untuk menekan durasi kontrol.",
      reason: `Terdeteksi ancaman Hard CC pada ${[...hardCcEnemies].join(", ")}.`,
      basis: "STRATEGIC_INTERPRETATION",
    });
  }

  const mobilityEnemies = new Set(
    threatGroups
      .filter((t) => t.mechanic === "DASH" || t.mechanic === "BLINK")
      .flatMap((t) => t.enemyHeroes),
  );

  if (mobilityEnemies.size > 0) {
    tacticalBrief.push({
      id: "mobility-prep",
      title: "Redam Mobilitas & Flanking Lawan",
      recommendation:
        "Simpan skill Hard CC instan (Stun/Airborne/Immobilize) hingga hero lincah masuk jarak serang; jangan buang CC ke frontline lebih dulu.",
      reason: `Terdeteksi mekanik Dash/Blink pada ${[...mobilityEnemies].join(", ")}.`,
      basis: "MECHANIC_EVIDENCE",
    });
  }

  if (threatKeys.has("HEALING") || threatKeys.has("SHIELD")) {
    const sustainList = threatGroups
      .filter((t) => t.mechanic === "HEALING" || t.mechanic === "SHIELD")
      .flatMap((t) => t.enemyHeroes);
    tacticalBrief.push({
      id: "sustain-prep",
      title: "Prioritas Anti-Sustain di Mid Game",
      recommendation:
        "Siapkan item pengurang regenerasi/shield lebih awal sebelum kontes Turtle kedua atau Lord agar teamfight panjang tidak menguntungkan lawan.",
      reason: `Terdeteksi bukti Heal/Shield pada ${[...new Set(sustainList)].join(", ")}.`,
      basis: "STRATEGIC_INTERPRETATION",
    });
  }

  const hasMagic = threatKeys.has("MAGIC_DAMAGE");
  const hasPhysical = threatKeys.has("PHYSICAL_DAMAGE");
  if (hasMagic || hasPhysical) {
    tacticalBrief.push({
      id: "damage-prep",
      title: "Urutan Itemisasi Pertahanan",
      recommendation:
        hasMagic && hasPhysical
          ? "Lawan memiliki ancaman Physical & Magic sekaligus — prioritaskan item defensif terhadap core lawan yang paling unggul gold di Early–Mid Game."
          : hasMagic
            ? "Dominasi Magic Damage terdeteksi — Magic Defense awal (seperti komponen Silence Robe) memberi nilai bertahan tinggi."
            : "Dominasi Physical Damage terdeteksi — prioritaskan Physical Defense atau pengurang attack speed sejak item kedua/ketiga.",
      reason: `Profil tipe damage terdeteksi: ${[
        hasPhysical ? "Physical" : null,
        hasMagic ? "Magic" : null,
        threatKeys.has("TRUE_DAMAGE") ? "True Damage" : null,
      ]
        .filter(Boolean)
        .join(" + ")}.`,
      basis: "MECHANIC_EVIDENCE",
    });
  }

  return {
    targets,
    threatGroups,
    heroCounters,
    itemCounters,
    tacticalBrief,
    verificationStatus: "UNVERIFIED",
    disclaimer:
      "Peringkat kandidat counter diurutkan dari cakupan musuh yang ditangkal, jumlah kategori aturan, kesamaan lane, dan jumlah bukti teks mekanik skill — bukan prediksi win rate terverifikasi.",
  };
}
