import { Router } from "express";
import { db } from "@workspace/db";
import {
  revenueSharesTable,
  walletTransactionsTable,
  ordersTable,
  usersTable,
  productsTable,
  settingsTable,
  withdrawalRequestsTable,
  affiliateCommissionsTable,
} from "@workspace/db";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { requireAdmin } from "./auth";
import { logger } from "../lib/logger";

export const router = Router();

// ─── Default config ───────────────────────────────────────────────────────────
export const DEFAULT_REVENUE_CONFIG = {
  tiers: {
    free:       { creatorShare: 70, platformFee: 30 },
    pro:        { creatorShare: 85, platformFee: 15 },
    enterprise: { creatorShare: 92, platformFee: 8  },
  },
  affiliatePoolPct: 30,     // % of platform fee allocated to affiliates
  subscriptionFeePct: 25,   // % platform keeps from subscription revenue
  minimumPayout: 50,
  payoutCurrency: "USD",
  autoApproveBelow: 0,      // auto-approve withdrawals below this amount
  payoutSchedule: "on-demand",
  platformWalletUserId: null,
};

// ─── Helper: get live config ──────────────────────────────────────────────────
export async function getRevenueConfig(): Promise<typeof DEFAULT_REVENUE_CONFIG> {
  try {
    const [row] = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "revenue_config")).limit(1);
    if (row?.value) {
      const saved = JSON.parse(row.value);
      return { ...DEFAULT_REVENUE_CONFIG, ...saved, tiers: { ...DEFAULT_REVENUE_CONFIG.tiers, ...(saved.tiers ?? {}) } };
    }
  } catch {}
  return DEFAULT_REVENUE_CONFIG;
}

// ─── Helper: calculate split for a sale ──────────────────────────────────────
export async function calculateRevenueSplit(params: {
  grossAmount: number;
  sellerTier: string;
  hasAffiliate: boolean;
  config?: typeof DEFAULT_REVENUE_CONFIG;
}): Promise<{
  creatorShare: number; platformFee: number;
  creatorAmount: number; platformFeeAmount: number;
  affiliateShare: number; affiliateAmount: number;
  platformNetAmount: number;
  config: typeof DEFAULT_REVENUE_CONFIG;
}> {
  const config = params.config ?? await getRevenueConfig();
  const tierKey = (params.sellerTier ?? "free") as keyof typeof config.tiers;
  const tierCfg = config.tiers[tierKey] ?? config.tiers.free;

  const creatorShare = tierCfg.creatorShare;
  const platformFee = tierCfg.platformFee;

  const creatorAmount = (params.grossAmount * creatorShare) / 100;
  const platformFeeAmount = (params.grossAmount * platformFee) / 100;

  let affiliateShare = 0;
  let affiliateAmount = 0;
  if (params.hasAffiliate && config.affiliatePoolPct > 0) {
    affiliateShare = (platformFee * config.affiliatePoolPct) / 100;
    affiliateAmount = (platformFeeAmount * config.affiliatePoolPct) / 100;
  }

  const platformNetAmount = platformFeeAmount - affiliateAmount;

  return {
    creatorShare, platformFee,
    creatorAmount, platformFeeAmount,
    affiliateShare, affiliateAmount,
    platformNetAmount,
    config,
  };
}

// ─── GET config ───────────────────────────────────────────────────────────────
router.get("/admin/revenue/config", requireAdmin, async (_req, res) => {
  try {
    const config = await getRevenueConfig();
    res.json(config);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST config ──────────────────────────────────────────────────────────────
router.post("/admin/revenue/config", requireAdmin, async (req: any, res) => {
  try {
    const existing = await db.select().from(settingsTable)
      .where(eq(settingsTable.key, "revenue_config")).limit(1);

    const current = existing.length ? JSON.parse(existing[0].value ?? "{}") : {};
    const merged = {
      ...current,
      ...req.body,
      tiers: { ...(current.tiers ?? {}), ...(req.body.tiers ?? {}) },
    };

    // Validate: creator + platform must = 100 for each tier
    for (const [tier, cfg] of Object.entries(merged.tiers) as any[]) {
      const sum = (cfg.creatorShare ?? 0) + (cfg.platformFee ?? 0);
      if (Math.abs(sum - 100) > 0.01) {
        res.status(400).json({ error: `Tier "${tier}": creatorShare + platformFee must equal 100 (got ${sum})` });
        return;
      }
    }

    const value = JSON.stringify(merged);
    if (existing.length) {
      await db.update(settingsTable).set({ value, updatedAt: new Date() })
        .where(eq(settingsTable.key, "revenue_config"));
    } else {
      await db.insert(settingsTable).values({ key: "revenue_config", value });
    }

    res.json({ ok: true, config: merged });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET stats ────────────────────────────────────────────────────────────────
router.get("/admin/revenue/stats", requireAdmin, async (_req, res) => {
  try {
    const [totals] = await db.select({
      totalGross: sql<string>`COALESCE(SUM(gross_amount), 0)`,
      totalCreator: sql<string>`COALESCE(SUM(creator_amount), 0)`,
      totalPlatform: sql<string>`COALESCE(SUM(platform_fee_amount), 0)`,
      totalAffiliate: sql<string>`COALESCE(SUM(affiliate_amount), 0)`,
      totalPlatformNet: sql<string>`COALESCE(SUM(platform_fee_amount - affiliate_amount), 0)`,
      txCount: sql<string>`COUNT(*)`,
    }).from(revenueSharesTable);

    const byTierResult = await db.execute(sql`
      SELECT seller_tier,
        COUNT(*) AS tx_count,
        SUM(gross_amount)::float AS gross,
        SUM(creator_amount)::float AS creator,
        SUM(platform_fee_amount)::float AS platform_fee,
        SUM(affiliate_amount)::float AS affiliate
      FROM revenue_shares
      GROUP BY seller_tier
    `);
    const byTier = byTierResult.rows ?? byTierResult;

    const [pendingPayouts] = await db.select({ count: count(), total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, "pending"));

    const [totalOrders] = await db.select({ count: count() }).from(ordersTable)
      .where(eq(ordersTable.status, "completed"));

    // Monthly breakdown (last 6 months)
    const monthly = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        SUM(gross_amount)::float AS gross,
        SUM(creator_amount)::float AS creator,
        SUM(platform_fee_amount)::float AS platform_fee,
        SUM(affiliate_amount)::float AS affiliate,
        COUNT(*) AS tx_count
      FROM revenue_shares
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);

    res.json({
      totals: {
        gross: parseFloat(totals.totalGross),
        creator: parseFloat(totals.totalCreator),
        platform: parseFloat(totals.totalPlatform),
        affiliate: parseFloat(totals.totalAffiliate),
        platformNet: parseFloat(totals.totalPlatformNet),
        transactions: parseInt(String(totals.txCount)),
      },
      byTier: byTier as any[],
      pendingPayouts: {
        count: Number(pendingPayouts.count),
        total: parseFloat(pendingPayouts.total),
      },
      totalOrders: Number(totalOrders.count),
      monthly: (monthly as unknown) as any[],
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET revenue shares (detailed transactions) ───────────────────────────────
router.get("/admin/revenue/transactions", requireAdmin, async (req: any, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? "100"), 500);
    const shares = await db.execute(sql`
      SELECT
        rs.*,
        u.name AS seller_name, u.email AS seller_email,
        p.title AS product_title,
        o.payment_provider,
        aff.name AS affiliate_name
      FROM revenue_shares rs
      LEFT JOIN users u ON u.id = rs.seller_id
      LEFT JOIN products p ON p.id = rs.product_id
      LEFT JOIN orders o ON o.id = rs.order_id
      LEFT JOIN users aff ON aff.id = rs.affiliate_id
      ORDER BY rs.created_at DESC
      LIMIT ${limit}
    `);
    res.json(shares);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET withdrawal requests ──────────────────────────────────────────────────
router.get("/admin/revenue/payouts", requireAdmin, async (_req, res) => {
  try {
    const payouts = await db.execute(sql`
      SELECT wr.*, u.name, u.email, u.wallet_balance::float, u.subscription_tier
      FROM withdrawal_requests wr
      LEFT JOIN users u ON u.id = wr.user_id
      ORDER BY wr.created_at DESC
      LIMIT 200
    `);
    res.json(payouts);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── PATCH payout (approve/reject) ───────────────────────────────────────────
router.patch("/admin/revenue/payouts/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, adminNote } = req.body;

    const [payout] = await db.select().from(withdrawalRequestsTable)
      .where(eq(withdrawalRequestsTable.id, id)).limit(1);
    if (!payout) { res.status(404).json({ error: "Payout not found" }); return; }

    if (action === "approve") {
      await db.update(withdrawalRequestsTable).set({
        status: "paid",
        adminNote: adminNote ?? null,
        processedAt: new Date(),
      }).where(eq(withdrawalRequestsTable.id, id));

      // Debit the user's wallet
      await db.update(usersTable)
        .set({ walletBalance: sql`wallet_balance - ${payout.amount}` })
        .where(eq(usersTable.id, payout.userId));

      await db.insert(walletTransactionsTable).values({
        userId: payout.userId,
        type: "withdrawal",
        amount: String(payout.amount),
        status: "completed",
        description: `Withdrawal approved by admin — method: ${payout.method}`,
        reference: `withdrawal_${payout.id}`,
      });

    } else if (action === "reject") {
      await db.update(withdrawalRequestsTable).set({
        status: "rejected",
        adminNote: adminNote ?? null,
        processedAt: new Date(),
      }).where(eq(withdrawalRequestsTable.id, id));
    }

    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET creator leaderboard by revenue ──────────────────────────────────────
router.get("/admin/revenue/leaderboard", requireAdmin, async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        u.id, u.name, u.email, u.subscription_tier,
        u.wallet_balance::float AS wallet_balance,
        COUNT(rs.id)::int AS total_sales,
        SUM(rs.gross_amount)::float AS total_gross,
        SUM(rs.creator_amount)::float AS total_earned,
        SUM(rs.platform_fee_amount)::float AS total_platform_fees
      FROM revenue_shares rs
      LEFT JOIN users u ON u.id = rs.seller_id
      GROUP BY u.id, u.name, u.email, u.subscription_tier, u.wallet_balance
      ORDER BY total_earned DESC
      LIMIT 50
    `);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST: apply a manual revenue credit to a user's wallet ──────────────────
router.post("/admin/revenue/manual-credit", requireAdmin, async (req: any, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount) { res.status(400).json({ error: "userId and amount required" }); return; }

    await db.insert(walletTransactionsTable).values({
      userId: parseInt(userId),
      type: "credit",
      amount: String(parseFloat(amount)),
      status: "completed",
      description: description ?? "Manual credit by admin",
      reference: `manual_credit_${Date.now()}`,
    });

    await db.update(usersTable)
      .set({ walletBalance: sql`wallet_balance + ${parseFloat(amount)}` })
      .where(eq(usersTable.id, parseInt(userId)));

    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
