import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

/**
 * Admin endpoint to manually add winners to Hall of Fame
 * POST /api/admin/hall-of-fame/add-winner
 * 
 * Body:
 * {
 *   type: "weekly_user" | "monthly_user" | "weekly_squad" | "monthly_squad",
 *   userId?: string,  // For user winners
 *   squadId?: string, // For squad winners
 *   period: string,   // e.g. "2024-12" for monthly, "2024-50" for weekly
 *   totalXp: number
 * }
 */
export async function POST(req: Request) {
    try {
        const adminPayload = await requireAdmin();
        const body = await req.json();
        const { type, userId, squadId, period, totalXp } = body;

        if (!type || !period || totalXp === undefined) {
            return errorResponse("Missing required fields: type, period, totalXp", 400);
        }

        let result;

        switch (type) {
            case "weekly_user":
                if (!userId) return errorResponse("userId required for weekly_user", 400);
                result = await prisma.userWeeklyWinner.upsert({
                    where: {
                        week_userId: {
                            week: period,
                            userId: userId,
                        },
                    },
                    create: {
                        week: period,
                        userId: userId,
                        totalXp: parseInt(totalXp),
                    },
                    update: {
                        totalXp: parseInt(totalXp),
                    },
                });
                break;

            case "monthly_user":
                if (!userId) return errorResponse("userId required for monthly_user", 400);
                result = await prisma.userMonthlyWinner.upsert({
                    where: {
                        month_userId: {
                            month: period,
                            userId: userId,
                        },
                    },
                    create: {
                        month: period,
                        userId: userId,
                        totalXp: parseInt(totalXp),
                    },
                    update: {
                        totalXp: parseInt(totalXp),
                    },
                });
                break;

            case "weekly_squad":
                if (!squadId) return errorResponse("squadId required for weekly_squad", 400);
                result = await prisma.weeklyWinner.upsert({
                    where: {
                        week_squadId: {
                            week: period,
                            squadId: squadId,
                        },
                    },
                    create: {
                        week: period,
                        squadId: squadId,
                        totalXp: parseInt(totalXp),
                    },
                    update: {
                        totalXp: parseInt(totalXp),
                    },
                });
                break;

            case "monthly_squad":
                if (!squadId) return errorResponse("squadId required for monthly_squad", 400);
                result = await prisma.monthlyWinner.upsert({
                    where: {
                        month_squadId: {
                            month: period,
                            squadId: squadId,
                        },
                    },
                    create: {
                        month: period,
                        squadId: squadId,
                        totalXp: parseInt(totalXp),
                    },
                    update: {
                        totalXp: parseInt(totalXp),
                    },
                });
                break;

            default:
                return errorResponse("Invalid type. Must be: weekly_user, monthly_user, weekly_squad, or monthly_squad", 400);
        }

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: adminPayload.userId,
                adminName: adminPayload.username || "Admin",
                action: "ADD_HALL_OF_FAME_WINNER",
                details: `Added ${type} winner for period ${period}: ${userId || squadId} with ${totalXp} XP`,
            },
        });

        return successResponse({ winner: result, message: "Winner added to Hall of Fame successfully!" });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) return errorResponse("Forbidden", 403);
        console.error("Add Hall of Fame winner error:", error);
        return errorResponse("Internal server error", 500);
    }
}
