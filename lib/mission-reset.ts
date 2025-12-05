import { prisma } from "@/lib/db";
import { getISTDayStart, getISTWeekStart, getISTMonthStart } from "@/lib/timezone-utils";

/**
 * Reset missions that have expired based on their type and IST timezone
 * Penalizes users for incomplete missions by deducting half the XP reward
 * This should be called when fetching missions to ensure stale missions are reset
 */
export async function resetExpiredMissions(userId: string) {
    const todayIST = getISTDayStart();
    const weekStartIST = getISTWeekStart();
    const monthStartIST = getISTMonthStart();

    // Get all user's mission progress
    const allProgress = await prisma.missionProgress.findMany({
        where: { userId },
        include: { mission: true }
    });

    const toReset: string[] = [];
    const incompleteMissions: Array<{ progress: any; mission: any }> = [];

    for (const progress of allProgress) {
        const mission = progress.mission;
        let shouldReset = false;

        if (mission.type === "DAILY") {
            // Reset if started before today (IST)
            if (progress.startedAt < todayIST) {
                shouldReset = true;
            }
        } else if (mission.type === "WEEKLY") {
            // Reset if started before this week's Monday (IST)
            if (progress.startedAt < weekStartIST) {
                shouldReset = true;
            }
        }
        // LONG_TERM missions never reset

        if (shouldReset) {
            toReset.push(progress.id);

            // If mission was not completed, add to penalty list
            if (!progress.completed) {
                incompleteMissions.push({ progress, mission });
            }
        }
    }

    // Apply penalties for incomplete missions
    if (incompleteMissions.length > 0) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, squadId: true, totalXp: true }
        });

        if (user) {
            let totalPenalty = 0;

            for (const { mission } of incompleteMissions) {
                // Penalty is half the XP reward, rounded up
                const penalty = Math.ceil(mission.xpReward / 2);
                totalPenalty += penalty;
            }

            // Deduct XP from user (can go negative)
            const newUserXp = user.totalXp - totalPenalty;

            await prisma.user.update({
                where: { id: userId },
                data: { totalXp: newUserXp }
            });

            // Create XP transaction record for penalty
            await prisma.xPTransaction.create({
                data: {
                    userId: userId,
                    amount: -totalPenalty,
                    source: "mission",
                    note: `Mission penalty: ${incompleteMissions.length} incomplete mission(s)`,
                    createdAt: new Date()
                }
            });

            console.log(`⚠️ Penalized user ${userId}: -${totalPenalty} XP for ${incompleteMissions.length} incomplete mission(s)`);
        }
    }

    // Delete expired mission progress
    if (toReset.length > 0) {
        await prisma.missionProgress.deleteMany({
            where: {
                id: { in: toReset }
            }
        });
    }

    return {
        resetCount: toReset.length,
        penaltyCount: incompleteMissions.length,
        totalPenalty: incompleteMissions.reduce((sum, { mission }) => sum + Math.ceil(mission.xpReward / 2), 0)
    };
}
