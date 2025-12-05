/**
 * Script to assign default profile pictures to users who don't have one
 * Run this once to populate existing users with default PFPs
 */

import { PrismaClient } from "@prisma/client";
import { getDefaultPfpForUser } from "../lib/pfp-utils.js";

const prisma = new PrismaClient();

async function assignDefaultPfps() {
    console.log("🔍 Finding users without profile pictures...");

    const usersWithoutPfp = await prisma.user.findMany({
        where: {
            OR: [
                { image: null },
                { image: "" }
            ]
        },
        select: {
            id: true,
            username: true,
            image: true
        }
    });

    console.log(`📊 Found ${usersWithoutPfp.length} users without profile pictures`);

    for (const user of usersWithoutPfp) {
        const defaultPfp = getDefaultPfpForUser(user.id);

        await prisma.user.update({
            where: { id: user.id },
            data: { image: defaultPfp }
        });

        console.log(`✅ Assigned ${defaultPfp} to ${user.username}`);
    }

    console.log("✨ Default profile pictures assigned successfully!");
}

assignDefaultPfps()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
