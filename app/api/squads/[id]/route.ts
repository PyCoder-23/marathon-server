import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        const squad = await prisma.squad.findUnique({
            where: { id },
            include: {
                members: {
                    select: {
                        id: true,
                        username: true,
                        image: true,
                        totalXp: true,
                        totalMinutes: true,
                        streakDays: true,
                        isAdmin: true,
                        equippedFrame: true,
                        equippedNameplate: true,
                    },
                    orderBy: {
                        totalXp: 'desc',
                    },
                    take: 50, // Limit member list
                },
                _count: {
                    select: { members: true },
                },
            },
        });

        if (!squad) {
            return errorResponse("Squad not found", 404);
        }

        // Calculate squad stats
        const totalXp = squad.members.reduce((sum, member) => sum + (member.totalXp || 0), 0);
        const totalMinutes = squad.members.reduce((sum, member) => sum + (member.totalMinutes || 0), 0);

        // Get global rank (simplified for now, ideally cached)
        const allSquads = await prisma.squad.findMany({
            include: {
                members: {
                    select: { totalXp: true }
                }
            }
        });

        const squadScores = allSquads.map(s => ({
            id: s.id,
            score: s.members.reduce((sum, m: any) => sum + (m.totalXp || 0), 0)
        })).sort((a, b) => b.score - a.score);

        const rank = squadScores.findIndex(s => s.id === id) + 1;

        return successResponse({
            squad: {
                ...squad,
                totalXp,
                totalMinutes,
                rank,
            }
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get squad details error:", error);
        return errorResponse("Internal server error", 500);
    }
}
