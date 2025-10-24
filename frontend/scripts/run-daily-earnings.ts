import "dotenv/config";
import { runDailyEarnings } from "@/server/jobs/dailyEarnings";
import { prisma } from "@/lib/prisma";

async function main() {
  try {
    const result = await runDailyEarnings();
    console.log(`Processed ${result.processed} users, total reward ${result.totalReward.toFixed(6)} LTC`);
  } catch (error) {
    console.error("Daily earnings job failed", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
