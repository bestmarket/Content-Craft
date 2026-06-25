import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { codingProjectsTable } from "./coding-projects";

export const projectFilesTable = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => codingProjectsTable.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  name: text("name").notNull(),
  content: text("content").default(""),
  language: text("language").default("text"),
  isEntrypoint: boolean("is_entrypoint").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectFileSchema = createInsertSchema(projectFilesTable);
export type ProjectFile = typeof projectFilesTable.$inferSelect;
export type InsertProjectFile = typeof projectFilesTable.$inferInsert;
