# ViralCraft Studio

An AI-powered content creation platform for digital product creators — generate viral scripts, captions, hooks, PDFs, and manage a full digital product marketplace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/content-studio run dev` — run the frontend (port 19046)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Wouter routing
- API: Express 5 (port 8080 in dev, /api path)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT + bcryptjs (custom auth in api-server)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/content-studio/src/pages/` — all frontend pages
- `artifacts/content-studio/src/components/` — shared UI components
- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/api-server/src/data/` — static trending/template data
- `lib/db/src/schema/` — all Drizzle DB table definitions
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `vercel.json` — Vercel deployment config
- `api/handler.mjs` — Vercel serverless function entry point

## Architecture decisions

- JWT auth stored in localStorage; all API calls include Bearer token via `setAuthTokenGetter`
- In dev (Replit), API calls use relative `/api` path proxied by Vite to port 8080
- In production (Vercel), `VITE_API_URL` points to the Railway API server
- Frontend builds to `/public/` directory which is also the Vercel output directory
- DB schema push (not migrations) used for dev; Replit Publish handles prod schema changes

## Product

ViralCraft Studio is a full digital product marketplace and content creation platform:
- AI content generation (scripts, captions, hooks, hooks)
- PDF generation and download
- Digital product marketplace (create, list, sell products)
- Course creation and delivery
- Affiliate program management
- Email marketing automations
- Credit/wallet system for AI usage
- Admin dashboard

## User preferences

- App imported from GitHub: https://github.com/bestmarket/Content-Craft
- Deployed on Vercel (static frontend) + Railway (API server)
- Git remote is set to origin → github.com/bestmarket/Content-Craft for push-to-deploy

## Gotchas

- `VITE_PORT` is used in the original repo's vite.config — this workspace uses `PORT` (injected by the artifact system). Keep vite.config.ts using `PORT`.
- API proxy in vite.config targets port 8080 (not 5000 as in original repo)
- Cloudflare R2 not configured in dev — file uploads are unavailable without `R2_*` env vars
- Voice engine artifact (kokoro ONNX model) was excluded — it relies on Git LFS which exceeded budget on the source repo
- Always run `pnpm --filter @workspace/db run push` after schema changes before restarting the API server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- To push changes to GitHub (triggering Vercel redeploy): connect your GitHub account via the Replit integrations panel, then I can use `gitPush` to push
