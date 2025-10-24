import { Router, type Response } from "express";
import cookie from "cookie";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, verifyPassword } from "../utils/auth";
import { sendEmail } from "../services/email";
import { registerSchema, loginSchema, depositSchema, withdrawSchema } from "../validators";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { CONFIG } from "../config";
import {
  toPublicPackage,
  toPublicTransaction,
  toPublicUser,
  toPublicPurchase,
} from "../utils/serialize";

const router = Router();

const setAuthCookie = (res: Response, token: string) => {
  const serialized = cookie.serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  res.setHeader("Set-Cookie", serialized);
};

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const { email, password, ltcAddress } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: "Email already in use" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      ltcAddress: ltcAddress ?? null,
      balance: 0,
      miningPower: 0,
    },
  });

  const token = signToken({ userId: user.id, isAdmin: user.isAdmin });
  setAuthCookie(res, token);

  return res.json({ user: toPublicUser(user) });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: "Account is blocked" });
  }

  const token = signToken({ userId: user.id, isAdmin: user.isAdmin });
  setAuthCookie(res, token);

  return res.json({ user: toPublicUser(user) });
});

router.post("/logout", (_req, res) => {
  const serialized = cookie.serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  res.setHeader("Set-Cookie", serialized);
  return res.json({ success: true });
});

router.get("/packages", async (_req, res) => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return res.json({ packages: packages.map(toPublicPackage) });
});

router.get("/user/dashboard", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      purchases: {
        include: { package: true },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: "Account is blocked" });
  }

  const estimatedDailyProfit = user.purchases.reduce((acc, purchase) => {
    return acc + (purchase.package.miningPower * purchase.package.dailyProfitPercent) / 100;
  }, 0);

  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return res.json({
    user: toPublicUser(user),
    depositAddress: CONFIG.platformLtcAddress,
    estimatedDailyProfit,
    packages: packages.map(toPublicPackage),
    purchases: user.purchases.map(toPublicPurchase),
    transactions: user.transactions.map(toPublicTransaction),
    limits: {
      minDeposit: CONFIG.minDepositLtc,
      minWithdraw: CONFIG.minWithdrawLtc,
      withdrawFee: CONFIG.withdrawFeeLtc,
    },
  });
});

router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: toPublicUser(user) });
});

router.get("/user/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ transactions: transactions.map(toPublicTransaction) });
});

router.post("/deposit", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const parsed = depositSchema.safeParse({
    amount: Number(body?.amount),
    txid: body?.txid as string,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const { amount, txid } = parsed.data;

  const duplicate = await prisma.deposit.findFirst({ where: { txid } });
  if (duplicate) {
    return res.status(400).json({ error: "TXID already submitted" });
  }

  const deposit = await prisma.deposit.create({
    data: {
      userId: req.user!.userId,
      amount,
      txid,
      status: "pending",
    },
  });

  return res.json({ depositId: deposit.id });
});

router.post("/withdraw", requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const parsed = withdrawSchema.safeParse({
    amount: Number(body?.amount),
    ltcAddress: body?.ltcAddress as string,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const { amount, ltcAddress } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: "Account is blocked" });
  }

  const totalDebit = amount + CONFIG.withdrawFeeLtc;
  if (user.balance < totalDebit) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: totalDebit },
      },
    }),
    prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        ltcAddress,
        status: "pending",
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "withdrawal",
        amount: totalDebit,
        description: `Withdrawal request ${amount} LTC (+${CONFIG.withdrawFeeLtc} LTC fee)`,
      },
    }),
  ]);

  return res.json({ success: true });
});

router.post("/buy-package", requireAuth, async (req: AuthenticatedRequest, res) => {
  // We expect an id, not package data; re-parse accordingly.
  const body = req.body as Record<string, unknown>;
  const packageId = Number(body?.packageId);
  if (!Number.isFinite(packageId)) {
    return res.status(400).json({ error: "Invalid package" });
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    return res.status(404).json({ error: "Package not available" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: "Account is blocked" });
  }

  if (user.balance < pkg.price) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: pkg.price },
        miningPower: { increment: pkg.miningPower },
      },
    });

    const purchase = await tx.purchase.create({
      data: {
        userId: user.id,
        packageId: pkg.id,
      },
      include: {
        package: true,
      },
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "purchase",
        amount: pkg.price,
        description: `Purchased package ${pkg.name}`,
      },
    });

    return { updatedUser, purchase };
  });

  // Fire and forget email
  sendEmail({
    type: "packagePurchased",
    email: user.email,
    packageName: pkg.name,
    amount: pkg.price,
  }).catch((error) => console.error("Email error", error));

  return res.json({
    user: toPublicUser(result.updatedUser),
    purchase: toPublicPurchase(result.purchase),
  });
});

export default router;
