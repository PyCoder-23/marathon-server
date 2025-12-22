import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { validateEmail } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { newEmail } = body;

        if (!newEmail) {
            return NextResponse.json({ error: "New email is required" }, { status: 400 });
        }

        // Validate email format
        const emailValidation = validateEmail(newEmail);
        if (!emailValidation.valid) {
            return NextResponse.json({ error: emailValidation.error }, { status: 400 });
        }

        // Check if email is already in use
        const existingUser = await prisma.user.findFirst({
            where: { email: newEmail }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Store pending email change
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                pendingEmail: newEmail,
                verificationCode,
                verificationCodeExpires
            } as any
        });

        // Send verification email to NEW email address
        const { sendEmail } = await import("@/lib/email");
        const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1>Verify Your New Email</h1>
            <p>You requested to change your email address. Please verify your new email with the code below:</p>
            <h2 style="color: #3b82f6; letter-spacing: 5px; font-size: 32px;">${verificationCode}</h2>
            <p>This code expires in 15 minutes.</p>
            <p>If you didn't request this change, please ignore this email.</p>
        </div>
        `;

        await sendEmail(newEmail, "Verify Email Change - Marathon Server", html);

        return NextResponse.json({
            success: true,
            message: "Verification code sent to new email"
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Request email change error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
