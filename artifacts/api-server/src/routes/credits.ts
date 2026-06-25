import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, settingsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { logger } from "../lib/logger";

const router = Router();

// ── Credit costs per action ──────────────────────────────────────────────────
export const CREDIT_COSTS: Record<string, number> = {
  ai_content: 1,
  ai_thumbnails: 2,
  ai_pdf: 5,
  ai_video: 10,
  ai_scripts: 1,
  automations: 3,
  scryvox_product: 8,
  prompt_package: 4,
  landing_page: 3,
  saas_builder: 5,
};

// ── Daily free refill by tier ─────────────────────────────────────────────────
export const DAILY_FREE_CREDITS: Record<string, number> = {
  free: 20,
  pro: 200,
  enterprise: -1, // unlimited
};

// ── Credit pack definitions (for purchase) ───────────────────────────────────
export const CREDIT_PACKS = [
  { id: "starter", name: "Starter Pack", credits: 100, price: 4.99, popular: false, pricePerCredit: 0.05 },
  { id: "creator", name: "Creator Pack", credits: 500, price: 19.99, popular: true, pricePerCredit: 0.04 },
  { id: "pro", name: "Pro Pack", credits: 1500, price: 49.99, popular: false, pricePerCredit: 0.033 },
  { id: "agency", name: "Agency Pack", credits: 5000, price: 149.99, popular: false, pricePerCredit: 0.03 },
];

// ── Get today's date string (UTC) ────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Auto-refill if new day (called before every deduction) ───────────────────
export async function ensureDailyRefill(userId: number): Promise<{ credits: number; tier: string }> {
  const [user] = await db.select({
    aiCredits: usersTable.aiCredits,
    aiCreditsLastRefill: usersTable.aiCreditsLastRefill,
    subscriptionTier: usersTable.subscriptionTier,
    role: usersTable.role,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!user) throw new Error("User not found");

  const tier = user.role === "admin" ? "enterprise" : (user.subscriptionTier ?? "free");
  const today = todayStr();
  const lastRefill = user.aiCreditsLastRefill;

  if (lastRefill !== today) {
    const dailyAmount = DAILY_FREE_CREDITS[tier] ?? 20;
    if (dailyAmount === -1) {
      // Unlimited — just update refill date, set a high sentinel
      await db.update(usersTable).set({ aiCreditsLastRefill: today, aiCredits: 999999 }).where(eq(usersTable.id, userId));
      return { credits: 999999, tier };
    }
    // Refill to daily amount (never below what they already have from paid packs)
    const newBalance = Math.max(user.aiCredits ?? 0, dailyAmount);
    await db.update(usersTable).set({ aiCreditsLastRefill: today, aiCredits: newBalance }).where(eq(usersTable.id, userId));
    return { credits: newBalance, tier };
  }

  return { credits: user.aiCredits ?? 0, tier };
}

// ── Deduct credits — returns false if insufficient ───────────────────────────
export async function deductCredits(userId: number, action: string, role?: string): Promise<{ ok: boolean; remaining: number; cost: number }> {
  if (role === "admin") return { ok: true, remaining: 999999, cost: 0 };

  const cost = CREDIT_COSTS[action] ?? 1;
  const { credits, tier } = await ensureDailyRefill(userId);

  if (tier === "enterprise" || credits === 999999) return { ok: true, remaining: 999999, cost: 0 };

  if (credits < cost) return { ok: false, remaining: credits, cost };

  const [updated] = await db.update(usersTable)
    .set({ aiCredits: sql`${usersTable.aiCredits} - ${cost}` })
    .where(eq(usersTable.id, userId))
    .returning({ aiCredits: usersTable.aiCredits });

  return { ok: true, remaining: updated?.aiCredits ?? 0, cost };
}

// ── Add credits (for purchases) ──────────────────────────────────────────────
export async function addCredits(userId: number, amount: number, description: string): Promise<number> {
  const [updated] = await db.update(usersTable)
    .set({ aiCredits: sql`${usersTable.aiCredits} + ${amount}` })
    .where(eq(usersTable.id, userId))
    .returning({ aiCredits: usersTable.aiCredits });

  logger.info({ userId, amount, description }, "[Credits] Credits added");
  return updated?.aiCredits ?? 0;
}

// ── Middleware factory — deducts before route runs ───────────────────────────
export function requireCredits(action: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const result = await deductCredits(req.userId, action, req.userRole);
      if (!result.ok) {
        res.status(402).json({
          error: "Insufficient AI credits",
          code: "INSUFFICIENT_CREDITS",
          required: result.cost,
          remaining: result.remaining,
          action,
          upgradeUrl: "/pricing",
          buyCreditsUrl: "/credits",
        });
        return;
      }
      req.creditsUsed = result.cost;
      req.creditsRemaining = result.remaining;
      next();
    } catch (err) {
      logger.error({ err }, "[Credits] deductCredits error");
      next(); // don't block on credit errors — fail open
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /credits/balance — current balance + today's refill info
router.get("/credits/balance", requireAuth, async (req: any, res) => {
  try {
    const { credits, tier } = await ensureDailyRefill(req.userId);
    const dailyRefill = DAILY_FREE_CREDITS[tier] ?? 20;
    res.json({
      credits: credits === 999999 ? null : credits,
      unlimited: credits === 999999,
      tier,
      dailyRefill: dailyRefill === -1 ? null : dailyRefill,
      costs: CREDIT_COSTS,
      packs: CREDIT_PACKS,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /credits/packs — list purchasable packs
router.get("/credits/packs", async (_req, res) => {
  res.json({ packs: CREDIT_PACKS });
});

// POST /credits/purchase — crypto/manual purchase (admin confirms)
router.post("/credits/purchase", requireAuth, async (req: any, res) => {
  try {
    const { packId, txHash, walletFrom } = req.body;
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) { res.status(400).json({ error: "Invalid pack" }); return; }

    // Record pending purchase — admin will confirm
    await db.insert(walletTransactionsTable).values({
      userId: req.userId,
      type: "credit",
      amount: String(pack.price),
      status: "pending",
      description: `Credit pack purchase: ${pack.name} (${pack.credits} credits) — awaiting confirmation`,
      reference: `credit_pack_${packId}_${txHash ?? Date.now()}`,
    });

    res.json({
      ok: true,
      message: "Purchase submitted. Credits will be added after payment confirmation (usually within 1 hour).",
      pack,
      txHash: txHash ?? null,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /admin/credits/grant — admin manually grants credits
router.post("/admin/credits/grant", requireAdmin, async (req: any, res) => {
  try {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount || amount <= 0) { res.status(400).json({ error: "userId and positive amount required" }); return; }
    const newBalance = await addCredits(Number(userId), Number(amount), reason ?? "Admin grant");
    res.json({ ok: true, newBalance, userId, amount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /admin/credits/confirm-purchase — confirm a pending purchase and add credits
router.post("/admin/credits/confirm-purchase", requireAdmin, async (req: any, res) => {
  try {
    const { transactionId, userId, packId } = req.body;
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) { res.status(400).json({ error: "Invalid pack" }); return; }

    // Mark transaction complete
    if (transactionId) {
      await db.update(walletTransactionsTable)
        .set({ status: "completed" })
        .where(eq(walletTransactionsTable.id, Number(transactionId)));
    }

    const newBalance = await addCredits(Number(userId), pack.credits, `Credit pack: ${pack.name}`);
    res.json({ ok: true, creditsAdded: pack.credits, newBalance });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /admin/credits/overview — all users' credit balances
router.get("/admin/credits/overview", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      subscriptionTier: usersTable.subscriptionTier,
      aiCredits: usersTable.aiCredits,
      aiCreditsLastRefill: usersTable.aiCreditsLastRefill,
    }).from(usersTable).orderBy(desc(usersTable.aiCredits));

    const pendingPurchases = await db.select().from(walletTransactionsTable)
      .where(sql`type = 'credit' AND status = 'pending' AND description LIKE '%Credit pack%'`)
      .orderBy(desc(walletTransactionsTable.createdAt));

    res.json({ users, pendingPurchases, packs: CREDIT_PACKS, costs: CREDIT_COSTS });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /admin/credits/costs — update credit costs
router.patch("/admin/credits/costs", requireAdmin, async (req: any, res) => {
  try {
    const { costs } = req.body;
    await db.execute(sql`
      INSERT INTO settings (key, value) VALUES ('credit_costs', ${JSON.stringify(costs)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);
    res.json({ ok: true, costs });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
