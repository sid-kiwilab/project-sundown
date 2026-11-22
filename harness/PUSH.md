# PUSH: prove and publish

**Job:** ship to git **and production** (`main` + `vercel --prod` for `apps/web` when applicable; `npm publish` for `packages/cli` only when this pass is a CLI release). **Not:** new features, not doc rewrites, not redefining the goal.

Run only after **SYNC** completed this pass. Dropping this file is Sid’s **authorization to commit and push this turn**.

## 0. Prerequisites (hard stop)

- **REVIEW** said **No findings** (or lows Sid accepted).
- **SYNC** finished: goal check + docs as needed.
- Original one-sentence goal is still **fully** true. If not — stop; drop **FIX.md** or Build again. Do not push a shrunk goal.

## 1. Toolchain

From repo root (adjust when workspace scripts land):

```bash
npm run build
npm run lint
```

If this pass touches **`apps/web`** or Vercel config, also run from `apps/web` (after `vercel link` or `vercel pull` once):

```bash
vercel build
```

`npm run build` does not run Vercel’s post-`next build` packaging step; that is what catches errors like missing `.next/export-detail.json` on monorepos.

If the monorepo uses per-package scripts only, run the workspace build/lint Sid documents in [docs/LIVE.md](../docs/LIVE.md) — same gate: all packages touched by this pass must pass.

Fail → drop **FIX.md** (or Build), fix, re-run **SYNC** if docs needed, then **PUSH** again. Do not commit a broken tree.

## 2. Git safety

- Never commit `.env`, credentials, or API keys (check staged and unstaged).
- No `git push --force` to `main` / `master`.
- Do not update git config.

## 3. Scope and commit

1. `git status` (+ diff stat). Stage only files for **this pass** unless Sid clearly wants the whole working tree.
2. If the tree is wider than one feature — **ask Sid** what belongs in this commit before `git add`.
3. Draft a 1–2 sentence commit message (why, not a file list). Commit with a HEREDOC-style message on Windows/PowerShell as usual.

4. `git commit` → `git push`.

## 4. Production (when applicable)

Dropping **PUSH.md** authorizes **production** ship this pass when Sid intended a deploy or npm release.

1. **`main` must contain this commit** before you stop.
2. **Vercel production** — from `apps/web` or root per LIVE: `npx vercel --prod` after `main` is updated, unless auto-deploy from `main` only (then confirm Production deployment finished).
3. **npm** — only when this pass is an explicit CLI release: publish `sundown-cli` from `packages/cli` with correct version bump.

Do **not** end PUSH with only a preview deployment or a feature-branch push unless Sid asked preview-only.

## 5. Report

- Goal check: **pass**
- Build + lint: **pass** or the error
- Commit: hash + one-line summary
- Git: branch + push result (`main` at this commit)
- Production: Vercel URL / npm version (or **skipped** if not a release pass)

That is the end of the pass.

**Not:** harness edits unless this pass was harness work; drive-by staging of unrelated WIP without Sid’s OK.