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

        // Find user
        // Find user (Case Insensitive)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: identifier, mode: "insensitive" } },
                    { username: { equals: identifier, mode: "insensitive" } },
                ],
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Check ban status
        if (user.bannedUntil && user.bannedUntil > new Date()) {
            return NextResponse.json({ error: "Account suspended until " + user.bannedUntil.toISOString() }, { status: 403 });
        }

        // Generate Token
        const token = await signToken({ userId: user.id, isAdmin: user.isAdmin });

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

        return response;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
