import { PrismaClient } from "@prisma/client";

declare global {
  var __skillsyncPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__skillsyncPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__skillsyncPrisma__ = prisma;
}

