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

        // Update session
        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                endTs,
                durationMin,
                completed: true,
            },
        });

        // Calculate XP (1 XP per minute)
        const xpEarned = durationMin;

        // Create XP transaction
        await prisma.xPTransaction.create({
            data: {
                userId: payload.userId,
                amount: xpEarned,
                source: "session",
                referenceId: sessionId,
                note: `Study session: ${durationMin} minutes`,
            },
        });

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
                    where: { completed: true },
                    orderBy: { startTs: 'desc' },
                    take: 10, // Get recent sessions to check streak
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
