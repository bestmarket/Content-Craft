import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, affiliateCommissionsTable } from "@workspace/db";
import { eq, desc, count, sql, and, ne } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

// ── Overview stats ─────────────────────────────────────────────────────────
router.get("/admin/affiliates/stats", requireAdmin, async (req: any, res) => {
  try {
    const totalsRaw = await db.execute(sql`
      SELECT
        (SELECT COUNT(DISTINCT referrer_id) FROM affiliate_commissions)::int AS total_affiliates,
        (SELECT COALESCE(SUM(amount), 0) FROM affiliate_commissions)::float AS total_commissions,
        (SELECT COALESCE(SUM(amount), 0) FROM affiliate_commissions WHERE status = 'pending')::float AS pending_commissions,
        (SELECT COALESCE(SUM(amount), 0) FROM affiliate_commissions WHERE status = 'paid')::float AS paid_commissions,
        (SELECT COUNT(*) FROM affiliate_commissions WHERE type = 'signup')::int AS total_signups,
        (SELECT COUNT(*) FROM affiliate_commissions WHERE type = 'upgrade')::int AS total_upgrades,
        (SELECT COUNT(*) FROM affiliate_commissions WHERE type = 'sale')::int AS total_sales
    `);
    const totals = (totalsRaw.rows ?? (totalsRaw as any))[0];

    // 30-day trend
    const trendRows = await db.execute(sql`
      SELECT
        date_trunc('day', created_at)::date::text AS day,
        COALESCE(SUM(amount), 0)::float AS value,
        COUNT(*)::int AS count
      FROM affiliate_commissions
      WHERE created_at >= now() - interval '30 days'
      GROUP BY day ORDER BY day
    `);

    res.json({ totals: totals, trend: trendRows.rows });
  } catch (err) {
    req.log.error({ err }, "AdminAffiliateStats error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Top affiliates leaderboard ─────────────────────────────────────────────
router.get("/admin/affiliates/leaderboard", requireAdmin, async (req: any, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "25");

    const rows = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.affiliate_code,
        u.affiliate_commission_rate::float AS commission_rate,
        u.subscription_tier,
        COALESCE(SUM(ac.amount), 0)::float AS total_earned,
        COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.amount ELSE 0 END), 0)::float AS pending,
        COALESCE(SUM(CASE WHEN ac.status = 'paid' THEN ac.amount ELSE 0 END), 0)::float AS paid_out,
        COUNT(ac.id)::int AS total_commissions,
        COUNT(CASE WHEN ac.type = 'signup' THEN 1 END)::int AS signups,
        COUNT(CASE WHEN ac.type = 'upgrade' THEN 1 END)::int AS upgrades,
        COUNT(CASE WHEN ac.type = 'sale' THEN 1 END)::int AS sales,
        (SELECT COUNT(*) FROM users WHERE referred_by = u.id)::int AS total_referrals
      FROM users u
      LEFT JOIN affiliate_commissions ac ON ac.referrer_id = u.id
      WHERE u.role != 'admin'
        AND (u.affiliate_code IS NOT NULL OR ac.id IS NOT NULL)
      GROUP BY u.id, u.name, u.email, u.affiliate_code, u.affiliate_commission_rate, u.subscription_tier
      ORDER BY total_earned DESC
      LIMIT ${limit}
    `);

    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "AdminAffiliateLeaderboard error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Recent commissions ─────────────────────────────────────────────────────
router.get("/admin/affiliates/commissions", requireAdmin, async (req: any, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "50");
    const statusFilter = req.query.status as string | undefined;

    const rows = await db.execute(sql`
      SELECT
        ac.id,
        ac.type,
        ac.amount::float,
        ac.status,
        ac.description,
        ac.created_at,
        ru.name AS referrer_name,
        ru.email AS referrer_email,
        ee.name AS referee_name,
        ee.email AS referee_email
      FROM affiliate_commissions ac
      JOIN users ru ON ru.id = ac.referrer_id
      JOIN users ee ON ee.id = ac.referee_id
      ${statusFilter ? sql`WHERE ac.status = ${statusFilter}` : sql``}
      ORDER BY ac.created_at DESC
      LIMIT ${limit}
    `);

    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "AdminAffiliateCommissions error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Update commission rate for a user ─────────────────────────────────────
router.patch("/admin/affiliates/:userId/rate", requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { rate } = req.body as { rate: number };

    if (typeof rate !== "number" || rate < 0 || rate > 1) {
      res.status(400).json({ error: "Rate must be a number between 0 and 1" });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set({ affiliateCommissionRate: String(rate.toFixed(4)) })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, name: usersTable.name, affiliateCommissionRate: usersTable.affiliateCommissionRate });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    req.log.error({ err }, "UpdateAffiliateRate error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Mark commissions as paid ───────────────────────────────────────────────
router.post("/admin/affiliates/commissions/:id/mark-paid", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(affiliateCommissionsTable)
      .set({ status: "paid" })
      .where(and(eq(affiliateCommissionsTable.id, id), eq(affiliateCommissionsTable.status, "pending")))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Commission not found or already paid" });
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "MarkCommissionPaid error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Mark ALL pending commissions for a user as paid ───────────────────────
router.post("/admin/affiliates/:userId/mark-all-paid", requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updated = await db
      .update(affiliateCommissionsTable)
      .set({ status: "paid" })
      .where(and(eq(affiliateCommissionsTable.referrerId, userId), eq(affiliateCommissionsTable.status, "pending")))
      .returning();

    res.json({ count: updated.length });
  } catch (err) {
    req.log.error({ err }, "MarkAllPaid error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
