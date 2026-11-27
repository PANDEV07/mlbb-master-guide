import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePostDraftItemSuggestions } from "@/features/draft/data/draft-build-service";

const DraftBuildsRequestSchema = z.object({
  bluePicks: z.array(z.string().min(1)).min(1).max(5),
  redPicks: z.array(z.string().min(1)).min(1).max(5),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = DraftBuildsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Daftar hero Blue Side dan Red Side tidak valid.",
        },
        { status: 400 },
      );
    }

    const payload = await generatePostDraftItemSuggestions({
      bluePickSlugs: parsed.data.bluePicks,
      redPickSlugs: parsed.data.redPicks,
    });

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error("[POST /api/draft/builds]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menyusun rekomendasi item counter pasca-draft.",
      },
      { status: 500 },
    );
  }
}
