/**
 * Get a random default profile picture path
 * Returns one of pfp1.png through pfp10.png
 */
export function getRandomDefaultPfp(): string {
    const randomNum = Math.floor(Math.random() * 10) + 1;
    return `/pfps/pfp${randomNum}.png`;
}

/**
 * Get a deterministic default PFP based on user ID
 * This ensures the same user always gets the same default PFP
 */
export function getDefaultPfpForUser(userId: string): string {
    // Simple hash function to get a number from user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    const pfpNum = (Math.abs(hash) % 10) + 1;
    return `/pfps/pfp${pfpNum}.png`;
}
