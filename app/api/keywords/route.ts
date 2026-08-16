import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchKeywordSuggestions } from "@/lib/youtube";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seedKeyword } = body as { seedKeyword?: string };

    if (!seedKeyword || typeof seedKeyword !== "string") {
      return NextResponse.json({ error: "seedKeyword is required." }, { status: 400 });
    }

    const suggestions = await fetchKeywordSuggestions(seedKeyword);

    await prisma.keywordSearch.create({
      data: {
        seedKeyword,
        suggestions: JSON.stringify(suggestions)
      }
    });

    return NextResponse.json({
      seedKeyword,
      suggestions,
      note: "Estimated from YouTube's public autocomplete - not official Data API v3 data."
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't fetch keyword suggestions." }, { status: 500 });
  }
}
