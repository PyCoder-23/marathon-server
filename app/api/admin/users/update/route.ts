import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const adminPayload = await requireAdmin();
        const body = await req.json();
        const { userId, totalXp, totalMinutes, squadId, coins } = body;

        if (!userId) {
            return errorResponse("User ID is required", 400);
        }

        const updateData: any = {
            totalXp: totalXp !== undefined ? parseInt(totalXp) : undefined,
            totalMinutes: totalMinutes !== undefined ? parseInt(totalMinutes) : undefined,
            coins: coins !== undefined ? parseInt(coins) : undefined,
        };

        if (squadId) {
            updateData.squad = { connect: { id: squadId } };
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: adminPayload.userId,
                adminName: adminPayload.username || "Admin",
                action: "UPDATE_USER_STATS",
                details: `Updated user ${user.username} (XP: ${totalXp}, Min: ${totalMinutes}, Coins: ${coins}, Squad: ${squadId || "No Change"})`,
                userId: userId,
            },
        });

        return successResponse({ user });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) return errorResponse("Forbidden", 403);
        console.error("Update user error:", error);
        return errorResponse("Internal server error", 500);
    }
}
