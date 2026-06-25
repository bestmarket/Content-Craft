import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { templateProductsTable } from "./templates";

export const aiAgentsTable = pgTable("ai_agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  templateId: integer("template_id").references(() => templateProductsTable.id),
  agentKey: text("agent_key").notNull().unique(),
  name: text("name").notNull(),
  agentType: text("agent_type").notNull().default("custom"),
  systemPrompt: text("system_prompt").notNull(),
  welcomeMessage: text("welcome_message").notNull().default("Hi! How can I help you today?"),
  primaryColor: text("primary_color").notNull().default("#7c3aed"),
  position: text("position").notNull().default("bottom-right"),
  avatarEmoji: text("avatar_emoji").notNull().default("🤖"),
  isActive: boolean("is_active").notNull().default(true),
  collectLeads: boolean("collect_leads").notNull().default(true),
  totalConversations: integer("total_conversations").notNull().default(0),
  totalLeads: integer("total_leads").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agentConversationsTable = pgTable("agent_conversations", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => aiAgentsTable.id),
  sessionId: text("session_id").notNull(),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiAgent = typeof aiAgentsTable.$inferSelect;
export type AgentConversation = typeof agentConversationsTable.$inferSelect;
