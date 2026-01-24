import { PrismaClient } from '@shared/prisma-client';

/**
 * Shared Prisma client singleton for the backend process.
 *
 * The backend previously created many `new PrismaClient()` instances across feature services.
 * This module centralizes Prisma construction so all callers share a single connection pool
 * per Node.js process.
 */
export const prisma = new PrismaClient();

/**
 * Disconnect the shared Prisma client.
 *
 * Intended for graceful shutdown handlers.
 */
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}

