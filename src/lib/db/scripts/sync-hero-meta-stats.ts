import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const GMS_ENDPOINT =
  "https://api.gms.moontontech.com/api/gms/source/2669606/2756567";

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-meta-stats.json",
);

const HISTORY_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-meta-history.json",
);

const MAX_HISTORY_SNAPSHOTS = 24;

const BRACKETS = [
  { id: "9", key: "mythical_glory", label: "Mythical Glory+" },
  { id: "8", key: "mythical_honor", label: "Mythical Honor" },
  { id: "7", key: "mythic", label: "Mythic" },
  { id: "101", key: "all_rank", label: "Semua Rank" },
] as const;

const heroRankStatSchema = z.object({
  heroId: z.number().int().positive(),
  heroName: z.string().trim().min(1),
  heroSlug: z.string().trim().min(1),
  winRate: z.number().min(0).max(1),
  pickRate: z.number().min(0).max(1),
  banRate: z.number().min(0).max(1),
});

const outputSchema = z.object({
  schemaVersion: z.literal(1),
  fetchedAt: z.string(),
  sourceUpdatedAt: z.string().nullable(),
  source: z.object({
    name: z.string(),
    endpoint: z.string().url(),
    sourceTier: z.literal("TIER_1_OFFICIAL"),
    claimClassification: z.literal("OFFICIAL_FACT"),
    verificationStatus: z.literal("VERIFIED"),
    notes: z.string(),
  }),
  brackets: z.record(
    z.string(),
    z.object({
      bigrank: z.string(),
      label: z.string(),
      totalHeroes: z.number().int().nonnegative(),
      heroes: z.array(heroRankStatSchema),
    }),
  ),
});

const historyHeroPointSchema = z.object({
  heroSlug: z.string().min(1),
  winRate: z.number().min(0).max(1),
  pickRate: z.number().min(0).max(1),
  banRate: z.number().min(0).max(1),
});

const historySnapshotSchema = z.object({
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fetchedAt: z.string(),
  sourceUpdatedAt: z.string().nullable(),
  brackets: z.record(z.string(), z.array(historyHeroPointSchema)),
});

const historyFileSchema = z.object({
  schemaVersion: z.literal(1),
  sourceName: z.string(),
  sourceTier: z.literal("TIER_1_OFFICIAL"),
  snapshots: z.array(historySnapshotSchema),
});

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface RawGmsRecord {
  _updatedAt?: number;
  data?: {
    main_heroid?: number;
    main_hero?: {
      data?: {
        name?: string;
      };
    };
    main_hero_win_rate?: number;
    main_hero_appearance_rate?: number;
    main_hero_ban_rate?: number;
  };
}

async function fetchBracket(bigrank: string) {
  const res = await fetch(GMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-actid": "2669607",
      "x-appid": "2669606",
      "x-lang": "en",
    },
    body: JSON.stringify({
      pageSize: 200,
      pageIndex: 1,
      filters: [
        { field: "bigrank", operator: "eq", value: bigrank },
        { field: "match_type", operator: "eq", value: "0" },
      ],
      sorts: [
        {
          data: { field: "main_hero_win_rate", order: "desc" },
          type: "sequence",
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`GMS HTTP ${res.status} untuk bigrank=${bigrank}`);
  }

  const payload = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {
      records?: RawGmsRecord[];
    };
  };

  if (payload.code !== 0 || !Array.isArray(payload.data?.records)) {
    throw new Error(
      `Respon GMS tidak valid untuk bigrank=${bigrank}: ${payload.message ?? "unknown"}`,
    );
  }

  let latestUpdatedMs = 0;
  const dedup = new Map<string, z.infer<typeof heroRankStatSchema>>();

  for (const record of payload.data.records) {
    if (record._updatedAt && record._updatedAt > latestUpdatedMs) {
      latestUpdatedMs = record._updatedAt;
    }
    const d = record.data;
    const heroName = d?.main_hero?.data?.name?.trim();
    const heroId = d?.main_heroid;
    if (!heroName || !heroId) continue;

    const slug = toSlug(heroName);
    if (dedup.has(slug)) continue;

    dedup.set(slug, {
      heroId,
      heroName,
      heroSlug: slug,
      winRate: Number((d.main_hero_win_rate ?? 0).toFixed(6)),
      pickRate: Number((d.main_hero_appearance_rate ?? 0).toFixed(6)),
      banRate: Number((d.main_hero_ban_rate ?? 0).toFixed(6)),
    });
  }

  return {
    latestUpdatedMs,
    heroes: [...dedup.values()],
  };
}

async function appendMetaHistory(output: z.infer<typeof outputSchema>) {
  let existingSnapshots: z.infer<typeof historySnapshotSchema>[] = [];
  try {
    const raw = await readFile(HISTORY_PATH, "utf8");
    const parsed = historyFileSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      existingSnapshots = parsed.data.snapshots;
    }
  } catch {
    existingSnapshots = [];
  }

  const dateStr = (output.sourceUpdatedAt ?? output.fetchedAt).slice(0, 10);
  const compactBrackets: Record<
    string,
    Array<z.infer<typeof historyHeroPointSchema>>
  > = {};

  for (const [key, b] of Object.entries(output.brackets)) {
    compactBrackets[key] = b.heroes.map((h) => ({
      heroSlug: h.heroSlug,
      winRate: h.winRate,
      pickRate: h.pickRate,
      banRate: h.banRate,
    }));
  }

  const nextSnapshot: z.infer<typeof historySnapshotSchema> = {
    snapshotDate: dateStr,
    fetchedAt: output.fetchedAt,
    sourceUpdatedAt: output.sourceUpdatedAt,
    brackets: compactBrackets,
  };

  const withoutSameDate = existingSnapshots.filter(
    (s) => s.snapshotDate !== dateStr,
  );
  const merged = [...withoutSameDate, nextSnapshot]
    .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
    .slice(-MAX_HISTORY_SNAPSHOTS);

  const historyDoc = historyFileSchema.parse({
    schemaVersion: 1,
    sourceName: output.source.name,
    sourceTier: "TIER_1_OFFICIAL",
    snapshots: merged,
  });

  await writeFile(
    HISTORY_PATH,
    `${JSON.stringify(historyDoc, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(
    `[meta:sync] Riwayat snapshot diperbarui (${merged.length} snapshot, terbaru ${dateStr})\n`,
  );
}

async function main() {
  const brackets: z.infer<typeof outputSchema>["brackets"] = {};
  let maxUpdatedMs = 0;

  for (const bracket of BRACKETS) {
    const result = await fetchBracket(bracket.id);
    if (result.latestUpdatedMs > maxUpdatedMs) {
      maxUpdatedMs = result.latestUpdatedMs;
    }
    brackets[bracket.key] = {
      bigrank: bracket.id,
      label: bracket.label,
      totalHeroes: result.heroes.length,
      heroes: result.heroes,
    };
    process.stdout.write(
      `[meta:sync] ${bracket.label} (bigrank=${bracket.id}): ${result.heroes.length} hero\n`,
    );
  }

  const output = outputSchema.parse({
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    sourceUpdatedAt:
      maxUpdatedMs > 0 ? new Date(maxUpdatedMs).toISOString() : null,
    source: {
      name: "Moonton Official MLBB Hero Rank API (GMS 2669606/2756567)",
      endpoint: GMS_ENDPOINT,
      sourceTier: "TIER_1_OFFICIAL",
      claimClassification: "OFFICIAL_FACT",
      verificationStatus: "VERIFIED",
      notes:
        "Statistik Win Rate, Pick Rate, dan Ban Rate diambil langsung dari API peringkat hero resmi Moonton GMS (Original Server). Peringkat Tier S–D dihitung secara deterministik oleh engine berdasarkan komposisi WR, PR, dan BR.",
    },
    brackets,
  });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(`[meta:sync] Tersimpan di ${OUTPUT_PATH}\n`);
  await appendMetaHistory(output);
}

main().catch((err) => {
  console.error("[meta:sync] GAGAL:", err);
  process.exit(1);
});
