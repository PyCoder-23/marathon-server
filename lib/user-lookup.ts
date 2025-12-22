import { prisma } from "@/lib/db";

/**
 * Binary search helper for sorted array
 */
function binarySearch<T>(arr: T[], target: string, keyFn: (item: T) => string): T | undefined {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midValue = keyFn(arr[mid]).toLowerCase();
        const targetLower = target.toLowerCase();

        if (midValue === targetLower) {
            return arr[mid];
        } else if (midValue < targetLower) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return undefined;
}

/**
 * Find user by email or username (case-insensitive) using binary search
 * More efficient than linear search - O(log n) instead of O(n)
 */
export async function findUserByIdentifier(identifier: string) {
    // Fetch users sorted by email for binary search
    const usersByEmail = await prisma.user.findMany({
        orderBy: { email: 'asc' },
        take: 1000 // Reasonable limit for performance
    });

    // Try binary search on email first
    let user = binarySearch(usersByEmail, identifier, u => u.email);

    if (user) return user;

    // If not found by email, try username with sorted query
    const usersByUsername = await prisma.user.findMany({
        orderBy: { username: 'asc' },
        take: 1000
    });

    user = binarySearch(usersByUsername, identifier, u => u.username);

    return user;
}

/**
 * Find user by email only (case-insensitive) using binary search
 */
export async function findUserByEmail(email: string) {
    const users = await prisma.user.findMany({
        orderBy: { email: 'asc' },
        take: 1000
    });

    return binarySearch(users, email, u => u.email);
}

/**
 * Find user by username only (case-insensitive) using binary search
 */
export async function findUserByUsername(username: string) {
    const users = await prisma.user.findMany({
        orderBy: { username: 'asc' },
        take: 1000
    });

    return binarySearch(users, username, u => u.username);
}
