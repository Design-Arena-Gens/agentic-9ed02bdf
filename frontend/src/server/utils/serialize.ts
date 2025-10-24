import type {
  User,
  Deposit,
  Withdrawal,
  Package,
  Purchase,
  Transaction,
} from "@/generated/prisma/client";

export const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  ltcAddress: user.ltcAddress,
  balance: user.balance,
  miningPower: user.miningPower,
  isAdmin: user.isAdmin,
  isBlocked: user.isBlocked,
  createdAt: user.createdAt,
});

export const toPublicDeposit = (deposit: Deposit & { user?: User }) => ({
  id: deposit.id,
  userId: deposit.userId,
  email: deposit.user?.email,
  amount: deposit.amount,
  txid: deposit.txid,
  status: deposit.status,
  createdAt: deposit.createdAt,
});

export const toPublicWithdrawal = (withdrawal: Withdrawal & { user?: User }) => ({
  id: withdrawal.id,
  userId: withdrawal.userId,
  email: withdrawal.user?.email,
  amount: withdrawal.amount,
  ltcAddress: withdrawal.ltcAddress,
  txid: withdrawal.txid,
  status: withdrawal.status,
  createdAt: withdrawal.createdAt,
});

export const toPublicPackage = (pkg: Package) => ({
  id: pkg.id,
  name: pkg.name,
  price: pkg.price,
  miningPower: pkg.miningPower,
  dailyProfitPercent: pkg.dailyProfitPercent,
  isActive: pkg.isActive,
});

export const toPublicPurchase = (purchase: Purchase & { package: Package }) => ({
  id: purchase.id,
  package: toPublicPackage(purchase.package),
  createdAt: purchase.createdAt,
});

export const toPublicTransaction = (transaction: Transaction) => ({
  id: transaction.id,
  type: transaction.type,
  amount: transaction.amount,
  description: transaction.description,
  createdAt: transaction.createdAt,
});
