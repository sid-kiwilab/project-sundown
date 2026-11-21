# Session journal

Newest first. Stable ops + product spec: [LIVE.md](LIVE.md).

---

## 2026-11-21 — Git remote + initial push

- **Shipped:** Local git with **repo-only** identity `sid-kiwilab` (not global agentic-systems user). `origin` → `sid-kiwilab/project-sundown`. MIT `LICENSE`, monorepo `.gitignore`.
- **Gaps:** Monorepo code scaffold still pending (LIVE build order step 1).

## 2026-11-21 — Harness V2 + LIVE (greenfield)

- **Shipped (local):** Copied **Harness V2** from [siddharth_venkatesh](https://github.com/sid-kiwilab/siddharth_venkatesh) (`PLAN → Build → REVIEW ⇄ FIX → SYNC → PUSH`). Customized for Sundown monorepo paths, npm package `sundown-cli`, Vercel credits rules, no Convex.
- **Docs:** [LIVE.md](LIVE.md) holds full product spec (detectors, resolver tiers, UI, credits, CLI, build order, done-when). [AGENT-CONVENTIONS.md](AGENT-CONVENTIONS.md), starter [README.md](../README.md).
- **Key files:** `harness/*`, `docs/LIVE.md`, `docs/JOURNAL.md`, `docs/AGENT-CONVENTIONS.md`
- **Gaps:** Monorepo scaffold (`packages/engine`, `packages/cli`, `apps/web`) not started — follow LIVE **Build order** step 1 (engine).