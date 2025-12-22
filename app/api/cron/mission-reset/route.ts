import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getISTDayStart, getISTWeekStart, getISTMonthStart } from "@/lib/timezone-utils";

/**
 * CRON ENDPOINT: /api/cron/mission-reset
 * Should be called periodically (e.g., every hour or day).
 * Handles moving 'ACTIVE' missions to 'FAILED' if they are past their validity period.
 */
export async function GET(req: Request) {
    try {
        const results = {
            daily: 0,
            weekly: 0,
            longTerm: 0
        };

        // 1. Daily Reset Logic
        const dayStart = getISTDayStart();

        const dailyUpdate = await (prisma.missionProgress as any).updateMany({
            where: {
                status: "ACTIVE",
                mission: { type: "DAILY" },
                startedAt: { lt: dayStart }
            },
            data: {
                status: "FAILED"
            }
        });
        results.daily = dailyUpdate.count;


        // 2. Weekly Reset Logic (Monday 12:00 AM IST)
        const weekStart = getISTWeekStart();

        const weeklyUpdate = await (prisma.missionProgress as any).updateMany({
            where: {
                status: "ACTIVE",
                mission: { type: "WEEKLY" },
                startedAt: { lt: weekStart }
            },
            data: {
                status: "FAILED"
            }
        });
        results.weekly = weeklyUpdate.count;


        // 3. Long Term / Monthly Reset (1st of Month)
        const monthStart = getISTMonthStart();

        const monthlyUpdate = await (prisma.missionProgress as any).updateMany({
            where: {
                status: "ACTIVE",
                mission: { type: "LONG_TERM" },
                startedAt: { lt: monthStart }
            },
            data: {
                status: "FAILED"
            }
        });
        results.longTerm = monthlyUpdate.count;

        return NextResponse.json({
            success: true,
            message: "Mission cleanup executed",
            expired: results
        });

    } catch (error) {
        console.error("Mission reset error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
