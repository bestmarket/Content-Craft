import { pgTable, serial, text, numeric, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

// ── Per-product affiliate program setup by seller ────────────────────────────
export const productAffiliateProgramsTable = pgTable("product_affiliate_programs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("30.00"),
  description: text("description"),
  terms: text("terms"),
  isActive: boolean("is_active").notNull().default(true),
  inviteCode: text("invite_code").unique(),
  cookieDays: integer("cookie_days").notNull().default(30),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Affiliates recruited to promote a specific product ───────────────────────
export const productAffiliatesTable = pgTable("product_affiliates", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => productAffiliateProgramsTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  affiliateId: integer("affiliate_id").notNull().references(() => usersTable.id),
  status: text("status", { enum: ["pending", "approved", "rejected", "removed"] }).notNull().default("pending"),
  trackingCode: text("tracking_code").notNull().unique(),
  totalClicks: integer("total_clicks").notNull().default(0),
  totalSales: integer("total_sales").notNull().default(0),
  totalEarned: numeric("total_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// ── Messages / training content sent by seller to affiliates ─────────────────
export const affiliateMessagesTable = pgTable("affiliate_messages", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  programId: integer("program_id").notNull().references(() => productAffiliateProgramsTable.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  messageType: text("message_type", { enum: ["training", "announcement", "promotion", "update"] }).notNull().default("announcement"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Marketing assets / materials shared with affiliates ───────────────────────
export const affiliateMaterialsTable = pgTable("affiliate_materials", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => productAffiliateProgramsTable.id),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  materialType: text("material_type", { enum: ["image", "pdf", "video", "text", "email_swipe", "social_post", "link"] }).notNull().default("text"),
  url: text("url"),
  content: text("content"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductAffiliateProgramSchema = createInsertSchema(productAffiliateProgramsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductAffiliateSchema = createInsertSchema(productAffiliatesTable).omit({ id: true, joinedAt: true, approvedAt: true });
export const insertAffiliateMessageSchema = createInsertSchema(affiliateMessagesTable).omit({ id: true, createdAt: true });
export const insertAffiliateMaterialSchema = createInsertSchema(affiliateMaterialsTable).omit({ id: true, createdAt: true });

export type ProductAffiliateProgram = typeof productAffiliateProgramsTable.$inferSelect;
export type ProductAffiliate = typeof productAffiliatesTable.$inferSelect;
export type AffiliateMessage = typeof affiliateMessagesTable.$inferSelect;
export type AffiliateMaterial = typeof affiliateMaterialsTable.$inferSelect;
