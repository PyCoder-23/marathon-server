import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "All fields required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
