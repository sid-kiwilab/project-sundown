# Vercel deploy (Sundown web)

**Project Settings → Build & Deployment**

| Setting | Required value |
|---------|----------------|
| Root Directory | `apps/web` |
| Framework Preset | **Next.js** |
| Build Command | empty (use [`apps/web/vercel.json`](../apps/web/vercel.json): `npm run build`) |
| Output Directory | **empty** — clear any override |
| Install Command | empty (vercel.json: `cd ../.. && npm install`) |
| Include files outside the Root Directory | **Enabled** |

**Environment variables** (Production + Preview): same as [`.env.example`](../.env.example) — at minimum `OPENROUTER_API_KEY` or OpenAI/Anthropic for Tier 2, optional `GITHUB_TOKEN`.

If build still fails on `export-detail.json`, the preset is almost always **not** Next.js or Output Directory was overridden.