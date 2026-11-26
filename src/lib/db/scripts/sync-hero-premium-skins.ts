import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const FANDOM_API = "https://mobile-legends.fandom.com/api.php";
const SKILLS_ID_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-skills-id.json",
);
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/data/imports/hero-premium-skins.json",
);

const heroSkinRecordSchema = z.object({
  heroSlug: z.string().min(1),
  heroName: z.string().min(1),
  skinName: z.string().min(1),
  skinTier: z.string().min(1),
  skinTag: z.string(),
  splashUrl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sourceUrl: z.string().url(),
});

const outputSchema = z.object({
  schemaVersion: z.literal(1),
  fetchedAt: z.string(),
  source: z.object({
    name: z.string(),
    endpoint: z.string().url(),
    sourceTier: z.literal("TIER_2_SECONDARY"),
    tierRankingNote: z.string(),
  }),
  totalHeroes: z.number().int().nonnegative(),
  heroes: z.array(heroSkinRecordSchema),
});

interface ParsedSkin {
  id: string;
  name: string;
  tier: string;
  tag: string;
  availability: string;
  release: string;
  dmPrice: number;
  score: number;
}

const TIER_BASE_SCORE: Record<string, number> = {
  Supreme: 6000,
  Grand: 5000,
  Exquisite: 4000,
  Deluxe: 3000,
  Exceptional: 2000,
  Common: 1000,
  "": 100,
};

const TAG_BONUS: Record<string, number> = {
  Legend: 500,
  Zenith: 450,
  PRIME: 430,
  "Kung Fu Panda": 420,
  "Naruto": 420,
  "Attack on Titan": 420,
  "Jujutsu Kaisen": 420,
  "HUNTER×HUNTER": 420,
  "Saint Seiya": 420,
  "Star Wars": 420,
  KOF: 420,
  Transformers: 420,
  Sanrio: 410,
  Ducati: 410,
  "The Aspirants": 400,
  "The Exorcists": 400,
  ABYSS: 400,
  "Dawning Stars": 390,
  "Double 11": 390,
  "Kishin Densetsu": 390,
  Collector: 360,
  Luckybox: 320,
  "Annual StarLight": 300,
  "M-Series": 290,
  Champion: 280,
  Zodiac: 260,
  Lightborn: 240,
  Epic: 220,
  "Dragon Tamer": 210,
  "Blazing Bounties": 210,
  "S.A.B.E.R.": 210,
  "V.E.N.O.M.": 210,
  "S.T.U.N.": 210,
  Create: 200,
  Special: 150,
  StarLight: 140,
  Elite: 100,
};

function normalizeLookup(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function encodeWikiFilename(text: string): string {
  return text.replace(/:/g, "-").replace(/\//g, "").trim();
}

function scoreSkin(skin: Omit<ParsedSkin, "score">): number {
  const tierScore = TIER_BASE_SCORE[skin.tier] ?? 150;
  const tagScore = TAG_BONUS[skin.tag] ?? (skin.tag ? 180 : 0);
  const availBonus =
    skin.availability === "Upcoming"
      ? -10000
      : skin.availability === "Limited"
        ? 40
        : 10;
  const priceBonus = Math.min(250, Math.round(skin.dmPrice / 10));
  const releaseYear = Number(skin.release.slice(0, 4)) || 2016;
  const recencyBonus = Math.max(0, releaseYear - 2015) * 2;
  return tierScore + tagScore + availBonus + priceBonus + recencyBonus;
}

function parseSkinDataLua(lua: string): Map<string, { wikiName: string; skins: ParsedSkin[] }> {
  const result = new Map<string, { wikiName: string; skins: ParsedSkin[] }>();

  // Match top-level hero entries: `    ["Hero Name"] = {`
  const heroHeaderRe = /\n[ \t]{1,6}\["([^"]+)"\]\s*=\s*\{\s*\n[ \t]+\["skins"\]\s*=\s*\{/g;
  const matches = [...lua.matchAll(heroHeaderRe)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const wikiName = match[1];
    const startIdx = (match.index ?? 0) + match[0].length;
    const nextHeroStart =
      i + 1 < matches.length ? (matches[i + 1].index ?? lua.length) : lua.length;
    const section = lua.slice(startIdx, nextHeroStart);

    // Stop before painted-skins block
    const paintedIdx = section.indexOf('["painted-skins"]');
    const skinsBlock = paintedIdx >= 0 ? section.slice(0, paintedIdx) : section;

    // Extract individual skin blocks
    const skinStartRe = /\["([^"]+)"\]\s*=\s*\{/g;
    const skinMatches = [...skinsBlock.matchAll(skinStartRe)].filter(
      (m) => m[1] !== "price" && m[1] !== "skins",
    );

    const skins: ParsedSkin[] = [];
    for (let j = 0; j < skinMatches.length; j++) {
      const sm = skinMatches[j];
      const skinStart = (sm.index ?? 0) + sm[0].length;
      const skinEnd =
        j + 1 < skinMatches.length
          ? (skinMatches[j + 1].index ?? skinsBlock.length)
          : skinsBlock.length;
      const chunk = skinsBlock.slice(skinStart, skinEnd);

      const getField = (field: string): string => {
        const re = new RegExp(`\\["${field}"\\]\\s*=\\s*"([^"]*)"`);
        return chunk.match(re)?.[1] ?? "";
      };

      const name = getField("name");
      if (!name) continue;
      const id = getField("id") || sm[1];
      const tier = getField("tier");
      const tag = getField("tag");
      const availability = getField("availability");
      const release = getField("release");
      const dmStr = getField("dm");
      const dmPrice = Number.parseInt(dmStr, 10) || 0;

      const base = { id, name, tier, tag, availability, release, dmPrice };
      skins.push({ ...base, score: scoreSkin(base) });
    }

    skins.sort((a, b) => b.score - a.score);
    result.set(normalizeLookup(wikiName), { wikiName, skins });
  }

  return result;
}

interface ImageInfoResult {
  title: string;
  url: string;
  width: number;
  height: number;
  descriptionurl: string;
}

async function fetchImageInfoBatch(
  fileTitles: string[],
): Promise<Map<string, ImageInfoResult>> {
  const map = new Map<string, ImageInfoResult>();
  const BATCH_SIZE = 40;

  for (let i = 0; i < fileTitles.length; i += BATCH_SIZE) {
    const batch = fileTitles.slice(i, i + BATCH_SIZE);
    const params = new URLSearchParams({
      action: "query",
      titles: batch.join("|"),
      prop: "imageinfo",
      iiprop: "url|size",
      format: "json",
      formatversion: "2",
    });

    const res = await fetch(`${FANDOM_API}?${params.toString()}`, {
      headers: { "User-Agent": "MLBBMasterGuide/1.0" },
    });
    if (!res.ok) {
      throw new Error(`Fandom imageinfo HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      query?: {
        normalized?: Array<{ from: string; to: string }>;
        pages?: Array<{
          title: string;
          missing?: boolean;
          imageinfo?: Array<{
            url: string;
            width: number;
            height: number;
            descriptionurl: string;
          }>;
        }>;
      };
    };

    const normBack = new Map<string, string>();
    for (const n of json.query?.normalized ?? []) {
      normBack.set(n.to, n.from);
    }

    for (const p of json.query?.pages ?? []) {
      const info = p.imageinfo?.[0];
      if (!p.missing && info?.url && info.width >= 400) {
        const entry: ImageInfoResult = {
          title: p.title,
          url: info.url,
          width: info.width,
          height: info.height,
          descriptionurl: info.descriptionurl,
        };
        map.set(p.title.toLowerCase(), entry);
        const orig = normBack.get(p.title);
        if (orig) map.set(orig.toLowerCase(), entry);
      }
    }
  }

  return map;
}

const WIKI_NAME_ALIASES: Record<string, string> = {
  "chang e": "Chang'e",
  change: "Chang'e",
  yisunshin: "Yi Sun-shin",
  popolandkupa: "Popol and Kupa",
  popolkupa: "Popol and Kupa",
  luoyi: "Luo Yi",
  yuzhong: "Yu Zhong",
  lapulapu: "Lapu-Lapu",
  xborg: "X.Borg",
  paquito: "Paquito",
  zhuxin: "Zhuxin",
};

async function main() {
  console.log("Membaca daftar 133 hero dari hero-skills-id.json...");
  const skillsJson = JSON.parse(await readFile(SKILLS_ID_PATH, "utf8")) as {
    heroes: Array<{ heroId: number; heroName: string; heroSlug: string }>;
  };

  console.log("Mengunduh Module:Skin/data dari Mobile Legends Wiki...");
  const skinRes = await fetch(
    `${FANDOM_API}?action=query&titles=Module:Skin/data&prop=revisions&rvprop=content&format=json&formatversion=2`,
    { headers: { "User-Agent": "MLBBMasterGuide/1.0" } },
  );
  if (!skinRes.ok) {
    throw new Error(`Gagal mengambil Module:Skin/data: HTTP ${skinRes.status}`);
  }
  const skinPayload = (await skinRes.json()) as {
    query?: { pages?: Array<{ revisions?: Array<{ content?: string }> }> };
  };
  const lua = skinPayload.query?.pages?.[0]?.revisions?.[0]?.content ?? "";
  if (lua.length < 10000) {
    throw new Error("Module:Skin/data kosong atau terpotong.");
  }

  const parsedMap = parseSkinDataLua(lua);
  console.log(`Terbaca data skin untuk ${parsedMap.size} hero dari Wiki.`);

  // Kumpulkan kandidat file splash art (top 4 skin per hero agar fallback otomatis jika ada file hilang)
  type Candidate = {
    heroSlug: string;
    heroName: string;
    wikiName: string;
    skin: ParsedSkin;
    fileTitle: string;
  };

  const candidatesByHero = new Map<string, Candidate[]>();
  const allFileTitles = new Set<string>();

  for (const h of skillsJson.heroes) {
    const key = normalizeLookup(h.heroName);
    const entry =
      parsedMap.get(key) ??
      (WIKI_NAME_ALIASES[key]
        ? parsedMap.get(normalizeLookup(WIKI_NAME_ALIASES[key]))
        : undefined);

    if (!entry || entry.skins.length === 0) {
      // Fallback: coba default splash art Wiki
      const fallbackTitle = `File:${encodeWikiFilename(h.heroName)}.jpg`;
      allFileTitles.add(fallbackTitle);
      candidatesByHero.set(h.heroSlug, [
        {
          heroSlug: h.heroSlug,
          heroName: h.heroName,
          wikiName: h.heroName,
          skin: {
            id: "default",
            name: "Default",
            tier: "Default",
            tag: "",
            availability: "Available",
            release: "",
            dmPrice: 0,
            score: 0,
          },
          fileTitle: fallbackTitle,
        },
      ]);
      continue;
    }

    const heroCandidates: Candidate[] = [];
    for (const skin of entry.skins.slice(0, 5)) {
      const encodedHero = encodeWikiFilename(entry.wikiName);
      const encodedSkin = encodeWikiFilename(skin.name);
      const jpgTitle = `File:${encodedHero} (${encodedSkin}).jpg`;
      const pngTitle = `File:${encodedHero} (${encodedSkin}).png`;
      heroCandidates.push({
        heroSlug: h.heroSlug,
        heroName: h.heroName,
        wikiName: entry.wikiName,
        skin,
        fileTitle: jpgTitle,
      });
      heroCandidates.push({
        heroSlug: h.heroSlug,
        heroName: h.heroName,
        wikiName: entry.wikiName,
        skin,
        fileTitle: pngTitle,
      });
      allFileTitles.add(jpgTitle);
      allFileTitles.add(pngTitle);
    }
    candidatesByHero.set(h.heroSlug, heroCandidates);
  }

  console.log(
    `Memverifikasi ${allFileTitles.size} kandidat URL splash art lewat Fandom ImageInfo API...`,
  );
  const imageMap = await fetchImageInfoBatch([...allFileTitles]);
  console.log(`Terverifikasi ${imageMap.size / 2 || imageMap.size} file gambar aktif.`);

  const records: Array<z.infer<typeof heroSkinRecordSchema>> = [];
  const missingHeroes: string[] = [];

  for (const h of skillsJson.heroes) {
    const cands = candidatesByHero.get(h.heroSlug) ?? [];
    let picked: { cand: Candidate; img: ImageInfoResult } | null = null;
    for (const cand of cands) {
      const img = imageMap.get(cand.fileTitle.toLowerCase());
      if (img) {
        picked = { cand, img };
        break;
      }
    }

    if (picked) {
      records.push({
        heroSlug: h.heroSlug,
        heroName: h.heroName,
        skinName: picked.cand.skin.name,
        skinTier: picked.cand.skin.tier || "Default",
        skinTag: picked.cand.skin.tag,
        splashUrl: picked.img.url,
        width: picked.img.width,
        height: picked.img.height,
        sourceUrl: picked.img.descriptionurl,
      });
    } else {
      missingHeroes.push(h.heroName);
    }
  }

  records.sort((a, b) => a.heroName.localeCompare(b.heroName));

  const payload = outputSchema.parse({
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    source: {
      name: "Mobile Legends: Bang Bang Wiki (Module:Skin/data & MediaWiki ImageInfo)",
      endpoint: `${FANDOM_API}?action=query&titles=Module:Skin/data`,
      sourceTier: "TIER_2_SECONDARY",
      tierRankingNote:
        "Dipilih berdasarkan hirarki resmi Collection Tier MLBB (Supreme > Grand > Exquisite > Deluxe > Exceptional > Common > Default) dengan prioritas seri Legend, Collab, Collector, Luckybox, dan Epic.",
    },
    totalHeroes: records.length,
    heroes: records,
  });

  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    `Berhasil menyimpan ${records.length}/${skillsJson.heroes.length} skin premium ke ${OUTPUT_PATH}`,
  );
  if (missingHeroes.length > 0) {
    console.log("Hero tanpa splash art terverifikasi:", missingHeroes.join(", "));
  }

  // Tampilkan contoh 10 hero termasuk Akai
  const samples = ["akai", "aamon", "gusion", "fanny", "layla", "miya", "ling", "hayabusa", "chou", "granger"];
  console.log("\nContoh hasil skin paling premium:");
  for (const slug of samples) {
    const r = records.find((x) => x.heroSlug === slug);
    if (r) {
      console.log(`  - ${r.heroName}: ${r.skinName} [${r.skinTier}${r.skinTag ? ` / ${r.skinTag}` : ""}] (${r.width}x${r.height})`);
    }
  }
}

main().catch((err) => {
  console.error("Gagal sinkronisasi skin premium:", err);
  process.exit(1);
});
