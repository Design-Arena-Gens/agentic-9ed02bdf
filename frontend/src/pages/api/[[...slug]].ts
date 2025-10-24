import type { NextApiRequest, NextApiResponse } from "next";
import type { Request, Response } from "express";
import { createServer } from "@/server/app";

const app = createServer();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    app(req as unknown as Request, res as unknown as Response, (err?: unknown) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
