import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { apiRateLimiter } from "./middleware/rateLimiter";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";

export const createServer = () => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(apiRateLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", userRoutes);
  app.use("/api", adminRoutes);

  app.use((req, res) => {
    if (!res.headersSent) {
      res.status(404).json({ error: "Not found" });
    }
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    void _next;
    console.error(err);
    if (res.headersSent) {
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  };

  app.use(errorHandler);

  return app;
};
