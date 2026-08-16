import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "cc_session";
const SESSION_DAYS = 30;

// OWNER OVERRIDE — accounts on this list always get full Pro access, regardless of
// what's stored in planTier, so Scott (and any account he designates as admin) can
// test and demo every feature without hitting the paywall. This must NOT ship as-is
// if ClipCompass itself is ever sold/distributed as a white-label product to other
// marketers — before that, delete this allowlist or move it to a build-time/env-based
// mechanism so buyers can't grant themselves free access the same way.
const OWNER_EMAILS = ["reinvestclubjax@gmail.com", "sossamons@outlook.com"];

export function isOwnerEmail(email: string) {
  return OWNER_EMAILS.includes(email.toLowerCase().trim());
}

function getSecret() {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string, email: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, email, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId: string;
      email: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getOrCreateUserByEmail(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({ data: { email } });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
