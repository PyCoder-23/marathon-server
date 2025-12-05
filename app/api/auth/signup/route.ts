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

        // 2. Squad Assignment (Lowest XP)
        // Assign new user to the squad with the lowest total XP
        // This helps balance competition rather than just member count
        const squads = await prisma.squad.findMany({
            include: {
                members: {
                    select: { totalXp: true }
                }
            },
        });

        if (squads.length === 0) {
            return NextResponse.json(
                { error: "No squads available. Contact admin." },
                { status: 500 }
            );
        }

        // Calculate total XP for each squad and sort by lowest XP first
        const squadsWithXp = squads.map(squad => ({
            ...squad,
            totalXp: squad.members.reduce((sum, member) => sum + member.totalXp, 0)
        }));

        squadsWithXp.sort((a, b) => {
            if (a.totalXp !== b.totalXp) {
                return a.totalXp - b.totalXp; // Lowest XP first
            }
            return a.createdAt.getTime() - b.createdAt.getTime(); // Tie-breaker: oldest squad
        });

        const assignedSquad = squadsWithXp[0];

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
