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

        // Get current date boundaries in IST (now returns correct DB/UTC time)
        const todayStart = getISTDayStart();
        const todayEnd = getISTDayEnd();

        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        const istYear = istTime.getUTCFullYear();
        const istMonth = istTime.getUTCMonth();
        const istDate = istTime.getUTCDate();

        // ✅ Build all queries for 7 days to run in parallel
        const dayQueries = [];
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(Date.UTC(istYear, istMonth, istDate - i, 0, 0, 0));
            const yyyy = targetDate.getUTCFullYear();
            const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getUTCDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const queryStart = new Date(targetDate.getTime() - istOffset);
            const queryEnd = new Date(queryStart.getTime() + 24 * 60 * 60 * 1000);

            dayQueries.push({
                dateStr,
                queries: Promise.all([
                    prisma.session.aggregate({
                        where: {
                            userId,
                            startTs: { gte: queryStart, lt: queryEnd },
                            completed: true,
                        },
                        _sum: { durationMin: true }
                    }),
                    prisma.xPTransaction.aggregate({
                        where: {
                            userId,
                            createdAt: { gte: queryStart, lt: queryEnd },
                        },
                        _sum: { amount: true }
                    }),
                    prisma.session.count({
                        where: {
                            userId,
                            startTs: { gte: queryStart, lt: queryEnd },
                            completed: true,
                            durationMin: { gte: 25 }
                        }
                    })
                ])
            });
        }

        // ✅ Execute all queries in parallel
        const [todaySessionStats, todayPomodoroCount, user] = await Promise.all([
            prisma.session.aggregate({
                where: {
                    userId,
                    startTs: { gte: todayStart, lt: todayEnd },
                    completed: true,
                },
                _sum: { durationMin: true },
                _count: true
            }),
            prisma.session.count({
                where: {
                    userId,
                    startTs: { gte: todayStart, lt: todayEnd },
                    completed: true,
                    durationMin: { gte: 25 }
                }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { streakDays: true },
            })
        ]);

        // ✅ Execute all day queries in parallel
        const dayResults = await Promise.all(dayQueries.map(dq => dq.queries));

        const todayMinutes = todaySessionStats._sum.durationMin || 0;
        const todayHours = todayMinutes / 60;
        const todayPomodoros = todayPomodoroCount;

        // ✅ Build weekly activity from parallel results
        const weeklyActivity = dayQueries.map((dq, idx) => {
            const [sessionStats, xpStats, pomodoroCount] = dayResults[idx];
            return {
                date: dq.dateStr,
                hours: (sessionStats._sum.durationMin || 0) / 60,
                xp: xpStats._sum.amount || 0,
                pomodoros: pomodoroCount,
            };
        });

        const result = {
            today: {
                hours: todayHours,
                pomodoros: todayPomodoros,
                minutes: todayMinutes,
            },
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
