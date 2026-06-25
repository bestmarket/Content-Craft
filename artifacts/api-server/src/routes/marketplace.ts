import { Router } from "express";
import { db } from "@workspace/db";
import { templateProductsTable, productsTable, usersTable, automationToolsTable } from "@workspace/db";
import { eq, desc, and, or, ilike, sql, gt } from "drizzle-orm";

const router = Router();

const CATEGORIES = [
  { key: "all", label: "All Products", emoji: "🌟" },
  { key: "ai_agent", label: "AI Agents", emoji: "🤖" },
  { key: "n8n_workflow", label: "n8n Workflows", emoji: "⚡" },
  { key: "replit_template", label: "Replit Templates", emoji: "💻" },
  { key: "chrome_extension", label: "Chrome Extensions", emoji: "🧩" },
  { key: "digital_product", label: "Digital Products", emoji: "📦" },
  { key: "automation_tool", label: "Automation Tools", emoji: "🔧" },
  { key: "web_app", label: "Web Apps", emoji: "🌐" },
  { key: "mobile_app", label: "Mobile Apps", emoji: "📱" },
];

// GET /marketplace/categories
router.get("/marketplace/categories", async (req, res) => {
  res.json({ categories: CATEGORIES });
});

// GET /marketplace/stats
router.get("/marketplace/stats", async (req, res) => {
  try {
    const [templateCount] = await db.select({ count: sql<number>`count(*)` })
      .from(templateProductsTable)
      .where(eq(templateProductsTable.isPublishedToMarketplace, true));

    const [productCount] = await db.select({ count: sql<number>`count(*)` })
      .from(productsTable)
      .where(eq(productsTable.isPublished, true));

    const [toolCount] = await db.select({ count: sql<number>`count(*)` })
      .from(automationToolsTable)
      .where(eq(automationToolsTable.isPublished, true));

    const totalListings = Number(templateCount.count) + Number(productCount.count) + Number(toolCount.count);

    const [revenueRow] = await db.select({ total: sql<string>`coalesce(sum(total_revenue::numeric), 0)` })
      .from(templateProductsTable);
    const [productRevRow] = await db.select({ total: sql<string>`coalesce(sum(total_revenue::numeric), 0)` })
      .from(productsTable);

    const totalRevenue = (parseFloat(revenueRow?.total ?? "0") + parseFloat(productRevRow?.total ?? "0")).toFixed(2);

    res.json({
      totalListings,
      totalCreators: Math.max(1, Math.floor(totalListings * 0.6)),
      totalRevenue,
      categories: CATEGORIES.length,
    });
  } catch {
    res.json({ totalListings: 0, totalCreators: 0, totalRevenue: "0", categories: CATEGORIES.length });
  }
});

// GET /marketplace/featured
router.get("/marketplace/featured", async (req, res) => {
  try {
    const templates = await db
      .select({
        id: templateProductsTable.id,
        type: templateProductsTable.type,
        title: templateProductsTable.title,
        subtitle: templateProductsTable.subtitle,
        description: templateProductsTable.description,
        coverImageUrl: templateProductsTable.coverImageUrl,
        price: templateProductsTable.price,
        originalPrice: templateProductsTable.originalPrice,
        totalSales: templateProductsTable.totalSales,
        rating: templateProductsTable.rating,
        reviewCount: templateProductsTable.reviewCount,
        category: templateProductsTable.category,
        isFeatured: templateProductsTable.isFeatured,
        authorName: templateProductsTable.authorName,
        createdAt: templateProductsTable.createdAt,
      })
      .from(templateProductsTable)
      .where(and(
        eq(templateProductsTable.isPublishedToMarketplace, true),
        eq(templateProductsTable.isFeatured, true),
      ))
      .orderBy(desc(templateProductsTable.totalSales))
      .limit(6);

    // Enrich with source = "template"
    const enriched = templates.map(t => ({ ...t, source: "template" }));
    res.json({ items: enriched });
  } catch (err: any) {
    res.json({ items: [] });
  }
});

// GET /marketplace/listings?category=&search=&sort=&page=
router.get("/marketplace/listings", async (req, res) => {
  try {
    const { category = "all", search = "", sort = "trending", page = "1" } = req.query as any;
    const limit = 24;
    const offset = (parseInt(page) - 1) * limit;

    // ── Templates ──────────────────────────────────────────────────────────────
    let templateQuery = db.select({
      id: templateProductsTable.id,
      type: templateProductsTable.type,
      title: templateProductsTable.title,
      subtitle: templateProductsTable.subtitle,
      description: templateProductsTable.description,
      coverImageUrl: templateProductsTable.coverImageUrl,
      price: templateProductsTable.price,
      originalPrice: templateProductsTable.originalPrice,
      totalSales: templateProductsTable.totalSales,
      rating: templateProductsTable.rating,
      reviewCount: templateProductsTable.reviewCount,
      category: templateProductsTable.category,
      isFeatured: templateProductsTable.isFeatured,
      authorName: templateProductsTable.authorName,
      sellabilityScore: templateProductsTable.sellabilityScore,
      createdAt: templateProductsTable.createdAt,
    }).from(templateProductsTable);

    const templateFilters = [eq(templateProductsTable.isPublishedToMarketplace, true)];
    const isTemplateCategory = ["ai_agent", "n8n_workflow", "replit_template", "chrome_extension"].includes(category);
    if (category !== "all" && isTemplateCategory) {
      templateFilters.push(eq(templateProductsTable.type, category as any));
    }
    if (search) {
      templateFilters.push(
        or(
          ilike(templateProductsTable.title, `%${search}%`),
          ilike(templateProductsTable.description, `%${search}%`),
        ) as any
      );
    }

    const templates = await (templateQuery as any)
      .where(and(...templateFilters))
      .orderBy(sort === "trending" ? desc(templateProductsTable.totalSales)
        : sort === "newest" ? desc(templateProductsTable.createdAt)
        : sort === "price_low" ? templateProductsTable.price
        : sort === "price_high" ? desc(templateProductsTable.price)
        : desc(templateProductsTable.sellabilityScore))
      .limit(limit)
      .offset(offset);

    const enrichedTemplates = templates.map((t: any) => ({ ...t, source: "template" }));

    // ── Digital Products ───────────────────────────────────────────────────────
    // When a template-specific category is selected, skip products entirely
    const skipTemplates = category === "digital_product";
    const filteredTemplates = skipTemplates ? [] : enrichedTemplates;
    let allItems = [...filteredTemplates];
    if (category === "all" || category === "digital_product") {
      const products = await db.select({
        id: productsTable.id,
        type: sql<string>`'digital_product'`,
        title: productsTable.title,
        subtitle: productsTable.subtitle,
        description: productsTable.description,
        coverImageUrl: productsTable.uploadedFileUrl,
        price: productsTable.price,
        originalPrice: productsTable.originalPrice,
        totalSales: productsTable.totalSales,
        rating: sql<string>`'0'`,
        reviewCount: sql<number>`0`,
        category: productsTable.category,
        isFeatured: sql<boolean>`false`,
        authorName: productsTable.authorName,
        sellabilityScore: productsTable.sellabilityScore,
        createdAt: productsTable.createdAt,
      }).from(productsTable)
        .where(
          search
            ? and(eq(productsTable.isPublished, true), ilike(productsTable.title, `%${search}%`))
            : eq(productsTable.isPublished, true)
        )
        .orderBy(desc(productsTable.totalSales))
        .limit(8);
      allItems = [...allItems, ...products.map((p: any) => ({ ...p, source: "product" }))];
    }

    // Sort combined
    if (sort === "trending") allItems.sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0));
    else if (sort === "newest") allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ items: allItems, page: parseInt(page), hasMore: templates.length === limit });
  } catch (err: any) {
    console.error("Marketplace listings error:", err);
    res.json({ items: [], page: 1, hasMore: false });
  }
});

// GET /marketplace/template/:id — public product page data
router.get("/marketplace/template/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [template] = await db.select().from(templateProductsTable)
      .where(eq(templateProductsTable.id, id));
    if (!template) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(templateProductsTable).set({
      viewCount: (template.viewCount ?? 0) + 1,
    }).where(eq(templateProductsTable.id, id));

    res.json(template);
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
