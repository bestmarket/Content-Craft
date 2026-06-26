import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const featuresTable = pgTable("features", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertFeatureSchema = createInsertSchema(featuresTable).omit({ id: true });
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof featuresTable.$inferSelect;
