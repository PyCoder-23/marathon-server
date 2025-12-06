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

        // 5. Graph Data (Last 7 Days) - REUSED LOGIC
        // 5. Graph Data (Last 7 Days) - Optimized
        const weeklyActivity = [];
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);

        // Calculate the range for the last 7 days
        // We go back 6 days from today, so range is [today-6, today]
        const istYear = istNow.getUTCFullYear();
        const istMonth = istNow.getUTCMonth();
        const istDate = istNow.getUTCDate();

        // Start of the 7-day window (00:00 IST of 6 days ago)
        const startOfWindowIST = new Date(Date.UTC(istYear, istMonth, istDate - 6, 0, 0, 0));
        const endOfWindowIST = new Date(Date.UTC(istYear, istMonth, istDate + 1, 0, 0, 0)); // Until tomorrow 00:00

        const queryStart = new Date(startOfWindowIST.getTime() - istOffset);
        const queryEnd = new Date(endOfWindowIST.getTime() - istOffset);

        // Fetch all data in one go
        const [allSessions, allXp] = await Promise.all([
            prisma.session.findMany({
                where: {
                    userId: targetUser.id,
                    startTs: { gte: queryStart, lt: queryEnd },
                    completed: true,
                },
                select: { startTs: true, durationMin: true }
            }),
            prisma.xPTransaction.findMany({
                where: {
                    userId: targetUser.id,
                    createdAt: { gte: queryStart, lt: queryEnd },
                },
                select: { createdAt: true, amount: true }
            })
        ]);

        // Group by Date String (YYYY-MM-DD)
        const sessionMap = new Map<string, typeof allSessions>();
        const xpMap = new Map<string, typeof allXp>();

        for (const s of allSessions) {
            // Convert back to IST date string
            const sDateIST = new Date(s.startTs.getTime() + istOffset);
            const dateStr = sDateIST.toISOString().split('T')[0];
            if (!sessionMap.has(dateStr)) sessionMap.set(dateStr, []);
            sessionMap.get(dateStr)!.push(s);
        }

        for (const x of allXp) {
            const xDateIST = new Date(x.createdAt.getTime() + istOffset);
            const dateStr = xDateIST.toISOString().split('T')[0];
            if (!xpMap.has(dateStr)) xpMap.set(dateStr, []);
            xpMap.get(dateStr)!.push(x);
        }

        // Reconstruct the 7 days array
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.UTC(istYear, istMonth, istDate - i, 0, 0, 0));
            const dateStr = d.toISOString().split('T')[0];

            const daySessions = sessionMap.get(dateStr) || [];
            const dayXpTrans = xpMap.get(dateStr) || [];

            const dayMinutes = daySessions.reduce((sum, s) => sum + s.durationMin, 0);
            const dayXpAmount = dayXpTrans.reduce((sum, t) => sum + t.amount, 0);

            weeklyActivity.push({
                date: dateStr,
                hours: dayMinutes / 60,
                xp: dayXpAmount,
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
