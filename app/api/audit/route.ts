import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractVideoId, fetchVideoDetails, computeChecklist } from "@/lib/youtube";

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

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Couldn't find a valid YouTube video ID in that URL." },
        { status: 400 }
      );
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
        videoUrl,
        videoId: video.id,
        title: video.title,
        optimizationScore: score,
        checklist: JSON.stringify(checklist),
        tagsVisible: video.tagsVisible
      }
    });

    if (email && typeof email === "string" && email.includes("@")) {
      await prisma.lead.create({
        data: {
          email,
          source: "free_audit_landing_page",
          consented: true,
          videoAuditId: audit.id
        }
      });
    }

    return NextResponse.json({
      auditId: audit.id,
      title: video.title,
      score,
      checklist,
      viewCount: video.viewCount,
      likeCount: video.likeCount
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Something went wrong running that audit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
