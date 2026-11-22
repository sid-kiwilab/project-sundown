# Vercel deploy (Sundown web)

**Project Settings → Build & Deployment**

| Setting | Required value |
|---------|----------------|
| Root Directory | `apps/web` |
| Framework Preset | **Next.js** |
| Build Command | **empty in dashboard** — [`apps/web/vercel.json`](../apps/web/vercel.json) sets `npm run build` only; do **not** also override in the UI |
| Output Directory | **empty** — clear any override |
| Install Command | empty (vercel.json: `cd ../.. && npm install`) |
| Include files outside the Root Directory | **Enabled** |

**Environment variables** (Production + Preview): same as [`.env.example`](../.env.example) — at minimum `OPENROUTER_API_KEY` or OpenAI/Anthropic for Tier 2, optional `GITHUB_TOKEN`.

If build fails on `export-detail.json`, Framework is not **Next.js** or Output Directory was overridden. If you see `reading 'cwd'`, clear duplicate Build Command overrides (dashboard + vercel.json fighting each other) and redeploy.