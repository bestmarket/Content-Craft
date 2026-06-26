---
name: SaaS Builder
description: AI SaaS Subscription Builder — creator describes niche, AI builds full web app + tiers + marketing playbook, creator publishes subscription page
---

## Tables
- `saas_apps` — creatorId, name, niche, deploySlug (unique), status (draft/live), brandColor, appHtml, tiers (jsonb), landingPage (jsonb), marketingPlan (jsonb), generationStatus (idle/generating/complete/failed), totalRevenue, subscriberCount
- `saas_subscriptions` — appId, subscriberEmail, tierId, billingPeriod (monthly/annual/lifetime), price, status, accessToken

## API Routes (`artifacts/api-server/src/routes/saas-builder.ts`)
- Creator (auth): POST /saas/apps (starts async generation, returns id immediately), GET/PUT/DELETE /saas/apps/:id, POST /saas/apps/:id/publish, POST /saas/apps/:id/unpublish, POST /saas/apps/:id/regenerate, GET /saas/apps/:id/subscribers
- Public (no auth): GET /saas/public/:slug, POST /saas/public/:slug/subscribe, GET /saas/public/:slug/access/:token

## AI Generation
- Single Gemini call, 65536 token output, async after returning draft id
- Returns: appName, tagline, appDescription, appHtml (complete single-file HTML tool), tiers[], landingPage{headline/subheadline/features/testimonials/faq/cta}, marketingPlan{youtubeIdeas/tiktokIdeas/instagramTheme/hooks/launchChecklist/targetAudience/painPoints/uniqueAngle}
- Uses callGeminiFallback(messages, SYSTEM, 65536, "workspace")

## Subscription / Revenue
- Free tier (priceMonthly=0) → instant access, no wallet credit
- Paid tier → insert subscription, increment subscriberCount + totalRevenue on saas_apps, credit creator 80% cut to walletTransactionsTable

## Access
- Subscribe returns accessToken + accessUrl = `/saas/:slug/app?token=<token>`
- GET /saas/public/:slug/access/:token validates and returns appHtml + appName + brandColor

## Frontend Pages
- `/saas-builder` — hub with stats grid + app cards (saas-builder.tsx)
- `/saas-builder/new` — 3-step wizard: Describe → Generating → Done (saas-builder-new.tsx)
- `/saas-builder/:id` — creator dashboard: tabs for Overview/Marketing/Subscribers/Edit (saas-builder-ide.tsx)
- `/saas/:slug` — public subscription landing page with tiers, testimonials, FAQ, subscribe modal (saas-public.tsx)
- `/saas/:slug/app` — gated tool page, validates token then writes appHtml into iframe sandbox (saas-app.tsx)

## Nav
- Added "🚀 SaaS Builder" under "🧑‍💻 AI Dev Studio" group in AppLayout.tsx

**Why:** Generation is async — POST returns draft id immediately, background goroutine does the heavy AI work. Frontend polls every 3s when generationStatus==="generating".
