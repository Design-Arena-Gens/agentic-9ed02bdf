import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config";

const SALT_ROUNDS = 10;

export type JwtPayload = {
  userId: number;
  isAdmin: boolean;
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const signToken = (payload: JwtPayload) => {
  return jwt.sign(payload, CONFIG.jwtSecret, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, CONFIG.jwtSecret) as JwtPayload;
};
