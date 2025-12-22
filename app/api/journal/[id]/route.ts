
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, successResponse } from "@/lib/api-helpers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const payload = await requireAuth();
        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const existingEntry = await prisma.journalEntry.findUnique({
            where: { id }
        });

        if (!existingEntry || existingEntry.userId !== payload.userId) {
            return errorResponse("Entry not found or unauthorized", 404);
        }

        const updatedEntry = await prisma.journalEntry.update({
            where: { id },
            data: body
        });

        return successResponse(updatedEntry);

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Update journal entry error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const payload = await requireAuth();
        const { id } = await params;

        // Verify ownership
        const existingEntry = await prisma.journalEntry.findUnique({
            where: { id }
        });

        if (!existingEntry || existingEntry.userId !== payload.userId) {
            return errorResponse("Entry not found or unauthorized", 404);
        }

        await prisma.journalEntry.delete({
            where: { id }
        });

        return successResponse({ message: "Entry deleted" });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Delete journal entry error:", error);
        return errorResponse("Internal server error", 500);
    }
}
