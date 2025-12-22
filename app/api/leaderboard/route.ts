import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";
import { getISTWeekStart, getISTMonthStart } from "@/lib/timezone-utils";
import { cache, cacheKey, CacheTTL } from "@/lib/cache";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "weekly"; // weekly, monthly, all-time
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        // ✅ Check cache first
        const key = cacheKey('leaderboard', period, page, limit);
        const cached = cache.get(key);
        if (cached) {
            return successResponse(cached);
        }

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
                    equippedFrame: true,
                    equippedNameplate: true,
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
                where: dateFilter, // ✅ Include ALL transactions (positive and negative for admin adjustments)
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
                    totalMinutes: true,
                    squad: {
                        select: { name: true }
                    },
                    equippedFrame: true,
                    equippedNameplate: true,
                } as any
            });

            // ✅ Use Map for O(1) lookup instead of O(n) find
            const userMap = new Map(users.map((u: any) => [u.id, u]));

            // Merge data
            rankedUsers = xpAggregates.map((agg: any) => {
                const user = userMap.get(agg.userId);
                return {
                    id: agg.userId,
                    username: user?.username || "Unknown",
                    image: user?.image || null,
                    totalXp: agg._sum.amount || 0,
                    totalMinutes: user?.totalMinutes || 0,
                    squad: user?.squad,
                    equippedFrame: user?.equippedFrame,
                    equippedNameplate: user?.equippedNameplate,
                };
            });
        }

        // Add rank
        const leaderboard = rankedUsers.map((user: any, index: number) => ({
            ...user,
            rank: skip + index + 1,
            isCurrentUser: user.id === payload.userId,
        }));

        const result = { leaderboard };

        // ✅ Cache for 2 minutes
        cache.set(key, result, CacheTTL.MEDIUM);

        return successResponse(result);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get leaderboard error:", error);
        return errorResponse("Internal server error", 500);
    }
}
