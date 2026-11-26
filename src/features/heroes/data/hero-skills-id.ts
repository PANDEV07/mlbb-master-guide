import indonesianSkillsData from "@/data/imports/hero-skills-id.json";

export interface IndonesianSkillEntry {
  apiSkillId: number | null;
  name: string;
  description: string;
  rawCooldownCost: string | null;
  tags: string[];
}

interface IndonesianHeroRecord {
  heroId: number;
  heroName: string;
  heroSlug: string;
  skills: IndonesianSkillEntry[];
}

const HERO_LIST = (
  indonesianSkillsData as { heroes?: IndonesianHeroRecord[] }
).heroes ?? [];

const HERO_BY_LOWER_NAME = new Map<string, IndonesianHeroRecord>(
  HERO_LIST.map((hero) => [hero.heroName.trim().toLowerCase(), hero]),
);

const SKILL_TAG_ID_MAP: Record<string, string> = {
  Burst: "Burst",
  "Burst Damage": "Burst Damage",
  Damage: "Damage",
  CC: "Crowd Control",
  "Crowd Control": "Crowd Control",
  Slow: "Efek Slow",
  Blink: "Blink / Dash",
  Mobility: "Mobilitas",
  Charge: "Menerjang",
  Heal: "Pemulihan HP",
  Shield: "Perisai (Shield)",
  Buff: "Buff",
  Debuff: "Debuff",
  AOE: "Area (AoE)",
  "Area Damage": "Damage Area",
  Speed: "Kecepatan Gerak",
  "Speed Up": "Peningkatan Kecepatan",
  "Remove CC": "Hapus CC",
  "CC Immune": "Kebal CC",
  Invincible: "Kebal Serangan",
  Conceal: "Menghilang",
  Camouflage: "Kamuflase",
  Summon: "Memanggil Unit",
  Transform: "Berubah Wujud",
  Morph: "Berubah Wujud",
  Teleport: "Teleportasi",
  Attach: "Menempel",
  Death: "Efek Kematian",
  "Control": "Kontrol",
};

export function localizeSkillTagName(tagName: string): string {
  return SKILL_TAG_ID_MAP[tagName] ?? tagName;
}

export function getIndonesianSkillOverlay(
  heroName: string,
  apiSkillId: number | string | null | undefined,
  fallbackSkillName?: string,
): IndonesianSkillEntry | null {
  const hero = HERO_BY_LOWER_NAME.get(heroName.trim().toLowerCase());
  if (!hero) return null;

  if (apiSkillId !== null && apiSkillId !== undefined) {
    const numericId = Number(apiSkillId);
    if (Number.isFinite(numericId)) {
      const byId = hero.skills.find((s) => s.apiSkillId === numericId);
      if (byId) return byId;
    }
  }

  if (fallbackSkillName) {
    const normalizedName = fallbackSkillName.trim().toLowerCase();
    const byName = hero.skills.find(
      (s) => s.name.trim().toLowerCase() === normalizedName,
    );
    if (byName) return byName;
  }

  return null;
}

export function localizeRawCooldownCost(raw: string | null): string | null {
  if (!raw) return null;
  return raw
    .replace(/Mana Cost:/gi, "Biaya Mana:")
    .replace(/Energy Cost:/gi, "Biaya Energi:")
    .replace(/HP Cost:/gi, "Biaya HP:")
    .replace(/\s{2,}/g, " · ")
    .trim();
}
