import { pgTable, serial, text, boolean, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  username: text("username").unique(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  subscriptionTier: text("subscription_tier", { enum: ["free", "pro"] }).notNull().default("free"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  walletBalance: numeric("wallet_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  country: text("country"),
  affiliateCode: text("affiliate_code").unique(),
  affiliateCommissionRate: numeric("affiliate_commission_rate", { precision: 5, scale: 4 }).notNull().default("0.3000"),
  referredBy: integer("referred_by"),
  profilePicture: text("profile_picture"),
  profileBio: text("profile_bio"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  aiCredits: integer("ai_credits").notNull().default(20),
  aiCreditsLastRefill: text("ai_credits_last_refill"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, lastLogin: true, currentStreak: true, longestStreak: true, lastActiveDate: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
