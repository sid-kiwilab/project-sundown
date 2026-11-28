# Sundown — live operation

Local dev: [README.md](../README.md). Session history: [JOURNAL.md](JOURNAL.md). Agent conventions: [AGENT-CONVENTIONS.md](AGENT-CONVENTIONS.md).

**One-liner:** Point it at a repo; find everything with an end date (LLM models, APIs, packages, runtimes, SaaS); check official sources; report loudly what dies when.

**Brand / npm:** Sundown · `sundown-cli` (`npx sundown-cli .` and global `sundown` bin when installed). Engine package: `sundown-engine`.

---

## Current state

| Item | Value |
|------|--------|
| Path | `c:\flutter_apps\project_sundown` |
| Repo | [sid-venkatesh/project-sundown](https://github.com/sid-venkatesh/project-sundown) |
| Product | Open-source repo + npm CLI + optional GitHub Action + Vercel demo (public repo paste) |
| Stack | Monorepo: `packages/engine` (pure TS), `packages/cli`, `apps/web` (Next.js App Router, Tailwind); Upstash Redis on hosted site |
| App root | `apps/web/` |
| Dev (web) | **Shipped (local)** — `start.bat` or `npm run dev` → **http://localhost:3000**; paste public `github.com/owner/repo` |
| Web (Vercel) | **Shipped** — [project-sundown-nine.vercel.app](https://project-sundown-nine.vercel.app/). Root **`apps/web`**, Framework **Next.js**, Output Directory **empty**, Build Command **empty**. [`apps/web/vercel.json`](../apps/web/vercel.json): install = monorepo `npm install` + `build:engine`. NFT includes `../../registry/**/*.json`. Git: **sid-venkatesh/project-sundown**. |
| CLI (local) | **Shipped (workspace)** — `sundown-engine` + `sundown-cli`; `npm run build:engine && npm run build:cli` then `npm run sundown -- [path]` (reads repo-root `.env` via engine) |
| CLI (npm) | **Shipped** — [sundown-cli@0.1.1](https://www.npmjs.com/package/sundown-cli) + [sundown-engine@0.1.1](https://www.npmjs.com/package/sundown-engine) (`sid-venkatesh`). Workspace **0.1.2** CLI adds `--issue` upsert fixes; publish from `main` after FIX. |
| Backend (hosted) | Scan API, credits, cache — Vercel + KV |
| Env (hosted) | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (optional), `KV_*`, `ADMIN_SECRET`, `CONTACT_URL`, optional `GITHUB_TOKEN` (archived-repo limits) |
| Env (CLI) | User’s `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` for Tier 2/3; `GITHUB_TOKEN` or `GH_TOKEN` for `--issue` (gh CLI). Optional local marketing: `ZERNIO_API_KEY` (`scripts/schedule-linkedin-zernio.mjs` only). |
| Production URL | [https://project-sundown-nine.vercel.app/](https://project-sundown-nine.vercel.app/) |
| Accent | Light neutral UI in `apps/web` (warm off-white; urgency on rows only, not chrome) |
| License | MIT |

### Git (this repo only)

| Setting | Value |
|---------|--------|
| Branch | `main` (default when initialized) |
| `origin` | `https://github.com/sid-venkatesh/project-sundown.git` |
| Production web | [project-sundown-nine.vercel.app](https://project-sundown-nine.vercel.app/) |

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
| `.github/actions/sundown/` | Composite Action: build engine/CLI, scan `$GITHUB_WORKSPACE`, `npm run sundown -- . --issue` |
| `.github/workflows/sundown.yml` | Example weekly cron on this repo (copy or call remote `uses: sid-venkatesh/project-sundown/.github/actions/sundown@main`) |

---

## Hosted scan flow

**Local dev (shipped):** steps 4–7 via `POST /api/scan` on one response — Tier 2 when `OPENROUTER_API_KEY` / OpenAI / Anthropic keys in repo-root `.env` (`ensureMonorepoEnv`); no credits/cache/`scanId` yet.

**Hosted (target):**

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
- npm: exact pin **deprecated** → alarm; pin exists and not deprecated → **`healthy`** + `official-data` (not “no notice / unverified”).
- PyPI: yanked version → alarm; pin exists and not yanked → **`healthy`** + `official-data`.
- Models/APIs: no provider notice stay **`no_notice_found`** (page fetch ≠ safe).
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
  confidence: 'official-data' | 'official-page' | 'llm-read' | 'unverified'
}
```

- **`unverified`** — Tier 1 did not check or found no official notice (`no_notice_found`). Never imply safety.
- **`official-data`** — Tier 1 registry/API/override with `sourceUrl` and/or `sourceQuote` (including `registry/packages.json` overrides with `note`).

---

## Severity and alarm

| Days left | Severity |
|-----------|----------|
| 30+ | amber |
| ≤30 | orange |
| ≤7 | red |
| ≤1 | critical (+ terminal bell `\u0007` in CLI) |
| past | already dead |

Headline: **X of Y dependencies are on borrowed time.** Hero countdown: **YOUR APP BREAKS IN N DAYS.** Alarms sorted by soonest `endDate` / status; **healthy** and checked “no notice” rows collapsed in web/CLI. Footer: **No notice found does not mean safe.**

**Outputs (v1):** Web report; JSON (`POST /api/scan`, CLI `--json`); terminal table (alarms first); OG image; CLI `sundown . --issue` — upserts one issue labeled **`sundown`** via `gh` (`GITHUB_TOKEN`, `issues: write`).

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

- Landing (`/`): paste public GitHub repo; light layout, scan only. **`/reminders`**: copy consumer Action YAML (header nav + footer link; one repo at a time). **(local: shipped)**
- Loading: stepped client copy (“Downloading the repository”, …). SSE not wired.
- Report: alarm block first; **Clear / no notice / env / unchecked** in `<details>`. **(inline on `/` only; `/r/` not yet)**
- OG: repo name, countdown, “X of Y on borrowed time”.
- Mobile-friendly; no accounts.

---

## API

- **Local (shipped):** `POST /api/scan { repoUrl }` → full report JSON (+ `repo` slug). Public `github.com` only; tarball cap 50MB.
- **Hosted (target):** `POST /api/scan { repoUrl }` → `{ scanId }`; `GET /api/scan/:id` or SSE → report JSON.
- Validate: `github.com` only; never execute repo code.

---

## CLI

```bash
npx sundown-cli [path] [--json] [--issue] [--fail-on-days=N]
```

Same engine as web; Tier 1 offline where possible; `--fail-on-days` for CI gates. `--issue` requires [GitHub CLI](https://cli.github.com/) + `GITHUB_TOKEN`; finds/creates issue with label **`sundown`** (not title search).

---

## Distribution

- README leads with one-liner, GIF, `npx sundown-cli .`, demo link.
- npm: `sundown-cli`; bin aliases `sundown` + `sundown-cli`.
- `action.yml` for composite Action.
- Provider-agnostic LLM reader (Anthropic, OpenAI, optional local URL).
- Registry JSON — PRs welcome for new providers.

---

## Build order

1. **engine** — fetch + detectors + Tier 1 + tests on fixtures. **(shipped)**
2. **CLI** — table, `--json`, `--issue`, `--fail-on-days`, terminal alarm. **(shipped, workspace only)**
3. **Tier 2** — OpenAI + **Anthropic** pipe-table parse + batch LLM; Google, Mistral via fetch + LLM + quote gates (no structured row parser for those yet).
4. **Action** example workflow + composite in repo **(shipped)**; npm **0.1.1** on registry (CLI **0.1.2** on `main` for `--issue` until next publish). README GIF still pending.
5. **web** — landing, API, report, cache, credits, out-of-credits. **(partial: local + Vercel; `/api/scan` + alarm-first report; no KV/credits/`/r/`)**
6. OG + copy-as-issue.
7. **Tier 3** + demo scan aliasengine for launch.

---

## Done when

- [x] **Tier 1 (local workspace):** `npm run sundown -- .` with **no** API keys prints a useful report (live npm/eol checks). `npx sundown-cli .` on npm **0.1.1+** (`latest`).
- [x] **Tier 2 demo:** Vitest `packages/engine` fixture `fixtures/gpt-image-2` + mocked OpenAI deprecations table flags **gpt-image-2** → **2027-02-10**, replacement, source link (live `aliasengine` scan optional after publish).
- [x] Old Node + deprecated npm package both show `official-data` (Vitest fixtures + mocked HTTP).
- [ ] Credits at zero → friendly page, no stack trace (hosted).
- [x] **Web (local):** paste public GitHub URL at `localhost:3000`, report in browser (`start.bat` / `npm run dev`; Tier 2 when keys in root `.env` locally or deployment env on Vercel).
- [x] **Public README** with report illustration (`docs/assets/cli-report.svg`) + two-line origin story; clone/install path; `npx` after npm publish.

---

## Key files (as they land)

| File | Role |
|------|------|
| `packages/engine/src/*` | Scan pipeline |
| `packages/engine/src/dotenv.ts` | Workspace `.env`, `resolveSundownRegistryPath` |
| `packages/cli/src/*` | CLI entry |
| `apps/web/app/*` | Next.js routes + API |
| `apps/web/vercel.json` | Vercel install/build from monorepo root |
| `registry/*.json` | Seeds and overrides |
| `harness/*` | V2 agent kit |
| [`.env.example`](../.env.example) | CLI + optional `REGISTRY_PATH`, `GITHUB_TOKEN` for web scans |
| [start.bat](../start.bat) | Windows: install if needed, build engine, `next dev` on `apps/web` |
| [scripts/dev.mjs](../scripts/dev.mjs) | `npm run dev` → build engine + `@sundown/web` |
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
| `GITHUB_TOKEN` | No | CLI / web API | `--issue`, archived checks; higher GitHub API limits for tarball/default branch |
| `OPENROUTER_API_KEY` | No | CLI / web | Tier 2 reader (preferred OpenAI-compatible) |
| `SUNDOWN_LLM_MODEL` | No | CLI / web | Optional model slug (default `openai/gpt-4o-mini` on OpenRouter) |
| `REGISTRY_PATH` | No | CLI / web | Absolute path to `registry/` if auto-detect fails (Vercel) |
| `SUNDOWN_MONOREPO_ROOT` | No | CLI / web | Repo root (parent of `registry/`) if walk fails |
| `SUNDOWN_INCLUDE_TESTS` | No | CLI / web | Set `1` to walk `*.test.ts(x)`, `*.spec.ts(x)`, and `**/fixtures/**` (default: skip) |
| `NEXT_PUBLIC_CONTACT_URL` | No | Web | “Interested in monitoring?” CTA on landing |
| `ZERNIO_API_KEY` | No | Local only | Optional LinkedIn scheduling script (`scripts/schedule-linkedin-zernio.mjs`); not used by scan or Action |

---

## Local testing

```bash
cd c:\flutter_apps\project_sundown
npm install
npm run dev              # or start.bat (Windows) → http://localhost:3000
npm run build:engine && npm run build:cli && npm run sundown -- .
npm test
```

Owner verifies `http://localhost:3000` in the browser. Agents do not fetch localhost.

```bash
npm run build    # engine + CLI + web
npm run lint     # tsc --noEmit on sundown-engine and @sundown/web
```

---

## Deploy checklist

- [x] Initialize git + GitHub repo `sid-venkatesh/project-sundown`
- [x] Package `sundown-cli` + `sundown-engine` for npm (registry bundled in engine tarball)
- [x] Owner: `npm publish` — **sundown-engine@0.1.1**, **sundown-cli@0.1.1** (2026-11-28); **0.1.2** CLI pending after FIX
- [x] Vercel — [project-sundown-nine.vercel.app](https://project-sundown-nine.vercel.app/) (Root **`apps/web`**, env from `.env.example`)
- [ ] Set `credits:remaining` + `CONTACT_URL` (when KV ships)
- [ ] `npm run build` clean before prod (PUSH)
- [ ] Owner: confirm public scan on prod + CLI Tier 2 from `.env` (`gpt-image-2` fixture)