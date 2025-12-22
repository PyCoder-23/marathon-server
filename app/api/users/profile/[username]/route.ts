import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { getISTDayStart, getISTDayEnd } from "@/lib/timezone-utils";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
    try {
        const payload = await requireAuth(); // Require login to view profiles? Yes.
        const viewerId = payload.userId;
        const { username } = await params;

        // 1. Find the target user efficiently
        const decodedName = decodeURIComponent(username);
        const targetUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: decodedName,
                    // mode: 'insensitive' // Optional: depends on DB support, findFirst is better than findMany
                }
            },
            include: {
                squad: true,
                _count: {
                    select: {
                        monthlyWins: true,
                        weeklyWins: true,
                    }
                }
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isOwner = targetUser.id === viewerId;
        const isLocked = (targetUser as any).isProfileLocked && !isOwner;

        // Base profile info needed even if locked
        const baseProfile = {
            id: targetUser.id,
            username: targetUser.username,
            image: targetUser.image,
            isLocked: (targetUser as any).isProfileLocked, // To show lock icon status
            isOwner,
            squad: targetUser.squad ? {
                id: targetUser.squad.id,
                name: targetUser.squad.name,
                rank: 0 // Placeholder
            } : null,
            joinedAt: targetUser.createdAt,
            equippedFrame: (targetUser as any).equippedFrame,
            equippedNameplate: (targetUser as any).equippedNameplate,
            equippedBanner: (targetUser as any).equippedBanner,
            equippedBadge: (targetUser as any).equippedBadge,
            coins: (targetUser as any).coins,
        };

        if (isLocked) {
            return NextResponse.json({
                profile: baseProfile,
                locked: true
            });
        }

        // --- FULL PROFILE CALCULATION ---

        // 2. Global Rank
        // Count users with more XP
        const betterUsersCount = await prisma.user.count({
            where: {
                totalXp: { gt: targetUser.totalXp }
            }
        });
        const globalRank = betterUsersCount + 1;

        // 3. Squad Rank
        let squadRank = 0;
        if (targetUser.squadId) {
            const betterSquadMembers = await prisma.user.count({
                where: {
                    squadId: targetUser.squadId,
                    totalXp: { gt: targetUser.totalXp }
                }
            });
            squadRank = betterSquadMembers + 1;
            if (baseProfile.squad) {
                baseProfile.squad.rank = squadRank;
            }
        }

        // 4. Hall of Fame Count
        const hallOfFameWins = targetUser._count.monthlyWins + targetUser._count.weeklyWins;

        // 5. Graph Data (Last 7 days) - Optimized with parallel aggregation
        const weeklyActivity = [];
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);

        const istYear = istNow.getUTCFullYear();
        const istMonth = istNow.getUTCMonth();
        const istDate = istNow.getUTCDate();

        // ✅ Build all day queries to run in parallel
        const dayQueries = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(Date.UTC(istYear, istMonth, istDate - i, 0, 0, 0));
            const dayEnd = new Date(Date.UTC(istYear, istMonth, istDate - i + 1, 0, 0, 0));

            const queryStart = new Date(dayStart.getTime() - istOffset);
            const queryEnd = new Date(dayEnd.getTime() - istOffset);
            const dateStr = dayStart.toISOString().split('T')[0];

            dayQueries.push({
                dateStr,
                queries: Promise.all([
                    prisma.session.aggregate({
                        where: {
                            userId: targetUser.id,
                            startTs: { gte: queryStart, lt: queryEnd },
                            completed: true,
                        },
                        _sum: { durationMin: true },
                        _count: true
                    }),
                    prisma.xPTransaction.aggregate({
                        where: {
                            userId: targetUser.id,
                            createdAt: { gte: queryStart, lt: queryEnd },
                        },
                        _sum: { amount: true }
                    })
                ])
            });
        }

        // ✅ Execute all day queries in parallel
        const dayResults = await Promise.all(dayQueries.map(dq => dq.queries));

        // ✅ Build weekly activity from parallel results
        weeklyActivity.push(...dayQueries.map((dq, idx) => {
            const [sessionStats, xpStats] = dayResults[idx];
            return {
                date: dq.dateStr,
                hours: (sessionStats._sum.durationMin || 0) / 60,
                xp: xpStats._sum.amount || 0,
                pomodoros: sessionStats._count || 0,
            };
        }));

        return NextResponse.json({
            profile: baseProfile,
            locked: false,
            stats: {
                totalXp: targetUser.totalXp,
                totalMinutes: targetUser.totalMinutes,
                streak: targetUser.streakDays,
                globalRank,
                hallOfFameWins,
                weeklyGraph: weeklyActivity
            }
        });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Get profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Helper to handle URL encoded usernames if needed, though usually params handles it
function decodedUsername(u: string) {
    return decodeURIComponent(u);
}
