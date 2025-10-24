import rateLimit from "express-rate-limit";
import { CONFIG } from "../config";

export const apiRateLimiter = rateLimit({
  windowMs: CONFIG.rateLimitWindowMinutes * 60 * 1000,
  max: CONFIG.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
