import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { itemId, unequipType } = body;
        // If itemId is present -> Equip.
        // If unequipType is present (and itemId null) -> Unequip that slot.

        if (unequipType) {
            // Unequip logic
            const validTypes = ["FRAME", "NAMEPLATE", "BANNER", "BADGE"];
            if (!validTypes.includes(unequipType)) return errorResponse("Invalid type", 400);

            const updateData: any = {};
            if (unequipType === "FRAME") updateData.equippedFrame = null;
            if (unequipType === "NAMEPLATE") updateData.equippedNameplate = null;
            if (unequipType === "BANNER") updateData.equippedBanner = null;
            if (unequipType === "BADGE") updateData.equippedBadge = null;

            await prisma.user.update({
                where: { id: payload.userId },
                data: updateData
            });

            return successResponse({ message: "Unequipped item" });
        }

        if (!itemId) return errorResponse("Item ID required", 400);

        // Equip Logic
        // 1. Check ownership
        const userItem = await prisma.userItem.findUnique({
            where: {
                userId_itemId: {
                    userId: payload.userId,
                    itemId
                }
            },
            include: { item: true }
        });

        if (!userItem) {
            return errorResponse("You do not own this item", 403);
        }

        const item = userItem.item;

        // 2. Determine slot based on type
        const updateData: any = {};
        if (item.type === "FRAME") updateData.equippedFrame = item.cssClass || item.assetUrl; // Prefer CSS class for frames if valid
        else if (item.type === "NAMEPLATE") updateData.equippedNameplate = item.cssClass;
        else if (item.type === "BANNER") updateData.equippedBanner = item.assetUrl || item.cssClass;
        // else if (item.type === "BADGE") updateData.equippedBadge = ...

        // Note: For Frames/Nameplates we store the IDENTIFIER (css class or url) directly on user for fast rendering
        // Alternatively we could store the Item ID and join every time, but denormalizing checks out for performance.

        await prisma.user.update({
            where: { id: payload.userId },
            data: updateData
        });

        return successResponse({ message: "Equipped successfully", item });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Shop equip error:", error);
        return errorResponse("Internal server error", 500);
    }
}
