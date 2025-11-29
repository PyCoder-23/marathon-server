import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding...");

    // 1. Create Squads
    const squadsData = [
        { name: "Alpha Team", slogan: "The elite vanguard." },
        { name: "Byte Blasters", slogan: "Strength in numbers." },
        { name: "Omega Ops", slogan: "The final word." },
        { name: "Delta Force", slogan: "Swift and silent." },
    ];

    for (const s of squadsData) {
        await prisma.squad.upsert({
            where: { name: s.name },
            update: {},
            create: s,
        });
    }
    console.log("Squads seeded.");

    // 2. Create Admin User
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@marathon.com" },
        update: {},
        create: {
            email: "admin@marathon.com",
            username: "Commander",
            passwordHash: adminPassword,
            isAdmin: true,
            discordHandle: "Commander#0001",
            squad: { connect: { name: "Alpha Team" } },
        },
    });
    console.log("Admin seeded.");

    // 3. Create Demo Missions
    const missionsData = [
        {
            title: "First Steps",
            description: "Complete your first 25-minute session.",
            criteria: "Complete 1 session",
            type: "DAILY",
            difficulty: "EASY",
            xpReward: 50,
            active: true
        },
        {
            title: "Deep Focus",
            description: "Complete 4 sessions in one day.",
            criteria: "Complete 4 sessions",
            type: "DAILY",
            difficulty: "HARD",
            xpReward: 200,
            active: true
        },
        {
            title: "Weekend Warrior",
            description: "Study for 5 hours on a Saturday.",
            criteria: "Study for 300 minutes",
            type: "WEEKLY",
            difficulty: "MEDIUM",
            xpReward: 150,
            active: true
        },
    ];

    for (const m of missionsData) {
        await prisma.mission.create({
            data: m,
        });
    }
    console.log("Missions seeded.");

    // 4. Create Demo Users
    const demoUsers = [
        { username: "CyberNinja", email: "ninja@test.com", squad: "Alpha Team" },
        { username: "NeonRunner", email: "runner@test.com", squad: "Byte Blasters" },
        { username: "CodeWraith", email: "wraith@test.com", squad: "Omega Ops" },
        { username: "DataDrifter", email: "drifter@test.com", squad: "Delta Force" },
    ];

    for (const u of demoUsers) {
        const pw = await hash("password", 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                username: u.username,
                passwordHash: pw,
                squad: { connect: { name: u.squad } },
                totalXp: Math.floor(Math.random() * 1000),
                totalMinutes: Math.floor(Math.random() * 2000),
            },
        });
    }
    console.log("Demo users seeded.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
