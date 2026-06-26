# Deploy ViralCraft Studio to Vercel

Follow these steps in order. It takes about 15 minutes.

---

## Step 1 — Get a free Neon database

The Replit database can't be reached from Vercel, so you need an external one.

1. Go to **[neon.tech](https://neon.tech)** and sign up for free
2. Click **"New Project"** → give it a name like `viralcraft`
3. Once created, click **"Connect"** → copy the **Connection string** (starts with `postgresql://...`)
4. Save it somewhere — you'll paste it into Vercel shortly

---

## Step 2 — Push your code to GitHub

Vercel deploys from GitHub. Make sure all changes are pushed to your repo.

---

## Step 3 — Configure Vercel Project Settings

> **IMPORTANT:** Vercel dashboard settings override `vercel.json`. You must set these exactly.

In Vercel → your project → **Settings → Build & Output Settings**:

| Setting | Value |
|---|---|
| **Framework Preset** | `Other` |
| **Build Command** | _(leave blank — uses vercel.json)_ |
| **Output Directory** | `public` |
| **Install Command** | _(leave blank — auto-detected)_ |
| **Root Directory** | _(leave blank — project root)_ |

Click **Save** after changing these, then redeploy.

---

## Step 4 — Environment Variables

In Vercel → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | your Neon connection string from Step 1 |
| `SESSION_SECRET` | any long random string (32+ chars) |
| `NODE_ENV` | `production` |
| `APP_URL` | `https://YOUR-PROJECT.vercel.app` (fill in after first deploy) |
| `ADMIN_PASSWORD` | password for admin login |
| `GEMINI_API_KEY` | your Gemini API key (for AI features) |

---

## Step 5 — Deploy

Click **Deploy**. The build runs:
1. Builds the Express API → `artifacts/api-server/dist/app.mjs`
2. Builds the React frontend → `public/` (workspace root)
3. Vercel serves `public/` as static files
4. Vercel runs `api/index.js` as a serverless function for all `/api/*` routes

---

## Step 6 — Run database migrations

After the first deploy, push the schema to your Neon database:

```bash
DATABASE_URL="your-neon-connection-string" pnpm --filter @workspace/db run push
```

Then seed the admin user:

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"viralcraft-seed-secret"}'
```

---

## Step 7 — Log in

Visit your Vercel URL and log in with:
- **Email**: `admin@selovox.com`
- **Password**: value of your `ADMIN_PASSWORD` env var

---

## Build output explained

```
project root/
├── public/              ← Vite builds HERE (outputDirectory)
│   ├── index.html
│   └── assets/
├── api/
│   └── index.js         ← Vercel serverless function entry
├── artifacts/
│   └── api-server/
│       └── dist/
│           └── app.mjs  ← Express app (imported by api/index.js)
└── vercel.json          ← routing + build config
```

---

## Voice Engine (optional)

The voice/audio engine needs persistent compute — Vercel's serverless functions time out too quickly. Options:

- **Keep it on Replit**: The voice engine runs here. Set env var `VOICE_ENGINE_URL=https://YOUR-REPL.replit.dev:8099` in Vercel
- **Railway**: Deploy `artifacts/voice-engine/` as a separate service on [railway.app](https://railway.app)
