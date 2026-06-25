import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";

const router = Router();

// Public endpoint — returns only the Google Client ID (not sensitive; it's embedded in every OAuth page)
router.get("/auth/google-config", async (req, res) => {
  try {
    const [row] = await db.select({ value: settingsTable.value })
      .from(settingsTable).where(eq(settingsTable.key, "google_client_id")).limit(1);
    const clientId = row?.value || process.env.GOOGLE_CLIENT_ID || null;
    res.json({ clientId });
  } catch {
    res.json({ clientId: null });
  }
});

router.get("/settings", requireAuth, async (req: any, res) => {
  try {
    const results = await db.select().from(settingsTable);
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "ListSettings error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/settings", requireAdmin, async (req: any, res) => {
  try {
    const { updates } = req.body;
    const results = [];
    for (const { key, value } of updates) {
      const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
      if (existing.length > 0) {
        const [s] = await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, key)).returning();
        results.push(s);
      } else {
        const [s] = await db.insert(settingsTable).values({ key, value, updatedAt: new Date() }).returning();
        results.push(s);
      }

    }
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "UpdateSetting error");
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/user/profile", requireAuth, async (req: any, res) => {
  try {
    const { name, username, country, profilePicture, profileBio } = req.body;
    if (username) {
      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        res.status(400).json({ error: "Username must be 3-30 chars, lowercase letters, numbers, underscores only" });
        return;
      }
      const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(eq(usersTable.username, username)).limit(1);
      if (existing && existing.id !== req.userId) {
        res.status(400).json({ error: "Username already taken" });
        return;
      }
    }
    await db.update(usersTable).set({
      ...(name && { name }),
      ...(username && { username }),
      ...(country && { country }),
      ...(profilePicture !== undefined && { profilePicture }),
      ...(profileBio !== undefined && { profileBio }),
    }).where(eq(usersTable.id, req.userId));

    const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId)).limit(1);
    const { password: _p, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    req.log.error({ err }, "UpdateProfile error");
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
