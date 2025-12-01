import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up time-bound missions...");

    const missionsToDelete = [
        "Weekend Warrior",
        "Early Bird",
        "Night Owl"
    ];

    // Find the IDs of the missions to delete
    const missions = await prisma.mission.findMany({
        where: {
            title: {
                in: missionsToDelete
            }
        },
        select: {
            id: true
        }
    });

    const missionIds = missions.map(m => m.id);

    if (missionIds.length > 0) {
        // Delete MissionProgress first
        const progressResult = await prisma.missionProgress.deleteMany({
            where: {
                missionId: {
                    in: missionIds
                }
            }
        });
        console.log(`Deleted ${progressResult.count} mission progress records.`);

        // Delete Missions
        const result = await prisma.mission.deleteMany({
            where: {
                id: {
                    in: missionIds
                }
            }
        });

        console.log(`Deleted ${result.count} time-bound missions.`);
    } else {
        console.log("No time-bound missions found to delete.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
