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

        const { entryId, type } = await req.json();

        if (!entryId) {
            return errorResponse("Entry ID required", 400);
        }

        let deleted = false;

        // If type provided, target specific table
        if (type) {
            const modelMap: Record<string, any> = {
                'monthly_user': prisma.userMonthlyWinner,
                'weekly_user': prisma.userWeeklyWinner,
                'monthly_squad': prisma.monthlyWinner,
                'weekly_squad': prisma.weeklyWinner
            };

            const conversationModel = modelMap[type];
            if (conversationModel) {
                try {
                    await conversationModel.delete({ where: { id: entryId } });
                    deleted = true;
                } catch (e) {
                    // ignore not found
                }
            }
        } else {
            // Try all tables
            const deletions = await Promise.allSettled([
                prisma.userMonthlyWinner.delete({ where: { id: entryId } }),
                prisma.userWeeklyWinner.delete({ where: { id: entryId } }),
                prisma.monthlyWinner.delete({ where: { id: entryId } }),
                prisma.weeklyWinner.delete({ where: { id: entryId } })
            ]);

            deleted = deletions.some(r => r.status === 'fulfilled');
        }

        if (!deleted) {
            return errorResponse("Entry not found or could not be deleted", 404);
        }

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
