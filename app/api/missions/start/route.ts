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

        // Use upsert to prevent race conditions from spam-clicking
        // If mission already exists, just return it; otherwise create it
        const progress = await prisma.missionProgress.upsert({
            where: {
                userId_missionId: {
                    userId: payload.userId,
                    missionId,
                }
            },
            update: {
                // If it exists, don't change anything
                // This prevents resetting progress if user spam-clicks
            },
            create: {
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
