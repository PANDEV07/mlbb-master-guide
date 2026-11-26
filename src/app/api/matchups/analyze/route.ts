import { NextResponse } from "next/server";
import { getEnrichedHeadToHeadAnalysis } from "@/features/matchups/server/matchup-analysis.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("heroA" in body) ||
      !("heroB" in body) ||
      typeof body.heroA !== "string" ||
      typeof body.heroB !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Format permintaan tidak valid." },
        { status: 400 },
      );
    }

    const result = await getEnrichedHeadToHeadAnalysis(body.heroA, body.heroB);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal memproses analisis matchup." },
      { status: 400 },
    );
  }
}
