import { pgTable, serial, text, integer, numeric, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const customOffersTable = pgTable("custom_offers", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => usersTable.id),
  guestEmail: text("guest_email"),
  guestName: text("guest_name"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("ai_agent"),
  budget: text("budget"),
  timeline: text("timeline"),
  aiAnalysis: jsonb("ai_analysis"),
  aiSuggestedPrice: numeric("ai_suggested_price", { precision: 10, scale: 2 }),
  aiMinPrice: numeric("ai_min_price", { precision: 10, scale: 2 }),
  aiMaxPrice: numeric("ai_max_price", { precision: 10, scale: 2 }),
  finalPrice: numeric("final_price", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  deliveryNotes: text("delivery_notes"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CustomOffer = typeof customOffersTable.$inferSelect;
