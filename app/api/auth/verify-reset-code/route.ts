import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signResetToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code } = body;
        const email = body.email?.trim();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code required" }, { status: 400 });
        }

        const allUsers = await prisma.user.findMany({
            select: { id: true, email: true, resetCode: true, resetCodeExpires: true }
        });

        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const safeUser = user as any;

        if (safeUser.resetCode !== code) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        if (!safeUser.resetCodeExpires || new Date() > safeUser.resetCodeExpires) {
            return NextResponse.json({ error: "Code expired" }, { status: 400 });
        }

        // Generate temporary reset token
        const resetToken = await signResetToken({ userId: user.id, purpose: "password_reset" });

        // Clear code to prevent reuse
        await prisma.user.update({
            where: { id: user.id },
            data: { resetCode: null, resetCodeExpires: null } as any
        });

        return NextResponse.json({ success: true, token: resetToken });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
