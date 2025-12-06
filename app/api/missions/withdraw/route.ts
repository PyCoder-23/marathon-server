
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const { missionId } = await req.json();

        if (!missionId) return errorResponse("Mission ID required", 400);

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) return errorResponse("User not found", 404);

        // Find active progress
        const progress = await prisma.missionProgress.findFirst({
            where: { userId: user.id, missionId: missionId, completed: false }
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
        console.error(error);
        return errorResponse("Internal Error", 500);
    }
}
