import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const packages = [
  { name: "Starter", price: 0.1, miningPower: 10, dailyProfitPercent: 1 },
  { name: "Pro", price: 1, miningPower: 150, dailyProfitPercent: 1.5 },
  { name: "Premium", price: 5, miningPower: 800, dailyProfitPercent: 2 },
];

async function main() {
  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    });
  }
  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
