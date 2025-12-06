import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return errorResponse("Session ID is required", 400);
        }

        // Get the session
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return errorResponse("Session not found", 404);
        }

        if (session.userId !== payload.userId) {
            return errorResponse("Unauthorized", 403);
        }

        if (session.completed) {
            return errorResponse("Session already completed", 400);
        }

        // Calculate duration logic
        const endTs = new Date();
        const durationMs = endTs.getTime() - session.startTs.getTime();
        const durationMin = Math.floor(durationMs / 60000);

        // Check minimum duration (25 mins)
        const MIN_DURATION = 25;
        const isValidSession = durationMin >= MIN_DURATION;

        // Calculate XP logic
        const blocks = Math.floor(durationMin / 25);
        const xpEarned = isValidSession ? blocks * 20 : 0;

        // Update session
        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                endTs,
                durationMin,
                completed: true,
            },
        });

        // HANDLE INVALID SESSION (Too Short)
        if (!isValidSession) {
            return successResponse({
                session: updatedSession,
                xpEarned: 0,
                durationMin,
                isValidSession: false,
                completedMissions: [],
                message: "Session too short. Minimum 25 minutes required for XP and mission progress."
            });
        }

        // HANDLE VALID SESSION
        // 1. Create XP transaction
        await prisma.xPTransaction.create({
            data: {
                userId: payload.userId,
                amount: xpEarned,
                source: "session",
                referenceId: sessionId,
                note: `Study session: ${durationMin} minutes (${blocks} blocks)`,
            },
        });

        // 2. Update user stats
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                totalXp: { increment: xpEarned },
                totalMinutes: { increment: durationMin },
            },
        });

        // 3. Check and update streak using IST timezone
        const { getISTDayStart } = await import("@/lib/timezone-utils");
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
                sessions: {
                    where: {
                        completed: true,
                        durationMin: { gte: MIN_DURATION } // Only count valid sessions for streak
                    },
                    orderBy: { startTs: 'desc' },
                    take: 30, // Get more sessions to check streak properly
                }
            }
        });

        if (user) {
            const todayIST = getISTDayStart();
            const yesterdayIST = new Date(todayIST);
            yesterdayIST.setDate(yesterdayIST.getDate() - 1);

            // Check if user studied yesterday (IST)
            const studiedYesterday = user.sessions.some((s: any) => {
                const sessionDate = getISTDayStart(s.startTs);
                return sessionDate.getTime() === yesterdayIST.getTime();
            });

            // Check if this is the first session today (IST)
            const sessionsToday = user.sessions.filter((s: any) => {
                const sessionDate = getISTDayStart(s.startTs);
                return sessionDate.getTime() === todayIST.getTime();
            });

            if (sessionsToday.length === 1) { // Only update on first session of the day
                const newStreak = studiedYesterday ? user.streakDays + 1 : 1;
                await prisma.user.update({
                    where: { id: payload.userId },
                    data: { streakDays: newStreak },
                });

                // 4. Check for Streak Milestone Rewards
                const { checkAndAwardStreakMilestone } = await import("@/lib/coin-manager");
                await checkAndAwardStreakMilestone(payload.userId, newStreak);
            }
        }

        // 5. Check mission progress
        const { checkAllActiveMissions } = await import("@/lib/mission-checker");
        const completedMissions = await checkAllActiveMissions(payload.userId);

        return successResponse({
            session: updatedSession,
            xpEarned,
            durationMin,
            isValidSession: true,
            completedMissions: completedMissions.map(m => ({ id: m.id, title: m.title, xpReward: m.xpReward })),
        });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Stop session error:", error);
        return errorResponse("Internal server error", 500);
    }
}
