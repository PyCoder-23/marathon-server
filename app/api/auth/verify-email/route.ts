import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: "Code required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ success: true, message: "Already verified" });
        }

        if (user.verificationCode !== code) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 });
        }

        if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
            return NextResponse.json({ error: "Code expired" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationCodeExpires: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
