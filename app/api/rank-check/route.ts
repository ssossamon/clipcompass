import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractVideoId, checkVideoRank } from "@/lib/youtube";
import { getCurrentUser, isOwnerEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in with your email first." }, { status: 401 });
    }

    const hasFullAccess = user.planTier !== "free" || isOwnerEmail(user.email);
    if (!hasFullAccess) {
      return NextResponse.json(
        { error: "Rank tracking is a Pro feature. Upgrade to run rank checks.", limitReached: true },
        { status: 402 }
      );
    }

    const body = await req.json();
    const { videoUrl, trackedKeyword } = body as { videoUrl?: string; trackedKeyword?: string };

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json({ error: "videoUrl is required." }, { status: 400 });
    }
    if (!trackedKeyword || typeof trackedKeyword !== "string") {
      return NextResponse.json({ error: "trackedKeyword is required." }, { status: 400 });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Couldn't find a valid YouTube video ID in that URL." },
        { status: 400 }
      );
    }

    const rank = await checkVideoRank(videoId, trackedKeyword);

    const check = await prisma.rankCheck.create({
      data: {
        userId: user.id,
        videoId,
        trackedKeyword,
        result: JSON.stringify(rank)
      }
    });

    return NextResponse.json({
      id: check.id,
      videoId,
      trackedKeyword,
      position: rank.position,
      checkedResults: rank.checkedResults,
      checkedAt: check.checkedAt
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Something went wrong checking rank.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
