import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET() {
    try {
        await requireAuth();

        // Get all squads with member counts
        const squads = await prisma.squad.findMany({
            include: {
                _count: {
                    select: { members: true },
                },
                members: {
                    select: {
                        totalXp: true,
                        totalMinutes: true,
                    }
                }
            },
        });

        // Calculate stats for each squad
        const squadsWithStats = squads.map((squad: any) => {
            const totalXp = squad.members.reduce((sum: number, member: any) => sum + member.totalXp, 0);
            const totalMinutes = squad.members.reduce((sum: number, member: any) => sum + member.totalMinutes, 0);
            const memberCount = squad._count.members;

            // Calculate average XP per member (avoid division by zero)
            const averageXp = memberCount > 0 ? Math.floor(totalXp / memberCount) : 0;

            return {
                id: squad.id,
                name: squad.name,
                description: squad.description,
                slogan: squad.slogan,
                bannerUrl: squad.bannerUrl,
                memberCount,
                totalXp,
                averageXp,
                totalMinutes,
            };
        });

        // Sort by total XP (descending) for ranking
        squadsWithStats.sort((a: any, b: any) => b.totalXp - a.totalXp);

        // Add rank
        const rankedSquads = squadsWithStats.map((squad: any, index: number) => ({
            ...squad,
            rank: index + 1,
        }));

        return successResponse({ squads: rankedSquads });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get squads error:", error);
        return errorResponse("Internal server error", 500);
    }
}
