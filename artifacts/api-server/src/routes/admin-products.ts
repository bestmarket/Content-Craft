import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (req.userRole !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  next();
}

// Overview stats
router.get("/admin/products/overview", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [totals] = await db.select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where "is_published" = true)::int`,
      pending: sql<number>`count(*) filter (where "publish_status" = 'pending_approval')::int`,
      draft: sql<number>`count(*) filter (where "publish_status" = 'draft' or "publish_status" is null)::int`,
      rejected: sql<number>`count(*) filter (where "publish_status" = 'rejected')::int`,
      totalRevenue: sql<number>`coalesce(sum("total_revenue"::numeric), 0)::float`,
      totalSales: sql<number>`coalesce(sum("total_sales"), 0)::int`,
    }).from(productsTable);
    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// List all products with user info
router.get("/admin/products", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const statusFilter = (req.query.status as string) || "all";
    const items = await db.select({
      id: productsTable.id,
      title: productsTable.title,
      topic: productsTable.topic,
      price: productsTable.price,
      category: productsTable.category,
      productType: productsTable.productType,
      publishStatus: productsTable.publishStatus,
      isPublished: productsTable.isPublished,
      emailStatus: productsTable.emailStatus,
      totalSales: productsTable.totalSales,
      totalRevenue: productsTable.totalRevenue,
      sellabilityScore: productsTable.sellabilityScore,
      createdAt: productsTable.createdAt,
      hasLandingPage: sql<boolean>`("landing_page" is not null)`,
      hasEmailSeq: sql<boolean>`("email_sequence_30_days" is not null)`,
      hasMarketing: sql<boolean>`("marketing_assets" is not null)`,
      userId: productsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.userId, usersTable.id))
      .orderBy(desc(productsTable.createdAt));

    const filtered = statusFilter === "all"
      ? items
      : items.filter((p) => {
          if (statusFilter === "pending") return p.publishStatus === "pending_approval";
          if (statusFilter === "published") return p.isPublished;
          if (statusFilter === "draft") return !p.isPublished && p.publishStatus !== "pending_approval";
          if (statusFilter === "rejected") return p.publishStatus === "rejected";
          return true;
        });

    res.json(filtered.map((p) => ({ ...p, price: Number(p.price), totalRevenue: Number(p.totalRevenue) })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Approve product
router.patch("/admin/products/:id/approve", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const id = parseInt((_req as any).params.id);
    await db.update(productsTable)
      .set({ isPublished: true, publishStatus: "published", updatedAt: new Date() })
      .where(eq(productsTable.id, id));
    res.json({ message: "Product approved and published" });
  } catch (err) {
    res.status(500).json({ error: "Approve failed" });
  }
});

// Reject product
router.patch("/admin/products/:id/reject", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(productsTable)
      .set({ isPublished: false, publishStatus: "rejected", updatedAt: new Date() })
      .where(eq(productsTable.id, id));
    res.json({ message: "Product rejected" });
  } catch (err) {
    res.status(500).json({ error: "Reject failed" });
  }
});

// Feature / un-feature a product
router.patch("/admin/products/:id/feature", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { featured } = req.body;
    await db.update(productsTable)
      .set({ publishStatus: featured ? "featured" : "published", updatedAt: new Date() })
      .where(eq(productsTable.id, id));
    res.json({ message: featured ? "Product featured" : "Feature removed" });
  } catch (err) {
    res.status(500).json({ error: "Feature failed" });
  }
});

// Disable / re-enable product
router.patch("/admin/products/:id/disable", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { disabled } = req.body;
    await db.update(productsTable)
      .set({ isPublished: !disabled, publishStatus: disabled ? "disabled" : "published", updatedAt: new Date() })
      .where(eq(productsTable.id, id));
    res.json({ message: disabled ? "Product disabled" : "Product re-enabled" });
  } catch (err) {
    res.status(500).json({ error: "Disable failed" });
  }
});

export default router;
