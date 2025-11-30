import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { username, email, image, password } = body;

        // Validation
        if (username && username.length < 3) {
            return errorResponse("Username must be at least 3 characters", 400);
        }

        // Check uniqueness if changing username/email
        if (username || email) {
            const existing = await prisma.user.findFirst({
                where: {
                    OR: [
                        username ? { username: { equals: username, mode: 'insensitive' }, NOT: { id: payload.userId } } : {},
                        email ? { email: { equals: email, mode: 'insensitive' }, NOT: { id: payload.userId } } : {},
                    ]
                }
            });

            if (existing) {
                if (existing.username.toLowerCase() === username?.toLowerCase()) {
                    return errorResponse("Username already taken", 400);
                }
                if (existing.email.toLowerCase() === email?.toLowerCase()) {
                    return errorResponse("Email already taken", 400);
                }
            }
        }

        // Prepare update data
        const data: any = {};
        if (username) data.username = username;
        if (email) data.email = email;
        if (image !== undefined) data.image = image; // Allow clearing image with null/empty?

        // If password update is needed, we'd hash it here. 
        // For now, let's assume this endpoint is just for profile info.
        // If user wants to change password, that's usually a separate sensitive flow.

        const user = await prisma.user.update({
            where: { id: payload.userId },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                image: true,
                totalXp: true,
                isAdmin: true,
                squadId: true,
            }
        });

        return successResponse({ user });
    } catch (error: any) {
        if (error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
        console.error("Update profile error:", error);
        return errorResponse("Internal server error", 500);
    }
}
