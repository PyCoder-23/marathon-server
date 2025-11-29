import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, username, password, discordHandle } = body;

        // 1. Validation
        if (!email || !username || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check uniqueness
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                    discordHandle ? { discordHandle } : {},
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists (email, username, or discord handle)" },
                { status: 409 }
            );
        }

        // 2. Squad Assignment (Balanced)
        const squads = await prisma.squad.findMany({
            include: { _count: { select: { members: true } } },
        });

        if (squads.length === 0) {
            return NextResponse.json(
                { error: "No squads available. Contact admin." },
                { status: 500 }
            );
        }

        // Sort by member count (asc), then by createdAt (asc) for stability
        squads.sort((a, b) => {
            if (a._count.members !== b._count.members) {
                return a._count.members - b._count.members;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const assignedSquad = squads[0];

        // 3. Create User
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
                discordHandle,
                squadId: assignedSquad.id,
                totalXp: 10, // Signup bonus
            },
        });

        // 4. Create Signup Bonus Transaction
        await prisma.xPTransaction.create({
            data: {
                userId: user.id,
                amount: 10,
                source: "admin",
                note: "Signup bonus",
            },
        });

        // 5. Generate Token
        const token = await signToken({ userId: user.id, isAdmin: user.isAdmin });

        // 6. Return Response
        const response = NextResponse.json({
            ok: true,
            userId: user.id,
            squadName: assignedSquad.name,
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
