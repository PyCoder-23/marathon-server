import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
    try {
        const payload = await requireAuth();
        const userId = payload.userId;

        // Get current date boundaries
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // Get last 7 days for weekly chart
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 6);

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

        // Get weekly activity (last 7 days)
        const weeklyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(todayStart);
            dayStart.setDate(dayStart.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const [daySessions, dayXpTransactions] = await Promise.all([
                prisma.session.findMany({
                    where: {
                        userId,
                        startTs: { gte: dayStart, lt: dayEnd },
                        completed: true,
                    },
                }),
                prisma.xPTransaction.findMany({
                    where: {
                        userId,
                        createdAt: { gte: dayStart, lt: dayEnd },
                    },
                })
            ]);

            const dayMinutes = daySessions.reduce((sum, s) => sum + s.durationMin, 0);
            const dayXp = dayXpTransactions.reduce((sum, t) => sum + t.amount, 0);

            weeklyActivity.push({
                date: dayStart.toISOString().split('T')[0],
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
