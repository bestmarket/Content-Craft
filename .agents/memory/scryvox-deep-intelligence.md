---
name: Scryvox Deep Intelligence Layer
description: Internal cognitive core that powers all Scryvox engines from within — never a standalone tool. Architecture decisions and integration points.
---

## What it is
`artifacts/api-server/src/lib/scryvox/deep-intelligence.ts` — a fully deterministic, API-free cognitive engine that intellectually refines raw user input and injects deep thinking, reasoning, wisdom, and knowledge into every downstream engine.

## Core export
`applyDeepIntelligence(topic: string, variation: number): DeepFrame`

Returns a `DeepFrame` with:
- `intellectualReframe` — elevated restatement of the topic (never echoes word-for-word)
- `philosophicalRoot` — the domain's philosophical underpinning
- `firstPrinciplesBreakdown[]` — domain-specific first principles (5 per domain)
- `systemsThinkingLens` — systems view of the topic
- `paradoxAtCore` — the central counterintuitive truth
- `rootCauseStatement` — why conventional approaches fail
- `thinkingFrameworks[]` — 4 frameworks (Systems Thinking, Inversion, 2nd Order, etc.)
- `wisdomPrinciples[]` — 3 wisdom principles (Stoic, Taoist, Socratic, etc.)
- `reasoningChain[]` — 5-step reasoning from surface → transcendent
- `pdfStructureHints` — callouts, thesis, chapter logic for PDF engine
- `landingPageIntelligence` — desire/fear/objections/transformation arc
- `researchDepthLayer` — JTBD, market gap, hidden desire, belief to shift
- `sellabilityDepthLayer` — emotional triggers, objection matrix, urgency truth

## Domain detection
Automatic via keyword matching: mindset / productivity / finance / business / health / relationships / career / creativity / technology / education / default

## Where it's integrated (all internal, not standalone)
1. **builder.ts** — called in `buildContent()`; refines PDF title via `intellectualReframe`; injects first principles + paradox into insight sections; injects wisdom into action sections; replaces PDF callouts with `pdfStructureHints.deepDiveCallouts`
2. **engines/research.ts** — called in `runResearchEngine()`; powers `topicOverview` and `researchSummary`; adds `researchDepthLayer` fields to uniqueAngles + keyStatements
3. **engines/sellability.ts** — called in `runSellabilityEngine()`; powers `improvedUVP`, `competitivePositioning`, urgency elements, social proof type
4. **engines/landing-page.ts** — called internally; drives every section (hero, problem, insight, solution, FAQ, CTA) from first principles
5. **routes/scryvox.ts** — called in `/scryvox/generate`; returns `intelligence` object alongside output containing refinedTopic, paradox, deepQuestion, reasoningChain, cognitiveDepth
6. **routes/scryvox-product.ts** — called in `landing_page` stage; stores `deepIntelligenceData` in DB alongside `landingPageData`

## Why: design principle
Scryvox should never echo the user's input word-for-word. Every topic enters the engine as a raw question and exits having been intellectually elevated through first principles, systems thinking, and wisdom frameworks. The user submits "mindset" — the engine understands the identity-behavior loop, the Socratic examined life, and the systems view before writing a single word.

## Pipeline stage addition
`landing_page` was added to STAGES before `complete`: `["research","architect","content","critic","sellability","marketing","landing_page","complete"]`
DB columns added: `landing_page_data jsonb`, `deep_intelligence_data jsonb` in `scryvox_products` table (pushed via `pnpm --filter @workspace/db run push`).
