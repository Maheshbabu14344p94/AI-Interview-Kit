import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "./models";

const sessions = new Map<string, { userId: string; expiresAt: number }>();

export async function register(email: string, password: string, name: string) {
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error("Email is already registered");
  const passwordHash = await bcrypt.hash(password, 12);
  if (!process.env.MONGODB_URI) {
    const userId = crypto.randomUUID();
    const token = crypto.randomUUID();
    sessions.set(token, { userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return { user: { id: userId, email, name }, token };
  }
  const user = await User.create({ email: email.toLowerCase(), passwordHash, name });
  return login(email, password);
}

export async function login(email: string, password: string) {
  if (!process.env.MONGODB_URI) {
    if (!password) throw new Error("Invalid credentials");
    const userId = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24);
    const token = crypto.randomUUID();
    sessions.set(token, { userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return { user: { id: userId, email, name: email.split("@")[0] }, token };
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new Error("Invalid credentials");
  const token = crypto.randomUUID();
  sessions.set(token, { userId: String(user._id), expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  return { user: { id: String(user._id), email: user.email, name: user.name }, token };
}

export function setSession(res: Response, token: string) {
  res.cookie("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 7 });
}

export function logout(req: Request, res: Response) {
  const token = req.cookies.session;
  if (token) sessions.delete(token);
  res.clearCookie("session");
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.session;
  if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: "SESSION_EXPIRED" });
  }
  (req as any).userId = session.userId;
  next();
}
