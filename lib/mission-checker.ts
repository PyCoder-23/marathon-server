import { prisma } from "@/lib/db";
import { getISTDayStart, getISTWeekStart } from "@/lib/timezone-utils";

export async function checkMissionCompletion(userId: string, missionId: string): Promise<boolean> {
    // ✅ Fetch mission and user in parallel
    const [mission, user] = await Promise.all([
        prisma.mission.findUnique({ where: { id: missionId } }),
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                totalXp: true,
                totalMinutes: true,
                streakDays: true,
            }
        })
    ]);

    if (!mission || !user) return false;

    const criteria = mission.criteria.toLowerCase();
    const MIN_DURATION = 25;

    // ✅ Cache date calculations (expensive operations)
    const todayIST = mission.type === "DAILY" ? getISTDayStart() : null;
    const weekStartIST = mission.type === "WEEKLY" ? getISTWeekStart() : null;

    // ✅ Handle "study for X minutes" missions
    if (criteria.includes("study for") && criteria.includes("minutes")) {
        const minutesMatch = criteria.match(/(\d+) minutes/);
        const requiredMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

        if (mission.type === "DAILY" && todayIST) {
            const result = await prisma.session.aggregate({
                where: {
                    userId,
                    completed: true,
                    durationMin: { gte: MIN_DURATION },
                    startTs: { gte: todayIST }
                },
                _sum: { durationMin: true }
            });
            return (result._sum.durationMin || 0) >= requiredMinutes;
        }

        if (mission.type === "WEEKLY" && weekStartIST) {
            const result = await prisma.session.aggregate({
                where: {
                    userId,
                    completed: true,
                    durationMin: { gte: MIN_DURATION },
                    startTs: { gte: weekStartIST }
                },
                _sum: { durationMin: true }
            });
            return (result._sum.durationMin || 0) >= requiredMinutes;
        }

        if (mission.type === "LONG_TERM") {
            return user.totalMinutes >= requiredMinutes;
        }
    }

    // ✅ Handle "complete X sessions" missions
    if (criteria.includes("complete") && criteria.includes("session")) {
        const countMatch = criteria.match(/(\d+) session/);
        const requiredCount = countMatch ? parseInt(countMatch[1]) : 1;

        if (mission.type === "DAILY" && todayIST) {
            const count = await prisma.session.count({
                where: {
                    userId,
                    completed: true,
                    durationMin: { gte: MIN_DURATION },
                    startTs: { gte: todayIST }
                }
            });
            return count >= requiredCount;
        }

        if (mission.type === "WEEKLY" && weekStartIST) {
            const count = await prisma.session.count({
                where: {
                    userId,
                    completed: true,
                    durationMin: { gte: MIN_DURATION },
                    startTs: { gte: weekStartIST }
                }
            });
            return count >= requiredCount;
        }

        if (mission.type === "LONG_TERM") {
            const count = await prisma.session.count({
                where: {
                    userId,
                    completed: true,
                    durationMin: { gte: MIN_DURATION }
                }
            });
            return count >= requiredCount;
        }
    }

    // ✅ Handle streak missions
    if (criteria.includes("streak")) {
        const streakMatch = criteria.match(/(\d+) day streak/);
        const requiredStreak = streakMatch ? parseInt(streakMatch[1]) : 0;
        return user.streakDays >= requiredStreak;
    }

    return false;
}

export async function checkAllActiveMissions(userId: string) {
    // Find all in-progress missions for user
    const progress = await prisma.missionProgress.findMany({
        where: {
            userId,
            completed: false,
        },
        include: {
            mission: true,
        }
    });

    if (progress.length === 0) return [];

    // ✅ Check all missions in parallel instead of sequentially
    const completionChecks = await Promise.all(
        progress.map(p => checkMissionCompletion(userId, p.missionId))
    );

    const completedMissions = [];

    // ✅ Process completed missions
    for (let i = 0; i < progress.length; i++) {
        const p = progress[i];
        const isComplete = completionChecks[i];

        if (isComplete) {
            // Atomic update to prevent double XP awarding
            const updateResult = await prisma.missionProgress.updateMany({
                where: {
                    id: p.id,
                    completed: false
                },
                data: {
                    completed: true,
                    completedAt: new Date()
                }
            });

            // Only award XP if we actually updated the row
            if (updateResult.count > 0) {
                // ✅ Use transaction for atomic XP update and logging
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: userId },
                        data: { totalXp: { increment: p.mission.xpReward } }
                    }),
                    prisma.xPTransaction.create({
                        data: {
                            userId,
                            amount: p.mission.xpReward,
                            source: "mission",
                            referenceId: p.id,
                            note: `Completed mission: ${p.mission.title}`
                        }
                    })
                ]);

                completedMissions.push(p.mission);
            }
        }
    }

    return completedMissions;
}
