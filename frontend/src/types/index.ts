export type PublicUser = {
  id: number;
  email: string;
  ltcAddress: string | null;
  balance: number;
  miningPower: number;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
};

export type DashboardData = {
  user: PublicUser;
  depositAddress: string;
  estimatedDailyProfit: number;
  packages: PackageSummary[];
  purchases: PurchaseSummary[];
  transactions: TransactionSummary[];
  limits: {
    minDeposit: number;
    minWithdraw: number;
    withdrawFee: number;
  };
};

export type PackageSummary = {
  id: number;
  name: string;
  price: number;
  miningPower: number;
  dailyProfitPercent: number;
  isActive: boolean;
};

export type PurchaseSummary = {
  id: number;
  package: PackageSummary;
  createdAt: string;
};

export type TransactionSummary = {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

export type DepositRecord = {
  id: number;
  userId: number;
  email?: string;
  amount: number;
  txid: string;
  status: string;
  createdAt: string;
};

export type WithdrawalRecord = {
  id: number;
  userId: number;
  email?: string;
  amount: number;
  ltcAddress: string;
  txid?: string;
  status: string;
  createdAt: string;
};

export type AdminSummary = {
  users: number;
  totalDeposits: number;
  totalWithdrawals: number;
};
