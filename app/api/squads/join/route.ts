import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { squadId } = body;

        if (!squadId) {
            return errorResponse("Squad ID is required", 400);
        }

        // Check if squad exists
        const squad = await prisma.squad.findUnique({
            where: { id: squadId },
        });

        if (!squad) {
            return errorResponse("Squad not found", 404);
        }

        // Update user's squad
        const user = await prisma.user.update({
            where: { id: payload.userId },
            data: { squadId },
        });

        return successResponse({
            success: true,
            user: {
                id: user.id,
                squadId: user.squadId
            }
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Join squad error:", error);
        return errorResponse("Internal server error", 500);
    }
}
