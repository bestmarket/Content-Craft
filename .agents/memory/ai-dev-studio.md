---
name: AI Dev Studio
description: Full Replit-style IDE with AI code generation, file explorer, live preview, and publishing. Tables, routes, and frontend pages.
---

## Tables
- `coding_projects` — `lib/db/src/schema/coding-projects.ts`
- `project_files` — `lib/db/src/schema/project-files.ts`

## Routes
- `artifacts/api-server/src/routes/workspace.ts` — user-facing CRUD + AI generate/chat/publish/regenerate
- `artifacts/api-server/src/routes/admin-workspace.ts` — admin settings/stats/projects/delete

## Frontend Pages
- `artifacts/content-studio/src/pages/workspace.tsx` — project hub (list + create dialog)
- `artifacts/content-studio/src/pages/workspace-ide.tsx` — full IDE: CodeEditor, FileExplorer, LivePreview iframe, AI Chat, ZIP download
- `artifacts/content-studio/src/pages/admin/workspace.tsx` — admin panel

## Navigation
- Sidebar group "🧑‍💻 AI Dev Studio" → "⚡ AI Code Builder" → `/workspace` in AppLayout.tsx

## Key fixes
- `admin-workspace.ts` must use `isNotNull(codingProjectsTable.publishedProductId)` for published count, NOT `(tbl: any) => tbl.x !== null`.
- Settings reads/writes use `getSetting`/`upsertSetting` helpers with `eq(settingsTable.key, k)`.

**Why:** Drizzle ORM v4 does not accept inline arrow function predicates; must use imported operators (eq, isNotNull, inArray, etc.).
