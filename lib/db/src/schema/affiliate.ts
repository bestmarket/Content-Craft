import { pgTable, serial, text, numeric, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const affiliateCommissionsTable = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id),
  refereeId: integer("referee_id").notNull().references(() => usersTable.id),
  type: text("type", { enum: ["signup", "upgrade", "sale"] }).notNull().default("signup"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status", { enum: ["pending", "paid"] }).notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissionsTable).omit({ id: true, createdAt: true });
export type InsertAffiliateCommission = z.infer<typeof insertAffiliateCommissionSchema>;
export type AffiliateCommission = typeof affiliateCommissionsTable.$inferSelect;
