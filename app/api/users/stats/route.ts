import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { getISTDayStart, getISTDayEnd, getISTDate } from "@/lib/timezone-utils";

export async function GET() {
    try {
        const payload = await requireAuth();
        const userId = payload.userId;

        // Get current date boundaries in IST
        // Get current date boundaries in IST (now returns correct DB/UTC time)
        const todayStart = getISTDayStart();
        const todayEnd = getISTDayEnd();

        // Get today's sessions
        const todaySessions = await prisma.session.findMany({
            where: {
                userId,
                startTs: {
                    gte: todayStart,
                    lt: todayEnd,
                },
                completed: true,
            },
        });

        // Calculate today's stats
        const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMin, 0);
        const todayHours = todayMinutes / 60;
        const todayPomodoros = todaySessions.length;

        // Get weekly activity (last 7 days including today)
        const weeklyActivity = [];

        // ROBUST IST DATE CALCULATION
        // 1. Get current UTC time
        // 2. Add 5.5 hours to get "IST Absolute Time"
        // 3. Use getUTCFullYear/Month/Date to get the correct IST components
        // 4. Construct noon UTC objects for each day to avoid DST/timezone shift issues

        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        // This is "Today" in IST
        const istYear = istTime.getUTCFullYear();
        const istMonth = istTime.getUTCMonth();
        const istDate = istTime.getUTCDate();

        // Iterate last 7 days
        for (let i = 6; i >= 0; i--) {
            // Calculate Day i days ago
            // We use UTC methods on the IST-shifted components to safely move back in time
            const targetDate = new Date(Date.UTC(istYear, istMonth, istDate - i, 0, 0, 0));

            const yyyy = targetDate.getUTCFullYear();
            const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getUTCDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            // Calculate DB Range (UTC)
            // Start: 00:00 IST = Prev Day 18:30 UTC
            // targetDate is 00:00 UTC. minus 5.5 hours = 18:30 previous day
            const queryStart = new Date(targetDate.getTime() - istOffset);

            // End: Start + 24 hours
            const queryEnd = new Date(queryStart.getTime() + 24 * 60 * 60 * 1000);

            const [daySessions, dayXpTransactions] = await Promise.all([
                prisma.session.findMany({
                    where: {
                        userId,
                        startTs: { gte: queryStart, lt: queryEnd },
                        completed: true,
                    },
                }),
                prisma.xPTransaction.findMany({
                    where: {
                        userId,
                        createdAt: { gte: queryStart, lt: queryEnd },
                    },
                })
            ]);

            const dayMinutes = daySessions.reduce((sum, s) => sum + s.durationMin, 0);
            const dayXp = dayXpTransactions.reduce((sum, t) => sum + t.amount, 0);

            weeklyActivity.push({
                date: dateStr,
                hours: dayMinutes / 60,
                xp: dayXp,
                pomodoros: daySessions.length,
            });
        }

        // Get user for streak info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { streakDays: true },
        });

        return NextResponse.json({
            today: {
                hours: todayHours,
                pomodoros: todayPomodoros,
                minutes: todayMinutes,
            },
            weekly: weeklyActivity,
            streak: user?.streakDays || 0,
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Get stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
