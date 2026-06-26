---
name: Email Marketing System
description: Full automated email sequence system — architecture, flow, config locations, and integration points
---

## Tables (all in lib/db/src/schema/email-marketing.ts)
- `email_sequences` — sequence metadata, emails (jsonb array), status (active/paused/draft), source (product/automation/manual)
- `email_subscribers` — per-person enrollment, currentEmailIndex, nextSendAt, unsubscribeToken
- `email_sends` — immutable send log with status (sent/failed) and error text

## Flow
1. User runs "Generate All" on a product → `createSequenceFromProduct(productId)` is called (dynamic import in products.ts)
2. Sequence is created/updated as status=active with the 30-day email array stored in emails jsonb
3. Buyer purchases → `fulfillProductOrder()` in checkout.ts calls `subscribeToProductSequence()` + sends receipt via `sendEmail()`
4. Scheduler (every 15min) calls `processAllDueEmails()` — picks subscribers where nextSendAt <= now, sends next email, advances index

## Key integration points
- `artifacts/api-server/src/routes/email-marketing.ts` — all logic + exported functions
- `artifacts/api-server/src/services/email.ts` — SMTP transport, `sendEmail()`, `buildPurchaseReceiptHtml()`
- `artifacts/api-server/src/scheduler.ts` — imports and calls `processAllDueEmails()` at top of every tick
- `artifacts/api-server/src/routes/checkout.ts` — calls `subscribeToProductSequence()` + `sendEmail()` in `fulfillProductOrder()`
- `artifacts/api-server/src/routes/products.ts` — dynamic import of `createSequenceFromProduct()` after generate-all

## SMTP config
- Stored in `settings` table under key `smtp_config` (JSON)
- Falls back to env vars: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM, SMTP_FROM_NAME
- Admin manages via `/admin/email-marketing` → SMTP Config tab

## Admin API routes (all requireAdmin)
- GET  /admin/email/stats
- GET  /admin/email/sequences
- PATCH /admin/email/sequences/:id/status
- GET  /admin/email/subscribers
- GET  /admin/email/sends
- GET/POST /admin/email/smtp
- POST /admin/email/smtp/test

## Unsubscribe
- GET /unsubscribe/:token — sets subscriber status=unsubscribed (no auth required)

**Why:** Buyers need automated nurture sequences without creator manual work; sequences auto-generate from AI content.
