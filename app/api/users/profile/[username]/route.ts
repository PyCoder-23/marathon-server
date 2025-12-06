import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { getISTDayStart, getISTDayEnd } from "@/lib/timezone-utils";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
    try {
        const payload = await requireAuth(); // Require login to view profiles? Yes.
        const viewerId = payload.userId;
        const { username } = await params;

        // 1. Find the target user (Case Insensitive)
        const targetUser = await prisma.user.findFirst({
            where: {
                username: {
                    equals: decodedUsername(username),
                    mode: 'insensitive'
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

        // 5. Graph Data (Last 7 Days) - REUSED LOGIC
        const weeklyActivity = [];
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        const istYear = istTime.getUTCFullYear();
        const istMonth = istTime.getUTCMonth();
        const istDate = istTime.getUTCDate();

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(Date.UTC(istYear, istMonth, istDate - i, 0, 0, 0));

            const yyyy = targetDate.getUTCFullYear();
            const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getUTCDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const queryStart = new Date(targetDate.getTime() - istOffset);
            const queryEnd = new Date(queryStart.getTime() + 24 * 60 * 60 * 1000);

            // Optimized: We only need XP for the graph really, maybe minutes too
            const [daySessions, dayXpTransactions] = await Promise.all([
                prisma.session.findMany({
                    where: {
                        userId: targetUser.id,
                        startTs: { gte: queryStart, lt: queryEnd },
                        completed: true,
                    },
                    select: { durationMin: true }
                }),
                prisma.xPTransaction.findMany({
                    where: {
                        userId: targetUser.id,
                        createdAt: { gte: queryStart, lt: queryEnd },
                    },
                    select: { amount: true }
                })
            ]);

            const dayMinutes = daySessions.reduce((sum, s) => sum + s.durationMin, 0);
            const dayXp = dayXpTransactions.reduce((sum, t) => sum + t.amount, 0);

            weeklyActivity.push({
                date: dateStr,
                hours: dayMinutes / 60,
                xp: dayXp,
                pomodoros: daySessions.length,
            });
        }

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
