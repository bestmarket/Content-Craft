---
name: Scryvox Engine
description: API-free human writing engine built into the platform — architecture, file locations, and admin settings pattern.
---

# Scryvox Engine

**Why:** Built to compete with ChatGPT/Claude/Gemini for content generation without any API keys or costs. Algorithm-only, runs on the server.

## File Structure (all under `artifacts/api-server/src/lib/scryvox/`)
- `vocabulary.ts` — all vocabulary banks: HOOKS (8 styles × 15-20 each), TRANSITIONS, EMOTIONAL_WORDS, POWER_PHRASES, HUMAN_MARKERS, CLOSINGS, etc.
- `styles.ts` — 12 WritingStyle + 8 WritingTone profiles + LENGTH_CONFIG (micro/short/medium/long/epic)
- `expander.ts` — 12-domain knowledge graph; `expandTopic(topic, variation)` returns rich TopicExpansion (subtopics, mistakes, contrarian angles, surprising truths, etc.)
- `builder.ts` — core assembly; `buildContent(input, expansion)` returns ScryvoxOutput with markdown/plainText/youtubeScript/twitterThread/pdfMarkdown
- `humanizer.ts` — post-processor: contractions, em-dashes, parentheticals, fragments, AI-pattern removal
- `index.ts` — exports `generate(input)`, `getStyleOptions()`, `getToneOptions()`, `getLengthOptions()`

## API Routes (`artifacts/api-server/src/routes/scryvox.ts`)
- `GET /api/scryvox/options` — authenticated; returns all style/tone/length/audience options
- `POST /api/scryvox/generate` — authenticated; body: `{topic, style, tone, length, audience, variation}`
- `GET /api/scryvox/settings` — admin only
- `PUT /api/scryvox/settings` — admin only

## Admin Settings (stored in settingsTable)
- `scryvox_enabled`: "true"/"false"
- `scryvox_mode`: "studio_only" | "all_system" | "none"
- `scryvox_default_style`: WritingStyle
- `scryvox_default_tone`: WritingTone
- `scryvox_default_length`: ContentLength

## UI
- User Writer Studio: `/scryvox` (ScryvoxStudio page)
- Admin Config: `/admin/scryvox` (AdminScryvox page)
- Sidebar nav: "✍️ Scryvox Writer" under Tools group in AppLayout
- Admin nav: "Scryvox Engine" with Brain icon in AdminLayout

## How It Works (beyond what user typed)
- `expandTopic()` detects domain from keywords → pulls rich knowledge cluster (mistakes, contrarian angles, surprising truths, emotional needs, power questions, action insights)
- 5 variations use deterministic SeededRandom seeded by `variation * 9973 + topic.length * 31 + style.length * 7`
- `humanize()` post-processes: applies contractions at `contractionRate`, injects em-dashes, parentheticals, fragments at appropriate intensity levels
- Viral score computed from style, tone, question count, em-dashes, pull quotes (max 100)
- Human score penalizes AI-pattern phrases, rewards contractions + em-dashes + fragments

**How to apply:** When extending Scryvox, add vocabulary to vocabulary.ts and knowledge clusters to expander.ts. The builder.ts section builders are independently extensible.
