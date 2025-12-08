import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body.email?.trim();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const allUsers = await prisma.user.findMany({
            select: { id: true, email: true }
        });

        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            // Security: Don't reveal if user exists
            console.log(`[Forgot Password] User not found for email: ${email}`);
            return NextResponse.json({ success: true, message: "If account exists, email sent" });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.user.update({
            where: { id: user.id },
            data: { resetCode, resetCodeExpires } as any
        });

        await sendPasswordResetEmail(email, resetCode);

        return NextResponse.json({ success: true, message: "Code sent" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
