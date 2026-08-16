import { NextResponse } from "next/server";
import { getCurrentUser, isOwnerEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FREE_AUDIT_LIMIT_PER_MONTH, FREE_KEYWORD_LIMIT_PER_MONTH, daysAgo } from "@/lib/limits";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const hasFullAccess = user.planTier !== "free" || isOwnerEmail(user.email);

  const [audits, rankChecks, auditsThisMonth, keywordsThisMonth] = await Promise.all([
    prisma.videoAudit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.rankCheck.findMany({
      where: { userId: user.id },
      orderBy: { checkedAt: "desc" },
      take: 20
    }),
    prisma.videoAudit.count({ where: { userId: user.id, createdAt: { gte: daysAgo(30) } } }),
    prisma.keywordSearch.count({ where: { userId: user.id, createdAt: { gte: daysAgo(30) } } })
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      planTier: hasFullAccess ? "pro" : user.planTier,
      isOwner: isOwnerEmail(user.email)
    },
    audits,
    rankChecks,
    limits: {
      auditsUsed: auditsThisMonth,
      auditLimit: hasFullAccess ? null : FREE_AUDIT_LIMIT_PER_MONTH,
      keywordsUsed: keywordsThisMonth,
      keywordLimit: hasFullAccess ? null : FREE_KEYWORD_LIMIT_PER_MONTH
    }
  });
}
