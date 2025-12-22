import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";
import { checkMissionCompletion } from "@/lib/mission-checker";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { missionId } = body;

        // Manually trigger a check
        const isComplete = await checkMissionCompletion(payload.userId, missionId);

        if (isComplete) {
            // Connect to correct ACTIVE mission progress
            // We cast prisma.missionProgress to any to bypass stale type issues in the editor
            const progress = await (prisma.missionProgress as any).findFirst({
                where: {
                    userId: payload.userId,
                    missionId,
                    status: "ACTIVE"
                },
                include: { mission: true }
            });

            if (progress && !progress.completed) {
                // Atomic update to prevent double completion if race condition
                const updated = await (prisma.missionProgress as any).updateMany({
                    where: {
                        id: progress.id,
                        status: "ACTIVE" // Ensure it's still active
                    },
                    data: {
                        completed: true,
                        completedAt: new Date(),
                        status: "COMPLETED"
                    }
                });

                if (updated.count > 0) {
                    // Use casting to satisfy the compiler while the TS server is out of sync
                    const mission = (progress as any).mission;

                    // Award XP
                    await prisma.user.update({
                        where: { id: payload.userId },
                        data: { totalXp: { increment: mission.xpReward } }
                    });

                    // Log transaction
                    await prisma.xPTransaction.create({
                        data: {
                            userId: payload.userId,
                            amount: mission.xpReward,
                            source: "mission",
                            referenceId: progress.id,
                            note: `Completed mission: ${mission.title}`
                        }
                    });

                    return successResponse({ completed: true, xpAwarded: mission.xpReward });
                }
            }
        }

        return successResponse({ completed: false });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Complete mission error:", error);
        return errorResponse("Internal server error", 500);
    }
}
