
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { missionId, progressId } = body;

        if (!missionId && !progressId) {
            return errorResponse("Mission ID or Progress ID required", 400);
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) return errorResponse("User not found", 404);

        // Find progress entry
        const progress = await prisma.missionProgress.findFirst({
            where: progressId
                ? { id: progressId, userId: user.id, completed: false }
                : { missionId, userId: user.id, completed: false }
        });

        if (!progress) return errorResponse("Active mission not found", 404);

        // Logic: Prioritize Pardon, then Coins
        let method = "";

        if (user.missionPardons > 0) {
            method = "PARDON";
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: { missionPardons: { decrement: 1 } }
                }),
                prisma.missionProgress.delete({ where: { id: progress.id } })
            ]);
        } else if (user.coins >= 50) {
            method = "COINS";
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: { coins: { decrement: 50 } }
                }),
                prisma.coinTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -50,
                        type: "mission_withdraw",
                        description: "Withdrew from mission"
                    }
                }),
                prisma.missionProgress.delete({ where: { id: progress.id } })
            ]);
        } else {
            return errorResponse("Insufficient coins (50) or Mission Pardons", 400);
        }

        return successResponse({ message: "Withdrawn successfully", method });

    } catch (error: any) {
        console.error("Withdraw mission error:", error);
        // Ensure strictly JSON response even for 500
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
