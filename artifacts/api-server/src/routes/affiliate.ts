import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, affiliateCommissionsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { requireAuth } from "./auth";
import { nanoid } from "nanoid";

const router = Router();

function generateAffiliateCode(name: string): string {
  const base = name.replace(/\s+/g, "").toLowerCase().slice(0, 6);
  return base + nanoid(4).toUpperCase();
}

async function ensureAffiliateCode(userId: number, name: string): Promise<string> {
  const [user] = await db.select({ affiliateCode: usersTable.affiliateCode })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (user?.affiliateCode) return user.affiliateCode;

  let code = generateAffiliateCode(name);
  let attempt = 0;
  while (attempt < 10) {
    const exists = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.affiliateCode, code)).limit(1);
    if (exists.length === 0) break;
    code = generateAffiliateCode(name) + attempt;
    attempt++;
  }

  await db.update(usersTable).set({ affiliateCode: code }).where(eq(usersTable.id, userId));
  return code;
}

router.get("/affiliate/stats", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select({ name: usersTable.name, affiliateCode: usersTable.affiliateCode })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    const code = await ensureAffiliateCode(req.userId, user?.name ?? "user");

    const referrals = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      subscriptionTier: usersTable.subscriptionTier,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.referredBy, req.userId));

    const commissions = await db.select()
      .from(affiliateCommissionsTable)
      .where(eq(affiliateCommissionsTable.referrerId, req.userId))
      .orderBy(desc(affiliateCommissionsTable.createdAt))
      .limit(50);

    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
    const paidOut = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
    const pending = totalEarned - paidOut;

    res.json({
      affiliateCode: code,
      referralLink: `/register?ref=${code}`,
      stats: {
        totalReferrals: referrals.length,
        activeReferrals: referrals.filter(r => r.subscriptionTier === "pro").length,
        totalEarned: totalEarned.toFixed(2),
        pendingPayout: pending.toFixed(2),
        paidOut: paidOut.toFixed(2),
      },
      referrals: referrals.map(r => ({
        id: r.id,
        name: r.name,
        plan: r.subscriptionTier,
        joinedAt: r.createdAt,
      })),
      commissions,
    });
  } catch (err: any) {
    req.log.error({ err }, "AffiliateStats error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/affiliate/leaderboard", requireAuth, async (_req: any, res) => {
  try {
    const results = await db.select({
      referrerId: affiliateCommissionsTable.referrerId,
      total: sql<number>`sum(${affiliateCommissionsTable.amount})`,
      count: count(),
    })
      .from(affiliateCommissionsTable)
      .groupBy(affiliateCommissionsTable.referrerId)
      .orderBy(sql`sum(${affiliateCommissionsTable.amount}) desc`)
      .limit(10);

    const withNames = await Promise.all(results.map(async (r) => {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.referrerId)).limit(1);
      return { name: user?.name ?? "Creator", total: r.total, referrals: r.count };
    }));

    res.json(withNames);
  } catch (err: any) {
    console.error("Leaderboard error", err);
    res.status(500).json({ error: "Server error" });
  }
});

export async function creditAffiliateCommission(
  refereeId: number,
  type: "signup" | "upgrade" | "sale",
  saleAmount?: number
) {
  try {
    const [referee] = await db.select({ referredBy: usersTable.referredBy })
      .from(usersTable).where(eq(usersTable.id, refereeId)).limit(1);

    if (!referee?.referredBy) return;
    const referrerId = referee.referredBy;

    let amount = 0;
    let description = "";

    const PRO_PRICE = 29.00;
    const COMMISSION_RATE = 0.30;

    if (type === "signup") {
      amount = 1.00;
      description = "Referral signup bonus";
    } else if (type === "upgrade") {
      amount = parseFloat((PRO_PRICE * COMMISSION_RATE).toFixed(2));
      description = `30% commission on $${PRO_PRICE} Pro upgrade ($${amount})`;
    } else if (type === "sale" && saleAmount) {
      amount = parseFloat((saleAmount * COMMISSION_RATE).toFixed(2));
      description = `30% commission on $${saleAmount.toFixed(2)} sale`;
    }

    if (amount <= 0) return;

    await db.insert(affiliateCommissionsTable).values({
      referrerId,
      refereeId,
      type,
      amount: String(amount),
      status: "pending",
      description,
    });

    await db.update(usersTable)
      .set({ walletBalance: sql`${usersTable.walletBalance} + ${amount}` })
      .where(eq(usersTable.id, referrerId));

    await db.insert(walletTransactionsTable).values({
      userId: referrerId,
      type: "affiliate_commission",
      amount: String(amount),
      description,
      status: "completed",
    });
  } catch (err) {
    console.error("creditAffiliateCommission error:", err);
  }
}

export default router;
