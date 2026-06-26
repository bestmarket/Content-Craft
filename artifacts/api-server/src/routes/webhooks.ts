import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, ordersTable, walletTransactionsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail, buildPurchaseReceiptHtml } from "../services/email";

const router = Router();

const PLATFORM_RAKE = 0.20;
const CREATOR_SHARE = 0.80;

async function fulfillStudioOrder(opts: {
  productId: number;
  buyerEmail: string;
  buyerName: string;
  amountCents: number;
  currency: string;
  externalRef: string;
  gateway: string;
}) {
  const { productId, buyerEmail, buyerName, amountCents, currency, externalRef, gateway } = opts;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) { console.warn(`[Webhooks] Product ${productId} not found`); return; }

  const amountDollars = amountCents / 100;

  // Idempotency — check existing order by paymentReference
  const existing = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(eq(ordersTable.paymentReference, externalRef)).limit(1);
  if (existing.length) { console.info(`[Webhooks] Order ${externalRef} already processed`); return; }

  const creatorEarning = parseFloat((amountDollars * CREATOR_SHARE).toFixed(2));
  const platformFee = parseFloat((amountDollars * PLATFORM_RAKE).toFixed(2));

  // Record order using correct schema fields
  await db.insert(ordersTable).values({
    productId,
    sellerId: product.userId,
    buyerEmail,
    buyerName: buyerName || null,
    amount: String(amountDollars),
    currency: currency.toUpperCase(),
    status: "completed",
    paymentProvider: gateway,
    paymentReference: externalRef,
  });

  // Credit creator wallet
  await db.update(usersTable)
    .set({ walletBalance: sql`wallet_balance + ${creatorEarning}` })
    .where(eq(usersTable.id, product.userId));

  // Record wallet transaction (type enum: credit/debit/withdrawal/refund/affiliate_commission)
  await db.insert(walletTransactionsTable).values({
    userId: product.userId,
    type: "credit",
    amount: String(creatorEarning),
    status: "completed",
    reference: externalRef,
  });

  // Update product stats
  await db.update(productsTable).set({
    totalSales: sql`total_sales + 1`,
    totalRevenue: sql`total_revenue + ${amountDollars}`,
  }).where(eq(productsTable.id, productId));

  // Fetch seller info for email
  const [seller] = await db.select({ username: usersTable.username, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.id, product.userId)).limit(1);
  const sellerName = seller?.username ?? "The Creator";

  // Send purchase receipt
  try {
    const downloadLink = `/api/studio/download/${productId}`;
    const html = buildPurchaseReceiptHtml({
      productTitle: product.title,
      buyerName: buyerName || "Customer",
      amount: amountDollars,
      downloadUrl: `${process.env.APP_URL ?? ""}${downloadLink}`,
      sellerName,
    });
    await sendEmail({ to: buyerEmail, subject: `Your purchase: ${product.title}`, html } as any);
  } catch (_) { /* email non-fatal */ }

  console.info(`[Webhooks] Fulfilled order ${externalRef} | Product ${productId} | Creator +$${creatorEarning} | Platform +$${platformFee}`);
}

// ── POST /webhooks — unified payment verification ─────────────────────────────
router.post("/webhooks", async (req, res) => {
  try {
    const source = (req.headers["x-webhook-source"] as string ?? "").toLowerCase();
    const body = req.body as any;

    res.status(200).json({ received: true });

    let productId: number | null = null;
    let buyerEmail = "";
    let buyerName = "";
    let amountCents = 0;
    let currency = "USD";
    let externalRef = "";
    let gateway = source || "webhook";

    if (source === "paddle") {
      const eventType = body.event_type ?? body.alert_name;
      if (!["transaction.completed", "payment_succeeded"].includes(eventType)) return;
      const passthrough = body.data?.custom_data ?? {};
      productId = parseInt(passthrough.productId ?? body.passthrough?.split("productId:")[1], 10);
      buyerEmail = body.data?.customer?.email ?? body.email ?? "";
      buyerName = body.data?.customer?.name ?? "";
      amountCents = parseInt(body.data?.totals?.grand_total ?? (body.sale_gross ?? "0").replace(/\D/g, ""), 10);
      currency = body.data?.currency_code ?? body.currency ?? "USD";
      externalRef = body.data?.id ?? body.order_id ?? crypto.randomUUID();
    } else if (source === "lemonsqueezy") {
      const eventName = body.meta?.event_name;
      if (eventName !== "order_created") return;
      productId = parseInt(body.meta?.custom_data?.productId, 10);
      buyerEmail = body.data?.attributes?.user_email ?? "";
      buyerName = body.data?.attributes?.user_name ?? "";
      amountCents = body.data?.attributes?.total ?? 0;
      currency = body.data?.attributes?.currency ?? "USD";
      externalRef = body.data?.attributes?.identifier ?? String(body.data?.id ?? "");
    } else {
      // Generic format: { productId, buyerEmail, buyerName, amountCents, currency, ref, signature?, payload? }
      const secret = process.env.WEBHOOK_SECRET;
      if (secret && body.signature) {
        const expected = crypto.createHmac("sha256", secret)
          .update(JSON.stringify(body.payload ?? body))
          .digest("hex");
        if (body.signature !== expected) { console.warn("[Webhooks] Signature mismatch — rejecting"); return; }
      }
      productId = parseInt(body.productId ?? body.product_id, 10);
      buyerEmail = body.buyerEmail ?? body.buyer_email ?? "";
      buyerName = body.buyerName ?? body.buyer_name ?? "";
      amountCents = parseInt(body.amountCents ?? body.amount_cents ?? "0", 10);
      currency = body.currency ?? "USD";
      externalRef = body.ref ?? body.reference ?? `wh_${Date.now()}`;
      gateway = body.gateway ?? "manual";
    }

    if (!productId || isNaN(productId) || !buyerEmail || amountCents <= 0) {
      console.warn("[Webhooks] Incomplete payload", { productId, buyerEmail, amountCents });
      return;
    }

    await fulfillStudioOrder({ productId, buyerEmail, buyerName, amountCents, currency, externalRef, gateway });
  } catch (err: any) {
    console.error("[Webhooks] Handler error:", err?.message ?? err);
  }
});

// ── POST /webhooks/verify — manual admin payment confirmation ─────────────────
router.post("/webhooks/verify", async (req, res) => {
  try {
    const { productId, buyerEmail, buyerName, amount, currency = "USD", ref } = req.body as any;
    if (!productId || !buyerEmail || !amount) {
      res.status(400).json({ error: "productId, buyerEmail, and amount are required" }); return;
    }
    const amountCents = Math.round(parseFloat(amount) * 100);
    const externalRef = ref ?? `manual_${Date.now()}`;
    await fulfillStudioOrder({ productId, buyerEmail, buyerName: buyerName ?? "", amountCents, currency, externalRef, gateway: "manual" });
    res.json({
      success: true,
      creatorEarning: +(parseFloat(amount) * CREATOR_SHARE).toFixed(2),
      platformFee: +(parseFloat(amount) * PLATFORM_RAKE).toFixed(2),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// ── GET /webhooks/info — split config ─────────────────────────────────────────
router.get("/webhooks/info", (_req, res) => {
  res.json({
    platformRake: `${PLATFORM_RAKE * 100}%`,
    creatorShare: `${CREATOR_SHARE * 100}%`,
    endpoint: "/api/webhooks",
    supportedSources: ["paddle", "lemonsqueezy", "generic", "manual"],
    note: "Send X-Webhook-Source header to identify payment provider",
  });
});

export default router;
