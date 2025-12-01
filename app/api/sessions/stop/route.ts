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

        // Calculate duration
        const endTs = new Date();
        const durationMs = endTs.getTime() - session.startTs.getTime();
        const durationMin = Math.floor(durationMs / 60000);

        // Check minimum duration (25 mins)
        const MIN_DURATION = 25;
        const isValidSession = durationMin >= MIN_DURATION;

        // Calculate XP: 20 XP per full 25-minute block
        // y = largest multiple of 25 <= durationMin
        // XP = (y / 25) * 20
        const blocks = Math.floor(durationMin / 25);
        const xpEarned = isValidSession ? blocks * 20 : 0;

        // Update session
        // We mark it as completed so it's no longer active, but we can filter invalid sessions later
        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                endTs,
                durationMin,
                completed: true,
            },
        });

        // Only update user stats and streak if session is valid
        if (isValidSession) {
            // Create XP transaction
            if (xpEarned > 0) {
                await prisma.xPTransaction.create({
                    data: {
                        userId: payload.userId,
                        amount: xpEarned,
                        source: "session",
                        referenceId: sessionId,
                        note: `Study session: ${durationMin} minutes (${blocks} blocks)`,
                    },
                });
            }

            // Update user stats
            await prisma.user.update({
                where: { id: payload.userId },
                data: {
                    totalXp: { increment: xpEarned },
                    totalMinutes: { increment: durationMin },
                },
            });

            // Check and update streak
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                include: {
                    sessions: {
                        where: {
                            completed: true,
                            durationMin: { gte: MIN_DURATION } // Only count valid sessions for streak
                        },
                        orderBy: { startTs: 'desc' },
                        take: 10,
                    }
                }
            });

            if (user) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                // Check if user studied yesterday
                const studiedYesterday = user.sessions.some((s: any) => {
                    const sessionDate = new Date(s.startTs);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() === yesterday.getTime();
                });

                // Check if this is the first session today
                const sessionsToday = user.sessions.filter((s: any) => {
                    const sessionDate = new Date(s.startTs);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() === today.getTime();
                });

                // Update streak: increment if studied yesterday, reset to 1 if not
                if (sessionsToday.length === 1) { // Only update on first session of the day
                    const newStreak = studiedYesterday ? user.streakDays + 1 : 1;
                    await prisma.user.update({
                        where: { id: payload.userId },
                        data: { streakDays: newStreak },
                    });
                }
            }
        }

        // Check mission progress
        const { checkAllActiveMissions } = await import("@/lib/mission-checker");
        const completedMissions = await checkAllActiveMissions(payload.userId);

        return successResponse({
            session: updatedSession,
            xpEarned,
            durationMin,
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
