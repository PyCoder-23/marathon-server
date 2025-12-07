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

        // Get current user data to calculate XP difference
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { totalXp: true, username: true }
        });

        if (!currentUser) {
            return errorResponse("User not found", 404);
        }

        const updateData: any = {
            totalXp: totalXp !== undefined ? parseInt(totalXp) : undefined,
            totalMinutes: totalMinutes !== undefined ? parseInt(totalMinutes) : undefined,
            coins: coins !== undefined ? parseInt(coins) : undefined,
        };

        if (squadId) {
            updateData.squad = { connect: { id: squadId } };
        }

        // ✅ Calculate XP difference for transaction
        const xpDifference = totalXp !== undefined ? parseInt(totalXp) - currentUser.totalXp : 0;

        // ✅ Execute update and create XPTransaction if needed
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // ✅ If XP changed, create XPTransaction to reflect in weekly/monthly leaderboards
        if (xpDifference !== 0) {
            await prisma.xPTransaction.create({
                data: {
                    userId,
                    amount: xpDifference,
                    source: "admin",
                    note: `Admin adjustment: ${xpDifference > 0 ? '+' : ''}${xpDifference} XP by ${adminPayload.username || "Admin"}`
                }
            });
        }

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: adminPayload.userId,
                adminName: adminPayload.username || "Admin",
                action: "UPDATE_USER_STATS",
                details: `Updated user ${currentUser.username} (XP: ${totalXp}, Min: ${totalMinutes}, Coins: ${coins}, Squad: ${squadId || "No Change"})`,
                userId: userId,
            },
        });

        // ✅ Invalidate leaderboard cache since XP changed
        if (xpDifference !== 0) {
            const { cache } = await import("@/lib/cache");
            cache.deletePattern('leaderboard');
        }

        return successResponse({ user });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) return errorResponse("Forbidden", 403);
        console.error("Update user error:", error);
        return errorResponse("Internal server error", 500);
    }
}
