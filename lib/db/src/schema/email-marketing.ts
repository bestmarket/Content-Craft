import { pgTable, serial, integer, text, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";
import { ordersTable } from "./orders";

export const emailSequencesTable = pgTable("email_sequences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  productId: integer("product_id").references(() => productsTable.id),
  automationRunId: integer("automation_run_id"),
  name: text("name").notNull(),
  description: text("description"),
  fromName: text("from_name").notNull().default("ViralCraft Studio"),
  fromEmail: text("from_email").notNull().default("noreply@viralcraft.studio"),
  replyTo: text("reply_to"),
  emails: jsonb("emails").notNull().default([]),
  status: text("status", { enum: ["active", "paused", "draft"] }).notNull().default("draft"),
  totalSubscribers: integer("total_subscribers").notNull().default(0),
  totalSent: integer("total_sent").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalUnsubscribed: integer("total_unsubscribed").notNull().default(0),
  source: text("source", { enum: ["product", "automation", "manual"] }).notNull().default("manual"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailSubscribersTable = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").notNull().references(() => emailSequencesTable.id),
  productId: integer("product_id").references(() => productsTable.id),
  orderId: integer("order_id").references(() => ordersTable.id),
  email: text("email").notNull(),
  name: text("name"),
  status: text("status", { enum: ["active", "unsubscribed", "completed", "bounced"] }).notNull().default("active"),
  currentEmailIndex: integer("current_email_index").notNull().default(0),
  nextSendAt: timestamp("next_send_at"),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  metadata: jsonb("metadata").default({}),
  unsubscribeToken: text("unsubscribe_token"),
  tags: jsonb("tags").default([]),
});

export const emailSendsTable = pgTable("email_sends", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull().references(() => emailSubscribersTable.id),
  sequenceId: integer("sequence_id").notNull().references(() => emailSequencesTable.id),
  emailIndex: integer("email_index").notNull(),
  subject: text("subject").notNull(),
  status: text("status", { enum: ["sent", "failed", "pending"] }).notNull().default("pending"),
  error: text("error"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  opened: boolean("opened").default(false),
  openedAt: timestamp("opened_at"),
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at"),
  trackingToken: text("tracking_token"),
});
