import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { toPublicDeposit, toPublicPackage, toPublicUser, toPublicWithdrawal } from "../utils/serialize";
import { packageSchema, processWithdrawalSchema, updateUserSchema } from "../validators";
import { CONFIG } from "../config";
import { sendEmail } from "../services/email";
import { runDailyEarnings } from "../jobs/dailyEarnings";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/admin/summary", async (_req, res) => {
  const [userCount, depositsTotal, withdrawalsTotal] = await Promise.all([
    prisma.user.count(),
    prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: "confirmed" } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "completed" } }),
  ]);

  return res.json({
    users: userCount,
    totalDeposits: depositsTotal._sum.amount ?? 0,
    totalWithdrawals: withdrawalsTotal._sum.amount ?? 0,
  });
});

router.get("/admin/deposits", async (_req, res) => {
  const deposits = await prisma.deposit.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ deposits: deposits.map(toPublicDeposit) });
});

router.post("/admin/deposits/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid deposit" });
  }

  const deposit = await prisma.deposit.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!deposit) {
    return res.status(404).json({ error: "Deposit not found" });
  }
  if (deposit.status !== "pending") {
    return res.status(400).json({ error: "Deposit already processed" });
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: deposit.amount } },
    }),
    prisma.deposit.update({
      where: { id },
      data: { status: "confirmed" },
    }),
    prisma.transaction.create({
      data: {
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.amount,
        description: `Deposit approved (TXID ${deposit.txid})`,
      },
    }),
  ]);

  sendEmail({
    type: "depositApproved",
    email: deposit.user!.email,
    amount: deposit.amount,
  }).catch((error) => console.error("Email error", error));

  return res.json({ success: true, user: toPublicUser(updatedUser) });
});

router.post("/admin/deposits/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid deposit" });
  }

  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit) {
    return res.status(404).json({ error: "Deposit not found" });
  }
  if (deposit.status !== "pending") {
    return res.status(400).json({ error: "Deposit already processed" });
  }

  await prisma.deposit.update({
    where: { id },
    data: { status: "rejected" },
  });

  return res.json({ success: true });
});

router.get("/admin/withdrawals", async (_req, res) => {
  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ withdrawals: withdrawals.map(toPublicWithdrawal) });
});

router.post("/admin/withdrawals/:id/process", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid withdrawal" });
  }

  const parsed = processWithdrawalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid TXID" });
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!withdrawal) {
    return res.status(404).json({ error: "Withdrawal not found" });
  }
  if (withdrawal.status !== "pending") {
    return res.status(400).json({ error: "Withdrawal already processed" });
  }

  await prisma.$transaction([
    prisma.withdrawal.update({
      where: { id },
      data: { status: "completed", txid: parsed.data.txid },
    }),
    prisma.transaction.create({
      data: {
        userId: withdrawal.userId,
        type: "withdrawal",
        amount: withdrawal.amount,
        description: `Withdrawal completed (TXID ${parsed.data.txid})`,
      },
    }),
  ]);

  sendEmail({
    type: "withdrawalProcessed",
    email: withdrawal.user!.email,
    amount: withdrawal.amount,
    txid: parsed.data.txid,
  }).catch((error) => console.error("Email error", error));

  return res.json({ success: true });
});

router.post("/admin/withdrawals/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid withdrawal" });
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) {
    return res.status(404).json({ error: "Withdrawal not found" });
  }
  if (withdrawal.status !== "pending") {
    return res.status(400).json({ error: "Withdrawal already processed" });
  }

  await prisma.$transaction([
    prisma.withdrawal.update({
      where: { id },
      data: { status: "rejected" },
    }),
    prisma.user.update({
      where: { id: withdrawal.userId },
      data: { balance: { increment: withdrawal.amount + CONFIG.withdrawFeeLtc } },
    }),
    prisma.transaction.create({
      data: {
        userId: withdrawal.userId,
        type: "adjustment",
        amount: withdrawal.amount + CONFIG.withdrawFeeLtc,
        description: "Withdrawal rejected - funds returned",
      },
    }),
  ]);

  return res.json({ success: true });
});

router.get("/admin/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return res.json({ users: users.map(toPublicUser) });
});

router.post("/admin/users/:id/update", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid user" });
  }

  const body = req.body as Record<string, unknown>;
  const parsed = updateUserSchema.safeParse({
    balance: body?.balance !== undefined ? Number(body.balance) : undefined,
    isBlocked: body?.isBlocked as boolean | undefined,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const updates: Record<string, unknown> = {};
  let adjustment: number | null = null;
  if (parsed.data.balance !== undefined) {
    updates.balance = parsed.data.balance;
    adjustment = parsed.data.balance - user.balance;
  }
  if (parsed.data.isBlocked !== undefined) {
    updates.isBlocked = parsed.data.isBlocked;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No changes provided" });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updates,
  });

  if (adjustment !== null && adjustment !== 0) {
    await prisma.transaction.create({
      data: {
        userId: id,
        type: "adjustment",
        amount: adjustment,
        description: "Admin balance adjustment",
      },
    });
  }

  return res.json({ user: toPublicUser(updated) });
});

router.get("/admin/packages", async (_req, res) => {
  const packages = await prisma.package.findMany({
    orderBy: { price: "asc" },
  });
  return res.json({ packages: packages.map(toPublicPackage) });
});

router.post("/admin/packages", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const parsed = packageSchema.safeParse({
    name: body?.name,
    price: Number(body?.price),
    miningPower: Number(body?.miningPower),
    dailyProfitPercent: Number(body?.dailyProfitPercent),
    isActive: (body?.isActive as boolean | undefined) ?? true,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const pkg = await prisma.package.create({
    data: parsed.data,
  });

  return res.json({ package: toPublicPackage(pkg) });
});

router.put("/admin/packages/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid package" });
  }

  const body = req.body as Record<string, unknown>;
  const parsed = packageSchema
    .partial()
    .safeParse({
      name: body?.name,
      price: body?.price !== undefined ? Number(body.price) : undefined,
      miningPower: body?.miningPower !== undefined ? Number(body.miningPower) : undefined,
      dailyProfitPercent:
        body?.dailyProfitPercent !== undefined ? Number(body.dailyProfitPercent) : undefined,
      isActive: body?.isActive as boolean | undefined,
    });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const pkg = await prisma.package.update({
    where: { id },
    data: parsed.data,
  });

  return res.json({ package: toPublicPackage(pkg) });
});

router.delete("/admin/packages/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid package" });
  }

  await prisma.package.delete({ where: { id } });
  return res.json({ success: true });
});

router.post("/admin/run-daily-earnings", async (_req, res) => {
  const result = await runDailyEarnings();
  return res.json(result);
});

export default router;
