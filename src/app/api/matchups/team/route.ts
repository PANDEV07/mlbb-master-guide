import { NextResponse } from "next/server";
import { getTeamMatchupAnalysis } from "@/features/matchups/server/matchup-analysis.service";
import {
  MATCHUP_LANES,
  type MatchupLane,
  type TeamSlotInput,
} from "@/features/matchups/types/matchup-hub.types";

export const runtime = "nodejs";

function isValidLane(value: unknown): value is MatchupLane {
  return (
    typeof value === "string" &&
    (MATCHUP_LANES as readonly string[]).includes(value)
  );
}

function parseSlotList(input: unknown): TeamSlotInput[] | null {
  if (!Array.isArray(input)) return null;
  const parsed: TeamSlotInput[] = [];

  for (const item of input) {
    if (typeof item !== "object" || item === null) return null;
    const lane = (item as Record<string, unknown>).lane;
    const heroName = (item as Record<string, unknown>).heroName;
    if (!isValidLane(lane)) return null;
    if (heroName !== null && typeof heroName !== "string") return null;
    parsed.push({
      lane,
      heroName: typeof heroName === "string" ? heroName.slice(0, 80) : null,
    });
  }

  return parsed;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "Format permintaan tidak valid." },
        { status: 400 },
      );
    }

    const record = body as Record<string, unknown>;
    const allySlots = parseSlotList(record.allySlots);
    const enemySlots = parseSlotList(record.enemySlots);

    if (!allySlots || !enemySlots) {
      return NextResponse.json(
        {
          success: false,
          error: "Daftar slot Tim Kita dan Tim Musuh tidak valid.",
        },
        { status: 400 },
      );
    }

    const result = await getTeamMatchupAnalysis(allySlots, enemySlots);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal memproses analisis matchup tim 5v5." },
      { status: 400 },
    );
  }
}
