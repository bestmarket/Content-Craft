import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { creditAffiliateCommission } from "./affiliate";

const router = Router();

router.get("/subscriptions/my", requireAuth, async (req: any, res) => {
  try {
    const [sub] = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const [user] = await db.select({ subscriptionTier: usersTable.subscriptionTier, subscriptionExpiresAt: usersTable.subscriptionExpiresAt })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    res.json({
      plan: user?.subscriptionTier ?? "free",
      status: sub?.status ?? "active",
      trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      features: user?.subscriptionTier === "pro" ? {
        unlimitedPdfs: true,
        unlimitedLandingPages: true,
        unlimitedStore: true,
        unlimitedCampaigns: true,
        prioritySupport: true,
      } : {
        unlimitedPdfs: false,
        unlimitedLandingPages: false,
        unlimitedStore: false,
        unlimitedCampaigns: false,
        prioritySupport: false,
      },
    });
  } catch (err) {
    req.log.error({ err }, "GetSubscription error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/subscriptions/start-trial", requireAuth, async (req: any, res) => {
  try {
    const [existing] = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId)).limit(1);
    if (existing) { res.status(400).json({ error: "Already have a subscription" }); return; }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 2);

    const [sub] = await db.insert(subscriptionsTable).values({
      userId: req.userId,
      plan: "pro",
      status: "trialing",
      trialEndsAt: trialEnd,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEnd,
    }).returning();

    await db.update(usersTable).set({
      subscriptionTier: "pro",
      subscriptionExpiresAt: trialEnd,
    }).where(eq(usersTable.id, req.userId));

    res.json({ message: "2-day free trial started!", trialEndsAt: trialEnd.toISOString() });
  } catch (err) {
    req.log.error({ err }, "StartTrial error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/subscriptions/upgrade", requireAuth, async (req: any, res) => {
  try {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [existing] = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId)).limit(1);

    if (existing) {
      await db.update(subscriptionsTable).set({
        plan: "pro", status: "active",
        currentPeriodStart: new Date(), currentPeriodEnd: periodEnd,
      }).where(eq(subscriptionsTable.userId, req.userId));
    } else {
      await db.insert(subscriptionsTable).values({
        userId: req.userId, plan: "pro", status: "active",
        currentPeriodStart: new Date(), currentPeriodEnd: periodEnd,
      });
    }

    await db.update(usersTable).set({ subscriptionTier: "pro", subscriptionExpiresAt: periodEnd })
      .where(eq(usersTable.id, req.userId));

    await creditAffiliateCommission(req.userId, "upgrade");

    res.json({ message: "Upgraded to Pro!", plan: "pro", expiresAt: periodEnd.toISOString() });
  } catch (err) {
    req.log.error({ err }, "UpgradeSubscription error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
