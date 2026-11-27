# Sundown — current state (for external review)

**Date:** 2026-11-21  
**Repo:** [sid-venkatesh/project-sundown](https://github.com/sid-venkatesh/project-sundown)  
**Purpose of this doc:** Single snapshot of what we are building, what is implemented locally, what we changed this session, and known limits — so another model (e.g. Claude) can critique architecture and recall expectations.

Spec of record for product goals remains [LIVE.md](./LIVE.md). This file is an **as-built + in-flight** supplement.

---

## One-liner

Point Sundown at a codebase (CLI on private disk, or paste a **public** GitHub URL in the local web UI). It lists **models, APIs, packages, runtimes, GitHub Actions, SaaS env hints**, then resolves **shutdown / deprecation** from official sources where possible. **No notice ≠ safe** — we label `no_notice_found` and `unverified` instead of pretending green.

Origin story: OpenAI’s **gpt-image-2** deprecation sat in email for weeks unnoticed; Sundown is meant to ring that bell.

---

## Monorepo layout

| Path | Role |
|------|------|
| `packages/engine` | Pure TS scan pipeline (no framework). Published as `sundown-engine`. |
| `packages/cli` | Thin CLI (`sundown-cli`, workspace: `npm run sundown -- .`). |
| `apps/web` | Next.js 15 App Router — landing + `POST /api/scan`. |
| `registry/` | `models.json`, `sources.json`, `packages.json` (patterns, official URLs, manual overrides). |
| `docs/LIVE.md` | Full product spec, tiers, build order. |
| `harness/` | Agent workflow kit (PLAN → Build → REVIEW → …). |

**Local dev:** `start.bat` or `npm run dev` → builds engine, runs Next on **http://localhost:3000**.  
**Not shipped:** npm publish, Vercel + KV credits, GitHub Action, Tier 3 search.

---

## User flows today

### Web (local)

1. User pastes `https://github.com/owner/repo` (public only).
2. `POST /api/scan` downloads a tarball (`lib/github-tarball.ts`, retries, optional `GITHUB_TOKEN`).
3. `scan()` from `sundown-engine` with monorepo `registry/` and optional Tier 2 LLM.
4. JSON report rendered in the browser (list rows: kind, status, days, confidence, checked — hover for source).

### CLI (workspace)

```bash
npm run build:engine && npm run build:cli
npm run sundown -- [path] [--json] [--issue] [--fail-on-days=N]
```

Same engine; suitable for **private** repos. User supplies API keys in shell env for Tier 2.

---

## Scan pipeline (engine)

```
walk repo → detectors → dedupe → Tier 1 → Tier 2 (if llmReader) → report + meta
```

### Detectors (what we find)

- **LLM models** — regex/AST patterns (`gpt-*`, `claude-*`, `gemini-*`, `gpt-image-*`, embeddings, etc.) + `registry/models.json`.
- **APIs** — hostnames / provider hints in code.
- **Packages** — `package.json`, requirements, `go.mod`, etc.
- **Runtimes** — `.nvmrc`, `engines.node`, Docker `FROM`, Actions `runs-on`, …
- **GitHub Actions** — `uses:` lines.
- **SaaS env hints** — `.env.example` keys (`OPENAI_API_KEY`, …).

### Finding shape (summary)

- `status`: `healthy` | `deprecated` | `dead` | `no_notice_found` | …
- `confidence`: `official-data` | `official-page` | `llm-read` (future) | `unverified`
- `sourceUrl`, `sourceQuote`, `endDate`, `daysLeft`, `replacement` when evidenced
- `checked`, `checkSource`, `uncheckedReason` — coverage line in report meta (`coverage.ts`)

**Honesty rules (enforced in code):**

- Tier 2 requires a **verbatim quote** on the fetched page (with normalization for backticks/whitespace).
- **Shutdown dates** only if the quote contains the date (ISO or common US month forms); otherwise we may still mark `deprecated` **without** days.
- Failed LLM / failed quote → stay or revert to **`unverified`**, not fake `official-page`.

---

## Resolver tiers

### Tier 1 — free, deterministic (no LLM)

| Kind | Source |
|------|--------|
| `runtime` (node) | [endoflife.date](https://endoflife.date) |
| `package` (npm) | registry.npmjs.org **deprecated field for declared version only** (exact pin; no “latest” inference) |
| `package` (pypi) | PyPI yanked / inactive signals |
| `action` | GitHub API archived repos (optional `GITHUB_TOKEN`) |
| overrides | `registry/packages.json` manual entries |

**Models / SaaS** after Tier 1: `checked: false` until Tier 2 (or finalize reason). **`api` hostnames** stay **unchecked** — deprecations are on **model** rows, not API endpoints.

### Tier 2 — fetch + OpenAI table parse + batched LLM

Configured in `registry/sources.json` (OpenAI, Anthropic, Google, Mistral, …) and `registry/saas.json`.

1. **`model` / `saas`** findings that still need a notice (`needsTier2` in `tier2.ts`).
2. `inferProvider()` maps name → provider (`provider-map.ts`).
3. Fetch official URL(s); **24h page cache**; **one batch LLM call per provider page** on **windowed** snippets (~1500 chars around each ID).
4. **OpenAI-shaped markdown tables** parsed deterministically (`parseMarkdownDeprecationRow`) before LLM.
5. `createDefaultBatchLlmReader()` — OpenRouter → OpenAI → Anthropic (`readers/llm.ts`).
6. Quote/date gates; fetch/LLM failures → `tier2Errors[]` in report meta (not silent).
7. Default cap **40** model/SaaS lookups per scan (batching reduces call count).

**Tier 2 env keys (repo root `.env` or process env):**

- `OPENROUTER_API_KEY` (preferred)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- Optional: `SUNDOWN_LLM_MODEL`, `GITHUB_TOKEN`

### Tier 3 — not implemented

Spec (LIVE): web search + fetch for unknown SaaS / vendors not in `sources.json`; cap ~5 lookups; confidence `llm-read`. **We are not building this yet.**

---

## What we fixed recently (2026-11-21 session)

### Web UI not loading repo-root `.env`

- **Symptom:** Banner “Add OPENROUTER_API_KEY…” despite key in root `.env`.
- **Cause:** Next.js API route did not reliably populate `process.env` for bundled `@sundown/engine`.
- **Fix:** `apps/web/lib/root-dotenv.ts` reads monorepo root `.env` from disk (walk up to `registry/sources.json`); `ensureMonorepoEnv()` before scan; scan route passes `createDefaultBatchLlmReader()` after apply.

### Tier 2 “running” but everything stayed `unverified`

Observed on scans like `sid-venkatesh/youtube-thumbnail-generator` — Tier 2 enabled but all models `no_notice_found`.

Root causes (not “we need Firecrawl for OpenAI”):

| Issue | Mitigation shipped |
|-------|-------------------|
| OpenAI HTML noisy; LLM quotes did not match page | Prefer **`https://platform.openai.com/docs/deprecations.md`** in `sources.json` |
| Quote gate rejected backticks / spacing | `normalizeForQuoteMatch()` in quote gate |
| Dates like **Feb 10, 2027** vs ISO `2027-02-10` | Extended `quoteContainsDate()` for month names |
| Bad date dropped **entire** finding | Keep `deprecated` + `official-page`; omit `endDate` if date not in quote |
| Only 15 Tier 2 lookups / scan | Raised default to **40**; batch per provider page |
| False positives from “mentioned as replacement” | `quoteShowsModelDeprecated` + table parser |
| Inflated “checked” on API hosts | Tier 1 no longer marks `api` rows checked without a source |

**Verification:** Vitest `fixtures/gpt-image-2` scan test asserts **gpt-image-2 → 2027-02-10** from mocked OpenAI deprecations table; live scan on `youtube-thumbnail-generator` with keys. Run `npm test` for current count.

---

## Tests

```bash
npm test   # @sundown/engine — Vitest
```

Covers: Tier 1 fixtures (mocked HTTP), Tier 2 quote/date gates, scan integration with mocks. **No live OpenRouter in CI.**

---

## Environment reference (local web + CLI)

| Variable | Role |
|----------|------|
| `OPENROUTER_API_KEY` | Tier 2 LLM (preferred) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Tier 2 fallback |
| `GITHUB_TOKEN` | Tarball + GitHub archived checks; rate limits |
| `REGISTRY_PATH` | Override path to `registry/` |
| `SUNDOWN_LLM_MODEL` | Optional model slug |
| `NEXT_PUBLIC_CONTACT_URL` | Optional marketing CTA on landing |

See also `.env.example` and LIVE env table.

---

## Build order vs reality

| Step | LIVE plan | Status |
|------|-----------|--------|
| Engine + Tier 1 + tests | 1 | **Shipped** (workspace) |
| CLI | 2 | **Shipped** (workspace; not npm publish) |
| Tier 2 (OpenAI table + batch LLM; others LLM+quote) | 3 | **Partial** — OpenAI markdown table + LLM batch shipped; Anthropic/Google lack dedicated table parsers |
| Web landing + scan API | 5 (partial) | **Shipped locally** — Tier 2 when keys in root `.env`; no KV/credits/`/r/` |
| Tier 3 search | 7 | **Not started** |
| GitHub Action, npm publish, hosted credits | 4–6 | **Not started** |

---

## What we are confident about

**Reasonably reliable today (when keys + network OK):**

- Node/runtime EOL via endoflife.date.
- npm **deprecated** on the exact declared version.
- OpenAI model IDs that appear on the official deprecations **markdown** page, with Tier 2 enabled.
- Similar pattern for other providers **if** their URL fetch yields usable text and registry lists them.

**We do not claim:**

- Catch “most” issues in an arbitrary repo.
- Tier 2 on every `package` row (packages are Tier 1 npm/PyPI, not vendor doc pages).
- Notices only on blogs, status pages, or paywalled docs.
- JS-only doc shells with no SSR text (Firecrawl not integrated).
- Unknown SaaS without Tier 3 search.

---

## Known gaps / risks (explicit)

1. **Structured parse** — OpenAI + Anthropic pipe tables; Google/Mistral still mostly LLM + gates.
2. **Lookup cap** (40) — huge model lists may skip tail items.
3. **One deprecation URL per provider** — no per-model deep links.
4. **Provider coverage** — only entries in `sources.json` / `saas.json`; many vendors absent.
5. **Tier 3** — unmapped SaaS stays unchecked or `no source in registry`.
6. **API host rows** — intentionally unchecked; do not inflate coverage.
7. **Web scan** — public GitHub only; tarball failures without token.
8. **Hosted product** — credits, caching, rate limits not built.
9. **Root `lint`** — `tsc --noEmit` on web + engine (Next still runs ESLint on `npm run build:web`).

---

## Deliberate product principles

- **Cheapest signal first** (Tier 1 → Tier 2 → Tier 3).
- **Never invent dates** — no quote, no `endDate`.
- **No notice ≠ safe** — UI copy states this.
- **Private repos** — CLI on user machine; hosted paste is public-only.
- **Registry is open data** — PRs for new providers/patterns.

---

## Open questions for reviewer (Claude or other)

1. **Recall vs honesty:** Is “drop date but keep `deprecated` + quote” the right tradeoff, or should we require dates for any non-`unverified` status?
2. **Tier 2 architecture:** Per-finding LLM on full page vs **table parse** (markdown/HTML) then row lookup by model ID — which should we prioritize?
3. **Firecrawl / browser render:** Which providers in our registry actually need it vs `.md` / SSR HTML?
4. **Tier 3:** Minimal design for “unknown API hostname → official changelog” without burning credits on spam SERP results?
5. **Silent LLM failures:** `tier2Errors[]` is surfaced in web UI — sufficient?
6. **Lookup budget:** Batching per provider page is live — tune cap vs cost?
7. **Scope of “done” for v1 launch:** Is OpenAI + Anthropic + Google Tier 2 + CLI publish enough, or block on Tier 3?

---

## Key file index

| File | Role |
|------|------|
| `packages/engine/src/scan.ts` | Orchestration, `meta.tier2Enabled` |
| `packages/engine/src/resolvers/tier1.ts` | Free resolvers |
| `packages/engine/src/resolvers/tier2.ts` | Fetch + table parse + batch LLM |
| `packages/engine/src/readers/deprecations-table.ts` | OpenAI markdown row parser |
| `packages/engine/src/coverage.ts` | `checked` / `coverageLine` / `standBehindLine` |
| `packages/engine/src/readers/llm.ts` | OpenRouter / OpenAI / Anthropic |
| `packages/engine/src/readers/quote-gate.ts` | Date-in-quote rules |
| `apps/web/app/api/scan/route.ts` | Tarball + scan + env |
| `apps/web/lib/root-dotenv.ts` | Load root `.env` in API |
| `registry/sources.json` | Official deprecation URLs |
| `registry/models.json` | Model ID patterns |

---

## How to reproduce locally

```bash
cd c:\flutter_apps\project_sundown
npm install
# Put OPENROUTER_API_KEY (or OpenAI/Anthropic) in repo root .env
start.bat   # or: npm run build:engine && npm run dev -w @sundown/web
# Browser: http://localhost:3000
# Paste: https://github.com/sid-venkatesh/youtube-thumbnail-generator
npm test
```

After engine changes, **rebuild engine** before web scan (`start.bat` does this).

---

## Suggested prompt for Claude

> Read `docs/STATUS-FOR-REVIEW.md` and `docs/LIVE.md`. Critique our Tier 2 approach (LLM + quote gates vs structured parsing), list the highest-impact changes to improve **recall without lying**, and say whether Firecrawl / web search are the right next investments for v1.