---
name: ViralCraft Platform Architecture
description: Full AI digital product creation + selling + monetization flow and how all pieces connect
---

# Platform Architecture

## Full Flow
PDF Product → Landing Page → Store → Checkout → Wallet → Payout → Viral Campaign → Growth Loop

## Key Routes (Backend)
- POST /products/create — AI generates full PDF product with sellability score
- POST /products/:id/generate-landing-page — AI landing page copy
- POST /products/:id/generate-campaign — Full viral campaign (TikTok×3, YT Shorts×2, YT Long, Twitter, Facebook, Instagram)
- POST /products/:id/publish — Publishes to /store/:username
- GET /store/:username — Public store (no auth)
- GET /product/:id/public — Public product page (no auth)
- POST /product/:id/purchase — Simulated checkout, credits seller wallet
- GET /wallet/balance, POST /wallet/withdraw — Wallet management
- GET /trending/ideas — AI-generated trending opportunities (1hr cache)
- POST /subscriptions/start-trial, /upgrade — 2-day trial + $29/mo pro

## Key Frontend Routes
- /create-product — Main product builder (all-in-one: PDF + landing + campaign + publish)
- /my-store — Store management + username setup
- /earnings — Wallet + analytics + withdrawal
- /trending — Trending opportunities dashboard
- /store/:username — Public store (no auth, dark theme)
- /product/:id — Public product page (no auth, full landing page)

## Revenue Model
- Platform takes 10% of each sale (seller gets 90%)
- Minimum withdrawal: $50
- Pro plan: $29/month, 2-day free trial

**Why:** Everything must be connected end-to-end — product creation is useless without a store, store is useless without marketing, marketing is useless without analytics.
