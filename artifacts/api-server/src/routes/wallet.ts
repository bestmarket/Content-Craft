import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, walletTransactionsTable, ordersTable, productsTable,
  withdrawalRequestsTable, revenueSharesTable, featuresTable,
} from "@workspace/db";
import { eq, desc, sum, count, sql } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// ─── GET /wallet — full wallet summary (used by earnings page) ────────────
router.get("/wallet", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select({
      walletBalance: usersTable.walletBalance,
      subscriptionTier: usersTable.subscriptionTier,
    }).from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    const transactions = await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, req.userId))
      .orderBy(desc(walletTransactionsTable.createdAt)).limit(50);

    // Totals
    const totalEarned = transactions
      .filter(t => t.type === "credit" && t.status === "completed")
      .reduce((a, t) => a + Number(t.amount), 0);

    const totalWithdrawn = transactions
      .filter(t => t.type === "withdrawal" && t.status === "completed")
      .reduce((a, t) => a + Number(t.amount), 0);

    const pendingWithdrawals = transactions
      .filter(t => t.type === "withdrawal" && t.status === "pending")
      .reduce((a, t) => a + Number(t.amount), 0);

    res.json({
      balance: Number(user?.walletBalance ?? 0),
      totalEarned,
      totalWithdrawn,
      pendingWithdrawals,
      currency: "USD",
      transactions,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET /wallet/balance (legacy) ─────────────────────────────────────────
router.get("/wallet/balance", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select({ walletBalance: usersTable.walletBalance, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    const transactions = await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, req.userId))
      .orderBy(desc(walletTransactionsTable.createdAt)).limit(20);

    const pending = transactions
      .filter(t => t.status === "pending")
      .reduce((acc, t) => acc + Number(t.amount), 0);

    res.json({
      available: Number(user?.walletBalance ?? 0),
      pending,
      currency: "USD",
      transactions: transactions.map(t => ({ ...t, amount: Number(t.amount) })),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST /wallet/withdraw — respect tier-based minimum from features ──────
router.post("/wallet/withdraw", requireAuth, async (req: any, res) => {
  try {
    const { amount, method, details, accountDetails } = req.body;
    const payoutDetails = details ?? accountDetails;
    const amountNum = Number(amount);

    if (!amountNum || amountNum <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    // Look up tier-based minimum payout
    const [user] = await db.select({ walletBalance: usersTable.walletBalance, subscriptionTier: usersTable.subscriptionTier })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    const tier = user?.subscriptionTier ?? "free";
    const minByTier: Record<string, number> = { free: 50, pro: 25, enterprise: 10 };
    const minimum = minByTier[tier] ?? 50;

    if (amountNum < minimum) {
      res.status(400).json({ error: `Minimum withdrawal for ${tier} plan is $${minimum}` });
      return;
    }

    if (!user || Number(user.walletBalance) < amountNum) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    // Insert withdrawal request (for admin approval)
    const [req2] = await db.insert(withdrawalRequestsTable).values({
      userId: req.userId,
      amount: String(amountNum),
      method: method ?? "paypal",
      details: payoutDetails ?? null,
      status: "pending",
    }).returning();

    // Mark pending in wallet transactions
    await db.insert(walletTransactionsTable).values({
      userId: req.userId,
      type: "withdrawal",
      amount: String(amountNum),
      status: "pending",
      description: `Withdrawal request via ${method ?? "paypal"} — awaiting admin approval`,
      reference: `withdrawal_request_${req2.id}`,
    });

    res.json({ ok: true, message: "Withdrawal request submitted — admin will review within 1-2 business days", requestId: req2.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET /wallet/revenue-history — per-sale revenue split history ──────────
router.get("/wallet/revenue-history", requireAuth, async (req: any, res) => {
  try {
    const history = await db.execute(sql`
      SELECT rs.*, p.title AS product_title, o.payment_provider, o.buyer_email
      FROM revenue_shares rs
      LEFT JOIN products p ON p.id = rs.product_id
      LEFT JOIN orders o ON o.id = rs.order_id
      WHERE rs.seller_id = ${req.userId}
      ORDER BY rs.created_at DESC
      LIMIT 100
    `);
    res.json(Array.isArray(history) ? history : (history as any).rows ?? []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET /wallet/earnings-stats (legacy) ──────────────────────────────────
router.get("/wallet/earnings-stats", requireAuth, async (req: any, res) => {
  try {
    const products = await db.select({
      id: productsTable.id,
      title: productsTable.title,
      totalSales: productsTable.totalSales,
      totalRevenue: productsTable.totalRevenue,
      viewCount: productsTable.viewCount,
      isPublished: productsTable.isPublished,
      price: productsTable.price,
    }).from(productsTable).where(eq(productsTable.userId, req.userId));

    const totalRevenue = products.reduce((acc, p) => acc + Number(p.totalRevenue), 0);
    const totalSales = products.reduce((acc, p) => acc + (p.totalSales ?? 0), 0);
    const totalViews = products.reduce((acc, p) => acc + (p.viewCount ?? 0), 0);
    const publishedCount = products.filter(p => p.isPublished).length;
    const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : "0";

    const [user] = await db.select({ walletBalance: usersTable.walletBalance }).from(usersTable)
      .where(eq(usersTable.id, req.userId)).limit(1);

    const topProducts = products
      .filter(p => p.isPublished)
      .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
      .slice(0, 5)
      .map(p => ({ ...p, price: Number(p.price), totalRevenue: Number(p.totalRevenue) }));

    res.json({
      totalRevenue,
      totalSales,
      totalViews,
      publishedProducts: publishedCount,
      conversionRate: Number(conversionRate),
      walletBalance: Number(user?.walletBalance ?? 0),
      topProducts,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
