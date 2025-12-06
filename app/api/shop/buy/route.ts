import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { itemId } = body;

        if (!itemId) {
            return errorResponse("Item ID is required", 400);
        }

        const item = await prisma.shopItem.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return errorResponse("Item not found", 404);
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        });

        if (!user) return errorResponse("User not found", 404);

        if (user.coins < item.price) {
            return errorResponse("Insufficient coins", 400);
        }

        // Special handling for CONSUMABLES (like FREEZE) 
        // We don't verify if they "own" it in UserItem (inventory), we just increment a counter
        if (item.type === "FREEZE") {
            if (user.streakFreezes >= 3) {
                return errorResponse("You can only hold 3 streak freezes at a time", 400);
            }

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        coins: { decrement: item.price },
                        streakFreezes: { increment: 1 }
                    }
                }),
                prisma.coinTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -item.price,
                        type: "shop_purchase",
                        description: `Purchased ${item.name}`
                    }
                })
            ]);

            return successResponse({ message: "Streak Freeze purchased!", newBalance: user.coins - item.price });
        }

        if (item.type === "PARDON") {
            if (user.missionPardons >= 3) {
                return errorResponse("You can only hold 3 mission pardons at a time", 400);
            }

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        coins: { decrement: item.price },
                        missionPardons: { increment: 1 }
                    }
                }),
                prisma.coinTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -item.price,
                        type: "shop_purchase",
                        description: `Purchased ${item.name}`
                    }
                })
            ]);

            return successResponse({ message: "Mission Pardon purchased!", newBalance: user.coins - item.price });
        }

        // Normal Items (Frames, etc.) - Check duplicate
        const existing = await prisma.userItem.findFirst({
            where: { userId: user.id, itemId: item.id }
        });

        if (existing) {
            return errorResponse("You already own this item", 400);
        }

        // Purchase Transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { coins: { decrement: item.price } }
            }),
            prisma.userItem.create({
                data: {
                    userId: user.id,
                    itemId: item.id
                }
            }),
            prisma.coinTransaction.create({
                data: {
                    userId: user.id,
                    amount: -item.price,
                    type: "shop_purchase",
                    description: `Purchased ${item.name}`
                }
            })
        ]);

        return successResponse({ message: "Item purchased successfully!", newBalance: user.coins - item.price });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Shop buy error:", error);
        return errorResponse("Internal server error", 500);
    }
}
