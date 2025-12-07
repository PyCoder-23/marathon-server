import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";
import { cache, cacheKey, CacheTTL } from "@/lib/cache";

export async function GET() {
    try {
        await requireAuth();

        // ✅ Check cache first
        const key = cacheKey('squads', 'all');
        const cached = cache.get(key);
        if (cached) {
            return successResponse(cached);
        }

        // ✅ Get squads without loading all members
        const squads = await prisma.squad.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                slogan: true,
                bannerUrl: true,
            }
        });

        // ✅ Get aggregated stats in parallel for ALL squads at once
        const statsPromises = squads.map((squad: any) =>
            prisma.user.aggregate({
                where: { squadId: squad.id },
                _sum: {
                    totalXp: true,
                    totalMinutes: true,
                },
                _count: true
            })
        );

        const allStats = await Promise.all(statsPromises);

        // ✅ Combine squad data with stats
        const squadsWithStats = squads.map((squad: any, index: number) => {
            const stats = allStats[index];
            const totalXp = stats._sum.totalXp || 0;
            const totalMinutes = stats._sum.totalMinutes || 0;
            const memberCount = stats._count;
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

        const result = { squads: rankedSquads };

        // ✅ Cache for 2 minutes
        cache.set(key, result, CacheTTL.MEDIUM);

        return successResponse(result);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get squads error:", error);
        return errorResponse("Internal server error", 500);
    }
}
