import { NextRequest, NextResponse } from "next/server";

import { analyzeCounterFromCandidateDataset } from "@/features/counters/server/counter-analysis.service";
import { analyzeCounterWithItems } from "@/features/counters/server/counter-integration.service";
import { aggregateMultiEnemyCounters } from "@/features/counters/engine/multi-enemy-counter";

export const runtime = "nodejs";

function parseRequestedHeroes(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;

  if (Array.isArray(record.heroes)) {
    const cleaned = record.heroes
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= 80);

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const name of cleaned) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(name);
      }
    }

    return unique.length > 0 && unique.length <= 5 ? unique : null;
  }

  if (typeof record.hero === "string") {
    const single = record.hero.trim();
    if (single.length > 0 && single.length <= 80) {
      return [single];
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const heroes = parseRequestedHeroes(body);

    if (!heroes) {
      return NextResponse.json(
        {
          error:
            "Pilih minimal 1 hingga maksimal 5 hero lawan yang valid.",
        },
        { status: 400 },
      );
    }

    const perHeroResults = await Promise.all(
      heroes.map(async (heroName) => {
        const heroCounter = analyzeCounterFromCandidateDataset(heroName);
        const itemCounter = await analyzeCounterWithItems(heroName).catch(
          () => ({
            metadata: {
              heroSource: "hero-gameplay-normalized.json",
              heroCount: heroCounter.metadata.heroCount,
              heroSkillRecordCount: heroCounter.metadata.skillRecordCount,
              heroEvidenceRecordCount: heroCounter.metadata.evidenceRecordCount,
              itemSource: "Original Server item catalog",
              itemPatchVersion: "",
              itemCount: 0,
              itemVerificationStatus: "UNVERIFIED" as const,
              heroVerificationStatus: "UNVERIFIED" as const,
              patchCompatibility: "UNKNOWN" as const,
              patchCompatibilityReason:
                "Katalog item PostgreSQL tidak terhubung saat analisis dijalankan.",
            },
            analysis: {
              targetHero: heroName,
              threats: [],
              candidates: [],
              verificationStatus: "UNVERIFIED" as const,
              disclaimer:
                "Katalog item sedang tidak tersedia sehingga rekomendasi item counter kosong.",
            },
          }),
        );

        return { heroName, heroCounter, itemCounter };
      }),
    );

    const multiSummary = aggregateMultiEnemyCounters(
      perHeroResults.map((r) => r.heroCounter.analysis),
      perHeroResults.map((r) => r.itemCounter.analysis),
    );

    const first = perHeroResults[0];

    return NextResponse.json({
      hero: first.heroName,
      heroes,
      heroCounter: first.heroCounter,
      itemCounter: first.itemCounter,
      summary: multiSummary,
      metadata: {
        heroCount: first.heroCounter.metadata.heroCount,
        skillRecordCount: first.heroCounter.metadata.skillRecordCount,
        itemCount: first.itemCounter.metadata.itemCount,
        itemPatchVersion: first.itemCounter.metadata.itemPatchVersion,
        itemCatalogAvailable: first.itemCounter.metadata.itemCount > 0,
      },
    });
  } catch (error) {
    console.error("[Counter Analyzer]", error);

    return NextResponse.json(
      { error: "Analisis counter gagal dijalankan. Periksa log server." },
      { status: 500 },
    );
  }
}
