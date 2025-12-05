import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();
        const tasks = await prisma.task.findMany({
            where: { userId: payload.userId },
            orderBy: [
                { completed: "asc" },
                { order: "asc" },
                { createdAt: "desc" }
            ]
        });
        return NextResponse.json({ tasks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();

        if (!body.title) return NextResponse.json({ error: "Title required" }, { status: 400 });

        const task = await prisma.task.create({
            data: {
                userId: payload.userId,
                title: body.title,
                order: body.order || 0
            }
        });

        return NextResponse.json({ task });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
