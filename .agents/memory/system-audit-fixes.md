---
name: System audit fixes
description: All 6 critical end-to-end gaps patched in the product monetization flow
---

# System Audit Fixes

## Gaps closed

### 1. coverImageUrl missing from DB schema
- Added `coverImageUrl` (text, nullable) column to `productsTable` in `lib/db/src/schema/products.ts`
- Also added `landingPageData` and `deepIntelligenceData` columns (same migration)
- **Command**: `pnpm --filter @workspace/db run push` (or `push-force` to skip prompt)

### 2. coverImageUrl saved on product creation
- `POST /products/create` now saves `coverImageUrl: imageUrl` in the DB insert
- Response uses `saved.coverImageUrl ?? imageUrl` as fallback

### 3. Store endpoint returns coverImageUrl
- `GET /store/:username` select now includes `coverImageUrl: productsTable.coverImageUrl`
- `store-public.tsx` renders `<img>` if present, purple gradient fallback otherwise
- Store card uses `overflow-hidden` + `<div className="p-5">` wrapper for image + content layout

### 4. Public page handles unpublished products gracefully
- `GET /product/:id/public` no longer filters by `isPublished=true`
- Unpublished products return `{ previewMode: true, isPendingReview, publishStatus, ... }`
- `product-public.tsx` renders "Under Review" (amber) or "Coming Soon" (purple) page with cover image

### 5. Download endpoint added
- `GET /product/:id/download/:orderId` verifies `orders.status = "completed"`, generates full HTML with all chapters, quickStart, checklist, FAQ, authorBio
- Sets `Content-Disposition: attachment` — browser downloads as `.html` file
- Receipt banner included in the HTML with order ID and buyer email

### 6. Checkout fallback + download button
- `CheckoutSection` now catches "No payment gateway" 400 error and falls back to `POST /product/:id/purchase` (direct purchase)
- `downloadUrl` stored in state; on success shows green "Download Your Product" button instead of "check your email" message
- Without gateway, purchase completes immediately and buyer can download directly

### 7. Backend free-tier product creation limit
- `POST /products/create` now enforces 3 products/day for free users server-side
- Returns HTTP 429 with clear upgrade message if limit reached
- Pro/business tier users bypass the check
- Uses `gte` + `sql\`count(*)\`` on `productsTable` filtered by `userId` + `createdAt >= today`

## Why
These gaps meant the system looked complete but had broken user flows — buyers couldn't download after purchase, store showed no images, share links returned 404 for unpublished products, and free users could bypass daily limits by calling the API directly.

## How to apply
- Always include `coverImageUrl` in any new store/listing endpoint select
- For new creation flows, save cover image URL to DB at insert time (not just return in response)
- The download URL format is `/api/product/:id/download/:orderId` — keep this stable
