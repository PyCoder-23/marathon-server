import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();

        const activeMissions = await prisma.missionProgress.findMany({
            where: {
                userId: payload.userId,
                completed: false
            },
            include: {
                mission: true
            },
            orderBy: {
                startedAt: 'desc'
            }
        });

        // Format for frontend
        const formattedMissions = activeMissions.map((progress) => ({
            id: progress.id,
            missionId: progress.missionId,
            progress: progress.progress,
            startedAt: progress.startedAt,
            title: progress.mission.title,
            description: progress.mission.description,
            xpReward: progress.mission.xpReward,
            type: progress.mission.type,
            difficulty: progress.mission.difficulty,
            criteria: progress.mission.criteria
        }));

        return successResponse(formattedMissions); // Direct array return as expected by frontend

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get active missions error:", error);
        return errorResponse("Internal server error", 500);
    }
}
