import { Router } from "express";
import { db } from "@workspace/db";
import {
  productAffiliateProgramsTable, productAffiliatesTable,
  affiliateMessagesTable, affiliateMaterialsTable,
  productsTable, usersTable, walletTransactionsTable,
} from "@workspace/db";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import { requireAuth } from "./auth";
import { nanoid } from "nanoid";

const router = Router();

function genTrackingCode() { return nanoid(12).toLowerCase(); }
function genInviteCode()   { return nanoid(16); }

// ─── helpers ────────────────────────────────────────────────────────────────
async function ownProgram(programId: number, sellerId: number) {
  const [p] = await db.select()
    .from(productAffiliateProgramsTable)
    .where(and(eq(productAffiliateProgramsTable.id, programId), eq(productAffiliateProgramsTable.sellerId, sellerId)))
    .limit(1);
  return p ?? null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  SELLER SIDE — manage your own affiliate programs
// ══════════════════════════════════════════════════════════════════════════════

// GET  /api/my-affiliate-programs
router.get("/my-affiliate-programs", requireAuth, async (req: any, res) => {
  try {
    const programs = await db
      .select({
        program: productAffiliateProgramsTable,
        productTitle: productsTable.title,
        productPrice: productsTable.price,
        coverImageUrl: productsTable.coverImageUrl,
      })
      .from(productAffiliateProgramsTable)
      .leftJoin(productsTable, eq(productsTable.id, productAffiliateProgramsTable.productId))
      .where(eq(productAffiliateProgramsTable.sellerId, req.userId))
      .orderBy(desc(productAffiliateProgramsTable.createdAt));

    // For each program, count affiliates
    const result = await Promise.all(programs.map(async (row) => {
      const countsRaw = await db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(CASE WHEN status='approved' THEN 1 END)::int AS approved,
          COUNT(CASE WHEN status='pending'  THEN 1 END)::int AS pending
        FROM product_affiliates WHERE program_id = ${row.program.id}
      `);
      const counts = (countsRaw.rows ?? (countsRaw as any))[0];
      return {
        ...row.program,
        productTitle: row.productTitle,
        productPrice: row.productPrice,
        coverImageUrl: row.coverImageUrl,
        affiliateCount: counts?.total ?? 0,
        approvedCount: counts?.approved ?? 0,
        pendingCount: counts?.pending ?? 0,
      };
    }));

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "ListMyAffiliatePrograms error");
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/my-affiliate-programs — create program for a product
router.post("/my-affiliate-programs", requireAuth, async (req: any, res) => {
  try {
    const { productId, commissionRate = 30, description, terms, cookieDays = 30 } = req.body;
    if (!productId) { res.status(400).json({ error: "productId required" }); return; }

    // Verify product belongs to the seller
    const [product] = await db.select({ id: productsTable.id, title: productsTable.title })
      .from(productsTable)
      .where(and(eq(productsTable.id, parseInt(productId)), eq(productsTable.userId, req.userId)))
      .limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    // Check if program already exists for this product
    const [existing] = await db.select({ id: productAffiliateProgramsTable.id })
      .from(productAffiliateProgramsTable)
      .where(and(
        eq(productAffiliateProgramsTable.productId, parseInt(productId)),
        eq(productAffiliateProgramsTable.sellerId, req.userId),
      ))
      .limit(1);
    if (existing) { res.status(409).json({ error: "Affiliate program already exists for this product" }); return; }

    const inviteCode = genInviteCode();
    const [program] = await db.insert(productAffiliateProgramsTable).values({
      productId: parseInt(productId),
      sellerId: req.userId,
      commissionRate: String(commissionRate),
      description: description ?? null,
      terms: terms ?? null,
      cookieDays: parseInt(cookieDays) || 30,
      inviteCode,
      isActive: true,
    }).returning();

    res.status(201).json(program);
  } catch (err: any) {
    req.log.error({ err }, "CreateAffiliateProgram error");
    res.status(500).json({ error: err.message ?? "Server error" });
  }
});

// PUT /api/my-affiliate-programs/:id — update program settings
router.put("/my-affiliate-programs/:id", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const { commissionRate, description, terms, isActive, cookieDays } = req.body;
    const [updated] = await db.update(productAffiliateProgramsTable).set({
      ...(commissionRate !== undefined && { commissionRate: String(commissionRate) }),
      ...(description   !== undefined && { description }),
      ...(terms         !== undefined && { terms }),
      ...(isActive      !== undefined && { isActive }),
      ...(cookieDays    !== undefined && { cookieDays: parseInt(cookieDays) }),
      updatedAt: new Date(),
    }).where(eq(productAffiliateProgramsTable.id, programId)).returning();

    res.json(updated);
  } catch (err: any) {
    req.log.error({ err }, "UpdateAffiliateProgram error");
    res.status(500).json({ error: err.message ?? "Server error" });
  }
});

// GET /api/my-affiliate-programs/:id/affiliates
router.get("/my-affiliate-programs/:id/affiliates", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const rows = await db.execute(sql`
      SELECT
        pa.id, pa.status, pa.tracking_code, pa.total_clicks, pa.total_sales,
        pa.total_earned::float, pa.joined_at, pa.approved_at, pa.notes,
        u.id AS affiliate_id, u.name AS affiliate_name, u.email AS affiliate_email,
        u.profile_picture, u.country
      FROM product_affiliates pa
      JOIN users u ON u.id = pa.affiliate_id
      WHERE pa.program_id = ${programId}
      ORDER BY pa.joined_at DESC
    `);

    res.json(rows.rows);
  } catch (err: any) {
    req.log.error({ err }, "GetProgramAffiliates error");
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/my-affiliate-programs/:id/affiliates/:affiliateId — approve/reject/remove
router.patch("/my-affiliate-programs/:id/affiliates/:affiliateId", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const affiliateRowId = parseInt(req.params.affiliateId);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const { status, notes } = req.body;
    const validStatuses = ["approved", "rejected", "removed"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be: approved, rejected, or removed" });
      return;
    }

    const [updated] = await db.update(productAffiliatesTable).set({
      status,
      ...(notes !== undefined && { notes }),
      ...(status === "approved" && { approvedAt: new Date() }),
    })
      .where(and(
        eq(productAffiliatesTable.id, affiliateRowId),
        eq(productAffiliatesTable.programId, programId),
      ))
      .returning();

    if (!updated) { res.status(404).json({ error: "Affiliate record not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    req.log.error({ err }, "UpdateAffiliateStatus error");
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/my-affiliate-programs/:id/messages — send message / training to affiliates
router.post("/my-affiliate-programs/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const { subject, body, messageType = "announcement" } = req.body;
    if (!subject?.trim()) { res.status(400).json({ error: "subject required" }); return; }
    if (!body?.trim())    { res.status(400).json({ error: "body required" });    return; }

    const [msg] = await db.insert(affiliateMessagesTable).values({
      sellerId: req.userId,
      programId,
      subject: subject.trim(),
      body: body.trim(),
      messageType,
    }).returning();

    res.status(201).json(msg);
  } catch (err: any) {
    req.log.error({ err }, "SendAffiliateMessage error");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/my-affiliate-programs/:id/messages
router.get("/my-affiliate-programs/:id/messages", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const messages = await db.select()
      .from(affiliateMessagesTable)
      .where(eq(affiliateMessagesTable.programId, programId))
      .orderBy(desc(affiliateMessagesTable.createdAt));

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/my-affiliate-programs/:id/materials — add marketing material
router.post("/my-affiliate-programs/:id/materials", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const { name, materialType = "text", url, content, description } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }
    if (!url && !content) { res.status(400).json({ error: "url or content required" }); return; }

    const [mat] = await db.insert(affiliateMaterialsTable).values({
      programId,
      sellerId: req.userId,
      name: name.trim(),
      materialType,
      url: url ?? null,
      content: content ?? null,
      description: description ?? null,
    }).returning();

    res.status(201).json(mat);
  } catch (err: any) {
    req.log.error({ err }, "AddAffiliateMaterial error");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/my-affiliate-programs/:id/materials
router.get("/my-affiliate-programs/:id/materials", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const materials = await db.select()
      .from(affiliateMaterialsTable)
      .where(eq(affiliateMaterialsTable.programId, programId))
      .orderBy(desc(affiliateMaterialsTable.createdAt));

    res.json(materials);
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/my-affiliate-programs/:id/materials/:matId
router.delete("/my-affiliate-programs/:id/materials/:matId", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const matId = parseInt(req.params.matId);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    await db.delete(affiliateMaterialsTable)
      .where(and(eq(affiliateMaterialsTable.id, matId), eq(affiliateMaterialsTable.programId, programId)));

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/my-affiliate-programs/:id/stats — summary stats for a program
router.get("/my-affiliate-programs/:id/stats", requireAuth, async (req: any, res) => {
  try {
    const programId = parseInt(req.params.id);
    const prog = await ownProgram(programId, req.userId);
    if (!prog) { res.status(404).json({ error: "Not found" }); return; }

    const statsRaw = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_affiliates,
        COUNT(CASE WHEN status='approved' THEN 1 END)::int AS approved,
        COUNT(CASE WHEN status='pending'  THEN 1 END)::int AS pending,
        COALESCE(SUM(total_clicks), 0)::int AS total_clicks,
        COALESCE(SUM(total_sales),  0)::int AS total_sales,
        COALESCE(SUM(total_earned), 0)::float AS total_commissions_paid
      FROM product_affiliates WHERE program_id = ${programId}
    `);
    const stats = (statsRaw.rows ?? (statsRaw as any))[0];

    res.json({
      ...stats,
      commissionRate: prog.commissionRate,
      inviteLink: `/join-affiliate/${prog.inviteCode}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PUBLIC — join affiliate program via invite link
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/affiliate/program-invite/:code — get program details (public, for join page)
router.get("/affiliate/program-invite/:code", async (req: any, res) => {
  try {
    const { code } = req.params;
    const [prog] = await db
      .select({
        id: productAffiliateProgramsTable.id,
        commissionRate: productAffiliateProgramsTable.commissionRate,
        description: productAffiliateProgramsTable.description,
        terms: productAffiliateProgramsTable.terms,
        cookieDays: productAffiliateProgramsTable.cookieDays,
        isActive: productAffiliateProgramsTable.isActive,
        productTitle: productsTable.title,
        productPrice: productsTable.price,
        coverImageUrl: productsTable.coverImageUrl,
        sellerName: usersTable.name,
      })
      .from(productAffiliateProgramsTable)
      .leftJoin(productsTable, eq(productsTable.id, productAffiliateProgramsTable.productId))
      .leftJoin(usersTable, eq(usersTable.id, productAffiliateProgramsTable.sellerId))
      .where(eq(productAffiliateProgramsTable.inviteCode, code))
      .limit(1);

    if (!prog) { res.status(404).json({ error: "Program not found" }); return; }
    if (!prog.isActive) { res.status(400).json({ error: "This affiliate program is not currently accepting applications" }); return; }

    res.json(prog);
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/affiliate/join/:code — authenticated user requests to join
router.post("/affiliate/join/:code", requireAuth, async (req: any, res) => {
  try {
    const { code } = req.params;

    const [prog] = await db.select()
      .from(productAffiliateProgramsTable)
      .where(eq(productAffiliateProgramsTable.inviteCode, code))
      .limit(1);

    if (!prog) { res.status(404).json({ error: "Program not found" }); return; }
    if (!prog.isActive) { res.status(400).json({ error: "This program is not currently accepting applications" }); return; }
    if (prog.sellerId === req.userId) { res.status(400).json({ error: "You cannot join your own affiliate program" }); return; }

    // Check if already joined
    const [existing] = await db.select({ id: productAffiliatesTable.id, status: productAffiliatesTable.status })
      .from(productAffiliatesTable)
      .where(and(
        eq(productAffiliatesTable.programId, prog.id),
        eq(productAffiliatesTable.affiliateId, req.userId),
      ))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: `You have already applied to this program (status: ${existing.status})`, status: existing.status });
      return;
    }

    const trackingCode = genTrackingCode();
    const [affiliate] = await db.insert(productAffiliatesTable).values({
      programId: prog.id,
      productId: prog.productId,
      sellerId: prog.sellerId,
      affiliateId: req.userId,
      trackingCode,
      status: "pending",
    }).returning();

    res.status(201).json({
      ...affiliate,
      message: "Application submitted! The seller will review and approve your request.",
    });
  } catch (err: any) {
    req.log.error({ err }, "JoinAffiliateProgram error");
    res.status(500).json({ error: err.message ?? "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  AFFILIATE PORTAL — view programs I'm promoting
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/affiliate-portal — all programs I'm an affiliate for
router.get("/affiliate-portal", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        pa.id, pa.status, pa.tracking_code, pa.total_clicks, pa.total_sales,
        pa.total_earned::float, pa.joined_at, pa.approved_at,
        pap.commission_rate::float, pap.description, pap.cookie_days,
        p.id AS product_id, p.title AS product_title, p.price::float AS product_price,
        p.cover_image_url,
        u.name AS seller_name, u.profile_picture AS seller_avatar
      FROM product_affiliates pa
      JOIN product_affiliate_programs pap ON pap.id = pa.program_id
      JOIN products p ON p.id = pa.product_id
      JOIN users u ON u.id = pa.seller_id
      WHERE pa.affiliate_id = ${req.userId}
      ORDER BY pa.joined_at DESC
    `);

    const BASE = process.env.APP_URL ?? "";
    const result = (rows.rows as any[]).map(r => ({
      ...r,
      trackingLink: `${BASE}/product/${r.product_id}?aff=${r.tracking_code}`,
    }));

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "AffiliatePortal error");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/affiliate-portal/messages — messages from sellers
router.get("/affiliate-portal/messages", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        am.id, am.subject, am.body, am.message_type, am.created_at,
        u.name AS seller_name, p.title AS product_title
      FROM affiliate_messages am
      JOIN product_affiliate_programs pap ON pap.id = am.program_id
      JOIN users u ON u.id = am.seller_id
      JOIN products p ON p.id = pap.product_id
      WHERE pap.id IN (
        SELECT program_id FROM product_affiliates
        WHERE affiliate_id = ${req.userId} AND status = 'approved'
      )
      ORDER BY am.created_at DESC
      LIMIT 100
    `);

    res.json(rows.rows);
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/affiliate-portal/materials — marketing materials from sellers
router.get("/affiliate-portal/materials", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        am.*, u.name AS seller_name, p.title AS product_title
      FROM affiliate_materials am
      JOIN product_affiliate_programs pap ON pap.id = am.program_id
      JOIN users u ON u.id = am.seller_id
      JOIN products p ON p.id = pap.product_id
      WHERE pap.id IN (
        SELECT program_id FROM product_affiliates
        WHERE affiliate_id = ${req.userId} AND status = 'approved'
      )
      ORDER BY am.created_at DESC
    `);

    res.json(rows.rows);
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/affiliate-portal/commissions — my product affiliate earnings
router.get("/affiliate-portal/commissions", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        wt.id, wt.amount::float, wt.description, wt.created_at, wt.status,
        wt.reference
      FROM wallet_transactions wt
      WHERE wt.user_id = ${req.userId}
        AND wt.type = 'affiliate_commission'
      ORDER BY wt.created_at DESC
      LIMIT 200
    `);

    const total = (rows.rows as any[]).reduce((s, r) => s + (r.amount ?? 0), 0);
    res.json({ commissions: rows.rows, totalEarned: total.toFixed(2) });
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  TRACKING — click tracking redirect
// ══════════════════════════════════════════════════════════════════════════════

// GET /go/:trackingCode — public affiliate redirect
router.get("/go/:trackingCode", async (req: any, res) => {
  try {
    const { trackingCode } = req.params;

    const [aff] = await db.select({
      id: productAffiliatesTable.id,
      status: productAffiliatesTable.status,
      productId: productAffiliatesTable.productId,
    })
      .from(productAffiliatesTable)
      .where(eq(productAffiliatesTable.trackingCode, trackingCode))
      .limit(1);

    if (!aff || aff.status !== "approved") {
      res.redirect("/marketplace");
      return;
    }

    // Increment click count
    await db.update(productAffiliatesTable)
      .set({ totalClicks: sql`total_clicks + 1` })
      .where(eq(productAffiliatesTable.id, aff.id));

    // Redirect to product with affiliate code in query string (tracked by checkout)
    res.redirect(`/product/${aff.productId}?aff=${trackingCode}`);
  } catch {
    res.redirect("/marketplace");
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  EXPORTED HELPER — called by checkout.ts on sale completion
// ══════════════════════════════════════════════════════════════════════════════

export async function creditProductAffiliateCommission(params: {
  trackingCode: string;
  productId: number;
  saleAmount: number;
  orderId: number;
  productTitle: string;
}) {
  try {
    const [aff] = await db.select({
      id: productAffiliatesTable.id,
      affiliateId: productAffiliatesTable.affiliateId,
      status: productAffiliatesTable.status,
      programId: productAffiliatesTable.programId,
    })
      .from(productAffiliatesTable)
      .where(and(
        eq(productAffiliatesTable.trackingCode, params.trackingCode),
        eq(productAffiliatesTable.productId, params.productId),
        eq(productAffiliatesTable.status, "approved"),
      ))
      .limit(1);

    if (!aff) return null;

    const [prog] = await db.select({ commissionRate: productAffiliateProgramsTable.commissionRate })
      .from(productAffiliateProgramsTable)
      .where(eq(productAffiliateProgramsTable.id, aff.programId))
      .limit(1);

    if (!prog) return null;

    const rate = Number(prog.commissionRate) / 100;
    const commission = parseFloat((params.saleAmount * rate).toFixed(2));

    if (commission <= 0) return null;

    // Credit affiliate's wallet
    await db.update(usersTable)
      .set({ walletBalance: sql`wallet_balance + ${commission}` })
      .where(eq(usersTable.id, aff.affiliateId));

    await db.insert(walletTransactionsTable).values({
      userId: aff.affiliateId,
      type: "affiliate_commission",
      amount: String(commission),
      status: "completed",
      description: `Product affiliate commission: "${params.productTitle}" — ${Number(prog.commissionRate).toFixed(0)}% of $${params.saleAmount.toFixed(2)}`,
      reference: `order_${params.orderId}_product_aff`,
      productId: params.productId,
    });

    // Update affiliate's stats
    await db.update(productAffiliatesTable).set({
      totalSales: sql`total_sales + 1`,
      totalEarned: sql`total_earned + ${commission}`,
    }).where(eq(productAffiliatesTable.id, aff.id));

    return { affiliateId: aff.affiliateId, commission };
  } catch (err) {
    console.error("creditProductAffiliateCommission error:", err);
    return null;
  }
}

export default router;
