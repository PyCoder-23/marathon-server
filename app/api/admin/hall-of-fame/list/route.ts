import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { isAdmin: true }
        });

        if (!user?.isAdmin) {
            return errorResponse("Unauthorized - Admin only", 403);
        }

        // Fetch all 4 types of winners
        const [userMonthly, userWeekly, squadMonthly, squadWeekly] = await Promise.all([
            prisma.userMonthlyWinner.findMany({
                include: { user: { select: { username: true, image: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50
            }),
            prisma.userWeeklyWinner.findMany({
                include: { user: { select: { username: true, image: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50
            }),
            prisma.monthlyWinner.findMany({
                include: { squad: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50
            }),
            prisma.weeklyWinner.findMany({
                include: { squad: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);

        // Unite them
        const entries = [
            ...userMonthly.map(e => ({
                id: e.id,
                type: 'monthly_user',
                period: e.month,
                totalXp: e.totalXp,
                name: e.user.username,
                image: e.user.image,
                createdAt: e.createdAt,
            })),
            ...userWeekly.map(e => ({
                id: e.id,
                type: 'weekly_user',
                period: e.week,
                totalXp: e.totalXp,
                name: e.user.username,
                image: e.user.image,
                createdAt: e.createdAt,
            })),
            ...squadMonthly.map(e => ({
                id: e.id,
                type: 'monthly_squad',
                period: e.month,
                totalXp: e.totalXp,
                name: e.squad.name,
                image: null,
                createdAt: e.createdAt,
            })),
            ...squadWeekly.map(e => ({
                id: e.id,
                type: 'weekly_squad',
                period: e.week,
                totalXp: e.totalXp,
                name: e.squad.name,
                image: null,
                createdAt: e.createdAt,
            }))
        ];

        // Sort combined
        entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return successResponse({ entries });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("List HOF entries error:", error);
        return errorResponse("Internal server error", 500);
    }
}
