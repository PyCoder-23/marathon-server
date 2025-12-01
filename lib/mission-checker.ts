import { prisma } from "@/lib/db";

export async function checkMissionCompletion(userId: string, missionId: string) {
    const mission = await prisma.mission.findUnique({
        where: { id: missionId },
    });

    if (!mission) return false;

    // Get user stats
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            sessions: {
                where: { completed: true }
            }
        }
    });

    if (!user) return false;

    // Check criteria based on mission type/requirements
    // This is a simplified logic engine. In a real app, you might parse a JSON criteria object.

    // Example criteria parsing (assuming criteria is a JSON string or simple description for now)
    // For this prototype, we'll implement hardcoded checks based on mission ID or simple text matching
    // In production, use a structured JSON field for 'criteria'

    const criteria = mission.criteria.toLowerCase();
    let completed = false;

    // Filter for valid sessions (>= 25 mins)
    const validSessions = user.sessions.filter((s: any) => s.durationMin >= 25);

    if (criteria.includes("study for") && criteria.includes("minutes")) {
        // e.g. "Study for 60 minutes"
        const minutesMatch = criteria.match(/(\d+) minutes/);
        const requiredMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

        if (mission.type === "DAILY") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMinutes = validSessions
                .filter((s: any) => s.startTs >= today)
                .reduce((acc: number, s: any) => acc + s.durationMin, 0);

            if (todayMinutes >= requiredMinutes) completed = true;
        } else if (mission.type === "WEEKLY") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekMinutes = validSessions
                .filter((s: any) => s.startTs >= weekAgo)
                .reduce((acc: number, s: any) => acc + s.durationMin, 0);

            if (weekMinutes >= requiredMinutes) completed = true;
        } else if (mission.type === "LONG_TERM") {
            // Total accumulated time
            const totalMinutes = validSessions
                .reduce((acc: number, s: any) => acc + s.durationMin, 0);

            if (totalMinutes >= requiredMinutes) completed = true;
        }
    }

    if (criteria.includes("complete") && criteria.includes("session")) {
        // e.g. "Complete 3 sessions"
        const countMatch = criteria.match(/(\d+) session/);
        const requiredCount = countMatch ? parseInt(countMatch[1]) : 1;

        if (mission.type === "DAILY") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Time-based checks for daily missions
            if (criteria.includes("before 8 am")) {
                const morningSessions = validSessions.filter((s: any) => {
                    const d = new Date(s.startTs);
                    return d >= today && d.getHours() < 8;
                }).length;
                if (morningSessions >= requiredCount) completed = true;
            } else if (criteria.includes("after 10 pm")) {
                const nightSessions = validSessions.filter((s: any) => {
                    const d = new Date(s.startTs);
                    return d >= today && d.getHours() >= 22;
                }).length;
                if (nightSessions >= requiredCount) completed = true;
            } else {
                // Normal daily count
                const todaySessions = validSessions.filter((s: any) => s.startTs >= today).length;
                if (todaySessions >= requiredCount) completed = true;
            }
        } else if (mission.type === "WEEKLY") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            if (criteria.includes("weekend")) {
                // Check for sessions on Sat (6) or Sun (0)
                const weekendSessions = validSessions.filter((s: any) => {
                    const d = new Date(s.startTs);
                    const day = d.getDay();
                    return d >= weekAgo && (day === 0 || day === 6);
                }).length;
                if (weekendSessions >= requiredCount) completed = true;
            } else {
                const weekSessions = validSessions.filter((s: any) => s.startTs >= weekAgo).length;
                if (weekSessions >= requiredCount) completed = true;
            }
        } else if (mission.type === "LONG_TERM") {
            // Total sessions ever
            const totalSessions = validSessions.length;
            if (totalSessions >= requiredCount) completed = true;
        }
    }

    if (criteria.includes("streak")) {
        // e.g. "7 day streak" or "30 day streak"
        const streakMatch = criteria.match(/(\d+) day streak/);
        const requiredStreak = streakMatch ? parseInt(streakMatch[1]) : 0;

        if (user.streakDays >= requiredStreak) completed = true;
    }

    return completed;
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

    const completedMissions = [];

    for (const p of progress) {
        const isComplete = await checkMissionCompletion(userId, p.missionId);
        if (isComplete) {
            // Update progress
            await prisma.missionProgress.update({
                where: { id: p.id },
                data: { completed: true, completedAt: new Date() }
            });

            // Award XP
            await prisma.user.update({
                where: { id: userId },
                data: { totalXp: { increment: p.mission.xpReward } }
            });

            // Log transaction
            await prisma.xPTransaction.create({
                data: {
                    userId,
                    amount: p.mission.xpReward,
                    source: "mission",
                    referenceId: p.id,
                    note: `Completed mission: ${p.mission.title}`
                }
            });

            completedMissions.push(p.mission);
        }
    }

    return completedMissions;
}
