import { pgTable, serial, integer, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { ordersTable } from "./orders";
import { productsTable } from "./products";

export const revenueSharesTable = pgTable("revenue_shares", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  affiliateId: integer("affiliate_id").references(() => usersTable.id),
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  platformFeeAmount: numeric("platform_fee_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  creatorAmount: numeric("creator_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  affiliateAmount: numeric("affiliate_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  platformFeePct: numeric("platform_fee_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  creatorSharePct: numeric("creator_share_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  affiliateSharePct: numeric("affiliate_share_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  sellerTier: text("seller_tier").default("free"),
  paymentProvider: text("payment_provider"),
  configSnapshot: jsonb("config_snapshot").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
