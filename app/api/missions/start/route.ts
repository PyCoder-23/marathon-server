import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { missionId } = body;

        if (!missionId) {
            return errorResponse("Mission ID is required", 400);
        }

        // Check if already started
        const existing = await prisma.missionProgress.findUnique({
            where: {
                userId_missionId: {
                    userId: payload.userId,
                    missionId,
                }
            }
        });

        if (existing) {
            return errorResponse("Mission already started", 400);
        }

        // Start mission
        const progress = await prisma.missionProgress.create({
            data: {
                userId: payload.userId,
                missionId,
                progress: 0,
                completed: false,
            }
        });

        return successResponse({ progress });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Start mission error:", error);
        return errorResponse("Internal server error", 500);
    }
}
