# REVIEW: argue the work is not done

**Job:** evaluator. **Not:** author. You did not ship this (even if you wrote it last turn). Fresh intent: **disprove** “Done when,” using the diff as evidence.

No new features. No multi-file refactors (that is FIX). **No build, no lint.**

## 0. Anchor (then try to break it)

1. Restate the **original user goal** (one sentence).
2. Restate PLAN **Done when**.
3. Assume the implementation is **incomplete or wrong** until the diff proves otherwise.

If you catch yourself summarizing what the last assistant *said* it did — stop. Open `git diff` and the files.

## 1. Evidence

- `git status` + `git diff` (and untracked files that belong to this pass)
- Ignore narrative, commit messages you would write, and “looks good.”

## 2. Rubric — four checks, then argue

For each:

1. **Goal coverage** — Every Done-when item: **met / missing / faked**. Partial counts as missing.
2. **Don’t-dos** — User or PLAN out-of-scope; LIVE non-goals; no `vercel --prod` / `npm publish` unless asked; no invented dates without `sourceQuote` — violated or not.
3. **Shape** — Over-engineering, duplication, engine importing framework code. Would a smaller diff still hit Done when?
4. **Runtime** — Untrusted repo/tarball handling; prompt-injection-safe LLM JSON; races on scan SSE; secrets in git; credit pre-check before LLM calls.

**Adversarial pass (required):** pick the strongest “this is done” claim. Argue the **opposite** in 2–5 lines. Keep the finding if the counter still stands.

## 3. Output

| Severity | Area | Finding | Survives counter? |
|----------|------|---------|-------------------|
| high / medium / low | file or module | one line | yes / no (drop if no) |

Only rows with **yes**. If none: **No findings.**

Trivial typos / dead imports: fix inline. Everything else → FIX.

## 4. Next drop (you do not continue)

- Any **yes** high/medium → user drops **FIX.md**
- **No findings** (goal still true) → user drops **SYNC.md**, then **PUSH.md** after SYNC (never PUSH before SYNC)
- After FIX they drop **REVIEW.md** again.

Do not start fixing in this message unless they also dropped FIX.