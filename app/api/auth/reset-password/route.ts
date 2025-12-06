import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const payload = await verifyToken(token);

        if (!payload || payload.purpose !== "password_reset") {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const passwordHash = await hashPassword(newPassword);

        console.log(`[Reset Password] Updating password for user: ${payload.userId}`);

        await prisma.user.update({
            where: { id: payload.userId },
            data: { passwordHash }
        });

        console.log(`[Reset Password] Password updated successfully for user: ${payload.userId}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
