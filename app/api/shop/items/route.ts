import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
    try {
        const payload = await requireAuth();

        // Fetch all shop items
        const items = await prisma.shopItem.findMany({
            orderBy: { price: 'asc' }
        });

        // Fetch user's owned items to mark as purchased
        const userItems = await prisma.userItem.findMany({
            where: { userId: payload.userId },
            select: { itemId: true }
        });

        const ownedIds = new Set(userItems.map(ui => ui.itemId));

        const enrichedItems = items.map(item => ({
            ...item,
            owned: ownedIds.has(item.id)
        }));

        return NextResponse.json({ items: enrichedItems });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Shop list error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
