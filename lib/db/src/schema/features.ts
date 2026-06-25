import { pgTable, serial, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const featuresTable = pgTable("features", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isActive: boolean("is_active").notNull().default(true),
  tiersAllowed: jsonb("tiers_allowed").notNull().default(["free", "pro", "enterprise"]),
  limits: jsonb("limits").default({}),
});

export const insertFeatureSchema = createInsertSchema(featuresTable).omit({ id: true });
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof featuresTable.$inferSelect;
