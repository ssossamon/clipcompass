import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FREE_AUDIT_LIMIT_PER_MONTH, FREE_KEYWORD_LIMIT_PER_MONTH, daysAgo } from "@/lib/limits";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const [audits, auditsThisMonth, keywordsThisMonth] = await Promise.all([
    prisma.videoAudit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.videoAudit.count({ where: { userId: user.id, createdAt: { gte: daysAgo(30) } } }),
    prisma.keywordSearch.count({ where: { userId: user.id, createdAt: { gte: daysAgo(30) } } })
  ]);

  return NextResponse.json({
    user: { id: user.id, email: user.email, planTier: user.planTier },
    audits,
    limits: {
      auditsUsed: auditsThisMonth,
      auditLimit: user.planTier === "free" ? FREE_AUDIT_LIMIT_PER_MONTH : null,
      keywordsUsed: keywordsThisMonth,
      keywordLimit: user.planTier === "free" ? FREE_KEYWORD_LIMIT_PER_MONTH : null
    }
  });
}
