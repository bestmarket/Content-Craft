import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "viralcraft-secret-2024";

export function signToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  req.userId = payload.userId;
  req.userRole = payload.role;
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  });
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "All fields required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      password: hashed,
      name,
      role: "user",
      isActive: true,
    }).returning();
    const token = signToken(user.id, user.role);
    const { password: _p, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email?.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ error: "Account deactivated" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));
    const token = signToken(user.id, user.role);
    const { password: _p, ...safeUser } = user;
    res.json({ user: { ...safeUser, lastLogin: new Date().toISOString() }, token });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.post("/auth/change-password", requireAuth, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.id, req.userId));
    req.log.info({ userId: req.userId }, "Password changed");
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/auth/me", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const { password: _p, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "GetMe error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
