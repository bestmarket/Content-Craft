import { pgTable, serial, text, boolean, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  topic: text("topic").notNull(),
  authorName: text("author_name").notNull(),
  description: text("description"),
  content: text("content"),
  tableOfContents: jsonb("table_of_contents"),
  aboutSection: text("about_section"),
  authorBio: text("author_bio"),
  authorPhotoUrl: text("author_photo_url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("9.99"),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  sellabilityScore: integer("sellability_score").default(0),
  targetAudience: text("target_audience"),
  monetizationNotes: text("monetization_notes"),
  category: text("category"),
  isPublished: boolean("is_published").notNull().default(false),
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  viewCount: integer("view_count").notNull().default(0),
  landingPage: jsonb("landing_page"),
  marketingCampaign: jsonb("marketing_campaign"),
  pageCount: integer("page_count").default(20),
  uploadedFileUrl: text("uploaded_file_url"),
  isUploaded: boolean("is_uploaded").notNull().default(false),
  productType: text("product_type").default("pdf"),
  publishStatus: text("publish_status").default("draft"),
  emailSequence30Days: jsonb("email_sequence_30_days"),
  emailStatus: text("email_status").default("not_scheduled"),
  marketingAssets: jsonb("marketing_assets"),
  coverImageUrl: text("cover_image_url"),
  landingPageData: jsonb("landing_page_data"),
  deepIntelligenceData: jsonb("deep_intelligence_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
