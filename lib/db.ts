import { PrismaClient } from "@prisma/client";
import { getConnectionString } from "@netlify/database";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveConnectionString(): string | undefined {
  try {
    // Provided automatically by Netlify DB in every deploy context.
    return getConnectionString();
  } catch {
    // Falls back to a manually-configured DATABASE_URL for local dev
    // outside of `netlify dev`.
    return process.env.DATABASE_URL;
  }
}

function createPrismaClient() {
  const connectionString = resolveConnectionString();
  return connectionString ? new PrismaClient({ datasourceUrl: connectionString }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
