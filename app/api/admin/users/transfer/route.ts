import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const admin = await requireAdmin();
        const body = await req.json();
        const { userId, targetSquadId } = body;

        if (!userId || !targetSquadId) {
            return errorResponse("User ID and Target Squad ID are required", 400);
        }

        // Fetch admin user to get username
        const adminUser = await prisma.user.findUnique({
            where: { id: admin.userId },
            select: { username: true }
        });

        if (!adminUser) {
            return errorResponse("Admin user not found", 404);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { squadId: targetSquadId }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: admin.userId,
                adminName: adminUser.username,
                userId: userId, // Target user being acted upon
                action: "TRANSFER_USER",
                details: `Transferred user ${user.username} to squad ${targetSquadId}`,
            }
        });

        return successResponse({ success: true });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) {
            return errorResponse("Forbidden", 403);
        }
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Transfer user error:", error);
        return errorResponse("Internal server error", 500);
    }
}
