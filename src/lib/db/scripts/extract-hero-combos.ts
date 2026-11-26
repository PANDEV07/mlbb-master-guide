import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const HERO_IDENTITIES_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-identities.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-combos.json",
);

const comboStepSchema = z.object({
  skillId: z.number().int().positive(),
  skillIcon: z.string().url().nullable().optional(),
});

const comboItemSchema = z.object({
  type: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  skillSequence: z.array(comboStepSchema).min(1),
});

const heroComboEntrySchema = z.object({
  heroSlug: z.string().trim().min(1),
  heroName: z.string().trim().min(1),
  sourceUrl: z.string().url(),
  skillUpgradePriority: z.string().nullable(),
  combos: z.array(comboItemSchema),
});

const outputFileSchema = z.object({
  schemaVersion: z.literal(1),
  extractedAt: z.string(),
  source: z.object({
    name: z.string(),
    domain: z.string(),
    baseUrl: z.string().url(),
    sourceTier: z.literal("TIER_2_SECONDARY"),
    verificationStatus: z.literal("UNVERIFIED"),
    claimClassification: z.literal("COMMUNITY_THEORY"),
    notes: z.string(),
  }),
  heroes: z.array(heroComboEntrySchema),
});

function extractBalancedJsonArray(source: string, openBracketIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openBracketIndex; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "[") {
      depth += 1;
    } else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBracketIndex, i + 1);
      }
    }
  }

  return null;
}

function unescapeFlightPayload(escapedSlice: string): string {
  return escapedSlice
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

async function extractForHero(hero: {
  slug: string;
  name: string;
}): Promise<z.output<typeof heroComboEntrySchema>> {
  const sourceUrl = `https://mlbbhub.com/heroes/${hero.slug}`;

  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "MLBBMasterGuide/1.0 (+hero-combo-sync)" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        heroSlug: hero.slug,
        heroName: hero.name,
        sourceUrl,
        skillUpgradePriority: null,
        combos: [],
      };
    }

    const html = await response.text();

    const priorityMatch = html.match(/\\"skillUpgradePriority\\":\\"([^"\\]+)\\"/);
    const skillUpgradePriority = priorityMatch ? priorityMatch[1].trim() : null;

    const marker = '\\"combos\\":[';
    const markerIdx = html.indexOf(marker);
    if (markerIdx < 0) {
      return {
        heroSlug: hero.slug,
        heroName: hero.name,
        sourceUrl,
        skillUpgradePriority,
        combos: [],
      };
    }

    const arrayStart = markerIdx + marker.length - 1;
    // Slice generous window then unescape RSC string before balancing brackets
    const rawWindow = html.slice(arrayStart, arrayStart + 12000);
    const unescaped = unescapeFlightPayload(rawWindow);
    const jsonArrayStr = extractBalancedJsonArray(unescaped, 0);

    if (!jsonArrayStr) {
      return {
        heroSlug: hero.slug,
        heroName: hero.name,
        sourceUrl,
        skillUpgradePriority,
        combos: [],
      };
    }

    const parsedRaw: unknown = JSON.parse(jsonArrayStr);
    const validatedCombos = z.array(comboItemSchema).safeParse(parsedRaw);

    return {
      heroSlug: hero.slug,
      heroName: hero.name,
      sourceUrl,
      skillUpgradePriority,
      combos: validatedCombos.success ? validatedCombos.data : [],
    };
  } catch {
    return {
      heroSlug: hero.slug,
      heroName: hero.name,
      sourceUrl,
      skillUpgradePriority: null,
      combos: [],
    };
  }
}

async function main(): Promise<void> {
  const rawIdentities = JSON.parse(
    (await readFile(HERO_IDENTITIES_PATH, "utf8")).replace(/^\uFEFF/, ""),
  ) as { heroes: Array<{ slug: string; name: string }> };

  const heroes = rawIdentities.heroes.slice().sort((a, b) => a.slug.localeCompare(b.slug));
  console.log(`[hero-combos:extract] Mengekstrak kombo untuk ${heroes.length} hero dari mlbbhub.com...`);

  const results: Array<z.output<typeof heroComboEntrySchema>> = [];
  const concurrency = 8;

  for (let i = 0; i < heroes.length; i += concurrency) {
    const batch = heroes.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(extractForHero));
    results.push(...batchResults);
    process.stdout.write(
      `\r[hero-combos:extract] Progres: ${Math.min(i + concurrency, heroes.length)}/${heroes.length} hero`,
    );
  }
  process.stdout.write("\n");

  const payload = outputFileSchema.parse({
    schemaVersion: 1,
    extractedAt: new Date().toISOString(),
    source: {
      name: "MLBBHub",
      domain: "mlbbhub.com",
      baseUrl: "https://mlbbhub.com/heroes",
      sourceTier: "TIER_2_SECONDARY",
      verificationStatus: "UNVERIFIED",
      claimClassification: "COMMUNITY_THEORY",
      notes:
        "Urutan kombo skill (skillSequence & skillUpgradePriority) diekstrak dari halaman hero MLBBHub. Sumber sekunder; tetap berstatus UNVERIFIED hingga diverifikasi terhadap klien Original Server.",
    },
    heroes: results,
  });

  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");

  const withCombos = payload.heroes.filter((h) => h.combos.length > 0).length;
  const totalCombos = payload.heroes.reduce((sum, h) => sum + h.combos.length, 0);
  console.log(
    `[hero-combos:extract] SELESAI: ${withCombos}/${payload.heroes.length} hero memiliki kombo (${totalCombos} total kombo) -> ${OUTPUT_PATH}`,
  );
}

main().catch((err) => {
  console.error("[hero-combos:extract] GAGAL:", err);
  process.exit(1);
});
