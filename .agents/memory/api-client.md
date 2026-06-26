---
name: API Client Pattern
description: Two different API client patterns coexist in this project — use the right one
---

# API Client Patterns

## Generated hooks (existing pages)
Use `@workspace/api-client-react` — auto-generated hooks like `useGeneratePdf`, `useListPdfHistory`.
These are built from the OpenAPI spec in lib/api-spec.

## Manual fetch client (new pages)
New pages that hit custom endpoints use `@/lib/api.ts` — a simple fetch wrapper:
```ts
import { apiClient } from "@/lib/api";
apiClient.get("/products")
apiClient.post("/products/create", { topic, authorName })
```
Reads token from localStorage, prepends BASE_URL + "/api".

**Why:** The generated hooks only cover routes defined in the OpenAPI spec. New routes (products, wallet, trending, store) are not in the spec, so manual fetch is needed.
