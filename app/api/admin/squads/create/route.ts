import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, errorResponse, successResponse } from "@/lib/api-helpers";

export async function POST(req: Request) {
    try {
        const admin = await requireAdmin();
        const body = await req.json();
        const { name, description, slogan, bannerUrl } = body;

        if (!name) {
            return errorResponse("Squad name is required", 400);
        }

        // Fetch admin user to get username
        const adminUser = await prisma.user.findUnique({
            where: { id: admin.userId },
            select: { username: true }
        });

        if (!adminUser) {
            return errorResponse("Admin user not found", 404);
        }

        const squad = await prisma.squad.create({
            data: {
                name,
                description: description || "",
                slogan,
                bannerUrl,
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                adminId: admin.userId,
                adminName: adminUser.username,
                userId: admin.userId, // No target user for squad creation
                action: "CREATE_SQUAD",
                details: `Created squad: ${name}`,
            }
        });

        return successResponse({ squad });
    } catch (error: any) {
        if (error.message.includes("Forbidden")) {
            return errorResponse("Forbidden", 403);
        }
        if (error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        console.error("Create squad error:", error);
        return errorResponse("Internal server error", 500);
    }
}
