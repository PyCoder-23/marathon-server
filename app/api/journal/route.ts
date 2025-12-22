
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();
        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");

        if (!date) {
            return errorResponse("Date is required", 400);
        }

        const entries = await prisma.journalEntry.findMany({
            where: {
                userId: payload.userId,
                date: date
            }
        });

        return successResponse({ entries });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Get journal entries error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const dateStr = body.date || new Date().toISOString().split('T')[0];

        // Check if user already earned XP for journal today
        const existingEntries = await prisma.journalEntry.findFirst({
            where: {
                userId: payload.userId,
                date: dateStr
            }
        });

        const isFirstEntry = !existingEntries;
        const xpAmount = 25;

        const result = await prisma.$transaction(async (tx) => {
            const entry = await tx.journalEntry.create({
                data: {
                    userId: payload.userId,
                    ...body
                }
            });

            if (isFirstEntry) {
                // Award XP
                await tx.user.update({
                    where: { id: payload.userId },
                    data: { totalXp: { increment: xpAmount } }
                });

                // Log XP transaction
                await tx.xPTransaction.create({
                    data: {
                        userId: payload.userId,
                        amount: xpAmount,
                        source: "journal",
                        referenceId: entry.id,
                        note: `First journal entry of the day: ${dateStr}`
                    }
                });
            }

            return entry;
        });

        return successResponse(result);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Create journal entry error:", error);
        return errorResponse("Internal server error", 500);
    }
}
