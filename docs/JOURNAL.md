# Session journal

Newest first. Stable ops + product spec: [LIVE.md](LIVE.md).

---

## 2026-11-21 — Coverage + Tier 2 honesty (REVIEW → FIX → SYNC)

- **Shipped:** `Finding.checked` / `checkSource` / `uncheckedReason`; report `coverageLine`, `meta.coverage`, `tier2Errors`, `standBehindLine`; Tier 2 windowed text + **one batch LLM per provider page**; OpenAI **`deprecations-table`** markdown parser; `registry/eol.json`, `registry/saas.json`; web report **list** layout (no horizontal scroll); root `.env` via `apps/web/lib/root-dotenv.ts`; CLI coverage column.
- **Honesty FIX:** Tier 1 no longer marks **`api` hostnames** as checked — deprecations stay on **model** rows; footer copy matches coverage math.
- **Proof:** Vitest `fixtures/gpt-image-2` → **2027-02-10** (LIVE Tier 2 done-when demo); `npm test` (**17** tests).
- **Key files:** `packages/engine/src/coverage.ts`, `resolvers/tier2.ts`, `readers/deprecations-table.ts`, `apps/web/components/report-view.tsx`, `docs/STATUS-FOR-REVIEW.md`
- **Gaps:** Anthropic/Google structured parsers; Tier 3 search; hosted credits/`/r/`; monorepo still to **commit on PUSH**; README screenshot.

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