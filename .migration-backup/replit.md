# ViralCraft Studio

AI-powered content creation platform for generating viral scripts, thumbnails, PDFs, and video models for YouTube, TikTok, Instagram, Facebook, and Twitter.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/content-studio run dev` — run the frontend (Vite, port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (content-studio)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), stored in localStorage key "token"
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/content-studio/` — React+Vite frontend
- `artifacts/api-server/` — Express 5 API server
- `lib/db/src/schema/index.ts` — DB schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated hooks and schemas (do not edit)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas
- JWT in localStorage: `setAuthTokenGetter` wired in `main.tsx` so generated hooks auto-attach the token
- AI routing: tries Claude first (provider "anthropic"), falls back to OpenAI ("openai"), graceful placeholder if neither configured
- Admin role stored in JWT payload and enforced via `requireAdmin` middleware
- All settings/features/prompts managed via DB — no hardcoded config

## Product

- **User features**: Dashboard stats, content generation (scripts + titles for 5 platforms), thumbnail generator, PDF studio, video modeler, content history, support chat, AI chatbot widget
- **Admin panel**: User management, prompt library, API key management (Claude/OpenAI/Stripe/PayPal), payment gateways, feature flags, settings, support chat console, content moderation

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Seeding DB: pg and bcryptjs are in the pnpm `.pnpm` store; use absolute paths like `/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg`
- `ListPromptsType` is a const enum — must cast string to `ListPromptsType` when filtering prompts
- `useGetRecentContent` params: first arg is `params` (optional), second is query options
- `PaymentGatewayInput.config` is `string` (JSON-stringified) not `Record<string, string>`
- Admin login: `admin@viralcraft.com` / `admin123`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
