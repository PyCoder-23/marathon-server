import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { isAdmin: true }
        });

        if (!user?.isAdmin) {
            return errorResponse("Unauthorized - Admin only", 403);
        }

        const { resetValue } = await req.json();
        const xpValue = resetValue || 10;

        // Reset all users' XP to the specified value
        await prisma.user.updateMany({
            data: {
                totalXp: xpValue
            }
        });

        // Get count of updated users
        const count = await prisma.user.count();

        return successResponse({
            message: `Reset ${count} users' XP to ${xpValue}`,
            count,
            resetValue: xpValue
        });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Reset XP error:", error);
        return errorResponse("Internal server error", 500);
    }
}
