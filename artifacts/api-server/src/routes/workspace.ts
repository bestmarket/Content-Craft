import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import {
  codingProjectsTable,
  projectFilesTable,
  productsTable,
  settingsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth";
import { callGeminiFallback } from "./ai-utils";

const router = Router();

// ─── AI Generation Helpers ────────────────────────────────────────────────────

const GENERATION_SYSTEM = `You are a world-class senior software engineer with 20+ years experience. You write clean, complete, production-quality code that actually works. You never use placeholder comments like "TODO" or "Add your code here". Every file you generate is fully implemented.`;

async function generateProjectFiles(
  description: string,
  projectType: string,
): Promise<{ projectName: string; framework: string; language: string; previewType: string; readme: string; files: Array<{ path: string; name: string; content: string; language: string; isEntrypoint: boolean }> } | null> {
  const prompt = `Generate a complete, fully-working ${projectType} project based on this description:

"${description}"

Rules:
- ALL code must be complete and functional — no placeholders, no TODOs
- For web projects: use pure HTML/CSS/JavaScript, or React/Vue loaded via CDN (babel-standalone for JSX)
- Generate beautiful, modern UI with gradient styling and proper UX
- Include all necessary files
- previewType = "html" if runnable in browser (HTML/JS/CSS, CDN React/Vue)
- previewType = "code" for server-side (Python, Node.js backend, etc.)

Respond with ONLY a valid JSON object (absolutely no markdown, no backtick code blocks, just raw JSON):
{
  "projectName": "Descriptive Project Name",
  "framework": "html-css-js",
  "language": "javascript",
  "previewType": "html",
  "readme": "## How to Run\\n\\nOpen index.html in browser.",
  "files": [
    {
      "path": "index.html",
      "name": "index.html",
      "content": "<!DOCTYPE html>...(complete content)...",
      "language": "html",
      "isEntrypoint": true
    },
    {
      "path": "style.css",
      "name": "style.css",
      "content": "...(complete CSS)...",
      "language": "css",
      "isEntrypoint": false
    },
    {
      "path": "app.js",
      "name": "app.js",
      "content": "...(complete JS)...",
      "language": "javascript",
      "isEntrypoint": false
    }
  ]
}`;

  const result = await callGeminiFallback(
    [{ role: "user", content: prompt }],
    GENERATION_SYSTEM,
    32768,
    "workspace",
  );
  if (!result?.text) return null;

  try {
    let raw = result.text.trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    // Try to extract JSON object
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function editProjectWithAI(
  files: Array<{ path: string; name: string; content: string; language: string; isEntrypoint: boolean }>,
  message: string,
  chatHistory: Array<{ role: string; content: string }>,
): Promise<{ message: string; modifiedFiles: typeof files; newFiles: typeof files; deletedPaths: string[] } | null> {
  const filesContext = files
    .map(f => `--- FILE: ${f.path} ---\n${f.content}`)
    .join("\n\n");

  const historyText = chatHistory.slice(-6).map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");

  const prompt = `${historyText ? `Previous conversation:\n${historyText}\n\n` : ""}Current project files:\n${filesContext}\n\nUser request: "${message}"\n\nModify the project to fulfill the request completely and correctly.\n\nReturn ONLY valid JSON (no markdown, no backticks):\n{\n  "message": "Brief summary of what was changed",\n  "modifiedFiles": [\n    {\n      "path": "index.html",\n      "name": "index.html",\n      "content": "...(complete updated file content)...",\n      "language": "html",\n      "isEntrypoint": true\n    }\n  ],\n  "newFiles": [],\n  "deletedPaths": []\n}\n\nIMPORTANT: Return the COMPLETE file content for every modified file.`;

  const result = await callGeminiFallback(
    [{ role: "user", content: prompt }],
    GENERATION_SYSTEM,
    32768,
    "workspace",
  );
  if (!result?.text) return null;

  try {
    let raw = result.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(raw);
  } catch {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html", htm: "html",
    css: "css", scss: "scss", sass: "sass",
    js: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    cs: "csharp",
    php: "php",
    md: "markdown",
    json: "json",
    yaml: "yaml", yml: "yaml",
    sh: "bash",
    sql: "sql",
    txt: "text",
    xml: "xml",
    svg: "svg",
    toml: "toml",
    env: "text",
  };
  return map[ext] ?? "text";
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// ── PUBLIC: GET /workspace/preview/:token ────────────────────────────────────
// No auth required — anyone with the token can view the live demo
router.get("/workspace/preview/:token", async (req: any, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 8) res.status(400).json({ error: "Invalid token" }); return;

    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(eq(codingProjectsTable.shareToken, token))
      .limit(1);

    if (!project) res.status(404).json({ error: "Preview not found or sharing has been disabled" }); return;

    const files = await db
      .select()
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, project.id))
      .orderBy(projectFilesTable.path);

    // Return safe subset — no chat history, no user IDs
    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        projectType: project.projectType,
        framework: project.framework,
        language: project.language,
        previewType: project.previewType,
        updatedAt: project.updatedAt,
      },
      files,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load preview" });
  }
});

// POST /workspace/projects/:id/share — enable sharing (generate token)
router.post("/workspace/projects/:id/share", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, id), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    // If already shared, return existing token; otherwise generate fresh one
    const token = project.shareToken ?? randomUUID();

    const [updated] = await db
      .update(codingProjectsTable)
      .set({ shareToken: token, updatedAt: new Date() })
      .where(eq(codingProjectsTable.id, id))
      .returning();

    res.json({ shareToken: updated.shareToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to enable sharing" });
  }
});

// DELETE /workspace/projects/:id/share — revoke sharing
router.delete("/workspace/projects/:id/share", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, id), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    await db
      .update(codingProjectsTable)
      .set({ shareToken: null, updatedAt: new Date() })
      .where(eq(codingProjectsTable.id, id));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to revoke sharing" });
  }
});

// GET /workspace/projects
router.get("/workspace/projects", requireAuth, async (req: any, res) => {
  try {
    const projects = await db
      .select()
      .from(codingProjectsTable)
      .where(eq(codingProjectsTable.userId, req.userId!))
      .orderBy(desc(codingProjectsTable.updatedAt));
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST /workspace/projects — create + AI generate
router.post("/workspace/projects", requireAuth, async (req: any, res) => {
  const { name, description, projectType = "web" } = req.body;
  if (!description?.trim()) {
    res.status(400).json({ error: "Description is required" }); return;
  }

  try {
    // Create project record first
    const [project] = await db
      .insert(codingProjectsTable)
      .values({
        userId: req.userId!,
        name: name?.trim() || "Untitled Project",
        description: description.trim(),
        projectType,
        status: "generating",
      })
      .returning();

    // Generate files with AI
    const generated = await generateProjectFiles(description, projectType);

    if (!generated) {
      await db
        .update(codingProjectsTable)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(codingProjectsTable.id, project.id));
      res.status(500).json({ error: "AI generation failed — check API keys in admin" }); return;
    }

    // Insert generated files
    const fileRows = generated!.files.map((f: any) => ({
      projectId: project.id,
      path: f.path,
      name: f.name,
      content: f.content ?? "",
      language: f.language || detectLanguage(f.name),
      isEntrypoint: !!f.isEntrypoint,
    }));

    await db.insert(projectFilesTable).values(fileRows);

    // Update project metadata
    const [updated] = await db
      .update(codingProjectsTable)
      .set({
        name: generated.projectName || project.name,
        framework: generated.framework || "html-css-js",
        language: generated.language || "javascript",
        status: "ready",
        previewType: generated.previewType || "code",
        readme: generated.readme || "",
        generationCount: 1,
        chatHistory: [{ role: "assistant", content: `I created your ${projectType} project: ${generated.projectName}. It has ${fileRows.length} files and is ready to use.`, ts: new Date().toISOString() }] as any,
        updatedAt: new Date(),
      })
      .where(eq(codingProjectsTable.id, project.id))
      .returning();

    const files = await db
      .select()
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, project.id));

    res.json({ project: updated, files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// GET /workspace/projects/:id
router.get("/workspace/projects/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, id), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    const files = await db
      .select()
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, id))
      .orderBy(projectFilesTable.path);

    res.json({ project, files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// DELETE /workspace/projects/:id
router.delete("/workspace/projects/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, id), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    await db.delete(codingProjectsTable).where(eq(codingProjectsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// PUT /workspace/projects/:id — update metadata
router.put("/workspace/projects/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, id), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    const [updated] = await db
      .update(codingProjectsTable)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(codingProjectsTable.id, id))
      .returning();
    res.json({ project: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// POST /workspace/projects/:id/files — add file
router.post("/workspace/projects/:id/files", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, projectId), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    const { path, name, content = "", isEntrypoint = false } = req.body;
    if (!path || !name) res.status(400).json({ error: "path and name required" }); return;

    const [file] = await db.insert(projectFilesTable).values({
      projectId,
      path,
      name,
      content,
      language: detectLanguage(name),
      isEntrypoint,
    }).returning();

    await db.update(codingProjectsTable).set({ updatedAt: new Date() }).where(eq(codingProjectsTable.id, projectId));
    res.json({ file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add file" });
  }
});

// PUT /workspace/projects/:id/files/:fileId — update file content
router.put("/workspace/projects/:id/files/:fileId", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const fileId = parseInt(req.params.fileId);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, projectId), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    const { content, name } = req.body;
    const [file] = await db
      .update(projectFilesTable)
      .set({ content, ...(name ? { name } : {}), updatedAt: new Date() })
      .where(and(eq(projectFilesTable.id, fileId), eq(projectFilesTable.projectId, projectId)))
      .returning();

    await db.update(codingProjectsTable).set({ updatedAt: new Date() }).where(eq(codingProjectsTable.id, projectId));
    res.json({ file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update file" });
  }
});

// DELETE /workspace/projects/:id/files/:fileId
router.delete("/workspace/projects/:id/files/:fileId", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const fileId = parseInt(req.params.fileId);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, projectId), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    await db
      .delete(projectFilesTable)
      .where(and(eq(projectFilesTable.id, fileId), eq(projectFilesTable.projectId, projectId)));
    await db.update(codingProjectsTable).set({ updatedAt: new Date() }).where(eq(codingProjectsTable.id, projectId));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// POST /workspace/projects/:id/chat — AI chat to edit project
router.post("/workspace/projects/:id/chat", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { message } = req.body;
    if (!message?.trim()) res.status(400).json({ error: "Message required" }); return;

    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, projectId), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    const files = await db
      .select()
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, projectId));

    const history = (project.chatHistory as any[] ?? []);
    const result = await editProjectWithAI(
      files.map(f => ({ path: f.path, name: f.name, content: f.content ?? "", language: f.language ?? "text", isEntrypoint: !!f.isEntrypoint })),
      message.trim(),
      history,
    );

    if (!result) {
      res.status(500).json({ error: "AI failed — check API keys in admin" }); return;
    }

    // Apply modifications
    const allModified = [...(result!.modifiedFiles ?? []), ...(result!.newFiles ?? [])];
    for (const mf of allModified) {
      const existing = files.find(f => f.path === mf.path);
      if (existing) {
        await db.update(projectFilesTable)
          .set({ content: mf.content, updatedAt: new Date() })
          .where(eq(projectFilesTable.id, (existing as any).id));
      } else {
        await db.insert(projectFilesTable).values({
          projectId,
          path: mf.path,
          name: mf.name,
          content: mf.content ?? "",
          language: mf.language || detectLanguage(mf.name),
          isEntrypoint: !!mf.isEntrypoint,
        });
      }
    }

    // Delete files
    for (const dp of result!.deletedPaths ?? []) {
      const existing = files.find(f => f.path === dp);
      if (existing) {
        await db.delete(projectFilesTable).where(eq(projectFilesTable.id, existing!.id));
      }
    }

    // Update chat history
    const newHistory = [
      ...history,
      { role: "user", content: message.trim(), ts: new Date().toISOString() },
      { role: "assistant", content: (result as any).message, ts: new Date().toISOString() },
    ].slice(-30);

    await db.update(codingProjectsTable)
      .set({ chatHistory: newHistory as any, updatedAt: new Date() })
      .where(eq(codingProjectsTable.id, projectId));

    // Return updated files
    const updatedFiles = await db
      .select()
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, projectId))
      .orderBy(projectFilesTable.path);

    res.json({
      message: result!.message,
      files: updatedFiles,
      modifiedPaths: allModified.map((f: any) => f.path),
      deletedPaths: result!.deletedPaths ?? [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// POST /workspace/projects/:id/regenerate — full AI regeneration
router.post("/workspace/projects/:id/regenerate", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, projectId), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    await db.update(codingProjectsTable).set({ status: "generating" }).where(eq(codingProjectsTable.id, projectId));

    const generated = await generateProjectFiles(
      project.description || project.name,
      project.projectType,
    );

    if (!generated) {
      await db.update(codingProjectsTable).set({ status: "error" }).where(eq(codingProjectsTable.id, projectId));
      res.status(500).json({ error: "AI generation failed" }); return;
    }

    // Delete old files and insert new
    await db.delete(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    await db.insert(projectFilesTable).values(
      generated!.files.map((f: any) => ({
        projectId,
        path: f.path,
        name: f.name,
        content: f.content ?? "",
        language: f.language || detectLanguage(f.name),
        isEntrypoint: !!f.isEntrypoint,
      })),
    );

    const [updated] = await db.update(codingProjectsTable)
      .set({
        framework: generated!.framework,
        language: generated!.language,
        previewType: generated!.previewType,
        readme: generated!.readme,
        status: "ready",
        generationCount: (project.generationCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(codingProjectsTable.id, projectId))
      .returning();

    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    res.json({ project: updated, files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Regeneration failed" });
  }
});

// POST /workspace/projects/:id/publish — publish to marketplace
router.post("/workspace/projects/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { title, description, price = 0 } = req.body;

    const [project] = await db
      .select()
      .from(codingProjectsTable)
      .where(and(eq(codingProjectsTable.id, projectId), eq(codingProjectsTable.userId, req.userId!)));
    if (!project) res.status(404).json({ error: "Project not found" }); return;

    // Check hosting settings
    const [hostingSetting] = await db.select().from(settingsTable).where(eq(settingsTable.key, "workspace_hosting_enabled")).limit(1);
    const hostingEnabled = hostingSetting?.value === "true";

    // Create or update marketplace product
    if (project.publishedProductId) {
      await db.update(productsTable)
        .set({ title: title || project.name, description: description || project.description, price: String(price), publishStatus: "published" as any, isPublished: true, updatedAt: new Date() })
        .where(eq(productsTable.id, project.publishedProductId!));
      res.json({ success: true, productId: project.publishedProductId, hostingEnabled }); return;
    }

    const [product] = await db.insert(productsTable).values({
      userId: req.userId!,
      title: title || project.name,
      description: description || project.description || "",
      price: String(price),
      productType: "code_project",
      publishStatus: "published",
      isPublished: true,
    } as any).returning();

    await db.update(codingProjectsTable)
      .set({ publishedProductId: product.id, updatedAt: new Date() })
      .where(eq(codingProjectsTable.id, projectId));

    res.json({ success: true, productId: product.id, hostingEnabled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to publish project" });
  }
});

export default router;
