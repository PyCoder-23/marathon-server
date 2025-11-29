import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const admin = await requireAdmin();
        const body = await req.json();
        const { userId, banDurationDays, reason } = body;

        if (!userId) {
            return errorResponse("User ID is required", 400);
        }

        let bannedUntil = null;
        if (banDurationDays) {
            bannedUntil = new Date();
            bannedUntil.setDate(bannedUntil.getDate() + banDurationDays);
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
            data: { bannedUntil }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: admin.userId,
                adminName: adminUser.username,
                userId: userId, // Target user being acted upon
                action: bannedUntil ? "BAN_USER" : "UNBAN_USER",
                details: `${bannedUntil ? 'Banned' : 'Unbanned'} user ${user.username}. Reason: ${reason}`,
            }
        });

        return successResponse({ success: true, bannedUntil });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) {
            return errorResponse("Forbidden", 403);
        }
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Ban user error:", error);
        return errorResponse("Internal server error", 500);
    }
}
