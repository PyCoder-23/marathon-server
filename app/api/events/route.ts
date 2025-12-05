import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(req: Request) {
    try {
        const payload = await requireAuth();
        const { searchParams } = new URL(req.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");

        const whereClause: any = { userId: payload.userId };

        if (start && end) {
            whereClause.start = {
                gte: new Date(start)
            };
            whereClause.end = {
                lte: new Date(end)
            };
            // OR logic for overlapping events might be better, but simple range is okay for now
        }

        const events = await prisma.event.findMany({
            where: whereClause,
            orderBy: { start: "asc" }
        });

        return NextResponse.json({ events });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await requireAuth();
        const body = await req.json();
        const { title, description, start, end, allDay, color } = body;

        if (!title || !start || !end) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const event = await prisma.event.create({
            data: {
                userId: payload.userId,
                title,
                description,
                start: new Date(start),
                end: new Date(end),
                allDay: allDay || false,
                color
            }
        });

        return NextResponse.json({ event });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
