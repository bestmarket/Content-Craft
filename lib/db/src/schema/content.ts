import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const contentHistoryTable = pgTable("content_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  platform: text("platform", { enum: ["youtube", "tiktok", "instagram", "facebook", "twitter"] }).notNull(),
  topic: text("topic").notNull(),
  wordCount: integer("word_count"),
  titles: jsonb("titles"),
  script: text("script"),
  description: text("description"),
  tags: jsonb("tags"),
  hashtags: jsonb("hashtags"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContentHistorySchema = createInsertSchema(contentHistoryTable).omit({ id: true, createdAt: true });
export type InsertContentHistory = z.infer<typeof insertContentHistorySchema>;
export type ContentHistory = typeof contentHistoryTable.$inferSelect;
