---
name: Revenue Sharing Engine
description: Intelligent dynamic revenue splits applied automatically to every product sale and wallet transaction; admin-configurable per tier
---

# Revenue Sharing Engine

## Architecture
- **DB table**: `revenue_shares` — records every sale's split (gross, creator, platform fee, affiliate amounts + pcts + tier + config snapshot)
- **Config**: stored in `settings` table under key `revenue_config` (JSON)
- **Routes**: `artifacts/api-server/src/routes/revenue.ts` — exports `getRevenueConfig()` and `calculateRevenueSplit()` used by checkout

## Default Splits
- Free tier: 70% creator / 30% platform
- Pro tier: 85% creator / 15% platform
- Enterprise tier: 92% creator / 8% platform
- Affiliate pool: 30% of platform fee → auto-paid to referrer

## How It Works (at checkout)
1. `fulfillProductOrder()` in `checkout.ts` reads live config via `getRevenueConfig()`
2. Looks up seller's `subscriptionTier` and `referredBy`
3. Calls `calculateRevenueSplit()` with gross amount + tier + hasAffiliate flag
4. Credits creator wallet with exact creator share (using `sql\`wallet_balance + ${amount}\``)
5. If affiliate exists: credits affiliate wallet + inserts `affiliate_commissions` record
6. Inserts `revenue_shares` row for analytics
7. All wallet credits use SQL arithmetic (not read-then-write) to avoid race conditions

**Why:** hardcoded 0.9 was replaced so splits are admin-configurable per tier without code changes.

## Admin UI — /admin/revenue
- Overview: KPI cards, revenue distribution (donut %), monthly bar chart, by-tier breakdown
- Config: slider-based tier split editor (creator+platform always = 100%), affiliate pool %, subscription fee %, payout settings
- Transactions: per-sale split breakdown table
- Payouts: withdrawal request management (approve/reject with admin note + manual wallet credit)
- Leaderboard: top creators by earnings

## Validation
- Config save validates that creatorShare + platformFee = 100 for each tier (server-side)
- Config UI sliders enforce the same constraint visually
