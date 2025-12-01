import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addMissions() {
    console.log("Adding new missions...");

    const newMissions = [
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
            title: "Triple Threat",
            description: "Complete 3 sessions in one day.",
            criteria: "Complete 3 sessions",
            type: "DAILY",
            difficulty: "MEDIUM",
            xpReward: 150,
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
            title: "Power Hour",
            description: "Study for 60 minutes in a single day.",
            criteria: "Study for 60 minutes",
            type: "DAILY",
            difficulty: "EASY",
            xpReward: 100,
            active: true
        },
        {
            title: "Focus Master",
            description: "Study for 2 hours in a single day.",
            criteria: "Study for 120 minutes",
            type: "DAILY",
            difficulty: "MEDIUM",
            xpReward: 180,
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
            title: "Weekly Warmup",
            description: "Complete 5 sessions this week.",
            criteria: "Complete 5 sessions",
            type: "WEEKLY",
            difficulty: "EASY",
            xpReward: 100,
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
            title: "Study Buff",
            description: "Study for 5 hours this week.",
            criteria: "Study for 300 minutes",
            type: "WEEKLY",
            difficulty: "EASY",
            xpReward: 120,
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
            title: "Session Master",
            description: "Complete 50 total sessions.",
            criteria: "Complete 50 sessions",
            type: "LONG_TERM",
            difficulty: "MEDIUM",
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
    ];

    let added = 0;
    let skipped = 0;

    for (const mission of newMissions) {
        try {
            // Check if mission already exists
            const existing = await prisma.mission.findFirst({
                where: {
                    title: mission.title,
                    criteria: mission.criteria
                }
            });

            if (existing) {
                console.log(`⏭️  Skipped: "${mission.title}" (already exists)`);
                skipped++;
            } else {
                await prisma.mission.create({ data: mission });
                console.log(`✅ Added: "${mission.title}"`);
                added++;
            }
        } catch (error) {
            console.error(`❌ Error adding "${mission.title}":`, error);
        }
    }

    console.log(`\n✨ Done! Added ${added} missions, skipped ${skipped} existing missions.`);
}

addMissions()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
