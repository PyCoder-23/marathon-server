import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET() {
    try {
        await requireAuth();

        // TODO: Re-enable when Prisma client is regenerated with new models
        // For now, return empty arrays
        const monthlySquadWinners: any[] = [];
        const weeklySquadWinners: any[] = [];
        const monthlyUserWinners: any[] = [];
        const weeklyUserWinners: any[] = [];

        /* 
        // Fetch all monthly squad winners
        const monthlySquadWinners = await prisma.monthlyWinner.findMany({
            include: {
                squad: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: [
                { month: 'desc' },
                { totalXp: 'desc' }
            ]
        });

        // Fetch all weekly squad winners
        const weeklySquadWinners = await prisma.weeklyWinner.findMany({
            include: {
                squad: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: [
                { week: 'desc' },
                { totalXp: 'desc' }
            ]
        });

        // Fetch all monthly user winners
        const monthlyUserWinners = await prisma.userMonthlyWinner.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        image: true,
                    }
                }
            },
            orderBy: [
                { month: 'desc' },
                { totalXp: 'desc' }
            ]
        });

        // Fetch all weekly user winners
        const weeklyUserWinners = await prisma.userWeeklyWinner.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        image: true,
                    }
                }
            },
            orderBy: [
                { week: 'desc' },
                { totalXp: 'desc' }
            ]
        });
        */

        // Group by period and assign ranks
        const groupAndRank = (winners: any[], periodKey: string, nameKey: string, imageKey?: string) => {
            const grouped = winners.reduce((acc: any, winner: any) => {
                const period = winner[periodKey];
                if (!acc[period]) acc[period] = [];
                acc[period].push(winner);
                return acc;
            }, {});

            const result: any[] = [];
            Object.keys(grouped).forEach(period => {
                grouped[period]
                    .sort((a: any, b: any) => b.totalXp - a.totalXp)
                    .slice(0, 3) // Top 3 per period
                    .forEach((winner: any, index: number) => {
                        result.push({
                            id: winner.id,
                            period: formatPeriod(period, periodKey),
                            name: winner[nameKey]?.name || winner[nameKey]?.username || 'Unknown',
                            image: imageKey && winner[nameKey]?.[imageKey] ? winner[nameKey][imageKey] : null,
                            totalXp: winner.totalXp,
                            rank: index + 1,
                        });
                    });
            });

            return result;
        };

        const formatPeriod = (period: string, type: string) => {
            if (type === 'month') {
                const [year, month] = period.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            } else if (type === 'week') {
                // Format: YYYY-WW
                const [year, week] = period.split('-');
                return `Week ${week}, ${year}`;
            }
            return period;
        };

        return successResponse({
            monthlySquadWinners: groupAndRank(monthlySquadWinners, 'month', 'squad'),
            weeklySquadWinners: groupAndRank(weeklySquadWinners, 'week', 'squad'),
            monthlyUserWinners: groupAndRank(monthlyUserWinners, 'month', 'user', 'image'),
            weeklyUserWinners: groupAndRank(weeklyUserWinners, 'week', 'user', 'image'),
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get hall of fame error:", error);
        return errorResponse("Internal server error", 500);
    }
}
