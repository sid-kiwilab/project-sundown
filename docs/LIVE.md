# Sundown — live operation

Local dev: [README.md](../README.md). Session history: [JOURNAL.md](JOURNAL.md). Agent conventions: [AGENT-CONVENTIONS.md](AGENT-CONVENTIONS.md).

**One-liner:** Point it at a repo; find everything with an end date (LLM models, APIs, packages, runtimes, SaaS); check official sources; report loudly what dies when.

**Brand / npm:** Sundown · `sundown-cli` (`npx sundown-cli .` and global `sundown` bin when installed).

---

## Current state

| Item | Value |
|------|--------|
| Path | `c:\flutter_apps\project_sundown` |
| Repo | [sid-kiwilab/project-sundown](https://github.com/sid-kiwilab/project-sundown) |
| Product | Open-source repo + npm CLI + optional GitHub Action + Vercel demo (public repo paste) |
| Stack | Monorepo: `packages/engine` (pure TS), `packages/cli`, `apps/web` (Next.js App Router, Tailwind); Upstash Redis on hosted site |
| App root | `apps/web/` |
| Dev | *Pending scaffold* — `npm run dev` from `apps/web` or root workspace script |
| CLI | *Pending* — `npx sundown-cli [path]` |
| Backend (hosted) | Scan API, credits, cache — Vercel + KV |
| Env (hosted) | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (optional), `KV_*`, `ADMIN_SECRET`, `CONTACT_URL`, optional `GITHUB_TOKEN` (archived-repo limits) |
| Env (CLI) | User’s `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` for Tier 2/3; `GITHUB_TOKEN` for `--issue` |
| Production URL | Unset |
| Accent | Alarm red (TBD in `apps/web` — dark UI, big type) |
| License | MIT |

### Git (this repo only)

| Setting | Value |
|---------|--------|
| Branch | `main` (default when initialized) |
| `origin` | `https://github.com/sid-kiwilab/project-sundown.git` |

### Session workflow

Agent harness in [`harness/`](../harness/) — ported from **siddharth_venkatesh** Harness V2.

---

## Goals

- **Primary:** Anyone runs `npx sundown-cli .` — works on private repos; only notice lookups leave the machine.
- **GitHub Action:** Weekly run, opens/updates alarm issue (install once, forget).
- **Hosted site:** Paste public GitHub URL → report in ~30s; credit-capped; CLI is unlimited fallback.
- **Open source (MIT):** Repo is the artifact — README, screenshot, terminal alarm GIF, one-command install.
- **Zero-setup Tier 1:** Free data sources, no API key. Tier 2/3 use the user’s keys; without a key, those items show **skipped, add a key to check**.
- **Honest:** Every finding has a source link + confidence. No notice = **no notice found**, never “safe”.

## Non-goals (v1)

- No accounts or auth on the hosted site.
- No scheduled monitoring on Vercel (Action is separate).
- No private repo scanning on the hosted site.
- No dates from model memory — only fetched pages/APIs.

---

## Monorepo layout

| Path | Role |
|------|------|
| `packages/engine` | Repo fetch, detectors, resolver tiers, `Finding` model, tests on fixture repos — **no framework deps** |
| `packages/cli` | Thin wrapper; npm package `sundown-cli` |
| `apps/web` | Landing, scan API, report page, credits, OG image |
| `registry/models.json` | Model ID patterns by provider |
| `registry/sources.json` | Official deprecation page URLs |
| `registry/packages.json` | Manual overrides for known dead services |
| `.github/workflows/` | Optional: weekly sundown Action + `action.yml` for `uses: <owner>/sundown@v1` |

---

## Hosted scan flow

1. User pastes `github.com/owner/repo` (optional branch/subpath).
2. Server checks credits + rate limit → out-of-credits page if exhausted.
3. Cache key `owner/repo@commitSha` — hit returns instantly, zero cost.
4. Download tarball from `codeload.github.com` (no REST enumeration). Cap ~50MB; skip `node_modules`, `.git`, `dist`, huge lockfiles.
5. Run detectors → list of dependencies.
6. Resolve status (tiers below).
7. Score, sort, return report; cache result.

---

## Detectors (`engine`)

Each detector returns `{ kind, name, version?, file, line, raw }`.

- **LLM models** — regex/AST for `gpt-*`, `claude-*`, `gemini-*`, `o1`/`o3`, `llama-*`, `mistral-*`, embeddings, image/audio; seed [`registry/models.json`](../registry/models.json).
- **Provider SDKs / APIs** — manifests + imports (OpenAI, Anthropic, Stripe, Twilio, Maps, etc.), API hostnames, version headers (`2023-10-16` style).
- **Packages** — `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`.
- **Runtimes / base images** — `.nvmrc`, `engines.node`, `.python-version`, `runtime.txt`, Dockerfile `FROM`, `vercel.json`, Actions `runs-on`.
- **GitHub Actions** — `uses:` in `.github/workflows`.
- **Env hints** — `.env.example` names (`OPENAI_API_KEY`, `STRIPE_*`, etc.) for services without imports.

---

## Resolver tiers (cheapest first)

**Tier 1 — free, deterministic**

- Runtimes/images: [endoflife.date](https://endoflife.date) API.
- npm `deprecated` field per version.
- PyPI yanked / inactive signals.
- GitHub `archived` on dependency repos (cached; optional token).
- Actions: archived actions, deprecated Node on runner.

**Tier 2 — registry + live fetch**

- [`registry/sources.json`](../registry/sources.json) → fetch deprecation pages (OpenAI, Anthropic, Google, Mistral, Cohere, …).
- Cache 24h per source; cheap LLM extracts `{ model, shutdownDate, replacement, sourceUrl }` with **required source quote**.

**Tier 3 — unknown SaaS**

- Search + fetch official docs/changelog; LLM read; cap ~5 lookups/scan; confidence `llm-read`.
- Else: `no_notice_found`.

Never invent dates — no quote containing the date → drop result.

---

## Finding shape

```ts
type Finding = {
  id: string
  kind: 'model' | 'api' | 'package' | 'runtime' | 'saas' | 'action'
  name: string
  version?: string
  locations: { file: string; line: number }[]
  status: 'healthy' | 'deprecated' | 'price_change' | 'dead' | 'no_notice_found'
  endDate?: string          // ISO
  daysLeft?: number
  replacement?: string
  sourceUrl?: string
  sourceQuote?: string
  confidence: 'official-data' | 'official-page' | 'llm-read'
}
```

---

## Severity and alarm

| Days left | Severity |
|-----------|----------|
| 30+ | amber |
| ≤30 | orange |
| ≤7 | red |
| ≤1 | critical (+ terminal bell `\u0007` in CLI) |
| past | already dead |

Headline: **X of Y dependencies are on borrowed time.** Hero countdown: **YOUR APP BREAKS IN N DAYS.** Sections sorted by soonest `endDate`. Footer: **No notice found does not mean safe.**

**Outputs (v1):** Web report; JSON (`POST /api/scan`, CLI `--json`); terminal table; OG image; **Copy as GitHub issue** / CLI `sundown . --issue` (user `GITHUB_TOKEN` via `gh` or Octokit).

---

## Credits (hosted only)

Redis (Upstash / Vercel KV):

- `credits:remaining` — admin top-up via env + guarded `/api/admin/topup`
- `ratelimit:ip:<hash>` — e.g. 3/hour, 10/day
- `cache:scan:<owner/repo>@<sha>`, `cache:source:<provider>` — 24h+

LLM calls decrement by real token cost. Pre-check credits; mid-scan exhaustion → partial Tier 1 + “skipped (out of credits)”.

**Out-of-credits UI:** “Sorry, people got here before you.” Contact + link to repo / `npx sundown-cli .`.

---

## Web UI

- Landing: paste public GitHub repo; dark + alarm-red accent.
- Loading: progress (“Downloading repo”, “Found N dependencies”, …) via SSE or polling.
- Report: `/r/<owner>/<repo>` shareable.
- OG: repo name, countdown, “X of Y on borrowed time”.
- Mobile-friendly; no accounts.

---

## API

- `POST /api/scan { repoUrl }` → `{ scanId }`
- `GET /api/scan/:id` or SSE → report JSON
- Validate: `github.com` only; never execute repo code.

---

## CLI

```bash
npx sundown-cli [path] [--json] [--issue] [--fail-on-days=N]
```

Same engine as web; Tier 1 offline where possible; `--fail-on-days` for CI gates.

---

## Distribution

- README leads with one-liner, GIF, `npx sundown-cli .`, demo link.
- npm: `sundown-cli`; bin aliases `sundown` + `sundown-cli`.
- `action.yml` for composite Action.
- Provider-agnostic LLM reader (Anthropic, OpenAI, optional local URL).
- Registry JSON — PRs welcome for new providers.

---

## Build order

1. **engine** — fetch + detectors + Tier 1 + tests on fixtures.
2. **CLI** — table, `--json`, `--issue`, `--fail-on-days`, terminal alarm.
3. **Tier 2** — OpenAI, Anthropic, Google pages + quote check.
4. **Action** + npm publish + README GIF.
5. **web** — landing, API, report, cache, credits, out-of-credits.
6. OG + copy-as-issue.
7. **Tier 3** + demo scan aliasengine for launch.

---

## Done when

- [ ] `npx sundown-cli .` on a fresh machine **without** a key prints a useful report (Tier 1).
- [ ] aliasengine scan flags **gpt-image-2** → **2027-02-10**, replacement, OpenAI source link.
- [ ] Old Node + deprecated npm package both show `official-data` confidence.
- [ ] Credits at zero → friendly page, no stack trace.
- [ ] Public README with report screenshot + two-line origin story.

---

## Key files (as they land)

| File | Role |
|------|------|
| `packages/engine/src/*` | Scan pipeline |
| `packages/cli/src/*` | CLI entry |
| `apps/web/app/*` | Next.js routes + API |
| `registry/*.json` | Seeds and overrides |
| `harness/*` | V2 agent kit |
| [`.env.example`](../.env.example) | *Pending* — hosted + CLI placeholders |
| [docs/JOURNAL.md](JOURNAL.md) | Session log |

---

## Env (reference)

| Var | Required | Where | Notes |
|-----|----------|--------|--------|
| `ANTHROPIC_API_KEY` | No | CLI / Vercel | Tier 2/3 extraction |
| `OPENAI_API_KEY` | No | CLI / Vercel | Alternative reader |
| `KV_*` | Hosted | Vercel | Credits, rate limit, cache |
| `ADMIN_SECRET` | Hosted | Vercel | Top-up route |
| `CONTACT_URL` | Hosted | Vercel | Out-of-credits CTA |
| `GITHUB_TOKEN` | No | CLI / server | `--issue`, archived checks |

---

## Local testing

*After monorepo scaffold:*

```bash
cd c:\flutter_apps\project_sundown
npm install
npm run build -w @sundown/engine   # or root script TBD
npx sundown-cli .
# apps/web:
npm run dev -w @sundown/web
```

Owner verifies `http://localhost:3000` in the browser. Agents do not fetch localhost.

```bash
npm run build
npm run lint
```

---

## Deploy checklist

- [x] Initialize git + GitHub repo `sid-kiwilab/project-sundown`
- [ ] Publish `sundown-cli` to npm
- [ ] Vercel project on `apps/web` with KV env
- [ ] Set `credits:remaining` + `CONTACT_URL`
- [ ] `npm run build` clean before prod
- [ ] Confirm public scan + out-of-credits + CLI parity on Tier 1