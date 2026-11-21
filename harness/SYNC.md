# SYNC: write it down

**Job:** docs + goal truth. **Not:** ship gate, not toolchain, not a consolation prize for a smaller feature.

Run only after **REVIEW** reported **No findings** (or lows you explicitly accepted). Fresh intent: the **original** user goal, not “we can push later.”

**No** `npm run build` / `npm run lint`. That is **PUSH**.

## 0. Argue the goal first

Is the original one-sentence goal **fully** true in the tree right now?

If you would have to **redefine** success to say yes — **stop**. Do not update docs. Tell the user to drop **FIX.md** (or click Build again) with what’s missing.

## 1. Docs (behavior change only)

| If this changed | Update |
|-----------------|--------|
| Routes, APIs, env, credits, CLI flags | [README.md](../README.md), [docs/LIVE.md](../docs/LIVE.md), [`.env.example`](../.env.example) |
| Agent / product rules | [docs/AGENT-CONVENTIONS.md](../docs/AGENT-CONVENTIONS.md) |
| Shipped feature with gaps worth tracking | [docs/JOURNAL.md](../docs/JOURNAL.md) — prepend dated entry (newest first) |
| Registry seeds / new providers | `registry/*.json` + README contribution blurb if user-facing |

**Rolling overflow:** when JOURNAL or LIVE gets unwieldy, move older sections to `docs/archive/` and leave a pointer at the top of the active file. Never delete history.

Do **not** edit `harness/*` unless the user asked to change the harness.

If nothing user-facing changed, say so — skipping doc edits is fine.

## 2. Report

- Goal check: **pass** or the missing piece
- Each doc you actually touched: one line (or **none**)

**Stop.** Tell Sid to drop **PUSH.md** when he is ready to publish (build + lint + commit + push). Do not run toolchain in this pass. Do not commit or push here.