import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { subjectTag } = body;

        // Check if user already has an active session
        const existingSession = await prisma.session.findFirst({
            where: {
                userId: payload.userId,
                completed: false,
            },
        });

        if (existingSession) {
            return errorResponse("You already have an active session. Please stop it before starting a new one.", 400);
        }

        // Create new session
        const session = await prisma.session.create({
            data: {
                userId: payload.userId,
                startTs: new Date(),
                endTs: new Date(), // Will be updated when session ends
                durationMin: 0,
                completed: false,
                source: "web",
                subjectTag: subjectTag || null,
            },
        });

        return successResponse({ sessionId: session.id, startTs: session.startTs });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Start session error:", error);
        return errorResponse("Internal server error", 500);
    }
}
