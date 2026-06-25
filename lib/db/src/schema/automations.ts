import { pgTable, serial, text, boolean, timestamp, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const automationBlocksTable = pgTable("automation_blocks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull().default("Zap"),
  color: text("color").notNull().default("purple"),
  inputs: jsonb("inputs").notNull().default([]),
  outputLabel: text("output_label").notNull().default("Result"),
  aiPrompt: text("ai_prompt").notNull(),
  outputFormat: text("output_format").notNull().default("text"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const automationToolsTable = pgTable("automation_tools", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("content"),
  emoji: text("emoji").notNull().default("⚡"),
  steps: jsonb("steps").notNull().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  marketplaceTitle: text("marketplace_title"),
  marketplaceDescription: text("marketplace_description"),
  marketplaceTags: jsonb("marketplace_tags").notNull().default([]),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  installCount: integer("install_count").notNull().default(0),
  runCount: integer("run_count").notNull().default(0),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  isScheduled: boolean("is_scheduled").notNull().default(false),
  scheduleFrequency: text("schedule_frequency"),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const automationRunsTable = pgTable("automation_runs", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").notNull().references(() => automationToolsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().default("pending"),
  inputs: jsonb("inputs").notNull().default({}),
  stepOutputs: jsonb("step_outputs").notNull().default([]),
  finalOutput: text("final_output"),
  error: text("error"),
  duration: integer("duration"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const automationInstallsTable = pgTable("automation_installs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  toolId: integer("tool_id").notNull().references(() => automationToolsTable.id),
  pricePaid: numeric("price_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  installedAt: timestamp("installed_at").notNull().defaultNow(),
});

export const insertAutomationToolSchema = createInsertSchema(automationToolsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAutomationTool = z.infer<typeof insertAutomationToolSchema>;
export type AutomationTool = typeof automationToolsTable.$inferSelect;
export type AutomationBlock = typeof automationBlocksTable.$inferSelect;
export type AutomationRun = typeof automationRunsTable.$inferSelect;
