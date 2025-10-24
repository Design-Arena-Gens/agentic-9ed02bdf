import { z } from "zod";
import { CONFIG } from "./config";

const ltcAddressRegex = /^[LM3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  ltcAddress: z.string().optional().refine((value) => !value || ltcAddressRegex.test(value), {
    message: "Invalid LTC address",
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const depositSchema = z.object({
  amount: z.number().positive().min(CONFIG.minDepositLtc),
  txid: z.string().min(10),
});

export const withdrawSchema = z.object({
  amount: z.number().positive().min(CONFIG.minWithdrawLtc),
  ltcAddress: z
    .string()
    .min(1)
    .refine((value) => ltcAddressRegex.test(value), {
      message: "Invalid LTC address",
    }),
});

export const packageSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  miningPower: z.number().positive(),
  dailyProfitPercent: z.number().positive(),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  balance: z.number().optional(),
  isBlocked: z.boolean().optional(),
});

export const processWithdrawalSchema = z.object({
  txid: z.string().min(10),
});
