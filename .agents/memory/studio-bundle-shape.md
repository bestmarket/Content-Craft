---
name: studioBundle shape
description: The /generate route wraps PromptBundle inside studioBundle.bundle — all DB-reading routes must unwrap it correctly.
---

# studioBundle nesting rule

The `/generate` endpoint saves `studioBundle` (an object with `_studio: true, _v: 3, params, bundle, salesPage, emailSequence, socialPosts, marketingKit`) as `product.description` (JSON string).

The inner `PromptBundle` — which holds `qualityScore`, `sellabilityScore`, `packageTitle`, `categories`, etc. — is **one level deeper**, at `studioBundle.bundle`.

**Rule:** Every route that reads `product.description` and needs the flat PromptBundle must do:
```typescript
const parsed = JSON.parse(product.description ?? "{}");
const bundle = (parsed.bundle ?? parsed) as PromptBundle;
```

**Why:** Older products saved a raw `PromptBundle` directly. New studio-generated ones wrap it. The `?? parsed` fallback handles both shapes safely.

**Where this already applies (as of June 2026):**
- GET `/prompt-packages/:id` — correctly unwraps via spread
- GET `/prompt-packages/:id/preview` — uses `parsed.bundle ?? parsed`
- GET `/prompt-packages/:id/download` — fixed to use `_parsed.bundle ?? _parsed`
- POST `/prompt-packages/:id/publish` — fixed to use `parsed.bundle ?? parsed`

**What lives at top level of studioBundle (not inside .bundle):**
- `marketingKit` — FB ads, TikTok, YouTube, Twitter, selling guide data
- `salesPage`, `emailSequence`, `socialPosts`
- `params` — the original generation params
- `_studio`, `_v`
