
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
        select: { id: true, email: true, username: true, isVerified: true }
    });
    console.log("Users found:", users);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
