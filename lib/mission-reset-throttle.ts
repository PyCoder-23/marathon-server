/**
 * Tracks when mission resets were last run for each user
 * Prevents excessive resets on every page load
 */

const lastResetTimes = new Map<string, Date>();

/**
 * Check if enough time has passed since last reset
 * Only reset once per hour to prevent excessive penalties
 */
export function shouldRunReset(userId: string): boolean {
    const lastReset = lastResetTimes.get(userId);

    if (!lastReset) {
        return true; // Never run before
    }

    const hoursSinceLastReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60);

    // Only run reset if it's been at least 1 hour since last reset
    return hoursSinceLastReset >= 1;
}

/**
 * Mark that a reset was just run for this user
 */
export function markResetRun(userId: string): void {
    lastResetTimes.set(userId, new Date());
}

/**
 * Clear old entries to prevent memory leak
 * Run this periodically
 */
export function cleanupOldEntries(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    for (const [userId, timestamp] of lastResetTimes.entries()) {
        if (timestamp.getTime() < oneDayAgo) {
            lastResetTimes.delete(userId);
        }
    }
}

// Clean up old entries every hour
setInterval(cleanupOldEntries, 60 * 60 * 1000);
