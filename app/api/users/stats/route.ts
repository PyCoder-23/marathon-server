import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { getISTDayStart, getISTDayEnd, getISTDate } from "@/lib/timezone-utils";
import { cache, cacheKey, CacheTTL } from "@/lib/cache";

export async function GET() {
    try {
        const payload = await requireAuth();
        const userId = payload.userId;

        // ✅ Check cache first (short TTL since stats change frequently)
        const key = cacheKey('stats', userId);
        const cached = cache.get(key);
        if (cached) {
            return NextResponse.json(cached);
        }

        // ✅ Build date range for the last 7 days
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        const istYear = istTime.getUTCFullYear();
        const istMonth = istTime.getUTCMonth();
        const istDate = istTime.getUTCDate();

        // Start of range (6 days ago)
        const startTargetDate = new Date(Date.UTC(istYear, istMonth, istDate - 6, 0, 0, 0));
        const rangeStart = new Date(startTargetDate.getTime() - istOffset);

        // End of range (Today end)
        const endTargetDate = new Date(Date.UTC(istYear, istMonth, istDate, 0, 0, 0));
        const rangeEnd = new Date(endTargetDate.getTime() - istOffset + 24 * 60 * 60 * 1000);

        // ✅ Execute optimized queries (3 queries instead of 24+)
        const [sessions, xpTransactions, user] = await Promise.all([
            prisma.session.findMany({
                where: {
                    userId,
                    startTs: { gte: rangeStart, lt: rangeEnd },
                    completed: true,
                },
                select: {
                    startTs: true,
                    durationMin: true,
                }
            }),
            prisma.xPTransaction.findMany({
                where: {
                    userId,
                    createdAt: { gte: rangeStart, lt: rangeEnd },
                },
                select: {
                    createdAt: true,
                    amount: true,
                }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { streakDays: true },
            })
        ]);

        // ✅ Process data in memory
        const weeklyActivity = [];
        let todayStats = { hours: 0, pomodoros: 0, minutes: 0 };

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(Date.UTC(istYear, istMonth, istDate - i, 0, 0, 0));
            const yyyy = targetDate.getUTCFullYear();
            const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getUTCDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const dayStart = new Date(targetDate.getTime() - istOffset);
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            // Filter for this day
            const daySessions = sessions.filter(s => s.startTs >= dayStart && s.startTs < dayEnd);
            const dayXp = xpTransactions.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd);

            const durationMin = daySessions.reduce((sum, s) => sum + s.durationMin, 0);
            const xp = dayXp.reduce((sum, t) => sum + t.amount, 0);
            const pomodoros = daySessions.filter(s => s.durationMin >= 25).length;

            weeklyActivity.push({
                date: dateStr,
                hours: durationMin / 60,
                xp,
                pomodoros,
            });

            // If it's today (i=0), set todayStats
            if (i === 0) {
                todayStats = {
                    hours: durationMin / 60,
                    pomodoros,
                    minutes: durationMin,
                };
            }
        }

        const result = {
            today: todayStats,
            weekly: weeklyActivity,
            streak: user?.streakDays || 0,
        };

        // ✅ Cache for 30 seconds (short TTL since stats change frequently)
        cache.set(key, result, CacheTTL.SHORT);

        return NextResponse.json(result);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Get stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
