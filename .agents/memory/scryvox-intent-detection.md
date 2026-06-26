---
name: Scryvox Intent Detection
description: How the Scryvox engine detects user intent (practical vs philosophical) and routes to appropriate content — added to fix philosophical bias for how-to topics.
---

## The Problem It Solves
Before this upgrade, all topics were reframed philosophically regardless of intent. "How to make $2,000/month" produced chapters like "The Money Story — Uncovering the Beliefs Running Your Financial Life" instead of practical income methods.

## Architecture

### IntentFrame (deep-intelligence.ts)
Added to `DeepFrame`. Populated by `detectIntent(topic)`:
- `type`: `"practical_howto" | "conceptual_understanding" | "philosophical_exploration"`
- `contentRatio`: `{ practical: 75, mindset: 25 }` for practical topics
- `specificMethods`: concrete method names (freelancing, digital products, etc.)
- `validationQuestion`: "Does every section directly help the reader achieve X?"
- `exampleScenario`: specific outcome narrative

### Intent Detection Signals (HOWTO_SIGNALS)
Regex array in `deep-intelligence.ts`. Key practical patterns:
- `/\bhow (to|do|can|should)\b/i`
- `/\bmake (\$|money|income)\b/i`
- `/\$\d/` — dollar amounts
- `/\bper (month|week|day|year)\b/i`
- `/\bearn(ing)?\b/i`
- `/\bside hustle\b/i`

### Income Domain
Added `income` domain to both `expander.ts` DOMAIN_CLUSTERS and `architect.ts` DOMAIN_CHAPTER_CLUSTERS. Income detection runs FIRST in domain checks (before finance) in both files:
- expander.ts: multi-word keyword matching ("make $", "per month")
- deep-intelligence.ts: explicit income signals + `/make \$|earn \$|\$\d+/` regex

### Architect Chapter Routing (architect.ts)
`getChapterClusters(domain, topic?)` — takes optional `topic` for intent-based override:
- Income signals → `DOMAIN_CHAPTER_CLUSTERS.income` (10 action-focused chapters)
- Passes `topic` from `runArchitectEngine()` call

### Research Engine (research.ts)
`isPractical = deepFrame.intentFrame.type === "practical_howto"`:
- `topicOverview`: practical topics get `"Desired outcome: X"` prefix (used as isPractical signal by content.ts)
- `researchSummary`: practical = action-ready audience framing
- `keyStatements`: practical = specificMethods + exampleScenario instead of wisdomLayer

### Content Engine (content.ts)
`isPractical = research.topicOverview.includes("Desired outcome:")`:
- `buildOverview()`: practical = "specific actionable steps, no abstract theory"
- `buildStoryExample()`: practical = named characters (Marcus, Priya, James) with specific dollar amounts and timelines
- `buildPracticalApplication()`: practical = 4-step format (Decide/Setup/Get in front of 10 people/Measure)

## Test Results
For "How to make $2,000 per month":
- intentType: practical_howto ✅
- targetAmount: $2,000 per month ✅
- Expander domain: income (score 2 vs 0 finance) ✅
- Deep-intelligence domain: income ✅
- Chapters: "Freelancing: Land Your First Paying Client Within 7 Days" (not "The Money Story") ✅

**Why:** The philosophical bias was baked into 4 layers simultaneously. The fix adds an intent layer that threads through all downstream engines rather than patching each one independently.
