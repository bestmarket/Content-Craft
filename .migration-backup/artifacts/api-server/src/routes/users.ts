import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, contentHistoryTable } from "@workspace/db";
import { eq, ilike, or, count, desc } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/users", requireAdmin, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "20");
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = search
      ? or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`))
      : undefined;

    const allUsers = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    }).from(usersTable)
      .where(conditions)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(usersTable).where(conditions);

    const usersWithCounts = await Promise.all(allUsers.map(async (u) => {
      const [{ cnt }] = await db.select({ cnt: count() }).from(contentHistoryTable).where(eq(contentHistoryTable.userId, u.id));
      return { ...u, contentCount: Number(cnt) };
    }));

    res.json({ users: usersWithCounts, total: Number(total) });
  } catch (err) {
    req.log.error({ err }, "ListUsers error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [{ cnt }] = await db.select({ cnt: count() }).from(contentHistoryTable).where(eq(contentHistoryTable.userId, id));
    res.json({ ...user, contentCount: Number(cnt) });
  } catch (err) {
    req.log.error({ err }, "GetUser error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/users/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, isActive, role } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (isActive !== undefined) updates.isActive = isActive;
    if (role !== undefined) updates.role = role;
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    });
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ...user, contentCount: null });
  } catch (err) {
    req.log.error({ err }, "UpdateUser error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/users/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ message: "User deleted" });
  } catch (err) {
    req.log.error({ err }, "DeleteUser error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
