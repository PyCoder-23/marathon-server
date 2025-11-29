import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET() {
    try {
        const payload = await requireAuth();

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
