import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videoJobsTable = pgTable("video_jobs", {
  id:              serial("id").primaryKey(),
  userId:          integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jobKey:          text("job_key").notNull(),
  title:           text("title").notNull(),
  script:          text("script").notNull(),
  voiceId:         text("voice_id").notNull().default("af_sky"),
  style:           text("style").notNull().default("dark_pro"),
  captionStyle:    text("caption_style").notNull().default("subtitle"),
  aspectRatio:     text("aspect_ratio").notNull().default("landscape"),
  status:          text("status").notNull().default("pending"),
  progress:        integer("progress").notNull().default(0),
  statusMessage:   text("status_message"),
  durationSeconds: real("duration_seconds"),
  errorMessage:    text("error_message"),
  videoUrl:        text("video_url"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
});
