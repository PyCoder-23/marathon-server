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

        const { entryId } = await req.json();

        if (!entryId) {
            return errorResponse("Entry ID required", 400);
        }

        // Check if entry exists
        const entry = await prisma.hallOfFameWinner.findUnique({
            where: { id: entryId }
        });

        if (!entry) {
            return errorResponse("Entry does not exist", 404);
        }

        // Delete the entry
        await prisma.hallOfFameWinner.delete({
            where: { id: entryId }
        });

        return successResponse({
            message: "Entry removed from Hall of Fame",
            deletedId: entryId
        });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Delete HOF entry error:", error);
        return errorResponse("Internal server error", 500);
    }
}
