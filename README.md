# Sundown

**Expiry-date audit for your whole repo** — models, APIs, packages, runtimes, SaaS.

Origin: OpenAI’s **gpt-image-2** deprecation notice sat in docs for weeks unnoticed. Point Sundown at a repo and it flags what is already on borrowed time — with sources, not guesswork.

![CLI report for gpt-image-2 deprecation](docs/assets/cli-report.svg)

Repo: [sid-kiwilab/project-sundown](https://github.com/sid-kiwilab/project-sundown) — full spec in [docs/LIVE.md](docs/LIVE.md).

```bash
git clone https://github.com/sid-kiwilab/project-sundown.git
cd project-sundown
npm install
cp .env.example .env          # optional: OPENROUTER_API_KEY for Tier 2 model notices
npm run build:engine && npm run build:cli
npm run sundown -- .          # private/local path — reads repo-root .env for Tier 2
npm run dev                   # or start.bat (Windows) → http://localhost:3000
npm test
```

**Web:** paste a **public** `https://github.com/owner/repo` URL on the landing page.

**npm:** `npx sundown-cli` is not published yet — use `npm run sundown --` from this repo until release.

Reports show **checked N of M** — “checked” means we queried a named source for that row (no notice on that page still counts). API host rows stay unchecked.

## Deploy on Vercel

1. Import this GitHub repo; set **Root Directory** to **`apps/web`** (uses [`apps/web/vercel.json`](apps/web/vercel.json) — install runs from the monorepo root for workspaces).
2. Set **environment variables** (same as `.env.example`):
   - `OPENROUTER_API_KEY` and/or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — Tier 2 model notices (**uses LLM credits on every scan that needs Tier 2**).
   - `GITHUB_TOKEN` — recommended for tarball download rate limits.
   - If scans error on missing registry: set `SUNDOWN_MONOREPO_ROOT` to the **repository root** (parent of `registry/`), or `REGISTRY_PATH` to the absolute path of the `registry` folder in the deployment.
3. Do **not** commit `.env` — use the Vercel dashboard only.

**Only** [`apps/web/vercel.json`](apps/web/vercel.json) applies — do not import the monorepo at the repo root without Root Directory `apps/web`.

No credit cap or KV is wired yet; a public scan URL with keys enabled will spend your provider quota.

---

Stable ops: **[docs/LIVE.md](docs/LIVE.md)**. Session log: **[docs/JOURNAL.md](docs/JOURNAL.md)**.