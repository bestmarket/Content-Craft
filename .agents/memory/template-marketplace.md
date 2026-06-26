---
name: Template Generators + Marketplace
description: 4 AI generator types, template_products table, global marketplace, admin controls
---

## What was built

**DB**: `template_products` table — type enum (ai_agent/n8n_workflow/replit_template/chrome_extension), all generation fields, marketplace flags, sales/revenue tracking.

**Backend routes**:
- `artifacts/api-server/src/routes/templates.ts` — ideas, generate (async), status poll, publish-store, publish-marketplace, delete
- `artifacts/api-server/src/routes/marketplace.ts` — listings, featured, stats, categories, template/:id
- `artifacts/api-server/src/routes/admin-templates.ts` — approve, reject, feature, toggle-marketplace, delete

**Frontend**:
- `/marketplace` — public global marketplace (no auth required); categories, search, sort, featured section
- `/automations/generators` — generators hub (premium-only)
- `/automations/generators/:type` — individual generator with ideas panel, topic input, price selector, polling, 3-tab results (template/landing/marketing)
- `/admin/templates` — approve/reject/feature/delete with stats

**Generation flow**: POST /templates/generate → returns {id} immediately → frontend polls /templates/:id/status every 3s → on "complete" fetches full record. Three parallel AI calls: template content + landing page + marketing assets. Cover image = placeholder (can upgrade to DALL-E).

**Key decisions**:
- Marketplace at `/marketplace` is PUBLIC (no auth) — anyone can browse and buy
- Generators at `/automations/generators` are PREMIUM-GATED (pro/enterprise/admin only)
- Publish to marketplace sets publishStatus="pending_approval" — requires admin approve
- Admin can force-publish via toggle-marketplace endpoint
- Ideas are hardcoded curated lists (12 per type) — no AI call needed for ideas

**Nav wiring**:
- AppLayout: "Marketplace" group added at top with Global Marketplace + Template Generators
- AdminLayout: "Template Marketplace" link added at bottom
- Dashboard: marketplace banner added below ad banner
- Automations: generators banner added between header and stats
