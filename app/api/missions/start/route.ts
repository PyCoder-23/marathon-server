import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { missionId } = body;

        if (!missionId) {
            return errorResponse("Mission ID is required", 400);
        }

        // 1. Check if an ACTIVE mission of this ID already exists for the user
        // Cast to any to bypass stale Prisma types in editor
        const existingActive = await (prisma.missionProgress as any).findFirst({
            where: {
                userId: payload.userId,
                missionId,
                status: "ACTIVE"
            }
        });

        if (existingActive) {
            return errorResponse("Mission is already active", 400);
        }

        // 2. Fetch current user stats for Snapshot
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                totalMinutes: true,
                streakDays: true,
            }
        });

        // Count valid sessions for snapshot
        const sessionCount = await prisma.session.count({
            where: {
                userId: payload.userId,
                durationMin: { gte: 25 },
                completed: true
            }
        });

        // 3. Create NEW MissionProgress with Status=ACTIVE and Snapshots
        const progress = await (prisma.missionProgress as any).create({
            data: {
                userId: payload.userId,
                missionId,
                status: "ACTIVE",
                completed: false,
                progress: 0,
                startTotalMinutes: user?.totalMinutes || 0,
                startStreak: user?.streakDays || 0,
                startSessionCount: sessionCount
            }
        });

        return successResponse({ progress });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Start mission error:", error);
        return errorResponse("Internal server error", 500);
    }
}
