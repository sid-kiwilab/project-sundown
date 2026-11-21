# FIX: patch what REVIEW proved

**Job:** generator again, **narrow**. **Not:** re-plan, not ship, not a second product.

Act on REVIEW findings that **survived the counter**. Fresh intent: make those rows false. Do not expand the original feature.

## 1. Order

1. **High**, then **medium**.
2. **Low** only if it is one line.
3. If you **disagree** with a REVIEW row: put it under **Skipped** with a one-line counter — do not silently ignore **high/medium**.

## 2. Rules

- Diff as small as the finding. No “while I’m here” cleanup unless it is dead code you must touch.
- Gut shims and leftover paths; no backwards-compat theater.
- After edits, re-check scan/async surfaces you changed (SSE, credit cutoff, CLI exit codes).
- Still **no** `npm run build` / `npm run lint` (that is **PUSH**). ReadLints on touched files. Owner verifies UI if behavioral — agents do not fetch localhost.
- Stay in **Sundown**. New env vars: placeholders in `.env.example` + [docs/LIVE.md](../docs/LIVE.md) (or leave for SYNC).
- **No invented dates** — if you touch resolver/LLM code, enforce source-quote validation per LIVE.

## 3. Report

- **Fixed** — finding → what changed
- **Skipped** — finding → why
- **Still open** — anything you could not finish

**Stop.** Tell the user to drop **REVIEW.md** again. You do not get to declare **No findings** from the FIX seat. **SYNC** / **PUSH** are forbidden until REVIEW says **No findings**.