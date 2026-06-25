import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentGatewaysTable = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(false),
  config: text("config"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentGatewaySchema = createInsertSchema(paymentGatewaysTable).omit({ id: true, updatedAt: true });
export type InsertPaymentGateway = z.infer<typeof insertPaymentGatewaySchema>;
export type PaymentGateway = typeof paymentGatewaysTable.$inferSelect;
