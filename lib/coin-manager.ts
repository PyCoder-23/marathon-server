import { prisma } from "@/lib/db";

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

const MILESTONES = [
    { days: 3, amount: 10 },
    { days: 7, amount: 50 },
    { days: 30, amount: 100 },
    { days: 100, amount: 1000 },
    { days: 365, amount: 5000 },
];

export async function checkAndAwardStreakMilestone(userId: string, newStreak: number) {
    // Check if newStreak hits a milestone
    const milestone = MILESTONES.find(m => m.days === newStreak);
    if (!milestone) return;

    // Check if already awarded (Prevent re-awarding after streak break if requested)
    // We check transaction history for a specific signature
    const signature = `streak_milestone_${milestone.days}`;

    // Check if transaction with this type exists
    // We'll stash the signature in 'metadata' or imply it from description/type
    // Let's use specific type "streak_reward" and put signature in metadata key "milestoneId"

    const existing = await prisma.coinTransaction.findFirst({
        where: {
            userId,
            type: "streak_reward",
            description: { contains: `streak of ${milestone.days} days` } // Simple text check
        }
    });

    if (existing) return;

    // Award
    await awardCoins(
        userId,
        milestone.amount,
        "streak_reward",
        `Achieved a streak of ${milestone.days} days!`,
        { milestoneDays: milestone.days }
    );
}

export async function awardCompetitionReward(userId: string, rank: number, type: 'WEEKLY' | 'MONTHLY') {
    let amount = 0;
    if (type === 'WEEKLY') {
        if (rank === 1) amount = 25;
    } else if (type === 'MONTHLY') {
        if (rank === 1) amount = 100;
        else if (rank === 2) amount = 75;
        else if (rank === 3) amount = 50;
    }

    if (amount > 0) {
        await awardCoins(userId, amount, `${type.toLowerCase()}_competition_reward`, `Rank #${rank} in ${type} Competition`);
    }
}
