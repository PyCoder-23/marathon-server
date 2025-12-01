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
            title: "Consistency Builder",
            description: "Complete at least 2 sessions today.",
            criteria: "Complete 2 sessions",
            type: "DAILY",
            difficulty: "EASY",
            xpReward: 75,
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
            title: "Marathon Runner",
            description: "Study for 5 hours in a single day.",
            criteria: "Study for 300 minutes",
            type: "DAILY",
            difficulty: "HARD",
            xpReward: 250,
            active: true
        },
        {
            title: "Weekly Grind",
            description: "Complete 20 sessions this week.",
            criteria: "Complete 20 sessions",
            type: "WEEKLY",
            difficulty: "MEDIUM",
            xpReward: 150,
            active: true
        },
        {
            title: "Time Master",
            description: "Study for 15 hours this week.",
            criteria: "Study for 900 minutes",
            type: "WEEKLY",
            difficulty: "MEDIUM",
            xpReward: 180,
            active: true
        },
        {
            title: "Dedication",
            description: "Study every day for 7 days straight.",
            criteria: "7 day streak",
            type: "WEEKLY",
            difficulty: "HARD",
            xpReward: 300,
            active: true
        },
        {
            title: "Century Club",
            description: "Complete 100 total sessions.",
            criteria: "Complete 100 sessions",
            type: "LONG_TERM",
            difficulty: "MEDIUM",
            xpReward: 500,
            active: true
        },
        {
            title: "Knowledge Seeker",
            description: "Accumulate 100 hours of study time.",
            criteria: "Study for 6000 minutes",
            type: "LONG_TERM",
            difficulty: "HARD",
            xpReward: 1000,
            active: true
        },
        {
            title: "Unstoppable",
            description: "Maintain a 30-day study streak.",
            criteria: "30 day streak",
            type: "LONG_TERM",
            difficulty: "HARD",
            xpReward: 750,
            active: true
        },
        {
            title: "Weekend Warrior",
            description: "Complete 5 sessions on a weekend.",
            criteria: "Complete 5 sessions",
            type: "WEEKLY",
            difficulty: "MEDIUM",
            xpReward: 200,
            active: true
        },
        {
            title: "Early Bird",
            description: "Complete a session before 8 AM.",
            criteria: "Complete 1 session",
            type: "DAILY",
            difficulty: "MEDIUM",
            xpReward: 100,
            active: true
        },
        {
            title: "Night Owl",
            description: "Complete a session after 10 PM.",
            criteria: "Complete 1 session",
            type: "DAILY",
            difficulty: "MEDIUM",
            xpReward: 100,
            active: true
        },
    ];

    for (const m of missionsData) {
        await prisma.mission.upsert({
            where: {
                title_criteria: {
                    title: m.title,
                    criteria: m.criteria
                }
            },
            update: {
                description: m.description,
                type: m.type,
                difficulty: m.difficulty,
                xpReward: m.xpReward,
                active: m.active
            },
            create: m,
        });
    }
    console.log("Missions seeded.");

    // 4. Create Demo Users
    // 4. Create Demo Users - REMOVED
    console.log("Skipping demo users seed.");
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
