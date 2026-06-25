import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, walletTransactionsTable } from "@workspace/db";
import { withdrawalRequestsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

// ── List all withdrawal requests ───────────────────────────────────────────
router.get("/admin/withdrawals", requireAdmin, async (req: any, res) => {
  try {
    const status = req.query.status as string | undefined;

    const rows = await db.execute(sql`
      SELECT
        wr.id,
        wr.amount::float,
        wr.method,
        wr.details,
        wr.status,
        wr.admin_note,
        wr.processed_at,
        wr.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.wallet_balance::float AS wallet_balance
      FROM withdrawal_requests wr
      JOIN users u ON u.id = wr.user_id
      ${status ? sql`WHERE wr.status = ${status}` : sql``}
      ORDER BY wr.created_at DESC
      LIMIT 100
    `);

    res.json(rows.rows);
  } catch (err) {
    req.log.error({ err }, "AdminWithdrawals error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Withdrawal stats ───────────────────────────────────────────────────────
router.get("/admin/withdrawals/stats", requireAdmin, async (req: any, res) => {
  try {
    const statsRaw = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::int AS paid_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int AS rejected_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0)::float AS pending_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0)::float AS total_paid_out,
        (SELECT COALESCE(SUM(wallet_balance), 0)::float FROM users WHERE wallet_balance > 0) AS total_wallet_balance
      FROM withdrawal_requests
    `);
    const stats = (statsRaw.rows ?? (statsRaw as any))[0];
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "WithdrawalStats error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Approve a withdrawal ───────────────────────────────────────────────────
router.post("/admin/withdrawals/:id/approve", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNote } = req.body as { adminNote?: string };

    const [wr] = await db
      .update(withdrawalRequestsTable)
      .set({ status: "approved", adminNote: adminNote ?? null, processedAt: new Date() })
      .where(and(eq(withdrawalRequestsTable.id, id), eq(withdrawalRequestsTable.status, "pending")))
      .returning();

    if (!wr) {
      res.status(404).json({ error: "Request not found or already processed" });
      return;
    }

    res.json(wr);
  } catch (err) {
    req.log.error({ err }, "ApproveWithdrawal error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Mark as paid (after actual transfer) ──────────────────────────────────
router.post("/admin/withdrawals/:id/mark-paid", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNote } = req.body as { adminNote?: string };

    const [wr] = await db
      .update(withdrawalRequestsTable)
      .set({ status: "paid", adminNote: adminNote ?? null, processedAt: new Date() })
      .where(eq(withdrawalRequestsTable.id, id))
      .returning();

    if (!wr) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // Deduct from user wallet balance
    await db.update(usersTable)
      .set({ walletBalance: sql`GREATEST(0, ${usersTable.walletBalance} - ${wr.amount})` })
      .where(eq(usersTable.id, wr.userId));

    // Log the debit transaction
    await db.insert(walletTransactionsTable).values({
      userId: wr.userId,
      type: "withdrawal",
      amount: String(wr.amount),
      description: `Withdrawal via ${wr.method} — paid by admin`,
      status: "completed",
    });

    res.json(wr);
  } catch (err) {
    req.log.error({ err }, "MarkWithdrawalPaid error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── Reject a withdrawal ────────────────────────────────────────────────────
router.post("/admin/withdrawals/:id/reject", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNote } = req.body as { adminNote?: string };

    const [wr] = await db
      .update(withdrawalRequestsTable)
      .set({ status: "rejected", adminNote: adminNote ?? null, processedAt: new Date() })
      .where(and(eq(withdrawalRequestsTable.id, id), eq(withdrawalRequestsTable.status, "pending")))
      .returning();

    if (!wr) {
      res.status(404).json({ error: "Request not found or already processed" });
      return;
    }

    res.json(wr);
  } catch (err) {
    req.log.error({ err }, "RejectWithdrawal error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
