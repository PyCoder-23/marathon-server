import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const adminPayload = await requireAdmin();
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return errorResponse("User ID is required", 400);
        }

        // Get user info before deleting
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true }
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        // Delete related data first to avoid foreign key constraints
        await prisma.$transaction(async (tx) => {
            // Delete user's mission progress
            await tx.missionProgress.deleteMany({ where: { userId } });

            // Delete user's XP transactions
            await tx.xPTransaction.deleteMany({ where: { userId } });

            // Delete user's sessions
            await tx.session.deleteMany({ where: { userId } });

            // TODO: Re-enable when Prisma models are available
            // Delete user's weekly wins
            // await tx.userWeeklyWinner.deleteMany({ where: { userId } });

            // Delete user's monthly wins
            // await tx.userMonthlyWinner.deleteMany({ where: { userId } });

            // Delete the user
            await tx.user.delete({ where: { id: userId } });
        });

        // Log audit AFTER deletion (don't reference the deleted user)
        await prisma.auditLog.create({
            data: {
                adminId: adminPayload.userId,
                adminName: adminPayload.username || "Admin",
                action: "DELETE_USER",
                details: `Deleted user ${user.username} (${user.email})`,
                userId: null, // Don't reference deleted user
            },
        });

        return successResponse({ success: true, deletedUser: user.username });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) return errorResponse("Forbidden", 403);
        console.error("Delete user error:", error);
        return errorResponse(`Failed to delete user: ${error.message}`, 500);
    }
}
