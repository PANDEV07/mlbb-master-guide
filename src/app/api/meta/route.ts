import { NextResponse, type NextRequest } from "next/server";
import {
  getMetaDashboardPayload,
  type MetaRankBracketKey,
} from "@/features/meta";

const VALID_BRACKETS = new Set<MetaRankBracketKey>([
  "mythical_glory",
  "mythical_honor",
  "mythic",
  "all_rank",
]);

export const revalidate = 3600;

export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("bracket") ?? "mythical_glory";
  const bracketKey: MetaRankBracketKey = VALID_BRACKETS.has(
    raw as MetaRankBracketKey,
  )
    ? (raw as MetaRankBracketKey)
    : "mythical_glory";

  const payload = getMetaDashboardPayload();
  const bracket = payload.brackets[bracketKey];

  return NextResponse.json(
    {
      bracket,
      sourceName: payload.sourceName,
      sourceUpdatedAt: payload.sourceUpdatedAt,
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
