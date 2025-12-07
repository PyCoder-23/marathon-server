/**
 * Simple in-memory cache with TTL
 * Reduces database network transfer by caching frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    expires: number;
}

class ResponseCache {
    private cache = new Map<string, CacheEntry<any>>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Clean up expired entries every 5 minutes
        this.startCleanup();
    }

    /**
     * Set a value in cache with TTL
     * @param key Cache key
     * @param data Data to cache
     * @param ttlSeconds Time to live in seconds
     */
    set<T>(key: string, data: T, ttlSeconds: number): void {
        this.cache.set(key, {
            data,
            expires: Date.now() + (ttlSeconds * 1000)
        });
    }

    /**
     * Get a value from cache
     * @param key Cache key
     * @returns Cached data or null if expired/not found
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Delete a specific cache entry
     * @param key Cache key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Delete all cache entries matching a pattern
     * @param pattern String pattern to match (uses includes)
     */
    deletePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const entry of this.cache.values()) {
            if (now > entry.expires) {
                expiredEntries++;
            } else {
                validEntries++;
            }
        }

        return {
            total: this.cache.size,
            valid: validEntries,
            expired: expiredEntries,
            memoryEstimate: `~${Math.round(this.cache.size * 0.5)}KB`
        };
    }

    /**
     * Start automatic cleanup of expired entries
     */
    private startCleanup(): void {
        if (this.cleanupInterval) return;

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleaned = 0;

            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expires) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                console.log(`🧹 Cache cleanup: Removed ${cleaned} expired entries`);
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Stop automatic cleanup
     */
    stopCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Export singleton instance
export const cache = new ResponseCache();

/**
 * Helper to generate cache keys
 */
export function cacheKey(...parts: (string | number | boolean | null | undefined)[]): string {
    return parts.filter(p => p !== null && p !== undefined).join(':');
}

/**
 * Cache TTL presets (in seconds)
 */
export const CacheTTL = {
    SHORT: 30,        // 30 seconds - for frequently changing data
    MEDIUM: 120,      // 2 minutes - for moderately changing data
    LONG: 300,        // 5 minutes - for rarely changing data
    VERY_LONG: 900,   // 15 minutes - for static data
} as const;
