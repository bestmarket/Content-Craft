import { Router } from "express";
import { db } from "@workspace/db";
import { contentHistoryTable, usersTable, conversationsTable, pdfHistoryTable, ordersTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, gte, count, sql, and } from "drizzle-orm";
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

router.get("/dashboard/analytics", requireAdmin, async (req: any, res) => {
  try {
    const days = parseInt((req.query.days as string) ?? "30");
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Build date series helper — generates one row per day
    const dateSeriesQuery = sql`
      SELECT generate_series(
        date_trunc('day', ${since}::timestamptz),
        date_trunc('day', now()),
        '1 day'::interval
      )::date AS day
    `;

    // Daily signups
    const signupRows = await db.execute(sql`
      SELECT d.day::text, COUNT(u.id)::int AS value
      FROM (${dateSeriesQuery}) d
      LEFT JOIN users u ON date_trunc('day', u.created_at) = d.day
      GROUP BY d.day ORDER BY d.day
    `);

    // Daily content generated
    const contentRows = await db.execute(sql`
      SELECT d.day::text, COUNT(c.id)::int AS value
      FROM (${dateSeriesQuery}) d
      LEFT JOIN content_history c ON date_trunc('day', c.created_at) = d.day
      GROUP BY d.day ORDER BY d.day
    `);

    // Daily revenue from completed orders
    const revenueRows = await db.execute(sql`
      SELECT d.day::text, COALESCE(SUM(o.amount), 0)::float AS value
      FROM (${dateSeriesQuery}) d
      LEFT JOIN orders o ON date_trunc('day', o.created_at) = d.day AND o.status = 'completed'
      GROUP BY d.day ORDER BY d.day
    `);

    // Subscription tier breakdown
    const tierRows = await db.execute(sql`
      SELECT subscription_tier AS tier, COUNT(*)::int AS count FROM users GROUP BY subscription_tier
    `);

    // Top content platforms
    const platformRows = await db.execute(sql`
      SELECT platform, COUNT(*)::int AS count FROM content_history GROUP BY platform ORDER BY count DESC LIMIT 6
    `);

    // Totals for summary cards
    const totalsResult = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users)::int AS total_users,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed')::int AS total_orders,
        (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed')::float AS total_revenue,
        (SELECT COUNT(*) FROM users WHERE created_at >= now() - interval '30 days')::int AS users_30d,
        (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed' AND created_at >= now() - interval '30 days')::float AS revenue_30d
    `);
    const totals = (totalsResult.rows ?? (totalsResult as any))[0];

    res.json({
      signups: signupRows.rows,
      content: contentRows.rows,
      revenue: revenueRows.rows,
      tiers: tierRows.rows,
      platforms: platformRows.rows,
      totals: totals,
    });
  } catch (err) {
    req.log.error({ err }, "GetAnalytics error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard/realtime", requireAdmin, async (req: any, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const liveCountsRaw = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users)::int                                                             AS total_users,
        (SELECT COUNT(*) FROM users  WHERE created_at >= ${todayStart})::int                         AS users_today,
        (SELECT COUNT(*) FROM orders WHERE created_at >= ${todayStart})::int                         AS orders_today,
        (SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='completed' AND created_at >= ${todayStart})::float AS revenue_today,
        (SELECT COUNT(*) FROM content_history WHERE created_at >= ${todayStart})::int                AS content_today,
        (SELECT COUNT(*) FROM products  WHERE publish_status='pending_approval')::int                AS pending_approvals,
        (SELECT COUNT(*) FROM orders WHERE status='completed')::int                                  AS total_orders,
        (SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='completed')::float                 AS total_revenue
    `);
    const liveCountsResult = (liveCountsRaw.rows ?? (liveCountsRaw as any))[0];

    const recentSignups = await db.execute(sql`
      SELECT id, name, email, subscription_tier, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
    `);

    const recentOrders = await db.execute(sql`
      SELECT o.id, o.buyer_name, o.buyer_email, o.amount, o.currency, o.status,
             o.created_at, p.title AS product_title
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    res.json({
      live: liveCountsResult,
      recentSignups: recentSignups.rows,
      recentOrders: recentOrders.rows,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "GetRealtime error");
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
