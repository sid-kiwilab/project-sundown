# Sundown

**Expiry-date audit for your whole repo** — models, APIs, packages, runtimes, SaaS.

Origin: OpenAI’s **gpt-image-2** deprecation notice sat in email for weeks unnoticed. Point Sundown at a repo and it flags what is already on borrowed time, with sources, not guesswork.

![CLI report for gpt-image-2 deprecation](docs/assets/cli-report.svg)

LinkedIn hook (calm email vs alarm mock): [`docs/assets/hook/linkedin-hook-composite.png`](docs/assets/hook/linkedin-hook-composite.png) — regenerate via [`docs/assets/hook/README.md`](docs/assets/hook/README.md).

**Live demo:** [project-sundown-nine.vercel.app](https://project-sundown-nine.vercel.app/) · Repo: [sid-venkatesh/project-sundown](https://github.com/sid-venkatesh/project-sundown) — full spec in [docs/LIVE.md](docs/LIVE.md).

```bash
git clone https://github.com/sid-venkatesh/project-sundown.git
cd project-sundown
npm install
cp .env.example .env          # optional: OPENROUTER_API_KEY for Tier 2 model notices
npm run build:engine && npm run build:cli
npm run sundown -- .          # private/local path — reads repo-root .env for Tier 2
npm run dev                   # or start.bat (Windows) → http://localhost:3000
npm test
```

**Web:** [project-sundown-nine.vercel.app](https://project-sundown-nine.vercel.app/) — paste a **public** `https://github.com/owner/repo` URL on the landing page.

```bash
npx sundown-cli .
```

Published on npm as [`sundown-cli`](https://www.npmjs.com/package/sundown-cli) **0.1.0** (engine: [`sundown-engine`](https://www.npmjs.com/package/sundown-engine)). Developing in this repo: `npm run sundown -- .`

Reports show **checked N of M** — “checked” means we queried a named source for that row (no notice on that page still counts). npm/PyPI pins with no deprecation flag show **`healthy`**, not “unverified”. The web UI leads with expiring rows; the CLI prints an **ALARMS** section first. API host rows stay unchecked.

## Deploy on Vercel

1. Import this GitHub repo; **Root Directory** `apps/web`, Framework **Next.js**, **Output Directory empty**, Build Command **empty** (default `next build`). [`apps/web/vercel.json`](apps/web/vercel.json) only overrides install: monorepo `npm install` + `build:engine`.
2. Set **environment variables** (same as `.env.example`):
   - `OPENROUTER_API_KEY` and/or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — Tier 2 model notices (**uses LLM credits on every scan that needs Tier 2**).
   - `GITHUB_TOKEN` — recommended for tarball download rate limits.
   - If scans error on missing registry: set `SUNDOWN_MONOREPO_ROOT` to the **repository root** (parent of `registry/`), or `REGISTRY_PATH` to the absolute path of the `registry` folder in the deployment.
3. Do **not** commit `.env` — use the Vercel dashboard only.

**Only** [`apps/web/vercel.json`](apps/web/vercel.json) applies — do not import the monorepo at the repo root without Root Directory `apps/web`.

No credit cap or KV is wired yet; a public scan URL with keys enabled will spend your provider quota.

## Reminders (GitHub Action)

Weekly scans with **no accounts**. In each repo where you add the workflow, Sundown opens or updates **one** alarm issue (label **`sundown`**).

- **One repo:** drop the file below into **that** repo as `.github/workflows/sundown.yml` and push. This site does not enable reminders for you.
- **Many repos:** repeat per repo (or use a GitHub org **reusable workflow**). There is no Sundown dashboard to “select all repos.”
- **Local once:** `npm run sundown -- . --issue` with `GITHUB_TOKEN` and [GitHub CLI](https://cli.github.com/) (`issues: write`).
- **Why not just an agent?** Sundown re-runs the same Tier 1/2 checks (npm, EOL, official pages with quote rules) every week. Agents are great for pasting this YAML; they are not a substitute for a scheduled, sourced report.

Optional repo secret `OPENROUTER_API_KEY` (or OpenAI/Anthropic via the action inputs) enables model sunset rows (**burns credits each run**). Without API keys, npm/PyPI/runtime EOL alarms still run (Tier 1).

`uses: ...@main` tracks the latest action on `main`; pin a commit SHA if you want a fixed version.

Save as **`.github/workflows/sundown.yml`** in the repository you want scanned:

```yaml
name: Sundown weekly

on:
  schedule:
    - cron: "0 9 * * 1"
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  sundown:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: sid-venkatesh/project-sundown/.github/actions/sundown@main
        with:
          openrouter-api-key: ${{ secrets.OPENROUTER_API_KEY }}
```

Example in this monorepo (same engine, local composite path): [`.github/workflows/sundown.yml`](.github/workflows/sundown.yml).

---

Stable ops: **[docs/LIVE.md](docs/LIVE.md)**. Session log: **[docs/JOURNAL.md](docs/JOURNAL.md)**.