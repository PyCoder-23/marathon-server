import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET() {
    try {
        const payload = await requireAuth();

        const activeSession = await prisma.session.findFirst({
            where: {
                userId: payload.userId,
                completed: false,
            },
        });

        if (!activeSession) {
            return successResponse({ session: null });
        }

        return successResponse({ session: activeSession });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get active session error:", error);
        return errorResponse("Internal server error", 500);
    }
}
