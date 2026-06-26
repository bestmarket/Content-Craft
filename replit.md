# Selovox (ViralCraft Studio)

AI-powered digital product and content creation platform — turns any skill or niche into a professional digital product and high-converting storefront in 60 seconds.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — build + run the API server (port 5000, serves built frontend)
- `pnpm --filter @workspace/api-server run build` — build the API server only
- `pnpm --filter @workspace/content-studio run dev` — run the Vite dev server (port 5173, proxies /api to port 5000)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS 4, Radix UI (shadcn/ui), TanStack Query, Wouter, Framer Motion
- API: Express 5, Pino logging, Multer uploads
- DB: PostgreSQL + Drizzle ORM
- Voice Engine: Python FastAPI + Kokoro ONNX TTS (port 8099)
- Validation: Zod, drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/api-server/src/` — Express backend
  - `routes/` — all API routes
  - `lib/scryvox/` — AI content generation engine
  - `lib/r2Storage.ts` — Cloudflare R2 file uploads
  - `services/email.ts` — SMTP email service
  - `seed.ts` — admin user + default data seeding
  - `scheduler.ts` — automation scheduler
- `artifacts/content-studio/src/` — React frontend
- `artifacts/voice-engine/` — Python TTS service
- `lib/db/src/schema/` — Drizzle database schema (source of truth)
- `lib/api-spec/` — OpenAPI 3.1 spec (source of truth for API contracts)
- `lib/api-client-react/` — generated React hooks (do not edit manually)
- `lib/api-zod/` — generated Zod schemas (do not edit manually)
- `public/` — built frontend assets (served by Express in production)

## Architecture decisions

- The API server serves the built frontend statically in production; in dev it proxies to Vite on port 5173.
- AI keys (Gemini, OpenAI, Anthropic, Groq) are stored in the DB `api_keys` table (admin panel → API Keys) with round-robin rotation. Falls back to env vars `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.
- Auth is custom JWT/bcrypt — no external auth provider. Admin credentials seeded from `ADMIN_PASSWORD` env var.
- File uploads go to Cloudflare R2 (optional) — requires `CLOUDFLARE_R2_*` env vars. Falls back gracefully if not configured.
- Google OAuth login requires `GOOGLE_CLIENT_ID` env var. Optional feature.
- SMTP email requires `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT` env vars. Optional feature.

## Product

- **Digital Product Creator**: AI-generates premium PDFs, guides, scripts via Scryvox engine
- **Marketing Suite**: Viral thumbnails, video scripts, landing pages
- **SaaS Builder**: AI Dev Studio workspace IDE for building mini-SaaS apps
- **Store & Checkout**: Product listings, custom offers, checkout flows
- **Affiliate Portal**: Affiliate program management and withdrawals
- **Voice Engine**: Text-to-speech with Kokoro ONNX (port 8099)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing DB schema, always run `pnpm --filter @workspace/db run push` to apply changes.
- After changing API routes or OpenAPI spec, run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks.
- The `public/` folder is the built frontend — run `pnpm --filter @workspace/content-studio run build` to update it.
- Voice Engine installs Python deps on startup (see `.replit` workflow). First start may be slow.
- AI image generation falls back to Pollinations.ai (free, URL-based) if no Gemini key is configured.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
