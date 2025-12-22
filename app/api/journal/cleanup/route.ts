import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

/**
 * Monthly cleanup endpoint - deletes journal entries older than current month
 * Should be called via cron job on the 1st of each month
 */
export async function POST(req: Request) {
    try {
        await requireAdmin(); // Only admins can trigger cleanup

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const startOfCurrentMonth = `${currentMonth}-01`;

        // Delete all entries from previous months (date < start of this month)
        const result = await prisma.journalEntry.deleteMany({
            where: {
                date: {
                    lt: startOfCurrentMonth
                }
            }
        });

        console.log(`🧹 Journal cleanup: Deleted ${result.count} entries from previous months`);

        return successResponse({
            deleted: result.count,
            currentMonth
        });
    } catch (error: any) {
        if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Journal cleanup error:", error);
        return errorResponse("Internal server error", 500);
    }
}
