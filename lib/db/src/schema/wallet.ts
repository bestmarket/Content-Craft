import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type", { enum: ["credit", "debit", "withdrawal", "refund", "affiliate_commission"] }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("completed"),
  description: text("description"),
  reference: text("reference"),
  productId: integer("product_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({ id: true, createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;

export const withdrawalRequestsTable = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method", { enum: ["paypal", "bank_transfer", "crypto", "payoneer", "paddle", "lemonsqueezy", "other"] }).notNull().default("paypal"),
  details: text("details"),
  status: text("status", { enum: ["pending", "approved", "rejected", "paid"] }).notNull().default("pending"),
  adminNote: text("admin_note"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequestsTable).omit({ id: true, createdAt: true, processedAt: true });
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequestsTable.$inferSelect;
