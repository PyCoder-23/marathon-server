import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user || !user.pendingEmail) {
            return NextResponse.json({ error: "No pending email change" }, { status: 400 });
        }

        if (!user.verificationCode || !user.verificationCodeExpires) {
            return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
        }

        if (new Date() > new Date(user.verificationCodeExpires)) {
            return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
        }

        if (user.verificationCode !== code) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        // Update email and clear pending fields
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                verificationCode: null,
                verificationCodeExpires: null
            } as any
        });

        return NextResponse.json({
            success: true,
            message: "Email updated successfully"
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Verify email change error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
