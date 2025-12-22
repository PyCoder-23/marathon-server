import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
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

        // Fetch all Hall of Fame entries with user/squad details
        const entries = await prisma.hallOfFameWinner.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        image: true
                    }
                },
                squad: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return successResponse({ entries });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("List HOF entries error:", error);
        return errorResponse("Internal server error", 500);
    }
}
