const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const CONFIG = {
  jwtSecret: process.env.JWT_SECRET ?? "super-secret",
  platformLtcAddress: process.env.PLATFORM_LTC_ADDRESS ?? "LKKEARwhFHcRhQbV84cgBJzftg8DRSk5QM",
  rateLimitWindowMinutes: toNumber(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
  rateLimitMaxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  minDepositLtc: toNumber(process.env.MIN_DEPOSIT_LTC, 0.01),
  minWithdrawLtc: toNumber(process.env.MIN_WITHDRAW_LTC, 0.05),
  withdrawFeeLtc: toNumber(process.env.WITHDRAW_FEE_LTC, 0.001),
};
