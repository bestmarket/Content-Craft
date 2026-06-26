---
name: Product approval flow
description: How the publish/approval flow works and what the generate-all endpoint does
---

## Publish flow (pending_approval)
- `POST /products/:id/publish` now sets `publishStatus = "pending_approval"` and leaves `isPublished = false`
- Admin approves via `PATCH /admin/products/:id/approve` → sets `isPublished = true`, `publishStatus = "published"`
- Frontend shows "Submit for Review" instead of "Publish & Sell"; toast shows pending message
- my-store.tsx groups products into: Published / Under Review (pending_approval) / Drafts

## generate-all endpoint
- `POST /products/:id/generate-all` runs 3 AI calls in parallel: landing page + 30-day email sequence + marketing assets
- Saves all three to DB: `landingPage`, `emailSequence30Days`, `marketingAssets`
- Frontend button: amber "⚡ Generate All Assets" banner shown when none of the 3 exist yet

**Why:** Users launching tonight need one-click asset generation — separate buttons were too many steps.

## Admin products panel
- Route: `/admin/products` — admin-only
- Router: `artifacts/api-server/src/routes/admin-products.ts`
- Frontend: `artifacts/content-studio/src/pages/admin/products.tsx`
- Endpoints: overview stats, list (filterable by status), approve, reject, feature, disable
