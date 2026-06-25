import { pgTable, serial, text, integer, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const saasAppsTable = pgTable("saas_apps", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description").notNull(),
  niche: text("niche"),
  businessType: text("business_type").default("saas_tool"),
  deploySlug: text("deploy_slug").unique(),
  status: text("status").notNull().default("draft"),
  brandColor: text("brand_color").default("#7c3aed"),
  coverImageUrl: text("cover_image_url"),
  thumbnailUrl: text("thumbnail_url"),
  thankYouMessage: text("thank_you_message"),
  appHtml: text("app_html"),
  youtubeScript: text("youtube_script"),
  tiers: jsonb("tiers").$type<Array<{
    id: string; name: string; priceMonthly: number; priceAnnual: number;
    priceLifetime: number | null; perks: string[]; highlighted: boolean; color: string;
  }>>().default([]),
  landingPage: jsonb("landing_page").$type<{
    headline: string; subheadline: string;
    features: Array<{ icon: string; title: string; desc: string }>;
    testimonials: Array<{ name: string; text: string; avatar: string }>;
    faq: Array<{ q: string; a: string }>;
    cta: string;
  }>(),
  marketingPlan: jsonb("marketing_plan").$type<{
    youtubeIdeas: string[]; tiktokIdeas: string[];
    instagramTheme: string; hooks: string[];
    launchChecklist: string[]; targetAudience: string;
    painPoints: string[]; uniqueAngle: string;
  }>(),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).default("0"),
  subscriberCount: integer("subscriber_count").default(0),
  generationStatus: text("generation_status").default("idle"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const saasSubscriptionsTable = pgTable("saas_subscriptions", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull().references(() => saasAppsTable.id, { onDelete: "cascade" }),
  subscriberEmail: text("subscriber_email").notNull(),
  subscriberName: text("subscriber_name"),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  tierId: text("tier_id").notNull(),
  tierName: text("tier_name").notNull(),
  billingPeriod: text("billing_period").notNull().default("monthly"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  accessToken: text("access_token"),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SaasApp = typeof saasAppsTable.$inferSelect;
export type InsertSaasApp = typeof saasAppsTable.$inferInsert;
export type SaasSubscription = typeof saasSubscriptionsTable.$inferSelect;
export type InsertSaasSubscription = typeof saasSubscriptionsTable.$inferInsert;
