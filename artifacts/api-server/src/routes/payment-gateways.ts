import { Router } from "express";
import { db } from "@workspace/db";
import { paymentGatewaysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/payment-gateways", requireAdmin, async (req: any, res) => {
  try {
    const gateways = await db.select().from(paymentGatewaysTable);
    res.json(gateways.map(g => ({ ...g, updatedAt: g.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "ListPaymentGateways error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/payment-gateways", requireAdmin, async (req: any, res) => {
  try {
    const { name, config, isActive } = req.body;
    const existing = await db.select().from(paymentGatewaysTable).where(eq(paymentGatewaysTable.name, name)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(paymentGatewaysTable).set({ config, isActive: isActive ?? false, updatedAt: new Date() })
        .where(eq(paymentGatewaysTable.name, name)).returning();
      res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
    } else {
      const [created] = await db.insert(paymentGatewaysTable).values({ name, config, isActive: isActive ?? false }).returning();
      res.json({ ...created, updatedAt: created.updatedAt.toISOString() });
    }
  } catch (err) {
    req.log.error({ err }, "UpsertPaymentGateway error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/payment-gateways/:id/toggle", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    const [updated] = await db.update(paymentGatewaysTable).set({ isActive, updatedAt: new Date() })
      .where(eq(paymentGatewaysTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "TogglePaymentGateway error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
