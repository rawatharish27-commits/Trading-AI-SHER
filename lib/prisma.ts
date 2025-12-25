
import { PrismaClient } from '@prisma/client';

/**
 * 🏛️ REAL PRODUCTION PRISMA CLIENT
 * Goal: Permanent persistence for identities, trades, and risk states.
 */
declare global {
  var prisma: PrismaClient | undefined;
}

// Fix: Replaced 'global' with 'globalThis' to resolve "Cannot find name 'global'" errors and ensure cross-environment compatibility.
export const prisma = (globalThis as any).prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prisma = prisma;
}
