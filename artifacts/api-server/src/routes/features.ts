import { Router } from "express";
import { db } from "@workspace/db";
import { featuresTable, usersTable, userFeatureOverridesTable } from "@workspace/db";
import { eq, sql, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

const router = Router();

// ─── Complete feature catalog ──────────────────────────────────────────────
export const FEATURE_CATALOG: Array<{
  key: string; label: string; description: string; category: string;
  tiersAllowed: string[]; limits: Record<string, any>;
}> = [
  // ── AI Tools ──
  {
    key: "ai_content", label: "AI Content Generator", category: "AI Tools",
    description: "Generate viral scripts, captions, hooks and content ideas with AI",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: { free: { count: 5, unit: "per day" }, pro: { count: 50, unit: "per day" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "ai_thumbnails", label: "AI Thumbnail Generator", category: "AI Tools",
    description: "Generate eye-catching thumbnails and cover images with AI",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: { free: { count: 3, unit: "per day" }, pro: { count: 30, unit: "per day" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "ai_pdf", label: "AI PDF Generator", category: "AI Tools",
    description: "Generate branded PDF guides, ebooks and lead magnets with AI",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: { free: { count: 2, unit: "per day" }, pro: { count: 20, unit: "per day" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "ai_video", label: "AI Video Model", category: "AI Tools",
    description: "Generate short video content and reels with AI models",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "not available" }, pro: { count: 10, unit: "per day" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "ai_scripts", label: "AI Script Writer", category: "AI Tools",
    description: "Generate long-form video scripts and storytelling frameworks",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: { free: { count: 2, unit: "per day" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  // ── Products ──
  {
    key: "product_create", label: "Create Digital Products", category: "Products",
    description: "Create and sell digital products — ebooks, courses, templates, software",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: { free: { count: 3, unit: "products total" }, pro: { count: 25, unit: "products total" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "product_landing_page", label: "AI Landing Page Generator", category: "Products",
    description: "Generate a high-converting product landing page with AI copywriting",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "product_campaign", label: "Viral Campaign Generator", category: "Products",
    description: "Generate a full viral marketing campaign including social posts, ads and email copy",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "product_sellability", label: "AI Sellability Report", category: "Products",
    description: "Get an AI-powered score and improvement report on your product's market potential",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "product_publish", label: "Publish to Store", category: "Products",
    description: "Publish products to your public store and start accepting payments",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: { free: { count: 3, unit: "products" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  // ── Email Marketing ──
  {
    key: "email_sequences", label: "Email Sequences", category: "Email Marketing",
    description: "Build automated drip email sequences that nurture buyers after purchase",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: 5, unit: "sequences" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "email_broadcast", label: "Email Broadcasts", category: "Email Marketing",
    description: "Send one-off broadcast emails to your entire subscriber list",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "email_analytics", label: "Email Analytics", category: "Email Marketing",
    description: "View open rates, click rates, engagement funnels and per-email performance",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  // ── Automation ──
  {
    key: "automations", label: "Automation Engine", category: "Automation",
    description: "Build AI-powered automation workflows with 25+ trigger/action blocks",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: 5, unit: "automations" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  {
    key: "automation_marketplace", label: "Automation Marketplace", category: "Automation",
    description: "Browse and install ready-made automation templates from the marketplace",
    tiersAllowed: ["pro", "enterprise"],
    limits: { free: { count: 0, unit: "upgrade required" }, pro: { count: -1, unit: "unlimited" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  // ── Growth ──
  {
    key: "affiliate_program", label: "Affiliate Program", category: "Growth",
    description: "Share your affiliate code and earn commissions from referrals",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: {
      free: { count: 1, unit: "link, standard rate" },
      pro: { count: -1, unit: "unlimited links, boosted rate" },
      enterprise: { count: -1, unit: "unlimited links, custom rate" },
    },
  },
  {
    key: "trending_topics", label: "Trending Topics Research", category: "Growth",
    description: "Discover trending topics, viral ideas and high-opportunity content niches",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: {
      free: { count: 10, unit: "per day" },
      pro: { count: -1, unit: "unlimited" },
      enterprise: { count: -1, unit: "unlimited" },
    },
  },
  // ── Finance ──
  {
    key: "wallet_payouts", label: "Wallet Payouts", category: "Finance",
    description: "Request a payout of your wallet balance to PayPal, bank transfer or crypto",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: {
      free: { count: 1, unit: "per month, $50 minimum" },
      pro: { count: 4, unit: "per month, $25 minimum" },
      enterprise: { count: -1, unit: "on-demand, $10 minimum" },
    },
  },
  {
    key: "revenue_analytics", label: "Revenue Analytics", category: "Finance",
    description: "View detailed revenue breakdowns, earnings by product, and payout history",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: {
      free: { count: 1, unit: "basic dashboard" },
      pro: { count: -1, unit: "full analytics" },
      enterprise: { count: -1, unit: "full analytics + exports" },
    },
  },
  // ── Store & Branding ──
  {
    key: "custom_store", label: "Custom Creator Store", category: "Store & Branding",
    description: "Your own public store page with all products listed for buyers",
    tiersAllowed: ["free", "pro", "enterprise"],
    limits: {
      free: { count: 1, unit: "basic store" },
      pro: { count: -1, unit: "custom branding" },
      enterprise: { count: -1, unit: "priority listing + badge" },
    },
  },
  {
    key: "custom_domain", label: "Custom Domain", category: "Store & Branding",
    description: "Connect a custom domain to your creator store",
    tiersAllowed: ["enterprise"],
    limits: { free: { count: 0, unit: "not available" }, pro: { count: 0, unit: "not available" }, enterprise: { count: -1, unit: "unlimited" } },
  },
  // ── Developer ──
  {
    key: "api_keys", label: "API Key Access", category: "Developer",
    description: "Generate API keys for programmatic access to the ViralCraft API",
    tiersAllowed: ["pro", "enterprise"],
    limits: {
      free: { count: 0, unit: "upgrade required" },
      pro: { count: 3, unit: "keys" },
      enterprise: { count: -1, unit: "unlimited" },
    },
  },
  {
    key: "support_priority", label: "Priority Support", category: "Support",
    description: "Get faster response times and dedicated support",
    tiersAllowed: ["enterprise"],
    limits: {
      free: { count: 0, unit: "community support" },
      pro: { count: 0, unit: "email support" },
      enterprise: { count: -1, unit: "priority + dedicated" },
    },
  },
];

// ─── Seed / sync feature catalog to DB ────────────────────────────────────
export async function syncFeatureCatalog() {
  for (const f of FEATURE_CATALOG) {
    await db.execute(sql`
      INSERT INTO features (key, label, description, category, is_active, tiers_allowed, limits)
      VALUES (${f.key}, ${f.label}, ${f.description}, ${f.category}, true, ${JSON.stringify(f.tiersAllowed)}::jsonb, ${JSON.stringify(f.limits)}::jsonb)
      ON CONFLICT (key) DO UPDATE
        SET label = EXCLUDED.label,
            description = EXCLUDED.description,
            category = EXCLUDED.category
    `);
  }
}

// ─── Feature gate middleware factory ──────────────────────────────────────
export function requireFeature(featureKey: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const [feature] = await db.select().from(featuresTable)
        .where(eq(featuresTable.key, featureKey)).limit(1);

      if (!feature || !feature.isActive) {
        res.status(403).json({ error: "This feature is not currently available", featureKey });
        return;
      }

      const [user] = await db.select({ subscriptionTier: usersTable.subscriptionTier })
        .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

      const userTier = user?.subscriptionTier ?? "free";
      const allowed = (feature.tiersAllowed as string[]) ?? ["free", "pro", "enterprise"];

      if (!allowed.includes(userTier) && req.userRole !== "admin") {
        const minTier = ["free", "pro", "enterprise"].find(t => allowed.includes(t)) ?? "pro";
        res.status(403).json({
          error: `This feature requires a ${minTier} plan`,
          featureKey,
          requiredTier: minTier,
          currentTier: userTier,
          upgradeRequired: true,
        });
        return;
      }

      req.userTier = userTier;
      next();
    } catch {
      next();
    }
  };
}

// ─── GET /features/catalog — public, no auth needed (for pricing page) ────
router.get("/features/catalog", async (_req, res) => {
  try {
    const features = await db.select().from(featuresTable)
      .orderBy(featuresTable.category, featuresTable.label);
    res.json(features);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET all features ──────────────────────────────────────────────────────
router.get("/features", requireAuth, async (_req, res) => {
  try {
    const features = await db.select().from(featuresTable)
      .orderBy(featuresTable.category, featuresTable.label);
    res.json(features);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET my feature access (based on user tier + per-user overrides) ─────
router.get("/features/my-access", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select({ subscriptionTier: usersTable.subscriptionTier, role: usersTable.role })
      .from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);

    const tier = (user?.role === "admin") ? "enterprise" : (user?.subscriptionTier ?? "free");
    const features = await db.select().from(featuresTable);

    const overrides = await db.select().from(userFeatureOverridesTable)
      .where(eq(userFeatureOverridesTable.userId, req.userId));
    const overrideMap: Record<string, string> = {};
    for (const o of overrides) overrideMap[o.featureKey] = o.access;

    const access: Record<string, {
      allowed: boolean; tier: string; limit: any; isActive: boolean; label: string; category: string; override?: string;
    }> = {};

    for (const f of features) {
      const tiersAllowed = (f.tiersAllowed as string[]) ?? ["free", "pro", "enterprise"];
      let allowed = f.isActive && (tiersAllowed.includes(tier) || user?.role === "admin");
      const limits = (f.limits as Record<string, any>) ?? {};
      const override = overrideMap[f.key];
      if (override === "granted") allowed = true;
      if (override === "revoked") allowed = false;
      access[f.key] = {
        allowed,
        tier,
        limit: limits[tier] ?? null,
        isActive: f.isActive,
        label: f.label,
        category: f.category,
        ...(override ? { override } : {}),
      };
    }

    res.json({ tier, isAdmin: user?.role === "admin", features: access });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: toggle global on/off ──────────────────────────────────────────
router.patch("/features/:id/toggle", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    const [updated] = await db.update(featuresTable).set({ isActive })
      .where(eq(featuresTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: update tier access for a feature ─────────────────────────────
router.patch("/admin/features/:id/tiers", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { tiersAllowed, limits, isActive } = req.body;

    const patch: any = {};
    if (tiersAllowed !== undefined) patch.tiersAllowed = tiersAllowed;
    if (limits !== undefined) patch.limits = limits;
    if (isActive !== undefined) patch.isActive = isActive;

    const [updated] = await db.update(featuresTable).set(patch)
      .where(eq(featuresTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: bulk update tier config for all features ─────────────────────
router.post("/admin/features/bulk-tier-update", requireAdmin, async (req: any, res) => {
  try {
    const updates: Array<{ id: number; tiersAllowed: string[]; limits?: any; isActive?: boolean }> = req.body;
    const results = [];
    for (const u of updates) {
      const patch: any = { tiersAllowed: u.tiersAllowed };
      if (u.limits !== undefined) patch.limits = u.limits;
      if (u.isActive !== undefined) patch.isActive = u.isActive;
      const [updated] = await db.update(featuresTable).set(patch)
        .where(eq(featuresTable.id, u.id)).returning();
      if (updated) results.push(updated);
    }
    res.json({ ok: true, updated: results.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PER-USER FEATURE OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET users list (simple, for selection UI) ────────────────────────────
router.get("/admin/user-features/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username,
      subscriptionTier: usersTable.subscriptionTier,
      role: usersTable.role,
    }).from(usersTable).orderBy(usersTable.email);
    res.json(users);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET feature access for a specific user (tier + overrides) ────────────
router.get("/admin/user-features/:userId", requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select({ subscriptionTier: usersTable.subscriptionTier, role: usersTable.role, email: usersTable.email, username: usersTable.username })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const tier = (user.role === "admin") ? "enterprise" : (user.subscriptionTier ?? "free");
    const features = await db.select().from(featuresTable).orderBy(featuresTable.category, featuresTable.label);
    const overrides = await db.select().from(userFeatureOverridesTable)
      .where(eq(userFeatureOverridesTable.userId, userId));
    const overrideMap: Record<string, any> = {};
    for (const o of overrides) overrideMap[o.featureKey] = o;

    const access = features.map(f => {
      const tiersAllowed = (f.tiersAllowed as string[]) ?? ["free", "pro", "enterprise"];
      const tierAllowed = f.isActive && tiersAllowed.includes(tier);
      const override = overrideMap[f.key] ?? null;
      let effective = tierAllowed;
      if (override?.access === "granted") effective = true;
      if (override?.access === "revoked") effective = false;
      return {
        featureId: f.id,
        featureKey: f.key,
        label: f.label,
        description: f.description,
        category: f.category,
        isActive: f.isActive,
        tierAllowed,
        override: override ? { id: override.id, access: override.access, reason: override.reason } : null,
        effective,
      };
    });

    res.json({ userId, email: user.email, username: user.username, tier, access });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST set override for one user ───────────────────────────────────────
router.post("/admin/user-features/override", requireAdmin, async (req: any, res) => {
  try {
    const { userId, featureKey, access, reason } = req.body;
    if (!userId || !featureKey || !["granted", "revoked"].includes(access)) {
      res.status(400).json({ error: "userId, featureKey, and access ('granted'|'revoked') required" }); return;
    }
    await db.execute(sql`
      INSERT INTO user_feature_overrides (user_id, feature_key, access, reason)
      VALUES (${userId}, ${featureKey}, ${access}, ${reason ?? null})
      ON CONFLICT (user_id, feature_key) DO UPDATE
        SET access = EXCLUDED.access, reason = EXCLUDED.reason, created_at = now()
    `);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST bulk override: apply to multiple users at once ──────────────────
router.post("/admin/user-features/bulk-override", requireAdmin, async (req: any, res) => {
  try {
    const { userIds, featureKey, access, reason } = req.body;
    if (!Array.isArray(userIds) || !featureKey || !["granted", "revoked"].includes(access)) {
      res.status(400).json({ error: "userIds (array), featureKey, and access required" }); return;
    }
    let count = 0;
    for (const userId of userIds) {
      await db.execute(sql`
        INSERT INTO user_feature_overrides (user_id, feature_key, access, reason)
        VALUES (${userId}, ${featureKey}, ${access}, ${reason ?? null})
        ON CONFLICT (user_id, feature_key) DO UPDATE
          SET access = EXCLUDED.access, reason = EXCLUDED.reason, created_at = now()
      `);
      count++;
    }
    res.json({ ok: true, updated: count });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE remove override for one user ─────────────────────────────────
router.delete("/admin/user-features/override", requireAdmin, async (req: any, res) => {
  try {
    const { userId, featureKey } = req.body;
    await db.delete(userFeatureOverridesTable)
      .where(and(eq(userFeatureOverridesTable.userId, userId), eq(userFeatureOverridesTable.featureKey, featureKey)));
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE clear ALL overrides for a user ────────────────────────────────
router.delete("/admin/user-features/all", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.body;
    await db.delete(userFeatureOverridesTable).where(eq(userFeatureOverridesTable.userId, userId));
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── POST apply override to ALL users at once ─────────────────────────────
router.post("/admin/user-features/override-all", requireAdmin, async (req: any, res) => {
  try {
    const { featureKey, access, reason } = req.body;
    if (!featureKey || !["granted", "revoked"].includes(access)) {
      res.status(400).json({ error: "featureKey and access ('granted'|'revoked') required" }); return;
    }
    const users = await db.select({ id: usersTable.id }).from(usersTable);
    let count = 0;
    for (const user of users) {
      await db.execute(sql`
        INSERT INTO user_feature_overrides (user_id, feature_key, access, reason)
        VALUES (${user.id}, ${featureKey}, ${access}, ${reason ?? null})
        ON CONFLICT (user_id, feature_key) DO UPDATE
          SET access = EXCLUDED.access, reason = EXCLUDED.reason, created_at = now()
      `);
      count++;
    }
    res.json({ ok: true, updated: count });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE clear overrides for ALL users for a feature ───────────────────
router.delete("/admin/user-features/override-all", requireAdmin, async (req: any, res) => {
  try {
    const { featureKey } = req.body;
    if (!featureKey) { res.status(400).json({ error: "featureKey required" }); return; }
    await db.delete(userFeatureOverridesTable)
      .where(eq(userFeatureOverridesTable.featureKey, featureKey));
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── GET stats: how many users have overrides per feature ─────────────────
router.get("/admin/user-features/stats", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT feature_key, access, COUNT(*) as count
      FROM user_feature_overrides
      GROUP BY feature_key, access
    `);
    const stats: Record<string, { granted: number; revoked: number }> = {};
    for (const row of (rows as any).rows ?? rows) {
      const key = row.feature_key;
      if (!stats[key]) stats[key] = { granted: 0, revoked: 0 };
      if (row.access === "granted") stats[key].granted = Number(row.count);
      if (row.access === "revoked") stats[key].revoked = Number(row.count);
    }
    res.json(stats);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
