import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const payload = await requireAuth();
        const body = await req.json();

        // Verify ownership
        const existing = await prisma.task.findUnique({ where: { id: params.id } });
        if (!existing || existing.userId !== payload.userId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const task = await prisma.task.update({
            where: { id: params.id },
            data: {
                title: body.title,
                completed: body.completed,
                order: body.order
            }
        });

        return NextResponse.json({ task });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const payload = await requireAuth();

        const existing = await prisma.task.findUnique({ where: { id: params.id } });
        if (!existing || existing.userId !== payload.userId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.task.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
