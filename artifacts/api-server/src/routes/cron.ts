import { Router } from "express";
import { runSchedulerTick } from "../scheduler";
import { logger } from "../lib/logger";

const router = Router();

// Called by Vercel Cron every 15 minutes (see vercel.json).
// On Replit the in-process setInterval is used instead, but hitting this
// endpoint manually is also safe — it's idempotent.
// Protected by CRON_SECRET so random callers can't trigger it.
router.post("/cron/tick", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ error: "Unauthorized" }); return;
    }
  }

  logger.info("⏰ Cron tick triggered via HTTP");
  // Run in background — respond immediately so Vercel doesn't time out
  runSchedulerTick().catch((err) =>
    logger.error({ err: err.message }, "Cron tick error"),
  );

  res.json({ ok: true, triggeredAt: new Date().toISOString() }); return;
});

export default router;
