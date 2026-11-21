# Harness (master file)

This is the **single source of truth** for what the harness is, how to run it, why it looks like this, and what we refused. Phase *how-to* lives in the sibling markdown files; **do not** invent a second playbook.

**Key: separate jobs, fresh intent.** Drag **one** phase file into chat per turn. Never “run the whole harness.” One job in chat = a clean mode, no leftover “I already built it” bias.

---

## What it does

A **static** agent kit for feature work in Cursor. You are the scheduler. The model is not allowed to plan, build, review, patch, and ship in one breath.

```
PLAN → Cursor Build → REVIEW ⇄ FIX → SYNC → PUSH
```

1. **PLAN** — Plan mode + this file. One-sentence goal + testable **Done when**. No code.
2. **Cursor Build** — the IDE **Build** button. That *is* the generator. There is no `IMPLEMENT.md`.
3. **REVIEW** — evaluator. Argue the **diff** is *not* done. Findings that survive a counter go to FIX.
4. **FIX** — patch those rows only. Cannot declare “No findings.”
5. Repeat **3 ⇄ 4** until REVIEW is clean **and** the original goal is still fully true.
6. **SYNC** — goal check + docs if behavior changed. **No** build/lint.
7. **PUSH** — workspace build + lint, then commit, land on **`main`**, and **production** deploy (`vercel --prod` for `apps/web` when applicable; `npm publish` for CLI only when this pass is a release). **Requires SYNC first.** Dropping `PUSH.md` authorizes git + prod that turn.

Optional: `/goal <one-sentence>` after PLAN so Cursor keeps the objective across turns. **Do not** `/loop` this kit. Drag the next file.

---

## How to run it (Sid)

| Step | What you do | Agent job | You do **not** want |
|------|-------------|-----------|---------------------|
| 1 | Plan mode, drop [PLAN.md](./PLAN.md) | Scope + Done when | Code, `npm run build` |
| 2 | Click **Build** in the IDE | Make Done when true | Self-REVIEW, SYNC, PUSH |
| 3 | Drop [REVIEW.md](./REVIEW.md) | Adversarial diff vs goal | Patches; toolchain |
| 4 | Drop [FIX.md](./FIX.md) if findings | Patch surviving rows | New features; “it’s solid” |
| 5 | Drop [SYNC.md](./SYNC.md) when REVIEW is clean | Goal + docs only | Build/lint; commit |
| 6 | Drop [PUSH.md](./PUSH.md) after SYNC | Build + lint + commit + `main` + prod | Skipping SYNC; preview-only push |

**REVIEW ⇄ FIX** is the quality loop. **SYNC** then **PUSH** is the publish path. If REVIEW never said **No findings**, do not drop SYNC. **Never drop PUSH before SYNC.**

**This repo safety:** no `vercel --prod` or `npm publish` outside **PUSH** (dropping [PUSH.md](./PUSH.md) authorizes prod/publish); do not spend hosted Redis credits or production LLM quota in PLAN/Build/REVIEW/FIX/SYNC unless Sid asked **this turn**; agents do not fetch localhost.

**Discover (PLAN):** [docs/AGENT-CONVENTIONS.md](../docs/AGENT-CONVENTIONS.md), [docs/LIVE.md](../docs/LIVE.md), then touched code under `packages/engine`, `packages/cli`, `apps/web`, `registry/` as needed. [README.md](../README.md) if install story or one-liner changes. [docs/JOURNAL.md](../docs/JOURNAL.md) only if recent session notes matter.

No slash commands, no project skills. Dragging a file **is** the invoke. Cursor’s `/review` stays Bugbot/Security — unrelated.

---

## PLAN vs Build (do not confuse these)

| | **PLAN** | **Build** |
|--|----------|-----------|
| Cursor | **Plan** mode | The **Build** button after you accept |
| Drop | `PLAN.md` | Nothing. The plan artifact is the spec. |
| Output | Done when + constraints | The diff |
| Next | You click Build | You drop `REVIEW.md` |

`IMPLEMENT.md` was a third seat that does not exist in this IDE. After Build, the next drop is REVIEW.

Build only sees the plan you accepted — so PLAN must write a **Build constraints** block into that plan (no prod deploy, no inventing deprecation dates, no self-REVIEW, no PUSH toolchain).

---

## File map

| Path | Role |
|------|------|
| [`HARNESS.md`](./HARNESS.md) | **This file** — process, decisions, thinking. For humans. Do not drop it as “do all phases.” |
| [`PLAN.md`](./PLAN.md) | PLAN job (Plan mode) |
| [`REVIEW.md`](./REVIEW.md) | REVIEW job (adversarial rubric) |
| [`FIX.md`](./FIX.md) | FIX job |
| [`SYNC.md`](./SYNC.md) | SYNC job (goal + docs; no npm) |
| [`PUSH.md`](./PUSH.md) | PUSH job (build/lint + `main` + prod deploy) |

If a job changes, edit that phase file. Update this master file only if the **flow or a decision** changed.

---

## Why it exists (failure modes)

Long single-thread agent chats fail in boring ways. We encode counters as **phases**, not as extra models.

| Failure | What it looks like | Counter |
|---------|-------------------|--------|
| **Agentic laziness** | Stops at ~70%, calls it done | PLAN **Done when**; REVIEW tries to **disprove** done; SYNC + PUSH goal checks |
| **Self-preferential bias** | “Looks good” on code it just wrote | REVIEW is evaluator; Build/FIX are generators; FIX cannot ship |
| **Goal drift** | Quietly ships a smaller cousin after compaction | Every phase re-anchors the **one-sentence** user goal |
| **Harness bloat / slow loops** | `npm run build` on every FIX or SYNC | Toolchain **only** on **PUSH** |
| **Mega prompt collapse** | One message: plan+build+review+sync+push | **You** drop the next file |

**We took:** phase isolation, loop-until-done, generator ≠ evaluator, adversarial REVIEW.

**We refused:** JS workflow runtime, slash-command wrappers, `/loop` as a substitute for re-dropping REVIEW, a fake **IMPLEMENT** drop, and `npm run push` wrappers that hide the **PUSH** drop ritual.

---

## Decisions (keep these)

1. **Human is the orchestrator.** Plan mode, then Build, then drag REVIEW / FIX / SYNC / PUSH.

2. **Drag, don’t slash.** Dropping `REVIEW.md` is the quality gate.

3. **No project skills for phases.**

4. **No IMPLEMENT.md.** Cursor Plan mode + **Build** is the generator.

5. **REVIEW argues.** Diff is evidence, not the last assistant’s story.

6. **FIX does not get the last word.** After patches, drop REVIEW again.

7. **SYNC is docs + goal truth.** No build/lint.

8. **PUSH is the only toolchain + git phase.** **PUSH requires SYNC first.**

9. **PUSH authorizes git** (and prod/publish when applicable).

10. **This repo’s product** is Sundown — engine-first, honest expiry reporting. Stack rules live in [docs/LIVE.md](../docs/LIVE.md); do not invent them in harness files.

---

## History

We adopted **Harness V2** from [siddharth_venkatesh](https://github.com/sid-kiwilab/siddharth_venkatesh): SYNC split (docs only), adversarial REVIEW, toolchain only on PUSH.

Slash commands + skills were tried there and reverted. Drag the phase file.

---

## Copy to another repo

Copy the `harness/` folder. Customize PLAN discover links, PUSH toolchain commands, SYNC docs table, prod/publish safety lines.