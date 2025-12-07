import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";
import { shouldRunReset, markResetRun } from "@/lib/mission-reset-throttle";

export async function GET() {
    try {
        const payload = await requireAuth();

        // Reset expired missions, but only if enough time has passed
        // This prevents running reset on every page load
        if (await shouldRunReset(payload.userId)) {
            const { resetExpiredMissions } = await import("@/lib/mission-reset");
            const result = await resetExpiredMissions(payload.userId);
            await markResetRun(payload.userId);

            if (result.penaltyCount > 0) {
                console.log(`⚠️ User ${payload.userId} penalized for ${result.penaltyCount} missions (-${result.totalPenalty} XP)`);
            }
        }

        // Get all missions
        const missions = await prisma.mission.findMany({
            where: {
                active: true,
            }
        });

        // Get user's progress
        const userProgress = await prisma.missionProgress.findMany({
            where: {
                userId: payload.userId,
            }
        });

        // Combine data
        const missionsWithStatus = missions.map((mission: any) => {
            const progress = userProgress.find((p: any) => p.missionId === mission.id);
            return {
                ...mission,
                status: progress ? (progress.completed ? "COMPLETED" : "IN_PROGRESS") : "AVAILABLE",
                progressId: progress?.id,
            };
        });

        return successResponse({ missions: missionsWithStatus });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get missions error:", error);
        return errorResponse("Internal server error", 500);
    }
}
