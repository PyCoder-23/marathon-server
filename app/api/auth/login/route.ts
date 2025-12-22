import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { identifier, password } = body; // identifier can be email or username

        if (!identifier || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        console.log(`[LOGIN] Attempting login for identifier: ${identifier}`);

        // Find user
        console.log("[LOGIN] Fetching user from DB...");
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                passwordHash: true,
                isAdmin: true,
                bannedUntil: true,
            }
        });
        console.log(`[LOGIN] Fetched ${allUsers.length} users.`);

        const user = allUsers.find(u =>
            u.email.toLowerCase() === identifier.toLowerCase() ||
            u.username.toLowerCase() === identifier.toLowerCase()
        );

        if (!user) {
            console.log("[LOGIN] User not found.");
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        console.log(`[LOGIN] User found: ${user.id}`);

        // Verify password
        console.log("[LOGIN] Verifying password...");
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            console.log("[LOGIN] Invalid password.");
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        console.log("[LOGIN] Password verified.");

        // Check ban status
        if (user.bannedUntil && user.bannedUntil > new Date()) {
            console.log("[LOGIN] User is banned.");
            return NextResponse.json({ error: "Account suspended until " + user.bannedUntil.toISOString() }, { status: 403 });
        }

        // Generate Token
        console.log("[LOGIN] Signing token...");
        const token = await signToken({ userId: user.id, isAdmin: user.isAdmin });
        console.log("[LOGIN] Token signed.");

        // Return Response
        const response = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        console.log("[LOGIN] Login successful.");
        return response;

    } catch (error) {
        console.error("Login critical error:", error);
        return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
