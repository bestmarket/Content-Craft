import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

export const codingProjectsTable = pgTable("coding_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  projectType: text("project_type").notNull().default("web"),
  framework: text("framework").default("html-css-js"),
  language: text("language").default("javascript"),
  status: text("status").notNull().default("draft"),
  previewType: text("preview_type").default("code"),
  readme: text("readme"),
  chatHistory: jsonb("chat_history").$type<Array<{ role: string; content: string; ts: string }>>().default([]),
  publishedProductId: integer("published_product_id"),
  generationCount: integer("generation_count").default(0),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCodingProjectSchema = createInsertSchema(codingProjectsTable);
export type CodingProject = typeof codingProjectsTable.$inferSelect;
export type InsertCodingProject = typeof codingProjectsTable.$inferInsert;
