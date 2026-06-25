import { Router } from "express";
import { db } from "@workspace/db";
import { contentHistoryTable, pdfHistoryTable, usersTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

const FREE_LIMITS = {
  content: 5,
  pdf: 2,
  thumbnail: 3,
  landingPage: 2,
  script: 2,
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/usage/today", requireAuth, async (req: any, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    const isPro = (user as any)?.isPro ?? false;

    const today = startOfToday();

    const [contentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentHistoryTable)
      .where(and(eq(contentHistoryTable.userId, req.userId), gte(contentHistoryTable.createdAt, today)));

    const [pdfCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pdfHistoryTable)
      .where(and(eq(pdfHistoryTable.userId, req.userId), gte(pdfHistoryTable.createdAt, today)));

    res.json({
      isPro,
      limits: isPro ? null : FREE_LIMITS,
      usage: {
        content: Number(contentCount.count),
        pdf: Number(pdfCount.count),
        thumbnail: 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Usage error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
