import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, contentHistoryTable, walletTransactionsTable } from "@workspace/db";
import { eq, ilike, or, count, desc, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

const USER_FIELDS = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  role: usersTable.role,
  isActive: usersTable.isActive,
  subscriptionTier: usersTable.subscriptionTier,
  subscriptionExpiresAt: usersTable.subscriptionExpiresAt,
  createdAt: usersTable.createdAt,
  lastLogin: usersTable.lastLogin,
};

router.get("/users", requireAdmin, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "20");
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = search
      ? or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`))
      : undefined;

    const allUsers = await db.select(USER_FIELDS).from(usersTable)
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
    const [user] = await db.select(USER_FIELDS).from(usersTable).where(eq(usersTable.id, id)).limit(1);
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
    const { name, isActive, role, subscriptionTier, subscriptionExpiresAt } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (isActive !== undefined) updates.isActive = isActive;
    if (role !== undefined) updates.role = role;
    if (subscriptionTier !== undefined) updates.subscriptionTier = subscriptionTier;
    if (subscriptionExpiresAt !== undefined) updates.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning(USER_FIELDS);
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

router.get("/users/export/csv", requireAdmin, async (req: any, res) => {
  try {
    const allUsers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      subscriptionTier: usersTable.subscriptionTier,
      subscriptionExpiresAt: usersTable.subscriptionExpiresAt,
      isActive: usersTable.isActive,
      walletBalance: usersTable.walletBalance,
      country: usersTable.country,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));

    const withCounts = await Promise.all(allUsers.map(async (u) => {
      const [{ cnt }] = await db.select({ cnt: count() }).from(contentHistoryTable).where(eq(contentHistoryTable.userId, u.id));
      const [{ earned }] = await db.select({ earned: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(walletTransactionsTable)
        .where(eq(walletTransactionsTable.userId, u.id));
      return { ...u, contentCount: Number(cnt), totalEarned: parseFloat(earned ?? "0") };
    }));

    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const headers = ["ID", "Name", "Email", "Role", "Plan", "Plan Expires", "Status", "Country", "Wallet Balance", "Total Earned", "Content Count", "Joined", "Last Login"];
    const rows = withCounts.map((u) => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.subscriptionTier,
      u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toISOString().split("T")[0] : "",
      u.isActive ? "Active" : "Inactive",
      u.country ?? "",
      u.walletBalance ?? "0.00",
      u.totalEarned.toFixed(2),
      u.contentCount,
      new Date(u.createdAt).toISOString().split("T")[0],
      u.lastLogin ? new Date(u.lastLogin).toISOString().split("T")[0] : "",
    ].map(escape).join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `viralcraft-users-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "ExportUsers error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
