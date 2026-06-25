---
name: ViralCraft Studio import
description: Key decisions and gotchas from importing the ViralCraft Studio app from GitHub into this Replit workspace.
---

## Vite PORT handling
The original repo's vite.config.ts used `VITE_PORT` with a 5173 fallback. Replit artifact workflows inject `PORT` (not `VITE_PORT`). The fix: use `process.env.PORT ?? "5173"` — the fallback is safe because `server.port` is irrelevant during Vercel static builds where PORT is absent.

**Why:** Hard-throwing on missing PORT breaks `pnpm --filter @workspace/content-studio run build` in Vercel CI (no PORT injected there). Fallback satisfies both contexts.

**How to apply:** Always use the fallback pattern in vite.config.ts, never `throw` on missing PORT.

## API proxy in dev
Vite dev server proxies `/api` to `http://localhost:8080` (the artifact-managed API server port). The original repo pointed to port 5000 — that was wrong for this workspace.

## Git remote
`origin` is set to `https://github.com/bestmarket/Content-Craft.git`. User needs to connect GitHub account via Replit integrations to push. Use `gitPush({})` from the git-remote skill once connected.

## DB schema
Schema lives in `lib/db/src/schema/` — many tables (users, products, features, wallet, subscriptions, etc.). Always run `pnpm --filter @workspace/db run push` after schema changes.

## Vercel deployment structure
- Frontend builds to `/public/` (Vercel outputDirectory)
- API runs as a serverless function via `api/handler.mjs`
- In prod, frontend uses `VITE_API_URL` env var to point at Railway API; in dev, uses Vite proxy
- `vercel.json` also runs `drizzle-kit push` during build — this requires DB env vars in Vercel
