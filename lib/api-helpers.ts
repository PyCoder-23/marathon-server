import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * Get current user from JWT token
 * Returns user payload or null if not authenticated
 */
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return null;
    }

    const payload = await verifyToken(token);
    return payload;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin() {
    const user = await requireAuth();
    if (!user.isAdmin) {
        throw new Error("Forbidden: Admin access required");
    }
    return user;
}

/**
 * Standard error response helper
 */
export function errorResponse(message: string, status: number = 400) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response helper
 */
export function successResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status });
}
