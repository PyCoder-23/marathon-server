import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const admin = await requireAdmin();
        const body = await req.json();
        const { userId, amount, reason } = body;

        if (!userId || amount === undefined) {
            return errorResponse("User ID and amount are required", 400);
        }

        // Fetch admin user to get username
        const adminUser = await prisma.user.findUnique({
            where: { id: admin.userId },
            select: { username: true }
        });

        if (!adminUser) {
            return errorResponse("Admin user not found", 404);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: { totalXp: { increment: amount } }
        });

        // Create transaction
        await prisma.xPTransaction.create({
            data: {
                userId,
                amount,
                source: "admin",
                note: reason || "Admin adjustment",
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: admin.userId,
                adminName: adminUser.username,
                userId: userId, // Target user being acted upon
                action: "ADJUST_XP",
                details: `Adjusted XP for ${user.username} by ${amount}. Reason: ${reason}`,
            }
        });

        return successResponse({ success: true, newTotal: user.totalXp });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) {
            return errorResponse("Forbidden", 403);
        }
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Adjust XP error:", error);
        return errorResponse("Internal server error", 500);
    }
}
