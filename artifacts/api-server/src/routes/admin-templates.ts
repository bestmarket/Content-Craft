import { Router } from "express";
import { db } from "@workspace/db";
import { templateProductsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

// GET /admin/templates — all templates with user info
router.get("/admin/templates", requireAdmin, async (req: any, res) => {
  try {
    const templates = await db.select({
      id: templateProductsTable.id,
      type: templateProductsTable.type,
      title: templateProductsTable.title,
      price: templateProductsTable.price,
      publishStatus: templateProductsTable.publishStatus,
      isPublishedToStore: templateProductsTable.isPublishedToStore,
      isPublishedToMarketplace: templateProductsTable.isPublishedToMarketplace,
      isFeatured: templateProductsTable.isFeatured,
      totalSales: templateProductsTable.totalSales,
      totalRevenue: templateProductsTable.totalRevenue,
      generationStatus: templateProductsTable.generationStatus,
      sellabilityScore: templateProductsTable.sellabilityScore,
      createdAt: templateProductsTable.createdAt,
      authorName: templateProductsTable.authorName,
      userId: templateProductsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
    }).from(templateProductsTable)
      .leftJoin(usersTable, eq(templateProductsTable.userId, usersTable.id))
      .orderBy(desc(templateProductsTable.createdAt));

    const [stats] = await db.select({
      total: sql<number>`count(*)`,
      published: sql<number>`count(*) filter (where is_published_to_marketplace)`,
      pending: sql<number>`count(*) filter (where publish_status = 'pending_approval')`,
      totalRevenue: sql<string>`coalesce(sum(total_revenue::numeric), 0)`,
    }).from(templateProductsTable);

    res.json({ templates, stats });
  } catch (err: any) {
    req.log.error({ err }, "Admin templates list error");
    res.status(500).json({ error: "Failed" });
  }
});

// POST /admin/templates/:id/approve
router.post("/admin/templates/:id/approve", requireAdmin, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    await db.update(templateProductsTable).set({
      publishStatus: "published",
      isPublishedToMarketplace: true,
    }).where(eq(templateProductsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /admin/templates/:id/reject
router.post("/admin/templates/:id/reject", requireAdmin, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    await db.update(templateProductsTable).set({
      publishStatus: "rejected",
      isPublishedToMarketplace: false,
      generationError: reason ?? "Rejected by admin",
    }).where(eq(templateProductsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /admin/templates/:id/feature
router.post("/admin/templates/:id/feature", requireAdmin, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [current] = await db.select({ isFeatured: templateProductsTable.isFeatured })
      .from(templateProductsTable).where(eq(templateProductsTable.id, id));
    await db.update(templateProductsTable).set({
      isFeatured: !current?.isFeatured,
    }).where(eq(templateProductsTable.id, id));
    res.json({ success: true, isFeatured: !current?.isFeatured });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// DELETE /admin/templates/:id
router.delete("/admin/templates/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(templateProductsTable).where(eq(templateProductsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// POST /admin/templates/:id/toggle-marketplace
router.post("/admin/templates/:id/toggle-marketplace", requireAdmin, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const [current] = await db.select({ isPublishedToMarketplace: templateProductsTable.isPublishedToMarketplace })
      .from(templateProductsTable).where(eq(templateProductsTable.id, id));
    const newVal = !current?.isPublishedToMarketplace;
    await db.update(templateProductsTable).set({
      isPublishedToMarketplace: newVal,
      publishStatus: newVal ? "published" : "draft",
    }).where(eq(templateProductsTable.id, id));
    res.json({ success: true, isPublishedToMarketplace: newVal });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
