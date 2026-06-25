import { pgTable, serial, text, boolean, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  topic: text("topic").notNull(),
  category: text("category").default("education"),
  difficulty: text("difficulty").default("beginner"),
  targetAudience: text("target_audience"),
  stage: text("stage").notNull().default("building"),
  courseData: jsonb("course_data"),
  landingPageData: jsonb("landing_page_data"),
  marketingData: jsonb("marketing_data"),
  coverImageUrl: text("cover_image_url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("97.00"),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  sellabilityScore: integer("sellability_score").default(0),
  moduleCount: integer("module_count").default(0),
  lessonCount: integer("lesson_count").default(0),
  totalWordCount: integer("total_word_count").default(0),
  isPublished: boolean("is_published").notNull().default(false),
  publishStatus: text("publish_status").default("draft"),
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  errorMessage: text("error_message"),
  storeProductId: integer("store_product_id"),
  paymentPlanData: jsonb("payment_plan_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
