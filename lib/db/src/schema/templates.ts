import { pgTable, serial, text, boolean, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const templateProductsTable = pgTable("template_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type", { enum: ["ai_agent", "n8n_workflow", "replit_template", "chrome_extension"] }).notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  topic: text("topic").notNull(),
  description: text("description"),
  templateContent: jsonb("template_content"),
  landingPage: jsonb("landing_page"),
  coverImageUrl: text("cover_image_url"),
  marketingAssets: jsonb("marketing_assets"),
  marketplaceDescription: text("marketplace_description"),
  marketplaceTags: jsonb("marketplace_tags").notNull().default([]),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("29.00"),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  sellabilityScore: integer("sellability_score").default(0),
  targetAudience: text("target_audience"),
  category: text("category"),
  publishStatus: text("publish_status").default("draft"),
  isPublishedToStore: boolean("is_published_to_store").notNull().default(false),
  isPublishedToMarketplace: boolean("is_published_to_marketplace").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  viewCount: integer("view_count").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  generationStatus: text("generation_status").default("pending"),
  generationError: text("generation_error"),
  authorName: text("author_name"),
  shareableSlug: text("shareable_slug"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTemplateProductSchema = createInsertSchema(templateProductsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTemplateProduct = z.infer<typeof insertTemplateProductSchema>;
export type TemplateProduct = typeof templateProductsTable.$inferSelect;
