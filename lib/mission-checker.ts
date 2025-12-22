import { prisma } from "@/lib/db";
import { getISTDayStart, getISTWeekStart, getISTMonthStart, getISTDate } from "@/lib/timezone-utils";

export async function checkMissionCompletion(userId: string, missionId: string): Promise<boolean> {
    // ✅ Fetch mission, user stats, AND specific active progress
    // We cast to any to avoid stale Prisma Client type errors in the editor
    const [mission, user, progress] = await Promise.all([
        prisma.mission.findUnique({ where: { id: missionId } }),
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                totalXp: true,
                totalMinutes: true,
                streakDays: true,
            }
        }),
        (prisma.missionProgress as any).findFirst({
            where: {
                userId,
                missionId,
                status: "ACTIVE"
            }
        })
    ]) as [any, any, any];

    // If no active progress, mission is not started or already failed/completed
    if (!mission || !user || !progress) return false;

    const criteriaRaw = mission.criteria.toLowerCase().trim();

    // --- 1. PARSE CRITERIA ---
    let target = {
        minutes: 0,
        sessions: 0,
        streak: 0,
        uniqueDays: 0,
        weekendSessions: 0,
    };

    try {
        if (criteriaRaw.startsWith("{")) {
            const parsed = JSON.parse(mission.criteria);
            if (parsed.minutes) target.minutes = parseInt(parsed.minutes);
            if (parsed.sessions) target.sessions = parseInt(parsed.sessions);
            if (parsed.streak) target.streak = parseInt(parsed.streak);
            if (parsed.consecutiveDays) target.streak = parseInt(parsed.consecutiveDays);
            if (parsed.xp && user.totalXp >= parsed.xp) return true;

        } else if (criteriaRaw.includes(":")) {
            const parts = criteriaRaw.split(":");
            const key = parts[0].trim();
            const val = parseInt(parts[1]);

            if (key === "total_minutes" || key === "minutes") target.minutes = val;
            if (key === "session_count" || key === "sessions") target.sessions = val;
            if (key === "streak_days" || key === "streak") target.streak = val;
            if (key === "unique_days") target.uniqueDays = val;
            if (key === "weekend_sessions") target.weekendSessions = val;
            if (key === "total_xp" && user.totalXp >= val) return true;

        } else {
            if (criteriaRaw.includes("minutes")) {
                const match = criteriaRaw.match(/(\d+) minutes/);
                if (match) target.minutes = parseInt(match[1]);
            }
            else if (criteriaRaw.includes("session")) {
                const match = criteriaRaw.match(/(\d+) session/);
                if (match) target.sessions = parseInt(match[1]);
            }
            else if (criteriaRaw.includes("streak")) {
                const match = criteriaRaw.match(/(\d+) day streak/);
                if (match) target.streak = parseInt(match[1]);
            }
        }
    } catch (e) {
        console.error(`Failed to parse criteria for mission ${mission.id}: ${mission.criteria}`, e);
        return false;
    }

    // --- 2. EVALUATE DELTAS ---

    // A. Minutes Check (Current Total - Start Snapshot >= Target)
    if (target.minutes > 0) {
        const deltaMinutes = user.totalMinutes - progress.startTotalMinutes;
        if (deltaMinutes >= target.minutes) return true;
    }

    // B. Sessions Check (Current Valid Count - Start Snapshot >= Target)
    if (target.sessions > 0) {
        const currentSessionCount = await prisma.session.count({
            where: {
                userId,
                durationMin: { gte: 25 },
                completed: true
            }
        });
        const deltaSessions = currentSessionCount - progress.startSessionCount;
        if (deltaSessions >= target.sessions) return true;
    }

    // C. Streak Check (Current Streak - Start Streak >= Target)
    if (target.streak > 0) {
        const deltaStreak = user.streakDays - progress.startStreak;
        if (deltaStreak >= target.streak) return true;
    }

    // D. Unique Days / Weekend Sessions (Time Windowed SINCE Start)
    const sinceDate = progress.startedAt;

    if (target.uniqueDays > 0) {
        const sessions = await prisma.session.findMany({
            where: {
                userId,
                completed: true,
                durationMin: { gte: 25 },
                startTs: { gte: sinceDate }
            },
            select: { startTs: true }
        });

        const uniqueDates = new Set();
        sessions.forEach(s => {
            const istDate = getISTDate(s.startTs);
            const dateStr = istDate.toISOString().split('T')[0];
            uniqueDates.add(dateStr);
        });

        if (uniqueDates.size >= target.uniqueDays) return true;
    }

    if (target.weekendSessions > 0) {
        const sessions = await prisma.session.findMany({
            where: {
                userId,
                completed: true,
                durationMin: { gte: 25 },
                startTs: { gte: sinceDate }
            },
            select: { startTs: true }
        });

        let weekendCount = 0;
        sessions.forEach(s => {
            const istDate = getISTDate(s.startTs);
            const day = istDate.getDay(); // 0Sun, 6Sat
            if (day === 0 || day === 6) weekendCount++;
        });

        if (weekendCount >= target.weekendSessions) return true;
    }

    return false;
}

export async function checkAllActiveMissions(userId: string) {
    // Find all ACTIVE missions for user
    const progress = await (prisma.missionProgress as any).findMany({
        where: {
            userId,
            status: "ACTIVE", // Only check ACTIVE missions
        },
        include: {
            mission: true,
        }
    });

    if (progress.length === 0) return [];

    // ✅ Check all missions in parallel
    const completionChecks = await Promise.all(
        progress.map((p: any) => checkMissionCompletion(userId, p.missionId))
    );

    const completedMissions = [];

    // ✅ Process completed missions
    for (let i = 0; i < progress.length; i++) {
        const p = progress[i] as any;
        const isComplete = completionChecks[i];

        if (isComplete) {
            // Atomic update to mark COMPLETED
            const updateResult = await (prisma.missionProgress as any).updateMany({
                where: {
                    id: p.id,
                    status: "ACTIVE"
                },
                data: {
                    status: "COMPLETED",
                    completed: true,
                    completedAt: new Date()
                }
            });

            if (updateResult.count > 0) {
                // Award XP
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
