import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const videoMarketingJobsTable = pgTable("video_marketing_jobs", {
  id:            serial("id").primaryKey(),
  userId:        integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId:     integer("product_id"),
  title:         text("title").notNull(),
  niche:         text("niche").notNull().default(""),
  platform:      text("platform").notNull().default("tiktok"),
  hook:          text("hook"),
  problem:       text("problem"),
  solution:      text("solution"),
  cta:           text("cta"),
  fullScript:    text("full_script"),
  voiceId:       text("voice_id").notNull().default("af_sky"),
  style:         text("style").notNull().default("dark_pro"),
  captionStyle:  text("caption_style").notNull().default("subtitle"),
  aspectRatio:   text("aspect_ratio").notNull().default("portrait"),
  jobKey:        text("job_key"),
  status:        text("status").notNull().default("draft"),
  errorMessage:  text("error_message"),
  videoUrl:      text("video_url"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});
