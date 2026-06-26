import { Router } from "express";
import { db } from "@workspace/db";
import { contentHistoryTable, usersTable, conversationsTable, pdfHistoryTable } from "@workspace/db";
import { eq, desc, gte, count, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [{ total }] = await db.select({ total: count() }).from(contentHistoryTable)
      .where(eq(contentHistoryTable.userId, userId));

    const [{ thisWeek }] = await db.select({ thisWeek: count() }).from(contentHistoryTable)
      .where(sql`${contentHistoryTable.userId} = ${userId} AND ${contentHistoryTable.createdAt} >= ${oneWeekAgo}`);

    const platformData = await db.select({
      platform: contentHistoryTable.platform,
      cnt: count(),
    }).from(contentHistoryTable)
      .where(eq(contentHistoryTable.userId, userId))
      .groupBy(contentHistoryTable.platform);

    const [{ pdfCount }] = await db.select({ pdfCount: count() }).from(pdfHistoryTable)
      .where(eq(pdfHistoryTable.userId, userId));

    res.json({
      totalContent: Number(total),
      thisWeek: Number(thisWeek),
      byPlatform: platformData.map(p => ({ platform: p.platform, count: Number(p.cnt) })),
      recentPdfs: Number(pdfCount),
      totalThumbnails: 0,
    });
  } catch (err) {
    req.log.error({ err }, "GetDashboardStats error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard/admin-stats", requireAdmin, async (req: any, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(usersTable);
    const [{ activeUsers }] = await db.select({ activeUsers: count() }).from(usersTable)
      .where(eq(usersTable.isActive, true));
    const [{ totalContent }] = await db.select({ totalContent: count() }).from(contentHistoryTable);
    const [{ totalConversations }] = await db.select({ totalConversations: count() }).from(conversationsTable);
    const [{ openConversations }] = await db.select({ openConversations: count() }).from(conversationsTable)
      .where(eq(conversationsTable.status, "open"));
    const [{ contentThisWeek }] = await db.select({ contentThisWeek: count() }).from(contentHistoryTable)
      .where(gte(contentHistoryTable.createdAt, oneWeekAgo));
    const [{ newUsers }] = await db.select({ newUsers: count() }).from(usersTable)
      .where(gte(usersTable.createdAt, oneWeekAgo));

    res.json({
      totalUsers: Number(totalUsers),
      activeUsers: Number(activeUsers),
      totalContent: Number(totalContent),
      totalConversations: Number(totalConversations),
      openConversations: Number(openConversations),
      contentThisWeek: Number(contentThisWeek),
      newUsersThisWeek: Number(newUsers),
    });
  } catch (err) {
    req.log.error({ err }, "GetAdminStats error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard/recent-content", requireAuth, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit ?? "5");
    const items = await db.select().from(contentHistoryTable)
      .where(eq(contentHistoryTable.userId, req.userId))
      .orderBy(desc(contentHistoryTable.createdAt))
      .limit(limit);

    res.json(items.map(item => ({
      ...item,
      titles: (item.titles as any[]) ?? [],
      tags: (item.tags as string[]) ?? [],
      hashtags: (item.hashtags as string[]) ?? [],
      createdAt: item.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "GetRecentContent error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
