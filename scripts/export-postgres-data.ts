/**
 * Export PostgreSQL Data to JSON
 * Run this BEFORE switching to SQLite to preserve all data
 * 
 * Usage: npx tsx scripts/export-postgres-data.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportData() {
    console.log("🚀 Starting PostgreSQL data export...");

    try {
        // Export all data
        const data = {
            users: await prisma.user.findMany(),
            squads: await prisma.squad.findMany(),
            sessions: await prisma.session.findMany(),
            xpTransactions: await prisma.xPTransaction.findMany(),
            missions: await prisma.mission.findMany(),
            missionProgress: await prisma.missionProgress.findMany(),
            shopItems: await prisma.shopItem.findMany(),
            userItems: await prisma.userItem.findMany(),
            coinTransactions: await prisma.coinTransaction.findMany(),
            events: await prisma.event.findMany(),
            tasks: await prisma.task.findMany(),
            weeklyWinners: await prisma.weeklyWinner.findMany(),
            monthlyWinners: await prisma.monthlyWinner.findMany(),
            userWeeklyWinners: await prisma.userWeeklyWinner.findMany(),
            userMonthlyWinners: await prisma.userMonthlyWinner.findMany(),
            auditLogs: await prisma.auditLog.findMany(),
        };

        // Create backup directory
        const backupDir = path.join(process.cwd(), "backups");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // Save to JSON file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `postgres-backup-${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        console.log("✅ Data exported successfully!");
        console.log(`📁 File: ${filepath}`);
        console.log("\n📊 Export Summary:");
        console.log(`   Users: ${data.users.length}`);
        console.log(`   Squads: ${data.squads.length}`);
        console.log(`   Sessions: ${data.sessions.length}`);
        console.log(`   XP Transactions: ${data.xpTransactions.length}`);
        console.log(`   Missions: ${data.missions.length}`);
        console.log(`   Mission Progress: ${data.missionProgress.length}`);
        console.log(`   Shop Items: ${data.shopItems.length}`);
        console.log(`   User Items: ${data.userItems.length}`);
        console.log(`   Coin Transactions: ${data.coinTransactions.length}`);
        console.log(`   Events: ${data.events.length}`);
        console.log(`   Tasks: ${data.tasks.length}`);
        console.log(`   Weekly Winners: ${data.weeklyWinners.length}`);
        console.log(`   Monthly Winners: ${data.monthlyWinners.length}`);
        console.log(`   User Weekly Winners: ${data.userWeeklyWinners.length}`);
        console.log(`   User Monthly Winners: ${data.userMonthlyWinners.length}`);
        console.log(`   Audit Logs: ${data.auditLogs.length}`);

        return filepath;
    } catch (error) {
        console.error("❌ Export failed:", error);
        throw error;
    }
}

exportData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
