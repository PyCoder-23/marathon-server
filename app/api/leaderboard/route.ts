import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";
import { getISTWeekStart, getISTMonthStart } from "@/lib/timezone-utils";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "weekly"; // weekly, monthly, all-time
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 50;
        const skip = (page - 1) * limit;

        // Determine date range based on period using IST timezone
        let dateFilter = {};

        if (period === "weekly") {
            // Week starts on Monday 12:00 AM IST
            const weekStart = getISTWeekStart();
            dateFilter = { createdAt: { gte: weekStart } };
        } else if (period === "monthly") {
            // Month starts on 1st day 12:00 AM IST
            const monthStart = getISTMonthStart();
            dateFilter = { createdAt: { gte: monthStart } };
        }

        // For "all-time", we can just use totalXp from User model
        // For periods, we need to sum XP transactions

        let rankedUsers = [];

        if (period === "all-time") {
            rankedUsers = await prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    image: true,
                    totalXp: true,
                    totalMinutes: true,
                    squad: {
                        select: { name: true }
                    }
                },
                orderBy: { totalXp: 'desc' },
                take: limit,
                skip: skip,
            });
        } else {
            // Aggregate XP from transactions for the period
            const xpAggregates = await prisma.xPTransaction.groupBy({
                by: ['userId'],
                where: {
                    ...dateFilter,
                    amount: { gt: 0 } // Only count earnings
                },
                _sum: {
                    amount: true,
                },
                orderBy: {
                    _sum: {
                        amount: 'desc',
                    }
                },
                take: limit,
                skip: skip,
            });

            // Fetch user details for these aggregates
            const userIds = xpAggregates.map((a: any) => a.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: {
                    id: true,
                    username: true,
                    image: true,
                    totalMinutes: true, // This is all-time, might want period specific but schema doesn't support easily without transaction sum
                    squad: {
                        select: { name: true }
                    }
                }
            });

            // Merge data
            rankedUsers = xpAggregates.map((agg: any) => {
                const user = users.find((u: any) => u.id === agg.userId);
                return {
                    id: agg.userId,
                    username: user?.username || "Unknown",
                    image: user?.image || null,
                    totalXp: agg._sum.amount || 0,
                    totalMinutes: user?.totalMinutes || 0, // Showing all-time minutes for now as approx
                    squad: user?.squad,
                };
            });
        }

        // Add rank
        const leaderboard = rankedUsers.map((user: any, index: number) => ({
            ...user,
            rank: skip + index + 1,
            isCurrentUser: user.id === payload.userId,
        }));

        return successResponse({ leaderboard });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get leaderboard error:", error);
        return errorResponse("Internal server error", 500);
    }
}
