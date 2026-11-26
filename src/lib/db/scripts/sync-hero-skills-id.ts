import { writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const GMS_HERO_DETAIL_ENDPOINT =
  "https://api.gms.moontontech.com/api/gms/source/2669606/2756564";

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-skills-id.json",
);

const indonesianSkillSchema = z.object({
  apiSkillId: z.number().int().nonnegative().nullable(),
  name: z.string().trim().min(1),
  description: z.string(),
  rawCooldownCost: z.string().nullable(),
  tags: z.array(z.string()),
});

const indonesianHeroSkillsSchema = z.object({
  heroId: z.number().int().positive(),
  heroName: z.string().trim().min(1),
  heroSlug: z.string().trim().min(1),
  skills: z.array(indonesianSkillSchema),
});

const outputSchema = z.object({
  schemaVersion: z.literal(1),
  fetchedAt: z.string(),
  source: z.object({
    name: z.string(),
    endpoint: z.string().url(),
    language: z.literal("id"),
    sourceTier: z.literal("TIER_1_OFFICIAL"),
  }),
  totalHeroes: z.number().int().nonnegative(),
  totalSkills: z.number().int().nonnegative(),
  heroes: z.array(indonesianHeroSkillsSchema),
});

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanHtmlText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function localizeCooldownCost(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  return raw
    .replace(/Mana Cost:/gi, "Biaya Mana:")
    .replace(/Energy Cost:/gi, "Biaya Energi:")
    .replace(/HP Cost:/gi, "Biaya HP:")
    .replace(/\s{2,}/g, " · ")
    .trim();
}

interface RawGmsSkill {
  skillid?: number | string | null;
  skillname?: string;
  skilldesc?: string;
  "skillcd&cost"?: string;
  skilltag?: Array<{ tagname?: string }>;
}

interface RawGmsHeroRecord {
  data?: {
    hero_id?: number;
    hero?: {
      data?: {
        heroid?: number;
        name?: string;
        heroskilllist?: Array<{
          skilllist?: RawGmsSkill[];
        }>;
      };
    };
  };
}

async function fetchPage(pageIndex: number, pageSize: number) {
  const res = await fetch(GMS_HERO_DETAIL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-actid": "2669607",
      "x-appid": "2669606",
      "x-lang": "id",
    },
    body: JSON.stringify({
      pageSize,
      pageIndex,
      filters: [],
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} saat mengambil halaman ${pageIndex}`);
  }

  const payload = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {
      total?: number;
      records?: RawGmsHeroRecord[];
    };
  };

  if (payload.code !== 0 || !Array.isArray(payload.data?.records)) {
    throw new Error(
      `Respon GMS tidak valid pada halaman ${pageIndex}: ${payload.message ?? "unknown"}`,
    );
  }

  return {
    total: payload.data.total ?? 0,
    records: payload.data.records,
  };
}

async function main() {
  const pageSize = 50;
  let pageIndex = 1;
  const heroMap = new Map<string, z.infer<typeof indonesianHeroSkillsSchema>>();

  while (true) {
    const { total, records } = await fetchPage(pageIndex, pageSize);
    if (records.length === 0) break;

    for (const rec of records) {
      const heroData = rec.data?.hero?.data;
      const heroId = Number(rec.data?.hero_id ?? heroData?.heroid ?? 0);
      const heroName = heroData?.name?.trim();
      if (!heroId || !heroName) continue;

      const heroSlug = toSlug(heroName);
      const skillListGroups = heroData?.heroskilllist ?? [];
      const seenSkillKeys = new Set<string>();
      const skills: z.infer<typeof indonesianSkillSchema>[] = [];

      for (const group of skillListGroups) {
        for (const rawSkill of group.skilllist ?? []) {
          const name = rawSkill.skillname?.trim();
          if (!name) continue;
          const numericId =
            rawSkill.skillid !== undefined &&
            rawSkill.skillid !== null &&
            Number.isFinite(Number(rawSkill.skillid))
              ? Number(rawSkill.skillid)
              : null;

          const dedupKey = `${numericId ?? "none"}|${name.toLowerCase()}`;
          if (seenSkillKeys.has(dedupKey)) continue;
          seenSkillKeys.add(dedupKey);

          skills.push({
            apiSkillId: numericId,
            name,
            description: cleanHtmlText(rawSkill.skilldesc ?? ""),
            rawCooldownCost: localizeCooldownCost(rawSkill["skillcd&cost"]),
            tags: (rawSkill.skilltag ?? [])
              .map((t) => t.tagname?.trim() ?? "")
              .filter(Boolean),
          });
        }
      }

      heroMap.set(heroSlug, {
        heroId,
        heroName,
        heroSlug,
        skills,
      });
    }

    process.stdout.write(
      `[hero-skills:sync-id] Halaman ${pageIndex}: terkumpul ${heroMap.size}/${total} hero\n`,
    );

    if (pageIndex * pageSize >= total) break;
    pageIndex += 1;
  }

  const heroes = [...heroMap.values()].sort((a, b) =>
    a.heroName.localeCompare(b.heroName),
  );
  const totalSkills = heroes.reduce((sum, h) => sum + h.skills.length, 0);

  const output = outputSchema.parse({
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    source: {
      name: "Moonton Official MLBB Hero Detail API (GMS 2669606/2756564, x-lang: id)",
      endpoint: GMS_HERO_DETAIL_ENDPOINT,
      language: "id",
      sourceTier: "TIER_1_OFFICIAL",
    },
    totalHeroes: heroes.length,
    totalSkills,
    heroes,
  });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(
    `[hero-skills:sync-id] Selesai: ${heroes.length} hero (${totalSkills} skill Bahasa Indonesia) tersimpan di ${OUTPUT_PATH}\n`,
  );
}

main().catch((err) => {
  console.error("[hero-skills:sync-id] GAGAL:", err);
  process.exit(1);
});
