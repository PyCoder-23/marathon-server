/**
 * Import Data to SQLite from PostgreSQL backup
 * Run this AFTER migrating to SQLite
 * 
 * Usage: npx tsx scripts/import-to-sqlite.ts backups/postgres-backup-TIMESTAMP.json
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function importData(backupFile: string) {
    console.log("🚀 Starting data import to SQLite...");

    try {
        // Read backup file
        const filepath = path.join(process.cwd(), backupFile);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Backup file not found: ${filepath}`);
        }

        const data = JSON.parse(fs.readFileSync(filepath, "utf-8"));
        console.log("📖 Backup file loaded successfully");

        // Import in correct order (respecting foreign key constraints)

        // 1. Squads (no dependencies)
        console.log("\n📦 Importing Squads...");
        for (const squad of data.squads) {
            const existing = await prisma.squad.findUnique({ where: { id: squad.id } });
            if (!existing) {
                await prisma.squad.create({ data: squad });
            }
        }
        console.log(`✅ Imported ${data.squads.length} squads`);

        // 2. Users (depends on squads)
        console.log("\n👥 Importing Users...");
        for (const user of data.users) {
            const existing = await prisma.user.findUnique({ where: { id: user.id } });
            if (!existing) {
                await prisma.user.create({ data: user });
            }
        }
        console.log(`✅ Imported ${data.users.length} users`);

        // 3. Sessions (depends on users)
        console.log("\n⏱️  Importing Sessions...");
        for (const session of data.sessions) {
            const existing = await prisma.session.findUnique({ where: { id: session.id } });
            if (!existing) {
                await prisma.session.create({ data: session });
            }
        }
        console.log(`✅ Imported ${data.sessions.length} sessions`);

        // 4. XP Transactions (depends on users)
        console.log("\n💎 Importing XP Transactions...");
        for (const xp of data.xpTransactions) {
            const existing = await prisma.xPTransaction.findUnique({ where: { id: xp.id } });
            if (!existing) {
                await prisma.xPTransaction.create({ data: xp });
            }
        }
        console.log(`✅ Imported ${data.xpTransactions.length} XP transactions`);

        // 5. Missions (no dependencies)
        console.log("\n🎯 Importing Missions...");
        for (const mission of data.missions) {
            const existing = await prisma.mission.findUnique({ where: { id: mission.id } });
            if (!existing) {
                await prisma.mission.create({ data: mission });
            }
        }
        console.log(`✅ Imported ${data.missions.length} missions`);

        // 6. Mission Progress (depends on users and missions)
        console.log("\n📊 Importing Mission Progress...");
        for (const progress of data.missionProgress) {
            await prisma.missionProgress.create({ data: progress });
        }
        console.log(`✅ Imported ${data.missionProgress.length} mission progress records`);

        // 7. Shop Items (no dependencies)
        console.log("\n🛍️  Importing Shop Items...");
        for (const item of data.shopItems) {
            await prisma.shopItem.create({ data: item });
        }
        console.log(`✅ Imported ${data.shopItems.length} shop items`);

        // 8. User Items (depends on users and shop items)
        console.log("\n🎨 Importing User Items...");
        for (const userItem of data.userItems) {
            await prisma.userItem.create({ data: userItem });
        }
        console.log(`✅ Imported ${data.userItems.length} user items`);

        // 9. Coin Transactions (depends on users)
        console.log("\n🪙 Importing Coin Transactions...");
        for (const coin of data.coinTransactions) {
            await prisma.coinTransaction.create({ data: coin });
        }
        console.log(`✅ Imported ${data.coinTransactions.length} coin transactions`);

        // 10. Events (no dependencies)
        console.log("\n📅 Importing Events...");
        for (const event of data.events) {
            await prisma.event.create({ data: event });
        }
        console.log(`✅ Imported ${data.events.length} events`);

        // 11. Tasks (depends on users)
        console.log("\n✅ Importing Tasks...");
        for (const task of data.tasks) {
            await prisma.task.create({ data: task });
        }
        console.log(`✅ Imported ${data.tasks.length} tasks`);

        // 12. Hall of Fame Winners
        console.log("\n🏆 Importing Hall of Fame Winners...");
        for (const winner of data.weeklyWinners) {
            await prisma.weeklyWinner.create({ data: winner });
        }
        for (const winner of data.monthlyWinners) {
            await prisma.monthlyWinner.create({ data: winner });
        }
        for (const winner of data.userWeeklyWinners) {
            await prisma.userWeeklyWinner.create({ data: winner });
        }
        for (const winner of data.userMonthlyWinners) {
            await prisma.userMonthlyWinner.create({ data: winner });
        }
        console.log(`✅ Imported all Hall of Fame winners`);

        // 13. Audit Logs (depends on users)
        console.log("\n📝 Importing Audit Logs...");
        for (const log of data.auditLogs) {
            await prisma.auditLog.create({ data: log });
        }
        console.log(`✅ Imported ${data.auditLogs.length} audit logs`);

        console.log("\n🎉 All data imported successfully!");
        console.log("✅ Migration complete!");

    } catch (error) {
        console.error("❌ Import failed:", error);
        throw error;
    }
}

// Get backup file from command line argument
const backupFile = process.argv[2];
if (!backupFile) {
    console.error("❌ Please provide backup file path");
    console.error("Usage: npx tsx scripts/import-to-sqlite.ts backups/postgres-backup-TIMESTAMP.json");
    process.exit(1);
}

importData(backupFile)
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
