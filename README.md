# Sundown

**Expiry-date audit for your whole repo** — models, APIs, packages, runtimes, SaaS. One line locally: `npx sundown-cli .`

Origin: OpenAI’s gpt-image-2 deprecation notice sat unopened for 91 days. This is the alarm bell that should have rung.

Repo: [sid-kiwilab/project-sundown](https://github.com/sid-kiwilab/project-sundown) — see [docs/LIVE.md](docs/LIVE.md) for product spec, stack, and build order.

```bash
npm install
# copy .env.example → .env — optional OPENROUTER_API_KEY (or OpenAI/Anthropic) for Tier 2
npm run dev            # or double-click start.bat (Windows)
                       # → http://localhost:3000 — paste a public GitHub repo
# CLI (local/private repos):
npm run build:engine && npm run build:cli
npm run sundown -- .
npm test               # engine Vitest (includes gpt-image-2 deprecation fixture)
```

Reports show **checked N of M** — “checked” means we queried a named source for that row (no notice on that page still counts). API hosts stay unchecked.

Stable ops + full spec: **[docs/LIVE.md](docs/LIVE.md)**. Session log: **[docs/JOURNAL.md](docs/JOURNAL.md)**. Agent workflow: **[harness/HARNESS.md](harness/HARNESS.md)**.