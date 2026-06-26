---
name: Scryvox Product Pipeline
description: 6-engine product creation pipeline + internal knowledge base — all API-free, all algorithmic
---

## Architecture
- Pipeline stages: research → architect → content → critic → sellability → marketing → complete
- Each stage is triggered by user clicking "Run [Stage] Engine" in the product wizard UI
- Stage outputs saved to scryvox_products table as JSONB columns (researchData, architectData, etc.)
- Stage progression: product.stage tracks current stage; POST /api/scryvox/products/:id/next runs next stage

## Engine files (all in artifacts/api-server/src/lib/scryvox/engines/)
- research.ts — topic overview, audience profile, 10 FAQs with substantive answers, 4 frameworks, market insights, unique angles
- architect.ts — product title alternatives, 8-10 chapter ToC with subtitles/word targets, UVP, positioning, promise
- content.ts — writes all chapters using Scryvox builder; each chapter has hook/overview/sections/story/practice/action steps/key insight
- critic.ts — scores product on 4 dimensions (0-100), finds weaknesses with severity + specific fix, missing elements, readiness flag
- sellability.ts — revised title/subtitle, 3-tier pricing recommendation, 5 bonus ideas, urgency elements, social proof opportunities
- marketing.ts — full sales page, 3-email sequence, 5 social posts, 3 ad copy variants, YouTube video idea, landing page sections
- knowledge.ts — DB-backed knowledge store: queryKnowledge(), addKnowledgeItem(), incrementUsage(), seedSystemKnowledge()

## DB tables
- scryvox_products: id, userId, title, topic, stage, style, tone, variation, researchData/architectData/contentData/criticData/sellabilityData/marketingData (all jsonb), timestamps
- scryvox_knowledge: id, type (framework/template/structure/formula/pattern), title, description, content (jsonb), tags, domain, isSystem, createdBy, usageCount

## Routes
- POST /api/scryvox/products — creates product, auto-runs research engine
- GET /api/scryvox/products — list user's products
- GET /api/scryvox/products/:id — get single product
- POST /api/scryvox/products/:id/next — run next pipeline stage
- DELETE /api/scryvox/products/:id — delete product
- GET /api/scryvox/knowledge — list all knowledge items
- POST /api/scryvox/knowledge — add item (admin only)
- DELETE /api/scryvox/knowledge/:id — delete (admin only)
- POST /api/scryvox/knowledge/seed — seed 8 system knowledge items (admin only)

## Frontend pages
- /scryvox/products — product list with stage badges, progress bars, continue buttons
- /scryvox/products/new — new product form (topic input)
- /scryvox/products/:id — full pipeline wizard: stage stepper + accordion outputs + sticky "Run Next Stage" button
- /admin/scryvox/knowledge — admin knowledge base with seed button, type filters, add form, delete

## Internal Knowledge Base
- 8 system items seeded on first use: Identity→Behavior→Results Loop, 80/20 Principle, Problem-Pain-Solution Arc, 9-Chapter Structure, Subject Line Formulas, Quick Win Pattern, Before/After/Bridge, Bullet Point AIDA Formula
- Knowledge Engine queries by keyword match on title/description/domain
- Future: auto-save patterns from completed products to knowledge base (flywheel effect)

**Why:** All algorithmic, no external AI calls. Fast (<100ms per stage except content which runs multiple builder calls). Each engine uses domain-specific templates + the expander for topic-aware output.
