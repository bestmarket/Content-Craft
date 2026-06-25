import { pgTable, serial, integer, text, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const voiceClonesTable = pgTable("voice_clones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  baseVoiceId: text("base_voice_id").notNull().default("af_sky"),
  pitchFactor: real("pitch_factor").notNull().default(1.0),
  speedFactor: real("speed_factor").notNull().default(1.0),
  sampleText: text("sample_text"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const voiceGenerationsTable = pgTable("voice_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  voiceId: text("voice_id").notNull(),
  cloneId: integer("clone_id"),
  durationSeconds: real("duration_seconds"),
  characterCount: integer("character_count").notNull().default(0),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
