# Session journal

Newest first. Stable ops + product spec: [LIVE.md](LIVE.md).

---

## 2026-11-22 — Drop Vercel packaging workarounds (SYNC)

- **Reverted:** post-`next build` `export-detail.json` stubs, `prebuild`/`build.mjs`, `stage-registry-for-web`, `docs/VERCEL.md`, `outputFileTracingRoot` toggles, extra `framework` in `vercel.json`. Tree matches **`040fd66`** plus clone/CLI `.env` work.
- **Why:** Vercel’s packager (`lstat export-detail.json`) is a platform/project-settings issue; those hacks caused `NEXT_EXPORT_FAILED` / `cwd` crashes. Owner reconnects Vercel manually (Framework Next.js, Output Directory empty).
- **Key files restored:** `apps/web/vercel.json`, `apps/web/next.config.ts`, `apps/web/package.json` (`next build` only).

## 2026-11-22 — Clone + Vercel-ready (PLAN → Build → REVIEW → FIX → SYNC)

- **Shipped:** `@sundown/engine` `dotenv.ts` — `applyRootDotenv` (workspace `.env` only), `resolveSundownRegistryPath` with multi-anchor search + throw; CLI loads keys from Sundown root before `scan()`; web registry via `import.meta.url` + traced `registry/**/*.json` in `next.config.ts`; [`apps/web/vercel.json`](../apps/web/vercel.json); honest README + `docs/assets/cli-report.svg`; landing copy = server env on Vercel.
- **Tests:** Vitest `dotenv.test.ts` (+2); engine total **21** after `npm test`.
- **Key files:** `packages/engine/src/dotenv.ts`, `packages/cli/src/bin.ts`, `apps/web/lib/registry-path.ts`, `README.md`
- **Gaps:** npm publish; KV/credits; owner prod scan on Vercel; commit/push on main.

## 2026-11-21 — Anthropic pipe-table parse + lint (FIX → SYNC)

- **Shipped:** `parseMarkdownDeprecationRow` handles **Anthropic** retirement-history and status tables (same Tier 2 path as OpenAI); root **`npm run lint`** = `tsc --noEmit` on **engine + web** (`next build` still typechecks/lints web for prod).
- **Tests:** **19** Vitest (`deprecations-table` Anthropic cases).
- **Key files:** `packages/engine/src/readers/deprecations-table.ts`, root `package.json`, `packages/engine/package.json`
- **Gaps:** Google/Mistral structured rows; Tier 3; push commit after REVIEW.

## 2026-11-21 — Coverage + Tier 2 honesty (REVIEW → FIX → SYNC → PUSH `9fee531`)

- **Shipped:** `Finding.checked` / `checkSource` / `uncheckedReason`; report `coverageLine`, `meta.coverage`, `tier2Errors`, `standBehindLine`; Tier 2 windowed text + **one batch LLM per provider page**; OpenAI **`deprecations-table`** markdown parser; `registry/eol.json`, `registry/saas.json`; web report **list** layout (no horizontal scroll); root `.env` via `apps/web/lib/root-dotenv.ts`; CLI coverage column.
- **Honesty FIX:** Tier 1 no longer marks **`api` hostnames** as checked — deprecations stay on **model** rows; footer copy matches coverage math.
- **Proof:** Vitest `fixtures/gpt-image-2` → **2027-02-10** (LIVE Tier 2 done-when demo); `npm test` (now **19** with later table tests).
- **Key files:** `packages/engine/src/coverage.ts`, `resolvers/tier2.ts`, `readers/deprecations-table.ts`, `apps/web/components/report-view.tsx`, `docs/STATUS-FOR-REVIEW.md`
- **Gaps:** Google/Mistral structured parsers; Tier 3 search; hosted credits/`/r/`; README screenshot.

## 2026-11-21 — Web UI (local) + start.bat

- **Shipped:** `apps/web` Next.js landing; `POST /api/scan` downloads public GitHub tarball → full `scan()` (Tier 2 when keys in repo-root `.env`); alarm-red dark UI; client abort/stale guards; registry path via `import.meta.url` + optional `REGISTRY_PATH`.
- **Dev:** `npm run dev` / **`start.bat`** → Next on **:3000** (not the CLI self-scan).
- **Key files:** `apps/web/**`, `start.bat`, `scripts/dev.mjs`, root `package.json` workspaces `apps/*`
- **Gaps:** credits/KV, `/r/owner/repo`, SSE progress, Vercel deploy + `registry` on serverless.

## 2026-11-21 — Engine + CLI, Tier 1 (workspace)

- **Shipped:** npm workspace (`packages/engine`, `sundown-cli`); local scan walk + detectors; Tier 1 resolvers (endoflife.date, npm **exact version**, PyPI yanked, GitHub archived with token); `registry/*.json` seeds; CLI table/`--json`/`--issue`/`--fail-on-days`; Vitest fixtures; `.env.example`.
- **Honesty:** `confidence: unverified` for unchecked items; `registry/packages.json` overrides wired (`note` → `sourceQuote`).
- **Key files:** `packages/engine/src/*`, `packages/cli/src/*`, `package.json`, `registry/models.json`, `registry/sources.json`
- **Gaps:** Tier 2 (gpt-image-2 quote), npm publish, Action, full LIVE “Done when” (hosted credits, README GIF).

## 2026-11-21 — Git remote + initial push

- **Shipped:** Local git with **repo-only** identity `sid-kiwilab` (not global agentic-systems user). `origin` → `sid-kiwilab/project-sundown`. MIT `LICENSE`, monorepo `.gitignore`.
- **Gaps:** *(superseded — see engine + CLI entry above.)*

## 2026-11-21 — Harness V2 + LIVE (greenfield)

- **Shipped (local):** Copied **Harness V2** from [siddharth_venkatesh](https://github.com/sid-kiwilab/siddharth_venkatesh) (`PLAN → Build → REVIEW ⇄ FIX → SYNC → PUSH`). Customized for Sundown monorepo paths, npm package `sundown-cli`, Vercel credits rules, no Convex.
- **Docs:** [LIVE.md](LIVE.md) holds full product spec (detectors, resolver tiers, UI, credits, CLI, build order, done-when). [AGENT-CONVENTIONS.md](AGENT-CONVENTIONS.md), starter [README.md](../README.md).
- **Key files:** `harness/*`, `docs/LIVE.md`, `docs/JOURNAL.md`, `docs/AGENT-CONVENTIONS.md`
- **Gaps:** Monorepo scaffold (`packages/engine`, `packages/cli`, `apps/web`) not started — follow LIVE **Build order** step 1 (engine).