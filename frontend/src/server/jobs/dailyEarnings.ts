import dayjs from "dayjs";
import { prisma } from "@/lib/prisma";

export const runDailyEarnings = async () => {
  const users = await prisma.user.findMany({
    where: {
      isBlocked: false,
      purchases: {
        some: {},
      },
    },
    include: {
      purchases: {
        include: {
          package: true,
        },
      },
    },
  });

  const operations = users
    .map((user) => {
      const dailyProfit = user.purchases.reduce((acc, purchase) => {
        const pkg = purchase.package;
        const pkgEarning = (pkg.miningPower * pkg.dailyProfitPercent) / 100;
        return acc + pkgEarning;
      }, 0);

      if (dailyProfit <= 0) {
        return null;
      }

      return prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            balance: { increment: dailyProfit },
          },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: "earning",
            amount: dailyProfit,
            description: `Daily earnings ${dayjs().format("YYYY-MM-DD")}`,
          },
        }),
      ]);
    })
    .filter(Boolean) as ReturnType<typeof prisma.$transaction>[];

  if (!operations.length) {
    return { processed: 0, totalReward: 0 };
  }

  await Promise.all(operations);

  const totalReward = users.reduce((acc, user) => {
    const dailyProfit = user.purchases.reduce((sum, purchase) => {
      const pkg = purchase.package;
      return sum + (pkg.miningPower * pkg.dailyProfitPercent) / 100;
    }, 0);
    return acc + dailyProfit;
  }, 0);

  return { processed: operations.length, totalReward };
};
