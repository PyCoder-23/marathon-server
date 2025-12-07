/**
 * Database-backed mission reset throttling
 * Prevents excessive resets on every page load
 */

import { prisma } from "./db";

/**
 * Check if enough time has passed since last reset
 * Only reset once per hour to prevent excessive penalties
 */
export async function shouldRunReset(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastMissionCheck: true }
    });

    if (!user || !user.lastMissionCheck) {
        return true; // Never run before
    }

    const hoursSinceLastReset = (Date.now() - user.lastMissionCheck.getTime()) / (1000 * 60 * 60);

    // Only run reset if it's been at least 1 hour since last reset
    return hoursSinceLastReset >= 1;
}

/**
 * Mark that a reset was just run for this user
 */
export async function markResetRun(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { lastMissionCheck: new Date() }
    });
}
