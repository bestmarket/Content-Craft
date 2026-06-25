import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userFeatureOverridesTable = pgTable("user_feature_overrides", {
  id:         serial("id").primaryKey(),
  userId:     integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  featureKey: text("feature_key").notNull(),
  access:     text("access").notNull(), // 'granted' | 'revoked'
  reason:     text("reason"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique("uq_user_feature").on(t.userId, t.featureKey)]);
