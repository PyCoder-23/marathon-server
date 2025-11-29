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
            // Logic to mark complete is in checkAllActiveMissions usually, 
            // but here we can force update if checkMissionCompletion returns true 
            // but DB isn't updated yet (depending on how we structure the utility).

            // For now, let's assume the utility is pure check, and we do the update here
            // OR reuse the logic from checkAllActiveMissions.

            // Let's implement the update here for the specific mission
            const progress = await prisma.missionProgress.findUnique({
                where: {
                    userId_missionId: {
                        userId: payload.userId,
                        missionId,
                    }
                },
                include: { mission: true }
            });

            if (progress && !progress.completed) {
                await prisma.missionProgress.update({
                    where: { id: progress.id },
                    data: { completed: true, completedAt: new Date() }
                });

                // Award XP
                await prisma.user.update({
                    where: { id: payload.userId },
                    data: { totalXp: { increment: progress.mission.xpReward } }
                });

                // Log transaction
                await prisma.xPTransaction.create({
                    data: {
                        userId: payload.userId,
                        amount: progress.mission.xpReward,
                        source: "mission",
                        referenceId: progress.id,
                        note: `Completed mission: ${progress.mission.title}`
                    }
                });

                return successResponse({ completed: true, xpAwarded: progress.mission.xpReward });
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
