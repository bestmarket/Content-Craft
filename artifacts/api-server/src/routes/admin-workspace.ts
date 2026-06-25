import { Router } from "express";
import { db } from "@workspace/db";
import { codingProjectsTable, projectFilesTable, settingsTable, usersTable } from "@workspace/db";
import { eq, desc, count, isNotNull, or } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select({ value: settingsTable.value }).from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  return row?.value ?? null;
}

async function upsertSetting(key: string, value: string) {
  const existing = await db.select({ key: settingsTable.key }).from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  if (existing.length) {
    await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value });
  }
}

// GET /admin/workspace/settings
router.get("/admin/workspace/settings", requireAdmin, async (_req, res) => {
  try {
    const [hostingEnabled, hostingMessage, workspaceEnabled] = await Promise.all([
      getSetting("workspace_hosting_enabled"),
      getSetting("workspace_hosting_message"),
      getSetting("workspace_enabled"),
    ]);
    res.json({
      settings: {
        workspace_hosting_enabled: hostingEnabled ?? "false",
        workspace_hosting_message: hostingMessage ?? "",
        workspace_enabled: workspaceEnabled ?? "true",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch workspace settings" });
  }
});

// PUT /admin/workspace/settings
router.put("/admin/workspace/settings", requireAdmin, async (req, res) => {
  try {
    const { hostingEnabled, hostingMessage, workspaceEnabled } = req.body;
    const ops: Promise<void>[] = [];
    if (hostingEnabled !== undefined) ops.push(upsertSetting("workspace_hosting_enabled", String(hostingEnabled)));
    if (hostingMessage !== undefined) ops.push(upsertSetting("workspace_hosting_message", String(hostingMessage)));
    if (workspaceEnabled !== undefined) ops.push(upsertSetting("workspace_enabled", String(workspaceEnabled)));
    await Promise.all(ops);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// GET /admin/workspace/projects
router.get("/admin/workspace/projects", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const projects = await db
      .select({
        id: codingProjectsTable.id,
        name: codingProjectsTable.name,
        description: codingProjectsTable.description,
        projectType: codingProjectsTable.projectType,
        framework: codingProjectsTable.framework,
        status: codingProjectsTable.status,
        userId: codingProjectsTable.userId,
        userEmail: usersTable.email,
        generationCount: codingProjectsTable.generationCount,
        publishedProductId: codingProjectsTable.publishedProductId,
        createdAt: codingProjectsTable.createdAt,
        updatedAt: codingProjectsTable.updatedAt,
      })
      .from(codingProjectsTable)
      .leftJoin(usersTable, eq(codingProjectsTable.userId, usersTable.id))
      .orderBy(desc(codingProjectsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(codingProjectsTable);

    res.json({ projects, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /admin/workspace/stats
router.get("/admin/workspace/stats", requireAdmin, async (_req, res) => {
  try {
    const [[{ total }], [{ ready }], [{ published }], [{ totalFiles }]] = await Promise.all([
      db.select({ total: count() }).from(codingProjectsTable),
      db.select({ ready: count() }).from(codingProjectsTable).where(eq(codingProjectsTable.status, "ready")),
      db.select({ published: count() }).from(codingProjectsTable).where(isNotNull(codingProjectsTable.publishedProductId)),
      db.select({ totalFiles: count() }).from(projectFilesTable),
    ]);
    res.json({ total, ready, published, totalFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// DELETE /admin/workspace/projects/:id
router.delete("/admin/workspace/projects/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(codingProjectsTable).where(eq(codingProjectsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
