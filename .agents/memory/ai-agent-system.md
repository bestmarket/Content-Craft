---
name: AI Agent System
description: Embeddable AI chatbot widget system — DB tables, routes, embed JS, buyer dashboard, deploy flow
---

## Architecture

- **DB tables**: `ai_agents`, `agent_conversations` in `lib/db/src/schema/ai-agents.ts`
- **Backend routes**: `artifacts/api-server/src/routes/ai-agents.ts`
- **Frontend page**: `artifacts/content-studio/src/pages/my-agents.tsx` at `/my-agents`
- **Embed widget JS**: served at `GET /api/ai-agents/embed/:agentKey.js`
- **Chat API**: `POST /api/ai-agents/public/:agentKey/chat` (no auth, CORS open)
- **Deploy from template**: `POST /api/ai-agents/deploy/:templateId` (auth required)
- **Sidebar nav**: added "🤖 My AI Agents" under Marketplace group in AppLayout
- **Template generator**: "Deploy Live AI Agent" button appears for `type === "ai_agent"` completed templates

## Critical Express 5 / path-to-regexp v8 Rules

**Why:** path-to-regexp v8 (used by Express 5 via router@2.2.0) throws `PathError: Unexpected (` if you use inline regex patterns.

**How to apply:**
- NEVER write `/:id(\\d+)` — use `/:id` and validate with `parseInt(id); if (isNaN(id)) return 400`
- Public routes (`/public/:key`, `/embed/:key.js`) MUST be registered BEFORE the `/:id` catch-all routes, or they'll be swallowed by the authenticated catch-all

## Flow

1. Creator generates an `ai_agent` template in the template generator
2. When generation completes, "Deploy Live AI Agent" button appears (only for ai_agent type)
3. Clicking it calls `POST /api/ai-agents/deploy/:templateId` — creates an `ai_agents` row with the system prompt from `templateContent.systemPrompt`
4. Creator goes to `/my-agents` — sees the agent card with embed code
5. Embed code: `<script src="https://site.com/api/ai-agents/embed/AGENTKEY.js"></script>`
6. Widget self-initializes: fetches config, renders chat bubble, handles conversations, captures leads

## Lead capture flow

- If `collectLeads=true`, widget shows name/email form before chat
- On first message in a session, creates `agent_conversations` row; increments `totalConversations`
- If `visitorEmail` was provided and it's a new session, increments `totalLeads`
