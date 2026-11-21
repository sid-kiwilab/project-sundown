# PLAN: scope the work

**Job:** think. **Not:** implement, review, or ship.

Use this in Cursor **Plan** mode. Do not write product code. No `npm run build`, no lint, no prod deploy.

After Sid accepts, he clicks **Build** in the IDE. That *is* implementation. There is no `IMPLEMENT.md`.

## 0. Fresh intent — the goal that later files must not shrink

Restate the user request in **one sentence**. This sentence is the contract. Build / REVIEW / FIX / SYNC / PUSH re-read it; they do not quietly replace it with “what we managed to ship.”

## 1. Discover (minimum, not a tour)

- Always: [docs/AGENT-CONVENTIONS.md](../docs/AGENT-CONVENTIONS.md), [docs/LIVE.md](../docs/LIVE.md)
- Then: files in the area being changed (`packages/engine`, `packages/cli`, `apps/web`, `registry/` as needed)
- Only if install, routes, env, or credits behavior may change: [README.md](../README.md), [`.env.example`](../.env.example)
- [docs/JOURNAL.md](../docs/JOURNAL.md) only if recent session notes matter for this pass

Do not re-litigate already-shipped work. Do not dump the whole repo into context. Stay in **project_sundown** — no sibling-repo architecture.

## 2. Output (short, testable)

| Section | What belongs here |
|---------|-------------------|
| **Scope** | What we are doing and why |
| **Done when** | Observable finish line — CLI output, API contract, detector coverage. Not “feels done.” |
| **Touch points** | Likely paths (guess from discovery, not a fake spec) |
| **Out of scope** | Explicit non-goals this pass (see LIVE non-goals) |
| **Risks** | Prompt injection on fetched pages; inventing dates; tarball size; KV credit burn; secrets in git |
| **Build constraints** | Copy the block in §4 into the plan so **Build** inherits it |

**Open questions:** at most 1–2, and only if you are actually blocked. Prefer a decision + “confirm if wrong.”

## 3. How to plan (do not over-spec)

- High-level: deliverables and constraints, **not** line-by-line implementation.
- **engine** stays framework-free; web only imports engine via workspace package.
- Lean: no legacy shims; simple over clever.
- Classify size: **small** (one package) vs **wide** (engine + CLI + web). Wide work still one plan — Build slices it.

## 4. Carry into Build (write this into the plan, do not code)

Cursor’s **Build** button only sees the plan you just wrote. Put this block in that plan:

- Implement **only** Done when. No drive-by refactors, no extra features.
- **`packages/engine`** must not import Next.js or React.
- **No invented shutdown dates** — LIVE quote rule applies to any LLM extraction code you touch.
- **No** `vercel --prod` or `npm publish` unless Sid asked **this turn**.
- **No** burning hosted KV/LLM credits in dev loops unless Sid asked **this turn**.
- Stay in **Sundown** — follow [docs/LIVE.md](../docs/LIVE.md) for resolver tiers and finding shape.
- Client UI (web): stale-response guards, unmount, no duplicate in-flight scan requests on paths you change.
- **No** `npm run build` / `npm run lint` (that is **PUSH**). Cheap checks only (editor lints; owner verifies UI in browser — agents do not fetch localhost).
- When Done when is met: list files changed, list anything still missing, **stop**. Do not self-REVIEW. Sid drops **REVIEW.md**.

**Stop.** Sid clicks **Build** when he accepts. Then he drops **REVIEW.md**. Do not look for an IMPLEMENT file.