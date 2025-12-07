import { prisma } from "@/lib/db";

/**
 * Award coins to a user (ADMIN USE ONLY)
 * This function should only be called from admin panel
 */
export async function awardCoins(userId: string, amount: number, type: string, description: string, metadata: any = {}) {
    if (amount === 0) return;

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { coins: { increment: amount } }
        }),
        prisma.coinTransaction.create({
            data: {
                userId,
                amount,
                type,
                description,
                metadata: JSON.stringify(metadata)
            }
        })
    ]);
}

// ❌ REMOVED: Automatic coin earning via streaks
// ❌ REMOVED: Automatic coin earning via competitions
// ✅ Coins can only be awarded manually from admin panel
