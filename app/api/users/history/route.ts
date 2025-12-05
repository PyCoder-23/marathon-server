import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
    try {
        const payload = await requireAuth();
        const userId = payload.userId;

        const transactions = await prisma.xPTransaction.findMany({
            where: {
                userId,
                source: "mission",
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100, // Limit to last 100 entries for performance
            select: {
                id: true,
                amount: true,
                note: true,
                createdAt: true,
            }
        });

        return NextResponse.json({ history: transactions });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Get history error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
