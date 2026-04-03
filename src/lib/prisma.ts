import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function createClient() {
  const url = process.env.DATABASE_URL!.replace("file:", "");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Lazy proxy — defers client creation until first property access.
// This prevents build-time errors when DATABASE_URL is not available
// (e.g. during Next.js static analysis on Railway).
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    const value = (globalForPrisma.prisma as any)[prop];
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
