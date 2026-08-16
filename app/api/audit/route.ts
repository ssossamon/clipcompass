import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractVideoId, fetchVideoDetails, computeChecklist } from "@/lib/youtube";
import { createSessionToken, getOrCreateUserByEmail, isOwnerEmail, SESSION_COOKIE } from "@/lib/auth";
import { FREE_AUDIT_LIMIT_PER_MONTH, daysAgo } from "@/lib/limits";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, targetKeyword, email } = body as {
      videoUrl?: string;
      targetKeyword?: string;
      email?: string;
    };

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json({ error: "videoUrl is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required to run an audit." }, { status: 400 });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Couldn't find a valid YouTube video ID in that URL." },
        { status: 400 }
      );
    }

    const user = await getOrCreateUserByEmail(email.toLowerCase().trim());
    const hasFullAccess = user.planTier !== "free" || isOwnerEmail(user.email);

    if (!hasFullAccess) {
      const recentCount = await prisma.videoAudit.count({
        where: { userId: user.id, createdAt: { gte: daysAgo(30) } }
      });
      if (recentCount >= FREE_AUDIT_LIMIT_PER_MONTH) {
        return NextResponse.json(
          {
            error: `Free plan is limited to ${FREE_AUDIT_LIMIT_PER_MONTH} audits per month. Upgrade to run more.`,
            limitReached: true
          },
          { status: 402 }
        );
      }
    }

    const video = await fetchVideoDetails(videoId);
    if (!video) {
      return NextResponse.json(
        { error: "That video couldn't be found. Double-check the URL and try again." },
        { status: 404 }
      );
    }

    const { checklist, score } = computeChecklist(video, targetKeyword ?? "");

    const audit = await prisma.videoAudit.create({
      data: {
        userId: user.id,
        videoUrl,
        videoId: video.id,
        title: video.title,
        optimizationScore: score,
        checklist: JSON.stringify(checklist),
        tagsVisible: video.tagsVisible
      }
    });

    await prisma.lead.create({
      data: {
        email: user.email,
        source: "free_audit_landing_page",
        consented: true,
        videoAuditId: audit.id
      }
    });

    const res = NextResponse.json({
      auditId: audit.id,
      title: video.title,
      score,
      checklist,
      viewCount: video.viewCount,
      likeCount: video.likeCount
    });

    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id, user.email), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return res;
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Something went wrong running that audit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
