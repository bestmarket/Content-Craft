import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const pdfHistoryTable = pgTable("pdf_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  topic: text("topic").notNull(),
  authorName: text("author_name").notNull(),
  title: text("title"),
  content: text("content"),
  tableOfContents: jsonb("table_of_contents"),
  aboutSection: text("about_section"),
  authorBio: text("author_bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPdfHistorySchema = createInsertSchema(pdfHistoryTable).omit({ id: true, createdAt: true });
export type InsertPdfHistory = z.infer<typeof insertPdfHistorySchema>;
export type PdfHistory = typeof pdfHistoryTable.$inferSelect;
