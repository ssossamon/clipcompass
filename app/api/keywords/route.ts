import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchKeywordSuggestions } from "@/lib/youtube";
import { getCurrentUser, isOwnerEmail } from "@/lib/auth";
import { FREE_KEYWORD_LIMIT_PER_MONTH, daysAgo } from "@/lib/limits";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in with your email first." }, { status: 401 });
    }

    const body = await req.json();
    const { seedKeyword } = body as { seedKeyword?: string };

    if (!seedKeyword || typeof seedKeyword !== "string") {
      return NextResponse.json({ error: "seedKeyword is required." }, { status: 400 });
    }

    const hasFullAccess = user.planTier !== "free" || isOwnerEmail(user.email);

    if (!hasFullAccess) {
      const recentCount = await prisma.keywordSearch.count({
        where: { userId: user.id, createdAt: { gte: daysAgo(30) } }
      });
      if (recentCount >= FREE_KEYWORD_LIMIT_PER_MONTH) {
        return NextResponse.json(
          {
            error: `Free plan is limited to ${FREE_KEYWORD_LIMIT_PER_MONTH} keyword searches per month. Upgrade to run more.`,
            limitReached: true
          },
          { status: 402 }
        );
      }
    }

    const suggestions = await fetchKeywordSuggestions(seedKeyword);

    await prisma.keywordSearch.create({
      data: {
        userId: user.id,
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
