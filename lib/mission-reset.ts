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
    const incompleteMissions: Map<string, { progress: any; mission: any }> = new Map();

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

            // If mission was not completed, add to penalty map
            // Use Map to deduplicate - only penalize each unique mission once
            if (!progress.completed && !incompleteMissions.has(mission.id)) {
                incompleteMissions.set(mission.id, { progress, mission });
            }
        }
    }

    // Apply penalties for incomplete missions (deduplicated)
    if (incompleteMissions.size > 0) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, squadId: true, totalXp: true }
        });

        if (user) {
            let totalPenalty = 0;
            const penalizedMissions: string[] = [];

            for (const [missionId, { mission }] of incompleteMissions) {
                // Penalty is half the XP reward, rounded up
                const penalty = Math.ceil(mission.xpReward / 2);
                totalPenalty += penalty;
                penalizedMissions.push(mission.title || missionId);
            }

            // Only apply penalty if there's actually a penalty
            if (totalPenalty > 0) {
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
                        note: `Mission penalty: ${incompleteMissions.size} incomplete mission(s) - ${penalizedMissions.join(', ')}`,
                        createdAt: new Date()
                    }
                });

                console.log(`⚠️ Penalized user ${userId}: -${totalPenalty} XP for ${incompleteMissions.size} incomplete mission(s): ${penalizedMissions.join(', ')}`);
            }
        }
    }

    // Delete expired mission progress
    if (toReset.length > 0) {
        await prisma.missionProgress.deleteMany({
            where: {
                id: { in: toReset }
            }
        });

        console.log(`🔄 Reset ${toReset.length} expired mission(s) for user ${userId}`);
    }

    return {
        resetCount: toReset.length,
        penaltyCount: incompleteMissions.size,
        totalPenalty: Array.from(incompleteMissions.values()).reduce((sum, { mission }) => sum + Math.ceil(mission.xpReward / 2), 0)
    };
}
