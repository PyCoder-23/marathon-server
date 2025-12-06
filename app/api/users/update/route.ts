import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { username, email, image, currentPassword, isProfileLocked } = body;

        // 1. Fetch current user to compare
        const currentUser = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!currentUser) return errorResponse("User not found", 404);

        // 2. Check sensitivity
        const isUsernameChanging = username && username !== currentUser.username;
        const isEmailChanging = email && email !== currentUser.email;

        // 3. Verify password if sensitive fields are changing
        if (isUsernameChanging || isEmailChanging) {
            if (!currentPassword) {
                return errorResponse("Current password is required to change username or email", 401);
            }

            const { verifyPassword } = await import("@/lib/auth");
            const isValid = await verifyPassword(currentPassword, currentUser.passwordHash);

            if (!isValid) {
                return errorResponse("Incorrect password", 401);
            }
        }

        // 4. Validation
        if (username && username.length < 3) {
            return errorResponse("Username must be at least 3 characters", 400);
        }

        // 5. Check uniqueness if changing username/email
        if (isUsernameChanging || isEmailChanging) {
            const existing = await prisma.user.findFirst({
                where: {
                    OR: [
                        isUsernameChanging ? { username: { equals: username, mode: 'insensitive' } } : {},
                        isEmailChanging ? { email: { equals: email, mode: 'insensitive' } } : {},
                    ],
                    NOT: { id: payload.userId }
                }
            });

            if (existing) {
                if (isUsernameChanging && existing.username.toLowerCase() === username?.toLowerCase()) {
                    return errorResponse("Username already taken", 400);
                }
                if (isEmailChanging && existing.email.toLowerCase() === email?.toLowerCase()) {
                    return errorResponse("Email already taken", 400);
                }
            }
        }

        // 6. Prepare update data
        const data: { username?: string; email?: string; image?: string; isProfileLocked?: boolean } = {};
        if (username) data.username = username;
        if (email) data.email = email;
        if (image !== undefined) data.image = image;
        if (isProfileLocked !== undefined) data.isProfileLocked = isProfileLocked;

        const updatedUser = await prisma.user.update({
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
                isProfileLocked: true,
            } as any
        });

        return successResponse({ user: updatedUser });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") return errorResponse("Unauthorized", 401);
        console.error("Update profile error:", error);
        return errorResponse("Internal server error", 500);
    }
}
