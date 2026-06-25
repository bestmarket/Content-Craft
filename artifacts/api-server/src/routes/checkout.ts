import { Router } from "express";
import { db } from "@workspace/db";
import {
  paymentGatewaysTable,
  productsTable,
  ordersTable,
  usersTable,
  walletTransactionsTable,
  subscriptionsTable,
  affiliateCommissionsTable,
  revenueSharesTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import crypto from "crypto";
import { subscribeToProductSequence } from "./email-marketing";
import { sendEmail, buildPurchaseReceiptHtml } from "../services/email";
import { getRevenueConfig, calculateRevenueSplit } from "./revenue";
import { creditProductAffiliateCommission } from "./affiliate-programs";

const router = Router();

async function getActiveGateway(): Promise<{ name: string; config: Record<string, string> } | null> {
  const gateways = await db.select().from(paymentGatewaysTable).where(eq(paymentGatewaysTable.isActive, true)).limit(1);
  if (!gateways.length) return null;
  const gw = gateways[0];
  try {
    return { name: gw.name, config: JSON.parse(gw.config ?? "{}") };
  } catch {
    return null;
  }
}

async function getGateway(name: string): Promise<Record<string, string> | null> {
  const [gw] = await db.select().from(paymentGatewaysTable)
    .where(and(eq(paymentGatewaysTable.name, name), eq(paymentGatewaysTable.isActive, true))).limit(1);
  if (!gw) return null;
  try { return JSON.parse(gw.config ?? "{}"); } catch { return null; }
}

async function getAnyGateway(name: string): Promise<Record<string, string> | null> {
  const [gw] = await db.select().from(paymentGatewaysTable).where(eq(paymentGatewaysTable.name, name)).limit(1);
  if (!gw) return null;
  try { return JSON.parse(gw.config ?? "{}"); } catch { return null; }
}

function buildReturnUrl(base: string, path: string): string {
  return `${base}${path}`;
}

router.get("/checkout/active-gateway", async (_req, res) => {
  const gw = await getActiveGateway();
  res.json({ gateway: gw?.name ?? null });
});

router.post("/checkout/product/:id", async (req: any, res) => {
  try {
    const { buyerEmail, buyerName, successUrl, cancelUrl, affiliateTrackingCode } = req.body;
    if (!buyerEmail) { res.status(400).json({ error: "Buyer email required" }); return; }

    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.isPublished, true))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const gw = await getActiveGateway();

    if (!gw) {
      res.status(400).json({ error: "No payment gateway configured. Please contact the platform owner." });
      return;
    }

    const amountCents = Math.round(Number(product.price) * 100);
    const productName = product.title ?? "Digital Product";
    const metaObj = { productId: product.id, buyerEmail, buyerName, type: "product", affiliateTrackingCode: affiliateTrackingCode ?? null };
    const meta = JSON.stringify(metaObj);

    if (gw.name === "paddle") {
      const paddleRes = await createPaddleCheckout({
        config: gw.config,
        priceAmount: amountCents,
        currency: "USD",
        productName,
        customerEmail: buyerEmail,
        successUrl: successUrl ?? `${req.headers.origin ?? ""}/product/${product.id}?purchase=success`,
        cancelUrl: cancelUrl ?? `${req.headers.origin ?? ""}/product/${product.id}`,
        customData: meta,
      });
      res.json({ checkoutUrl: paddleRes.checkoutUrl, gateway: "paddle" });
    } else if (gw.name === "lemonsqueezy") {
      const lsRes = await createLemonSqueezyCheckout({
        config: gw.config,
        priceAmount: amountCents,
        currency: "USD",
        productName,
        customerEmail: buyerEmail,
        successUrl: successUrl ?? `${req.headers.origin ?? ""}/product/${product.id}?purchase=success`,
        cancelUrl: cancelUrl ?? `${req.headers.origin ?? ""}/product/${product.id}`,
        customData: metaObj,
      });
      res.json({ checkoutUrl: lsRes.checkoutUrl, gateway: "lemonsqueezy" });
    } else {
      res.status(400).json({ error: `Gateway ${gw.name} not supported for checkout` });
    }
  } catch (err: any) {
    req.log?.error?.({ err }, "Checkout product error");
    res.status(500).json({ error: err?.message ?? "Checkout failed" });
  }
});

router.post("/checkout/subscription", requireAuth, async (req: any, res) => {
  try {
    const { successUrl, cancelUrl } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const gw = await getActiveGateway();
    if (!gw) {
      res.status(400).json({ error: "No payment gateway configured. Please contact the platform owner." });
      return;
    }

    const origin = req.headers.origin ?? "";
    const meta = JSON.stringify({ userId: req.userId, type: "subscription" });

    if (gw.name === "paddle") {
      const paddleRes = await createPaddleSubscriptionCheckout({
        config: gw.config,
        customerEmail: user.email,
        successUrl: successUrl ?? `${origin}/dashboard?subscribed=1`,
        cancelUrl: cancelUrl ?? `${origin}/pricing`,
        customData: meta,
      });
      res.json({ checkoutUrl: paddleRes.checkoutUrl, gateway: "paddle" });
    } else if (gw.name === "lemonsqueezy") {
      const lsRes = await createLemonSqueezySubscriptionCheckout({
        config: gw.config,
        customerEmail: user.email,
        successUrl: successUrl ?? `${origin}/dashboard?subscribed=1`,
        cancelUrl: cancelUrl ?? `${origin}/pricing`,
        customData: { userId: req.userId, type: "subscription" },
      });
      res.json({ checkoutUrl: lsRes.checkoutUrl, gateway: "lemonsqueezy" });
    } else {
      res.status(400).json({ error: `Gateway ${gw.name} not supported` });
    }
  } catch (err: any) {
    req.log?.error?.({ err }, "Checkout subscription error");
    res.status(500).json({ error: err?.message ?? "Checkout failed" });
  }
});

router.post("/webhooks/paddle", async (req: any, res) => {
  try {
    const config = await getAnyGateway("paddle");
    const publicKey = config?.public_key;

    if (publicKey) {
      const signature = req.headers["paddle-signature"] as string;
      if (!signature) { res.status(400).json({ error: "Missing signature" }); return; }

      const tsPart = signature.split(";").find((s: string) => s.startsWith("ts="));
      const h1Part = signature.split(";").find((s: string) => s.startsWith("h1="));
      if (!tsPart || !h1Part) { res.status(400).json({ error: "Invalid signature format" }); return; }

      const ts = tsPart.replace("ts=", "");
      const h1 = h1Part.replace("h1=", "");
      const rawBody = req.rawBody ?? (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      const signedPayload = `${ts}:${rawBody}`;
      const hmac = crypto.createHmac("sha256", publicKey).update(signedPayload).digest("hex");

      if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(h1))) {
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    await handlePaddleEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    req.log?.error?.({ err }, "Paddle webhook error");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

router.post("/webhooks/lemonsqueezy", async (req: any, res) => {
  try {
    const config = await getAnyGateway("lemonsqueezy");
    const secret = config?.webhook_secret;

    if (secret) {
      const signature = req.headers["x-signature"] as string;
      if (!signature) { res.status(400).json({ error: "Missing signature" }); return; }
      const rawBody = req.rawBody ?? (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    await handleLemonSqueezyEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    req.log?.error?.({ err }, "LemonSqueezy webhook error");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

async function handlePaddleEvent(event: any) {
  const type = event.event_type ?? event.alert_name;
  const data = event.data ?? event;

  if (type === "transaction.completed") {
    const customData = data.custom_data ?? {};
    let meta: any = {};
    try { meta = typeof customData === "string" ? JSON.parse(customData) : customData; } catch {}

    if (meta.type === "product" && meta.productId) {
      await fulfillProductOrder({
        productId: meta.productId,
        buyerEmail: meta.buyerEmail ?? data.customer?.email ?? "",
        buyerName: meta.buyerName ?? data.customer?.name ?? "",
        amount: (data.details?.totals?.total ?? 0) / 100,
        provider: "paddle",
        reference: data.id ?? data.transaction_id ?? "",
        country: data.address?.country_code ?? "",
        affiliateTrackingCode: meta.affiliateTrackingCode ?? null,
      });
    } else if (meta.type === "subscription" && meta.userId) {
      await fulfillSubscription({ userId: meta.userId, provider: "paddle", reference: data.id ?? "" });
    }
  }

  if (type === "subscription.created" || type === "subscription.activated") {
    const customData = data.custom_data ?? {};
    let meta: any = {};
    try { meta = typeof customData === "string" ? JSON.parse(customData) : customData; } catch {}
    if (meta.userId) {
      await fulfillSubscription({ userId: meta.userId, provider: "paddle", reference: data.id ?? data.subscription_id ?? "" });
    }
  }

  if (type === "subscription.canceled" || type === "subscription.cancelled") {
    const subId = data.id ?? data.subscription_id;
    if (subId) await cancelSubscriptionByRef(subId, "paddle");
  }
}

async function handleLemonSqueezyEvent(event: any) {
  const type = event.meta?.event_name;
  const data = event.data?.attributes ?? {};
  const meta = event.meta?.custom_data ?? {};

  if (type === "order_created") {
    if (meta.type === "product" && meta.productId) {
      await fulfillProductOrder({
        productId: meta.productId,
        buyerEmail: meta.buyerEmail ?? data.user_email ?? "",
        buyerName: meta.buyerName ?? data.user_name ?? "",
        amount: (data.total ?? 0) / 100,
        provider: "lemonsqueezy",
        reference: String(event.data?.id ?? ""),
        country: data.country ?? "",
        affiliateTrackingCode: meta.affiliateTrackingCode ?? null,
      });
    }
  }

  if (type === "subscription_created" || type === "subscription_updated") {
    if (meta.userId && data.status === "active") {
      await fulfillSubscription({
        userId: meta.userId,
        provider: "lemonsqueezy",
        reference: String(event.data?.id ?? ""),
      });
    }
  }

  if (type === "subscription_cancelled" || type === "subscription_expired") {
    const subId = String(event.data?.id ?? "");
    if (subId) await cancelSubscriptionByRef(subId, "lemonsqueezy");
  }
}

async function fulfillProductOrder(params: {
  productId: number;
  buyerEmail: string;
  buyerName: string;
  amount: number;
  provider: string;
  reference: string;
  country: string;
  affiliateTrackingCode?: string | null;
}) {
  const [product] = await db.select().from(productsTable)
    .where(eq(productsTable.id, params.productId)).limit(1);
  if (!product) return;

  const existing = await db.select().from(ordersTable)
    .where(eq(ordersTable.paymentReference, params.reference)).limit(1);
  if (existing.length > 0) return;

  const [order] = await db.insert(ordersTable).values({
    productId: product.id,
    sellerId: product.userId,
    buyerEmail: params.buyerEmail,
    buyerName: params.buyerName,
    amount: String(params.amount),
    currency: "USD",
    status: "completed",
    paymentProvider: params.provider,
    paymentReference: params.reference,
    country: params.country,
  }).returning();

  // ── Load seller info + revenue config ──────────────────────────────────────
  const [seller] = await db.select({
    walletBalance: usersTable.walletBalance,
    name: usersTable.name,
    subscriptionTier: usersTable.subscriptionTier,
    referredBy: usersTable.referredBy,
    affiliateCommissionRate: usersTable.affiliateCommissionRate,
  }).from(usersTable).where(eq(usersTable.id, product.userId)).limit(1);

  // Check if there is a referrer (affiliate)
  let affiliateUser: { id: number; walletBalance: string; name: string } | null = null;
  if (seller?.referredBy) {
    const [aff] = await db.select({ id: usersTable.id, walletBalance: usersTable.walletBalance, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.id, seller.referredBy)).limit(1);
    if (aff) affiliateUser = aff;
  }

  const config = await getRevenueConfig();
  const split = await calculateRevenueSplit({
    grossAmount: params.amount,
    sellerTier: seller?.subscriptionTier ?? "free",
    hasAffiliate: !!affiliateUser,
    config,
  });

  const sellerEarning = split.creatorAmount;

  await db.update(productsTable).set({
    totalSales: (product.totalSales ?? 0) + 1,
    totalRevenue: String(Number(product.totalRevenue ?? 0) + params.amount),
  }).where(eq(productsTable.id, product.id));

  // ── Credit creator wallet ──────────────────────────────────────────────────
  await db.insert(walletTransactionsTable).values({
    userId: product.userId,
    type: "credit",
    amount: String(sellerEarning.toFixed(2)),
    status: "completed",
    description: `Sale of "${product.title}" via ${params.provider} (${split.creatorShare}% of $${params.amount.toFixed(2)})`,
    reference: `order_${order.id}`,
    productId: product.id,
  });
  await db.update(usersTable)
    .set({ walletBalance: sql`wallet_balance + ${sellerEarning}` })
    .where(eq(usersTable.id, product.userId));

  // ── Credit affiliate wallet (from platform fee pool) ──────────────────────
  if (affiliateUser && split.affiliateAmount > 0) {
    await db.insert(walletTransactionsTable).values({
      userId: affiliateUser.id,
      type: "credit",
      amount: String(split.affiliateAmount.toFixed(2)),
      status: "completed",
      description: `Affiliate commission from sale of "${product.title}" (${split.affiliateShare.toFixed(1)}% of platform fee)`,
      reference: `order_${order.id}_affiliate`,
      productId: product.id,
    });
    await db.update(usersTable)
      .set({ walletBalance: sql`wallet_balance + ${split.affiliateAmount}` })
      .where(eq(usersTable.id, affiliateUser.id));

    await db.insert(affiliateCommissionsTable).values({
      referrerId: affiliateUser.id,
      refereeId: product.userId,
      type: "sale",
      amount: String(split.affiliateAmount.toFixed(2)),
      status: "pending",
      description: `Sale of "${product.title}" — order #${order.id}`,
    });
  }

  // ── Record revenue split for analytics ────────────────────────────────────
  await db.insert(revenueSharesTable).values({
    orderId: order.id,
    productId: product.id,
    sellerId: product.userId,
    affiliateId: affiliateUser?.id ?? null,
    grossAmount: String(params.amount.toFixed(2)),
    platformFeeAmount: String(split.platformFeeAmount.toFixed(2)),
    creatorAmount: String(split.creatorAmount.toFixed(2)),
    affiliateAmount: String(split.affiliateAmount.toFixed(2)),
    platformFeePct: String(split.platformFee),
    creatorSharePct: String(split.creatorShare),
    affiliateSharePct: String(split.affiliateShare.toFixed(2)),
    sellerTier: seller?.subscriptionTier ?? "free",
    paymentProvider: params.provider,
    configSnapshot: config,
  });

  // ── Credit product-level affiliate commission (from tracking link) ──────────
  if (params.affiliateTrackingCode) {
    try {
      await creditProductAffiliateCommission({
        trackingCode: params.affiliateTrackingCode,
        productId: product.id,
        saleAmount: params.amount,
        orderId: order.id,
        productTitle: product.title,
      });
    } catch (err) {
      console.error("Product affiliate commission error:", err);
    }
  }

  // Send purchase receipt to buyer
  const baseUrl = process.env.APP_URL ?? "https://selovox.com";
  const downloadUrl = `${baseUrl}/api/product/${product.id}/download/${order.id}`;
  try {
    await sendEmail({
      to: params.buyerEmail,
      toName: params.buyerName || undefined,
      subject: `🎉 Your purchase is confirmed — ${product.title}`,
      htmlBody: buildPurchaseReceiptHtml({
        productTitle: product.title,
        buyerName: params.buyerName || "there",
        amount: params.amount,
        downloadUrl,
        sellerName: seller?.name ?? "Selovox",
      }),
      fromName: seller?.name ?? "Selovox",
    });
  } catch {}

  // Auto-enroll buyer in the product's email sequence
  try {
    await subscribeToProductSequence({
      productId: product.id,
      email: params.buyerEmail,
      name: params.buyerName || undefined,
      orderId: order.id,
    });
  } catch {}
}

async function fulfillSubscription(params: { userId: number; provider: string; reference: string }) {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [existing] = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, params.userId)).limit(1);

  if (existing) {
    await db.update(subscriptionsTable).set({
      plan: "pro",
      status: "active",
      provider: params.provider,
      providerSubscriptionId: params.reference,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    }).where(eq(subscriptionsTable.userId, params.userId));
  } else {
    await db.insert(subscriptionsTable).values({
      userId: params.userId,
      plan: "pro",
      status: "active",
      provider: params.provider,
      providerSubscriptionId: params.reference,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    });
  }

  await db.update(usersTable).set({
    subscriptionTier: "pro",
    subscriptionExpiresAt: periodEnd,
  }).where(eq(usersTable.id, params.userId));
}

async function cancelSubscriptionByRef(reference: string, provider: string) {
  const [sub] = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.providerSubscriptionId, reference)).limit(1);
  if (!sub) return;

  await db.update(subscriptionsTable).set({ status: "cancelled" })
    .where(eq(subscriptionsTable.id, sub.id));

  await db.update(usersTable).set({
    subscriptionTier: "free",
    subscriptionExpiresAt: new Date(),
  }).where(eq(usersTable.id, sub.userId));
}

async function createPaddleCheckout(params: {
  config: Record<string, string>;
  priceAmount: number;
  currency: string;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  customData: string;
}): Promise<{ checkoutUrl: string }> {
  const { vendor_id, vendor_auth_code } = params.config;
  if (!vendor_id || !vendor_auth_code) throw new Error("Paddle credentials not configured");

  const isSandbox = vendor_id.startsWith("sandbox_") || params.config.sandbox === "true";
  const baseUrl = isSandbox
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

  const apiKey = vendor_auth_code;

  const body = {
    items: [
      {
        price: {
          description: params.productName,
          unit_price: { amount: String(params.priceAmount), currency_code: params.currency },
          product: {
            name: params.productName,
            tax_category: "digital-goods",
          },
          billing_cycle: null,
          trial_period: null,
          unit_price_overrides: [],
          quantity: { minimum: 1, maximum: 1 },
        },
        quantity: 1,
      },
    ],
    customer: { email: params.customerEmail },
    custom_data: params.customData,
    settings: {
      success_url: params.successUrl,
      display_mode: "redirect",
    },
  };

  const resp = await fetch(`${baseUrl}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Paddle checkout failed: ${text}`);
  }

  const json = await resp.json() as any;
  const url = json.data?.url ?? json.url;
  if (!url) throw new Error("No checkout URL from Paddle");
  return { checkoutUrl: url };
}

async function createPaddleSubscriptionCheckout(params: {
  config: Record<string, string>;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  customData: string;
}): Promise<{ checkoutUrl: string }> {
  const { vendor_auth_code, price_id } = params.config;
  if (!vendor_auth_code) throw new Error("Paddle credentials not configured");
  if (!price_id) throw new Error("Paddle subscription price_id not configured. Add it in Admin > Payments.");

  const isSandbox = params.config.sandbox === "true";
  const baseUrl = isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

  const body = {
    items: [{ price_id, quantity: 1 }],
    customer: { email: params.customerEmail },
    custom_data: params.customData,
    settings: { success_url: params.successUrl, display_mode: "redirect" },
  };

  const resp = await fetch(`${baseUrl}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vendor_auth_code}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Paddle subscription checkout failed: ${text}`);
  }

  const json = await resp.json() as any;
  const url = json.data?.url ?? json.url;
  if (!url) throw new Error("No checkout URL from Paddle");
  return { checkoutUrl: url };
}

async function createLemonSqueezyCheckout(params: {
  config: Record<string, string>;
  priceAmount: number;
  currency: string;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  customData: Record<string, any>;
}): Promise<{ checkoutUrl: string }> {
  const { api_key, store_id, variant_id } = params.config;
  if (!api_key || !store_id) throw new Error("Lemon Squeezy credentials not configured");

  const vid = variant_id ?? params.config.product_variant_id;
  if (!vid) throw new Error("Lemon Squeezy variant_id not configured. Add it in Admin > Payments.");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        product_options: {
          redirect_url: params.successUrl,
        },
        checkout_options: {
          button_color: "#7c3aed",
          dark: false,
        },
        checkout_data: {
          email: params.customerEmail,
          custom: params.customData,
        },
        preview: false,
      },
      relationships: {
        store: { data: { type: "stores", id: String(store_id) } },
        variant: { data: { type: "variants", id: String(vid) } },
      },
    },
  };

  const resp = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Lemon Squeezy checkout failed: ${text}`);
  }

  const json = await resp.json() as any;
  const url = json.data?.attributes?.url;
  if (!url) throw new Error("No checkout URL from Lemon Squeezy");
  return { checkoutUrl: url };
}

async function createLemonSqueezySubscriptionCheckout(params: {
  config: Record<string, string>;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  customData: Record<string, any>;
}): Promise<{ checkoutUrl: string }> {
  const { api_key, store_id, subscription_variant_id } = params.config;
  if (!api_key || !store_id) throw new Error("Lemon Squeezy credentials not configured");

  const vid = subscription_variant_id ?? params.config.variant_id;
  if (!vid) throw new Error("Lemon Squeezy subscription_variant_id not configured. Add it in Admin > Payments.");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        product_options: { redirect_url: params.successUrl },
        checkout_data: { email: params.customerEmail, custom: params.customData },
      },
      relationships: {
        store: { data: { type: "stores", id: String(store_id) } },
        variant: { data: { type: "variants", id: String(vid) } },
      },
    },
  };

  const resp = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Lemon Squeezy subscription checkout failed: ${text}`);
  }

  const json = await resp.json() as any;
  const url = json.data?.attributes?.url;
  if (!url) throw new Error("No checkout URL from Lemon Squeezy");
  return { checkoutUrl: url };
}

// ─── CRYPTO PAYMENT ROUTES ────────────────────────────────────────────────────

const CRYPTO_COINS: Record<string, { label: string; network: string; configKey: string; symbol: string }> = {
  usdt_trc20: { label: "USDT (TRC-20)", network: "TRON TRC-20", configKey: "usdt_trc20_address", symbol: "USDT" },
  usdt_erc20: { label: "USDT (ERC-20)", network: "Ethereum ERC-20", configKey: "usdt_erc20_address", symbol: "USDT" },
  usdc_trc20: { label: "USDC (TRC-20)", network: "TRON TRC-20", configKey: "usdc_trc20_address", symbol: "USDC" },
  btc:        { label: "Bitcoin (BTC)",  network: "Bitcoin",         configKey: "btc_address",         symbol: "BTC" },
  eth:        { label: "Ethereum (ETH)", network: "Ethereum",        configKey: "eth_address",         symbol: "ETH" },
  sol:        { label: "Solana (SOL)",   network: "Solana",          configKey: "sol_address",         symbol: "SOL" },
  bnb:        { label: "BNB (BEP-20)",   network: "BNB Smart Chain", configKey: "bnb_address",         symbol: "BNB" },
};

// GET /checkout/crypto/config — which coins are configured (public)
router.get("/checkout/crypto/config", async (_req, res) => {
  try {
    const [gw] = await db.select().from(paymentGatewaysTable)
      .where(eq(paymentGatewaysTable.name, "crypto")).limit(1);
    if (!gw || !gw.isActive) { res.json({ enabled: false, coins: [] }); return; }

    const cfg = JSON.parse(gw.config ?? "{}") as Record<string, string>;
    const coins = Object.entries(CRYPTO_COINS)
      .filter(([, meta]) => !!cfg[meta.configKey])
      .map(([id, meta]) => ({ id, label: meta.label, network: meta.network, symbol: meta.symbol }));

    res.json({ enabled: true, coins, note: cfg.note ?? "" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /checkout/crypto/product/:id — initiate crypto payment, create pending order
router.post("/checkout/crypto/product/:id", async (req: any, res) => {
  try {
    const { buyerEmail, buyerName, coinId, affiliateTrackingCode } = req.body;
    if (!buyerEmail) { res.status(400).json({ error: "Buyer email required" }); return; }
    if (!coinId || !CRYPTO_COINS[coinId]) { res.status(400).json({ error: "Invalid coin selected" }); return; }

    const [product] = await db.select().from(productsTable)
      .where(and(eq(productsTable.id, parseInt(req.params.id)), eq(productsTable.isPublished, true))).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const [gw] = await db.select().from(paymentGatewaysTable)
      .where(and(eq(paymentGatewaysTable.name, "crypto"), eq(paymentGatewaysTable.isActive, true))).limit(1);
    if (!gw) { res.status(400).json({ error: "Crypto payments are not enabled on this platform" }); return; }

    const cfg = JSON.parse(gw.config ?? "{}") as Record<string, string>;
    const coin = CRYPTO_COINS[coinId];
    const address = cfg[coin.configKey];
    if (!address) { res.status(400).json({ error: `${coin.label} wallet address not configured` }); return; }

    const amountUSD = Number(product.price);
    const reference = `crypto_${crypto.randomBytes(12).toString("hex")}`;

    // Create pending order
    const [order] = await db.insert(ordersTable).values({
      productId: product.id,
      sellerId: product.userId,
      buyerEmail,
      buyerName: buyerName ?? "",
      amount: String(amountUSD),
      currency: "USD",
      status: "pending",
      paymentProvider: "crypto",
      paymentReference: reference,
      country: "",
    }).returning();

    res.json({
      orderId: order.id,
      reference,
      coinId,
      coinLabel: coin.label,
      symbol: coin.symbol,
      network: coin.network,
      address,
      amountUSD,
      productTitle: product.title,
      note: cfg.note ?? "Send the exact amount. After sending, click 'I've Sent Payment' and wait for admin confirmation (usually within 1 hour).",
      buyerEmail,
      buyerName: buyerName ?? "",
      affiliateTrackingCode: affiliateTrackingCode ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Crypto checkout failed" });
  }
});

// POST /checkout/crypto/notify/:ref — buyer notifies payment sent (marks order as "awaiting_confirmation")
router.post("/checkout/crypto/notify/:ref", async (req: any, res) => {
  try {
    const { txHash } = req.body;
    const [order] = await db.select().from(ordersTable)
      .where(eq(ordersTable.paymentReference, req.params.ref)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.status !== "pending") { res.json({ ok: true, status: order.status }); return; }

    // Store tx hash in reference field (append)
    const newRef = txHash ? `${req.params.ref}|txhash:${txHash}` : req.params.ref;
    await db.update(ordersTable)
      .set({ paymentReference: newRef })
      .where(eq(ordersTable.id, order.id));

    res.json({ ok: true, status: "awaiting_confirmation" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /checkout/crypto/status/:ref — check payment status (buyer polls this)
router.get("/checkout/crypto/status/:ref", async (req: any, res) => {
  try {
    const [order] = await db.select().from(ordersTable)
      .where(eq(ordersTable.paymentReference, req.params.ref)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json({ status: order.status, orderId: order.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /admin/crypto/pending — list all pending/completed crypto orders for admin
router.get("/admin/crypto/pending", requireAdmin, async (req: any, res) => {
  try {
    const orders = await db.execute(sql`
      SELECT o.*, p.title AS product_title, p.price AS product_price
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.payment_provider = 'crypto'
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    const rows = Array.isArray(orders) ? orders : (orders as any).rows ?? [];
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /admin/crypto/confirm/:orderId — admin confirms payment, fulfills order
router.post("/admin/crypto/confirm/:orderId", requireAdmin, async (req: any, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.status === "completed") { res.json({ ok: true, message: "Already completed" }); return; }
    if (order.paymentProvider !== "crypto") { res.status(400).json({ error: "Not a crypto order" }); return; }

    // Parse affiliate tracking code from reference if stored
    const refParts = (order.paymentReference ?? "").split("|");
    const affiliateTrackingCode = null; // stored in meta — use null for now

    await fulfillProductOrder({
      productId: order.productId,
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName ?? "",
      amount: Number(order.amount),
      provider: "crypto",
      reference: order.paymentReference ?? String(orderId),
      country: order.country ?? "",
      affiliateTrackingCode,
    });

    res.json({ ok: true, message: "Payment confirmed and order fulfilled" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /admin/crypto/reject/:orderId — admin rejects crypto payment
router.post("/admin/crypto/reject/:orderId", requireAdmin, async (req: any, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.paymentProvider !== "crypto") { res.status(400).json({ error: "Not a crypto order" }); return; }

    await db.update(ordersTable).set({ status: "failed" }).where(eq(ordersTable.id, orderId));
    res.json({ ok: true, message: "Order rejected" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
