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

    // 1. Thread-safe Gatekeeper using Atomic Database Update
    // Attempt to update lastMissionCheck only if it's older than today's start time (IST)
    // This ensures this logic runs EXACTLY ONCE per day per user, preventing race conditions and double penalties.
    const gatekeeperResult = await prisma.user.updateMany({
        where: {
            id: userId,
            lastMissionCheck: { lt: todayIST }
        } as any,
        data: {
            lastMissionCheck: new Date()
        } as any
    });

    // If no rows were updated, it means lastMissionCheck >= todayIST
    // Someone else (or another request) already ran the reset today. Abort.
    if (gatekeeperResult.count === 0) {
        return { skipped: true, resetCount: 0, penaltyCount: 0, totalPenalty: 0 };
    }

    console.log(`🛡️ Running mission reset for user ${userId} (Gatekeeper passed)`);

    // 2. Logic: Fetch, Identify Expired, Penalize, Delete
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
            if (!progress.completed && !incompleteMissions.has(mission.id)) {
                incompleteMissions.set(mission.id, { progress, mission });
            }
        }
    }

    // Apply penalties for incomplete missions
    if (incompleteMissions.size > 0) {
        // We need to fetch user again to get current XP (since we didn't lock the row fully, but we own the day)
        // Note: There's a tiny race here if user earns XP *while* this runs, 
        // but since we are doing an atomic decrement via prisma update, it's fine.

        let totalPenalty = 0;
        const penalizedMissions: string[] = [];

        for (const [missionId, { mission }] of incompleteMissions) {
            const penalty = Math.ceil(mission.xpReward / 2);
            totalPenalty += penalty;
            penalizedMissions.push(mission.title || missionId);
        }

        if (totalPenalty > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: { totalXp: { decrement: totalPenalty } }
            });

            await prisma.xPTransaction.create({
                data: {
                    userId: userId,
                    amount: -totalPenalty,
                    source: "mission",
                    note: `Mission penalty: ${incompleteMissions.size} incomplete mission(s) (${penalizedMissions.join(', ')})`,
                    createdAt: new Date()
                }
            });

            console.log(`⚠️ Penalized user ${userId}: -${totalPenalty} XP`);
        }
    }

    // Delete expired mission progress
    if (toReset.length > 0) {
        await prisma.missionProgress.deleteMany({
            where: {
                id: { in: toReset }
            }
        });
        console.log(`🔄 Reset ${toReset.length} expired mission(s)`);
    }

    return {
        skipped: false,
        resetCount: toReset.length,
        penaltyCount: incompleteMissions.size,
        totalPenalty: Array.from(incompleteMissions.values()).reduce((sum, { mission }) => sum + Math.ceil(mission.xpReward / 2), 0)
    };
}
