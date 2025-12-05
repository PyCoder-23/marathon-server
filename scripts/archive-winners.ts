/**
 * Archive Winners Script
 * 
 * NOTE: This script is currently disabled as the Hall of Fame database models
 * (WeeklyWinner, UserWeeklyWinner, UserMonthlyWinner) need to be properly
 * migrated to the database. Once the migration is complete and Prisma client
 * is regenerated, uncomment the code below.
 * 
 * This script should be run:
 * - Daily at 12:01 AM IST to check for weekly resets (Monday)
 * - Daily at 12:01 AM IST to check for monthly resets (1st of month)
 * 
 * It archives the top performers before resetting the leaderboards
 */

import { PrismaClient } from "@prisma/client";
import {
    getISTDate,
    getISTWeekStart,
    getISTMonthStart,
    getISTPreviousMonthStart,
    getISTPreviousMonthEnd,
    formatMonthKey,
} from "../lib/timezone-utils";

const prisma = new PrismaClient();

console.log("⚠️  Archive script is currently disabled.");
console.log("📝 Hall of Fame models need to be migrated to the database.");
console.log("🔧 Run 'npx prisma migrate dev' to create the migration, then uncomment this script.");
process.exit(0);

/* UNCOMMENT WHEN MODELS ARE READY

async function archiveWeeklyWinners() {
    console.log("🔍 Checking for weekly winners to archive...");

    const now = getISTDate();
    const dayOfWeek = now.getDay();

    // Only run on Monday (day 1)
    if (dayOfWeek !== 1) {
        console.log("⏭️  Not Monday, skipping weekly archive");
        return;
    }

    // Get last week's date range
    const thisWeekStart = getISTWeekStart();
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    // Format week key (YYYY-WW)
    const year = lastWeekStart.getFullYear();
    const weekNumber = getWeekNumber(lastWeekStart);
    const weekKey = `${year}-${String(weekNumber).padStart(2, '0')}`;

    console.log(`📅 Archiving winners for week: ${weekKey}`);

    // Get top 3 squads from last week
    const squadXp = await prisma.xPTransaction.groupBy({
        by: ['userId'],
        where: {
            createdAt: {
                gte: lastWeekStart,
                lte: lastWeekEnd,
            },
            amount: { gt: 0 },
        },
        _sum: {
            amount: true,
        },
    });

    // Get user squad info
    const userIds = squadXp.map((x: any) => x.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, squadId: true },
    });

    // Aggregate by squad
    const squadTotals = new Map<string, number>();
    squadXp.forEach((xp: any) => {
        const user = users.find((u) => u.id === xp.userId);
        if (user?.squadId) {
            const current = squadTotals.get(user.squadId) || 0;
            squadTotals.set(user.squadId, current + (xp._sum.amount || 0));
        }
    });

    // Sort and get top 3
    const topSquads = Array.from(squadTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    // Archive top 3 squads
    for (const [squadId, totalXp] of topSquads) {
        await prisma.weeklyWinner.upsert({
            where: {
                week_squadId: {
                    week: weekKey,
                    squadId: squadId,
                },
            },
            create: {
                week: weekKey,
                squadId: squadId,
                totalXp: totalXp,
            },
            update: {
                totalXp: totalXp,
            },
        });
        console.log(`✅ Archived squad ${squadId}: ${totalXp} XP`);
    }

    // Get top 3 users from last week
    const topUsers = squadXp
        .sort((a: any, b: any) => (b._sum.amount || 0) - (a._sum.amount || 0))
        .slice(0, 3);

    for (const userXp of topUsers) {
        await prisma.userWeeklyWinner.upsert({
            where: {
                week_userId: {
                    week: weekKey,
                    userId: userXp.userId,
                },
            },
            create: {
                week: weekKey,
                userId: userXp.userId,
                totalXp: userXp._sum.amount || 0,
            },
            update: {
                totalXp: userXp._sum.amount || 0,
            },
        });
        console.log(`✅ Archived user ${userXp.userId}: ${userXp._sum.amount} XP`);
    }

    console.log("✨ Weekly winners archived successfully!");
}

async function archiveMonthlyWinners() {
    console.log("🔍 Checking for monthly winners to archive...");

    const now = getISTDate();
    const dayOfMonth = now.getDate();

    // Only run on the 1st of the month
    if (dayOfMonth !== 1) {
        console.log("⏭️  Not 1st of month, skipping monthly archive");
        return;
    }

    // Get last month's date range
    const lastMonthStart = getISTPreviousMonthStart();
    const lastMonthEnd = getISTPreviousMonthEnd();
    const monthKey = formatMonthKey(lastMonthStart);

    console.log(`📅 Archiving winners for month: ${monthKey}`);

    // Get top 3 squads from last month
    const squadXp = await prisma.xPTransaction.groupBy({
        by: ['userId'],
        where: {
            createdAt: {
                gte: lastMonthStart,
                lte: lastMonthEnd,
            },
            amount: { gt: 0 },
        },
        _sum: {
            amount: true,
        },
    });

    // Get user squad info
    const userIds = squadXp.map((x: any) => x.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, squadId: true },
    });

    // Aggregate by squad
    const squadTotals = new Map<string, number>();
    squadXp.forEach((xp: any) => {
        const user = users.find((u) => u.id === xp.userId);
        if (user?.squadId) {
            const current = squadTotals.get(user.squadId) || 0;
            squadTotals.set(user.squadId, current + (xp._sum.amount || 0));
        }
    });

    // Sort and get top 3
    const topSquads = Array.from(squadTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    // Archive top 3 squads
    for (const [squadId, totalXp] of topSquads) {
        await prisma.monthlyWinner.upsert({
            where: {
                month_squadId: {
                    month: monthKey,
                    squadId: squadId,
                },
            },
            create: {
                month: monthKey,
                squadId: squadId,
                totalXp: totalXp,
            },
            update: {
                totalXp: totalXp,
            },
        });
        console.log(`✅ Archived squad ${squadId}: ${totalXp} XP`);
    }

    // Get top 3 users from last month
    const topUsers = squadXp
        .sort((a: any, b: any) => (b._sum.amount || 0) - (a._sum.amount || 0))
        .slice(0, 3);

    for (const userXp of topUsers) {
        await prisma.userMonthlyWinner.upsert({
            where: {
                month_userId: {
                    month: monthKey,
                    userId: userXp.userId,
                },
            },
            create: {
                month: monthKey,
                userId: userXp.userId,
                totalXp: userXp._sum.amount || 0,
            },
            update: {
                totalXp: userXp._sum.amount || 0,
            },
        });
        console.log(`✅ Archived user ${userXp.userId}: ${userXp._sum.amount} XP`);
    }

    console.log("✨ Monthly winners archived successfully!");
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function main() {
    console.log("🚀 Starting winner archival process...");
    console.log(`⏰ Current IST time: ${getISTDate().toISOString()}`);

    try {
        await archiveWeeklyWinners();
        await archiveMonthlyWinners();
        console.log("✅ Winner archival completed successfully!");
    } catch (error) {
        console.error("❌ Error during winner archival:", error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

*/
