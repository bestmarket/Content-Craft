import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const scryvoxProductsTable = pgTable("scryvox_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  stage: text("stage").notNull().default("research"),
  style: text("style").notNull().default("pdf_chapter"),
  tone: text("tone").notNull().default("wise"),
  variation: integer("variation").notNull().default(1),
  researchData: jsonb("research_data"),
  architectData: jsonb("architect_data"),
  contentData: jsonb("content_data"),
  criticData: jsonb("critic_data"),
  sellabilityData: jsonb("sellability_data"),
  marketingData: jsonb("marketing_data"),
  landingPageData: jsonb("landing_page_data"),
  deepIntelligenceData: jsonb("deep_intelligence_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scryvoxKnowledgeTable = pgTable("scryvox_knowledge", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: jsonb("content").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  domain: text("domain"),
  isSystem: boolean("is_system").notNull().default(false),
  createdBy: integer("created_by").references(() => usersTable.id),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScryvoxProductSchema = createInsertSchema(scryvoxProductsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScryvoxKnowledgeSchema = createInsertSchema(scryvoxKnowledgeTable).omit({ id: true, createdAt: true, usageCount: true });

export type ScryvoxProduct = typeof scryvoxProductsTable.$inferSelect;
export type InsertScryvoxProduct = z.infer<typeof insertScryvoxProductSchema>;
export type ScryvoxKnowledge = typeof scryvoxKnowledgeTable.$inferSelect;
export type InsertScryvoxKnowledge = z.infer<typeof insertScryvoxKnowledgeSchema>;
